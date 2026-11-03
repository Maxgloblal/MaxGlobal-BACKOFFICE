# CONFIGURACIÓN — valores por completar

> **Nada de este archivo bloquea el desarrollo.**
>
> Se construye todo con estos marcadores y se reemplazan el día antes de salir
> a producción. No cambian una sola línea de lógica.

---

## Datos de la empresa

```env
VITE_RAZON_SOCIAL="[POR COMPLETAR]"
VITE_RUC="[POR COMPLETAR]"
VITE_DOMICILIO_FISCAL="[POR COMPLETAR]"
VITE_CORREO_CONTACTO="[POR COMPLETAR]"
VITE_WHATSAPP="51900000000"
```

## Cuentas bancarias

```json
[
  { "banco": "[POR COMPLETAR]", "cuenta": "000-0000000-0-00",
    "cci": "00000000000000000000", "titular": "[POR COMPLETAR]" }
]
```

## Textos institucionales

```
MISION:   [POR COMPLETAR]
VISION:   [POR COMPLETAR]
VALORES:  [POR COMPLETAR]
```

## Reglas del plan — se cargan cuando Máximo responda el formulario

```json
{
  "descuentos": { "emprendedor": 40, "ejecutivo": null, "gold": null,
                  "familiar": 50, "empresarial": null },
  "puntos_kit_emprendedor": null,
  "jade_frontales": null,
  "platino_bono_cent": null
}
```

**Mientras sean `null`, la interfaz muestra "por confirmar" en vez de un número
inventado.** Eso es mejor que una cifra falsa en pantalla.

---

## Decisiones ya tomadas — no preguntar

| Tema | Decisión | Quién decidió |
|---|---|---|
| Agencia de envío | Campo de texto libre. El admin escribe cuál usó | 🔧 técnica |
| Quién paga el envío | Lo escribe el admin al registrar el pedido | ✅ ya resuelto |
| Cliente no socio | **No va en la v1.** El campo `tipo_venta` queda listo para activarlo después | 🔧 técnica |
| Términos de afiliación | Se publica el borrador con aviso de "versión preliminar" hasta que un abogado lo revise | 🔧 técnica |
| Política de devoluciones | Borrador estándar de 7 días, ajustable | 🔧 técnica |

---

## Lo único que hay que pedirle a Máximo antes de lanzar

Cuando la landing ya esté construida y funcionando:

```
Máximo, ya está lista la web. Para publicarla necesito:

· Razón social, RUC y domicilio fiscal
· Correo y teléfono oficial
· Las cuentas bancarias donde depositan los socios
· Misión y visión, si ya las tienen escritas

Es lo último que falta.
```

**Un solo mensaje, al final, cuando ya tenga algo que mostrarle.**
