# MANUAL DE INSTALACIÓN EN PRODUCCIÓN · MAX GLOBAL CORPORATION

Guía oficial paso a paso para levantar la base de datos limpia de Max Global desde cero sobre un proyecto nuevo de Supabase.

---

> [!WARNING]
> **PROYECTO DE ENSAYO vs. PRODUCCIÓN DEFINITIVA:**  
> Cualquier proyecto de prueba creado con nombre `max-global-ENSAYO` es estrictamente **DESECHABLE**. Se utiliza únicamente para validar la instalación limpia y el recorrido de negocio de principio a fin, y debe eliminarse al concluir el ensayo.  
> La base de datos definitiva de **PRODUCCIÓN** se creará por separado, limpia y sin rastros de prueba, el día del arranque oficial con Máximo.

## 1. Crear el Proyecto en Supabase

1. Iniciar sesión en [Supabase Dashboard](https://supabase.com/dashboard).
2. Crear un nuevo proyecto (ej. `max-global-prod`).
3. Asignar una contraseña segura para la base de datos Postgres y seleccionar la región más cercana (ej. `sa-east-1` São Paulo).
4. Esperar a que el estado del proyecto sea `ACTIVE_HEALTHY`.

---

## 2. Ejecutar los 8 Módulos SQL en Orden Estricto

En el dashboard de Supabase, abrir **SQL Editor** y ejecutar los archivos ubicados en `supabase/instalador/` en el siguiente orden:

| Orden | Archivo | Descripción |
|---|---|---|
| **1º** | `00-extensiones.sql` | Habilita extensiones criptográficas (`pgcrypto`, `uuid-ossp`). |
| **2º** | `01-esquema.sql` | Crea las 23 tablas definitivas, llaves foráneas, índices y las 3 vistas con `security_invoker = true`. |
| **3º** | `02-funciones.sql` | Instala las 25 funciones PL/pgSQL consolidadas del sistema. |
| **4º** | `03-triggers.sql` | Instala los 5 triggers de integridad y reglas de negocio. |
| **5º** | `04-rls-y-grants.sql` | Aplica Row Level Security en las 23 tablas, instala las 49 políticas y restringe permisos de `anon` y `authenticated`. |
| **6º** | `05-storage.sql` | Crea los buckets `vouchers` (privado) y `productos` (público) con sus políticas de acceso. |
| **7º** | `06-semilla.sql` | Siembra catálogos maestros (`config`, `pack`, `rango`, `nivel_comision`, `punto_entrega`, `producto` con fotos en null). |
| **8º** | `07-admin.sql` | **Arranque bootstrap directo**: Requiere definir el correo del administrador previamente (`SET app.admin_email = 'correo_real';`). Abre el ciclo del mes actual y crea la cuenta del socio Administrador con contraseña aleatoria. |

> [!NOTE]
> Todos los módulos son 100% idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP POLICY/TRIGGER IF EXISTS`). Correrlos nuevamente no duplicará ni romperá datos.

---

## 3. Guardar la Contraseña del Administrador

Al finalizar la ejecución de `07-admin.sql`, la pestaña de salida (**Messages / Results**) emitirá un aviso `NOTICE`:

```text
==================================================================
  MAX GLOBAL CORPORATION · ARRANQUE EXITOSO DEL SISTEMA
------------------------------------------------------------------
  Ciclo abierto inicial : Año 2026, Mes 9 (ID: 1)
  Usuario Administrador : <CORREO_ADMINISTRADOR>
  Contraseña Temporal   : <CLAVE_GENERADA_12_CARACTERES>
------------------------------------------------------------------
  ⚠️  COPIE Y GUARDE ESTA CONTRASEÑA AHORA.
  Por seguridad, no queda almacenada en texto plano y no se repetirá.
==================================================================
```

> [!IMPORTANT]
> Copie y guarde inmediatamente la contraseña generada en su gestor de credenciales seguro.

---

## 4. Subir las Fotos de Catálogo al Bucket Nuevo

Desde la terminal en el directorio del proyecto, ejecute el script automatizado para subir las 8 imágenes webp al bucket `productos` del nuevo proyecto y actualizar las URLs públicas en la base de datos:

```bash
# Usando Service Role Key (recomendado):
node supabase/instalador/subir-fotos.mjs <NUEVA_SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>

# O usando la contraseña temporal del Admin:
node supabase/instalador/subir-fotos.mjs <NUEVA_SUPABASE_URL> <SUPABASE_ANON_KEY> <CLAVE_ADMIN>
```

Verifique que las 8 fotos reporten estado exitoso y que ninguna URL contenga identificadores de prueba o demo.

---

## 5. Configurar Variables de Entorno en Vercel

Configurar las nuevas credenciales de conexión en los **DOS** despliegues de Vercel:

### A. Backoffice / Motor (`SISTEMA MOTOR Y BACKOFFICE`):
```env
VITE_SUPABASE_URL=https://<NUEVO_PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<NUEVA_ANON_KEY>
```

### B. Landing Page Pública (`SITIO WEB 06 PAGINAS LANDINGS`):
```env
PUBLIC_SUPABASE_URL=https://<NUEVO_PROJECT_REF>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<NUEVA_ANON_KEY>
```

---

## 6. Configurar la URL Oficial de la Landing en Base de Datos

> [!CAUTION]
> **Punto Crítico de Negocio:** Si se olvida este paso, los enlaces de afiliación y referidos compartidos por los socios (`/registro?ref=MG00001`) apuntarán al dominio provisional de Vercel en lugar del dominio de producción.

1. Iniciar sesión como Administrador en el panel backoffice.
2. Ir a la pantalla **P-26 · Configuración Global**.
3. Localizar el parámetro `url_landing`.
4. Cambiar el valor por el dominio público definitivo de Máximo (ej. `https://maxglobalcorporation.com` o `https://www.maxglobal.pe`).
5. Guardar los cambios.

---

## 7. Recorrido de Verificación del Negocio (11 Pasos)

Comprobar el flujo completo en la base de datos limpia:

| Paso | Acción | Resultado Esperado |
|---|---|---|
| **0** | Revisar estado inicial | 1 ciclo abierto, 1 cuenta admin, 0 órdenes, 0 comisiones, 0 movimientos wallet. |
| **a** | Login del Administrador | Ingreso exitoso con el correo del administrador y la clave generada. |
| **b** | Registrar un socio (P-22) | Se genera su código `MG00002` y sus credenciales de acceso temporales. |
| **c** | Login del Socio | El nuevo socio ingresa y el sistema le solicita cambio de contraseña obligatorio (TAREA-25). |
| **d** | Registrar pedido de recompra (P-21) | Pedido creado con productos del catálogo y comprobante voucher adjunto. |
| **e** | Confirmar pago (P-23) | Pago aprobado; los puntos personales se acreditan en su estado de activación. |
| **f** | Afiliar segundo socio (P-22) | Afiliado bajo el patrocinio del socio `MG00002`. |
| **g** | Activar segundo socio | Compra suficiente de puntos; el segundo socio queda `activo`. |
| **h** | Cierre de ciclo (P-25) | El admin ejecuta el cierre mensual sin errores. |
| **i** | Liquidación de comisiones | El patrocinador cobró su comisión de patrocinio/residual en el cierre. |
| **j** | Billetera (P-11 / P-15) | El saldo acreditado aparece en la billetera virtual del patrocinador. |
| **k** | Apertura nuevo ciclo | Se abre automáticamente el ciclo del mes siguiente; queda exactamente UN ciclo abierto. |
| **l** | Fotos de productos | En la tienda pública y pedidos, las fotos se visualizan desde el bucket del proyecto nuevo. |
| **m** | Idempotencia | Re-ejecutar los 8 módulos SQL en la base: 0 errores y 0 filas duplicadas. |
