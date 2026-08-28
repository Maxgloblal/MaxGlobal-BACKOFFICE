# INFORME DE AVANCE ANTIGRAVITY
## FASE 2 · ETAPA 1 · TAREA-03B — CORRECCIÓN DE LA RED SIMULADA DE 500 SOCIOS

**Fecha y hora:** 28 de agosto de 2026 — 13:25 (UTC-5)  
**Proyecto:** SISTEMA MOTOR Y BACKOFFICE — MAX GLOBAL  
**Autor:** Antigravity (Advanced Agentic Coding)  
**Semilla determinista:** `20260828`  
**Base de datos / Proyecto Supabase:** `utlohnidkuvxqppmoevj`  
**Directiva de Calidad:** "No parchees con UPDATE. El script es determinista e idempotente: se arregla el generador y se vuelve a correr."

---

### 1. RESUMEN EJECUTIVO DE CORRECCIONES

En esta tarea de corrección (TAREA-03B) se resolvieron los 5 hallazgos observados en la primera siembra:

1. **Profundidad de Red Limitada a Nivel 12:**  
   En la versión previa la red alcanzaba 24 niveles. Se modificó el generador `scripts/sembrar-red.mjs` para limitar estrictamente la profundidad a un máximo de 12 niveles. Si un patrocinador candidato ya se encuentra en nivel 12, se busca un ancestro compatible en nivel < 12 o se conecta al socio raíz (ID 1), garantizando `max(nivel) <= 12`.
2. **Descuentos de Recompra Oficiales:**  
   Se aplicaron los porcentajes oficiales de descuento de recompra por pack:
   - EMPRENDEDOR: 20%
   - EJECUTIVO: 30%
   - GOLD: 35%
   - FAMILIAR: 40%
   - EMPRESARIAL: 45%
3. **Consistencia Estricta de Puntos:**  
   Cada movimiento de puntos en `movimiento_puntos` asociado a una orden (`orden_id`) tiene exactamente el mismo valor que `orden.puntos_total`. Para órdenes pendientes en ciclo 3 (socios 496 a 501), sus movimientos tienen `puntos = 0`, coincidiendo con `orden.puntos_total = 0`.
4. **Consistencia de Activaciones:**  
   La tabla `activacion` (1,503 filas = 501 socios × 3 ciclos) refleja con precisión aritmética la suma de movimientos con `cuenta_activacion = true`. En los 3 ciclos, el porcentaje de socios activos se ubica estrictamente entre 40% y 50% (Ciclo 1: 43.9%, Ciclo 2: 42.7%, Ciclo 3: 47.9%).
5. **Resiembra Limpia y Determinista:**  
   Se truncaron las tablas en orden inverso respetando llaves foráneas y se ejecutó la siembra determinista completa sin parches manuales con `UPDATE`.

---

### 2. AUDITORÍA SQL — LAS 12 CONSULTAS DE VERIFICACIÓN (SALIDAS LITERALES)

A continuación se presentan las 12 consultas SQL ejecutadas de forma directa sobre la base de datos de producción Supabase (`utlohnidkuvxqppmoevj`) junto con sus salidas literales JSON devueltas por el motor:

#### Consulta 1: Conteo de socios por rol
```sql
SELECT rol, count(*) FROM socio GROUP BY rol;
```
**Salida literal:**
```json
[{"rol":"admin","count":1},{"rol":"socio","count":500}]
```

---

#### Consulta 2: Distribución de packs en la red
```sql
SELECT p.codigo, count(*) FROM socio s JOIN pack p ON p.id=s.pack_id GROUP BY 1 ORDER BY 2 DESC;
```
**Salida literal:**
```json
[{"codigo":"EMPRENDEDOR","count":225},{"codigo":"EJECUTIVO","count":150},{"codigo":"GOLD","count":75},{"codigo":"FAMILIAR","count":35},{"codigo":"EMPRESARIAL","count":16}]
```

---

#### Consulta 3: Profundidad máxima en `red_ancestro`
```sql
SELECT max(nivel) FROM red_ancestro;
```
**Salida literal:**
```json
[{"max":12}]
```

---

#### Consulta 4: Violaciones a la regla `solo_afilia_igual`
```sql
SELECT s.id FROM socio s JOIN socio pat ON pat.id=s.patrocinador_id JOIN pack pp ON pp.id=pat.pack_id JOIN pack p ON p.id=s.pack_id WHERE pp.solo_afilia_igual AND p.codigo <> 'EMPRENDEDOR';
```
**Salida literal:**
```json
[]
```
*(0 filas — Ningún socio con pack Emprendedor patrocina a otro pack).*

---

#### Consulta 5: Aritmética de órdenes (`total_cent <> subtotal_cent - descuento_cent`)
```sql
SELECT id, subtotal_cent, descuento_cent, total_cent FROM orden WHERE total_cent <> subtotal_cent - descuento_cent;
```
**Salida literal:**
```json
[]
```
*(0 filas — Cuadre contable de centavos al 100%).*

---

#### Consulta 6: Consistencia de órdenes vs sus detalles
```sql
SELECT o.id FROM orden o JOIN orden_detalle d ON d.orden_id=o.id GROUP BY o.id, o.total_cent, o.subtotal_cent, o.puntos_total HAVING o.total_cent <> sum(d.precio_final_cent*d.cantidad) OR o.subtotal_cent <> sum(d.precio_lista_cent*d.cantidad) OR o.puntos_total <> sum(d.puntos_subtotal);
```
**Salida literal:**
```json
[]
```
*(0 filas — Totales y puntos cuadran exactamente con la suma de líneas).*

---

#### Consulta 7: Consistencia de puntos entre `movimiento_puntos` y `orden`
```sql
SELECT m.id, m.socio_id, m.puntos, o.puntos_total FROM movimiento_puntos m JOIN orden o ON o.id=m.orden_id WHERE m.puntos <> o.puntos_total;
```
**Salida literal:**
```json
[]
```
*(0 filas — Cada movimiento refleja exactamente los puntos de su orden).*

---

#### Consulta 8: Consistencia entre `voucher` y `orden`
```sql
SELECT v.id FROM voucher v JOIN orden o ON o.id=v.orden_id WHERE v.monto_cent <> o.total_cent;
```
**Salida literal:**
```json
[]
```
*(0 filas — Todo voucher coincide en monto exacto con su orden).*

---

#### Consulta 9: Puntos de afiliación con residual indebido
```sql
SELECT id FROM movimiento_puntos WHERE origen='afiliacion' AND cuenta_residual;
```
**Salida literal:**
```json
[]
```
*(0 filas — Ninguna orden de afiliación genera puntos residuales).*

---

#### Consulta 10: Socios huérfanos sin registro en `red_ancestro`
```sql
SELECT s.id FROM socio s WHERE s.patrocinador_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM red_ancestro r WHERE r.descendiente_id=s.id);
```
**Salida literal:**
```json
[]
```
*(0 filas — Todo socio con patrocinador está indexado en el árbol de ancestros).*

---

#### Consulta 11: Discordancias en activación (`puntos_personales` y `activo`)
```sql
SELECT * FROM (SELECT a.socio_id, a.ciclo_id, a.puntos_personales, a.activo, COALESCE(sum(m.puntos) FILTER (WHERE m.cuenta_activacion),0) real FROM activacion a LEFT JOIN movimiento_puntos m ON m.socio_id=a.socio_id AND m.ciclo_id=a.ciclo_id GROUP BY 1,2,3,4) x WHERE puntos_personales <> real OR activo <> (real >= 70);
```
**Salida literal:**
```json
[]
```
*(0 filas — Coincidencia matemática y lógica de activación en los 1,503 registros).*

---

#### Consulta 12: Porcentaje de socios activos por ciclo
```sql
SELECT ciclo_id, count(*) FILTER (WHERE activo) activos, round(100.0*count(*) FILTER (WHERE activo)/count(*),1) pct FROM activacion GROUP BY 1 ORDER BY 1;
```
**Salida literal:**
```json
[{"ciclo_id":1,"activos":220,"pct":"43.9"},{"ciclo_id":2,"activos":214,"pct":"42.7"},{"ciclo_id":3,"activos":240,"pct":"47.9"}]
```
*(Ciclo 1: 43.9%, Ciclo 2: 42.7%, Ciclo 3: 47.9% — Todos dentro del rango esperado de 40% a 50%).*

---

### 3. EJECUCIÓN DE PRUEBAS AUTOMATIZADAS (VITEST)

**Comando:**
```powershell
npx vitest run
```

**Salida literal:**
```
 RUN  v3.2.7 C:/Users/JACK FRANKLIN/Downloads/Win max/SISTEMA-MAX-GLOBAL/SISTEMA MOTOR Y BACKOFFICE

 ✓ src/test/sembrar-red.test.js (19 tests) 98ms
 ✓ src/test/piezas.test.jsx (20 tests) 132ms
 ✓ src/test/pantallas.test.jsx (7 tests) 261ms
 ✓ src/test/base_datos.test.js (20 tests | 1 skipped) 8010ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Conexión y Catálogo > el cliente conecta y puede consultar la tabla config  1550ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Conexión y Catálogo > el Kit Emprendedor tiene su comisión especial cargada (41.7% al nivel 1)  628ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Conexión y Catálogo > los 5 packs existen con sus descuentos de recompra oficiales y NO existe Pack VIP  751ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Pruebas de Seguridad por Fila (RLS) e Inmutabilidad — Intentos de Violación > 4 · Usuario sin sesión intenta insertar una orden -> denegado por RLS  302ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Aislamiento en Vistas (SECURITY INVOKER) > 6 · Ninguna vista en public es SECURITY DEFINER (todas tienen security_invoker = true)  781ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Aislamiento en Vistas (SECURITY INVOKER) > 8 · Usuario sin sesión consultando v_puntos_ciclo ve 0 filas (RLS activo)  309ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Aislamiento en Vistas (SECURITY INVOKER) > 9 · Usuario sin sesión consultando v_frontales_activos ve 0 filas (RLS activo)  599ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Revocación de EXECUTE en Funciones Críticas y Mutables > 10 · Llamada RPC anónima a fn_construir_red_ancestro es rechazada  303ms

 Test Files  4 passed (4)
      Tests  65 passed | 1 todo (66)
   Start at  13:25:14
   Duration  10.55s (transform 370ms, setup 1.03s, collect 1.34s, tests 8.50s, environment 5.97s, prepare 951ms)
```

---

### 4. COMPILACIÓN DE PRODUCCIÓN (VITE BUILD)

**Comando:**
```powershell
npm run build
```

**Salida literal:**
```
> sistema-motor-y-backoffice@1.0.0 build
> vite build

vite v6.4.3 building for production...
transforming...
✓ 1853 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.59 kB │ gzip:  0.37 kB
dist/assets/index-DfAPd1i4.css   28.86 kB │ gzip:  5.64 kB
dist/assets/index-BoLI5mfC.js   317.67 kB │ gzip: 92.12 kB
✓ built in 2.86s
```

---

### 5. CONCLUSIÓN Y ESTADO PARA LA SIGUIENTE TAREA

La red simulada en Supabase cumple con el 100% de los requisitos estructurales, matemáticos y de seguridad:
- 501 socios vinculados deterministicamente sin huérfanos.
- Profundidad máxima verificada de 12 niveles.
- Puntos, órdenes, detalles y vouchers completamente consistentes.
- Tablas listas y en estado óptimo para la **TAREA-04: Motor de Comisiones Uninivel y Rangos**.
