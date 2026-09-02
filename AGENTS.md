# LEE ESTO ANTES DE EXPLORAR NADA

**Este archivo existe para que no tengas que reconstruir el proyecto leyendo
archivos.** Si la respuesta está aquí, no explores. Si no está, explora solo la
ruta que te diga la instrucción.

Actualizado: 2 de septiembre de 2026 · post-TAREA-09

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
| Pantallas del socio | `src/paginas/` prefijo `P1x` |
| Pantallas del admin | `src/paginas/` prefijo `P2x` |
| Piezas reutilizables | `src/piezas/` |
| Armazón (layouts) | `src/armazon/` |
| Servicios del socio | `src/servicios/socio.js` |
| Servicios del admin | `src/servicios/operacionAdmin.js` |
| Motor de comisiones | `src/motor/` — solo TypeScript puro |
| Cliente de Supabase | `src/lib/supabaseClient.js` |
| Tipos del plan de negocio | `src/tipos/plan_reglas.ts` |
| Tokens de color | `src/estilos/tokens.css` |
| Formateador de dinero | `src/utilidades/dinero.js` |
| Pruebas unitarias | `src/test/` |
| Pruebas E2E | `e2e/` |
| Reportes de tareas anteriores | `DOCUMENTACION-ANTIGRAVITY/` |

**Las reglas de negocio están en la base de datos, no en el código.**
Tabla `config` (36 filas), `nivel_comision`, `pack`, `rango`,
`pack_comision_especial`. Consúltalas, no las asumas.

---

## 🔴 CÓMO SE CARGAN DATOS — LA REGLA QUE MÁS IMPORTA

```
   ❌  generar SQL en chunks y ejecutarlos por MCP
   ✅  conectar a Postgres desde el script e insertar en una transacción
```

```js
import pg from 'pg';
const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();
await cliente.query('BEGIN');
// ... INSERT por lotes de 500 filas con parámetros
await cliente.query('COMMIT');
```

**El MCP de Supabase es para LEER:** verificaciones, list_tables, consultar config.
No para cargar datos masivos.

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
   ❌  "Todo verificado correctamente"
   ✅  [la salida completa del comando, tal cual salió]
```

Si una instrucción pide una consulta concreta, **corres esa consulta, no una
parecida.**

Si decides no arreglar algo, dilo así: *"quedan N advertencias, no las corrijo
porque ___"*. Una decisión razonada no es lo mismo que un problema inexistente.

---

## REGLAS DEL CÓDIGO QUE NO SE DISCUTEN

```
   Dinero en CÉNTIMOS ENTEROS       S/. 7.20 → 720. Nunca decimales
   Formatear con dinero.js          formatearSoles(720) → "S/. 7.20"
   Los importes se derivan sumando  descuento = subtotal − total
   Libros de SOLO-AGREGAR           comision, wallet_movimiento: nunca UPDATE ni DELETE
   Configuración sobre código       ningún porcentaje escrito en el código
   El motor no sabe de pantallas    TypeScript puro, sin Supabase imports
   Las pantallas no llaman Supabase directamente — pasan por src/servicios/
```

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

**Suite actual: 208 pruebas unitarias (19 suites) · 26 E2E.**

---

## VERIFICACIÓN DE INTEGRIDAD — SIEMPRE, ANTES DE CERRAR

```bash
grep -rlP '\x00' src/ scripts/     # ¿archivos corruptos?
npm run build                       # ¿compila de verdad?
npx vitest run                      # ¿pasan?
git status --short                  # tiene que quedar VACÍO
git log --oneline                   # ¿un commit por bloque?
```

**Van QUINCE corrupciones de archivos.** Siempre reportadas como "git vacío"
cuando no lo estaba. La peor se llevó 378 de 460 líneas de un archivo.

**Si `git status --short` no está vacío, la tarea NO está terminada.**

Restauración cuando un archivo está cortado:
```bash
git show HEAD:ruta/al/archivo > ruta/al/archivo
```

---

## LO QUE NO TOCAS

```
   ❌ Los .md de 00-INSTRUCCIONES        son la instrucción, no tu borrador
   ❌ Las imágenes                        ni las edites ni las regeneres
   ❌ config, producto, pack, rango,      datos maestros — solo se leen
      nivel_comision, pack_comision_especial
   ❌ comision · wallet_movimiento        libros de SOLO-AGREGAR
   ❌ movimiento_puntos · activacion      histórico — NUNCA se borra
   ❌ La red simulada                     501 socios, no se resiembra
```

---

## ESTADO DEL SISTEMA — 2 de septiembre de 2026

### Base de datos

```
   22 tablas · RLS activo en todas · 47 políticas
   13 funciones RPC (11 cerradas a anon, 2 pendientes)
   Proyecto: utlohnidkuvxqppmoevj · Postgres 17.6 · us-east-2
```

### La red de prueba — NO SE MODIFICA

```
   501 socios · 1,048 órdenes · 1,042 movimientos de puntos
   1,503 activaciones · 2,418 comisiones · 3 ciclos cerrados
   Ciclo 4 (septiembre 2026) abierto
   wallet_movimiento: llenada con el cierre del ciclo 3
      → S/. 13,479.68 exactos (verificado contra Postgres)
```

### Motor de comisiones — terminado y NO se toca

```
   Patrocinio  S/. 70,666.92   842 comisiones
   Residual    S/. 19,754.10  1,533 comisiones
   Rango       S/.  9,600.00    43 comisiones
   Total       S/. 100,021.02  2,418 comisiones
```

### Pantallas — estado real

```
   SOCIO                              ADMIN
   P-10  Inicio de sesión    ✅       P-20  Tablero              ⬜
   P-11  Panel principal     ✅       P-21  Registrar pedido     ✅
   P-12  Mi red              ✅       P-22  Registrar afiliación ✅
   P-13  Tienda de recompra  ✅       P-23  Bandeja confirmación ✅
   P-14  Mis comisiones      ✅       P-24  Envíos               ✅
   P-15  Mi rango            ✅       P-25  Cierre de ciclo      ✅
   P-16  Mi enlace           ✅       P-26  Configuración plan   ⬜
   P-17  Mis pedidos         ✅       P-27  Gestión de socios    ⬜
   P-18  Mi perfil           ✅       P-28  Reportes             ⬜
   P-19  Mi billetera        ✅       P-29  Auditoría            ⬜
```

**Faltan 5 pantallas: todas admin. Es la TAREA-10 (TANDA 5B).**

### Seguridad pendiente — TAREA-01C no cerrada

```
   fn_current_socio_id   anon=true  ← 🔴 debe ser false
   fn_is_admin           anon=true  ← 🔴 debe ser false
   Todas las demás       anon=false ✅
```

Esto se corrige en el **Bloque 0 de TAREA-10** antes de tocar pantallas.

### Ambigüedades en config — pendientes de decisión de Máximo

```
   dia_pago_comisiones = 5    ← día 5 del mes siguiente
   dias_hasta_pago     = 3    ← 3 días después del cierre (día 3)
   → Las dos no pueden ser correctas a la vez. Máximo decide cuál borrar.

   monto_minimo_retiro_cent = 10000
   retiro_minimo_cent       = 10000
   → Duplicadas. Se borró una pero la otra quedó. Verificar.
```

P-26 las muestra como "pendiente de revisión" sin tocarlas.

### Los rangos 9-16

```
   Existen en la tabla rango con definido = false
   Máximo no ha enviado los números todavía
   P-26 los muestra como editables, en gris, listos para cuando lleguen
```
