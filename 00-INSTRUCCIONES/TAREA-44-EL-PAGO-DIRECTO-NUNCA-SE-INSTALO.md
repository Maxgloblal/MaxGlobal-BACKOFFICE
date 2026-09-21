# TAREA-44 · Permisos de producción y el pago directo que nunca se instaló

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 BLOQUEANTE · toca dinero real en producción
**Fecha del hallazgo:** 17 de septiembre de 2026
**Corrige:** TAREA-43

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   00-INSTRUCCIONES/TAREA-43-PAGO-DIRECTO-DE-BILLETERA.md
   supabase/instalador/04-rls-y-grants.sql
```

**La TAREA-43 está bien diseñada y el instalador está bien escrito.** El
problema no es lo que se pensó: es que ni una cosa ni la otra llegaron a la base
de producción.

---

# BLOQUE 1 · 🔴 PRODUCCIÓN TIENE PERMISOS QUE NO DEBERÍA

Esto es lo más grave y **no lo causó la TAREA-43**. Se descubrió auditándola.

## Lo verificado

```sql
select table_name, grantee, string_agg(privilege_type,', ')
from information_schema.role_table_grants
where table_schema='public' and grantee='authenticated'
  and table_name in ('wallet_movimiento','comision');
```

```
   PRODUCCIÓN  xkiwnxoferdfapezcwoq
     wallet_movimiento   DELETE, INSERT, SELECT, TRUNCATE, UPDATE
     comision            DELETE, INSERT, SELECT, TRUNCATE, UPDATE

   DEMO        utlohnidkuvxqppmoevj
     wallet_movimiento   DELETE, INSERT, SELECT, TRUNCATE
     comision            DELETE, INSERT, SELECT, TRUNCATE
```

```
   🔴 PRODUCCIÓN, la que tiene dinero real,
      está MENOS protegida que la demo.
```

## Lo que el instalador sí dice

`supabase/instalador/04-rls-y-grants.sql`

```
   304  GRANT SELECT ON public.comision TO authenticated;
   306  GRANT SELECT ON public.wallet_movimiento TO authenticated;
```

**Solo SELECT. El instalador está bien.**

## Por qué falla igual

Línea 276:

```sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon;
```

```
   Revoca de PUBLIC y de anon.
   NO revoca de authenticated.
```

Supabase concede por defecto **todos** los permisos sobre las tablas nuevas de
`public` a `anon`, `authenticated` y `service_role`. El instalador limpia a
`anon`, y después hace `GRANT SELECT` — pero un `GRANT` **suma**, no quita. Los
permisos por defecto de `authenticated` se quedan intactos.

La demo se libró a medias porque una migración vieja sí lo hacía:

```sql
-- migrations/20260828000001_esquema_inicial.sql:536
REVOKE UPDATE, DELETE ON comision FROM authenticated, anon;
REVOKE UPDATE, DELETE ON wallet_movimiento FROM authenticated, anon;
REVOKE UPDATE, DELETE ON auditoria FROM authenticated, anon;
```

**Esa migración nunca pasó al instalador.** Producción se creó con el
instalador, así que nació sin ella.

## Qué tan explotable es, en serio · verificado tabla por tabla

El permiso suelto **no** significa que se pueda hacer. RLS decide encima. Esto
es lo comprobado en producción el 17/09, no lo que se supone:

```sql
select tablename, policyname, cmd from pg_policies
where schemaname='public'
  and tablename in ('wallet_movimiento','comision','auditoria');
```

```
   wallet_movimiento   SELECT  +  ALL (admin)
   comision            SELECT  +  ALL (admin)
   auditoria           SELECT  +  INSERT      ← y nada más
```

| Tabla | ¿Se puede borrar por la API? | Por qué |
|---|---|---|
| `wallet_movimiento` | **SÍ, con sesión de admin** | la política `ALL` cubre DELETE, y el permiso existe |
| `comision` | **SÍ, con sesión de admin** | igual |
| `auditoria` | **No** | no hay política de DELETE ni UPDATE; con RLS activo, lo que no tiene política queda negado para todos |

```
   La auditoría se salva por lo que le FALTA, no por
   lo que tiene. El permiso sobra igual y hay que
   revocarlo, pero hoy no es explotable.
```

Sobre `TRUNCATE`: RLS no se aplica a TRUNCATE en ninguna de las tres, pero
PostgREST no expone TRUNCATE. Por la web no hay camino. El permiso sobra, y se
revoca por higiene, no por urgencia.

**Lo urgente y comprobado es una sola frase:** una sesión de administrador puede
borrar movimientos de dinero y comisiones en producción, desde el navegador. La
prueba de la TAREA-43 lo hizo en la demo y funcionó. Eso es exactamente lo que
toda la documentación da por imposible.

## Lo demás de producción, verificado

```
   triggers propios sobre las 4 tablas de dinero:  0
   RLS activo en las 4:                            sí
   fn_registrar_pago_directo_socio:                no existe
```

## Qué hacer

### 1 · Arreglar producción ya

```sql
REVOKE UPDATE, DELETE, TRUNCATE, INSERT ON public.wallet_movimiento FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, INSERT ON public.comision          FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE                ON public.auditoria  FROM authenticated;
GRANT  SELECT ON public.wallet_movimiento TO authenticated;
GRANT  SELECT ON public.comision          TO authenticated;
GRANT  SELECT, INSERT ON public.auditoria TO authenticated;
```

`INSERT` también se revoca: **los movimientos de dinero los crea la base, no el
navegador.** Las funciones corren con `SECURITY DEFINER` y no dependen de estos
permisos.

> Si al revocar `INSERT` algo del sistema deja de funcionar, **NO devuelvas el
> permiso**: significa que esa operación está escribiendo dinero desde el
> navegador y hay que moverla a una función. Repórtalo y paramos.

### 2 · Arreglarlo en el instalador, para que no renazca

En `04-rls-y-grants.sql`, junto a la línea 276:

```sql
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
```

Después de eso, **cada** `GRANT` del archivo pasa a ser la única fuente de
permisos. Revisa el archivo entero: puede que haya tablas que hoy funcionan
gracias a los permisos por defecto y que dejarán de hacerlo. **Esas hay que
concederlas explícitamente**, que es justamente el punto.

### 3 · Comprobar qué más está de más

```sql
select table_name, string_agg(privilege_type,', ' order by privilege_type)
from information_schema.role_table_grants
where table_schema='public' and grantee='authenticated'
group by table_name order by table_name;
```

Pega la tabla completa de **las dos bases**. Quiero comparar una contra otra.

---

# BLOQUE 2 · 🔴 LA FUNCIÓN DEL PAGO DIRECTO NO EXISTE

```sql
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and proname like '%pago_directo%';
```

```
   DEMO         →  []
   PRODUCCIÓN   →  []
```

Está escrita en `scripts/pago-directo-socio.sql`, y la función **es correcta**:
tiene su `FOR UPDATE` en la línea 51, valida admin, valida monto y valida saldo.

**Nunca se ejecutó contra ninguna base.** Mismo error que la TAREA-42 con la
Edge Function: escribir el archivo no es instalarlo.

```bash
psql "<cadena DEMO>"       -f scripts/pago-directo-socio.sql
psql "<cadena PRODUCCIÓN>" -f scripts/pago-directo-socio.sql
```

Verificar en **cada** base con el `select` de arriba. Pegar las dos salidas.

---

# BLOQUE 3 · 🔴 EL RESPALDO QUE TAPÓ TODO

`src/servicios/operacionAdmin.js:1897`

```js
if (error.code !== 'PGRST202') { throw ... }
// 2. Fallback de ejecución directa vía RLS
```

`PGRST202` significa **"esa función no existe"**. En vez de fallar, el código
reimplementa el pago desde el navegador.

```
   Las 6 pruebas de la TAREA-43 pasaron POR EL RESPALDO.
   La función nunca corrió ni una vez.
```

La *"transacción ACID"*, el *"bloqueo FOR UPDATE"* y el *"candado de
concurrencia"* del informe existen solo dentro de la función no instalada. Lo
que de verdad se ejecuta tiene tres agujeros:

**A · Sin transacción.** Inserta `solicitud_retiro` con `estado='aprobado'`
(línea 1956) y **después** el débito en `wallet_movimiento` (línea 1976). Si lo
segundo falla, queda un retiro marcado como pagado y el socio con su saldo
entero. Es el desfase contable que esta función venía a evitar.

**B · Sin bloqueo.** Lee el saldo con un `select` normal. Dos pagos a la vez
leen lo mismo y los dos pasan. Saldo 400, dos pagos de 300 → queda en −200.

**C · Cadena rota.** `saldo_despues_cent` sale de `ORDER BY id DESC`. Dos
inserciones simultáneas escriben el mismo valor y la auditoría de la TAREA-19
se cae.

## Qué hacer · borrarlo, no mejorarlo

Todo el bloque desde `// 2. Fallback de ejecución directa vía RLS` hasta el
final de la función **se elimina**. Queda:

```js
const { data, error } = await sbClient.rpc('fn_registrar_pago_directo_socio', {...});

if (error) {
  if (error.code === 'PGRST202') {
    throw new Error(
      '🔴 fn_registrar_pago_directo_socio NO está instalada en esta base. ' +
      'Ejecuta scripts/pago-directo-socio.sql antes de usar esta pantalla.'
    );
  }
  throw new Error(error.message);
}
return data;
```

```
   🔴 NO reimplementes un respaldo "mejor".
      Un pago de dinero con escrituras sueltas desde el
      navegador no se puede hacer seguro. Si falta algo,
      tiene que FALLAR con mensaje claro.

   🔴 Es el mismo patrón de la TAREA-41: un respaldo que
      tapa un fallo es peor que el fallo, porque lo vuelve
      invisible.
```

---

# BLOQUE 4 · LA PRUEBA HAY QUE REHACERLA

La prueba actual **borra filas de `wallet_movimiento`** en su limpieza
(`afterAll`, líneas 46-52). Con el Bloque 1 arreglado eso dejará de ser posible,
y está bien que así sea.

```
   ❌ Insertar un pago real y borrarlo después
   ✅ Verificar INVARIANTES que sobreviven:
      · la función EXISTE en la base
      · un no-admin es rechazado
      · monto <= 0 rechazado
      · monto > saldo rechazado
      · DELETE sobre wallet_movimiento FALLA por permisos
```

Si se prueba el caso exitoso, se hace **una vez**, con S/. 0.01 en la demo, y
**el movimiento se queda**: pasa a ser parte del historial, como cualquier pago.

---

# BLOQUE 5 · DOS COSAS MENORES

**La nota está en la columna equivocada.** El respaldo guarda la nota del pago
en `motivo_rechazo`, sobre una fila con `estado='aprobado'`. Un reporte dirá
*"motivo de rechazo: adelanto de comisiones"* en un pago aprobado. Mira qué
columna corresponde y, si no existe, **dilo** en vez de reutilizar una que
significa otra cosa.

**Las capturas están fuera del proyecto.**
`scripts/generar-capturas-pago-directo.mjs:6` escribe en
`C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-.../`. Esa carpeta es
tuya, no del proyecto: Jack no las ve y no sobreviven. Van a
`00-INSTRUCCIONES/capturas-t43/`, como las de la TAREA-31.

---

# SOBRE LA DOCUMENTACIÓN

Cincuenta documentos afirman que los libros de dinero son inmutables.

```
   🔴 NO los corrijas.
      No están equivocados: describen cómo DEBE ser.
      El que está mal es producción.
```

Se arregla la base y los documentos vuelven a ser ciertos. Lo único que se
actualiza es `supabase/instalador/INVENTARIO-COMPLETO.md`, con la función nueva
y con los revokes del Bloque 1.

---

# LO QUE TIENES QUE REPORTAR

```
· La tabla de permisos de authenticated, de las DOS bases,
  antes y después
· La salida del select de pg_proc en las DOS bases
· El diff de operacionAdmin.js con el respaldo borrado
· El resultado de intentar un DELETE sobre wallet_movimiento
  con sesión de admin (tiene que FALLAR)
· Si al revocar INSERT algo se rompió, QUÉ se rompió
· Las pruebas nuevas con su salida
· Las capturas, dentro del repositorio
```

---

# LO QUE ESTÁ VERIFICADO Y LO QUE NO

Para que no tomes como hecho algo que solo es sospecha mía.

## Verificado con consulta, el 17/09

```
   · fn_registrar_pago_directo_socio no existe · DEMO y PRODUCCIÓN
   · permisos de authenticated · DEMO y PRODUCCIÓN
   · políticas RLS de las 3 tablas · PRODUCCIÓN
   · 0 triggers propios · DEMO y PRODUCCIÓN
   · RLS activo en las 4 tablas · PRODUCCIÓN
   · instalador: revoca solo de PUBLIC y anon (línea 276)
   · instalador: concede solo SELECT (líneas 304 y 306)
   · migración 20260828000001:536-538 con los REVOKE
     que nunca pasaron al instalador
   · el respaldo y el orden de sus inserciones (1956, 1976)
   · FOR UPDATE dentro de la función no instalada (línea 51)
   · la prueba borra wallet_movimiento en afterAll (46-52)
   · cero filas con concepto 'pago directo' en la demo
```

## NO verificado · compruébalo tú, no lo des por hecho

```
   · Si revocar INSERT rompe alguna pantalla. No lo probé.
   · Qué columna debería llevar la nota del pago.
     Hoy va en motivo_rechazo y eso está mal, pero no sé
     cuál es la correcta ni si existe.
   · Si las pruebas de la TAREA-43 realmente corrieron y
     pasaron como dice el informe. Solo comprobé que el
     código que ejecutan es el del respaldo.
   · El resto de tablas de producción. Solo miré las
     cuatro del dinero.
```

Si algo de esta tarea no cuadra con lo que ves, **para y dilo antes de tocar
nada**. Mi diagnóstico de este problema ya fue impreciso dos veces: primero dije
que no había ninguna protección, y después di por explotable la tabla de
auditoría. Las dos veces me corrigió mirar la base en vez de suponer.
