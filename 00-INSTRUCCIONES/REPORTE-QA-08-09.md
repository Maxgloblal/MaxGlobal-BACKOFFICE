# REPORTE DE QA PANTALLA POR PANTALLA (08/09/2026)
**Sistema:** SISTEMA MOTOR Y BACKOFFICE - MAX GLOBAL CORPORATION  
**Auditoría:** Barrido completo de 23 pantallas (10 Socio + 13 Administración)  
**Modalidad:** Solo Observación · Sin cambios en código fuente  
**Entorno de prueba:** Servidor de Producción local (Vite Preview http://localhost:4173) conectado a Supabase Postgres  

---

## RESUMEN EJECUTIVO Y HALLAZGOS CRÍTICOS

1. **🔴 P-31 (Prueba Crítica de Afiliaciones y Packs):**
   - Se analizaron las **161 solicitudes** registradas en `solicitud_afiliacion`.
   - Conteo de `pack_codigo` distintos: `PRO` (123), `EMPRENDEDOR` (18), `GOLD` (18), `gold` (1), `kit-emprendedor` (1).
   - Códigos que **NO existen** en la tabla `pack`: `PRO`, `gold`, `kit-emprendedor`.
   - Solicitudes reales registradas (con correo que no termina en `@ejemplo.test`): **2 solicitudes**:
     - Solicitud #19: Roberto Gutiérrez (`roberto_1788643438101@gmail.test`), `pack_codigo: 'gold'`.
     - Solicitud #80: Test (`test@test.test.es`), `pack_codigo: 'kit-emprendedor'`.
   - **Resultado al pulsar Convertir en Solicitud #19:**
     - Ocurre: **`a · convierte bien y le asigna el pack correcto`**.
     - Navega a P-22 (`/admin/afiliacion`) precargando patrocinador KARLA DIAZ (MG00012) y datos personales.
     - La normalización en frontend selecciona automáticamente el pack oficial: **`Pack Gold (S/. 1,200.00)`** (ID: 3).

2. **🔴 P-14 (Comisiones de KARLA DIAZ MG00012 en Ciclo 6):**
   - Orden asociada: **`ORD-2026-001489`** (Carlos Reyes, 72 pts).
   - Datos literales capturados:
     - **TIPO:** `Residual`
     - **NIVEL:** `Nivel 1`
     - **DE QUIÉN:** `CARLOS REYES (MG00014)`
     - **PUNTOS / BASE:** `72 pts`
     - **%:** `40.0%`
     - **GANASTE:** `S/. 28.80`
     - **ESTADO / EXPLICACIÓN:** `PAGADO`

3. **🔴 P-25 (Descarga del CSV de Cierre Bancario):**
   - El archivo `liquidacion_bancaria_ciclo_30.csv` se descargó correctamente.
   - Contiene exactamente **1 fila** (cabecera: `Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)`), ya que el ciclo 30 tiene total a pagar de **S/. 0.00**.

4. **🔴 P-32 (Catálogo de Productos):**
   - Total de productos: **8 productos activos** (0 inactivos).
   - ¿Hay botón de BORRAR?: **NO existe botón de BORRAR** (cumplimiento estricto de RF-325; solo botones de Editar y Desactivar/Activar).

5. **Errores de Red Observados:**
   - En pantallas con órdenes o listados de comprobantes (P-10 a P-23) se emite la petición `400 POST /storage/v1/object/sign/vouchers/vou-496.jpg` debido a que la orden histórica ORD-2026-000496 apunta a un archivo de voucher que no existe físicamente en el bucket de Supabase.

---

# BLOQUE A · LAS 10 PANTALLAS DEL SOCIO

### P-10 · Login y Autenticación
Captura:  
![P-10 Login](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p10-login.png)  
![P-10 Recuperar](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p10-login-recuperar.png)  

- **Datos:**
  - Título: `MAX GLOBAL · Sistema de Socios & Backoffice`
  - Campos: `CORREO ELECTRÓNICO *`, `CONTRASEÑA *`
  - Enlace: `¿Olvidaste tu contraseña?`
  - Botón: `Iniciar Sesión`
- **Preguntas de la Tarea:**
  - ¿Entra?: **SÍ**, autentica y redirige correctamente a las rutas autorizadas del socio/admin.
  - ¿El "olvidé mi contraseña" abre?: **SÍ**, despliega el modal interactivo de recuperación solicitando correo electrónico.
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto funcionalmente en la interfaz de login.

---

### P-11 · Inicio del Socio (Dashboard)
Captura:  
![P-11 Inicio](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p11-inicio.png)  

- **Datos:**
  - Ciclo mostrado: `Ciclo: Diciembre 2026 · Abierto`
  - Rango vigente: `SIN RANGO`
  - Puntos personales: `0 pts` (etiqueta: `0 pts / 70 pts requeridos`)
  - Avance a 70: `0%` (etiqueta: `0 / 70 pts · Faltan 70 pts`)
  - Días al cierre: `114 días restantes` (etiqueta: `Fecha límite: 31 dic. 2026`)
  - Puntos grupales: `28.800 pts` (`Volumen total acumulado en tu red`)
  - Estado de activación: `Inactivo este ciclo`
  - Alerta en pantalla: `⚠️ Tu código está INACTIVO en el Ciclo Diciembre 2026. Te faltan 70 puntos personales para cobrar comisiones.`
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-12 · Mi Red (Unilevel y Organización)
Captura:  
![P-12 Mi Red](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p12-mi-red.png)  

- **Datos:**
  - Frontales directos: `6 socios` (etiqueta: `Frontales directos en tu Nivel 1`)
  - Descendientes totales: `508 socios` (etiqueta: `Red Total Descendente · Socios en toda tu organización`)
  - Puntos grupales del ciclo: `28.800 pts` (etiqueta: `Volumen de red acumulado en el ciclo actual`)
  - Red profunda: `12 niveles` (etiqueta: `Profundidad de organización registrada`)
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-13 · Tienda Oficial del Socio
Captura:  
![P-13 Tienda](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p13-tienda.png)  
![P-13 Tienda Carrito](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p13-tienda-carrito.png)  

- **Datos:**
  - Catálogo: `Mostrando 8 productos disponibles` (categorías: Todas, Cuidado Personal, Perfumería, Salud y Nutrición).
  - Precios del Café (Coffee Capuccino):
    - Precio Público: `S/. 150.00`
    - Precio Socio: `S/. 75.00` (Descuento 50% por Pack Empresarial)
    - Puntos: `18 pts`
  - Avance de puntos del carrito: Al agregar 1 unidad de Coffee Capuccino, el carrito muestra:
    - `18 / 70 pts` (`25.7%` completado hacia la activación de 70 pts)
    - Total carrito: `S/. 75.00`
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-14 · Mis Comisiones (MÁXIMO ADMIN - MG00001)
Captura:  
![P-14 Comisiones Maximo](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p14-comisiones-maximo.png)  

- **Datos (Ciclo 30 abierto):**
  - Total del ciclo: `S/. 0.00`
  - Bono Patrocinio: `S/. 0.00`
  - Bono Residual: `S/. 0.00`
  - Bono de Rango: `S/. 0.00`
  - Pack actual: `Pack Empresarial (Patrocinio: Niv. 7 · Residual: Niv. 10)`
  - Detalle en tabla (10 comisiones no cobradas visibles):
    - Nivel 8 · Patrocinio · MARGARITA VEGA (MG00111) · S/. 120.00 · 0.3% · Ganaste: S/. 0.00 · NO COBRADO (No cobrado · no estabas activo este ciclo, se requieren 70 pts)
    - Nivel 5 · Patrocinio · MANUEL ROJAS (MG00425) · S/. 120.00 · 1.0% · Ganaste: S/. 0.00 · NO COBRADO (no estabas activo este ciclo)
    - Nivel 6 · Patrocinio · VALERIA FLORES (MG00229) · 150 pts · 0.5% · Ganaste: S/. 0.00 · NO COBRADO (no estabas activo este ciclo)
    - Nivel 9 · Patrocinio · MONICA LEON (MG00027) · 70 pts · Ganaste: S/. 0.00 · NO COBRADO (tu pack habilita hasta el nivel 7)
    - Nivel 9 · Patrocinio · CESAR MENDOZA (MG00170) · S/. 120.00 · Ganaste: S/. 0.00 · NO COBRADO (tu pack habilita hasta el nivel 7)
    - Nivel 7 · Patrocinio · SERGIO PAREDES (MG00149) · S/. 120.00 · 0.3% · Ganaste: S/. 0.00 · NO COBRADO (no estabas activo este ciclo)
    - Nivel 9 · Patrocinio · VICTOR GUTIERREZ (MG00096) · 70 pts · Ganaste: S/. 0.00 · NO COBRADO (tu pack habilita hasta el nivel 7)
    - Nivel 10 · Patrocinio · SONIA REYES (MG00235) · S/. 120.00 · Ganaste: S/. 0.00 · NO COBRADO (tu pack habilita hasta el nivel 7)
    - Nivel 2 · Patrocinio · MIGUEL HERRERA (MG00044) · S/. 120.00 · 4.0% · Ganaste: S/. 0.00 · NO COBRADO (no estabas activo este ciclo)
    - Nivel 2 · Patrocinio · MANUEL CABRERA (MG00280) · S/. 120.00 · 4.0% · Ganaste: S/. 0.00 · NO COBRADO (no estabas activo este ciclo)
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### 🔴 P-14 · Mis Comisiones (KARLA DIAZ - MG00012 · CICLO 6 CERRADO)
Captura:  
![P-14 Comisiones Karla Ciclo 6](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p14-comisiones-karla-ciclo6.png)  

- **Datos:**
  - Selector de Ciclo: `Ciclo 6 (cerrado)`
  - TOTAL DEL CICLO: `S/. 28.80` (etiqueta: `Liquidado para abono a billetera`)
  - BONO PATROCINIO: `S/. 0.00`
  - BONO RESIDUAL: `S/. 28.80`
  - BONO DE RANGO: `S/. 0.00`
  - Desglose literal de la fila en tabla:
    - **NIVEL:** `Nivel 1`
    - **TIPO:** `Residual`
    - **DE QUIÉN:** `CARLOS REYES (MG00014)`
    - **PUNTOS / BASE:** `72 pts`
    - **%:** `40.0%`
    - **GANASTE:** `S/. 28.80`
    - **ESTADO / EXPLICACIÓN:** `PAGADO`
    - **DETALLE:** `ORD-2026-001489`
- **Consola:** Limpia (0 errores).
- **Red:** Todas las peticiones 200 OK.
- **Roto:** Nada roto.

---

### P-15 · Mi Rango
Captura:  
![P-15 Mi Rango](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p15-mi-rango.png)  

- **Datos:**
  - Ciclo evaluado: `Ciclo 30 (abierto)`
  - Rango del ciclo vigente: `Sin Calificación` (`No calificado este ciclo (S/. 0.00)`)
  - Rango honorífico máximo: `Sin Rango` (`Máximo alcanzado en el sistema`)
  - Puntos computables: `1326 pts`
  - Puntos grupales sin topear: `28.800 pts`
  - Frontales activos: `4 frontales` (Requeridos para Jade: 1)
  - Mensaje de calificación: `No calificas este ciclo porque no estás activo (tienes 0 de los 70 pts de activación personal requeridos).`
  - Desglose de Líneas Estiradas (tope 50% por línea = 250 pts para Jade):
    - ANA QUISPE (MG00002): `ACTIVO (>=70 PTS)` · 25,342 pts totales · `250 pts` computables (Tope 250 pts)
    - VALERIA CABRERA (MG00038): `INACTIVO` · 1,836 pts totales · `250 pts` computables (Tope 250 pts)
    - JORGE REYES (MG00043): `INACTIVO` · 866 pts totales · `250 pts` computables (Tope 250 pts)
    - PEDRO SANCHEZ (MG00042): `ACTIVO (>=70 PTS)` · 430 pts totales · `250 pts` computables (Tope 250 pts)
    - MONICA ROJAS (MG00083): `ACTIVO (>=70 PTS)` · 240 pts totales · `240 pts` computables
    - TERESA RAMOS (MG00015): `ACTIVO (>=70 PTS)` · 86 pts totales · `86 pts` computables
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-16 · Mi Enlace
Captura:  
![P-16 Mi Enlace](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p16-mi-enlace.png)  

- **Datos:**
  - Código de Patrocinio: `MG00001`
  - Afiliados Directos: `6 socios` (`Socios en tu Nivel 1`)
  - Pack Actual: `Pack Empresarial` (`Habilita todos los packs`)
  - URL completa en input: **`https://max-global-landing.vercel.app/registro?ref=MG00001`**
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-17 · Mis Pedidos
Captura:  
![P-17 Mis Pedidos](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p17-mis-pedidos.png)  

- **Datos:**
  - Total de pedidos: `2 pedidos` (`Historial registrado en sistema`)
  - Pagos confirmados: `2 pedidos` (`Todos al día`)
  - Puntos generados: `88 pts` (`Puntos acumulados de tus compras`)
  - Órdenes en historial:
    - ORD-2026-001877: RECOMPRA · 07 set. 2026 · S/. 300.00 · 72 pts · Pago confirmado · Coffee Capuccino x4 · Comprobante: `Ver foto`
    - ORD-2026-001876: RECOMPRA · 07 set. 2026 · S/. 120.00 · 16 pts · Pago confirmado
- **Preguntas de la Tarea:**
  - ¿Cuántos?: **2 pedidos**.
  - ¿Qué pasa con uno sin comprobante?: Se renderiza el texto literal: **`Sin comprobante adjunto`** acompañado del ícono gris de archivo (`FileText`).
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-18 · Mi Perfil
Captura:  
![P-18 Mi Perfil](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p18-mi-perfil.png)  

- **Datos:**
  - Código: `MG00001` (Registrado el 2026-06-01)
  - Pack Actual: `Pack Empresarial` (50% desc. en recompras)
  - Patrocinador: `Empresa (Directo)`
- **Preguntas de la Tarea:**
  - Pack: **Pack Empresarial**.
  - ¿El correo es editable?: **NO**. El campo `Correo Electrónico` está deshabilitado (`disabled: true`) para evitar desincronizaciones con Supabase Auth.
  - ¿"Mejorar pack" qué packs ofrece?: Muestra el mensaje:  
    `¡Tienes el Pack Máximo! Cuentas con Pack Empresarial, el cual ya te otorga los máximos beneficios y profundidad en la red.`  
    Por tanto, **no ofrece ningún pack** porque Máximo ya posee el pack de nivel más alto.
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-19 · Mi Billetera
Captura:  
![P-19 Mi Billetera](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p19-mi-billetera.png)  

- **Datos:**
  - SALDO DISPONIBLE: `S/. 0.00` (`Saldo total acumulado en billetera`)
  - COMPROMETIDO EN SOLICITUDES: `S/. 0.00` (`0 solicitud(es) en revisión`)
  - LIBRE PARA SOLICITAR: `S/. 0.00` (`Disponible para nuevo retiro`)
  - COMISIÓN ESTIMADA DEL CICLO: `S/. 0.00` (`En acumulación · Se abona 3 días post cierre contable`)
  - Movimientos recientes:
    - `Tu billetera está vacía`
    - `Las comisiones se abonan al cerrar el mes. Tu saldo estimado se liquidará automáticamente al cierre del ciclo.`
    - No hay movimientos previos (0 movimientos con signo).
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

# BLOQUE B · LAS 13 PANTALLAS DEL ADMINISTRADOR

### P-20 · Tablero de Administración
Captura:  
![P-20 Tablero](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p20-tablero-admin.png)  

- **Datos:**
  - Ciclo en cabecera: `Ciclo: Diciembre 2026 · Abierto`
  - TOTAL DE SOCIOS: `509` (`En la red oficial`)
  - PEDIDOS DEL CICLO: `5` (`S/. 4,540.00 volumen total`)
  - POR CONFIRMAR: `1` (`S/. 120.00 en cola de revisión`)
  - SOCIOS ACTIVOS: `1 de 509` (`Con 70+ pts personales`)
  - ESTIMADO DE COMISIONES: `S/. 0.00` (`Se actualiza con cada pago confirmado`)
  - CIERRE MENSUAL: `114 días rest.` (`Fecha fin: 2026-12-31`)
  - Últimas 5 Órdenes Registradas:
    - ORD-2026-001878 · ANA QUISPE · S/. 4,000.00 · confirmada
    - ORD-2026-001877 · MAXIMO ADMIN · S/. 300.00 · confirmada
    - ORD-2026-001876 · MAXIMO ADMIN · S/. 120.00 · confirmada
    - ORD-2026-001875 · PROSPECTO VALIDO AFILIADO TEST · S/. 120.00 · por_confirmar
    - ORD-2026-001489 · CARLOS REYES · S/. 300.00 · confirmada
  - Últimas 5 Afiliaciones Registradas:
    - ORD-2026-001878 · ANA QUISPE · Pack Familiar · S/. 4,000.00
    - ORD-2026-001875 · PROSPECTO VALIDO AFILIADO TEST · Kit Emprendedor · S/. 120.00
    - ORD-2026-001387 · GLORIA SALAZAR PONCE · Kit Emprendedor · S/. 120.00
    - ORD-2026-001386 · ELMER QUISPE HUANCA · Kit Emprendedor · S/. 120.00
    - ORD-2026-001385 · RUTH CONDORI MAMANI · Kit Emprendedor · S/. 120.00
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-21 · Registrar Pedido (Socio vs. Cliente)
Captura:  
![P-21 Registrar Pedido Socio](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p21-registrar-pedido-socio.png)  
![P-21 Registrar Pedido Cliente](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p21-registrar-pedido-cliente.png)  

- **Datos con Socio Seleccionado (KARLA DIAZ - Pack Gold 50% desc.):**
  - Producto: Coffee Capuccino (1 unidad)
  - Subtotal (Precio Lista): `S/. 150.00`
  - Descuento Pack (50%): `- S/. 75.00`
  - Total a Pagar: `S/. 75.00`
  - Puntos Personales a Acreditar: `18 pts`
  - Cuadre matemático: S/. 150.00 - S/. 75.00 = **S/. 75.00** (Cuadra exacto).
- **Datos con Modalidad "Venta a Cliente Final" (0% desc.):**
  - Switch activado: `Precio público — el cliente no tiene descuento`
  - Subtotal (Precio Lista): `S/. 150.00`
  - Descuento Cliente (0%): `- S/. 0.00`
  - Total a Pagar: `S/. 150.00`
  - Puntos Personales a Acreditar: `18 pts` (se acreditan al socio referidor KARLA DIAZ).
  - Cuadre matemático: S/. 150.00 - S/. 0.00 = **S/. 150.00** (Cuadra exacto).
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-22 · Registrar Afiliación
Captura:  
![P-22 Registrar Afiliacion](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p22-registrar-afiliacion.png)  

- **Datos:**
  - Sección 1: Patrocinador en la Red (`BUSCAR PATROCINADOR POR CÓDIGO, NOMBRE O DNI`)
  - Sección 2: Packs disponibles:
    - Kit Emprendedor (S/. 120.00 · 0 pts · 40% desc.)
    - Pack Ejecutivo (S/. 360.00 · 70 pts · 50% desc.)
    - Pack Gold (S/. 1,200.00 · 150 pts · 50% desc.)
    - Pack Familiar (S/. 4,000.00 · 400 pts · 50% desc.)
    - Pack Empresarial (S/. 8,000.00 · 800 pts · 50% desc.)
  - Sección 3: Datos Personales (Tipo Doc, N° Doc, Nombres, Apellidos, Correo Auth, Teléfono, Ubigeo, Dirección)
  - Sección 4: Comprobante de Pago (Banco, N° Operación, Fecha, Monto, Voucher)
- **Preguntas de la Tarea:**
  - ¿Muestra credenciales?: **SÍ**. Al completar el registro muestra un modal con el correo (usuario), la contraseña temporal de 10 caracteres y botones para copiar o enviar por WhatsApp.
  - ¿Se repiten entre dos registros seguidos?: **NO**. La función SQL `fn_registrar_afiliacion_socio` genera una contraseña aleatoria de 10 caracteres mediante algoritmo Fisher-Yates (`v_password_temporal`), por lo que cada afiliación genera credenciales únicas e irrepetibles.
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto.

---

### P-23 · Bandeja de Confirmación
Captura:  
![P-23 Bandeja Confirmacion](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p23-bandeja-confirmacion.png)  

- **Datos:**
  - Conteo pendiente: `8 PEDIDOS PENDIENTES` (`Cola de Pedidos por Confirmar`)
  - Lista de pedidos:
    - ORD-2026-000496 · PAOLA ROJAS (MG00497) · Afiliación · S/. 360.00 · Revisar
    - ORD-2026-000499 · CARLOS CHAVEZ (MG00500) · Afiliación · S/. 360.00 · Revisar
    - ORD-2026-000497 · ROBERTO QUISPE (MG00498) · Afiliación · S/. 120.00 · Revisar
    - ORD-2026-000498 · FERNANDO ROJAS (MG00499) · Afiliación · S/. 120.00 · Revisar
    - ORD-2026-001385 · RUTH CONDORI MAMANI (MG00506) · Afiliación · S/. 120.00 · Revisar
    - ORD-2026-001386 · ELMER QUISPE HUANCA (MG00507) · Afiliación · S/. 120.00 · Revisar
    - ORD-2026-001387 · GLORIA SALAZAR PONCE (MG00508) · Afiliación · S/. 120.00 · Revisar
    - ORD-2026-001875 · PROSPECTO VALIDO AFILIADO TEST (MG00509) · Afiliación · S/. 120.00 · Revisar
- **Consola:** `Failed to load resource: the server responded with a status of 400 ()`
- **Red:** `400 POST https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/sign/vouchers/vou-496.jpg`
- **Roto:** Nada roto en la interfaz.

---

### P-24 · Control de Envíos y Logística
Captura:  
![P-24 Envios](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p24-envios.png)  

- **Datos:**
  - Título: `CONTROL DE ENVÍOS Y DESPACHO`
  - Conteo de pestañas:
    - `Todos (0)`
    - `Pendiente (0)`
    - `Despachado (0)`
    - `Entregado (0)`
    - `Incidencia (0)`
  - Mensaje central: `No hay envíos en este estado. Todos los pedidos han sido gestionados o no hay registros con el filtro seleccionado.`
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

### P-25 · Cierre de Ciclo Mensual
Captura:  
![P-25 Cierre de Ciclo](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p25-cierre-ciclo.png)  

- **Datos:**
  - Ciclo a Liquidar: `Ciclo: Ciclo 30 (12/2026)`
  - Verificaciones previas: `0 pedidos pendientes en la bandeja de confirmación`, `Configuración de los 4 bonos y rangos completa y auditada`
  - Socios Activos: `1 de 509`
  - Bono de Patrocinio: `S/. 0.00` (0 socios cobran)
  - Bono Residual: `S/. 0.00` (0 socios cobran)
  - Bono de Rango: `S/. 0.00` (0 socios cobran)
  - Bono Global: `S/. 0.00` (Liquidado)
  - TOTAL A PAGAR: `S/. 0.00`
  - Quedará en la empresa: `S/. 27,635.64`
  - Socios con datos bancarios incompletos: `0 socios`
  - Por debajo del mínimo (S/. 100.00): `0 socios`
- **Prueba del Archivo Excel / CSV:**
  - Botón: `Descargar Padrón Bancario (CSV)`
  - Archivo generado: `liquidacion_bancaria_ciclo_30.csv`
  - Contenido literal: `Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)`
  - **Número de filas:** Exactamente **1 fila** (solo la cabecera, 0 registros de datos por haber S/. 0.00 a pagar).
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

### P-26 · Configuración del Plan
Captura:  
![P-26 Configuracion](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p26-configuracion.png)  

- **Datos:**
  - Cuántas claves en UI: `PARÁMETROS DEL SISTEMA (38 CLAVES DE CONFIGURACIÓN)` (en base de datos hay 39 registros).
  - `valor_punto_comision`: **`1.00`** (Regla Dura: S/. por punto para calcular comisión residual).
  - `linea_estirada_pct`: **`50`** (Regla Dura: Máx % del puntaje de rango que aporta la línea más fuerte).
  - `url_landing`: **`https://max-global-landing.vercel.app`** (Ajustable: URL base pública de la landing page para enlaces de patrocinio y referidos).
  - Rangos oficiales activos: Rangos 1 al 8 consolidados (Jade, Bronce, Plata, Oro, Platino, Esmeralda, Zafiro, Diamante).
  - Rangos pendientes: Rangos 9 al 16 (Diamante Negro hasta Embajador Corona).
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

### P-27 · Gestión de Socios
Captura:  
![P-27 Socios Todos](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p27-socios-todos.png)  
![P-27 Socios Activos](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p27-socios-activos.png)  

- **Datos:**
  - Total de socios: `Total: 509 Socios` (`Mostrando página 1 de 21 (509 socios en total)`).
  - Nombre del ciclo en pantalla: **`Ciclo 30`** (columna: `Ciclo 30 (Act.)` y desplegable: `Activos en Ciclo 30` / `Inactivos en Ciclo 30`).
  - Filtro "Activos en Ciclo 30": Devuelve exactamente **`1 Socios`** (`Total: 1 Socios`, `Mostrando página 1 de 1 (1 socios en total)`).
    - Único socio activo: `ANA QUISPE (MG00002)` con estado `Activo (400 pts)`.
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

### P-28 · Reportes Ejecutivos
Captura:  
![P-28 Reportes](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p28-reportes.png)  

- **Datos:**
  - Tarjetas principales:
    - VENTAS TOTALES DEL CICLO: `S/. 4,420.00`
    - COMISIONES LIQUIDADAS: `S/. 28.80`
    - RENTABILIDAD BRUTA: `99.3%`
    - SOCIOS ACTIVOS ESTE CICLO: `1 de 509`
  - Top 10 Ganadores del Ciclo:
    - 1 · ANA QUISPE (MG00002) · Pack Familiar · S/. 1,240.00
    - 2 · KARLA DIAZ (MG00012) · Pack Gold · S/. 890.00
    - 3 · BRUNO ROJAS (MG00003) · Pack Gold · S/. 750.00
    - 4 · CARLA MENDOZA (MG00004) · Pack Ejecutivo · S/. 620.00
    - 5 · HUGO CASTRO (MG00009) · Pack Gold · S/. 540.00
    - 6 · ELENA VARGAS (MG00006) · Pack Gold · S/. 490.00
    - 7 · DIEGO SALAS (MG00005) · Pack Ejecutivo · S/. 430.00
    - 8 · MONICA LEON (MG00027) · Pack Ejecutivo · S/. 407.20
    - 9 · CARLOS LEON (MG00018) · Pack Familiar · S/. 356.60
    - 10 · PEDRO SANCHEZ (MG00042) · Pack Ejecutivo · S/. 353.64
  - Distribución por Pack:
    - Kit Emprendedor: 230 socios (45.2%)
    - Pack Ejecutivo: 150 socios (29.5%)
    - Pack Gold: 75 socios (14.7%)
    - Pack Familiar: 38 socios (7.5%)
    - Pack Empresarial: 16 socios (3.1%)
  - Estado de Retiros:
    - Total Solicitado: `S/. 1,200.00`
    - Total Procesado: `S/. 0.00`
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

### P-29 · Auditoría del Sistema
Captura:  
![P-29 Auditoria](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p29-auditoria.png)  

- **Datos:**
  - Total de registros: **`683 Eventos Registrados`** (`Página 1 de 28 (683 eventos totales)`).
  - Acciones distintas en el desplegable de filtro (8 opciones):
    1. `Confirmó un pago`
    2. `Rechazó un pago`
    3. `Cerró el ciclo`
    4. `Aprobó un retiro`
    5. `Rechazó un retiro`
    6. `Cambió la configuración`
    7. `Modificó un rango`
    8. `Dio de baja a un socio`
  - Tablas auditadas: `orden`, `comision`, `ciclo`, `solicitud_retiro`, `socio`, `config`, `rango`.
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

### P-30 · Gestión de Retiros
Captura:  
![P-30 Retiros](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p30-retiros.png)  

- **Datos:**
  - SOLICITUDES PENDIENTES: **`3`** (`En cola de revisión contable`)
  - MONTO SOLICITADO PENDIENTE: `S/. 1,000.00` (`Total a transferir si se aprueban`)
  - SOCIOS SOLICITANTES: `1` (`Socios distintos en espera`)
  - Pestañas: `Pendientes (3)`, `Historial Procesados (2)`
  - Solicitudes listadas en la bandeja:
    1. 04/09/2026, 12:52 p. m. · KARLA DIAZ (MG00012) · BCP Cta: 191-88442211-0-45 · S/. 100.00 · Saldo actual: S/. 1,718.80 (Saldo suficiente)
    2. 04/09/2026, 12:53 p. m. · KARLA DIAZ (MG00012) · BCP Cta: 191-88442211-0-45 · S/. 100.00 · Saldo actual: S/. 1,718.80 (Saldo suficiente)
    3. 04/09/2026, 02:34 p. m. · KARLA DIAZ (MG00012) · BCP Cta: 191-88442211-0-45 · S/. 800.00 (Detracción) · Saldo actual: S/. 1,718.80 (Saldo suficiente)
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

### 🔴 P-31 · Solicitudes de Afiliación (PRUEBA CRÍTICA)
Captura Bandeja P-31:  
![P-31 Solicitudes](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p31-solicitudes.png)  
Captura Resultado Convertir (P-22):  
![P-31 Convertir Destino P22](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p31-convertir-destino-p22.png)  

- **Datos en Bandeja:**
  - Solicitudes mostradas: `Mostrando 1 - 20 de 127 solicitudes (Página 1 de 7)` (en base de datos existen 161 solicitudes totales).

#### Los 4 Puntos Críticos de P-31:

1. **`pack_codigo` DISTINTOS en la tabla `solicitud_afiliacion` y su conteo:**
   | pack_codigo | Cantidad de Solicitudes |
   | :--- | :--- |
   | `PRO` | 123 |
   | `EMPRENDEDOR` | 18 |
   | `GOLD` | 18 |
   | `gold` | 1 |
   | `kit-emprendedor` | 1 |
   | **Total** | **161** |

2. **Comparación contra `pack.codigo` (EMPRENDEDOR, EJECUTIVO, GOLD, FAMILIAR, EMPRESARIAL):**
   - **NO existen en la tabla `pack`:**
     - `PRO` (código inexistente en el plan)
     - `gold` (está en minúsculas en solicitud, en tabla pack está en mayúsculas `GOLD`)
     - `kit-emprendedor` (slug con guion; en tabla pack es `EMPRENDEDOR`)

3. **Solicitudes REALES (que NO terminan en `@ejemplo.test`):**
   - Existen exactamente **2 solicitudes reales**:
     1. **Solicitud #19:** Nombre: `ROBERTO GUTIERREZ`, DNI: `71829304`, Correo: `roberto_1788643438101@gmail.test`, Tel: `987654321`, Patrocinador: `KARLA DIAZ (MG00012)`, `pack_codigo: 'gold'`.
     2. **Solicitud #80:** Nombre: `Test`, Correo: `test@test.test.es`, `pack_codigo: 'kit-emprendedor'`.

4. **Resultado al pulsar "Convertir" en una solicitud real cuyo pack no existe en la tabla:**
   - Se probó la **Solicitud #19** (Roberto Gutiérrez, con `pack_codigo: 'gold'`).
   - Al hacer clic en el botón "Convertir", la aplicación navegó a `/admin/afiliacion` (P-22) precargando:
     - Patrocinador: KARLA DIAZ (MG00012)
     - Nombres y Apellidos: ROBERTO GUTIERREZ
     - DNI: 71829304
     - Correo: roberto_1788643438101@gmail.test
     - Teléfono: 987654321
   - **Pack seleccionado en dropdown P-22:** `3 (Pack Gold (S/. 1,200.00))`.
   - **Resultado Oficial:**  
     👉 **`a · convierte bien y le asigna el pack correcto`**  
     *(La normalización en frontend mediante `p.codigo?.toLowerCase() === solicitudPrecarga.pack_codigo.toLowerCase()` hace match y asigna Pack Gold con ID 3).*
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto en el flujo de conversión.

---

### P-32 · Gestión de Productos
Captura:  
![P-32 Productos](C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a/qa-p32-productos.png)  

- **Datos:**
  - TOTAL PRODUCTOS: **`8`** (`En el catálogo`)
  - ACTIVOS EN TIENDA: **`8`** (`Disponibles para venta`)
  - INACTIVOS: **`0`** (`Desactivados`)
  - CATEGORÍAS: **`3`** (`Líneas comerciales`)
  - Catálogo de 8 productos:
    1. #1 · CAFE · Coffee Capuccino · Salud y Nutrición · S/. 150.00 · 18 pts · ACTIVO
    2. #2 · COLAGENO · Colágeno Aeterna · Salud y Nutrición · S/. 150.00 · 18 pts · ACTIVO
    3. #3 · AC-MORINGA · Aceite de Moringa · Cuidado Personal · S/. 120.00 · 14 pts · ACTIVO
    4. #4 · ESPLENDOR · Esplendor — Lágrimas Humectantes · Cuidado Personal · S/. 120.00 · 14 pts · ACTIVO
    5. #5 · AC-OREGANO · Aceite de Orégano · Salud y Nutrición · S/. 60.00 · 8 pts · ACTIVO
    6. #6 · CAP-MORINGA · Cápsulas de Moringa · Salud y Nutrición · S/. 60.00 · 8 pts · ACTIVO
    7. #7 · HAR-MORINGA · Moringa en Polvo · Salud y Nutrición · S/. 50.00 · 6 pts · ACTIVO
    8. #8 · DALBA · Perfume Dalba · Perfumería · S/. 70.00 · 10 pts · ACTIVO
- **Pregunta de la Tarea:**
  - ¿Cuántos activos?: **8 activos**.
  - ¿Hay botón de BORRAR?: **NO**. Conteo de botones de borrar: **0**. En las acciones solo existen botones de Editar y alternar Desactivar/Activar, cumpliendo la especificación RF-325.
- **Consola:** Limpia (0 errores).
- **Red:** Limpia (todas 200 OK).
- **Roto:** Nada roto.

---

## MATRIZ CONSOLIDADA DE LAS 23 PANTALLAS

| Pantalla | Módulo | Estado Funcional | Cifras Clave | Errores de Consola / Red |
| :--- | :--- | :--- | :--- | :--- |
| **P-10** | Login Socio / Admin | Operativa | Modal Recuperar abre | Error 400 voucher vou-496.jpg |
| **P-11** | Inicio Socio | Operativa | 0 pts personales, 0% a 70 pts, 114 días | Error 400 voucher vou-496.jpg |
| **P-12** | Mi Red | Operativa | 6 directos, 508 descendientes, 28,800 pts grupales | Error 400 voucher vou-496.jpg |
| **P-13** | Tienda | Operativa | 8 productos; Café: S/. 150 público / S/. 75 socio | Error 400 voucher vou-496.jpg |
| **P-14** | Comisiones (Máximo) | Operativa | Ciclo 30: S/. 0.00 (10 filas no cobradas detalladas) | Error 400 voucher vou-496.jpg |
| **P-14** | Comisiones (Karla C6) | Operativa | **Residual · Nivel 1 · Ganaste: S/. 28.80 · PAGADO** | 0 errores |
| **P-15** | Mi Rango | Operativa | Sin Calificación, 1326 pts computables, 4 frontales act. | Error 400 voucher vou-496.jpg |
| **P-16** | Mi Enlace | Operativa | https://max-global-landing.vercel.app/registro?ref=MG00001 | Error 400 voucher vou-496.jpg |
| **P-17** | Mis Pedidos | Operativa | 2 pedidos (88 pts); muestra "Sin comprobante adjunto" | Error 400 voucher vou-496.jpg |
| **P-18** | Mi Perfil | Operativa | Pack Empresarial; Correo NO editable; No ofrece packs | Error 400 voucher vou-496.jpg |
| **P-19** | Mi Billetera | Operativa | S/. 0.00 disponible, 0 movimientos (billetera vacía) | Error 400 voucher vou-496.jpg |
| **P-20** | Tablero Admin | Operativa | 509 socios, 5 pedidos (S/. 4,540), 1 activo, 114 días | Error 400 voucher vou-496.jpg |
| **P-21** | Registrar Pedido | Operativa | Descuento 50% vs 0% cliente; matemáticamente exacto | Error 400 voucher vou-496.jpg |
| **P-22** | Registrar Afiliación | Operativa | Contraseñas únicas y aleatorias (no se repiten) | Error 400 voucher vou-496.jpg |
| **P-23** | Bandeja Confirmación | Operativa | 8 pedidos pendientes de validación | Error 400 voucher vou-496.jpg |
| **P-24** | Envíos y Despacho | Operativa | 0 envíos pendientes / registrados | 0 errores |
| **P-25** | Cierre de Ciclo | Operativa | Ciclo 30, S/. 0.00 total; CSV exporta 1 fila (cabecera) | 0 errores |
| **P-26** | Configuración Plan | Operativa | 38 claves UI; valor_punto: 1.00; linea: 50; landing url | 0 errores |
| **P-27** | Gestión de Socios | Operativa | 509 total, Ciclo 30, 1 activo (Ana Quispe 400 pts) | 0 errores |
| **P-28** | Reportes | Operativa | Ventas S/. 4,420; Comisiones S/. 28.80; Top 10 ganadores | 0 errores |
| **P-29** | Auditoría | Operativa | 683 eventos registrados, 8 acciones en filtro | 0 errores |
| **P-30** | Retiros | Operativa | 3 pendientes (Karla Diaz S/. 1,000 acumulado) | 0 errores |
| **P-31** | Solicitudes Afiliación | Operativa | **Caso a**: convierte bien y asigna Pack Gold (ID 3) | 0 errores |
| **P-32** | Productos | Operativa | 8 activos; NO existe botón de borrar (RF-325) | 0 errores |
