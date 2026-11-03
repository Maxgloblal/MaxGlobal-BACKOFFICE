# PROMPTS PARA STITCH — BOCETOS DE PANTALLA

**Herramienta:** [Stitch](https://stitch.withgoogle.com) de Google
**Fecha:** 25 de agosto de 2026

---

## CÓMO USAR ESTE DOCUMENTO

**No subas ningún archivo a Stitch.** Stitch no lee documentos: toma un prompt
de texto y dibuja **una pantalla**.

Si le pegas una especificación completa se pierde y devuelve algo genérico.

### El método

1. Abre Stitch y elige el modo **Web** (no App — esto es una plataforma web,
   no una app nativa de tienda).
2. Copia **un solo bloque** de este documento.
3. Pégalo y genera.
4. Ajusta con mensajes cortos: *"haz el contador de puntos más grande"*,
   *"el botón en dorado"*.
5. Pasa a la siguiente pantalla.

### Orden recomendado

Empieza por el **panel del socio** (P-03), no por la landing. Es la pantalla
que más se usa y la que define el lenguaje visual de todo el sistema. Una vez
que quede bien, las demás heredan su estilo.

### Opcional pero recomendado

Sube el logo con el botón **+** antes del primer prompt. Stitch lo usa como
referencia de estilo y mantiene mejor la coherencia.

---

## BLOQUE DE MARCA — va en todos los prompts

Si Stitch pierde los colores entre pantallas, vuelve a pegarle esto:

```
Paleta de marca: dorado #D1AD68 como color principal, verde #1BA741
como secundario, fondo blanco. Tipografía sans-serif limpia y
geométrica. Estilo sobrio y profesional, sensación de institución
financiera seria, no de tienda. Botones cuadrados con esquinas de
2px. Interfaz en español.
```

---

# PANTALLAS DEL SOCIO

## P-01 · Portada pública

```
Diseña la página de inicio de Max Global Corporation, una empresa
peruana de venta directa de productos naturales de salud (moringa,
café, colágeno).

Paleta: dorado #D1AD68 principal, verde #1BA741 secundario, fondo
blanco. Sans-serif limpia y geométrica. Botones cuadrados de 2px.
Todo en español.

Estructura de arriba abajo:
1. Barra superior: logo a la izquierda, menú (Productos, Packs,
   Cómo funciona), botón "Ingresar" en dorado a la derecha.
2. Hero a pantalla completa: titular grande de 4 palabras sobre
   emprendimiento y bienestar, subtítulo de una línea, botón
   principal "Quiero afiliarme" en dorado. A la derecha una franja
   verde discreta que dice "Te invitó Carlos Mendoza".
3. Sección de productos: grid de 4 tarjetas. Cada una con foto del
   producto recortada sobre bloque de color plano, nombre, precio
   en soles y puntaje. Sin párrafos.
4. Sección de packs: 5 tarjetas en fila comparando Kit Emprendedor
   S/120, Ejecutivo S/360, Gold S/1200, Familiar S/4000,
   Empresarial S/8000. Cada tarjeta con su propio botón. Destaca
   el Gold como el más popular.
5. Cómo funciona: 4 pasos horizontales con ícono, una línea de
   texto cada uno.
6. Pie de página oscuro con logo en blanco y datos de contacto.

Mobile-first: la mayoría entra desde el celular.
```

---

## P-02 · Registro

```
Diseña un formulario de registro de 5 pasos para afiliarse a Max
Global, empresa peruana de venta directa.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Barra de progreso arriba con los 5 pasos: Patrocinador, Tus datos,
Tu pack, Contraseña, Confirmación.

Muestra el PASO 3 "Elige tu pack":
- Arriba, una franja verde clara: "Te invita: Carlos Mendoza ·
  Código MG-0847" con un ícono de verificado.
- 5 tarjetas de pack seleccionables en columna, cada una con:
  nombre, precio grande, cantidad de productos, cuántos niveles de
  comisión desbloquea y su porcentaje de descuento en recompras.
- La tarjeta seleccionada con borde dorado grueso.
- Abajo un resumen fijo con el pack elegido, el total a pagar y
  botón "Continuar" en dorado.

Diseño para celular, vertical.
```

---

## P-03 · Panel del socio — **empieza por esta**

```
Diseña el panel principal de la oficina virtual de un distribuidor
de Max Global, empresa peruana de venta directa multinivel.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Sans-serif
geométrica. Español. Diseño para celular.

La pregunta que el usuario se hace al entrar es "¿cuánto llevo,
cuánto me falta y cuánto voy a cobrar?". Eso debe responderse en
los primeros dos segundos.

Estructura vertical:
1. Cabecera: logo pequeño, "Hola, María", insignia de rango "PLATA"
   en dorado, ícono de salir.
2. TARJETA MÁS GRANDE Y VISIBLE: estado del mes. Fondo verde suave.
   Dice "Estás ACTIVA este mes" con un check grande, y debajo
   "72 de 70 puntos". Una barra de progreso completa en verde.
3. Fila de 3 contadores pequeños: Puntos personales 72, Puntos
   grupales 1,847, Frontales activos 4.
4. Tarjeta de billetera: fondo oscuro elegante, "Saldo disponible
   S/ 1,247.30" en números grandes, debajo en letra chica
   "Comisión estimada del ciclo: S/ 380.00".
5. Cuadrícula de 4 accesos rápidos con íconos: Comprar, Mi red,
   Mis comisiones, Mi enlace.
6. Aviso al final en dorado suave: "El ciclo cierra en 6 días".

Los números deben ser el elemento más grande de cada tarjeta.
```

---

## P-04 · Árbol de la red

```
Diseña la pantalla de red genealógica de un distribuidor multinivel,
para celular.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Arriba, resumen en una fila: "Mi red: 47 personas · 31 activas ·
16 inactivas".

Debajo, buscador con lupa: "Buscar por nombre o código".

El árbol NO se muestra completo ni con scroll horizontal. Se navega
por niveles:
- Una migaja de pan arriba: "Mi red > Carlos Mendoza"
- Lista vertical de tarjetas, una por persona del nivel actual.
- Cada tarjeta muestra: inicial en círculo de color, nombre,
  código MG-0000, etiqueta del pack, un punto verde o gris según
  esté activo, sus puntos del mes, y una flecha ">" si tiene gente
  debajo.
- Los frontales (nivel 1) se distinguen con borde dorado.
- Etiqueta pequeña de nivel: "Nivel 1", "Nivel 2".

Al final, botón "Ver niveles más profundos".
```

---

## P-05 · Tienda de recompra

```
Diseña la tienda interna de un distribuidor de productos naturales,
para celular.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Arriba: título "Mi recompra" y una franja verde suave con
"Descuento de tu pack Gold: 50%".

Grid de 2 columnas con 6 productos: Café, Colágeno, Aceite de
Moringa, Esplendor, Aceite de Orégano, Harina de Moringa.

Cada tarjeta:
- Foto del producto recortada sobre bloque de color plano
- Nombre
- Precio de lista tachado en gris (S/ 75.00)
- Precio público tachado (S/ 150) y precio del socio en dorado y grande (S/ 75.00)
- Insignia verde con el puntaje: "18 pts"
- Selector de cantidad - / 1 / +

Carrito flotante fijo abajo, siempre visible:
- "3 productos · S/ 112.50"
- Barra de progreso hacia los 70 puntos, con "54 de 70 puntos" y
  un mensaje: "Te faltan 16 puntos para activarte"
- Botón "Confirmar pedido" en dorado

Cuando llega a 70 puntos la barra se pone verde.
```

---

## P-06 · Mis comisiones

```
Diseña la pantalla de historial de comisiones de un distribuidor
multinivel, para celular.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Selector de ciclo arriba: "Agosto 2026" con flechas para cambiar
de mes.

Total grande y destacado: "S/ 1,247.30" con la etiqueta "Total
cobrado este ciclo".

Debajo, lista de acordeones desplegables, uno por tipo de bono:

1. "Bono de Patrocinio — S/ 369.60" (cerrado)
2. "Bono Residual — S/ 727.70" (ABIERTO, mostrando el detalle):
   - Nivel 1 · 18 compras · 40% ......... S/ 312.40
   - Nivel 2 · 24 compras · 20% ......... S/ 198.30
   - Nivel 3 · 31 compras · 10% ......... S/ 142.00
   - Nivel 6 · No pagado ................ (en gris, con ícono de
     información y el texto "Tu pack Gold habilita hasta el
     nivel 10, pero este socio estaba inactivo")
3. "Bono de Rango — S/ 150.00" (cerrado)

Los niveles no pagados se muestran en gris con su motivo. Esto es
importante: el usuario debe entender POR QUÉ no cobró.
```

---

## P-07 · Mi rango

```
Diseña la pantalla de progreso de rango de un distribuidor
multinivel, para celular.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Arriba: insignia grande y elegante del rango actual "PLATA" en
dorado, y debajo en letra chica "Tu rango más alto alcanzado: ORO".

Tarjeta de progreso al siguiente rango:
- "Siguiente: ORO"
- Dos barras de progreso: "Puntos grupales 1,847 de 4,000" y
  "Frontales activos 2 de 3"

SECCIÓN CLAVE — explicación visual de la regla de línea estirada:
Título: "Cómo se cuentan tus puntos"
Texto de ayuda: "De tu línea más fuerte solo cuenta hasta el 50%"

Tabla visual con tres filas, cada una una barra horizontal:
- "Línea de Carlos: 800 pts → te cuentan 250" con la barra
  cortada visualmente y una etiqueta "TOPE" en dorado
- "Línea de María: 180 pts → te cuentan 180" barra completa verde
- "Línea de José: 90 pts → te cuentan 90" barra completa verde
- Total: "520 puntos computables"

Al final, línea del tiempo horizontal con los 16 rangos, marcando
los alcanzados en dorado y los pendientes en gris.
```

---

# PANTALLAS DEL ADMINISTRADOR

## P-08 · Bandeja de vouchers — la más usada

```
Diseña el panel de aprobación de comprobantes de pago de una
empresa de venta directa. Para escritorio, no celular.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Diseño de dos columnas:

IZQUIERDA (35%) — lista de pendientes:
Cada fila con miniatura del voucher, nombre del socio, tipo
("Afiliación · Pack Gold"), monto y antigüedad ("hace 2 horas").
La seleccionada con borde dorado.
Arriba, filtros: Pendientes (12) · Aprobados · Rechazados.

DERECHA (65%) — detalle del seleccionado:
- Foto grande del voucher, ampliable
- Datos en dos columnas: Socio, Orden, Monto esperado S/ 1,200.00,
  Monto declarado S/ 1,200.00 con un check verde "coincide",
  Banco, Número de operación
- RECUADRO DESTACADO con borde dorado, título "Al aprobar va a
  ocurrir:" y una lista con viñetas:
    · María Torres pasa a estado ACTIVO
    · Se acreditan 150 puntos de rango
    · Se generan 7 comisiones de patrocinio por S/ 369.60
- Abajo, dos botones grandes: "Rechazar" en rojo contorneado,
  "Aprobar" en verde sólido.

El recuadro de consecuencias debe ser lo más visible de la pantalla.
```

---

## P-09 · Cierre de ciclo

```
Diseña la pantalla de cierre mensual de una empresa de venta
directa multinivel. Para escritorio.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Título: "Cierre de ciclo — Agosto 2026"

Barra de pasos horizontal arriba: Verificación · Vista previa ·
Confirmación · Ejecución · Liquidación. El paso 2 activo.

Contenido — VISTA PREVIA DEL CÁLCULO, con un aviso arriba en verde
suave: "Todavía no se ha guardado nada. Puedes cancelar."

Cuadrícula de 4 tarjetas de resumen:
- Socios activos: 312 de 487
- Volumen del ciclo: S/ 184,320
- Comisiones a pagar: S/ 71,847.20
- Rangos alcanzados: 23

Tabla de desglose por bono:
Bono de Patrocinio ... S/ 24,180.00 ... 142 socios
Bono Residual ........ S/ 41,517.20 ... 298 socios
Bono de Rango ........ S/  6,150.00 ...  23 socios
TOTAL ................ S/ 71,847.20

Recuadro de verificación con check verde: "Verificado: el total
pagado representa el 39% del volumen, dentro del límite
comprometido."

Abajo: botón "Cancelar" contorneado y "Confirmar y ejecutar
cierre" en dorado sólido.
```

---

## P-10 · Configuración del plan

```
Diseña la pantalla de configuración del plan de compensación de una
empresa multinivel. Para escritorio.

Paleta: dorado #D1AD68, verde #1BA741, fondo blanco. Español.

Menú lateral izquierdo con secciones: Valores generales, Niveles de
patrocinio, Niveles residuales, Productos, Packs, Rangos, Ciclo,
Cuentas bancarias.

Contenido: sección "Niveles residuales" seleccionada.

Tabla editable de 10 filas: Nivel 1 al 10, cada uno con su campo de
porcentaje editable (40, 20, 10, 5, 3, 2, 1, 10, 5, 1).

Debajo de la tabla, un total calculado: "Suma total: 97%".

Recuadro de advertencia en dorado con ícono:
"El nivel 8 paga más que el 7 de forma intencional. Es un incentivo
para los packs Gold en adelante. No es un error."

Arriba del todo, otro recuadro más serio con borde rojo:
"Cambiar estos valores afecta todos los cálculos futuros. Los
ciclos ya cerrados no se modifican."

Botones: "Cancelar" y "Guardar cambios" en dorado.
```

---

## DESPUÉS DE STITCH

Lo que salga de Stitch son **bocetos**, no el sitio final. Sirven para:

1. **Validar la estructura** antes de programar
2. **Mostrárselos a Máximo** y confirmar que es lo que espera
3. **Dárselos al constructor de IA** como referencia visual junto con la spec

Guarda las capturas en `06-MARCA/mockups/` y anótalas en la bitácora.

📌 *Espacio reservado para los mockups aprobados.*
