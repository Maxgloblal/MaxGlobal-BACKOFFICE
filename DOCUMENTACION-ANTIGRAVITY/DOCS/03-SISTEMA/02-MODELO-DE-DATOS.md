# MODELO DE DATOS

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Archivo técnico:** `schema.sql` (PostgreSQL)

---

## VISIÓN GENERAL

El modelo tiene **22 tablas** organizadas en 7 grupos:

```
   CONFIGURACIÓN        config · nivel_comision
   CATÁLOGO             producto · pack · rango
   RED                  socio · red_ancestro
   CICLOS               ciclo
   TRANSACCIONES        orden · orden_detalle · voucher
   ENTREGA              punto_entrega · envio
   CÁLCULO              movimiento_puntos · activacion · comision · rango_ciclo
   DINERO               wallet_movimiento · solicitud_retiro · periodo_global
   AUDITORÍA            auditoria
```

---

## 1. CONFIGURACIÓN

### `config`
Toda regla ajustable del sistema, en pares clave-valor.

**Por qué existe:** cumple el principio R4 (cero hardcodeo). Max Global puede
cambiar el valor del punto, los puntos de activación o el límite de línea
estirada desde el panel, sin programador.

**Valores críticos que guarda:**

| Clave | Valor | Nota |
|---|---|---|
| `valor_punto_comision` | 1.00 | 🔴 Si esto cambia a 4.167, el sistema quiebra |
| `valor_punto_soles` | 4.167 | Solo reportes de volumen |
| `activacion_puntos_mes` | 70 | |
| `compresion_activa` | false | |
| `puntos_reset_mensual` | true | |
| `rango_bono_apilable` | false | |
| `linea_estirada_pct` | 50 | |

### `nivel_comision`
Los porcentajes de cada nivel, para patrocinio y residual.

**Por qué es tabla y no constante:** son 17 porcentajes que Max Global puede
querer ajustar. En tabla se cambian con un UPDATE.

---

## 2. CATÁLOGO

### `producto`
Los 8 productos de recompra con precio de lista y puntos.

Incluye un campo `descuento_pct` opcional, reservado por si Max Global confirma
que el descuento varía por producto *(pregunta 1.1 del formulario)*.

### `pack`
Los 5 packs de afiliación. Cada uno guarda **sus propias reglas**:

| Campo | Para qué |
|---|---|
| `puntos_rango` | Cuántos puntos aporta al rango |
| `niveles_residual` | Hasta qué nivel cobra residual (0, 5 o 10) |
| `niveles_patrocinio` | Hasta qué nivel cobra patrocinio (0, 3 o 7) |
| `descuento_recompra_pct` | 🔴 **Su descuento al recomprar. ES EL QUE USA EL MOTOR** |
| `descuento_en_pack_pct` | Con qué descuento se arman los productos del pack. **Informativo** |
| `cubre_activacion` | Si sus puntos activan el primer mes |
| `aplica_bono_global` | Si participa del aguinaldo semestral |
| `solo_afilia_igual` | Restricción del Kit Emprendedor |

**Por qué así:** las reglas por pack no se programan con `if pack == 'GOLD'`.
Se leen de la tabla. Agregar un pack nuevo es insertar una fila.

> **Pack VIP: eliminado.** Max Global lo maneja con contratos aparte.

### `rango`
Los 16 rangos. Los del 9 al 16 se crean con `definido = FALSE` y valores en
NULL, listos para que Max Global los cargue desde el panel.

---

## 3. RED — la pieza de mayor impacto en rendimiento

### `socio`
Datos del distribuidor, su patrocinador, su pack y su rango honorífico.

**Campo `rol`:** `socio` · `asesor` · `admin` · `superadmin`.

> El **asesor** y el **administrador** son personal de Max Global, **no están en
> la red**: no tienen patrocinador, no generan ni cobran comisiones, no aparecen
> en el árbol genealógico.

### `red_ancestro` ← **la decisión técnica más importante del modelo**

Es una **tabla de cierre** (closure table). Guarda **todas** las relaciones
ancestro→descendiente con su nivel de distancia.

**El problema que resuelve:**

Para pagar el residual hay que subir 10 niveles desde quien compró. Con una
estructura ingenua (solo guardar `patrocinador_id`), eso son 10 consultas
encadenadas por cada compra. Con 3,000 compras al mes son 30,000 consultas.

Con la tabla de cierre, subir 10 niveles es **un solo SELECT**:

```sql
SELECT ancestro_id, nivel
FROM red_ancestro
WHERE descendiente_id = :quien_compro
  AND nivel <= 10
ORDER BY nivel;
```

**Diferencia real:** con 50,000 socios, entre ~5 milisegundos y ~4 segundos.
El árbol genealógico se consulta constantemente en el backoffice.

**Cómo se mantiene:** un trigger. Al insertar un socio, copia los ancestros de
su patrocinador y les suma un nivel. Automático, sin código de aplicación.

---

## 4. CICLOS

### `ciclo`
Un registro por mes. Estados: `abierto` → `calculando` → `cerrado` → `pagado`.

**Protección:** un trigger impide insertar puntos u órdenes en un ciclo cerrado.
Es garantía de base de datos, no confianza en el código.

---

## 5. TRANSACCIONES

### `punto_entrega` y `envio`

Max Global trabaja 100% con envíos. `punto_entrega` se crea con **una sola
fila** ("Envío a domicilio") para que el día que abran un local baste con
insertar otra, sin tocar código.

`envio` guarda destinatario, dirección completa, agencia, costo, número de guía
y estado.

**Reglas duras:**

| # | Regla |
|---|---|
| 1 | `envio.costo_cent` **nunca** entra en la base de puntos ni de comisiones |
| 2 | El envío solo existe si la orden está `PAGADA` |
| 3 | El estado del envío es informativo: no altera puntos ni comisiones |
| 4 | Una incidencia del courier **no** revierte comisiones |

---

### `orden` y `orden_detalle`
Toda compra, sea afiliación o recompra. El detalle guarda el precio de lista,
el descuento aplicado y los puntos otorgados **en el momento de la compra**.

**Por qué guardar el precio histórico:** si Max Global sube el precio del café
el mes que viene, las órdenes viejas deben conservar el precio que se cobró.
Sin esto, los reportes históricos cambian solos.

La orden guarda además `asesor_id` (quién la registró) y `aprobada_por` (quién
confirmó el pago). **Nunca deben ser la misma persona** — es separación de
funciones.

**Estados:** `por_confirmar` → `pagada` → `despachada` → `entregada`, más
`rechazada` y `anulada`.

### `voucher`
La foto del depósito, **subida por el asesor**, no por el socio.

🔥 **Su confirmación por parte del administrador es el único evento que dispara
el cálculo de comisiones.**

---

## 6. CÁLCULO

### `movimiento_puntos` — libro mayor de puntos

Append-only. Cada movimiento lleva **tres banderas** que definen para qué
cuenta ese punto:

| Bandera | Qué habilita |
|---|---|
| `cuenta_activacion` | Suma a los 70 puntos del mes |
| `cuenta_residual` | Genera comisión residual al upline |
| `cuenta_rango` | Suma al puntaje grupal de rango |

**Aquí está toda la flexibilidad del modelo:**

| Origen | Activación | Residual | Rango |
|---|---|---|---|
| Pack de afiliación | ✅ | ❌ | ✅ |
| Recompra | ✅ | ✅ | ✅ |
| Bono Cumpleaños | ❌ | ❌ | ❌ *fuera del sistema — el cliente lo maneja aparte* |

Si Max Global cambia de opinión sobre qué cuenta para qué, es un cambio de
configuración — **no se reprograma el motor**.

### `activacion`
Si el socio llegó a sus 70 puntos en el ciclo.

**Se acumula al confirmar cada orden**, no al cierre: `fn_confirmar_orden_pago`
inserta y suma en esta tabla. `fn_ejecutar_cierre_ciclo` NO la toca.

> Corregido el 7/09. Antes decía "se calcula al cierre", que era falso y además
> contradecía RF-234 (el carrito debe mostrar el avance hacia los 70 puntos):
> un avance que solo existe al cerrar el mes no es un avance.

🔴 **Sin fila = el socio no compró en ese ciclo = no está activo = no cobra.**
No se rellena con filas en cero. Los ciclos 1-3 tienen 501 filas porque son
datos sembrados; los ciclos 4-6 tienen 2 o 3 porque son operación real.

### `comision` — libro mayor de comisiones

Append-only. Cada fila registra: quién cobra, quién generó el volumen, de qué
tipo, de qué nivel, sobre qué base, qué porcentaje y cuánto.

Incluye un campo `detalle` en JSON con el **rastro completo del cálculo**.
Eso es lo que permite responderle a un socio *"¿por qué me pagaron esto?"* con
el desglose exacto.

### `rango_ciclo`
El cálculo de rango de cada socio en cada ciclo. Guarda los puntos grupales,
los de la línea más fuerte, los computables tras aplicar el 50%, los frontales
activos y si calificó.

**Por qué guardar el intermedio:** si un socio reclama su rango, se puede
mostrar exactamente por qué no calificó, sin recalcular nada.

---

## 7. DINERO

### `wallet_movimiento`
Libro mayor de la billetera. Cada fila guarda el saldo resultante, así que el
saldo nunca se recalcula sumando todo.

### `solicitud_retiro`
Pedidos de retiro del socio y su aprobación.
✅ *RESUELTO 26/08 (resp. 12.4): el socio solicita el retiro desde el sistema y el administrador aprueba. Mínimo S/. 100.*

### `periodo_global`
Los semestres del Bono Global, con el pool acumulado.

---

## 8. AUDITORÍA

### `auditoria`
Registro de toda acción sensible: quién aprobó qué voucher, quién cambió qué
porcentaje, quién cerró qué ciclo. Con datos antes y después.

**Por qué:** es un sistema que mueve dinero. Ante cualquier disputa, tiene que
haber registro de quién hizo qué y cuándo.

---

## VISTAS DE APOYO

| Vista | Para qué |
|---|---|
| `v_puntos_ciclo` | Puntos del socio en el ciclo, con las 3 categorías |
| `v_wallet_saldo` | Saldo actual de cada billetera |
| `v_frontales_activos` | Cuántos directos activos tiene cada socio |

---

## 📌 PENDIENTES DEL MODELO

Ninguno exige cambiar la estructura. Todos se resuelven con un `UPDATE` a
`config`, `pack` o `rango`:

| Pendiente | Dónde se resuelve |
|---|---|
| Descuento de recompra ✅ | `pack.descuento_recompra_pct` |
| Descuento de armado del pack ✅ | `pack.descuento_en_pack_pct` |
| Puntos NO se prorratean ✅ | `config.puntos_prorratean_con_descuento = false` |
| Puntos del Kit Emprendedor | `pack.puntos_rango` |
| Puntos con o sin descuento | `config` + lógica de `orden_detalle` |
| Jade: frontales | `rango.frontales_activos` |
| Platino: bono | `rango.bono_cent` |
| Rangos 9 al 16 | `rango` (filas ya creadas) |
| Fechas de cierre y pago | `config` |
| Bono Cumpleaños | banderas de `movimiento_puntos` |
