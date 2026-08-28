TRUNCATE activacion, movimiento_puntos, orden_detalle, voucher, envio, orden, red_ancestro, ciclo RESTART IDENTITY CASCADE;
DELETE FROM socio;
ALTER SEQUENCE socio_id_seq RESTART WITH 1;
INSERT INTO ciclo (id, anio, mes, fecha_inicio, fecha_fin, estado) VALUES
  (1, 2026, 6, '2026-06-01', '2026-06-30', 'abierto'),
  (2, 2026, 7, '2026-07-01', '2026-07-31', 'abierto'),
  (3, 2026, 8, '2026-08-01', '2026-08-31', 'abierto');