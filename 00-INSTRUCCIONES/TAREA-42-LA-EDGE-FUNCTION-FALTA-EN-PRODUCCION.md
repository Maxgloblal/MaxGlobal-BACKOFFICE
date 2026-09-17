# TAREA-42 · La Edge Function falta en producción

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 BLOQUEANTE · el cliente ya tiene el sistema en las manos
**Fecha del hallazgo:** 16 de septiembre de 2026

---

# EL SÍNTOMA

Cualquier persona que intente afiliarse desde la web pública recibe esto:

```
   Failed to fetch
```

Probado en `max-global-landing.vercel.app/registro?ref=MG00001`.

**El enlace de referido NO está roto.** El campo de patrocinador se llena solo
y correctamente con `MG00001`. Lo que falla es el envío del formulario.

---

# LA CAUSA, YA VERIFICADA

No hay que investigarla. Está confirmada consultando las dos bases:

```
   DEMO         utlohnidkuvxqppmoevj
                registro-afiliacion  ACTIVE  v2  verify_jwt: false

   PRODUCCIÓN   xkiwnxoferdfapezcwoq
                (cero Edge Functions)
```

La landing envía a `${VITE_SUPABASE_URL}/functions/v1/registro-afiliacion`.
Las variables de Vercel están bien y apuntan a producción. El problema es que
en producción esa función nunca se desplegó.

**Por qué apareció recién ahora:** antes de la TAREA-41 la landing tenía la URL
de la demo escrita a mano, así que el formulario funcionaba pero guardaba los
registros en la base equivocada. La TAREA-41 no rompió nada: destapó un hueco
que ya estaba.

**Por qué se escapó:** los ocho módulos SQL del instalador crean tablas,
funciones de Postgres, triggers, políticas y semilla. **No crean Edge
Functions.** Y el manual de instalación no lo mencionaba en ninguno de sus
pasos. Ya se corrigió el manual; falta ejecutar el despliegue.

---

# LO QUE HAY QUE HACER

## 1 · Desplegar la función

El código fuente ya existe y está correcto. **No lo modifiques.**

```
supabase/functions/registro-afiliacion/index.ts
```

Lee las credenciales de `Deno.env.get("SUPABASE_URL")` y
`Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`, que Supabase inyecta solo en cada
proyecto. No tiene ninguna referencia escrita a mano a ningún proyecto.

```bash
supabase functions deploy registro-afiliacion \
  --project-ref xkiwnxoferdfapezcwoq \
  --no-verify-jwt
```

```
   🔴 --no-verify-jwt NO ES OPCIONAL.

   Quien se registra es un visitante anónimo que todavía
   no tiene cuenta. Con la verificación activada, la
   función rechaza TODAS las solicitudes legítimas y el
   síntoma no cambia.

   En la demo está con verify_jwt: false. Producción
   tiene que quedar igual.
```

## 2 · No toques nada más

```
   🔴 No modifiques index.ts
   🔴 No cambies las variables de Vercel: ya están bien
   🔴 No toques la landing: ese lado ya se arregló en la TAREA-41
```

Si crees que hace falta cambiar algo más, **para y dilo antes de tocarlo**.

---

# CÓMO SE COMPRUEBA QUE QUEDÓ

## Comprobación 1 · La función existe

```bash
supabase functions list --project-ref xkiwnxoferdfapezcwoq
```

Debe aparecer `registro-afiliacion`, `ACTIVE`, `verify_jwt: false`.

## Comprobación 2 · El recorrido real, de punta a punta

Esta es la que vale. **En ventana de incógnito y sin sesión iniciada**, porque
así llega un desconocido:

```
1 · Abre  max-global-landing.vercel.app/registro?ref=MG00001
2 · Comprueba que el campo de patrocinador se llenó con MG00001
3 · Llena el formulario con datos de prueba
     · teléfono de 9 dígitos
     · correo que no hayas usado en las últimas 24 horas
4 · Envía
```

```
   Esperado:  mensaje de éxito
   NO:        "Failed to fetch"
```

## Comprobación 3 · El dato llegó donde debe

Entra al panel de administración de **producción** y abre la pantalla de
Solicitudes de afiliación.

```
   Debe aparecer la solicitud que acabas de crear,
   con el patrocinador YA RESUELTO a MG00001,
   no en blanco.
```

Si aparece pero con el patrocinador vacío, **no lo des por bueno**: significa
que la función no está resolviendo el referido y hay que revisarlo.

---

# REPORTA

```
· La salida de  supabase functions list  pegada tal cual
· Qué pasó al enviar el formulario en incógnito
· Una captura de la solicitud en la pantalla de Solicitudes,
  donde se vea el patrocinador resuelto
```

Si algo de esta tarea no cuadra con lo que ves, para y dilo antes de tocar nada.
