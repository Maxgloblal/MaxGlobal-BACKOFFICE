# INFORME GENERAL DEL PROYECTO

**Sistema Max Global Corporation**
**Para:** Jack · **Fecha:** 25 de agosto de 2026

> Este es el documento para leer cuando vuelvas después de días sin tocar el
> proyecto. En 10 minutos te pone al día.

---

## 1 · QUÉ TIENES AHORA

**39 documentos** en 9 carpetas · **65,000 palabras** de especificación ·
**36 PDFs** listos para leer o enviar.

| Carpeta | Qué contiene |
|---|---|
| `00-EMPEZAR-AQUI` | Índice, estado, referencia rápida y este informe |
| `01-NEGOCIO` | El plan de compensación completo. **La ley del proyecto** |
| `02-PROYECTO` | Alcance, cronograma y roles de trabajo |
| `03-SISTEMA` | 11 documentos: flujos, roles, estados y 305 requisitos funcionales |
| `04-CLIENTE` | El formulario y todas las respuestas de Máximo con fecha |
| `05-CONTROL` | Bitácora y pendientes. **La memoria del proyecto** |
| `06-MARCA` | Identidad visual completa + prompts para Stitch |
| `07-SPEC-KIT` | Dos proyectos listos para Antigravity |
| `08-LEGAL` | Normativa peruana y 50 requisitos de cumplimiento |

---

## 2 · LO QUE DESCUBRIMOS QUE NO SABÍAMOS

Esto es lo que justifica todo el tiempo invertido. **Ninguno de estos hallazgos
aparece si se pasa directo a programar.**

### 🔴 El error del valor del punto

Los documentos decían que 1 punto vale S/. 4.167. Si se hubiera usado ese valor
para calcular comisiones, **el sistema habría pagado más de lo que factura**:

| Base usada | Café: cliente paga | Se reparte | Queda a la empresa |
|---|---|---|---|
| Puntos × 4.167 | S/. 45.00 | S/. 72.76 | **−S/. 27.76** |
| Puntos × S/. 1 | S/. 45.00 | S/. 17.46 | **+S/. 27.54** |

Máximo lo aclaró con un ejemplo: *"del café de 18 x 40% sería 7.20 soles"*.

**Y lo peor:** el error no se nota los primeros meses. Con la red nueva casi
nadie tiene 10 niveles llenos. Aparece cuando ya hay miles de socios esperando
cobrar.

### 🔴 El flujo del producto no existía

Se había mapeado el flujo del dinero y el de los puntos, pero nadie había
preguntado **dónde recibe el cliente su café**. El sistema podía cobrar y pagar
comisiones por un producto que nadie sabía cómo entregar.

Resultó ser 100% envío por courier. Si hubieran sido locales por ciudad, habría
hecho falta control de inventario — que está **fuera de alcance** en tu
cotización. Habría sido una contradicción descubierta en la semana 3.

### 🟡 El Pack VIP no existe

Aparecía en dos láminas del deck con residual de 10 niveles. Máximo lo eliminó:
manejo interno con contratos aparte. **Un módulo menos.**

### 🟡 El nivel 8 que parece un error

El residual sube en el nivel 8 (N7 paga 1%, N8 paga 10%). Parece error de
tipeo. **Es deliberado:** solo los packs Gold llegan a 10 niveles, así que el
salto premia el plan alto.

Está escrito como prohibición explícita en ambos `CLAUDE.md` porque cualquier
programador o IA que lo vea va a querer arreglarlo.

### 🔴 Dos leyes nuevas que obligan

| Norma | Desde | Sanción |
|---|---|---|
| Libro de Reclamaciones virtual (Ley 32495) | nov 2025 | 1 a 10 UIT |
| Nuevo reglamento de datos personales | mar 2025 | hasta 100 UIT |

**Ninguna estaba en la cotización.** Son ~50 requisitos nuevos.

### 🟡 Alcance no cotizado en el deck comercial

El deck reveló 3 bonos y 8 rangos que no estaban en los documentos originales:
Bono Cumpleaños, Bono Viajes y los rangos 9 al 16.

---

## 3 · CÓMO ESTÁ EL PROYECTO

| Área | Estado |
|---|---|
| Plan de compensación | 🟢 **90% cerrado** |
| Modelo de datos | 🟢 **Listo** |
| Requisitos funcionales | 🟢 **284 escritos, 280 programables** |
| Marca | 🟢 **Completa**, entregada por el cliente |
| Documentación Spec Kit | 🟢 **Lista** para Antigravity |
| Cumplimiento legal | 🟡 **Documentado**, falta acordar alcance |
| Programación | ⚪ **No iniciada** |

**El 90% de los requisitos se puede programar hoy.** Los 27 bloqueados son
valores de configuración, no lógica.

---

## 4 · QUÉ FALTA Y DE QUIÉN DEPENDE

### De Máximo — quedan 2 respuestas

**El 25 de agosto se cerraron 3 de las 5 que bloqueaban el motor.**

| # | Pregunta | Estado |
|---|---|---|
| 1 | ~~Tabla de descuentos~~ | ✅ **Resuelto.** Son dos descuentos: pack y recompra |
| 2 | ~~¿El café da 18 puntos siempre?~~ | ✅ **Sí.** Los puntos son fijos por producto |
| 3 | ~~Jade: frontales~~ · ~~Platino: monto~~ | ✅ **Decididos por criterio** — el deck es la fuente más reciente |
| 4 | **Rango: ¿mensual o acumulado?** | 🔴 En la propuesta, Parte 4b |
| 5 | **Puntaje del Kit Emprendedor** | 🔴 Última del motor |

> **Los dos que quedan van en un solo mensaje.** Con eso arranca el motor de
> comisiones completo.

### De Máximo — datos administrativos

Razón social · RUC · domicilio fiscal · correo y teléfono oficial · cuentas
bancarias · textos de misión y visión.

### De ti — dos decisiones comerciales

| # | Decisión |
|---|---|
| 1 | Cómo plantear el alcance no cotizado (legal + bonos del deck) |
| 2 | Si el Bono Cumpleaños, el Bono Viajes y los rangos 9–16 van en v1 o v2 |

### De un abogado

Los **términos de afiliación**. Definen la relación con cientos de personas y
contienen la cláusula que evita el riesgo laboral. Los borradores están hechos
para que no parta de cero.

---

## 5 · POR DÓNDE SEGUIR

### Ahora mismo, sin esperar a nadie

```
1. Mandarle a Máximo la línea de alcance (`02-PROYECTO/03-LINEA-DE-ALCANCE-V1`)
2. Preparar los recursos de marca:  .ttf → .woff2 · .ai → SVG · favicon
   (unos 35 minutos)
3. Arrancar el PROYECTO-1-LANDING con Antigravity
```

**La landing no depende de ninguna respuesta pendiente.** Se construye con
valores de ejemplo y se reemplazan después.

### Después

```
4. Cargar los datos administrativos cuando lleguen (cuenta bancaria, RUC)
5. Arrancar el PROYECTO-2-SISTEMA
6. Primero el motor de comisiones, con sus tests
7. Después el panel admin
8. Después el backoffice del socio
```

> **No empieces por las pantallas del sistema.** El motor es lo único
> irreversible: una interfaz fea se corrige, una comisión mal pagada no se
> recupera.

---

## 6 · LOS RIESGOS QUE DEBES VIGILAR

### 🔴 Riesgo técnico — la doble confirmación

Si el administrador hace doble clic en *"confirmar pago"*, se generarían las
comisiones de toda una línea **dos veces**.

No se resuelve deshabilitando el botón. Se resuelve en la base de datos con un
índice único y un `UPDATE ... RETURNING` condicionado. Está documentado.

### 🔴 Riesgo comercial — el precio

**S/. 4,000 por un sistema MLM completo con motor de comisiones está muy por
debajo del mercado.** Es defendible como caso de portafolio, pero:

- Todo cambio de reglas después de firmado se cotiza aparte
- El alcance legal no estaba contemplado
- Los 3 bonos y 8 rangos del deck tampoco

**Tu blindaje:** el documento de respuestas confirmadas, con fecha y cita
textual de cada regla. Todo lo que no esté ahí es cambio de alcance, no ajuste.

### 🟡 Riesgo de plazo

4 semanas es ajustado. **Lo que juega a favor:** se eliminó el rol asesor, se
eliminó la carga de vouchers y no hay control de inventario. **Lo que juega en
contra:** los ~50 requisitos legales.

### 🟡 Riesgo del negocio de Máximo

En Perú no hay ley específica de multinivel. El criterio que separa venta
directa de esquema piramidal es que **los ingresos vengan de venta real de
producto, no del reclutamiento**.

Tres de los cuatro bonos se pagan sobre producto. El Bono de Patrocinio se paga
al afiliarse — lo que lo salva es que los packs contienen producto físico.

**Esto no es tu responsabilidad legal, pero conviene que Máximo lo sepa.** Ya
está documentado y el sistema puede demostrar la proporción.

---

## 7 · CÓMO USAR TODO ESTO

### Si vuelves después de días

```
1. 00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO
2. 05-CONTROL/PENDIENTES
3. 05-CONTROL/BITACORA  (las últimas entradas)
```

### Para dudas rápidas

`00-EMPEZAR-AQUI/02-REFERENCIA-RAPIDA` — todo lo confirmado en una hoja.
Ábrelo tú directamente, es más rápido que preguntar.

### Para construir

```
07-SPEC-KIT/PROYECTO-1-LANDING/     → la landing
07-SPEC-KIT/PROYECTO-2-SISTEMA/     → el sistema
```

Cada uno con su `CLAUDE.md` autocontenido. Copias la carpeta, corres
`specify init`, y Antigravity tiene todo lo que necesita.

### Cuando llegue una respuesta de Máximo

```
1. Anótala en 04-CLIENTE/02-RESPUESTAS-CONFIRMADAS  (con fecha y cita)
2. Márcala resuelta en 05-CONTROL/PENDIENTES
3. Agrega la entrada en 05-CONTROL/BITACORA
4. Actualiza el documento de negocio que corresponda
5. Regenera los PDFs
```

**Ese orden importa.** La cita textual es tu respaldo si algún día hay
discrepancia sobre cómo calcula el sistema.

---

## 8 · LO QUE REALMENTE LOGRASTE HOY

No fue documentación. Fue **encontrar los errores antes de que costaran dinero**.

| Hallazgo | Lo que habría costado descubrirlo tarde |
|---|---|
| Error del valor del punto | Pagar el doble de lo facturado, con la red ya cargada |
| Flujo de producto faltante | Rediseñar en semana 3, o descubrir que falta inventario |
| Pack VIP inexistente | Construir un módulo que nadie iba a usar |
| Nivel 8 "corregido" | Romper el incentivo comercial del plan |
| Leyes nuevas | Multa de hasta 100 UIT y un módulo completo sin cotizar |

**Y quedó algo reutilizable:** el método. La próxima vez que llegue un cliente
con reglas de negocio densas, ya sabes que primero se mapean los tres flujos —
dinero, producto e información — después los roles, después los estados, y
recién ahí los requisitos.

Eso vale más que la documentación de este proyecto.

---

## RESUMEN EN UNA LÍNEA

> **El proyecto está listo para construirse.** Falta que Máximo responda 5
> preguntas para el motor, y que decidas cómo plantear el alcance legal.
> La landing puedes empezarla hoy.
