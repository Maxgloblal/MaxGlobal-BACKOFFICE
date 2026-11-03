# FLUJOS DEL SISTEMA

**Versión:** 2.0 · **Fecha:** 25 de agosto de 2026
**Cambios desde la v1:** el socio ya no sube comprobantes · entrega 100% por
envío · **la venta se centraliza en el administrador**

> Cómo funciona el sistema paso a paso. Sin código — es la especificación que
> debe cumplir la implementación.

---

## VISIÓN GENERAL

```
   VISITANTE / SOCIO              ADMINISTRADOR
   ─────────────────           ─────────────────
   arma carrito           →    registra pedido
   en la web                   sube comprobante
        │                      confirma pago    🔥
        └──── WhatsApp ────►   despacha
                               cierra ciclo     🔥

   📌 En la v1 NO hay rol asesor: todo lo hace el administrador.
```

**Solo dos acciones generan dinero:** confirmar un pago y cerrar un ciclo.
Ambas son exclusivas del administrador.

---

## FLUJO 1 · AFILIACIÓN DE UN SOCIO NUEVO

```
1. Visitante llega por enlace de patrocinador
      maxglobaloficial.com/?ref=MG-0847

2. Explora el catálogo, los packs y el plan
      → el ?ref= sobrevive toda la navegación

3. Elige su pack y pulsa "Quiero afiliarme"

4. Camino A — se registra él mismo en la web
      · Datos personales
      · Dirección de envío
      · Pack elegido
      · El sistema valida:
          ✓ el patrocinador existe y está activo
          ✓ si el patrocinador es Kit Emprendedor,
            solo puede afiliar Kit Emprendedor
          ✓ correo y documento únicos
      → socio queda PENDIENTE
      → se le muestra el WhatsApp de Max Global

   Camino B — lo registra el administrador
      · El visitante escribe directo por WhatsApp
      · El administrador crea el socio desde su panel
      · Confirma visualmente el patrocinador
      → socio queda PENDIENTE

5. El cliente deposita y manda la foto a Max Global

6. El administrador registra el comprobante y el envío

7. 🔥 EL ADMINISTRADOR CONFIRMA EL PAGO
      → socio pasa a ACTIVO
      → se acreditan sus puntos de pack
      → se genera el Bono de Patrocinio en 7 niveles

8. Se despacha el pedido y se carga el número de guía
```

> **Hasta el paso 7, el socio no existe para la red.** No aparece en el árbol,
> no genera comisiones, no cuenta como frontal.

---

## FLUJO 2 · RECOMPRA MENSUAL

```
1. El socio entra a su backoffice y arma su carrito
      · Los precios ya traen SU descuento aplicado
      · Un contador muestra cuántos puntos suma
      · Avisa cuando alcanza los 70 de activación

2. Pulsa "Pedir por WhatsApp"
      → se abre el chat de Max Global con el pedido escrito:

        Hola, quiero hacer un pedido:
        • Café x2 ......... S/ 90.00
        • Colágeno x1 ..... S/ 45.00
        Total: S/ 135.00
        Mi código: MG-0847
        Nombre: María Torres

3. El administrador cotiza el envío según la ciudad y cierra la venta

4. El cliente deposita el total (productos + envío)

5. El administrador registra en el sistema:
      · Busca al socio por código
      · ⚠️ CONFIRMA VISUALMENTE que es la persona correcta
      · Carga los productos
      · Adjunta el comprobante
      · Registra dirección, agencia y costo de envío
      → orden queda POR CONFIRMAR

6. 🔥 EL ADMINISTRADOR CONFIRMA EL PAGO
      → se acreditan los puntos al socio
      → suman a su activación del mes
      → quedan en cola para el residual del cierre

7. Se despacha y se carga el número de guía
```

---

## FLUJO 3 · CONFIRMACIÓN DEL PAGO — el disparador de todo

```
1. El administrador abre la bandeja de pendientes

2. Ve cada pedido con:
      · Foto del comprobante
      · Socio a nombre de quién va
      · Quién lo registró
      · Monto esperado vs monto declarado
      · Alerta si no coinciden

3. Antes de confirmar, el sistema le muestra QUÉ VA A OCURRIR:

   ┌──────────────────────────────────────────┐
   │  AL CONFIRMAR VA A OCURRIR:              │
   │   · María Torres pasa a ACTIVO           │
   │   · Se acreditan 150 puntos de rango     │
   │   · Se generan 7 comisiones              │
   │     por un total de S/. 369.60           │
   └──────────────────────────────────────────┘

4. Confirma explícitamente
      → orden pasa a PAGADA
      → 🔥 se dispara el motor de comisiones
      → queda registro de quién confirmó y cuándo

   O rechaza
      → motivo obligatorio
      → se corrige y se vuelve a registrar
```

> 🔴 **Protección obligatoria contra doble confirmación.** Un doble clic no
> puede generar las comisiones dos veces.

---

## FLUJO 4 · BONO DE PATROCINIO

Se ejecuta **una sola vez**, al confirmarse el pago de un pack.

```
ENTRADA: socio que compró · pack · ciclo actual

PASO 1  Obtener el upline hasta 7 niveles

PASO 2  Para cada nivel del 1 al 7:
          ¿hay socio en este nivel?
                NO → no se paga
          ¿su pack habilita este nivel?
                NO → no se paga, queda en la empresa
          monto = precio_del_pack × porcentaje_del_nivel
          registrar comisión tipo PATROCINIO

PASO 3  Registrar el total repartido y el remanente
```

**Ejemplo — Pack Gold (S/. 1,200)**

| Nivel | % | Monto | Condición |
|---|---|---|---|
| 1 | 20% | 240.00 | su pack habilita N1 |
| 2 | 4% | 48.00 | — |
| 3 | 3% | 36.00 | — |
| 4 | 2% | 24.00 | solo Gold o superior |
| 5 | 1% | 12.00 | solo Gold o superior |
| 6 | 0.5% | 6.00 | solo Gold o superior |
| 7 | 0.3% | 3.60 | solo Gold o superior |

> **Sin compresión.** Si el nivel 4 es un Ejecutivo (3 niveles de patrocinio),
> esos S/. 24 no se pagan y **no suben** al nivel 5.

---

## FLUJO 5 · BONO RESIDUAL

Se ejecuta **al cierre del mes**, sobre las recompras del ciclo.

```
PARA CADA orden de RECOMPRA pagada en el ciclo:

  PASO 1  base_puntos = suma de puntos de los productos
          ⚠️ el costo de envío NO entra

  PASO 2  Obtener el upline hasta 10 niveles

  PASO 3  Para cada nivel del 1 al 10:
            ¿hay socio?                  NO → no se paga
            ¿su pack habilita el nivel?  NO → queda en la empresa
            ¿está ACTIVO (70 pts)?       NO → queda en la empresa
            monto = base_puntos × S/.1.00 × porcentaje
            registrar comisión tipo RESIDUAL
```

**Ejemplo — un café (18 puntos)**

```
   Base: 18 puntos × S/. 1.00 = S/. 18.00

   N1  40% → 7.20      N6   2% → 0.36
   N2  20% → 3.60      N7   1% → 0.18
   N3  10% → 1.80      N8  10% → 1.80  ← incentivo del plan alto
   N4   5% → 0.90      N9   5% → 0.90
   N5   3% → 0.54      N10  1% → 0.18
                                ──────
                    TOTAL 97%:   17.46
```

> Los packs de afiliación **NO** generan residual. Solo las recompras.

---

## FLUJO 6 · CÁLCULO DE RANGO Y LÍNEA ESTIRADA

```
PASO 1  Puntos personales del socio en el ciclo
PASO 2  Puntos de CADA LÍNEA por separado
PASO 3  Identificar la línea con mayor volumen
PASO 4  Contar frontales activos

PASO 5  Para cada rango, de mayor a menor:
          tope = puntos_requeridos × 50%
          computable = MIN(linea_mayor, tope)
                     + suma de las demás líneas

          ¿computable >= requeridos?
          ¿frontales_activos >= requeridos?
          ¿el socio está ACTIVO?
                TODO SÍ → califica. Detener búsqueda.

PASO 6  Pagar SOLO el bono de ese rango
        Actualizar rango honorífico si superó su máximo
```

**Ejemplo — Jade (500 pts, tope 250)**

```
   Línea A:  800 pts  →  cuentan 250   (llegó al tope)
   Línea B:  180 pts  →  cuentan 180
   Línea C:   90 pts  →  cuentan  90
                         ───────────
             COMPUTABLE:  520 pts   ✓ califica
```

Con toda la red en una sola línea, con 800 puntos solo contarían 250 y **no
calificaría**.

---

## FLUJO 7 · CIERRE DE CICLO MENSUAL

```
1. El admin inicia el cierre
2. Ciclo → CALCULANDO   (se bloquean escrituras)

3. VERIFICACIÓN PREVIA
     · pedidos sin confirmar
     · configuración incompleta

4. VISTA PREVIA          ← todavía no se escribió nada
     · socios activos / inactivos
     · total por cada bono
     · TOTAL A PAGAR
     · ✓ verificación: no excede lo comprometido
     → se puede CANCELAR sin consecuencias

5. CONFIRMACIÓN EXPLÍCITA

6. EJECUCIÓN
     · calcular activación de cada socio
     · calcular residual de todas las recompras
     · calcular rango con línea estirada
     · calcular Bono Global si toca semestre
     · abonar todo a las billeteras

7. Ciclo → CERRADO       (inmutable)

8. 🔄 RESETEO: los puntos vuelven a cero
     (el histórico de movimientos NO se borra)

9. Abrir el ciclo siguiente
10. Exportar la liquidación para el pago bancario
```

> Si el total a pagar excede el porcentaje comprometido, **el cierre se
> bloquea**. Es la última red de seguridad del sistema.

---

## FLUJO 8 · ENVÍO

```
Orden PAGADA
     ↓
PREPARANDO   → se arma el paquete
     ↓
ENVIADO      → se carga agencia y número de guía
     ↓
ENTREGADO    → el socio lo recibió
```

**Reglas:**

| # | Regla |
|---|---|
| 1 | El envío no altera puntos ni comisiones en ningún estado |
| 2 | El costo del envío **nunca** genera puntos |
| 3 | El socio ve el estado y el número de guía desde su backoffice |
| 4 | Una incidencia del courier **no** revierte comisiones |

> La regla 4 protege al socio: si el paquete se pierde, no pierde su activación
> ni su rango del mes. La reposición es logística, no del plan.

---

## FLUJO 9 · UPGRADE DE PACK

```
1. El socio pide mejorar su pack desde su perfil
2. Se genera un pedido de upgrade
3. Paga y el administrador lo registra
4. 🔥 El admin confirma
     → el pack cambia
     → ✅ los beneficios se activan DE INMEDIATO
     → desbloquea niveles residuales y de patrocinio al instante
     → se suman los puntos de rango del pack nuevo
```

✅ *RESUELTO 26/08 (resp. 13.3): paga el **pack completo** de nuevo, no la diferencia.*

---

## 📌 FLUJOS PENDIENTES DE DEFINIR

| Flujo | Qué falta |
|---|---|
| Bono Cumpleaños | Todas las reglas |
| Bono Viajes | Si entra al sistema o se maneja fuera |
| Solicitud de retiro | Si el sistema lo gestiona o solo muestra saldo |
| Baja de socio | Qué pasa con su descendencia |
| Cambio de patrocinador | Si se permite y bajo qué condiciones |
| Comisión de Max Global | 🔴 Si cobra por vender, es un sexto bono |
