# TAREA-71 · Panel admin: lista de socios por rango

Máximo necesita ver **quiénes llegaron a cada rango** (Jade, Oro, etc.).
Hoy no hay ninguna pantalla que lo muestre:
- P-25 Cierre de ciclo y P-28 Reportes solo dicen cuántos socios cobran el Bono de Rango.
- P-15 Mi Rango es individual, de cada socio.

Esta tarea es **solo de lectura**. No cambia el motor, ni los cálculos, ni la base
de datos. No hagas nada que no esté en esta lista.

---

## 1 · Dónde va

```
   ✅ Nueva sección en P-28 Reportes (/admin/reportes), debajo de lo que ya existe:
      título "Socios por rango"
   ✅ Usa el MISMO selector de ciclo que ya tiene la página
   ✅ Solo admin (misma protección que el resto de /admin)
```

## 2 · De dónde salen los datos (no inventes otra fuente)

```
   CICLO CERRADO
   ✅ Tabla rango_ciclo del ciclo elegido, con califica = true,
      unida a socio (nombres, apellidos, codigo) y a rango (nombre, orden)
   ✅ Es la verdad guardada del cierre: NO recalcular

   CICLO ABIERTO (el mes en curso)
   ✅ RPC fn_calcular_y_persistir_rangos con p_solo_calculo = true
      (la misma que ya usa obtenerVistaPreviaCierre). NUNCA con false:
      eso guardaría el rango antes del cierre
   ✅ Mostrar arriba un aviso: "Mes en curso: cálculo en vivo, puede
      cambiar hasta el cierre"

   HISTÓRICO
   ✅ Opción extra en el selector: "Histórico · rango más alto alcanzado"
   ✅ Fuente: socio.rango_honorifico_id unido a rango (solo socios que lo tengan)
```

## 3 · Qué se ve

```
   ✅ Resumen arriba: una tarjeta por rango con el número de socios
      (ej. Jade 4 · Oro 1). Solo rangos con definido = true y activo = true,
      ordenados por rango.orden
   ✅ Chips para filtrar: Todos · Jade · Oro · … (mismo orden)
   ✅ Tabla:
        Socio (nombres + apellidos) · Código · Rango
        · Puntos computables · Frontales activos · Bono del rango
      Orden: rango más alto primero; dentro del mismo rango, más puntos primero
   ✅ En Histórico no hay puntos ni bono: solo Socio · Código · Rango más alto
   ✅ Si no hay nadie: "Ningún socio alcanzó un rango en este ciclo"
   ✅ Botón "Descargar CSV" (mismo formato ; que el CSV de Reportes)
   ✅ Celular 390 px: tarjetas en vez de tabla, sin scroll horizontal
```

## 4 · Servicio

```
   ✅ Nueva función en src/servicios/operacionAdmin.js:
      obtenerSociosPorRango(cicloId | 'historico', sbClient = supabase)
   ✅ Montos en céntimos → mostrar con formatearSoles (como el resto)
```

---

# NO TOCAR

- fn_calcular_y_persistir_rangos y todo el motor
- P-15, P-25 y el cierre de ciclo
- Lo que ya muestra P-28

# VERIFICACIÓN (con la base real)

```
   1 · Para el último ciclo CERRADO corre esta consulta y pega el resultado
       en el reporte. La pantalla debe mostrar exactamente los mismos socios:

       SELECT s.codigo, s.nombres, s.apellidos, r.nombre AS rango,
              rc.puntos_computables, rc.frontales_activos, rc.bono_cent
       FROM rango_ciclo rc
       JOIN socio s ON s.id = rc.socio_id
       JOIN rango r ON r.id = rc.rango_id
       WHERE rc.ciclo_id = <id> AND rc.califica = true
       ORDER BY r.orden DESC, rc.puntos_computables DESC;

   2 · Para el ciclo ABIERTO: confirma que después de abrir la pantalla
       rango_ciclo del ciclo abierto NO cambió (cuenta filas antes y después)
   3 · Capturas 1440 px y 390 px en 00-INSTRUCCIONES/capturas-t71/
       (ciclo cerrado, ciclo abierto, histórico, filtro Jade)
   4 · Tests: vitest del servicio + e2e de la sección. Suite completa en verde
   5 · Commit + push (incluye el commit 9034b5e que está sin subir)
```

# EL REPORTE

```
   1 · archivo:línea de cada cambio
   2 · El resultado de la consulta del punto 1 y la captura de la pantalla
       del mismo ciclo, lado a lado
   3 · Si algo no se pudo hacer, dilo y explica por qué
```
