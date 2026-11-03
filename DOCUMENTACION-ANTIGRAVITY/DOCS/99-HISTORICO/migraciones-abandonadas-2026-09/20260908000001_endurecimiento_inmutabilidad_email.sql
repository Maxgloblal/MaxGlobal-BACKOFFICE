-- TAREA-28 · BLOQUE 1: Proteger columna email en socio contra modificaciones de usuarios no administradores
CREATE OR REPLACE FUNCTION public.fn_proteger_columnas_inmutables_socio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.fn_is_admin() THEN
    IF NEW.patrocinador_id IS DISTINCT FROM OLD.patrocinador_id THEN
      RAISE EXCEPTION 'No está permitido modificar el patrocinador de un socio';
    END IF;
    IF NEW.pack_id IS DISTINCT FROM OLD.pack_id THEN
      RAISE EXCEPTION 'El pack de afiliación solo puede ser modificado por Administración al confirmar la orden';
    END IF;
    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
      RAISE EXCEPTION 'No está permitido modificar el rol del socio';
    END IF;
    IF NEW.codigo IS DISTINCT FROM OLD.codigo THEN
      RAISE EXCEPTION 'No está permitido modificar el código del socio';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'No está permitido modificar el correo electrónico del socio';
    END IF;
  END IF;
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$function$;
