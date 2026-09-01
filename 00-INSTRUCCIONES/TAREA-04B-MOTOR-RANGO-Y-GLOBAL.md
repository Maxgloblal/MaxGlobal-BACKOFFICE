# TAREA-04B · MOTOR DE COMISIONES — RANGO Y BONO GLOBAL

**Para:** Antigravity
**Escrita:** 28 de agosto de 2026
**Depende de:** TAREA-04A ✅ (patrocinio y residual, verificados)

> **NO está bloqueada por el cliente.** Se creyó que faltaban los rangos 9 al
> 16, pero el plan ya resolvió qué hacer con ellos: **existen marcados como no
> definidos y se cargan desde el panel de administración** cuando Max Global
> tenga los números. En la base ya están así, con `definido = false`.

**Lee `AGENTS.md` antes de explorar nada.**

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, siempre:

```bash
git status --short
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**

---

# BLOQUE 1 · LOS TRES CONTADORES

Antes de calificar a nadie hay que saber cuántos puntos tiene cada socio, y
**son tres contadores distintos que no se mezclan**.

```
   puntos_personales    los suyos           →  solo para la activación de 70
   puntos_grupales      los de su red       →  solo para calificar el rango
   puntos_computables   los grupales tras
                        la línea estirada   →  con esto se compara el rango
```

## 🔴 Los grupales NO incluyen los personales

**Respuesta 8.2 de Máximo:** *"No, solo los de mi red."*

```
   Un líder que compra S/. 4,000 de producto él mismo
   NO sube de rango con eso. Tiene que moverlo por su red.
```

Si sumas los personales a los grupales, todos los líderes suben de rango de
golpe y la empresa paga bonos que no corresponden.

## Qué cuenta como grupal

Los puntos de **toda la descendencia**, a cualquier profundidad —
`red_ancestro` los tiene todos— de los movimientos con `cuenta_rango = true`
en ese ciclo.

**Commit.**

---

# BLOQUE 2 · LA LÍNEA ESTIRADA — el cálculo que más se equivoca

De la línea frontal con más volumen **solo cuenta hasta el 50% de los puntos
que exige el rango**. El resto tiene que venir de las otras líneas.

## 🔴 El tope es sobre los PUNTOS DEL RANGO, no sobre el total del socio

Este es el error clásico. No es "el 50% de sus puntos grupales". Es **el 50% de
lo que pide el rango que se está evaluando**.

```
   config.linea_estirada_pct = 50
   tope = rango.puntos_grupales × 50 / 100
```

## Ejemplo calculado a mano — Jade, que pide 500 puntos

```
   tope = 500 × 50% = 250

   Línea A (la más fuerte)   800 pts  →  cuentan 250   ← recortada al tope
   Línea B                   180 pts  →  cuentan 180
   Línea C                    90 pts  →  cuentan  90
                                         ───────────
                          COMPUTABLE:     520 pts   ✅ califica
```

**Y el caso que demuestra para qué existe la regla:**

```
   Toda la red en UNA sola línea:   800 pts
   Computable:                       250   ❌ NO califica

   Tiene 800 puntos y no llega a un rango de 500.
```

## Cada rango se evalúa con su propio tope

Como el tope depende de los puntos del rango, **el computable cambia según qué
rango se esté evaluando**. Hay que recalcularlo para cada uno, de mayor a menor,
y quedarse con el más alto que califique.

**Commit.**

---

# BLOQUE 3 · CALIFICACIÓN DEL RANGO

## Las tres condiciones — las tres, a la vez

```
   (a) puntos_computables  >=  rango.puntos_grupales
   (b) frontales_activos   >=  rango.frontales_activos
   (c) el socio está ACTIVO ese ciclo
```

## Qué es un "frontal activo"

**Un patrocinado DIRECTO — nivel 1 — que está activo ese ciclo.**
No cuentan los de nivel 2 en adelante. Ya existe la vista `v_frontales_activos`.

## Los 8 rangos definidos

| # | Rango | Puntos grupales | Frontales | Bono |
|---|---|---|---|---|
| 1 | Jade | 500 | 1 | S/. 50 |
| 2 | Bronce | 1,000 | 2 | S/. 100 |
| 3 | Plata | 2,000 | 2 | S/. 200 |
| 4 | Oro | 4,000 | 3 | S/. 500 |
| 5 | Platino | 8,000 | 4 | S/. 1,500 |
| 6 | Esmeralda | 15,000 | 5 | S/. 3,000 |
| 7 | Zafiro | 30,000 | 6 | S/. 5,000 |
| 8 | Diamante | 60,000 | 7 | S/. 10,000 |

**Léelos de la tabla `rango`. No los escribas en el código.**

## 🔴 Los rangos 9 al 16 se saltan mientras `definido = false`

```sql
WHERE definido = true AND activo = true
```

Del 9 al 16 tienen `puntos_grupales`, `frontales_activos` y `bono_cent` en
`NULL`. **Un rango no definido no califica a nadie.**

El día que Máximo mande los números se llenan desde el panel, se marca
`definido = true` y **el motor los toma sin tocar una línea de código**. Eso es
lo que pidió el plan.

**Commit.**

---

# BLOQUE 4 · EL BONO DE RANGO

## 🔴 Si baja de rango, NO COBRA NADA

**Confirmado el 26/08:**
> *"Si el líder llega a un rango tiene que mantenerse o ascender para cobrar.
> Si baja de rango ya no cobra."*

| Situación del mes | ¿Cobra? |
|---|---|
| Mantiene su rango | ✅ el suyo |
| Asciende | ✅ el nuevo |
| **Baja de rango** | ❌ **cero** |
| No se activa | ❌ **cero** |

```
   Un ORO que este mes hace 900 puntos grupales:
   califica para Bronce (1,000)... ni siquiera.
   Supongamos que hace 1,200 y califica Bronce.

   ❌ NO cobra los S/. 100 de Bronce
   ✅ Cobra CERO
   ✅ Conserva "Oro" como título honorífico en su backoffice
```

**Queda prohibido pagarle el bono menor "porque al menos llegó a eso".**

Para saber si bajó hay que comparar con el rango del ciclo anterior — está en
`rango_ciclo` del mes pasado. El primer ciclo de un socio no tiene anterior:
**no puede haber bajado**.

## 🔴 No es apilable

**Confirmado:** *"Si un líder llegó en un mes a Diamante, solo se comisiona de
ese rango."*

```
   Un Diamante cobra S/. 10,000
   NO cobra 10,000 + 5,000 + 3,000 + 1,500 + ...
```

## Dónde se guarda

Una fila en `rango_ciclo` por socio y ciclo — **para todos, califiquen o no**,
porque el backoffice tiene que mostrar cuánto le falta:

```
   socio_id · ciclo_id · rango_id · puntos_personales · puntos_grupales
   puntos_linea_mayor · puntos_computables · frontales_activos
   califica · bono_cent · calculado_en
```

Y el pago va a `comision` con `tipo = 'rango'`, `nivel = NULL`,
`generador_id = NULL` — no hay una orden que lo origine.

**Commit.**

---

# BLOQUE 5 · EL BONO GLOBAL

## Las reglas, todas confirmadas

| Regla | Valor | En `config` |
|---|---|---|
| Qué se reparte | **1% de los puntos acumulados** | `bono_global_pct = 1` |
| Conversión | **S/. 1.00 por punto** | `bono_global_conversion = 1.00` |
| Cortes | **Ene–Jun** y **Jul–Dic** | `bono_global_meses = 6` |
| Reparto | **proporcional al puntaje** | `bono_global_reparto = 'proporcional'` |
| Actividad | **los 6 meses completos** | `bono_global_meses_activo = 6` |
| Quién califica | Gold, Familiar, Empresarial | `pack.aplica_bono_global = true` |

## El cálculo

```
   1 · puntos_totales = todos los puntos del semestre, de toda la compañía
   2 · pool_cent = puntos_totales × 100 × 1%
   3 · califican = socios con pack aplica_bono_global = true
                   Y activos en LOS SEIS MESES
   4 · a cada uno:  pool_cent × (sus_puntos / puntos_de_los_calificados)
```

## 🔴 El requisito de los 6 meses es duro

**Un solo mes sin activarse deja al socio fuera del semestre completo.**
No es "activo el mes del reparto". Son los seis.

## 🔴 Los céntimos que sobran del redondeo

Al repartir proporcionalmente casi siempre sobran uno o dos céntimos.

```
   ❌  dárselos al primero de la lista
   ❌  dejar que la suma no cuadre con el pool
   ✅  el sobrante queda en la empresa, y se registra en periodo_global
```

**La suma de lo repartido nunca puede superar el pool.** Prueba esa invariante.

## Tabla `periodo_global` — columnas verificadas

```
   id · anio · semestre · puntos_totales · pool_cent
   calificados · estado · cerrado_en
```

## 🔴 Con los datos que hay NO se puede cerrar un semestre

La red tiene tres ciclos: **junio, julio y agosto de 2026**.

```
   Junio           → semestre Ene–Jun, al que le faltan 5 meses
   Julio y agosto  → semestre Jul–Dic, al que le faltan 4 meses
```

**Ningún semestre está completo.** Programa el motor entero y pruébalo con
datos armados a mano en las pruebas unitarias, donde sí puedes simular seis
ciclos. Contra la red real, deja el periodo en estado `abierto` y **no
reparta**: reporta el pool que llevaría acumulado.

**No inventes meses que no existen para poder cerrar el semestre.**

**Commit.**

---

# BLOQUE 6 · PRUEBAS

## Línea estirada — con los números de arriba

```
   ☐  Jade, líneas 800/180/90    → computable 520, califica
   ☐  Jade, una sola línea 800   → computable 250, NO califica
   ☐  el tope se calcula sobre los puntos del RANGO, no del socio
   ☐  un socio sin red            → computable 0
   ☐  un socio con una sola línea justo en el tope → califica al límite
```

## Rango

```
   ☐  Diamante cobra 1000000 cent y NADA más    ← no apilable
   ☐  Oro que baja a Bronce                     → cobra 0
   ☐  Oro que se mantiene                       → cobra 50000
   ☐  Oro que sube a Platino                    → cobra 150000
   ☐  Califica por puntos pero le falta 1 frontal → no cobra
   ☐  Califica por todo pero está inactivo        → no cobra
   ☐  Su primer ciclo, sin rango anterior         → no "bajó", cobra
   ☐  Un rango con definido=false                 → no califica a nadie
   ☐  Se llena el rango 9 y se marca definido     → ahora sí califica
```

Esa última prueba es la que demuestra que el panel va a funcionar el día que
lleguen los números.

## Bono global

```
   ☐  pool = 1% de los puntos × 100
   ☐  un Ejecutivo nunca entra al reparto
   ☐  activo 5 de 6 meses                → fuera del reparto
   ☐  activo los 6                        → dentro
   ☐  reparto proporcional: el que tiene el doble de puntos
      recibe el doble
   ☐  la suma repartida NUNCA supera el pool
   ☐  los céntimos sobrantes quedan registrados, no se regalan
```

**Commit.**

---

# BLOQUE 7 · CORRERLO CONTRA LOS 500 SOCIOS

```sql
-- rangos alcanzados por ciclo
SELECT rc.ciclo_id, r.codigo, count(*) socios, sum(rc.bono_cent) bono
FROM rango_ciclo rc LEFT JOIN rango r ON r.id=rc.rango_id
GROUP BY 1,2 ORDER BY 1,2;

-- 🔴 0 filas: nadie califica a un rango no definido
SELECT rc.socio_id FROM rango_ciclo rc JOIN rango r ON r.id=rc.rango_id
WHERE rc.califica AND r.definido = false;

-- 🔴 0 filas: nadie cobró rango estando inactivo
SELECT rc.socio_id FROM rango_ciclo rc
JOIN activacion a ON a.socio_id=rc.socio_id AND a.ciclo_id=rc.ciclo_id
WHERE rc.bono_cent > 0 AND NOT a.activo;

-- 🔴 0 filas: el computable nunca puede superar al grupal
SELECT socio_id, ciclo_id FROM rango_ciclo WHERE puntos_computables > puntos_grupales;

-- 🔴 0 filas: la línea mayor nunca puede superar al grupal
SELECT socio_id, ciclo_id FROM rango_ciclo WHERE puntos_linea_mayor > puntos_grupales;

-- 🔴 0 filas: el bono pagado siempre coincide con el del rango
SELECT rc.socio_id, rc.bono_cent, r.bono_cent
FROM rango_ciclo rc JOIN rango r ON r.id=rc.rango_id
WHERE rc.califica AND rc.bono_cent <> r.bono_cent;

-- 🔴 0 filas: nadie cobró habiendo bajado de rango
SELECT act.socio_id, act.ciclo_id
FROM rango_ciclo act
JOIN rango_ciclo ant ON ant.socio_id=act.socio_id AND ant.ciclo_id=act.ciclo_id-1
JOIN rango ra ON ra.id=act.rango_id JOIN rango rn ON rn.id=ant.rango_id
WHERE act.bono_cent > 0 AND ra.orden < rn.orden;

-- los puntos grupales no incluyen los personales: comprobación cruzada
SELECT count(*) FROM rango_ciclo rc JOIN activacion a
  ON a.socio_id=rc.socio_id AND a.ciclo_id=rc.ciclo_id
WHERE rc.puntos_grupales = a.puntos_personales AND rc.puntos_grupales > 0;
```

## Y reporta

```
   1 · Cuántos socios alcanzan cada rango, por ciclo
   2 · Total de bono de rango pagado por ciclo
   3 · Cuántos NO cobraron por haber bajado de rango
   4 · Cuántos NO cobraron por no estar activos
   5 · El pool del bono global que llevan los semestres abiertos
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ La red simulada                   verificada. NO resembrar
   ❌ Las comisiones de patrocinio
      y residual ya calculadas          libro de solo-agregar
   ❌ Los rangos 9 al 16                se quedan en definido = false
                                        hasta que el cliente mande los números
   ❌ Bono Cumpleaños y Bono Viajes     FUERA del sistema, por decisión
                                        documentada. No los programes.
```

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 7 consultas del bloque 7
   2 · La salida completa de vitest
   3 · Los 5 números de arriba
   4 · Lo que decidiste no hacer, y por qué
```

**Si una consulta devuelve filas donde dice "0 filas", es un error y se reporta
como error.**
