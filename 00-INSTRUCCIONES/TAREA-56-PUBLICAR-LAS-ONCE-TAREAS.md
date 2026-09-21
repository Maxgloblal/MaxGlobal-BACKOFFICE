# TAREA-56 · Publicar las once tareas

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE + SITIO WEB
**Gravedad:** 🔴 PRODUCCIÓN CON CLIENTE DENTRO · toca dinero
**Fecha:** 21 de septiembre de 2026

---

# LA SITUACIÓN

```
   HEAD local      ddd82ab
   origin/master   ddd82ab      ← iguales
   sin commitear   94 archivos

   Todo lo de las TAREAS 44 a 54 vive SOLO en el
   árbol de trabajo. No está en GitHub y no está
   publicado.
```

Y en producción hay esta combinación:

```
   BASE DE DATOS    nueva   · con TODO
   PANTALLAS        viejas  · del 15/09
```

El dominio volvió hoy tras la suspensión de Namecheap. `app.maxglobaloficial.com`
ya responde con el login.

```
   🔴 LA BASE NO SE TOCA.

   Ya está al día en las dos. Esta tarea publica
   CÓDIGO. Si te ves escribiendo SQL contra
   producción, para: no es esta tarea.
```

---

# BLOQUE 0 · ANTES DE COMMITEAR NADA

```
   1 · Comprueba que los 94 archivos son los que
       crees. Pégame `git status` completo.

   2 · 🔴 Busca secretos antes de subir.
       Contraseñas, tokens, claves de servicio,
       archivos .env que no deban ir.

       El 16/09 se pegó un token de Supabase en
       texto plano. Si algo así entra a GitHub,
       queda en el historial para siempre.

   3 · Comprueba que .gitignore cubre .env,
       .env.local y .env.produccion.
```

Si encuentras un secreto, **para y dilo**. No lo subas ni lo "limpies" tú.

---

# BLOQUE 1 · COMMITS SEPARADOS, NO UNO GIGANTE

```
   🔴 NO hagas un commit de 94 archivos.
```

Si algo sale mal en producción, con un commit único la única salida es deshacer
las once tareas de golpe. Sepáralos por tarea, o por grupos que tengan sentido:

```
   · permisos y seguridad        (44)
   · cierre y motor              (45, 46, 48, 49)
   · pantallas y consultas       (47, 50)
   · patrocinio al instante      (51)
   · instalador y documentación  (53, 54)
   · documentación del cliente
```

Cada commit tiene que compilar y pasar la suite por sí solo. Si uno no puede,
júntalo con el que lo completa y dime por qué.

---

# BLOQUE 2 · LA LANDING PRIMERO

Va primero porque **no toca dinero** y porque así compruebas que el despliegue
funciona con algo inofensivo.

```
   1 · Antes de publicar, comprueba en Vercel que
       el proyecto de la landing tiene:

         VITE_SUPABASE_URL      → PRODUCCIÓN
         VITE_SUPABASE_ANON_KEY → PRODUCCIÓN
         VITE_BACKOFFICE_URL    → https://app.maxglobaloficial.com

       Captura de las tres.

   2 · Publica.

   3 · Comprueba EN EL DOMINIO REAL, no en la
       dirección .vercel.app:

       · maxglobaloficial.com/registro?ref=<código real>
         campo bloqueado · "Te invitó el socio ..."
       · maxglobaloficial.com/registro
         campo editable
       · el botón Ingresar lleva a app.maxglobaloficial.com
       · la pantalla de confirmación copia cuenta y CCI
       · el catálogo carga los productos
```

```
   🔴 Manda una solicitud de prueba de verdad,
      con un ref real, y enséñame la fila que
      quedó en solicitud_afiliacion. Después
      bórrala.

      Es lo único que demuestra que la landing
      está hablando con PRODUCCIÓN y no con la demo.
```

---

# BLOQUE 3 · 🔴 EL BACKOFFICE

Solo después de que la landing esté bien.

```
   1 · Comprueba las variables en Vercel igual
       que antes. Captura.

   2 · Publica.

   3 · Entra a producción y comprueba, con capturas:

       P-19 Mi Billetera
       P-14 Mis Comisiones
       P-25 Vista previa del cierre
       P-30 Retiros
       P-27 Gestión de socios
       P-32 Productos
```

## Y la prueba que de verdad importa

```
   🔴 Antes de que Máximo confirme ninguna venta:

   1 · Confirma una afiliación de prueba en
       PRODUCCIÓN, de un socio cuyo patrocinador
       esté ACTIVO.

   2 · Comprueba que la comisión quedó 'abonada'
       y que la billetera subió.

   3 · Entra a la P-19 de ese patrocinador y
       comprueba la invariante:

         el estimado del ciclo NO incluye
         ni un céntimo de las 'abonada'

   4 · Deshaz la prueba y déjame el rastro de
       cómo la deshiciste.
```

Esto es lo que la TAREA-55 no pudo medir porque no había datos. Ahora sí se
puede.

---

# BLOQUE 4 · 🔴 ¿SE PUEDE CERRAR EL CICLO 2?

El código que estaba publicado era del 15/09, anterior a los permisos de la
TAREA-44 y al cierre transaccional de la 45. Ese código escribía comisiones
desde el navegador.

```
   Sospecha: si Máximo hubiera intentado cerrar el
   ciclo 2 esta semana, le habría fallado con
   "permission denied for table comision".

   No lo doy por hecho. Compruébalo.
```

Con el código nuevo ya publicado, corre la **vista previa** del cierre del
ciclo 2 en producción — la previa, **no el cierre**.

```
   🔴 NO CIERRES EL CICLO. Eso lo hace Máximo
      cuando toque, y no se deshace.
```

Pégame lo que muestra la previa, y si algo falla, el error completo.

---

# SI ALGO SALE MAL

```
   Vercel guarda los despliegues anteriores y
   permite volver a uno en un clic.

   Si después de publicar algo no cuadra en
   producción: vuelve al despliegue anterior
   PRIMERO, y me lo cuentas después. No te
   quedes investigando con el sistema roto.
```

---

# LO QUE TIENES QUE REPORTAR

```
· git status completo, antes de tocar nada
· Si encontraste secretos · en la PRIMERA línea
· La lista de commits que hiciste, con su mensaje
· Las capturas de variables de Vercel, los dos proyectos
· Las comprobaciones de la landing, en el dominio real
· La fila de solicitud_afiliacion de la prueba
· Las capturas de las seis pantallas del backoffice
· La invariante del Bloque 3, con las cifras
· La vista previa del cierre del ciclo 2
· Los hashes finales: publicado == rama, los dos proyectos
```

```
   🔴 Los números de línea y las firmas que me
      pegues, ábrelos antes. Van seis veces que
      no coinciden con tus propios archivos.
```

Si algo no cuadra, para y dilo. Esto se publica sobre un sistema con un cliente
dentro.
