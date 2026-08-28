# LEE ESTO ANTES DE EXPLORAR NADA

**Este archivo existe para que no tengas que reconstruir el proyecto leyendo
archivos.** Si la respuesta está aquí, no explores. Si no está, explora solo la
ruta que te diga la instrucción.

Actualizado: 28 de agosto de 2026

---

## QUÉ ES ESTO

Sistema MLM para Max Global Corporation, empresa peruana de venta directa.
Esta carpeta es la **Fase 2: motor de comisiones, panel admin y backoffice del
socio.** La landing pública es otro proyecto, en `SITIO WEB 06 PAGINAS LANDINGS`.

```
   React + Vite + Supabase (Postgres 17.6)
   Proyecto Supabase: utlohnidkuvxqppmoevj
```

---

## DÓNDE ESTÁ CADA COSA

| Busco | Está en |
|---|---|
| Las instrucciones de las tareas | `00-INSTRUCCIONES/` |
| El generador de la red simulada | `scripts/sembrar-red.mjs` |
| Las pruebas del generador | `src/test/sembrar-red.test.js` |
| Pantallas | `src/paginas/` |
| Piezas reutilizables | `src/piezas/` |
| Armazón (layouts) | `src/armazon/` |
| Tokens de color y tipografía | `src/estilos/tokens.css` |
| Cliente de Supabase | `src/lib/supabaseClient.js` |
| Tipos del plan de negocio | `src/tipos/plan_reglas.ts` |
| Reportes de tareas anteriores | `DOCUMENTACION-ANTIGRAVITY/` |

**Las reglas de negocio están en la base de datos, no en el código.**
Tabla `config` (36 filas), `nivel_comision`, `pack`, `rango`,
`pack_comision_especial`. Consúltalas, no las asumas.

---

## 🔴 CÓMO SE CARGAN DATOS — LA REGLA QUE MÁS IMPORTA

### No trocees SQL en archivos. No siembres por el MCP.

En la TAREA-03 se generaron **45 archivos SQL, 740 KB, 6,057 líneas**, y se
ejecutaron uno por uno con `execute_sql`. Cada trozo viajó tres veces: al
escribirlo, al releerlo y como argumento de la llamada. **Costó dos horas.**

```
   ❌  generar supabase/seed_chunks/*.sql y ejecutarlos por MCP
   ✅  conectar a Postgres desde el script e insertar en una transacción
```

```js
import pg from 'pg';
const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();
await cliente.query('BEGIN');
// ... INSERT por lotes, con parámetros
await cliente.query('COMMIT');
```

**Inserta por lotes de 500 filas con parámetros**, no fila por fila y no
concatenando texto.

### El MCP de Supabase es para LEER

```
   ✅  las consultas de verificación del final de cada tarea
   ✅  list_tables, get_advisors, consultar config
   ❌  cargar datos masivos
   ❌  releer lo que tú mismo acabas de escribir
```

---

## CÓMO SE TRABAJA AQUÍ

```
   1 · La instrucción viene en 00-INSTRUCCIONES, por bloques
   2 · Un commit por bloque. No uno al final
   3 · Se verifica antes de declarar nada terminado
   4 · Se reporta pegando la salida literal
```

### 🔴 La salida se PEGA LITERAL

No se resume, no se declara, no se parafrasea.

```
   ❌  "Linter: 0 errores, 0 advertencias"
   ❌  "Todo verificado correctamente"
   ✅  [la salida completa del comando, tal cual salió]
```

Si una instrucción pide una consulta concreta, **corres esa consulta, no una
parecida.** En la TAREA-03 se sustituyó la consulta de aritmética de órdenes por
la de vouchers y se reportó `[]`. La original devolvía una fila con un error de
dinero.

Si decides no arreglar algo, dilo así: *"quedan 2 advertencias, no las corrijo
porque ___"*. Una decisión razonada no es lo mismo que un problema inexistente.

### Si una consulta devuelve filas, eso NO es "verificado con éxito"

Es un error, y se reporta como error.

---

## REGLAS DEL CÓDIGO QUE NO SE DISCUTEN

```
   Dinero en CÉNTIMOS ENTEROS       S/. 7.20 → 720. Nunca decimales
   Los importes se derivan sumando  descuento = subtotal − total,
      los detalles                     nunca un % aplicado dos veces
   Libros de SOLO-AGREGAR           un movimiento no se edita ni se borra
   Configuración sobre código       ni un porcentaje escrito en el código
   El motor no sabe de pantallas    TypeScript puro, probable sin navegador
```

### Los datos derivados se derivan de su propia fila

Dos bugs de la TAREA-03 salieron de lo mismo: recorrer arreglos en paralelo.

```
   ❌  movimientos[i].puntos = ordenes[j].puntos_total
   ✅  para cada orden ya insertada, crear SU movimiento desde ella
```

Si tienes el `orden_id`, tienes el `socio_id`, el `ciclo_id` y los puntos.
No los busques en otra lista.

---

## PRUEBAS

```
   Vitest       lógica, cálculos, reglas    con números calculados A MANO
   Playwright   recorridos completos e2e    móvil 390px y escritorio
```

```js
❌  expect(comision).toBe(calcularComision(pedido))   // no prueba nada
✅  expect(comision).toBe(720)                        // S/. 7.20, a mano
```

**Cobertura del motor de comisiones: 100%.** Cada rama, cada caso borde.

Un solo archivo de pruebas por módulo. En la TAREA-03B quedaron dos
`sembrar-red.test.js` — uno en `scripts/` con 21 pruebas que nadie corría, y
otro en `src/test/` con 19 que sí. **Si duplicas, la mitad de tus pruebas no
existe.**

---

## VERIFICACIÓN DE INTEGRIDAD — SIEMPRE, ANTES DE CERRAR

```bash
grep -rlP '\x00' src/ scripts/     # ¿archivos corruptos?
npm run build                       # ¿compila de verdad?
npx vitest run                      # ¿pasan?
git status --short                  # tiene que quedar VACÍO
git log --oneline                   # ¿un commit por bloque?
```

**Que las pruebas pasen no basta.** En la Fase 1 pasaron 32 de 32 con la
aplicación rota: los archivos se cortaron después de correrlas.

---

## LO QUE NO TOCAS

```
   ❌ Los .md de 00-INSTRUCCIONES        son la instrucción, no tu borrador
   ❌ Las imágenes                        ni las edites ni las regeneres
   ❌ config, producto, pack, rango,      datos maestros. Se leen
      nivel_comision, pack_comision_especial
   ❌ comision, rango_ciclo,              son de la TAREA-04
      wallet_movimiento, periodo_global
```

---

## ESTADO AL 28/08/2026

```
   ✅  TAREA-02   Armazón, 8 piezas, 5 pantallas
   ✅  TAREA-01   Base de datos, 22 tablas, RLS en todas
   ✅  TAREA-01B  Vistas security_invoker
   🟡  TAREA-01C  2 funciones SECURITY DEFINER siguen expuestas
   ⬜  TAREA-02B  dinero en céntimos en las pantallas — SIN HACER
   ✅  TAREA-03   Red simulada de 500 socios
   ✅  TAREA-03B  Corrección de la red
   🟡  TAREA-03C  cierre: 1 movimiento cruzado, tests duplicados, commits
   ⬜  TAREA-04   Motor de comisiones
```

**La red simulada está buena y no se resiembra.** Volver a correr el script la
cambiaría y las cifras verificadas dejarían de valer.
