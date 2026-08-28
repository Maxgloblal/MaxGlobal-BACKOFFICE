# 📋 INFORME TÉCNICO · FASE 2 (ETAPA D) · TAREA 01: ARMAZÓN Y PIEZAS DEL SISTEMA

**Código de Informe:** `INF-2026-08-27-08`  
**Fecha y Hora de Finalización:** 27 de agosto de 2026, 22:10 (GMT-5)  
**Superficie de Trabajo:** `SISTEMA MOTOR Y BACKOFFICE`  
**Responsable Técnico:** Antigravity AI Agent  
**Cliente:** Max Global Corporation S.A (Jack Franklin)  
**Estado:** ✅ Aprobado, Verificado al 100% y con Git Limpio  

---

## 1. Objetivos del Requerimiento

Construir la base arquitectónica, el sistema de diseño, los armazones responsive, las 8 piezas reutilizables en sus 3 estados y las 5 pantallas de referencia para el Backoffice del Socio y Panel de Administración de **Max Global Corporation**, asegurando:
1. **Herencia de Marca sin Inventar:** Colores institucionales (Dorado `#D1AD68`, Verde `#1BA741`, Dorado oscuro `#A8873F`), tipografías oficiales (`Agus Sans` para títulos y `Caviar Dreams` para texto), logos y espaciados de la Fase 1.
2. **Armazón Socio Móvil Primero (390px):** Barra inferior fija con exactamente 4 accesos (`Inicio`, `Tienda`, `Comisiones`, `Mi red`), encabezado con datos del socio y cajón lateral (Drawer) para accesos secundarios.
3. **Armazón Admin Escritorio Primero:** Menú lateral completo con las 10 opciones operativas del negocio, convertible a cajón desplegable en dispositivos móviles/tablets.
4. **Catálogo de 8 Piezas Reutilizables:** Cada pieza implementada con sus tres estados obligatorios: `con datos`, `vacía` y `cargando`.
5. **Catálogo Visual Centralizado:** Página `/kit` para revisar todas las piezas y estados simultáneamente.
6. **5 Pantallas de Referencia con Datos Reales:** P-11 (Panel socio), P-14 (Mis comisiones con versión en cero explicada), P-12 (Mi red con árbol y privacidad Ley 29733), P-23 (Bandeja confirmación admin) y P-25 (Cierre de ciclo admin con vista previa obligatoria) usando los datos del documento `03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE.md`.
7. **Disciplina Estricta de Estilos:** Cero estilos en línea ni colores hardcodeados en las páginas (`grep` de colores/fontSize/padding sale completamente vacío).
8. **Pruebas Automatizadas e Integridad:** 100% de tests Vitest (27/27) y Playwright E2E (6/6) aprobados, cero bytes nulos y commits atómicos por cada bloque.

---

## 2. Acciones y Cambios Técnicos Realizados

### Bloque A · Proyecto, Tokens y Tipografías
* Se configuró el proyecto con `Vite`, `React 19`, `React Router DOM v7`, `Lucide React`, `Vitest` y `Playwright`.
* Se crearon los tokens oficiales en `src/estilos/tokens.css` y `src/estilos/index.css`.
* Se incorporaron las fuentes oficiales WOFF2 (`AgusSans-Regular.woff2`, `CaviarDreams.woff2`, `CaviarDreams_Bold.woff2`, `CaviarDreams_Italic.woff2`, `CaviarDreams_BoldItalic.woff2`) y los logotipos de marca en `public/brand/`.
* Se configuró `.gitignore` para excluir `node_modules`, `dist` y `test-results`.

### Bloque B · Los Dos Armazones
* **`src/armazon/ArmazonSocio.jsx` (Móvil Primero):**
  * Vista Móvil (< 768px): Header superior con botón hamburguesa `☰`, logo horizontal, avatar con iniciales y rango vigente ("Gold"). Barra contextual con código "MG-00417" y ciclo "Agosto 2026". Barra inferior fija con exactamente 4 entradas (`Inicio`, `Tienda`, `Comisiones`, `Mi red`). Cajón lateral (Drawer) para pantallas secundarias (Mi rango, Mis pedidos, Mi billetera, Mi enlace, Mi perfil, Kit UI, Cerrar sesión).
  * Vista Escritorio (≥ 768px): Menú lateral fijo + área de trabajo fluida.
* **`src/armazon/ArmazonAdmin.jsx` (Escritorio Primero):**
  * Sidebar fijo oscuro con las 10 entradas del panel administrativo (Tablero, Registrar pedido, Registrar afiliación, Bandeja de confirmación, Envíos, Cierre de ciclo, Configuración del plan, Gestión de socios, Reportes, Auditoría).
  * Encabezado con usuario "Máximo", badge de estado "Ciclo: Agosto 2026 · Abierto" y botón de cerrar sesión. Drawer colapsable en pantallas < 1024px.

### Bloque C · Las 8 Piezas Reutilizables (3 Estados)
1. `TarjetaDato.jsx`: Métricas con número grande en display, rótulo en mayúsculas, subrótulo contextual, icono y variantes (destacada, verde).
2. `BarraProgreso.jsx`: Barra de avance hacia meta. **Regla de oro cumplida:** acotada matemáticamente al 100% máximo si el valor excede la meta.
3. `Tabla.jsx`: Rejilla con columnas en PC que conmuta a tarjetas apiladas en móvil (< 768px). Si no hay datos, **renderiza `<EstadoVacio>` integrado** en lugar de una tabla desierta.
4. `InsigniaEstado.jsx`: Pastillas de estado accesibles (`por_confirmar`, `confirmado`, `enviado`, `rechazado`, `activo`, `inactivo`).
5. `Formulario.jsx`: Inputs (`CampoTexto`, `CampoSelect`, `CampoTextarea`, `CampoArchivo`, `Boton`) con altura táctil mínima de 44px y apilamiento a 1 columna bajo 768px.
6. `EstadoVacio.jsx`: Icono, título, mensaje explicativo y botón de acción sugerida.
7. `DialogoConfirmar.jsx`: Modal accesible para operaciones irreversibles; no ejecuta la acción hasta recibir confirmación explícita.
8. `NodoArbol.jsx`: Nodo genealógico multinivel expandible/colapsable. **Garantía Ley 29733:** NUNCA expone teléfono, correo ni comisiones ajenas.

### Bloque D · Página `/kit`
* Creada en `src/paginas/Kit.jsx`, accesible en la ruta `/kit`. Muestra las 8 piezas lado a lado en sus 3 estados simultáneos (`[con datos]`, `[vacía]`, `[cargando]`) con modal interactivo de confirmación.

### Bloque E · Las 5 Pantallas de Referencia
* Se crearon los datos falsos representativos en `src/datos-falsos/` (`socioEjemplo.js`, `comisionesEjemplo.js`, `redEjemplo.js`, `adminEjemplo.js`) basados en `03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE.md`.
* **`P11PanelSocio.jsx`:** Tablero de María Torres con alerta de activación de 48/70 pts, progreso interactivo a 72 pts, tarjetas de puntos grupales (1,240), frontales (3/2), billetera (S/. 342.80) y comisiones estimadas (S/. 128.40).
* **`P14MisComisiones.jsx`:** Desglose del ciclo Agosto 2026 (Patrocinio S/. 48 + Residual S/. 80.40 + Rango S/. 100 = S/. 228.40), tabla de residual por niveles y **conmutador obligatorio a versión en cero con explicación de no activación y regla de no compresión**.
* **`P12MiRed.jsx`:** Árbol de 47 socios con estados de activación 🟢/🔴 y protección de privacidad.
* **`P23BandejaConfirmacion.jsx`:** Split-view para admin con visualizador de voucher, comparativa de monto esperado vs declarado y bloque previo de impacto en comisiones antes de confirmar/rechazar con motivo.
* **`P25CierreCiclo.jsx`:** Verificaciones de seguridad previas y **vista previa obligatoria del cierre** (187 cobran, S/. 42,380 a pagar, 12 suben, 4 bajan, 313 inactivos) con `DialogoConfirmar`.

### Bloque F · Pruebas, Verificación e Integridad
* **Verificación de Disciplina:** `grep -rnE "#[0-9a-fA-F]{6}|fontSize:|padding: '" src/paginas/` -> **VACÍO** (0 coincidencias).
* **Verificación de Integridad:** Cero bytes nulos (`\x00`).
* **Compilación de Producción:** `npm run build` exitoso sin errores ni advertencias.
* **Pruebas Unitarias Vitest:** 27 de 27 pasadas.
* **Pruebas E2E Playwright:** 6 de 6 pasadas en viewports de 390px (móvil) y 1280px (escritorio).

---

## 3. Registro de Commits en Git

```
f9823d4 chore: ignorar test-results y playwright-report en git
209c15e bloque f: pruebas unitarias vitest, pruebas e2e playwright para movil 390px y escritorio, y revision de integridad
f6cae43 bloque e: implementacion de las 5 pantallas de referencia con datos falsos del documento 15 y pruebas de pantalla
6fc752c bloque d: implementacion de la pagina /kit con el catalogo visual de las 8 piezas y sus 3 estados
e7e84dc bloque c: implementacion de las 8 piezas reutilizables con sus 3 estados y pruebas unitarias
e976a26 chore: remover dist del repositorio
fca50c7 bloque b: implementacion de armazones socio (movil primero) y admin (escritorio primero)
10f43b3 bloque a: agregar .gitignore y excluir node_modules
9a24d44 bloque a: inicializacion de proyecto, tokens de diseno, fuentes y estructura
35e8f85 inicio tarea 01 - armazon y piezas
```

---

## 4. Archivos Entregados

```
SISTEMA MOTOR Y BACKOFFICE/
├── package.json
├── vite.config.js
├── vitest.config.js
├── playwright.config.js
├── index.html
├── .gitignore
├── e2e/
│   ├── kit.spec.js
│   ├── navegacion-admin.spec.js
│   └── navegacion-socio.spec.js
├── public/
│   ├── brand/
│   │   ├── logo-color-horizontal.png
│   │   ├── logo-blanco-horizontal.png
│   │   ├── logo-color-isotipo.png
│   │   └── logo-negro-horizontal.png
│   └── fonts/
│       ├── AgusSans-Regular.woff2
│       ├── CaviarDreams.woff2
│       ├── CaviarDreams_Bold.woff2
│       ├── CaviarDreams_Italic.woff2
│       └── CaviarDreams_BoldItalic.woff2
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── estilos/
    │   ├── tokens.css
    │   ├── armazon.css
    │   ├── piezas.css
    │   ├── paginas.css
    │   └── index.css
    ├── datos-falsos/
    │   ├── socioEjemplo.js
    │   ├── comisionesEjemplo.js
    │   ├── redEjemplo.js
    │   └── adminEjemplo.js
    ├── armazon/
    │   ├── ArmazonSocio.jsx
    │   └── ArmazonAdmin.jsx
    ├── piezas/
    │   ├── TarjetaDato.jsx
    │   ├── BarraProgreso.jsx
    │   ├── Tabla.jsx
    │   ├── InsigniaEstado.jsx
    │   ├── Formulario.jsx
    │   ├── EstadoVacio.jsx
    │   ├── DialogoConfirmar.jsx
    │   ├── NodoArbol.jsx
    │   └── index.js
    ├── paginas/
    │   ├── Kit.jsx
    │   ├── P11PanelSocio.jsx
    │   ├── P12MiRed.jsx
    │   ├── P14MisComisiones.jsx
    │   ├── P23BandejaConfirmacion.jsx
    │   └── P25CierreCiclo.jsx
    └── test/
        ├── setup.js
        ├── piezas.test.jsx
        └── pantallas.test.jsx
```
