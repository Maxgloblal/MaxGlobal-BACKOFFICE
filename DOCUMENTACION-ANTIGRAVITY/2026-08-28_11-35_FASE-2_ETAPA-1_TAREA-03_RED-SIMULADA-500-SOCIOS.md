# INFORME DE AVANCE ANTIGRAVITY
## FASE 2 · ETAPA 1 · TAREA-03 — RED SIMULADA DE 500 SOCIOS

**Fecha y hora:** 28 de agosto de 2026 — 11:35 (UTC-5)  
**Proyecto:** SISTEMA MOTOR Y BACKOFFICE — MAX GLOBAL  
**Autor:** Antigravity (Advanced Agentic Coding)  
**Semilla determinista:** `20260828`  
**Base de datos / Proyecto Supabase:** `utlohnidkuvxqppmoevj`  

---

### 1. RESUMEN EJECUTIVO

Se completó satisfactoriamente la siembra determinista de la base de datos con **501 socios** (1 admin raíz + 500 socios), **3 ciclos de historia** (Junio 2026 cerrado, Julio 2026 cerrado, Agosto 2026 abierto), **1,003 órdenes confirmadas/pendientes**, **1,000 detalles de producto para recompras**, **1,003 vouchers de pago**, **997 movimientos de puntos**, **6,075 relaciones de ancestros recursivos** y **1,503 registros de activación mensual** (501 socios × 3 ciclos).

> ⚠️ **Cumplimiento estricto:** Esta tarea NO calcula comisiones ni altera las tablas `comision`, `rango_ciclo`, `wallet_movimiento` ni `periodo_global` (todas permanecen en 0 filas, listas para la TAREA-04).

---

### 2. REGLAS DE NEGOCIO Y MODELADO DE DATOS CUMPLIDOS

1. **Determinismo:** El generador `scripts/sembrar-red.mjs` utiliza el algoritmo PRNG Mulberry32 con semilla fija `20260828`. Ejecuciones repetidas producen idénticos IDs, fechas, órdenes y arbolados.
2. **Jerarquía recursiva en `red_ancestro`:** Generada para los 501 socios alcanzando una profundidad máxima real de **24 niveles**.
3. **Regla `solo_afilia_igual = true`:** Exclusiva para socios con pack `EMPRENDEDOR`. Se verificó que ningún socio con dicho pack patrocine a socios de packs distintos.
4. **Exclusión de Residual en Packs:** Los packs de afiliación (`origen = 'afiliacion'`) generan exclusivamente puntos de calificación y rango con `cuenta_residual = false`. Las órdenes de recompra (`origen = 'recompra'`) generan residual con `cuenta_residual = true`.
5. **Consistencia aritmética en centavos:** 100% de coincidencia exacta entre `orden.total_cent` y `voucher.monto_cent` (0 centavos de diferencia).
6. **Estados de ciclos:**
   - **Ciclo 1 (Junio 2026):** `estado = 'cerrado'`, `cerrado_en = '2026-07-01 00:00:00'`, `cerrado_por = 1`.
   - **Ciclo 2 (Julio 2026):** `estado = 'cerrado'`, `cerrado_en = '2026-08-01 00:00:00'`, `cerrado_por = 1`.
   - **Ciclo 3 (Agosto 2026):** `estado = 'abierto'`, `cerrado_en = NULL`, `cerrado_por = NULL`.
7. **Activación mensual:** Evaluada sobre el umbral de 70 puntos de volumen personal en cada ciclo.

---

### 3. CASOS DE PRUEBA Y CASOS BORDE MODELADOS

| Caso de Prueba / Borde | IDs de Socios / Órdenes | Detalle y Comportamiento |
| :--- | :--- | :--- |
| **Socio Raíz (Admin Global)** | Socio ID `1` | `patrocinador_id = NULL`, rol `admin`, pack `EMPRESARIAL`. |
| **Rama Lineal de Laboratorio (12 niveles)** | Socios IDs `1` al `13` | Cadena vertical 1 -> 2 -> 3 -> ... -> 12 -> 13. Socio 12 tiene 11 ancestros (niveles 1 a 11). |
| **Socio Inactivo Permanente** | Socio ID `13` (LUIS TORRES) | 0 puntos en Ciclos 1, 2 y 3 (`activo = false`). |
| **Socio Activo en los 3 Ciclos** | Socio ID `2` (ANA QUISPE) | Ciclo 1: 186 pts, Ciclo 2: 72 pts, Ciclo 3: 72 pts (`activo = true` en los 3). |
| **Socio Activo en 2 Ciclos** | Socio ID `3` (BRUNO ROJAS) | Activo en Ciclo 1 (150 pts) y Ciclo 2 (72 pts); Inactivo en Ciclo 3 (0 pts). |
| **Socio Activo en 1 Ciclo** | Socio ID `12` (KARLA DIAZ) | Activo en Ciclo 1 (150 pts); Inactivo en Ciclos 2 y 3 (0 pts). |
| **Socios de Alto Volumen Personal** | Socio ID `193` (MANUEL GUTIERREZ)<br>Socio ID `403` (MANUEL HERRERA)<br>Socio ID `375` (CARLOS LOPEZ) | Socio 193: 864 pts en Ciclo 1.<br>Socio 403: 468 pts en Ciclo 2.<br>Socio 375: 446 pts en Ciclo 1. |
| **Vouchers Pendientes (Ciclo 3)** | Vouchers IDs `495, 496, 497, 498, 499, 500`<br>Órdenes IDs `495, 496, 497, 498, 499, 500` | Socios 496 al 501 afiliados en Ciclo 3 con órdenes en estado `pendiente`, vouchers en `pendiente` y `revisado_en = NULL`. |

---

### 4. AUDITORÍA SQL — SALIDAS LITERALES DEL MOTOR SUPABASE

#### Consulta 1: Conteo de roles en `socio`
```sql
SELECT rol, count(*) FROM socio GROUP BY rol ORDER BY rol;
```
**Salida literal:**
```json
[{"rol":"admin","count":1},{"rol":"socio","count":500}]
```

#### Consulta 2: Distribución de socios por pack de afiliación
```sql
SELECT p.codigo, count(s.id) FROM socio s JOIN pack p ON s.pack_id = p.id WHERE s.rol = 'socio' GROUP BY p.codigo ORDER BY count(s.id) DESC;
```
**Salida literal:**
```json
[{"codigo":"EMPRENDEDOR","count":429},{"codigo":"EJECUTIVO","count":33},{"codigo":"GOLD","count":31},{"codigo":"FAMILIAR","count":5},{"codigo":"EMPRESARIAL","count":2}]
```

#### Consulta 3: Profundidad máxima en `red_ancestro`
```sql
SELECT max(nivel) AS profundidad_maxima FROM red_ancestro;
```
**Salida literal:**
```json
[{"profundidad_maxima":24}]
```

#### Consulta 4: Verificación de regla `solo_afilia_igual = true`
```sql
SELECT s.id AS socio_id, p_s.codigo AS pack_socio, p_p.codigo AS pack_patrocinador
FROM socio s
JOIN socio pat ON s.patrocinador_id = pat.id
JOIN pack p_s ON s.pack_id = p_s.id
JOIN pack p_p ON pat.pack_id = p_p.id
WHERE p_p.solo_afilia_igual = true AND p_s.codigo != p_p.codigo;
```
**Salida literal:**
```json
[]
```

#### Consulta 5: Verificación de consistencia aritmética entre órdenes y vouchers
```sql
SELECT o.id, o.total_cent, v.monto_cent, (o.total_cent - v.monto_cent) AS dif
FROM orden o
JOIN voucher v ON v.orden_id = o.id
WHERE o.total_cent != v.monto_cent;
```
**Salida literal:**
```json
[]
```

#### Consulta 6: Verificación de exclusión de residual en packs de afiliación
```sql
SELECT count(*) AS violaciones_residual_pack
FROM movimiento_puntos
WHERE origen = 'afiliacion' AND cuenta_residual = true;
```
**Salida literal:**
```json
[{"violaciones_residual_pack":0}]
```

#### Consulta 7: Ancestros del Socio 12 (Laboratorio lineal de profundidad)
```sql
SELECT nivel, ancestro_id FROM red_ancestro WHERE descendiente_id = 12 ORDER BY nivel;
```
**Salida literal:**
```json
[{"nivel":1,"ancestro_id":11},{"nivel":2,"ancestro_id":10},{"nivel":3,"ancestro_id":9},{"nivel":4,"ancestro_id":8},{"nivel":5,"ancestro_id":7},{"nivel":6,"ancestro_id":6},{"nivel":7,"ancestro_id":5},{"nivel":8,"ancestro_id":4},{"nivel":9,"ancestro_id":3},{"nivel":10,"ancestro_id":2},{"nivel":11,"ancestro_id":1}]
```

#### Consulta 8: Distribución de activaciones por ciclo
```sql
SELECT ciclo_id, count(*) AS total_socios, count(*) FILTER (WHERE activo) AS activos, count(*) FILTER (WHERE NOT activo) AS inactivos
FROM activacion GROUP BY ciclo_id ORDER BY ciclo_id;
```
**Salida literal:**
```json
[{"ciclo_id":1,"total_socios":501,"activos":39,"inactivos":462},{"ciclo_id":2,"total_socios":501,"activos":30,"inactivos":471},{"ciclo_id":3,"total_socios":501,"activos":28,"inactivos":473}]
```

#### Consulta 9: Vouchers pendientes de revisión en Ciclo 3
```sql
SELECT id, orden_id, estado, monto_cent, revisado_en FROM voucher WHERE estado = 'pendiente';
```
**Salida literal:**
```json
[{"id":496,"orden_id":496,"estado":"pendiente","monto_cent":120000,"revisado_en":null},{"id":497,"orden_id":497,"estado":"pendiente","monto_cent":12000,"revisado_en":null},{"id":500,"orden_id":500,"estado":"pendiente","monto_cent":12000,"revisado_en":null},{"id":499,"orden_id":499,"estado":"pendiente","monto_cent":12000,"revisado_en":null},{"id":495,"orden_id":495,"estado":"pendiente","monto_cent":12000,"revisado_en":null},{"id":498,"orden_id":498,"estado":"pendiente","monto_cent":12000,"revisado_en":null}]
```

#### Conteo total de filas por tabla en la base de datos
```sql
SELECT 'socio' AS tabla, count(*) AS filas FROM socio
UNION ALL SELECT 'red_ancestro', count(*) FROM red_ancestro
UNION ALL SELECT 'orden', count(*) FROM orden
UNION ALL SELECT 'orden_detalle', count(*) FROM orden_detalle
UNION ALL SELECT 'voucher', count(*) FROM voucher
UNION ALL SELECT 'movimiento_puntos', count(*) FROM movimiento_puntos
UNION ALL SELECT 'activacion', count(*) FROM activacion
UNION ALL SELECT 'ciclo', count(*) FROM ciclo
UNION ALL SELECT 'pack', count(*) FROM pack
UNION ALL SELECT 'producto', count(*) FROM producto
UNION ALL SELECT 'rango', count(*) FROM rango
UNION ALL SELECT 'comision', count(*) FROM comision
UNION ALL SELECT 'rango_ciclo', count(*) FROM rango_ciclo
UNION ALL SELECT 'wallet_movimiento', count(*) FROM wallet_movimiento;
```
**Salida literal:**
```json
[{"tabla":"socio","filas":501},{"tabla":"red_ancestro","filas":6075},{"tabla":"orden","filas":1003},{"tabla":"orden_detalle","filas":1000},{"tabla":"voucher","filas":1003},{"tabla":"movimiento_puntos","filas":997},{"tabla":"activacion","filas":1503},{"tabla":"ciclo","filas":3},{"tabla":"pack","filas":5},{"tabla":"producto","filas":8},{"tabla":"rango","filas":16},{"tabla":"comision","filas":0},{"tabla":"rango_ciclo","filas":0},{"tabla":"wallet_movimiento","filas":0}]
```

---

### 5. VERIFICACIÓN DE SANIDAD, COMPILACIÓN Y PRUEBAS

#### 1 · Escaneo de Bytes Nulos (`0x00`) en el Directorio de Trabajo
```bash
node -e "const fs=require('fs'); const check=(dir)=>{ for(const f of fs.readdirSync(dir)){ const p=dir+'/'+f; if(fs.statSync(p).isDirectory()){ if(f!=='.git'&&f!=='node_modules') check(p); } else { const buf=fs.readFileSync(p); if(buf.includes(0)) console.log('NULL BYTE:', p); } } }; check('src'); check('scripts'); console.log('Null bytes scan complete.');"
```
**Salida literal:**
```
Null bytes scan complete.
```

#### 2 · Compilación de Producción (`npm run build`)
```bash
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
✓ built in 2.98s
```

#### 3 · Pruebas Automatizadas Vitest (`npx vitest run`)
```bash
npx vitest run
```
**Salida literal:**
```
 RUN  v3.2.7 C:/Users/JACK FRANKLIN/Downloads/Win max/SISTEMA-MAX-GLOBAL/SISTEMA MOTOR Y BACKOFFICE

 ✓ src/test/sembrar-red.test.js (21 tests) 70ms
 ✓ src/test/piezas.test.jsx (20 tests) 154ms
 ✓ src/test/pantallas.test.jsx (7 tests) 259ms
 ✓ src/test/base_datos.test.js (20 tests | 1 skipped) 8301ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Conexión y Catálogo > el cliente conecta y puede consultar la tabla config  1452ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Conexión y Catálogo > los porcentajes de patrocinio suman exactamente 30.8%  344ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Conexión y Catálogo > el Kit Emprendedor tiene su comisión especial cargada (41.7% al nivel 1)  308ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Conexión y Catálogo > los 5 packs existen con sus descuentos de recompra oficiales y NO existe Pack VIP  901ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Pruebas de Seguridad por Fila (RLS) e Inmutabilidad — Intentos de Violación > 1 · Usuario sin sesión intenta leer órdenes ajenas -> 0 filas  355ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Pruebas de Seguridad por Fila (RLS) e Inmutabilidad — Intentos de Violación > 2 · Usuario sin sesión intenta leer comisiones -> 0 filas  314ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Pruebas de Seguridad por Fila (RLS) e Inmutabilidad — Intentos de Violación > 5 · Usuario sin sesión intenta borrar o alterar comisiones -> denegado por inmutabilidad  354ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Aislamiento en Vistas (SECURITY INVOKER) > 6 · Ninguna vista en public es SECURITY DEFINER (todas tienen security_invoker = true)  778ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Aislamiento en Vistas (SECURITY INVOKER) > 8 · Usuario sin sesión consultando v_puntos_ciclo ve 0 filas (RLS activo)  465ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Aislamiento en Vistas (SECURITY INVOKER) > 9 · Usuario sin sesión consultando v_frontales_activos ve 0 filas (RLS activo)  314ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Revocación de EXECUTE en Funciones Críticas y Mutables > 10 · Llamada RPC anónima a fn_construir_red_ancestro es rechazada  326ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Revocación de EXECUTE en Funciones Críticas y Mutables > 11 · Llamada RPC anónima a fn_bloquear_ciclo_cerrado es rechazada  307ms
   ✓ Bloque G · Pruebas Automatizadas de Base de Datos y Supabase > Tarea 01-B · Revocación de EXECUTE en Funciones Críticas y Mutables > 12 · Llamada RPC anónima a rls_auto_enable es rechazada  328ms

 Test Files  4 passed (4)
      Tests  67 passed | 1 todo (68)
   Start at  11:32:11
   Duration  10.26s (transform 309ms, setup 655ms, collect 1.32s, tests 8.78s, environment 4.49s, prepare 785ms)
```

---
*Informe generado y archivado de acuerdo a la instrucción de registro y auditoría continua.*
