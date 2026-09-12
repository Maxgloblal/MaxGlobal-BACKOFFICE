# TAREA-28 · ENDURECIMIENTO Y LIMPIEZA

**Para:** Antigravity
**Escrita:** 7 de septiembre de 2026
**Fase:** corrección de bugs · pasos 1 y 2 de `05-CONTROL/PLAN-AL-100.md`

> ## 🔴 ESTA TAREA QUITA COSAS, NO AGREGA NINGUNA
>
> Todo lo de acá son permisos que sobran y basura de pruebas.
> **Nada de esto está fallando hoy.** Se hace porque no hay ninguna razón
> para dejarlo, no porque haya un incendio.
>
> Cada `REVOKE` puede romper una pantalla que dependía de ese permiso sin que
> lo sepamos. Por eso hay una prueba después de cada uno.

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

# LO QUE YA VERIFIQUÉ — no hay que volver a averiguarlo

Verificado contra Postgres el 7/09:

```
   Las 12 funciones de dinero validan fn_is_admin() ADENTRO   ✅
   fn_is_admin() resiste:
     · anon         auth.jwt() es NULL → false
     · auto-ascenso el trigger protege `rol`
     · suplantar    UNIQUE en socio.email lo impide
   emails duplicados hoy      0
   cuentas admin              1  (MG00001 · socio001@ejemplo.test)
```

```
   ✅ NO hay ningún agujero por donde se robe dinero.
      Lo de esta tarea es defensa en profundidad.
```

---

# BLOQUE 1 · EL TRIGGER TAMBIÉN PROTEGE EL CORREO

```
   fn_proteger_columnas_inmutables_socio protege `rol`   ✅
   NO protege `email`                                    🔴
   La política de UPDATE deja al socio editar su fila
```

P-18 muestra el correo `disabled`, así que por pantalla no pasa. **Por API sí.**

## Qué pasa si un socio se cambia el correo

```
   ¿Se vuelve admin?   No. El UNIQUE lo impide.

   ¿Qué rompe?         Se rompe a sí mismo.
                       fn_is_admin y fn_current_socio_id buscan
                       por email. Su JWT diría un correo y su
                       fila otro → entra y no ve sus datos.
```

```
   Se agrega `email` a las columnas inmutables del trigger.
   Solo el admin puede cambiarlo.
```

**Commit.**

---

# BLOQUE 2 · QUITAR LOS PERMISOS QUE SOBRAN

## Las 9 funciones que `anon` puede ejecutar

```
   fn_aprobar_solicitud_retiro
   fn_rechazar_solicitud_retiro
   fn_convertir_solicitud_afiliacion
   fn_descartar_solicitud_afiliacion
   fn_registrar_orden_upgrade
   fn_registrar_pedido_recompra
   fn_marcar_password_cambiada
   fn_obtener_schema_columnas
   fn_test_limpiar_socio_prueba
```

```
   REVOKE EXECUTE ... FROM anon;
```

```
   🔴 CUIDADO con dos:

   · fn_registrar_pedido_recompra — comprueba primero que
     ninguna pantalla pública la use. La landing NO debería,
     pero verifícalo antes de quitar el permiso.

   · fn_marcar_password_cambiada — la llama el socio al
     cambiar su contraseña. Si en ese momento su sesión
     todavía no es `authenticated`, quitarle el permiso a
     anon rompe la TAREA-25. Pruébalo de verdad.
```

## Los grants de tabla que sobran

```
   anon tiene INSERT, UPDATE, DELETE, TRUNCATE sobre
   socio · orden · activacion · producto · pack ·
   solicitud_afiliacion

   RLS los bloquea, pero no hay razón para tenerlos.
   Se dejan solo los SELECT que la web pública necesita.
```

```
   🔴 `producto` necesita SELECT para anon:
      la landing lee el catálogo con la clave pública.
      Ese NO se toca.
```

**Commit.**

---

# BLOQUE 3 · BORRAR LA FUNCIÓN DE PRUEBAS

```sql
   fn_test_limpiar_socio_prueba(p_email text)
```

**Una función que se llama "test" y borra socios no tiene por qué existir en
la base.** Valida admin adentro, así que no es explotable — pero es una escopeta
cargada sobre la mesa.

```
   1 · Ver qué pruebas la usan
   2 · Reemplazarla por limpieza desde el propio test,
       con la clave de servicio
   3 · DROP FUNCTION
```

```
   🔴 Si alguna prueba depende de ella, primero se cambia
      la prueba y se deja verde. Después se borra.
```

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS DEJAN DE ENSUCIAR `auth`

```
   auth.users                     378
   basura de pruebas              355   kit_ gold_ toy_ demo_
   ─────────────────────────────────────
   cuentas reales                  23
   socios que pueden entrar        22   de 508
```

Las pruebas borran el socio pero dejan su cuenta de acceso.

```
   1 · El afterAll borra también la cuenta de auth
   2 · Limpiar de una vez las 355 que ya están
       ← solo las que casan con el patrón de prueba:
         ^(kit|gold|ejecutivo|test_rec|toy_[a-e]|demo_(padre|hijo_[12]))_[0-9]+@ejemplo\.test$

   🔴 Cuenta ANTES y DESPUÉS y pega los dos números.
   🔴 socio001@ejemplo.test es el ADMIN. No entra en el patrón,
      pero compruébalo explícitamente antes de borrar nada.
```

**Commit.**

---

# BLOQUE 5 · LAS PRUEBAS

```
   1 · Un socio NO puede cambiarse el email por API
       — con sesión real, no simulada
   2 · El admin SÍ puede cambiarle el email a un socio
   3 · anon NO puede ejecutar fn_aprobar_solicitud_retiro
       ← ahora falla por permiso, antes fallaba por fn_is_admin
   4 · El admin SÍ puede seguir aprobando un retiro
       ← ésta es la que prueba que no rompimos nada
   5 · El socio SÍ puede cambiar su contraseña y marcarla
       ← protege la TAREA-25
   6 · La landing SÍ puede leer `producto` con la clave anon
       ← protege la TAREA-23
   7 · anon NO puede insertar en socio, orden ni activacion
   8 · Después de la suite, auth.users NO creció
       ← la que prueba el bloque 4
```

**La 4, la 5 y la 6 son las que importan.** No prueban lo que quitamos: prueban
que lo que quitamos no se llevó nada por delante.

**Commit.**

---

# BLOQUE 6 · VERIFICACIÓN

```sql
-- 1 · anon ya no ejecuta las funciones de dinero
SELECT p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') anon_puede
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname LIKE 'fn_%'
  AND has_function_privilege('anon', p.oid, 'EXECUTE');
-- debe quedar VACÍO o solo con funciones de lectura pública

-- 2 · la función de pruebas ya no existe
SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='fn_test_limpiar_socio_prueba';
-- 0

-- 3 · el trigger protege el correo
SELECT position('email' in pg_get_functiondef(p.oid))>0
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='fn_proteger_columnas_inmutables_socio';
-- true

-- 4 · las cuentas basura
SELECT COUNT(*) FROM auth.users;
-- antes 378 · pega el número de después

-- 5 · el admin sigue existiendo y entrando
SELECT s.codigo, s.email, s.rol,
       EXISTS(SELECT 1 FROM auth.users u WHERE lower(u.email)=lower(s.email)) tiene_login
FROM socio s WHERE s.rol IN ('admin','superadmin');
-- MG00001 · socio001@ejemplo.test · admin · true
```

## Y una que NO es SQL

```
   En el panel de Supabase: Authentication → Providers →
   activar "Leaked Password Protection"
   Es un clic. Pega la captura.
```

---

# LO QUE NO SE TOCA

```
   ❌ fn_is_admin — funciona y todo depende de ella
   ❌ El SELECT de anon sobre `producto` — lo usa la landing
   ❌ Las políticas RLS — están bien, solo sobran los GRANT
   ❌ src/motor/ — todo
   ❌ fn_ejecutar_cierre_ciclo · fn_confirmar_orden_pago
   ❌ Los datos: ni un socio, ni una orden, ni una comisión
```

> **Si un REVOKE rompe una pantalla, se revierte ESE revoke y se anota
> cuál era.** No se inventa una política nueva para compensar.

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

```
   socios              508
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6 · noviembre 2026)
   wallet              471   · saldo de Karla S/. 1,790.00
   productos             8
   activacion ciclo 6    2 filas · 2 activos
```

**Lo único que puede cambiar es `auth.users`, y hacia abajo.**

---

# DESPUÉS DE ESTA

El **móvil a 390px**. Es la última grande y va sobre una base ya quieta.
