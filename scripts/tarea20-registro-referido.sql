-- ==============================================================================
-- TAREA-20: EL REGISTRO PÚBLICO CON REFERIDO
-- 1. Tabla solicitud_afiliacion y políticas RLS estrictas
-- 2. Clave url_landing en config y actualización de fn_actualizar_config_ajustable
-- 3. RPCs fn_convertir_solicitud_afiliacion y fn_descartar_solicitud_afiliacion
-- ==============================================================================

-- 1. Crear tabla solicitud_afiliacion si no existe
CREATE TABLE IF NOT EXISTS public.solicitud_afiliacion (
  id              bigserial PRIMARY KEY,
  nombres         varchar NOT NULL,
  apellidos       varchar NOT NULL,
  documento       varchar,
  telefono        varchar NOT NULL,
  email           varchar NOT NULL,
  departamento    varchar,
  provincia       varchar,
  distrito        varchar,
  direccion       varchar,
  pack_codigo     varchar,
  ref_codigo      varchar,          -- el ?ref= tal como llegó
  patrocinador_id bigint REFERENCES public.socio(id),  -- resuelto al insertar
  estado          varchar NOT NULL DEFAULT 'nueva',
                  -- 'nueva' | 'contactada' | 'convertida' | 'descartada'
  socio_id        bigint REFERENCES public.socio(id),  -- cuando se convierte
  motivo_descarte text,
  origen          varchar DEFAULT 'landing',
  ip              varchar,
  creado_en       timestamptz DEFAULT now(),
  atendida_por    bigint REFERENCES public.socio(id),
  atendida_en     timestamptz
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_estado ON public.solicitud_afiliacion(estado);
CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_email ON public.solicitud_afiliacion(email);
CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_ip_creado ON public.solicitud_afiliacion(ip, creado_en);

-- RLS: Habilitar Row Level Security
ALTER TABLE public.solicitud_afiliacion ENABLE ROW LEVEL SECURITY;

-- Revocar cualquier política previa para idempotencia
DROP POLICY IF EXISTS solicitud_afiliacion_admin_select ON public.solicitud_afiliacion;
DROP POLICY IF EXISTS solicitud_afiliacion_admin_update ON public.solicitud_afiliacion;
DROP POLICY IF EXISTS solicitud_afiliacion_admin_delete ON public.solicitud_afiliacion;
DROP POLICY IF EXISTS solicitud_afiliacion_anon_insert ON public.solicitud_afiliacion;
DROP POLICY IF EXISTS solicitud_afiliacion_auth_insert ON public.solicitud_afiliacion;

-- SELECT: solo admin (fn_is_admin)
CREATE POLICY solicitud_afiliacion_admin_select ON public.solicitud_afiliacion
  FOR SELECT TO authenticated
  USING (public.fn_is_admin());

-- UPDATE: solo admin (fn_is_admin)
CREATE POLICY solicitud_afiliacion_admin_update ON public.solicitud_afiliacion
  FOR UPDATE TO authenticated
  USING (public.fn_is_admin())
  WITH CHECK (public.fn_is_admin());

-- NOTA: NO SE CREAN POLÍTICAS DE INSERT NI DELETE.
-- anon y usuarios autenticados NO pueden insertar directamente desde el cliente.
-- Solo la Edge Function con service_role (que bypasses RLS) puede insertar.
-- Tampoco se permite DELETE a nadie.

-- 2. Clave url_landing en config
INSERT INTO public.config (clave, valor, tipo, descripcion, actualizado_en)
VALUES (
  'url_landing',
  'https://max-global-landing.vercel.app',
  'string',
  'URL base pública de la landing page para enlaces de patrocinio y referidos',
  now()
)
ON CONFLICT (clave) DO NOTHING;

-- 3. Actualizar fn_actualizar_config_ajustable para permitir url_landing
CREATE OR REPLACE FUNCTION public.fn_actualizar_config_ajustable(p_clave text, p_valor text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_admin_id bigint;
    v_valor_anterior text;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden actualizar la configuración.';
    END IF;

    IF p_clave NOT IN (
        'activacion_puntos_mes',
        'monto_minimo_retiro_cent',
        'dia_pago_comisiones',
        'dias_hasta_pago',
        'umbral_detraccion_cent',
        'pct_detraccion',
        'url_landing'
    ) THEN
        RAISE EXCEPTION 'La clave % es una regla dura y no puede modificarse directamente.', p_clave;
    END IF;

    -- Obtener valor anterior antes de actualizar
    SELECT valor INTO v_valor_anterior
    FROM public.config
    WHERE clave = p_clave;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La clave % no existe en config.', p_clave;
    END IF;

    -- Obtener administrador
    SELECT id INTO v_admin_id
    FROM public.socio
    WHERE email = auth.jwt() ->> 'email'
      AND rol IN ('admin', 'superadmin')
    LIMIT 1;

    IF v_admin_id IS NULL THEN
      SELECT id INTO v_admin_id
      FROM public.socio
      WHERE rol IN ('admin', 'superadmin')
      ORDER BY id ASC
      LIMIT 1;
    END IF;

    v_datos_antes := jsonb_build_object(p_clave, v_valor_anterior);

    UPDATE public.config
       SET valor = CASE WHEN p_clave = 'pct_detraccion' AND (p_valor IS NULL OR trim(p_valor) = '' OR p_valor = 'null') THEN NULL ELSE p_valor END,
           actualizado_en = now()
     WHERE clave = p_clave;

    v_datos_despues := jsonb_build_object(p_clave, p_valor);

    INSERT INTO public.auditoria (
      usuario_id,
      accion,
      tabla,
      registro_id,
      datos_antes,
      datos_despues,
      creado_en
    ) VALUES (
      v_admin_id,
      'cambiar_config',
      'config',
      0,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object('exito', true, 'clave', p_clave, 'valor', p_valor);
END;
$function$;

-- 4. RPC fn_convertir_solicitud_afiliacion
CREATE OR REPLACE FUNCTION public.fn_convertir_solicitud_afiliacion(p_solicitud_id bigint, p_socio_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_admin_id bigint;
    v_solicitud record;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden convertir solicitudes.';
    END IF;

    IF p_socio_id IS NULL THEN
        RAISE EXCEPTION 'El socio_id es obligatorio para convertir la solicitud.';
    END IF;

    SELECT id INTO v_admin_id
    FROM public.socio
    WHERE email = auth.jwt() ->> 'email'
      AND rol IN ('admin', 'superadmin')
    LIMIT 1;

    IF v_admin_id IS NULL THEN
      SELECT id INTO v_admin_id
      FROM public.socio
      WHERE rol IN ('admin', 'superadmin')
      ORDER BY id ASC
      LIMIT 1;
    END IF;

    SELECT * INTO v_solicitud
    FROM public.solicitud_afiliacion
    WHERE id = p_solicitud_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de afiliación % no encontrada.', p_solicitud_id;
    END IF;

    IF v_solicitud.estado = 'convertida' THEN
        RAISE EXCEPTION 'La solicitud % ya fue convertida previamente al socio %.', p_solicitud_id, v_solicitud.socio_id;
    END IF;

    v_datos_antes := jsonb_build_object(
      'id', v_solicitud.id,
      'estado', v_solicitud.estado,
      'socio_id', v_solicitud.socio_id
    );

    UPDATE public.solicitud_afiliacion
       SET estado = 'convertida',
           socio_id = p_socio_id,
           atendida_por = v_admin_id,
           atendida_en = now()
     WHERE id = p_solicitud_id;

    v_datos_despues := jsonb_build_object(
      'id', p_solicitud_id,
      'estado', 'convertida',
      'socio_id', p_socio_id
    );

    INSERT INTO public.auditoria (
      usuario_id,
      accion,
      tabla,
      registro_id,
      datos_antes,
      datos_despues,
      creado_en
    ) VALUES (
      v_admin_id,
      'convertir_solicitud',
      'solicitud_afiliacion',
      p_solicitud_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
      'exito', true,
      'solicitud_id', p_solicitud_id,
      'socio_id', p_socio_id,
      'estado', 'convertida'
    );
END;
$function$;

-- 5. RPC fn_descartar_solicitud_afiliacion
CREATE OR REPLACE FUNCTION public.fn_descartar_solicitud_afiliacion(p_solicitud_id bigint, p_motivo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_admin_id bigint;
    v_solicitud record;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden descartar solicitudes.';
    END IF;

    IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN
        RAISE EXCEPTION 'El motivo de descarte es obligatorio para auditar la operación.';
    END IF;

    SELECT id INTO v_admin_id
    FROM public.socio
    WHERE email = auth.jwt() ->> 'email'
      AND rol IN ('admin', 'superadmin')
    LIMIT 1;

    IF v_admin_id IS NULL THEN
      SELECT id INTO v_admin_id
      FROM public.socio
      WHERE rol IN ('admin', 'superadmin')
      ORDER BY id ASC
      LIMIT 1;
    END IF;

    SELECT * INTO v_solicitud
    FROM public.solicitud_afiliacion
    WHERE id = p_solicitud_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de afiliación % no encontrada.', p_solicitud_id;
    END IF;

    IF v_solicitud.estado = 'descartada' THEN
        RAISE EXCEPTION 'La solicitud % ya fue descartada previamente.', p_solicitud_id;
    END IF;

    v_datos_antes := jsonb_build_object(
      'id', v_solicitud.id,
      'estado', v_solicitud.estado,
      'motivo_descarte', v_solicitud.motivo_descarte
    );

    UPDATE public.solicitud_afiliacion
       SET estado = 'descartada',
           motivo_descarte = trim(p_motivo),
           atendida_por = v_admin_id,
           atendida_en = now()
     WHERE id = p_solicitud_id;

    v_datos_despues := jsonb_build_object(
      'id', p_solicitud_id,
      'estado', 'descartada',
      'motivo', trim(p_motivo)
    );

    INSERT INTO public.auditoria (
      usuario_id,
      accion,
      tabla,
      registro_id,
      datos_antes,
      datos_despues,
      creado_en
    ) VALUES (
      v_admin_id,
      'descartar_solicitud',
      'solicitud_afiliacion',
      p_solicitud_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
      'exito', true,
      'solicitud_id', p_solicitud_id,
      'estado', 'descartada',
      'motivo', trim(p_motivo)
    );
END;
$function$;
