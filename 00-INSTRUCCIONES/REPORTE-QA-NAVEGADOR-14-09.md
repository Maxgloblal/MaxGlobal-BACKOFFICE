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

*(Esperando confirmación del usuario para proceder con la **PARTE 2 · EL BACKOFFICE DEL ADMIN**).*
