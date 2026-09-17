-- ==============================================================================
-- SISTEMA MAX GLOBAL · GESTIÓN DE SOCIOS (P-27)
-- Función: fn_actualizar_datos_socio_admin
-- Propósito: Actualizar datos personales y bancarios de un socio, permitiendo el
--            cambio de correo electrónico con sincronización atómica en auth.users
--            y auth.identities, preservando inmutables (patrocinador, código, rol, pack).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_actualizar_datos_socio_admin(
  p_socio_id bigint,
  p_nombres text,
  p_apellidos text,
  p_email text DEFAULT NULL,
  p_telefono text DEFAULT NULL,
  p_direccion text DEFAULT NULL,
  p_ciudad text DEFAULT NULL,
  p_banco text DEFAULT NULL,
  p_cuenta_bancaria text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_socio RECORD;
  v_email_anterior text;
  v_nuevo_email text;
  v_user_id uuid;
  v_resultado RECORD;
BEGIN
  -- 1. Verificar privilegios de administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden actualizar datos de socios';
  END IF;

  -- 2. Obtener socio existente
  SELECT * INTO v_socio FROM public.socio WHERE id = p_socio_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Socio con ID % no encontrado', p_socio_id;
  END IF;

  v_email_anterior := lower(trim(v_socio.email));
  
  -- Determinar nuevo email (si es nulo o vacío, conserva el anterior)
  IF p_email IS NOT NULL AND trim(p_email) <> '' THEN
    v_nuevo_email := lower(trim(p_email));
  ELSE
    v_nuevo_email := v_email_anterior;
  END IF;

  -- 3. Validar formato básico de email
  IF v_nuevo_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'El formato del correo electrónico es inválido';
  END IF;

  -- 4. Si el correo cambió, verificar unicidad y sincronizar en Supabase Auth
  IF v_nuevo_email <> v_email_anterior THEN
    -- A. Verificar unicidad en public.socio
    IF EXISTS (
      SELECT 1 FROM public.socio 
      WHERE lower(email) = v_nuevo_email AND id <> p_socio_id
    ) THEN
      RAISE EXCEPTION 'El correo % ya está registrado para otro socio', v_nuevo_email;
    END IF;

    -- B. Buscar ID de usuario en auth.users correspondiente al correo anterior
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE lower(email) = v_email_anterior 
    LIMIT 1;

    -- C. Si el nuevo email ya existe en auth.users asignado a otro usuario distinto, rechazar
    IF EXISTS (
      SELECT 1 FROM auth.users 
      WHERE lower(email) = v_nuevo_email 
        AND (v_user_id IS NULL OR id <> v_user_id)
    ) THEN
      RAISE EXCEPTION 'El correo % ya existe en el sistema de autenticación para otro usuario', v_nuevo_email;
    END IF;

    -- D. Si el usuario existe en auth.users, actualizar email y metadatos
    IF v_user_id IS NOT NULL THEN
      UPDATE auth.users
      SET email = v_nuevo_email,
          raw_user_meta_data = jsonb_set(
            coalesce(raw_user_meta_data, '{}'::jsonb),
            '{email}',
            to_jsonb(v_nuevo_email)
          ),
          updated_at = now()
      WHERE id = v_user_id;

      -- E. Actualizar auth.identities (la columna email es GENERATED ALWAYS a partir de identity_data)
      UPDATE auth.identities
      SET identity_data = jsonb_set(
            identity_data,
            '{email}',
            to_jsonb(v_nuevo_email)
          ),
          updated_at = now()
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  -- 5. Actualizar public.socio (preservando patrocinador_id, codigo, pack_id y rol)
  UPDATE public.socio
  SET nombres = upper(trim(p_nombres)),
      apellidos = upper(trim(p_apellidos)),
      email = v_nuevo_email,
      telefono = trim(p_telefono),
      direccion = trim(p_direccion),
      ciudad = trim(p_ciudad),
      banco = trim(p_banco),
      cuenta_bancaria = trim(p_cuenta_bancaria),
      actualizado_en = now()
  WHERE id = p_socio_id
  RETURNING * INTO v_resultado;

  RETURN to_jsonb(v_resultado);
END;
$$;

COMMENT ON FUNCTION public.fn_actualizar_datos_socio_admin IS 'P-27: Actualiza datos y sincroniza correo en auth.users con verificación de administrador e inmutables';
