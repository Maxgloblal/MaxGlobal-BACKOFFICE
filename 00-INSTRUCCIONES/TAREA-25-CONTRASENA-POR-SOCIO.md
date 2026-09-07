# TAREA-25 · CONTRASEÑA ÚNICA POR SOCIO

**Para:** Antigravity
**Escrita:** 6 de septiembre de 2026

> ## 🔴 ESTA VA ANTES QUE CUALQUIER OTRA
>
> **Hoy todos los socios nacen con la misma contraseña, escrita a fuego en el
> código.** Cualquiera que la conozca entra a la cuenta de cualquier socio
> sabiendo solo su correo — y ahí se ve cuánto gana y se piden retiros.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**:

```bash
git status --short
npm run build
npx vitest run
```

**Commit después de CADA bloque.**

---

# EL PROBLEMA — verificado el 6/09

```sql
   fn_registrar_afiliacion_socio, al crear la cuenta:

   encrypted_password := extensions.crypt(
       'MaxGlobal2026!',            ← 🔴 LITERAL, IGUAL PARA TODOS
       extensions.gen_salt('bf')
   )
```

Esa es exactamente la contraseña de las cuentas de prueba del proyecto.

```
   Efecto: quien la sepa entra a cualquier cuenta
           con solo saber el correo del socio
```

## Lo que sí funciona y NO se toca

```
   ✅ P-18 · cambiar contraseña (RF-283)
   ✅ P-10 · "¿Olvidaste tu contraseña?" con resetPasswordForEmail
```

---

# LA DECISIÓN — tomada por Jack el 6/09

> *"mejor sería darle su contraseña y que adentro se pueda cambiar, porque la
> gente no mira su correo ni lo va a usar. Suficiente con 'ahí están tus
> credenciales' y cambia la contraseña dentro y listo."*

```
   1 · La función genera una contraseña ALEATORIA por socio
   2 · La devuelve UNA SOLA VEZ en la respuesta
   3 · P-22 se la muestra al admin para que se la pase por WhatsApp
   4 · El socio la cambia desde P-18, que ya existe
```

**No se manda correo.** Máximo opera por WhatsApp y así se queda.

---

# BLOQUE 1 · LA CONTRASEÑA ALEATORIA

En `fn_registrar_afiliacion_socio`:

```
   1 · Generar una contraseña aleatoria de 10 caracteres
       Letras mayúsculas, minúsculas y números.

       🔴 SIN caracteres ambiguos: nada de O/0, l/1/I
          El admin la va a dictar o copiar a WhatsApp.
          Una "l" que parece "1" es una llamada de soporte.

   2 · Usarla en el crypt() en vez del literal

   3 · Devolverla en el jsonb de respuesta, como `password_temporal`
       junto a 'exito', 'socio_id' y 'codigo' que ya devuelve
```

```
   🔴 La contraseña NO se guarda en ninguna tabla en texto plano.
      Vive solo en el retorno de esa llamada. Si el admin la
      pierde, se usa "olvidé mi contraseña" — no se recupera
      de la base.

   🔴 NO se toca socio.password_hash. Esa columna no autentica:
      quien autentica es Supabase Auth. Se deja como está.
```

**Commit.**

---

# BLOQUE 2 · P-22 LA MUESTRA UNA SOLA VEZ

En la pantalla de éxito, donde hoy dice el código y el pack:

```
   ┌────────────────────────────────────────────────────┐
   │  CREDENCIALES DE ACCESO                            │
   │                                                     │
   │  Usuario      ruth.condori@ejemplo.test            │
   │  Contraseña   K7mpQx4rTs          [Copiar]         │
   │                                                     │
   │  ⚠️  Anótala ahora. No se vuelve a mostrar.        │
   │      Pásasela al socio y que la cambie desde        │
   │      su perfil.                                     │
   │                                                     │
   │  [ Enviar credenciales por WhatsApp ]              │
   └────────────────────────────────────────────────────┘
```

```
   1 · Botón de copiar al portapapeles
   2 · Botón de WhatsApp con el mensaje ya escrito:
       correo, contraseña, el enlace del sistema y la
       indicación de cambiarla
   3 · El aviso de "no se vuelve a mostrar" bien visible
```

**Commit.**

---

# BLOQUE 3 · EL AVISO DENTRO DEL SISTEMA

Mientras el socio no cambie su contraseña, en su panel (P-11):

```
   ⚠️  Estás usando la contraseña que te dieron al registrarte.
       Cámbiala desde Mi Perfil.        [ Cambiar ahora → ]
```

```
   Para saberlo: una columna nueva en socio
     password_cambiada  boolean  DEFAULT false

   · Se pone en true cuando el socio cambia su contraseña en P-18
   · Los 510 socios existentes quedan en false — es lo correcto,
     ninguno la ha cambiado
```

```
   🔴 Es un AVISO, no un bloqueo. El socio entra y opera igual.
      Bloquearle el acceso hasta que la cambie es fricción para
      alguien que acaba de pagar S/. 1,200.
```

**Commit.**

---

# BLOQUE 4 · EL PLACEHOLDER DEL VOUCHER — va de paso

En la misma función, más abajo:

```sql
   COALESCE(p_voucher->>'imagen_url',
            'https://placehold.co/400x300?text=Voucher+Afiliacion')
```

**La TAREA-14 pidió que sin foto quedara `null`** — *"null es null"* — pero como
esa tarea decía no tocar funciones SQL, esto quedó pendiente.

```
   Se quita el COALESCE. Si no hay imagen, va NULL.
```

**Por qué importa:** un `imagen_url` con un placeholder hace creer que hay
comprobante cuando no lo hay. `null` es honesto y P-23 ya sabe mostrar
"Sin comprobante adjunto".

**Lo mismo en `fn_registrar_pedido_recompra` si tiene el mismo COALESCE.**

```
   🔴 NO se tocan las 1,048 filas de voucher que ya existen.
      Solo el comportamiento de aquí en adelante.
```

**Commit.**

---

# BLOQUE 5 · LAS PRUEBAS

```
   1 · Dos afiliaciones seguidas generan contraseñas DISTINTAS
   2 · La contraseña devuelta tiene 10 caracteres
   3 · No contiene O, 0, l, 1 ni I
   4 · La contraseña devuelta SIRVE para iniciar sesión
       ← se registra un socio y se entra con ella, de verdad
   5 · 'MaxGlobal2026!' YA NO sirve para un socio nuevo
   6 · La contraseña NO aparece en ninguna tabla en texto plano
   7 · Al cambiarla en P-18, password_cambiada pasa a true
   8 · Registrar sin voucher deja imagen_url en NULL,
       no en placehold.co
   9 · Los 510 socios existentes siguen pudiendo entrar
       ← las cuentas viejas NO se tocan
```

**La 4 y la 5 son las que prueban que el cambio sirve.** La 9 es la que protege
lo que ya funciona.

**Commit.**

---

# BLOQUE 6 · VERIFICACIÓN

```sql
-- 1 · el literal ya no está en la función
SELECT position('MaxGlobal2026!' in pg_get_functiondef(p.oid)) tiene_literal
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='fn_registrar_afiliacion_socio';
-- debe devolver 0

-- 2 · el placeholder tampoco
SELECT position('placehold.co' in pg_get_functiondef(p.oid))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='fn_registrar_afiliacion_socio';
-- debe devolver 0

-- 3 · la columna nueva y su valor
SELECT COUNT(*) total,
       COUNT(*) FILTER (WHERE password_cambiada) cambiadas
FROM socio;
-- total 510 · cambiadas 0 (salvo las de prueba)

-- 4 · las cuentas de auth existentes no se tocaron
SELECT COUNT(*) FROM auth.users;
-- 366, el mismo número de antes
```

## Capturas

```
   1 · P-22 mostrando las credenciales con el botón de copiar
       y el de WhatsApp
   2 · El aviso en el panel del socio
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ Las 366 cuentas de auth que ya existen
      Los socios de prueba deben seguir entrando con MaxGlobal2026!
   ❌ P-18 · el cambio de contraseña ya funciona
   ❌ P-10 · el "olvidé mi contraseña" ya funciona
   ❌ socio.password_hash — no autentica, se deja
   ❌ Las 1,048 filas de voucher existentes
   ❌ src/motor/ · el cierre · las comisiones · la red
```

---

# UNA NOTA PARA EL FUTURO — no es de esta tarea

```
   socios       510
   auth.users   366
   → 144 socios del sembrado NO tienen cuenta de login
```

Son de la red simulada, creados antes de que la función tocara `auth`. **En la
base de demo no importa**, pero confirma que producción tiene que arrancar en un
proyecto Supabase limpio.

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

```
   socios              510
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet              471   · saldo de Karla S/. 1,790.00
   productos             8   · precios y puntos sin cambios
   auth.users          366
```
