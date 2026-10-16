# TAREA-67 · Guardas del Cierre de Ciclo en Postgres (RF-371 y RF-376)

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE  
**Gravedad:** 🔴 PROTECCIÓN FINANCIERA INMUTABLE DEL CIERRE CONTABLE  
**Fecha:** 16 de octubre de 2026  
**Depende de:** TAREA-62 ✅, TAREA-63 ✅, TAREA-66 ✅  

---

## 1. ANTECEDENTES Y DIAGNÓSTICO DE VULNERABILIDAD

1. **La Red de Seguridad vivía en el Navegador:**
   * En `src/servicios/operacionAdmin.js:453` (`obtenerVerificacionesPreviasCierre`) y `:736` (`evaluarTechosCierre`), el sistema comprueba:
     a) Si existen pedidos en estado `'por_confirmar'`.
     b) Si las comisiones calculadas (Patrocinio, Residual, Rango) exceden sus techos matemáticos teóricos.
   * **Problema Crítico:** Estas comprobaciones existían **únicamente en el código JavaScript de la pantalla P-25**.
2. **Postgres ejecutaba a ciegas:**
   * La función `public.fn_ejecutar_cierre_ciclo` solo verificaba si quien llamaba era admin y si la fecha de hoy no era anterior a `fecha_fin`.
   * **Consecuencia:** Si el administrador cerraba el ciclo directamente o si se llamaba a través de un cron/script automático (TAREA-61), el cierre no comprobaba pedidos pendientes ni techos financieros, repartiendo dinero a las billeteras sin su última red de seguridad.
   * Si quedaban órdenes en `por_confirmar`, los socios afectados terminaban el mes como "inactivos", perdiendo sus puntos y anulando sus comisiones sin derecho a reclamo.

---

## 2. REQUISITOS DEL SISTEMA (RF)

```
   RF-371 · El sistema DEBE verificar previamente si hay pedidos sin confirmar y bloquear el cierre
   RF-372 · El sistema DEBE verificar que no existan rangos activos sin definir
   RF-376 · El sistema DEBE bloquear el cierre si el total excede el porcentaje comprometido (techo recaudado)
   RF-484 · El cierre DEBE verificar en base de datos que lo pagado no exceda el porcentaje comprometido
   RF-485 · Si lo excede, el cierre DEBE bloquearse por excepción SQL transaccional
```

---

## 3. ESPECIFICACIÓN MATEMÁTICA Y REGLAS DE BLOQUEO

### Guarda 1: Pedidos por confirmar (RF-371)
* Si `SELECT COUNT(*) FROM public.orden WHERE ciclo_id = p_ciclo_id AND estado = 'por_confirmar'` es $> 0$ y `p_forzar = false`:
  $$\text{Bloqueo:} \quad \text{RAISE EXCEPTION 'No se puede cerrar el ciclo: existen % pedidos pendientes de confirmación...'}$$

### Guarda 2: Techo Teórico de Patrocinio (RF-376)
* Para cada orden de afiliación confirmada/pagada en el ciclo:
  * Si es Kit Emprendedor $\rightarrow 41.7\%$
  * Si es otro Pack $\rightarrow 30.8\%$
* Si el total de comisiones de patrocinio del ciclo supera este techo teórico:
  $$\text{Bloqueo:} \quad \text{RAISE EXCEPTION 'Bloqueo RF-376: Bono de patrocinio excede el techo teórico...'}$$

### Guarda 3: Techo Teórico Residual (RF-376)
* Para cada orden de recompra confirmada/pagada en el ciclo:
  * Techo $= \text{puntos\_total} \times 100 \times 97\%$
* Si el total de comisiones residuales del ciclo supera este techo:
  $$\text{Bloqueo:} \quad \text{RAISE EXCEPTION 'Bloqueo RF-376: Bono residual excede el techo teórico...'}$$

### Guarda 4: Techo Teórico de Rangos (RF-376)
* La suma de los bonos nominales de los rangos calificados del ciclo:
  $$\text{Techo Rango} = \sum \text{bono\_cent}(\text{calificados})$$
* Si las comisiones generadas de tipo `'rango'` superan este monto:
  $$\text{Bloqueo:} \quad \text{RAISE EXCEPTION 'Bloqueo RF-376: Bono de rango excede el total calificado...'}$$

---

## 4. PLAN DE EJECUCIÓN POR FASES

### Fase 1: Normativa y Documentación (DOCS)
* Actualizar [10-RF-PANEL-ADMIN.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/03-SISTEMA/10-RF-PANEL-ADMIN.md) y [11-RF-MOTOR-Y-SISTEMA.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md).

### Fase 2: Pruebas Unitarias de Guardas
* Crear `src/test/guardas-cierre.test.js` con casos de prueba para cada una de las guardas de seguridad y el parámetro `p_forzar`.

### Fase 3: Implementación en Postgres RPC
* Reemplazar `public.fn_ejecutar_cierre_ciclo(p_ciclo_id bigint, p_admin_id bigint, p_forzar boolean DEFAULT false)` con las guardas transaccionales integradas.
* Desplegar en **Producción** (`xkiwnxoferdfapezcwoq`) y **Demo** (`utlohnidkuvxqppmoevj`).
* Sincronizar `supabase/instalador/02-funciones.sql`.

### Fase 4: Frontend y Servicio Admin
* Actualizar `src/servicios/operacionAdmin.js` y `src/paginas/P25CierreCiclo.jsx` para reportar y manejar limpiamente los mensajes devueltos por Postgres.

### Fase 5: Certificación Visual Playwright y Build
* Probar en navegador automatizado P-25 con Playwright.
* Compilación `npm run build` limpia (0 errores).
