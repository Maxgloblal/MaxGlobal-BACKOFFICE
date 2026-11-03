# QA DEL PLAN DE NEGOCIO — Max Global Corporation

**Fecha:** 2 de septiembre de 2026
**URL:** http://localhost:5173  (ejecutar `npm run dev` en SISTEMA MOTOR Y BACKOFFICE)
**Todos los montos verificados contra Postgres.**

> Sigue los casos en orden. Cada uno verifica una regla distinta del plan.
> Si una pantalla muestra un número diferente al esperado, es un bug.

---

## CREDENCIALES

| Cuenta | Email | Contraseña | Para qué |
|---|---|---|---|
| Admin | socio001@ejemplo.test | MaxGlobal2026! | Panel admin completo |
| ANA · Gold | socio002@ejemplo.test | MaxGlobal2026! | Comisiones reales, red grande |
| CARLA · Ejecutivo | socio004@ejemplo.test | MaxGlobal2026! | Pack limitado (3 niveles) |
| DIEGO · Ejecutivo | socio005@ejemplo.test | MaxGlobal2026! | Inactivo — 0 comisiones |
| TERESA · Kit | socio015@ejemplo.test | MaxGlobal2026! | Kit Emprendedor activo |

---

# CASO 1 · ACTIVACIÓN — la regla más importante

**Cuenta: DIEGO** (`socio005@ejemplo.test`)

DIEGO tiene 0 puntos personales en el ciclo 3. No estaba activo.

**P-11 Panel principal — qué debe ver:**
```
   Estado: INACTIVO  (en rojo o con urgencia)
   "Te faltan 70 puntos para cobrar este mes"
   Botón directo a la tienda
```

**P-14 Mis comisiones — qué debe ver:**
```
   Ciclo 3: S/. 0.00
   No hay comisiones porque no estaba activo
```

**La regla:** sin 70 puntos personales el socio no cobra NADA — ni patrocinio, ni residual, ni rango. Esta pantalla tiene que decírselo con claridad.

---

# CASO 2 · BONO DE PATROCINIO — los porcentajes exactos

**Cuenta: ANA** (`socio002@ejemplo.test`)

ANA tiene Pack Gold → 7 niveles de patrocinio habilitados.
Estuvo activa en el ciclo 3 (72 puntos personales).

**P-14 Mis comisiones → Ciclo 3 → Patrocinio — qué debe ver:**

| Nivel | Monto esperado | Detalle |
|---|---|---|
| Nivel 1 | **S/. 50.04** | Kit de S/. 120.00 × **41.7%** (Kit especial) |
| Nivel 2 | **S/. 48.00** | un pack × 4% |
| Nivel 3 | **S/. 54.00** | 5 packs × 3% |
| Nivel 4 | **S/. 135.20** | 4 packs × 2% |
| Nivel 5 | **S/. 12.00** | 1 pack × 1% |
| Nivel 6 | **S/. 1.80** | 1 pack × 0.5% |
| Nivel 7 | **S/. 15.60** | 2 packs × 0.3% |

**Total patrocinio ciclo 3: S/. 316.64**

**Lo que verifica cada número:**
- Nivel 1 en S/. 50.04 confirma que el Kit Emprendedor paga **41.7%** (no 20%)
- Niveles 2-7 confirman la escala **20/4/3/2/1/0.5/0.3**
- Que haya nivel 7 confirma que Gold habilita **7 niveles** (no 5 ni 10)

---

# CASO 3 · BONO RESIDUAL — base en puntos

**Cuenta: ANA** (`socio002@ejemplo.test`)

**P-14 Mis comisiones → Ciclo 3 → Residual — qué debe ver:**

| Nivel | Escala | Ejemplo verificado |
|---|---|---|
| Nivel 1 | 40% | **S/. 45.60** — 114 puntos × S/.1 × 40% |
| Nivel 2 | 20% | **S/. 14.40** — 72 puntos × S/.1 × 20% |
| Nivel 2 | 20% | **S/. 17.20** — 86 puntos × S/.1 × 20% |

**Total residual ciclo 3: S/. 889.80** (suma niveles 1 al 10)

**La regla que verifica:** el residual se calcula sobre **puntos × S/.1**, no sobre el precio del pack. 114 puntos × 1 × 40% = S/. 45.60.

**Y que haya nivel 10** confirma que Gold habilita 10 niveles de residual.

---

# CASO 4 · PACK LIMITADO — Ejecutivo solo llega al nivel 3

**Cuenta: CARLA** (`socio004@ejemplo.test`)

CARLA tiene Pack Ejecutivo → 3 niveles de patrocinio, 5 de residual.

**P-14 Mis comisiones — qué debe ver:**
```
   Patrocinio nivel 1  →  monto real
   Patrocinio nivel 2  →  monto real
   Patrocinio nivel 3  →  monto real
   Patrocinio nivel 4  →  "No cobrado · tu pack Ejecutivo habilita hasta el nivel 3"
   Patrocinio nivel 5  →  igual
   ...
   Residual nivel 6    →  "No cobrado · tu pack Ejecutivo habilita hasta el nivel 5"
```

**Total comisiones CARLA ciclo 3: S/. 327.48**

**La regla que verifica:** el pack limita los niveles. No es un error del sistema — el dinero no se redistribuye, se queda en la empresa. La pantalla tiene que explicárselo para que no llame a Máximo.

---

# CASO 5 · RANGO Y LÍNEA ESTIRADA

**Cuenta: ANA** (`socio002@ejemplo.test`)

**P-15 Mi rango — qué debe ver:**

```
   Rango alcanzado este ciclo:    PLATA
   Puntos grupales de la red:     25,270
   Puntos computables:               3,514   ← MUY diferente de 25,270
   Frontales activos:                    2
```

**Por qué 3,514 y no 25,270:**
ANA tiene una sola línea enorme que concentra casi toda la red.
La regla de línea estirada le recorta lo que puede contar de esa línea.
La pantalla debe mostrar **línea por línea** qué aportó y cuánto fue topado.

**Y lo más importante — el bono de rango:**
```
   ⚠️  Alcanzaste PLATA pero no cobras el bono de rango.
       Venías de un rango mayor. Al bajar de rango, el bono no se cobra.
```

ANA **no cobra S/. 200.00** del bono Plata porque bajó de rango.
Esta pantalla tiene que decírselo con claridad — si solo ve "Plata" sin la explicación, va a reclamar.

---

# CASO 6 · KIT EMPRENDEDOR — sin comisiones de red

**Cuenta: TERESA** (`socio015@ejemplo.test`)

TERESA tiene Kit Emprendedor. Estuvo activa (86 puntos).

**P-14 Mis comisiones — qué debe ver:**
```
   Ciclo 3: S/. 0.00
   (el Kit no genera comisiones sobre la red)
```

**P-16 Mi enlace — qué debe ver:**
```
   ⚠️  AVISO: Con tu Kit Emprendedor solo puedes afiliar a otros Kit Emprendedor.
       Para afiliar a cualquier pack, mejora a Ejecutivo o superior.
```

**La regla que verifica:** `solo_afilia_igual = true` para el Kit. Si no aparece la advertencia, el socio va a invitar a alguien para un Gold y el registro lo va a rechazar.

---

# CASO 7 · FLUJO ADMIN COMPLETO

**Cuenta: ADMIN** (`socio001@ejemplo.test`)

Este caso verifica que el ciclo de operación funciona.
**No uses datos de la red real — solo observa lo que ya existe.**

**P-20 Tablero — qué debe ver:**
```
   Ciclo activo: Septiembre 2026
   Órdenes por confirmar: N (lo que haya)
   Socios activos en ciclo: 0 (el ciclo 4 recién empezó)
   Comisiones estimadas: S/. 0.00 (ninguna confirmada aún)
```

**P-23 Bandeja de confirmación — qué debe ver:**
```
   Lista de órdenes en estado "por confirmar"
   Al tocar una: vista previa con quién activa, puntos y comisiones a generar
   Botón Confirmar y Rechazar
```

**P-25 Cierre de ciclo — qué debe ver:**
```
   Ciclo 3 (agosto 2026): CERRADO — solo lectura
   Ciclo 4 (septiembre 2026): abierto, vista previa disponible
   
   Al pedir la vista previa del ciclo 4:
      Total a pagar: S/. 0.00 (ninguna orden confirmada aún)
      Botón "Ejecutar" deshabilitado (o habilitado con 0)
```

**P-26 Configuración — qué debe ver:**
```
   activacion_puntos_mes = 70       (editable)
   monto_minimo_retiro_cent = 10000 (editable, muestra S/. 100.00)
   compresion_activa = false        (SOLO LECTURA — regla confirmada por Máximo)
   
   ⚠️  Dos alertas amarillas sobre ambigüedades en config
   
   Rangos 9-16: formularios vacíos, listos para ingresar
```

**P-27 Gestión de socios — qué debe ver:**
```
   Lista paginada de 501 socios (25 por página)
   Búsqueda por nombre: escribir "ANA" → filtra
   Detalle de ANA: patrocinador NO es editable, código NO es editable
```

---

# CASO 8 · BILLETERA — saldo vs estimado

**Cuenta: ANA** (`socio002@ejemplo.test`)

**P-19 Mi billetera — qué debe ver:**
```
   Disponible:          S/. 1,209.44    ← del cierre del ciclo 3
   Estimado ciclo 4:    S/. 0.00        ← ninguna orden confirmada aún
```

ANA tiene S/. 1,209.44 disponibles porque el ciclo 3 ya se cerró y sus
comisiones se abonaron a su billetera.

Si en tu sistema aparece S/. 0.00 disponible, el cierre no funcionó bien.
Si aparece el estimado como "disponible", hay un bug de etiquetado.

---

# RESUMEN — los 8 números clave del plan

Si estos 8 números salen bien, el plan está implementado correctamente:

| # | Qué verifica | Número esperado | Dónde |
|---|---|---|---|
| 1 | Kit paga 41.7% en nivel 1 | **S/. 50.04** | ANA → P-14 → Patrocinio nivel 1 |
| 2 | Escala patrocinio nivel 2 = 4% | **S/. 48.00** | ANA → P-14 → Patrocinio nivel 2 |
| 3 | Residual base en puntos (40% nivel 1) | **S/. 45.60** | ANA → P-14 → Residual nivel 1 |
| 4 | Total comisiones ANA ciclo 3 | **S/. 1,209.44** | ANA → P-19 → Disponible |
| 5 | Ejecutivo bloqueado en nivel 4+ | "habilita hasta nivel 3" | CARLA → P-14 |
| 6 | Rango sin bono por bajar | "bajaste de rango, no cobras" | ANA → P-15 |
| 7 | Inactivo = S/. 0.00 | **S/. 0.00 sin explicar** ← error | DIEGO → P-14 |
| 8 | Kit: advertencia de solo afilia igual | aviso visible | TERESA → P-16 |
