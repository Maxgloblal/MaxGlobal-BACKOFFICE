# SPEC KIT — CÓMO USAR ESTA CARPETA

**Sistema Max Global Corporation**
**Referencia:** [github/spec-kit](https://github.com/github/spec-kit) · v1.0.0
**Actualizado:** 25 de agosto de 2026

---

## 🔴 SON DOS PROYECTOS SEPARADOS, NO UNO

```
PROYECTO-1-LANDING          →  maxglobaloficial.com
   Sitio comercial público
   Sin lógica de comisiones

PROYECTO-2-SISTEMA          →  app.maxglobaloficial.com
   Backoffice, panel admin y motor de comisiones
```

Cada uno tiene **su propio `CLAUDE.md` y su propia constitución**.

### Por qué separarlos importa técnicamente

**Un `CLAUDE.md` con contexto que no aplica degrada al agente.**

Si el agente que construye la landing lee 12 artículos sobre inmutabilidad de
comisiones, asientos inversos y cierre de ciclos, ese contexto le compite
atención con lo que sí importa: que el `?ref=` no se pierda.

Y al revés: el agente del motor de comisiones no necesita saber de paletas de
color ni de textos institucionales.

**Cada proyecto recibe solo lo suyo.**

---

## ESTRUCTURA

```
07-SPEC-KIT/
├── LEEME-SPEC-KIT.md          Este archivo
│
├── PROYECTO-1-LANDING/
│   ├── CLAUDE.md              Contexto del sitio comercial
│   ├── memory/constitution.md 6 artículos
│   └── specs/
│       └── 001-web-publica/   7 páginas
│
└── PROYECTO-2-SISTEMA/
    ├── CLAUDE.md              Contexto del sistema
    ├── memory/constitution.md 12 artículos
    └── specs/
        ├── 001-motor-comisiones/   ← se construye PRIMERO
        ├── 002-backoffice-socio/
        ├── 003-panel-admin/
        └── 004-panel-asesor/       ← 📌 Fase 2, congelada
```

---

## EL FLUJO DE SPEC KIT

```
0. /speckit.constitution   Principios         (una sola vez por proyecto)
        ↓
1. /speckit.specify        QUÉ y POR QUÉ
        ↓
   /speckit.clarify        Resolver lo ambiguo   (recomendado)
        ↓
2. /speckit.plan           CÓMO — stack y arquitectura
        ↓
3. /speckit.tasks          Lista de tareas ejecutables
        ↓
   /speckit.analyze        Verificar consistencia
        ↓
4. /speckit.implement      Construir
        ↓
5. /speckit.converge       Comparar lo hecho contra la spec
        ↑                          │
        └──── repetir 4 y 5 hasta "Converged"
```

---

## CÓMO ARRANCAR — PROYECTO 1, LA LANDING

### 1. Instalar Spec Kit

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z
```

*Reemplazar `vX.Y.Z` por la última versión publicada, conservando la `v`.*

### 2. Inicializar

```bash
specify init max-global-landing --integration claude
cd max-global-landing
```

### 3. Cargar el contexto

Copiar de `PROYECTO-1-LANDING/`:

| Origen | Destino |
|---|---|
| `CLAUDE.md` | raíz del proyecto |
| `memory/constitution.md` | `.specify/memory/constitution.md` |

### 4. Especificar

```
/speckit.specify
```

Y pegar el contenido de `specs/001-web-publica/spec.md`.

### 5. Aclarar antes de planificar

```
/speckit.clarify
```

Va a detectar los 6 datos pendientes marcados con ⏳.
**Ninguno bloquea el arranque** — son valores de configuración. Se construye con
datos de ejemplo y se reemplazan cuando lleguen las respuestas.

### 6. Planificar con el stack elegido

```
/speckit.plan
```

Acá recién se define la tecnología.

---

## CÓMO ARRANCAR — PROYECTO 2, EL SISTEMA

Igual que el anterior, pero con dos diferencias importantes:

### Diferencia 1 · El orden de las specs

```
1. 001-motor-comisiones    ← PRIMERO, sin excepción
2. 003-panel-admin
3. 002-backoffice-socio
4. 004-panel-asesor        ← no construir, está congelada
```

**No empieces por las pantallas.** El motor es lo único irreversible del
proyecto: una interfaz fea se corrige, una comisión mal pagada no se recupera.

### Diferencia 2 · Los pendientes sí bloquean

En el sistema, `/speckit.clarify` va a marcar **10 pendientes que sí importan**.
Los que afectan el cálculo **no se pueden asumir**:

- ~~Tabla de descuentos por pack~~ ✅ resuelto 25/08 — son **dos** descuentos
- ~~Si los puntos van sobre lista o con descuento~~ ✅ resuelto — **son fijos**
- ~~Jade: frontales · Platino: monto~~ ✅ decididos: **1 frontal · S/. 1,500**
- **Puntaje del Kit Emprendedor** 🔴 sigue abierto
- **¿El rango se mide por mes o acumulado?** 🔴 sigue abierto

**Espera la respuesta.** Programar el motor con un valor asumido significa pagar
mal a personas reales.

---

## REGLA DE ORO

> **La especificación manda sobre el código.**
>
> Si el código y la spec no coinciden, el que está mal es el código.
> Si la spec está mal, se corrige la spec **primero** y el código después.
>
> En el momento en que el código se vuelve la fuente de verdad, se pierde todo
> el beneficio del método.

---

## POR QUÉ ESTE MÉTODO EN ESTE PROYECTO

El motor de comisiones mueve dinero real. Un agente de IA que improvisa un
porcentaje genera una obligación de pago imposible de revertir.

Spec Kit existe exactamente para eso: **la especificación es la fuente de verdad
contra la cual el agente implementa**, en vez de un mensaje suelto que se pierde
en el chat.

Los dos `CLAUDE.md` incluyen guardarraíles explícitos contra los dos errores más
probables:

| Error probable | Guardarraíl |
|---|---|
| Multiplicar el residual por 4.167 | Prohibición explícita y repetida |
| "Corregir" el nivel 8 que paga 10% | Advertencia de que es intencional |

Cualquier desarrollador o IA que vea esos números va a querer arreglarlos.

---

## FUENTES

- [github/spec-kit](https://gith