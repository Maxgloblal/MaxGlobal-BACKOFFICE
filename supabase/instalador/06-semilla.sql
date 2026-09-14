-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 06-SEMILLA.SQL
-- Datos maestros del sistema (config, packs, rangos, comisiones, productos)
-- Idempotente: ON CONFLICT DO NOTHING
-- Cero fotos con ID demo: las imágenes de producto arrancan en NULL
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CONFIGURACIÓN DEL SISTEMA (39 CLAVES OFICIALES)
-- ---------------------------------------------------------------------
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('valor_punto_soles', '4.167', 'decimal', 'Razón precio/punto. Se usa para reportes de volumen, NO para comisiones')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('residual_base', 'puntos', 'texto', 'CONFIRMADO: la base del residual son los puntos valorados a S/1 c/u')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('valor_punto_comision', '1.00', 'decimal', 'S/. por punto para calcular comisión residual')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('compresion_activa', 'false', 'booleano', 'CONFIRMADO: no hay compresión. Nivel bloqueado no se paga')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('upgrade_efecto', 'inmediato', 'texto', 'CONFIRMADO: el cambio de pack activa beneficios al instante')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('puntos_reset_mensual', 'true', 'booleano', 'CONFIRMADO: los puntos vuelven a cero al cerrar el ciclo')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('rango_bono_recurrente', 'true', 'booleano', 'CONFIRMADO: el bono de rango se paga cada mes que califique')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('rango_bono_apilable', 'false', 'booleano', 'CONFIRMADO: si un lider llego a Diamante solo se comisiona de ese rango')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('linea_estirada_pct', '50', 'entero', 'Máx % del puntaje de rango que aporta la línea más fuerte')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('dia_cierre_ciclo', '31', 'entero', 'Día de cierre de ciclo')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('dia_pago_comisiones', '5', 'entero', 'Día de pago de comisiones')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('retiro_minimo_cent', '10000', 'entero', 'Monto mínimo de retiro en céntimos (S/. 100.00)')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('redondeo_decimales', '2', 'entero', '2 decimales, redondeo estándar, residuo queda en la empresa')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('baja_automatica_meses', '0', 'entero', '0 = nunca da de baja automática. Queda inactivo indefinidamente')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('bono_global_pct', '1', 'entero', 'Bono semestral: 1% de puntos acumulados')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('bono_global_meses', '6', 'entero', 'Periodicidad del bono global')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('asesor_puede_confirmar_pago', 'false', 'booleano', 'Separación de funciones: quien toma el pedido no aprueba el dinero')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('envio_genera_puntos', 'false', 'booleano', 'REGLA DURA: el flete nunca suma puntos')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('puntos_se_acreditan_en', 'pago', 'texto', 'CONFIRMADO: al confirmar el pago, no al entregar')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('puntos_prorratean_con_descuento', 'false', 'booleano', 'REGLA DURA: los puntos son fijos por producto. El precio pagado NO los modifica.')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('rango_baja_no_cobra', 'true', 'booleano', 'REGLA DURA: si el socio BAJA de rango respecto al mes anterior NO cobra bono de rango. Debe mantener o ascender.')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('puntos_grupales_incluyen_personales', 'false', 'booleano', 'REGLA DURA: los puntos grupales del rango son SOLO de la red. Los personales solo sirven para la activación.')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('pack_hereda_puntos_producto', 'false', 'booleano', 'REGLA DURA: los puntos de los productos DESAPARECEN dentro de un pack. El pack aporta su puntos_rango y nada más.')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('precio_guardado_es', 'publico', 'texto', 'Los precios de producto se guardan al PÚBLICO. El precio del socio se calcula con descuento_recompra_pct.')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('bono_global_conversion', '1.00', 'decimal', 'S/. por punto en el Bono Global')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('bono_global_reparto', 'proporcional', 'texto', 'Proporcional al puntaje de cada calificado')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('bono_global_meses_activo', '6', 'entero', 'Debe estar activo los 6 meses del corte, no solo el del reparto')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('dia_cierre_mes', 'ultimo', 'texto', 'El cierre es el último día del mes')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('monto_minimo_retiro_cent', '10000', 'entero', 'S/. 100.00 mínimo para solicitar retiro')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('umbral_detraccion_cent', '70000', 'entero', 'Comisiones mayores a S/. 700 llevan detracción')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('upgrade_paga_pack_completo', 'true', 'booleano', 'El upgrade compra el pack completo, no la diferencia')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('baja_socio_sube_equipo', 'true', 'booleano', 'Al dar de baja, la descendencia se engancha al patrocinador')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('permite_cuentas_duplicadas', 'false', 'booleano', 'Una sola cuenta por persona')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('cliente_sin_referido_es_empresa', 'true', 'booleano', 'Cliente sin referido = cliente directo de la empresa, sin comisión')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('activacion_puntos_mes', '70', 'entero', 'Puntos personales mínimos para activarse en el mes')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('codigos_banco_cci', '{"BCP":["002"],"BBVA":["011"],"Interbank":["003"],"Scotiabank":["009"],"Banco de la Nación":["018"]}', 'json', 'Prefijos de 3 dígitos del CCI según entidad bancaria peruana')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('url_landing', 'https://max-global-landing.vercel.app', 'string', 'URL base pública de la landing page para enlaces de patrocinio y referidos')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('dias_hasta_pago', '3', 'entero', 'Las comisiones se pagan 3 días después del cierre')
ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES ('pct_detraccion', NULL, 'decimal', 'Porcentaje de detracción para comisiones mayores al umbral (definir con contador)')
ON CONFLICT (clave) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. PAQUETES DE AFILIACIÓN (5 PACKS)
-- ---------------------------------------------------------------------
INSERT INTO public.pack (
  id, codigo, nombre, precio_cent, puntos_rango, cant_productos,
  niveles_residual, niveles_patrocinio, descuento_recompra_pct,
  descuento_en_pack_pct, cubre_activacion, aplica_bono_global,
  solo_afilia_igual, activo, orden
) VALUES (
  1, 'EMPRENDEDOR', 'Kit Emprendedor', 12000, 0, 1,
  0, 0, 40,
  0, true, false,
  true, true, 1
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.pack (
  id, codigo, nombre, precio_cent, puntos_rango, cant_productos,
  niveles_residual, niveles_patrocinio, descuento_recompra_pct,
  descuento_en_pack_pct, cubre_activacion, aplica_bono_global,
  solo_afilia_igual, activo, orden
) VALUES (
  2, 'EJECUTIVO', 'Pack Ejecutivo', 36000, 70, 4,
  5, 3, 50,
  40, true, false,
  false, true, 2
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.pack (
  id, codigo, nombre, precio_cent, puntos_rango, cant_productos,
  niveles_residual, niveles_patrocinio, descuento_recompra_pct,
  descuento_en_pack_pct, cubre_activacion, aplica_bono_global,
  solo_afilia_igual, activo, orden
) VALUES (
  3, 'GOLD', 'Pack Gold', 120000, 150, 13,
  10, 7, 50,
  40, true, true,
  false, true, 3
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.pack (
  id, codigo, nombre, precio_cent, puntos_rango, cant_productos,
  niveles_residual, niveles_patrocinio, descuento_recompra_pct,
  descuento_en_pack_pct, cubre_activacion, aplica_bono_global,
  solo_afilia_igual, activo, orden
) VALUES (
  4, 'FAMILIAR', 'Pack Familiar', 400000, 400, NULL,
  10, 7, 50,
  50, true, true,
  false, true, 4
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.pack (
  id, codigo, nombre, precio_cent, puntos_rango, cant_productos,
  niveles_residual, niveles_patrocinio, descuento_recompra_pct,
  descuento_en_pack_pct, cubre_activacion, aplica_bono_global,
  solo_afilia_igual, activo, orden
) VALUES (
  5, 'EMPRESARIAL', 'Pack Empresarial', 800000, 800, NULL,
  10, 7, 50,
  55, true, true,
  false, true, 5
)
ON CONFLICT (codigo) DO NOTHING;
SELECT setval('pack_id_seq', (SELECT GREATEST(MAX(id), 1) FROM public.pack));

-- ---------------------------------------------------------------------
-- 3. RANGOS DE CARRERA (16 RANGOS)
-- ---------------------------------------------------------------------
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  1, 1, 'JADE', 'Jade',
  500,
  1,
  5000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  2, 2, 'BRONCE', 'Bronce',
  1000,
  2,
  10000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  3, 3, 'PLATA', 'Plata',
  2000,
  2,
  20000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  4, 4, 'ORO', 'Oro',
  4000,
  3,
  50000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  5, 5, 'PLATINO', 'Platino',
  8000,
  4,
  150000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  6, 6, 'ESMERALDA', 'Esmeralda',
  15000,
  5,
  300000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  7, 7, 'ZAFIRO', 'Zafiro',
  30000,
  6,
  500000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  8, 8, 'DIAMANTE', 'Diamante',
  60000,
  7,
  1000000,
  true, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  10, 10, 'DOBLE-DIAM', 'Doble Diamante',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  11, 11, 'TRIPLE-DIAM', 'Triple Diamante',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  12, 12, 'CLUB-MILL', 'Club de Millonarios',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  13, 13, 'IMPERIAL', 'Imperial',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  14, 14, 'TITAN', 'Titán',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  15, 15, 'EMB-ROYAL', 'Embajador Royal',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  16, 16, 'EMB-CORONA', 'Embajador Corona',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.rango (
  id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo
) VALUES (
  9, 9, 'DIAM-NEGRO', 'Diamante Negro',
  NULL,
  NULL,
  NULL,
  false, true
)
ON CONFLICT (codigo) DO NOTHING;
SELECT setval('rango_id_seq', (SELECT GREATEST(MAX(id), 1) FROM public.rango));

-- ---------------------------------------------------------------------
-- 4. TABLA DE COMISIONES POR NIVEL (17 REGLAS)
-- ---------------------------------------------------------------------
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('patrocinio', 1, 20)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('patrocinio', 2, 4)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('patrocinio', 3, 3)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('patrocinio', 4, 2)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('patrocinio', 5, 1)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('patrocinio', 6, 0.5)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('patrocinio', 7, 0.3)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 1, 40)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 2, 20)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 3, 10)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 4, 5)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 5, 3)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 6, 2)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 7, 1)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 8, 10)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 9, 5)
ON CONFLICT (tipo, nivel) DO NOTHING;
INSERT INTO public.nivel_comision (tipo, nivel, porcentaje)
VALUES ('residual', 10, 1)
ON CONFLICT (tipo, nivel) DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. COMISIONES ESPECIALES POR PACK
-- ---------------------------------------------------------------------
INSERT INTO public.pack_comision_especial (pack_codigo, nivel, porcentaje)
VALUES ('EMPRENDEDOR', 1, 41.7)
ON CONFLICT (pack_codigo, nivel) DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. PUNTOS DE ENTREGA Y ENVÍO
-- ---------------------------------------------------------------------
INSERT INTO public.punto_entrega (id, nombre, tipo, ciudad, direccion, telefono, activo)
VALUES (1, 'Envio a domicilio', 'courier', NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('punto_entrega_id_seq', (SELECT GREATEST(MAX(id), 1) FROM public.punto_entrega));

-- ---------------------------------------------------------------------
-- 7. CATÁLOGO DE PRODUCTOS (8 PRODUCTOS OFICIALES)
-- NOTA: imagen_url se inicializa en NULL para que subir-fotos.mjs
-- cargue las imágenes al bucket del proyecto nuevo. Cero IDs demo.
-- ---------------------------------------------------------------------
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  2, 'COLAGENO', 'Colágeno Aeterna', 'colageno-hidrolizado', 'Salud y Nutrición', 'Pote 150 g', 'Colágeno hidrolizado en polvo con extracto de arándano, extracto de uva, acerola y vitaminas del complejo B. Sabor frutos rojos.',
  NULL, 15000, 18, 0,
  true, 2
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  3, 'AC-MORINGA', 'Aceite de Moringa', 'aceite-moringa', 'Cuidado Personal', 'Frasco gotero 50 ml', 'Aceite de moringa 100% natural, de uso tópico. Nutre, regenera y rejuvenece.',
  NULL, 12000, 14, 0,
  true, 3
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  4, 'ESPLENDOR', 'Esplendor — Lágrimas Humectantes', 'esplendor', 'Cuidado Personal', 'Frasco gotero 15 ml', 'Gotas humectantes homeopáticas para los ojos, de la marca LAL. Se aplica una gota tres veces al día.',
  NULL, 12000, 14, 0,
  true, 4
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  5, 'AC-OREGANO', 'Aceite de Orégano', 'aceite-oregano', 'Salud y Nutrición', 'Frasco gotero 10 ml', 'Aceite esencial de orégano 100% esencial.',
  NULL, 6000, 8, 0,
  true, 5
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  6, 'CAP-MORINGA', 'Cápsulas de Moringa', 'capsulas-moringa', 'Salud y Nutrición', 'Frasco 100 cápsulas', 'Harina de hojas de moringa seleccionadas en cápsulas, sin amargor. 100% natural.',
  NULL, 6000, 8, 0,
  true, 6
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  7, 'HAR-MORINGA', 'Moringa en Polvo', 'harina-moringa', 'Salud y Nutrición', 'Bolsa 200 g', 'Hojas de moringa molidas, para agregar a comidas y batidos.',
  NULL, 5000, 6, 0,
  true, 7
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  1, 'CAFE', 'Coffee Capuccino', 'cafe-moringa', 'Salud y Nutrición', 'Caja 20 sobres de 18 g', 'Café capuccino instantáneo con moringa y ganoderma. Para reemplazar tu café de la mañana.',
  NULL, 15000, 18, 0,
  true, 1
)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.producto (
  id, codigo, nombre, slug, categoria, presentacion, descripcion,
  imagen_url, precio_lista_cent, puntos, descuento_pct, activo, orden
) VALUES (
  8, 'DALBA', 'Perfume Dalba', 'perfume-dalba', 'Perfumería', 'Frasco 50 ml', 'Perfume de la línea Dalba.',
  NULL, 7000, 10, 0,
  true, 8
)
ON CONFLICT (codigo) DO NOTHING;
SELECT setval('producto_id_seq', (SELECT GREATEST(MAX(id), 1) FROM public.producto));
