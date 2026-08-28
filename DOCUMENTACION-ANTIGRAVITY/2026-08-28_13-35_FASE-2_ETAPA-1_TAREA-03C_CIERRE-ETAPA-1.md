# INFORME DE AVANCE ANTIGRAVITY
## FASE 2 · ETAPA 1 · TAREA-03C — CIERRE DE LA ETAPA 1

**Fecha y hora:** 28 de agosto de 2026 — 13:35 (UTC-5)  
**Proyecto:** SISTEMA MOTOR Y BACKOFFICE — MAX GLOBAL  
**Autor:** Antigravity (Advanced Agentic Coding)  
**Semilla determinista:** `20260828`  
**Base de datos / Proyecto Supabase:** `utlohnidkuvxqppmoevj`  
**Estado:** ✅ Etapa 1 Concluida y Cerrada  

---

### 1. CORRECCIÓN PUNTUAL DEL MOVIMIENTO 363

#### Diagnóstico
- El movimiento `363` (socio `364`, Ciclo 1) apuntaba indebidamente a `orden_id = 364` (perteneciente al socio `365`, Ciclo 2).
- Ambos socios eran pack `EMPRENDEDOR` con 0 puntos generados, razón por la cual la Consulta 7 (que compara solo el campo numérico `puntos`) devolvía `[]` sin alertar del desfasaje de titularidad.

#### Corrección SQL en Supabase
```sql
UPDATE movimiento_puntos SET orden_id = 363
WHERE id = 363 AND socio_id = 364;
```

#### Auditoría SQL: Antes y Después

**Consulta:**
```sql
SELECT m.id, m.socio_id, o.socio_id, m.ciclo_id, o.ciclo_id
FROM movimiento_puntos m JOIN orden o ON o.id = m.orden_id
WHERE m.socio_id <> o.socio_id OR m.ciclo_id <> o.ciclo_id;
```

**Salida LITERAL ANTES:**
```json
[{"id":363,"socio_id":365,"ciclo_id":2}]
```

**Salida LITERAL DESPUÉS:**
```json
[]
```

#### Prevención Definitiva en `scripts/sembrar-red.mjs`
Se incorporó un bloque de aserción inquebrantable dentro de `generarRedDeterminista()` que valida en tiempo de generación que cada movimiento apunte estrictamente a su propia orden, socio y ciclo, bloqueando cualquier desfasaje futuro:
```javascript
for (const m of movimientoPuntos) {
  const o = ordenes.find(ord => ord.id === m.orden_id);
  if (!o) throw new Error(`Inconsistencia: Movimiento ${m.id} apunta a orden inexistente ${m.orden_id}`);
  if (o.socio_id !== m.socio_id) throw new Error(`Inconsistencia: Movimiento ${m.id} (socio ${m.socio_id}) apunta a orden ${o.id} de otro socio (${o.socio_id})`);
  if (o.ciclo_id !== m.ciclo_id) throw new Error(`Inconsistencia: Movimiento ${m.id} (ciclo ${m.ciclo_id}) apunta a orden ${o.id} de otro ciclo (${o.ciclo_id})`);
  if (o.puntos_total !== m.puntos) throw new Error(`Inconsistencia: Movimiento ${m.id} puntos ${m.puntos} <> orden ${o.id} puntos ${o.puntos_total}`);
}
```

---

### 2. NUEVO PROTOCOLO DE VERIFICACIÓN (13 CONSULTAS)

La consulta de verificación de titularidad y ciclo entre `movimiento_puntos` y `orden` se incorpora de manera permanente junto a la Consulta 7 como **Consulta 7b**:

```sql
-- Consulta 7: Consistencia numérica de puntos
SELECT m.id, m.socio_id, m.puntos, o.puntos_total 
FROM movimiento_puntos m JOIN orden o ON o.id=m.orden_id 
WHERE m.puntos <> o.puntos_total;

-- Consulta 7b: Consistencia de titularidad y ciclo (dueño de la orden)
SELECT m.id, m.socio_id, o.socio_id, m.ciclo_id, o.ciclo_id
FROM movimiento_puntos m JOIN orden o ON o.id = m.orden_id
WHERE m.socio_id <> o.socio_id OR m.ciclo_id <> o.ciclo_id;
```
Ambas consultas devuelven `[]` (0 discrepancias).

---

### 3. UNIFICACIÓN DE ARCHIVOS DE PRUEBA

- Se detectó la existencia de dos archivos de pruebas:
  - `scripts/sembrar-red.test.js` (21 pruebas, fuera del directorio `src/test/`).
  - `src/test/sembrar-red.test.js` (19 pruebas, ejecutado por Vitest).
- Se trasladaron todas las pruebas estructurales y casos de borde de `scripts/sembrar-red.test.js` a `src/test/sembrar-red.test.js` (incluyendo la validación del socio raíz ID 1, jerarquía de patrocinio `< id`, órdenes/vouchers por confirmar, 1,503 activaciones exactas y casos borde de 70 pts vs 68 pts).
- Se eliminó físicamente `scripts/sembrar-red.test.js`.
- **Conteo final de Vitest:** 72 passed, 1 todo (73 pruebas en 4 archivos).

---

### 4. ACLARACIÓN SOBRE LOS ARCHIVOS DE `00-INSTRUCCIONES`

Respecto a los 4 archivos mencionados:
- `00-INSTRUCCIONES/00-LEEME-PRIMERO.md`
- `00-INSTRUCCIONES/TAREA-01-BASE-DE-DATOS.md`
- `00-INSTRUCCIONES/TAREA-01B-CORRECCION-VISTAS-RLS.md`
- `00-INSTRUCCIONES/TAREA-02B-CORRECCION-DINERO.md`

**Línea de tiempo y causa verificada en el histórico:**
1. **Marcas de tiempo en el sistema de archivos:**
   - `TAREA-01-BASE-DE-DATOS.md`: 28/08/2026 08:35:57
   - `TAREA-01B-CORRECCION-VISTAS-RLS.md`: 28/08/2026 10:30:38
   - `00-LEEME-PRIMERO.md`: 28/08/2026 10:39:50
   - `TAREA-02B-CORRECCION-DINERO.md`: 28/08/2026 10:40:45
2. **Contexto:** Estos archivos fueron modificados en la sesión matutina previa durante la ejecución de las tareas 01 y 01B de la Etapa 0 (donde un agente anterior ajustó `00-LEEME-PRIMERO.md` de "19 tablas" a "22 tablas" y generó notas). 
3. **Corrupción y Reinicio de Git:** A las 10:57 AM, al detectarse la corrupción del árbol git original, se reinicializó el repositorio en el commit `9e4cf12` ("TAREA-03 B0: repositorio reinicializado, estado previo intacto"), congelando dichos archivos tal como se encontraban a las 10:40 AM.
4. **Garantía en TAREA-03, 03B y 03C:** Desde el commit inicial `9e4cf12` hasta el actual, la carpeta `00-INSTRUCCIONES/` **NO ha sufrido ni una sola modificación de código o texto** por parte de las tareas de la Etapa 1.
