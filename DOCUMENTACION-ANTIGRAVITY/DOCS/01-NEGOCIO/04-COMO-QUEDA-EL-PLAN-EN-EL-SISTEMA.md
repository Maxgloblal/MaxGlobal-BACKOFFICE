# CÓMO QUEDA EL PLAN DE MÁXIMO DENTRO DEL SISTEMA

**Para:** Jack — revisión antes de programar la TAREA-04B
**Fecha:** 28 de agosto de 2026
**Propósito:** que puedas contrastar, regla por regla, lo que el sistema hace
contra lo que Máximo pidió. Cada regla lleva su fuente textual.

> **Cómo leer esto.** La columna que importa es **"de dónde sale"**. Si una
> regla no tiene fuente, es una decisión nuestra y está marcada como tal. Si
> encuentras una que no cuadra con lo que Máximo te dijo, esa es la que hay que
> discutir antes de programar.

---

# PARTE 1 · CÓMO SE VERIFICA — la metodología

Antes del detalle, cómo se comprueba que el sistema hace lo que dice.

## No se cree en los reportes. Se consulta la base.

En la Fase 1 se dio por terminado el móvil y el SEO leyendo código. Los dos
estaban rotos. Desde que Supabase está conectado por MCP, **cada afirmación se
comprueba con una consulta contra Postgres**, no leyendo el código ni el
reporte de quien programó.

Ejemplo real de esta semana: Antigravity reportó *"linter: 0 advertencias"* y
había 4. Reportó *"git status vacío"* y había 50 archivos con 728 líneas
borradas. En ambos casos la consulta directa lo desmintió.

## Los números se calculan a mano ANTES de programar

Cada instrucción lleva los resultados esperados calculados a mano. Si el motor
devuelve otra cosa, se ve al instante.

```
   Pack Gold de S/. 1,200, siete niveles activos:
      24000 · 4800 · 3600 · 2400 · 1200 · 600 · 360   céntimos
      total 36960 = 30.8% exacto

   Y eso es lo que apareció en la base al correr el motor,
   en la cadena de prueba, socios 12 al 6.
```

## Todo el dinero en céntimos enteros

Nunca decimales. `S/. 7.20` se guarda como `720`. Los decimales en coma
flotante acumulan errores de medio céntimo que en miles de comisiones se
convierten en descuadres reales.

## Las reglas viven en la base, no en el código

Ni un porcentaje escrito dentro del programa. Los 30.8%, el 41.7% del Kit, los
97% del residual, los 70 puntos de activación: todo en tablas de configuración.

**Por qué te importa a ti:** el día que Máximo quiera cambiar un porcentaje, es
cambiar una fila. No es reprogramar ni volver a pagarle a nadie.

---

# PARTE 2 · LOS CUATRO BONOS

## 2.1 · BONO DE PATROCINIO — se paga una vez, al afiliar

**Cuándo:** cuando se confirma el pago de un pack de afiliación.
**Sobre qué:** el precio completo del pack, sin descontar nada.

| Nivel | % | De dónde sale |
|---|---|---|
| 1 | 20% | Deck, lámina 11 |
| 2 | 4% | Deck, lámina 11 |
| 3 | 3% | Deck, lámina 11 |
| 4 | 2% | Deck, lámina 11 |
| 5 | 1% | Deck, lámina 11 |
| 6 | 0.5% | Deck, lámina 11 |
| 7 | 0.3% | Deck, lámina 11 |
| **Total** | **30.8%** | |

### En soles, para que se entienda

| Nivel | Gold S/.1,200 | Familiar S/.4,000 | Empresarial S/.8,000 |
|---|---|---|---|
| 1 | S/. 240.00 | S/. 800.00 | S/. 1,600.00 |
| 2 | S/. 48.00 | S/. 160.00 | S/. 320.00 |
| 3 | S/. 36.00 | S/. 120.00 | S/. 240.00 |
| 4 | S/. 24.00 | S/. 80.00 | S/. 160.00 |
| 5 | S/. 12.00 | S/. 40.00 | S/. 80.00 |
| 6 | S/. 6.00 | S/. 20.00 | S/. 40.00 |
| 7 | S/. 3.60 | S/. 12.00 | S/. 24.00 |
| **Total** | **S/. 369.60** | **S/. 1,232.00** | **S/. 2,464.00** |

**Los montos del Gold y el Empresarial coinciden exactos con la lámina 11.**

### El Kit Emprendedor es la excepción

Paga **41.7% al nivel 1 y nada a los demás**.

```
   Kit de S/. 120  →  S/. 50.04 al patrocinador directo
                      S/. 0 a los niveles 2 al 7
```

**Fuente textual de Máximo, 26/08:**
> *"Por afiliar a un Kit Emprendedor yo gano el 41.7%, que sería 50 soles por
> cada kit de 120 soles."*

---

## 2.2 · BONO RESIDUAL — todos los meses, sobre las recompras

**Cuándo:** cada mes.
**Sobre qué:** los puntos de los productos que recompra la red.
**Cuánto vale el punto:** **S/. 1.00**

| Nivel | % | Café de 18 pts |
|---|---|---|
| 1 | 40% | S/. 7.20 |
| 2 | 20% | S/. 3.60 |
| 3 | 10% | S/. 1.80 |
| 4 | 5% | S/. 0.90 |
| 5 | 3% | S/. 0.54 |
| 6 | 2% | S/. 0.36 |
| 7 | 1% | S/. 0.18 |
| 8 | **10%** | S/. 1.80 |
| 9 | 5% | S/. 0.90 |
| 10 | 1% | S/. 0.18 |
| **Total** | **97%** | **S/. 17.46** |

**El S/. 7.20 del nivel 1 es el número que dio Máximo:**
> *"De los puntos del producto. Por decir del café de 18 x 40% sería 7.20 soles."*

### El nivel 8 sube al 10% — y está bien

Después del 1% del nivel 7, el 8 salta al 10%. **No es un error de tecleo.** Es
un incentivo: solo los packs Gold en adelante llegan a diez niveles, así que el
salto premia comprar el plan alto. Está programado tal cual.

### Los packs de afiliación NO generan residual

Solo las recompras. Los puntos de un pack sirven para activar a su dueño y para
su rango, pero no pagan residual hacia arriba.

**Fuente, respuesta 4.1 de Máximo:**
> *"Estos puntos es solo para el usuario, mas no comisiona al ascendente."*

### El plan es sostenible

| Producto | El socio paga | Se reparte | Le queda a la empresa |
|---|---|---|---|
| Café | S/. 75.00 | S/. 17.46 | **S/. 57.54 — 77%** |
| Aceite de Moringa | S/. 60.00 | S/. 13.58 | **S/. 46.42 — 77%** |
| Harina de Moringa | S/. 25.00 | S/. 5.82 | **S/. 19.18 — 77%** |

*De ese margen sale el costo del producto, el envío y la operación.*

---

## 2.3 · BONO DE RANGO — mensual, según lo que logró ese mes

**Los ocho rangos definidos:**

| # | Rango | Puntos grupales | Frontales activos | Bono |
|---|---|---|---|---|
| 1 | Jade | 500 | 1 | S/. 50 |
| 2 | Bronce | 1,000 | 2 | S/. 100 |
| 3 | Plata | 2,000 | 2 | S/. 200 |
| 4 | Oro | 4,000 | 3 | S/. 500 |
| 5 | Platino | 8,000 | 4 | S/. 1,500 |
| 6 | Esmeralda | 15,000 | 5 | S/. 3,000 |
| 7 | Zafiro | 30,000 | 6 | S/. 5,000 |
| 8 | Diamante | 60,000 | 7 | S/. 10,000 |

**Dos valores los decidimos nosotros y conviene que Máximo los confirme:**

| Dato | Decidido | Por qué |
|---|---|---|
| Jade: 1 frontal | El deck dice 1 | El PDF de rangos lo dejó en blanco |
| Platino: S/. 1,500 | El deck dice 1,500 | El PDF de rangos dice 1,000 |

*En ambos casos se resolvió a favor del deck, que es el material comercial que
ven los socios.*

### Los rangos 9 al 16 existen pero no califican a nadie

Están creados con sus nombres — Diamante Negro, Doble Diamante, Triple
Diamante, Club de Millonarios, Imperial, Titán, Embajador Royal, Embajador
Corona — **marcados como no definidos**, sin puntos ni bono.

**El día que Máximo mande los números se cargan desde el panel de
administración y empiezan a funcionar solos.** No hay que reprogramar nada.

Eso ya estaba decidido en el plan y por eso no bloquea nada.

### Si baja de rango, cobra CERO

**Fuente textual, 26/08:**
> *"Si el líder llega a un rango tiene que mantenerse o ascender para cobrar.
> Si baja de rango ya no cobra."*

```
   Un ORO que este mes solo llega a Bronce:
      ❌ NO cobra los S/. 100 de Bronce
      ✅ Cobra CERO
      ✅ Conserva "Oro" como título en su backoffice
```

**Esta es una de las reglas más duras del plan y conviene que la tengas clara
al explicársela a los socios.**

### No se suman los rangos

Un Diamante cobra **S/. 10,000**, no la suma de todos los rangos menores.

> *"Los rangos se comisionan de acuerdo a lo que llegó al fin de mes. Si un
> líder llegó en un mes a Diamante, solo se comisiona de ese rango."*

### Los puntos grupales NO incluyen los suyos

**Respuesta 8.2 de Máximo:** *"No, solo los de mi red."*

```
   Un líder que compra S/. 4,000 de producto él mismo
   NO sube de rango con eso.
```

### La línea estirada — el 50%

De la línea más fuerte solo cuenta hasta el **50% de los puntos que exige el
rango**. El resto tiene que venir de las otras líneas.

```
   Para Jade, que pide 500 puntos, el tope es 250:

      Línea A   800 pts  →  cuentan  250   ← recortada
      Línea B   180 pts  →  cuentan  180
      Línea C    90 pts  →  cuentan   90
                            ──────────────
                            520 pts  ✅ califica

   Pero si esos 800 estuvieran todos en UNA sola línea:
      cuentan 250  →  ❌ NO califica

   Tiene 800 puntos y no llega a un rango de 500.
```

**Para qué sirve:** impide que alguien llegue a un rango con una sola rama
fuerte. Obliga a construir red en ancho.

*Fuente: `Requisitos_Rangos_Backoffice_Max_Global.pdf`.*

---

## 2.4 · BONO GLOBAL — cada seis meses

| Regla | Valor |
|---|---|
| Qué se reparte | 1% de los puntos acumulados de la compañía |
| Cuánto vale el punto | S/. 1.00 |
| Cortes | Enero–Junio y Julio–Diciembre |
| Cómo se reparte | Proporcional al puntaje de cada uno |
| Requisito | **Activo los seis meses completos** |
| Quiénes | Gold, Familiar y Empresarial |

*Deck lámina 14 + respuesta #16 del 26/08.*

### Lo de los seis meses es exigente

**Un solo mes sin activarse deja al socio fuera del semestre entero.** No es
"estar activo el mes del reparto". Son los seis.

Conviene que esto quede claro con Máximo, porque es la clase de regla que
genera reclamos cuando un líder pierde el bono por un mes flojo.

---

# PARTE 3 · LAS REGLAS QUE LIMITAN LO QUE SE PAGA

Estas cuatro son las que hacen que el plan cierre. Sin ellas la empresa pagaría
mucho más de lo que cobra.

## 3.1 · Hay que activarse con 70 puntos cada mes

**Sin activación no se cobra NADA.** Ni residual, ni rango, ni patrocinio.

**Fuente textual, 25/08 4:25 pm:**
> *"Si un socio no llega a los 70 puntos pierde todos los beneficios."*
> *"El plan está diseñado para que el líder gane dinero y queda poco para la
> empresa, pero si alguien no se activa pierde todo."*

**Lo que sí conserva:** su puntaje, su rango como título honorífico, y puede
recalificar el mes siguiente.

### El pack de afiliación cubre el primer mes

El mes en que alguien se afilia queda activo por su pack, sin necesidad de
recomprar. Aplica a los cinco packs, incluido el Kit.

*Regla #5 del análisis de respuestas + respuesta 4.1.*

## 3.2 · Cada pack habilita hasta cierto nivel

| Pack | Niveles de patrocinio | Niveles de residual |
|---|---|---|
| Kit Emprendedor | 0 | 0 |
| Ejecutivo | 3 | 5 |
| Gold | 7 | 10 |
| Familiar | 7 | 10 |
| Empresarial | 7 | 10 |

**Son dos límites distintos, no uno.** Un Ejecutivo cobra 3 niveles de
patrocinio pero 5 de residual.

*Deck lámina 12.*

## 3.3 · Sin compresión — lo que no se paga se queda

Si un socio del upline no califica —porque su pack no llega a ese nivel o
porque no está activo— **ese dinero no se paga y no sube al siguiente**. Se
queda en la empresa.

```
   Un Gold de S/. 1,200 con un Ejecutivo en el nivel 4
   y un inactivo en el nivel 5:

      se paga        S/. 333.60
      se queda       S/.  36.00
      total teórico  S/. 369.60
```

**Esta regla es la que más plata retiene.** En la simulación de tres meses
retuvo casi la mitad de todo el plan.

## 3.4 · Los puntos se resetean cada mes

Todo vuelve a cero al cerrar el mes. **El rango no es acumulativo de por vida:
hay que recalificar mes a mes.**

> *"Los puntos de cada mes tenemos que resetear a cero. Una vez sacado el
> cálculo se le paga y se vuelve cero."*

---

# PARTE 4 · QUÉ PASÓ AL CORRERLO DE VERDAD

El motor de patrocinio y residual ya está programado y se corrió contra una red
simulada de **500 socios y tres meses**.

| | Junio | Julio | Agosto | Total |
|---|---|---|---|---|
| Patrocinio pagado | S/. 50,625.60 | S/. 13,195.88 | S/. 6,795.40 | **S/. 70,616.88** |
| Residual pagado | S/. 7,661.76 | S/. 6,008.06 | S/. 6,084.28 | **S/. 19,754.10** |
| **Total repartido** | S/. 58,287.36 | S/. 19,203.94 | S/. 12,879.68 | **S/. 90,370.98** |
| **Queda en la empresa** | S/. 38,437.02 | S/. 32,514.94 | S/. 27,635.64 | **S/. 98,587.60** |

**De cada S/. 100 que el plan podría haber repartido, se repartieron S/. 48 y
quedaron S/. 52 en la empresa.**

Eso pasa por dos motivos: mucha gente no se activa, y muchos tienen packs que
no llegan a los niveles altos. **Es el plan funcionando como está diseñado, no
un error.**

> **Ojo con este número:** es una red simulada, no clientes reales. Sirve para
> ver la mecánica, no para proyectar ingresos. En una red real la proporción
> cambia según cuánta gente se active de verdad.

### Lo que se comprobó, consulta por consulta

Todas contra la base, todas devolvieron cero problemas:

```
   ninguna comisión negativa o en cero
   nadie cobró estando inactivo
   nadie cobró un nivel que su pack no habilita
   nadie se pagó a sí mismo
   el que cobró es ancestro real, en el nivel exacto
   ninguna afiliación generó residual
   ningún pack pagó más del 30.8%
   ninguna recompra repartió más del 97%
   los 76 Kits pagaron exactamente S/. 50.04, ni uno más
   cada monto es exactamente base × porcentaje
```

---

# PARTE 5 · LO QUE NO ENTRA AL SISTEMA

| Qué | Por qué |
|---|---|
| **Bono Cumpleaños** | Definido en el deck — 70% en 4 productos tras los 70 pts — pero decidido como algo que Máximo maneja aparte. **El administrador ya puede aplicar ese descuento a mano desde el primer día.** |
| **Bono Viajes** | Excluido por escrito desde la cotización. Nunca estuvo dentro. |
| **Pack VIP** | No existe. Aparece en el deck comercial pero se ignora. |
| Tienda replicada por socio | Rechazado el 26/08 |
| Pago en línea | Todo va por transferencia con voucher |
| Facturación electrónica SUNAT | Fuera desde la cotización |
| App móvil nativa | Fuera desde la cotización |

**Los dos bonos se pueden agregar después sin rehacer nada.** La tabla de
comisiones admite tipos nuevos sin migración, y el campo de fecha de nacimiento
ya está guardado esperando.

---

# PARTE 6 · LO ÚNICO QUE FALTA DE MÁXIMO

```
   Los valores de los rangos 9 al 16
   — puntos grupales, frontales activos y bono de cada uno
```

**Y no bloquea nada.** El sistema funciona completo con los ocho rangos
definidos. Los otros ocho se cargan desde el panel el día que existan.

### Un detalle que conviene aclarar cuando los mande

```
   El PDF de rangos va:      Diamante (60,000) → Doble Diamante (100,000)
   El deck lámina 15 va:     Diamante → Diamante Negro → Doble Diamante
```

El PDF no contempla el Diamante Negro. Cuando lleguen los números hay que saber
si esos 100,000 pts / 8 frontales / S/. 20,000 son del Diamante Negro o del
Doble Diamante. **Si se asume mal, los ocho rangos altos quedan corridos una
posición.**

---

# PARTE 7 · LO QUE TE TOCA DECIDIR A TI

| Tema | Situación |
|---|---|
| Día de pago | En la configuración hay dos reglas conviviendo: pagar a los 3 días del cierre, y pagar el día 5. Sobra una. |
| Confirmar Jade y Platino | Se decidieron por criterio a favor del deck. Vale la pena que Máximo lo ratifique cuando haya ocasión, sin hacer de esto una consulta formal. |

---

# EN UNA PÁGINA — para contrastar con Máximo

```
   PATROCINIO   30.8% del pack, 7 niveles, una sola vez
                Kit Emprendedor: 41.7% al primero y nada más

   RESIDUAL     97% de los puntos de recompra, hasta 10 niveles
                1 punto = S/. 1.00 · el nivel 8 sube al 10%
                los packs NO generan residual

   RANGO        mensual, no se suma, 8 rangos definidos
                si baja de rango cobra CERO
                puntos grupales sin los personales
                línea estirada: máximo 50% de una sola línea

   GLOBAL       1% semestral, proporcional
                Gold en adelante, activo los 6 meses

   PARA COBRAR CUALQUIERA DE LOS CUATRO
                70 puntos personales en el mes
                el pack cubre el mes de afiliación

   LO QUE NO SE PAGA SE QUEDA EN LA EMPRESA
                no sube al siguiente, no se reparte
```
