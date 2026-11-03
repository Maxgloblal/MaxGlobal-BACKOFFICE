-- =====================================================================
-- MAX GLOBAL CORPORATION — ESQUEMA INICIAL DE BASE DE DATOS
-- PostgreSQL 14+ (compatible con Supabase)
-- =====================================================================

-- 1. CONFIGURACIÓN GLOBAL
CREATE TABLE config (
    clave           VARCHAR(60) PRIMARY KEY,
    valor           TEXT NOT NULL,
    tipo            VARCHAR(10) NOT NULL DEFAULT 'texto',
    descripcion     TEXT,
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_por BIGINT
);

INSERT INTO config (clave, valor, tipo, descripcion) VALUES
('valor_punto_soles',        '4.167',  'decimal',  'Razón precio/punto. Se usa para reportes de volumen, NO para comisiones'),
('activacion_puntos_mes',    '70',     'entero',   'Puntos personales mínimos para activarse en el mes'),
('residual_base',            'puntos', 'texto',    'CONFIRMADO: la base del residual son los puntos valorados a S/1 c/u'),
('valor_punto_comision',     '1.00',   'decimal',  'S/. por punto para calcular comisión residual'),
('compresion_activa',        'false',  'booleano', 'CONFIRMADO: no hay compresión. Nivel bloqueado no se paga'),
('upgrade_efecto',           'inmediato','texto',  'CONFIRMADO: el cambio de pack activa beneficios al instante'),
('puntos_reset_mensual',     'true',   'booleano', 'CONFIRMADO: los puntos vuelven a cero al cerrar el ciclo'),
('rango_bono_recurrente',    'true',   'booleano', 'CONFIRMADO: el bono de rango se paga cada mes que califique'),
('rango_bono_apilable',      'false',  'booleano', 'CONFIRMADO: si un lider llego a Diamante solo se comisiona de ese rango'),
('linea_estirada_pct',       '50',     'entero',   'Máx % del puntaje de rango que aporta la línea más fuerte'),
('dia_cierre_ciclo',         '31',     'entero',   'Día de cierre de ciclo'),
('dia_pago_comisiones',      '5',      'entero',   'Día de pago de comisiones'),
('retiro_minimo_cent',       '10000',  'entero',   'Monto mínimo de retiro en céntimos (S/. 100.00)'),
('redondeo_decimales',       '2',      'entero',   '2 decimales, redondeo estándar, residuo queda en la empresa'),
('baja_automatica_meses',    '0',      'entero',   '0 = nunca da de baja automática. Queda inactivo indefinidamente'),
('bono_global_pct',          '1',      'entero',   'Bono semestral: 1% de puntos acumulados'),
('bono_global_meses',        '6',      'entero',   'Periodicidad del bono global'),
('asesor_puede_confirmar_pago','false','booleano','Separación de funciones: quien toma el pedido no aprueba el dinero'),
('envio_genera_puntos',      'false',  'booleano', 'REGLA DURA: el flete nunca suma puntos'),
('puntos_se_acreditan_en',   'pago',   'texto',    'CONFIRMADO: al confirmar el pago, no al entregar'),
('puntos_prorratean_con_descuento', 'false', 'booleano', 'REGLA DURA: los puntos son fijos por producto. El precio pagado NO los modifica.'),
('rango_baja_no_cobra',                 'true',    'booleano', 'REGLA DURA: si el socio BAJA de rango respecto al mes anterior NO cobra bono de rango. Debe mantener o ascender.'),
('puntos_grupales_incluyen_personales', 'false',   'booleano', 'REGLA DURA: los puntos grupales del rango son SOLO de la red. Los personales solo sirven para la activación.'),
('pack_hereda_puntos_producto',         'false',   'booleano', 'REGLA DURA: los puntos de los productos DESAPARECEN dentro de un pack. El pack aporta su puntos_rango y nada más.'),
('precio_guardado_es',                  'publico', 'texto',    'Los precios de producto se guardan al PÚBLICO. El precio del socio se calcula con descuento_recompra_pct.'),
('bono_global_conversion',              '1.00',    'decimal',  'S/. por punto en el Bono Global'),
('bono_global_reparto',                 'proporcional', 'texto', 'Proporcional al puntaje de cada calificado'),
('bono_global_meses_activo',            '6',       'entero',   'Debe estar activo los 6 meses del corte, no solo el del reparto'),
('dia_cierre_mes',                      'ultimo',  'texto',    'El cierre es el último día del mes'),
('dias_hasta_pago',                     '3',       'entero',   'Las comisiones se pagan 3 días después del cierre'),
('monto_minimo_retiro_cent',            '10000',   'entero',   'S/. 100.00 mínimo para solicitar retiro'),
('umbral_detraccion_cent',              '70000',   'entero',   'Comisiones mayores a S/. 700 llevan detracción'),
('upgrade_paga_pack_completo',          'true',    'booleano', 'El upgrade compra el pack completo, no la diferencia'),
('baja_socio_sube_equipo',              'true',    'booleano', 'Al dar de baja, la descendencia se engancha al patrocinador'),
('permite_cuentas_duplicadas',          'false',   'booleano', 'Una sola cuenta por persona'),
('cliente_sin_referido_es_empresa',     'true',    'booleano', 'Cliente sin referido = cliente directo de la empresa, sin comisión');


-- 2. CATÁLOGO — PRODUCTOS Y PACKS
CREATE TABLE producto (
    id                  BIGSERIAL PRIMARY KEY,
    codigo              VARCHAR(30) UNIQUE NOT NULL,
    nombre              VARCHAR(120) NOT NULL,
    descripcion         TEXT,
    imagen_url          TEXT,
    precio_lista_cent   BIGINT NOT NULL CHECK (precio_lista_cent > 0),
    puntos              INTEGER NOT NULL CHECK (puntos >= 0),
    descuento_pct       NUMERIC(5,2),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    orden               INTEGER NOT NULL DEFAULT 0,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO producto (codigo, nombre, precio_lista_cent, puntos, orden) VALUES
('CAFE',      'Café',               15000, 18, 1),
('COLAGENO',  'Colágeno',           15000, 18, 2),
('AC-MORINGA','Aceite de Moringa',  12000, 14, 3),
('ESPLENDOR', 'Esplendor',          12000, 14, 4),
('AC-OREGANO','Aceite de Orégano',   6000,  8, 5),
('CAP-MORINGA','Cápsulas de Moringa',6000,  8, 6),
('HAR-MORINGA','Harina de Moringa',  5000,  6, 7),
('DALBA',     'Perfume Dalba',       7000, 10, 8);


CREATE TABLE pack (
    id                    BIGSERIAL PRIMARY KEY,
    codigo                VARCHAR(30) UNIQUE NOT NULL,
    nombre                VARCHAR(80) NOT NULL,
    precio_cent           BIGINT NOT NULL CHECK (precio_cent > 0),
    puntos_rango          INTEGER NOT NULL DEFAULT 0,
    cant_productos        INTEGER,
    niveles_residual      SMALLINT NOT NULL DEFAULT 0 CHECK (niveles_residual BETWEEN 0 AND 10),
    niveles_patrocinio    SMALLINT NOT NULL DEFAULT 0 CHECK (niveles_patrocinio BETWEEN 0 AND 7),
    descuento_recompra_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    descuento_en_pack_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
    cubre_activacion      BOOLEAN NOT NULL DEFAULT FALSE,
    aplica_bono_global    BOOLEAN NOT NULL DEFAULT FALSE,
    solo_afilia_igual     BOOLEAN NOT NULL DEFAULT FALSE,
    activo                BOOLEAN NOT NULL DEFAULT TRUE,
    orden                 INTEGER NOT NULL DEFAULT 0
);

INSERT INTO pack (codigo, nombre, precio_cent, puntos_rango, cant_productos,
                  niveles_residual, niveles_patrocinio,
                  descuento_recompra_pct, descuento_en_pack_pct,
                  cubre_activacion, aplica_bono_global, solo_afilia_igual, orden) VALUES
('EMPRENDEDOR', 'Kit Emprendedor',   12000,   0,    1,  0, 0, 40.00,  0.00, TRUE,  FALSE, TRUE,  1),
('EJECUTIVO',   'Pack Ejecutivo',    36000,  70,    4,  5, 3, 50.00, 40.00, TRUE,  FALSE, FALSE, 2),
('GOLD',        'Pack Gold',        120000, 150,   13, 10, 7, 50.00, 40.00, TRUE,  TRUE,  FALSE, 3),
('FAMILIAR',    'Pack Familiar',    400000, 400, NULL, 10, 7, 50.00, 50.00, TRUE,  TRUE,  FALSE, 4),
('EMPRESARIAL', 'Pack Empresarial', 800000, 800, NULL, 10, 7, 50.00, 55.00, TRUE,  TRUE,  FALSE, 5);


CREATE TABLE nivel_comision (
    tipo        VARCHAR(20) NOT NULL,
    nivel       SMALLINT NOT NULL,
    porcentaje  NUMERIC(6,3) NOT NULL,
    PRIMARY KEY (tipo, nivel)
);

-- Bono Patrocinio: 7 niveles suman 30.8%
INSERT INTO nivel_comision (tipo, nivel, porcentaje) VALUES
('patrocinio', 1, 20.000), ('patrocinio', 2,  4.000), ('patrocinio', 3, 3.000),
('patrocinio', 4,  2.000), ('patrocinio', 5,  1.000), ('patrocinio', 6, 0.500),
('patrocinio', 7,  0.300);

-- Bono Residual: 10 niveles sobre los puntos (1 punto = S/. 1.00)
INSERT INTO nivel_comision (tipo, nivel, porcentaje) VALUES
('residual',  1, 40.000), ('residual',  2, 20.000), ('residual', 3, 10.000),
('residual',  4,  5.000), ('residual',  5,  3.000), ('residual', 6,  2.000),
('residual',  7,  1.000), ('residual',  8, 10.000), ('residual', 9,  5.000),
('residual', 10,  1.000);


CREATE TABLE pack_comision_especial (
    pack_codigo  VARCHAR(20)  NOT NULL REFERENCES pack(codigo),
    nivel        SMALLINT     NOT NULL,
    porcentaje   NUMERIC(6,3) NOT NULL,
    PRIMARY KEY (pack_codigo, nivel)
);

INSERT INTO pack_comision_especial (pack_codigo, nivel, porcentaje) VALUES
('EMPRENDEDOR', 1, 41.700);


-- 3. RANGOS
CREATE TABLE rango (
    id                BIGSERIAL PRIMARY KEY,
    orden             SMALLINT UNIQUE NOT NULL,
    codigo            VARCHAR(30) UNIQUE NOT NULL,
    nombre            VARCHAR(60) NOT NULL,
    puntos_grupales   BIGINT,
    frontales_activos SMALLINT,
    bono_cent         BIGINT,
    definido          BOOLEAN NOT NULL DEFAULT FALSE,
    activo            BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO rango (orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido) VALUES
( 1,'JADE',      'Jade',                    500, 1,   5000, TRUE),
( 2,'BRONCE',    'Bronce',                 1000, 2,  10000, TRUE),
( 3,'PLATA',     'Plata',                  2000, 2,  20000, TRUE),
( 4,'ORO',       'Oro',                    4000, 3,  50000, TRUE),
( 5,'PLATINO',   'Platino',                8000, 4, 150000, TRUE),
( 6,'ESMERALDA', 'Esmeralda',             15000, 5, 300000, TRUE),
( 7,'ZAFIRO',    'Zafiro',                30000, 6, 500000, TRUE),
( 8,'DIAMANTE',  'Diamante',              60000, 7,1000000, TRUE),
( 9,'DIAM-NEGRO','Diamante Negro',         NULL, NULL, NULL, FALSE),
(10,'DOBLE-DIAM','Doble Diamante',         NULL, NULL, NULL, FALSE),
(11,'TRIPLE-DIAM','Triple Diamante',       NULL, NULL, NULL, FALSE),
(12,'CLUB-MILL', 'Club de Millonarios',    NULL, NULL, NULL, FALSE),
(13,'IMPERIAL',  'Imperial',               NULL, NULL, NULL, FALSE),
(14,'TITAN',     'Titán',                  NULL, NULL, NULL, FALSE),
(15,'EMB-ROYAL', 'Embajador Royal',        NULL, NULL, NULL, FALSE),
(16,'EMB-CORONA','Embajador Corona',       NULL, NULL, NULL, FALSE);


-- 4. SOCIOS Y ESTRUCTURA DE RED
CREATE TABLE socio (
    id                  BIGSERIAL PRIMARY KEY,
    codigo              VARCHAR(20) UNIQUE NOT NULL,
    email               VARCHAR(160) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    nombres             VARCHAR(120) NOT NULL,
    apellidos           VARCHAR(120) NOT NULL,
    documento           VARCHAR(20),
    telefono            VARCHAR(30),
    direccion           TEXT,
    ciudad              VARCHAR(80),
    patrocinador_id     BIGINT REFERENCES socio(id) ON DELETE RESTRICT,
    pack_id             BIGINT REFERENCES pack(id),
    fecha_afiliacion    DATE,
    fecha_nacimiento    DATE,
    rango_honorifico_id BIGINT REFERENCES rango(id),
    estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    rol                 VARCHAR(20) NOT NULL DEFAULT 'socio',
    banco               VARCHAR(60),
    cuenta_bancaria     VARCHAR(40),
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_auto_patrocinio CHECK (id <> patrocinador_id)
);

CREATE INDEX idx_socio_patrocinador ON socio(patrocinador_id);
CREATE INDEX idx_socio_codigo       ON socio(codigo);
CREATE INDEX idx_socio_estado       ON socio(estado);


CREATE TABLE red_ancestro (
    descendiente_id BIGINT NOT NULL REFERENCES socio(id) ON DELETE CASCADE,
    ancestro_id     BIGINT NOT NULL REFERENCES socio(id) ON DELETE CASCADE,
    nivel           SMALLINT NOT NULL CHECK (nivel BETWEEN 1 AND 50),
    PRIMARY KEY (descendiente_id, ancestro_id)
);

CREATE INDEX idx_red_ancestro_nivel ON red_ancestro(ancestro_id, nivel);
CREATE INDEX idx_red_desc_nivel     ON red_ancestro(descendiente_id, nivel);


CREATE OR REPLACE FUNCTION fn_construir_red_ancestro()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patrocinador_id IS NULL THEN RETURN NEW; END IF;

    INSERT INTO red_ancestro (descendiente_id, ancestro_id, nivel)
    VALUES (NEW.id, NEW.patrocinador_id, 1);

    INSERT INTO red_ancestro (descendiente_id, ancestro_id, nivel)
    SELECT NEW.id, ra.ancestro_id, (ra.nivel + 1)::smallint
      FROM red_ancestro ra
     WHERE ra.descendiente_id = NEW.patrocinador_id
       AND ra.nivel + 1 <= 50;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_red_ancestro
AFTER INSERT ON socio
FOR EACH ROW EXECUTE FUNCTION fn_construir_red_ancestro();


-- 5. CICLOS MENSUALES
CREATE TABLE ciclo (
    id            BIGSERIAL PRIMARY KEY,
    anio          SMALLINT NOT NULL,
    mes           SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    fecha_inicio  DATE NOT NULL,
    fecha_fin     DATE NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'abierto',
    cerrado_en    TIMESTAMPTZ,
    cerrado_por   BIGINT REFERENCES socio(id),
    UNIQUE (anio, mes)
);

CREATE INDEX idx_ciclo_estado ON ciclo(estado);


-- 6. ÓRDENES, VOUCHERS Y PUNTOS
CREATE TABLE orden (
    id              BIGSERIAL PRIMARY KEY,
    codigo          VARCHAR(20) UNIQUE NOT NULL,
    socio_id        BIGINT NOT NULL REFERENCES socio(id),
    ciclo_id        BIGINT NOT NULL REFERENCES ciclo(id),
    tipo            VARCHAR(20) NOT NULL,
    pack_id         BIGINT REFERENCES pack(id),
    subtotal_cent   BIGINT NOT NULL DEFAULT 0,
    descuento_cent  BIGINT NOT NULL DEFAULT 0,
    total_cent      BIGINT NOT NULL DEFAULT 0,
    puntos_total    INTEGER NOT NULL DEFAULT 0,
    estado          VARCHAR(20) NOT NULL DEFAULT 'por_confirmar',
    asesor_id       BIGINT REFERENCES socio(id),
    canal           VARCHAR(20) NOT NULL DEFAULT 'asesor',
    punto_entrega_id BIGINT,
    aprobada_en     TIMESTAMPTZ,
    aprobada_por    BIGINT REFERENCES socio(id),
    creada_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orden_socio  ON orden(socio_id);
CREATE INDEX idx_orden_ciclo  ON orden(ciclo_id, estado);
CREATE INDEX idx_orden_estado ON orden(estado);


CREATE TABLE orden_detalle (
    id                BIGSERIAL PRIMARY KEY,
    orden_id          BIGINT NOT NULL REFERENCES orden(id) ON DELETE CASCADE,
    producto_id       BIGINT NOT NULL REFERENCES producto(id),
    cantidad          INTEGER NOT NULL CHECK (cantidad > 0),
    precio_lista_cent BIGINT NOT NULL,
    descuento_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
    precio_final_cent BIGINT NOT NULL,
    puntos_unitario   INTEGER NOT NULL,
    puntos_subtotal   INTEGER NOT NULL
);

CREATE INDEX idx_detalle_orden ON orden_detalle(orden_id);


CREATE TABLE voucher (
    id              BIGSERIAL PRIMARY KEY,
    orden_id        BIGINT NOT NULL REFERENCES orden(id),
    imagen_url      TEXT NOT NULL,
    banco           VARCHAR(60),
    numero_operacion VARCHAR(60),
    monto_cent      BIGINT NOT NULL,
    fecha_deposito  DATE,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    motivo_rechazo  TEXT,
    revisado_por    BIGINT REFERENCES socio(id),
    revisado_en     TIMESTAMPTZ,
    subido_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voucher_estado ON voucher(estado, subido_en);


CREATE TABLE movimiento_puntos (
    id          BIGSERIAL PRIMARY KEY,
    socio_id    BIGINT NOT NULL REFERENCES socio(id),
    ciclo_id    BIGINT NOT NULL REFERENCES ciclo(id),
    orden_id    BIGINT REFERENCES orden(id),
    origen      VARCHAR(20) NOT NULL,
    puntos      INTEGER NOT NULL,
    cuenta_activacion BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_residual   BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_rango      BOOLEAN NOT NULL DEFAULT TRUE,
    nota        TEXT,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mov_socio_ciclo ON movimiento_puntos(socio_id, ciclo_id);
CREATE INDEX idx_mov_ciclo       ON movimiento_puntos(ciclo_id);


-- 7. ENTREGA Y ENVÍOS
CREATE TABLE punto_entrega (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    tipo        VARCHAR(20) NOT NULL,
    ciudad      VARCHAR(80),
    direccion   TEXT,
    telefono    VARCHAR(30),
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO punto_entrega (nombre, tipo) VALUES ('Envio a domicilio', 'courier');


CREATE TABLE envio (
    id              BIGSERIAL PRIMARY KEY,
    orden_id        BIGINT NOT NULL REFERENCES orden(id),
    destinatario    VARCHAR(160) NOT NULL,
    telefono        VARCHAR(30),
    departamento    VARCHAR(80),
    provincia       VARCHAR(80),
    distrito        VARCHAR(80),
    direccion       TEXT NOT NULL,
    referencia      TEXT,
    agencia         VARCHAR(60),
    costo_cent      BIGINT NOT NULL DEFAULT 0,
    numero_guia     VARCHAR(60),
    estado          VARCHAR(20) NOT NULL DEFAULT 'preparando',
    fecha_despacho  TIMESTAMPTZ,
    fecha_entrega   TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_envio_orden  ON envio(orden_id);
CREATE INDEX idx_envio_estado ON envio(estado);


-- 8. ACTIVACIÓN MENSUAL
CREATE TABLE activacion (
    socio_id          BIGINT NOT NULL REFERENCES socio(id),
    ciclo_id          BIGINT NOT NULL REFERENCES ciclo(id),
    puntos_personales INTEGER NOT NULL DEFAULT 0,
    activo            BOOLEAN NOT NULL DEFAULT FALSE,
    calculado_en      TIMESTAMPTZ,
    PRIMARY KEY (socio_id, ciclo_id)
);

CREATE INDEX idx_activacion_ciclo ON activacion(ciclo_id, activo);


-- 9. COMISIONES — append only
CREATE TABLE comision (
    id              BIGSERIAL PRIMARY KEY,
    ciclo_id        BIGINT NOT NULL REFERENCES ciclo(id),
    beneficiario_id BIGINT NOT NULL REFERENCES socio(id),
    generador_id    BIGINT REFERENCES socio(id),
    orden_id        BIGINT REFERENCES orden(id),
    tipo            VARCHAR(20) NOT NULL,
    nivel           SMALLINT,
    base_cent       BIGINT NOT NULL,
    base_puntos     INTEGER,
    porcentaje      NUMERIC(6,3),
    monto_cent      BIGINT NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'calculada',
    detalle         JSONB,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comision_benef_ciclo ON comision(beneficiario_id, ciclo_id);
CREATE INDEX idx_comision_ciclo_tipo  ON comision(ciclo_id, tipo);
CREATE INDEX idx_comision_orden       ON comision(orden_id);


-- 10. CALIFICACIÓN DE RANGO POR CICLO
CREATE TABLE rango_ciclo (
    socio_id            BIGINT NOT NULL REFERENCES socio(id),
    ciclo_id            BIGINT NOT NULL REFERENCES ciclo(id),
    rango_id            BIGINT REFERENCES rango(id),
    puntos_personales   INTEGER NOT NULL DEFAULT 0,
    puntos_grupales     BIGINT  NOT NULL DEFAULT 0,
    puntos_linea_mayor  BIGINT  NOT NULL DEFAULT 0,
    puntos_computables  BIGINT  NOT NULL DEFAULT 0,
    frontales_activos   SMALLINT NOT NULL DEFAULT 0,
    califica            BOOLEAN NOT NULL DEFAULT FALSE,
    bono_cent           BIGINT NOT NULL DEFAULT 0,
    calculado_en        TIMESTAMPTZ,
    PRIMARY KEY (socio_id, ciclo_id)
);

CREATE INDEX idx_rango_ciclo ON rango_ciclo(ciclo_id, rango_id);


-- 11. BILLETERA Y RETIROS
CREATE TABLE wallet_movimiento (
    id                BIGSERIAL PRIMARY KEY,
    socio_id          BIGINT NOT NULL REFERENCES socio(id),
    ciclo_id          BIGINT REFERENCES ciclo(id),
    comision_id       BIGINT REFERENCES comision(id),
    tipo              VARCHAR(20) NOT NULL,
    concepto          VARCHAR(160) NOT NULL,
    monto_cent        BIGINT NOT NULL,
    saldo_despues_cent BIGINT NOT NULL,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_socio ON wallet_movimiento(socio_id, creado_en DESC);


CREATE TABLE solicitud_retiro (
    id            BIGSERIAL PRIMARY KEY,
    socio_id      BIGINT NOT NULL REFERENCES socio(id),
    monto_cent    BIGINT NOT NULL CHECK (monto_cent > 0),
    banco         VARCHAR(60),
    cuenta        VARCHAR(40),
    estado        VARCHAR(20) NOT NULL DEFAULT 'solicitado',
    motivo_rechazo TEXT,
    procesado_por BIGINT REFERENCES socio(id),
    procesado_en  TIMESTAMPTZ,
    solicitado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 12. BONO GLOBAL SEMESTRAL
CREATE TABLE periodo_global (
    id             BIGSERIAL PRIMARY KEY,
    anio           SMALLINT NOT NULL,
    semestre       SMALLINT NOT NULL CHECK (semestre IN (1,2)),
    puntos_totales BIGINT NOT NULL DEFAULT 0,
    pool_cent      BIGINT NOT NULL DEFAULT 0,
    calificados    INTEGER NOT NULL DEFAULT 0,
    estado         VARCHAR(20) NOT NULL DEFAULT 'abierto',
    cerrado_en     TIMESTAMPTZ,
    UNIQUE (anio, semestre)
);


-- 13. AUDITORÍA
CREATE TABLE auditoria (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT REFERENCES socio(id),
    accion      VARCHAR(60) NOT NULL,
    tabla       VARCHAR(60),
    registro_id BIGINT,
    datos_antes JSONB,
    datos_despues JSONB,
    ip          VARCHAR(45),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_fecha ON auditoria(creado_en DESC);


-- 14. PROTECCIÓN DE CICLO CERRADO
CREATE OR REPLACE FUNCTION fn_bloquear_ciclo_cerrado()
RETURNS TRIGGER AS $$
DECLARE v_estado VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado FROM ciclo WHERE id = NEW.ciclo_id;
    IF v_estado IN ('cerrado','pagado') THEN
        RAISE EXCEPTION 'El ciclo % está cerrado. No admite nuevos registros.', NEW.ciclo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloq_mov_puntos
BEFORE INSERT ON movimiento_puntos
FOR EACH ROW EXECUTE FUNCTION fn_bloquear_ciclo_cerrado();

CREATE TRIGGER trg_bloq_orden
BEFORE INSERT ON orden
FOR EACH ROW EXECUTE FUNCTION fn_bloquear_ciclo_cerrado();


-- 15. VISTAS DE APOYO
CREATE VIEW v_puntos_ciclo AS
SELECT
    mp.socio_id,
    mp.ciclo_id,
    SUM(mp.puntos) FILTER (WHERE mp.cuenta_activacion) AS puntos_activacion,
    SUM(mp.puntos) FILTER (WHERE mp.cuenta_residual)   AS puntos_residual,
    SUM(mp.puntos) FILTER (WHERE mp.cuenta_rango)      AS puntos_rango
FROM movimiento_puntos mp
GROUP BY mp.socio_id, mp.ciclo_id;


CREATE VIEW v_wallet_saldo AS
SELECT socio_id, COALESCE(SUM(monto_cent), 0)::BIGINT AS saldo_cent
FROM wallet_movimiento
GROUP BY socio_id;


CREATE VIEW v_frontales_activos AS
SELECT
    ra.ancestro_id AS socio_id,
    a.ciclo_id,
    COUNT(*) FILTER (WHERE a.activo) AS frontales_activos
FROM red_ancestro ra
JOIN activacion a ON a.socio_id = ra.descendiente_id
WHERE ra.nivel = 1
GROUP BY ra.ancestro_id, a.ciclo_id;


-- 16. INMUTABILIDAD EN LIBROS MAYORES
REVOKE UPDATE, DELETE ON comision FROM authenticated, anon;
REVOKE UPDATE, DELETE ON wallet_movimiento FROM authenticated, anon;
REVOKE UPDATE, DELETE ON auditoria FROM authenticated, anon;
