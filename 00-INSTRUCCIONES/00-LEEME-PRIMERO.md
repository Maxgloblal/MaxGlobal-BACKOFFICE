# FASE 2 — EL SISTEMA

**Max Global Corporation** · Creado el 27 de agosto de 2026
**Este es el documento que manda en esta carpeta.**

---

# 1 · QUÉ SE CONSTRUYE ACÁ

**La Fase 1 fue la vitrina. Esto es la máquina que reparte el dinero.**

Hoy Máximo calcula las comisiones a mano en Excel: suma puntos, recorre 10
niveles por cada compra, revisa quién se activó, quién subió y quién bajó de
rango. Con 50 socios es un día de trabajo. Con 500 es imposible sin
equivocarse.

**Y un error acá no es un botón feo: es plata mal pagada a una persona real.**

## Las tres cosas que va a tener

```
   MOTOR DE COMISIONES     calcula los 4 bonos. No tiene pantalla
   PANEL DE ADMINISTRACIÓN  donde Máximo opera el negocio       10 pantallas
   BACKOFFICE DEL SOCIO     donde cada socio ve lo suyo         10 pantallas
```

**Una sola aplicación, una sola base de datos.** No se separan porque comparten
el modelo de datos y las reglas de cálculo; separarlas obligaría a duplicarlas.

## Dónde vive

```
   maxglobaloficial.com            la landing        Fase 1
   app.maxglobaloficial.com    el sistema        Fase 2  ← esto
```

---

# 2 · REGLA CERO — GIT ANTES QUE NADA

> **En la Fase 1 hubo NUEVE corrupciones de archivos.** Archivos cortados a media
> palabra, otros rellenos de bytes nulos. **Todos los commits estuvieron
> siempre limpios — solo se dañaba el directorio de trabajo.**

```bash
git init
git commit --allow-empty -m "inicio fase 2"
```

**Y después, commit al terminar cada bloque. No al final del día.**

## Si un archivo se corrompe

```bash
git show HEAD:ruta/al/archivo > ruta/al/archivo
```

*`git restore` falla en esta unidad con "Operation not permitted". Usa `git show`.*

## Antes de decir "terminé", siempre

```bash
# ¿algún archivo cortado?
grep -rlP '\x00' src/ && echo "🔴 BYTES NULOS"

# ¿compila de verdad?
npm run build

# ¿el working directory coincide con el último commit?
git status --short
```

**Que las pruebas pasen no basta.** En la Fase 1 pasaron 32 de 32 con la
aplicación rota, porque los archivos se cortaron *después* de correrlas.

---

# 3 · EL STACK

```
   Base de datos     PostgreSQL (Supabase)
   Backend           Supabase Edge Functions — TypeScript
   Autenticación     Supabase Auth
   Frontend          Vite + React + React Router
   Estilos           CSS plano con tokens de diseño   ← igual que la landing
   Pruebas           Vitest (unidad) + Playwright (navegador)
```

**Sin librerías de componentes.** El sistema de diseño de la landing se reutiliza
tal cual: mismos colores, mismas tipografías, mismos espaciados.

## Las tres reglas técnicas innegociables

**1 · El dinero en céntimos enteros.**
Nunca `float`, nunca `number` para plata. `S/. 7.20` se guarda como `720`.

**2 · Los libros son de solo-agregar.**
Un movimiento de comisión **nunca se edita ni se borra**. Si hay un error, se
agrega un movimiento que lo corrige. El historial es la verdad.

**3 · El motor no sabe qué es una pantalla.**
Es TypeScript puro: recibe datos, devuelve datos. Se puede probar sin navegador,
sin base de datos y sin usuarios.

*Detalle completo en `07-SPEC-KIT/PROYECTO-2-SISTEMA/memory/constitution.md`.*

---

# 3.5 · PRUEBAS — REGLA PERMANENTE DE TODA TAREA

**Aplica a cada bloque de cada etapa.** No se repite en cada instrucción porque
se da por sabido.

```
   Vitest        pruebas de unidad          lógica, cálculos, reglas
   Playwright    pruebas end-to-end (e2e)   recorridos completos en navegador
```

## Qué se prueba con cada una

**Vitest — todo lo que es lógica pura.**
El motor entero se prueba acá: sin base de datos, sin navegador, sin usuarios.
**Con números calculados a mano**, no con lo que devuelve el propio código.

```
   ❌  expect(comision).toBe(calcularComision(pedido))    no prueba nada
   ✅  expect(comision).toBe(720)   // S/. 7.20, calculado a mano
```

**Playwright — los recorridos que haría un humano.**

```
   Socio    entra → ve sus puntos → compra → aparece en sus pedidos
   Admin    registra pedido → confirma pago → los puntos se acreditan
   Admin    cierra el mes → vista previa → confirma → las comisiones existen
   Permiso  un socio NO puede ver la red de otro
```

## Y las tres verificaciones de integridad, siempre

```bash
grep -rlP '\x00' src/ && echo "🔴 BYTES NULOS"    # ¿archivos corruptos?
npm run build                                       # ¿compila de verdad?
git status --short                                  # ¿coincide con el commit?
```

> **Que las pruebas pasen no basta.** En la Fase 1 pasaron 32 de 32 con la
> aplicación rota: los archivos se cortaron *después* de correrlas.

## Cobertura mínima exigida

| Área | Mínimo |
|---|---|
| **Motor de comisiones** | **100%** — cada rama, cada caso borde |
| Reglas de negocio y permisos | 100% |
| Pantallas | recorrido principal + estado vacío + error |

---

# 4 · LAS ETAPAS

```
   ETAPA D   DISEÑO               ← en paralelo, arranca YA
   ETAPA 0   CIMIENTOS            base de datos y configuración
   ETAPA 1   RED SIMULADA         500 socios falsos para poder probar
   ETAPA 2   MOTOR                los 4 bonos. Sin una sola pantalla
   ETAPA 3   PANEL ADMIN          10 pantallas — Máximo opera
   ETAPA 4   BACKOFFICE SOCIO     10 pantallas — el socio consulta
   ETAPA 5   CIERRE               pruebas de punta a punta y despliegue
```

**La Etapa D corre en paralelo con la 0, 1 y 2**, porque esas tres no tienen ni
una pantalla. Para cuando el motor esté listo, el diseño ya tiene que estar
aprobado.

## Por qué ese orden y no otro

**El motor va antes que cualquier pantalla.**

> Una interfaz fea se corrige. Una comisión mal pagada no se recupera.

**La red simulada va antes que el motor.** Sin 500 socios de mentira no hay forma
de probar que los cálculos salen bien **antes de que entre gente real**. Si el
motor se equivoca con socios inventados, no pasa nada. Si se equivoca con socios
de verdad, hay que devolver plata y explicar.

**El panel de admin va antes que el backoffice del socio.** Sin el panel no hay
pedidos que registrar, así que el backoffice del socio no tendría nada que
mostrar. Y Máximo necesita operar; los socios pueden esperar una semana más.

---

# ETAPA D · EL KIT DE LA APLICACIÓN 🎨

> ## 📌 DECISIÓN DEL 27/08 — SIN CLAUDE DESIGN
>
> **Esta etapa NO pasa por Claude Design. Se construye directo en código con
> Antigravity.**
>
> **Por qué:** un backoffice no es una landing. Nadie lo juzga por bonito, lo
> juzga por si entiende sus números. Y la marca ya está resuelta desde la Fase 1
> — colores, tipografías y espaciados se heredan tal cual. **No hay nada visual
> que inventar.**
>
> Además el documento `15-ASI-SE-VE-EL-BACKOFFICE` ya tiene las 10 pantallas del
> socio dibujadas con números reales. **Eso ya es la especificación de diseño.**
>
> El paso extra por Claude Design y su conversión posterior costó días en la
> Fase 1 sin aportar nada que acá haga falta.

**Objetivo:** que exista el armazón y las piezas **antes** que cualquier
pantalla.

## 🔴 Por qué esta etapa sigue existiendo

**Una landing son 6 páginas distintas entre sí. Un sistema son 20 pantallas que
repiten los mismos cinco patrones.**

Si Antigravity construye las 20 pantallas en 20 sesiones, **cada una va a
inventar su propia tabla, su propia tarjeta y su propio estado vacío.** Después,
cambiar el color de una insignia significa tocar 20 archivos.

**Por eso el armazón y las piezas se construyen primero, en una sola tarea.** No
se diseñan: se programan. Y las 20 pantallas se arman con ellas.

**Se diseña el sistema, no las pantallas.** Después las pantallas se arman con
las piezas.

## Lo que ya está resuelto y no se rediseña

```
   ✅  Colores        Dorado #D1AD68 · Verde #1BA741
   ✅  Tipografías    Agus Sans (títulos) · Caviar Dreams (texto)
   ✅  Logo y favicon
   ✅  Espaciados y tokens
```

**Todo viene de la landing.** El sistema tiene que verse de la misma empresa.
*Fuente: `06-MARCA/00-MARCA-COMPLETA.md`*

---

## D1 · EL ARMAZÓN

**Lo que está en todas las pantallas.**

```
   ESCRITORIO                          MÓVIL
   ┌────────┬────────────────┐         ┌──────────────────┐
   │  logo  │  encabezado    │         │  ☰   logo    👤  │
   ├────────┼────────────────┤         ├──────────────────┤
   │        │                │         │                  │
   │  menú  │   contenido    │         │    contenido     │
   │ lateral│                │         │                  │
   │        │                │         ├──────────────────┤
   └────────┴────────────────┘         │ 🏠  🛒  💰  👥  │
                                       └──────────────────┘
```

```
   ☐  Menú lateral en escritorio, barra inferior en móvil
   ☐  Encabezado con nombre del socio, su rango y el mes en curso
   ☐  Estado de sesión y cerrar sesión
   ☐  Dos armazones distintos: uno para el socio y otro para el admin
```

> **El del socio se diseña MÓVIL PRIMERO.** La mayoría lo va a abrir del celular.
> **El del admin se diseña ESCRITORIO PRIMERO.** Máximo trabaja de computadora,
> registrando pedidos y revisando vouchers.
>
> *No es un detalle: es la diferencia entre una barra inferior de 4 iconos y un
> menú lateral de 10 entradas.*

---

## D2 · LAS PIEZAS

**Cada pieza se diseña UNA vez y se usa en todas partes.**

| Pieza | Dónde se usa |
|---|---|
| **Tarjeta de dato** | Puntos, comisiones, socios de la red |
| **Barra de progreso** | Activación (70 pts) y avance de rango |
| **Tabla / lista** | Comisiones, pedidos, socios, movimientos |
| **Insignia de estado** | por confirmar · confirmado · enviado · rechazado |
| **Formulario** | Registrar pedido, afiliación, perfil |
| **Estado vacío** | 🔴 **el más olvidado y el más importante** |
| **Diálogo de confirmación** | Confirmar pago, cerrar ciclo, dar de baja |
| **Nodo del árbol** | Mi red |

### 🔴 Los estados vacíos no son opcionales

**Un socio nuevo abre el sistema el primer día y no tiene nada.** Sin comisiones,
sin red, sin pedidos.

```
   ❌  (pantalla en blanco)

   ✅  Todavía no tienes comisiones
       Tus comisiones aparecen acá después del cierre del mes.
       [ Ver cómo se generan ]
```

**Cada pieza necesita sus tres estados: con datos, vacía y cargando.**

---

## D3 · LAS 5 PANTALLAS QUE SE CONSTRUYEN PRIMERO

**Cubren todos los patrones del sistema. Las otras 15 se arman con las piezas de
D2 y no necesitan decisiones nuevas.**

*Se construyen con datos falsos. Cuando el motor esté listo, se les cambia la
fuente de datos y ya.*

| # | Pantalla | El patrón que resuelve |
|---|---|---|
| **P-11** | Panel principal del socio | Tablero con datos y progreso |
| **P-14** | Mis comisiones | Lista con desglose **y explicación de por qué NO cobró** |
| **P-12** | Mi red | El árbol — el patrón más difícil del sistema |
| **P-23** | Bandeja de confirmación | Revisar un voucher y aprobar |
| **P-25** | Cierre de ciclo | Vista previa + acción irreversible |

### Por qué esas cinco

**P-11** define cómo se ve un tablero. **P-14** define cómo se ve una lista con
explicación. **P-12** es el único patrón que no se parece a nada más. **P-23** y
**P-25** son las dos pantallas donde Máximo puede cometer un error caro.

**Si esas cinco están bien, las otras 15 son ensamblaje.**

---

## D4 · LAS DOS PANTALLAS QUE HAY QUE PENSAR MÁS

### P-14 · Mis comisiones — tiene que explicar el cero

> **Un socio que ve "S/. 0.00" sin explicación le escribe a Máximo.** Cincuenta
> socios haciendo eso cada cierre es exactamente el problema que este sistema
> viene a resolver.

```
   ❌  Comisiones del mes:  S/. 0.00

   ✅  Comisiones del mes:  S/. 0.00

       No estuviste activo este mes.
       Te faltaron 22 puntos de los 70 requeridos.

       Tus 3 socios directos sí compraron.
       Esa comisión no se pagó a nadie.
```

**El diseño tiene que tener lugar para ese bloque de explicación.** Si se diseña
solo el caso feliz, después no entra.

### P-25 · Cierre de ciclo — la vista previa antes del botón

**Es la operación más peligrosa del sistema.** Paga a todos, de una vez.

```
   ┌────────────────────────────────────────────┐
   │  VISTA PREVIA DEL CIERRE — Agosto 2026     │
   │                                            │
   │  Socios que cobran ............... 187     │
   │  Total a pagar .......... S/. 42,380.00    │
   │  Suben de rango ................... 12     │
   │  Bajan de rango ................... 4      │
   │  No cobran por inactividad ....... 313     │
   │                                            │
   │  [ Ver detalle ]                           │
   │                                            │
   │  [ Cancelar ]   [ Confirmar el cierre ]    │
   └────────────────────────────────────────────┘
```

**Máximo tiene que poder mirar esos números y arrepentirse.** Esa pantalla es lo
que separa un error detectado de un error pagado.

---

## D5 · LAS 15 RESTANTES

**No se dibujan de cero. Se escribe qué piezas lleva cada una:**

```
   P-17 Mis pedidos    = armazón socio + tabla + insignia de estado + estado vacío
   P-16 Mi enlace      = armazón socio + tarjeta + botón de copiar
   P-28 Reportes       = armazón admin + filtros + tabla + botón exportar
```

**Si una pantalla necesita una pieza que no existe en D2, se agrega a D2** — no
se inventa solo para esa pantalla.

---

## Cómo se verifica la Etapa D

```
   ☐  Los 2 armazones funcionando, en escritorio y en móvil
   ☐  Las 8 piezas, cada una con sus 3 estados
   ☐  Una página /kit que muestra todas las piezas juntas
   ☐  Las 5 pantallas navegables con datos falsos
   ☐  Las 15 restantes con su lista de piezas escrita
   ☐  grep de colores en src/paginas/ → vacío
   ☐  Revisado a 390px de verdad, no solo compilado

   PRUEBAS
   ☐  Vitest: cada pieza con sus 3 estados
   ☐  Playwright: navegar el armazón completo en móvil y escritorio
```

> **La página `/kit` es lo que te deja revisar todo de una.** En vez de abrir 20
> pantallas para ver si una insignia quedó bien, abres una sola.

## Cómo se produce

**Directo en código, con Antigravity, en una sola tarea: la `TAREA-01`.**

Con datos falsos escritos a mano. **Sin base de datos, sin Supabase, sin motor.**
Así el kit se puede ver y probar el mismo día, y no depende de nada.

**Lo que Antigravity tiene que leer antes:**

```
   03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE.md   las 10 pantallas del socio
                                               dibujadas con números reales
   03-SISTEMA/10-RF-PANEL-ADMIN.md            las 10 del administrador
   06-MARCA/00-MARCA-COMPLETA.md              colores, tipografías, logo
   SITIO WEB.../src/estilos/                  los tokens de la Fase 1
```

> **El documento 15 ya tiene las pantallas del socio dibujadas en texto**, con
> María Torres, MG-00417, rango Gold y sus números. **No hay que inventar
> contenido: hay que vestirlo.**

## La regla que hace que esto funcione

> **Ninguna pantalla define un estilo propio.**
>
> Si la pantalla P-17 necesita una tabla, usa `<Tabla>`. Si necesita algo que
> `<Tabla>` no hace, **se mejora `<Tabla>`** — no se escribe una tabla nueva
> dentro de P-17.
>
> **Verificación:** ningún archivo de `src/paginas/` puede declarar colores,
> tamaños de fuente ni espaciados. Solo composición.

```bash
# esto debe salir vacío, siempre
grep -rnE "#[0-9a-fA-F]{6}|fontSize|padding:" src/paginas/
```

---

# ETAPA 0 · CIMIENTOS

**Objetivo:** que exista la base de datos con las reglas cargadas.

## Qué se construye

```
   ☐  Proyecto Vite + React con el sistema de diseño de la landing
   ☐  Proyecto Supabase y conexión
   ☐  Las 22 tablas de 03-SISTEMA/schema.sql
   ☐  Las filas de configuración (los 15 valores del plan)
   ☐  Los productos y packs reales, desde 01-NEGOCIO/02-CATALOGO
   ☐  Las escalas de comisión: 7 niveles, 10 niveles, y la excepción del Kit
```

## Lo crítico de esta etapa

**Ni un solo porcentaje escrito en el código.** Todos los valores del plan viven
en la tabla de configuración y se leen de ahí:

```
   comision_patrocinio_nivel_1 ..... 40.0 %
   comision_residual_nivel_1 ....... 40.0 %
   pack_comision_especial          EMPRENDEDOR nivel 1 → 41.7 %
   puntos_activacion_mensual ....... 70
   rango_baja_no_cobra ............. true
   puntos_grupales_incluyen_personales ... false
   pack_hereda_puntos_producto ..... false
   linea_estirada_max_pct .......... 50
```

**Si mañana Máximo cambia un número, se cambia una fila. No se reprograma nada.**

## Cómo se verifica

```sql
-- las 22 tablas existen
SELECT count(*) FROM information_schema.tables WHERE table_schema='public';

-- los porcentajes de patrocinio suman 30.8
SELECT sum(porcentaje) FROM escala_patrocinio;

-- la excepción del Kit está cargada
SELECT * FROM pack_comision_especial;
```

**Fuente:** `03-SISTEMA/schema.sql` y `03-SISTEMA/02-MODELO-DE-DATOS.md`

---

# ETAPA 1 · RED SIMULADA DE 500 SOCIOS

**Objetivo:** tener datos realistas para poder probar el motor.
**Es la Fase 4 de la cotización. Ya está pagada.**

## Qué se construye

Un script que genera:

```
   500 socios          con su patrocinador, formando un árbol real
   Packs repartidos    Emprendedor, Ejecutivo, Gold, Empresarial
   6 meses de compras  recompras de productos, con sus puntos
   Rangos alcanzados   calculados, no inventados
   Casos borde         a propósito, para que el motor los enfrente
```

## Los casos borde que TIENEN que estar

*Si la red es toda "gente normal", el motor nunca se pone a prueba.*

```
   ☐  Un socio con Kit Emprendedor         → 0 niveles habilitados
   ☐  Un Ejecutivo                         → 5 niveles, el 6 al 10 no paga
   ☐  Una cadena de 12 niveles de profundidad
   ☐  Un socio INACTIVO con red activa debajo  → prueba la no compresión
   ☐  Un socio que BAJÓ de rango           → no cobra nada, ni el menor
   ☐  Un socio con toda su red en una sola línea → prueba la línea estirada
   ☐  Un socio con 0 compras               → estados vacíos
   ☐  Un socio afiliado ayer               → sin historial
```

## Reglas del generador

**Determinista.** Con la misma semilla produce exactamente la misma red. Si un
día un cálculo falla, se tiene que poder reproducir.

```js
const rng = seedrandom('max-global-2026');
```

**Nombres claramente falsos.** Nada de nombres reales.

**Marcado como simulado.** Una columna `es_simulado = true` en cada fila, y un
comando para borrar toda la red de prueba sin tocar datos reales.

## Cómo se verifica

```
   ☐  500 socios creados
   ☐  Un solo socio raíz, sin patrocinador
   ☐  Ningún ciclo en el árbol (nadie es su propio ancestro)
   ☐  Los 8 casos borde existen y se pueden encontrar por su código
   ☐  Correr el generador dos veces da el mismo resultado
```

---

# ETAPA 2 · EL MOTOR DE COMISIONES 🔥

**Objetivo:** que los 4 bonos se calculen solos y bien.
**Es el corazón del sistema. Todo lo demás solo muestra lo que esto calcula.**

## Qué se construye

**TypeScript puro. Sin pantallas, sin React, sin HTTP.** Funciones que reciben
datos y devuelven datos.

```
   calcularBonoPatrocinio(pedido, red, config)
   calcularBonoResidual(pedido, red, config)
   calcularBonoRango(socio, cierre, config)
   calcularBonoGlobal(semestre, config)
```

Después se envuelven en una Edge Function de Supabase, **dentro de una
transacción**: o se escribe todo el cierre, o no se escribe nada.

## Bono 1 · Patrocinio

Se dispara cuando **alguien se afilia comprando un pack**.

```
   Sube 7 niveles desde quien se afilió
   Reparte el 30.8% del precio del pack

   Nivel 1 ...... 40.0 %      Nivel 5 ...... 3.0 %
   Nivel 2 ...... 20.0 %      Nivel 6 ...... 2.0 %
   Nivel 3 ...... 10.0 %      Nivel 7 ...... 1.0 %
   Nivel 4 ......  5.0 %
```

> ### 🔴 La excepción del Kit Emprendedor
>
> **El Kit NO usa esa escala.** Paga **41.7% al nivel 1 y nada más**.
>
> Para un Kit de S/. 120 son S/. 50 al patrocinador directo, y los niveles 2 al 7
> no reciben nada. Está en la tabla `pack_comision_especial`.
>
> **Esto parece un error y no lo es.** Antes de "corregirlo", leer el Artículo XIV
> de la constitución.

## Bono 2 · Residual

Se dispara con **cada recompra de producto**.

```
   Sube 10 niveles desde quien compró
   Reparte el 97% de los puntos

   1 punto = S/. 1.00      ← esto es fijo y no se discute
```

> **Ojo con el 4.167.** Aparece en documentos viejos y **no se usa para nada**.
> Sale de dividir el precio de socio entre los puntos (S/.75 ÷ 18). Es un número
> derivado, no un valor del sistema.

## Bono 3 · Rango

**Mensual, al cierre.** Según el rango alcanzado ese mes.

> ### 🔴 Si el socio baja de rango, no cobra NADA
>
> Ni siquiera el bono del rango menor. Hay que **mantener o subir**.
>
> Parece injusto y es la regla confirmada. Artículo XV.

## Bono 4 · Global

**Semestral.** El 1% de la facturación, repartido entre quienes califican.

## Las reglas que atraviesan todo

**Sin compresión.** Si un nivel está bloqueado porque el socio está inactivo o su
pack no habilita ese nivel, **ese dinero no se paga y no sube al siguiente**.
Queda en la empresa. Artículo VIII.

**Activación.** 70 puntos personales en el mes. Sin eso no cobra.

**Niveles por pack.** 🔴 **Son DOS límites distintos, no uno.**

```
   pack           niveles_patrocinio   niveles_residual
   EMPRENDEDOR            0                   0
   EJECUTIVO              3                   5
   GOLD                   7                  10
   FAMILIAR               7                  10
   EMPRESARIAL            7                  10
```

**El Ejecutivo cobra patrocinio hasta el nivel 3, y residual hasta el 5.** Si se
usa un solo número para los dos, el Ejecutivo cobra de más en patrocinio.

*Reparto efectivo: Emprendedor 0% · Ejecutivo 78% · Gold y superiores 97%.*

**Puntos personales y grupales son contadores separados.** Los grupales **no**
incluyen los personales.

**Los puntos del producto desaparecen dentro de un pack.** El pack aporta solo
sus `puntos_rango`.

**Línea estirada.** Máximo 50% de los puntos de rango desde la línea más fuerte.

**Reseteo mensual.** Los puntos vuelven a cero al cierre. El rango honorífico se
conserva.

## Cómo se verifica — y esto no es opcional

```
   ☐  Cada bono tiene pruebas con números calculados A MANO
   ☐  El ejemplo del café de Máximo da exactamente 7.20 en el nivel 1
   ☐  Un Kit da 50.00 al nivel 1 y 0.00 a los niveles 2-7
   ☐  Un nivel bloqueado NO reparte su parte hacia arriba
   ☐  Un socio que bajó de rango recibe 0
   ☐  La suma de lo repartido nunca supera el tope del bono
   ☐  Correr el cierre dos veces NO paga dos veces (idempotencia)
   ☐  Si el cierre falla a la mitad, no queda nada escrito
```

**La idempotencia se resuelve así:**

```sql
UPDATE pedido SET estado='confirmado'
WHERE id = $1 AND estado='por_confirmar'
RETURNING id;
```

*Si no devuelve fila, alguien ya lo confirmó. No se procesa de nuevo.*

## Y la prueba que vale por todas

**Correr el cierre completo sobre los 500 socios simulados y cuadrar el total
repartido contra la facturación del mes.** Si no cuadra al céntimo, hay un bug.

---

# ETAPA 3 · PANEL DE ADMINISTRACIÓN — 10 pantallas

**Objetivo:** que Máximo pueda operar su negocio sin Excel.
**82 requisitos funcionales, 76 ya programables.**

| # | Pantalla | Qué hace |
|---|---|---|
| **P-20** | **Tablero** | Lo del día: pedidos por confirmar, ventas del mes, socios nuevos |
| **P-21** | **Registrar pedido** | Recompra de un socio. **Acá se aplica el descuento**, no en la web |
| **P-22** | **Registrar afiliación** | Socio nuevo con su pack y su patrocinador |
| **P-23** | **Bandeja de confirmación** 🔥 | Ver el voucher y confirmar el pago. **Acá se acreditan los puntos** |
| **P-24** | **Envíos** | Estado de cada pedido confirmado |
| **P-25** | **Cierre de ciclo** 🔥 | Cerrar el mes y pagar. **La operación más delicada del sistema** |
| **P-26** | **Configuración del plan** | Porcentajes, rangos, puntos de activación. Sin tocar código |
| **P-27** | **Gestión de socios** | Buscar, ver, dar de baja, cambiar pack |
| **P-28** | **Reportes** | Ventas, comisiones, rangos, exportables |
| **P-29** | **Auditoría** | Quién hizo qué y cuándo. No se puede borrar |

## Las dos pantallas críticas

### P-23 · Bandeja de confirmación

**Es donde el dinero entra al sistema.** Confirmar un pago acredita los puntos y
dispara las comisiones.

```
   ☐  Se ve el voucher junto a los datos del pedido
   ☐  Confirmar es un solo clic, con confirmación explícita
   ☐  Confirmar dos veces NO acredita dos veces
   ☐  Rechazar pide motivo, y el motivo queda guardado
   ☐  Todo queda en la auditoría con usuario y hora
```

### P-25 · Cierre de ciclo

**Es la operación más peligrosa del sistema.** Calcula y paga a todos.

```
   ☐  VISTA PREVIA obligatoria antes de confirmar
        cuántos socios cobran · cuánto en total · quiénes cambian de rango
   ☐  Máximo tiene que poder MIRAR los números antes de aceptar
   ☐  Todo o nada: una sola transacción
   ☐  Cerrar dos veces el mismo mes → error claro, no doble pago
   ☐  Queda un registro del cierre que después no se edita
```

> **Si algo sale raro en la vista previa, se cancela y no pasó nada.** Esa
> pantalla es lo que separa un error detectado de un error pagado.

## El descuento se aplica ACÁ

**La web pública muestra siempre el precio público.** No sabe quién es el
visitante ni qué pack tiene.

**Es el administrador quien aplica el descuento al registrar el pedido**, según
el `descuento_recompra_pct` del pack del socio.

*Detalle en `03-SISTEMA/14-FLUJO-DE-PRECIOS-Y-DESCUENTOS.md`.*

**Fuente completa:** `03-SISTEMA/10-RF-PANEL-ADMIN.md`

---

# ETAPA 4 · BACKOFFICE DEL SOCIO — 10 pantallas

**Objetivo:** que el socio vea lo suyo sin preguntarle a Máximo.
**60 requisitos funcionales, 55 ya programables.**

## En este orden

| Orden | # | Pantalla | Por qué ese lugar |
|---|---|---|---|
| 1 | **P-10** | Inicio de sesión | Sin esto no hay nada |
| 2 | **P-11** | Panel principal | Es la que más se abre |
| 3 | **P-13** | Tienda de recompra | Es la que genera dinero |
| 4 | **P-14** | Mis comisiones | **La que más reclamos evita** |
| 5 | **P-12** | Mi red | Necesita la tabla de ancestros |
| 6 | **P-15** | Mi rango | La más difícil de dibujar |
| 7 | **P-17** | Mis pedidos | |
| 8 | **P-19** | Mi billetera | |
| 9 | **P-16** | Mi enlace de patrocinio | Sencilla |
| 10 | **P-18** | Mi perfil | Sencilla |

## Las dos que hay que hacer muy bien

### P-14 · Mis comisiones

> **Tiene que explicar por qué NO cobró.**

Un socio que ve "S/. 0.00" sin explicación le escribe a Máximo. Cincuenta socios
haciendo eso cada cierre es el problema que este sistema viene a resolver.

```
   ❌  Comisiones del mes: S/. 0.00

   ✅  Comisiones del mes: S/. 0.00
       No estuviste activo: te faltaron 22 puntos de los 70
       Tus 3 socios directos sí compraron — esa comisión
       no se pagó a nadie.
```

### P-15 · Mi rango

Barras de progreso reales hacia el siguiente rango, **y aviso del riesgo de
bajar**:

```
   ⚠️  Te faltan 400 puntos grupales para mantener Gold.
       Si cierras el mes por debajo, no cobras bono de rango.
```

## Lo que el socio NUNCA ve

```
   ❌ Los datos de contacto de su red        solo nombre y estado
   ❌ Las comisiones que ganan otros
   ❌ La red que está por encima de él
   ❌ Nada de otra rama que no sea la suya
```

**Es dato personal ajeno — Ley 29733.** El árbol se filtra en el servidor, nunca
en el navegador.

## Y la regla que se olvida

**La mayoría va a abrir esto del celular.** Móvil primero, no móvil después.

*En la Fase 1 se dio la landing por terminada con el móvil roto. No se repite.*

**Fuentes:** `03-SISTEMA/09-RF-BACKOFFICE-SOCIO.md` y
`03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE.md` *(las 10 pantallas dibujadas con
números reales)*

---

# ETAPA 5 · CIERRE

```
   ☐  Un mes completo simulado de punta a punta
        afiliación → recompra → confirmación → cierre → pago
   ☐  Las 20 pantallas revisadas a 390px de ancho
   ☐  Pruebas de permisos: un socio NO puede ver datos de otro
   ☐  Respaldo de la base de datos y prueba de restauración
   ☐  Manual de operación para Máximo
   ☐  Despliegue en app.maxglobaloficial.com
```

---

# 5 · LO QUE NO ENTRA

```
   ❌ Tienda replicada por socio        rechazado el 26/08
   ❌ Pago en línea                     los pagos van por transferencia
   ❌ Facturación electrónica SUNAT     fuera desde la cotización
   ❌ App móvil nativa                  la web responsiva alcanza
   ❌ Rol de asesor                     congelado, sale de la v1
   ❌ Chat interno, notificaciones push, gamificación
```

**Si aparece una idea nueva, va a `05-CONTROL/PENDIENTES` — no al código.**

---

# 6 · LO QUE TODAVÍA FALTA DE MÁXIMO

*No bloquea empezar. Bloquea terminar.*

| Qué | Bloquea |
|---|---|
| Rangos 9 al 16 — 8 rangos sin valores | Bono de rango completo |
| Bono Global: conversión, cortes y reparto | El cuarto bono |
| Bono Cumpleaños y Bono Viajes | ¿entran a la v1? |
| Día de cierre y día de pago | La automatización del cierre |
| Cuentas bancarias para los pagos | P-19 Mi billetera |
| Monto mínimo de retiro | P-19 |
| Si el upgrade paga diferencia o pack completo | P-27 |
| Qué pasa con la descendencia al dar de baja a un socio | P-27 |

**Las etapas 0, 1 y 2 se pueden construir enteras sin ninguno de estos datos.**

---

# 7 · LOS DOCUMENTOS QUE HAY QUE LEER

**Antes de escribir una línea:**

| Documento | Para qué |
|---|---|
| `07-SPEC-KIT/PROYECTO-2-SISTEMA/memory/constitution.md` | **Las reglas innegociables.** 18 artículos |
| `01-NEGOCIO/01-PLAN-DE-COMPENSACION.md` | La ley del negocio |
| `03-SISTEMA/schema.sql` | Las 22 tablas |
| `00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO.md` | Todo el negocio de un vistazo |

**Al construir cada etapa:**

| Etapa | Documento |
|---|---|
| 0 | `03-SISTEMA/02-MODELO-DE-DATOS.md` |
| 2 | `03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md` |
| 3 | `03-SISTEMA/10-RF-PANEL-ADMIN.md` |
| 4 | `03-SISTEMA/09-RF-BACKOFFICE-SOCIO.md` + `15-ASI-SE-VE-EL-BACKOFFICE.md` |
| todas | `03-SISTEMA/05-ROLES-Y-PERMISOS.md` · `0