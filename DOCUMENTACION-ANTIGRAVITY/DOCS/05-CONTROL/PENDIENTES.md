# PENDIENTES · DOCUMENTO HISTÓRICO

**Congelado el 4 de septiembre de 2026. No se actualiza más.**

> ## 🔴 NO TOMES NINGUNA DECISIÓN CON ESTE DOCUMENTO
>
> ```
>    La lista viva de pendientes está en:
>    00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO.md
> ```
>
> Se llegó a tener **cuatro documentos distintos diciendo qué faltaba**, tres de
> ellos congelados el 4/09. Esa dispersión es la que hace que se trabaje sobre
> información falsa. Desde el 16/09 manda uno solo.
>
> ### Lo que este documento afirma y hoy es FALSO
>
> ```
>    "El dominio no se apunta hasta cobrar el 50%"
>        → maxglobaloficial.com y app.maxglobaloficial.com
>          ya están conectados y respondiendo
>
>    "No hay forma de subir la imagen del voucher"
>        → construido en la TAREA-14
>
>    "Falta el campo de CCI"
>        → construido en la TAREA-18
>
>    "Falta levantar un proyecto Supabase limpio"
>        → PRODUCCIÓN existe desde el 15/09
>          (xkiwnxoferdfapezcwoq), instalada y verificada
>
>    "503 socios simulados"
>        → la cifra certificada de la demo es 509
> ```
>
> Se conserva porque 31 documentos lo enlazan y porque explica **por qué** se
> tomaron decisiones de principios de septiembre. Sirve para entender el pasado,
> no para decidir el presente.

---

# 💰 LO QUE ESPERA AL PAGO DEL 50%

| Qué | Situación |
|---|---|
| **Conectar `maxglobaloficial.com`** | El dominio está comprado. Decisión de Jack: no se apunta hasta cobrar el 50% |

**Mientras tanto la landing vive en** `max-global-landing.vercel.app`.

> **Ojo con las tarjetas de WhatsApp.** Los `og:image` apuntan al dominio final,
> que todavía no resuelve. Si compartes el enlace `.vercel.app`, la tarjeta sale
> sin foto. Se arregla sin tocar código:
> `Vercel → Settings → Environment Variables → SITE_URL = https://max-global-landing.vercel.app` → Redeploy.

---

# 🔴 ANTES DE QUE ENTRE DINERO REAL

| # | Qué | Por qué importa |
|---|---|---|
| 1 | **Subida del voucher** | La tabla `voucher` guarda banco, operación, monto y fecha — pero las 1,049 filas apuntan a un `placehold.co`. **No hay forma de subir la imagen.** Sin ella no hay respaldo de que un socio pagó |
| 2 | **Campo de CCI** | La empresa cobra en BCP y BBVA. Un socio de otro banco necesita CCI para cobrar. Hoy solo existe `socio.cuenta_bancaria`: un campo para dos cosas distintas |
| 3 | **Validar la cuenta bancaria** | Nadie comprueba lo que el socio escribe en P-18. Un dígito de más y la comisión rebota o cae en otra cuenta |
| 4 | **Proyecto Supabase limpio** | La base actual tiene **503 socios simulados** y S/. 100,261.02 en comisiones de mentira. No se borran: `comision` y `wallet_movimiento` son append-only por diseño. Se levanta otro proyecto con las mismas migraciones |

**Ninguna bloquea la demo.** Las cuatro bloquean el arranque real.

---

# 🟢 MEJORAS QUE NO CORREN PRISA

| Qué | Nota |
|---|---|
| **Code splitting** del bundle del sistema (795 kB) | Antes de que haya 50 socios reales |
| **Cabecera del admin tras el cierre** | No se refresca sola: sigue mostrando el ciclo anterior hasta recargar |
| **Catálogo de la landing desde Supabase** | Hoy es estático en `src/config.js`. Riesgo: Máximo cambia un precio en el admin y la vitrina sigue mostrando el viejo. La solución es leer de Supabase **en build**, no en runtime, para no romper el prerenderizado |
| **`Organization` → `LocalBusiness`** | Bloqueado: exige dirección de calle real y solo tenemos "Lima, Perú" |
| **`llms.txt`** | **No se hace.** Google publicó el 15/05/2026 que no lo usa para AI Overviews ni AI Mode. Adopción real 10% y sin crecer |

---

# 👤 LO QUE ESPERA A MÁXIMO

| Qué | Situación |
|---|---|
| **Rangos 9-16** (puntos, frontales, bono) | No tiene los números aún. P-26 tiene los formularios listos |
| **Cuentas bancarias de la empresa** | Para el padrón de pagos de P-25 |
| **Dirección de calle** | Para el schema `LocalBusiness` de la landing |
| **Perfil de Google Business** | Pesa el 32% del posicionamiento local — más que la web entera. Lo hace él |

**Cruce crítico a aclarar cuando lleguen los rangos:**

```
   El PDF de rangos va:    Diamante → Doble Diamante
   El deck lámina 15 va:   Diamante → Diamante Negro → Doble Diamante
```

Si se asume mal, los 8 rangos superiores quedan corridos una posición y todos
los líderes cobran el bono equivocado.

---

# ✅ RESUELTO

| Qué | Cómo quedó | Fecha |
|---|---|---|
| **Certificación del camino del dinero** | 9 reglas probadas, 4 predicciones exactas contra Postgres | 4/09 |
| **TAREA-11** · desplegables en blanco, ciclo falso, tildes | Corregido. P-21 y P-22 ya se pueden operar | 3/09 |
| **TAREA-10** · fuente única de cuentas bancarias | `Confirmacion.jsx` lee de `EMPRESA.cuentasBancarias` | 3/09 |
| **TAREA-10** · documentación interna fuera del repo | `00-INSTRUCCIONES`, `01-AUDITORIAS`, `DOCUMENTACION-ANTIGRAVITY` | 3/09 |
| **TAREA-09** · schema `Product` en las 8 fichas | Verificado contra el servidor de Vercel | 3/09 |
| **TAREA-08** · prerenderizado y despliegue | 17 rutas · la landing está viva | 3/09 |
| Netlify vs Vercel | **Vercel.** `_redirects` eliminado | 3/09 |
| Seguridad: funciones expuestas a anon | 0 de 16 ejecutables por anon | 2/09 |
| Las 20 pantallas del sistema | Terminadas | 2/09 |
| Motor de comisiones | 30.8% / 97% verificados contra 4 ciclos | 28/08 |

---

# 🔧 LO QUE DECIDE JACK

| Qué | Situación |
|---|---|
| **dia_pago_comisiones = 5** vs **dias_hasta_pago = 3** | "3 días después del cierre" es la respuesta de Máximo (#17). La de `dia=5` sobra |
| **monto_minimo_retiro_cent** vs **retiro_minimo_cent** | Duplicadas exactas en 10,000. Una sobra |
| **valor_punto_soles = 4.167** | En config sin usarse. ¿Se borra o se documenta como histórico? |

---

# 📌 FUERA DE ALCANCE — v1, no se discute

```
   ❌ Tienda replicada por socio        rechazado el 26/08
   ❌ Pago en línea                     todo por transferencia con voucher
   ❌ Facturación electrónica SUNAT     fuera desde la cotización
   ❌ App móvil nativa
   ❌ Rol de asesor                     congelado
   ❌ Chat interno, push, gamificación
   ❌ Pack VIP                          no existe
   ❌ Bono Cumpleaños y Viajes          fuera de la v1
```
