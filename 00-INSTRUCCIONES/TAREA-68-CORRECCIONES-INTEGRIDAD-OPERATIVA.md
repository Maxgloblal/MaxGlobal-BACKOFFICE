# TAREA-68 · Correcciones de Integridad Operativa, Dominio Oficial y Aislamiento de Servicios

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE  
**Gravedad:** 🔴 Dominio oficial en enlaces de patrocinio y blindaje contra bases erróneas  
**Fecha:** 16 de octubre de 2026  
**Responsable:** Antigravity & Pair Programming con Jack  

---

## 1. Problemas Identificados y Corregidos

### 1.1 `config.url_landing` apuntaba a Vercel en DEMO y PRODUCCIÓN
* **Problema:** En ambas bases de datos (`xkiwnxoferdfapezcwoq` y `utlohnidkuvxqppmoevj`), la clave `url_landing` contenía `https://max-global-landing.vercel.app`.
* **Impacto:** En **P-16 (Mi Enlace de Patrocinio)**, los socios generaban y compartían en WhatsApp enlaces hacia el subdominio de Vercel en lugar del dominio oficial `https://maxglobaloficial.com`.
* **Solución:**
  * Actualizado en producción y demo: `UPDATE config SET valor = 'https://maxglobaloficial.com' WHERE clave = 'url_landing';`
  * Actualizado en el instalador semilla: `supabase/instalador/06-semilla.sql:121`.

### 1.2 Fallback silencioso a la DEMO en `supabaseClient.js`
* **Problema:** `src/lib/supabaseClient.js` caía por defecto a la base DEMO (`utlohnidkuvxqppmoevj`) si faltaban las variables `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`, advirtiendo solo con un `console.warn`.
* **Impacto:** Riesgo de operar silenciosamente contra la base de datos equivocada.
* **Solución:** Se eliminó el fallback a la URL de demo. Ahora arroja un `Error` explícito e inequívoco en tiempo de carga si no se configuran las variables de entorno, igualando la rigurosidad de la landing page.

### 1.3 Infracción de arquitectura de capas en `P17MisPedidos.jsx`
* **Problema:** `P17MisPedidos.jsx:219` ejecutaba directamente `supabase.from('producto').select('id, codigo, imagen_url')`, rompiendo la regla transversal del proyecto ("las pantallas nunca llaman a Supabase directamente").
* **Impacto:** Acoplamiento indebido de la vista a la base de datos.
* **Solución:** Se creó la función `obtenerMapaFotosProductos` en `src/servicios/socio.js` y se eliminó la importación directa de `supabase` en `P17MisPedidos.jsx`.

### 1.4 Prop huérfana `claveId` en `P31SolicitudesAfiliacion.jsx`
* **Problema:** En la línea 342 de `P31SolicitudesAfiliacion.jsx` se pasaba `claveId="id"` a `<Tabla>`, propiedad no soportada por el componente.
* **Solución:** Limpieza de la propiedad para mantener la firma limpia.

---

## 2. Certificación Automatizada y Evidencias

* **Tests Unitarios Vitest:**
  * Archivo nuevo: `src/test/tarea68-integridad-operativa.test.js` (4/4 tests en verde).
  * Suite completa: 52/52 archivos de prueba en verde (493 tests pasando, 0 fallos).
* **Compilación Vite:**
  * `npm run build`: 0 errores, tiempo de compilación 3.98s.
* **Playwright E2E Visual:**
  * `scripts/capturar-tarea68.mjs` ejecutado.
  * Captura P-16: `tarea68-p16-enlace-oficial.png` (enlace oficial verificado: `https://maxglobaloficial.com/registro?ref=MG00002`).
  * Captura P-17: `tarea68-p17-mis-pedidos-servicios.png` (pedidos y fotos cargadas mediante el nuevo servicio).
