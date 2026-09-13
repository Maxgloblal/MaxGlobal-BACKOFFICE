# INVENTARIO COMPLETO DEL SISTEMA · TAREA-35 (BLOQUE 2)

**Proyecto:** Max Global Corporation — Sistema Motor y Backoffice  
**Fecha:** 13 de septiembre de 2026  
**Objetivo:** Inventario exhaustivo de todos los componentes de la base de datos comparando la base activa contra los archivos de migración y scripts.

---

## 1. Extensiones (2)

| Extensión | Propósito | Dónde se define |
| :--- | :--- | :--- |
| `pgcrypto` | Hashing seguro de contraseñas (`crypt`, `gen_salt`) para `auth.users` | `00-extensiones.sql` |
| `uuid-ossp` | Generación de UUIDs (`uuid_generate_v4()`) | `00-extensiones.sql` |

---

## 2. Tablas (23)

Todas deben crearse con `CREATE TABLE IF NOT EXISTS` en `01-esquema.sql` con todas sus columnas definitivas:

| # | Tabla | Columnas Notables / Incorporaciones Posteriores | Archivo Origen |
| :--- | :--- | :--- | :--- |
| 1 | `config` | clave (PK), valor, tipo, descripcion, actualizado_en, actualizado_por | `20260828000001_esquema_inicial.sql` |
| 2 | `pack` | codigo (UQ), solo_afilia_igual, niveles_patrocinio, niveles_residual, puntos_rango, descuento_recompra_pct | `20260828000001_esquema_inicial.sql` |
| 3 | `rango` | orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido | `20260828000001_esquema_inicial.sql` |
| 4 | `nivel_comision` | tipo, nivel, porcentaje | `20260828000001_esquema_inicial.sql` |
| 5 | `pack_comision_especial` | pack_comprador_id, nivel, monto_cent | `20260828000001_esquema_inicial.sql` |
| 6 | `punto_entrega` | codigo, nombre, direccion, ciudad, departamento, activo | `20260828000001_esquema_inicial.sql` |
| 7 | `producto` | slug (UQ), categoria, presentacion, precio_lista_cent, puntos, imagen_url | `20260828000001` + `20260906000001` |
| 8 | `socio` | cci, password_cambiada, fecha_baja, motivo_baja, baja_por | `20260828000001` + `tarea17` + `tarea18` + `tarea25` |
| 9 | `ciclo` | anio, mes, fecha_inicio, fecha_fin, estado, cerrado_en, cerrado_por | `20260828000001_esquema_inicial.sql` |
| 10 | `periodo_global` | anio, semestre, estado, monto_total_cent, cerrado_en, cerrado_por | `20260828000001_esquema_inicial.sql` |
| 11 | `orden` | tipo_venta ('catalogo'/'socio'), tipo, total_cent, puntos_total, estado | `20260828000001` + `tarea16` |
| 12 | `orden_detalle` | orden_id, producto_id, cantidad, precio_unit_cent, puntos_unit, subtotal_cent | `20260828000001_esquema_inicial.sql` |
| 13 | `voucher` | orden_id, banco, numero_operacion, monto_cent, fecha_deposito, imagen_url | `20260828000001_esquema_inicial.sql` |
| 14 | `envio` | orden_id, destinatario, direccion, telefono, estado | `20260828000001_esquema_inicial.sql` |
| 15 | `activacion` | socio_id, ciclo_id, puntos_personales, activo, calculado_en | `20260828000001_esquema_inicial.sql` |
| 16 | `movimiento_puntos` | socio_id, ciclo_id, orden_id, puntos, cuenta_activacion, cuenta_residual, cuenta_rango | `20260828000001_esquema_inicial.sql` |
| 17 | `comision` | ciclo_id, beneficiario_id, generador_id, orden_id, tipo, nivel, porcentaje, monto_cent | `20260828000001_esquema_inicial.sql` |
| 18 | `rango_ciclo` | socio_id, ciclo_id, rango_id, puntos_grupales, frontales_activos, califica | `20260828000001_esquema_inicial.sql` |
| 19 | `wallet_movimiento` | socio_id, tipo, monto_cent, orden_id, solicitud_retiro_id, descripcion | `20260828000001_esquema_inicial.sql` |
| 20 | `solicitud_retiro` | socio_id, monto_cent, banco, cuenta, cci, estado, aprobado_por | `20260828000001_esquema_inicial.sql` |
| 21 | `red_ancestro` | ancestro_id, descendiente_id, nivel | `20260828000001_esquema_inicial.sql` |
| 22 | `auditoria` | usuario_id, accion, tabla, registro_id, datos_antes, datos_despues, ip | `tarea19-auditoria-completa.sql` |
| 23 | `solicitud_afiliacion` | documento, email, pack_codigo, ref_codigo, estado ('pendiente'/'convertida'/'descartada') | `tarea20-registro-referido.sql` |

---

## 3. Vistas (3)

Todas creadas con `WITH (security_invoker = true)` para garantizar estricto aislamiento bajo RLS (Ley 29733):

| Vista | Propósito | Archivo Origen |
| :--- | :--- | :--- |
| `v_puntos_ciclo` | Agregación de puntos de activación, residual y rango por socio y ciclo | `20260828000001` + `20260828000003` |
| `v_wallet_saldo` | Suma de movimientos de saldo disponible en billetera por socio | `20260828000001` + `20260828000003` |
| `v_frontales_activos` | Conteo de directos activos en el ciclo para calificación de rango | `20260828000001` + `20260828000003` |

---

## 4. Funciones Oficiales de Producción (25)

Las 25 funciones están completamente respaldadas en archivos de `scripts/` y `migrations/`:

| # | Función | Módulo / Propósito | Versión Definitiva |
| :--- | :--- | :--- | :--- |
| 1 | `fn_is_admin` | Autorización de rol administrador vía JWT / socio | `20260828000001` |
| 2 | `fn_current_socio_id` | Identificación del socio en sesión actual | `20260828000001` |
| 3 | `fn_construir_red_ancestro` | Mantenimiento automático del árbol genealógico | `20260828000001` |
| 4 | `fn_bloquear_ciclo_cerrado` | Inmutabilidad contable ante ciclos cerrados | `20260828000001` |
| 5 | `fn_proteger_columnas_inmutables_socio` | Protección de email, rol, código, patrocinador y pack | `20260908000001` |
| 6 | `fn_validar_pack_solicitud` | Normalización y validación de pack en solicitudes | `scripts/tarea32-validar-pack-solicitud.sql` |
| 7 | `fn_registrar_afiliacion_socio` | Registro con credenciales aleatorias seguras en auth.users | `scripts/tarea25-contrasena-por-socio.sql` |
| 8 | `fn_confirmar_orden_pago` | Acreditación de puntos, comisiones, activación y upgrade | `scripts/tarea26-upgrade-pack.sql` |
| 9 | `fn_rechazar_orden_pago` | Rechazo con auditoría de motivos | `scripts/tarea19-auditoria-completa.sql` |
| 10 | `fn_registrar_pedido_recompra` | Registro de pedidos con validación de precios y catálogo | `scripts/tarea25-contrasena-por-socio.sql` |
| 11 | `fn_registrar_orden_upgrade` | Generación de orden de upgrade entre packs | `scripts/tarea26-upgrade-pack.sql` |
| 12 | `fn_ejecutar_cierre_ciclo` | Cierre contable, abonos en wallet y apertura del siguiente | `scripts/tarea19-auditoria-completa.sql` |
| 13 | `fn_desglose_comisiones_socio` | Desglose P-14 con explicaciones de niveles no cobrados | `scripts/tarea07-desglose-comisiones.sql` |
| 14 | `fn_rango_lineas_socio` | Cálculo P-15 en vivo, líneas estiradas y tope del 50% | `scripts/tarea12-rango-lineas-socio.sql` |
| 15 | `fn_actualizar_config_ajustable` | Modificación auditada de parámetros ajustables | `scripts/tarea20-registro-referido.sql` |
| 16 | `fn_guardar_rango_config` | Ajuste auditado de metas de rangos | `scripts/tarea19-auditoria-completa.sql` |
| 17 | `fn_aprobar_solicitud_retiro` | Débito en wallet auditado y marcado de aprobación | `scripts/tarea19-auditoria-completa.sql` |
| 18 | `fn_rechazar_solicitud_retiro` | Rechazo con motivo obligatorio y auditoría | `scripts/tarea19-auditoria-completa.sql` |
| 19 | `fn_dar_de_baja_socio` | Baja lógica con reenganche automático de descendientes | `scripts/tarea17-baja-socio-reenganche.sql` |
| 20 | `fn_vista_previa_baja_socio` | Simulación del impacto de baja y conteo de descendientes | `scripts/tarea17-baja-socio-reenganche.sql` |
| 21 | `fn_convertir_solicitud_afiliacion` | Conversión de prospecto de landing en socio oficial | `scripts/tarea20-registro-referido.sql` |
| 22 | `fn_descartar_solicitud_afiliacion` | Descarte auditado de solicitudes | `scripts/tarea20-registro-referido.sql` |
| 23 | `fn_marcar_password_cambiada` | Marcado post-cambio de contraseña inicial del socio | `scripts/tarea25-contrasena-por-socio.sql` |
| 24 | `fn_obtener_auditoria_admin` | Consulta paginada y filtrada para P-29 Auditoría | `scripts/tarea19-obtener-auditoria-admin.sql` |
| 25 | `rls_auto_enable` | Función de protección interna de Supabase (bloqueada) | Protegida con `IF EXISTS` |

---

## 5. Triggers de Negocio (5)

| Trigger | Tabla | Evento | Función Ejecutada | Archivo Origen |
| :--- | :--- | :--- | :--- | :--- |
| `trg_red_ancestro` | `socio` | BEFORE INSERT | `fn_construir_red_ancestro()` | `20260828000001` |
| `trg_proteger_inmutables_socio` | `socio` | BEFORE UPDATE | `fn_proteger_columnas_inmutables_socio()` | `20260908000001` |
| `trg_bloq_mov_puntos` | `movimiento_puntos` | BEFORE INSERT | `fn_bloquear_ciclo_cerrado()` | `20260828000001` |
| `trg_bloq_orden` | `orden` | BEFORE INSERT | `fn_bloquear_ciclo_cerrado()` | `20260828000001` |
| `trg_validar_pack_solicitud` | `solicitud_afiliacion` | BEFORE INSERT | `fn_validar_pack_solicitud()` | `tarea32-validar-pack-solicitud.sql` |

---

## 6. Políticas RLS (49)

Distribuidas en las 23 tablas:
- `config` (2): `config_select_public`, `config_admin_all`
- `producto` (2): `producto_select_public`, `producto_admin_all`
- `pack` (2): `pack_select_public`, `pack_admin_all`
- `nivel_comision` (2): `nivel_comision_select`, `nivel_comision_admin`
- `pack_comision_especial` (2): `pack_comision_especial_select`, `pack_comision_especial_admin`
- `rango` (2): `rango_select_public`, `rango_admin_all`
- `punto_entrega` (2): `punto_entrega_select`, `punto_entrega_admin`
- `ciclo` (2): `ciclo_select`, `ciclo_admin`
- `periodo_global` (2): `periodo_global_select`, `periodo_global_admin`
- `socio` (4): `socio_select_propio_o_red`, `socio_update_propio`, `socio_insert_admin`, `socio_delete_admin`
- `red_ancestro` (2): `red_ancestro_select`, `red_ancestro_admin`
- `orden` (2): `orden_select`, `orden_admin`
- `orden_detalle` (2): `orden_detalle_select`, `orden_detalle_admin`
- `voucher` (2): `voucher_select`, `voucher_admin`
- `envio` (2): `envio_select`, `envio_admin`
- `movimiento_puntos` (2): `movimiento_puntos_select`, `movimiento_puntos_admin`
- `activacion` (2): `activacion_select`, `activacion_admin`
- `comision` (2): `comision_select`, `comision_admin`
- `rango_ciclo` (2): `rango_ciclo_select`, `rango_ciclo_admin`
- `wallet_movimiento` (2): `wallet_movimiento_select`, `wallet_movimiento_admin`
- `solicitud_retiro` (3): `solicitud_retiro_select`, `solicitud_retiro_insert_propio`, `solicitud_retiro_admin`
- `auditoria` (2): `auditoria_admin_select`, `auditoria_admin_insert`
- `solicitud_afiliacion` (2): `solicitud_afiliacion_admin_select`, `solicitud_afiliacion_admin_update`

---

## 7. Storage y Políticas de Archivos (2 Buckets)

| Bucket | Visibilidad | Límites | MIME Types | Políticas RLS en `storage.objects` | Archivo Origen |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `vouchers` | **Privado** (`public = false`) | 5 MB | JPEG, PNG, WEBP, PDF | - Insert: socios autenticados<br>- Select: solo admin<br>- Delete/Update: solo admin | `scripts/storage-vouchers.sql` |
| `productos` | **Público** (`public = true`) | 2 MB | WEBP, PNG, JPEG | - Select: público (`anon` y `auth`)<br>- Insert/Update/Delete: solo admin | `20260906000003` |

---

## 8. Diagnóstico de Idempotencia y Carencias de Arranque

1. **Idempotencia (Hallazgo 6):**  
   - 0 de las 22 tablas originales tenían `CREATE TABLE IF NOT EXISTS`.
   - Las semillas de `config`, `pack`, `rango`, `producto`, etc. carecían de `ON CONFLICT DO NOTHING`.
   - Solución: Todas las sentencias del instalador incluyen protecciones idempotentes.

2. **El Callejón sin Salida del Arranque (Hallazgo 4):**  
   - No existía script para sembrar el primer ciclo abierto (el mes actual).
   - No existía script para crear la cuenta del administrador inicial en `auth.users` y en `public.socio` con rol `admin`.
   - Solución: Módulo `07-admin.sql` con bloque PL/pgSQL que genera el ciclo inicial del mes y crea el admin con credenciales generadas de alta entropía.

3. **Fotos Apuntando a Demo (Hallazgo 5):**  
   - `20260906000004` hardcodeaba URLs con el ID del proyecto demo.
   - Solución: `06-semilla.sql` deja `imagen_url` como NULL y `subir-fotos.mjs` las sube al bucket del proyecto destino y actualiza la base con la URL correspondiente. Cero menciones al proyecto demo.
