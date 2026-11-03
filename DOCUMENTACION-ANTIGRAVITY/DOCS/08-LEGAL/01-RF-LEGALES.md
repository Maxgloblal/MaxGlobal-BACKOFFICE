# REQUISITOS FUNCIONALES LEGALES

**Numeración:** RF-6xx · **Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

> Lo que el sistema **debe** implementar para cumplir la normativa peruana.
> Base legal en `00-MARCO-LEGAL-PERU`.

---

## RF-600 · LIBRO DE RECLAMACIONES VIRTUAL — 🔴 OBLIGATORIO

**Base:** Ley N° 32495 (11 nov 2025) · Sanción: 1 a 10 UIT

| # | Requisito | Superficie |
|---|---|---|
| RF-601 | El enlace **debe** ser visible y permanente en todo el sitio | Landing y sistema |
| RF-602 | El enlace **debe** estar a **menos de 2 clics** desde la página principal | Ambas |
| RF-603 | **Debe** haber un aviso en la pantalla de compra o registro | Ambas |
| RF-604 | El formulario **debe** estar activo 24/7 | Ambas |
| RF-605 | El sistema **debe** enviar **confirmación automática de recepción** al consumidor | Ambas |
| RF-606 | Cada reclamo **debe** recibir un código único de seguimiento | Ambas |
| RF-607 | El sistema **debe** registrar la fecha para el plazo de 15 días hábiles | Ambas |
| RF-608 | El admin **debe** ver los reclamos pendientes con días restantes | Sistema |
| RF-609 | El sistema **debe** alertar cuando un reclamo se acerque al plazo | Sistema |
| RF-610 | El registro de reclamos **debe** ser inalterable | Sistema |

### Campos obligatorios del formulario

```
Tipo:            Reclamo | Queja        (son distintos legalmente)
Consumidor:      nombre · documento · domicilio · correo · teléfono
Menor de edad:   datos del apoderado
Bien contratado: producto o servicio · monto reclamado
Detalle:         descripción del reclamo
Pedido:          qué solicita el consumidor
```

> **Reclamo** es disconformidad con el producto o servicio.
> **Queja** es malestar con la atención. La norma los distingue y el formulario
> debe permitir elegir.

---

## RF-620 · PROTECCIÓN DE DATOS PERSONALES

**Base:** Ley N° 29733 y D.S. 016-2024-JUS · Sanción: hasta 100 UIT

### Consentimiento

| # | Requisito |
|---|---|
| RF-621 | El registro **debe** incluir casilla de aceptación **sin premarcar** |
| RF-622 | La casilla **debe** enlazar a la política de privacidad y a los términos |
| RF-623 | El sistema **debe** guardar fecha, hora y versión del texto aceptado |
| RF-624 | El consentimiento de marketing **debe** ser **separado** del de servicio |
| RF-625 | El sistema **no debe** permitir continuar sin aceptar los términos |

> **RF-624 importa:** aceptar el servicio no es aceptar publicidad. Son dos
> consentimientos distintos y meterlos en una sola casilla invalida el segundo.

### Derechos ARCO y portabilidad

| # | Requisito |
|---|---|
| RF-626 | El socio **debe** poder ver todos sus datos guardados |
| RF-627 | El socio **debe** poder corregir sus datos personales |
| RF-628 | El socio **debe** poder solicitar la baja de su cuenta |
| RF-629 | El socio **debe** poder **exportar sus datos** en formato legible |
| RF-630 | **Debe** existir un canal visible para ejercer estos derechos |

### Seguridad

| # | Requisito |
|---|---|
| RF-631 | Las contraseñas **deben** guardarse con hash |
| RF-632 | Los datos bancarios **solo** los ve su dueño y el administrador |
| RF-633 | Los datos bancarios **nunca** aparecen en el árbol ni en exportaciones de terceros |
| RF-634 | Todo acceso a datos sensibles **debe** quedar registrado |
| RF-635 | El sistema **debe** permitir detectar accesos anómalos para el reporte de 48h |

> **RF-633 es la regla más fácil de romper por accidente.** Un `SELECT *` en la
> consulta del árbol expone las cuentas bancarias de toda la red.

### Retención

| # | Requisito |
|---|---|
| RF-636 | La política **debe** declarar cuánto tiempo se conservan los datos |
| RF-637 | Al dar de baja, los datos personales **deben** poder anonimizarse |
| RF-638 | Las comisiones históricas **se conservan** aunque se anonimice al socio |

> **RF-638 no es contradicción:** el registro contable debe sobrevivir, pero sin
> el dato personal. Se conserva el monto y el ciclo, se anonimiza el nombre.

---

## RF-650 · INFORMACIÓN AL CONSUMIDOR

**Base:** Ley N° 29571 (Código del Consumidor)

| # | Requisito |
|---|---|
| RF-651 | El pie de página **debe** mostrar razón social, RUC y domicilio fiscal |
| RF-652 | **Debe** haber correo y teléfono de contacto visibles |
| RF-653 | Los precios **deben** mostrarse completos, sin cargos ocultos |
| RF-654 | El costo de envío **debe** informarse antes de confirmar |
| RF-655 | Las condiciones de entrega **deben** estar visibles |
| RF-656 | Los términos y condiciones **deben** ser accesibles desde cualquier página |
| RF-657 | La política de privacidad **debe** ser accesible desde cualquier página |

---

## RF-670 · PROHIBICIONES — 🔴 lo que el sistema NO debe hacer

**Base:** publicidad engañosa, Ley N° 29571

| # | Prohibición |
|---|---|
| RF-671 | **Prohibido** mostrar promesas o proyecciones de ingresos |
| RF-672 | **Prohibido** mostrar testimonios no verificables |
| RF-673 | **Prohibido** publicar cifras de socios o ventas sin respaldo |
| RF-674 | **Prohibido** usar frases de enriquecimiento rápido |
| RF-675 | **Prohibido** presentar la afiliación como empleo o como ingreso garantizado |
| RF-676 | **Prohibido** simuladores de ganancias con cifras inventadas |

> Se explica **cómo funciona** el plan de compensación. **Nunca cuánto se gana.**

---

## RF-680 · RELACIÓN CON EL SOCIO

| # | Requisito |
|---|---|
| RF-681 | Los términos **deben** declarar que no existe relación laboral |
| RF-682 | Los términos **deben** declarar que el socio es independiente |
| RF-683 | Los términos **deben** indicar que el socio asume sus obligaciones tributarias |
| RF-684 | El socio **debe** poder retirarse en cualquier momento |
| RF-685 | El sistema **debe** guardar qué versión de los términos aceptó cada socio |

> **RF-685 protege a ambas partes.** Si los términos cambian, hay que saber qué
> aceptó cada quién y cuándo.

---

## RF-690 · TRAZABILIDAD ANTE FISCALIZACIÓN

> No son obligaciones directas de una norma, pero son lo que se pediría en una
> fiscalización de INDECOPI sobre si el modelo es venta directa o esquema
> piramidal.

| # | Requisito |
|---|---|
| RF-691 | El sistema **debe** reportar la proporción de volumen entre packs de afiliación y recompras |
| RF-692 | El sistema **debe** poder demostrar la entrega física de cada pack, con guía de envío |
| RF-693 | El sistema **debe** poder listar socios que ganan por venta sin haber reclutado |
| RF-694 | Toda comisión **debe** ser trazable hasta la orden de producto que la originó |

> **RF-694 ya está cubierto** por el diseño de comisiones inmutables con rastro
> completo. Es el mismo requisito que evita reclamos de socios, sirviendo ahora
> para otra cosa.

---

## RESUMEN

| Bloque | Requisitos | Prioridad |
|---|---|---|
| Libro de Reclamaciones | 10 | 🔴 Obligatorio por ley con sanción |
| Protección de datos | 18 | 🔴 Multa hasta 100 UIT |
| Información al consumidor | 7 | 🔴 Obligatorio |
| Prohibiciones | 6 | 🔴 Riesgo de sanción |
| Relación con el socio | 5 | 🟡 Riesgo laboral |
| Trazabilidad | 4 | 🟡 Preventivo |
| **TOTAL** | **50** | |

---

## IMPACTO EN EL CRONOGRAMA

**Esto no estaba cotizado.** Son aproximadamente 50 requisitos nuevos, y el
Libro de Reclamaciones es prácticamente un módulo completo: formulario, códigos
de seguimiento, plazos, bandeja de gestión y alertas.

### Recomendación

**Plantearlo con Máximo antes de construirlo, no después.** No como un cobro
extra sorpresa, sino como lo que es:

> *"Máximo, revisando la normativa vigente encontré que desde noviembre del año
> pasado el Libro de Reclamaciones virtual es obligatorio para comercio
> electrónico, con multa de hasta 10 UIT. Y el reglamento de datos personales
> cambió en marzo del 2025 y ahora exige varias cosas más. Lo podemos incluir —
> solo definamos si va en esta versión o en una segunda, y ajustamos el
> alcance."*

**Lo mínimo que no puede faltar en la v1:**

| Prioridad | Qué |
|---|---|
| 🔴 Sí o sí | Libro de Reclamaciones · consentimiento en el registro · política de privacidad · identificación del proveedor |
| 🟡 Puede esperar | Portabilidad de datos · anonimización · reportes de fiscalización |
