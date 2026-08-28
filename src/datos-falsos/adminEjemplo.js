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
    montoEsperadoCent: 15000,
    montoDeclaradoCent: 15000,
    puntos: 36,
    banco: 'BCP Soles',
    numOperacion: 'OP-889421',
    voucherUrl: '/brand/logo-color-isotipo.png',
    impacto: {
      socioActiva: 'Carlos Mendoza (alcanza 72 pts)',
      puntosAcreditar: 36,
      comisionesGenerarCent: 1440
    }
  },
  {
    id: 'PED-1044',
    numero: '#1044',
    fecha: '27 ago 2026, 16:15',
    socio: 'Rosa Valdivia',
    codigoSocio: 'MG-00501',
    tipo: 'Afiliación (Pack Gold)',
    montoEsperadoCent: 120000,
    montoDeclaradoCent: 120000,
    puntos: 300,
    banco: 'BBVA Soles',
    numOperacion: 'OP-110293',
    voucherUrl: '/brand/logo-color-isotipo.png',
    impacto: {
      socioActiva: 'Rosa Valdivia (nuevo socio ACTIVO)',
      puntosAcreditar: 300,
      comisionesGenerarCent: 36960
    }
  }
];

export const resumenCierreCiclo = {
  ciclo: 'Agosto 2026',
  pedidosPendientes: 0,
  configuracionCompleta: true,
  sociosQueCobran: 187,
  totalAPagarCent: 4238000,
  subenDeRango: 12,
  bajanDeRango: 4,
  noCobranPorInactividad: 313,
  bonoPatrocinioTotalCent: 845000,
  bonoResidualTotalCent: 2263000,
  bonoRangoTotalCent: 1130000
};
