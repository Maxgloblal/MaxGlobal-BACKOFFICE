/**
 * Datos falsos para el panel de administración (P-23 y P-25)
 * Fuente: 03-SISTEMA/10-RF-PANEL-ADMIN.md
 */

export const pedidosPorConfirmar = [
  {
    id: 'PED-1043',
    numero: '#1043',
    fecha: '27 ago 2026, 14:30',
    socio: 'Carlos Mendoza',
    codigoSocio: 'MG-00312',
    tipo: 'Recompra',
    montoEsperado: '150.00',
    montoDeclarado: '150.00',
    puntos: 36,
    banco: 'BCP Soles',
    numOperacion: 'OP-889421',
    voucherUrl: '/brand/logo-color-isotipo.png',
    impacto: {
      socioActiva: 'Carlos Mendoza (alcanza 72 pts)',
      puntosAcreditar: 36,
      comisionesGenerar: '14.40'
    }
  },
  {
    id: 'PED-1044',
    numero: '#1044',
    fecha: '27 ago 2026, 16:15',
    socio: 'Rosa Valdivia',
    codigoSocio: 'MG-00501',
    tipo: 'Afiliación (Pack Gold)',
    montoEsperado: '1,200.00',
    montoDeclarado: '1,200.00',
    puntos: 300,
    banco: 'BBVA Soles',
    numOperacion: 'OP-110293',
    voucherUrl: '/brand/logo-color-isotipo.png',
    impacto: {
      socioActiva: 'Rosa Valdivia (nuevo socio ACTIVO)',
      puntosAcreditar: 300,
      comisionesGenerar: '369.60'
    }
  }
];

export const resumenCierreCiclo = {
  ciclo: 'Agosto 2026',
  pedidosPendientes: 0,
  configuracionCompleta: true,
  sociosQueCobran: 187,
  totalAPagar: '42,380.00',
  subenDeRango: 12,
  bajanDeRango: 4,
  noCobranPorInactividad: 313,
  bonoPatrocinioTotal: '8,450.00',
  bonoResidualTotal: '22,630.00',
  bonoRangoTotal: '11,300.00'
};
