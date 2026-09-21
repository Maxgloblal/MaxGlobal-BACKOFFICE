# TAREA-54 · Probar el instalador de verdad

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🟠 No arregla nada · demuestra si lo de la TAREA-53 funciona
**Fecha:** 20 de septiembre de 2026
**Cierra:** el único punto que quedó sin ejecutar de la TAREA-53

---

# LO QUE CAMBIÓ

Dijiste que no había daemon de Docker. **Ahora sí lo hay.** Jack lo tiene
instalado en su máquina.

Ya no hace falta un tercer proyecto de Supabase. La base limpia se levanta en
local.

---

# 🔴 LO PRIMERO, Y NO ES NEGOCIABLE

```
   NO toques la DEMO.
   NO toques PRODUCCIÓN.

   Todo esto ocurre en una base LOCAL, en el Docker
   de Jack. Si en algún momento te ves escribiendo
   una cadena de conexión que diga supabase.co,
   PARA.
```

Y una advertencia sobre por qué esto no se podía hacer contra la demo:

```
   Las 24 tablas de 01-esquema.sql se crean con
   CREATE TABLE IF NOT EXISTS.

   Sobre una base que ya las tiene, el instalador
   las salta TODAS y termina diciendo que todo
   salió bien. La prueba pasaría siempre, aunque
   el instalador estuviera roto.

   Por eso la base tiene que nacer vacía.
```

---

# EL TRABAJO

## 1 · Levanta la base limpia

```
   supabase start
```

Comprueba antes que el Docker Desktop de Jack esté **corriendo**, no solo
instalado. Si `supabase start` falla, pégame el error tal cual y para.

## 2 · Corre el instalador entero, en orden

Los archivos de `supabase/instalador/` van por su numeración. Ejecútalos **uno
por uno**, en orden, contra la base local.

```
   🔴 No los juntes en un solo archivo.
      Si algo revienta, quiero saber en QUÉ archivo
      y en qué línea. Es justo lo que esta prueba
      viene a descubrir.
```

Lo que busco es esto, y es probable que aparezca:

```
   · una función que usa una tabla que todavía
     no existe porque va en otro archivo
   · un GRANT sobre algo no creado
   · una semilla que depende de otra semilla
   · una dependencia entre funciones en mal orden
```

**Cada fallo se anota y se arregla en el instalador**, no en un parche aparte.
Después se vuelve a empezar desde cero. Repite hasta que corra limpio de una
pasada.

```
   🔴 "Corrió con dos errores que no importan" NO
      vale. O corre entero o no está hecho.
```

## 3 · Compara el resultado contra PRODUCCIÓN

La base local ya instalada tiene que tener lo mismo que producción:

```
   tablas · vistas · índices · funciones con su firma
   claves de config · políticas RLS · grants
```

```
   🔴 Compara FIRMAS completas, no nombres.

   En tu informe de la TAREA-53 dijiste que
   fn_editar_producto_admin era
     (p_producto_id, p_datos, p_admin_id)

   El archivo que escribiste tiene
     (p_id, p_datos, p_admin_id, p_datos_antes)

   Escribiste bien y reportaste mal. Aquí eso no
   puede pasar: si las firmas difieren entre local
   y producción, la aplicación falla con PGRST202
   y el informe diría que todo está bien.
```

Lo que sobre o falte en cualquiera de los dos lados, va en una tabla.

## 4 · La suite contra esa base

Apunta las variables de entorno a la base local y corre la suite completa.

```
   Las pruebas que dependan de datos de la demo
   —los 523 socios, los tres ciclos— van a fallar
   en una base vacía. Eso NO es un fallo del
   instalador.

   Sepáralas en el informe: qué falló por datos
   que no existen, y qué falló porque el sistema
   recién instalado no funciona.
```

## 5 · Apaga y limpia

```
   supabase stop
```

Que no quede un contenedor comiéndose la máquina de Jack.

---

# LO QUE TIENES QUE REPORTAR

```
· La salida de cada archivo del instalador, en orden
· Cada error encontrado, con archivo y línea, y
  qué cambiaste para arreglarlo
· La pasada final limpia, de principio a fin
· La tabla comparativa local vs PRODUCCIÓN, con
  las FIRMAS completas de las funciones
· La suite, separando los fallos por falta de datos
  de los fallos reales
```

```
   🔴 Si algo no se ejecutó, va en la PRIMERA línea.
      No al final, no entre paréntesis.
```

Si el Docker no arranca o algo te bloquea, **para y dilo**. Esta tarea no toca
dinero de nadie: no hay ninguna prisa que justifique inventarse un resultado.
