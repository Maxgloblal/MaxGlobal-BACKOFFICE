# ROLES Y PERMISOS

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

---

## ROLES DE LA VERSIÓN 1

| Rol | Quién es | Dónde vive | ¿Está en la red? |
|---|---|---|---|
| **Visitante** | Cualquiera sin sesión | Landing pública | No |
| **Socio** | Distribuidor afiliado | Subdominio del sistema | **Sí** |
| **Administrador** | Max Global | Subdominio del sistema | **No** |

### ✅ Decisión: la venta se centraliza en el administrador

> **No cualquiera vende.** En la v1 **todas las ventas se registran y se
> confirman desde el panel de administración.** No hay rol asesor operativo.

**Por qué:** es el modelo de control más estricto y el más simple de construir.
Una sola persona con criterio decide qué entra al sistema, y no hay riesgo de
que un operador registre una venta a nombre del socio equivocado.

### 📌 El rol asesor queda preparado, no construido

El campo `rol = 'asesor'` y el campo `orden.asesor_id` **existen desde ya en el
modelo de datos**. Cuando el volumen lo exija, se habilita la interfaz sin
reestructurar nada.

Su especificación está escrita en `07-SPEC-KIT/specs/005-panel-asesor` y queda
como **Fase 2**.

### ⚠️ La contrapartida honesta

Con el administrador registrando **y** confirmando, se pierde la separación de
funciones: es juez y parte.

Con volumen bajo es perfectamente aceptable — de hecho es lo normal al arrancar.
**Conviene revisarlo cuando las ventas crezcan**, y ahí la solución es sumar un
segundo administrador o habilitar el rol asesor, no darle más poder al mismo
usuario.

> **Regla fundamental:** el administrador **no es socio**. No tiene
> patrocinador, no aparece en el árbol genealógico, no genera ni cobra
> comisiones. Es personal de la empresa.

---

## R1 · VISITANTE

Persona que llega por el enlace de un socio y todavía no está afiliada.

### Puede

- Ver la landing, el catálogo y la comparativa de packs
- Ver el plan de compensación explicado
- Armar un carrito
- Enviar su pedido por WhatsApp a Max Global
- Iniciar su registro de afiliación

### No puede

- Ver precios con descuento *(dependen del pack, y todavía no tiene)*
- Ver puntos, red ni comisiones de nadie
- Comprar sin afiliarse

### Dato que arrastra

El código del patrocinador (`?ref=`), que debe sobrevivir toda su navegación
hasta el registro.

---

## R2 · SOCIO

El distribuidor. Es el usuario más numeroso del sistema.

### Puede

| Acción | Detalle |
|---|---|
| Ver su panel | Puntos, activación, billetera, rango |
| Ver **su** red descendente | Hasta 10 niveles hacia abajo |
| Ver sus comisiones | Con el desglose completo de cada una |
| Armar su pedido de recompra | Con el descuento de **su** pack aplicado |
| Enviar el pedido por WhatsApp | A Max Global, con el detalle precargado |
| Ver el estado de sus pedidos | Incluido el seguimiento del envío |
| Compartir su enlace de patrocinio | Con botón de copiar y de WhatsApp |
| Editar su perfil | Datos personales, dirección de envío, banco |
| Solicitar mejora de pack | Genera un pedido de upgrade |

### No puede

| Restricción | Por qué |
|---|---|
| Ver hacia arriba en la red | Solo ve su descendencia, nunca su upline completo |
| Ver comisiones de otros | Ni de su propia red |
| Ver datos bancarios ajenos | Nunca |
| Registrar su propio pago | Lo hace el administrador |
| Subir vouchers | Se eliminó del sistema |
| Confirmar pagos | Solo el administrador |
| Modificar sus puntos o rango | Los calcula el motor |

### Restricción especial del Kit Emprendedor

Solo puede patrocinar a otros Kit Emprendedor. El sistema lo bloquea y se lo
advierte en su pantalla de enlace.

---

## R3 · ASESOR — 📌 FASE 2, no se construye en la v1

> **En la versión 1 este rol no existe.** Todo lo que sigue lo hace el
> administrador. Se documenta acá para cuando el volumen justifique separarlo.

Personal de Max Global que toma pedidos por WhatsApp y los registra.

### Puede

| Acción | Detalle |
|---|---|
| Buscar socios | Por código, nombre o documento |
| Registrar un pedido | A nombre de un socio, con confirmación visual obligatoria |
| Registrar una afiliación nueva | Crear el socio y su primer pedido |
| Adjuntar el comprobante | Foto, banco, monto, fecha |
| Registrar el envío | Dirección, agencia, costo |
| Ver sus propias ventas | Solo las que él registró |
| Corregir un pedido | **Solo** mientras esté POR CONFIRMAR |

### No puede

| Restricción | Por qué |
|---|---|
| **Confirmar pagos** | Separación de funciones: quien toma el pedido no aprueba el dinero |
| Ver el árbol de red | No lo necesita para su trabajo |
| Ver comisiones de nadie | No es su función |
| Ver la configuración del plan | Solo el administrador |
| Editar pedidos ya confirmados | Se vuelven inmutables |
| Ver ventas de otros asesores | Solo las suyas |

### 🔴 Responsabilidad crítica — aplica al administrador en la v1

Quien registra escribe **a nombre de quién** va cada compra. Ese código decide quién
recibe los puntos y quién cobra las comisiones de toda la línea.

**Mitigación obligatoria del sistema:** al escribir el código debe mostrarse la
ficha del socio (nombre, pack, estado, patrocinador) y exigir confirmación
visual. Sin eso, no se puede guardar.

---

## R4 · ADMINISTRADOR

Max Global. Es el rol de mayor poder y mayor riesgo.

### Puede

| Acción | Detalle |
|---|---|
| **Confirmar pagos** | 🔥 Es el único evento que genera comisiones |
| Rechazar pagos | Con motivo obligatorio |
| Cerrar el ciclo mensual | Con vista previa antes de ejecutar |
| Generar la liquidación | Exportable para el pago bancario |
| Configurar todo el plan | Porcentajes, precios, packs, rangos, umbrales |
| Gestionar socios | Suspender, reactivar, editar, cambiar pack |
| Registrar pedidos y afiliaciones | 📌 En la v1 lo hace él, no un asesor |
| Adjuntar comprobantes | 📌 En la v1 lo hace él |
| Ver toda la red | El árbol completo desde cualquier punto |
| Ver todos los reportes | Ventas, comisiones, rangos, crecimiento |
| Marcar envíos | Despachado, con número de guía |
| Ver la auditoría | Registro completo de acciones |

### No puede

| Restricción | Por qué |
|---|---|
| Modificar un ciclo cerrado | Bloqueado a nivel de base de datos |
| Editar o borrar comisiones | Solo asientos inversos |
| Borrar registros de auditoría | Nunca |
| Alterar cálculos históricos | Un cambio de configuración no toca ciclos cerrados |

---

## MATRIZ DE PERMISOS

*Columna asesor marcada como 📌 = Fase 2, no aplica en la v1.*

| Acción | Visitante | Socio | Asesor 📌 | Admin |
|---|:---:|:---:|:---:|:---:|
| Ver catálogo público | ✅ | ✅ | ✅ | ✅ |
| Ver precios con descuento | ❌ | ✅ propio | ✅ del socio | ✅ |
| Registrarse | ✅ | — | — | — |
| Ver su propio panel | ❌ | ✅ | ✅ | ✅ |
| Ver su red descendente | ❌ | ✅ | ❌ | ✅ toda |
| Ver comisiones propias | ❌ | ✅ | ❌ | ✅ todas |
| Armar carrito | ✅ | ✅ | ✅ | ✅ |
| Registrar pedido en el sistema | ❌ | ❌ | ✅ | ✅ |
| Adjuntar comprobante | ❌ | ❌ | ✅ | ✅ |
| **Confirmar pago** | ❌ | ❌ | ❌ | ✅ |
| Rechazar pago | ❌ | ❌ | ❌ | ✅ |
| Registrar envío | ❌ | ❌ | ✅ | ✅ |
| Marcar como despachado | ❌ | ❌ | ❌ | ✅ |
| Ver estado de su envío | ❌ | ✅ | ✅ propio | ✅ |
| Cerrar ciclo | ❌ | ❌ | ❌ | ✅ |
| Configurar el plan | ❌ | ❌ | ❌ | ✅ |
| Gestionar socios | ❌ | ❌ | ❌ | ✅ |
| Gestionar asesores | ❌ | ❌ | ❌ | 📌 Fase 2 |
| Ver auditoría | ❌ | ❌ | ❌ | ✅ |

---

## REGLAS DE SEGURIDAD TRANSVERSALES

| # | Regla |
|---|---|
| SEG-01 | Todo permiso se valida **en el servidor**, nunca solo en la interfaz |
| SEG-02 | Un socio solo accede a datos de su propia descendencia |
| SEG-03 | Los datos bancarios de un socio solo los ve él y el administrador |
| SEG-04 | Toda acción con consecuencia financiera queda auditada con autor y fecha |
| SEG-05 | El registro de auditoría es inmutable |
| SEG-06 | Las sesiones expiran por inactividad |
| SEG-07 | Las contraseñas se guardan con hash, nunca en texto plano |
| SEG-08 | Hay límite de intentos de inicio de sesión |

---

## SEPARACIÓN DE FUNCIONES

El principio que ordena toda la matriz:

```
   Quien TOMA el pedido    ≠    Quien APRUEBA el dinero
        (asesor)                     (administrador)
```

**Por qué importa:** si la misma persona registra la venta y confirma que el
dinero entró, no hay ningún control. Un error o un fraude no tiene quién lo
detecte.

### En la v1 esta separación NO existe

Como el administrador registra y confirma, es juez y parte. **Con volumen bajo
es aceptable y es lo normal al arrancar.**

**Cuándo revisarlo:** cuando el administrador ya no dé abasto, o cuando el
volumen mensual justifique un control cruzado. La solución entonces es habilitar
el rol asesor (`asesor_puede_confirmar_pago = false`) o sumar un segundo
administrador — **nunca** darle más poder al mismo usuario.

El parámetro `asesor_puede_confirmar_pago` ya existe en configuración con valor
`false`.

---

## ⏳ PENDIENTES

> ✅ **Actualizado el 26/08:** las preguntas del formulario ya fueron respondidas.
> Lo que sigue abajo se conserva como registro; ver el estado real en
> `05-CONTROL/PENDIENTES` y `04-CLIENTE/05-ANALISIS-RESPUESTAS-FORMULARIO`.

| # | Qué falta | Impacto |
|---|---|---|
| RP-01 | ¿Cuántos administradores habrá? ¿Todos con los mismos permisos? | Si hay varios, quizá haga falta separar *administrador* de *superadministrador* |
| RP-02 | 📌 Cuántos asesores y quiénes son | Fase 2 |
| RP-03 | 📌 Si un asesor puede además ser socio | Fase 2 |
| RP-04 | 📌 Si el asesor cobra comisión por vender | Fase 2 — sería un sexto bono |

> Los tres quedan **congelados** mientras el rol asesor no se construya. Ya no
> bloquean el motor de comisiones.
