# HISTÓRICO: MIGRACIONES ABANDONADAS (AGOSTO - SEPTIEMBRE 2026)

Este directorio contiene las 13 migraciones históricas iniciales generadas entre el 28 de agosto y el 8 de septiembre de 2026.

## 🔴 Motivo de Jubilación y Abandono
1. **Historial incompleto:** Durante las primeras semanas del proyecto, el esquema se construyó aplicando más de 22 scripts manuales y parches (`scripts/*.sql`) directamente sobre la base DEMO sin generar sus correspondientes archivos de migración.
2. **Falta del motor y datos maestros:** A este historial le falta el motor entero de comisiones, cálculo de rangos, cierres de ciclo, retiros, compras, activaciones y toda la semilla oficial (packs, rangos, configuración, catálogo de productos).
3. **Inconsistencia fatal:** La migración `20260908000002_endurecimiento_revokes_anon.sql` (líneas 4 a 13) falla con error de PostgreSQL `SQLSTATE 42883` al intentar revocar o asignar permisos sobre 10 funciones que nunca fueron creadas en este historial (por ejemplo `fn_aprobar_solicitud_retiro`).
4. **Jubilación definitiva:** El 8 de septiembre de 2026 (TAREA-35) se decidió abandonar este mecanismo fragmentado. Para evitar que la CLI de Supabase intente aplicarlas automáticamente al ejecutar `supabase start` o `supabase db reset`, fueron retiradas de `supabase/migrations/` de forma permanente.

## ✅ Fuente de Verdad Canónica
La única fuente de verdad completa, consolidada e idempotente para instalar la base de datos de producción desde cero es:

👉 **`supabase/instalador/`** (archivos numerados `00-extensiones.sql` a `07-admin.sql`).
