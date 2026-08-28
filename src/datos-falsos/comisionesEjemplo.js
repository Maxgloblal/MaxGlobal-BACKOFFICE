/**
 * Datos falsos para P-14 Mis Comisiones
 * Fuente: 03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE.md
 */
export const comisionesMaria = {
  ciclo: 'Agosto 2026',
  bonoPatrocinio: '48.00',
  bonoResidual: '80.40',
  bonoRango: '100.00',
  totalCiclo: '228.40',
  detalleResidual: [
    { id: 1, nivel: 1, deQuien: 'Carlos Ríos', puntos: 180, porcentaje: '40%', ganaste: '72.00', estado: 'confirmado' },
    { id: 2, nivel: 1, deQuien: 'Rosa Díaz', puntos: 94, porcentaje: '40%', ganaste: '37.60', estado: 'confirmado' },
    { id: 3, nivel: 2, deQuien: 'Lucía Pérez', puntos: 70, porcentaje: '20%', ganaste: '14.00', estado: 'confirmado' },
    { id: 4, nivel: 3, deQuien: 'Jorge Mendoza', puntos: 0, porcentaje: '10%', ganaste: '0.00', estado: 'inactivo' },
  ],
  observacionInactivo: 'Elena Vargas no se activó este mes. Sus puntos no generaron comisión para nadie.',
  casoCero: {
    total: '0.00',
    motivoTitulo: 'No estuviste activa este mes',
    motivoDetalle: 'Te faltaron 22 puntos de los 70 requeridos para activar tu cobro de comisiones.',
    explicacionRed: 'Tus 3 socios directos sí compraron (sumaron 424 pts). Al no estar activa, esa comisión no se pagó a nadie (regla de no compresión).'
  }
};
