# MARCO LEGAL PERUANO APLICABLE

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Investigado y verificado contra fuentes vigentes**

---

> ## ⚖️ ADVERTENCIA IMPORTANTE
>
> **Este documento no es asesoría legal.** Es una investigación de las normas
> aplicables para que el sistema se construya cumpliéndolas, y para que Max
> Global sepa qué necesita revisar con un abogado.
>
> **Los textos legales del sitio deben ser revisados por un abogado peruano
> antes de publicarse.** Especialmente los términos de afiliación, porque
> definen una relación comercial con cientos de personas.

---

## RESUMEN — LAS TRES NORMAS QUE OBLIGAN

| Norma | Qué exige | Multa máxima |
|---|---|---|
| **Ley 29733 + DS 016-2024-JUS** | Protección de datos personales | Hasta 100 UIT (~S/. 515,000) |
| **Ley 32495** | Libro de Reclamaciones virtual | 1 a 10 UIT |
| **Ley 29571** | Código del Consumidor | Variable |

Y un cuarto punto que no es una norma sino un **riesgo estructural**: la
diferencia entre multinivel legítimo y esquema piramidal.

---

## 1 · PROTECCIÓN DE DATOS PERSONALES

**Ley N° 29733** · Reglamento aprobado por **D.S. N° 016-2024-JUS**
**Vigente desde el 31 de marzo de 2025** — reemplaza al reglamento de 2013.
**Autoridad:** ANPDP (Autoridad Nacional de Protección de Datos Personales)

### Por qué aplica de lleno a este proyecto

El sistema va a guardar de cada socio: nombre, documento de identidad, correo,
teléfono, dirección de domicilio y **datos bancarios**. Además construye
**perfiles de red y de ingresos**.

Eso es tratamiento de datos personales a escala, y con datos sensibles de por
medio.

### Obligaciones que impactan el desarrollo

| # | Obligación | Cómo se cumple en el sistema |
|---|---|---|
| D-1 | **Consentimiento libre, previo, expreso e informado** | Casilla sin premarcar en el registro, con enlace a la política |
| D-2 | **Finalidad determinada** | Decir para qué se usa cada dato, no genéricamente |
| D-3 | **Derechos ARCO** (acceso, rectificación, cancelación, oposición) | Canal visible para ejercerlos |
| D-4 | **Portabilidad de datos** | El socio puede exportar sus datos |
| D-5 | **Notificar incidentes en 48 horas** a la ANPDP | Procedimiento documentado y registro de accesos |
| D-6 | **Oficial de Datos Personales** | Designarlo. Es de Max Global, no del desarrollo |
| D-7 | **Registro del banco de datos** ante la ANPDP | Trámite de Max Global |
| D-8 | Medidas de seguridad | Hash de contraseñas, RLS, cifrado, auditoría |

### 🔴 Lo que más riesgo tiene acá

**Los datos bancarios de los socios.** Se guardan para pagar comisiones, y son
el dato más sensible del sistema.

**Regla dura:** solo su dueño y el administrador pueden verlos. Nunca aparecen
en el árbol genealógico, en reportes compartidos ni en exportaciones que vea
otro socio.

---

## 2 · LIBRO DE RECLAMACIONES VIRTUAL — 🔴 OBLIGATORIO

**Ley N° 32495**, publicada el **11 de noviembre de 2025**, modificó el Código
del Consumidor para exigir expresamente a las plataformas de comercio
electrónico un **Libro de Reclamaciones Virtual**.

### Requisitos concretos

| # | Requisito | Detalle |
|---|---|---|
| L-1 | **Enlace visible y permanente** | En el sitio web o la aplicación |
| L-2 | **A menos de 2 clics** desde la página principal | Requisito literal de la norma |
| L-3 | **Aviso en la página de compra** | En el checkout o su equivalente |
| L-4 | **Activo 24/7** | Sin horarios |
| L-5 | **Confirmación automática de recepción** | Al consumidor, inmediata |
| L-6 | **15 días hábiles improrrogables** para responder | Por escrito |

**Sanción por incumplir:** de 1 a 10 UIT.

### Alcance

La norma se interpreta aplicable no solo a webs y marketplaces, **sino también a
ventas por redes sociales** cuando funcionan como canal de venta.

> **Para Max Global esto significa:** el libro de reclamaciones va tanto en la
> landing como en el backoffice, porque en ambos hay transacción.

---

## 3 · CÓDIGO DE PROTECCIÓN Y DEFENSA DEL CONSUMIDOR

**Ley N° 29571** · **Autoridad:** INDECOPI

### Lo que impacta directamente

| # | Obligación |
|---|---|
| C-1 | **Información veraz y suficiente** sobre productos, precios y condiciones |
| C-2 | **Prohibición de publicidad engañosa** |
| C-3 | Precio final visible, sin cargos ocultos |
| C-4 | Condiciones de entrega claras |
| C-5 | Identificación plena del proveedor: razón social, RUC, domicilio |

### 🔴 Dónde este proyecto puede meterse en problemas

**Publicidad engañosa por promesas de ingreso.**

Decir *"gana S/. 3,000 al mes"*, mostrar testimonios de ingresos o publicar
cifras de socios sin respaldo es exactamente lo que INDECOPI sanciona.

**Por eso la constitución de la landing prohíbe explícitamente:**
- Prometer ganancias
- Mostrar ejemplos de ingresos
- Publicar cifras sin respaldo
- Testimonios inventados

> Se explica **cómo funciona** el plan. Nunca **cuánto se gana**.

---

## 4 · 🔴 MULTINIVEL vs. ESQUEMA PIRAMIDAL

### La situación regulatoria en Perú

**No existe una ley específica que regule el marketing multinivel.** Opera en
una zona gris. INDECOPI interviene por publicidad engañosa y competencia
desleal, no por la estructura del negocio en sí.

### El criterio que separa lo legal de lo ilegal

> **Los ingresos de la empresa y el pago de comisiones deben provenir de la
> venta real de productos a consumidores finales — no de las cuotas de
> afiliación ni del mero reclutamiento.**

Ese es el criterio, y es el que hay que poder demostrar.

### Cómo se ve esto en Max Global

| Bono | Origen del dinero | ¿Riesgo? |
|---|---|---|
| **Residual** | Recompras de producto | 🟢 Ninguno. Es venta real |
| **Rango** | Volumen grupal de producto | 🟢 Ninguno |
| **Global** | Puntos acumulados de producto | 🟢 Ninguno |
| **Patrocinio** | 30.8% del pack de afiliación | 🟡 **Acá está la atención** |

**El Bono de Patrocinio se paga cuando alguien se afilia.** Eso, aislado, se
parece a pagar por reclutar.

**Lo que lo salva:** los packs **contienen productos reales** que se entregan.
No es una cuota de membresía, es una compra de mercadería.

### Lo que conviene que el sistema pueda demostrar

Esto no es una preocupación teórica: es exactamente lo que se pediría en una
fiscalización.

| # | Qué debe poder mostrar el sistema |
|---|---|
| P-1 | Qué proporción del volumen viene de recompras vs. de packs de afiliación |
| P-2 | Que cada pack entregó productos físicos, con su guía de envío |
| P-3 | Que existen socios que ganan por vender sin haber reclutado a nadie |
| P-4 | Que las comisiones se calculan sobre producto, no sobre cabezas |

> **El reporte P-1 ya está contemplado** en los requisitos del panel admin.
> Vale la pena que Max Global lo revise periódicamente: si el volumen de packs
> supera con mucho al de recompras, el modelo empieza a parecerse a lo que la
> norma castiga — independientemente de la intención.

---

## 5 · RELACIÓN CON LOS SOCIOS

Los distribuidores **no son empleados**. Son independientes.

Eso debe quedar explícito en los términos de afiliación, porque de lo contrario
se abre riesgo laboral.

| # | Debe decir claramente |
|---|---|
| R-1 | No existe relación laboral, de dependencia ni de subordinación |
| R-2 | El socio no tiene horario, jefe ni exclusividad |
| R-3 | El socio asume sus propias obligaciones tributarias |
| R-4 | Las comisiones no son remuneración |
| R-5 | El socio puede retirarse cuando quiera |

⏳ *Un abogado debe redactar esta cláusula. Acá solo se indica que debe existir.*

---

## 6 · FACTURACIÓN Y TRIBUTOS

**Fuera del alcance del sistema**, pero conviene que Max Global lo tenga
resuelto:

| Tema | Situación |
|---|---|
| Comprobantes de pago electrónicos | Obligación de SUNAT, no cotizada en este proyecto |
| Retenciones sobre comisiones | Depende del régimen de cada socio |
| Emisión de recibos por honorarios | Responsabilidad del socio |

> El sistema **exporta la liquidación** para el pago. **No emite comprobantes ni
> calcula retenciones.** Está declarado fuera de alcance.

---

## 7 · TABLA DE CUMPLIMIENTO

| # | Requisito legal | Responsable | Estado |
|---|---|---|---|
| 1 | Política de privacidad publicada | Desarrollo | 📌 por implementar |
| 2 | Consentimiento expreso en el registro | Desarrollo | 📌 por implementar |
| 3 | Canal para derechos ARCO | Desarrollo | 📌 por implementar |
| 4 | Exportación de datos del socio | Desarrollo | 📌 por implementar |
| 5 | **Libro de Reclamaciones virtual** | Desarrollo | 📌 por implementar |
| 6 | Términos y condiciones | Abogado + desarrollo | 📌 por redactar |
| 7 | Términos de afiliación | **Abogado** | ⏳ pendiente |
| 8 | Identificación del proveedor en el pie | Desarrollo | 📌 por implementar |
| 9 | Registro del banco de datos ante ANPDP | **Max Global** | ⏳ pendiente |
| 10 | Designar Oficial de Datos Personales | **Max Global** | ⏳ pendiente |
| 11 | Procedimiento de incidentes en 48h | Max Global + desarrollo | 📌 por definir |
| 12 | Reporte de proporción packs vs. recompras | Desarrollo | ✅ ya en los RF |

---

## LO QUE NECESITAMOS DE MAX GLOBAL

Para completar los textos legales del sitio:

> **1.** Razón social exacta y RUC
> **2.** Domicilio fiscal completo
> **3.** Correo y teléfono de contacto oficial
> **4.** Quién será el Oficial de Datos Personales
> **5.** ¿Ya registraron su banco de datos ante la ANPDP?
> **6.** ¿Tienen abogado que revise los términos de afiliación?

---

## FUENTES CONSULTADAS

- [Nuevo Reglamento de Protección de Datos Personales — CMS Law](https://cms.law/es/per/publication/nuevo-reglamento-de-proteccion-de-datos-personales)
- [Protección de Datos Personales en Perú: nuevo reglamento — EY Perú](https://www.ey.com/es_pe/insights/law/proteccion-datos-personales-peru-nuevo-reglamento)
- [Perú reforma su régimen de protección de datos personales — LexLatin](https://lexlatin.com/reportajes/proteccion-datos-personales-peru-empresas-oficial-cumplimiento-reforma)
- [Comercios electrónicos obligados a contar con Libro de Reclamaciones — INDECOPI](https://www.gob.pe/institucion/indecopi/noticias/1286430-comercios-electronicos-tambien-estan-obligados-a-contar-con-libro-de-reclamaciones-activo-y-visible)
- [Plataformas de comercio electrónico deberán contar con libro de reclamaciones — El Comercio](https://elcomercio.pe/economia/peru/plataformas-de-comercio-electronico-deberan-contar-con-libro-de-reclamaciones-que-implica-la-nueva-obligacion-plataformas-de-comercio-electronico-noticia/)
- [Venta directa y esquema piramidal: diferencias — Gestión](https://gestion.pe/tu-dinero/venta-directa-y-esquema-piramidal-cuales-son-las-diferencias-de-los-negocios-para-no-ser-victima-de-engano-rmmn-noticia/)
