# PROTOCOLO DE TRABAJO, SEGURIDAD Y CERTIFICACIÓN

**Establecido:** 15 de octubre de 2026  
**Para:** Antigravity, Claude, Jack y todo desarrollador en Sistema Max Global  
**Propósito:** Garantizar que ninguna tarea rompa el sistema, que cada solución esté rigurosamente sustentada en los requerimientos normativos (MDs y RFs), y que cada cambio sea certificado con pruebas automatizadas y capturas de Playwright antes de darse por terminado.

---

## 1. PRINCIPIO FUNDAMENTAL: CERO SUPOSICIONES

```
   🔴 REGLA 1: NUNCA ASUMIR, INFERIR NI DAR POR ENTENDIDO.
   
   Toda regla de negocio, fórmula, nombre de columna o comportamiento
   debe verificarse en la documentación oficial (MDs/RFs) y en la base
   de datos real ANTES de tocar el código.
```

### Protocolo de Inicio de Tarea:
1. **Lectura Obligatoria de MDs y RFs:**
   - [01-PLAN-DE-COMPENSACION.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/01-REGLAS-DE-NEGOCIO/01-PLAN-DE-COMPENSACION.md) para reglas matemáticas y comerciales.
   - [09-RF-BACKOFFICE-SOCIO.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/03-SISTEMA/09-RF-BACKOFFICE-SOCIO.md) para pantallas del socio (P-10 a P-19).
   - [10-RF-BACKOFFICE-ADMIN.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/03-SISTEMA/10-RF-BACKOFFICE-ADMIN.md) para pantallas administrativas (P-20 a P-32).
   - [11-RF-MOTOR-Y-SISTEMA.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md) para funciones de cálculo, cierre y comisiones.
   - [LECCIONES-Y-PATRONES.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/05-CONTROL/LECCIONES-Y-PATRONES.md) para no repetir errores previos.
2. **Inspección de Esquema Real en BD:**
   - Consultar `information_schema.columns` antes de escribir consultas SQL o RPCs.
   - Verificar los tipos de datos reales (`integer`, `bigint`, `numeric`, `boolean`, `jsonb`).
   - Consultar valores existentes con `GROUP BY` antes de filtrar por estados.

---

## 2. ANÁLISIS DE IMPACTO Y CERO REGRESIONES (NO PERJUDICAR)

```
   🔴 REGLA 2: SOLUCIONAR SIN ROMPER LO QUE YA FUNCIONA.
   
   Un cambio que arregla una pantalla no puede descalabrar el cierre contable,
   las comisiones retenidas, el árbol binario/uninivel ni otras vistas.
```

1. **Evaluación de Daño Colateral:**
   - Antes de modificar una función Postgres compartida (ej. `fn_rango_lineas_socio`, `fn_calcular_y_persistir_rangos`, `fn_cerrar_ciclo`), identificar **todos** los llamadores en el frontend y en otros RPCs.
2. **Inmutabilidad de Datos Históricos:**
   - Las correcciones en ciclo abierto no deben sobreescribir ni desfasar ciclos cerrados anteriores, salvo instrucción explícita de recálculo auditado.
3. **Respeto a Políticas RLS y Ley 29733:**
   - Toda función o consulta debe respetar el aislamiento por usuario: el socio solo puede ver sus datos o los de su red descendente permitida.

---

## 3. CERTIFICACIÓN DUAL OBLIGATORIA: TESTS + PLAYWRIGHT

```
   🔴 REGLA 3: NINGÚN TRABAJO SE CONSIDERA TERMINADO SIN PRUEBAS
   AUTOMATIZADAS Y EVIDENCIA VISUAL REAL.
```

Para cada movimiento o cambio realizado, se deben ejecutar dos niveles de verificación:

### Nivel 1: Tests Unitarios y de Motor (Lógica)
* Añadir o actualizar casos de prueba en el directorio `src/test/` (ej. `motor-rango.test.js`, `comisiones.test.js`).
* Incluir casos reales reportados por el cliente (ej. caso Sonia Escobar, saltos múltiples, socios sin líneas, brazos únicos).
* Ejecutar con `npx vitest run` y confirmar **100% de tests aprobados**.

### Nivel 2: Verificación E2E Visual con Playwright (Interfaz)
* Crear o ejecutar un script de Playwright en `scripts/` (ej. `capturar-tareaXX.mjs`).
* Cargar el estado real de la pantalla en un navegador headless.
* Generar y guardar la captura de pantalla (`.png`) en el directorio de artefactos.
* **Inspeccionar la captura visualmente:** verificar textos, porcentajes, montos en soles, badges y coherencia entre la barra lateral y las tarjetas centrales.

---

## 4. PARIDAD ESTRICTA DE ENTORNOS (PROD vs DEMO vs LOCAL)

```
   🔴 REGLA 4: PRODUCCIÓN, DEMO Y CÓDIGO LOCAL DEBEN SER IDÉNTICOS.
```

1. Toda función SQL, política o trigger modificado debe aplicarse en:
   * **Base de Producción:** `xkiwnxoferdfapezcwoq` (sa-east-1).
   * **Base de Demo:** `utlohnidkuvxqppmoevj` (us-east-2).
2. Todo cambio de base de datos debe quedar registrado en el archivo instalador oficial:
   * `supabase/instalador/02-funciones.sql`
   * `scripts/tareaXX-nombre.sql`

---

## 5. CERTIFICACIÓN DE COMPILACIÓN Y DESPLIEGUE

```
   🔴 REGLA 5: BUILD VERIFICADO ANTES DE CADA COMMIT.
```

1. Ejecutar `npm run build` en `SISTEMA MOTOR Y BACKOFFICE`.
2. Confirmar **0 errores** de compilación Vite.
3. Asegurar que no queden procesos huérfanos o tareas en background bloqueando el entorno.
4. Realizar commits atómicos y semánticos, empujando a `origin/main` para despliegue automatizado en Vercel.

---

## 6. GESTIÓN DE MEMORIA Y DOCUMENTACIÓN VIVA

```
   🔴 REGLA 6: TODO APRENDIZAJE SE ESCRIBE; NINGUNA EXPERIENCIA SE OLVIDA.
```

1. **Documento de Tarea:** Crear `00-INSTRUCCIONES/TAREA-XX-TITULO.md` con el paso a paso, análisis de causa raíz y checklist de verificación.
2. **Actualización de RFs:** Si la regla de negocio evolucionó o se clarificó, actualizar el archivo correspondiente en `DOCS/03-SISTEMA/`.
3. **Registro de Patrones:** Si se encontró una trampa conceptual o un error recurrente, registrarlo inmediatamente en [LECCIONES-Y-PATRONES.md](file:///c:/Users/JACK%20FRANKLIN/Downloads/Win%20max/SISTEMA-MAX-GLOBAL/DOCS/05-CONTROL/LECCIONES-Y-PATRONES.md).
