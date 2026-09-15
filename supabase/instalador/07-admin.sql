-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 07-ADMIN.SQL
-- Arranque bootstrap del sistema:
-- 1. Primer ciclo abierto (mes actual calculado con date_trunc, no a mano)
-- 2. Socio Administrador en auth.users, auth.identities y public.socio
--    con contraseña aleatoria segura emitida una sola vez vía RAISE NOTICE.
-- Idempotente: Si el ciclo o el admin ya existen, no duplica ni rompe nada.
-- =====================================================================

CREATE TEMP TABLE IF NOT EXISTS _admin_bootstrap_credenciales (
  email text,
  password_temporal text,
  estado text
);

DO $$
DECLARE
  v_anio smallint := EXTRACT(YEAR FROM CURRENT_DATE)::smallint;
  v_mes smallint := EXTRACT(MONTH FROM CURRENT_DATE)::smallint;
  v_fecha_inicio date := date_trunc('month', CURRENT_DATE)::date;
  v_fecha_fin date := (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date;
  v_ciclo_id bigint;

  -- El correo del administrador es OBLIGATORIO. Debe definirse antes mediante:
  -- SET app.admin_email = 'correo_real_del_admin';
  -- NUNCA se asume un valor por defecto.
  v_admin_email text := nullif(trim(current_setting('app.admin_email', true)), '');
  v_admin_user_id uuid;
  v_admin_socio_id bigint := 1;
  v_pack_empresarial_id bigint;

  -- Alfabeto sin caracteres ambiguos (sin O, 0, l, 1, I)
  v_upper text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_lower text := 'abcdefghijkmnopqrstuvwxyz';
  v_digits text := '23456789';
  v_all text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  v_pwd_chars text[];
  v_password_temporal text;
  v_idx int;
  v_swap int;
  v_tmp text;
BEGIN
  -- -------------------------------------------------------------------
  -- 1. PRIMER CICLO (ABIERTO) DEL MES DE INSTALACIÓN
  -- -------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM public.ciclo WHERE anio = v_anio AND mes = v_mes) THEN
    INSERT INTO public.ciclo (anio, mes, fecha_inicio, fecha_fin, estado)
    VALUES (v_anio, v_mes, v_fecha_inicio, v_fecha_fin, 'abierto')
    RETURNING id INTO v_ciclo_id;
  ELSE
    SELECT id INTO v_ciclo_id FROM public.ciclo WHERE anio = v_anio AND mes = v_mes;
  END IF;

  -- -------------------------------------------------------------------
  -- 2. CUENTA DE ADMINISTRADOR (BOOTSTRAP)
  -- -------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM public.socio WHERE rol IN ('admin', 'superadmin')) THEN
    IF v_admin_email IS NULL THEN
      RAISE EXCEPTION '🔴 ERROR FATAL EN 07-ADMIN.SQL: No se proporcionó el correo del administrador. Debe configurarse antes con: SET app.admin_email = ''correo_del_admin''; NUNCA debe usarse un valor por defecto.';
    END IF;
    IF v_admin_email NOT LIKE '%@%.%' THEN
      RAISE EXCEPTION '🔴 ERROR FATAL EN 07-ADMIN.SQL: El correo proporcionado (%) no es válido.', v_admin_email;
    END IF;

    -- Generación de contraseña aleatoria de 12 caracteres (alta entropía)
    v_pwd_chars := array[
      substr(v_upper, floor(random() * length(v_upper) + 1)::int, 1),
      substr(v_lower, floor(random() * length(v_lower) + 1)::int, 1),
      substr(v_digits, floor(random() * length(v_digits) + 1)::int, 1)
    ];
    FOR v_idx IN 1..9 LOOP
      v_pwd_chars := array_append(v_pwd_chars, substr(v_all, floor(random() * length(v_all) + 1)::int, 1));
    END LOOP;

    -- Fisher-Yates shuffle
    FOR v_idx IN REVERSE 12..2 LOOP
      v_swap := floor(random() * v_idx + 1)::int;
      v_tmp := v_pwd_chars[v_idx];
      v_pwd_chars[v_idx] := v_pwd_chars[v_swap];
      v_pwd_chars[v_swap] := v_tmp;
    END LOOP;
    v_password_temporal := array_to_string(v_pwd_chars, '');

    -- Pack Empresarial
    SELECT id INTO v_pack_empresarial_id FROM public.pack WHERE codigo = 'EMPRESARIAL' LIMIT 1;

    -- UUID de usuario en Auth
    v_admin_user_id := gen_random_uuid();

    -- Inserción directa en auth.users
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, phone_change, phone_change_token,
      email_change_token_current, reauthentication_token,
      email_change_confirm_status,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, is_super_admin, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_admin_user_id,
      'authenticated',
      'authenticated',
      v_admin_email,
      extensions.crypt(v_password_temporal, extensions.gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      0,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nombres', 'MAXIMO', 'apellidos', 'ADMIN'),
      now(),
      now(),
      false,
      false,
      false
    );

    -- Inserción directa en auth.identities
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_admin_user_id::text,
      v_admin_user_id,
      jsonb_build_object('sub', v_admin_user_id::text, 'email', v_admin_email),
      'email',
      now(),
      now(),
      now()
    );

    -- Inserción directa en public.socio con rol 'admin'
    INSERT INTO public.socio (
      id, codigo, documento, nombres, apellidos,
      email, password_hash, pack_id, patrocinador_id,
      fecha_afiliacion, estado, rol, password_cambiada,
      creado_en, actualizado_en
    ) VALUES (
      v_admin_socio_id, 'MG00001', '00000000', 'MAXIMO', 'ADMIN',
      v_admin_email, 'AUTH_MANAGED', v_pack_empresarial_id, NULL,
      CURRENT_DATE, 'activo', 'admin', false,
      now(), now()
    );

    PERFORM setval('socio_id_seq', (SELECT GREATEST(MAX(id), 1) FROM public.socio));

    INSERT INTO _admin_bootstrap_credenciales VALUES (v_admin_email, v_password_temporal, 'CREADO');

    RAISE NOTICE '==================================================================';
    RAISE NOTICE '  MAX GLOBAL CORPORATION · ARRANQUE EXITOSO DEL SISTEMA';
    RAISE NOTICE '------------------------------------------------------------------';
    RAISE NOTICE '  Ciclo abierto inicial : Año %, Mes % (ID: %)', v_anio, v_mes, v_ciclo_id;
    RAISE NOTICE '  Usuario Administrador : %', v_admin_email;
    RAISE NOTICE '  Contraseña Temporal   : %', v_password_temporal;
    RAISE NOTICE '------------------------------------------------------------------';
    RAISE NOTICE '  ⚠️  COPIE Y GUARDE ESTA CONTRASEÑA AHORA.';
    RAISE NOTICE '  Por seguridad, no queda almacenada en texto plano y no se repetirá.';
    RAISE NOTICE '==================================================================';
  ELSE
    INSERT INTO _admin_bootstrap_credenciales VALUES (v_admin_email, 'YA_EXISTE', 'OMITIDO_IDEMPOTENTE');
    RAISE NOTICE 'MAX GLOBAL: Ya existe un socio con rol administrador. Arranque omitido (idempotente).';
  END IF;
END $$;

SELECT email, password_temporal, estado FROM _admin_bootstrap_credenciales;
DROP TABLE IF EXISTS _admin_bootstrap_credenciales;
