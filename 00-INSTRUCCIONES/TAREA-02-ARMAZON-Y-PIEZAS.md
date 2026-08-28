# TAREA 02 — ARMAZÓN Y PIEZAS DEL SISTEMA

**Fase 2 · Etapa D** · 27 de agosto de 2026
**Lee primero:** `00-LEEME-PRIMERO.md`. **Termina la `TAREA-01` antes que esta.**

> ## 📌 CAMBIO DEL 27/08 — YA HAY BASE DE DATOS
>
> Esta tarea iba a construirse con datos falsos escritos a mano. **Ya no.**
>
> La `TAREA-01` deja la base creada y los tipos de TypeScript generados desde el
> esquema. **Las pantallas se construyen contra los tipos reales**, no contra
> objetos inventados que después no coinciden.
>
> ```
>    ❌  const socio = { nombre: 'María', puntos: 48 }     inventado
>    ✅  import type { Socio } from '../tipos/supabase'    real
> ```
>
> **Los datos siguen siendo de prueba** — unas pocas filas semilla en la base, no
> la red simulada completa (esa es la TAREA-03). Pero con la forma correcta.
>
> **Y las consultas pasan por RLS desde el primer día.** Si una pantalla trae
> datos que no debería, se ve ahora y no en producción.

---

> # 🔴 ANTES DE ESCRIBIR UNA LÍNEA
>
> ## En la Fase 1 corrompiste archivos NUEVE veces
>
> Archivos cortados a media palabra, otros rellenos de bytes nulos. **Todos tus
> commits estuvieron limpios — lo que se dañaba era el directorio de trabajo.**
>
> Una vez declaraste *"Tarea completada al 100%, 32 de 32 pruebas pasadas,
> compilación exitosa"* con **la aplicación entera rota**: `App.jsx` se había
> quedado sin sus rutas.
>
> ## Las cuatro reglas
>
> **1 · Git antes de nada**
>
> ```bash
> git init
> git add -A
> git commit -m "inicio tarea 01"
> ```
>
> **2 · Commit después de CADA bloque, no al final**
>
> **3 · Verifica antes de decir que terminaste**
>
> ```bash
> grep -rlP '\x00' src/ && echo "🔴 BYTES NULOS"
> npm run build
> git status --short
> ```
>
> **Si `npm run build` falla, NO has terminado.** Que las pruebas pasen no basta:
> los archivos se cortan *después* de correrlas.
>
> **4 · Archivos largos, escríbelos en partes** y verifica el final de cada una.

---

# QUÉ SE CONSTRUYE ACÁ

**El armazón y las piezas con las que después se arman las 20 pantallas.**

```
   ✅  Proyecto Vite + React funcionando
   ✅  Los tokens de diseño heredados de la landing
   ✅  2 armazones: socio y administrador
   ✅  8 piezas reutilizables, cada una con sus 3 estados
   ✅  Una página /kit que las muestra todas
   ✅  5 pantallas de referencia con datos falsos
```

## 🔴 Lo que NO se construye acá

```
   ❌ La base de datos                        ya está, TAREA-01
   ❌ Red simulada de 500 socios              TAREA-03
   ❌ Motor de comisiones                     TAREA-04
   ❌ Las otras 15 pantallas                  TAREAS 05 en adelante
   ❌ Cualquier cálculo de dinero de verdad
```

**Los números que se muestren salen de la base, no de un cálculo.** Si una
pantalla necesita una comisión, se lee una fila semilla — **no se calcula acá**.

> **El motor va después.** Una pantalla que calcula comisiones por su cuenta es
> exactamente lo que la constitución prohíbe. *Artículo VII.*

---

# LA REGLA QUE MANDA EN TODA LA TAREA

> **Ninguna pantalla define un estilo propio.**

Si una pantalla necesita una tabla, usa `<Tabla>`. Si `<Tabla>` no hace lo que
necesita, **se mejora `<Tabla>`** — no se escribe una tabla nueva adentro de la
pantalla.

```bash
# esto debe salir VACÍO al terminar
grep -rnE "#[0-9a-fA-F]{6}|fontSize:|padding: '" src/paginas/
```

**Es lo que evita que cambiar el color de una insignia signifique tocar 20
archivos.**

---

# BLOQUE A · PROYECTO Y TOKENS

## Crear el proyecto

```
   Vite + React + React Router
   CSS plano con variables      ← igual que la landing, sin Tailwind
   Vitest + Playwright
```

## Heredar el diseño de la Fase 1

**No inventes colores ni tipografías.** Cópialos de
`SITIO WEB 06 PAGINAS LANDINGS/src/` y de `06-MARCA/00-MARCA-COMPLETA.md`.

```css
:root {
  --dorado:  #D1AD68;
  --verde:   #1BA741;
  /* el resto de tokens sale de la landing tal cual */
}
```

**Las tipografías `.woff2` también se copian** — Agus Sans para títulos, Caviar
Dreams para el texto.

## Estructura de carpetas

```
   src/
      armazon/        ArmazonSocio.jsx  ArmazonAdmin.jsx
      piezas/         las 8 piezas
      paginas/        las 5 pantallas + Kit.jsx
      datos-falsos/   los datos de mentira
      estilos/        tokens.css
```

**Commit.**

---

# BLOQUE B · LOS DOS ARMAZONES

## ArmazonSocio — 🔴 MÓVIL PRIMERO

**La mayoría de socios va a abrir esto del celular.** Se diseña para 390px y
después se adapta a escritorio, **no al revés**.

```
   MÓVIL  (lo primero)              ESCRITORIO
   ┌──────────────────┐             ┌────────┬──────────────┐
   │  ☰   logo    👤  │             │  logo  │  encabezado  │
   ├──────────────────┤             ├────────┼──────────────┤
   │                  │             │  menú  │              │
   │    contenido     │             │ lateral│  contenido   │
   │                  │             │        │              │
   ├──────────────────┤             └────────┴──────────────┘
   │ 🏠  🛒  💰  👥  │
   └──────────────────┘
```

**La barra inferior lleva 4 entradas, no más:** Inicio · Tienda · Comisiones ·
Mi red. El resto va en el menú `☰`.

**El encabezado muestra:** nombre del socio, su rango y el mes en curso.

## ArmazonAdmin — ESCRITORIO PRIMERO

**Máximo trabaja de computadora**, registrando pedidos y revisando vouchers.

```
   Menú lateral con las 10 entradas del panel
   Encabezado con el usuario y el ciclo abierto
   En móvil el menú lateral se convierte en cajón desplegable
```

## Ambos

```
   ☐  Indican en qué pantalla estás
   ☐  Tienen cerrar sesión
   ☐  Funcionan a 390px sin scroll horizontal
```

**Commit.**

---

# BLOQUE C · LAS 8 PIEZAS

**Cada una con sus TRES estados: con datos, vacía y cargando.**

| Pieza | Qué muestra |
|---|---|
| `TarjetaDato` | Un número grande con su rótulo. Puntos, comisiones, socios |
| `BarraProgreso` | Avance hacia una meta. Activación (70 pts) y rango |
| `Tabla` | Filas con columnas. **En móvil se convierte en tarjetas apiladas** |
| `InsigniaEstado` | por confirmar · confirmado · enviado · rechazado |
| `Formulario` | Campos, etiquetas, errores. **Una columna bajo 768px** |
| `EstadoVacio` | Icono, mensaje y acción sugerida |
| `DialogoConfirmar` | Para acciones peligrosas. Requiere confirmación explícita |
| `NodoArbol` | Un socio dentro de la red: nombre, rango, estado |

## 🔴 Dos advertencias que vienen de la Fase 1

### La tabla en móvil NO es una tabla

```css
/* escritorio */  display: grid;
/* móvil    */    display: flex; flex-direction: column;
```

**En la Fase 1 una tabla de 4 columnas declaró 2 en móvil y el texto se apiló
letra por letra.** No repitas el patrón: bajo 768px cada fila es una tarjeta con
sus rótulos.

### El estado vacío es la pieza más olvidada y la más importante

**Un socio nuevo abre el sistema el primer día y no tiene nada.**

```
   ❌  (pantalla en blanco)

   ✅  Todavía no tienes comisiones
       Aparecen acá después del cierre del mes.
       [ Ver cómo se generan ]
```

**Cada pieza que muestre una lista necesita su estado vacío. Sin excepción.**

## Pruebas de este bloque

```
   Vitest
   ☐  Cada pieza renderiza sus 3 estados
   ☐  Tabla vacía muestra EstadoVacio, no una tabla sin filas
   ☐  DialogoConfirmar NO ejecuta la acción hasta confirmar
   ☐  BarraProgreso con valor > meta no se pasa del 100%
```

**Commit.**

---

# BLOQUE D · LA PÁGINA /kit

**Una sola página que muestra las 8 piezas con sus 3 estados.**

```
   /kit
   ┌────────────────────────────────────────┐
   │  TARJETA DE DATO                       │
   │  [con datos]  [vacía]  [cargando]      │
   ├────────────────────────────────────────┤
   │  TABLA                                 │
   │  [con datos]  [vacía]  [cargando]      │
   ├────────────────────────────────────────┤
   │  ... las 8                             │
   └────────────────────────────────────────┘
```

**Para qué sirve:** revisar todo el sistema visual de una sola vez, en vez de
abrir 20 pantallas para ver si una insignia quedó bien.

**No se publica.** Solo existe en desarrollo.

**Commit.**

---

# BLOQUE E · LAS 5 PANTALLAS DE REFERENCIA

**Con datos falsos. Cubren todos los patrones del sistema.**

**Los datos salen del documento `03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE.md`**, que
ya tiene las pantallas dibujadas con María Torres, MG-00417, rango Gold y sus
números. **No inventes datos: usa esos.**

## 1 · P-11 Panel principal del socio

```
   Puntos personales del mes    48 / 70      ← BarraProgreso
   Puntos grupales              1,240        ← TarjetaDato
   Comisiones del mes           S/. 385.20   ← TarjetaDato
   Socios directos              3            ← TarjetaDato
```

**Y el aviso de activación si no llegó a 70:**

```
   ⚠️  Te faltan 22 puntos para activarte este mes.
       Sin activarte no cobras comisiones.
```

## 2 · P-14 Mis comisiones — 🔴 la que más cuidado necesita

> **Tiene que explicar por qué NO cobró.**
>
> Un socio que ve "S/. 0.00" sin explicación le escribe a Máximo. Cincuenta
> socios haciendo eso cada cierre **es el problema que este sistema viene a
> resolver.**

```
   ❌  Comisiones del mes:  S/. 0.00

   ✅  Comisiones del mes:  S/. 0.00

       No estuviste activo este mes.
       Te faltaron 22 puntos de los 70 requeridos.

       Tus 3 socios directos sí compraron.
       Esa comisión no se pagó a nadie.
```

**Construye las dos versiones: con comisiones y en cero con explicación.** Si
solo haces el caso feliz, después el bloque de explicación no entra.

## 3 · P-12 Mi red

El árbol, con `NodoArbol`. Expandir y contraer ramas.

**Lo que el socio NUNCA ve:**

```
   ❌ Teléfono o correo de su red      solo nombre, rango y estado
   ❌ Las comisiones de otros
   ❌ La red que está por encima de él
```

*Es dato personal ajeno — Ley 29733.*

## 4 · P-23 Bandeja de confirmación (admin)

Voucher a un lado, datos del pedido al otro. Botones confirmar y rechazar.
**Rechazar pide motivo.**

## 5 · P-25 Cierre de ciclo (admin) — 🔴 vista previa obligatoria

```
   ┌────────────────────────────────────────────┐
   │  VISTA PREVIA DEL CIERRE — Agosto 2026     │
   │                                            │
   │  Socios que cobran ............... 187     │
   │  Total a pagar .......... S/. 42,380.00    │
   │  Suben de rango ................... 12     │
   │  Bajan de rango .................... 4     │
   │  No cobran por inactividad ....... 313     │
   │                                            │
   │  [ Cancelar ]   [ Confirmar el cierre ]    │
   └────────────────────────────────────────────┘
```

**Máximo tiene que poder mirar esos números y arrepentirse.** Esa pantalla es lo
que separa un error detectado de un error pagado.

**El botón de confirmar usa `DialogoConfirmar`.**

**Commit.**

---

# BLOQUE F · PRUEBAS Y REVISIÓN MÓVIL

## Vitest

```
   ☐  Las 8 piezas, sus 3 estados cada una
   ☐  P-14 en cero muestra el bloque de explicación
   ☐  P-12 no expone teléfono ni correo de la red
   ☐  P-25 no dispara nada sin confirmación
```

## Playwright

```
   ☐  Navegar el armazón del socio completo, en móvil
   ☐  Navegar el armazón del admin, en escritorio
   ☐  Abrir /kit y que las 8 piezas rendericen
   ☐  P-25: cancelar en el diálogo NO ejecuta el cierre
```

## Revisión móvil de verdad — a 390px

**No basta con que compile.** Abre cada pantalla en el navegador a 390px.

```
   ☐  Ningún texto se apila en columna angosta
   ☐  Sin scroll horizontal
   ☐  Los botones se tocan cómodos (44px mínimo)
   ☐  Las tablas son tarjetas, no tablas rotas
   ☐  Los campos de formulario ocupan el ancho completo
```

```bash
# ninguna página con grid puede quedarse sin media query
for f in src/paginas/*.jsx src/armazon/*.jsx; do
  g=$(grep -c "gridTemplateColumns" "$f"); m=$(grep -c "@media" "$f")
  [ "$g" != "0" ] && [ "$m" = "0" ] && echo "🔴 sin media query: $f"
done
```

**Commit.**

---

# ORDEN

```
   0º   git init + commit               ← antes de tocar nada
   1º   Bloque A · proyecto y tokens
        commit
   2º   Bloque B · los 2 armazones
        commit
   3º   Bloque C · las 8 piezas
        commit
   4º   Bloque D · página /kit
        commit
   5º   Bloque E · las 5 pantallas
        commit
   6º   Bloque F · pruebas y móvil
        commit
```

**Párate después de cada bloque y avisa.**

---

# CRITERIOS DE ACEPTACIÓN

```
   PROYECTO
   ☐  npm run dev levanta
   ☐  npm run build compila
   ☐  Los colores y tipografías son los de la landing, sin inventar

   ARMAZONES
   ☐  Socio: barra inferior en móvil, menú lateral en escritorio
   ☐  Admin: menú lateral con las 10 entradas
   ☐  Los dos indican dónde estás y tienen cerrar sesión

   PIEZAS
   ☐  Las 8 existen, con sus 3 estados
   ☐  Tabla se vuelve tarjetas bajo 768px
   ☐  Toda lista tiene su EstadoVacio
   ☐  /kit las muestra todas

   PANTALLAS
   ☐  Las 5 navegables con datos falsos del documento 15
   ☐  P-14 tiene la versión en cero CON explicación
   ☐  P-12 no expone datos de contacto de la red
   ☐  P-25 tiene vista previa antes del botón

   DISCIPLINA
   ☐  grep de colores en src/paginas/ → VACÍO
   ☐  Ninguna pantalla declara estilos propios

   PRUEBAS
   ☐  Vitest en verde
   ☐  Playwright en verde
   ☐  Las 7 pantallas revisadas a 390px, mirándolas

   INTEGRIDAD
   ☐  grep -rlP '\x00' src/  no devuelve nada
   ☐  npm run build compila
   ☐  git status limpio
   ☐  git log con un commit por bloque
```
