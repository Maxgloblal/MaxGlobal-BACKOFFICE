# ESTADO DEL PROYECTO

**Actualizado:** 16 de octubre de 2026
**Última tarea ejecutada:** TAREA-68 (Correcciones de integridad operativa, dominio oficial y aislamiento de servicios)

> Este documento se quedó parado en la TAREA-13 durante tres semanas, y otra vez
> entre la 42 y la 63. Si lo encuentras desfasado, **actualízalo antes de seguir
> trabajando**.

---

# EN UNA FRASE

El sistema está **publicado y operando con socios reales**. Máximo tiene 31
socios y el ciclo de octubre abierto. Lo que queda es cobrar el 50% y llegar al
31 con el cierre completo.

---

# 🔴 LA FECHA QUE MANDA

```
   31 DE OCTUBRE DE 2026

   Máximo cierra el ciclo 2.
   Es el primer cierre real con dinero
   de verdad dentro.
```

Antes de esa fecha conviene cerrar la **PARTE 4**: llevar los techos del RF-376
y la comprobación de pagos pendientes dentro de la función de cierre. Hoy viven
en el navegador (`operacionAdmin.js:736` y `:453`) y solo corren si alguien abre
la P-25. No bloquea el cierre, pero es la última red antes de repartir.

---

# LO QUE PASÓ EL 1 DE OCTUBRE · leer antes de tocar el cierre

Máximo cerró **tres ciclos en un día**: octubre a las 7:57 y noviembre a las
18:44. Pudo hacerlo porque el cierre crea y abre el mes siguiente, y nada
comprobaba la fecha.

```
   Daño        34 comisiones anuladas · S/. 482,40
               2 ciclos fantasma con órdenes dentro
   Reparado    TAREA-62 · reversión transaccional
   Impedido    guarda de fecha en America/Lima
```

Y al investigarlo salió algo peor, que llevaba dieciséis días:

```
   🔴 El cierre NO pagaba el bono de rango.

   Desde la TAREA-45, cuando el cierre pasó del
   navegador a Postgres y el paso del rango se
   quedó en el camino.

   La causa está documentada como patrón 11 en
   05-CONTROL/LECCIONES-Y-PATRONES.md: una tarea
   mal escrita, no un error del programador.

   Arreglado en la TAREA-63 y verificado en las
   dos bases con md5 idéntico.
```

```
   ⚠ El ciclo 1 se comprobó en seco: 31 evaluados,
     3 califican, S/. 200 — exactamente los 3 que
     ya cobraron. NO quedó dinero de septiembre
     sin pagar.
```

---

# LO QUE ESTÁ EN LÍNEA HOY

Verificado el 16/09 contra el dominio y contra Vercel.

```
   maxglobaloficial.com          la web pública      ✅ responde
   app.maxglobaloficial.com      el sistema          ✅ responde

   Los DOS despliegues apuntan ya a PRODUCCIÓN
   (VITE_SUPABASE_URL = xkiwnxoferdfapezcwoq)

   El subdominio del sistema es app., no oficina.
   Decidido el 16/09. Va aparte de la web para poder
   excluirlo de Google sin que la web pública tenga
   que declarar la ruta de acceso.
```

Las direcciones `.vercel.app` siguen vivas pero ya no son las oficiales.

---

# LAS DOS BASES DE DATOS

Verificado contra Supabase el 15/09: la organización tiene **exactamente estos
dos proyectos**, los dos ACTIVE_HEALTHY.

```
   utlohnidkuvxqppmoevj   DEMO         us-east-2   509 socios simulados
                                       lo que Jack le enseña a Máximo

   xkiwnxoferdfapezcwoq   PRODUCCIÓN   sa-east-1   creado el 15/09
                                       instalado y verificado · 1 socio
```

El proyecto de ENSAYO (`uesyashbodhvlqchuokj`) **ya se borró**. Liberó el cupo
que hacía falta: la organización solo admite 2 proyectos activos en plan
gratuito, y por eso no cabe un tercero.

---

# CIFRAS CERTIFICADAS DE LA DEMO — 14/09

```
   socios              509        auth.users        23
   órdenes           1,059        comisiones     2,423
   S/. 101,939.82               red_ancestro    3,972
   config               39 claves  productos         8
   ciclos abiertos       1        wallet          473
```

**Si alguna de estas cambia sin que una tarea lo explique, algo se rompió.**

---

# LO QUE SE HIZO DESDE LA TAREA-14

```
   14  voucher con subida de imagen
   16  venta a cliente final
   17  baja de socio con reenganche de la red
   18  retiros con CCI
   19  auditoría completa
   20  registro con referido desde la landing
   21  productos con slug, categoría y foto
   22  P-32 · gestión de productos
   23  la landing lee el catálogo de la base
   24  consistencia de interfaz
   25  contraseña única por socio
   26  upgrade de pack (FLUJO 9)
   27  el filtro de activos · el ciclo escrito a mano
   28  endurecimiento y limpieza de permisos
   29  tipografía · Agus Sans era unicase
   30  valor en producto de cada pack
   31  QA de las 23 pantallas
   32  las 4 correcciones del QA
   33  fotos de producto en las compras
   34  botón de registro y el ?ref= que se perdía
   35  el instalador de producción + ensayo
   36  el ensayo completo · los cuatro bonos
   37  QA en el navegador · 4 partes
   38  las correcciones del QA
   39  PRODUCCIÓN creada, instalada y verificada
   40  barras de progreso y meta de activación
   41  la landing apuntaba a la demo · URL fija en config.js
   42  la Edge Function faltaba en producción
   43  pago directo a socios desde administración
   44  permisos de dinero + la función que no se instaló
   45  el cierre escribía dinero desde el navegador
   46  dos motores calculando el mismo bono de rango
   47  a quién le debo · padrón bancario y aviso de CCI
   48  el límite de las mil filas en la vista previa
   49  el motor tiraba comisiones de los inactivos
   50  auditoría de los 389 requisitos
   51  el patrocinio se cobra el mismo día
   52  el enlace de referido y el botón Ingresar
   53  siete funciones que el instalador no creaba
   54  el instalador probado desde cero, en Docker
   55  qué hay desplegado de verdad
   56  publicar las once tareas que seguían locales
   57  recuperar la contraseña por correo
   58  la tienda se usa con el pulgar
   59  análisis del convertidor de imágenes
   60  las imágenes se convierten a WebP al subirlas
   62  parar el sangrado y devolver octubre
   63  el cierre debe pagar el rango
```

```
   ⚠ La TAREA-61 (cierre automático a las 3 am)
     quedó investigada y NO implementada. Depende
     de la PARTE 4.
```

## Lo que cerró la TAREA-44 · verificado el 17/09

```
   fn_registrar_pago_directo_socio   instalada en las DOS
                                     bases, SECURITY DEFINER

   authenticated, en DEMO y PRODUCCIÓN:
     wallet_movimiento   solo SELECT
     comision            solo SELECT
     auditoria           SELECT + INSERT

   Un admin ya NO puede borrar dinero: falla con
   42501 permission denied, antes de llegar a RLS.

   Instalador arreglado en su raíz (línea 276):
     REVOKE ALL ... FROM PUBLIC, anon, authenticated
   El próximo sistema nace sin permisos y solo
   recibe los GRANT explícitos.
```

---

# LO QUE FALTA

## Auditoría de requisitos · TAREA-50 · cerrada el 18/09

Los 389 requisitos cruzados contra el código, cada ✅ con su `archivo:línea`.

```
   372 ✅  ·  0 🔴  ·  3 ❓  ·  12 🔵 fuera de alcance  ·  2 ⚠
```

**Ningún requisito espera respuesta del cliente.**

Los 5 que quedaban originalmente pendientes fueron cerrados:
* ✅ **RF-151**: Patrocinador bloqueado con readOnly si viene con `?ref=` (TAREA-52).
* ✅ **RF-115**: Botón "Ingresar" a la oficina virtual en la web pública (TAREA-52).
* ✅ **RF-172**: Botones de copiado de cuentas bancarias y CCI (TAREA-52).
* ✅ **RF-180**: Misión y visión leídas desde configuración (TAREA-52).
* ✅ **RF-219**: Avisos de pagos rechazados integrados en P-11 (TAREA-53).

---

```
   💰 COBRAR EL 50% RESTANTE
      Es lo único que queda del acuerdo comercial.

   ✅ PARTE 4 · las últimas guardas del cierre
      COMPLETADO EN TAREA-67 (16/10/2026).
      Guardas RF-371 y RF-376 integradas en fn_ejecutar_cierre_ciclo
      en Postgres con bypass auditado p_forzar y soporte service_role.

   ✅ url_landing en P-26
      COMPLETADO EN TAREA-68 (16/10/2026).
      Actualizado en DEMO y PRODUCCIÓN a https://maxglobaloficial.com
      y sincronizado en 06-semilla.sql. P-16 genera el enlace oficial.

   ✅ El respaldo a la demo del BACKOFFICE
      COMPLETADO EN TAREA-68 (16/10/2026).
      src/lib/supabaseClient.js ya no cae a la demo en silencio:
      lanza Error explícito si faltan las variables de entorno.

   ✅ Mover a servicios la consulta suelta de P17:219
      COMPLETADO EN TAREA-68 (16/10/2026).
      Encapsulada en obtenerMapaFotosProductos en src/servicios/socio.js.

   ✅ El <Tabla claveId> de P-31:342
      COMPLETADO EN TAREA-68 (16/10/2026). Limpiado en P-31.

   🟡 Cierre automático a las 3 am (TAREA-61)
      El motor en Postgres ya está listo para service_role.
      Pendiente acordar con Máximo el protocolo si a las 3 am
      hay pedidos pendientes por confirmar (RF-371).

   ✅ Permisos mínimos estrictos en todas las tablas
      VERIFICADO EN DEMO Y PRODUCCIÓN (16/10/2026).
      Ambas bases y 04-rls-y-grants.sql coinciden al 100%:
      authenticated NO tiene DELETE ni TRUNCATE en ninguna tabla.
      Solo SELECT en catálogos y SELECT/INSERT/UPDATE en operativas.

   🟡 ¿Quién creó maxglobal.networ@gmail.com?
      Aparece registrado en producción el 16/09 a las 13:47.

   🟡 El correo de recuperación llega a SPAM
      Sale de una cuenta de Gmail. Decidido el 23/09:
      no se resuelve, se avisa en pantalla y en el manual.
      Si algún día molesta, se arregla con dominio propio
      y registros SPF/DKIM/DMARC en Namecheap.

   ✅ Móvil a 390px · probado a fondo y blindado (TAREA-69)
      16 pantallas auditadas con Playwright a 390x844: 0 desbordes.
      Visibility control en armazon.css y flex-wrap en P-25.

   ✅ Code splitting · bundle reducido a 496 kB y chunks bajo demanda (TAREA-70)
      React.lazy() en las 26 páginas, Suspense reactivo integrado.

   ⏳ El % de detracción · lo tiene el contador de Máximo
```

## Resuelto desde el 16/09 · ya NO está pendiente

```
   ✅ El pago rápido del patrocinio
      Máximo lo confirmó el 17/09. Implementado en
      la TAREA-51 con el estado 'abonada'.

   ✅ Las dos pruebas rotas de la TAREA-44
      auth-rls.test.js acepta los dos mensajes;
      baja-socio.test.js usa sbService.

   ✅ Revocar el token de Supabase
      Las claves de producción se rotaron el 23/09
      al formato nuevo (publishable + secret).

   ✅ Los 5 🔴 de la auditoría de requisitos
      RF-151, RF-115, RF-172 y RF-180 en la TAREA-52.
      RF-219 en la TAREA-53.

   ✅ Las once tareas sin publicar
      Estuvieron 16 días solo en la máquina de Jack.
      Publicadas en la TAREA-56.
```

**Ya NO están pendientes** (se daban por abiertos y estaban hechos): el
`robots.txt` del backoffice, que tiene `Disallow: /` **y** `noindex, nofollow`
desde antes; y el README de la landing, actualizado el 16/09.

---

# DECISIONES DE NEGOCIO CERRADAS

Están todas en `00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO.md`, con 22 reglas
confirmadas por Máximo. **No se decide nada que ya esté ahí.**

Las que más se olvidan:

```
 