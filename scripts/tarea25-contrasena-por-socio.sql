-- ==============================================================================
-- TAREA-25 · BLOQUE 1: CONTRASEÑA ALEATORIA POR SOCIO
-- Reemplazo de contraseña literal 'MaxGlobal2026!' por generador de 10 caracteres
-- sin caracteres ambiguos (sin O, 0, l, 1, I).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_registrar_afiliacion_socio(
  p_patrocinador_id bigint,
  p_pack_id bigint,
  p_tipo_documento text,
  p_documento text,
  p_nombres text,
  p_apellidos text,
  p_email text,
  p_telefono text,
  p_fecha_nacimiento date,
  p_direccion text,
  p_departamento text,
  p_provincia text,
  p_distrito text,
  p_voucher jsonb,
  p_canal text DEFAULT 'oficina'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint;
  v_patrocinador record;
  v_pack record;
  v_ciclo_id bigint;
  v_socio_id bigint;
  v_codigo_socio text;
  v_orden_id bigint;
  v_codigo_orden text;
  v_user_id uuid;
  v_email_limpio text;
  v_doc_limpio text;

  -- Variables para generación de contraseña aleatoria de 10 caracteres (TAREA-25)
  -- Sin caracteres ambiguos: sin O, 0, l, 1, I
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
  -- 1. Verificar si es admin
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para afiliar nuevos socios.';
  END IF;

  SELECT id INTO v_admin_id
  FROM public.socio
  WHERE email = auth.jwt() ->> 'email'
    AND rol IN ('admin', 'superadmin')
  LIMIT 1;

  v_email_limpio := lower(trim(p_email));
  v_doc_limpio := trim(p_documento);

  -- 2. Validar unicidad (RF-333)
  IF EXISTS (SELECT 1 FROM public.socio WHERE documento = v_doc_limpio) THEN
    RAISE EXCEPTION 'Ya existe un socio registrado con el documento % (RF-333).', v_doc_limpio;
  END IF;

  IF EXISTS (SELECT 1 FROM public.socio WHERE email = v_email_limpio) THEN
    RAISE EXCEPTION 'Ya existe un socio registrado con el correo electrónico % (RF-333).', v_email_limpio;
  END IF;

  -- 3. Obtener y validar patrocinador (RF-331)
  SELECT s.*, p.codigo AS pack_codigo, p.solo_afilia_igual, p.nombre AS pack_nombre
  INTO v_patrocinador
  FROM public.socio s
  JOIN public.pack p ON p.id = s.pack_id
  WHERE s.id = p_patrocinador_id;

  IF v_patrocinador.id IS NULL THEN
    RAISE EXCEPTION 'Patrocinador con ID % no encontrado.', p_patrocinador_id;
  END IF;

  -- 4. Obtener pack a afiliar
  SELECT * INTO v_pack FROM public.pack WHERE id = p_pack_id AND activo = true;
  IF v_pack.id IS NULL THEN
    RAISE EXCEPTION 'Pack con ID % no encontrado o inactivo.', p_pack_id;
  END IF;

  -- RF-332: Restricción del Kit Emprendedor
  IF (v_patrocinador.solo_afilia_igual = true OR v_patrocinador.pack_codigo = 'EMPRENDEDOR') AND v_pack.codigo <> 'EMPRENDEDOR' THEN
    RAISE EXCEPTION 'Restricción RF-332: El patrocinador cuenta con Kit Emprendedor y solo puede afiliar a nuevos socios con Kit Emprendedor.';
  END IF;

  -- 5. Obtener ciclo abierto
  SELECT id INTO v_ciclo_id
  FROM public.ciclo
  WHERE estado = 'abierto'
  ORDER BY id DESC
  LIMIT 1;

  IF v_ciclo_id IS NULL THEN
    v_ciclo_id := 3;
  END IF;

  -- 6. Generar código y nuevo ID de socio (RF-335)
  SELECT COALESCE(MAX(id), 0) + 1 INTO v_socio_id FROM public.socio;
  v_codigo_socio := 'MG' || lpad(v_socio_id::text, 5, '0');

  -- Generación de contraseña aleatoria de 10 caracteres sin caracteres ambiguos (TAREA-25)
  v_pwd_chars := array[
    substr(v_upper, floor(random() * length(v_upper) + 1)::int, 1),
    substr(v_lower, floor(random() * length(v_lower) + 1)::int, 1),
    substr(v_digits, floor(random() * length(v_digits) + 1)::int, 1)
  ];
  FOR v_idx IN 1..7 LOOP
    v_pwd_chars := array_append(v_pwd_chars, substr(v_all, floor(random() * length(v_all) + 1)::int, 1));
  END LOOP;
  -- Fisher-Yates shuffle
  FOR v_idx IN REVERSE 10..2 LOOP
    v_swap := floor(random() * v_idx + 1)::int;
    v_tmp := v_pwd_chars[v_idx];
    v_pwd_chars[v_idx] := v_pwd_chars[v_swap];
    v_pwd_chars[v_swap] := v_tmp;
  END LOOP;
  v_password_temporal := array_to_string(v_pwd_chars, '');

  -- 7. Crear usuario en auth.users y auth.identities con la contraseña generada
  v_user_id := gen_random_uuid();
  
  DELETE FROM auth.identities WHERE identity_data->>'email' = v_email_limpio;
  DELETE FROM auth.users WHERE email = v_email_limpio;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email_limpio,
    extensions.crypt(v_password_temporal, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombres', upper(trim(p_nombres)), 'apellidos', upper(trim(p_apellidos))),
    now(),
    now(),
    false
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id,
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email_limpio),
    'email',
    now(),
    now(),
    now()
  );

  -- 8. Insertar socio en estado 'pendiente' (RF-334)
  INSERT INTO public.socio (
    id, codigo, documento, nombres, apellidos,
    email, password_hash, telefono, fecha_nacimiento, direccion, ciudad,
    pack_id, patrocinador_id, fecha_afiliacion, estado, rol, creado_en, actualizado_en
  ) VALUES (
    v_socio_id, v_codigo_socio, v_doc_limpio, upper(trim(p_nombres)), upper(trim(p_apellidos)),
    v_email_limpio, 'AUTH_MANAGED', p_telefono, p_fecha_nacimiento, p_direccion, p_departamento,
    v_pack.id, v_patrocinador.id, current_date, 'pendiente', 'socio', now(), now()
  );

  -- 9. Generar orden inicial de afiliación en 'por_confirmar'
  v_orden_id := nextval('public.orden_id_seq'::regclass);
  v_codigo_orden := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(v_orden_id::text, 6, '0');

  INSERT INTO public.orden (
    id, codigo, socio_id, ciclo_id, tipo, pack_id,
    subtotal_cent, descuento_cent, total_cent, puntos_total,
    estado, canal, asesor_id, creada_en
  ) VALUES (
    v_orden_id, v_codigo_orden, v_socio_id, v_ciclo_id, 'afiliacion', v_pack.id,
    v_pack.precio_cent, 0, v_pack.precio_cent, COALESCE(v_pack.puntos_rango, 0),
    'por_confirmar', p_canal, v_admin_id, now()
  );

  -- 10. Insertar voucher de la afiliación (RF-315)
  IF p_voucher IS NOT NULL THEN
    INSERT INTO public.voucher (
      orden_id, imagen_url, banco, numero_operacion,
      monto_cent, fecha_deposito, estado, subido_en
    ) VALUES (
      v_orden_id,
      NULLIF(trim(p_voucher->>'imagen_url'), ''),
      p_voucher->>'banco',
      p_voucher->>'numero_operacion',
      COALESCE((p_voucher->>'monto_cent')::bigint, v_pack.precio_cent),
      COALESCE((p_voucher->>'fecha_deposito')::date, current_date),
      'pendiente',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'exito', true,
    'socio_id', v_socio_id,
    'codigo', v_codigo_socio,
    'nombres', upper(trim(p_nombres)) || ' ' || upper(trim(p_apellidos)),
    'email', v_email_limpio,
    'password_temporal', v_password_temporal,
    'pack_nombre', v_pack.nombre,
    'orden_id', v_orden_id,
    'orden_codigo', v_codigo_orden,
    'total_cent', v_pack.precio_cent,
    'puntos_total', COALESCE(v_pack.puntos_rango, 0),
    'estado', 'pendiente'
  );
END;
$function$;
