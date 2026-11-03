# MAPA DE MANTENIMIENTO

**Cuando algo cambia, esto dice dónde hay que tocarlo.**

> **Para quién es:** para Claude en sesiones futuras y para Jack.
>
> El proyecto tiene 50+ documentos. Un dato como el precio del café vive en ocho
> archivos distintos. **Este mapa evita que queden desincronizados**, que fue el
> problema que apareció dos veces el 26 de agosto.

---

# REGLA DE ORO

```
   ANTES DE PREGUNTARLE ALGO AL CLIENTE:
        1. Revisar 04-CLIENTE/02-RESPUESTAS-CONFIRMADAS
        2. Si es de MARCA  ->  06-MARCA/00-MARCA-COMPLETA
                               (ya tiene extraído todo lo de los PDFs)
        3. Revisar 99-FUENTES-ORIGINALES  (todos, incluidos los grandes)
        4. Recién entonces preguntar

   Si cambia una REGLA DE NEGOCIO   →  se toca la sección 1 completa
   Si cambia un DATO DE LA EMPRESA  →  se toca la sección 2
   Si cambia el ALCANCE             →  se toca la sección 3
   Siempre, sin excepción           →  BITACORA + regenerar PDFs
```

---

# 1 · CAMBIA UNA REGLA DEL PLAN DE COMPENSACIÓN

*Porcentajes, puntos, rangos, activación, descuentos, precios.*

**Es lo más delicado del proyecto. Un dato desactualizado en cualquiera de estos
archivos hace que se pague mal.**

| Orden | Archivo | Qué lleva |
|---|---|---|
| 1 | `04-CLIENTE/02-RESPUESTAS-CONFIRMADAS` | 🔴 **Primero siempre.** La cita textual con fecha |
| 2 | `01-NEGOCIO/01-PLAN-DE-COMPENSACION` | La ley del proyecto |
| 3 | `01-NEGOCIO/02-CATALOGO-PRODUCTOS-Y-PACKS` | Productos, precios, packs |
| 4 | `00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO` | El resumen completo con ejemplos |
| 5 | `00-EMPEZAR-AQUI/02-REFERENCIA-RAPIDA` | La hoja de consulta |
| 6 | `00-EMPEZAR-AQUI/05-ASI-FUNCIONA` | El relato de María, con sus números |
| 7 | `03-SISTEMA/schema.sql` | Tablas y `config` |
| 8 | `03-SISTEMA/11-RF-MOTOR-Y-SISTEMA` | Los RF del cálculo |
| 9 | `CLAUDE.md` *(raíz)* | 🔴 Lo primero que lee cualquier IA |
| 10 | `07-SPEC-KIT/PROYECTO-2-SISTEMA/CLAUDE.md` | Contexto del sistema |
| 11 | `07-SPEC-KIT/PROYECTO-2-SISTEMA/memory/constitution.md` | Si es regla dura, va como artículo |
| 12 | `SITIO WEB.../src/config.js` | Si afecta lo que se muestra en la web |

> ⚠️ **Los puntos 9, 10 y 11 son los que más se olvidan** y son los que la IA
> lee para programar. El 26/08 el plan de compensación se quedó sin las tres
> reglas nuevas y ese error habría llegado al código.

---

# 2 · CAMBIA UN DATO DE LA EMPRESA

*RUC, razón social, domicilio, cuentas bancarias, WhatsApp, misión y visión.*

| Archivo | Qué lleva |
|---|---|
| `SITIO WEB.../src/config.js` | 🔴 **El que manda.** Todo sale de acá |
| `08-LEGAL/02-TEXTOS-PARA-EL-SITIO` | Textos legales que citan los datos |
| `04-CLIENTE/03-ULTIMO-PEDIDO-DE-DATOS` | Marcar como recibido |
| `05-CONTROL/PENDIENTES` | Cerrar el pendiente |

---

# 3 · CAMBIA EL ALCANCE

*Entra o sale una funcionalidad.*

| Archivo | Qué lleva |
|---|---|
| `02-PROYECTO/03-LINEA-DE-ALCANCE-V1` | 🔴 **El que manda.** Qué entra y qué no |
| `02-PROYECTO/01-ALCANCE-Y-CRONOGRAMA` | La cotización |
| `03-SISTEMA/08` a `11` | Los RF que se agregan o se marcan fuera |
| `07-SPEC-KIT/*/CLAUDE.md` | Para que la IA no construya de más |
| `00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO` | Sección 12, "lo que el sistema NO hace" |

---

# 4 · CAMBIA ALGO DE LA WEB

| Qué cambió | Dónde se toca |
|---|---|
| Diseño de una pantalla | `06-MARCA/02-CLAUDE-DESIGN/01-COPY-Y-PANTALLAS` |
| Colores o tipografía | `06-MARCA/00-GUIA-DE-MARCA-WEB` + `SITIO WEB.../src/styles/tokens/` |
| Copy de la web | `06-MARCA/02-CLAUDE-DESIGN/01-COPY-Y-PANTALLAS` + el `.jsx` |
| SEO o metadatos | `06-MARCA/02-CLAUDE-DESIGN/02-SEO-Y-ESTRUCTURA` + `index.html` |
| Instrucciones a Antigravity | `SITIO WEB.../ANTIGRAVITY-LEEME` |

---

# 5 · SIEMPRE, PASE LO QUE PASE

```
   1.  05-CONTROL/BITACORA         entrada nueva arriba, con fecha y el POR QUÉ
   2.  05-CONTROL/PENDIENTES       abrir o cerrar lo que corresponda
   3.  00-EMPEZAR-AQUI/01-ESTADO   el semáforo
   4.  Regenerar los PDF
```

## Regenerar PDFs

```bash
cd /sessions/<sesion>/mnt/outputs
python3 -c "
import sys,pathlib
m=type(sys)('m'); exec(compile(open('md2pdf.py').read().split('if __name__')[0],'x','exec'),m.__dict__)
B=pathlib.Path('<ruta>/SISTEMA-MAX-GLOBAL')
n=0
for md in sorted(B.rglob('*.md')):
    if '_archivo' in str(md) or '99-FUENTES' in str(md): continue
    pdf=md.with_suffix('.pdf')
    if not pdf.exists() or md.stat().st_mtime>pdf.stat().st_mtime:
        m.convertir(md); n+=1
print(n,'PDFs')"
```

> El script completo `md2pdf.py` tarda más de 45 s y el shell lo corta. **Usa
> siempre la versión de arriba**, que solo convierte lo que cambió.

---

# 6 · AUDITORÍA — CÓMO VERIFICAR QUE TODO CUADRA

*Esto encontró errores reales dos veces. Vale la pena correrlo.*

```bash
cd <ruta>/SISTEMA-MAX-GLOBAL

# 1 · valores prohibidos que no deben existir
grep -rn "Café | S/. 75 |" --include=*.md . | grep -v _archivo
grep -rn "284 requisitos" --include=*.md . | grep -v BITACORA
grep -rn "⏳ \*sin definir\*" --include=*.md . | grep -v _archivo

# 2 · reglas de dinero: deben estar en los 5 archivos clave
for f in CLAUDE.md 01-NEGOCIO/01-PLAN-DE-COMPENSACION.md \
         07-SPEC-KIT/PROYECTO-2-SISTEMA/CLAUDE.md \
         07-SPEC-KIT/PROYECTO-2-SISTEMA/memory/constitution.md \
         03-SISTEMA/schema.sql; do
  printf "%-52s kit:%s rango:%s\n" "$f" \
    "$(grep -c '41.7' $f)" "$(grep -ci 'baja de rango\|rango_baja' $f)"
done

# 3 · PDFs desactualizados — debe dar 0
n=0; for md in $(find . -name '*.md' -not -path '*_archivo*' -not -path '*99-FUENTES*'); do
  pdf="${md%.md}.pdf"; { [ ! -f "$pdf" ] || [ "$md" -nt "$pdf" ]; } && n=$((n+1)); done
echo "PDFs viejos: $n"
```

## Y para la web

### 🔴 Verificación MÓVIL — agregada el 27/08

*Lo que faltaba. Auditar código no es auditar la experiencia.*

```bash
cd "SITIO WEB 06 PAGINAS LANDINGS"

# 1 · grids de 2 columnas que se rompen en 400px
grep -rn "gridTemplateColumns: '1fr 1fr'" src/

# 2 · páginas con grid pero SIN media query  -> debe salir vacío
for f in src/pages/*.jsx src/components/*.jsx; do
  g=$(grep -c "gridTemplateColumns" "$f"); m=$(grep -c "@media" "$f")
  [ "$g" != "0" ] && [ "$m" = "0" ] && echo "🔴 sin media query: $f"
done

# 3 · el patrón que causó el bug: columnas ASIMÉTRICAS (px + fr) en móvil
#     Un grid de 2 col con 5 hijos NO es un problema: los hijos se envuelven.
#     El problema es "36px 1fr" con hijos que necesitan ancho.
python3 - <<'PY'
import re,glob
for f in sorted(glob.glob('src/**/*.jsx',recursive=True)):
    t=open(f,encoding='utf-8').read()
    for m in re.finditer(r'\.([\w-]+)\s*\{[^}]*grid-template-columns:\s*([^;]+);', t):
        cls,cols=m.group(1),m.group(2).strip()
        if 'px' in cols and 'fr' in cols:
            print(f'⚠️  {f}  .{cls}: {cols}  ← columnas asimétricas''')
PY
```

**Y después, mirar de verdad:** abrir las páginas a 390px en el navegador.
Ninguna verificación automática reemplaza eso.

---

## Otras verificaciones de la web

```bash
cd "SITIO WEB 06 PAGINAS LANDINGS"

grep -rniE "gana(r|s)? S/|puedes ganar|ganarías" src/          # promesas → 0
grep -rniE "\bcura|previene|trata la|adelgaz" src/             # claims  → 0
grep -rn "55%" src/                                            # solo en Empresarial
ls public/_redirects public/robots.txt public/sitemap.xml      # deben existir
python3 -c "from PIL import Image;im=Image.open('public/images/og-image.jpg');print(im.size)"  # 1200x630
```

---

### 🔴 Verificación SEO — agregada el 27/08

> **Leer el código fuente NO sirve para auditar SEO.**
>
> Un robot de WhatsApp o de Facebook **no ejecuta JavaScript**. Solo ve el HTML
> que devuelve el servidor. Si las etiquetas las pone React, para el robot **no
> existen**.

```bash
cd "SITIO WEB 06 PAGINAS LANDINGS"

# 1 · ¿alguien en src/ pone etiquetas og:?  → si SÍ, es inútil para el robot
grep -rn "og:image\|og:title\|og:url\|twitter:" src/

# 2 · ¿el dominio está escrito a mano?  → debe estar en UNA variable
grep -ro "maxglobaloficial" index.html src/ public/ | wc -l

# 3 · ¿cuántos HTML genera el build?  → debe ser uno por ruta, no 1 solo
find dist -name "*.html" | wc -l
```

**Y la prueba que manda, ya publicado:**

```bash
# esto es literalmente lo que ve WhatsApp
curl -s https://DOMINIO/productos/cafe-moringa | grep -E 'og:title|canonical'

# debe decir "Coffee Capuccino", NO "Max Global Corporation"
```

**Herramientas oficiales:**

```
   Facebook Sharing Debugger   developers.facebook.com/tools/debug/
   Google Rich Results Test    search.google.com/test/rich-results
```

> **Probar ANTES de compartir el enlace con alguien.** WhatsApp cachea la
> tarjeta por mucho tiempo; si sale mal la primera vez, se queda pegada.

---

# 7 · LOS ERRORES QUE YA COMETIMOS

*Para no repetirlos.*

| Fecha | Qué pasó | Lección |
|---|---|---|
| 25/08 | Se usó 4.167 como valor del punto | Verificar cada número contra un ejemplo del cliente |
| 26/08 | El plan de compensación se quedó sin las 3 reglas nuevas | **La "ley" es lo primero que hay que actualizar** |
| 26/08 | 24 RF marcados ⏳ sobre cosas ya respondidas | Al cerrar un pendiente, buscar el símbolo en TODO el proyecto |
| 26/08 | El bloque del schema no se escribió: el guard se auto-detectó | No usar guards con texto que el mismo cambio introduce |
| 26/08 | Iba a preguntar algo que el cliente ya había respondido 3 veces | **Leer `02-RESPUESTAS-CONFIRMADAS` antes de escribir una pregunta** |
| 27/08 | La web tenía preloads a fuentes inexistentes y og:image de 4096px | Auditar los archivos generados, no solo el código |
| 27/08 | Se pidió la misión y visión **que ya estaban** en `99-FUENTES-ORIGINALES` | 🔴 **Revisar SIEMPRE `99-FUENTES-ORIGINALES` antes de preguntar.** Incluye los PDFs grandes que parecen ya vistos |
| 27/08 | **Se dio la Fase 1 por terminada con el móvil roto.** Una tabla de 4 columnas declaraba 2 en móvil; 4 páginas nuevas sin ninguna media query | 🔴 **Auditar código NO es auditar la experiencia.** Correr la verificación móvil de la sección 6 y mirar las páginas a 390px antes de decir "terminado" |
| 27/08 | **Se dio el SEO por terminado y las 14 páginas comparten la vista previa de la portada.** Se revisó que las etiquetas existieran, sin preguntarse si el robot llegaba a verlas | 🔴 **Para SEO, auditar el HTML SERVIDO, no el código.** El robot no ejecuta JavaScript. Correr la verificación SEO de la sección 6 |
| 28/08 | **El `schema.sql` tenía un `UPDATE` a una columna inexistente** (`precio_cent` en `producto`). Rompía la migración, y si pasaba dejaba el precio de socio como público | Antes de correr una migración, **comprobar que cada columna citada exista**. Un `UPDATE` correctivo al final del archivo es frágil: mejor el valor correcto en el `INSERT` |
| 28/08 | **Las 3 vistas eran SECURITY DEFINER y se saltaban las 47 políticas de RLS.** Un socio veía puntos, red y billetera de todos | 🔴 **Las vistas y funciones RPC también se auditan, no solo las tablas.** Correr `get_advisors` del MCP en toda tarea de base de datos |
| 28/08 | **Mis resúmenes decían "Ejecutivo 5 niveles" cuando son 3 de patrocinio y 5 de residual.** El motor habría pagado de más | 🔴 **Un resumen que pierde un matiz es peor que no resumir.** Si una regla tiene dos dimensiones, se escriben las dos o se remite a la fuente |
| 28/08 | **Antigravity declaró "linter: 0 advertencias" habiendo 4** | 🔴 **La salida de linters, pruebas y git se PEGA literal, no se resume.** Tercera vez que un reporte dice más de lo que la verificación respalda |

---

# 8 · MAPA RÁPIDO

| Busco | Voy a |
|---|---|
| Todo el negocio de un vistazo | `00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO` |
| **Cualquier cosa de la marca** | **`06-MARCA/00-MARCA-COMPLETA`** |
| Un dato suelto | `00-EMPEZAR-AQUI/02-REFERENCIA-RAPIDA` |
| Qué dijo el cliente exactamente | `04-CLIENTE/02-RESPUESTAS-CONFIRMADAS` |
| Por qué se decidió algo | `05-CONTROL/BITACORA` |
| Qué falta | `05-CONTROL/PENDIENTES` |
| Qué entra y qué no | `02-PROYECTO/03-LINEA-DE-ALCANCE-V1` |
| Reglas para la IA que programa | `CLAUDE.md` + las constituciones |
| Estado de la web | `SITIO WEB.../AUDITORIA-WEB` |
| **Contexto completo para una sesión nueva** | ⭐ **`00-EMPEZAR-AQUI/07-CONTEXTO-PARA-RETOMAR`** |
| **En qué punto está todo hoy** | **`00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO`** |
| Qué se avanzó el último día | `05-CONTROL/AVANCE-2026-08-27` |
| Instrucciones de la Fase 2 | `SISTEMA MOTOR Y BACKOFFICE/00-INSTRUCCIONES/` |
| **SEO, dominio y vistas previas** | **`SITIO WEB.../SEO-Y-DOMINIO`** |
| Qué falta para publicar la landing | `SITIO WEB.../LO-QUE-FALTA` |

---

**Creado el 27 de agosto de 2026.**

---

# 9 · ERRORES DEL 28/08 AL 1/09 — ampliación de la sección 7

*Doce entradas nuevas. Las de Antigravity y las mías, mezcladas a propósito:
las mías costaron igual de caro.*

| Qué pasó | La lección |
|---|---|
| El generador sorteaba patrocinador antes que pack, y `solo_afilia_igual` degeneró la red a 429 Emprendedores de 500 | **La restricción se aplica al elegir, no al filtrar después** |
| 45 movimientos de puntos tomaron los puntos del socio vecino, desde un arreglo paralelo | 🔴 **Los datos derivados se derivan de su propia fila** |
| `descuento_cent` se calculaba aplicando un % por segunda vez | **Que sea una resta: `subtotal − total`** |
| Se sustituyó una consulta de verificación por otra "parecida" y se reportó 0 filas | 🔴 **La consulta pedida se corre tal cual** |
| Corrupción nº10: 50 archivos truncados, `package.json` en `"@test` | **Validar el JSON al cerrar cada tarea** |
| Se borró `seed_chunks` y reapareció como `seed_batches`, luego dentro de `migrations` | 🔴 **Explicar la intención, no solo la orden** |
| Un seed dentro de `migrations/` con `TRUNCATE` | **Una migración se ejecuta sola. Los seeds no son migraciones** |
| Mi instrucción de activación omitió `cubre_activacion` — 122 socios mal | 🔴 **Si una regla tiene dos condiciones, se escriben las dos** |
| El resumen atribuyó al patrocinio la escala del residual | **Contrastar el resumen con la base y el deck** |
| Escribí consultas con `comision.socio_id`; es `beneficiario_id` | **Comprobar cada columna antes de citarla** |
| Diagnostiqué un `.git` corrupto que era una diferencia de versión de git | **Un fallo de mi herramienta no es evidencia sobre la del otro** |
| Se dio por bloqueada la TAREA-04B por los rangos 9–16, que ya estaban resueltos en el plan §5 | 🔴 **Leer la fuente antes de declarar un bloqueo** |

## La regla que resume las tres de arriba

```
   ANTES de decir que algo falta, está roto o bloqueado:
      1. Buscarlo en 01-NEGOCIO y 99-FUENTES-ORIGINALES
      2. Comprobarlo contra Postgres
      3. Recién entonces afirmarlo
```

---

# 10 · VERIFICACIÓN DEL MOTOR DE COMISIONES

*Agregada el 1/09. Estas 17 consultas se corren después de cualquier cambio en
el motor. Todas deben devolver 0 filas.*

```sql
-- dinero
SELECT id FROM comision WHERE monto_cent <= 0;
SELECT id FROM comision WHERE monto_cent <> round(base_cent*porcentaje/100);
SELECT id FROM comision c JOIN orden o ON o.id=c.orden_id WHERE o.estado<>'confirmada';

-- quién cobra
SELECT c.id FROM comision c JOIN activacion a
  ON a.socio_id=c.beneficiario_id AND a.ciclo_id=c.ciclo_id WHERE NOT a.activo;
SELECT c.id FROM comision c WHERE c.beneficiario_id = c.generador_id;
SELECT c.id FROM comision c WHERE c.generador_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM red_ancestro r WHERE r.descendiente_id=c.generador_id
    AND r.ancestro_id=c.beneficiario_id AND r.nivel=c.nivel);

-- niveles por pack
SELECT c.id FROM comision c JOIN socio s ON s.id=c.beneficiario_id
  JOIN pack p ON p.id=s.pack_id
WHERE (c.tipo='patrocinio' AND c.nivel > p.niveles_patrocinio)
   OR (c.tipo='residual'   AND c.nivel > p.niveles_residual);

-- residual solo sobre recompras
SELECT c.id FROM comision c JOIN orden o ON o.id=c.orden_id
WHERE c.tipo='residual' AND o.tipo='afiliacion';

-- rango
SELECT rc.socio_id FROM rango_ciclo rc JOIN rango r ON r.id=rc.rango_id
WHERE rc.califica AND r.definido = false;
SELECT socio_id FROM rango_ciclo WHERE bono_cent > 0 AND NOT califica;
SELECT socio_id FROM rango_ciclo WHERE puntos_computables > puntos_grupales;
SELECT socio_id FROM rango_ciclo WHERE puntos_linea_mayor > puntos_grupales;
SELECT rc.socio_id FROM rango_ciclo rc JOIN rango r ON r.id=rc.rango_id
WHERE rc.califica AND (rc.puntos_computables < r.puntos_grupales
                    OR rc.frontales_activos < r.frontales_activos);
SELECT act.socio_id FROM rango_ciclo act
  JOIN rango_ciclo ant ON ant.socio_id=act.socio_id AND ant.ciclo_id=act.ciclo_id-1
  JOIN rango ra ON ra.id=act.rango_id JOIN rango rn ON rn.id=ant.rango_id
WHERE act.bono_cent > 0 AND ra.orden < rn.orden;
```

## 🔴 Y la que de verdad prueba el motor: recalcular por fuera

No basta correr las consultas de arriba. **Hay que rehacer el cálculo desde los
datos crudos, sin usar nada del motor.**

```sql
-- puntos grupales recalculados desde cero. Debe dar 0 diferencias
WITH grupal AS (
  SELECT r.ancestro_id socio_id, m.ciclo_id, sum(m.puntos) pts
  FROM red_ancestro r
  JOIN movimiento_puntos m ON m.socio_id=r.descendiente_id AND m.cuenta_rango
  GROUP BY 1,2)
SELECT count(*) FROM rango_ciclo rc
LEFT JOIN grupal g ON g.socio_id=rc.socio_id AND g.ciclo_id=rc.ciclo_id
WHERE rc.puntos_grupales <> COALESCE(g.pts,0);
```

**Así se comprobó que las 1,503 filas estaban bien.** Es la diferencia entre
creerle al motor y verificarlo.

---

# 11 · ERRORES DEL BACKOFFICE — 1 y 2 de septiembre

| Qué pasó | La lección |
|---|---|
| 5 pantallas parecían hechas y eran maquetas con `datos-falsos` | **Una pantalla que muestra números no está terminada. Verificar de dónde vienen** |
| 501 socios y 0 usuarios en `auth.users`: nadie podía entrar | **Sin sesión, `fn_current_socio_id()` devuelve NULL y RLS no da nada** |
| `fn_confirmar_orden_pago` insertaba en `movimiento_puntos.tipo`, que no existe | **Comprobar cada columna en `information_schema` antes de escribir un INSERT** |
| El bug anterior no se detectó: solo se probó con un Kit de 0 puntos | 🔴 **Un caso que esquiva la rama peligrosa no prueba nada. Una orden de CADA pack** |
| La función no fijaba `cuenta_residual`: las afiliaciones habrían pagado residual | **Los campos con default se fijan explícitamente cuando la regla depende de ellos** |
| Ponía `activo = true` sin mirar los 70 puntos | **La regla de activación tiene dos condiciones. Se escriben las dos** |
| Dejaba la orden en `'pagada'` y el motor filtra por `'confirmada'` | **Un vocabulario nuevo rompe lo que ya funciona. Alinearse con lo existente** |
| 🔴 `fn_test_limpiar_socios_prueba` borraba socios, sin control y con `anon` | 🔴 **NINGUNA función que borre datos sin validar quién llama. Y una utilidad de pruebas NO se despliega** |
| Las pruebas dejaron 14 socios colgados de ANA | **Las pruebas limpian lo que crean, por id explícito, no por rango** |
| `califica` significaba a la vez "alcanzó" y "cobra" | **Un campo, un concepto. Si no, la pantalla miente sin querer** |
| Corrupciones 12, 13 y 14 en 24 horas, siempre reportadas como limpio | 🔴 **Verificar `git status --short` uno mismo. Siempre** |

## 🔴 La regla que resume el peor incidente

```
   ANTES de crear una función en la base:
      1. ¿Puede borrar o modificar datos?
      2. Si sí → ¿valida fn_is_admin() o fn_current_socio_id()?
      3. ¿Está revocada para anon?
      4. ¿Es una utilidad de pruebas? → entonces NO va a la base
```

**La clave pública del frontend es pública por diseño.** Cualquiera puede
llamar a cualquier función que `anon` tenga permitida.

---

# 12 · VERIFICACIÓN DEL BACKOFFICE

*Estas consultas se corren después de cualquier tanda de pantallas.*

```sql
-- 🔴 0 filas: ninguna función con anon Y sin control de quién llama
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prosecdef
  AND array_to_string(p.proacl,' ') LIKE '%anon=X%'
  AND pg_get_functiondef(p.oid) NOT LIKE '%fn_is_admin%'
  AND pg_get_functiondef(p.oid) NOT LIKE '%fn_current_socio_id%';

-- 🔴 0 filas: ninguna función de pruebas desplegada
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname LIKE '%test%';

-- la red no cambió de tamaño
SELECT (SELECT count(*) FROM socio) socios,        -- 501
       (SELECT count(*) FROM orden) ordenes,       -- 1048
       (SELECT count(*) FROM comision) comisiones, -- 2418
       (SELECT count(*) FROM red_ancestro) red,    -- 3887
       (SELECT max(id) FROM socio) max_socio;      -- 501

-- 🔴 0 filas: el libro contable sigue limpio
SELECT id FROM comision WHERE monto_cent <= 0;

-- la billetera se llena SOLO en el cierre de ciclo
SELECT count(*) FROM wallet_movimiento;            -- 0 hasta la tanda 5
```

## Y la de integridad de archivos, después de cada tarea

```bash
git status --short          # tiene que estar VACÍO
git diff --numstat          # si hay más borrado que añadido, mirar
```

**Si un archivo tiene menos líneas en disco que en HEAD, está cortado.**
Se restaura con `git show HEAD:archivo > archivo`.
