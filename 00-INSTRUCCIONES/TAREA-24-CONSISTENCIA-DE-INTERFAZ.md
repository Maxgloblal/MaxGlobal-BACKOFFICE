# TAREA-24 · CONSISTENCIA DE INTERFAZ

**Para:** Antigravity
**Escrita:** 6 de septiembre de 2026

> ## 🔴 ESTA TAREA ES SOLO DE PRESENTACIÓN
>
> **No se toca ni una consulta, ni una función, ni una regla de negocio.**
> Ni el motor, ni las funciones SQL, ni los servicios. Solo componentes,
> estilos y mensajes.
>
> Si al terminar alguna cifra de la base cambió, algo se hizo mal.

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

# EL DIAGNÓSTICO

El sistema **ya tiene** un juego de piezas y respeta el brandkit. El problema es
que solo la mitad de las pantallas lo usa.

```
   TarjetaDato       la usan 13 de 22 pantallas
   Tabla             la usan 10 de 22
   EstadoVacio        la usan  6 de 22
   DialogoConfirmar   lo usan  6 de 22
```

Cada pantalla se construyó en una tarea distinta y se nota. **No hay que
inventar nada: hay que adoptar lo que ya existe.**

## El brandkit SÍ se respeta — no se toca

**Verificado el 6/09 contra `06-MARCA/00-GUIA-DE-MARCA-WEB.md`:**

```
   --mg-dorado  #D1AD68   ✅ coincide
   --mg-verde   #1BA741   ✅ coincide
   Agus Sans (display) · Caviar Dreams (cuerpo)   ✅ coinciden
   gold-600 #A8873F anotado como "pasa contraste AA para texto"  ✅
```

```
   🔴 NO se agregan colores nuevos.
   🔴 NO se cambian los tokens.
   🔴 Todo sale de tokens.css. Ni un hex escrito en un componente.
```

**Uso oficial del color, del brandkit:**

```
   Botón principal        dorado  #D1AD68
   Botón de confirmar     verde   #1BA741
   Estado ACTIVO          verde
   Estado INACTIVO        gris    #6B7280
   Error                  #DC2626    Alerta  #D97706
```

---

# BLOQUE 1 · LAS ACCIONES QUE NO SE DESHACEN 🔴 EMPIEZA POR ACÁ

Hoy hay acciones irreversibles que **no preguntan nada**, y otras que usan el
cuadro gris del navegador.

```
   P-32  desactivar producto    → window.confirm()   🔴 feo y fuera de marca
   P-31  descartar solicitud    → SIN confirmación   🔴
   P-27  dar de baja un socio   → SIN confirmación   🔴🔴 reengancha
                                                        una red entera
```

## Qué se hace

Adoptar `DialogoConfirmar`, que ya existe y ya lo usan 6 pantallas, en:

```
   desactivar / activar producto     (P-32)
   descartar solicitud               (P-31)
   dar de baja un socio              (P-27)
   rechazar un pago                  (P-23, si no lo tiene)
   rechazar un retiro                (P-30, si no lo tiene)
```

## Reglas

```
   1 · El diálogo dice QUÉ va a pasar, no "¿estás seguro?"
       ❌ "¿Estás seguro?"
       ✅ "Se va a dar de baja a PEDRO GARCÍA. Sus 4 frontales
           pasarán a colgar de KARLA DIAZ. Esta acción no se
           puede deshacer."

   2 · El botón de confirmar dice la acción, no "Aceptar"
       ✅ "Sí, dar de baja"   "Sí, descartar"

   3 · La acción destructiva va en rojo (--mg-error).
       La de confirmar algo bueno, en verde. Las demás en dorado.

   4 · 🔴 Cero window.confirm() y cero alert() en todo src/paginas/
```

**Commit.**

---

# BLOQUE 2 · LOS ERRORES DEJAN DE SER `alert()`

```
   P18MiPerfil.jsx:174   alert('Error al guardar datos: ' + err.message)
   P24Envios.jsx:76      alert('Por favor ingresa el número de guía...')
```

Un `alert()` bloquea la pantalla, se ve fuera de marca y en móvil es horrible.

```
   Los errores y avisos van DENTRO de la pantalla,
   como ya lo hace P-23 con su panel de aviso.

   Error       fondo suave + borde --mg-error
   Aviso       fondo suave + borde --mg-alerta
   Éxito       fondo suave + borde --mg-verde
```

Si no existe una pieza para eso, se crea **una** —`Aviso`— y se exporta desde
`piezas/index.js` como las demás. No se resuelve con estilos sueltos en cada
pantalla.

**Commit.**

---

# BLOQUE 3 · ESTADOS VACÍOS

`EstadoVacio` existe y solo lo usan 6 pantallas. El resto muestra una tabla en
blanco sin explicar nada.

**Adoptarlo en las que faltan**, sobre todo las del socio, que es quien más lo
va a ver el primer día:

```
   P-14 Mis Comisiones    "Aún no tienes comisiones en este ciclo.
                           Se acreditan cuando tu equipo compra."
   P-17 Mis Pedidos       "Todavía no hiciste ningún pedido."
                           + botón "Ir a la tienda"
   P-19 Mi Billetera      "Tu billetera está vacía. Las comisiones
                           se abonan al cerrar el mes."
   P-12 Mi Red            "Aún no tienes afiliados. Comparte tu enlace."
                           + botón "Ver mi enlace"
   P-15 Mi Rango          "Este ciclo todavía no calificas a un rango."
   P-27 · P-28 · P-29     los del admin
```

```
   🔴 El texto explica POR QUÉ está vacío y QUÉ hacer.
      No un "No hay datos" a secas.

   🔴 Cuando hay una acción obvia, va un botón que lleve a ella.
```

**Commit.**

---

# BLOQUE 4 · LA BARRA LATERAL QUE SE CORTA

**Reproducir antes de tocar nada.** En P-31, con la lista larga, al bajar la
página el menú se corta y quedan las últimas entradas arriba con blanco debajo.

```
   Lo que ya verifiqué del CSS, y está bien escrito:
     .armazon-admin-sidebar   position: sticky · top: 0 · height: 100vh
     .armazon-admin-nav       flex: 1 · overflow-y: auto
     .armazon-admin           min-height: 100vh · display: flex
                              sin overflow que rompa el sticky
```

**Sospechosos, en orden:**

```
   1 · El menú creció de 10 a 13 entradas (Solicitudes, Retiros,
       Productos). Con el header y el footer puede pasarse de 100vh
   2 · align-self por defecto en un item flex puede anular el sticky
   3 · El footer del sidebar queda fuera del área con overflow
```

```
   🔴 Reprodúcelo en el navegador primero y di cuál era.
      No arregles a ciegas los tres.
```

**Y comprueba que sigue bien con el menú del socio**, que tiene 9 entradas y
otro armazón.

**Commit.**

---

# BLOQUE 5 · PAGINACIÓN EN LAS LISTAS LARGAS

```
   P-31 pinta 42 solicitudes de una
   P-27 tiene 508 socios
   P-29 tiene 105 registros de auditoría y va a crecer siempre
```

```
   🔴 Paginación en el CLIENTE, sobre los datos que ya llegan.
      NO se tocan las consultas ni los servicios.
      20 filas por página.
```

Si alguna pantalla ya trae paginación del servidor, se deja como está.

**Commit.**

---

# BLOQUE 6 · LAS PRUEBAS

```
   1 · No queda ningún window.confirm() en src/paginas/
   2 · No queda ningún alert() en src/paginas/
       (salvo Kit.jsx, que es la pantalla de muestra de piezas)
   3 · Desactivar un producto abre DialogoConfirmar, no el del navegador
   4 · Dar de baja un socio abre DialogoConfirmar
   5 · Cancelar en el diálogo NO ejecuta la acción
       ← número a mano: el producto sigue activo = true
   6 · Una pantalla sin datos muestra EstadoVacio, no una tabla vacía
   7 · Con 42 filas, la lista muestra 20 y el paginador
   8 · Ningún componente tiene un color hexadecimal escrito a mano
       ← grep de #RRGGBB en src/paginas/ y src/piezas/ = vacío
```

**La 5 y la 8 son las que importan.** La 5 porque un diálogo que no cancela es
peor que no tener diálogo. La 8 porque es lo que mantiene el brandkit vivo.

**Commit.**

---

# BLOQUE 7 · VERIFICACIÓN

```bash
# 1 · cero confirmaciones del navegador
grep -rn "window.confirm" src/paginas/
#    debe devolver VACÍO

# 2 · cero alerts (salvo Kit.jsx)
grep -rn "alert(" src/paginas/ | grep -v "Kit.jsx"
#    debe devolver VACÍO

# 3 · ningún color a mano fuera de tokens.css
grep -rnE "#[0-9A-Fa-f]{6}" src/paginas/ src/piezas/
#    debe devolver VACÍO

# 4 · EstadoVacio adoptado
grep -rl "EstadoVacio" src/paginas/ | wc -l
#    antes: 6 · debe subir bastante

# 5 · DialogoConfirmar adoptado
grep -rl "DialogoConfirmar" src/paginas/ | wc -l
#    antes: 6
```

## Capturas

```
   1 · El diálogo de dar de baja a un socio, con el texto que
       explica qué va a pasar con sus frontales
   2 · Una pantalla del socio con su estado vacío
   3 · P-31 con el paginador
   4 · La barra lateral con la página abajo del todo, sin cortarse
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA — NADA DE LÓGICA

```
   ❌ src/servicios/ — ni una consulta
   ❌ src/motor/ — todo
   ❌ Las funciones SQL, las políticas RLS, las migraciones
   ❌ src/estilos/tokens.css — los colores de marca están BIEN
   ❌ El brandkit — no se agregan colores ni tipografías
   ❌ La landing — otro proyecto
   ❌ Las reglas de negocio, los cálculos, los estados
```

> **Si para "mejorar el diseño" hace falta cambiar una consulta, no se hace.**
> Se anota y se consulta. Esta tarea es presentación pura.

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

Al terminar, estas cifras tienen que ser **idénticas**:

```
   socios              508
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet              471   · saldo de Karla S/. 1,790.00
   productos             8   · precios y puntos sin cambios
   config               39 claves · linea_estirada_pct = 50
```

**Es una tarea de diseño. Si movió un número, movió algo que no debía.**

---

# DESPUÉS DE ESTA

Queda el **móvil a 390px**, que nunca se probó y es donde los socios van a
entrar a ver cuánto ganaron. Esa va aparte porque es la que más trabajo tiene:
tablas de 6 columnas no entran en esa pantalla.
