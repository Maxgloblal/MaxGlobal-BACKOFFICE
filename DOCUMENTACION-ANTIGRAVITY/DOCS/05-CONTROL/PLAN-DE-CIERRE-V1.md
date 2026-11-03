# PLAN DE CIERRE — VERSIÓN 1 · DOCUMENTO HISTÓRICO

**Congelado el 4 de septiembre de 2026. No se actualiza más.**

> ## 🔴 LA LISTA VIVA NO ESTÁ AQUÍ
>
> ```
>    00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO.md
> ```
>
> Casi todo lo que este plan listaba como pendiente **ya se construyó** entre el
> 5 y el 16 de septiembre, en las tareas 14 a 42. Leerlo como lista de trabajo
> lleva a rehacer cosas que ya existen.
>
> Su valor está en la sección de **decisiones cerradas**: explica por qué el
> negocio funciona como funciona, y eso sigue vigente.

**Qué faltaba para entregar la v1 completa, en orden, con su fuente — a fecha
del 4 de septiembre.**

> ## POR QUÉ EXISTE ESTE DOCUMENTO
>
> La certificación manual del 4/09 destapó que **cinco funcionalidades
> comprometidas en el alcance del 26/08 no están construidas**, y no estaban en
> ninguna lista de pendientes. No se decidió dejarlas fuera: se pasaron por alto.
>
> Este documento las junta con los errores encontrados, en un solo orden, para
> no volver a perder ninguna.

---

# ✅ DECISIONES CERRADAS — no se vuelven a proponer

## Los packs NO tienen contenido fijo · decidido el 6/09

Al trazar el recorrido de una afiliación se detectó que **no existe ninguna
tabla que diga qué productos trae cada pack**:

```
   Tablas de packs:   pack · pack_comision_especial
   Tabla pack_producto:   NO EXISTE

   pack.cant_productos:  Emprendedor 1 · Ejecutivo 4 · Gold 13
                         Familiar y Empresarial: sin definir

   Y una orden de pack no tiene NINGUNA línea de orden_detalle:
   guarda el total y los puntos, nada más.
```

**No es un hueco. Es así a propósito.**

> **Jack, 6/09:** *"no hay productos exactos para eso, entonces está bien como
> está"*

El pack es **un monto y unos puntos**, no una lista cerrada. El contenido se
arma según lo que haya en stock o lo que el socio prefiera.

```
   🔴 NO se construya una tabla pack_producto.
   🔴 NO se agreguen líneas de orden_detalle a las órdenes de pack.
   🔴 cant_productos es referencial, no un contrato.
```

**Consecuencia asumida:** el sistema no puede imprimir una lista de empaque ni
validar el contenido de una caja. Máximo lo arma a criterio. Si algún día
delega el empaque a otra persona, se revisa esta decisión — pero se revisa con
él, no se "arregla" por iniciativa propia.

---

# 👤 LO ÚNICO QUE DEPENDE DE OTRA PERSONA

**Dos preguntas. Ninguna bloquea el desarrollo — las dos están construidas con
configuración editable y su valor por defecto.**

**Una sola. Y no bloquea: está construida con configuración editable.**

| Pregunta | Para quién | Dónde |
|---|---|---|
| **El porcentaje exacto de la detracción** | El contador de Máximo | `03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE` · "lo que no resuelve", punto 4 |

```
   Mientras no llegue:
     config.pct_detraccion = null   → avisa que corresponde detracción
                                      y NO inventa el neto
```

## ✅ Cerrado el 4/09 por Jack — la venta a cliente

La pregunta 11 de `04-CLIENTE/03-ULTIMO-PEDIDO-DE-DATOS` (*"¿la venta a clientes
activa al socio?"*) **queda decidida y no se le pregunta a Máximo.**

> **Jack, 4/09:** *"nosotros nos ocupamos en generar socios y venderles a tal
> precio y ellos compran y venden. A quién le vendan ellos no nos interesa.
> **Si con su venta ellos se activan, genial.**"*

```
   config.venta_cliente_activa_socio   = true    ← decidido
   config.venta_cliente_paga_residual  = true    ← decidido
```

**Y una aclaración de modelo de negocio que conviene tener presente:**

```
   El socio le revende a su vecino     → FUERA del sistema. No se
                                          registra. No es asunto de
                                          Max Global.

   Alguien compra desde la landing     → DENTRO del sistema.
   al precio público                     Si vino por el ?ref= de un
                                         socio, se le atribuye.
                                         Si no, es venta de la empresa
                                         y no paga comisión a nadie.
```

> **La landing tiene doble función:** vender al público y captar socios. Los dos
> precios visibles —público S/. 150 · socio desde S/. 75— son el gancho: la
> gente ve la diferencia y se afilia para comprar más barato.

**Los rangos 9-16, la dirección de calle y las cuentas bancarias ya no
bloquean:** Jack confirmó el 4/09 que están resueltos o no hacen falta.

---

# RESUMEN EN UNA PANTALLA

```
   BLOQUE A · COMPROMETIDO Y FALTA        6 cosas   ← esto es la deuda real
   BLOQUE B · ERRORES ENCONTRADOS         4 cosas   ← chicos, ya diagnosticados
   BLOQUE C · ANTES DE DINERO REAL        3 cosas   ← decisiones y base limpia
   BLOQUE D · SIN PRISA                   4 cosas
```

**Nada de esto depende de Máximo.** Los rangos 9-16, la dirección y las cuentas
bancarias ya están resueltos o no bloquean.

---

# BLOQUE A · COMPROMETIDO Y FALTA

*Cada uno con la línea del documento donde se prometió.*

## A1 · Conectar el bono de rango ✅ HECHO Y CERTIFICADO EN VIVO EL 4/09

> **TAREA-12 ejecutada.** Certificado con un cierre real del ciclo 5:
> Karla calificó a JADE, cobró S/. 50.00 y el abono llegó a su billetera.
> `comisiones de rango sin abono = 0`. Detalle completo en la BITÁCORA.
>
> Lo de abajo se conserva como registro de qué estaba roto y por qué.

### El diagnóstico original

> **Fuente:** cotización original · Alcance Parte 1-A punto 3
> *"Motor de comisiones — los 4 bonos completos"*

```
   src/motor/rango.ts    existe · 17 pruebas en verde · CORRECTO
   quién lo llama        NADIE en producción

   src/motor/persistencia.js importa solo:
     calcularPatrocinio  ✅
     calcularResidual    ✅
```

El preview de P-25 **no calcula** el bono de rango: filtra
`comision.tipo === 'rango'`. Si nadie las crea, muestra S/. 0.00.

**Las 43 comisiones de rango de la base las creó el sembrado, no el sistema.**

**Además:** `fn_ejecutar_cierre_ciclo` no escribe `rango_ciclo` ni
`rango_honorifico_id`. Prueba:

```
   ciclo 1  501 filas de rango_ciclo   ← sembrado
   ciclo 2  501 filas                  ← sembrado
   ciclo 3  501 filas                  ← sembrado
   ciclo 4    0 filas                  ← cierre REAL del 4/09
```

Y los 503 socios tienen `rango_honorifico_id = NULL`, cuando la regla dice que
el rango se conserva como título honorífico.

**Qué hay que hacer:** llamar al motor de rango en el cierre, persistir
`rango_ciclo` para todos los socios evaluados, generar las comisiones de tipo
`rango`, y actualizar el honorífico cuando alguien sube.

**Tamaño:** mediano. El motor ya está y está probado — falta el cable.

**Ojo:** no depende de los rangos 9-16. Los 1-8 están definidos; los 8 altos
existen con `definido = false` y se cargan desde P-26 cuando lleguen.

---

## A2 · Subida de la foto del voucher 📝 TAREA-14 ESCRITA, LISTA PARA EJECUTAR

> **Es más chico de lo que parecía.** Verificado el 4/09:
> `fn_registrar_afiliacion_socio` y `fn_registrar_pedido_recompra`
> **ya leen `imagen_url`** del JSON que reciben. El lado de la base está hecho.
> Solo falta el bucket y que el navegador suba el archivo.
> **No hace falta tocar ninguna función SQL.**

> **Fuente:** `03-SISTEMA/05-ROLES-Y-PERMISOS` línea 125 y 167
> *"Adjuntar el comprobante — Foto, banco, monto, fecha"* · *"En la v1 lo hace él"*
> **RF-238:** el socio NO debe poder subir comprobantes

```
   tabla voucher    bien diseñada: imagen_url, banco, numero_operacion,
                    monto_cent, fecha_deposito, estado, motivo_rechazo,
                    revisado_por, revisado_en
   las 1,048 filas  imagen_url = https://storage.maxglobal.com/vouchers/vou-N.jpg
                    ← dominio INVENTADO por el sembrado. No existe.
                      voucher.id = orden_id = el número del archivo,
                      con fechas de junio/julio/agosto. Es data semilla.
   en el código     ninguna subida de archivos, ningún bucket
```

> ## ⚠️ CORRECCIÓN DEL 4/09 — error de diagnóstico propio
>
> Este documento decía antes que **las 1,049 filas tenían `placehold.co`**.
> **Era falso.** Salió de leer un `MIN(imagen_url)` —que devuelve el
> alfabéticamente menor, y "p" va antes que "s"— y asumir que era
> representativo, sin contar.
>
> **Había UNA sola fila con placehold.** Las otras 1,048 siempre apuntaron al
> dominio inventado del sembrado.
>
> **La lección:** `MIN()` no es una muestra. Para saber cuántos hay de cada
> cosa se cuenta con `COUNT(*) FILTER (WHERE ...)`, no se mira un ejemplo.

Los datos escritos a mano sí se guardan. **La imagen no tiene por dónde entrar.**

**Por qué importa:** el voucher es la prueba de que un socio pagó. El día que
alguien reclame *"yo sí deposité"*, o Máximo tenga que sustentar un ingreso, la
foto es lo único que vale.

**Tamaño:** chico. Un bucket de Supabase Storage, su política, y un campo de
archivo en P-21 y P-22.

---

## A3 · Solicitud de retiro ✅ HECHO Y CERTIFICADO EL 4/09

> **TAREA-15 ejecutada.** P-30 Retiros construida, aprobación y rechazo
> funcionando, y **la billetera ya se descuenta**.
>
> ```
>    471 · retiro · "Retiro aprobado" · −10000 · saldo 189000 → 179000
>    v_wallet_saldo y el último movimiento coinciden: S/. 1,790.00
>    solicitudes aprobadas sin débito: 0
> ```
>
> Cadena de saldo recalculada con `LAG` de forma independiente: cada delta
> coincide con su `monto_cent`. **Primera vez que sale plata de una billetera
> en este sistema.**
>
> El mecanismo de detracción quedó construido con `config.pct_detraccion = null`.
> Lo de abajo se conserva como registro de qué estaba roto.

### El diagnóstico original

> **Fuente:** Alcance, agregado nº2
> *"el socio solicita desde su backoffice · mínimo S/. 100 · Máximo aprueba o
> rechaza · queda el registro"* · *"una pantalla en cada lado"*

**La mitad del socio está ROTA.** Verificado en pantalla:

```
   Could not find the 'cci' column of 'solicitud_retiro' in the schema cache

   el código inserta   numero_cuenta, cci
   la tabla tiene      cuenta       · y NO tiene cci
```

**La mitad del admin NO EXISTE.** Las columnas `estado`, `motivo_rechazo`,
`procesado_por`, `procesado_en` están en la tabla y nadie las escribe.

**Y falta el débito.** Hoy `wallet_movimiento` tiene 467 filas, **todas de tipo
`abono`**. Cero débitos. El sistema no sabe que a un socio ya le pagaron, así
que el saldo que ve crece para siempre y es mentira.

**Decisión ya tomada, no hay que preguntarla:** el modelo es solicitud +
aprobación. Está decidido desde el 26/08.

**Tamaño:** mediano. Arreglar el insert, la pantalla de admin, y el débito de
la billetera al aprobar.

---

## A4 · Cálculo de detracción sobre S/. 700

> **Fuente:** Alcance, agregado nº3
> *"cuando una comisión supera S/. 700, el sistema muestra el monto de la
> detracción y el neto a pagar"* · *"Máximo lo pidió explícitamente"*

```
   config.umbral_detraccion_cent = 70000   ✅ existe
   P-26 lo deja editar                     ✅ existe
   quién lo calcula                        NADIE
```

Está el interruptor sin el cable.

**Lo que NO incluye:** emitir la factura electrónica. Eso es SUNAT y sigue fuera
de alcance.

**Tamaño:** chico. Un cálculo y dos campos en la pantalla de pago.

---

## A5 · Baja de socio con reenganche de red

> **Fuente:** Alcance, agregado nº4
> *"dar de baja · su descendencia se engancha al patrocinador · vista previa de
> a quién afecta antes de ejecutar · queda registro de la estructura anterior"*

**No existe nada.** Ni la función, ni la pantalla, ni el registro.

**Por qué importa:** la gente se retira. Si el sistema no sabe qué hacer con su
equipo, la red se corrompe y las comisiones empiezan a fallar en silencio.

**Tamaño:** el más grande de los seis. El propio documento de alcance lo dice:
*"Es la operación más delicada del sistema y se hace con cuidado."* Toca
`red_ancestro`, que es de lo que depende todo el residual.

---

## A6 · Venta a cliente final

> **Fuente:** Alcance, agregado nº5
> *"el administrador registra una venta a nombre de un cliente · si vino por el
> enlace de un socio, se le atribuye · si no vino por nadie, queda como cliente
> directo de la empresa"*

**No existe.** No hay casilla, ni campo, ni flujo.

**Por qué importa:** Máximo confirmó que existen clientes que no son socios, y
esa venta deja **casi el triple de margen** que la de un socio.

**Lo que NO incluye:** cuentas de cliente, historial ni portal de clientes.

**Tamaño:** chico. Una casilla en P-21 según el propio alcance.

---

# BLOQUE B · ERRORES ENCONTRADOS EL 3 Y 4 DE SEPTIEMBRE ✅ TODOS CORREGIDOS

> **TAREA-13 ejecutada el 4/09.** Los cinco corregidos y verificados. Además se
> construyó el **guardián de nombres de campo**, que detectó los cinco contra el
> commit anterior con archivo y línea exactos — así que protege del sexto.
>
> Prueba de que el retiro funciona: `solicitud_retiro` pasó de **0 a 4 filas**.
> Antes el insert fallaba siempre.
>
> Lo de abajo se conserva como registro de qué estaba roto.

## B1 · Tres campos inventados que quedan

*Mismo patrón que ya corrigió la TAREA-11 con `valor/etiqueta` y `p.puntos`.*

```
   P17MisPedidos.jsx:299   d.precio_unit_cent   → precio_final_cent
   P17MisPedidos.jsx:300   d.subtotal_cent      → precio_final_cent × cantidad
   P19MiBilletera.jsx:194  saldo_posterior_cent → saldo_despues_cent
   servicios/socio.js      cci, numero_cuenta   → ver A3
```

**Por qué ninguna prueba los detecta:** leer un campo que no existe devuelve
`undefined`, y `formatearSoles(undefined || 0)` pinta **S/. 0.00**. La pantalla
se ve perfecta y miente. Solo el retiro falló ruidosamente porque Supabase sí
valida al escribir.

**Verificado:** la orden de Karla tiene en la base `precio_final_cent = 7500`
(S/. 75) y en pantalla sale S/. 0.00.

## B2 · `ArmazonSocio.jsx` tiene datos escritos a mano

```jsx
const socio = socioData || {
  ...
  rangoVigente: 'Bronce',      ← inventado · Karla no tiene rango honorífico
  ciclo: 'Agosto 2026',        ← inventado · estamos en octubre
};
```

Ninguna pantalla le pasa `socioData`, así que siempre se usa el respaldo. Por
eso la barra dice BRONCE mientras el panel dice SIN RANGO.

**Es el mismo error que la TAREA-11 corrigió en `ArmazonAdmin`** — y no se
corrigió acá porque **mi instrucción puso este archivo como el ejemplo bueno a
copiar.** Error mío: leí la variable `{socio.ciclo}` sin mirar de dónde salía.

## B3 · El panel del socio arranca en un ciclo cerrado

```js
P11PanelSocio.jsx:31   useState(3)
P11PanelSocio.jsx:52   cicloSeleccionado || listaCiclos.find(c => c.estado === 'abierto')?.id
                       ← el find nunca se ejecuta: el valor por defecto ya es verdadero
```

**El selector funciona bien** y los datos por ciclo son correctos — esto se
verificó. Solo hay que cambiar el arranque al ciclo abierto.

## B4 · La cabecera del admin no se refresca tras el cierre

Después de cerrar septiembre seguía mostrando "Septiembre · Abierto" hasta
recargar. Cosmético.

## B5 · El socio ve CEROS durante todo el mes abierto 🔴

**Confirmado en vivo el 4/09.** En los ciclos 3 y 5 —ambos cerrados— el panel
muestra los puntos correctos. En el ciclo abierto muestra ceros.

```js
   socio.js:224   puntosGrupales:    rangoCiclo?.puntos_grupales || 0
   socio.js:225   puntosComputables: rangoCiclo?.puntos_computables || 0
   socio.js:226   frontalesActivos:  rangoCiclo?.frontales_activos || 0
```

Lee la fila de `rango_ciclo`, **y esa fila solo se crea al cerrar el mes**.

**Por qué importa en un MLM:** lo que empuja a un líder los últimos días del mes
es ver el contador subir y apurar a su equipo para alcanzar el rango. Si marca
cero hasta el día 30, la pantalla no sirve justo cuando más importa — y encima
parece rota.

**La solución ya existe.** `fn_rango_lineas_socio` lo calcula en vivo sin
necesitar la fila (probado: para el ciclo 5 abierto devolvió 250 + 250 y 2
frontales activos).

```
   ciclo ABIERTO   → calcular en vivo con fn_rango_lineas_socio
   ciclo CERRADO   → leer la fila guardada, SIN recalcular
```

> 🔴 **Lo segundo importa tanto como lo primero.** Un ciclo cerrado debe mostrar
> lo que **se pagó**, no lo que daría el cálculo de hoy. Si se recalcula, algún
> día no va a cuadrar con la comisión que el socio ya cobró.

---

# BLOQUE C · ANTES DE QUE ENTRE DINERO REAL

## C1 · Campo de CCI en `socio`

La empresa cobra en BCP y BBVA. Un socio de otro banco **necesita CCI** para
recibir su comisión. Hoy solo existe `socio.cuenta_bancaria`: un campo para dos
cosas distintas. El formulario de retiro ya pide CCI — la tabla no lo tiene.

## C2 · Validar la cuenta bancaria

Nadie comprueba lo que el socio escribe en P-18. Un dígito de más y la
transferencia rebota, o cae en la cuenta de otro.

## C4 · La tabla `auditoria` está VACÍA 🔴 HALLAZGO DEL 4/09

```sql
   SELECT COUNT(*) FROM auditoria   →   0
```

Existe la tabla, existe la pantalla **P-29 Auditoría**, y **nadie escribe una
sola fila**. Se descubrió al intentar usarla para averiguar quién había
modificado unos datos — y no sirvió, porque está vacía.

**Hoy no hay forma de saber quién confirmó un pago, quién cerró un ciclo, quién
cambió un porcentaje del plan ni quién dio de baja a un socio.**

En un sistema que reparte dinero entre 500 personas, el registro de quién hizo
qué y cuándo es lo primero que se pide cuando hay una disputa. Y también lo
primero que pide un contador.

**Mínimo a registrar:** confirmar pago · rechazar pago · cerrar ciclo · cambiar
configuración del plan · dar de baja a un socio · aprobar un retiro.

## C3 · Proyecto Supabase limpio

La base actual tiene **503 socios simulados** y S/. 100,261.02 en comisiones de
mentira. Es perfecta para demostrar y **no se debe borrar**: `comision` y
`wallet_movimiento` son append-only por diseño. Producción va en un proyecto
nuevo con las mismas migraciones.

---

# BLOQUE D · SIN PRISA

```
   D1 · Guardián automático de nombres de campo
        genera un schema.json desde Postgres y una prueba comprueba que
        cada .campo_cent / .campo_id usado en src/ exista de verdad
        → habría atrapado los cinco errores del bloque B

   D2 · Code splitting del bundle (795 kB → ~400 kB)

   D3 · Catálogo de la landing leído de Supabase EN BUILD
        no en runtime, para no romper el prerenderizado

   D4 · Config duplicada
        dia_pago_comisiones=5 vs dias_hasta_pago=3
        monto_minimo_retiro_cent vs retiro_minimo_cent
        valor_punto_soles=4.167 sin uso
```

---

# ORDEN PROPUESTO

```
   1º   A1  bono de rango          es un bono del plan sin conectar
   2º   B1+B2+B3+B4  los errores   son chicos y ensucian todo lo demás
   3º   A2  foto del voucher       sin ella no hay respaldo de pagos
   4º   A3  retiros, las 2 mitades + el débito de la billetera
   5º   A4  detracción             chico, y es obligación tributaria
   6º   A6  venta a cliente final  chico, y deja el triple de margen
   7º   A5  baja con reenganche    el más delicado, va al final y solo
   8º   C1+C2  CCI y validación
   9º   D1  el guardián
```

**A5 va sola.** Toca `red_ancestro`, que es de lo que depende el residual de
10 niveles. No se mezcla con nada.

---

# LO QUE SIGUE CERTIFICADO Y NO SE TOCA

```
   ✅ Motor de patrocinio    S/. 240.00 al nivel 1 verificado en vivo
   ✅ Motor de residual      escala 97% verificada contra 3 ciclos
   ✅ Activación             sin 70 pts no se cobra
   ✅ Sin compresión         lo retenido se queda en la empresa
   ✅ Cierre de ciclo        abona, abre el siguiente, deja uno solo abierto
   ✅ Seguridad              0 de 16 funciones ejecutables por anon
   ✅ Landing                publicada y verificada contra el servidor
```

> **Pendiente de certificar:** un bono residual **pagándose de verdad**. La
> recompra de Karla generó 0 porque sus 10 niveles estaban inactivos. El motor
> está probado, pero nunca lo vimos pagar en vivo.
