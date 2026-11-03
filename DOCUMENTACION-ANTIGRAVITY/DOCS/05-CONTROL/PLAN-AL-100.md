# PLAN AL 100% — antes del despliegue

**Escrito:** 7 de septiembre de 2026
**Decisión de Jack:** no se despliega nada hasta que esto esté cerrado.

---

# LO QUE REVISÉ HOY, Y EL RESULTADO

## Seguridad — la revisé a fondo porque acá está la plata

El linter de Supabase reporta **34 avisos**. Los perseguí uno por uno y la
conclusión es tranquilizadora, pero el camino importa.

```
   9 funciones SECURITY DEFINER son ejecutables por `anon`
   → es decir, por cualquiera con la clave pública,
     que está dentro del bundle de la landing
```

Entre ellas: `fn_aprobar_solicitud_retiro`, `fn_registrar_pedido_recompra`,
`fn_registrar_orden_upgrade` y `fn_test_limpiar_socio_prueba`.

**Suena a que cualquiera puede aprobarse un retiro. No es así.** Verificado una
por una:

```
   Las 12 funciones de dinero validan fn_is_admin() ADENTRO   ✅
```

Y `fn_is_admin()` resiste:

```sql
   SELECT EXISTS (SELECT 1 FROM socio
                  WHERE email = auth.jwt() ->> 'email'
                    AND rol IN ('admin','superadmin'));
```

```
   anon              auth.jwt() es NULL → email NULL → false   ✅
   socio se auto-asciende a admin
                     el trigger fn_proteger_columnas_inmutables_socio
                     protege `rol`                              ✅
   socio se pone el email del admin
                     UNIQUE en socio.email lo impide            ✅
   emails duplicados hoy                                    0   ✅
   cuentas admin                                            1
```

**Veredicto: no hay agujero por donde se robe dinero.** El `GRANT` a `anon` es
ruido que sobra, no una puerta abierta.

## Lo único real que encontré — y es menor

```
   El trigger protege `rol` pero NO protege `email`
   La política de UPDATE deja al socio editar su propia fila
```

P-18 muestra el correo `disabled`, así que por pantalla no se puede. Pero por
API, con su propia sesión, un socio sí podría cambiarse el email.

```
   ¿Se vuelve admin?     No. El UNIQUE lo bloquea.
   ¿Qué pasa entonces?   Se rompe a sí mismo: fn_is_admin y
                         fn_current_socio_id buscan por email.
                         Su JWT diría una cosa y su fila otra.
                         Entra al sistema y no ve sus propios datos.
```

Severidad baja. Se arregla agregando `email` al trigger que ya existe.

---

# LAS 5 TAREAS PARA LLEGAR AL 100%

## 🔴 1 · MÓVIL A 390px — la más grande

**Nunca se probó.** Es donde los socios van a entrar a ver cuánto ganaron, desde
el celular, el día que cierre el ciclo.

```
   Las tablas tienen hasta 6 columnas
   En 390px no entran. O se desbordan o se aplastan.
```

Es la única tarea grande que queda. Va sola.

## 🟡 2 · ENDURECER LO QUE ENCONTRÉ HOY

```
   a · Agregar `email` al trigger de columnas inmutables
   b · REVOKE EXECUTE a `anon` en las 9 funciones
       → defensa en profundidad: hoy no hace daño,
         pero no hay ninguna razón para dejarlo
   c · BORRAR fn_test_limpiar_socio_prueba
       → una función que se llama "test" y borra socios
         no tiene por qué existir en producción
   d · REVOKE de los grants anon sobre producto, pack,
       solicitud_afiliacion (RLS ya los bloquea)
   e · Activar Leaked Password Protection en Supabase Auth
       → un clic en el panel, no es código
```

**Todo esto es quitar, no agregar.** Riesgo bajo, pero cada `REVOKE` puede
romper algo si una pantalla dependía de ese permiso sin que lo sepamos: por eso
va con la suite completa corriendo después.

## 🟡 3 · LIMPIEZA DE PRUEBAS

```
   Las pruebas borran el socio pero dejan su cuenta en auth.users
   → 355 cuentas basura acumuladas
   Se limpia en el afterAll
```

## 🟢 4 · CODE SPLITTING

```
   926 kB en un solo archivo
   En 4G peruano, la primera carga se siente
   No rompe nada. Es comodidad.
```

## 🟢 5 · LA LANDING — dos cosas antes de subirla

```
   a · productos-generado.json al .gitignore
       Si se commitea, vuelven las dos fuentes de verdad
       que la TAREA-23 vino a matar
   b · Confirmar en TU terminal que el repo está sano
       Mi montaje da un error leyendo .git y ya me mintió
       cinco veces. No lo doy por bueno hasta que lo veas.
```

---

# EL ORDEN, Y POR QUÉ

```
   1 · Endurecimiento (tarea 2)      lo que ya sé que está flojo
   2 · Limpieza de pruebas (3)       barato, y deja la base limpia
   3 · Móvil a 390px (1)             la grande, con la base ya quieta
   4 · Code splitting (4)            cosmético, al final
   5 · Landing (5)                   se sube cuando lo demás esté verde
```

**El móvil va tercero a propósito.** Es una tarea de puro diseño y toca muchas
pantallas: conviene hacerla sobre una base que ya no se vaya a mover.

---

# LO QUE NO ENTRA EN "EL 100%"

```
   Proyecto Supabase limpio    no es un bug: es el paso previo
                               al primer socio real. Va cuando
                               Máximo pague y vayamos a producción.

   Detracción                  la tiene el contador de Máximo.
                               No depende de nosotros.

   Bono Cumpleaños y Viajes    Máximo los maneja en Excel, aparte.
                               Fuera del sistema por decisión suya.

   Bono Global                 fuera de la v1.
```

---

# CÓMO SABREMOS QUE ESTÁ AL 100%

No por una opinión. Por esto:

```
   npx vitest run          todas verdes
   npm run build           sin error
   Linter de Supabase      0 avisos de anon sobre funciones de dinero
   390px                   las 22 pantallas se usan sin desbordes
   Conteos certificados    508 · 1,059 · 2,423 · S/. 101,939.82
                           471 · 2,008 · 3,960 · 1 ciclo abierto
```

**Y una regla que ya nos costó tres veces aprender:** cada verificación de estas
tiene que poder correrse mañana y dar lo mismo. Si mide una fila que las pruebas
borran, no es una verificación.
