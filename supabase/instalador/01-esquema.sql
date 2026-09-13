-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 01-ESQUEMA.SQL
-- Esquema completo de las 23 tablas y 3 vistas oficiales
-- Idempotente: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS
-- =====================================================================

-- 1. CONFIGURACIÓN GLOBAL
CREATE TABLE IF NOT EXISTS public.config (
    clave           VARCHAR(60) PRIMARY KEY,
    valor           TEXT NOT NULL,
    tipo            VARCHAR(10) NOT NULL DEFAULT 'texto',
    descripcion     TEXT,
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_por BIGINT
);

-- 2. PACKS DE AFILIACIÓN
CREATE TABLE IF NOT EXISTS public.pack (
    id                     SERIAL PRIMARY KEY,
    codigo                 VARCHAR(20) NOT NULL,
    nombre                 VARCHAR(50) NOT NULL,
    precio_soles           NUMERIC(10,2) NOT NULL,
    precio_cent            BIGINT NOT NULL,
    puntos_rango           INT NOT NULL DEFAULT 0,
    puntos_comisionables   INT NOT NULL DEFAULT 0,
    solo_afilia_igual      BOOLEAN NOT NULL DEFAULT FALSE,
    niveles_patrocinio     INT NOT NULL DEFAULT 1,
    niveles_residual       INT NOT NULL DEFAULT 0,
    descuento_recompra_pct INT NOT NULL DEFAULT 50,
    descuento_pack_pct     INT NOT NULL DEFAULT 0,
    aplica_bono_global     BOOLEAN NOT NULL DEFAULT FALSE,
    activo                 BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pack_codigo UNIQUE (codigo)
);

-- 3. RANGOS
CREATE TABLE IF NOT EXISTS public.rango (
    id                SERIAL PRIMARY KEY,
    orden             INT NOT NULL,
    codigo            VARCHAR(20) NOT NULL,
    nombre            VARCHAR(50) NOT NULL,
    puntos_grupales   INT NOT NULL DEFAULT 0,
    frontales_activos INT NOT NULL DEFAULT 0,
    lineas_calificadas INT NOT NULL DEFAULT 0,
    bono_soles        NUMERIC(10,2) NOT NULL DEFAULT 0,
    bono_cent         BIGINT NOT NULL DEFAULT 0,
    definido          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rango_orden UNIQUE (orden),
    CONSTRAINT uq_rango_codigo UNIQUE (codigo)
);

-- 4. ESCALA DE COMISIONES POR NIVEL
CREATE TABLE IF NOT EXISTS public.nivel_comision (
    id         SERIAL PRIMARY KEY,
    tipo       VARCHAR(20) NOT NULL CHECK (tipo IN ('patrocinio','residual')),
    nivel      INT NOT NULL CHECK (nivel BETWEEN 1 AND 10),
    porcentaje NUMERIC(5,2) NOT NULL,
    CONSTRAINT uq_nivel_tipo UNIQUE (tipo, nivel)
);

-- 5. BONOS ESPECIALES DE PATROCINIO (KIT EMPRENDEDOR)
CREATE TABLE IF NOT EXISTS public.pack_comision_especial (
    id                 SERIAL PRIMARY KEY,
    pack_comprador_id  INT NOT NULL REFERENCES public.pack(id),
    nivel              INT NOT NULL DEFAULT 1,
    monto_soles        NUMERIC(10,2) NOT NULL,
    monto_cent         BIGINT NOT NULL,
    CONSTRAINT uq_pack_esp UNIQUE (pack_comprador_id, nivel)
);

-- 6. PUNTOS DE ENTREGA
CREATE TABLE IF NOT EXISTS public.punto_entrega (
    id           SERIAL PRIMARY KEY,
    codigo       VARCHAR(20) NOT NULL,
    nombre       VARCHAR(100) NOT NULL,
    direccion    TEXT NOT NULL,
    ciudad       VARCHAR(50) NOT NULL DEFAULT 'Lima',
    departamento VARCHAR(50) NOT NULL DEFAULT 'Lima',
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_punto_codigo UNIQUE (codigo)
);

-- 7. PRODUCTOS (con columnas finales: slug, categoria, presentacion)
CREATE TABLE IF NOT EXISTS public.producto (
    id                 SERIAL PRIMARY KEY,
    codigo             VARCHAR(20) NOT NULL,
    nombre             VARCHAR(100) NOT NULL,
    descripcion        TEXT,
    presentacion       TEXT,
    categoria          VARCHAR(50) DEFAULT 'General',
    precio_lista_soles NUMERIC(10,2) NOT NULL,
    precio_lista_cent  BIGINT NOT NULL,
    puntos             INT NOT NULL,
    orden              INT NOT NULL DEFAULT 0,
    imagen_url         TEXT,
    slug               VARCHAR(100),
    activo             BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_producto_codigo UNIQUE (codigo),
    CONSTRAINT uq_producto_slug UNIQUE (slug)
);

-- 8. SOCIOS (con columnas finales: cci, password_cambiada, baja)
CREATE TABLE IF NOT EXISTS public.socio (
    id                BIGSERIAL PRIMARY KEY,
    codigo            VARCHAR(10) NOT NULL,
    nombres           VARCHAR(100) NOT NULL,
    apellidos         VARCHAR(100) NOT NULL,
    tipo_documento    VARCHAR(10) NOT NULL DEFAULT 'DNI',
    documento         VARCHAR(20) NOT NULL,
    email             VARCHAR(100) NOT NULL,
    telefono          VARCHAR(20),
    departamento      VARCHAR(50),
    provincia         VARCHAR(50),
    direccion         TEXT,
    banco             VARCHAR(50),
    cuenta_bancaria   VARCHAR(50),
    cci               VARCHAR(20),
    patrocinador_id   BIGINT REFERENCES public.socio(id),
    pack_id           INT NOT NULL REFERENCES public.pack(id),
    rol               VARCHAR(20) NOT NULL DEFAULT 'socio' CHECK (rol IN ('socio','lider','admin','superadmin')),
    estado            VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','bloqueado','baja')),
    password_cambiada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_baja        TIMESTAMPTZ,
    motivo_baja       TEXT,
    baja_por          BIGINT REFERENCES public.socio(id),
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_socio_codigo UNIQUE (codigo),
    CONSTRAINT uq_socio_documento UNIQUE (documento),
    CONSTRAINT uq_socio_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_socio_patrocinador ON public.socio(patrocinador_id);
CREATE INDEX IF NOT EXISTS idx_socio_codigo ON public.socio(codigo);
CREATE INDEX IF NOT EXISTS idx_socio_estado ON public.socio(estado);

-- 9. CICLOS CONTABLES
CREATE TABLE IF NOT EXISTS public.ciclo (
    id           SERIAL PRIMARY KEY,
    anio         INT NOT NULL,
    mes          INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    fecha_inicio DATE NOT NULL,
    fecha_fin    DATE NOT NULL,
    estado       VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado','pagado','en_espera')),
    cerrado_en   TIMESTAMPTZ,
    cerrado_por  BIGINT REFERENCES public.socio(id),
    CONSTRAINT uq_ciclo_anio_mes UNIQUE (anio, mes)
);

-- 10. PERIODOS DE BONO GLOBAL (Semestral)
CREATE TABLE IF NOT EXISTS public.periodo_global (
    id               SERIAL PRIMARY KEY,
    anio             INT NOT NULL,
    semestre         INT NOT NULL CHECK (semestre IN (1, 2)),
    fecha_inicio     DATE NOT NULL,
    fecha_fin        DATE NOT NULL,
    estado           VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado','pagado')),
    monto_total_soles NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_total_cent BIGINT NOT NULL DEFAULT 0,
    cerrado_en       TIMESTAMPTZ,
    cerrado_por      BIGINT REFERENCES public.socio(id),
    CONSTRAINT uq_periodo_global UNIQUE (anio, semestre)
);

-- 11. ÓRDENES (con columna tipo_venta)
CREATE TABLE IF NOT EXISTS public.orden (
    id                BIGSERIAL PRIMARY KEY,
    codigo            VARCHAR(20) NOT NULL,
    socio_id          BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id          INT NOT NULL REFERENCES public.ciclo(id),
    tipo              VARCHAR(20) NOT NULL CHECK (tipo IN ('afiliacion','recompra','upgrade')),
    tipo_venta        VARCHAR(20) NOT NULL DEFAULT 'catalogo' CHECK (tipo_venta IN ('catalogo','socio')),
    subtotal_soles    NUMERIC(10,2) NOT NULL,
    subtotal_cent     BIGINT NOT NULL,
    descuento_soles   NUMERIC(10,2) NOT NULL DEFAULT 0,
    descuento_cent    BIGINT NOT NULL DEFAULT 0,
    total_soles       NUMERIC(10,2) NOT NULL,
    total_cent        BIGINT NOT NULL,
    puntos_total      INT NOT NULL DEFAULT 0,
    estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','confirmada','rechazada','anulada')),
    metodo_pago       VARCHAR(20) CHECK (metodo_pago IN ('transferencia','deposito','yape','plin','efectivo')),
    punto_entrega_id  INT REFERENCES public.punto_entrega(id),
    creada_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmada_en     TIMESTAMPTZ,
    confirmada_por    BIGINT REFERENCES public.socio(id),
    CONSTRAINT uq_orden_codigo UNIQUE (codigo)
);

CREATE INDEX IF NOT EXISTS idx_orden_socio_ciclo ON public.orden(socio_id, ciclo_id);
CREATE INDEX IF NOT EXISTS idx_orden_estado ON public.orden(estado);

-- 12. DETALLE DE ÓRDENES
CREATE TABLE IF NOT EXISTS public.orden_detalle (
    id                 BIGSERIAL PRIMARY KEY,
    orden_id           BIGINT NOT NULL REFERENCES public.orden(id) ON DELETE CASCADE,
    producto_id        INT NOT NULL REFERENCES public.producto(id),
    cantidad           INT NOT NULL CHECK (cantidad > 0),
    precio_unit_soles  NUMERIC(10,2) NOT NULL,
    precio_unit_cent   BIGINT NOT NULL,
    puntos_unit        INT NOT NULL,
    subtotal_soles     NUMERIC(10,2) NOT NULL,
    subtotal_cent      BIGINT NOT NULL
);

-- 13. COMPROBANTES DE PAGO (VOUCHERS)
CREATE TABLE IF NOT EXISTS public.voucher (
    id               BIGSERIAL PRIMARY KEY,
    orden_id         BIGINT NOT NULL REFERENCES public.orden(id) ON DELETE CASCADE,
    banco            VARCHAR(50) NOT NULL,
    numero_operacion VARCHAR(50) NOT NULL,
    monto_soles      NUMERIC(10,2) NOT NULL,
    monto_cent       BIGINT NOT NULL,
    fecha_deposito   DATE NOT NULL,
    imagen_url       TEXT,
    estado           VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
    revisado_por     BIGINT REFERENCES public.socio(id),
    revisado_en      TIMESTAMPTZ,
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ENVÍOS Y DESPACHOS
CREATE TABLE IF NOT EXISTS public.envio (
    id               BIGSERIAL PRIMARY KEY,
    orden_id         BIGINT NOT NULL REFERENCES public.orden(id) ON DELETE CASCADE,
    destinatario     VARCHAR(100) NOT NULL,
    direccion        TEXT NOT NULL,
    departamento     VARCHAR(50) NOT NULL,
    provincia        VARCHAR(50) NOT NULL,
    distrito         VARCHAR(50),
    telefono         VARCHAR(20) NOT NULL,
    guia_remision    VARCHAR(50),
    transportadora   VARCHAR(50),
    estado           VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_preparacion','enviado','entregado','devuelto')),
    fecha_despacho   TIMESTAMPTZ,
    fecha_entrega    TIMESTAMPTZ,
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. ACTIVACIÓN MENSUAL DEL SOCIO
CREATE TABLE IF NOT EXISTS public.activacion (
    id                BIGSERIAL PRIMARY KEY,
    socio_id          BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id          INT NOT NULL REFERENCES public.ciclo(id),
    puntos_personales INT NOT NULL DEFAULT 0,
    activo            BOOLEAN NOT NULL DEFAULT FALSE,
    calculado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_activacion UNIQUE (socio_id, ciclo_id)
);

-- 16. MOVIMIENTO DE PUNTOS
CREATE TABLE IF NOT EXISTS public.movimiento_puntos (
    id                BIGSERIAL PRIMARY KEY,
    socio_id          BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id          INT NOT NULL REFERENCES public.ciclo(id),
    orden_id          BIGINT REFERENCES public.orden(id),
    puntos            INT NOT NULL,
    cuenta_activacion BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_residual   BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_rango      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_puntos_socio_ciclo ON public.movimiento_puntos(socio_id, ciclo_id);

-- 17. COMISIONES CALCULADAS (LIBRO CONTABLE)
CREATE TABLE IF NOT EXISTS public.comision (
    id              BIGSERIAL PRIMARY KEY,
    ciclo_id        INT NOT NULL REFERENCES public.ciclo(id),
    beneficiario_id BIGINT NOT NULL REFERENCES public.socio(id),
    generador_id    BIGINT REFERENCES public.socio(id),
    orden_id        BIGINT REFERENCES public.orden(id),
    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('patrocinio','residual','rango','global')),
    nivel           INT CHECK (nivel BETWEEN 1 AND 10),
    base_soles      NUMERIC(10,2) NOT NULL DEFAULT 0,
    base_cent       BIGINT NOT NULL DEFAULT 0,
    base_puntos     INT NOT NULL DEFAULT 0,
    porcentaje      NUMERIC(5,2),
    monto_soles     NUMERIC(10,2) NOT NULL,
    monto_cent      BIGINT NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','pagada','retenida','bloqueada')),
    detalle         JSONB,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comision_beneficiario_ciclo ON public.comision(beneficiario_id, ciclo_id);
CREATE INDEX IF NOT EXISTS idx_comision_tipo ON public.comision(tipo);

-- 18. CALIFICACIÓN DE RANGO POR CICLO
CREATE TABLE IF NOT EXISTS public.rango_ciclo (
    id                  BIGSERIAL PRIMARY KEY,
    socio_id            BIGINT NOT NULL REFERENCES public.socio(id),
    ciclo_id            INT NOT NULL REFERENCES public.ciclo(id),
    rango_id            INT NOT NULL REFERENCES public.rango(id),
    puntos_grupales     INT NOT NULL DEFAULT 0,
    puntos_linea_mayor  INT NOT NULL DEFAULT 0,
    puntos_computables  INT NOT NULL DEFAULT 0,
    frontales_activos   INT NOT NULL DEFAULT 0,
    califica            BOOLEAN NOT NULL DEFAULT FALSE,
    calculado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rango_ciclo UNIQUE (socio_id, ciclo_id)
);

CREATE INDEX IF NOT EXISTS idx_rango_ciclo_socio ON public.rango_ciclo(socio_id, ciclo_id);

-- 19. MOVIMIENTOS DE BILLETERA (WALLET)
CREATE TABLE IF NOT EXISTS public.wallet_movimiento (
    id                  BIGSERIAL PRIMARY KEY,
    socio_id            BIGINT NOT NULL REFERENCES public.socio(id),
    tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('abono_comision','retiro','ajuste_admin','detraccion')),
    monto_soles         NUMERIC(10,2) NOT NULL,
    monto_cent          BIGINT NOT NULL,
    saldo_anterior_cent BIGINT NOT NULL DEFAULT 0,
    saldo_nuevo_cent    BIGINT NOT NULL DEFAULT 0,
    orden_id            BIGINT REFERENCES public.orden(id),
    solicitud_retiro_id BIGINT,
    descripcion         TEXT,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_mov_socio ON public.wallet_movimiento(socio_id);

-- 20. SOLICITUDES DE RETIRO BANCARIO
CREATE TABLE IF NOT EXISTS public.solicitud_retiro (
    id           BIGSERIAL PRIMARY KEY,
    socio_id     BIGINT NOT NULL REFERENCES public.socio(id),
    monto_soles  NUMERIC(10,2) NOT NULL,
    monto_cent   BIGINT NOT NULL,
    banco        VARCHAR(50) NOT NULL,
    cuenta       VARCHAR(50) NOT NULL,
    cci          VARCHAR(20),
    estado       VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','pagada')),
    aprobado_por BIGINT REFERENCES public.socio(id),
    aprobado_en  TIMESTAMPTZ,
    motivo       TEXT,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. RED DE ANCESTROS (ÁRBOL GENEALÓGICO)
CREATE TABLE IF NOT EXISTS public.red_ancestro (
    ancestro_id     BIGINT NOT NULL REFERENCES public.socio(id),
    descendiente_id BIGINT NOT NULL REFERENCES public.socio(id),
    nivel           INT NOT NULL,
    PRIMARY KEY (ancestro_id, descendiente_id)
);

CREATE INDEX IF NOT EXISTS idx_red_ancestro_ancestro ON public.red_ancestro(ancestro_id);
CREATE INDEX IF NOT EXISTS idx_red_ancestro_desc ON public.red_ancestro(descendiente_id);

-- 22. AUDITORÍA DEL SISTEMA
CREATE TABLE IF NOT EXISTS public.auditoria (
    id            BIGSERIAL PRIMARY KEY,
    usuario_id    BIGINT REFERENCES public.socio(id),
    accion        VARCHAR(50) NOT NULL,
    tabla         VARCHAR(50) NOT NULL,
    registro_id   BIGINT,
    datos_antes   JSONB,
    datos_despues JSONB,
    ip            VARCHAR(45),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_registro ON public.auditoria (tabla, registro_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON public.auditoria (usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON public.auditoria (accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_creado_en ON public.auditoria (creado_en DESC);

-- 23. SOLICITUDES DE AFILIACIÓN (PROSPECTOS DE LANDING)
CREATE TABLE IF NOT EXISTS public.solicitud_afiliacion (
    id               BIGSERIAL PRIMARY KEY,
    nombres          VARCHAR(100) NOT NULL,
    apellidos        VARCHAR(100) NOT NULL,
    tipo_documento   VARCHAR(10) NOT NULL DEFAULT 'DNI',
    documento        VARCHAR(20) NOT NULL,
    telefono         VARCHAR(20) NOT NULL,
    email            VARCHAR(100) NOT NULL,
    departamento     VARCHAR(50),
    provincia        VARCHAR(50),
    direccion        TEXT,
    pack_codigo      VARCHAR(20) NOT NULL,
    ref_codigo       VARCHAR(20),
    patrocinador_id  BIGINT REFERENCES public.socio(id),
    origen           VARCHAR(20) NOT NULL DEFAULT 'landing',
    estado           VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','convertida','descartada')),
    notas_admin      TEXT,
    revisado_por     BIGINT REFERENCES public.socio(id),
    revisado_en      TIMESTAMPTZ,
    socio_creado_id  BIGINT REFERENCES public.socio(id),
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_estado ON public.solicitud_afiliacion (estado);
CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_documento ON public.solicitud_afiliacion (documento);
CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_email ON public.solicitud_afiliacion (email);
CREATE INDEX IF NOT EXISTS idx_solicitud_afiliacion_fecha ON public.solicitud_afiliacion (creado_en DESC);

-- =====================================================================
-- VISTAS DE APOYO (SECURITY INVOKER = TRUE)
-- =====================================================================

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
    s.patrocinador_id AS socio_id,
    a.ciclo_id,
    COUNT(*)::INT AS frontales_activos
FROM public.socio s
JOIN public.activacion a ON a.socio_id = s.id
WHERE a.activo = true
  AND s.estado = 'activo'
  AND s.patrocinador_id IS NOT NULL
GROUP BY s.patrocinador_id, a.ciclo_id;
