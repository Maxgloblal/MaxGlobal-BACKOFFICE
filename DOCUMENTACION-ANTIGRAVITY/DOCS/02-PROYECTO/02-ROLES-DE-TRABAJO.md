# ROLES DE TRABAJO

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

---

## POR QUÉ EXISTEN LOS ROLES

El sistema se va a construir con asistencia de IA. Cada rol es una **unidad de
trabajo con contexto propio**.

> 🔴 **Regla fundamental: un rol por sesión.**
>
> El motor de comisiones se degrada si se trabaja en el mismo hilo donde se
> están ajustando estilos o textos. La IA pierde precisión cuando mezcla
> lógica financiera con detalles de interfaz.

---

## LOS 10 ROLES

### R0 · DIRECCIÓN DE PROYECTO
**Responsable: Jack (humano, no delegable)**

Decide todo lo pendiente, aprueba entregables y es el **único contacto con el
cliente**.

**Entregable:** documento de reglas confirmadas por Max Global.
Es el escudo ante cualquier reclamo futuro de *"el sistema calcula mal"*.

**Depende de:** nadie

---

### R1 · ARQUITECTO DE DATOS 🔒
**Bloqueante — nadie avanza sin esto**

Diseña el esquema de base de datos completo antes de que exista una sola
pantalla.

**Alcance:**
- Tablas de red, puntos, ciclos, comisiones, rangos, órdenes y vouchers
- Estructura de árbol optimizada para consultas de 10 niveles
- Reglas de inmutabilidad de puntos y comisiones
- Tablas de configuración para todo valor ajustable

**Entregable:** esquema SQL + diagrama + datos semilla

**Depende de:** R0

---

### R2 · MOTOR DE COMISIONES 🔥
**El corazón del proyecto — aproximadamente el 40% de su valor**

Módulo puro y aislado: entra una estructura de red, sale una liquidación.
Sin interfaz, sin consultas dispersas.

**Alcance:**
- Bono de Patrocinio (7 niveles, 30.8%)
- Bono Residual (10 niveles) con límite por pack y validación de activación
- Regla de Línea Estirada al 50%
- Bono de Rango (Jade → Embajador Corona)
- Bono Global semestral

**Entregable:** motor + suite de tests con casos verificados a mano.

> 🔴 **Ningún cálculo entra a producción sin su test.**

**Depende de:** R1

---

### R3 · BACKEND / API

Autenticación, sesiones, roles (socio / admin), endpoints, validación de
patrocinador, subida de vouchers y seguridad.

**Regla:** consume R2, **nunca reimplementa** lógica de comisiones.

**Depende de:** R1

---

### R4 · FRONTEND PÚBLICO

Landing institucional responsive, catálogo de productos con precios y puntos,
formulario de registro con link de patrocinador.

**Regla:** recibe todo el arte de R9. No inventa diseño.

**Depende de:** R3, R9

---

### R5 · BACKOFFICE DEL DISTRIBUIDOR

Dashboard, contómetros de puntos personales y grupales, árbol genealógico
interactivo, estado de red, tienda de recompra con descuento automático, carga
de voucher, historial de comisiones y billetera.

**Depende de:** R3, R9

---

### R6 · PANEL ADMINISTRADOR

Bandeja de aprobación de vouchers — **al aprobar se dispara el motor de
comisiones**. Gestión de productos y packs, cierre de ciclo, liquidación,
reportes y configuración de rangos y porcentajes.

**Depende de:** R2, R3

---

### R7 · QA / SIMULADOR DE RED

Genera 500+ afiliados falsos con estructura realista, corre ciclos mensuales
completos y verifica que la suma de comisiones pagadas jamás exceda el
porcentaje comprometido.

**Casos borde obligatorios:**
- Kit Emprendedor intentando patrocinar un Gold
- Socio inactivo en medio de una cadena de 10 niveles
- Línea estirada exactamente en el límite del 50%
- Upgrade de pack a mitad de ciclo
- Ciclo cerrado rechazando escrituras

> Este rol **es** la Fase 4 cotizada, y es lo que protege la garantía firmada.

**Depende de:** R2, R6

---

### R8 · DEVOPS / ENTREGA

Despliegue a producción, backups automáticos, variables de entorno y el paquete
de entrega: código documentado línea por línea, SQL limpia, scripts y manual,
todo a nombre de Max Global Corporation.

**Depende de:** todos

---

### R9 · DISEÑO Y MARCA ✅ CERRADO

**El cliente entregó el kit de marca completo el 25/08.** No hay que diseñar
identidad visual.

| Recurso | Estado |
|---|---|
| Manual de marca (18 páginas) | ✅ |
| Colores: Dorado `#D1AD68` · Verde `#1BA741` | ✅ |
| Tipografías: Agus Sans · Caviar Dreams | ✅ |
| Logo vectorial + 9 variantes PNG | ✅ |
| Papelería y video animado | ✅ |

**Lo único que queda (≈35 minutos):** convertir las tipografías a `.woff2`,
exportar el logo a SVG y generar el favicon.

**Pendiente opcional:** mockups de las pantallas clave, ya con la marca real.

**Ver:** `06-MARCA/00-GUIA-DE-MARCA-WEB`

---

## MAPA DE DEPENDENCIAS

```
R0 (definir)
     │
     ▼
R1 (datos) ──────┬──────────────┐
     │           │              │
     ▼           ▼              ▼
R2 (motor)     R3 (API)      (config)
     │           │
     │           ├──────► R4 (público)
     │           ├──────► R5 (backoffice)
     └───────────┴──────► R6 (admin)
                              │
                              ▼
                          R7 (QA)
                              │
                              ▼
                          R8 (entrega)

R9 (diseño) ───► corre en paralelo desde el día 1
```

---

## ORDEN DE ARRANQUE

| # | Acción | Rol | Estado |
|---|---|---|---|
| 1 | ~~Obtener respuestas del formulario~~ | R0 | ✅ **completado 26/08** |
| 2 | Diseñar esquema de datos + semillas | R1 | 🟢 listo para empezar |
| 3 | Construir motor de comisiones con tests | R2 | 🔒 bloqueado por #1 |
| 4 | Definir marca y mockups | R9 | ✅ **cerrado** — kit entregado por el cliente |
| 5 | Autenticación y API base | R3 | 🔒 bloqueado por #2 |
| 6 | Landing + catálogo + registro | R4 | 🟢 **puede arrancar hoy** — ya tiene la marca |
| 7 | Backoffice del socio | R5 | 🔒 |
| 8 | Panel admin + árbol + motor conectado | R6 | 🔒 |
| 9 | Simulación masiva y depuración | R7 | 🔒 |
| 10 | Despliegue y entrega de código fuente | R8 | 🔒 |

---

## CÓMO TRABAJAR CADA ROL CON IA

1. **Abre una sesión limpia** para el rol.
2. **Carga el `CLAUDE.md`** como contexto.
3. **Carga solo los documentos que ese rol necesita** (ver tabla abajo).
4. **No mezcles roles** en la misma sesion.

| Rol | Documentos que necesita |
|---|---|
| R1 | CLAUDE.md - Plan de compensacion - Modelo de datos |
| R2 | CLAUDE.md - Plan de compensacion - Modelo de datos - Principios tecnicos |
| R3 | CLAUDE.md - Modelo de datos - Flujos del sistema |
| R4, R5 | CLAUDE.md - Catalogo - Flujos del sistema - **Guia de marca web** |
| R6 | CLAUDE.md - Plan de compensacion - Flujos del sistema |
| R7 | CLAUDE.md - Plan de compensacion - todos los tests de R2 |
