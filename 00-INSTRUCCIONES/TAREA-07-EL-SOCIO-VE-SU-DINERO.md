# TAREA-07 · EL SOCIO VE SU DINERO — tanda 3

**Para:** Antigravity
**Escrita:** 2 de septiembre de 2026
**Depende de:** TAREA-06B ✅

**Pantallas:** P-11 panel principal · P-14 mis comisiones · P-15 mi rango ·
P-19 mi billetera

> **Esta es la tanda que hace que el socio confíe.** El motor lleva días
> calculando bien y nadie lo ve. Hoy un socio entra y no encuentra su dinero.

**Lee `AGENTS.md` antes de explorar nada.**

---

## 🔴 REGLA DE REPORTE

```bash
git status --short
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea NO está terminada.**

> Van **seis veces** que reportas esa salida vacía cuando no lo está. La última,
> con 9 archivos cortados a media palabra.

---

# LAS CUATRO PANTALLAS EXISTEN COMO MAQUETA

`P11PanelSocio`, `P12MiRed` y `P14MisComisiones` **están construidas y leen de
`src/datos-falsos/`.** Se ven bien y muestran números inventados.

```
   ✅  conservar el diseño y las piezas
   ✅  reemplazar el origen de los datos
   ❌  rehacerlas desde cero
```

**Usa la capa de servicios**, como hiciste en la TAREA-06 con
`src/servicios/operacionAdmin.js`. Crea `src/servicios/socio.js`.

**Las pantallas no llaman a Supabase directamente.** Eso quedó bien y se mantiene.

---

# BLOQUE 1 · P-14 · MIS COMISIONES

**Se hace primero porque es la que más reclamos evita.**

| # | Requisito |
|---|---|
| RF-240 | Historial organizado por ciclo mensual |
| RF-241 | Cada ciclo desglosado por tipo de bono |
| RF-242 | Cada comisión muestra tipo, nivel, quién la generó y el % aplicado |
| RF-243 | Cada residual puede desplegarse hasta la orden que la originó |
| RF-244 | 🔴 **Explicar por qué un nivel NO fue pagado** |
| RF-245 | Los motivos: pack sin ese nivel habilitado, o socio inactivo |
| RF-246 | Total cobrado por ciclo |

## 🔴 RF-244 · El requisito más difícil de la tanda

**Un nivel que no se pagó no existe como fila.** En `comision` solo están las
que sí se pagaron. Si un socio mira su nivel 4 y no ve nada, no sabe si es un
error del sistema o una regla del plan.

```
   Lo que ve hoy               Lo que tiene que ver

   Nivel 3   S/. 36.00         Nivel 3   S/. 36.00
   Nivel 4   —                 Nivel 4   No cobrado · tu pack Ejecutivo
   Nivel 5   —                           habilita hasta el nivel 3
                               Nivel 5   No cobrado · no estabas activo
                                         este ciclo
```

## Cómo se resuelve — recalcular, no guardar

```
   ❌  insertar filas con monto 0 en comision
       ensucia el libro contable y rompe las verificaciones

   ✅  una función RPC de SOLO LECTURA que recalcule el desglose
```

**Crea `fn_desglose_comisiones_socio(p_socio_id, p_ciclo_id)`**, `SECURITY
DEFINER`, que devuelva por cada orden de la red del socio: qué niveles cobró,
cuáles no, y **el motivo exacto de cada uno**.

```
   Para cada nivel del 1 al 7 (patrocinio) o 1 al 10 (residual):
      ¿existe fila en comision?      → PAGADO, con su monto
      ¿nivel > pack.niveles_*?       → "tu pack habilita hasta el nivel N"
      ¿activacion.activo = false?    → "no estabas activo este ciclo"
```

**Se recalcula al abrir la pantalla.** Siempre refleja la regla vigente y no
toca el libro.

## 🔴 Y que quede claro qué NO es un error

**Sin compresión:** lo que no se paga **se queda en la empresa**, no sube al
siguiente. Si el socio ve que el nivel 4 no se pagó, tiene que entender que ese
dinero no se lo llevó otro.

**Commit.**

---

# BLOQUE 2 · P-15 · MI RANGO

| # | Requisito |
|---|---|
| RF-250 | Rango del ciclo vigente |
| RF-251 | Rango honorífico máximo alcanzado |
| RF-252 | Puntos grupales actuales y los que exige el rango siguiente |
| RF-253 | Frontales activos actuales y requeridos |
| RF-254 | 🔴 Explicar visualmente la regla de línea estirada |
| RF-255 | Línea por línea: cuánto aporta y cuánto se le computa |
| RF-256 | Indicar cuándo una línea llegó al tope del 50% |
| RF-257 | La escala se lee de la tabla `rango`, **nunca del código** |

## 🔴 RF-254 a RF-256 · La línea estirada, visible

**Un socio con 800 puntos en una sola línea que no califica a Jade —que pide
500— va a reclamar.** Salvo que vea con sus propios ojos que solo le cuentan 250.

```
   ┌────────────────────────────────────────────────────┐
   │  PARA JADE NECESITAS 500 PUNTOS GRUPALES           │
   │  Tope por línea: 250  (el 50%)                     │
   │                                                    │
   │  Línea de ANA      800 pts  →  cuentan 250  ⚠️ tope│
   │  Línea de BRUNO    180 pts  →  cuentan 180         │
   │  Línea de CARLA     90 pts  →  cuentan  90         │
   │                                ─────────────       │
   │                    COMPUTABLE:      520  ✅        │
   └────────────────────────────────────────────────────┘
```

**Los datos ya están calculados** en `rango_ciclo`: `puntos_grupales`,
`puntos_linea_mayor`, `puntos_computables`, `frontales_activos`, `califica`.

**Falta el desglose línea por línea**, que hay que consultar por frontal.

## 🔴 RF-257 · Los rangos 9 al 16 no se muestran como alcanzables

Están en la tabla con `definido = false` y sin valores.

```
   ✅  mostrarlos en la escala, en gris, como "próximamente"
   ❌  inventarles puntos o bono
   ❌  ocultarlos: existen en el plan comercial que el socio ya vio
```

## Y la regla dura

**Si baja de rango cobra CERO**, ni siquiera el bono del rango menor. Si eso le
pasa al socio, la pantalla tiene que decírselo con claridad, no dejarlo en
blanco.

**Commit.**

---

# BLOQUE 3 · P-19 · MI BILLETERA

| # | Requisito |
|---|---|
| RF-290 | Saldo disponible |
| RF-291 | Historial de movimientos con su concepto |
| RF-292 | Comisión estimada del ciclo en curso |
| RF-293 | Solicitar retiro, con aprobación del administrador |
| RF-294 | Monto mínimo de retiro: **S/. 100** |

## 🔴 La billetera está VACÍA a propósito

```
   wallet_movimiento    0 filas
   solicitud_retiro     0 filas
   Y hay 2,418 comisiones calculadas
```

**No es un error y no lo arregles.** El abono a la billetera ocurre **al cerrar
el ciclo**, que es la tanda 5. Antes del cierre, la comisión está calculada pero
no cobrable.

```
   RF-290  saldo disponible    → de v_wallet_saldo · hoy 0 para todos
   RF-292  estimado del ciclo  → suma de comision del ciclo abierto
                                 mostrado como ESTIMADO, no como saldo
```

**La diferencia entre esos dos números es la clave de la pantalla.** Un socio
tiene que entender que lo estimado todavía no es suyo: se paga al cierre, tres
días después.

```
   ❌  sumar comision y llamarlo "saldo"
   ✅  "Disponible: S/. 0.00 · Estimado del ciclo: S/. 45.60"
       "Se abona al cierre del mes"
```

## RF-294 · El mínimo de retiro

`config.monto_minimo_retiro_cent = 10000` → **S/. 100**.

**Léelo de `config`, no lo escribas.** Y valida antes de dejar enviar la
solicitud, con un mensaje claro de cuánto le falta.

**Commit.**

---

# BLOQUE 4 · P-11 · PANEL PRINCIPAL

> **La pregunta que responde:** *"¿cuánto llevo, cuánto me falta y cuánto voy a
> cobrar?"*

| # | Requisito |
|---|---|
| RF-210 | 🔴 El estado de activación es **el elemento más visible** |
| RF-211 | Si le faltan puntos, indicar cuántos y llevarlo a la tienda |
| RF-212 | Puntos personales del ciclo |
| RF-213 | Puntos grupales del ciclo |
| RF-214 | Frontales activos |
| RF-215 | Saldo disponible de su billetera |
| RF-216 | Rango vigente y rango honorífico |
| RF-217 | Avisar cuando falten pocos días para el cierre |
| RF-218 | El aviso es más prominente si NO está activo |
| RF-219 | Avisos de pagos rechazados y cambios de estado de envío |

## 🔴 RF-210 y RF-218 · La activación manda

**Sin 70 puntos el socio no cobra NADA ese mes** — ni residual, ni rango, ni
patrocinio. Es la información más importante de su panel.

```
   ACTIVO         "Estás activo · 96 de 70 puntos"     verde, tranquilo
   NO ACTIVO      "Te faltan 22 puntos para cobrar"    destacado, con
                  + botón directo a la tienda           urgencia real
```

**Y si además quedan pocos días para el cierre, el aviso sube de tono.** Un
socio que se entera el día 30 de que le faltaban 22 puntos pierde el mes entero.

## Los tres contadores no se mezclan

```
   puntos_personales   solo para su activación de 70
   puntos_grupales     solo de su red, para calificar rango
   puntos_computables  los grupales tras la línea estirada
```

**Commit.**

---

# BLOQUE 5 · PRUEBAS

## Con sesión real, como en la TAREA-05

```
   AISLAMIENTO — lo que no puede fallar
   ☐  🔴 ANA solo ve SUS comisiones, ninguna ajena
   ☐  🔴 ANA no ve la billetera de otro
   ☐  🔴 ANA no ve el rango_ciclo de otro
   ☐  un socio sin comisiones ve la pantalla vacía, no un error

   P-14 · EL DESGLOSE
   ☐  un Ejecutivo ve "tu pack habilita hasta el nivel 3" en el nivel 4
   ☐  un socio inactivo ve "no estabas activo este ciclo"
   ☐  el total del ciclo coincide con la suma de sus comisiones
   ☐  una residual se despliega hasta la orden que la originó

   P-15 · LÍNEA ESTIRADA
   ☐  con 800 en una sola línea y Jade a 500 → computable 250, NO califica
   ☐  con 800/180/90 → computable 520, SÍ califica
   ☐  la línea que topea aparece marcada
   ☐  los rangos 9-16 salen en gris, sin valores inventados

   P-19 · BILLETERA
   ☐  saldo disponible 0 y estimado del ciclo > 0 se muestran DISTINTOS
   ☐  no se puede pedir retiro por debajo de S/. 100
   ☐  el mínimo se lee de config

   P-11 · PANEL
   ☐  socio activo: mensaje verde con sus puntos
   ☐  socio inactivo: cuántos le faltan y botón a la tienda
   ☐  los tres contadores muestran valores DISTINTOS
```

**Playwright a 390px y escritorio.** Este backoffice se usa desde el celular.

**Commit.**

---

# BLOQUE 6 · VERIFICAR

```sql
-- 🔴 0 filas: el desglose no puede inventar comisiones
SELECT id FROM comision WHERE monto_cent <= 0;

-- 🔴 0 filas: la billetera sigue vacía, el abono es del cierre
SELECT id FROM wallet_movimiento;

-- el estimado del socio 2 en el ciclo 3 — para contrastar con la pantalla
SELECT sum(monto_cent) estimado_cent, count(*) comisiones
FROM comision WHERE beneficiario_id=2 AND ciclo_id=3;

-- su rango_ciclo del ciclo 3 — para contrastar con P-15
SELECT puntos_grupales, puntos_linea_mayor, puntos_computables,
       frontales_activos, califica, bono_cent
FROM rango_ciclo WHERE socio_id=2 AND ciclo_id=3;

-- 🔴 0 filas: ningún rango sin definir puede aparecer como alcanzado
SELECT rc.socio_id FROM rango_ciclo rc JOIN rango r ON r.id=rc.rango_id
WHERE rc.califica AND r.definido = false;
```

**Y las pruebas que escriban en la base se limpian solas**, con el `afterAll`
que ya montaste.

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ El motor de comisiones      se lee, no se recalcula ni se reescribe
   ❌ La red simulada             NO resembrar
   ❌ El libro comision           SOLO-AGREGAR. Ni un UPDATE, ni un DELETE
   ❌ wallet_movimiento           se llena en el cierre de ciclo, tanda 5
   ❌ P-12 · P-13 · P-16 · P-17 · P-18    son la tanda 4
```

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 5 consultas del bloque 6
   2 · La definición de fn_desglose_comisiones_socio
   3 · Una captura del desglose de P-14 mostrando un nivel NO pagado
       con su motivo
   4 · La salida de vitest y playwright
   5 · git status --short vacío, pegado literal
```
