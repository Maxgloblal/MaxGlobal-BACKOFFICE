# ÍNDICE GENERAL — SISTEMA MAX GLOBAL CORPORATION

**Proyecto:** Plataforma web + backoffice multinivel
**Cliente:** Max Global Corporation
**Última actualización:** 3 de septiembre de 2026

> **¿Chat nuevo o vuelves después de días?**
> Lee `GUIA-CLAUDE/00-INICIO-RAPIDO.md` — tiene todo el contexto técnico.
> Luego `07-CONTEXTO-PARA-RETOMAR.md` — tiene el estado y las reglas de trabajo.
>
> **¿Solo quieres saber qué falta hacer?**
> `05-CONTROL/PENDIENTES.md`

---

## ESTADO ACTUAL (3 de septiembre de 2026)

```
   LANDING PÚBLICA    95%   14 páginas · prerenderizado ✅ · falta deploy Vercel
   SISTEMA BACKOFFICE 97%   20/20 pantallas · 225 pruebas · todo verde ✅
```

---

## MAPA DE CARPETAS

### 📁 GUIA-CLAUDE ← para Claude · empieza aquí

| Documento | Contenido |
|---|---|
| `00-INICIO-RAPIDO.md` | **EMPEZAR AQUÍ.** Contexto completo en 5 min |
| `01-ARQUITECTURA.md` | Diagramas del sistema completo |
| `02-BASE-DE-DATOS.md` | 22 tablas con columnas · relaciones · RLS |
| `03-MOTOR-COMISIONES.md` | Los 4 bonos con fórmulas y código real |
| `04-LANDING.md` | La web pública · 14 páginas · rutas |
| `05-BACKOFFICE.md` | Las 20 pantallas · servicios · pruebas |
| `06-SEGURIDAD.md` | RLS · políticas · funciones · incidentes |
| `07-REGLAS-TRABAJO.md` | Reglas críticas · comandos · errores históricos |

---

### 📁 00-EMPEZAR-AQUI ← para Jack · estado del proyecto

| Documento | Para qué |
|---|---|
| `00-INDICE.md` | Este archivo |
| `01-ESTADO-DEL-PROYECTO.md` | Semáforo: qué está listo, qué falta |
| `02-INFORME-GENERAL.md` | El proyecto explicado con números |
| `06-DOCUMENTO-MAESTRO.md` | Las reglas de negocio cerradas, con fundamento |
| **`07-CONTEXTO-PARA-RETOMAR.md`** | **Estado + reglas para una sesión nueva** |
| `QA-PLAN-DE-NEGOCIO.md` | Casos de prueba con números verificados de Postgres |

### 📁 00-INSTRUCCIONES (en SISTEMA MOTOR Y BACKOFFICE)

| Documento | Estado |
|---|---|
| `TAREA-09-CIERRE-DE-CICLO.md` | ✅ completada y verificada |
| `TAREA-10-TANDA-5B.md` | ✅ completada y verificada |

### 📁 00-INSTRUCCIONES (en SITIO WEB 06 PAGINAS LANDINGS)

| Documento | Estado |
|---|---|
| `TAREA-08-PRERENDER-Y-DESPLIEGUE.md` | ✅ prerender hecho · ⬜ Jack despliega en Vercel |

---

### 📁 01-NEGOCIO

| Documento | Contenido |
|---|---|
| `01-PLAN-DE-COMPENSACION` | Los 4 bonos · porcentajes · ejemplos |
| `02-CATALOGO-PRODUCTOS-Y-PACKS` | Productos, precios, puntos, packs |
| `03-LOS-TRES-CONTOMETROS` | Qué se resetea y qué se acumula |

### 📁 02-PROYECTO

| Documento | Contenido |
|---|---|
| `01-ALCANCE-Y-CRONOGRAMA` | Qué incluye la cotización de S/.4,000 |
| `03-LINEA-DE-ALCANCE-V1` | Qué entra y qué no |

### 📁 03-SISTEMA

| Documento | Contenido |
|---|---|
| `01-PRINCIPIOS-TECNICOS` | Las 7 reglas de oro |
| `02-MODELO-DE-DATOS` | Las tablas y por qué |
| `03-FLUJOS-DEL-SISTEMA` | Afiliación, recompra, pago, cierre |
| `08-RF-WEB-PUBLICA` | Requisitos funcionales de la landing |
| `09-RF-BACKOFFICE-SOCIO` | Requisitos del socio |
| `10-RF-PANEL-ADMIN` | Requisitos del admin |

### 📁 04-CLIENTE

| Documento | Contenido |
|---|---|
| `01-FORMULARIO-PREGUNTAS` | Las 40 preguntas enviadas a Máximo |
| `02-RESPUESTAS-CONFIRMADAS` | Cada respuesta con fecha y cita textual |

### 📁 05-CONTROL

| Documento | Contenido |
|---|---|
| `PENDIENTES.md` | Lo que falta · sin bloqueantes críticos |
| `BITACORA` | Registro de decisiones |

### 📁 06-MARCA

| Documento | Contenido |
|---|---|
| Logo, tipografía, paleta, identidad visual de Max Global |

### 📁 07-SPEC-KIT

| Carpeta | Contenido |
|---|---|
| `PROYECTO-1-LANDING/` | Spec para la landing |
| `PROYECTO-2-SISTEMA/` | Spec para el sistema |

### 📁 08-LEGAL

| Documento | Contenido |
|---|---|
| `00-MARCO-LEGAL-PERU` | Las normas que aplican |
| `01-RF-LEGALES` | Requisitos funcionales de cumplimiento |

### 📁 99-FUENTES-ORIGINALES

PDFs originales de Máximo. No se tocan.

---

## LAS DOS CARPETAS DE CÓDIGO

| Carpeta | Stack | Estado |
|---|---|---|
| `SITIO WEB 06 PAGINAS LANDINGS/` | React + Vite + Tailwind | 90% · falta deploy |
| `SISTEMA MOTOR Y BACKOFFICE/` | React + Vite + TS + Supabase | 97% · 225 pruebas ✅ |

---

## ORDEN DE LECTURA — CHAT NUEVO

```
   1. GUIA-CLAUDE/00-INICIO-RAPIDO.md         ← el contexto
   2. 00-EMPEZAR-AQUI/07-CONTEXTO-PARA-RETOMAR.md  ← reglas de trabajo
   3. 05-CONTROL/PENDIENTES.md                ← qué hacer
```
