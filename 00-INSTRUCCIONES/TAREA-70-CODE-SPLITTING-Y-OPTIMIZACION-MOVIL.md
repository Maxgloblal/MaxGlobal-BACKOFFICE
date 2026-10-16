# TAREA-70 · Optimización Móvil y Rendimiento: Code Splitting con React.lazy() y Suspense

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE  
**Gravedad:** 🟡 Reducción drástica del bundle inicial para dispositivos móviles  
**Fecha:** 16 de octubre de 2026  
**Responsable:** Antigravity & Pair Programming con Jack  

---

## 1. Problema Identificado

* **Monolito de JavaScript inicial:** Todas las páginas del sistema (desde P-10 hasta P-32, más de 25 pantallas incluyendo los tableros administrativos pesados, cierres de ciclo, exportadores y motores) se importaban de forma estática y síncrona en `src/App.jsx`.
* **Impacto en Móvil:**
  * El bundle inicial compilado por Vite alcanzaba **998.91 kB** en un único archivo JavaScript (`dist/assets/index-*.js`).
  * Vite arrojaba advertencia de rendimiento: `(!) Some chunks are larger than 500 kB after minification`.
  * Un socio abriendo la app en su teléfono celular se veía forzado a descargar, parsear y compilar cerca de 1 MB de código JavaScript, que incluía pantallas administrativas que nunca utilizaría.

---

## 2. Solución Implementada

### 2.1 Carga Perezosa Dinámica (`React.lazy()`)
En `src/App.jsx`, se convirtieron todas las importaciones estáticas de páginas a importaciones dinámicas bajo demanda:
```javascript
const P10InicioSesion = lazy(() => import('./paginas/P10InicioSesion'));
const P11PanelSocio = lazy(() => import('./paginas/P11PanelSocio'));
const P25CierreCiclo = lazy(() => import('./paginas/P25CierreCiclo'));
// ... y las 26 páginas del sistema
```

### 2.2 Transiciones Suaves con `<Suspense>` y Preservación del Armazón
* Se creó la función envoltorio `suspender(Componente)` con fallback a un componente reactivo `CargandoPantalla`, alineado a las variables y tokens de diseño (`--gold-500`, `--border-subtle`).
* Para las rutas de socio y admin, el `Suspense` vive **dentro** de `<ArmazonSocio>` y `<ArmazonAdmin>`.
* **Beneficio UX:** Al navegar entre pestañas (e.g. de "Inicio" a "Tienda" o "Comisiones"), la barra superior y el menú inferior permanecen fijos sin parpadear ni desmontarse; solo el área de contenido muestra la animación de carga mientras se recibe el chunk correspondiente.

---

## 3. Resultados Medidos

| Métrica | Antes (TAREA-69) | Después (TAREA-70) | Mejora |
| :--- | :--- | :--- | :--- |
| **Bundle Principal (`index-*.js`)** | 998.91 kB | **496.18 kB** | **-50.3%** |
| **Bundle Principal (Gzip)** | 249.81 kB | **143.63 kB** | **-42.5%** |
| **Advertencias de Vite (>500 kB)** | 1 advertencia activa | **0 advertencias** | ✅ **Eliminada** |
| **Página de Login (`P10`)** | 998 kB (todo cargado) | **6.52 kB** (2.41 kB gzip) | **Carga instantánea** |
| **Panel Socio (`P11`)** | 998 kB (todo cargado) | **13.12 kB** (3.83 kB gzip) | **Carga modular** |

---

## 4. Certificación Automatizada y Evidencias

* **Tests Unitarios Vitest:**
  * Archivo nuevo: `src/test/tarea70-code-splitting.test.jsx` (4/4 tests en verde).
  * Suite de consistencia y tareas 68-70: 20/20 tests en verde.
* **Certificación en Navegador Real (Playwright):**
  * Script: `scripts/auditar-code-splitting.mjs`.
  * Navegación en vivo sobre chunks dinámicos:
    * `/login` (chunk P10): resuelto y renderizado.
    * `/socio` (chunk P11): resuelto y renderizado con datos de sesión mockeados.
    * `/admin/cierre` (chunk P25): resuelto y renderizado bajo rol admin.
  * Errores de consola: **0 errores**.
  * Capturas archivadas en artefactos:
    * `tarea70-code-splitting-login.png`
    * `tarea70-code-splitting-socio.png`
    * `tarea70-code-splitting-admin-cierre.png`
* **Compilación de Producción:**
  * `npm run build`: 0 errores en 4.29s. Chunks completamente distribuidos.
