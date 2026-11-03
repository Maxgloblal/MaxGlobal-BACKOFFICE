# CONTEXTO PARA RETOMAR

**Léeme completo antes de hacer nada.** Actualizado: 4 de septiembre de 2026
*Para que una sesión nueva sepa todo lo que sabe la anterior, sin reconstruirlo preguntando.*

> **Hay una guía técnica completa en `GUIA-CLAUDE/`.**
> Este archivo da el estado y las reglas de trabajo.
> La arquitectura detallada, las tablas y el motor están allá.

---

# 1 · QUÉ ES ESTO

**Sistema MLM completo para Max Global Corporation**, empresa peruana de venta
directa de productos naturales (moringa, colágeno, café).

```
   Cliente        Máximo · Max Global Corporation · RUC 20615864014
   Desarrollador  Jack · IDENZA
   Cotizado       S/. 4,000 PEN en 4 semanas
   Dominio        maxglobaloficial.com  (pendiente de confirmar)
```

## Las dos fases — ESTADO ACTUAL

```
   FASE 1   LANDING PÚBLICA   100%   PUBLICADA ✅
                                     max-global-landing.vercel.app
                                     el dominio espera al pago del 50%

   FASE 2   SISTEMA BACKOFFICE  84%   20/20 pantallas terminadas ✅
                                     238 pruebas unitarias + 26 E2E ✅
                                     seguridad cerrada ✅
                                     LOS 3 BONOS DE LA V1 certificados
                                     EN VIVO: patrocinio · residual · rango
                                     ⬜ faltan 5 funcionalidades del alcance
```

> **`05-CONTROL/PLAN-DE-CIERRE-V1.md` manda sobre este archivo** para saber qué
> falta. Tiene los 17 puntos ordenados, cada uno con la línea del documento
> donde se comprometió.

## 🔴 Lo más importante que pasó, y no lo olvides

El 4/09 se certificó el camino del dinero **operando el sistema como lo va a
operar Máximo**: predicción escrita antes de cada paso, verificación contra
Postgres después. Las nueve reglas salieron exactas. **El motor no falló.**

Pero ese recorrido descubrió que **P-21 y P-22 —las dos pantallas que registran
dinero— eran inservibles**: todos sus desplegables salían vacíos. Con 225
pruebas en verde. Las pruebas comprobaban que el `<select>` existiera, no que
tuviera texto dentro.

> **Media hora de recorrido manual encontró lo que 225 pruebas no.**
> Antes de dar cualquier pantalla por terminada, hay que abrirla y usarla.

## La base actual es DEMO, no producción

```
   503 socios simulados · S/. 100,261.02 en comisiones de mentira
   Sirve para demostrarle el sistema a Máximo — y se ve muy bien
   Para arrancar de verdad va un proyecto Supabase NUEVO y limpio
   No se borra esta: comision y wallet_movimiento son append-only
```

---

# 2 · CÓMO TRABAJA JACK — respétalo

```
   ❌  NO llenes de preguntas. Propone soluciones
   ❌  NO preguntes algo que ya está en las fuentes
   ❌  NO toques ni generes sus imágenes sin preguntar
   ✅  Mantén orden en documentos y carpetas
   ✅  Todo lo acordado se documenta
   ✅  Claude define y documenta · Antigravity programa
```

**Escribe en español, directo, sin adornos.**
La salida se PEGA LITERAL. No se resume ni se declara.

## 🔴 El error que más se repite

Leer un resumen en vez de la fuente y preguntar algo ya respondido.
**Antes de preguntar:** `GUIA-CLAUDE/00-INICIO-RAPIDO.md` tiene todo.

---

# 3 · EL MÉTODO

```
   1º   Se escribe la TAREA con sus bloques y los números exactos
   2º   Antigravity la ejecuta BLOQUE POR BLOQUE, commit en cada uno
   3º   Se VERIFICA contra Postgres — nunca contra el reporte
   4º   Los errores se DOCUMENTAN
   5º   Si hay error: tarea de corrección antes de avanzar
```

## Verificación = Postgres, no reportes

```sql
-- Verificar lo que importa, siempre
SELECT tipo, COUNT(*), SUM(monto_cent)/100.0 total_soles
FROM comision WHERE ciclo_id = (SELECT id FROM ciclo WHERE estado='cerrado' ORDER BY fecha_fin DESC LIMIT 1)
GROUP BY tipo;
```

**Y si git status --short no está vacío, la tarea no está terminada.**

---

# 4 · LAS REGLAS DE NEGOCIO QUE NO SE DISCUTEN

## Los 4 bonos

```
   PATROCINIO   7 niveles · suma 30.8% del precio del pack
                Escala: 20 · 4 · 3 · 2 · 1 · 0.5 · 0.3 %
                Solo en AFILIACIONES (nunca en recompras)

   RESIDUAL     10 niveles sobre puntos de recompra · suma 97%
                Escala: 40 · 20 · 10 · 5 · 3 · 2 · 1 · 10 · 5 · 1 %
                1 punto = S/. 1.00 · el nivel 8 es 10% a propósito
                Solo en RECOMPRAS (cuenta_residual = true)

   RANGO        Mensual · bono fijo según rango alcanzado al cierre
                8 rangos definidos (9-16 pendientes de Máximo)

   GLOBAL       Semestral · 1% · NO implementado en v1
```

## Las reglas que parecen errores y NO lo son

```
   Kit Emprendedor: 41.7% al nivel 1 (no 20%) — regla especial
   Si baja de rango: bono = S/.0 (ni el del rango menor)
   Sin compresión: lo bloqueado va a empresa, no sube
   Puntos grupales: NO incluyen los puntos personales
   Línea estirada: tope = 50% de los puntos del RANGO evaluado
```

## Los 5 packs

```
   Pack             Precio     Pts  Pat  Res  solo_afilia_igual
   Kit Emprendedor  S/.  120    70    0    0   true (solo afilia Kit)
   Ejecutivo        S/.  300    70    3    5   false
   Emprendedor      S/.  500    70    5    7   false
   Gold             S/. 1000    70    7   10   false
   Diamante         S/. 2000    70    7   10   false
```

## Activación

```
   70 puntos personales/mes, o pack de afiliación confirmado ese mes
   Sin activación: no se cobra NADA (ni residual, ni rango, ni patrocinio)
```

---

# 5 · DÓNDE ESTÁ TODO

| Busco | Voy a |
|---|---|
| **Contexto técnico completo para Claude** | `GUIA-CLAUDE/00-INICIO-RAPIDO.md` |
| **Estado del proyecto (para Jack)** | `00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO.md` |
| **Lo que falta** | `05-CONTROL/PENDIENTES.md` |
| Arquitectura y diagramas | `GUIA-CLAUDE/01-ARQUITECTURA.md` |
| Las 22 tablas y columnas | `GUIA-CLAUDE/02-BASE-DE-DATOS.md` |
| El motor con fórmulas | `GUIA-CLAUDE/03-MOTOR-COMISIONES.md` |
| La landing | `GUIA-CLAUDE/04-LANDING.md` |
| Las 20 pantallas | `GUIA-CLAUDE/05-BACKOFFICE.md` |
| Seguridad y RLS | `GUIA-CLAUDE/06-SEGURIDAD.md` |
| Reglas de trabajo con Antigravity | `GUIA-CLAUDE/07-REGLAS-TRABAJO.md` |
| QA con números verificados | `00-EMPEZAR-AQUI/QA-PLAN-DE-NEGOCIO.md` |
| Instrucción landing Vercel | `SITIO WEB.../00-INSTRUCCIONES/TAREA-08-PRERENDER-Y-DESPLIEGUE.md` |

---

# 6 · ESTADO AL 4 DE SEPTIEMBRE DE 2026

## Números verificados contra Postgres

```
   Socios:             503
   Órdenes:          1,051
   Comisiones:       2,419   (4 ciclos)
   Total repartido:  S/.100,261.02
   Ciclo 3 (ago):    S/. 13,479.68 ✅
   Ciclo 4 (sep):    S/.    240.00 ✅  ← el de la certificación manual
   Ciclos abiertos:  1 (oct 2026) ✅
   wallet_movimiento: 467 filas ✅
   Funciones anon:   0 de 16 ✅
```

## La certificación del 4/09 — lo que quedó probado

Se operó el sistema a mano, con la predicción escrita **antes** y la
verificación contra Postgres **después**. Las cuatro salieron exactas.

```
   1 · Afiliación bajo patrocinador INACTIVO   → 0 comisiones      ✅
   2 · Recompra de 72 pts                      → activa al socio   ✅
   3 · Afiliación Pack Gold bajo ACTIVO        → S/. 240.00 nivel 1 ✅
   4 · Cierre del ciclo 4                      → 1 abono, abre oct  ✅
```

**Las nueve reglas certificadas:**

```
   1 · Afiliación → orden → confirmación → comisión → cierre → billetera
   2 · La orden cae en el ciclo abierto correcto
   3 · Patrocinio nivel 1 = 20% exacto
   4 · Sin activación NO se paga nada
   5 · Sin compresión: lo retenido se queda en la empresa
   6 · El Kit Emprendedor activa aunque dé 0 puntos
   7 · La recompra acredita puntos y activa
   8 · La billetera se abona AL CIERRE, no al generar la comisión
   9 · Al cerrar se abre el siguiente y queda uno solo abierto
```

**Número de referencia del patrocinio:** Pack Gold S/. 1,200 × 20% = **S/. 240.00**
al nivel 1. Si alguna vez sale distinto, el motor cambió.

## Las 20 pantallas — TERMINADAS

```
   SOCIO                              ADMIN
   P-10  Inicio de sesión    ✅       P-20  Tablero              ✅
   P-11  Panel principal     ✅       P-21  Registrar pedido     ✅
   P-12  Mi red              ✅       P-22  Registrar afiliación ✅
   P-13  Tienda de recompra  ✅       P-23  Bandeja confirmación ✅
   P-14  Mis comisiones      ✅       P-24  Envíos               ✅
   P-15  Mi rango            ✅       P-25  Cierre de ciclo      ✅
   P-16  Mi enlace           ✅       P-26  Configuración plan   ✅
   P-17  Mis pedidos         ✅       P-27  Gestión de socios    ✅
   P-18  Mi perfil           ✅       P-28  Reportes             ✅
   P-19  Mi billetera        ✅       P-29  Auditoría            ✅
```

## FASE 1 · Landing — PUBLICADA

```
   ✅  14 páginas · móvil 390px · carrito · WhatsApp con ?ref=
   ✅  Legal completo
   ✅  vercel.json · sin _redirects
   ✅  scripts/prerender.mjs · 17 rutas con HTML propio
   ✅  Schema Product en las 8 fichas
   ✅  DESPLEGADA · max-global-landing.vercel.app
   ⏸   Dominio maxglobaloficial.com — espera al pago del 50%
```

**Verificado pidiéndole la página al servidor real**, no al build local:
`/productos/cafe-moringa` devuelve `og:title = "Coffee Capuccino — Max Global"`.
Queda descartado que el `rewrite` universal de `vercel.json` se coma los HTML
por ruta.

> **Al compartir el enlace `.vercel.app` la tarjeta de WhatsApp sale sin foto.**
> Los `og:image` apuntan al dominio final, que aún no resuelve. Se arregla con
> la variable `SITE_URL` en Vercel, sin tocar código.

---

# 7 · LO QUE FALTA — EN ORDEN

**Antes de que entre dinero real:**

| # | Qué | Por qué |
|---|---|---|
| 1 | **Subida del voucher** | La tabla `voucher` guarda banco, operación, monto y fecha, pero las 1,049 filas apuntan a un `placehold.co`. Sin la imagen no hay respaldo de que un socio pagó |
| 2 | **Campo de CCI** | La empresa cobra en BCP y BBVA. Un socio de otro banco necesita CCI. Solo hay `socio.cuenta_bancaria`: un campo para dos cosas |
| 3 | **Validar la cuenta** | Nadie comprueba lo que el socio escribe en P-18 |
| 4 | **Proyecto Supabase limpio** | Producción no puede arrancar sobre 503 socios simulados |

**Sin prisa:**

| Qué | Quién |
|---|---|
| Conectar el dominio | Jack — al pago del 50% |
| Rangos 9-16 | Máximo — P-26 tiene formularios listos |
| Code splitting (795 kB) | Antigravity — sin instrucción escrita aún |
| Cabecera del admin tras el cierre | Antigravity — no se refresca sola |
| Catálogo de la landing desde Supabase **en build** | Antigravity |
| Limpiar config duplicada | Jack decide |

**Solo los rangos dependen de Máximo.**

---

# 8 · ANTIGRAVITY — cómo tratarlo

**Ha corrompido archivos QUINCE veces.** Cortados a media palabra.
**Siete veces reportó git status vacío cuando no lo estaba.**

**Restaurar archivo corrompido:**
```bash
git show HEAD:src/paginas/P14MisComisiones.jsx > src/paginas/P14MisComisiones.jsx
# (git checkout -- falla en Windows con esta unidad)
```

## Toda instrucción debe llevar

```
   1 · commit después de CADA bloque
   2 · al final: git status --short + npm run build + npx vitest run
   3 · la salida se PEGA LITERAL, nunca se resume
   4 · si git status no está vacío, la tarea no está terminada
   5 · una CAPTURA de la pantalla usándose, no solo greps
```

## 🔴 La verificación no se escribe como lista de casos

**Aprendido el 3/09.** Se le dio una lista de 7 patrones exactos de tildes
perdidas para corregir. Corrigió esos 7 — y dejó `?PEDIDO` y `?XITO`, que no
estaban en la lista.

> **Una lista cerrada le dice a Antigravity dónde parar.** La verificación
> tiene que ser un escaneo que los encuentre todos, no los casos que uno vio
> a ojo.

Lo mismo con las capturas: en la TAREA-09 y la TAREA-11 entregó *descripciones*
de capturas ("Desplegable abierto con las 5 opciones legibles") en vez de
imágenes. Un pie de foto no es una foto.

## 🔴 Y una advertencia sobre las herramientas de Claude

El 3 y 4/09, **el montaje de disco de Claude devolvió tres veces contenido
falso**: archivos viejos, un `.git` "corrupto" que no lo estaba, y 71 bytes
nulos inexistentes en P-21 y P-22. Jack lo comprobó en su máquina: `nulls = 0`.

> **Ninguna lectura de disco de Claude vale sin que Jack la confirme en su
> propia terminal.** Un error de la herramienta de Claude no es evidencia
> sobre el trabajo de Antigravity.

---

# 9 · ERRORES YA COMETIDOS — no repetirlos

| Qué pasó | La lección |
|---|---|
| Antigravity dejó fn_current_socio_id expuesta a anon | Siempre verificar contra Postgres, no contra reporte |
| Orden 1204 stranded en ciclo cerrado | afterAll debe DELETE por ID específico |
| Se usó `o.precio_total_cent` | La columna es `o.total_cent` |
| `has_function_privilege('anon', oid, ...)` | Debe ser `p.oid` (calificar alias) |
| Se documentó _redirects como pendiente | Ya no existía en el repo — verificar antes de documentar |

---

# 10 · LO QUE NO ENTRA EN V1

```
   ❌ Bono Cumpleaños y Bono Viajes
   ❌ Tienda replicada por socio
   ❌ Pago en línea
   ❌ Facturación electrónica SUNAT
   ❌ App móvil nativa
   ❌ Rol de Asesor
   ❌ Chat interno, push, gamificación
   ❌ Pack VIP
   ❌ Bono Global (calculado pero no se paga en v1)
```
