# TAREA-11 · CORRECCIÓN · DESPLEGABLES EN BLANCO, CICLO FALSO Y TILDES PERDIDAS

**Para:** Antigravity
**Escrita:** 3 de septiembre de 2026
**Prioridad: BLOQUEANTE.** P-21 y P-22 no se pueden operar. Son las dos
pantallas que registran dinero.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, siempre:

```bash
git status --short
grep -rlP '\x00' src/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**
**Commit después de CADA bloque.**

---

# CÓMO SE ENCONTRÓ

Recorrido manual de certificación el 3/09. Se intentó registrar una afiliación
real en P-22 y **el desplegable de packs salió vacío**. De ahí salieron los
demás.

**Las 225 pruebas estaban en verde con las dos pantallas inservibles.** Ese es
el dato importante de esta tarea: las pruebas comprobaban que el componente
existiera, no que mostrara texto.

---

# BLOQUE 1 · EL CONTRATO DE `CampoSelect`

## La causa

`src/piezas/Formulario.jsx` línea 94 espera `value` y `label`:

```jsx
{opciones.map((opt) => (
  <option key={opt.value} value={opt.value}>{opt.label}</option>
))}
```

P-21 y P-22 le pasan `valor` y `etiqueta`. Resultado: `opt.value` y `opt.label`
son `undefined`, y cada `<option>` sale sin texto y sin valor.

## Qué se corrige

En **todas** las llamadas a `CampoSelect` de estos dos archivos, renombrar las
propiedades de cada objeto de `valor` → `value` y `etiqueta` → `label`.

```
   src/paginas/P21RegistrarPedido.jsx
      líneas 637-643    bancos (7 opciones)

   src/paginas/P22RegistrarAfiliacion.jsx
      línea  140-143    packs
      líneas 523-525    tipo de documento
      líneas 622-628    bancos
```

**Revisar el archivo entero, no solo esas líneas.** Puede haber más llamadas.
El comando del bloque 5 lo confirma.

## 🔴 No se toca `Formulario.jsx`

Seis pantallas ya usan `value`/`label` correctamente: P-14, P-15, P-19, P-23,
P-24 y Kit. **Cambiar el componente rompería esas seis para arreglar dos.**
Se corrigen las dos que están mal.

**Commit.**

---

# BLOQUE 2 · LA COLUMNA `puntos` NO EXISTE EN `pack`

`P22RegistrarAfiliacion.jsx` línea 142:

```js
etiqueta: p.nombre + ' (' + formatearSoles(p.precio_cent) + ' ? ' + p.puntos + ' pts)'
```

La tabla `pack` **no tiene columna `puntos`**. Sus columnas son:

```
   id, codigo, nombre, precio_cent, puntos_rango, cant_productos,
   niveles_residual, niveles_patrocinio, descuento_recompra_pct,
   descuento_en_pack_pct, cubre_activacion, aplica_bono_global,
   solo_afilia_igual, activo, orden
```

La etiqueta queda así:

```js
label: p.nombre + ' (' + formatearSoles(p.precio_cent) + ')'
```

**No se inventa un número de puntos.** `puntos_rango` es otra cosa: son los
puntos que ese pack aporta al rango, no puntos de compra. Ponerlo ahí haría
que el admin crea que el pack da puntos de activación. Solo nombre y precio.

**Ojo:** `p.puntos` en P-13 y P-21 sobre **productos** está bien. La tabla
`producto` sí tiene `puntos`. Solo es incorrecto sobre `pack`.

**Commit.**

---

# BLOQUE 3 · EL CICLO ESTÁ ESCRITO A MANO

`src/armazon/ArmazonAdmin.jsx` línea 145:

```jsx
<span>Ciclo: Agosto 2026 · Abierto</span>
```

Texto fijo. No consulta nada.

**Verificado contra Postgres el 3/09:**

```
   ciclo 3 · agosto 2026      CERRADO   (cerrado el 2/09)
   ciclo 4 · septiembre 2026  ABIERTO
```

O sea que la cabecera muestra el mes equivocado **y** el estado equivocado.

## Por qué importa aunque sea "solo texto"

Las operaciones sí resuelven bien el ciclo con `.eq('estado','abierto')`, así
que las órdenes caen donde deben. **El daño es que el admin confirma pagos
creyendo que está operando agosto.** El día del cierre de mes, eso es una
discusión sobre a qué ciclo pertenece una comisión.

## Qué se hace

Leer el ciclo abierto de la base y mostrarlo, con el mismo formato:
`Ciclo: <Mes> <Año> · <Estado>`.

`ArmazonSocio.jsx` línea 156 ya lo hace bien con `{socio.ciclo}`. Seguir ese
patrón.

Si no hay ningún ciclo abierto, mostrar `Sin ciclo abierto` — **nunca** un mes
inventado.

**Commit.**

---

# BLOQUE 4 · TILDES PERDIDAS EN EL CÓDIGO FUENTE

Los archivos están guardados en UTF-8 correctamente. El problema es que los
textos se escribieron ya con `?` en lugar de la letra acentuada.

```
   src/paginas/P22RegistrarAfiliacion.jsx:305   "asignaci?n"    → asignación
   src/paginas/P22RegistrarAfiliacion.jsx:399   "C?digo"        → Código
   src/paginas/P22RegistrarAfiliacion.jsx:245   "C?digo"        → Código
   src/paginas/P22RegistrarAfiliacion.jsx:524   "Carn? Ext."    → Carné Ext.
   src/paginas/P21RegistrarPedido.jsx:429       "C?digo"        → Código
   src/paginas/P16MiEnlace.jsx                  revisar entero
```

También hay separadores `?` que deberían ser `·`:

```
   "C?digo: {codigo} ? DNI: {documento}"   →   "Código: {codigo} · DNI: {documento}"
```

**Revisar los tres archivos completos**, no solo las líneas listadas. El patrón
a buscar es una `?` entre letras o rodeada de espacios donde debería ir un
separador.

**No se traduce ni se reescribe ningún texto.** Solo se restituye el carácter
que se perdió.

**Commit.**

---

# BLOQUE 5 · PRUEBAS QUE HABRÍAN ATRAPADO ESTO

Las pruebas actuales verifican que el `<select>` existe. Hay que verificar
**que sus opciones tengan texto y valor**.

Agregar a la suite de P-22 y P-21:

```
   1 · el select de packs renderiza 5 <option> (además del placeholder)
   2 · ninguna <option> tiene textContent vacío
   3 · ninguna <option> tiene value="" salvo el placeholder
   4 · la opción del Pack Gold contiene el texto "1,200"
   5 · el select de bancos de P-21 renderiza 7 opciones con texto
   6 · ningún archivo de src/paginas contiene el patrón de tilde perdida
```

**La prueba 2 es la que importa.** Es la que separa "el componente existe" de
"el usuario puede usarlo", que es justo lo que falló acá.

**Commit.**

---

# BLOQUE 6 · VERIFICACIÓN

Correr y **pegar la salida literal de las cuatro**:

```bash
# 1 · ya no queda ningún valor/etiqueta en las pantallas
grep -rn "valor:\|etiqueta:" src/paginas/
#    debe devolver VACÍO

# 2 · ya no se usa p.puntos sobre packs
grep -n "p.puntos" src/paginas/P22RegistrarAfiliacion.jsx
#    debe devolver VACÍO

# 3 · el ciclo ya no está escrito a mano
grep -n "Agosto 2026" src/armazon/ArmazonAdmin.jsx
#    debe devolver VACÍO

# 4 · no quedan tildes perdidas
grep -rnE "C\?digo|asignaci\?n|Carn\? |TEL\?FONO|N\?MERO|ELECTR\?NICO|ADMINISTRACI\?N" src/
#    debe devolver VACÍO
```

## Y la verificación que de verdad cierra esto

**Abrir el navegador en `/admin/afiliacion` y hacer una captura del desplegable
de packs abierto, con las 5 opciones legibles.**

Ninguna de las 4 consultas de arriba prueba que el usuario ve el texto. La
captura sí. Esta tarea existe precisamente porque se confió en las consultas.

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 4 verificaciones
   2 · Captura del desplegable de packs ABIERTO con las 5 opciones
   3 · Captura de la cabecera mostrando "Septiembre 2026 · Abierto"
   4 · git status --short vacío, pegado literal
   5 · npx vitest run en verde, con las pruebas nuevas incluidas
```

---

# LO QUE NO SE TOCA

```
   ❌ src/piezas/Formulario.jsx     6 pantallas dependen de él y funcionan
   ❌ src/motor/                    el motor está verificado, no se toca
   ❌ Las consultas a la base       resuelven bien el ciclo
   ❌ El diseño y los estilos
   ❌ Los textos                    solo se restituyen tildes, no se reescriben
   ❌ Las migraciones de Supabase
```

---

# DESPUÉS DE ESTA TAREA

Se retoma el recorrido de certificación donde se cortó: registrar la afiliación
de prueba bajo KARLA DIAZ (MG00012) con Pack Gold y confirmar el pago.
