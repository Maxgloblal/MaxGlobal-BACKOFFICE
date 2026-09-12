# TAREA-32 · CORRECCIONES DEL QA DEL 8/09

**Para:** Antigravity
**Escrita:** 8 de septiembre de 2026
**Fase:** corrección de bugs

> El QA de la TAREA-31 barrió 23 pantallas. **Casi todo estaba bien.**
> De todo lo reportado, solo tres cosas son fallas reales, y una cuarta está
> pendiente de una prueba.
>
> Las cifras del reporte se contrastaron contra Postgres una por una.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**:

```bash
git status --short
npm run build
npx vitest run
```

**Commit después de CADA bloque.**

---

# LO QUE EL QA CONFIRMÓ COMO CORRECTO — no se toca

```
   509 socios · 683 auditoría · 3 retiros pendientes
   8 órdenes en estado `por_confirmar`
   127 solicitudes en estado `nueva`
   1 socio activo en diciembre (ANA QUISPE · 400 pts)
   Karla · ciclo 6 · "Residual" nivel 1 · 40% · S/. 28.80
   Ningún botón de borrar producto
   El correo del socio no es editable
```

```
   ✅ La comisión SÍ se llama "Residual" en pantalla, y muestra
      "BONO PATROCINIO: S/. 0.00" al lado. No hay error de
      etiqueta. Se descarta esa sospecha.

   ✅ El Convertir con pack_codigo 'gold' funciona: el frontend
      normaliza con toLowerCase() y asigna Pack Gold.
```

---

# BLOQUE 1 · 🔴 P-25 · EL CSV VACÍO NO EXPLICA NADA

## Qué pasó, verificado el 8/09

```
   Karla ganó en el ciclo 6      S/.  28.80
   Mínimo de retiro (config)     S/. 100.00   ← no llega
   Su CCI                        vacío        ← tampoco es apta
```

```js
   operacionAdmin.js:917
   .filter(f => f.aptoParaPago)
```

**El CSV salió con la cabecera sola, y estuvo bien.** No se le puede mandar al
banco una transferencia de S/. 28.80 cuando el mínimo son S/. 100, y menos sin
CCI.

```
   🔴 El bug NO es el filtro. El filtro es correcto.
      El bug es que el sistema NO DICE quién quedó fuera
      ni por qué, teniendo el dato en la mano.
```

## El servicio ya calcula todo lo que hace falta

```js
   sociosSinBanco            ya existe
   sociosSinCci              ya existe
   sociosDebajoMinimo        ya existe
   cantidadSociosSinDatosOIncompletos   ya existe
```

**Están calculados y no se muestran.** Solo hay que sacarlos a la pantalla.

## Lo que debe mostrar P-25

```
   ⚠️  1 socio ganó comisiones y NO se le puede pagar:

       KARLA DIAZ · MG00012 · S/. 28.80
       · su saldo no llega al mínimo de S/. 100.00
       · no tiene CCI registrado

       Su dinero queda en su billetera para el próximo mes.
```

```
   1 · Una línea por socio excluido, con el motivo exacto
   2 · Si un socio falla por dos motivos, se listan los dos
   3 · Si el CSV va a salir sin filas, avisarlo ANTES
       de descargarlo, no después
   4 · Dejar claro que el dinero NO se pierde:
       queda en la billetera
```

> **Por qué importa:** el día que Máximo cierre un mes con 200 socios, va a
> bajar el archivo y no va a saber a quién le faltó qué. Y la gente va a
> reclamar su plata.

**Commit.**

---

# BLOQUE 2 · P-12 CUENTA UNO DE MÁS

```
   La pantalla dice    508 descendientes
   red_ancestro tiene  507
```

Verificado: `SELECT COUNT(*) FROM red_ancestro WHERE ancestro_id = <Máximo>`
devuelve **507**, y los 507 son distintos. **La pantalla se está contando a sí
misma.**

```
   Con 509 socios en total y Máximo en la raíz:
   508 = todos menos él
   507 = los que de verdad cuelgan de él
```

```
   El socio NO es descendiente de sí mismo.
   Corregir el conteo, no la tabla.
```

**Commit.**

---

# BLOQUE 3 · P-26 MUESTRA 38 DE 39 CLAVES

```
   config tiene   39 claves
   P-26 muestra   38
   La que falta   valor_punto_soles
```

```
   Averigua POR QUÉ no sale.
   · ¿está filtrada a propósito?
   · ¿se cayó de una lista?
```

```
   🔴 valor_punto_soles = 4.167 y NO toca comisiones
      (el que las toca es valor_punto_comision = 1.00).
      Es solo para reportes de volumen.

      Si está oculta a propósito, la pantalla debe decir
      "38 de 39 · 1 clave interna no editable".
      Si se cayó por error, se muestra.

      Lo que NO puede pasar es que el contador diga 38
      cuando hay 39. Eso hace dudar de todo lo demás.
```

**Commit.**

---

# BLOQUE 4 · 🔴 EL pack_codigo QUE NO EXISTE

## El estado, verificado el 8/09

```
   pack_codigo en solicitud_afiliacion:

   PRO                123   ✗ no existe   (todas de prueba)
   EMPRENDEDOR         18   ✓
   GOLD                18   ✓
   gold                 1   ✓ funciona por toLowerCase()
   kit-emprendedor      1   ✗ NO EXISTE   ← solicitud real #80
```

```
   Códigos reales: EMPRENDEDOR · EJECUTIVO · GOLD ·
                   FAMILIAR · EMPRESARIAL
```

## 🔴 Primero DIAGNOSTICAR

```
   Dale CONVERTIR a la solicitud #80 (pack_codigo
   'kit-emprendedor', correo test@test.test.es)

   ¿Precarga el pack, lo deja vacío, o da error?
```

**Reporta cuál antes de tocar nada.**

## Después, la corrección — en el ORIGEN

```
   El formulario de la landing manda el `id` de config.js
   ('kit-emprendedor') en vez del código del pack
   ('EMPRENDEDOR').

   Con GOLD coincide de casualidad. Con los otros cuatro no:
     kit-emprendedor   ≠  EMPRENDEDOR
     pack-ejecutivo    ≠  EJECUTIVO
     pack-familiar     ≠  FAMILIAR
     pack-empresarial  ≠  EMPRESARIAL
```

```
   1 · El backoffice acepta y normaliza lo que ya está
       guardado, para que las 2 solicitudes reales se
       puedan convertir

   2 · 🔴 Y se VALIDA al guardar: un pack_codigo que no
       exista en la tabla `pack` se rechaza.
       Por eso entraron 123 "PRO" sin que nada chillara.
```

```
   🔴 La landing es OTRO proyecto. NO la toques en esta tarea.
      Anota que hay que corregir el formulario allá y lo
      hacemos aparte.
```

**Commit.**

---

# BLOQUE 5 · LAS PRUEBAS

```
   1 · Con un socio que gana menos del mínimo, P-25 lo
       nombra en la lista de excluidos con su motivo
       ← número a mano: KARLA · S/. 28.80 · bajo el mínimo

   2 · Con un socio sin CCI, aparece el motivo "sin CCI"
   3 · Un socio con DOS motivos aparece con los dos
   4 · Si no hay filas que exportar, P-25 lo avisa antes
       de permitir la descarga

   5 · El conteo de descendientes de Máximo es 507, no 508
   6 · Un socio sin frontales cuenta 0, no 1

   7 · P-26 muestra las 39 claves, o dice por qué son 38
   8 · Un pack_codigo inexistente es RECHAZADO al guardar
       una solicitud
   9 · La solicitud #80 se puede convertir y le asigna
       Kit Emprendedor
```

**La 1 y la 8 son las que importan.** La 1 porque es plata que alguien va a
reclamar. La 8 porque es lo que dejó entrar 123 registros basura.

**Commit.**

---

# BLOQUE 6 · VERIFICACIÓN

```sql
-- 1 · los pack_codigo que no existen
SELECT s.pack_codigo, COUNT(*),
       EXISTS(SELECT 1 FROM pack p WHERE upper(p.codigo)=upper(s.pack_codigo)) existe
FROM solicitud_afiliacion s GROUP BY s.pack_codigo ORDER BY 2 DESC;

-- 2 · los descendientes reales de Máximo
SELECT COUNT(*) FROM red_ancestro
WHERE ancestro_id=(SELECT id FROM socio WHERE codigo='MG00001');
-- 507

-- 3 · las claves de configuración
SELECT COUNT(*) FROM config;
-- 39

-- 4 · lo que Karla ganó y su saldo
SELECT (SELECT SUM(monto_cent)/100.0 FROM comision
        WHERE beneficiario_id=s.id AND ciclo_id=6) gano,
       (SELECT SUM(monto_cent)/100.0 FROM wallet_movimiento
        WHERE socio_id=s.id) saldo
FROM socio s WHERE s.codigo='MG00012';
-- 28.80 y 1718.80 · 🔴 no pueden cambiar
```

## Capturas

```
   1 · P-25 mostrando a Karla en la lista de excluidos,
       con sus dos motivos
   2 · P-25 avisando antes de descargar un CSV sin filas
   3 · P-12 con 507
   4 · La solicitud #80 convertida con Kit Emprendedor
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ El filtro aptoParaPago — es CORRECTO
   ❌ monto_minimo_retiro_cent = 10000 — es una regla, no un bug
   ❌ El cálculo de comisiones · src/motor/ · el cierre
   ❌ Los 28.80 de Karla ni su saldo de 1,718.80
   ❌ La landing — otro proyecto
   ❌ Las 123 solicitudes "PRO" — basura, se limpia en TAREA-28
```

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

```
   socios              509
   comisiones        2,423   ·   S/. 101,939.82
   red_ancestro      3,960 filas
   ciclos abiertos       1   (ciclo 30 · diciembre 2026)
   config               39 claves
   solicitudes         161   (127 nuevas · 17 convertidas · 17 descartadas)
   órdenes           1,063   (1,055 confirmadas · 8 por_confirmar)
   Karla · saldo  S/. 1,718.80
```
