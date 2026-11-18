# TAREA-72 · Auditar la TAREA-71 contra los RF, el SDD y la base de PRODUCCIÓN

La TAREA-71 (Socios por rango, commit `bae2bf1`) está bien hecha en código.
Pero al revisarla salieron cosas que hay que confirmar antes de dársela a Máximo.
Esta tarea es **primero de análisis**. Solo corriges lo que el análisis demuestre
que está mal, y nunca el motor ni el cierre.

---

## Hallazgos que debes confirmar o descartar

```
   H1 · ¿Con qué base se probó?
        Las capturas muestran 638 socios y S/ 160,349 recaudados.
        Máximo tiene ~40 socios reales. 07-CONTEXTO-PARA-RETOMAR.md dice
        que existe una base DEMO con socios simulados.
        En el repo hay DOS proyectos Supabase:
          xkiwnxoferdfapezcwoq  (.env, .env.local, .env.produccion)
          utlohnidkuvxqppmoevj  (.env.e2e.local y el test de la T71)

   H2 · Llave escrita en un test
        src/test/tarea71-socios-por-rango.test.js:5-6 tiene la URL y la
        anon key de Supabase escritas a mano, y ya está subido a GitHub.

   H3 · RF-410 marcado ✅ pero puede no cumplirse
        10-RF-PANEL-ADMIN.md: "listar socios con filtros por estado, pack,
        RANGO y fecha". En P27GestionSocios.jsx no se encuentra filtro por rango.

   H4 · RF-433 estaba ✅ antes de que existiera la lista
        "reportar rangos alcanzados por ciclo": antes de la T71 solo había
        un conteo. Verificar si ahora la T71 lo cumple por completo.

   H5 · Ciclo abierto ya calculado
        fn_calcular_y_persistir_rangos devuelve SIN la lista "comisiones"
        cuando el ciclo ya tiene filas en rango_ciclo (yaExistia = true).
        En ese caso la sección mostraría "Ningún socio…" aunque sí haya.
```

## 1 · Qué base es producción (H1)

```
   ✅ Mira en Vercel → proyecto del backoffice publicado → Settings →
      Environment Variables (Production): ¿qué VITE_SUPABASE_URL usa?
   ✅ En ESA base, solo lectura: cuenta socios por estado y ciclos
      (SELECT estado, count(*) FROM socio GROUP BY estado; SELECT id, mes, anio, estado FROM ciclo ORDER BY id;)
   ✅ Abre /admin/reportes en la versión publicada y confirma que
      "Socios por rango" carga con esos datos reales
   ✅ Repite la consulta SQL de la T71 en producción para el último ciclo
      cerrado y compárala con la pantalla, socio por socio
   ✅ Si producción no tiene ciclos cerrados todavía, dilo; no inventes datos
   ⛔ NO escribas, borres ni recalcules nada en producción
```

## 2 · Llave en el test (H2)

```
   ✅ El test debe leer URL y key de variables de entorno (.env.e2e.local),
      igual que el resto de la suite. Nada escrito a mano
   ✅ Si la base del test es la DEMO, el test se queda en DEMO (nunca producción)
   ✅ Dime si esa key es anon (pública) o service_role.
      Si fuera service_role: PARA y avísame (hay que rotarla)
```

## 3 · Conformidad con RF y SDD

```
   ✅ Lee 03-SISTEMA/10-RF-PANEL-ADMIN.md (P-27 y P-28) y
      07-SPEC-KIT/PROYECTO-2-SISTEMA/specs/003-panel-admin/spec.md
   ✅ Para RF-410, RF-433 y cualquier RF de rangos/reportes, haz una tabla:
        RF · qué pide · dónde se cumple (archivo:línea) · ✅ / ❌
      Basada en el CÓDIGO, no en lo que dice el documento
   ✅ H3: si P-27 no filtra por rango, agrégalo
      (filtro por rango honorífico, mismo estilo que los otros filtros)
   ✅ H5: si el ciclo abierto ya tiene filas, la sección debe leerlas de
      rango_ciclo (igual que un ciclo cerrado), sin recalcular
   ✅ Actualiza la documentación para que diga la verdad:
        - 10-RF-PANEL-ADMIN.md: estado real de cada RF revisado + nuevo RF
          para "Socios por rango" (mes cerrado, en vivo, histórico, CSV)
        - specs/003-panel-admin/spec.md: la sección nueva de P-28
        - 05-CONTROL/BITACORA.md: entrada de la T71 y la T72
```

---

# NO TOCAR

- fn_calcular_y_persistir_rangos, el cierre de ciclo y el motor
- Ningún dato en producción

# EL REPORTE

```
   1 · H1–H5: confirmado o descartado, con evidencia (consulta, archivo:línea o captura)
   2 · Cuál es la base de producción, cuántos socios reales tiene,
       y la comparación pantalla vs SQL en producción
   3 · Tabla de conformidad de RF
   4 · archivo:línea de cada corrección
   5 · Tests en verde · commit + push
```
