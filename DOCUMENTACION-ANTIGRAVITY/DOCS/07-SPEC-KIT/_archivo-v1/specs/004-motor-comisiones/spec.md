# SPEC 004 — MOTOR DE COMISIONES

**Estado:** borrador · **Rama sugerida:** `004-motor-comisiones`
**Fecha:** 25 de agosto de 2026
**Prioridad de construcción:** 🔴 **PRIMERA**

---

## RESUMEN

El corazón del sistema. Recibe una estructura de red y devuelve una liquidación.

**Es lo único irreversible del proyecto.** Una interfaz fea se corrige; una
comisión mal pagada no se recupera.

Por eso se construye y se prueba **antes** que cualquier pantalla que dependa
de él, aunque el cronograma cotizado lo ubique en la semana 3.

---

## PRINCIPIO DE DISEÑO

```
   ENTRADA                    MOTOR                     SALIDA
   ───────                    ─────                     ──────
   Estructura de red    →    cálculo puro    →    Lista de comisiones
   Puntos del ciclo          sin efectos            por beneficiario
   Configuración             secundarios
```

**Módulo puro.** Sin interfaz, sin consultas dispersas, sin escribir en base de
datos desde dentro del cálculo. Entra información, sale un resultado.

**Nadie más reimplementa esta lógica.** La API, el panel y los reportes la
consumen.

---

## LOS CINCO BONOS

| # | Bono | Cuándo | Base |
|---|---|---|---|
| 1 | Patrocinio | Al aprobarse un pack | Precio completo del pack |
| 2 | Residual | Cierre mensual | Puntos de recompra a S/. 1 |
| 3 | Rango | Cierre mensual | Volumen grupal del mes |
| 4 | Global | Cada 6 meses | 1% de puntos acumulados |
| 5 | Cumpleaños | ⏳ sin definir | ⏳ sin definir |

---

## BONO 1 · PATROCINIO ✅

**Disparador:** aprobación de un voucher de afiliación o upgrade.
**Base:** el precio completo del pack, sin descontar nada.
**Profundidad:** 7 niveles.

| Nivel | % | Gold S/.1,200 | Empresarial S/.8,000 |
|---|---|---|---|
| 1 | 20% | 240.00 | 1,600.00 |
| 2 | 4% | 48.00 | 320.00 |
| 3 | 3% | 36.00 | 240.00 |
| 4 | 2% | 24.00 | 160.00 |
| 5 | 1% | 12.00 | 80.00 |
| 6 | 0.5% | 6.00 | 40.00 |
| 7 | 0.3% | 3.60 | 24.00 |
| | **30.8%** | **369.60** | **2,464.00** |

*Verificado contra la lámina 11 del deck oficial.*

**Algoritmo**

```
obtener upline hasta 7 niveles
para cada nivel del 1 al 7:
    si no hay socio en ese nivel        → no pagar
    si su pack no habilita ese nivel    → no pagar, queda en la empresa
    monto = precio_pack × porcentaje_del_nivel
    registrar comisión tipo PATROCINIO
```

**Límites por pack:** Emprendedor 0 niveles · Ejecutivo 3 · Gold, Familiar y
Empresarial 7.

---

## BONO 2 · RESIDUAL ✅

**Disparador:** cierre de ciclo.
**Aplica solo a recompras.** Los packs de afiliación **no** generan residual.
**Base:** los puntos del producto, valorados a **S/. 1.00 por punto**.

> 🔴 **NUNCA multiplicar por 4.167.** Ese valor es la razón precio/punto para
> reportes. Usarlo como base de comisión hace que el sistema pague el doble de
> lo que factura.

| Nivel | % | Café (18 pts) |
|---|---|---|
| 1 | 40% | 7.20 |
| 2 | 20% | 3.60 |
| 3 | 10% | 1.80 |
| 4 | 5% | 0.90 |
| 5 | 3% | 0.54 |
| 6 | 2% | 0.36 |
| 7 | 1% | 0.18 |
| 8 | **10%** | 1.80 |
| 9 | 5% | 0.90 |
| 10 | 1% | 0.18 |
| | **97%** | **17.46** |

**⚠️ El nivel 8 al 10% no es un error.** Es un incentivo deliberado: solo los
packs Gold en adelante alcanzan 10 niveles. **No corregir.**

**Algoritmo**

```
para cada orden de RECOMPRA pagada en el ciclo:
    base_puntos = suma de puntos de la orden
    obtener upline hasta 10 niveles
    para cada nivel del 1 al 10:
        si no hay socio                     → no pagar
        si su pack no habilita ese nivel    → no pagar, queda en la empresa
        si no está ACTIVO (70 pts)          → no pagar, queda en la empresa
        monto = base_puntos × 1.00 × porcentaje
        registrar comisión tipo RESIDUAL
```

**Sin compresión.** Si un nivel no cobra, no se busca sustituto ni sube al
siguiente calificado.

**Reparto efectivo:** Emprendedor 0% · Ejecutivo 78% · Gold y superiores 97%.

---

## BONO 3 · RANGO ✅

**Disparador:** cierre de ciclo.
**Se paga cada mes** según el rango que califique en ese ciclo.
**No es apilable:** un Diamante cobra S/.10,000, no la suma de los rangos
menores.

| # | Rango | Puntos grupales | Frontales | Bono |
|---|---|---|---|---|
| 1 | Jade | 500 | ⏳ 0 o 1 | 50 |
| 2 | Bronce | 1,000 | 2 | 100 |
| 3 | Plata | 2,000 | 2 | 200 |
| 4 | Oro | 4,000 | 3 | 500 |
| 5 | Platino | 8,000 | 4 | ⏳ 1,000 o 1,500 |
| 6 | Esmeralda | 15,000 | 5 | 3,000 |
| 7 | Zafiro | 30,000 | 6 | 5,000 |
| 8 | Diamante | 60,000 | 7 | 10,000 |
| 9–16 | Diamante Negro → Embajador Corona | 📌 | 📌 | 📌 |

**Algoritmo**

```
calcular puntos personales del ciclo
calcular puntos de CADA LÍNEA por separado
identificar la línea de mayor volumen
contar frontales activos

para cada rango, de mayor a menor:
    tope = puntos_requeridos × 50%
    computable = MIN(linea_mayor, tope) + suma_de_las_demas_lineas

    si computable >= puntos_requeridos
       Y frontales_activos >= requeridos
       Y el socio está ACTIVO:
           califica → pagar SOLO el bono de ese rango
           detener búsqueda
```

**Rango honorífico:** si el socio no está activo, no cobra, pero conserva su
título más alto alcanzado.

---

## REGLA DE LÍNEA ESTIRADA ✅

De la línea con mayor volumen solo se cuenta hasta el **50%** de los puntos
requeridos. El resto debe venir de las demás líneas.

**Ejemplo — Jade (500 pts, tope 250)**

```
Línea A:  800 pts  →  cuentan 250   (llegó al tope)
Línea B:  180 pts  →  cuentan 180
Línea C:   90 pts  →  cuentan  90
                      ───────────
          COMPUTABLE:  520 pts   ✓ califica
```

Con toda la red en la línea A, con 800 puntos solo contarían 250 y **no
calificaría**. Esto impide calificar con una sola rama fuerte.

---

## BONO 4 · GLOBAL SEMESTRAL ✅ parcial

Cada 6 meses se reparte el **1% de los puntos acumulados** de la compañía entre
los socios con pack **Gold, Familiar o Empresarial**.

Emprendedor y Ejecutivo quedan excluidos.

⏳ **Pendiente:** conversión del punto a soles, cortes semestrales, si el
reparto es en partes iguales o proporcional, y si exige estar activo.

---

## BONO 5 · CUMPLEAÑOS ⏳ SIN DEFINIR

Solo aparece en el deck: *"Bono Cumpleaños al 70% · compras después de los 70
pts · 4 productos"*.

**No programar hasta tener la definición completa.**

⚠️ Un descuento del 70% que además genere puntos y pague comisión al 97% sería
la operación más costosa del sistema.

---

## ACTIVACIÓN MENSUAL ✅

70 puntos personales en el mes para cobrar comisiones de equipo.

**Si no llega:** no cobra residual ni bono de rango ese mes, **pero conserva su
puntaje acumulado y su rango honorífico**.

---

## CIERRE DE CICLO ✅

```
1  Bloquear el ciclo               → estado CALCULANDO
2  Calcular activación de cada socio
3  Calcular Bono Residual de todas las recompras
4  Calcular Rango de cada socio (con línea estirada)
5  Calcular Bono Global si corresponde
6  Generar liquidación y abonar a billeteras
7  Cerrar el ciclo                 → no admite escrituras
8  Resetear puntos a cero
9  Abrir el ciclo siguiente
```

---

## REQUISITOS FUNCIONALES

| # | Requisito |
|---|---|
| RF-301 | El motor **debe** ser un módulo puro sin efectos secundarios |
| RF-302 | El motor **debe** calcular patrocinio sobre el precio completo del pack |
| RF-303 | El motor **debe** calcular residual sobre puntos a S/. 1.00 |
| RF-304 | El motor **no debe** aplicar compresión en ningún caso |
| RF-305 | El motor **debe** verificar pack y activación en cada nivel |
| RF-306 | El motor **debe** aplicar el tope del 50% de línea estirada |
| RF-307 | El motor **debe** pagar solo el rango alcanzado, sin apilar |
| RF-308 | El motor **debe** conservar el rango honorífico del socio inactivo |
| RF-309 | El motor **debe** registrar el rastro completo de cada cálculo |
| RF-310 | El motor **debe** leer toda regla desde configuración |
| RF-311 | El motor **debe** operar en enteros de céntimos |
| RF-312 | El motor **debe** verificar que lo pagado no exceda lo comprometido |

---

## PLAN DE PRUEBAS OBLIGATORIO

> **Ningún cálculo entra a producción sin su test.** Artículo VI de la
> constitución.

### Casos unitarios

| Test | Debe dar |
|---|---|
| Patrocinio Gold, 7 niveles llenos | S/. 369.60 exactos |
| Patrocinio Empresarial, 7 niveles | S/. 2,464.00 exactos |
| Residual café, 10 niveles llenos | S/. 17.46 exactos |
| Residual con Ejecutivo en N6 | N6 a N10 no se pagan |
| Kit Emprendedor en el upline | No cobra residual |
| Socio inactivo en N4 | N4 no cobra, N5 sí, sin sustituto |
| Línea estirada exacta al 50% | Se aplica el tope |
| Línea única con exceso | No califica |
| Rango sin frontales suficientes | No califica |
| Ciclo cerrado | Rechaza escrituras |
| Upgrade a mitad de ciclo | Beneficios inmediatos |

### Casos de integración

| Test | Debe verificar |
|---|---|
| Red simulada de 500+ socios | El cierre completo corre sin error |
| Suma total de comisiones | Nunca excede el porcentaje comprometido |
| Ciclo con todos inactivos | Total pagado = 0 |
| Reseteo de puntos | Todos vuelven a cero, el histórico se conserva |

---

## PENDIENTES DE DEFINICIÓN

| # | Qué falta | Impacto |
|---|---|---|
| D-01 | Puntos sobre precio de lista o con descuento | 🔴 Alto |
| D-02 | Puntaje del Kit Emprendedor | 🔴 Alto |
| D-03 | Jade: 0 o 1 frontal activo | 🟡 Medio |
| D-04 | Platino: S/.1,000 o S/.1,500 | 🟡 Medio |
| D-05 | Si los puntos de pack se resetean | 🟡 Medio |
| D-06 | Definición de "frontal activo" | 🟡 Medio |
| D-07 | Si los puntos grupales incluyen los personales | 🟡 Medio |
| D-08 | Rangos 9 al 16 | 🟡 Medio |
| D-09 | Bono Global: 4 detalles | 🟢 Bajo |
| D-10 | Bono Cumpleaños: reglas completas | 🟢 Bajo |

---

## DEPENDENCIAS

**No depende de ninguna otra spec.** Es la base de todo lo demás.

Requiere únicamente el modelo de datos (`03-SISTEMA/02-MODELO-DE-DATOS`) y la
configuración cargada.
