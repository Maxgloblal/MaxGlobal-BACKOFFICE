# ÚLTIMO PEDIDO DE DATOS A MAX GLOBAL

**Fecha:** 25 de agosto de 2026, 22:06
**Estado:** 📌 **NO MANDAR TODAVÍA**

> ## ⚠️ REVISADO Y REDUCIDO
>
> La primera versión de este documento tenía 12 preguntas. **Estaba de más.**
>
> Cinco se decidieron por criterio técnico y están en
> `07-SPEC-KIT/PROYECTO-1-LANDING/config-pendiente.md`.
>
> Las otras siete son **datos administrativos**, no decisiones. Se piden **una
> sola vez, al final**, cuando la landing ya esté construida y haya algo que
> mostrarle.
>
> **Nada de esto bloquea el desarrollo.** Todo va como marcador de configuración.

---

## POR QUÉ HAY UN SEGUNDO PEDIDO

El formulario que le mandaste cubre **las 40 preguntas del plan de
compensación** — que eran las difíciles, las que exigían que él pensara y
decidiera.

Después de enviarlo aparecieron **12 cosas más**, casi todas de una naturaleza
distinta:

| Tipo | Cantidad | ¿Requiere que decida? |
|---|---|---|
| **Datos que ya tiene** | 8 | ❌ Solo copiar y pegar |
| **Decisiones operativas** | 4 | ✅ Pero son fáciles |

> **No es otro formulario.** Es un solo mensaje de WhatsApp con datos que él
> tiene a la mano.

---

## MENSAJE PARA MANDARLE — copiar tal cual

```
Máximo, buenas. Ya tengo casi todo listo del sistema.

Me faltan unos datos de la empresa para los textos legales y
para configurar el sitio. Son cosas que seguro ya tienes a
la mano:

DATOS DE LA EMPRESA
1. Razón social exacta
2. RUC
3. Domicilio fiscal completo
4. Correo oficial de contacto
5. Teléfono / WhatsApp oficial de Max Global
6. Cuentas bancarias donde depositan los socios
   (banco, número de cuenta, CCI y titular)

TEXTOS PARA LA WEB
7. Misión, visión y valores
   (si ya los tienen escritos me los pasas tal cual)

ENVÍOS
8. ¿Con qué agencia trabajan? (Olva, Shalom, otra)
9. ¿El envío lo paga el socio o lo asume la empresa?

VENTAS
10. ¿Puede comprar alguien que NO sea socio, o para comprar
    hay que afiliarse sí o sí?
11. Si un socio vende S/300 a clientes pero él no compra nada,
    ¿está activo ese mes?

TEMAS LEGALES
12. ¿Tienen abogado que pueda revisar los términos de
    afiliación? Es la única parte que sí necesita uno.
```

---

## DETALLE DE CADA PUNTO

### Datos de la empresa (1 a 6) — solo copiar

| # | Dato | Para qué se necesita |
|---|---|---|
| 1-3 | Razón social, RUC, domicilio | Pie de página obligatorio por el Código del Consumidor |
| 4-5 | Correo y teléfono | Contacto oficial + botones de WhatsApp de todo el sitio |
| 6 | Cuentas bancarias | Pantalla de confirmación de pago |

**Sin el punto 6 no se puede terminar la pantalla de pago.**

### Textos (7)

Si ya tienen misión y visión escritas, se usan tal cual. Si no, se puede armar
un borrador y que él lo apruebe.

### Envíos (8 y 9)

| # | Por qué importa |
|---|---|
| 8 | Es un campo de texto en el sistema. No bloquea nada, pero conviene tenerlo |
| 9 | Define si el costo se suma al pedido o no aparece |

### Ventas (10 y 11) — 🔴 las dos únicas que sí son decisiones

**Pregunta 10 — ¿pueden comprar clientes que no sean socios?**

Si la respuesta es sí, hay un dato comercial que vale la pena que él conozca:

| Quién compra café | Paga | Comisión a la red | Queda a la empresa |
|---|---|---|---|
| Socio Gold | S/. 75.00 | S/. 17.46 | S/. 57.54 |
| **Cliente final** | **S/. 150.00** | S/. 17.46 | **S/. 132.54** |

**Un cliente final deja casi el triple de margen.**

**Pregunta 11 — ¿la venta a clientes activa al socio?**

Es la que define el carácter del plan:

- **Si cuenta** → el plan premia al que vende
- **Si no cuenta** → obliga a comprar aunque ya hayas vendido, y eso llena la
  casa de producto sin rotación

> Es la pregunta más importante de este segundo pedido.

### Legal (12)

Los términos de afiliación definen la relación con cientos de personas y
contienen la cláusula que evita el riesgo laboral. **Es lo único del proyecto
donde ahorrar sale caro.**

Todo lo demás — política de privacidad, consentimientos, libro de reclamaciones
— ya está redactado en borrador.

---

## LO QUE NO SE LE PREGUNTA — lo decides tú

| # | Tema | Por qué es tuyo |
|---|---|---|
| 1 | Cómo plantear el alcance no cotizado | Es conversación comercial, no consulta técnica |
| 2 | Si el Bono Cumpleaños, Viajes y rangos 9–16 van en v1 o v2 | Tú defines el plazo |
| 3 | Quién paga hosting, dominio y correos | Está fuera de la cotización |

> **El punto 1 no va en este mensaje.** Es una conversación aparte, y conviene
> tenerla antes de empezar a construir, no después.

---

## DESPUÉS DE ESTE MENSAJE

**No queda nada más que preguntarle** sobre el sistema.

Lo que siga apareciendo se resuelve así:

```
¿Equivocarse cuesta dinero pagado a un socio?
        │
   SÍ ──┴── NO
    │        │
    ▼        ▼
 preguntar  decides tú
            valor conservador
            configurable
            documentado
```

---

## SEGUIMIENTO

| Bloque | Enviado | Respondido |
|---|---|---|
| Formulario de 40 preguntas | ✅ 25/08 | ⏳ |
| Este pedido de 12 datos | 📌 pendiente | — |

Cuando lleguen las respuestas:

1. Anótalas en `02-RESPUESTAS-CONFIRMADAS` con fecha y cita textual
2. Márcalas resueltas en `05-CONTROL/PENDIENTES`
3. Agrega la entrada en `05-CONTROL/BITACORA`
4. Actualiza el documento de negocio que corresponda
