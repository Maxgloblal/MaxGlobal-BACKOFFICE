# TAREA-40 · LAS BARRAS MUERTAS Y LA META DE ACTIVACIÓN

**Para:** Antigravity
**Escrita:** 15 de septiembre de 2026

> Tu diagnóstico fue correcto y está confirmado. Esta tarea lo completa con
> lo que faltaba y trae **los números exactos que deben salir**.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**:

```bash
git status --short
git diff --stat
npm run build
npx vitest run
```

---

# DE DÓNDE SALIÓ ESTE ERROR — verificado con git

Jack preguntó cómo se llegó a esto si antes funcionaba. **Nunca funcionó.**

```
   BarraProgreso.jsx   creado 28/08 con  valor · meta
                       git log -S "porcentaje" → nunca lo aceptó

   Las 3 llamadas      nacidas 02/09
                       TAREA-07 (P-15) y TAREA-08 (P-13)
                       el día que se crearon esas pantallas
```

Quien escribió P-13 y P-15 asumió que el componente recibía un porcentaje sin
mirar su firma.

## Por qué nadie lo vio en 13 días

```
   El socio tiene 0 puntos  →  la barra muestra 0/100
                            →  PARECE correcto
```

**Acertaba de casualidad.** Es el mismo mecanismo que
`'kit-emprendedor'.includes('emprendedor')`: funcionaba por coincidencia. Solo
se habría notado el día que alguien comprara y la barra no se moviera.

```
   📌 Para 05-CONTROL/LECCIONES-Y-PATRONES.md:
      un defecto que "parece correcto" con los datos de hoy
      es más peligroso que uno que falla a la vista.
```

---

# EL INVENTARIO COMPLETO — ya barrido, no lo repitas

## Llamadas ROTAS · pasan `porcentaje`, que no existe

```
   P13TiendaRecompra.jsx:250
   P15MiRango.jsx:402
   P15MiRango.jsx:410
```

## Llamadas CORRECTAS · no las toques

```
   P11PanelSocio.jsx:208 y :229   usan valor/meta  ✅
                                  pero con meta={70} escrito a mano 🟡
   Kit.jsx:176, 187, 198          correctas ✅
   piezas.test.jsx                correctas ✅
```

---

# BLOQUE 1 · LAS TRES BARRAS

```jsx
   <BarraProgreso
     etiqueta="..."
     valor={puntosTotalesProyectados}
     meta={metaActivacion}
     unidad="pts"
     variante={...}
   />
```

## 🔴 La `variante` también está mal — verifícalo

```
   BarraProgreso acepta:  'verde' | 'dorado' | 'alerta' | 'peligro'
   P-13:250 y P-15:402 pasan:  "oro"   ← no está en esa lista
```

```
   🔴 OJO: `variante` es una propiedad de VARIOS componentes
      (botones, insignias, tarjetas) y cada uno acepta valores
      distintos. "oro" puede ser válido en otro componente.

   Comprueba variante por variante CONTRA SU PROPIO componente.
   NO hagas un buscar-y-reemplazar global.
```

**Commit.**

---

# BLOQUE 2 · LA META SALE DE CONFIG, NO DE UN 70

```
   config.activacion_puntos_mes = 70
```

## Dónde está escrito a mano

```
   P13TiendaRecompra.jsx:153-158   cuatro cálculos con /70 y >=70
   P13TiendaRecompra.jsx:228, 235  textos "70 Puntos Personales"
   P11PanelSocio.jsx:211, 232      meta={70}
   socio.js:358                    estaActivo con >= 70
```

## 🔴 NADA de "fallback a 70"

Propusiste *"fallback de seguridad en caso de red a 70"*. **No.**

```
   Es volver a escribir el valor a mano: el mismo patrón
   que corregimos en la TAREA-38 con useState(3).

   Si mañana Máximo cambia activacion_puntos_mes a 100 y
   la lectura de config falla, la pantalla mostraría 70
   en silencio. Y un socio con 80 puntos creería que está
   activo cuando no lo está.
```

```
   ✅ Si config no se puede leer:
      · la barra va en estado 'cargando'  (ya existe esa opción)
      · o se propaga el error
      NUNCA un número inventado.
```

**Commit.**

---

# BLOQUE 3 · EL NOMBRE DEL CICLO EN EL SELECTOR

```
   La tabla `ciclo` NO tiene columna `nombre`.
   El selector hace  {c.nombre || `Ciclo ${c.id}`}
   → c.nombre es undefined → siempre cae al "Ciclo 1"
```

Ya existe `formatearNombreCiclo(ciclo)` en `operacionAdmin.js:1033`, probada.

```
   Aplícala en obtenerCiclos de socio.js, para que TODAS las
   pantallas reciban el nombre ya formateado.
```

```
   🔴 Barre las 5 pantallas que él mencionó (P-11, P-12, P-13,
      P-14, P-15) y comprueba que ninguna siga con el fallback
      `Ciclo ${c.id}`.
```

**Commit.**

---

# BLOQUE 4 · LOS NÚMEROS QUE DEBEN SALIR

Entra al backoffice de **producción** como
`soportesmaxglobal01+admin@gmail.com` (Pack Empresarial, 50% de descuento,
0 puntos este mes) y ve a P-13.

## Estado inicial

```
   Meta de activación          70 puntos
   Acumulado actual             0 pts
   La barra dice                0 / 70 pts
   Te faltan                   70 pts
   Ancho de la barra            0%
```

```
   🔴 Hoy dice "0 / 100" y "Te faltan 100". Ese es el bug.
```

## Agrega 1 Coffee Capuccino (18 pts, S/. 75)

```
   La barra pasa a             18 / 70 pts
   Te faltan                   52 pts
   Ancho                       26%     (18/70 = 25.7%)
   Color                       dorado  (no llega a la meta)
```

## Agrega 3 más · 4 en total (72 pts, S/. 300)

```
   La barra pasa a             72 / 70 pts
   Ancho                      100%     🔴 topado, NUNCA más de 100
   Te faltan                    0 pts
   Color                       verde   (alcanza la meta)
```

```
   🔴 Ese tope al 100% es la "regla de oro" que el propio
      componente documenta en su línea 6. Compruébala.
```

## El selector de ciclo

```
   Debe decir     Septiembre 2026 (abierto)
   Hoy dice       Ciclo 1 (abierto)
```

**Commit.**

---

# BLOQUE 5 · LAS PRUEBAS

**Las 386 pruebas pasaban con las tres barras muertas.** Porque comprueban datos
y lógica, no que un componente reciba las propiedades correctas.

```
   1 · P-13 con 0 pts y meta 70 muestra "0 / 70", no "0 / 100"
   2 · Con 18 pts de carrito muestra "18 / 70"
   3 · Con 72 pts el ancho es 100%, no 102%
   4 · Ninguna llamada a BarraProgreso usa `porcentaje`
       ← grep de "BarraProgreso porcentaje" en src/ = VACÍO
   5 · Ninguna pantalla tiene el 70 escrito a mano
       ← grep de "70" junto a activacion/meta en src/paginas/ = VACÍO
   6 · El selector de ciclo muestra el MES, no "Ciclo N"
   7 · Si config no responde, la barra NO inventa un número
```

**La 4 y la 7 son las que importan.** La 4 porque es el bug. La 7 porque evita
que lo reintroduzcas por la puerta de atrás.

**Commit.**

---

# BLOQUE 6 · VERIFICACIÓN

```bash
# 1 · ninguna llamada con la propiedad inexistente
grep -rn "BarraProgreso porcentaje" src/
#    VACÍO

# 2 · el 70 ya no está escrito a mano
grep -rnE "(/|>=|>) ?70\b" src/paginas/ src/servicios/ | grep -vi test
#    VACÍO, o solo donde sea otra cosa (explícalo)

# 3 · el selector ya no cae al id
grep -rn 'Ciclo \${c.id}\|Ciclo ${ciclo.id}' src/
#    VACÍO
```

## Capturas

```
   1 · P-13 con el carrito vacío: "0 / 70 pts"
   2 · P-13 con 1 café: "18 / 70 pts" y la barra movida
   3 · P-13 con 4 cafés: barra al 100% y en verde
   4 · El selector diciendo "Septiembre 2026"
```

**Imágenes, no descripciones.** Esta tarea es visual: sin ver la barra moverse,
no está probada.

---

# LO QUE NO SE TOCA

```
   ❌ src/piezas/BarraProgreso.jsx — el componente está BIEN.
      El error está en quien lo llama.
   ❌ config.activacion_puntos_mes — el 70 es correcto
   ❌ Los precios y descuentos
   ❌ src/motor/ · las funciones SQL
   ❌ P11PanelSocio:208,229 y Kit.jsx — sus llamadas son correctas
      (solo el meta={70} de P-11 pasa a config)
```

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

Es una tarea de presentación. **Si movió un número de la base, movió lo que no
debía.**

```
   PRODUCCIÓN   socios 1 · órdenes 0 · comisiones 0
                config 39 · productos 8 · ciclos abiertos 1

   DEMO         509 socios · 2,423 comisiones · S/. 101,939.82
```
