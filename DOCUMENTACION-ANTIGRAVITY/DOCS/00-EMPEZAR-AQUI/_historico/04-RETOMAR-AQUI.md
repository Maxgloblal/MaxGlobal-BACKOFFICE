# RETOMAR AQUÍ — LO QUE FALTA

**Última sesión cerrada:** martes 25 de agosto de 2026 · 22:06 (hora de Perú)
**Siguiente sesión:** _por definir_

> Este es el documento que abres mañana. Te dice exactamente dónde quedaste y
> qué hacer primero.

---

## 📍 DÓNDE QUEDAMOS

**Toda la documentación está cerrada.** 51 documentos, 64 PDFs, 9 carpetas.

| Área | Estado |
|---|---|
| Plan de compensación | ✅ 90% confirmado |
| Modelo de datos | ✅ Completo |
| 305 requisitos funcionales | ✅ Escritos, 280 programables |
| 14 casos de uso · 69 excepciones | ✅ Completos |
| Marco legal | ✅ Investigado y documentado |
| Marca | ✅ Entregada por el cliente |
| Spec Kit — 2 proyectos | ✅ Listos para Antigravity |
| **Programación** | ⚪ **No iniciada** |

---

## ⚡ LO PRIMERO QUE HAY QUE HACER MAÑANA

### 1 · Mandarle la PROPUESTA a Máximo — 5 minutos

**No más preguntas.** Mándale el PDF de
`04-CLIENTE/04-PROPUESTA-PARA-APROBACION`.

Es el plan completo, con gráficos, mostrando lo que entendimos y las
contradicciones que encontramos en sus documentos —con la decisión ya tomada
en cada una.

Él solo tiene que responder *"está todo bien, adelante"* o corregir un punto.

**Lo único que sí necesita responder para el motor:** si el rango se mide por
el mes o por el acumulado. Está marcado en rojo dentro de la propuesta (Parte 4b).

> ✅ **La tabla de descuentos ya se resolvió el 25/08.** No era una
> contradicción: eran dos descuentos distintos (dentro del pack y en recompra).

### 2 · Preparar los recursos de marca — 35 minutos

```
· Convertir las tipografías .ttf → .woff2       (pesan 3-5× menos)
· Exportar el logo .ai → SVG                    (no usar PNG en web)
· Generar el favicon en varios tamaños
```

Los archivos están en `06-MARCA/`.

### 3 · Arrancar el PROYECTO-1-LANDING

```bash
specify init max-global-landing --integration claude
```

Copiar de `07-SPEC-KIT/PROYECTO-1-LANDING/`:
- `CLAUDE.md` → raíz del proyecto
- `memory/constitution.md` → `.specify/memory/`
- La spec → `/speckit.specify`

**La landing no depende de ninguna respuesta pendiente.**

---

## 🔴 LO QUE FALTA — DOCUMENTACIÓN

### Alta prioridad — antes de programar el motor

| # | Qué falta | Para qué sirve | Tiempo |
|---|---|---|---|
| **F-1** | **Datos semilla y red simulada** | Probar el motor con 500 socios antes de tocar datos reales. **Es la Fase 4 de tu cotización** | ~1 sesión |
| **F-2** | **Diagrama entidad-relación visual** | Ver el modelo completo de un vistazo. Ayuda al agente y a ti | ~30 min |

> **F-1 es el más importante de los dos.** Es lo que protege la garantía que
> firmaste de *"sistema libre de fallas matemáticas"*. Sin una red simulada no
> hay forma de verificar que el motor calcula bien antes de que entre gente real.

### Media prioridad — durante el desarrollo

| # | Qué falta | Para qué sirve |
|---|---|---|
| **F-3** | Catálogo de mensajes de error | Que el sistema hable parejo en todas las pantallas |
| **F-4** | Plan de pruebas consolidado | Los tests están listados en 4 documentos distintos |
| **F-5** | Guía de despliegue | Variables de entorno, backups, dominios |

### Baja prioridad — post-entrega

| # | Qué falta | Para qué sirve |
|---|---|---|
| **F-6** | Manual de usuario para Máximo | Cómo usar el panel de administración |
| **F-7** | Manual del socio | Cómo usar su backoffice |
| **F-8** | Documento de handover | Lo que se entrega y cómo mantenerlo |

---

## ✅ RESPUESTAS DE MÁXIMO — COMPLETAS

**Respondió las 40 preguntas del formulario el 26/08.** Análisis en
`04-CLIENTE/05-ANALISIS-RESPUESTAS-FORMULARIO`.

**Ya no hay preguntas pendientes.** Solo faltan tres datos administrativos:

| # | Dato | Bloquea |
|---|---|---|
| 1 | Banco, CCI y titular de la cuenta `0198789899` | Pantalla de pago |
| 2 | Razón social, RUC y domicilio fiscal | Pie de página legal |
| 3 | Textos de misión, visión y valores | Página Nosotros |

**Ninguno bloquea el motor ni la landing.**

---

## 💼 LO QUE FALTA — DECISIONES TUYAS

| # | Decisión | Por qué importa |
|---|---|---|
| ~~D-1~~ | ~~Cómo plantear el alcance no cotizado~~ | ✅ **RESUELTO 26/08.** Ver `02-PROYECTO/03-LINEA-DE-ALCANCE-V1` — incluye el mensaje listo para mandar |
| ~~D-2~~ | ~~Cumpleaños, Viajes y rangos 9–16~~ | ✅ **Fuera de v1.** El cliente maneja los bonos aparte; los rangos quedan configurables |
| **D-3** | Quién paga hosting, dominio y correos | Está fuera de la cotización |
| **D-4** | Si construyes el skill del método | Lo que hace que el próximo cliente cueste 2 horas y no 8 |

> **D-1 es el que más te conviene resolver mañana.** Mientras más avance el
> desarrollo, más incómodo es plantearlo.

---

## 🎯 SI SOLO TIENES UNA HORA MAÑANA

```
1. Mandarle la línea de alcance a Máximo      10 min
2. Preparar los recursos de marca             35 min
3. Crear el proyecto de la landing            15 min
```

Con eso el proyecto queda en movimiento y tú no eres el cuello de botella.

---

## 🎯 SI TIENES EL DÍA

```
Mañana    · La línea de alcance
          · Recursos de marca
          · Arrancar la landing con Antigravity
          · Construir P-03 (packs) y P-01 (portada)

Tarde     · Datos semilla y red simulada  (F-1)
          · Diagrama entidad-relación     (F-2)
```

---

## 🧭 RECORDATORIOS DE CRITERIO

*Lo que te va a servir cuando estés en medio del desarrollo y dudes.*

**No empieces el sistema por las pantallas.** El motor de comisiones primero.
Una interfaz fea se corrige; una comisión mal pagada no se recupera.

**En el motor, el test va antes que el código.** Los números esperados salen de
la especificación, no de lo que devuelva la implementación.

**Si aparece algo no definido, clasifícalo:** ¿equivocarse cuesta dinero pagado
a un socio? Entonces es regla de negocio y va a Máximo. Si no, la decides tú y
la dejas configurable.

**Cuando llegue una respuesta de Máximo,** anótala con fecha y cita textual en
`04-CLIENTE/02-RESPUESTAS-CONFIRMADAS` antes de programar nada. Ese registro es
tu respaldo.

**Las tres protecciones que no pueden faltar:**

```
1. UPDATE ... WHERE estado='por_confirmar' RETURNING id
2. Vista previa cancelable antes del cierre
3. Bloquear el cierre si excede lo comprometido
```

---

## 📂 DÓNDE ESTÁ CADA COSA

| Busco | Voy a |
|---|---|
| Un dato rápido del plan | `00-EMPEZAR-AQUI/02-REFERENCIA-RAPIDA` |
| Entender el proyecto completo | `00-EMPEZAR-AQUI/03-INFORME-GENERAL` |
| Qué falta definir | `05-CONTROL/PENDIENTES` |
| Por qué se decidió algo | `05-CONTROL/BITACORA` |
| Qué respondió Máximo | `04-CLIENTE/02-RESPUESTAS-CONFIRMADAS` |
| Construir la landing | `07-SPEC-KIT/PROYECTO-1-LANDING/` |
| Construir el sistema | `07-SPEC-KIT/PROYECTO-2-SISTEMA/` |
| Qué pasa cuando algo falla | `03-SISTEMA/12` y `13` |

---

**Cerrado el 25 de agosto de 2026 a las 22:06.**
Descansa. El proyecto está listo para construirse.
