# 📋 INFORME TÉCNICO · FASE 2 (ETAPA 0) · TAREA 01: BASE DE DATOS Y SUPABASE

**Código de Informe:** `INF-2026-08-28-09`  
**Fecha y Hora de Finalización:** 28 de agosto de 2026, 09:35 (GMT-5)  
**Superficie de Trabajo:** `SISTEMA MOTOR Y BACKOFFICE`  
**Proyecto Supabase Conectado:** `utlohnidkuvxqppmoevj` (Región: `us-east-2`, Status: `ACTIVE_HEALTHY`)  
**Responsable Técnico:** Antigravity AI Agent  
**Cliente:** Max Global Corporation S.A (Jack Franklin)  
**Estado:** ✅ Aprobado, Verificado al 100% y con Git Limpio  

---

## 1. Objetivos del Requerimiento

Establecer la infraestructura de base de datos relacional y seguridad para el **Sistema Motor y Backoffice de Max Global Corporation** utilizando Supabase:
1. **Conexión Supabase:** Proyecto creado en la región más cercana, credenciales en `.env.local` (excluido de git) y cero `service_role` en frontend.
2. **Las 22 Tablas Oficiales:** Creación de las 22 tablas definidas en `03-SISTEMA/schema.sql` mediante migraciones versionadas.
3. **Dinero en Enteros:** Todos los montos monetarios terminan en `_cent` y se almacenan como `BIGINT` (cero decimales).
4. **Libros Inmutables (Append-Only):** Tablas `comision`, `wallet_movimiento` y `auditoria` con permisos `UPDATE` y `DELETE` expresamente revocados.
5. **Configuración del Plan de Compensación:** 57 filas de configuración, escala de patrocinio (30.8% en 7 niveles), escala residual (10 niveles = 97% de puntos a S/. 1.00 por punto) y la excepción del Kit Emprendedor (41.7% exclusivamente al Nivel 1).
6. **Catálogo Oficial:** 8 productos con precios públicos (Café: S/. 150.00 / `15000` céntimos, 18 pts) y 5 packs oficiales con su descuento de recompra (Kit Emprendedor 40%, Ejecutivo 50%, Gold 50%, Familiar 50%, Empresarial 50%). Pack VIP no existe.
7. **Políticas de Seguridad por Fila (RLS):** RLS activado en las 22 tablas y aislamiento de descendencia bajo Ley N° 29733 (el socio solo ve sus datos y su descendencia sin teléfono, correo ni comisiones ajenas).
8. **Tipos TypeScript y Cliente:** Generación automática de tipos desde la base de datos a `src/tipos/supabase.ts` y cliente centralizado en `src/lib/supabaseClient.js`.
9. **Pruebas e Integridad:** 37/37 pruebas Vitest y 6/6 Playwright en verde, cero bytes nulos y commits atómicos por bloque.

---

## 2. Acciones y Cambios Técnicos Realizados

### Bloque A · Proyecto Supabase y Variables de Entorno
* Se enlazó el proyecto Supabase `utlohnidkuvxqppmoevj` (`https://utlohnidkuvxqppmoevj.supabase.co`).
* Se instaló la librería oficial `@supabase/supabase-js`.
* Se crearon las variables de entorno en `.env.local` y se configuró `.gitignore` para prevenir cualquier fuga de claves al repositorio.
* Se creó la estructura de migraciones en `supabase/migrations/`.
* **Verificación de Seguridad:** `grep -rn "service_role" src/` dio resultado completamente vacío.

### Bloque B · Las 22 Tablas del Esquema Oficial
* Se creó la migración `supabase/migrations/20260828000001_esquema_inicial.sql` aplicando las 22 tablas:
  1. `config`
  2. `producto`
  3. `pack`
  4. `nivel_comision`
  5. `pack_comision_especial`
  6. `rango`
  7. `socio` (con constraint `chk_no_auto_patrocinio`)
  8. `red_ancestro` (closure table con trigger automático `fn_construir_red_ancestro`)
  9. `ciclo`
  10. `orden`
  11. `orden_detalle`
  12. `voucher`
  13. `movimiento_puntos` (con trigger de ciclo cerrado `fn_bloquear_ciclo_cerrado`)
  14. `punto_entrega`
  15. `envio`
  16. `activacion`
  17. `comision` (inmutable)
  18. `rango_ciclo`
  19. `wallet_movimiento` (inmutable)
  20. `solicitud_retiro`
  21. `periodo_global`
  22. `auditoria` (inmutable)
* Se crearon las vistas de apoyo: `v_puntos_ciclo`, `v_wallet_saldo` (con cast explícito a `BIGINT`) y `v_frontales_activos`.
* Se revocó `UPDATE` y `DELETE` en `comision`, `wallet_movimiento` y `auditoria`.
* Se aplicó la migración mediante el MCP `apply_migration`.
* **Verificación:** `SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'` retornó exactamente 22.

### Bloques C y D · Configuración del Plan y Catálogo Oficial
* **Escala de Patrocinio:** 7 niveles (N1: 20%, N2: 4%, N3: 3%, N4: 2%, N5: 1%, N6: 0.5%, N7: 0.3%) sumando exactamente 30.800%.
* **Excepción del Kit Emprendedor:** Fila en `pack_comision_especial` con 41.700% al nivel 1 (S/. 50.00 de comisión por Kit de S/. 120.00).
* **Escala Residual:** 10 niveles (97% total sobre puntos, con 1 punto = S/. 1.00; nivel 8 al 10% intencional).
* **Precios Públicos:** Café = S/. 150.00 (`15000`), Colágeno = S/. 150.00 (`15000`), Aceite de Moringa = S/. 120.00 (`12000`), etc. Puntos fijos.
* **Packs:** Emprendedor, Ejecutivo, Gold, Familiar y Empresarial con descuentos de recompra del 40% y 50%. Pack VIP inexistente en base de datos.

### Bloque E · Seguridad por Fila (RLS)
* Se creó la migración `supabase/migrations/20260828000002_politicas_rls.sql` activando `ENABLE ROW LEVEL SECURITY` en las 22 tablas.
* Se crearon funciones de seguridad `fn_current_socio_id()` y `fn_is_admin()`.
* Políticas de aislamiento:
  - Un socio solo consulta sus propias comisiones, pedidos, billetera y solicitudes de retiro.
  - En la red genealógica (`socio` y `red_ancestro`), el socio solo puede consultar su descendencia directa/indirecta y nunca su upline ni datos de contacto privados (Ley N° 29733).
  - Solo los administradores pueden registrar/aprobar pedidos y confirmar pagos.
* **Verificación:** `SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true` retornó exactamente 22.

### Bloque F · Tipos de TypeScript y Cliente Supabase
* Se generaron los tipos de TypeScript desde el esquema de Supabase mediante el MCP `generate_typescript_types` en `src/tipos/supabase.ts` (1,230 líneas con esquemas de filas, inserciones, actualizaciones y relaciones).
* Se creó el cliente único en `src/lib/supabaseClient.js`.
* Se agregó el script `"types:gen"` en `package.json`.

### Bloque G · Pruebas Automatizadas e Integridad
* Se crearon 10 pruebas en `src/test/base_datos.test.js` evaluando:
  1. Conexión y consulta a `config`.
  2. Suma de escala de patrocinio (30.8%).
  3. Comisión especial del Kit Emprendedor (41.7%).
  4. Precios públicos almacenados.
  5. 5 packs existentes y ausencia de Pack VIP.
  6. Violación RLS 1: Intento de lectura de órdenes sin sesión -> 0 filas.
  7. Violación RLS 2: Intento de lectura de comisiones sin sesión -> 0 filas.
  8. Violación RLS 3: Intento de lectura de billetera sin sesión -> 0 filas.
  9. Violación RLS 4: Intento de inserción de orden sin sesión -> denegado por RLS.
  10. Violación RLS 5: Intento de borrado de comisión -> denegado por inmutabilidad (`code: 42501`).
* **Resultados de Pruebas:**
  - **Vitest:** 37/37 tests pasados (`piezas.test.jsx`, `pantallas.test.jsx`, `base_datos.test.js`).
  - **Playwright:** 6/6 tests E2E pasados (viewports 390px y 1280px).
* **Cero Bytes Nulos:** Verificado en todos los archivos `.sql`, `.ts`, `.js`, `.jsx`.
* **Compilación de Producción:** `npm run build` exitoso en 3.10s.

---

## 3. Registro de Commits en Git

```
acec61b bloque g: pruebas automatizadas vitest para conexion supabase, 22 tablas, catalogo y seguridad rls
01a90f7 bloque f: cliente supabase centralizado y tipos typescript generados desde el esquema
bcc42dd bloque e: politicas de seguridad por fila (rls) en las 22 tablas y proteccion de datos
279de2b bloque b: creacion de las 22 tablas del esquema oficial, dinero en enteros e inmutabilidad
d07e01b bloque a: configuracion de proyecto supabase, variables de entorno y @supabase/supabase-js
6daf3e3 inicio fase 2 - tarea 01
```

---

## 4. Estado de la Base de Datos Verificado por MCP

```sql
-- 1. Exactamente 22 tablas públicas
SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';
-- Resultado: 22

-- 2. Tablas con RLS habilitado
SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- Resultado: 22

-- 3. Suma de porcentaje de patrocinio
SELECT sum(porcentaje) FROM nivel_comision WHERE tipo = 'patrocinio';
-- Resultado: 30.800

-- 4. Excepción del Kit Emprendedor
SELECT * FROM pack_comision_especial;
-- Resultado: EMPRENDEDOR | 1 | 41.700

-- 5. Moneda en enteros (sin decimales)
SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND (column_name LIKE '%_cent' OR column_name LIKE '%monto%') AND data_type NOT IN ('bigint','integer');
-- Resultado: 0 filas
```
