# QA PANTALLA POR PANTALLA

**Para:** Jack
**Escrito:** 7 de septiembre de 2026
**Cómo se usa:** abre cada pantalla, compara con el número esperado, marca ✅ o
❌. Lo que marques ❌ lo verifico yo contra Postgres antes de escribir cualquier
corrección.

> **No arregles nada mientras pruebas.** Solo marca. Si arreglamos sobre la
> marcha perdemos el hilo, que es justo lo que nos pasó hoy.

---

# EL ESTADO DE HOY — medido el 7/09 a las 23:30

Todos los números de abajo salen de esta foto:

```
   Ciclo abierto        id 30 · DICIEMBRE 2026
   Ciclo cerrado ayer   id  6 · noviembre 2026

   socios                     509   ·  502 activos
   órdenes                  1,063   ·  0 pendientes
   comisiones               2,423   ·  S/. 101,939.82
   wallet                     473   ·  Karla S/. 1,718.80
   productos activos            8
   solicitudes de afiliación  161
   solicitudes de retiro        5
   auditoría                  683
   activación ciclo 30          1 fila
   rango_ciclo del ciclo 6    509 filas
```

---

# 🔴 LO QUE YA SÉ QUE ESTÁ MAL — no hace falta que lo reportes

```
   1 · La pantalla dice "Ciclo 30" en vez de "Diciembre 2026"
       Es el ID de la fila. Saltó de 6 a 30 porque las pruebas
       crearon y borraron ciclos. NO es un daño: diciembre abrió
       bien y hay un solo ciclo abierto.

   2 · El Excel del cierre sale vacío         (lo reportaste)
   3 · Una comisión residual etiquetada como patrocinio (¿?)
       ← necesito que me digas en QUÉ pantalla la viste

   4 · En P-31 sale el pack "PRO", que NO existe
       123 solicitudes con ese código, las 123 de @ejemplo.test.
       Es basura de pruebas, como las 355 cuentas de auth.
       Se limpia en la TAREA-28. No lo reportes.
```

---

# 🟢 LO QUE PARECE UN BUG Y NO LO ES

Verificado el 7/09. **Si ves esto, es correcto:**

```
   · Máximo activo y ganando S/. 0
     Los dos únicos que compraron están a nivel 11 y 12.
     Su Pack Empresarial alcanza 10 niveles. Fuera de alcance.
     Sin compresión, ese dinero se queda en la empresa.

   · Casi todos "Inactivo (0 pts)" en el ciclo nuevo
     Diciembre acaba de abrir. Solo hay 1 fila de activación.
     Sin fila = no compró = no está activo.

   · El pack no dice qué productos lleva
     Decisión cerrada: los packs no tienen lista fija.
     Máximo los arma según stock.

   · Gold con 40% y con 50% a la vez
     40% = con qué descuento se ARMAN los productos del pack
     50% = lo que paga en cada RECOMPRA
     Son dos cosas distintas. Las dos correctas.
```

---

# BLOQUE A · LAS DEL SOCIO

## P-10 · Login

```
   Entrar con socio001@ejemplo.test
   ✅ entra y cae en P-11
   ✅ "¿Olvidaste tu contraseña?" abre el flujo, no da error
   ❌ si acepta una contraseña incorrecta
```

## P-11 · Inicio del socio

```
   ✅ El ciclo dice DICIEMBRE 2026, no "Ciclo 30"
   ✅ Puntos personales de Máximo en el ciclo nuevo: 0
   ✅ El aviso de contraseña sale (aún no la ha cambiado)
   ✅ "Te faltan 70 puntos" con la barra en 0/70
   ❌ si los días al cierre son negativos o absurdos
```

## P-12 · Mi red

```
   Con Máximo (MG00001):
   ✅ frontales directos: 6
   ✅ descendientes en total: 507
   ✅ Karla aparece a nivel 11
   ❌ si la red sale vacía o el conteo no cuadra
```

## P-13 · Tienda

```
   ✅ 8 productos
   ✅ Máximo tiene Pack Empresarial → precios al 50%
      Café: público S/. 150 → socio S/. 75
   ✅ El carrito muestra el avance hacia los 70 puntos
   ❌ si un precio de socio no es exactamente la mitad
```

## P-14 · Mis comisiones

```
   Con KARLA (MG00012), ciclo 6:
   ✅ una comisión: RESIDUAL nivel 1 · S/. 28.80
   🔴 si dice "patrocinio" → ES EL BUG. Anota la pantalla.

   Con Máximo, ciclo 6:
   ✅ vacío, con el texto de estado vacío
```

## P-15 · Mi rango

```
   ✅ Máximo: SIN RANGO
   ✅ Puntos grupales 400 · computables 250
      (el tope de línea estirada del 50% ya aplicado)
   ❌ si computables > grupales
```

## P-16 · Mi enlace

```
   ✅ https://max-global-landing.vercel.app/registro?ref=MG00001
   ✅ El botón de copiar funciona
   ℹ️ Que diga vercel es CORRECTO: el dominio aún no se conecta
```

## P-17 · Mis pedidos

```
   ✅ Máximo tiene pedidos listados
   ✅ Cada uno con su voucher, si lo tiene
   ❌ si un pedido sin comprobante muestra una imagen rota
      (debe decir "Sin comprobante adjunto")
```

## P-18 · Mi perfil

```
   ✅ Pack Empresarial
   ✅ El correo sale bloqueado (no editable)
   ✅ La tipografía se lee bien: "Pack Empresarial",
      NO "PΛCK EMPΓESΛΓIAL"
   ✅ Cambiar contraseña funciona
   ✅ "Mejorar pack" solo ofrece packs MÁS CAROS
   ❌ si ofrece uno igual o más barato
```

## P-19 · Mi billetera

```
   Con KARLA:
   ✅ saldo S/. 1,718.80
   ✅ se ve el abono de S/. 28.80 del cierre
   ✅ se ve el retiro de S/. -100.00
   ❌ si el saldo no es la suma de los movimientos
```

---

# BLOQUE B · LAS DEL ADMIN

## P-20 · Tablero

```
   ✅ 509 socios
   ✅ ciclo DICIEMBRE 2026
   ✅ 0 órdenes pendientes
   ❌ cualquier tarjeta en blanco o en cero sin explicación
```

## P-21 · Registrar pedido

```
   ✅ Con socio → precio con su descuento de pack
   ✅ Marcando "venta a cliente" → precio público, 0% descuento
   ✅ El total cuadra con la suma de líneas
   ❌ si el descuento se aplica dos veces
```

## P-22 · Registrar afiliación

```
   ✅ Al crear, muestra las credenciales UNA vez
   ✅ Botón de copiar y de WhatsApp
   ✅ Sin voucher → no inventa un placeholder
   ❌ si la contraseña se repite entre dos registros
```

## P-23 · Bandeja de confirmación

```
   ✅ 0 pendientes hoy
   ✅ Un upgrade se distingue de una afiliación normal
   ❌ si confirmar no cambia el estado
```

## P-24 · Envíos      ## P-25 · Cierre de ciclo

```
   P-25:
   ✅ dice DICIEMBRE 2026
   🔴 EL EXCEL SALE VACÍO ← ya reportado, confírmalo
   ✅ no deja cerrar dos veces el mismo ciclo
```

## P-26 · Configuración del plan

```
   ✅ 39 claves
   ✅ valor_punto_comision = 1.00
   ✅ linea_estirada_pct = 50
   ✅ url_landing apunta a vercel
   🔴 si valor_punto_comision no es 1.00, PARA TODO y avísame
```

## P-27 · Gestión de socios

```
   ✅ Total: 509 socios
   ✅ Filtro "Activos" en el ciclo nuevo → 1 socio
      (solo hay 1 fila de activación en diciembre)
   ✅ El ciclo se nombra por su MES
   ✅ "Mejorar pack" y "Baja" con confirmación
   ❌ si el filtro devuelve vacío teniendo activos
```

## P-28 · Reportes      ## P-29 · Auditoría

```
   P-29:
   ✅ 683 registros
   ✅ se ven las acciones de upgrade_pack
   ❌ si sale vacía
```

## P-30 · Retiros      ## P-31 · Solicitudes      ## P-32 · Productos

```
   P-30: ✅ 5 solicitudes
   P-31: ✅ 161 solicitudes
   P-32: ✅ 8 productos activos, con foto
         ✅ el panel de consecuencias calcula al escribir
         ❌ si existe algún botón de BORRAR producto
```

## 🔴 P-31 · LA PRUEBA MÁS IMPORTANTE DE TODA LA LISTA

Encontrado el 8/09 al mirar la pantalla de solicitudes:

```
   Solo hay 2 solicitudes REALES (las demás son de prueba):

   pack_codigo = "kit-emprendedor"   🔴 NO existe ese código
   pack_codigo = "gold"              ✅

   La landing manda   kit-emprendedor    ← el id de config.js
   La base espera     EMPRENDEDOR        ← el código real
```

**Con `gold` funciona de casualidad**, porque el slug coincide con el código
salvo mayúsculas. Con los otros cuatro no coincide:

```
   kit-emprendedor   ≠  EMPRENDEDOR
   pack-ejecutivo    ≠  EJECUTIVO
   pack-familiar     ≠  FAMILIAR
   pack-empresarial  ≠  EMPRESARIAL
```

Y la causa de fondo: **nadie valida `pack_codigo` contra la tabla `pack`.**
Se guarda cualquier texto. Por eso entraron 123 "PRO" sin que nada chillara.

### Lo que hay que probar

```
   En P-31, dale CONVERTIR a la solicitud cuyo pack
   es "kit-emprendedor" (la real, no las @ejemplo.test)

   a · ¿Convierte y le asigna Kit Emprendedor?
   b · ¿Da error?
   c · ¿Convierte pero le pone otro pack, o ninguno?
```

**Anota cuál de las tres.** La corrección es distinta en cada caso:

```
   Si convierte bien   →  solo hay que normalizar y validar
   Si falla o asigna
   mal                 →  hay que arreglar la conversión ANTES
                          de que Máximo toque ese botón con un
                          cliente de verdad
```

> Es el hallazgo más serio del QA hasta ahora: afecta al camino por el que
> entra un socio de la web, que es el camino principal del negocio.

---

# CÓMO REPORTARME

Por cada ❌, tres cosas:

```
   1 · Qué pantalla y qué esperabas
   2 · Qué salió
   3 · Captura
```

**No hace falta que diagnostiques.** Lo verifico yo contra la base antes de
escribir nada — y si resulta que es comportamiento correcto, te lo digo, como
pasó hoy con los ciclos 4 y 5.

---

# PARA MÁXIMO — preguntas de negocio, no bugs

```
   1 · El descuento de primera compra: ¿es el 40% con que se
       arman los productos del Gold, o hay otro descuento
       sobre el precio del pack?
       🔴 Si el precio del pack cambia, cambia el patrocinio
          que cobra toda la red.

   2 · ¿Quiere trazabilidad de qué productos exactos se
       entregan en cada pack? Hoy no se guarda, y es una
       funcionalidad nueva, no un arreglo.

   3 · El porcentaje de detracción — de su contador
```
