# TAREA-69 · Auditoría y Adaptabilidad Responsiva Móvil (390px)

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE  
**Gravedad:** 🟡 Garantía de usabilidad móvil en viewport estándar (iPhone 13 / 390x844)  
**Fecha:** 16 de octubre de 2026  
**Responsable:** Antigravity & Pair Programming con Jack  

---

## 1. Alcance y Metodología de la Auditoría

Se auditó de forma automatizada mediante **Playwright** un total de **16 pantallas** (tanto del módulo de Socio como de Administración) configurando el viewport móvil exacto a **390 x 844 px** (dispositivo móvil de referencia iPhone 12/13/14/15/16 estándar) con `deviceScaleFactor: 2`, `isMobile: true` y `hasTouch: true`.

Para cada pantalla se midió:
1. `document.documentElement.scrollWidth` frente a `window.innerWidth` (390px).
2. Verificación de desborde horizontal (`scrollWidth > 390px`).
3. Detección y bounding box de elementos desbordados.
4. Generación de captura de pantalla visual en alta definición.

---

## 2. Hallazgos y Ajustes Realizados

### 2.1 Desborde Horizontal Global
* **Resultado:** **0 pantallas con desborde horizontal** (`scrollWidth === 390px` en las 16 pantallas analizadas).
* La arquitectura CSS del sistema (`overflow-x: auto` en `.tabla-contenedor`, anchos porcentuales y flexbox) mantiene el layout completamente contenido.

### 2.2 Blindaje de Drawers y Menús Laterales Off-Canvas (`armazon.css`)
* **Problema:** En navegadores Chromium en resoluciones fraccionales o pantallas de alta densidad (DPI), los elementos fijos desplazados fuera de pantalla con `transform: translateX(-100%)` pueden generar 1px de subpixel bleed en el extremo izquierdo o recibir foco accidental.
* **Solución:**
  * En `.armazon-drawer` (Socio): se añadió `visibility: hidden; transition: transform var(--t-normal), visibility var(--t-normal);` y `visibility: visible;` cuando tiene la clase `.abierto`.
  * En `.armazon-admin-sidebar` (Admin móvil/tablet `< 1024px`): se añadió idéntica regla de `visibility: hidden` y `visibility: visible;` cuando está `.abierto`.

### 2.3 Adaptabilidad de la Cabecera de Cierre en Móvil (`P25CierreCiclo.jsx`)
* **Problema:** En pantallas de 390px, el encabezado del panel de vista previa de cierre colocaba el título largo `CIERRE DEL CICLO X · M/AAAA` y el badge `Socios Activos: X de Y` en una sola fila `justifyContent: space-between` sin permitir quiebre de línea fluido.
* **Solución:** Se añadió `flexWrap: 'wrap'` y `gap: 'var(--sp-2)'` en el contenedor para permitir un salto de línea estético y sin colisiones en dispositivos móviles estrechos.

---

## 3. Certificación Automatizada y Evidencias

* **Tests Unitarios Vitest:**
  * Archivo nuevo: `src/test/tarea69-responsivo-movil.test.jsx` (4/4 tests en verde).
* **Script de Auditoría Playwright Móvil:**
  * Script: `scripts/auditar-movil-390px.mjs`.
  * **16 capturas generadas** en el directorio de artefactos:
    * `tarea69-movil-390px-p10.png` (P-10 Login)
    * `tarea69-movil-390px-p11.png` (P-11 Panel Socio)
    * `tarea69-movil-390px-p12.png` (P-12 Mi Red)
    * `tarea69-movil-390px-p13.png` (P-13 Tienda)
    * `tarea69-movil-390px-p14.png` (P-14 Mis Comisiones)
    * `tarea69-movil-390px-p15.png` (P-15 Mi Rango)
    * `tarea69-movil-390px-p16.png` (P-16 Mi Enlace)
    * `tarea69-movil-390px-p17.png` (P-17 Mis Pedidos)
    * `tarea69-movil-390px-p18.png` (P-18 Mi Perfil)
    * `tarea69-movil-390px-p19.png` (P-19 Mi Billetera)
    * `tarea69-movil-390px-p20.png` (P-20 Tablero Admin)
    * `tarea69-movil-390px-p23.png` (P-23 Bandeja Confirmación)
    * `tarea69-movil-390px-p25.png` (P-25 Cierre de Ciclo)
    * `tarea69-movil-390px-p27.png` (P-27 Gestión de Socios)
    * `tarea69-movil-390px-p30.png` (P-30 Gestión de Retiros)
    * `tarea69-movil-390px-p32.png` (P-32 Gestión de Productos)
* **Compilación Vite:**
  * `npm run build`: 0 errores.
