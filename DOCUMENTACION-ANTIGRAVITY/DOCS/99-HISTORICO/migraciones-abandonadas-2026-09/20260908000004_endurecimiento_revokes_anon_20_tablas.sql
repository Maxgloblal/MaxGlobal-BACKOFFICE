-- Migración TAREA-28 Bloque 2 (Continuación): Revocar permisos de escritura a anon en las 20 tablas/vistas restantes
-- Se preservan intactos todos los permisos de SELECT (en particular sobre producto para la landing).

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
  public.auditoria,
  public.ciclo,
  public.comision,
  public.config,
  public.envio,
  public.movimiento_puntos,
  public.nivel_comision,
  public.orden_detalle,
  public.pack_comision_especial,
  public.periodo_global,
  public.punto_entrega,
  public.rango,
  public.rango_ciclo,
  public.red_ancestro,
  public.solicitud_retiro,
  public.voucher,
  public.wallet_movimiento
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.v_frontales_activos,
  public.v_puntos_ciclo,
  public.v_wallet_saldo
FROM anon;
