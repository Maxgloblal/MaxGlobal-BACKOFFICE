# TAREA-05 · AUTENTICACIÓN Y SESIÓN — tanda 1 del backoffice

**Para:** Antigravity
**Escrita:** 1 de septiembre de 2026
**Depende de:** TAREA-04A ✅ · TAREA-04B ✅ (el motor está terminado)

> **Sin esta tarea no hay backoffice.** Hay 501 socios en la base y **cero
> usuarios de autenticación**. Las 47 políticas de seguridad cuelgan del correo
> de la sesión; sin sesión, un socio no ve absolutamente nada.

**Lee `AGENTS.md` antes de explorar nada.**

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, siempre:

```bash
git status --short
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**

---

# CÓMO FUNCIONA LA SEGURIDAD DE ESTE SISTEMA

Léelo antes de escribir una línea. **Todo depende de esto.**

```sql
-- así identifica la base a quien consulta
CREATE FUNCTION fn_current_socio_id() RETURNS bigint AS $$
  SELECT id FROM socio WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;
```

```
   Supabase Auth guarda el usuario y su contraseña
              ↓  emite un JWT con el email
   fn_current_socio_id() cruza ese email contra socio.email
              ↓
   las 47 políticas RLS filtran por ese id
```

**El puente entre las dos mitades es el correo electrónico.** Si un socio no
tiene usuario en `auth.users` con exactamente el mismo correo, para la base es
un desconocido.

## 🔴 `socio.password_hash` NO SE USA. Nunca.

La columna existe en la tabla pero **la autenticación la hace Supabase**.

```
   ❌  comparar contraseñas contra socio.password_hash
   ❌  escribir tu propio login
   ✅  supabase.auth.signInWithPassword({ email, password })
```

**Si alguna vez ves código leyendo `password_hash`, está mal.** Esa columna es
un resto del diseño inicial y hay que tratarla como si no existiera.

---

# BLOQUE 0 · CREAR USUARIOS DE PRUEBA

Sin esto no se puede probar nada.

## No crees 501. Crea 10.

```
   1 · El admin — socio id 1
   2 · ANA QUISPE, id 2, GOLD, con red y comisiones
   3 · KARLA DIAZ, id 12, GOLD, al fondo de la cadena
   4 · LUIS TORRES, id 13, EMPRENDEDOR, nunca activo
   5 al 10 · seis socios generados con distintos rangos y estados
```

Elige socios que **tengan datos que mostrar**: comisiones cobradas, rango
alcanzado, red por debajo. Un socio vacío no prueba nada.

Créalos con la API de administración de Supabase, con el **mismo correo** que
tiene la fila en `socio` y una contraseña de prueba conocida. Documenta en el
reporte el correo y la contraseña de los diez.

## 🔴 Los cuatro estados que exige la especificación

Hoy los 501 socios están en `activo`. **Faltan los otros tres** y sin ellos no
se pueden probar los requisitos RF-206 al RF-209.

```sql
-- deja uno de cada, entre los socios de prueba
UPDATE socio SET estado='pendiente'  WHERE id = <uno>;
UPDATE socio SET estado='inactivo'   WHERE id = <otro>;
UPDATE socio SET estado='suspendido' WHERE id = <otro>;
```

**No toques el estado de los demás.** Solo de los de prueba.

**Commit.**

---

# BLOQUE 1 · EL CONTEXTO DE SESIÓN

Crea `src/auth/SesionContext.jsx`.

## Qué expone

```
   socio          la fila completa de la tabla socio, o null
   sesion         la sesión de Supabase, o null
   cargando       true mientras se resuelve al abrir la app
   esAdmin        socio.rol es 'admin' o 'superadmin'
   entrar(email, password)
   salir()
```

## 🔴 El estado "cargando" no es opcional

Al abrir la app, Supabase tarda unos milisegundos en resolver si hay sesión
guardada. **Si pintas las rutas antes de saberlo, el usuario ve el login por un
instante aunque esté logueado**, o peor, lo echas fuera.

```
   mientras cargando === true  →  no se decide nada, se muestra un cargando
```

## Cómo se obtiene el socio

Después de autenticar, **una sola consulta**:

```js
supabase.from('socio').select('*').eq('email', sesion.user.email).single()
```

**No uses el id del usuario de auth.** El puente es el correo.

## Si hay sesión pero no hay fila en `socio`

Puede pasar: alguien con usuario de Supabase que no es socio.

```
   ❌  dejarlo entrar con socio = null y que todo reviente
   ✅  cerrar la sesión y mostrar "esta cuenta no está registrada como socio"
```

## Escucha los cambios de sesión

`supabase.auth.onAuthStateChange` para que cerrar sesión en otra pestaña se
refleje aquí. **Cancela la suscripción al desmontar.**

**Commit.**

---

# BLOQUE 2 · LA PANTALLA P-10 · INICIO DE SESIÓN

`src/paginas/P10InicioSesion.jsx`

## Lo que pide la especificación

| Requisito | Qué hacer |
|---|---|
| RF-201 | Autenticar con correo y contraseña |
| RF-202 | Limitar intentos fallidos |
| RF-203 | Recuperar contraseña sin el administrador |
| RF-204 | Contraseñas con hash, nunca en texto plano |
| RF-205 | La sesión expira por inactividad |

**RF-204 lo cumple Supabase solo.** Tú no guardas contraseñas en ningún sitio.

## RF-202 · Límite de intentos

Supabase ya limita por su cuenta, pero el mensaje que devuelve es técnico.
**Cuenta los fallos en el cliente** y a partir del quinto muestra un aviso claro
con el tiempo de espera. No es seguridad real —eso lo pone Supabase— es que el
usuario entienda qué pasa.

## RF-203 · Recuperar contraseña

`supabase.auth.resetPasswordForEmail(email)`.

> **Nunca digas si el correo existe o no.** Siempre el mismo mensaje: *"Si ese
> correo está registrado, te llegará un enlace"*. Decir lo contrario permite
> averiguar quién es socio y quién no.

## Los mensajes de error, en español y sin tecnicismos

```
   ❌  "Invalid login credentials"
   ✅  "Correo o contraseña incorrectos"

   ❌  "Failed to fetch"
   ✅  "No hay conexión. Revisa tu internet e inténtalo de nuevo"
```

## Diseño

Usa los tokens de `src/estilos/tokens.css` y las piezas que ya existen en
`src/piezas/`. **No inventes estilos nuevos ni colores a mano.**

Funciona a **390px** y en escritorio.

**Commit.**

---

# BLOQUE 3 · RUTAS PROTEGIDAS Y REDIRECCIÓN POR ESTADO

## Nadie entra sin sesión

Todas las rutas bajo `/socio` y `/admin` exigen sesión. Sin ella, al login.

**Y guarda a dónde quería ir**, para llevarlo ahí después de entrar. Si alguien
abre el enlace de sus comisiones y tiene que loguearse, termina en sus
comisiones, no en el panel.

## Solo el admin entra a `/admin`

```
   socio.rol IN ('admin','superadmin')
```

Un socio normal que escriba `/admin` a mano **no ve la pantalla**. Aunque la
base lo bloquearía igual por RLS, la pantalla no debe ni cargarse.

## 🔴 Las cuatro redirecciones por estado

| Estado | A dónde va | Qué ve |
|---|---|---|
| `activo` | su panel completo | todo |
| `pendiente` | pantalla de espera | solo el estado de su solicitud, nada más |
| `inactivo` | su panel | **con un aviso visible** de que no está activo |
| `suspendido` | pantalla informativa | el motivo y con quién contactar |

**El `pendiente` no puede ver su red ni sus comisiones.** Todavía no es socio.

**Commit.**

---

# BLOQUE 4 · PROBAR QUE EL RLS FUNCIONA DE VERDAD

**Esta es la primera vez que se puede probar.** Hasta ahora las pruebas de
seguridad solo verificaban que un anónimo no viera nada. Ahora hay que
comprobar que **un socio autenticado ve lo suyo y solo lo suyo.**

`src/test/auth-rls.test.js` — con sesión real, no simulada:

```
   ☐  ANA (id 2) entra y ve su propia fila de socio
   ☐  ANA ve a sus descendientes en la red
   ☐  🔴 ANA NO ve a un socio que no está en su descendencia
   ☐  🔴 ANA solo ve las comisiones donde ella es beneficiaria
   ☐  🔴 ANA NO ve la billetera de otro socio
   ☐  🔴 ANA NO puede escribir en comision
   ☐  el ADMIN ve todos los socios
   ☐  el ADMIN ve todas las comisiones
   ☐  sin sesión: 0 filas en todo
```

**Las cuatro marcadas en rojo son las que importan.** Si alguna falla, un socio
puede ver el dinero de otro y eso es la Ley 29733.

Y de las pantallas:

```
   ☐  entrar con credenciales correctas lleva al panel
   ☐  entrar con credenciales malas muestra el mensaje en español
   ☐  un socio pendiente NO llega al panel
   ☐  un socio suspendido ve la pantalla informativa
   ☐  un socio normal escribiendo /admin no entra
   ☐  recargar la página mantiene la sesión
   ☐  cerrar sesión lleva al login
```

Playwright a **390px y escritorio**.

**Commit.**

---

# LO QUE ENTREGAS

```
   1 · Los 10 correos y contraseñas de prueba, con su id de socio
       y qué estado tiene cada uno
   2 · La salida literal de vitest
   3 · Confirmación de que las 4 pruebas de aislamiento pasan
   4 · git status --short vacío, pegado literal
   5 · Lo que decidiste no hacer, y por qué
```

---

# LO QUE NO SE TOCA

```
   ❌ El motor de comisiones      terminado y verificado
   ❌ La red simulada             NO resembrar
   ❌ Las 47 políticas RLS        están bien. Esta tarea las USA, no las cambia
   ❌ socio.password_hash         columna muerta. Ni la leas ni la borres
   ❌ Las 5 pantallas existentes  siguen con datos falsos.
                                  Conectarlas es la tanda siguiente
```

---

# LO QUE VIENE DESPUÉS — para que sepas hacia dónde

```
   TANDA 2   P-21 · P-22 · P-23 · P-24    operación mínima del admin
   TANDA 3   P-11 · P-14 · P-15 · P-19    el socio ve su dinero
   TANDA 4   P-12 · P-13 · P-16 · P-17 · P-18
   TANDA 5   P-20 · P-25 · P-26 · P-27 · P-28 · P-29
```

**No empieces ninguna todavía.**
