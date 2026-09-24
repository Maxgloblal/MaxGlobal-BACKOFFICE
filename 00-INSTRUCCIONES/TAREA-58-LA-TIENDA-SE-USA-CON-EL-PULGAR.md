# TAREA-58 · La tienda se usa con el pulgar

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🟠 No rompe nada · pero es donde el socio recompra
**Fecha:** 23 de septiembre de 2026

---

# DE DÓNDE SALE

Jack estuvo recorriendo **P-13 Tienda de Recompra** en móvil y se ve el problema:

```
   El socio mete algo al carrito.

   Para pagar tiene que bajar por los 8 productos
   hasta el final. Si Máximo sube 20 productos,
   hasta el final de los 20.

   Y no hay forma de buscar nada.
```

```
   Esta es la pantalla donde el socio RECOMPRA.
   De ahí sale el residual de toda la red.
   Si comprar cuesta trabajo, se recompra menos.
```

`src/paginas/P13TiendaRecompra.jsx` · 498 líneas · el carrito ya existe
(líneas 35 a 152). **No hay que rehacer nada, solo hacerlo alcanzable.**

---

# BLOQUE 1 · UNA BARRA FIJA CON EL CARRITO

Cuando el carrito tiene algo, una barra pegada abajo que no se va al hacer
scroll:

```
   ┌──────────────────────────────────┐
   │  3 productos · S/. 180 · 36 pts  │
   │         [ Ver pedido ]           │
   └──────────────────────────────────┘
```

```
   · Aparece solo si hay algo en el carrito
   · Muestra cantidad, total en soles y en puntos
   · Al pulsarla, lleva al resumen del pedido
```

```
   🔴 Cuidado con la navegación de abajo.

   La pantalla ya tiene una barra inferior
   (Inicio · Tienda · Comisiones · Mi red).
   La barra del carrito va ENCIMA de esa, no
   tapándola. Compruébalo en un móvil de 390px
   de ancho, que es donde se aprieta.
```

Los totales ya están calculados en las líneas 150-152. Reúsalos, no los
vuelvas a sumar.

---

# BLOQUE 2 · BUSCADOR Y CATEGORÍA

Arriba del catálogo, igual que en la landing pública:

```
   [ Buscar producto...        ]  [ Categoría ▾ ]
```

```
   · Busca por nombre y por código
   · Ignora tildes y mayúsculas
     "moringa" tiene que encontrar "Moringa"
   · Filtra mientras escribe, sin botón
   · Si no hay resultados, lo dice
     y ofrece limpiar la búsqueda
```

```
   🔴 Ya está resuelto en la landing.

   src/pages/Productos.jsx del proyecto
   SITIO WEB tiene exactamente esto, con el
   filtro de tildes y el estado vacío.

   Reúsa esa lógica. No escribas otra distinta,
   que después son dos búsquedas que se comportan
   diferente en el mismo sistema.
```

---

# BLOQUE 3 · LOS AVISOS DE LA CONSOLA

Mientras Jack recorría la pantalla, la consola tiraba esto:

```
   Received `false` for a non-boolean attribute
   `deshabilitado`

   You provided a `value` prop to a form field
   without an `onChange` handler

   React does not recognize the `anchoCompleto`
   prop on a DOM element
```

No rompen nada hoy, pero son props en español pasándose a elementos del DOM.
Arréglalos: están en los componentes de `src/piezas/`, y ensucian la consola de
todo el sistema.

```
   🔴 Solo esos tres. No aproveches para
      refactorizar las piezas.
```

---

# LO QUE NO ENTRA

```
   🔵 Nada de cambiar el motor, los precios,
      los descuentos ni los puntos.

   Esta tarea es cómo se ve y cómo se navega.
   Si te ves tocando un cálculo, para.
```

---

# LO QUE TIENES QUE REPORTAR

```
· Capturas a 390px de ancho:
    carrito vacío · con productos · la barra fija
    buscando algo · sin resultados
· Que la barra del carrito NO tapa la navegación
· De dónde sacaste la lógica de búsqueda
· Los tres avisos de consola, antes y después
· La suite en verde
· Commit y publicación
```

Es una mejora de última hora antes de la reunión con el cliente. **Que no
rompa nada de lo que ya funciona** es más importante que quede bonita.
