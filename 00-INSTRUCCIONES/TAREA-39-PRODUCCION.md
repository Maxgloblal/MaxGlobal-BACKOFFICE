# TAREA-39 · A PRODUCCIÓN

**Para:** Antigravity y Jack — **esta se hace entre los dos**
**Escrita:** 15 de septiembre de 2026

> ## 🔴 ESTA TAREA CREA EL SISTEMA REAL
>
> A partir de aquí entra gente de verdad, con dinero de verdad.
> **No hay "deshacer".**
>
> Cada paso tiene una comprobación. Si una falla, se PARA y se avisa.
> No se sigue al siguiente paso "a ver si se arregla solo".

---

# LO QUE YA ESTÁ PROBADO — por eso podemos hacer esto

```
   ✅ El instalador levanta el sistema desde cero  (TAREA-35)
   ✅ Los 3 bonos pagan los importes exactos       (TAREA-36)
   ✅ Línea estirada · sin compresión · sin activación no cobra
   ✅ Upgrade · baja con reenganche · retiro · CSV
   ✅ 0 incoherencias en red_ancestro
   ✅ 386 pruebas verdes · QA del navegador completo
```

---

# PASO 1 · BORRAR EL PROYECTO DE ENSAYO

```
   uesyashbodhvlqchuokj · max-global-ENSAYO
```

La organización de Máximo solo admite **2 proyectos activos** en plan gratuito.
Hoy tiene la demo y el ensayo. **Sin borrar el ensayo, producción no entra.**

```
   🔴 Antes de borrarlo, comprueba que el reporte de la
      TAREA-36 está commiteado con todas sus cifras.
      Una vez borrado, esos datos no vuelven.
```

```
   ✅ Comprobación: la organización queda con 1 proyecto activo
```

**PARA y avisa a Jack antes de borrar.**

---

# PASO 2 · CREAR EL PROYECTO DE PRODUCCIÓN

```
   Organización   ftnuuzhlmjkfeghsuvgv · Maxgloblal's Org
   Nombre         max-global-produccion
   Región         sa-east-1 (São Paulo)
```

```
   🔴 NO lo crees en idenzasite-ESP. Esa es la otra empresa
      de Jack.
```

```
   ✅ Comprobación: el proyecto aparece ACTIVE_HEALTHY
```

---

# PASO 2-BIS · 🔴 EL CORREO DEL ADMIN — antes del instalador

## El problema, verificado el 15/09

```
   supabase/instalador/07-admin.sql:25
   v_admin_email text := 'admin@maxglobal.com';
```

```
   1 · El dominio real es maxglobaloficial.com, no maxglobal.com
   2 · Ese buzón NO EXISTE. Nadie recibe nada.
   3 · 🔴 "¿Olvidaste tu contraseña?" mandaría el enlace de
        recuperación a un correo que nadie lee.
        Si Máximo pierde la clave con 200 socios adentro,
        NO hay forma de recuperar la cuenta de administrador.
```

Y además está escrito a mano: el mismo patrón que este proyecto lleva semanas
corrigiendo.

## Lo que hay que hacer

```
   1 · El instalador PIDE el correo, no lo inventa.
       Puede ser un parámetro, una variable, o pedirlo
       por consola. Lo que NO puede es venir escrito.

   2 · Si no se le pasa ninguno, FALLA con un mensaje claro.
       🔴 NUNCA caer en un valor por defecto: el valor por
          defecto es justo lo que rompe la recuperación.

   3 · El correo a usar, decidido por Jack el 15/09:

       soportesmaxglobal01+admin@gmail.com

       Es una SUBDIRECCIÓN de Gmail (alias con "+").
       Gmail la entrega a la bandeja de
       soportesmaxglobal01@gmail.com, y Supabase la trata
       como una dirección distinta.
```

## Comprobado antes de decidirlo

```
   ✅ Ningún validador del sistema filtra caracteres del
      correo: el "+" pasa sin problema
   ✅ La recuperación de contraseña llegará a la bandeja
      de soportesmaxglobal01@gmail.com
```

## 🔴 Lo que hay que probar SÍ O SÍ en el paso 7

```
   El "+" es el carácter que más veces rompe un formulario
   o una URL de recuperación, porque en algunos sitios se
   interpreta como un espacio.

   Hay que probar de verdad:
   · entrar con soportesmaxglobal01+admin@gmail.com
   · pedir recuperación de contraseña
   · abrir el enlace que llegue y cambiarla
```

## 📌 Nota para la entrega

```
   Este correo entrega los avisos a la bandeja de JACK.
   Funciona perfecto para arrancar, pero significa que hoy
   la recuperación del administrador pasa por él.

   Cuando Máximo dé un correo suyo, se cambia:
   es una fila en `socio` y una en `auth.users`.
   Anotado como pendiente de entrega, no bloquea nada.
```

```
   ✅ Comprobación: grep de 'admin@maxglobal.com' en
      supabase/instalador/ debe quedar VACÍO
```

> **Este correo es la llave de la cuenta de administrador.** Tiene que ser un
> buzón que Máximo abra de verdad, porque es por donde va a recuperar el acceso
> el día que lo pierda.

---

# PASO 3 · CORRER EL INSTALADOR

```
   supabase/instalador/
   Los 8 módulos EN ORDEN, más subir-fotos.mjs

   🔴 07-admin.sql se corre CON el correo de Máximo,
      el que Jack te pase. No con ninguno escrito a mano.
```

```
   🔴 GUARDA LA CONTRASEÑA DEL ADMIN que imprime 07-admin.sql.
      Se muestra UNA sola vez. Si se pierde, hay que
      recuperarla con "olvidé mi contraseña".
```

## Comprobaciones obligatorias

```sql
SELECT
 (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname LIKE 'fn_%') funciones,
 (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_type='BASE TABLE') tablas,
 (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public') politicas,
 (SELECT COUNT(*) FROM config) config,
 (SELECT COUNT(*) FROM pack) packs,
 (SELECT COUNT(*) FROM rango) rangos,
 (SELECT COUNT(*) FROM producto) productos,
 (SELECT COUNT(*) FROM producto WHERE imagen_url LIKE '%utlohnid%') fotos_de_la_demo,
 (SELECT COUNT(*) FROM socio) socios,
 (SELECT COUNT(*) FROM ciclo WHERE estado='abierto') ciclos_abiertos,
 (SELECT COUNT(*) FROM orden) ordenes,
 (SELECT COUNT(*) FROM comision) comisiones;
```

```
   funciones 25 · tablas 23 · políticas 49
   config 39 · packs 5 · rangos 16 · productos 8
   fotos_de_la_demo        0     🔴 si no es 0, PARA
   socios                  1     solo el admin
   ciclos_abiertos         1
   órdenes y comisiones    0
```

```
   🔴 Si CUALQUIERA de estos no coincide, PARA.
      No sigas al paso 4.
```

---

# PASO 4 · 🔴 LA PRUEBA DE VIDA, ANTES DE CONECTAR NADA

**Con el sistema apuntando a producción en local**, no en Vercel todavía:

```
   a · Entra el admin con la clave del instalador
   b · Registra UN socio de prueba
   c · Ese socio entra con su clave temporal y la cambia
   d · Se le registra una recompra y se confirma
   e · Sus puntos se acreditan
```

```
   🔴 NO cierres el ciclo. NO afilies a nadie más.
   🔴 Al terminar, BORRA ese socio de prueba y su cuenta
      de auth. Producción tiene que quedar con 1 socio: el admin.
```

```
   ✅ Comprobación final: socios = 1 · órdenes = 0 · comisiones = 0
```

> Si esto falla, es infinitamente mejor descubrirlo ahora que con Máximo
> afiliando gente.

---

# PASO 5 · REPUNTAR LOS DOS VERCEL

Las dos aplicaciones usan las mismas dos variables:

```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
```

```
   En Vercel → max-global-backoffice → Settings → Environment Variables
   En Vercel → max-global-landing    → Settings → Environment Variables

   Cambiar las dos al proyecto de PRODUCCIÓN.
   Después: Redeploy de los dos.
```

```
   🔴 La landing NECESITA esas variables en el BUILD:
      scripts/generar-catalogo.mjs consulta Supabase al
      compilar. Si apuntan mal, publica el catálogo
      equivocado.

   🔴 El respaldo escrito en el código apunta a la DEMO.
      Si las variables faltan, la landing se construye
      contra la demo SIN avisar. Ponlas bien.
```

## Comprobación

```
   · Abre el backoffice: el login carga
   · Entra con el admin de PRODUCCIÓN
   · P-27 debe decir 1 socio, no 509
     🔴 Si dice 509, sigue apuntando a la demo. PARA.
   · Abre la landing: los 8 productos con sus fotos
   · Mira la URL de una foto en F12:
     debe ser del proyecto NUEVO
```

---

# PASO 6 · EL DOMINIO

**Solo cuando el paso 5 esté verde.**

```
   1 · Conectar maxglobaloficial.com al proyecto
       max-global-landing en Vercel
   2 · Esperar a que el certificado quede activo
```

## 🔴 Y LO QUE SIEMPRE SE OLVIDA

```
   P-26 → url_landing → https://maxglobaloficial.com
```

```
   Si no se cambia, los enlaces de referido de TODOS los
   socios seguirán apuntando a vercel.app.
   El negocio funciona igual, pero la marca no.
```

```
   ✅ Comprobación: P-16 de un socio muestra
      https://maxglobaloficial.com/registro?ref=SU-CODIGO
```

---

# PASO 7 · CERRAR LA PUERTA

```
   1 · robots.txt en el BACKOFFICE
       User-agent: *
       Disallow: /
       + <meta name="robots" content="noindex, nofollow">

       🔴 NO tocar el robots.txt de la LANDING:
          esa SÍ tiene que indexarse.

   2 · Leaked Password Protection en Supabase
       Authentication → Attack Protection → activar

   3 · La contraseña del admin de producción:
       que Máximo la cambie desde P-18 la primera vez
       que entre, y que Jack NO se la quede.

   4 · 🔴 PROBAR LA RECUPERACIÓN antes de entregar:
       · En P-10, "¿Olvidaste tu contraseña?"
       · Con el correo de Máximo
       · Que le llegue el mensaje y que el enlace funcione

       Si esto no se prueba, nadie sabrá que no funciona
       hasta el día que haga falta de verdad.
```

---

# LO QUE PASA CON LA DEMO

```
   utlohnidkuvxqppmoevj se QUEDA como está.
   509 socios · 2,423 comisiones · S/. 101,939.82
```

```
   Ya no tendrá web apuntándole, pero sigue viva por si
   hay que comparar algo. Se borra dentro de unas semanas,
   cuando producción lleve un mes rodando.
```

```
   🔴 NO la borres en esta tarea.
```

---

# LO QUE QUEDA PENDIENTE Y NO BLOQUEA

```
   🟡 Móvil a 390px · solo 6 px de desborde en la cabecera
   🟡 Code splitting · 935 kB
   🟡 La consulta suelta de P17:219
   ⏳ El % de detracción · del contador de Máximo
      Se mete en config el día que lo den. Hasta entonces,
      el sistema avisa y no inventa un neto.
```

---

# SI ALGO SALE MAL

```
   Producción todavía no tiene un solo socio real.
   Se puede borrar el proyecto y volver a empezar
   desde el paso 2, sin consecuencias.

   🔴 Eso deja de ser cierto en cuanto Máximo afilie
      al primero. A partir de ahí, se arregla hacia
      adelante, nunca borrando.
```
