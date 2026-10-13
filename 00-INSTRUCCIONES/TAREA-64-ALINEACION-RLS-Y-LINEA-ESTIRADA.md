# TAREA-64 · ALINEACIÓN RLS RED Y PEDAGOGÍA VISUAL DE LÍNEA ESTIRADA

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Fundamento:** RF-220, RF-221, RF-224 (P-12) · RF-250, RF-254, RF-255, RF-256 (P-15)
**Gravedad:** 🟡 MEDIA · Corrección de Visibilidad en Producción y Claridad de UI
**Fecha:** 13 de octubre de 2026
**Regla de trabajo:** Un commit por bloque · Pruebas calculadas a mano · Salidas literales

---

# BLOQUE 1 · ALINEACIÓN RLS ACTIVACIÓN (RF-221 / PRODUCCIÓN)

## 1. El fallo
En la base de datos de Producción (`xkiwnxoferdfapezcwoq`), la política RLS `activacion_select` estaba restringida a:
```sql
qual = (fn_is_admin() OR socio_id = fn_current_socio_id())
```
Esto impedía que los socios no administradores lean la activación y puntos personales de sus descendientes en P-12 (Mi Red).

## 2. La solución
Aplicar en Producción la política alineada con `red_ancestro` que ya opera en DEMO:
```sql
DROP POLICY IF EXISTS "activacion_select" ON public.activacion;
CREATE POLICY "activacion_select" ON public.activacion FOR SELECT USING (
    fn_is_admin() 
    OR socio_id = fn_current_socio_id() 
    OR EXISTS (
        SELECT 1 FROM public.red_ancestro ra 
        WHERE ra.ancestro_id = fn_current_socio_id() 
          AND ra.descendiente_id = activacion.socio_id
    )
);
```

---

# BLOQUE 2 · FIDELIDAD AL MAPA VISUAL DE LÍNEA ESTIRADA EN P-15 (RF-254, RF-255, RF-256)

Ajustar `src/paginas/P15MiRango.jsx` para reflejar el mapa visual rector de `TAREA-07`:
- Explicar la regla de equilibrio de red (50% máximo por línea).
- Mostrar con transparencia puntos totales de la rama vs aporte a la meta.
- Reemplazar alertas de "Tope alcanzado" por indicadores de avance claros y no punitivos.

---

# BLOQUE 3 · SUITE DE PRUEBAS Y VERIFICACIÓN DE INTEGRIDAD

- Pruebas unitarias de rango en Vitest.
- Auditoría de cero bytes nulos (`grep -rlP '\x00' src/ scripts/`).
- Verificación de paridad contable en ciclos históricos.
