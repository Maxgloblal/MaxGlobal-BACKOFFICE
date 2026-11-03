# ALCANCE Y CRONOGRAMA

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Fuente:** `propuesta-max-global-v2.pdf`

---

## 1. CONDICIONES ECONÓMICAS ACORDADAS

| Concepto | Detalle |
|---|---|
| **Inversión total** | S/. 4,000.00 PEN |
| **Modalidad** | Sistema propio — entrega total del código fuente |
| **Pago 1** | 50% adelanto (S/. 2,000) para iniciar Fase 1 |
| **Pago 2** | 50% final (S/. 2,000) contra entrega en producción |
| **Plazo** | 4 semanas |
| **Soporte incluido** | 30 días de estabilización tras la liquidación |

**Garantía comprometida en la propuesta:**
> *"Se garantiza la entrega de un sistema libre de fallas matemáticas de
> cálculo. El código del motor multinivel se entregará documentado línea por
> línea."*

---

## 2. QUÉ INCLUYE ✅

### Sitio público
- Diseño web moderno y adaptable a móviles
- Catálogo de productos con precios y equivalencias en puntos
- Formulario de registro que vincula al nuevo afiliado con su patrocinador

### Oficina virtual del socio
- Login privado
- Aplicación automática de descuentos en recompras
- Contómetros de puntos personales y grupales
- Árbol genealógico interactivo
- Estado activo/inactivo de la red
- Módulo de carga de vouchers
- Historial de comisiones y billetera

### Panel de administración
- Bandeja de aprobación de vouchers
- Gestión de productos y packs
- Cierre de ciclo mensual y liquidación
- Reportes de red
- Configuración de porcentajes y rangos

### Motor de comisiones
- Bono de Patrocinio (7 niveles)
- Bono Residual (10 niveles)
- Bono de Rango con regla de línea estirada
- Bono Global semestral

### Entrega
- Código fuente completo y documentado
- Base de datos SQL limpia
- Scripts de despliegue
- Todo registrado a nombre de Max Global Corporation
- Una semana de pruebas de estrés y auditoría de cálculo

---

## 3. QUÉ **NO** INCLUYE ⚠️

> **Esta lista debe quedar acordada por escrito con Max Global antes de
> iniciar.** Todo lo de aquí es alcance adicional y se cotiza aparte.

| Fuera de alcance | Comentario |
|---|---|
| Hosting, dominio y correos corporativos | Los contrata el cliente a su nombre |
| Mantenimiento después de los 30 días | Se cotiza como servicio mensual |
| Facturación electrónica / integración SUNAT | Módulo complejo, proyecto aparte |
| Control de inventario y stock | No estaba en la propuesta |
| Aplicación móvil de tienda | El sistema es web adaptable, no app nativa |
| Pasarela de pago automática | El flujo acordado es voucher manual |
| **Bono Cumpleaños** | 🆕 Apareció en el deck, no estaba cotizado |
| **Bono Viajes** | 🆕 Apareció en el deck, no estaba cotizado |
| **Rangos 9 al 16** | 🆕 8 rangos adicionales no cotizados |

### 🔴 Sobre los tres últimos

La propuesta original contemplaba Bono de Patrocinio, Bono Residual, Aguinaldo
y rangos hasta Doble Diamante. El deck comercial reveló **3 bonos y 8 rangos
adicionales** que no estaban en ningún documento previo.

**Recomendación:** plantearlo con naturalidad y por adelantado, no al final:

> *"Máximo, en el deck vi el Bono Cumpleaños, el Bono Viajes y 8 rangos nuevos
> que no estaban en los documentos iniciales. Los podemos incluir sin problema
> — solo definamos si entran en esta primera versión o en una segunda etapa,
> para organizar bien el tiempo."*

---

## 4. CRONOGRAMA

### 4.1 Cronograma cotizado (el que ve el cliente)

| Fase | Entregable | Semana | Pago |
|---|---|---|---|
| 1 | Imagen de marca, catálogo y registro | 1 | 50% adelanto |
| 2 | Oficina virtual y carga de vouchers | 2 | — |
| 3 | Motor de comisiones, rangos y árbol de red | 3 | — |
| 4 | Control de calidad, pruebas de estrés y despliegue | 4 | 50% saldo |

### 4.2 Orden real de construcción (interno)

El cronograma cotizado deja el motor de comisiones para la semana 3, con solo
una semana de colchón. **Eso es riesgo alto:** el motor es lo único
irreversible del proyecto.

**Reordenamiento interno — mismo plazo, mismas entregas visibles:**

```
Semana 1   R1 Modelo de datos  +  R2 Motor (arranca)   +  R4 Landing
           ↑ interno, invisible al cliente                ↑ entregable visible

Semana 2   R2 Motor (tests)  +  R3 API  +  R5 Backoffice
                                            ↑ entregable visible

Semana 3   R6 Panel admin + árbol + conexión al motor
           ↑ entregable visible

Semana 4   R7 Simulación masiva, depuración y despliegue
           ↑ entregable visible
```

El cliente ve exactamente el mismo cronograma. Internamente, el riesgo se
invierte: lo irreversible se construye y se prueba primero.

**Regla de secuencia:** el motor de comisiones se construye y se prueba **antes**
que cualquier pantalla que dependa de él. Una interfaz fea se corrige; una
comisión mal pagada no se recupera.

---

## 5. RUTA CRÍTICA

```
Respuestas del cliente  →  Modelo de datos  →  Motor de comisiones
        (bloqueante)                                   ↓
                                            API  →  Pantallas  →  QA
```

**Mientras el cliente no responda**, se puede avanzar en:
- R9 · Diseño de marca *(no depende de nadie)*
- R4 · Landing y catálogo *(no depende de la matemática)*

---

## 6. RIESGOS DE PLAZO

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El cliente demora en responder el formulario | Alta | Avanzar en diseño y landing mientras tanto |
| Aparecen más reglas no documentadas | Media | Toda regla nueva = alcance adicional por escrito |
| El Pack Familiar dinámico toma más de lo previsto | Media | Evaluar dejarlo para la v2 |
| La red madura revela errores de cálculo | Baja | R7 (simulador masivo) es obligatorio, no opcional |

📌 *Espacio reservado para las fechas reales de inicio y entrega, cuando se
confirme el arranque.*
