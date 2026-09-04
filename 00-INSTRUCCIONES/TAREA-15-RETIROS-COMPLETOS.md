# TAREA-15 · EL FLUJO COMPLETO DE RETIROS

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Punto A3 del `05-CONTROL/PLAN-DE-CIERRE-V1.md`.** Prepara además el A4.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, siempre:

```bash
git status --short
node -e "const fs=require('fs'),p=require('path');(function w(d){for(const f of fs.readdirSync(d)){const q=p.join(d,f);if(fs.statSync(q).isDirectory())w(q);else{const b=fs.readFileSync(q);if(b.includes(0))console.log('NULL:',q)}}})('src')"
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**
**Commit después de CADA bloque.**

---

# EL PROBLEMA

El socio **ya puede pedir** el retiro — la TAREA-13 arregló el insert y hay 4
solicitudes reales en la base. Pero:

```
   ❌ Nadie las aprueba ni las rechaza
      estado, motivo_rechazo, procesado_por, procesado_en
      existen en la tabla y NADIE los escribe

   ❌ La billetera nunca se descuenta
      wallet_movimiento: 470 filas, TODAS de tipo 'abono'. Cero débitos.
      El saldo del socio crece para siempre y es mentira.
```

## Fuente del requisito

```
   Alcance 26/08, agregado nº2:
     "el socio solicita desde su backoffice · mínimo S/. 100 ·
      Máximo aprueba o rechaza · queda el registro"
     "una pantalla en cada lado"

   RF-293   solicitar retiro con aprobación del administrador
   RF-294   validar el mínimo de S/. 100

   15-ASI-SE-VE-EL-BACKOFFICE:
     "El socio solicita → Máximo aprueba → Máximo paga fuera del
      sistema y marca"
     El movimiento se ve así:  "05 jul  Retiro aprobado − S/. 500.00"
```

---

# LO QUE YA EXISTE — NO SE RECONSTRUYE

**Verificado contra Postgres el 4/09:**

```sql
   -- v_wallet_saldo suma TODOS los movimientos
   SELECT socio_id, COALESCE(sum(monto_cent),0)::bigint AS saldo_cent
   FROM wallet_movimiento GROUP BY socio_id;
```

> 🔴 **Consecuencia clave:** un débito es simplemente una fila con
> `monto_cent` **NEGATIVO**. El saldo baja solo. **No se toca la vista.**

```
   solicitud_retiro   id · socio_id · monto_cent · banco · cuenta
                      estado · motivo_rechazo · procesado_por
                      procesado_en · solicitado_en
                      ← la tabla está completa, no le falta nada

   wallet_movimiento  socio_id · ciclo_id · comision_id · tipo
                      concepto · monto_cent · saldo_despues_cent
```

---

# BLOQUE 1 · LA PANTALLA DEL ADMIN · P-30 RETIROS

Nueva entrada en el menú del admin, después de "Cierre de ciclo".

## Qué muestra

```
   Cola de solicitudes PENDIENTES, la más antigua primero

   Por cada una:
     socio (código y nombre) · monto solicitado
     banco y cuenta que escribió el socio
     saldo ACTUAL del socio (de v_wallet_saldo)
     fecha de la solicitud

   Dos botones:  Aprobar   ·   Rechazar
```

## 🔴 La validación que evita pagar de más

Karla tiene hoy **S/. 1,890 de saldo y 4 solicitudes pendientes de S/. 100**.
Nada le impide pedir 20 veces S/. 100 aunque no le alcance.

```
   Al APROBAR se valida contra el saldo REAL en ese momento:

     si monto_solicitado > saldo_actual  →  NO se aprueba
                                            se muestra el saldo real
                                            y se ofrece rechazar
```

**La validación va en la aprobación, no solo en la solicitud.** Entre que el
socio pide y Máximo aprueba puede haber pasado cualquier cosa.

Además, en la pantalla del socio (P-19) se muestra:

```
   Saldo disponible ......... S/. 1,890.00
   Comprometido en solicitudes S/.   400.00   ← 4 × 100 pendientes
   Libre para solicitar ..... S/. 1,490.00
```

**Commit.**

---

# BLOQUE 2 · APROBAR — Y EL DÉBITO

Al aprobar, **en una sola transacción**:

```
   1 · solicitud_retiro
         estado = 'aprobado'
         procesado_por = id del admin
         procesado_en = now()

   2 · wallet_movimiento — UNA FILA NUEVA
         tipo               'retiro'
         concepto           'Retiro aprobado'
         monto_cent         NEGATIVO  (−monto solicitado)
         saldo_despues_cent saldo anterior − monto
         ciclo_id           el ciclo abierto
         comision_id        null
```

## Reglas de hierro de este bloque

```
   🔴 monto_cent va NEGATIVO. La vista suma; si va positivo,
      aprobar un retiro AUMENTA el saldo. Sería el peor error
      posible de esta tarea.

   🔴 NO se hace UPDATE ni DELETE sobre wallet_movimiento.
      Es append-only. Si un retiro se anula, se agrega OTRA fila
      positiva con concepto 'Reversión de retiro'. Nunca se borra.

   🔴 saldo_despues_cent debe seguir la cadena.
      Se lee el último movimiento del socio y se resta.
      Si la cadena se rompe, el historial deja de cuadrar.

   🔴 Si el débito falla, la solicitud NO queda aprobada.
      Una solicitud aprobada sin su débito es dinero que se paga
      dos veces.
```

**Commit.**

---

# BLOQUE 3 · RECHAZAR

```
   1 · solicitud_retiro
         estado = 'rechazado'
         motivo_rechazo = el texto que escriba el admin (obligatorio)
         procesado_por · procesado_en

   2 · NO se toca la billetera. Ni una fila.
```

El motivo es obligatorio: el socio lo va a ver en su P-19 y es lo que evita el
mensaje de WhatsApp preguntando por qué.

**Commit.**

---

# BLOQUE 4 · LA DETRACCIÓN — SOLO EL MECANISMO

> ## ⚠️ EL PORCENTAJE NO SE INVENTA
>
> `03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE`, en "lo que este documento no
> resuelve", punto 4:
>
> > **"El porcentaje exacto de la detracción — Confirmar con el contador de
> > Máximo"**
>
> **Está sin definir por escrito.** No se pone un número inventado ni uno
> sacado de internet.

## Qué se construye

```
   1 · Nueva clave en config:  pct_detraccion   valor: null
       editable desde P-26, junto a umbral_detraccion_cent

   2 · En la pantalla de aprobación, si el monto supera el umbral
       (config.umbral_detraccion_cent = 70000, o sea S/. 700):

       CON pct_detraccion definido:
          Monto solicitado ....... S/. 800.00
          Detracción (X%) ........ − S/.  __
          Neto a transferir ...... S/.  __

       SIN pct_detraccion (hoy):
          Monto solicitado ....... S/. 800.00
          ⚠️ Supera S/. 700 · corresponde detracción
             Porcentaje pendiente de definir con el contador
          Neto a transferir ...... pendiente
```

```
   🔴 El débito de la billetera es SIEMPRE por el monto SOLICITADO
      completo, no por el neto.

      La detracción no es plata que se queda la empresa: es un
      depósito al Banco de la Nación a nombre del socio. Su
      billetera se descuenta por los S/. 800 igual.
```

**El sistema calcula y muestra. NO emite factura** — eso es SUNAT y sigue fuera
de alcance.

**Commit.**

---

# BLOQUE 5 · LAS PRUEBAS

```
   1 · Aprobar un retiro de S/. 100 sobre un saldo de S/. 1,890
       → deja el saldo en S/. 1,790  (número calculado A MANO)

   2 · El movimiento creado tiene monto_cent NEGATIVO (−10000)

   3 · saldo_despues_cent del nuevo movimiento = anterior − 10000

   4 · Aprobar un retiro MAYOR al saldo → falla y no crea movimiento

   5 · Rechazar NO crea ningún movimiento de billetera

   6 · Rechazar sin motivo → falla

   7 · Un socio NO puede aprobar retiros (solo admin) — con sesión real

   8 · Un socio NO ve las solicitudes de otro socio — con sesión real

   9 · Con pct_detraccion en null, un retiro de S/. 800 muestra el
       aviso y NO calcula un neto inventado

  10 · Con pct_detraccion definido, el débito sigue siendo por el
       monto completo, no por el neto
```

**La 2 y la 10 son las que protegen el dinero.** La 2 porque un signo invertido
haría que aprobar un retiro sume saldo. La 10 porque descontar el neto en vez
del total deja al socio con plata que ya no tiene.

**Commit.**

---

# BLOQUE 6 · VERIFICACIÓN CONTRA POSTGRES

Correr y **pegar la salida literal**:

```sql
-- 1 · ¿existen ya débitos, y son negativos?
SELECT tipo, COUNT(*) n, SUM(monto_cent) suma_cent
FROM wallet_movimiento GROUP BY tipo ORDER BY tipo;
-- 'retiro' debe tener suma NEGATIVA

-- 2 · la cadena de saldo de Karla, en orden
SELECT id, tipo, concepto, monto_cent, saldo_despues_cent
FROM wallet_movimiento WHERE socio_id=12 ORDER BY id;
-- cada saldo_despues_cent = el anterior + su monto_cent

-- 3 · el saldo de la vista coincide con el último movimiento
SELECT (SELECT saldo_cent FROM v_wallet_saldo WHERE socio_id=12) vista,
       (SELECT saldo_despues_cent FROM wallet_movimiento
        WHERE socio_id=12 ORDER BY id DESC LIMIT 1) ultimo;
-- los dos números deben ser IGUALES

-- 4 · ninguna solicitud aprobada quedó sin su débito
SELECT COUNT(*) FROM solicitud_retiro sr
WHERE sr.estado='aprobado'
  AND NOT EXISTS (SELECT 1 FROM wallet_movimiento w
                  WHERE w.socio_id=sr.socio_id AND w.tipo='retiro'
                    AND w.monto_cent = -sr.monto_cent);
-- debe devolver 0
```

**La consulta 3 es la que de verdad cierra esto.** Si la vista y el último
movimiento no coinciden, la cadena de saldo se rompió y el historial deja de
cuadrar.

## Y las capturas

```
   1 · P-30 con la cola de solicitudes pendientes
   2 · El detalle de una aprobación mostrando el saldo del socio
   3 · P-19 del socio mostrando el movimiento "Retiro aprobado − S/. 100.00"
       y el saldo ya descontado
   4 · La solicitud de S/. 800 mostrando el aviso de detracción pendiente
```

**Imágenes, no descripciones.**

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 4 consultas
   2 · Las 4 capturas
   3 · git status --short vacío, pegado literal
   4 · npx vitest run en verde
```

---

# LO QUE NO SE TOCA

```
   ❌ v_wallet_saldo — la vista está bien, suma y ya
   ❌ src/motor/ — todo
   ❌ fn_ejecutar_cierre_ciclo y las demás funciones SQL
   ❌ La tabla solicitud_retiro — está completa, no le falta columna
   ❌ Los movimientos de billetera existentes — append-only
   ❌ El campo CCI — es el punto C1, otra tarea
```

---

# 🔴 REGLA NUEVA Y PERMANENTE

**Ningún UPDATE masivo sobre datos históricos** —`comision`, `wallet_movimiento`,
`voucher`, `orden`, `movimiento_puntos`, `activacion`— salvo que la tarea lo pida
por escrito y con la consulta exacta.

Si una verificación no da el resultado esperado, **se corrige el código, no el
dato**.

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

```
   socios              505
   órdenes           1,055   ← después de borrar la orden 1370
   comisiones        2,422   ·   S/. 101,911.02
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   ciclos abiertos       1   (ciclo 6, noviembre)

   wallet_movimiento   470 · TODAS 'abono'
   → después de esta tarea habrá filas 'retiro' con monto NEGATIVO
     y el saldo de Karla habrá BAJADO. Eso es lo esperado.
```

**Después de esta tarea sigue A6: venta a cliente final.**
