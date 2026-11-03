# LECCIONES Y PATRONES DE ERROR

**Escrito:** 15 de septiembre de 2026
**Para:** Jack, Claude y Antigravity — los tres

> Este documento existe porque los mismos errores volvieron tres y cuatro veces
> con nombres distintos. **Léelo antes de escribir una tarea o de dar por bueno
> un reporte.**
>
> No es teoría: cada patrón trae el caso real que lo produjo y la fecha.

---

# EL PATRÓN QUE ESTÁ DETRÁS DE CASI TODO

```
   Un valor escrito a mano que era CORRECTO el día que se escribió,
   y se volvió falso cuando el mundo alrededor cambió.
```

Todos estos son el mismo error con distinta cara:

| Dónde | Valor | Era cierto | Dejó de serlo |
|---|---|---|---|
| `ArmazonSocio.jsx` | `'Agosto 2026'` | agosto | septiembre |
| `P27GestionSocios:60` | `useState(4)` | con 4 ciclos | con 6 |
| `P27:527` | `'Septiembre 2026'` | septiembre | noviembre |
| 5 pantallas | `useState(3)` | con 3 ciclos | con 30 |
| TAREA-25 | `auth.users = 366` | antes de las pruebas | tras la primera corrida |
| 6 pruebas | `toBe(509)` socios | antes del QA | al crear un socio |
| `20260906000004` | URL del proyecto demo | en la demo | en producción |

```
   🔴 Antes de escribir un número en el código, pregunta:
      ¿esto puede cambiar solo, sin que nadie toque este archivo?
      Si la respuesta es sí, NO va escrito a mano.
```

## Lo que sí puede ir escrito a mano

No todo número fijo está mal. **Lo que no crece con el uso, se queda:**

```
   ✅ 38 claves de config · 16 rangos · 5 packs
   ✅ 25 filas por página · top 10
   ✅ 10 niveles de residual · 7 de patrocinio
   ✅ 19 y 21 dígitos de CCI
   ✅ precios, puntos, porcentajes del plan
      (esos SON la regla de negocio: si cambian, es un bug)

   🔴 conteos de socios, órdenes, comisiones, cuentas auth,
      filas de red_ancestro
      → crecen cada vez que alguien usa el sistema
```

---

# LOS QUINCE PATRONES, CON SU CASO REAL

> Del 1 al 10 son de septiembre. Del 11 al 15 salieron
> de la semana del 20 de septiembre al 2 de octubre,
> y son los que más caro costaron.
>
> El 11 no habla del programador: habla de quien
> escribe la tarea.

## 1 · Inventar el nombre de un valor en vez de comprobarlo

```
   4/09   pedí activacion.puntos_grupales
          → esa columna NO existe. HTTP 400. Dos horas perdidas.

   8/09   filtré orden.estado = 'pendiente'
          → el valor real es 'por_confirmar'. Reporté 0 donde había 8.

   8/09   filtré solicitud.estado = 'pendiente'
          → el valor real es 'nueva'. Reporté 0 donde había 127.
```

```
   ✅ ANTES de filtrar por un valor:
      SELECT estado, COUNT(*) FROM tabla GROUP BY estado;

   ✅ ANTES de pedir una columna:
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'x';
```

## 2 · Arreglar el caso, no el patrón

```
   TAREA-27  encontré useState(4) en P-27 y lo arreglé.
             Pedí barrer los MESES escritos a mano.
             NO pedí barrer los CICLOS.
             → 5 pantallas se quedaron rotas 12 días más.
```

```
   ✅ Al encontrar un defecto, buscar el MISMO patrón en
      todo el código ANTES de arreglar nada.
      Pegar la lista completa. Después corregir.
```

> El que escribió ese defecto lo escribió igual en los otros sitios, el mismo
> día, con la misma idea en la cabeza.

## 3 · Verificaciones que su propio trabajo destruye

```
   TAREA-25  "auth.users debe seguir en 366"
             Pero las pruebas registran socios de verdad.

   TAREA-26  "SELECT ... WHERE id = <el id de prueba>"
             Las pruebas limpian sus datos al terminar.
```

```
   ❌ Verificar una FILA que las pruebas borran
   ✅ Verificar una INVARIANTE que sobrevive:
      · la función CONTIENE la guarda
      · CERO filas existentes pueden romperse
      · los conteos certificados no se movieron
```

```
   La prueba: si la verificación no se puede volver a correr
   mañana y dar lo mismo, no es una verificación.
```

## 4 · Sacar conclusiones de una operación aritmética

```
   4/09   corrí MIN(imagen_url) sobre 1,049 vouchers,
          salió un placehold.co y concluí que los 1,049
          eran placeholders. Acusé a Antigravity de borrar
          datos históricos. Era falso.

   7/09   resté 510 − 366 y dije "144 socios sin login".
          El conteo real: 22 de 508. Los 366 no eran socios,
          eran cuentas de prueba acumuladas.

   8/09   para hallar la clave que P-26 oculta, ordené las 39
          alfabéticamente y tomé 38. Eso devuelve la última
          del abecedario, no la oculta.
```

```
   ✅ COUNT(*) FILTER (WHERE ...) — nunca MIN ni una resta
   ✅ Nunca generalizar desde un ejemplo
```

## 5 · Comparar datos sembrados con datos reales

```
   7/09   ciclo 1-3: 501 filas de activación
          ciclo 4-6: 2 o 3 filas
          Leí "el cierre está roto". No lo estaba.

          Los ciclos 1-3 son SEMBRADOS: una fila por socio.
          Los 4-6 son operación REAL: solo quien compró.
```

```
   ✅ Antes de llamar avería a una diferencia, preguntar:
      ¿estos datos son del seed o los generó el sistema?
```

## 6 · Dar por buena una explicación que el código no sostiene

```
   14/09  Antigravity reportó "P-23 no atrapa el error 400
          y muestra un banner verde falso".

          El código SÍ lo atrapa:
            operacionAdmin.js:217   if (error) throw error;
            P23:244                 catch → muestra el error

          Al reproducirlo: el banner era ROJO. El éxito falso
          NUNCA existió. Falló el script que redactaba el reporte.
```

```
   🔴 Estuvimos a punto de "corregir" código sano.
      Lo evitó que Jack dijera: "no vaya a ser que te
      estés confundiendo".
```

```
   ✅ Antes de corregir, confirmar la CAUSA con evidencia,
      no con una explicación verosímil.
   ✅ "No pude determinar la causa" es una respuesta válida
      y mejor que una hipótesis presentada como hecho.
```

## 7 · Escribir el mismo archivo por dos rutas distintas

```
   15/09  Claude editó MANUAL-DE-OPERACION.md por la ruta de
          Windows y, segundos después, corrió un sed sobre el
          mismo archivo por la ruta de Linux.

          Las dos rutas son la MISMA carpeta vista desde dos
          sitios, pero NO se sincronizan al mismo ritmo.

          El sed leyó la versión vieja y la escribió encima.
          Se perdieron 5 secciones del manual: el capítulo 7,
          las reglas del negocio, las preguntas frecuentes y
          el soporte.

          No había copia. No había git. El PDF bueno ya se
          había recompilado encima.
```

```
   🔴 Lo peor no fue perderlo: fue no notarlo.
      El PDF bajó de 14 a 12 páginas DESPUÉS de añadirle
      contenido, y eso pasó desapercibido en el primer vistazo.
```

```
   ✅ Un archivo se toca por UNA sola ruta en toda la sesión.
      O las herramientas de edición, o bash. Nunca las dos.
   ✅ Si un documento ENCOGE después de agregarle cosas,
      parar. Eso no pasa por casualidad.
   ✅ Antes de recompilar un PDF encima del bueno, comprobar
      que el fuente sigue completo (última sección, wc -l).
```

## 8 · Caracteres que el PDF tira en silencio

```
   15/09  Los 🔴 del manual NO existían en el PDF.
          Ni la fuente de marca ni la monoespaciada tienen
          ese carácter, y xelatex lo descarta con un aviso
          que se pierde entre cientos de líneas de salida.

          Resultado: los avisos más importantes del manual
          salían impresos sin ninguna marca.
```

```
   ✅ Los emojis valen para los .md que se leen en pantalla.
      En lo que se compila a PDF, van en texto: AVISO ·
   ✅ Después de compilar:  grep -c "missing char"
```

## 9 · Dos sitios guardando la misma verdad

El patrón más caro de todos, porque no falla: **miente en silencio.**

```
   16/09  Auditoría de la documentación.

          22 de 96 PDF eran MÁS VIEJOS que su propio .md.
          Los peores, 21 días atrás.

          Y CUATRO documentos distintos decían qué faltaba:
            PENDIENTES.md            4/09
            PLAN-DE-CIERRE-V1.md     4/09
            SEGUIR-AQUI.md           4/09
            01-ESTADO-DEL-PROYECTO   al día

          PENDIENTES afirmaba que faltaba conectar el dominio,
          subir el voucher, el campo CCI y crear el proyecto
          limpio. Las cuatro estaban hechas hacía días.
```

```
   🔴 Nadie mintió y nadie se equivocó al escribir.
      Cada documento era correcto el día que se escribió.
      Lo que falla es tener más de uno.
```

```
   ✅ Una sola lista viva de pendientes:
      00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO.md
   ✅ Lo que se congela lleva aviso arriba, diciendo
      QUÉ de lo que afirma ya es falso y a dónde ir.
   ✅ Un PDF más viejo que su .md se borra, no se tolera.
   ✅ Antes de crear otro documento de "qué falta",
      preguntarse por qué no sirve el que ya existe.
```

## 10 · Rellenar el hueco en vez de dejarlo vacío

El más difícil de detectar, porque el trabajo **está bien hecho**. Lo que falla
es el informe.

```
   17/09  Tres veces en tres tareas seguidas:

   TAREA-44  tabla "Estado DESPUÉS" con permisos que
             aún no se habían aplicado

   TAREA-45  tabla de "paridad" del bono de rango
             comparando los datos viejos contra sí mismos
             (la función devolvió yaExistia y no calculó)

   TAREA-48  desglose por tipo del estado ANTES,
             reconstruido: decía 245 comisiones más
             sumando lo mismo, lo cual exige que valgan
             cero. Ninguna valía cero.
```

```
   🔴 En los tres casos el ARREGLO era correcto.
      Lo inventado era la evidencia de que lo era.
```

```
   ✅ Si no se midió, no va en una tabla.
      "No guardé el estado anterior" es una respuesta
      correcta y no le quita mérito a nada.
   ✅ Una tabla de resultados solo lleva lo que se
      consultó DESPUÉS de hacer el cambio.
   ✅ Lo que falta por ejecutar va en la PRIMERA línea
      del informe, no en un paréntesis.
```

```
   Un informe con un hueco honesto vale más que uno
   completo con una fila reconstruida: el hueco cuesta
   una pregunta, la fila inventada obliga a verificar
   todo lo demás.
```

## Cómo se detectan los tres

Ninguno hizo falta leer el código. Se cazaron **haciendo la aritmética del
propio informe**:

```
   · 245 filas más que suman lo mismo
     → solo si valen cero → comprobar → ninguna vale cero

   · 531 + 691 + 23 = 1.245
     → pero el límite era 1.000

   · "yaExistia: true"
     → entonces no calculó nada
```

Antes de creer una tabla, sumarla.

---

# APÉNDICE · EL PATRÓN 7, COMETIDO OTRA VEZ

> Los patrones 11 al 15 vienen **después** de este apéndice.
> Se añadieron más tarde y se dejaron al final para no
> mover lo que ya estaba escrito — que es, precisamente,
> de lo que habla este apéndice.

```
   17/09  Claude añadió el patrón 10 a ESTE archivo con la
          herramienta de edición, y acto seguido corrió un
          sed por la ruta de Linux para cambiar
          "NUEVE PATRONES" por "DIEZ PATRONES".

          El sed leyó la versión anterior y la escribió
          encima. El patrón 10 desapareció, y el archivo
          quedó cortado a media frase — con la cabecera
          diciendo DIEZ y solo nueve dentro.
```

```
   Lo escribí el mismo día que documenté el patrón 7,
   en el archivo que lo documenta.

   Saber la regla no basta. La regla se cumple sola solo
   si nunca se mezcla: un archivo, una ruta, toda la sesión.
```

---

# 11 · La tarea mal escrita · ESTE PATRÓN NO ES DEL PROGRAMADOR

Los diez anteriores hablan de cómo se verifica el código. Este habla de cómo se
escribe la orden, y el responsable es quien la redacta.

## El caso

El 1 de octubre se descubrió que **el cierre del mes nunca ha pagado el Bono de
Rango**. Desde la TAREA-45, el 15 de septiembre. Dieciséis días.

El origen está en el propio documento de la TAREA-45, líneas 124-127:

```
   "Y LO IDEAL ES que fn_ejecutar_cierre_ciclo llame
    dentro a fn_calcular_y_persistir_rangos, para que
    cerrar el mes sea una sola transacción de principio
    a fin. Si ves un motivo para no hacerlo así, dilo
    antes de decidirlo tú."
```

```
   "Lo ideal es."

   Todo lo demás de esa tarea estaba en imperativo.
   "Mover el cálculo." "NO devuelvas el permiso."

   La única frase en condicional era la que decidía
   si se paga un bono de hasta S/. 10.000 al mes.
```

## Y lo que lo remató

En la línea 116 del mismo documento se pegó el código nuevo de
`ejecutarCierreCiclo`, ya escrito:

```js
   export async function ejecutarCierreCiclo(cicloId, sbClient) {
     const { data, error } = await sbClient.rpc('fn_ejecutar_cierre_ciclo', {
       p_ciclo_id: Number(cicloId)
     });
```

Antes, esa función hacía dos cosas: persistía los rangos y después cerraba. **El
ejemplo que se pegó traía el primer paso ya borrado.**

```
   El frontend dejó de llamar al motor de rangos
   porque el ejemplo se lo quitó.

   La base nunca empezó a llamarlo porque solo
   se sugirió.

   El paso desapareció en el hueco entre los dos.
```

## Por qué no lo cazó nadie

La misma tarea pedía la comprobación correcta, en la línea 138:

```
   "En la DEMO, en un ciclo abierto con al menos un
    socio QUE CALIFIQUE A RANGO, cerrar el mes.
    Debe funcionar y escribir las comisiones de rango."
```

Esa prueba falla. Nunca se ejecutó sobre un ciclo con alguien que calificara, y
el informe se dio por bueno.

Después se escribió una prueba automática que **simulaba** que el cierre llamaba
al motor, y verificaba su propia simulación. Quedó en verde dieciséis días
(patrón 10, aplicado a una prueba en vez de a un dato).

## Las dos reglas

```
   1 · TODO lo que toca dinero va en imperativo.

       Nada de "lo ideal", "convendría", "sería bueno",
       "si ves un motivo, dilo".

       O DEBE, o no está en la tarea.

   2 · El código de ejemplo que se pega ES el código
       final.

       No un esqueleto al que le falte un paso que
       se espera que alguien añada en otro sitio.
       Se copia literal. Si el ejemplo tiene el
       hueco, el hueco se instala.
```

```
   Un documento de tarea no es una conversación.
   Es código que ejecuta una persona.

   Y una ambigüedad en un camino de dinero no se
   resuelve preguntando: se resuelve desapareciendo
   el paso.
```

---

# 12 · El informe que no coincide con sus propios archivos

El código sale bien. El informe sale falso. Y como el informe es lo único que se
usa para verificar, **el trabajo bueno no se puede confirmar.**

## Los casos, todos de la misma semana

```
   "config.js:46"                  era la 66
   "fn_cierre_ciclo_definitivo"    no existe · es
                                   fn_ejecutar_cierre_ciclo
   "P25VistaPreviaCierre.jsx"      no existe · es
                                   P25CierreCiclo.jsx
   "P30RetirosAdmin.jsx"           no existe
   "ModalAvisoCCI.jsx"             no existe
   "fecha_activacion, creado_en"   no existen · es
                                   calculado_en
   "8 rangos: Rubí, Diamante
    Azul, Diamante Corona"         no existen · son
                                   Plata, Oro, Platino
   "13 de 13 verificados"          eran 8
   "firma (p_producto_id, ...)"    es (p_id, ..., p_datos_antes)
   capturas nombradas en el
   informe                         no estaban en el
                                   repositorio · dos veces
```

Una decena de veces en doce días.

## El que llegó más lejos

```
   2/10 · El guion de reparación de PRODUCCIÓN
          falló al ejecutarse:

   ERROR: column "fecha_activacion" of relation
          "activacion" does not exist
```

La tabla tiene cinco columnas y están escritas en `01-esquema.sql:273`. Bastaba
abrir el archivo. **Lo salvó el BEGIN/COMMIT, no el método.**

## El patrón 1 no lo cubre

```
   Patrón 1   inventarse un VALOR
   Patrón 12  inventarse DÓNDE ESTÁ algo

   El primero mete un número falso en el código.
   El segundo deja el código bien y la prueba de
   que está bien, mal.
```

## La regla

```
   🔴 Antes de escribir una línea, una firma, un
      nombre de columna o una ruta en un informe:
      ÁBRELA.

   Un informe sin verificar no es documentación,
   es una afirmación.
```

---

# 13 · La prueba que compara una constante contra la misma constante

## El caso

```
   operacionAdmin.js:646   let totalEmpresaCent = 2763564;
   cierre-ciclo.test.js:51 expect(...).toBe(2763564);
```

El servicio devolvía un número escrito a mano. La prueba afirmaba ese mismo
número escrito a mano.

```
   En verde desde el 2 de septiembre.
   Tres semanas certificando una mentira.

   Esa cifra salía en la pantalla de cierre, que
   es la que Máximo mira para decidir si cierra
   el mes.
```

Y el origen de la cifra: alguien confundió **el margen comercial** con **las
comisiones retenidas** y restó `41.115,32 − 13.479,68 = 27.635,64`.

## La variante, catorce días después

```
   persistencia-rango.test.js:177

   if (nombre === 'fn_ejecutar_cierre_ciclo') {
     // En Postgres real, fn_ejecutar_cierre_ciclo
     // ejecuta fn_calcular_y_persistir_rangos primero
     const res = await this.rpc('fn_calcular_y_persistir_rangos', args);
```

La prueba **simulaba** que el cierre llamaba al motor de rangos, y después
verificaba que lo había llamado. Inventaba el comportamiento y comprobaba su
propio invento.

```
   El cierre llevaba 16 días sin pagar el bono
   de rango. La prueba estuvo en verde los 16.
```

## Cómo se detecta

```
   🔴 Pregunta de una línea:

      ¿Esta prueba PUEDE fallar alguna vez?

   Si el valor esperado y el valor producido
   salen del mismo sitio, no puede.

   Y una prueba que no puede fallar no prueba
   nada: solo da permiso.
```

---

# 14 · Verificar el repositorio en vez de lo publicado

## El caso

```
   20/09 · Se verifican, una por una, las tareas
           44 a la 54. Todas correctas en el código.
           Se dan por hechas.

   21/09 · Se mira QUÉ ESTÁ PUBLICADO:

           Vercel      commit c25bd54 · 15/09
           GitHub      4 commits por delante
           La máquina  94 archivos sin commitear
```

**Once tareas vivían solo en el portátil de Jack. Dieciséis días.**

Entre ellas: los permisos de dinero, el cierre transaccional, el motor que ya no
tiraba comisiones, y las pantallas del patrocinio al instante.

## Por qué fue peligroso

```
   La BASE DE DATOS sí tenía todos los cambios.
   Las PANTALLAS eran del 15 de septiembre.

   Producción corría con una combinación que
   nunca se probó junta.
```

Y una consecuencia concreta: el código publicado cerraba el ciclo escribiendo
desde el navegador, y la TAREA-44 ya le había quitado ese permiso. **Si Máximo
hubiera intentado cerrar el mes, le habría fallado.**

## La regla

```
   🔴 "Está arreglado" y "está publicado" son dos
      estados distintos.

   Una tarea que toca dinero no está cerrada hasta
   que el hash del commit publicado es el mismo
   que el de la rama.

   Y eso se COMPRUEBA, no se asume.
```

---

# 15 · El entregable generado que nadie volvió a abrir

## Los casos

```
   01-MANUAL-DE-OPERACION.pdf
     Generado desde una copia truncada del .md.
     Le faltaban las Preguntas frecuentes y el
     Soporte enteros. Detectado al comprobar el
     PDF después de generarlo.

   03-ACCESOS/FICHA-DE-ACCESOS.pdf
     Terminaba a media frase:
       "el socio tendrá que us"
     Sin la sección de Soporte, sin el correo
     al que escribir.

     🔴 Ese PDF se le entregó al cliente el 16/09
        y nadie lo abrió hasta el 23.

   04-PLAN-DE-COMISIONES/01-Plan-de-compensacion.pdf
     10 páginas cuando el texto fuente daba 13.
     Llevaba semanas tres páginas por detrás.
```

## Por qué pasa

```
   Generar un PDF casi nunca falla con un error.
   Falla produciendo un PDF más corto.

   Y un archivo de 170 KB con el logo bien puesto
   parece correcto desde fuera.
```

## La regla

```
   🔴 Después de generar un entregable, ÁBRELO
      y busca dentro algo del final.

   No el peso. No que exista. Una frase de la
   última página.

   Y si sustituye a uno anterior, compara las
   páginas: si bajan, algo se perdió.
```

Es el patrón 8 (caracteres que el PDF tira en silencio) llevado al documento
entero.

---

# 16 · Asumir que los estados o rangos solo avanzan de uno en uno

## El caso

```
   15/10 · En P-15 (Mi Rango), la meta en ciclo abierto se fijaba rígidamente
           haciendo: meta = rango_honorífico_anterior + 1.

           Sonia Escobar cerró septiembre como Jade (orden 1).
           En octubre, su red generó 7,492 puntos y 4 frontales activos.
           Calificaba en vivo a Plata (orden 3) y tenía números para Oro (orden 4).

           Pero la tarjeta central le mostraba:
           "Rango en Curso: Bronce (Calificando)" con meta en Bronce (1,000 pts).
           Mientras tanto, la barra lateral le ponía "Vigente: Plata".
```

El código asumió que ningún socio puede saltar dos o tres rangos en el mismo ciclo.
Una líder con red explosiva dejó en evidencia la contradicción visual en plena reunión de Zoom con el cliente.

## La regla

```
   🔴 NUNCA calcular la meta futura basándose en el escalón del mes pasado + 1.
   
   En ciclo abierto, se debe evaluar dinámicamente de mayor a menor jerarquía
   cuál es el rango más alto alcanzado HOY en vivo, y la siguiente meta
   debe ser (rango_actual_en_vivo + 1).

   Las transiciones de estado deben admitir saltos múltiples.
```
