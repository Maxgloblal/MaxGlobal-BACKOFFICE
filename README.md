# SISTEMA MOTOR Y BACKOFFICE — Max Global Corporation

**Stack:** React 18 + Vite + TypeScript (motor) + Supabase
**Estado:** 20/20 pantallas terminadas · 225 unitarias + 26 E2E · todas en verde ✅

---

## ARRANQUE RÁPIDO

```bash
npm install
npm run dev          # http://localhost:5173
npx vitest run       # todas las pruebas
npm run build        # build de producción
```

**Login de prueba:**
```
Admin:  socio001@ejemplo.test / MaxGlobal2026!
ANA:    socio002@ejemplo.test / MaxGlobal2026!
```

---

## ESTRUCTURA

```
src/
├── motor/            ← Motor de comisiones TypeScript
│   ├── patrocinio.ts   7 niveles 20/4/3/2/1/0.5/0.3 = 30.8%
│   ├── residual.ts     10 niveles 40/20/10/5/3/2/1/10/5/1 = 97%
│   ├── rango.ts        Línea estirada + califica=false
│   ├── global.ts       1% semestral (stub v1)
│   ├── persistencia.js Lectura/escritura Postgres
│   ├── tipos.ts        Interfaces TypeScript
│   └── index.ts        Exports
│
├── paginas/          ← 20 pantallas + 3 especiales
│   ├── P10InicioSesion.jsx
│   ├── P11PanelSocio.jsx ... P19MiBilletera.jsx
│   ├── P20TableroAdmin.jsx ... P29Auditoria.jsx
│   ├── PEspera.jsx · PSuspendido.jsx · Kit.jsx
│   └── (todas terminadas ✅)
│
├── servicios/        ← Capa de acceso a Supabase
│   ├── operacionAdmin.js   ← admin: confirmar, registrar, cerrar
│   └── socio.js            ← socio: perfil, comisiones, rango, red
│
├── armazon/          ← Layouts con navegación
│   ├── ArmazonSocio.jsx
│   └── ArmazonAdmin.jsx
│
├── auth/             ← Contexto de sesión + rutas protegidas
├── piezas/           ← Componentes reutilizables
├── test/             ← 21 suites de prueba
├── motor/            ← (ver arriba)
├── lib/              ← supabase.js (cliente)
└── App.jsx           ← Router + rutas protegidas

supabase/
└── migrations/       ← 5 migraciones en producción

00-INSTRUCCIONES/     ← Tareas para Antigravity
DOCUMENTACION-ANTIGRAVITY/ ← AGENTS.md y reportes
```

---

## REGLAS CRÍTICAS

```
DINERO: siempre en céntimos (integer). Nunca float.
comision y wallet_movimiento: APPEND-ONLY (nunca UPDATE/DELETE)
movimiento_puntos y activacion: HISTÓRICO (nunca borra)
Las pantallas no llaman Supabase directamente — solo via src/servicios/
```

---

## SUPABASE

```
Proyecto: utlohnidkuvxqppmoevj
Región:   us-east-2
22 tablas · 47 políticas RLS · 16 funciones · 0 expuestas a anon
```

---

Para documentación completa: ver `../GUIA-CLAUDE/`
