# TAREA-20 · EL REGISTRO PÚBLICO CON REFERIDO

**Para:** Antigravity
**Escrita:** 5 de septiembre de 2026
**Toca los DOS proyectos: la landing y el backoffice.**

> **Es la única funcionalidad del sistema que nunca se probó, porque nunca se
> cerró el círculo.** Y es la que hace crecer la red: sin ella, cada afiliación
> tiene que nacer de un WhatsApp escrito a mano.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, en **cada uno de los dos proyectos**:

```bash
git status --short
npm run build
npx vitest run
```

**Si `git status --short` no está vacío en alguno, la tarea no está terminada.**
**Commit después de CADA bloque.**

---

# EL CÍRCULO ROTO — verificado en el código el 5/09

```
   1 · Karla abre "Mi Enlace" y copia su link
       P16MiEnlace.jsx:88  →  window.location.origin
       Genera: localhost:5174/registro?ref=MG00012
       El backoffice NO tiene ruta /registro  →  404

   2 · Si apuntara bien, el prospecto llenaría el formulario
       de la landing

   3 · Registro.jsx:50  →  sessionStorage.setItem('mg_registro', ...)
       Registro.jsx:65  →  navigate('/confirmacion')

       Los datos se guardan en el navegador DEL VISITANTE.
       No hay insert, no hay correo, no hay WhatsApp con los datos.

   4 · Máximo nunca se entera de que alguien se quiso afiliar

   5 · Y el ?ref= de Karla se pierde: nadie sabe que fue ella
```

---

# LA ARQUITECTURA — y por qué NO se pone Supabase en la landing

**La landing es un sitio estático puro.** No tiene `@supabase/supabase-js`, no
tiene variables de entorno, y se prerenderiza a HTML plano para que WhatsApp y
Google la lean.

```
   ❌ NO instalar @supabase/supabase-js en la landing
      · engorda el bundle de un sitio que hoy pesa poco
      · expone la anon key en el HTML público
      · mete una dependencia de base de datos en una vitrina

   ✅ Una Edge Function de Supabase que recibe el POST
      · la landing hace un fetch() y nada más
      · ninguna clave viaja al navegador
      · la validación y el rate limit viven del lado del servidor
      · la landing sigue siendo estática y prerenderizable
```

---

# BLOQUE 1 · LA TABLA

```sql
   CREATE TABLE solicitud_afiliacion (
     id              bigserial PRIMARY KEY,
     nombres         varchar NOT NULL,
     apellidos       varchar NOT NULL,
     documento       varchar,
     telefono        varchar NOT NULL,
     email           varchar NOT NULL,
     departamento    varchar,
     provincia       varchar,
     distrito        varchar,
     direccion       varchar,
     pack_codigo     varchar,
     ref_codigo      varchar,          -- el ?ref= tal como llegó
     patrocinador_id bigint REFERENCES socio(id),  -- resuelto al insertar
     estado          varchar NOT NULL DEFAULT 'nueva',
                     -- 'nueva' | 'contactada' | 'convertida' | 'descartada'
     socio_id        bigint REFERENCES socio(id),  -- cuando se convierte
     motivo_descarte text,
     origen          varchar DEFAULT 'landing',
     ip              varchar,
     creado_en       timestamptz DEFAULT now(),
     atendida_por    bigint REFERENCES socio(id),
     atendida_en     timestamptz
   );
```

## RLS — esto es lo que más importa de la tabla

```
   SELECT   solo admin (fn_is_admin)
   INSERT   NADIE desde el cliente. Solo la Edge Function,
            que usa la service role key
   UPDATE   solo admin (para cambiar el estado)
   DELETE   nadie
```

> 🔴 **`anon` NO puede insertar directamente.** Si se le da permiso, cualquiera
> puede llenar la tabla con miles de filas basura desde la consola del
> navegador. **La única puerta es la Edge Function.**

**Commit.**

---

# BLOQUE 2 · LA EDGE FUNCTION

Función `registro-afiliacion`. Recibe un POST con los datos del formulario.

## Qué hace, en orden

```
   1 · Valida que vengan los obligatorios:
       nombres · apellidos · telefono · email · pack_codigo

   2 · Valida formato: email con @, teléfono de 9 dígitos,
       documento solo números si viene

   3 · Resuelve el referido:
       · si ref_codigo existe y el socio está ACTIVO → patrocinador_id
       · si el código no existe, o el socio está de BAJA
         → patrocinador_id = null  (queda para la empresa)
       · el ref_codigo se guarda SIEMPRE tal como llegó,
         aunque no resuelva

   4 · Rate limit: máximo 3 solicitudes por IP por hora.
       Si se pasa, devuelve 429 sin insertar.

   5 · Anti-duplicado: si ya hay una solicitud 'nueva' con el mismo
       email en las últimas 24 horas, no crea otra. Devuelve éxito
       igual, para no darle pistas a un bot.

   6 · Inserta y devuelve { ok: true }
```

## 🔴 Lo que NO devuelve nunca

```
   ❌ El id de la solicitud
   ❌ Si el código de referido existía o no
   ❌ Ningún dato de ningún socio
```

**Un endpoint público no confirma si un código existe.** Si lo hiciera,
cualquiera podría averiguar los códigos de todos los socios probando.

**Commit.**

---

# BLOQUE 3 · LA LANDING

## 3.1 · El formulario envía de verdad

`src/pages/Registro.jsx`, en `handleSubmit`:

```
   1 · POST a la Edge Function con los datos + el ref
   2 · Mientras responde: el botón se deshabilita y dice "Enviando..."
   3 · Si responde ok  → navigate('/confirmacion')
   4 · Si falla la red → mensaje claro y un botón de WhatsApp
                          como salida, con los datos ya escritos
                          ← que un fallo de red no pierda al prospecto
```

## 3.2 · La URL de la Edge Function va en `src/config.js`

```
   ❌ NO se escribe la URL en el componente
   ✅ Va en config.js, junto a EMPRESA
```

## 3.3 · La confirmación deja de mentir

Hoy `/confirmacion` muestra los datos desde `sessionStorage`. Ahora que la
solicitud sí se registró, el texto debe reflejarlo:

```
   "Recibimos tu solicitud. Un asesor te va a contactar por
    WhatsApp para coordinar el pago y activar tu cuenta."
```

**Commit.**

---

# BLOQUE 4 · EL ENLACE DEL SOCIO — P-16

```js
   ❌ P16MiEnlace.jsx:88
      const dominioBase = window.location.origin
      // el respaldo dice 'https://maxglobal.pe', que NO es el dominio
      // del proyecto
```

```
   ✅ La URL de la landing sale de config del sistema:
      clave `url_landing`, editable desde P-26

      Hoy vale: https://max-global-landing.vercel.app
      El día del pago del 50% se cambia a maxglobaloficial.com
      SIN tocar código
```

Y el mensaje de WhatsApp que ya arma esa pantalla debe llevar el enlace bueno.

**Commit.**

---

# BLOQUE 5 · LA BANDEJA DEL ADMIN — P-31

Pantalla nueva: **Solicitudes de afiliación**.

```
   Lista de solicitudes NUEVAS, la más antigua primero

   Por cada una:
     nombre · teléfono · correo · pack que eligió
     quién la refirió (o "sin referido → empresa")
     cuándo llegó

   Acciones:
     · Llamar por WhatsApp   (abre wa.me con el teléfono)
     · Convertir en socio    → lleva a P-22 con TODO precargado:
                               datos, pack y patrocinador
     · Descartar             con motivo obligatorio
```

## Al convertir

```
   1 · P-22 se abre con los campos ya llenos
   2 · Máximo completa el comprobante de pago y registra
   3 · La solicitud pasa a 'convertida' y guarda el socio_id
   4 · Queda el rastro: de qué solicitud salió cada socio
```

> **Máximo igual tiene que confirmar el pago a mano** — eso no cambia. Lo que se
> gana es que **deja de transcribir datos** y que **ningún prospecto se pierde**.

**Y se registra en `auditoria`:** convertir y descartar son acciones de admin,
igual que las siete de la TAREA-19.

**Commit.**

---

# BLOQUE 6 · LOS TRES ARREGLOS CHICOS QUE VAN DE PASO

```
   1 · P15MiRango.jsx:100
       const puntosPersonales = rc.puntos_personales || 0;
       ← lee de rango_ciclo, que NO existe en un ciclo abierto
       ← debe leer de la tabla `activacion`, como ya hace P-11

       Efecto hoy: a un socio ACTIVO con 72 puntos le dice
       "tienes 0 de los 70 pts" y que no va a cobrar.
       Verificado contra Postgres: activo=true, 72 puntos.

   2 · P14MisComisiones.jsx:101
       render: (f) => (f.nivel ? `Nivel ${f.nivel}` : 'Bono Global')
       ← el bono de RANGO tampoco tiene nivel y sale etiquetado
         como "Bono Global", que ni siquiera se paga en la v1
       ← debe mostrar el tipo real de la comisión

   3 · P12MiRed.jsx:123
       useState(3)  ← arranca en un ciclo cerrado
       ← debe arrancar en el ciclo ABIERTO, como se corrigió en P-11
```

**Commit.**

---

# BLOQUE 7 · LAS PRUEBAS

## De la Edge Function

```
   1 · Un POST válido con ref de un socio activo crea la solicitud
       con patrocinador_id resuelto

   2 · Un POST con un ref que NO existe crea la solicitud con
       patrocinador_id = null y ref_codigo guardado igual

   3 · Un POST con el ref de un socio en BAJA → patrocinador_id null

   4 · Un POST sin email o sin teléfono es rechazado

   5 · Cuatro POST desde la misma IP en una hora: el cuarto
       devuelve 429

   6 · Dos POST con el mismo email en 24h crean UNA sola solicitud

   7 · 🔴 `anon` NO puede insertar en solicitud_afiliacion
       directamente — con sesión real

   8 · 🔴 Un socio NO puede leer solicitud_afiliacion
```

## Del recorrido completo

```
   9 · Convertir una solicitud crea el socio con el patrocinador
       correcto y deja la solicitud en 'convertida' con su socio_id

  10 · Descartar sin motivo falla
```

## De los arreglos chicos

```
  11 · Con un ciclo ABIERTO y 72 puntos en `activacion`,
       P-15 muestra 72 y dice que está activo   ← número a mano

  12 · Una comisión de tipo 'rango' NO se etiqueta "Bono Global"
```

**La 7 y la 8 son las de seguridad y son obligatorias.**

**Commit.**

---

# BLOQUE 8 · VERIFICACIÓN

```sql
-- 1 · las políticas de la tabla nueva
SELECT policyname, cmd FROM pg_policies
WHERE tablename='solicitud_afiliacion' ORDER BY policyname;
-- SELECT y UPDATE solo admin · ninguna de INSERT para anon
-- ninguna de DELETE

-- 2 · la clave de la URL existe
SELECT clave, valor FROM config WHERE clave='url_landing';

-- 3 · tras las pruebas, las solicitudes resolvieron bien el referido
SELECT ref_codigo, patrocinador_id, estado, COUNT(*)
FROM solicitud_afiliacion GROUP BY 1,2,3 ORDER BY 1;
```

## El recorrido de punta a punta — con capturas

```
   1 · P-16 de Karla mostrando el enlace con el dominio de la LANDING
   2 · Ese enlace abierto: la landing con el formulario, no un 404
   3 · El formulario enviado y la pantalla de confirmación
   4 · P-31 con la solicitud recién llegada y "Referido por: KARLA"
   5 · P-22 abierto desde ahí, con los datos ya precargados
```

**Imágenes, no descripciones.** Esas 5 capturas son el círculo cerrado.

---

# LO QUE NO SE TOCA

```
   ❌ @supabase/supabase-js NO se instala en la landing
   ❌ El prerenderizado de la landing — 17 rutas, no se rompe
   ❌ src/motor/ — todo
   ❌ Las funciones SQL de comisiones, cierre, retiros y baja
   ❌ P-22 · su lógica no cambia, solo se le pueden precargar campos
   ❌ Las 508 filas de socio
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

```
   socios              508
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet              471   · saldo de Karla S/. 1,790.00
   config               38 claves + url_landing = 39
```

**Terminada esta tarea, el sistema queda completo: un prospecto puede llegar
desde el enlace de un socio y convertirse en socio sin que se pierda un dato en
el camino.**
