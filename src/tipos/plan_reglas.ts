/**
 * =====================================================================
 * MAX GLOBAL CORPORATION — REGLAS DEL PLAN DE COMPENSACIÓN
 * Documentación de Niveles por Pack y Reparto Efectivo (28/08/2026)
 * =====================================================================
 * 
 * 🔴 ATENCIÓN CRÍTICA PARA EL MOTOR DE COMISIONES:
 * Los niveles de patrocinio y los niveles residuales SON DISTINTOS para el Pack Ejecutivo.
 * 
 *   Pack           Niveles Patrocinio   Niveles Residual   Reparto Efectivo
 *   ------------   ------------------   ----------------   ----------------
 *   EMPRENDEDOR            0                   0                  0%
 *   EJECUTIVO              3                   5       ← 🔴 SON DISTINTOS (78% residual)
 *   GOLD                   7                  10                 97%
 *   FAMILIAR               7                  10                 97%
 *   EMPRESARIAL            7                  10                 97%
 * 
 * REGLAS CLAVE:
 * 1. El Pack Ejecutivo cobra Patrocinio únicamente en 3 NIVELES (N1: 20%, N2: 4%, N3: 3%).
 * 2. El Pack Ejecutivo cobra Residual en 5 NIVELES (N1: 40%, N2: 20%, N3: 10%, N4: 5%, N5: 3% = 78%).
 * 3. NUNCA colapsar ambos campos en una sola variable `niveles`.
 * 4. Puntos de activación personal: 70 pts mensuales (S/. 1.00 = 1 punto en residual).
 * 5. Excepción Kit Emprendedor: 41.7% exclusivamente al Nivel 1 (S/. 50.00).
 */

export interface PackReglasPlan {
  codigo: 'EMPRENDEDOR' | 'EJECUTIVO' | 'GOLD' | 'FAMILIAR' | 'EMPRESARIAL';
  nombre: string;
  precio_cent: number;
  puntos_rango: number;
  descuento_recompra_pct: number;
  niveles_patrocinio: number;
  niveles_residual: number;
  reparto_efectivo_pct: number;
}

export const REGLAS_PACKS_OFICIALES: Record<string, PackReglasPlan> = {
  EMPRENDEDOR: {
    codigo: 'EMPRENDEDOR',
    nombre: 'Kit Emprendedor',
    precio_cent: 12000,
    puntos_rango: 0,
    descuento_recompra_pct: 40.0,
    niveles_patrocinio: 0,
    niveles_residual: 0,
    reparto_efectivo_pct: 0
  },
  EJECUTIVO: {
    codigo: 'EJECUTIVO',
    nombre: 'Pack Ejecutivo',
    precio_cent: 36000,
    puntos_rango: 70,
    descuento_recompra_pct: 50.0,
    niveles_patrocinio: 3, // 🔴 Exactamente 3 niveles
    niveles_residual: 5,   // 🔴 Exactamente 5 niveles
    reparto_efectivo_pct: 78.0
  },
  GOLD: {
    codigo: 'GOLD',
    nombre: 'Pack Gold',
    precio_cent: 120000,
    puntos_rango: 150,
    descuento_recompra_pct: 50.0,
    niveles_patrocinio: 7,
    niveles_residual: 10,
    reparto_efectivo_pct: 97.0
  },
  FAMILIAR: {
    codigo: 'FAMILIAR',
    nombre: 'Pack Familiar',
    precio_cent: 400000,
    puntos_rango: 400,
    descuento_recompra_pct: 50.0,
    niveles_patrocinio: 7,
    niveles_residual: 10,
    reparto_efectivo_pct: 97.0
  },
  EMPRESARIAL: {
    codigo: 'EMPRESARIAL',
    nombre: 'Pack Empresarial',
    precio_cent: 800000,
    puntos_rango: 800,
    descuento_recompra_pct: 50.0,
    niveles_patrocinio: 7,
    niveles_residual: 10,
    reparto_efectivo_pct: 97.0
  }
};
