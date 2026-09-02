# TAREA-09 · CIERRE DE CICLO — la operación más delicada del sistema

**Para:** Antigravity
**Escrita:** 2 de septiembre de 2026
**Depende de:** TAREA-08 ✅

**Una sola pantalla: P-25.** Y es la que más cuidado necesita de todo el
proyecto.

> ```
>    El cierre paga a todos los socios
>    Abona las comisiones a las billeteras
>    Actualiza los rangos
>    Resetea los puntos
>    Abre el ciclo siguiente
>
>    Y NO SE PUEDE DESHACER.
> ```
>
> Un error aquí no se corrige con un UPDATE: obliga a asientos inversos en
> cascada por diez niveles, porque `comision` y `wallet_movimiento` son libros
> de solo-agregar.

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

> **Van cuatro corrupciones seguidas** — 12, 13, 14 y 15 — todas reportadas como
> salida vacía. La última se llevó **378 de las 460 líneas** de `P12MiRed.jsx`,
> la pantalla que acababas de escribir.
>
> **Escribe por partes. Commitea en cada bloque. Y pega la salida real.**

---

# 🔴 EL ERROR QUE MÁS MIEDO DA — léelo dos veces

## RF-380 dice "resetear los puntos a cero"
## RF-381 dice "el histórico NO debe borrarse"

**No son contradictorios. Y la forma correcta es no borrar NADA.**

```
   Los puntos ya están separados por ciclo:
      movimiento_puntos.ciclo_id
      activacion.ciclo_id

   Al abrir el ciclo siguiente, el socio empieza en cero
   PORQUE NO TIENE FILAS EN ESE CICLO NUEVO. Nada más.
```

```
   ❌  DELETE FROM movimiento_puntos
   ❌  UPDATE activacion SET puntos_personales = 0
   ❌  TRUNCATE de cualquier cosa
   ✅  no tocar nada e insertar el ciclo siguiente
```

**El "reseteo" es una consecuencia del diseño, no una operación.** Si borras
algo, destruyes el histórico que sostiene todas las comisiones ya pagadas.

---

# BLOQUE 1 · LAS VERIFICACIONES PREVIAS

**Antes de dejar siquiera ver la vista previa.**

| # | Requisito |
|---|---|
| RF-371 | Verificar si hay pedidos sin confirmar |
| RF-372 | Verificar si hay configuración incompleta |

```sql
-- pedidos que quedarían fuera del cierre
SELECT count(*) FROM orden WHERE ciclo_id = :ciclo AND estado = 'por_confirmar';

-- rangos usados pero sin definir
SELECT count(*) FROM rango WHERE activo AND NOT definido;
```

**Un pedido sin confirmar es dinero que el socio pagó y no va a contar.**
No bloquea el cierre —puede ser legítimo— pero se muestra con nombre y monto
para que el administrador decida.

**Commit.**

---

# BLOQUE 2 · LA VISTA PREVIA — 🔴 sin escribir NADA

| # | Requisito |
|---|---|
| RF-373 | Vista previa antes de escribir nada |
| RF-374 | Socios activos, total por cada bono y total a pagar |
| RF-375 | 🔴 Poder cancelar sin que se haya escrito nada |

## La regla de oro de este bloque

```
   La vista previa NO inserta, NO actualiza, NO borra.
   Ni una fila. Ni un log. Nada.
```

**Reutiliza el motor en seco**, igual que hiciste en la P-23 con
`procesarComisionesDeUnaOrden`. Aquí es `procesarComisionesCiclo` sin persistir.

## Lo que tiene que mostrar

```
   ┌──────────────────────────────────────────────────────┐
   │  CIERRE DEL CICLO 3 · AGOSTO 2026                    │
   │                                                      │
   │  Socios activos              240 de 501              │
   │                                                      │
   │  Bono de patrocinio      S/.  6,795.40   73 socios   │
   │  Bono residual           S/.  6,084.28  385 socios   │
   │  Bono de rango           S/.    600.00    8 socios   │
   │  Bono global             no toca este ciclo          │
   │  ──────────────────────────────────────────────      │
   │  TOTAL A PAGAR           S/. 13,479.68               │
   │                                                      │
   │  Quedará en la empresa   S/. 27,635.64               │
   │                                                      │
   │  ⚠️  5 pedidos sin confirmar quedarán fuera          │
   │                                                      │
   │         [ Cancelar ]    [ Ejecutar el cierre ]       │
   └──────────────────────────────────────────────────────┘
```

**Cancelar tiene que dejar la base exactamente como estaba.** Y hay que
probarlo: contar filas antes y después.

**Commit.**

---

# BLOQUE 3 · 🔴 RF-376 · LA ÚLTIMA RED DE SEGURIDAD

> **Si por un error de configuración el cálculo sale desproporcionado, el cierre
> NO se ejecuta.**

## Los techos que el plan no puede superar

```
   Patrocinio   nunca más del 30.8% del precio de los packs vendidos
                salvo el Kit Emprendedor, que paga 41.7% al nivel 1

   Residual     nunca más del 97% de los puntos de recompra × S/.1

   Rango        la suma de los bonos de los rangos alcanzados
```

## Cómo se comprueba

**Antes de escribir nada**, se calcula el techo teórico y se compara:

```
   techo_patrocinio = Σ (precio del pack × 30.8%)   de las afiliaciones
                    + Σ (precio del Kit × 41.7%)     de los Kits
   techo_residual   = Σ (puntos de recompra × 100 × 97%)
   techo_rango      = Σ (bono_cent del rango que califica)

   Si lo calculado supera cualquiera de los tres → SE BLOQUEA
```

**No es un aviso. Es un bloqueo.** El botón de ejecutar no se habilita y se
muestra qué bono se pasó y por cuánto.

## Y una segunda red, más simple pero muy eficaz

```
   Si el total a pagar de este ciclo es más del DOBLE
   que el del ciclo anterior → pedir confirmación extra
```

Un salto así puede ser real —la red creció— o puede ser un error de
configuración. **Que el administrador lo mire antes de pagar.**

**Commit.**

---

# BLOQUE 4 · LA EJECUCIÓN

| # | Requisito |
|---|---|
| RF-370 | Ejecutarse en pasos, no en una sola acción |
| RF-377 | Confirmación explícita |
| RF-378 | Calcular activación, residual, rango y global si toca |
| RF-379 | Abonar todas las comisiones a las billeteras |
| RF-382 | Un ciclo cerrado no admite escrituras |
| RF-383 | Abrir automáticamente el ciclo siguiente |

## 🔴 Todo dentro de UNA transacción

```
   Si algo falla a mitad, NADA queda escrito.
   Un ciclo medio cerrado es peor que uno sin cerrar.
```

## 🔴 Y protección contra el doble cierre

**Igual que en la P-23, con un UPDATE condicional:**

```sql
UPDATE ciclo
   SET estado = 'cerrado', cerrado_en = now(), cerrado_por = :adminId
 WHERE id = :cicloId
   AND estado = 'abierto';    -- ← la protección
```

**Si devuelve 0 filas, ya estaba cerrado: se aborta y no se paga nada.**

## RF-379 · Las billeteras — la primera vez que se llenan

`wallet_movimiento` está vacía desde el principio del proyecto. **Aquí es donde
se llena.**

```
   Por cada comisión del ciclo:
      socio_id · ciclo_id · comision_id
      tipo = 'abono'
      concepto = 'Bono de patrocinio, ciclo 3' (legible por una persona)
      monto_cent
      saldo_despues_cent   ← 🔴 el saldo acumulado DESPUÉS de este abono
```

**`saldo_despues_cent` es un saldo corrido.** Cada fila lleva cuánto quedó el
socio después de ese movimiento. Se calcula sumando al saldo anterior, en orden.

**Es lo que permite auditar la billetera sin recalcular todo el histórico.**

## RF-383 · El ciclo siguiente

```sql
INSERT INTO ciclo (anio, mes, fecha_inicio, fecha_fin, estado)
VALUES (..., 'abierto');
```

**Y solo puede haber un ciclo abierto a la vez.** Compruébalo antes de insertar.

**Commit.**

---

# BLOQUE 5 · RF-384 y RF-385 · LA EXPORTACIÓN PARA EL BANCO

```
   RF-384   exportar la liquidación para el pago bancario
   RF-385   incluir socio, monto, banco y cuenta
```

**Este archivo es el que Máximo va a subir al banco o usar para transferir.**

```
   codigo · nombre completo · documento · banco · cuenta · monto
```

## Dos avisos que hay que dar en pantalla

```
   ⚠️  Socios sin datos bancarios registrados: N
       No pueden cobrar hasta que los completen en su perfil

   ⚠️  Socios por debajo del mínimo de retiro (S/. 100): N
       Su saldo queda acumulado para el mes siguiente
```

**El mínimo se lee de `config.monto_minimo_retiro_cent`.**

**Commit.**

---

# BLOQUE 6 · PRUEBAS — las más importantes del proyecto

```
   LA VISTA PREVIA NO ESCRIBE
   ☐  🔴 contar filas de comision, wallet_movimiento, activacion y ciclo
         antes y después de abrir la vista previa → IDÉNTICAS
   ☐  🔴 cancelar deja todo igual

   EL BLOQUEO DE SEGURIDAD
   ☐  🔴 si el patrocinio supera el 30.8% del techo → NO se puede ejecutar
   ☐  🔴 si el residual supera el 97% → NO se puede ejecutar
   ☐  si el total dobla al del ciclo anterior → pide confirmación extra

   EL DOBLE CIERRE
   ☐  🔴 cerrar dos veces el mismo ciclo NO paga dos veces
   ☐  🔴 el segundo intento devuelve 0 filas y aborta

   EL RESETEO QUE NO BORRA
   ☐  🔴 después del cierre, movimiento_puntos conserva TODAS sus filas
   ☐  🔴 activacion del ciclo cerrado conserva sus puntos
   ☐  el socio empieza el ciclo nuevo en 0 porque no tiene filas ahí

   LAS BILLETERAS
   ☐  la suma de wallet_movimiento del ciclo = la suma de comision del ciclo
   ☐  saldo_despues_cent es un saldo corrido correcto
   ☐  un socio con 3 abonos tiene el saldo acumulado bien en el tercero

   EL CICLO CERRADO
   ☐  🔴 no se puede insertar una orden en un ciclo cerrado
   ☐  se abrió exactamente un ciclo nuevo, y solo uno
   ☐  no quedan dos ciclos abiertos a la vez

   LA TRANSACCIÓN
   ☐  🔴 si falla a mitad, el ciclo NO queda en 'cerrado'
```

**Con números calculados a mano.** El ciclo 3 debe pagar exactamente
**S/. 13,479.68** según lo ya calculado — patrocinio 679,540 + residual 608,428
+ rango 60,000 céntimos.

**Commit.**

---

# BLOQUE 7 · VERIFICAR CONTRA LA BASE

```sql
-- 🔴 0 filas: el histórico de puntos sigue completo
SELECT 1 WHERE (SELECT count(*) FROM movimiento_puntos) < 1042;

-- 🔴 0 filas: ninguna comisión duplicada por el cierre
SELECT ciclo_id, beneficiario_id, orden_id, tipo, nivel, count(*)
FROM comision GROUP BY 1,2,3,4,5 HAVING count(*) > 1;

-- la billetera cuadra con las comisiones del ciclo
SELECT c.ciclo_id,
       (SELECT sum(monto_cent) FROM comision  WHERE ciclo_id=c.ciclo_id) comisiones,
       (SELECT sum(monto_cent) FROM wallet_movimiento WHERE ciclo_id=c.ciclo_id) billetera
FROM (SELECT DISTINCT ciclo_id FROM comision) c ORDER BY 1;

-- 🔴 0 filas: el saldo corrido está mal en alguna fila
WITH corrido AS (
  SELECT id, socio_id, saldo_despues_cent,
         sum(monto_cent) OVER (PARTITION BY socio_id ORDER BY id) real
  FROM wallet_movimiento)
SELECT id FROM corrido WHERE saldo_despues_cent <> real;

-- 🔴 0 filas: dos ciclos abiertos a la vez
SELECT 1 WHERE (SELECT count(*) FROM ciclo WHERE estado='abierto') > 1;

-- 🔴 0 filas: ninguna orden escrita en un ciclo cerrado después de cerrarlo
SELECT o.id FROM orden o JOIN ciclo c ON c.id=o.ciclo_id
WHERE c.estado='cerrado' AND o.creada_en > c.cerrado_en;

-- el reparto del ciclo cerrado no supera los techos
SELECT tipo, sum(monto_cent) FROM comision WHERE ciclo_id=3 GROUP BY 1;
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ El motor de comisiones     se USA en seco y en firme, no se cambia
   ❌ La red simulada            NO resembrar. 501 socios, ni uno más
   ❌ comision · wallet          libros de SOLO-AGREGAR
   ❌ movimiento_puntos          🔴 NUNCA se borra. Es el histórico
   ❌ P-20 · P-26 · P-27 · P-28 · P-29    son la tanda 5B
```

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 7 consultas del bloque 7
   2 · El conteo de filas ANTES y DESPUÉS de abrir la vista previa
   3 · Cómo protegiste el doble cierre, con el código
   4 · Una captura de la vista previa con los totales
   5 · git status --short vacío, pegado literal
```

**Y si algo no te cuadra, PARA y pregunta.** Este cierre no se puede deshacer.
