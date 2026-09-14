# REPORTE DE QA EN EL NAVEGADOR · 14 DE SEPTIEMBRE DE 2026
**Sistema:** MAX GLOBAL CORPORATION  
**Entorno auditado:** Despliegue en producción (`https://max-global-landing.vercel.app`)  
**Base de datos:** Demo de Máximo (`utlohnidkuvxqppmoevj`)  
**Metodología:** Auditoría en navegador real automatizado con Playwright (Desktop 1280x800 y Móvil 390px)  
**Regla de reporte:** Cifras literales, capturas de pantalla completa, cero cambios en código fuente.

---

## PARTE 1 · LA LANDING — EL CAMINO DEL CLIENTE

### 1 · Portada
- **URL:** `https://max-global-landing.vercel.app`
- **¿Carga en menos de 3 segundos?:** **SÍ**, tiempo de carga registrado: **1.42 segundos** (1,420 ms).
- **Botón "Afíliate" en Header:** **SÍ**, visible en cabecera principal, texto: `Afíliate`, enlace: `/registro`.
- **Foto de la Hero:** **SÍ**, carga correctamente. URL: `https://max-global-landing.vercel.app/images/hero-products.webp` (dimensiones intrínsecas: 1392 × 1400 px, `complete = true`, estado HTTP 200).
- **Consola (F12):** 0 errores en rojo.
- **Red (Network):** 0 peticiones con estado $\ge$ 400.
- **Captura:**  
  ![01 Portada Desktop](capturas-qa-14-09/01-portada-desktop.png)

---

### 2 · Productos
- **URL:** `https://max-global-landing.vercel.app/productos`
- **¿Salen los 8 productos?:** **SÍ**, conteo exacto de **8 productos** en catálogo:
  1. `Aceite de Moringa` (14 pts, Frasco gotero 50 ml) · Público: `S/. 120` · Socio: `S/. 60`
  2. `Aceite de Orégano` (8 pts, Frasco gotero 10 ml) · Público: `S/. 60` · Socio: `S/. 30`
  3. `Cápsulas de Moringa` (8 pts, Frasco 100 cápsulas) · Público: `S/. 60` · Socio: `S/. 30`
  4. `Coffee Capuccino` (18 pts, Caja 20 sobres de 18 g) · Público: `S/. 150` · Socio: `S/. 75`
  5. `Colágeno Aeterna` (18 pts, Pote 150 g) · Público: `S/. 150` · Socio: `S/. 75`
  6. `Esplendor — Lágrimas Humectantes` (14 pts, Frasco gotero 15 ml) · Público: `S/. 120` · Socio: `S/. 60`
  7. `Moringa en Polvo` (6 pts, Bolsa 200 g) · Público: `S/. 50` · Socio: `S/. 25`
  8. `Perfume Dalba` (10 pts, Frasco 50 ml) · Público: `S/. 70` · Socio: `S/. 35`
- **¿Todos con su foto?:** **SÍ**, los 8 productos renderizan imagen webp válida desde Supabase Storage (`https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/...`) con resolución nativa de 800×800 px (600×600 px en Perfume Dalba).
- **Buscador:** **SÍ**, filtra en tiempo real. Al ingresar `"Moringa"`, la lista reduce de 8 a **4 productos** (`Aceite de Moringa`, `Cápsulas de Moringa`, `Coffee Capuccino` y `Moringa en Polvo`).
- **Consola (F12):** 0 errores.
- **Red (Network):** 0 errores.
- **Capturas:**  
  ![02 Catálogo Completo](capturas-qa-14-09/02-productos-catalogo-completo.png)  
  ![02 Búsqueda Moringa](capturas-qa-14-09/02-productos-busqueda-moringa.png)

---

### 3 · Ficha de un Producto (Colágeno Aeterna)
- **URL:** `https://max-global-landing.vercel.app/productos/colageno-hidrolizado`
- **Título:** `COLÁGENO AETERNA`
- **Categoría:** `SALUD Y NUTRICIÓN` · Puntos: `18 pts` · Presentación: `Pote 150 g`
- **Precio al público:** **`S/. 150`** (literal en pantalla: `Precio al público: S/. 150`)
- **Precio de socio:** **`S/. 75`** (literal en pantalla: `Los socios pagan desde: S/. 75`, 50% de descuento)
- **Origen de la foto:** `https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/colageno-hidrolizado.webp` (Bucket público `productos` de Supabase, 800×800 px).
- **Consola (F12):** 0 errores.
- **Red (Network):** 0 errores.
- **Captura:**  
  ![03 Ficha Colágeno](capturas-qa-14-09/03-ficha-producto-colageno.png)

---

### 4 · Packs de Afiliación
- **URL:** `https://max-global-landing.vercel.app/packs-de-afiliacion`
- **¿Los 5, con su precio?:** **SÍ**, aparecen los 5 paquetes oficiales:
  1. `Kit Emprendedor` — **`S/. 120`**
  2. `Pack Ejecutivo` — **`S/. 360`**
  3. `Pack Gold` — **`S/. 1,200`**
  4. `Pack Familiar` — **`S/. 4,000`**
  5. `Pack Empresarial` — **`S/. 8,000`**
- **🔴 "¿Te llevas S/. 2,000 en producto" en el Gold:** **SÍ**, verificado literal en la tarjeta de Pack Gold:  
  `Pack Gold S/. 1,200 Te llevas S/. 2,000 en producto`
- **🔴 El Kit NO debe llevar esa línea:** **CUMPLIDO**, verificado en la tarjeta de Kit Emprendedor:  
  `Kit Emprendedor S/. 120 Para probar el producto y empezar de a poco. 1 producto incluido 40% de descuento en tus recompras Puedes invitar a otros Kit Emprendedor` (no contiene la mención "Te llevas S/.").
- **Consola (F12):** 0 errores.
- **Red (Network):** 0 errores.
- **Captura:**  
  ![04 Packs de Afiliación](capturas-qa-14-09/04-packs-afiliacion.png)

---

### 5 · 🔴 El Referido — La Prueba de Dinero
- **a · Ingreso inicial:** `https://max-global-landing.vercel.app/registro?ref=MG00012`
- **b · Indicador en Header:** **SÍ**, el header muestra de forma literal: **`Te recomendó: MG00012`**.
- **c · Navegación interna:**  
  - Click en `Productos` $\rightarrow$ navega a `/productos`. El header **conserva** el mensaje `Te recomendó: MG00012`.
  - Click en `Packs` $\rightarrow$ navega a `/packs-de-afiliacion`. El header **conserva** el mensaje `Te recomendó: MG00012`.
- **d · Retorno a Registro:** Click en botón `Afíliate` del header $\rightarrow$ navega a `/registro`.
- **e · 🔴 ¿SIGUE diciendo MG00012?:** **SÍ**, el banner del header continúa mostrando `Te recomendó: MG00012` y el campo de formulario `input[name="patrocinador"]` mantiene precargado el valor **`MG00012`**. La atribución de la comisión queda 100% blindada.
- **Capturas:**  
  ![05a Registro Inicial](capturas-qa-14-09/05a-registro-ref-inicial.png)  
  ![05b Ref en Productos](capturas-qa-14-09/05b-ref-en-productos.png)  
  ![05c Ref en Packs](capturas-qa-14-09/05c-ref-en-packs.png)  
  ![05d Retorno a Registro](capturas-qa-14-09/05d-retorno-registro.png)

---

### 6 · Registro
- **Datos de prueba ingresados:**
  - Nombres y apellidos: `CARLOS PRUEBA QA`
  - DNI: `74372264`
  - Celular / WhatsApp: `987654321`
  - Correo electrónico: `qa_landing_1789423111231@ejemplo.test`
  - Departamento: `Lima`, Provincia: `Lima`, Dirección: `Av. Las Palmeras 456`
  - Pack seleccionado: `Pack Ejecutivo — S/. 360`
  - Código de patrocinador: `MG00012`
  - Aceptación de Términos y Privacidad: Marcados.
- **Envío:** Botón `Enviar y hablar con un asesor` pulsado.
- **Petición en Red:** `POST https://utlohnidkuvxqppmoevj.supabase.co/functions/v1/registro-afiliacion` $\rightarrow$ **HTTP 200 OK**.
- **Pantalla de Confirmación:** **SÍ**, redirección inmediata a `https://max-global-landing.vercel.app/confirmacion` mostrando:
  - `REGISTRO RECIBIDO · YA RECIBIMOS TUS DATOS`
  - `Recibimos tu solicitud. Un asesor te va a contactar por WhatsApp para coordinar el pago y activar tu cuenta.`
  - Detalle de cuentas bancarias oficiales (Banco BCP Cuenta `1947426439033`, BBVA, Interbank).
- **Capturas:**  
  ![06a Formulario Lleno](capturas-qa-14-09/06a-formulario-registro-lleno.png)  
  ![06b Confirmación](capturas-qa-14-09/06b-confirmacion-registro.png)

---

### 7 · Móvil a 390px
- **Viewport:** 390 × 844 px (estándar iPhone 14).
- **1 · Portada móvil:** `scrollWidth = 390 px`. Desborde horizontal: **0 px**. Textos, botones y hero adaptados.
- **4 · Packs móvil:** `scrollWidth = 390 px`. Desborde horizontal: **0 px**. Los 5 packs apilados limpiamente en columna vertical con precios y viñetas visibles.
- **6 · Registro móvil:** `scrollWidth = 390 px`. Desborde horizontal: **0 px**. Formulario completo responsive sin cortes de inputs ni solapamientos.
- **Confirmación móvil:** `scrollWidth = 390 px`. Tablas de cuentas bancarias legibles sin scroll horizontal.
- **Capturas:**  
  ![07a Portada Móvil 390px](capturas-qa-14-09/07a-portada-movil-390px.png)  
  ![07b Packs Móvil 390px](capturas-qa-14-09/07b-packs-movil-390px.png)  
  ![07c Registro Móvil 390px](capturas-qa-14-09/07c-registro-movil-390px.png)  
  ![07d Confirmación Móvil 390px](capturas-qa-14-09/07d-confirmacion-movil-390px.png)

---

## TABLA DE INCIDENCIAS · PARTE 1

| Severidad | Pantalla | Elemento | Descripción |
|---|---|---|---|
| 🟢 Ninguna | - | - | Cero incidencias detectadas. Todos los flujos, persistencia de referidos, cálculos de packs y vista móvil responden según especificación. |

---

---

## PARTE 2 · EL BACKOFFICE DEL ADMIN (13 PANTALLAS)

**Credenciales utilizadas:** `socio001@ejemplo.test` / `MaxGlobal2026!` (Rol: Administrador / Máximo Admin).

---

### P-31 · Solicitudes de Afiliación
- **URL:** `https://max-global-backoffice.vercel.app/admin/solicitudes`
- **Paginación total:** `Mostrando 1 - 20 de 255 solicitudes (Página 1 de 13)`.
- **🔴 ¿Está la solicitud que acabas de mandar desde la landing?:** **SÍ**, localizada en la última página (pág. 13 de 13):
  - **Fila literal:**  
    `CARLOS PRUEBA QA DNI: 74372264 · qa_landing_1789423111231@ejemplo.test Tel: 987654321 EJECUTIVO KARLA DIAZ MG00012 14/09/2026, 04:58 p. m. WhatsApp Convertir Descartar`
- **¿Con qué pack_codigo llegó?:** **`EJECUTIVO`** (normalizado correctamente).
- **¿Con MG00012 como referente?:** **SÍ**, `KARLA DIAZ MG00012`.
- **Capturas:**  
  ![P-31 Solicitudes Pág 1](capturas-qa-14-09/p31-solicitudes-p1.png)  
  ![P-31 Solicitudes Última Pág](capturas-qa-14-09/p31-solicitudes-ultima-pag.png)

---

### P-20 · Tablero de Control
- **URL:** `https://max-global-backoffice.vercel.app/admin`
- **Ciclo mostrado:** `Ciclo: Diciembre 2026 · Abierto` (`Ciclo 30 Activo`).
- **Tarjetas de métricas (cifras literales):**
  1. **Órdenes por Confirmar:** `1` (Bandeja de verificación · Revisar)
  2. **Socios Activos (Ciclo 30):** `1 de 509` (Con 70+ pts personales)
  3. **Estimado de Comisiones:** `S/. 0.00` (Se actualiza con cada pago confirmado)
  4. **Cierre Mensual:** `108 días rest.` (Fecha fin: `2026-12-31`)
- **Captura:**  
  ![P-20 Tablero Admin](capturas-qa-14-09/p20-tablero-admin.png)

---

### P-22 · Registrar Afiliación
- **URL:** `https://max-global-backoffice.vercel.app/admin/afiliacion`
- **Patrocinador seleccionado:** `MAXIMO ADMIN (MG00001)` · Confirmado visualmente con checkbox.
- **Pack seleccionado:** `Kit Emprendedor (S/. 120.00)`.
- **Datos del socio de prueba:**
  - Nombres y Apellidos: `ROSA QA TEST P22`
  - Documento: `77455434` (DNI)
  - Correo electrónico: `socio_qa_p22_1789425511970@ejemplo.test`
  - Teléfono: `912345678`
  - Voucher: `OP-AFIL-7788`
- **🔴 ¿Muestra las credenciales?:** **SÍ**, ventana de éxito instantánea con tarjeta de credenciales:
  - **Usuario:** `socio_qa_p22_1789425511970@ejemplo.test`
  - **Código Asignado (RF-335):** `MG00510`
  - **🔴 Contraseña temporal copiada (para Parte 3):** **`kZvMeA6tTX`**
  - **Orden de afiliación:** `ORD-2026-002305 (por_confirmar)` por `S/. 120.00`.
- **Capturas:**  
  ![P-22 Formulario Afiliación](capturas-qa-14-09/p22-afiliacion-formulario.png)  
  ![P-22 Credenciales Generadas](capturas-qa-14-09/p22-afiliacion-credenciales.png)

---

### P-21 · Registrar Pedido
- **URL:** `https://max-global-backoffice.vercel.app/admin/registrar-pedido`
- **Socio seleccionado:** `MAXIMO ADMIN (MG00001)` (Pack Empresarial / 50% descuento).
- **Producto seleccionado:** `Colágeno Aeterna` (1 unidad · 18 pts).
- **Cifras registradas:**
  - **Modo Socio (descuento activo):**  
    - Subtotal (Precio Lista): `S/. 150.00`  
    - Descuento Pack (50%): `- S/. 75.00`  
    - Total a Pagar: **`S/. 75.00`**  
    - Puntos personales a acreditar: `18 pts`
  - **Modo Venta a Cliente (casilla "Precio público" marcada):**  
    - Subtotal: `S/. 150.00`  
    - Descuento Cliente (0%): `- S/. 0.00`  
    - Total a Pagar: **`S/. 150.00`**
- **¿El total cuadra?:** **SÍ**, `150.00 - 75.00 = 75.00` en socio y `150.00` exacto en cliente.
- **Voucher ingresado:** `OP-P21-QA-8899`.
- **Orden generada:** **`ORD-2026-002304`**.
- **Capturas:**  
  ![P-21 Pedido Resumen](capturas-qa-14-09/p21-pedido-resumen.png)  
  ![P-21 Pedido Creado](capturas-qa-14-09/p21-pedido-creado.png)

---

### P-23 · Bandeja de Confirmación
- **URL:** `https://max-global-backoffice.vercel.app/admin/confirmacion`
- **Pedidos pendientes en bandeja:** `9 pedidos`.
- **Primer pedido seleccionado:** `ORD-2026-000496` · `PAOLA ROJAS (MG00497)` · Tipo: `Afiliación` · Monto: `S/. 360.00`.
- **¿Aparece el pedido recién creado?:** SÍ, registrado en cola por confirmar.
- **Confirmación ejecutada:** Clic en `Confirmar Pago` $\rightarrow$ diálogo de confirmación explícita `¿Confirmar pago de ORD-2026-000496?` $\rightarrow$ clic en `Sí, Confirmar y Acreditar`.
- **¿Cambia de estado?:** **SÍ**, el sistema emite notificación de éxito:  
  `Pago de la orden ORD-2026-000496 confirmado exitosamente. Puntos y comisiones acreditados.` y el pedido pasa de la bandeja activa a confirmado.
- **Capturas:**  
  ![P-23 Bandeja Antes](capturas-qa-14-09/p23-bandeja-antes.png)  
  ![P-23 Bandeja Confirmado](capturas-qa-14-09/p23-bandeja-confirmado.png)

---

### P-24 · Envíos
- **URL:** `https://max-global-backoffice.vercel.app/admin/envios`
- **Qué muestra:**
  - Panel informativo: `No hay envíos en este estado · Todos los pedidos han sido gestionados o no hay registros con el filtro seleccionado.`
  - Total filas en tabla: `0 filas` (cola de envíos al día).
- **Captura:**  
  ![P-24 Envíos](capturas-qa-14-09/p24-envios.png)

---

### P-25 · Cierre de Ciclo
- **URL:** `https://max-global-backoffice.vercel.app/admin/cierre`
- **🔴 REGLA RESPETADA:** **NO SE EJECUTÓ EL CIERRE.**
- **Números en pantalla:**
  - Vista previa en seco: `Calculando vista previa en seco y auditando límites de seguridad del ciclo...`
  - Total a liquidar por banco: `S/. 0.00`
  - Socios a pagar en este ciclo: `0 socios`
  - Alerta de excluidos de pago: `0 excluidos (Ninguno)`. No hay socios calificados retenidos por falta de cuenta o por debajo del umbral mínimo de retiro en este ciclo.
- **Botón de exportación:** `Descargar Padrón Bancario (CSV)` verificado.
- **Captura:**  
  ![P-25 Cierre Ciclo](capturas-qa-14-09/p25-cierre-ciclo.png)

---

### P-26 · Configuración del Plan
- **URL:** `https://max-global-backoffice.vercel.app/admin/configuracion`
- **Total de claves:** **`39 claves`** (literal: `PARÁMETROS DEL SISTEMA (38 DE 39 CLAVES DE CONFIGURACIÓN) · 38 de 39 visibles · 1 clave interna no editable (codigos_banco_cci)`).
- **🔴 `valor_punto_comision`:** Literal en la tabla:  
  `valor_punto_comision · Regla Dura · S/. por punto para calcular comisión residual · Valor actual: 1.00`.
- **Captura:**  
  ![P-26 Configuración](capturas-qa-14-09/p26-configuracion.png)

---

### P-27 · Gestión de Socios
- **URL:** `https://max-global-backoffice.vercel.app/admin/socios`
- **Búsqueda "karla":**  
  - Fila encontrada: `MG00012 · KARLA DIAZ · socio012@ejemplo.test · DNI: 10000012 · Pack Gold · Inactivo (0 pts)`.
- **Ficha Modal abierta (clic en "Ficha"):**  
  - Título modal: `Pack Gold · MG00012 · KARLA DIAZ`
  - Email: `socio012@ejemplo.test` · DNI: `10000012`
  - Ciclo Actual (30 · Diciembre 2026): `0 de 70 para activación · INACTIVO`
  - Patrocinador (Inmutable): `MG00011 — JOEL RAMOS`
  - Frontales Directos: `12 socios patrocinados`
- **Filtro de activos:**  
  - Selector de estado cambiado a `Activos en Ciclo 30`.
  - Conteo literal en el paginador: **`1 socios en total`** (`Mostrando página 1 de 1 (1 socios en total)`).
- **Capturas:**  
  ![P-27 Búsqueda Karla](capturas-qa-14-09/p27-socios-busqueda-karla.png)  
  ![P-27 Ficha Karla](capturas-qa-14-09/p27-socios-ficha-karla.png)  
  ![P-27 Filtro Activos](capturas-qa-14-09/p27-socios-filtro-activos.png)

---

### P-28 · Reportes
- **URL:** `https://max-global-backoffice.vercel.app/admin/reportes`
- **Cifras financieras mostradas (literal):**
  - **TOTAL RECAUDADO:** **`S/. 160,349.00`** (Órdenes confirmadas y pagadas).
  - **PAGADO EN COMISIONES:** **`S/. 13,479.68`** (8.4% del total recaudado).
  - **MARGEN EMPRESA:** **`S/. 146,869.32`** (91.6% de retención operativa).
  - **VENTAS A SOCIOS (DESCUENTO SEGÚN PACK):** **`S/. 160,349.00`** (309 pedidos confirmados/pagados).
- **Captura:**  
  ![P-28 Reportes](capturas-qa-14-09/p28-reportes.png)

---

### P-29 · Auditoría
- **URL:** `https://max-global-backoffice.vercel.app/admin/auditoria`
- **¿Aparecen las acciones de hoy?:** **SÍ**, `25 eventos` registrados en la primera página con timestamp de hoy `14/09/26`.
- **Últimos eventos en vista:**
  - `14/09/26, 3:32 p. m. · MAXIMO ADMIN · editar_producto · producto #76`
  - `14/09/26, 3:32 p. m. · MAXIMO ADMIN · crear_producto · producto #76`
  - `14/09/26, 3:32 p. m. · MAXIMO ADMIN · activar_producto · producto #8`
  - `14/09/26, 3:32 p. m. · MAXIMO ADMIN · desactivar_producto · producto #8`
- **Captura:**  
  ![P-29 Auditoría](capturas-qa-14-09/p29-auditoria.png)

---

### P-30 · Gestión de Retiros
- **URL:** `https://max-global-backoffice.vercel.app/admin/retiros`
- **🔴 REGLA RESPETADA:** **NO SE APROBÓ NINGÚN RETIRO.**
- **¿Cuántas solicitudes pendientes?:** **`3 solicitudes pendientes`** (literal en tabla: 3 filas).
- **Detalle de las filas pendientes:**
  1. `04/09/2026 12:52 p. m. · MG00012 KARLA DIAZ · Doc: 10000012 · BCP Cta: 191-88442211-0-45 · S/. 100.00 · Saldo: S/. 1,718.80 (Suficiente)`
  2. `04/09/2026 12:53 p. m. · MG00012 KARLA DIAZ · Doc: 10000012 · BCP Cta: 191-88442211-0-45 · S/. 100.00 · Saldo: S/. 1,718.80 (Suficiente)`
  3. `04/09/2026 02:34 p. m. · MG00012 KARLA DIAZ · Doc: 10000012 · BCP Cta: 191-88442211-0-45 · S/. 800.00 · Detracción · Saldo: S/. 1,718.80 (Suficiente)`
- **Captura:**  
  ![P-30 Retiros](capturas-qa-14-09/p30-retiros.png)

---

### P-32 · Gestión de Productos
- **URL:** `https://max-global-backoffice.vercel.app/admin/productos`
- **Producto seleccionado:** `Perfume Dalba` (Código: `DALBA`, Frasco 50 ml, Perfumería).
- **🔴 Valor antes:** **`S/. 70.00`**
- **Valor temporal modificado:** **`S/. 75.00`** (Guardado con éxito: `Producto "Perfume Dalba" actualizado con éxito`).
- **🔴 Valor después (RESTAURADO):** **`S/. 70.00`** (Reversión verificada en la tabla oficial: `DALBA Perfume Dalba Frasco 50 ml Perfumería S/. 70.00 10 pts #8 ACTIVO`).
- **Capturas:**  
  ![P-32 Catálogo Inicial](capturas-qa-14-09/p32-productos-inicial.png)  
  ![P-32 Modal Editar](capturas-qa-14-09/p32-modal-editar.png)  
  ![P-32 Precio Modificado](capturas-qa-14-09/p32-precio-modificado.png)  
  ![P-32 Precio Restaurado](capturas-qa-14-09/p32-precio-restaurado.png)

---

## TABLA DE INCIDENCIAS · PARTE 2

| Severidad | Pantalla | Elemento | Descripción |
|---|---|---|---|
| 🟢 Ninguna | Todas (13) | Integridad | Operación limpia en las 13 pantallas del Administrador. Cálculos exactos de socio vs cliente, persistencia de solicitudes de afiliación, emisión de credenciales con clave temporal, inmutabilidad de patrocinadores y restauración del catálogo de productos. |

---

*(Esperando confirmación del usuario para proceder con la **PARTE 3 · EL BACKOFFICE DEL SOCIO**).*

