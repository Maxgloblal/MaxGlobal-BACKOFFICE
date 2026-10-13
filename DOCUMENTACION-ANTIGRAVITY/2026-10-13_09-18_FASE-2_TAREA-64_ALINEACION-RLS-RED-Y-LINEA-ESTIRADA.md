# INFORME TÉCNICO · TAREA-64
**Fecha:** 13 de octubre de 2026 (09:18)  
**Código:** INF-2026-10-13-64  
**Hito:** Alineación RLS Red (RF-221) y Pedagogía Visual de Línea Estirada en P-15 (RF-254 a RF-256)  
**Responsable:** Antigravity AI Agent  
**Ambientes:** Producción (`xkiwnxoferdfapezcwoq`) y Demo (`utlohnidkuvxqppmoevj`)

---

## 1. RESUMEN DE LA INTERVENCIÓN

Atendiendo a las dos observaciones levantadas por Máximo y los socios:
1. **Activación de la Red en P-12 (RF-221):** Los socios veían a su descendencia en estado `🔴 Sin activar` con 0 pts, mientras que en administración salían activos.
2. **Percepción de Confiscación de Puntos en P-15 (RF-254, RF-256):** Los socios observaban alertas rojas de "Tope alcanzado" en todos sus brazos fuertes para el cálculo del rango.

---

## 2. EJECUCIÓN POR BLOQUES

### BLOQUE 1 · ALINEACIÓN DE POLÍTICA RLS EN PRODUCCIÓN (RF-221)
- **Causa raíz:** En la base de datos de producción (`xkiwnxoferdfapezcwoq`), la política `activacion_select` carecía de la relación con `red_ancestro`, restringiendo el acceso únicamente a `(fn_is_admin() OR socio_id = fn_current_socio_id())`.
- **Acción ejecutada:** Se aplicó `ALTER POLICY` en Producción sincronizando la regla con la de DEMO:
  ```sql
  ALTER POLICY "activacion_select" ON public.activacion USING (
      fn_is_admin() 
      OR socio_id = fn_current_socio_id() 
      OR EXISTS (
          SELECT 1 FROM public.red_ancestro ra 
          WHERE ra.ancestro_id = fn_current_socio_id() 
            AND ra.descendiente_id = activacion.socio_id
      )
  );
  ```
- **Salida literal de verificación en Producción:**
  ```json
  [
    {"tablename":"activacion","policyname":"activacion_admin","roles":"{public}","cmd":"ALL","qual":"fn_is_admin()"},
    {"tablename":"activacion","policyname":"activacion_select","roles":"{public}","cmd":"SELECT","qual":"(fn_is_admin() OR (socio_id = fn_current_socio_id()) OR (EXISTS ( SELECT 1\\n   FROM red_ancestro ra\\n  WHERE ((ra.ancestro_id = fn_current_socio_id()) AND (ra.descendiente_id = activacion.socio_id)))))"}
  ]
  ```
- **Resultado:** Cumplimiento estricto de `RF-221` y `TAREA-08:188` bajo Ley N° 29733. Los socios ahora visualizan la activación y puntos de su red en vivo.

---

### BLOQUE 2 · FIDELIDAD AL MAPA VISUAL Y PEDAGOGÍA EN P-15 (RF-254 A RF-256)
- **Causa raíz:** En `src/paginas/P15MiRango.jsx`, cada frontal directo con puntaje superior al 50% de la meta mostraba una alerta punitiva en color de advertencia `⚠️ Tope X pts`, generando la falsa percepción de que se estaban reteniendo o confiscando puntos de la red.
- **Acción ejecutada:**
  1. Se actualizó la columna de la tabla a: `Aporte a la Meta (Máx 50%)`.
  2. Se sustituyó la insignia de alerta punitiva por una insignia positiva verde: `✓ Aporte máx. alcanzado (X pts)`.
  3. Se reformuló el banner informativo superior (`RF-254`):
     > *"Todos los puntos de tu equipo se conservan intactos al 100% en tus **Puntos Grupales**. Para la calificación al rango meta, cada línea frontal aporta hasta un máximo del 50%. De esta manera, el plan de negocio premia el desarrollo armónico y balanceado de tus diferentes equipos de trabajo."*
- **Archivos modificados:** `src/paginas/P15MiRango.jsx`.

---

## 3. AUDITORÍA DE INTEGRIDAD

- **Cero bytes nulos:** Verificado en todo el código fuente de `src/` y `scripts/`.
- **Inmutabilidad contable:** `comision` y `wallet_movimiento` intocados; ciclos históricos preservados al céntimo.
- **Producción:** Ciclo 2 (Octubre 2026) abierto y protegido por guarda de fecha `America/Lima` (RF-508) y cálculo de rangos integrado (RF-451, RF-482).
