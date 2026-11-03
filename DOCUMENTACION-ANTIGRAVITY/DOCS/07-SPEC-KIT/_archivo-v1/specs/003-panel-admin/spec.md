# SPEC 003 — PANEL DE ADMINISTRACIÓN

**Estado:** borrador · **Rama sugerida:** `003-panel-admin`
**Fecha:** 25 de agosto de 2026
**Entregable de:** Semana 3 del cronograma

---

## RESUMEN

El panel de control de Max Global Corporation. Es la superficie de **mayor
poder y mayor riesgo** del sistema: desde acá se aprueba dinero que entra, se
liquida dinero que sale y se cambian las reglas del plan de compensación.

**Principio que gobierna esta superficie:** toda acción con consecuencia
financiera debe ser **explícita, reversible cuando se pueda, y auditada
siempre**.

---

## CONTEXTO

| Realidad | Consecuencia de diseño |
|---|---|
| La aprobación de vouchers es diaria | Debe ser rápida: ver, comparar, decidir |
| Un error de aprobación paga comisiones falsas | Confirmación explícita, nunca un clic accidental |
| El cierre de ciclo es irreversible | Vista previa obligatoria antes de ejecutar |
| Max Global no es técnico | Lenguaje del negocio, no de base de datos |

> **El evento más importante del sistema entero ocurre acá:** aprobar un
> voucher dispara el motor de comisiones. Es el único momento en que se genera
> dinero a pagar.

---

## HISTORIAS DE USUARIO

### HU-1 · El administrador aprueba vouchers — *prioridad P1*

Entra cada día, revisa los depósitos pendientes contra su cuenta bancaria y
aprueba o rechaza.

**Criterios de aceptación**

1. **Dado** vouchers pendientes, **cuando** entra al panel, **entonces** los ve
   ordenados por antigüedad con la foto, el monto y la orden asociada.
2. **Dado** un voucher, **cuando** lo aprueba, **entonces** el sistema pide
   confirmación explícita mostrando **qué va a ocurrir**: qué socio se activa,
   qué puntos se acreditan y qué comisiones se van a generar.
3. **Dado** un voucher aprobado, **cuando** se confirma, **entonces** se
   dispara el motor de comisiones y queda registro de quién aprobó y cuándo.
4. **Dado** un voucher que se rechaza, **cuando** se confirma, **entonces** es
   obligatorio escribir el motivo y el socio puede subir otro.
5. **Dado** un monto de voucher distinto al de la orden, **cuando** se abre,
   **entonces** el sistema lo advierte de forma visible.

> El punto 2 es la diferencia entre un panel seguro y uno peligroso. Aprobar no
> puede ser un clic sin consecuencia visible.

---

### HU-2 · El administrador cierra el mes — *prioridad P1*

Al terminar el ciclo ejecuta el cálculo, revisa los resultados y liquida.

**Criterios de aceptación**

1. **Dado** un ciclo por cerrar, **cuando** inicia el proceso, **entonces** el
   sistema muestra una **vista previa** con el total a pagar por tipo de bono,
   cuántos socios activos y cuántos calificaron a rango.
2. **Dado** la vista previa, **cuando** el administrador la revisa,
   **entonces** puede cancelar sin que nada se haya escrito.
3. **Dado** una confirmación, **cuando** se ejecuta el cierre, **entonces** se
   abonan las comisiones, se resetean los puntos y el ciclo queda bloqueado.
4. **Dado** un ciclo cerrado, **cuando** alguien intenta modificarlo,
   **entonces** el sistema lo impide.
5. **Dado** el cierre ejecutado, **cuando** termina, **entonces** se puede
   exportar la liquidación para el pago bancario.

---

### HU-3 · El administrador ajusta las reglas — *prioridad P1*

Necesita cambiar un porcentaje, un umbral o cargar los rangos faltantes sin
llamar a un programador.

**Por qué es P1:** es el compromiso central del Artículo IV de la constitución.
Sin esto, cada ajuste del plan cuesta una intervención técnica.

**Criterios de aceptación**

1. Puede editar los porcentajes de cada nivel de patrocinio y residual.
2. Puede editar precios, puntajes y descuentos de productos y packs.
3. Puede cargar y editar los 16 rangos, incluidos los 8 que hoy están sin
   definir.
4. Puede editar el valor del punto, los puntos de activación y el límite de
   línea estirada.
5. **Todo cambio queda auditado** con autor, fecha, valor anterior y nuevo.
6. **Un cambio de configuración nunca altera ciclos ya cerrados.**

---

### HU-4 · El administrador consulta la red — *prioridad P2*

Necesita ver el estado general del negocio y buscar socios concretos.

**Criterios de aceptación**

1. Ve totales: socios por estado, por pack, por rango.
2. Puede buscar un socio y ver su ficha completa, su red y sus comisiones.
3. Puede ver el árbol completo desde cualquier punto.
4. Ve el volumen del ciclo en curso.

---

### HU-5 · El administrador gestiona pagos — *prioridad P2*

Necesita saber a quién le debe y registrar lo pagado.

⏳ *Depende de si el sistema gestiona retiros o solo muestra saldos.*

---

## PANTALLAS

### P-01 · Tablero

| Bloque | Contenido |
|---|---|
| Alertas | Vouchers pendientes · días para el cierre · configuración incompleta |
| Ciclo en curso | Volumen acumulado · socios activos · comisión estimada |
| Red | Total de socios · nuevos del mes · distribución por pack |
| Accesos | Vouchers · Cerrar ciclo · Configuración · Socios |

---

### P-02 · Bandeja de vouchers — *la pantalla más usada*

Lista de pendientes con: foto en miniatura, socio, tipo de orden, monto
esperado, monto declarado, banco, fecha y antigüedad.

**Al abrir uno:**

```
┌─ VOUCHER #1247 ────────────────────────────────────┐
│                                                    │
│  [ foto ampliable del voucher ]                    │
│                                                    │
│  Socio:     María Torres (MG-0847)                 │
│  Orden:     Afiliación · Pack Gold                 │
│  Esperado:  S/. 1,200.00                           │
│  Declarado: S/. 1,200.00        ✓ coincide         │
│  Banco:     BCP · Op. 88472910                     │
│                                                    │
│  AL APROBAR VA A OCURRIR:                          │
│   · María Torres pasa a ACTIVO                     │
│   · Se acreditan 150 puntos de rango               │
│   · Se generan 7 comisiones de patrocinio          │
│     por un total de S/. 369.60                     │
│                                                    │
│         [ Rechazar ]        [ Aprobar ]            │
└────────────────────────────────────────────────────┘
```

**Filtros:** pendientes · aprobados · rechazados · por rango de fechas.

---

### P-03 · Cierre de ciclo

Proceso en pasos, con vista previa obligatoria:

```
Paso 1  Verificación previa
        · Vouchers pendientes sin resolver
        · Órdenes sin voucher
        · Configuración incompleta

Paso 2  Vista previa del cálculo          ← nada se ha escrito todavía
        · Socios activos / inactivos
        · Total Bono de Patrocinio
        · Total Bono Residual
        · Total Bono de Rango
        · Total Bono Global (si corresponde)
        · TOTAL A PAGAR

Paso 3  Confirmación explícita

Paso 4  Ejecución
        · Se abonan comisiones
        · Se resetean los puntos
        · El ciclo queda cerrado

Paso 5  Exportar liquidación
```

**Verificación obligatoria en el paso 2:** el sistema comprueba que la suma
pagada no exceda el porcentaje comprometido. Si lo excede, **bloquea el cierre**.

---

### P-04 · Configuración del plan

Secciones separadas, cada una con confirmación al guardar:

| Sección | Qué se edita |
|---|---|
| Valores generales | Valor del punto · puntos de activación · línea estirada |
| Niveles de patrocinio | Los 7 porcentajes |
| Niveles residuales | Los 10 porcentajes |
| Productos | Precio, puntaje y estado de los 8 productos |
| Packs | Precio, puntos, niveles, descuento y reglas de los 5 packs |
| Rangos | Los 16 rangos: puntos, frontales y bono |
| Ciclo | Día de cierre y día de pago |
| Cuentas bancarias | Las que ve el socio al pagar |

**Advertencia visible en la sección de valores generales:**

> Cambiar el valor del punto de comisión afecta todos los cálculos futuros.
> El valor actual es S/. 1.00 por punto.

---

### P-05 · Socios

Tabla con búsqueda y filtros por estado, pack, rango y fecha de afiliación.

**Ficha del socio:** datos, pack, patrocinador, red, historial de órdenes,
comisiones, puntos por ciclo y bitácora de cambios.

**Acciones:** suspender, reactivar, editar datos, cambiar pack manualmente.

> Toda acción sobre un socio queda auditada con motivo obligatorio.

---

### P-06 · Reportes

| Reporte | Contenido |
|---|---|
| Liquidación del ciclo | Lo que se le paga a cada socio, exportable |
| Volumen por periodo | Ventas y puntos por mes |
| Crecimiento de red | Altas por periodo |
| Rangos alcanzados | Quién calificó a qué |
| Comisiones por tipo | Distribución del gasto |

---

### P-07 · Auditoría

Registro de toda acción sensible: quién, qué, cuándo, valor anterior y nuevo.
Filtrable por usuario, tipo de acción y rango de fechas.

**No se puede borrar ni editar.**

---

## REQUISITOS FUNCIONALES

| # | Requisito |
|---|---|
| RF-201 | El sistema **debe** listar vouchers pendientes ordenados por antigüedad |
| RF-202 | El sistema **debe** mostrar las consecuencias antes de aprobar un voucher |
| RF-203 | El sistema **debe** exigir motivo obligatorio al rechazar |
| RF-204 | El sistema **debe** advertir cuando el monto declarado no coincide |
| RF-205 | El sistema **debe** disparar el motor de comisiones únicamente al aprobar |
| RF-206 | El sistema **debe** mostrar vista previa antes de cerrar un ciclo |
| RF-207 | El sistema **debe** permitir cancelar el cierre sin escribir nada |
| RF-208 | El sistema **debe** bloquear el cierre si el pago excede lo comprometido |
| RF-209 | El sistema **debe** impedir modificaciones en ciclos cerrados |
| RF-210 | El sistema **debe** permitir editar toda regla del plan sin tocar código |
| RF-211 | El sistema **debe** auditar todo cambio de configuración |
| RF-212 | El sistema **no debe** permitir que un cambio de configuración altere ciclos cerrados |
| RF-213 | El sistema **debe** permitir exportar la liquidación para el pago bancario |
| RF-214 | El sistema **debe** registrar autor y fecha en toda acción sensible |

---

## REQUISITOS NO FUNCIONALES

| # | Requisito |
|---|---|
| RNF-201 | El cierre de ciclo procesa 5,000 socios en menos de 5 minutos |
| RNF-202 | La bandeja de vouchers carga en menos de 2 segundos |
| RNF-203 | Optimizado para escritorio — el admin trabaja en computadora |
| RNF-204 | Ninguna acción destructiva sin confirmación explícita |
| RNF-205 | Lenguaje del negocio, nunca términos de base de datos |

---

## REGLAS DE SEGURIDAD

| # | Regla |
|---|---|
| SEG-11 | Acceso restringido a usuarios con rol administrador |
| SEG-12 | Toda acción financiera queda auditada con autor |
| SEG-13 | El registro de auditoría no se puede editar ni borrar |
| SEG-14 | Cambiar configuración crítica exige confirmación adicional |
| SEG-15 | Sesión con expiración por inactividad |

⏳ *Pendiente: si hay un solo administrador o varios con permisos distintos.*

---

## FUERA DE ALCANCE

- Facturación electrónica e integración con SUNAT
- Control de inventario y stock
- Pago automático a socios — la exportación es para pago manual
- Notificaciones automáticas *(no cotizado)*
- Aplicación móvil de administración

---

## PENDIENTES DE DEFINICIÓN

| # | Qué falta | Bloquea |
|---|---|---|
| C-01 | Día de cierre y día de pago | Cierre de ciclo |
| C-02 | Cuentas bancarias de la empresa | Configuración |
| C-03 | Cuántos administradores y con qué permisos | Seguridad |
| C-04 | Si el sistema gestiona retiros | Gestión de pagos |
| C-05 | Monto mínimo de retiro | Gestión de pagos |
| C-06 | Rangos 9 al 16 | Configuración de rangos |
| C-07 | Qué pasa con el downline si un socio se da de baja | Ficha del socio |
| C-08 | Si se permite cambiar de patrocinador | Ficha del socio |

---

## DEPENDENCIAS

| Depende de | Para qué |
|---|---|
| `004-motor-comisiones` | Todo el cierre de ciclo y la aprobación de vouchers |
| `002-backoffice-socio` | Comparte el árbol y las vistas de red |
| `06-MARCA` | Identidad visual — **ya disponible** |
