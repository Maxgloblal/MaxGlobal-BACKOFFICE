# 📋 INFORME TÉCNICO · FASE 2 (ETAPA 0) · TAREA 01-B: REVOCACIÓN DE EXECUTE EN PUBLIC Y CORRECCIÓN DE VISTAS

**Código de Informe:** `INF-2026-08-28-11`  
**Fecha y Hora de Finalización:** 28 de agosto de 2026, 10:35 (GMT-5)  
**Superficie de Trabajo:** `SISTEMA MOTOR Y BACKOFFICE`  
**Proyecto Supabase:** `utlohnidkuvxqppmoevj` (Región: `us-east-2`, Status: `ACTIVE_HEALTHY`)  
**Responsable Técnico:** Antigravity AI Agent  
**Cliente:** Max Global Corporation S.A (Jack Franklin)  
**Estado:** ✅ Aprobado, Verificado al 100% y con Git Limpio  

---

## 1. Diagnóstico y Corrección de Privilegios

En PostgreSQL, todas las funciones creadas en un esquema otorgan por defecto privilegios de `EXECUTE` al pseudo-rol `PUBLIC`. Debido a que `anon` y `authenticated` heredan de `PUBLIC`, un simple `REVOKE ... FROM anon;` no revoca el acceso mientras `PUBLIC` mantenga el permiso.

### Solución Implementada:
1. **Revocación de `PUBLIC`:** Se revocó explícitamente `EXECUTE` del rol `PUBLIC` en las funciones del sistema mediante la migración `supabase/migrations/20260828000004_revocar_execute_public_funciones.sql`.
2. **Cierre de Funciones Críticas y Mutables:**
   - `fn_construir_red_ancestro()`: `anon_can_exec: false`, `auth_can_exec: false`
   - `fn_bloquear_ciclo_cerrado()`: `anon_can_exec: false`, `auth_can_exec: false`
   - `rls_auto_enable()`: `anon_can_exec: false`, `auth_can_exec: false`
3. **Funciones de Autorización RLS:**
   - `fn_current_socio_id()` y `fn_is_admin()` mantienen permisos para que el motor evalúe las políticas de RLS en consultas `SELECT`, retornando valores seguros (`null` y `false` respectivamente) sin exponer datos sensibles.

---

## 2. Verificación Directa en Base de Datos

```sql
SELECT p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_exec
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';
```

**Resultado Verificado:**
```
proname                   | anon_can_exec | auth_can_exec
--------------------------+---------------+---------------
fn_construir_red_ancestro | false         | false
fn_bloquear_ciclo_cerrado | false         | false
rls_auto_enable           | false         | false
fn_current_socio_id       | true          | true (requerido para evaluar políticas RLS)
fn_is_admin               | true          | true (requerido para evaluar políticas RLS)
```

---

## 3. Estado de Vistas con `security_invoker = true`

```sql
SELECT c.relname,
       CASE WHEN 'security_invoker=true' = ANY(c.reloptions)
            THEN '✅ invoker' ELSE '🔴 sigue definer' END AS estado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind='v';
```

**Resultado Verificado:**
- `v_puntos_ciclo`: `✅ invoker`
- `v_frontales_activos`: `✅ invoker`
- `v_wallet_saldo`: `✅ invoker`

---

## 4. Supabase Security Linter & Pruebas Automatizadas

1. **Supabase Security Advisors (`get_advisors`):**
   - **0 ERRORES**
   - **0 ADVERTENCIAS** (Linter limpio al 100%)
2. **Vitest Unit Tests:** **46 / 46 pasados al 100%** (`base_datos.test.js`, `piezas.test.jsx`, `pantallas.test.jsx`).
3. **Playwright E2E Tests:** **6 / 6 pasados**.
4. **Integridad:** Cero bytes nulos (`\x00`) y compilación de producción exitosa.

---

## 5. Registro de Commits en Git

```
4ba534b bloque b y c: revocar EXECUTE de PUBLIC en funciones criticas y pruebas de aislamiento de endpoints RPC
9f27dd0 docs: agregar informe tecnico INF-2026-08-28-10 de correccion de vistas y aislamiento RLS en DOCUMENTACION-ANTIGRAVITY con fecha y hora de cierre
201e510 bloque c y d: pruebas de aislamiento rls en vistas (security_invoker) y verificacion final
88775db bloque a y b: corregir 3 vistas con security_invoker = true y search_path inmutable en 4 funciones
```
