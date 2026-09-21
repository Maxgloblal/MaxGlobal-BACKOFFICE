# TAREA-53 · El instalador miente

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 Es el patrón de la TAREA-44, otra vez
**Fecha:** 20 de septiembre de 2026

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md  · patrón 9
   00-INSTRUCCIONES/TAREA-44-...       · la función que no se instaló
```

---

# BLOQUE 1 · 🔴 SIETE FUNCIONES QUE EL INSTALADOR NO CREA

Comparé las funciones que define `supabase/instalador/*.sql` contra las que
definen los `scripts/*.sql` sueltos. Siete existen **solo** en los scripts:

```
   fn_calcular_y_persistir_rangos     el motor de rangos · DINERO
   fn_eliminar_socio_definitivo       destructiva
   fn_vista_previa_eliminar_socio
   fn_actualizar_datos_socio_admin
   fn_crear_producto_admin
   fn_editar_producto_admin
   fn_cambiar_estado_producto_admin
```

Las siete **las llama la aplicación**. Por ejemplo:

```
   operacionAdmin.js:619   fn_calcular_y_persistir_rangos
   operacionAdmin.js:2017  fn_eliminar_socio_definitivo
   operacionAdmin.js:2351  fn_crear_producto_admin
```

Y lo peor:

```
   Las siete aparecen en
   supabase/instalador/INVENTARIO-COMPLETO.md

   El inventario dice que están. Ningún .sql las crea.
```

```
   Hoy no se rompe nada: las dos bases las tienen,
   instaladas a mano el día que se escribió el script.

   Pero si mañana instalas el sistema desde el
   instalador —otro cliente, una base nueva, un
   restore— nace SIN el cálculo de rangos, sin
   gestión de productos y sin baja de socios.
   Todo eso falla con PGRST202 en producción.
```

Es exactamente la TAREA-44: una función documentada que no estaba instalada, y
un fallback hizo que las pruebas pasaran igual.

## Qué hacer

```
   1 · Trae las siete al instalador, en el archivo
       que les toque por tema, no en uno nuevo.

   2 · Copia la definición que está INSTALADA HOY
       en producción, no la del script.

       🔴 Los scripts son históricos. Si una función
          se tocó después, el script tiene la versión
          vieja. Pégame el pg_get_functiondef de cada
          una y compáralo con lo que vas a escribir.

   3 · fn_calcular_y_persistir_rangos lleva además
       este arreglo:

         CREATE TEMP TABLE temp_ramas_ciclo ON COMMIT DROP

       Si la función se llama dos veces en la misma
       transacción, la segunda falla: la tabla ya
       existe. Un DROP TABLE IF EXISTS antes del
       CREATE. Una línea.

   4 · Comprueba si falta alguna más. Yo comparé
       nombres de función. Compara también TABLAS,
       VISTAS, ÍNDICES y claves de config.
```

## Y la prueba de verdad

```
   Instala el sistema entero desde cero, desde el
   instalador, en una base limpia.

   Después corre la suite contra ESA base.
```

```
   🔴 Sin instalar desde cero, esta tarea no está
      hecha. Comparar listas es lo que ya hice yo.
      Lo que falta es demostrar que el instalador
      produce un sistema que funciona.
```

Si no tienes dónde crear una base limpia, **dilo y paramos ahí**: la
organización solo admite 2 proyectos en plan gratuito y no vamos a borrar
ninguno de los dos que hay.

---

# BLOQUE 2 · 🔴 RF-219 · LOS AVISOS ESTÁN EN LA PANTALLA EQUIVOCADA

```
   RF-219 · El panel debe mostrar avisos de pagos
            rechazados y cambios de estado de envío
```

Hoy están en **P-17 Mis Pedidos**. El requisito los pide en **P-11 Panel del
Socio**, que es lo primero que ve al entrar.

```
   Un socio al que le rechazaron el pago se entera
   solo si entra a Mis Pedidos. En su panel no hay
   nada. Puede pasar días creyendo que su compra
   va bien.
```

Llévalos a P-11 como avisos, con enlace a P-17 para el detalle.

```
   🔴 Que no se dupliquen. Si los dejas en los dos
      sitios, el socio ve el mismo rechazo dos veces
      y no sabe si son dos.

   🔴 Y que no se queden pegados: cuando el pago se
      resuelve, el aviso desaparece.
```

Actualiza RF-219 en `09-RF-BACKOFFICE-SOCIO.md:58` con su `archivo:línea`, y el
conteo de la línea 194, que dice "1 🔴 No cumple".

---

# LO QUE *NO* ENTRA EN ESTA TAREA

```
   🔵 El respaldo a la demo de supabaseClient.js:15
      NO es un fallo. Solo entra si falta la variable
      de entorno, y en Vercel está puesta: el sistema
      opera en PRODUCCIÓN. Se igualará con la landing
      cuando se toque ese archivo. No lo toques ahora.

   🔵 Los permisos de más en ~18 tablas.
      Las protege RLS. Va en una pasada aparte.
```

---

# LO QUE TIENES QUE REPORTAR

```
· El pg_get_functiondef de las siete, de producción,
  al lado de lo que escribiste en el instalador
· Qué más faltaba además de las siete (tablas,
  vistas, índices, config)
· La instalación desde cero, con su salida
· La suite en verde contra ESA base nueva
· El diff de P-11 y de P-17
· RF-219 y el conteo actualizados
```

```
   🔴 Si algo quedó sin ejecutar, va en la PRIMERA
      línea del informe. Y el diff que me pegues
      tiene que ser el de lo que QUEDÓ instalado.
```

Si algo no cuadra, para y dilo.
