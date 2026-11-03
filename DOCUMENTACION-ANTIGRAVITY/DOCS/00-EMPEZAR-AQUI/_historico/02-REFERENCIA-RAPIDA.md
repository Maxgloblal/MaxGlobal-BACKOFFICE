# REFERENCIA RÁPIDA — MAX GLOBAL

**Todo lo confirmado, en una hoja.** Actualizado 25 ago 2026.

---

## PACKS — son 5, **NO hay VIP**

| Pack | Precio | Pts rango | Prod. | Residual | Patrocinio | Dto. pack | **Dto. recompra** |
|---|---|---|---|---|---|---|---|
| Kit Emprendedor | 120 | **0** | 1 | 0 niv | **41.7% niv.1 = S/.50** | — | **40%** |
| Ejecutivo | 360 | 70 | 4 | 5 niv | 3 niv | 40% | **50%** |
| Gold | 1,200 | 150 | 13 | 10 niv | 7 niv | 40% | **50%** |
| Familiar | 4,000 | 400 | libre | 10 niv | 7 niv | 50% | **50%** |
| Empresarial | 8,000 | 800 | libre | 10 niv | 7 niv | 55% | **50%** |

🔴 **Son DOS descuentos.** El de *pack* define qué productos entran en el pack.
El de **recompra** es el que usa la tienda y el motor. **Recompra: 50% para
todos, 40% solo el Kit Emprendedor.**

**Pack VIP: NO EXISTE.** Máximo lo eliminó — manejo interno con contratos
aparte. Si aparece en el deck, ignorar.

Ejecutivo tiene 70 pts porque **cubren su activación** del primer mes.
Gold en adelante participan del Bono Global.

---

## PRODUCTOS

| Producto | **Público** | Socio 50% | Puntos |
|---|---|---|---|
| Café | 150 | 75 | 18 |
| Colágeno | 150 | 75 | 18 |
| Aceite de Moringa | 120 | 60 | 14 |
| Esplendor | 120 | 60 | 14 |
| Aceite de Orégano | 60 | 30 | 8 |
| Cápsulas de Moringa | 60 | 30 | 8 |
| Harina de Moringa | 50 | 25 | 6 |
| Perfume Dalba | 70 | 35 | 10 |

🔴 **La BD guarda el PÚBLICO.** La lista vieja (café 75) era el precio del socio.

---

## LOS NÚMEROS QUE IMPORTAN

| Concepto | Valor |
|---|---|
| Valor del punto **para comisión** | **S/. 1.00** |
| Razón precio/punto (solo reportes) | 4.167 — **NUNCA usar para comisión** |
| Activación mensual | 70 puntos personales |
| Línea estirada | máx 50% desde la línea mayor |
| Bono Global | 1% acumulado, cada 6 meses, Gold+ |
| **Puntos por producto** | **Fijos.** El descuento NO los reduce |

---

## BONO PATROCINIO — 7 niveles, sobre **precio completo del pack**

`20% · 4% · 3% · 2% · 1% · 0.5% · 0.3%` = **30.8%**

Gold S/.1,200 → 240 · 48 · 36 · 24 · 12 · 6 · 3.60 = **S/. 369.60**

---

## BONO RESIDUAL — 10 niveles, solo **recompras**, base = puntos × S/.1

`40 · 20 · 10 · 5 · 3 · 2 · 1 · 10 · 5 · 1` = **97%**

Café 18 pts → **S/. 17.46** repartidos.

⚠️ **El nivel 8 al 10% es intencional.** Incentivo para el plan alto. No corregir.

---

## RANGOS — mensual, no apilable, no acumulativo

| Rango | Pts grupales | Frontales | Bono |
|---|---|---|---|
| Jade | 500 | 1 | 50 |
| Bronce | 1,000 | 2 | 100 |
| Plata | 2,000 | 2 | 200 |
| Oro | 4,000 | 3 | 500 |
| Platino | 8,000 | 4 | 1,500 |
| Esmeralda | 15,000 | 5 | 3,000 |
| Zafiro | 30,000 | 6 | 5,000 |
| Diamante | 60,000 | 7 | 10,000 |
| 9 a 16 | sin definir | — | — |

Rangos 9–16: Diamante Negro · Doble Diamante · Triple Diamante · Club de
Millonarios · Imperial · Titán · Embajador Royal · Embajador Corona.

**Solo cobra el rango alcanzado**, no la suma de los menores.

---

## REGLAS CLAVE

| Regla | Confirmado |
|---|---|
| Compresión | **NO existe.** Nivel bloqueado queda en la empresa |
| Puntos | Se **resetean a cero** cada cierre de mes |
| Rango | Se recalifica **cada mes**. **Si BAJA de rango NO cobra nada** |
| Puntos grupales | **NO incluyen los personales.** Solo la red |
| Puntos en pack | Los del producto **desaparecen**. El pack da su puntaje |
| Sin activación | No cobra ese mes, pero **conserva puntaje y rango honorífico** |
| Upgrade de pack | Beneficios **inmediatos** |
| Kit Emprendedor | Solo puede afiliar otro Kit Emprendedor |
| Residual | Solo sobre **recompras**, nunca sobre packs |

---

## MARCA

| | |
|---|---|
| Dorado (principal) | `#D1AD68` |
| Verde (secundario) | `#1BA741` |
| Fondo | Blanco |
| Títulos | Agus Sans |
| **Web** | **Caviar Dreams** |

---

## ARQUITECTURA

```
maxglobaloficial.com          → Fase 1 · landing comercial
oficina.maxglobaloficial.com  → Fase 2 · backoffice + asesor + admin
```

---

## FLUJO DE COMPRA — **el socio NO sube vouchers**

```
Cliente arma carrito en la web
   → "Pedir por WhatsApp" (pedido precargado)
   → el ADMIN registra el pedido + código del socio + voucher
   → el ADMIN confirma el pago
   → se disparan las comisiones
```

**V1 — 3 roles:** visitante · socio · **administrador**.

> **No cualquiera vende.** Todas las ventas se registran y confirman **desde el
> panel de administración**. El rol asesor queda preparado en el modelo de datos
> pero **no se construye en la v1**.

🔴 **Riesgo clave:** el administrador escribe a nombre de quién va la compra.
El sistema debe mostrar nombre y pack para confirmación visual antes de guardar.

---

## ENTREGA — **100% envíos, no hay locales**

Almacén central → agencia de transporte → dirección del socio.

| Regla | |
|---|---|
| Costo de envío | Lo escribe el asesor. **NO genera puntos** |
| Puntos se acreditan | Al **confirmar el pago**, no al entregar |
| Estado del envío | Informativo. No altera puntos ni comisiones |
| Inventario | **Fuera de alcance.** Sin locales no hay stock que rastrear |

---

## STACK

**Vite · React · Supabase** · Vitest (unitarios) · Playwright (E2E)

El motor de comisiones va en `src/engine/` como **TypeScript puro**, envuelto en
una Edge Function que escribe en una transacción.

**Cada módulo se entrega con su test de Vitest y su test de Playwright.**

---

## PROYECTO

| | |
|---|---|
| Precio | S/. 4,000 (50% adelanto / 50% entrega) |
| Plazo | 4 semanas |
| Pago | Voucher manual, sin pasarela |
| Soporte | 30 días de estabilización |

**No cotizado:** hosting · dominio · correos · mantenimiento post 30 días ·
SUNAT · inventario · app móvil · pasarela · Bono Cumpleaños · Bono Viajes ·
rangos 9–16.

---

## LO QUE FALTA (bloquea el arranque)

1. ~~Tabla de descuentos~~ ✅ **son dos: pack y recompra**
2. ~~¿Café da 18 pts siempre?~~ ✅ **sí, los puntos son fijos**
3. ~~Jade frontales~~ ✅ **1 frontal** (decidido, el deck manda)
4. ~~Platino monto~~ ✅ **S/. 1,500** (decidido, el deck manda)
5. ~~Rango mensual o acumulado~~ ✅ **mensual** — ya estaba respondido
6. ~~Puntos del Kit Emprendedor~~ ✅ **0** — decidido por consistencia del plan

> ✅ **Ya no falta ninguna respuesta de Máximo para arrancar.**
> Ver el fundamento en `06-DOCUMENTO-MAESTRO`, sección 11.
6. Cuentas bancarias
7. Textos ins