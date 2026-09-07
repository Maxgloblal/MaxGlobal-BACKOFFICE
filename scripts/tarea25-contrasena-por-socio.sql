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

-- ==============================================================================
-- TAREA-25 · BLOQUE 3: COLUMNA password_cambiada Y RPC DE ACTUALIZACIÓN
-- ==============================================================================

ALTER TABLE public.socio
  ADD COLUMN IF NOT EXISTS password_cambiada boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.fn_marcar_password_cambiada()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.socio
  SET password_cambiada = true,
      actualizado_en = now()
  WHERE email = auth.jwt() ->> 'email';
END;
$$;

-- ==============================================================================
-- TAREA-25 · BLOQUE 4: ELIMINACIÓN DE PLACEHOLDER EN RECOMPRA (null es null)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_registrar_pedido_recompra(
  p_socio_id bigint,
  p_items jsonb,
  p_voucher jsonb,
  p_envio jsonb DEFAULT NULL::jsonb,
  p_canal text DEFAULT 'oficina'::text,
  p_tipo_venta text DEFAULT 'socio'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint;
  v_socio record;
  v_pack record;
  v_ciclo_id bigint;
  v_orden_id bigint;
  v_codigo_orden text;
  v_descuento_pct numeric;
  v_subtotal_cent bigint := 0;
  v_total_cent bigint := 0;
  v_descuento_cent bigint := 0;
  v_puntos_total integer := 0;
  v_item record;
  v_prod record;
  v_item_subtotal bigint;
  v_item_precio_final bigint;
  v_item_puntos integer;
  v_detalles jsonb := '[]'::jsonb;
  v_tipo_venta text;
BEGIN
  -- 1. Verificar si es admin
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para registrar pedidos de recompra.';
  END IF;

  SELECT id INTO v_admin_id
  FROM public.socio
  WHERE email = auth.jwt() ->> 'email'
    AND rol IN ('admin', 'superadmin')
  LIMIT 1;

  -- 2. Obtener socio y su pack
  SELECT s.*, p.descuento_recompra_pct, p.nombre AS pack_nombre
  INTO v_socio
  FROM public.socio s
  JOIN public.pack p ON p.id = s.pack_id
  WHERE s.id = p_socio_id;

  IF v_socio.id IS NULL THEN
    RAISE EXCEPTION 'Socio no encontrado.';
  END IF;

  v_tipo_venta := LOWER(COALESCE(p_tipo_venta, 'socio'));
  IF v_tipo_venta NOT IN ('socio', 'cliente') THEN
    v_tipo_venta := 'socio';
  END IF;

  -- TAREA-16: Si es venta a cliente final, el descuento es estrictamente 0%
  IF v_tipo_venta = 'cliente' THEN
    v_descuento_pct := 0;
  ELSE
    v_descuento_pct := v_socio.descuento_recompra_pct;
  END IF;

  -- 3. Obtener ciclo abierto
  SELECT id INTO v_ciclo_id
  FROM public.ciclo
  WHERE estado = 'abierto'
  ORDER BY id DESC
  LIMIT 1;

  IF v_ciclo_id IS NULL THEN
    v_ciclo_id := 3;
  END IF;

  -- 4. Validar y calcular cada item de orden_detalle
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (producto_id bigint, cantidad integer) LOOP
    IF v_item.cantidad <= 0 THEN
      RAISE EXCEPTION 'La cantidad de cada producto debe ser mayor a 0.';
    END IF;

    SELECT * INTO v_prod FROM public.producto WHERE id = v_item.producto_id AND activo = true;
    IF v_prod.id IS NULL THEN
      RAISE EXCEPTION 'Producto con ID % no encontrado o inactivo.', v_item.producto_id;
    END IF;

    -- RF-313: precio_lista_cent (precio público), precio_final_cent = round(lista * (1 - pct/100))
    v_item_subtotal := v_prod.precio_lista_cent * v_item.cantidad;
    v_item_precio_final := round(v_prod.precio_lista_cent * (1.0 - (v_descuento_pct / 100.0)))::bigint;
    v_item_puntos := v_prod.puntos * v_item.cantidad;

    v_subtotal_cent := v_subtotal_cent + v_item_subtotal;
    v_total_cent := v_total_cent + (v_item_precio_final * v_item.cantidad);
    v_puntos_total := v_puntos_total + v_item_puntos;

    v_detalles := v_detalles || jsonb_build_object(
      'producto_id', v_prod.id,
      'cantidad', v_item.cantidad,
      'precio_lista_cent', v_prod.precio_lista_cent,
      'descuento_pct', v_descuento_pct,
      'precio_final_cent', v_item_precio_final,
      'puntos_unitario', v_prod.puntos,
      'puntos_subtotal', v_item_puntos
    );
  END LOOP;

  -- RF-313: descuento_cent = subtotal_cent - total_cent (una resta)
  v_descuento_cent := v_subtotal_cent - v_total_cent;

  -- 5. Generar código de orden único
  v_orden_id := nextval('public.orden_id_seq'::regclass);
  v_codigo_orden := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(v_orden_id::text, 6, '0');

  -- 6. Insertar orden en estado 'por_confirmar' con tipo_venta (RF-319, RF-320 y TAREA-16)
  INSERT INTO public.orden (
    id, codigo, socio_id, ciclo_id, tipo, tipo_venta, pack_id,
    subtotal_cent, descuento_cent, total_cent, puntos_total,
    estado, canal, asesor_id, creada_en
  ) VALUES (
    v_orden_id, v_codigo_orden, v_socio.id, v_ciclo_id, 'recompra', v_tipo_venta, v_socio.pack_id,
    v_subtotal_cent, v_descuento_cent, v_total_cent, v_puntos_total,
    'por_confirmar', p_canal, v_admin_id, now()
  );

  -- 7. Insertar orden_detalle
  INSERT INTO public.orden_detalle (
    orden_id, producto_id, cantidad, precio_lista_cent,
    descuento_pct, precio_final_cent, puntos_unitario, puntos_subtotal
  )
  SELECT
    v_orden_id,
    (d->>'producto_id')::bigint,
    (d->>'cantidad')::integer,
    (d->>'precio_lista_cent')::bigint,
    (d->>'descuento_pct')::numeric,
    (d->>'precio_final_cent')::bigint,
    (d->>'puntos_unitario')::integer,
    (d->>'puntos_subtotal')::integer
  FROM jsonb_array_elements(v_detalles) AS d;

  -- 8. Insertar comprobante / voucher (RF-315) - NULL si no hay imagen
  IF p_voucher IS NOT NULL THEN
    INSERT INTO public.voucher (
      orden_id, imagen_url, banco, numero_operacion,
      monto_cent, fecha_deposito, estado, subido_en
    ) VALUES (
      v_orden_id,
      NULLIF(trim(p_voucher->>'imagen_url'), ''),
      p_voucher->>'banco',
      p_voucher->>'numero_operacion',
      (p_voucher->>'monto_cent')::bigint,
      COALESCE((p_voucher->>'fecha_deposito')::date, current_date),
      'pendiente',
      now()
    );
  END IF;

  -- 9. Insertar envío si aplica (RF-316, RF-317: costo_cent va aparte y no genera puntos)
  IF p_envio IS NOT NULL AND (p_envio->>'direccion') IS NOT NULL AND length(trim(p_envio->>'direccion')) > 0 THEN
    INSERT INTO public.envio (
      orden_id, destinatario, telefono, departamento, provincia, distrito,
      direccion, referencia, agencia, costo_cent, estado, creado_en
    ) VALUES (
      v_orden_id,
      COALESCE(p_envio->>'destinatario', v_socio.nombres || ' ' || v_socio.apellidos),
      p_envio->>'telefono',
      p_envio->>'departamento',
      p_envio->>'provincia',
      p_envio->>'distrito',
      p_envio->>'direccion',
      p_envio->>'referencia',
      p_envio->>'agencia',
      COALESCE((p_envio->>'costo_cent')::bigint, 0),
      'pendiente',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'exito', true,
    'orden_id', v_orden_id,
    'codigo', v_codigo_orden,
    'tipo_venta', v_tipo_venta,
    'subtotal_cent', v_subtotal_cent,
    'descuento_cent', v_descuento_cent,
    'total_cent', v_total_cent,
    'puntos_total', v_puntos_total
  );
END;
$function$;


