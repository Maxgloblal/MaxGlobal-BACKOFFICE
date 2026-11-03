# FASE 1 — LANDING Y PARTE COMERCIAL

> ## 📌 REEMPLAZADO POR CLAUDE DESIGN — 26/08/2026
>
> Jack tiene mejores resultados con **Claude Design** que con Stitch.
> **Usa `06-MARCA/02-CLAUDE-DESIGN/` en su lugar.**
>
> Este documento se conserva como referencia de contenido y estructura, pero los
> prompts están escritos para Stitch y no rinden igual en Claude Design.

## Prompts para Stitch

**Herramienta:** [Stitch](https://stitch.withgoogle.com) de Google
**Alcance:** solo el sitio público comercial. El sistema va en Fase 2.
**Fecha:** 25 de agosto de 2026

---

## ARQUITECTURA DE DOMINIOS

El proyecto son **dos productos separados**, no uno solo:

```
maxglobaloficial.com              ← FASE 1 · esto es lo que se diseña ahora
   Sitio comercial público
   Vende la oportunidad y capta afiliados
   Sin lógica de comisiones

app.maxglobaloficial.com      ← FASE 2 · después
   El sistema: backoffice del socio y panel admin
   Motor de comisiones, árbol de red, vouchers
```

### Por qué esta separación es correcta

| Ventaja | Detalle |
|---|---|
| Se despliega independiente | La landing sale a producción sin esperar al motor |
| Se rompe por separado | Una caída del sistema no tumba el sitio comercial |
| Stacks distintos | La landing puede ser estática y rapidísima; el sistema necesita base de datos |
| Equipos distintos | Se puede trabajar en paralelo sin pisarse |
| Seguridad | El sistema queda aislado del tráfico público |

**Es la decisión correcta y conviene dejarla escrita.**

---

## QUÉ ENTRA EN LA FASE 1

| Sí entra | No entra — va a Fase 2 |
|---|---|
| Portada institucional | Login de socios |
| Catálogo de productos | Backoffice del distribuidor |
| Comparativa de packs | Panel de administración |
| Explicación del plan de compensación | Árbol genealógico |
| Formulario de registro | Tienda de recompra |
| Captura del link de patrocinador | Historial de comisiones |
| Instrucciones de pago | Aprobación de vouchers |
| Quiénes somos | Motor de cálculo |

**El punto de conexión entre las dos fases:** el botón *"Ingresar"* de la
landing apunta a `app.maxglobaloficial.com`. Nada más.

---

## LO QUE GOBIERNA ESTE DISEÑO

> **El tráfico no viene de Google. Viene de los socios compartiendo su link
> por WhatsApp.**

Tres consecuencias directas:

1. **El SEO importa poco.** Nadie busca "Max Global" antes de afiliarse.
2. **El link de patrocinador es sagrado.** Si `?ref=` se pierde, el socio
   pierde su comisión y reclama.
3. **Es una experiencia de celular.** El link llega por WhatsApp y se abre en
   el teléfono.

**Prioridad de esfuerzo:** que el `?ref=` nunca se pierda **>** velocidad en
móvil **>** diseño **>** SEO.

---

## CÓMO USAR ESTOS PROMPTS

1. Abre Stitch en modo **Web** (no App — esto es una web, no una app nativa).
2. Sube el logo con el botón **+** antes del primer prompt. Stitch lo usa como
   referencia de estilo.
3. Copia **un solo bloque** por vez.
4. Ajusta con mensajes cortos: *"el botón en dorado"*, *"más grande el precio"*.
5. Pasa a la siguiente.

**Empieza por la P-03 (Packs).** Es la pantalla que vende — cuando esa queda
bien, las demás heredan el estilo.

---

## BLOQUE DE MARCA

Si Stitch pierde los colores entre pantallas, vuelve a pegarle esto:

```
Paleta de marca: dorado #D1AD68 como color principal, verde #1BA741
como secundario, fondo blanco. Tipografía sans-serif limpia y
geométrica. Estilo sobrio y profesional, sensación de empresa seria
y establecida, no de tienda barata. Botones cuadrados con esquinas
de 2px. Interfaz en español de Perú, moneda en soles (S/).
```

---

# LAS PANTALLAS

## P-01 · Portada

```
Diseña la página de inicio de Max Global Corporation, una empresa
peruana de venta directa de productos naturales de salud y bienestar
(moringa, café, colágeno, cosmética).

Paleta: dorado #D1AD68 principal, verde #1BA741 secundario, fondo
blanco. Sans-serif limpia y geométrica. Botones cuadrados de 2px.
Todo en español, moneda en soles (S/).

Estilo: sobrio y profesional, como una empresa establecida. Nada de
colores estridentes ni sensación de esquema rápido.

Estructura de arriba abajo:

1. Barra superior fija: logo a la izquierda; menú al centro
   (Productos, Oportunidad, Packs, Nosotros); botón "Ingresar"
   contorneado en verde a la derecha.

2. Hero a pantalla completa con fotografía de fondo de productos
   naturales. Titular corto de 4 palabras sobre transformar vidas
   y bienestar. Subtítulo de una línea. Botón principal grande
   "Quiero afiliarme" en dorado sólido.
   A un costado, una tarjeta flotante blanca discreta:
   "Te invita: Carlos Mendoza" con un ícono de verificado verde.

3. Franja de confianza: 4 datos en fila con ícono, separados por
   líneas verticales finas. Ejemplos: "Productos naturales",
   "Plan de compensación de 10 niveles", "Sistema propio",
   "Respaldo empresarial".

4. Productos destacados: grid de 4 tarjetas. Cada una con la foto
   del producto recortada sobre un bloque de color plano, nombre,
   precio en soles y una insignia verde con el puntaje. Sin
   párrafos. Botón "Ver todo el catálogo" al final.

5. Sección "La oportunidad": fondo verde oscuro, texto en blanco.
   Titular corto, tres columnas con ícono explicando ingreso
   residual, red propia y crecimiento por rangos. Botón dorado.

6. Comparativa de packs resumida: 5 tarjetas en fila con nombre y
   precio, destacando Gold como el más elegido. Botón "Comparar
   todos los packs".

7. Cómo funciona: 4 pasos horizontales numerados con ícono, una
   sola línea de texto cada uno.

8. Cierre: franja dorada con titular y botón "Afíliate ahora".

9. Pie de página oscuro: logo en blanco, columnas de enlaces,
   contacto y redes sociales.

Mobile-first: la mayoría de visitantes llega desde WhatsApp en el
celular.
```

---

## P-02 · Catálogo de productos

```
Diseña la página de catálogo de productos de Max Global, empresa
peruana de productos naturales.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español,
precios en soles.

Encabezado de página con titular "Nuestros productos" y una línea
de descripción.

Grid de 8 productos, 4 por fila en escritorio y 2 en celular:
Café, Colágeno, Aceite de Moringa, Esplendor, Aceite de Orégano,
Cápsulas de Moringa, Harina de Moringa, Perfume Dalba.

Cada tarjeta:
- Foto del producto recortada, sin fondo, sobre un bloque de color
  plano suave (alternando tonos)
- Nombre del producto
- Precio en soles, grande: "S/ 75.00"
- Precio PÚBLICO en dorado: "S/. 150"  (no S/. 75 — esa era la lista del socio)
- Insignia verde redondeada con el puntaje: "18 puntos"
- Al pasar el cursor, la tarjeta se eleva suavemente

Debajo del grid, una franja informativa en dorado suave:
"Los socios afiliados obtienen hasta 50% de descuento en todos los
productos" con un botón "Ver packs de afiliación".

Sin botón de compra individual: acá no se vende suelto, se muestra
el catálogo para que el visitante entienda qué hay.
```

---

## P-03 · Comparativa de packs — **empieza por esta**

```
Diseña la página de comparación de packs de afiliación de Max
Global, empresa peruana de venta directa multinivel.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español,
soles.

Encabezado: titular "Elige cómo empezar" y una línea explicando que
cada pack desbloquea distintos niveles de ganancia.

Tabla comparativa de 5 columnas, en formato de tarjetas verticales
en escritorio y carrusel horizontal en celular:

1. KIT EMPRENDEDOR — S/ 120
   1 producto · 40% de descuento
   Sin comisión residual
   Solo puede afiliar Kit Emprendedor

2. PACK EJECUTIVO — S/ 360
   4 productos · descuento en recompras
   Residual de 5 niveles
   Patrocinio de 3 niveles
   70 puntos de rango

3. PACK GOLD — S/ 1,200  ← DESTACADO como "El más elegido"
   13 productos
   Residual de 10 niveles
   Patrocinio de 7 niveles
   150 puntos de rango
   Participa del Bono Global semestral

4. PACK FAMILIAR — S/ 4,000
   Productos a costo de recompra
   Residual de 10 niveles
   400 puntos de rango
   Bono Global

5. PACK EMPRESARIAL — S/ 8,000
   Hasta 55% de descuento
   Residual de 10 niveles
   800 puntos de rango
   Bono Global

La tarjeta Gold es más alta, con borde dorado grueso y una cinta
diagonal que dice "MÁS ELEGIDO".

Cada tarjeta lleva SU PROPIO botón "Elegir este pack" en dorado.
No un botón general para toda la sección.

Debajo, una tabla de comparación detallada fila por fila con
checks verdes y guiones grises, para quien quiere ver el detalle
completo.

Al final, un recuadro de advertencia discreto en dorado suave:
"El Kit Emprendedor solo puede afiliar a otros Kit Emprendedor."
```

---

## P-04 · La oportunidad

```
Diseña una página que explique el plan de compensación de Max
Global de forma simple y visual, para alguien que nunca ha estado
en venta directa.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Titular grande: "Cómo se gana con Max Global"

Sección de 4 bloques alternados, cada uno con una ilustración o
diagrama a un lado y texto al otro:

1. BONO DE PATROCINIO
   "Ganas cuando alguien se afilia con tu invitación."
   Diagrama simple de 7 niveles descendentes con los porcentajes:
   20%, 4%, 3%, 2%, 1%, 0.5%, 0.3%.

2. BONO RESIDUAL
   "Ganas todos los meses por las compras de tu equipo."
   Diagrama de 10 niveles con sus porcentajes.

3. BONO DE RANGO
   "Mientras más crece tu red, más alto llegas."
   Línea del tiempo horizontal con las insignias de rango: Jade,
   Bronce, Plata, Oro, Platino, Esmeralda, Zafiro, Diamante. Cada
   una con su bono en soles debajo.

4. BONO GLOBAL
   "Cada 6 meses se reparte el 1% del volumen de toda la empresa."
   Ícono de globo o reparto.

Entre las secciones, una franja verde oscura con una cita grande y
sobria sobre construir un negocio propio.

Al final: sección de preguntas frecuentes en acordeón con 5
preguntas típicas, y botón dorado "Quiero afiliarme".

Estilo didáctico y limpio. Los diagramas deben ser simples y
entendibles de un vistazo, no técnicos.
```

---

## P-05 · Registro

```
Diseña un formulario de afiliación de 4 pasos para Max Global,
empresa peruana de venta directa. Para celular.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Barra de progreso arriba con 4 pasos: Tu patrocinador, Tus datos,
Tu pack, Confirmar.

Muestra el PASO 2 "Tus datos":

- Arriba, una tarjeta verde clara fija con:
  "Te invita: Carlos Mendoza"
  "Código MG-0847" con ícono de verificado
  (no editable, viene del enlace)

- Formulario limpio, un campo por fila:
  Nombres
  Apellidos
  Documento de identidad
  Correo electrónico
  Teléfono / WhatsApp
  Departamento y ciudad
  Contraseña
  Confirmar contraseña

- Casilla de aceptación de términos

- Botones abajo: "Atrás" contorneado y "Continuar" en dorado
  sólido, ancho completo

Los campos deben ser grandes y cómodos para el pulgar. Etiquetas
flotantes. Validación visual en verde cuando el campo está
correcto.
```

---

## P-06 · Confirmación e instrucciones de pago

```
Diseña la pantalla de confirmación después de completar el registro
en Max Global. Para celular.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español,
soles.

1. Arriba, un check verde grande con animación de éxito y el
   titular "¡Registro completado!"

2. Tarjeta de resumen:
   "Tu código de socio: MG-1284"
   "Pack elegido: Gold"
   "Monto a pagar: S/ 1,200.00" en grande y dorado

3. Sección "Cómo pagar" con pasos numerados:
   Paso 1: Deposita en una de estas cuentas
   Paso 2: Toma foto de tu voucher
   Paso 3: Mándasela a tu asesor por WhatsApp
   Paso 4: Espera la confirmacion

4. Tarjetas de cuentas bancarias, una por banco, cada una con:
   logo del banco, número de cuenta, CCI, titular, y un botón
   pequeño "Copiar" al costado de cada número.

5. Boton grande de WhatsApp en verde, ancho completo:
   "Enviar mi voucher al asesor"
   Debajo, en letra chica: "Se abrira WhatsApp con tus datos ya
   escritos. Solo adjunta la foto de tu deposito."

6. Tarjeta del asesor asignado: foto, nombre y horario de atencion.

7. Recuadro informativo en verde suave al final:
   "Tu afiliación se activa cuando confirmemos el depósito.
   Normalmente toma menos de 24 horas."

Los números de cuenta deben ser el elemento más legible: fuente
grande y monoespaciada.
```

---

## P-07 · Nosotros

```
Diseña la página institucional "Nosotros" de Max Global
Corporation, empresa peruana de bienestar y venta directa.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

1. Hero corto con fotografía de equipo o instalaciones y el titular
   "Transformamos vidas en Latinoamérica".

2. Dos columnas: MISIÓN y VISIÓN, cada una con su ícono en dorado y
   un párrafo corto.

3. Franja de valores: 5 valores en fila con ícono 3D y una palabra
   cada uno.

4. Sección "Por qué elegir Max Global": 5 razones en tarjetas con
   ícono, una línea de texto cada una. Productos naturales,
   espacio para tu talento, negocio inteligente, sistema
   educativo, soporte real.

5. Franja de cifras: 4 números grandes que cuentan hacia arriba al
   aparecer. Dejarlos como campos claramente editables, sin datos
   inventados.

6. Cierre con el video del logo animado y botón dorado
   "Únete a nosotros".

Estilo sobrio y corporativo. Debe transmitir empresa establecida y
formal, no emprendimiento improvisado.
```

---

## LISTA DE VERIFICACIÓN ANTES DE DAR LA FASE 1 POR CERRADA

- [ ] El `?ref=` se conserva al navegar entre todas las páginas
- [ ] El nombre del patrocinador se ve en la portada y en el registro
- [ ] Un `?ref=` inválido muestra un mensaje claro, no un error técnico
- [ ] Todos los precios visibles en la página, ninguno en PDF
- [ ] Cada pack tiene su propio botón, no uno general
- [ ] Ninguna cifra ni testimonio inventado
- [ ] El botón "Ingresar" apunta al subdominio del sistema
- [ ] Probado en un celular real, no solo en el simulador
- [ ] Los números de cuenta se pueden copiar con un toque
- [ ] La restricción del Kit Emprendedor está visible
- [ ] Analítica instalada con evento en el botón de afiliación

---

## PENDIENTES QUE BLOQUEAN LA FASE 1

| # | Qué falta | Bloquea |
|---|---|---|
| ~~L-01~~ | ~~Tabla de descuentos~~ ✅ **RESUELTO 25/08:** recompra 50% para todos, 40% el Kit Emprendedor | — |
| L-02 | Puntaje del Kit Emprendedor | Comparativa de packs |
| L-03 | Cuentas bancarias de la empresa | Confirmación de pago |
| L-04 | Composición de los packs Familiar y Empresarial | Comparativa |
| L-05 | Textos de misión, visión y valores | Nosotros |
| L-06 | Fotografías de productos con fondo transparente | Catálogo y portada |
| L-07 | Confirmación del subdominio para el sistema | Botón "Ingresar" |

---

## DESPUÉS DE STITCH

Lo que salga son **bocetos**, no el sitio final. Sirven para:

1. Validar la estructura antes de programar
2. Mostrárselos a Máximo y confirmar que es lo que espera
3. Dárselos al constructor de IA como referencia visual

Guarda las capturas en `06-MARCA/mockups/` y anótalo en la bitácora.

📌 *Los prompts del sistema (backoffice y panel admin) están guardados en
`_fase2-sistema/` para cuando llegue esa etapa.*


---

## ⚠️ NOTA DE REDACCIÓN — EL 55% NO VA EN LA LANDING

El 55% del Pack Empresarial es el descuento con que se **arman los productos
dentro del pack**, no lo que el socio paga al recomprar. Su recompra es al 50%,
igual que todos.

**Escribir "hasta 55% de descuento" sería publicidad engañosa** y el Código del
Consumidor peruano (Ley 29571) lo sanciona.

**Texto correcto en toda la landing:** *"hasta 50% de descuento"*.
