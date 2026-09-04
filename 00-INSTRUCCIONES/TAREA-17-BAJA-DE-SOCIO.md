# TAREA-17 · BAJA DE SOCIO CON REENGANCHE DE RED

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Punto A5 del `05-CONTROL/PLAN-DE-CIERRE-V1.md`.**

> ## 🔴 LA OPERACIÓN MÁS DELICADA DEL SISTEMA
>
> El propio documento de alcance lo dice: *"Es la operación más delicada del
> sistema y se hace con cuidado."*
>
> **Toca `red_ancestro`, que es de lo que depende el residual de 10 niveles.**
> Si la red queda mal armada, **el sistema NO da ningún error**: simplemente
> paga cantidades equivocadas todos los meses a 500 personas, y nadie se entera
> hasta que un líder reclama.
>
> **Esta tarea va sola. No se mezcla con ninguna otra.**

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

# LA REGLA — ya decidida, no se discute

> **`03-SISTEMA/06-MAPA-DE-ESTADOS`, línea 49:**
> *"✅ RESUELTO 26/08 (resp. 14.2): la descendencia **sube un nivel** y se
> engancha al patrocinador del socio dado de baja. Requiere vista previa,
> transacción única y reconstrucción de `red_ancestro`."*

```
   ANTES                        DESPUÉS de dar de baja a PEDRO

   KARLA                        KARLA
    └── PEDRO                    ├── ANA      ← suben un nivel
         ├── ANA                 ├── LUIS
         ├── LUIS                └── ...
         └── ...
                                 PEDRO queda en estado 'baja',
                                 fuera del árbol
```

Otras reglas del mismo documento:

```
   S-4   BAJA la decide el ADMINISTRADOR, con MOTIVO OBLIGATORIO
   S-5   No hay baja automática por inactividad
   Transición válida:  SUSPENDIDO → BAJA
   BAJA → ACTIVO no puede pasar solo: requiere reactivación explícita
```

---

# LO QUE HAY QUE SABER DEL TERRENO

**Todo verificado contra Postgres el 4/09. No lo averigües otra vez.**

## `red_ancestro` es una tabla de cierre

```
   columnas   descendiente_id · ancestro_id · nivel
   filas      3,935
   nivel máx  12
```

Por cada socio guarda **una fila por cada ancestro suyo**, con la distancia.
Es lo que permite subir 10 niveles con un solo `SELECT` en vez de 10 saltos.

## 🔴 Se llena con un TRIGGER que solo corre en INSERT

```sql
   fn_construir_red_ancestro()  → trigger on socio INSERT
     inserta (nuevo, patrocinador, 1)
     y copia los ancestros del patrocinador con nivel+1
```

**No hay ninguna lógica para UPDATE ni para DELETE.** Cambiar el
`patrocinador_id` de alguien **no actualiza `red_ancestro`**. Hay que
reconstruirlo a mano.

## El trigger de columnas inmutables NO te bloquea

```sql
   fn_proteger_columnas_inmutables_socio()
     IF NOT fn_is_admin() THEN ... bloquea patrocinador_id ...
```

Solo bloquea a los no-admin. **Como administrador sí puedes cambiarlo.**

## El único CHECK de la tabla socio

```sql
   chk_no_auto_patrocinio   CHECK (id <> patrocinador_id)
```

Nadie puede ser su propio patrocinador. **Ojo con esto en el reenganche:** si
el socio que se da de baja es el patrocinador de alguien y a la vez su propio
patrocinador fuera esa misma persona, saltaría. No debería pasar, pero la
transacción tiene que fallar limpio si pasa.

## Estados

```
   En la base hoy:  activo · inactivo · pendiente · suspendido
   Falta:           baja
   No hay CHECK constraint sobre estado — se puede agregar el valor
```

---

# 🔴 EL PROBLEMA DE VERDAD: NO BASTA CON LOS HIJOS DIRECTOS

Este es el punto donde esta tarea se rompe si se hace rápido.

```
   ANTES                          Ancestros de LUIS en red_ancestro
   KARLA                            ANA    nivel 1
    └── PEDRO                       PEDRO  nivel 2
         └── ANA                    KARLA  nivel 3
              └── LUIS

   Se da de baja a PEDRO. ANA sube a colgar de KARLA.

   DESPUÉS                        Ancestros de LUIS deben quedar
   KARLA                            ANA    nivel 1
    └── ANA                         KARLA  nivel 2      ← cambió
         └── LUIS                   (PEDRO ya no está)  ← se fue
```

**A LUIS nadie lo tocó, y sin embargo TODA su cadena de ancestros cambió.**

```
   🔴 Hay que reconstruir red_ancestro para el SUBÁRBOL COMPLETO
      del socio dado de baja, no solo para sus hijos directos.

      Si solo se arreglan los hijos, los nietos y bisnietos quedan
      con PEDRO en su cadena — un socio que ya no existe — y el
      residual les paga a 10 niveles equivocados.
```

---

# BLOQUE 1 · LA VISTA PREVIA — antes de tocar nada

Pantalla nueva, o sección dentro de **P-27 Gestión de Socios**.

Al elegir un socio y pulsar "Dar de baja", **antes de ejecutar** muestra:

```
   Socio a dar de baja      PEDRO GARCÍA (MG00123)
   Su patrocinador          KARLA DIAZ (MG00012)
                            ← acá se van a enganchar sus frontales

   Frontales directos       4   (suben un nivel)
   Descendencia total       37  (se les reconstruye la cadena)
   Profundidad del subárbol 5 niveles

   Comisiones que ya cobró  S/. 1,240.00  ← NO se tocan
   Saldo en su billetera    S/.   180.00  ← NO se toca

   Motivo (obligatorio)     [________________]
```

## Reglas

```
   1 · La vista previa NO escribe nada. Ni una fila.

   2 · Si el socio NO tiene patrocinador (es la raíz, MG00001),
       NO se puede dar de baja. Se muestra el motivo y se bloquea
       el botón. Su descendencia no tendría a dónde subir.

   3 · El motivo es OBLIGATORIO (regla S-4). Sin motivo, el botón
       no se habilita.

   4 · Se muestra la lista de los frontales directos con nombre y
       código, para que Máximo vea a quién está moviendo.
```

**Commit.**

---

# BLOQUE 2 · LA EJECUCIÓN — UNA SOLA TRANSACCIÓN

Función nueva en Postgres: `fn_dar_de_baja_socio(p_socio_id, p_motivo, p_admin_id)`.

**Todo dentro de una transacción. Si algo falla, no queda nada a medias.**

```
   1 · Validar que sea admin (fn_is_admin)
   2 · Validar que el socio exista y tenga patrocinador
   3 · Validar que el motivo no esté vacío

   4 · GUARDAR LA ESTRUCTURA ANTERIOR
       El alcance lo exige: "queda registro de la estructura anterior"
       Se guarda en `auditoria`:
         tabla         'socio'
         accion        'baja_con_reenganche'
         registro_id   el id del socio
         datos_antes   el subárbol completo en jsonb:
                       cada descendiente con su patrocinador_id
                       y sus filas de red_ancestro
         datos_despues el resultado
         usuario_id    el admin

   5 · Mover a los frontales directos
       UPDATE socio SET patrocinador_id = <patrocinador del que se va>
       WHERE patrocinador_id = <el que se va>

   6 · RECONSTRUIR red_ancestro DEL SUBÁRBOL COMPLETO
       a · borrar las filas de red_ancestro de TODOS los
           descendientes del socio dado de baja
       b · volver a insertarlas siguiendo la cadena nueva
       c · borrar también las filas donde el socio dado de baja
           era ancestro de alguien

   7 · socio dado de baja:
         estado = 'baja'
         patrocinador_id → se conserva, NO se pone en null
         (para poder reconstruir la historia si hiciera falta)

   8 · Devolver un resumen: frontales movidos, descendientes
       reconstruidos, filas de red_ancestro tocadas
```

## 🔴 Lo que NO se toca, jamás

```
   ❌ comision            append-only. Lo que ya cobró, cobrado está
   ❌ wallet_movimiento   igual. Su saldo se queda como está
   ❌ orden               sus compras siguen en la historia
   ❌ movimiento_puntos   histórico
   ❌ activacion          histórico
   ❌ Los ciclos ya cerrados — no se recalcula NADA hacia atrás
```

**Dar de baja a alguien no reescribe el pasado.** Cambia la red desde hoy hacia
adelante. Las comisiones que ya se pagaron con la estructura vieja estaban bien
en su momento.

**Commit.**

---

# BLOQUE 3 · LAS PRUEBAS — con una red de juguete

**No se prueba sobre los 505 socios.** Se arma una red chica y controlada, se le
da de baja a alguien del medio, y se comprueba cada fila.

```
   La red de prueba:

   A
   └── B
        ├── C
        │    └── E
        └── D

   Se da de baja a B.
   Debe quedar:

   A
   ├── C
   │    └── E
   └── D
```

## Los casos

```
   1 · C y D quedan con patrocinador_id = A

   2 · red_ancestro de C:  A nivel 1     (antes: B=1, A=2)
   3 · red_ancestro de D:  A nivel 1
   4 · red_ancestro de E:  C nivel 1, A nivel 2   (antes: C=1, B=2, A=3)
       ← ESTA ES LA PRUEBA QUE IMPORTA. A E nadie lo tocó y su
         cadena cambió entera.

   5 · No queda NINGUNA fila en red_ancestro con ancestro_id = B

   6 · B queda con estado = 'baja' y su motivo guardado

   7 · Las comisiones de B siguen existiendo, con el mismo monto

   8 · El saldo de billetera de B no cambió

   9 · Se puede reconstruir el árbol anterior desde `auditoria`

  10 · Dar de baja al socio raíz (sin patrocinador) FALLA

  11 · Dar de baja sin motivo FALLA

  12 · Un socio (no admin) NO puede dar de baja a nadie
```

**El caso 4 es el que separa esta tarea de hacerla mal.** Si solo se arreglan
los hijos directos, el 1, 2, 3 pasan y el 4 falla.

## Y la prueba de que el residual sigue bien

```
  13 · Después de la baja, una recompra de E genera residual y
       el nivel 2 le toca a A, no a B.
```

**Commit.**

---

# BLOQUE 4 · VERIFICACIÓN CONTRA POSTGRES

```sql
-- 1 · nadie quedó con un socio de baja como ancestro
SELECT COUNT(*) FROM red_ancestro ra
JOIN socio s ON s.id = ra.ancestro_id
WHERE s.estado = 'baja';
-- debe devolver 0

-- 2 · nadie quedó colgando de un socio de baja
SELECT COUNT(*) FROM socio h
JOIN socio p ON p.id = h.patrocinador_id
WHERE p.estado = 'baja';
-- debe devolver 0

-- 3 · la cadena de ancestros es coherente:
--     si X tiene a Y en nivel N, el patrocinador de X
--     tiene a Y en nivel N-1
SELECT COUNT(*) FROM red_ancestro ra
JOIN socio s ON s.id = ra.descendiente_id
WHERE ra.nivel > 1
  AND NOT EXISTS (
    SELECT 1 FROM red_ancestro ra2
    WHERE ra2.descendiente_id = s.patrocinador_id
      AND ra2.ancestro_id = ra.ancestro_id
      AND ra2.nivel = ra.nivel - 1
  );
-- debe devolver 0

-- 4 · nadie es ancestro de sí mismo
SELECT COUNT(*) FROM red_ancestro WHERE descendiente_id = ancestro_id;
-- debe devolver 0

-- 5 · el total de filas y el máximo nivel siguen siendo razonables
SELECT COUNT(*) filas, MAX(nivel) nivel_max FROM red_ancestro;
-- antes de la tarea: 3,935 filas · nivel máx 12
```

**La consulta 3 es la que de verdad certifica esta tarea.** Comprueba que toda
la tabla de cierre sea internamente coherente, no solo el pedacito que tocaste.
Si devuelve algo distinto de 0, la red está rota.

## Capturas

```
   1 · La vista previa mostrando frontales, descendencia total
       y el campo de motivo
   2 · El resultado después de ejecutar
   3 · P-12 "Mi red" de KARLA mostrando a los frontales que subieron
```

**Imágenes, no descripciones.**

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 5 consultas
   2 · Las 3 capturas
   3 · git status --short vacío, pegado literal
   4 · npx vitest run en verde
```

---

# 🔴 NO EJECUTES ESTO SOBRE UN SOCIO REAL DE LA BASE

```
   Las pruebas se hacen con una red de juguete creada y borrada
   por la propia suite, con su afterAll por ID específico.

   NO des de baja a KARLA, ni a ANA, ni a ninguno de los 505
   socios sembrados. Esa red es la que sostiene todas las
   verificaciones del proyecto.
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

```
   socios              505
   órdenes           1,055
   comisiones        2,422   ·   S/. 101,911.02
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   red_ancestro      3,935 filas · nivel máximo 12
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet            470 abonos + 1 retiro
   saldo de Karla    S/. 1,790.00
```

**Después de esta tarea, Jack va a hacer un recorrido manual: dar de baja a un
socio de prueba desde la pantalla y verificar contra Postgres que la red quedó
bien. Igual que se hizo con el bono de rango el 4/09.**
