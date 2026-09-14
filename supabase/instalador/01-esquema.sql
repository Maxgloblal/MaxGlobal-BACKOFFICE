-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 01-ESQUEMA.SQL
-- Esquema canónico oficial: 23 tablas y 3 vistas
-- Verificado 100% contra scripts/schema-columnas.json
-- Idempotente: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CONFIGURACIÓN GLOBAL
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.config (
    clave           VARCHAR(60) PRIMARY KEY,
    valor           TEXT,
    tipo            VARCHAR(10) NOT NULL DEFAULT 'texto',
    descripcion     TEXT,
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_por BIGINT
);

-- ---------------------------------------------------------------------
-- 2. CATÁLOGO — PRODUCTOS (con slug, categoria y presentacion)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.producto (
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
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    slug                VARCHAR(120) UNIQUE,
    categoria           VARCHAR(80),
    presentacion        VARCHAR(120)
);

CREATE INDEX IF NOT EXISTS idx_producto_slug ON public.producto(slug);
CREATE INDEX IF NOT EXISTS idx_producto_activo ON public.producto(activo, orden);

-- ---------------------------------------------------------------------
-- 3. PAQUETES DE AFILIACIÓN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pack (
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

-- ---------------------------------------------------------------------
-- 4. ESCALAS DE COMISIÓN POR NIVEL
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nivel_comision (
    tipo        VARCHAR(20) NOT NULL,
    nivel       SMALLINT NOT NULL,
    porcentaje  NUMERIC(6,3) NOT NULL,
    PRIMARY KEY (tipo, nivel)
);

CREATE TABLE IF NOT EXISTS public.pack_comision_especial (
    pack_codigo  VARCHAR(20)  NOT NULL REFERENCES public.pack(codigo),
    nivel        SMALLINT     NOT NULL,
    porcentaje   NUMERIC(6,3) NOT NULL,
    PRIMARY KEY (pack_codigo, nivel)
);

-- ---------------------------------------------------------------------
-- 5. RANGOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rango (
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

-- ---------------------------------------------------------------------
-- 6. SOCIOS Y ESTRUCTURA DE RED (con cci y password_cambiada)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.socio (
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
    patrocinador_id     BIGINT REFERENCES public.socio(id) ON DELETE RESTRICT,
    pack_id             BIGINT REFERENCES public.pack(id),
    fecha_afiliacion    DATE,
    fecha_nacimiento    DATE,
    rango_honorifico_id BIGINT REFERENCES public.rango(id),
    estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    rol                 VARCHAR(20) NOT NULL DEFAULT 'socio',
    banco               VARCHAR(60),
    cuenta_bancaria     VARCHAR(40),
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cci                 VARCHAR(20),
    password_cambiada   BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_no_auto_patrocinio CHECK (id <> patrocinador_id)
);

CREATE INDEX IF NOT EXISTS idx_socio_patrocinador ON public.socio(patrocinador_id);
CREATE INDEX IF NOT EXISTS idx_socio_codigo       ON public.socio(codigo);
CREATE INDEX IF NOT EXISTS idx_socio_estado       ON public.socio(estado);
CREATE INDEX IF NOT EXISTS idx_socio_email        ON public.socio(email);

CREATE TABLE IF NOT EXISTS public.red_ancestro (
    descendiente_id BIGINT NOT NULL REFERENCES public.socio(id) ON DELETE CASCADE,
    ancestro_id     BIGINT NOT NULL REFERENCES public.socio(id) ON DELETE CASCADE,
    nivel           SMALLINT NOT NULL CHECK (nivel BETWEEN 1 AND 50),
    PRIMARY KEY (descendiente_id, ancestro_id)
);

CREATE INDEX IF NOT EXISTS idx_red_ancestro_nivel ON public.red_ancestro(ancestro_id, nivel);
CREATE INDEX IF NOT EXISTS idx_red_desc_nivel     ON public.red_ancestro(descendiente_id, nivel);

-- ---------------------------------------------------------------------
-- 7. CICLOS MENSUALES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ciclo (
    id            BIGSERIAL PRIMARY KEY,
    anio          SMALLINT NOT NULL,
    mes           SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    fecha_inicio  DATE NOT NULL,
    fecha_fin     DATE NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'abierto',
    cerrado_en    TIMESTAMPTZ,
    cerrado_por   BIGINT REFERENCES public.socio(id),
    UNIQUE (anio, mes)
);

CREATE INDEX IF NOT EXISTS idx_ciclo_estado ON public.ciclo(estado);

-- ---------------------------------------------------------------------
-- 8. ÓRDENES, DETALLES, VOUCHERS Y PUNTOS (con tipo_venta)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.punto_entrega (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    tipo        VARCHAR(20) NOT NULL,
    ciudad      VARCHAR(80),
    direccion   TEXT,
    telefono    VARCHAR(30),
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.orden (
    id              BIGSERIAL PRIMARY KEY,
    codigo          VARCHAR(20) UNIQUE NOT NULL,
    socio_id        BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id        BIGINT NOT NULL REFERENCES public.ciclo(id),
    tipo            VARCHAR(20) NOT NULL,
    pack_id         BIGINT REFERENCES public.pack(id),
    subtotal_cent   BIGINT NOT NULL DEFAULT 0,
    descuento_cent  BIGINT NOT NULL DEFAULT 0,
    total_cent      BIGINT NOT NULL DEFAULT 0,
    puntos_total    INTEGER NOT NULL DEFAULT 0,
    estado          VARCHAR(20) NOT NULL DEFAULT 'por_confirmar',
    asesor_id       BIGINT REFERENCES public.socio(id),
    canal           VARCHAR(20) NOT NULL DEFAULT 'asesor',
    punto_entrega_id BIGINT REFERENCES public.punto_entrega(id),
    aprobada_en     TIMESTAMPTZ,
    aprobada_por    BIGINT REFERENCES public.socio(id),
    creada_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo_venta      VARCHAR(20) NOT NULL DEFAULT 'socio'
);

CREATE INDEX IF NOT EXISTS idx_orden_socio  ON public.orden(socio_id);
CREATE INDEX IF NOT EXISTS idx_orden_ciclo  ON public.orden(ciclo_id, estado);
CREATE INDEX IF NOT EXISTS idx_orden_estado ON public.orden(estado);

CREATE TABLE IF NOT EXISTS public.orden_detalle (
    id                BIGSERIAL PRIMARY KEY,
    orden_id          BIGINT NOT NULL REFERENCES public.orden(id) ON DELETE CASCADE,
    producto_id       BIGINT NOT NULL REFERENCES public.producto(id),
    cantidad          INTEGER NOT NULL CHECK (cantidad > 0),
    precio_lista_cent BIGINT NOT NULL,
    descuento_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
    precio_final_cent BIGINT NOT NULL,
    puntos_unitario   INTEGER NOT NULL,
    puntos_subtotal   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_detalle_orden ON public.orden_detalle(orden_id);

CREATE TABLE IF NOT EXISTS public.voucher (
    id               BIGSERIAL PRIMARY KEY,
    orden_id         BIGINT NOT NULL REFERENCES public.orden(id),
    imagen_url       TEXT,
    banco            VARCHAR(60),
    numero_operacion VARCHAR(60),
    monto_cent       BIGINT NOT NULL,
    fecha_deposito   DATE,
    estado           VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    motivo_rechazo   TEXT,
    revisado_por     BIGINT REFERENCES public.socio(id),
    revisado_en      TIMESTAMPTZ,
    subido_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_estado ON public.voucher(estado, subido_en);

CREATE TABLE IF NOT EXISTS public.movimiento_puntos (
    id          BIGSERIAL PRIMARY KEY,
    socio_id    BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id    BIGINT NOT NULL REFERENCES public.ciclo(id),
    orden_id    BIGINT REFERENCES public.orden(id),
    origen      VARCHAR(20) NOT NULL,
    puntos      INTEGER NOT NULL,
    cuenta_activacion BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_residual   BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_rango      BOOLEAN NOT NULL DEFAULT TRUE,
    nota        TEXT,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_socio_ciclo ON public.movimiento_puntos(socio_id, ciclo_id);
CREATE INDEX IF NOT EXISTS idx_mov_ciclo       ON public.movimiento_puntos(ciclo_id);

-- ---------------------------------------------------------------------
-- 9. ENVÍOS Y DESPACHO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.envio (
    id              BIGSERIAL PRIMARY KEY,
    orden_id        BIGINT NOT NULL REFERENCES public.orden(id),
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

CREATE INDEX IF NOT EXISTS idx_envio_orden  ON public.envio(orden_id);
CREATE INDEX IF NOT EXISTS idx_envio_estado ON public.envio(estado);

-- ---------------------------------------------------------------------
-- 10. ACTIVACIÓN MENSUAL
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activacion (
    socio_id          BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id          BIGINT NOT NULL REFERENCES public.ciclo(id),
    puntos_personales INTEGER NOT NULL DEFAULT 0,
    activo            BOOLEAN NOT NULL DEFAULT FALSE,
    calculado_en      TIMESTAMPTZ,
    PRIMARY KEY (socio_id, ciclo_id)
);

CREATE INDEX IF NOT EXISTS idx_activacion_ciclo ON public.activacion(ciclo_id, activo);

-- ---------------------------------------------------------------------
-- 11. COMISIONES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comision (
    id              BIGSERIAL PRIMARY KEY,
    ciclo_id        BIGINT NOT NULL REFERENCES public.ciclo(id),
    beneficiario_id BIGINT NOT NULL REFERENCES public.socio(id),
    generador_id    BIGINT REFERENCES public.socio(id),
    orden_id        BIGINT REFERENCES public.orden(id),
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

CREATE INDEX IF NOT EXISTS idx_comision_benef_ciclo ON public.comision(beneficiario_id, ciclo_id);
CREATE INDEX IF NOT EXISTS idx_comision_ciclo_tipo  ON public.comision(ciclo_id, tipo);
CREATE INDEX IF NOT EXISTS idx_comision_orden       ON public.comision(orden_id);

-- ---------------------------------------------------------------------
-- 12. CALIFICACIÓN DE RANGO POR CICLO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rango_ciclo (
    socio_id            BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id            BIGINT NOT NULL REFERENCES public.ciclo(id),
    rango_id            BIGINT REFERENCES public.rango(id),
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

CREATE INDEX IF NOT EXISTS idx_rango_ciclo ON public.rango_ciclo(ciclo_id, rango_id);

-- ---------------------------------------------------------------------
-- 13. BILLETERA Y RETIROS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_movimiento (
    id                 BIGSERIAL PRIMARY KEY,
    socio_id           BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id           BIGINT REFERENCES public.ciclo(id),
    comision_id        BIGINT REFERENCES public.comision(id),
    tipo               VARCHAR(20) NOT NULL,
    concepto           VARCHAR(160) NOT NULL,
    monto_cent         BIGINT NOT NULL,
    saldo_despues_cent BIGINT NOT NULL,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_socio ON public.wallet_movimiento(socio_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS public.solicitud_retiro (
    id            BIGSERIAL PRIMARY KEY,
    socio_id      BIGINT NOT NULL REFERENCES public.socio(id),
    monto_cent    BIGINT NOT NULL CHECK (monto_cent > 0),
    banco         VARCHAR(60),
    cuenta        VARCHAR(40),
    estado        VARCHAR(20) NOT NULL DEFAULT 'solicitado',
    motivo_rechazo TEXT,
    procesado_por BIGINT REFERENCES public.socio(id),
    procesado_en  TIMESTAMPTZ,
    solicitado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 14. BONO GLOBAL SEMESTRAL
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.periodo_global (
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

-- ---------------------------------------------------------------------
-- 15. AUDITORÍA DEL SISTEMA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auditoria (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT REFERENCES public.socio(id),
    accion      VARCHAR(60) NOT NULL,
    tabla       VARCHAR(60),
    registro_id BIGINT,
    datos_antes JSONB,
    datos_despues JSONB,
    ip          VARCHAR(45),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.auditoria(creado_en DESC);

-- ---------------------------------------------------------------------
-- 16. SOLICITUDES DE AFILIACIÓN PÚBLICAS (LANDING REFERIDOS)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solicitud_afiliacion (
    id              BIGSERIAL PRIMARY KEY,
    nombres         VARCHAR NOT NULL,
    apellidos       VARCHAR NOT NULL,
    documento       VARCHAR,
    telefono        VARCHAR NOT NULL,
    email           VARCHAR NOT NULL,
    departamento    VARCHAR,
    provincia       VARCHAR,
    distrito        VARCHAR,
    direccion       VARCHAR,
    pack_codigo     VARCHAR,
    ref_codigo      VARCHAR,
    patrocinador_id BIGINT REFERENCES public.socio(id),
    estado          VARCHAR NOT NULL DEFAULT 'nueva',
    socio_id        BIGINT REFERENCES public.socio(id),
    motivo_descarte TEXT,
    origen          VARCHAR DEFAULT 'landing',
    ip              VARCHAR,
    creado_en       TIMESTAMPTZ DEFAULT NOW(),
    atendida_por    BIGINT REFERENCES public.socio(id),
    atendida_en     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_estado ON public.solicitud_afiliacion(estado);
CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_email ON public.solicitud_afiliacion(email);

-- ---------------------------------------------------------------------
-- 17. VISTAS DE APOYO (SECURITY INVOKER = TRUE)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_puntos_ciclo
WITH (security_invoker = true) AS
SELECT
    mp.socio_id,
    mp.ciclo_id,
    SUM(mp.puntos) FILTER (WHERE mp.cuenta_activacion) AS puntos_activacion,
    SUM(mp.puntos) FILTER (WHERE mp.cuenta_residual)   AS puntos_residual,
    SUM(mp.puntos) FILTER (WHERE mp.cuenta_rango)      AS puntos_rango
FROM public.movimiento_puntos mp
GROUP BY mp.socio_id, mp.ciclo_id;

CREATE OR REPLACE VIEW public.v_wallet_saldo
WITH (security_invoker = true) AS
SELECT socio_id, COALESCE(SUM(monto_cent), 0)::BIGINT AS saldo_cent
FROM public.wallet_movimiento
GROUP BY socio_id;

CREATE OR REPLACE VIEW public.v_frontales_activos
WITH (security_invoker = true) AS
SELECT
    ra.ancestro_id AS socio_id,
    a.ciclo_id,
    COUNT(*) FILTER (WHERE a.activo) AS frontales_activos
FROM public.red_ancestro ra
JOIN public.activacion a ON a.socio_id = ra.descendiente_id
WHERE ra.nivel = 1
GROUP BY ra.ancestro_id, a.ciclo_id;
