# INSTRUCCIONES PARA ANTIGRAVITY — Fase 2

**Las tareas se ejecutan en orden. Una letra significa corregir la tarea del
mismo número.**

| Tarea | Qué hace | Estado |
|---|---|---|
| `TAREA-01-BASE-DE-DATOS` | Las 22 tablas, RLS y datos maestros | ✅ |
| `TAREA-01B-CORRECCION-VISTAS-RLS` | Tres vistas se saltaban la seguridad | ✅ |
| `TAREA-01C-CIERRE-DE-LA-ETAPA-0` | Dos funciones expuestas | ⬜ pendiente |
| `TAREA-02-ARMAZON-Y-PIEZAS` | Armazón, 8 piezas, 5 pantallas | ✅ |
| `TAREA-02B-CORRECCION-DINERO` | Dinero en céntimos y precios de pack | ✅ |
| `TAREA-03-RED-SIMULADA` | 500 socios y tres ciclos | ✅ |
| `TAREA-03B-CORRECCION-RED` | Cinco defectos de la red | ✅ |
| `TAREA-04A-MOTOR-PATROCINIO-Y-RESIDUAL` | Los dos bonos de fórmula fija | ✅ |
| `TAREA-04B-MOTOR-RANGO-Y-GLOBAL` | Bono de rango y bono global | ⬜ **la siguiente** |

## 🔴 Estos archivos no se editan

Son la instrucción, no un borrador. Ya se cortaron cuatro de ellos por accidente
y hubo que restaurarlos desde los commits.

## Cómo está escrita cada tarea

Por bloques, con commit en cada uno, y con **los números calculados a mano** por
adelantado. Si el motor no devuelve exactamente esos números, está mal el motor.

Al final, siempre: `git status --short` vacío y la salida pegada literal.
