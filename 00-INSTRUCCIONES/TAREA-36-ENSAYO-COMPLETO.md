# TAREA-36 · EL ENSAYO COMPLETO

**Para:** Antigravity
**Escrita:** 14 de septiembre de 2026
**Continúa el Bloque 4 de la TAREA-35**

> El ensayo anterior probó **un bono de tres**. Esta tarea cierra el resto.
> Cuando esto pase, nada del plan de compensación queda sin probar en una base
> instalada desde cero.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**:

```bash
git status --short
npm run build
npx vitest run
```

**Cada número de esta tarea se pega tal como lo devuelve la base.**

---

# LO QUE EL ENSAYO ANTERIOR DEJÓ FUERA

Verificado el 14/09 contra `uesyashbodhvlqchuokj`:

```
   patrocinio            1 comisión · S/. 72.00    ✅ probado
   residual              0                         🔴 sin probar
   rango                 0                         🔴 sin probar
   rango_ciclo           0 filas                   🔴 el motor no corrió
   solicitud_retiro      0                         🔴 sin probar
   solicitud_afiliacion  0                         🔴 sin probar
```

**La red era demasiado corta:** `Admin → Carlos → Diana`, sin recompras por
debajo. El residual nunca tuvo a quién pagarle.

---

# LA RED DEL ENSAYO NUEVO

```
        ADMIN
          │
        ANA  ────────┬──────────┬─────────┐
          │          │          │         │
        BETO       CARLA      DIEGO     ELENA
          │
        FANNY
```

```
   ANA     Pack Gold      S/. 1,200   10 niveles residual
   BETO    Pack Ejecutivo S/.   360    5 niveles
   CARLA   Pack Ejecutivo S/.   360
   DIEGO   Pack Ejecutivo S/.   360
   ELENA   Kit Emprendedor S/.  120    0 niveles  ← el caso raro
   FANNY   Pack Ejecutivo S/.   360
```

**Con esta forma se prueban los tres bonos, la línea estirada y la regla de
activación.** Seis socios, ni uno más.

---

# BLOQUE 1 · 🔴 EL BONO RESIDUAL

## Las reglas, del documento maestro

```
   00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO.md línea 397

   N1 40% · N2 20% · N3 10% · N4 5% · N5 3%
   N6 2%  · N7 1%  · N8 10% · N9 5% · N10 1%
   ─────────────────────────────────────────
   Total 97%

   🔴 El nivel 8 paga MÁS que el 7. Es a propósito.
```

```
   Regla 1 · 1 punto = S/. 1.00 para comisiones
   Regla 2 · El residual es SOLO sobre recompras,
             nunca sobre packs de afiliación
```

## Qué hacer

```
   1 · FANNY hace una recompra de 100 puntos exactos
   2 · Confirmar el pago
   3 · Cerrar el ciclo
```

## Los números que TIENEN que salir

```
   Base: 100 puntos × S/. 1.00 = S/. 100.00

   BETO   (N1 de Fanny)   40%  →  S/. 40.00
   ANA    (N2 de Fanny)   20%  →  S/. 20.00
   ADMIN  (N3 de Fanny)   10%  →  S/. 10.00
   ──────────────────────────────────────────
   Pagado                        S/. 70.00
   Retenido por la empresa       S/. 27.00  (el 27% restante)
```

```
   🔴 Los tres tienen que estar ACTIVOS para cobrar.
      Si alguno no llega a 70 puntos personales, su parte
      NO se paga y se queda en la empresa. Sin compresión:
      nadie de abajo hereda ese dinero.
```

**Pega la consulta de `comision` con tipo, nivel, beneficiario y monto.**

**Commit.**

---

# BLOQUE 2 · 🔴 SIN ACTIVACIÓN NO COBRA — la regla 4

```
   06-DOCUMENTO-MAESTRO.md · regla 4
   "Sin activación no cobra nada"
   → "si un socio no llega a los 70 puntos pierde todo"
```

## Qué hacer

```
   1 · DIEGO NO compra nada en el ciclo
   2 · Su descendencia sí genera puntos
   3 · Cerrar el ciclo
```

## Lo que tiene que pasar

```
   · DIEGO cobra S/. 0.00
   · Su parte NO baja al siguiente nivel
   · Esa plata queda en la empresa
   · 🔴 DIEGO conserva sus puntos acumulados (regla 5)
```

**Commit.**

---

# BLOQUE 3 · 🔴 EL BONO DE RANGO Y LA LÍNEA ESTIRADA

`rango_ciclo` quedó en **0 filas** en el ensayo anterior: ese motor no llegó a
ejecutarse nunca.

## La regla de línea estirada

```
   Cada línea frontal aporta como máximo el 50% de los
   puntos que exige el rango.   config.linea_estirada_pct = 50
```

## Qué hacer

```
   ANA tiene 4 frontales: BETO · CARLA · DIEGO · ELENA
   Hacer que sus ramas generen puntos DESIGUALES,
   con una rama muy por encima de las otras.
```

## Lo que hay que comprobar

```
   1 · rango_ciclo tiene filas · ya no es 0
   2 · La rama más grande aparece TOPADA al 50%
   3 · puntos_computables < puntos_grupales
   4 · Si ANA califica, cobra el bono de su rango
   5 · 🔴 El rango NO es apilable (regla 9):
       cobra SOLO el bono del rango alcanzado,
       no la suma de los anteriores
   6 · 🔴 Los puntos GRUPALES no incluyen los personales
       (regla 14)
```

```
   Pega el desglose por rama: puntos de cada una,
   cuánto computa cada una, y el total.
```

**Commit.**

---

# BLOQUE 4 · 🔴 EL KIT EMPRENDEDOR — el caso raro

```
   06-DOCUMENTO-MAESTRO.md · regla 12
   "Kit Emprendedor: 41.7% al nivel 1 · S/. 50 por kit.
    NO usa la escala de 7 niveles."
```

```
   niveles_patrocinio = 0
   niveles_residual   = 0
```

## Qué comprobar

```
   1 · Afiliar a ELENA con Kit (S/. 120)
       → su patrocinador ANA cobra S/. 50.00 exactos,
         NO el 20% de 120 (que serían S/. 24)
   2 · Nadie más arriba cobra por ese kit
   3 · ELENA no cobra comisiones de nadie:
       sus niveles son 0
   4 · ELENA sí puede invitar a otros Kit
```

> Es el único pack con comisión de monto fijo. Si el motor le aplica la escala
> normal, Máximo paga de menos y nadie lo nota.

**Commit.**

---

# BLOQUE 5 · EL RETIRO COMPLETO

```
   regla 17 · cierre el último día del mes · pago a los 3 días
              mínimo de retiro S/. 100
```

## El recorrido

```
   1 · BETO tiene S/. 40.00 en billetera → pide retiro
       🔴 debe RECHAZARSE: no llega al mínimo de S/. 100

   2 · ANA acumula más de S/. 100 → pide retiro
   3 · El admin lo aprueba en P-30
   4 · Se descarga el CSV de liquidación bancaria
   5 · 🔴 ANA aparece en el CSV con su banco, cuenta y CCI

   6 · Un socio SIN CCI pide retiro por encima del mínimo
       → P-25 lo nombra entre los excluidos, con el motivo
       (esto lo arregló la TAREA-32)
```

```
   🔴 El saldo de la billetera tiene que bajar al aprobar.
      Verificado en la demo el 4/09: el retiro genera un
      movimiento NEGATIVO y el saldo corriente cuadra.
```

**Commit.**

---

# BLOQUE 6 · EL CAMINO DEL SOCIO NUEVO — de la web al backoffice

`solicitud_afiliacion` quedó en **0**: el camino principal del negocio no se
probó.

```
   1 · Entrar a la landing con  ?ref=<código de ANA>
   2 · Llenar el formulario eligiendo Pack Ejecutivo
   3 · La solicitud aparece en P-31 con ANA como referente
   4 · 🔴 Comprobar qué pack_codigo llegó:
       si es 'pack-ejecutivo', el trigger debe normalizarlo
       a EJECUTIVO (TAREA-32)
   5 · Convertir la solicitud → nace el socio
   6 · Cuelga de ANA en red_ancestro
   7 · Un pack_codigo inventado es RECHAZADO
```

**Commit.**

---

# BLOQUE 7 · LO QUE FALTA DE OPERACIÓN DIARIA

```
   1 · UPGRADE: BETO pasa de Ejecutivo a Gold
       · paga el pack COMPLETO S/. 1,200 (regla 18)
       · su patrocinador cobra patrocinio sobre 1,200
       · al confirmar, su pack cambia y sus niveles suben
       · un pack MÁS BARATO es rechazado

   2 · BAJA DE SOCIO: dar de baja a BETO
       · FANNY sube un nivel y cuelga de ANA (regla 19)
       · red_ancestro se reconstruye sin incoherencias

   3 · VENTA A CLIENTE FINAL
       · precio público, 0% de descuento
       · los puntos van al socio que vendió

   4 · PRODUCTOS: crear uno nuevo en P-32 con foto
       · aparece en la tienda con su precio de socio
       · 🔴 su imagen_url apunta al bucket del proyecto
         NUEVO, no al de la demo

   5 · RESETEO DE PUNTOS (regla 7)
       · al cerrar el ciclo, los puntos personales
         vuelven a cero para el mes siguiente
```

**Commit.**

---

# BLOQUE 8 · EL CUADRO FINAL

Al terminar, una sola tabla con **todo lo probado y su número**:

```
   Bono patrocinio     S/. ___   niveles ___
   Bono residual       S/. ___   niveles ___
   Bono de rango       S/. ___
   Kit (monto fijo)    S/. 50.00
   ────────────────────────────────────────
   Total pagado        S/. ___
   Retenido empresa    S/. ___
   Suma                = total generado

   rango_ciclo           ___ filas   (antes 0)
   solicitud_afiliacion  ___         (antes 0)
   solicitud_retiro      ___         (antes 0)
   red_ancestro          ___ · 0 incoherencias
   ciclos abiertos         1
```

```
   🔴 La consulta de coherencia de la red, la misma que
      usamos en la demo:
      cada fila de red_ancestro con su nivel correcto
      → 0 incoherencias
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ utlohnidkuvxqppmoevj — la demo de Máximo
      509 socios · 2,423 comisiones · S/. 101,939.82
   ❌ Los porcentajes del plan · config · nivel_comision
   ❌ src/motor/ — solo se OBSERVA lo que calcula
   ❌ La landing y el backoffice desplegados
```

> Esta tarea **no cambia código**. Si encuentras un fallo, lo anotas y sigues.
> Las correcciones salen después, juntas.

---

# SI ALGO FALLA

```
   No lo parchees en el proyecto de ensayo.

   1 · Anota qué falló y con qué números
   2 · Termina el resto del recorrido
   3 · Reporta el cuadro completo con los fallos marcados
```

**Un fallo aquí vale oro: es un fallo que Máximo no va a sufrir con gente
adentro.**
