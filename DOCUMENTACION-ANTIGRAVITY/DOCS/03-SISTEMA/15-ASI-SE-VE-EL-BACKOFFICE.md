# ASÍ SE VE EL BACKOFFICE DEL SOCIO

**Qué ve María cuando entra a su panel, pantalla por pantalla, con números
reales.**

**Fecha:** 27 de agosto de 2026
**Complementa a:** `09-RF-BACKOFFICE-SOCIO` (los 60 requisitos)

---

> ## PARA QUÉ SIRVE ESTE DOCUMENTO
>
> Los requisitos dicen **qué debe hacer** cada pantalla. Este documento muestra
> **cómo se ve** y con qué números.
>
> Sirve para que Jack entienda qué se está construyendo, para explicárselo a
> Máximo, y para que la IA que lo programe sepa qué está armando.
>
> **Es la Fase 2.** La landing va primero.

---

# LA SOCIA DEL EJEMPLO

```
   María Torres
   Código:        MG-00417
   Pack:          Gold  (S/. 1,200)
   Afiliada:      15 de marzo
   Patrocinador:  Ana Quispe (MG-00088)
   Rango vigente: Bronce
   Rango honorífico: Oro  (lo alcanzó en junio)
```

---

# P-11 · PANEL PRINCIPAL

**La pregunta que responde:** *¿cuánto llevo, cuánto me falta y cuánto voy a
cobrar?*

```
┌──────────────────────────────────────────────────────────────┐
│  Hola, María                        Cierre en 6 días  ⏳     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │  ✅  ESTÁS ACTIVA ESTE MES                          │    │
│   │                                                      │    │
│   │      72 / 70 puntos personales                       │    │
│   │      ████████████████████████░  cumplido             │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│   │ MIS PUNTOS   │ │ MI GRUPO     │ │ FRONTALES    │        │
│   │              │ │              │ │ ACTIVOS      │        │
│   │     72       │ │   1,240      │ │              │        │
│   │  personales  │ │  grupales    │ │    3 / 2     │        │
│   └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│   ┌──────────────┐ ┌──────────────────────────────────┐     │
│   │ MI BILLETERA │ │  MI RANGO                        │     │
│   │              │ │                                  │     │
│   │  S/. 342.80  │ │  Vigente: BRONCE   S/. 100       │     │
│   │  disponible  │ │  Título:  ORO 🏅  (honorífico)   │     │
│   └──────────────┘ └──────────────────────────────────┘     │
│                                                              │
│   Comisión estimada de este ciclo:  S/. 128.40               │
│   ⚠️ Es una estimación. El monto final se define al cierre.  │
└──────────────────────────────────────────────────────────────┘
```

## Si NO estuviera activa, lo primero que vería

```
   ┌────────────────────────────────────────────────────┐
   │  ⚠️  TE FALTAN 18 PUNTOS PARA ACTIVARTE            │
   │                                                     │
   │      52 / 70 puntos                                 │
   │      ██████████████░░░░░░░░                         │
   │                                                     │
   │      Quedan 6 días para el cierre.                  │
   │      Si no te activas, este mes no cobras.          │
   │                                                     │
   │      [ Ir a la tienda ]                             │
   └────────────────────────────────────────────────────┘
```

**Ese aviso es el elemento más importante de todo el backoffice.** Es lo que hace
que el socio compre y lo que evita el reclamo de *"¿por qué no me pagaron?"*.

---

# P-12 · MI RED

**La pregunta:** *¿quiénes están debajo de mí y quiénes me están generando?*

```
┌──────────────────────────────────────────────────────────────┐
│  MI RED                              Total: 47 socios        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  María Torres  ·  Gold  ·  72 pts                    [tú]   │
│  │                                                           │
│  ├─ 🟢 Carlos Ríos      Gold        180 pts   nivel 1       │
│  │   └─ 🟢 Lucía Pérez  Ejecutivo    70 pts   nivel 2       │
│  │       └─ 🔴 Jorge M. Kit           0 pts   nivel 3       │
│  │                                                           │
│  ├─ 🟢 Rosa Díaz        Ejecutivo    94 pts   nivel 1       │
│  │                                                           │
│  ├─ 🟢 Pedro Salas      Gold        150 pts   nivel 1       │
│  │                                                           │
│  └─ 🔴 Elena Vargas     Ejecutivo    12 pts   nivel 1       │
│                                                              │
│  🟢 activo este mes    🔴 sin activar                        │
└──────────────────────────────────────────────────────────────┘
```

## 🔴 Lo que NO puede ver

```
   ❌ El teléfono, correo o dirección de nadie de su red
   ❌ Cuánto dinero gana cada uno
   ❌ Nada de su línea ascendente
   ❌ Nada fuera de su propia descendencia
```

**Solo ve hacia abajo, y solo nombre, pack, puntos y estado de activación.**

Es protección de datos personales (D.S. 016-2024-JUS) y también evita que un
socio le robe la red a otro.

---

# P-13 · TIENDA DE RECOMPRA

**Acá sí ve su precio real**, porque el sistema sabe quién es.

```
┌──────────────────────────────────────────────────────────────┐
│  TIENDA          Tu descuento: 50%  (Pack Gold)              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │ [ foto ]       │  │ [ foto ]       │                     │
│  │ Café Moringa   │  │ Colágeno       │                     │
│  │                │  │                │                     │
│  │ S̶/̶.̶ ̶1̶5̶0̶        │  │ S̶/̶.̶ ̶1̶5̶0̶        │                     │
│  │ S/. 75  🟢18pts│  │ S/. 75  🟢18pts│                     │
│  │                │  │                │                     │
│  │ [ − ] 2 [ + ]  │  │ [ − ] 1 [ + ]  │                     │
│  └────────────────┘  └────────────────┘                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  TU PEDIDO                                                   │
│                                                              │
│  2× Café con Moringa ................. S/. 150   36 pts     │
│  1× Colágeno Hidrolizado ............. S/.  75   18 pts     │
│  2× Cápsulas de Moringa .............. S/.  60   16 pts     │
│                                        ────────  ───────     │
│                                        S/. 285   70 pts     │
│                                                              │
│  ✅ Con este pedido quedas ACTIVA este mes                   │
│                                                              │
│  [ Pedir por WhatsApp ]                                      │
└──────────────────────────────────────────────────────────────┘
```

## La diferencia con la web pública

| | Web pública | Tienda del backoffice |
|---|---|---|
| Precio que muestra | Público (S/. 150) | **El suyo** (S/. 75) |
| Sabe quién eres | No | Sí |
| Quién aplica el descuento | El administrador | **El sistema** |

**El contador de "te falta para activarte" en vivo es lo que más vende.** El
socio ve que con dos productos más llega a sus 70 puntos.

---

# P-14 · MIS COMISIONES

**La pregunta que más reclamos genera:** *¿por qué cobré esto?*

```
┌──────────────────────────────────────────────────────────────┐
│  MIS COMISIONES                    Ciclo: Agosto 2026        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Bono de Patrocinio ......................... S/.  48.00     │
│  Bono Residual .............................. S/.  80.40     │
│  Bono de Rango .............................. S/. 100.00     │
│                                             ───────────      │
│  Total del ciclo                              S/. 228.40     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  DETALLE DEL RESIDUAL                                        │
│                                                              │
│  Nivel  De quién          Puntos    %      Ganaste           │
│  ─────────────────────────────────────────────────────       │
│    1    Carlos Ríos          180   40%     S/. 72.00         │
│    1    Rosa Díaz             94   40%     S/. 37.60         │
│    2    Lucía Pérez           70   20%     S/. 14.00         │
│    3    Jorge Mendoza          0   10%     S/.  0.00         │
│                                                              │
│  ⚠️ Elena Vargas no se activó este mes.                      │
│     Sus puntos no generaron comisión para nadie.             │
└──────────────────────────────────────────────────────────────┘
```

## 🔴 La pantalla tiene que explicar por qué NO cobró

**Este es el requisito que más reclamos evita de todo el sistema.**

Cuando un socio no cobra de un nivel, el backoffice le dice cuál de las tres
razones fue:

```
   1.  "Tu socio del nivel 2 no se activó este mes"
   2.  "Tu Pack Ejecutivo llega hasta el nivel 5"
   3.  "No tienes a nadie en esa posición todavía"
```

**Sin esto, cada cierre de mes genera decenas de mensajes preguntando lo mismo.**

---

# P-15 · MI RANGO

**La pantalla más difícil de explicar y la que más hay que dibujar.**

```
┌──────────────────────────────────────────────────────────────┐
│  MI RANGO                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Este mes:  BRONCE           Título:  ORO 🏅                 │
│             S/. 100                   (honorífico)           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  PARA LLEGAR A PLATA NECESITAS                     │     │
│  │                                                     │     │
│  │  2,000 puntos grupales    ·    2 frontales activos │     │
│  │                                                     │     │
│  │  Tope por línea: 1,000 puntos (el 50%)             │     │
│  │                                                     │     │
│  │  Carlos    1,400 pts  ████████████░░  cuentan 1,000│     │
│  │                                        ⚠️ TOPE      │     │
│  │  Rosa        520 pts  █████░░░░░░░░░  cuentan   520│     │
│  │  Pedro       380 pts  ███░░░░░░░░░░░  cuentan   380│     │
│  │  Elena         0 pts  ░░░░░░░░░░░░░░  cuentan     0│     │
│  │                                        ────────────│     │
│  │                          COMPUTABLE:        1,900  │     │
│  │                                                     │     │
│  │  Te faltan 100 puntos, y NO pueden venir de        │     │
│  │  Carlos: su línea ya llegó al tope.                │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## Por qué esas barras son obligatorias

**La regla de línea estirada es la que más cuesta explicar.** Un socio que ve
solo *"no calificaste"* reclama. Uno que ve la barra de Carlos topada entiende en
tres segundos qué le falta hacer: desarrollar sus otras líneas.

## Y tiene que avisar del riesgo de bajar

```
   ⚠️ El mes pasado fuiste ORO. Si cierras en Bronce,
      este mes no cobras bono de rango.
```

**Porque si baja de rango no cobra nada** — ni siquiera el bono del rango menor.
Es la regla más dura del plan y el socio tiene que verla venir.

---

# P-16 · MI ENLACE

```
┌──────────────────────────────────────────────────────────────┐
│  MI ENLACE DE PATROCINIO                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  maxglobaloficial.com/?ref=MG-00417        [ Copiar ]        │
│                                                              │
│  [ Compartir por WhatsApp ]                                  │
│                                                              │
│  Todo el que se afilie por este enlace queda en tu red.      │
│                                                              │
│  Este mes:  12 visitas  ·  2 registros  ·  1 afiliado        │
└──────────────────────────────────────────────────────────────┘
```

**No hay tienda replicada.** Solo el enlace — se decidió el 26/08 y el motivo
está en `02-PROYECTO/03-LINEA-DE-ALCANCE-V1`.

---

# P-17 · MIS PEDIDOS

```
┌──────────────────────────────────────────────────────────────┐
│  MIS PEDIDOS                                                 │
├──────────────────────────────────────────────────────────────┤
│  #1042  22 ago   S/. 285.00   70 pts   ✅ Entregado          │
│                                        Guía: OLV-88213       │
│                                                              │
│  #1018  02 ago   S/. 150.00   36 pts   🚚 En camino          │
│                                                              │
│  #0994  28 jul   S/.  75.00   18 pts   ❌ Pago rechazado     │
│                                        Voucher ilegible      │
└──────────────────────────────────────────────────────────────┘
```

**El estado del envío es informativo.** No cambia puntos ni comisiones — esos se
acreditan al **confirmar el pago**, no al entregar.

---

# P-19 · MI BILLETERA

```
┌──────────────────────────────────────────────────────────────┐
│  MI BILLETERA                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│      Disponible:  S/. 342.80                                 │
│                                                              │
│      [ Solicitar retiro ]     mínimo S/. 100                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  MOVIMIENTOS                                                 │
│                                                              │
│  31 jul  Comisiones de julio ............. + S/. 228.40      │
│  05 jul  Retiro aprobado ................. − S/. 500.00      │
│  30 jun  Comisiones de junio ............. + S/. 614.40      │
└──────────────────────────────────────────────────────────────┘
```

## El retiro

```
   El socio solicita   →   Máximo aprueba   →   Máximo paga fuera
                                                del sistema y marca
```

**Si el monto supera S/. 700, el sistema muestra la detracción** y el neto a
recibir. *(Confirmado por Máximo, respuesta 12.4.)*

```
   Monto solicitado ............ S/. 800.00
   Detracción .................. − S/. ___
   Neto a recibir .............. S/. ___
```

**El sistema calcula y muestra. No emite la factura** — eso es SUNAT y sigue
fuera de alcance.

---

# LO QUE EL SOCIO NUNCA VE

*Vale la pena tenerlo claro para no construir de más.*

```
   ❌ Datos de contacto de su red            protección de datos
   ❌ Cuánto gana cada persona de su red     igual
   ❌ Su línea ascendente                    solo ve hacia abajo
   ❌ Comisiones de otros socios
   ❌ Cualquier cosa del panel de administración
   ❌ El cálculo de otros ciclos que no sean los suyos
```

---

# LAS 10 PANTALLAS, EN ORDEN DE CONSTRUCCIÓN

| Orden | Pantalla | Por qué ese orden |
|---|---|---|
| 1 | **P-10 Inicio de sesión** | Sin esto no hay nada |
| 2 | **P-11 Panel principal** | Es la que más se abre |
| 3 | **P-13 Tienda** | Es la que genera dinero |
| 4 | **P-14 Comisiones** | La que más reclamos evita |
| 5 | **P-12 Mi red** | Requiere la tabla de ancestros |
| 6 | **P-15 Mi rango** | La más difícil de dibujar |
| 7 | P-17 Mis pedidos | |
| 8 | P-19 Mi billetera | |
| 9 | P-16 Mi enlace | Sencilla |
| 10 | P-18 Mi perfil | Sencilla |

> **El motor de comisiones va antes que todas.** Estas pantallas solo muestran lo
> que el motor calculó. Una interfaz fea se corrige; una comisión mal pagada no
> se recupera.

---

# LO QUE ESTE DOCUMENTO NO RESUELVE

| # | Falta | Cuándo |
|---|---|---|
| 1 | El diseño visual real de cada pantalla | Con Claude Design, como la landing |
| 2 | Cómo se ve en móvil | La mayoría lo va a abrir del celular |
| 3 | Qué pasa el primer día de un socio nuevo, sin datos | Estados vacíos |
| 4 | El porcentaje exacto de la detracción | Confirmar con el contador de Máximo |

---

**Documentado el 27 de agosto de 2026.**
