# TAREA-37 · QA EN EL NAVEGADOR, PANTALLA POR PANTALLA

**Para:** Antigravity
**Escrita:** 14 de septiembre de 2026
**Fase:** QA sobre lo DESPLEGADO

> ## 🔴 ESTA TAREA SE HACE CON EL NAVEGADOR ABIERTO
>
> No con consultas SQL. No leyendo código. **Abriendo la web, entrando con un
> usuario y haciendo clic como lo haría Máximo.**
>
> Todo lo anterior probó que los datos están bien. Esto prueba que **la pantalla
> los muestra bien y que los botones hacen lo que dicen.**

---

## 🔴 REGLA DE REPORTE

```
   Cada pantalla:
   · captura de PANTALLA COMPLETA
   · las cifras que muestra, copiadas literales
   · la consola (F12) si tiene errores en rojo
   · la pestaña Red si algo no devuelve 200
   · qué se rompió al USARLA, no al mirarla
```

```
   ❌ "P-20 funciona correctamente"
   ✅ "P-20 · Total socios: 509 · Por confirmar: 1 (S/. 120)"
```

**Número exacto o cita literal. Nunca un juicio.**

---

# DÓNDE SE PRUEBA

```
   https://max-global-backoffice.vercel.app
   https://max-global-landing.vercel.app
```

```
   🔴 Estas URLs apuntan a la base de DEMO
      (utlohnidkuvxqppmoevj · 509 socios simulados).

      Puedes MIRAR todo. Puedes registrar socios de prueba
      y hacer pedidos: es una demo y para eso está.

      NO borres socios existentes. NO cierres el ciclo.
      NO apruebes retiros reales.
      Si una prueba exige cerrar el ciclo, PARA y pregunta.
```

## Con qué cuentas

```
   Admin   socio001@ejemplo.test
   Socio   pide a Jack las credenciales de un socio con datos
           (Karla MG00012 tiene comisiones, saldo y red)
```

```
   🔴 Si la contraseña del admin no la sabes, pídesela a Jack.
      NO la adivines ni la busques en la documentación.
```

---

# PARTE 1 · LA LANDING — el camino del cliente

Se hace **antes** que el backoffice: es por donde entra la gente.

```
   1 · Portada
       · ¿carga en menos de 3 segundos?
       · el botón "Afíliate" del header, ¿se ve?
       · la foto de la hero, ¿carga?

   2 · Productos
       · ¿salen los 8?
       · ¿todos con su foto?
       · el buscador, ¿filtra?

   3 · Ficha de un producto
       · precio público y precio de socio
       · la foto, ¿de dónde viene? (mira la URL en F12)

   4 · Packs
       · los 5, con su precio
       · 🔴 "Te llevas S/. 2,000 en producto" en el Gold
       · 🔴 el Kit NO debe llevar esa línea

   5 · 🔴 EL REFERIDO — la prueba de dinero
       a · entra a  /registro?ref=MG00012
       b · ¿el header dice "Te recomendó: MG00012"?
       c · navega a Productos, luego a Packs
       d · vuelve a /registro con el botón "Afíliate"
       e · 🔴 ¿SIGUE diciendo MG00012?
           Si se perdió, el socio no cobra su comisión.

   6 · Registro
       · llena el formulario con datos de prueba
       · elige Pack Ejecutivo
       · envía
       · ¿sale la pantalla de confirmación?

   7 · Móvil a 390px
       · repite 1, 4 y 6 con el navegador a 390px
       · ¿algo se desborda, se corta o se solapa?
```

**Commit del reporte de la parte 1.**

---

# PARTE 2 · EL BACKOFFICE DEL ADMIN

Entra como admin. **Trece pantallas**, una por una.

```
   P-20  Tablero        cada tarjeta con su cifra
   P-31  Solicitudes    🔴 ¿está la que acabas de mandar
                           desde la landing?
                        ¿con qué pack_codigo llegó?
                        ¿con MG00012 como referente?
   P-22  Afiliación     registra un socio de prueba
                        🔴 ¿muestra las credenciales?
                        🔴 copia la contraseña: la necesitas
                           en la parte 3
   P-21  Pedido         con socio → precio con descuento
                        venta a cliente → precio público
                        ¿el total cuadra?
   P-23  Bandeja        ¿aparece el pedido que acabas de crear?
                        confírmalo · ¿cambia de estado?
   P-24  Envíos         qué muestra
   P-25  Cierre         🔴 NO CIERRES NADA
                        mira los números y descarga el CSV
                        ¿nombra a los excluidos y por qué?
   P-26  Configuración  39 claves · valor_punto_comision = 1.00
   P-27  Socios         busca "karla" · dale a Ficha
                        el filtro de activos, ¿cuántos da?
   P-28  Reportes       qué muestra
   P-29  Auditoría      ¿aparecen tus acciones de hoy?
   P-30  Retiros        cuántas pendientes · NO apruebes
   P-32  Productos      edita uno · cambia su precio y
                        DEVUÉLVELO a como estaba
                        🔴 anota el valor antes y después
```

**Commit del reporte de la parte 2.**

---

# PARTE 3 · EL BACKOFFICE DEL SOCIO

Entra con el socio que creaste en P-22, con su contraseña temporal.

```
   P-10  Login          ¿entra con la clave temporal?
   P-11  Inicio         🔴 ¿sale el aviso de cambiar contraseña?
                        el ciclo, ¿dice el MES o dice "Ciclo 30"?
                        el avance a 70 puntos
   P-18  Perfil         cambia la contraseña
                        🔴 sal, vuelve a entrar con la nueva
                        🔴 ¿desapareció el aviso de P-11?
   P-13  Tienda         🔴 ¿se ven las fotos de los 8 productos?
                        agrega al carrito · ¿sube el contador
                        de puntos?
   P-12  Mi red         ¿cuántos frontales y descendientes?
   P-14  Comisiones     vacío si es nuevo · ¿con texto explicativo?
   P-15  Mi rango       ¿qué dice?
   P-16  Mi enlace      copia el enlace · ábrelo en otra pestaña
                        🔴 ¿lleva a la landing con el ?ref= suyo?
   P-17  Mis pedidos    ¿está el pedido que le hiciste en P-21?
                        ¿con su voucher?
   P-19  Billetera      saldo · movimientos
```

## Y con KARLA (MG00012), que sí tiene datos

```
   P-14  🔴 selecciona el CICLO 6
         debe salir: Residual · Nivel 1 · 40% · S/. 28.80
         copia LITERAL cómo se llama esa comisión
   P-19  saldo S/. 1,718.80
   P-12  su red
   P-15  su rango y sus líneas
```

**Commit del reporte de la parte 3.**

---

# PARTE 4 · MÓVIL A 390px

```
   Repite las pantallas MÁS USADAS a 390 px de ancho:

   P-11  el panel del socio
   P-13  la tienda
   P-14  las comisiones   ← la tabla es la más ancha
   P-19  la billetera
   P-27  gestión de socios (admin)
   P-23  la bandeja
```

```
   🔴 Busca: tablas que se salen, texto cortado, botones
      que no se alcanzan, menús que tapan contenido,
      cifras que se parten en dos líneas.
```

> Los socios van a entrar desde el celular el día del cierre, a ver cuánto
> ganaron. Si la tabla de comisiones no se lee en un teléfono, el sistema
> falla en el único momento que de verdad importa.

**Commit del reporte de la parte 4.**

---

# LO QUE NO HAY QUE REPORTAR — ya verificado

```
   · Casi todos "Inactivo (0 pts)" en el ciclo abierto
     La activación se acumula al confirmar cada orden.
     Sin fila = no compró. Es correcto.

   · El pack "PRO" en solicitudes viejas
     Basura de pruebas anterior a la validación.

   · El enlace de referido apunta a vercel
     Correcto: el dominio aún no se conecta.

   · "Ciclo 30" en vez de "Diciembre 2026" en alguna pantalla
     Es el id de la fila. Ya está anotado.
```

---

# CÓMO SE ENTREGA

```
   00-INSTRUCCIONES/REPORTE-QA-NAVEGADOR-14-09.md

   Las 4 partes, cada pantalla con su captura y sus cifras.
   Al final, UNA tabla con todo lo que se rompió,
   ordenado por gravedad:

   🔴 impide operar o toca dinero
   🟡 molesta pero se puede trabajar
   🟢 estético
```

```
   🔴 Esta tarea NO cambia código.
      Al terminar, git diff --stat debe estar VACÍO.
      Si encuentras un fallo, lo anotas y sigues.
```

**Imágenes, no descripciones. Una pantalla sin captura no está probada.**
