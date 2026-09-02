# TAREA-10 · SEGURIDAD + TANDA 5B — las cinco pantallas admin que faltan

**Para:** Antigravity
**Escrita:** 2 de septiembre de 2026
**Depende de:** TAREA-09 ✅

**Pantallas:** P-20 Tablero · P-26 Configuración · P-27 Gestión de Socios ·
P-28 Reportes · P-29 Auditoría

> **Con esto el sistema está completo.** Máximo puede operar el MLM de
> principio a fin desde el backoffice.

**Lee `AGENTS.md` antes de explorar nada.**

---

## 🔴 REGLA DE REPORTE

```bash
git status --short
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea NO está terminada.**

> Van QUINCE corrupciones. La última eliminó 378 líneas de un archivo.
> **Escribe por partes. Commitea en cada bloque.**

---

# BLOQUE 0 · SEGURIDAD — CIERRE PENDIENTE DESDE TAREA-01C

**Dos funciones siguen abiertas a `anon`. Se cierran antes de tocar pantallas.**

```sql
REVOKE EXECUTE ON FUNCTION public.fn_current_socio_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_is_admin()         FROM anon;
```

**Después del REVOKE, corre las 208 pruebas sin excepción.** Estas funciones
viven dentro de políticas RLS. Postgres las evalúa internamente y el rol que
llama no necesita EXECUTE para que la política funcione —pero hay que
confirmarlo, no asumirlo.

```
   ☐  🔴 208 pruebas en verde después del REVOKE
   ☐  Si alguna política RLS se rompe, REVIERTE y avisa
```

Verificación:

```sql
SELECT proname,
       has_function_privilege('anon', oid, 'EXECUTE') AS anon_puede
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND proname IN ('fn_current_socio_id', 'fn_is_admin');
-- 🔴 anon_puede debe ser FALSE en las dos
```

**Commit.**

---

# BLOQUE 1 · P-26 · CONFIGURACIÓN DEL PLAN

> **La pantalla desde donde Máximo ajusta los parámetros del negocio y cargará
> los rangos 9-16 cuando los tenga.**

| # | Requisito |
|---|---|
| RF-410 | Mostrar los 36 valores de `config` agrupados |
| RF-411 | Solo los valores ajustables son editables |
| RF-412 | Los valores "REGLA DURA" se muestran en solo lectura con candado |
| RF-413 | Los rangos 1-8 definidos: nombre, puntos, frontales, bono |
| RF-414 | Los rangos 9-16: formulario editable, en gris hasta que se guarden |
| RF-415 | 🔴 Guardar un rango pone `definido = true` |
| RF-416 | 🔴 Ningún rango se modifica por UPDATE directo — se usa la RPC |

## RF-411 · Los valores ajustables (los únicos editables en UI)

```
   activacion_puntos_mes        → campo numérico (hoy: 70)
   monto_minimo_retiro_cent     → campo en soles, guarda en céntimos
   dia_pago_comisiones          → campo numérico (hoy: 5)
   dias_hasta_pago              → campo numérico (hoy: 3)
   umbral_detraccion_cent       → campo en soles, guarda en céntimos
```

**Los demás se muestran con sus valores y su descripción, pero NO son
editables.** Son reglas confirmadas por Máximo que no deben cambiarse sin
deliberación explícita.

## 🔴 Las dos ambigüedades que Máximo tiene que resolver

**Muéstralas como alertas amarillas en la pantalla.** No las toques.

```
   ⚠️  dia_pago_comisiones = 5 (día 5 del mes)
       dias_hasta_pago     = 3 (3 días después del cierre)
       Estas dos no pueden ser correctas a la vez.
       Máximo debe decidir cuál eliminar.

   ⚠️  monto_minimo_retiro_cent = 10,000 cent
       retiro_minimo_cent       = 10,000 cent
       Dos claves con el mismo valor. Una es redundante.
```

## RF-414 a RF-415 · Los rangos 9-16

Están en la base con `definido = false`. Muéstralos con sus nombres pero sin
valores, como formularios vacíos:

```
   Rango 9  [nombre: ___________]  [puntos grupales: _____]
            [frontales activos: _]  [bono mensual S/.: _____]
            [ Guardar ]
```

Al guardar: `UPDATE rango SET nombre=..., puntos_grupales=..., frontales_activos=..., bono_cent=..., definido=true WHERE id=:id`.

**Solo un admin autenticado puede ejecutarlo.** Valida `fn_is_admin()` en el
servicio, no solo en la UI.

## 🔴 RF-416 · Los rangos 1-8 no se tocan desde esta pantalla

Se muestran en solo lectura. Si Máximo quiere cambiarlos, es un cambio de
contrato con los 501 socios y necesita una migración controlada, no un campo
editable.

**Commit.**

---

# BLOQUE 2 · P-27 · GESTIÓN DE SOCIOS

> **La lista completa de los 501 socios, con búsqueda y acceso al detalle.**

| # | Requisito |
|---|---|
| RF-420 | Lista paginada (25 por página) con búsqueda por nombre, código y email |
| RF-421 | Filtros: pack · activo/inactivo en ciclo actual |
| RF-422 | Cada fila: código, nombre, pack, estado de activación del ciclo |
| RF-423 | Vista de detalle del socio |
| RF-424 | El detalle muestra: datos personales, patrocinador, pack, ciclo actual |
| RF-425 | 🔴 El patrocinador y el código NO son editables |
| RF-426 | El admin puede editar datos personales y bancarios |
| RF-427 | El admin puede iniciar un upgrade de pack (igual que en P-18) |

## 🔴 RF-425 · Lo que el admin TAMPOCO puede cambiar

```
   patrocinador_id   → reescribiría la red y las comisiones ya pagadas
   codigo            → es el identificador externo del socio
   rol               → admin/socio se cambia por fuera de esta pantalla
```

**El trigger `trg_proteger_inmutables_socio` ya lo bloquea en la base.**
La pantalla no muestra esos campos como editables.

## RF-423 · El detalle del socio

```
   ┌─────────────────────────────────────────────┐
   │  MG00042 · ANA TORRES PÉREZ                 │
   │  GOLD · Patrocinador: MG00003               │
   │                                             │
   │  Ciclo actual (Septiembre 2026)             │
   │  Puntos personales: 0 de 70  [INACTIVA]     │
   │  Puntos grupales: 0                         │
   │                                             │
   │  Banco: BCP  Cuenta: 123-456789             │
   │                                             │
   │  [ Ver su red ]  [ Ver sus comisiones ]     │
   │  [ Editar datos ]  [ Iniciar upgrade ]      │
   └─────────────────────────────────────────────┘
```

**Los datos de activación vienen de `activacion` del ciclo abierto.** Si el
socio no tiene fila ahí, muestra 0 puntos.

## Cuidado con el peso — paginación obligatoria

501 socios cargados de golpe: inaceptable. **25 por página, con cursor o
OFFSET.** Y el buscador hace una sola consulta con `ILIKE`, no filtra en el
cliente.

**Commit.**

---

# BLOQUE 3 · P-20 · TABLERO ADMIN

> **La primera pantalla que ve Máximo al entrar. Responde: ¿qué pasa hoy?**

| # | Requisito |
|---|---|
| RF-400 | Estado del ciclo activo: mes, días para el cierre |
| RF-401 | Órdenes por confirmar (con botón directo a P-23) |
| RF-402 | Socios activos en el ciclo actual vs total |
| RF-403 | Comisiones estimadas del ciclo (suma de `comision` del ciclo abierto) |
| RF-404 | Últimas 5 órdenes registradas |
| RF-405 | Últimas 5 afiliaciones |
| RF-406 | Accesos rápidos: Registrar pedido · Registrar afiliación · Bandeja |

## Lo que muestra y de dónde viene

```
   Ciclo actual           → SELECT * FROM ciclo WHERE estado='abierto'
   Días para cierre       → date_part('day', fecha_fin - now())
   Órdenes por confirmar  → count FROM orden WHERE ciclo_id=:ciclo AND estado='por_confirmar'
   Socios activos         → count FROM activacion WHERE ciclo_id=:ciclo AND activo=true
   Estimado comisiones    → sum(monto_cent) FROM comision WHERE ciclo_id=:ciclo
   Últimas órdenes        → SELECT ... FROM orden ORDER BY creada_en DESC LIMIT 5
   Últimas afiliaciones   → SELECT ... FROM orden WHERE tipo='afiliacion' ORDER BY creada_en DESC LIMIT 5
```

## 🔴 "Estimado" no es "pagado"

El ciclo 4 está abierto y sus comisiones no están calculadas todavía —se
calculan al confirmar cada orden. Muestra la suma actual como **estimado en
curso**, con la nota "Se actualiza con cada pago confirmado".

**No confundir con la billetera.** La billetera se llena al cerrar. Esto es
solo el acumulado del ciclo abierto.

**Commit.**

---

# BLOQUE 4 · P-28 · REPORTES

> **Los números del negocio por ciclo, exportables.**

| # | Requisito |
|---|---|
| RF-430 | Selector de ciclo (1, 2, 3...) |
| RF-431 | Resumen del ciclo: recaudado, pagado en comisiones, margen empresa |
| RF-432 | Distribución por tipo de bono (patrocinio / residual / rango / global) |
| RF-433 | Top 10 socios por comisiones en el ciclo |
| RF-434 | Distribución de socios por pack |
| RF-435 | Retiros: solicitados vs procesados |
| RF-436 | Exportar todo como CSV |

## RF-431 · Los números del ciclo 3 para contrastar

```
   Recaudado               → sum(precio_total_cent) FROM orden WHERE ciclo_id=3 AND estado='confirmada'
   Pagado en comisiones    → 1,347,968 cent = S/. 13,479.68
   Margen empresa          → recaudado - pagado_comisiones - (flete si aplica)
```

**No inventes el margen.** Cálculalo desde la base.

## RF-436 · El CSV

Un botón "Exportar CSV" genera y descarga el archivo en el navegador.
**No hace una llamada al servidor.** Construye el CSV en el cliente con los
datos ya cargados y usa `URL.createObjectURL`.

**Commit.**

---

# BLOQUE 5 · P-29 · AUDITORÍA

> **Quién hizo qué y cuándo. La tabla `auditoria` ya existe.**

La tabla tiene: `id · usuario_id · accion · tabla · registro_id ·
datos_antes · datos_despues · ip · creado_en`

| # | Requisito |
|---|---|
| RF-440 | Lista paginada de eventos de auditoría |
| RF-441 | Filtros: accion, tabla, fecha desde/hasta |
| RF-442 | Cada fila: fecha, admin, acción, tabla afectada |
| RF-443 | Expandible: ver datos_antes y datos_despues en JSON formateado |
| RF-444 | 🔴 Solo admins pueden ver esta pantalla |

## 🔴 La tabla puede estar vacía

Si `auditoria` no tiene filas (el trigger que escribe ahí puede no estar
activo todavía), **muestra la pantalla vacía con el mensaje
"No hay eventos registrados aún"**. No es un error.

**No crees filas de auditoría falsas.**

## Lo que sí debe registrarse desde ahora

Cada vez que un admin confirma o rechaza un pedido, o ejecuta un cierre,
debería quedar en `auditoria`. Si `fn_confirmar_orden_pago`,
`fn_rechazar_orden_pago` y `fn_ejecutar_cierre_ciclo` no insertan ahí,
agrégalo como un INSERT al final de cada función.

**Commit.**

---

# BLOQUE 6 · PRUEBAS

```
   SEGURIDAD (Bloque 0)
   ☐  🔴 fn_current_socio_id: anon=FALSE después del REVOKE
   ☐  🔴 fn_is_admin: anon=FALSE después del REVOKE
   ☐  🔴 208 pruebas en verde — ninguna rota por el REVOKE

   P-26 · CONFIGURACIÓN
   ☐  activacion_puntos_mes se puede editar y persiste
   ☐  compresion_activa NO aparece como campo editable
   ☐  guardar rango 9 pone definido=true en la base
   ☐  los rangos 1-8 no tienen ningún campo editable
   ☐  las dos advertencias de ambigüedad aparecen en amarillo

   P-27 · SOCIOS
   ☐  búsqueda por nombre devuelve solo los que coinciden
   ☐  el patrocinador NO aparece como editable
   ☐  el código NO aparece como editable
   ☐  ANA tiene puntos personales 0 en el ciclo 4 (no tiene filas ahí)
   ☐  la paginación funciona (25 por página, hay 501)

   P-20 · TABLERO
   ☐  muestra el ciclo 4 (septiembre 2026) como activo
   ☐  el estimado de comisiones dice S/. 0.00 (ninguna orden confirmada aún)
   ☐  el botón de órdenes lleva a P-23

   P-28 · REPORTES
   ☐  ciclo 3: total comisiones = S/. 13,479.68
   ☐  el CSV descarga y tiene las columnas correctas

   P-29 · AUDITORÍA
   ☐  la pantalla carga aunque la tabla esté vacía
   ☐  solo un admin autenticado puede verla
```

**Playwright a 390px y escritorio.** Las pantallas admin se usan desde
móvil también.

**Commit.**

---

# BLOQUE 7 · VERIFICAR CONTRA LA BASE

```sql
-- 🔴 las dos funciones cerradas
SELECT proname, has_function_privilege('anon', oid, 'EXECUTE') AS anon_puede
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND proname IN ('fn_current_socio_id','fn_is_admin');
-- anon_puede debe ser FALSE en las dos

-- el linter de Supabase
-- (pega la salida de get_advisors tal cual — no la resumas)

-- ninguna función de public ejecutable por anon
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND has_function_privilege('anon', p.oid, 'EXECUTE');
-- 🔴 debe estar VACÍO

-- si guardaste algún rango, que quedó definido=true
SELECT id, nombre, puntos_grupales, frontales_activos, bono_cent, definido
FROM rango ORDER BY id;

-- la red no cambió de tamaño
SELECT (SELECT count(*) FROM socio)    socios,
       (SELECT count(*) FROM orden)    ordenes,
       (SELECT count(*) FROM comision) comisiones,
       (SELECT max(id) FROM socio)     max_socio;
-- socios=501 · ordenes=1048 · comisiones=2418 · max_socio=501

-- 🔴 0 filas: la billetera del ciclo 3 no fue tocada
SELECT sum(monto_cent) FROM wallet_movimiento WHERE ciclo_id=3;
-- debe seguir en 1,347,968
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ El motor de comisiones     terminado
   ❌ La red simulada            NO resembrar. 501 socios, ni uno más
   ❌ comision · wallet          libros de SOLO-AGREGAR
   ❌ movimiento_puntos          NUNCA se borra. Es el histórico
   ❌ Los rangos 1-8             solo lectura desde P-26
   ❌ La landing                 proyecto aparte
```

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 5 consultas del Bloque 7
   2 · La salida literal de get_advisors (el linter completo, no el resumen)
   3 · La salida de vitest (208+ pruebas) y playwright
   4 · Captura de P-26 mostrando los rangos 9-16 como formularios vacíos
   5 · Captura de P-20 con el ciclo 4 activo
   6 · git status --short vacío, pegado literal
```
