# SEGUIR AQUÍ · DOCUMENTO HISTÓRICO

**Congelado el 4 de septiembre de 2026. No se actualiza más.**

> ## 🔴 PARA RETOMAR, NO EMPIECES POR AQUÍ
>
> ```
>    00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO.md
> ```
>
> Este documento describe dónde estaba el proyecto el 4 de septiembre. Desde
> entonces se ejecutaron las tareas 14 a 42, se creó producción y se conectó el
> dominio. Lo que dice aquí sobre "qué sigue" ya no aplica.

**Dónde estaba el trabajo el 4 de septiembre de 2026.**

---

# DÓNDE ESTAMOS

```
   LANDING     publicada en max-global-landing.vercel.app
               el dominio se conecta el día del pago del 50%

   SISTEMA     21 pantallas · 278 pruebas en verde
               los 3 bonos de la v1 certificados EN VIVO
               retiros funcionando · la billetera se descuenta
               venta a cliente final · baja de socio con reenganche
```

> ## ✅ EL BLOQUE DE FUNCIONALIDADES COMPROMETIDAS ESTÁ CERRADO
>
> ```
>    A1  bono de rango conectado    ✅   A2  foto del voucher       ✅
>    A3  retiros completos          ✅   A4  detracción (mecanismo) ✅
>    A5  baja con reenganche        ✅   A6  venta a cliente final  ✅
>    B   los 5 errores de pantalla  ✅   + el guardián de campos
> ```
>
> **Las seis se certificaron operando el sistema a mano y verificando contra
> Postgres, no leyendo reportes.** Detalle día por día en la BITÁCORA.

**Ya no falta ninguna funcionalidad. Lo que queda son 5 mejoras.**

---

# LO QUE FALTA, EN ORDEN

## 1 · Venta a cliente final — TAREA-16 ESCRITA, LISTA

```
   Qué es      poder registrar la venta a alguien que NO es socio,
               a precio público
   Por qué     la landing ya vende al público. Hoy Máximo recibe
               esos pedidos por WhatsApp y no tiene dónde meterlos.
               Es la venta de más margen: S/. 132.54 contra S/. 57.54
   Tamaño      MUY chico — una casilla y una columna
   Mandarle    SISTEMA MOTOR Y BACKOFFICE/00-INSTRUCCIONES/
               TAREA-16-VENTA-A-CLIENTE-FINAL.md
```

**Cómo quedó, tras simplificarlo el 4/09:**

```
   Ya funciona    el admin elige el socio de la orden
                  (el que refirió, o MG00001 si no hay)
   Ya funciona    los datos del cliente van en el ENVÍO, que ya
                  tiene destinatario, teléfono y dirección
   Ya funciona    los puntos y el residual, como una recompra normal

   Se construye   UNA casilla: "precio público" → descuento 0%
   Se agrega      UNA columna: orden.tipo_venta
```

> 🔴 **Por qué hace falta la casilla:** todos los packs dan 40-50% de descuento
> en recompras. Sin ella, el sistema guarda **S/. 75 cuando el cliente pagó
> S/. 150**, el voucher no cuadra con la orden, y la contabilidad no cuadra con
> el banco.

## 2 · Baja de socio con reenganche — falta escribir la tarea

```
   Qué es      cuando un socio se retira, su equipo se engancha
               a su patrocinador
   Por qué     la gente se retira. Si el sistema no sabe qué hacer
               con su equipo, la red se corrompe y las comisiones
               empiezan a fallar EN SILENCIO
   Tamaño      el más grande y el más delicado de todo lo que queda
   🔴 VA SOLA  toca red_ancestro, que es de lo que depende el
               residual de 10 niveles. No se mezcla con nada
   Antes de    hacer un recorrido manual como el del 4/09:
   ejecutar    dar de baja a un socio de prueba y verificar contra
               Postgres que su equipo quedó bien colgado
```

## 3 y 4 · Campo de CCI y validación bancaria ✅ HECHO · TAREA-18 · 4/09

```
   ✅  socio.cci — 20 dígitos exactos, validación estricta
   ✅  Los guiones se limpian antes de guardar
       "011-366-000100032542-21" → "01136600010003254221"
   ✅  Número de cuenta: validación suave (sin letras, 8 a 25)
   ✅  Aviso si el CCI no coincide con el banco — AVISO, no bloqueo
       Los códigos van en config.codigos_banco_cci, no en el código
   ✅  El CSV del banco lleva columna CCI · vacía si no hay,
       nunca "NO REGISTRADO"
```

**El CCI peruano son 20 dígitos: entidad(3) + oficina(3) + cuenta(12) +
control(2).** Dato verificado el 4/09, no hace falta buscarlo otra vez.

## 5 · La tabla `auditoria` está vacía

```
   Qué es      registrar quién hizo qué y cuándo
   Por qué     SELECT COUNT(*) FROM auditoria → 0
               Existe la tabla, existe la pantalla P-29, y nadie
               escribe una fila. Hoy no se sabe quién confirmó un
               pago, quién cerró un ciclo ni quién cambió un
               porcentaje del plan
   Mínimo      confirmar pago · rechazar pago · cerrar ciclo ·
               cambiar config · dar de baja · aprobar retiro
   Tamaño      mediano
```

## 6 · Base de datos limpia para producción

```
   Qué es      un proyecto Supabase NUEVO con las mismas migraciones
   Por qué     la base actual tiene 505 socios simulados y
               S/. 101,911.02 en comisiones de mentira. Perfecta
               para demostrarle el sistema a Máximo, inservible
               para arrancar de verdad
   🔴 NO se    comision y wallet_movimiento son append-only por
   borra la    diseño. Se levanta otro proyecto y se cambian dos
   actual      variables de entorno
   Cuándo      justo antes de que entre el primer socio real
```

## 7 · Code splitting

```
   Qué es      partir el bundle, que ya va en 818 kB
   Cuándo      antes de que haya 50 socios reales. No corre prisa
```

## 8 · Detracción — el mecanismo ya está, falta el número

```
   Ya está construido. config.pct_detraccion = null.
   Si un retiro supera S/. 700 avisa que corresponde detracción
   y NO inventa el neto.
   Cuando el contador de Máximo dé el porcentaje, se pone en P-26.
   Cero código.
```

---

# LO ÚNICO QUE DEPENDE DE OTRA PERSONA

```
   El porcentaje de la detracción  →  el contador de Máximo
```

Nada más. Todo lo demás son decisiones tuyas o trabajo de Antigravity.

---

# CÓMO VERIFICAR CUALQUIER REPORTE DE ANTIGRAVITY

**Estas cifras no pueden cambiar.** Si alguna se mueve después de una tarea,
algo se rompió:

```sql
SELECT
 (SELECT COUNT(*) FROM socio)                                   -- 508
,(SELECT COUNT(*) FROM orden)                                   -- 1058
,(SELECT COUNT(*) FROM comision)                                -- 2422
,(SELECT SUM(monto_cent) FROM comision)                         -- 10191102
,(SELECT COUNT(*) FROM comision WHERE tipo='rango')             -- 44
,(SELECT COUNT(*) FROM rango_ciclo)                             -- 2008
,(SELECT COUNT(*) FROM red_ancestro)                            -- 3960
,(SELECT COUNT(*) FROM ciclo WHERE estado='abierto')            -- 1
,(SELECT COUNT(*) FROM wallet_movimiento)                       -- 471
,(SELECT saldo_cent FROM v_wallet_saldo WHERE socio_id=12);     -- 179000
```

**Y la consulta que certifica que la red no está rota** — recorre las 3,960
filas, no solo la parte que se tocó:

```sql
SELECT COUNT(*) FROM red_ancestro ra
JOIN socio s ON s.id = ra.descendiente_id
WHERE ra.nivel > 1
  AND NOT EXISTS (SELECT 1 FROM red_ancestro r2
    WHERE r2.descendiente_id = s.patrocinador_id
      AND r2.ancestro_id = ra.ancestro_id
      AND r2.nivel = ra.nivel - 1);
-- debe devolver 0 SIEMPRE
```

> 🔴 **Si esa consulta devuelve algo distinto de 0, el residual de 10 niveles
> está pagando mal y Postgres no va a dar ningún error.** Córrela después de
> cualquier tarea que toque la red.

**Los tres números que delatan si el motor cambió:**

```
   PATROCINIO   Pack Gold S/. 1,200 × 20% nivel 1  =  S/. 240.00
   RANGO        Jade, con 500 puntos computables    =  S/.  50.00
   TOPE LÍNEA   2 ramas de 400 pts, tope 50% de 500 =  250+250 = 500
```

El del tope es el más fácil de romper sin darse cuenta. **Si dos ramas de 400
suman 800 en vez de 500, alguien quitó el límite de línea estirada y todos los
rangos se van a pagar de más.**

---

# LO QUE SIEMPRE HAY QUE EXIGIRLE EN EL REPORTE

```
   1 · git status --short vacío, pegado literal
   2 · La salida literal de cada consulta de verificación,
       con las filas — no un "verificado ✅"
   3 · Las capturas como IMÁGENES, no como pies de foto
   4 · Que la consulta se corra sobre lo que la tarea pidió,
       no sobre algo parecido
```

**Lo de la consulta parecida ya pasó:** en la TAREA-12 verificó el ciclo 3
—cerrado días antes— en vez del que había cerrado su propio código. Su reporte
decía "certificado" y no probaba nada.

---

# LOS DOCUMENTOS QUE MANDAN

```
   05-CONTROL/PLAN-DE-CIERRE-V1.md    el inventario completo, con la
                                       línea del documento donde se
                                       comprometió cada cosa

   05-CONTROL/BITACORA.md             qué pasó cada día y por qué

   GUIA-CLAUDE/07-REGLAS-TRABAJO.md   cómo trabajar con Antigravity
                                       y los errores ya cometidos

   GUIA-CLAUDE/00-INICIO-RAPIDO.md    el contexto técnico en 5 minutos
```
