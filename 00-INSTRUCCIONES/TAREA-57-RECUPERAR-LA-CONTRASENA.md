# TAREA-57 · Recuperar la contraseña

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 Hoy un socio que olvida su contraseña se queda fuera
**Fecha:** 22 de septiembre de 2026

---

# EL PROBLEMA

El enlace *"¿Olvidaste tu contraseña?"* existe en P-10 y manda el correo. Pero:

```js
   P10InicioSesion.jsx:129-131

   await supabase.auth.resetPasswordForEmail(email.trim(), {
     redirectTo: window.location.origin + '/login'
   })
```

```
   Devuelve al socio a la pantalla de LOGIN.

   No hay ninguna pantalla donde pueda escribir
   su contraseña nueva. Hace clic en el correo,
   vuelve al login, y sigue sin poder entrar.
```

El flujo está a medias desde que se construyó.

---

# LO QUE HAY QUE HACER

## 1 · Una pantalla nueva

```
   /nueva-contrasena
```

Es donde aterriza el socio desde el correo. Dos campos —contraseña y repetirla—
y un botón. Con el estilo del resto del sistema, no inventes uno nuevo.

## 2 · Cambiar el redirectTo

```js
   redirectTo: `${window.location.origin}/nueva-contrasena`
```

```
   🔴 Y esa URL tiene que estar en la lista blanca
      de Supabase:

      Authentication → URL Configuration → Redirect URLs

      https://app.maxglobaloficial.com/nueva-contrasena

   Si no está, Supabase ignora el redirectTo y manda
   al Site URL. Es el fallo más común de este flujo
   y parece un problema del código cuando no lo es.
```

Añade también la de desarrollo local si hace falta, pero la de producción es la
que importa.

## 3 · La pantalla tiene que manejar la sesión de recuperación

Cuando el socio llega desde el correo, Supabase deja una sesión de recuperación.
La pantalla debe detectarla antes de mostrar el formulario.

```
   Si NO hay sesión de recuperación válida
   —enlace caducado, ya usado, o alguien que
   entró a la URL a pelo—

   → no muestres el formulario
   → explica qué pasó, en español claro
   → ofrece volver a pedir el correo
```

```
   🔴 Nunca dejes el formulario visible sin sesión.
      El socio escribe su contraseña, pulsa guardar,
      y le sale un error técnico. Peor que no tenerlo.
```

## 4 · Guardar la contraseña

```js
   await supabase.auth.updateUser({ password: nueva })
```

Y después, **lo que se olvida**:

```
   Llama a fn_marcar_password_cambiada()
```

Existe ya y se usa en `socio.js:838` cuando el socio la cambia desde P-18. Si
no la llamas aquí, P-11 le va a seguir mostrando el aviso de "cambia tu
contraseña" a alguien que acaba de cambiarla (`P11PanelSocio.jsx:168`).

Mira cómo lo hace `socio.js:836-850` y reutiliza ese camino. **No escribas otro.**

## 5 · Al terminar

```
   Cerrar la sesión de recuperación
   → mandarlo al login
   → con un mensaje de que ya puede entrar
     con su contraseña nueva
```

---

# 🔴 ANTES DE DARLO POR BUENO · LA PRUEBA DEL CORREO

```
   Supabase, SIN servidor SMTP propio, solo envía
   correos a las direcciones que están en el equipo
   del proyecto. A cualquier otra le responde
   "Email address not authorized".
   Y el límite es 2 correos por hora.

   Eso dice su documentación hoy.
```

Puede que no aplique a este proyecto. **Compruébalo, no lo supongas:**

```
   1 · Pide un restablecimiento desde una dirección
       de correo que NO sea de Jack, que NO esté en
       el equipo de Supabase, y que NO sea
       soportesmaxglobal01.

       Un Gmail cualquiera, creado para la prueba.

   2 · ¿Llegó el correo?
       · SÍ  → el flujo está completo
       · NO  → párate y dímelo. Hace falta un
               servidor de correo y eso se decide
               aparte.

   3 · Mira los logs de Auth en Supabase y pégame
       lo que salga de ese intento.
```

```
   🔴 Probar con el correo de Jack NO vale.
      Ese sí va a llegar, y no demuestra nada.
```

---

# LAS PLANTILLAS

Los correos salen en inglés. Los socios son peruanos.

```
   Authentication → Email Templates → Reset Password
```

Tradúcelo. Corto, sin adornos, sin publicidad: solo qué es, el botón, y que el
enlace caduca. **No pongas el logo ni frases de marketing** — eso hace que los
filtros lo manden a spam.

Pégame el texto que dejes antes de darlo por cerrado.

---

# LO QUE TIENES QUE REPORTAR

```
· El diff de P-10 y la pantalla nueva
· Captura de la lista blanca de Redirect URLs
· El recorrido completo, con capturas:
    pedir · correo recibido · pantalla · guardar · entrar
· Qué pasa con un enlace caducado
· Que password_cambiada quedó en true
· Que P-11 ya no muestra el aviso
· 🔴 El resultado de la prueba del correo externo,
  en la PRIMERA línea
· La plantilla traducida
· La suite en verde
```

Si el correo no llega a una dirección de fuera, **para ahí y dilo**. Lo demás
sirve igual; eso se resuelve aparte.
