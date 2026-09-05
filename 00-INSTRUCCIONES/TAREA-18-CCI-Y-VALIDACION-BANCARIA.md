# TAREA-18 · CAMPO CCI Y VALIDACIÓN DE CUENTAS BANCARIAS

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Puntos C1 y C2 del `05-CONTROL/PLAN-DE-CIERRE-V1.md`.**

> **Los dos van juntos porque son el mismo problema:** que la comisión de un
> socio llegue a la cuenta correcta.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, siempre:

```bash
git status --short
node -e "const fs=require('fs'),p=require('path');(function w(d){for(const f of fs.readdirSync(d)){const q=p.join(d,f);if(fs.statSync(q).isDirectory())w(q);else{const b=fs.readFileSync(q);if(b.includes(0))console.log('NULL:',q)}}})('src')"
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**
**Commit después de CADA bloque.**

---

# EL PROBLEMA

```
   Max Global cobra en BCP y BBVA.
   Un socio tiene Scotiabank.

   Para transferirle de un banco a otro NO basta su número de cuenta:
   hace falta el CCI.
```

Hoy la tabla `socio` solo tiene `banco` y `cuenta_bancaria`. **Un campo para dos
cosas distintas.** El socio no sabe cuál poner y Máximo no sabe cuál recibió.

Y nadie valida nada: si el socio escribe un dígito de más, la transferencia
rebota — o peor, **cae en la cuenta de otra persona**.

---

# EL DATO VERIFICADO — no lo averigües otra vez

**El CCI peruano tiene exactamente 20 dígitos.** Consultado el 4/09/2026.

```
   Estructura:   entidad (3) + oficina (3) + cuenta (12) + control (2)
   Ejemplo:      011-366-000100032542-21
```

**El número de cuenta varía por banco** — BCP, BBVA, Interbank y Scotiabank
usan largos distintos. Por eso:

```
   CCI              validación ESTRICTA   → 20 dígitos exactos
   Número de cuenta validación SUAVE      → solo dígitos y guiones
```

> 🔴 **No inventes largos por banco.** Una validación que rechaza cuentas buenas
> es peor que no validar: el socio no puede guardar sus datos y no cobra.

---

# BLOQUE 1 · LA COLUMNA

```sql
   ALTER TABLE socio ADD COLUMN cci varchar;
```

```
   1 · Es NULLABLE. Los 508 socios existentes quedan en null.
       NO se toca ninguno.

   2 · No se borra ni se renombra `cuenta_bancaria`.
       Los dos campos conviven: uno es la cuenta del banco,
       el otro el código interbancario.
```

**Commit.**

---

# BLOQUE 2 · P-18 · EL PERFIL DEL SOCIO

Junto a los campos de banco y cuenta que ya existen:

```
   Banco                  [selector]
   Número de cuenta       [____________]
   CCI (20 dígitos)       [____________]   ← nuevo

   ℹ️  El CCI es obligatorio si tu banco es distinto al de la
      empresa. Lo encuentras en tu app bancaria o en tu estado
      de cuenta.
```

## Las validaciones

```
   CCI
     · si está vacío → se permite guardar (es opcional por ahora)
     · si tiene algo → EXACTAMENTE 20 dígitos, solo números
     · se guardan solo los dígitos: se limpian espacios y guiones
       antes de guardar, para que "011-366-000100032542-21"
       quede como "01136600010003254221"

   Número de cuenta
     · solo dígitos y guiones
     · mínimo 8 caracteres, máximo 25
     · se rechaza si tiene letras
```

## 🔴 El aviso del banco — AVISO, no bloqueo

Los 3 primeros dígitos del CCI identifican al banco. Si el socio elige un banco
en el selector y pega un CCI cuyos primeros 3 dígitos son de otro:

```
   ⚠️  El CCI que ingresaste no parece ser de BBVA.
       Verifica que sea el correcto.
```

**Se muestra el aviso y se permite guardar igual.** La tabla de códigos por
banco va en `config`, no escrita en el código, **porque no la tenemos
verificada al 100% y un código mal puesto no puede impedirle cobrar a nadie**.

Si la clave de config no existe, no se muestra ningún aviso. Nunca bloquea.

**Commit.**

---

# BLOQUE 3 · EL RETIRO Y EL PADRÓN DEL BANCO

## En P-19, al solicitar el retiro

El formulario ya pide banco y cuenta. Ahora:

```
   1 · Se precargan con los datos del perfil del socio
   2 · Se agrega el campo CCI, también precargado
   3 · Si el socio no tiene CCI en su perfil, se le avisa:
       "Sin CCI, el pago puede demorar si tu banco es distinto
        al de la empresa"
```

## En P-25, el archivo para el banco

Hoy el CSV tiene esta cabecera:

```
   Código,Nombre Completo,Documento,Banco,Número de Cuenta,Monto (S/.)
```

Se le agrega el CCI:

```
   Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)
```

```
   Si el socio no tiene CCI → la columna va vacía, NO "NO REGISTRADO"
   Un CSV que va al banco no debe llevar texto en una columna
   numérica: rompe la carga masiva.
```

Y el aviso de socios sin datos que ya existe en P-25 pasa a contar también a los
que no tienen CCI.

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS

```
   1 · Un CCI de 20 dígitos se guarda
   2 · Un CCI de 19 dígitos es rechazado
   3 · Un CCI de 21 dígitos es rechazado
   4 · Un CCI con letras es rechazado
   5 · "011-366-000100032542-21" se guarda como
       "01136600010003254221"   ← se limpian los guiones
   6 · Guardar el perfil SIN CCI funciona (es opcional)
   7 · Una cuenta con letras es rechazada
   8 · Una cuenta de 3 caracteres es rechazada
   9 · El CSV del cierre incluye la columna CCI
  10 · Un socio sin CCI sale con la columna VACÍA, no con texto
  11 · Los 508 socios existentes siguen con cci = null
```

**La 5 es la que importa para el banco:** un CCI con guiones no sirve para una
carga masiva.

**Commit.**

---

# BLOQUE 5 · VERIFICACIÓN

```sql
-- 1 · la columna existe y nadie la tiene llena todavía
SELECT COUNT(*) total,
       COUNT(cci) con_cci,
       COUNT(*) FILTER (WHERE cci IS NULL) sin_cci
FROM socio;
-- total 508 · con_cci solo los de prueba · el resto null

-- 2 · ningún CCI guardado tiene un largo distinto de 20
SELECT COUNT(*) FROM socio
WHERE cci IS NOT NULL AND length(cci) <> 20;
-- debe devolver 0

-- 3 · ningún CCI tiene caracteres que no sean dígitos
SELECT COUNT(*) FROM socio
WHERE cci IS NOT NULL AND cci !~ '^[0-9]{20}$';
-- debe devolver 0
```

## Capturas

```
   1 · P-18 con el campo CCI y el mensaje de error al meter 19 dígitos
   2 · P-18 con el aviso de banco que no coincide (sin bloquear)
   3 · El CSV descargado de P-25 abierto, con la columna CCI
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ socio.cuenta_bancaria — se queda, convive con el CCI
   ❌ Los 508 socios existentes — su cci queda en null
   ❌ src/motor/ — todo
   ❌ Las funciones SQL de comisiones, cierre, retiros y baja
   ❌ La lógica del débito de billetera — cerrada en la TAREA-15
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

```
   socios              508
   órdenes           1,058
   comisiones        2,422   ·   S/. 101,911.02
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet              471   · saldo de Karla S/. 1,790.00
```

**Y la consulta que certifica que la red no está rota:**

```sql
SELECT COUNT(*) FROM red_ancestro ra
JOIN socio s ON s.id = ra.descendiente_id
WHERE ra.nivel > 1
  AND NOT EXISTS (SELECT 1 FROM red_ancestro r2
    WHERE r2.descendiente_id = s.patrocinador_id
      AND r2.ancestro_id = ra.ancestro_id
      AND r2.nivel = ra.nivel - 1);
-- debe devolver 0
```

**Después de esta tarea queda completar la auditoría: hoy solo registra la baja
de socio. Faltan confirmar pago, rechazar pago, cerrar ciclo, cambiar
configuración y aprobar retiro.**
