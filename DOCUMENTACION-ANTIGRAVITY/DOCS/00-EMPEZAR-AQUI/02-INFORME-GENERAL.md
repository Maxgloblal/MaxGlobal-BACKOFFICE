# INFORME GENERAL DEL PROYECTO

**Sistema Max Global Corporation**
**Para:** Jack · **Fecha:** 2 de septiembre de 2026
**Todo lo de este informe está verificado contra Postgres, no contra reportes.**

---

# EN UNA PANTALLA

```
   FASE 1 · LANDING PÚBLICA           ████████████████████   90%
      14 páginas listas · falta prerenderizar y desplegar (TAREA-08)

   FASE 2 · SISTEMA (BACKOFFICE)      ███████████████████░   97%
      20 pantallas terminadas · 225 pruebas en verde
      motor verificado · seguridad cerrada · cierre verificado
      falta: bundle split + datos de rangos 9-16
```

## Las cinco tandas y su estado

```
   TANDA 1   autenticación · sesión · 4 redirecciones por estado        ✅
   TANDA 2   P-21 · P-22 · P-23 · P-24 · la operación del admin        ✅
   TANDA 3   P-11 · P-14 · P-15 · P-19 · el socio ve su dinero         ✅
   TANDA 4   P-12 · P-13 · P-16 · P-17 · P-18 · el socio trabaja       ✅
   TANDA 5A  P-25 · cierre de ciclo                                     ✅
   TANDA 5B  P-20 · P-26 · P-27 · P-28 · P-29 · las admin restantes    ✅
```

**225 pruebas unitarias (20 suites) · 26 E2E · todas en verde ✅**

El sistema opera completo: Máximo registra socios, confirma pagos, despacha,
cierra el ciclo y ve el tablero, configuración, gestión de socios, reportes
y auditoría.

---

# LO QUE FUNCIONA HOY, CON NÚMEROS

## La base de datos

```
   Proyecto   utlohnidkuvxqppmoevj · Postgres 17.6 · us-east-2
   22 tablas · RLS activo en todas · 47 políticas
   16 funciones · NINGUNA ejecutable por anon ✅
```

## La red de prueba

```
   501 socios · profundidad 12 · 3,887 relaciones de red
   1,048 órdenes · 1,042 movimientos de puntos
   1,503 activaciones · 3 ciclos cerrados · ciclo 4 abierto
   10 usuarios con acceso real al sistema
```

## El motor de comisiones — terminado

| Bono | Pagado | Comisiones |
|---|---|---|
| Patrocinio | S/. 70,666.92 | 842 |
| Residual | S/. 19,754.10 | 1,533 |
| Rango | S/. 9,600.00 | 43 |
| **Total repartido** | **S/. 100,021.02** | **2,418** |

## El cierre de ciclo — verificado

```
   Ciclo 3 (agosto 2026) cerrado
      Patrocinio  S/.  6,795.40   73 comisiones   ✅
      Residual    S/.  6,084.28  385 comisiones   ✅
      Rango       S/.    600.00    8 comisiones   ✅
      TOTAL       S/. 13,479.68                   ✅ verificado contra Postgres
   wallet_movimiento llenada · saldo corrido correcto
   Ciclo 4 (septiembre 2026) abierto · solo uno abierto a la vez ✅
```

---

# LAS 20 PANTALLAS — terminadas

```
   SOCIO                              ADMIN
   P-10  Inicio de sesión    ✅       P-20  Tablero              ✅
   P-11  Panel principal     ✅       P-21  Registrar pedido     ✅
   P-12  Mi red              ✅       P-22  Registrar afiliación ✅
   P-13  Tienda de recompra  ✅       P-23  Bandeja confirmación ✅
   P-14  Mis comisiones      ✅       P-24  Envíos               ✅
   P-15  Mi rango            ✅       P-25  Cierre de ciclo      ✅
   P-16  Mi enlace           ✅       P-26  Configuración plan   ✅
   P-17  Mis pedidos         ✅       P-27  Gestión de socios    ✅
   P-18  Mi perfil           ✅       P-28  Reportes             ✅
   P-19  Mi billetera        ✅       P-29  Auditoría            ✅

   ✅ terminada y con datos reales   20 / 20
```

---

# LO QUE PUEDE HACER UN SOCIO REAL HOY

```
   Entrar con su correo y contraseña
   Ver si está activo y cuántos puntos le faltan
   Ver sus comisiones, con el motivo de cada nivel NO cobrado
   Ver su rango y el desglose por línea con el tope del 50%
   Ver su saldo disponible y su estimado del ciclo
   Pedir un retiro, con el mínimo de S/. 100 validado
   Ver su red hasta 10 niveles (navegación por niveles en móvil)
   Armar un pedido de recompra y mandarlo por WhatsApp
   Ver su enlace de patrocinio y compartirlo
   Ver sus pedidos con sus estados y motivos de rechazo
   Editar sus datos personales y bancarios
```

---

# LO QUE FALTA

## 1 · Desplegar la landing — TAREA-08

Instrucción escrita en `SITIO WEB 06 PAGINAS LANDINGS/00-INSTRUCCIONES/`.
Jack desplegará en **Vercel** (no Netlify). La instrucción asume Netlify pero
el script de prerenderizado funciona igual — solo cambia el Bloque 4.

## 3 · Los rangos 9-16

Máximo no ha enviado los números. Están en la base con `definido = false`.
P-26 los muestra como formularios listos para cuando lleguen. **No se insiste.**

---

# LO QUE DECIDE JACK

| Qué | Situación |
|---|---|
| **Netlify o Vercel** | Las dos configuraciones existen en la landing. Sobra una |
| **dia_pago_comisiones vs dias_hasta_pago** | Dos claves con valores contradictorios. Máximo decide |
| **monto_minimo_retiro_cent vs retiro_minimo_cent** | Dos claves con el mismo valor. Una es redundante |
| **El dominio** | Sin confirmar. No bloquea el despliegue |
| **Bundle size** | 794 kB. Antes de 50 socios reales conviene partirlo |

---

# CÓMO SE TRABAJA — y por qué funciona

```
   1º   Se escribe la tarea, por bloques, con los números A MANO
   2º   Antigravity la ejecuta bloque por bloque, commit en cada uno
   3º   Se VERIFICA contra Postgres — nunca contra su reporte
   4º   Los errores se documentan
   5º   Si hay error, tarea de corrección antes de avanzar
```

## Lo que ha cazado este método

```
   Una red degenerada: 429 Emprendedores de 500
   45 movimientos de puntos con los puntos de otro socio
   5 errores en la confirmación de pagos (tapados por un caso cómodo)
   Una función que podía borrar todos los socios reales
   14 socios de prueba colgados de ANA
   Afiliaciones a punto de generar residual
```

**Ninguno de esos fallaba.** Todos habrían pagado mal en silencio.

## 🔴 Y lo que sigue fallando

**Antigravity ha corrompido archivos QUINCE veces** — cortados a media palabra.
**Y siete veces ha reportado `git status --short` vacío cuando no lo estaba.**

Se restaura con `git show HEAD:archivo > archivo`.
Por eso se verifica todo, siempre, directamente contra Postgres.
