/**
 * Datos falsos para P-14 Mis Comisiones
 * Fuente: 03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE.md
 */
export const comisionesMaria = {
  ciclo: 'Agosto 2026',
  bonoPatrocinioCent: 4800,
  bonoResidualCent: 8040,
  bonoRangoCent: 10000,
  totalCicloCent: 22840,
  detalleResidual: [
    { id: 1, nivel: 1, deQuien: 'Carlos Ríos', puntos: 180, porcentaje: '40%', ganasteCent: 7200, estado: 'confirmado' },
    { id: 2, nivel: 1, deQuien: 'Rosa Díaz', puntos: 94, porcentaje: '40%', ganasteCent: 3760, estado: 'confirmado' },
    { id: 3, nivel: 2, deQuien: 'Lucía Pérez', puntos: 70, porcentaje: '20%', ganasteCent: 1400, estado: 'confirmado' },
    { id: 4, nivel: 3, deQuien: 'Jorge Mendoza', puntos: 0, porcentaje: '10%', ganasteCent: 0, estado: 'inactivo' },
  ],
  observacionInactivo: 'Elena Vargas no se activó este mes. Sus puntos no generaron comisión para nadie.',
  casoCero: {
    totalCent: 0,
    motivoTitulo: 'No estuviste activa este mes',
    motivoDetalle: 'Te faltaron 22 puntos de los 70 requeridos para activar tu cobro de comisiones.',
    explicacionRed: 'Tus 3 socios directos sí compraron (sumaron 424 pts). Al no estar activa, esa comisión no se pagó a nadie (regla de no compresión).'
  }
};
