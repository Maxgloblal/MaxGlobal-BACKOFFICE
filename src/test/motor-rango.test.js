import { describe, it, expect } from 'vitest';
import { calcularPuntosComputables, calificarRangoSocio } from '../motor/rango';

describe('TAREA-04B · Motor de Comisiones — Rango y Línea Estirada', () => {
  const rangosDefinidos = [
    { id: 1, orden: 1, codigo: 'JADE', nombre: 'Jade', puntos_grupales: 500, frontales_activos: 1, bono_cent: 5000, definido: true, activo: true },
    { id: 2, orden: 2, codigo: 'BRONCE', nombre: 'Bronce', puntos_grupales: 1000, frontales_activos: 2, bono_cent: 10000, definido: true, activo: true },
    { id: 3, orden: 3, codigo: 'PLATA', nombre: 'Plata', puntos_grupales: 2000, frontales_activos: 2, bono_cent: 20000, definido: true, activo: true },
    { id: 4, orden: 4, codigo: 'ORO', nombre: 'Oro', puntos_grupales: 4000, frontales_activos: 3, bono_cent: 50000, definido: true, activo: true },
    { id: 5, orden: 5, codigo: 'PLATINO', nombre: 'Platino', puntos_grupales: 8000, frontales_activos: 4, bono_cent: 150000, definido: true, activo: true },
    { id: 6, orden: 6, codigo: 'ESMERALDA', nombre: 'Esmeralda', puntos_grupales: 15000, frontales_activos: 5, bono_cent: 300000, definido: true, activo: true },
    { id: 7, orden: 7, codigo: 'ZAFIRO', nombre: 'Zafiro', puntos_grupales: 30000, frontales_activos: 6, bono_cent: 500000, definido: true, activo: true },
    { id: 8, orden: 8, codigo: 'DIAMANTE', nombre: 'Diamante', puntos_grupales: 60000, frontales_activos: 7, bono_cent: 1000000, definido: true, activo: true },
    { id: 9, orden: 9, codigo: 'DIAM-NEGRO', nombre: 'Diamante Negro', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
    { id: 10, orden: 10, codigo: 'DOBLE-DIAM', nombre: 'Doble Diamante', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
    { id: 11, orden: 11, codigo: 'TRIPLE-DIAM', nombre: 'Triple Diamante', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
    { id: 12, orden: 12, codigo: 'CLUB-MILL', nombre: 'Club de Millonarios', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
    { id: 13, orden: 13, codigo: 'IMPERIAL', nombre: 'Imperial', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
    { id: 14, orden: 14, codigo: 'TITAN', nombre: 'Titán', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
    { id: 15, orden: 15, codigo: 'EMB-ROYAL', nombre: 'Embajador Royal', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
    { id: 16, orden: 16, codigo: 'EMB-CORONA', nombre: 'Embajador Corona', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true }
  ];

  describe('Cálculo de Línea Estirada (Bloque 2)', () => {
    it('Jade (500 pts, tope 250), líneas 800/180/90 -> computable exacto 520 pts, califica', () => {
      const lineas = [
        { frontal_socio_id: 10, puntos_totales: 800 },
        { frontal_socio_id: 11, puntos_totales: 180 },
        { frontal_socio_id: 12, puntos_totales: 90 }
      ];

      const computable = calcularPuntosComputables(lineas, 500, 50);
      expect(computable).toBe(520); // 250 + 180 + 90
    });

    it('Jade (500 pts, tope 250), una sola línea con 800 pts -> computable exacto 250 pts, NO califica', () => {
      const lineas = [
        { frontal_socio_id: 10, puntos_totales: 800 }
      ];

      const computable = calcularPuntosComputables(lineas, 500, 50);
      expect(computable).toBe(250);
      expect(computable).toBeLessThan(500);
    });

    it('el tope se calcula sobre los puntos del RANGO que se evalúa, no del total del socio', () => {
      // Socio con 800 pts en Línea A y 400 pts en Línea B (total grupal = 1200 pts)
      const lineas = [
        { frontal_socio_id: 10, puntos_totales: 800 },
        { frontal_socio_id: 11, puntos_totales: 400 }
      ];

      // Para Bronce (pide 1000 pts -> tope 50% = 500 pts):
      // Línea A aporta min(800, 500) = 500; Línea B aporta min(400, 500) = 400
      // Computable Bronce = 500 + 400 = 900 (< 1000 -> NO califica a Bronce)
      const computableBronce = calcularPuntosComputables(lineas, 1000, 50);
      expect(computableBronce).toBe(900);

      // Para Jade (pide 500 pts -> tope 50% = 250 pts):
      // Línea A aporta min(800, 250) = 250; Línea B aporta min(400, 250) = 250
      // Computable Jade = 250 + 250 = 500 (>= 500 -> SÍ califica a Jade)
      const computableJade = calcularPuntosComputables(lineas, 500, 50);
      expect(computableJade).toBe(500);
    });

    it('un socio sin red tiene computable 0', () => {
      const computable = calcularPuntosComputables([], 500, 50);
      expect(computable).toBe(0);
    });

    it('un socio con dos líneas justo en el tope califica exactamente al límite (250 + 250 = 500)', () => {
      const lineas = [
        { frontal_socio_id: 10, puntos_totales: 250 },
        { frontal_socio_id: 11, puntos_totales: 250 }
      ];

      const computable = calcularPuntosComputables(lineas, 500, 50);
      expect(computable).toBe(500);
    });
  });

  describe('Calificación y Bono de Rango (Bloques 3 y 4)', () => {
    it('Diamante cobra 1,000,000 cent (S/. 10,000) y NADA más (no es apilable)', () => {
      const puntosSocio = {
        socio_id: 2,
        ciclo_id: 1,
        puntos_personales: 150,
        puntos_grupales: 70000,
        puntos_linea_mayor: 32000,
        frontales_activos: 7,
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 10, puntos_totales: 32000 }, // tope Diamante 30000
          { frontal_socio_id: 11, puntos_totales: 38000 }  // tope Diamante 30000 -> 30000 + 30000 = 60000
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, null);

      expect(res.califica).toBe(true);
      expect(res.rango_codigo).toBe('DIAMANTE');
      expect(res.bono_cent).toBe(1000000); // Exactamente S/. 10,000
      expect(res.motivo_bono).toBe('primer_ciclo');
    });

    it('Oro que baja a Bronce cobra CERO (regla estricta: baja de rango no cobra)', () => {
      // Rango anterior: ORO (orden 4)
      const rangoAnterior = { orden: 4, codigo: 'ORO' };

      // En este ciclo solo califica para Bronce (1000 pts requeridos, tiene 1200)
      const puntosSocio = {
        socio_id: 5,
        ciclo_id: 2,
        puntos_personales: 70,
        puntos_grupales: 1200,
        puntos_linea_mayor: 600,
        frontales_activos: 2,
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 20, puntos_totales: 600 },
          { frontal_socio_id: 21, puntos_totales: 600 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, rangoAnterior);

      expect(res.califica).toBe(false); // No califica para cobro de bono
      expect(res.rango_codigo).toBe('BRONCE');
      expect(res.rango_orden).toBe(2);
      expect(res.bono_cent).toBe(0); // 🔴 COBRA CERO
      expect(res.motivo_bono).toBe('baja');
    });

    it('Oro que se mantiene cobra 50,000 cent (S/. 500)', () => {
      // Rango anterior: ORO (orden 4)
      const rangoAnterior = { orden: 4, codigo: 'ORO' };

      const puntosSocio = {
        socio_id: 5,
        ciclo_id: 2,
        puntos_personales: 100,
        puntos_grupales: 4500,
        puntos_linea_mayor: 2000,
        frontales_activos: 3,
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 20, puntos_totales: 2000 },
          { frontal_socio_id: 21, puntos_totales: 2000 },
          { frontal_socio_id: 22, puntos_totales: 500 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, rangoAnterior);

      expect(res.califica).toBe(true);
      expect(res.rango_codigo).toBe('ORO');
      expect(res.bono_cent).toBe(50000);
      expect(res.motivo_bono).toBe('mantiene');
    });

    it('Oro que sube a Platino cobra 150,000 cent (S/. 1,500)', () => {
      // Rango anterior: ORO (orden 4)
      const rangoAnterior = { orden: 4, codigo: 'ORO' };

      const puntosSocio = {
        socio_id: 5,
        ciclo_id: 2,
        puntos_personales: 100,
        puntos_grupales: 9000,
        puntos_linea_mayor: 4000,
        frontales_activos: 4,
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 20, puntos_totales: 4000 },
          { frontal_socio_id: 21, puntos_totales: 4000 },
          { frontal_socio_id: 22, puntos_totales: 1000 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, rangoAnterior);

      expect(res.califica).toBe(true);
      expect(res.rango_codigo).toBe('PLATINO');
      expect(res.bono_cent).toBe(150000);
      expect(res.motivo_bono).toBe('asciende');
    });

    it('califica por puntos pero le falta 1 frontal activo -> no califica ni cobra', () => {
      // Plata exige 2000 pts y 2 frontales activos. Tiene 2500 pts pero solo 1 frontal activo.
      const puntosSocio = {
        socio_id: 8,
        ciclo_id: 1,
        puntos_personales: 70,
        puntos_grupales: 2500,
        puntos_linea_mayor: 1000,
        frontales_activos: 1, // Le falta 1 para Plata/Bronce
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 30, puntos_totales: 1500 },
          { frontal_socio_id: 31, puntos_totales: 1000 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, null);

      // Como tiene 1 frontal activo, solo califica a Jade (que pide 1 frontal)
      expect(res.califica).toBe(true);
      expect(res.rango_codigo).toBe('JADE');
      expect(res.bono_cent).toBe(5000);
    });

    it('califica por puntos y frontales pero está inactivo (activo = false) -> no califica ni cobra', () => {
      const puntosSocio = {
        socio_id: 9,
        ciclo_id: 1,
        puntos_personales: 0,
        puntos_grupales: 10000,
        puntos_linea_mayor: 4000,
        frontales_activos: 5,
        activo: false, // 🔴 INACTIVO
        lineas_frontales: [
          { frontal_socio_id: 40, puntos_totales: 5000 },
          { frontal_socio_id: 41, puntos_totales: 5000 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, null);

      expect(res.califica).toBe(false);
      expect(res.rango_id).toBeNull();
      expect(res.bono_cent).toBe(0);
      expect(res.motivo_bono).toBe('inactivo');
    });

    it('su primer ciclo sin rango anterior cobra el bono completo de su rango', () => {
      const puntosSocio = {
        socio_id: 12,
        ciclo_id: 1,
        puntos_personales: 70,
        puntos_grupales: 500,
        puntos_linea_mayor: 250,
        frontales_activos: 1,
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 50, puntos_totales: 250 },
          { frontal_socio_id: 51, puntos_totales: 250 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, null);

      expect(res.califica).toBe(true);
      expect(res.rango_codigo).toBe('JADE');
      expect(res.bono_cent).toBe(5000);
      expect(res.motivo_bono).toBe('primer_ciclo');
    });

    it('un rango con definido = false no califica a nadie', () => {
      // Socio con volumen gigantesco (100,000 pts y 10 frontales)
      const puntosSocio = {
        socio_id: 1,
        ciclo_id: 1,
        puntos_personales: 500,
        puntos_grupales: 100000,
        puntos_linea_mayor: 35000,
        frontales_activos: 10,
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 60, puntos_totales: 35000 },
          { frontal_socio_id: 61, puntos_totales: 35000 },
          { frontal_socio_id: 62, puntos_totales: 30000 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosDefinidos, null);

      // Como los rangos 9 al 16 tienen definido = false, el rango máximo alcanzable es Diamante (orden 8)
      expect(res.rango_codigo).toBe('DIAMANTE');
      expect(res.rango_orden).toBe(8);
      expect(res.bono_cent).toBe(1000000);
    });

    it('se llena el rango 9 con valores y se marca definido = true -> ahora sí califica', () => {
      // Simular que Max Global definió el rango Diamante Negro: 120,000 pts, 8 frontales, S/. 20,000 bono
      const rangosConDiamanteNegro = rangosDefinidos.map(r => {
        if (r.id === 9) {
          return {
            ...r,
            puntos_grupales: 120000,
            frontales_activos: 8,
            bono_cent: 2000000,
            definido: true,
            activo: true
          };
        }
        return r;
      });

      const puntosSocio = {
        socio_id: 1,
        ciclo_id: 1,
        puntos_personales: 500,
        puntos_grupales: 150000,
        puntos_linea_mayor: 60000,
        frontales_activos: 8,
        activo: true,
        lineas_frontales: [
          { frontal_socio_id: 70, puntos_totales: 60000 },
          { frontal_socio_id: 71, puntos_totales: 60000 },
          { frontal_socio_id: 72, puntos_totales: 30000 }
        ]
      };

      const res = calificarRangoSocio(puntosSocio, rangosConDiamanteNegro, null);

      // Ahora califica automáticamente a Diamante Negro sin cambiar una sola línea de código
      expect(res.rango_codigo).toBe('DIAM-NEGRO');
      expect(res.rango_orden).toBe(9);
      expect(res.bono_cent).toBe(2000000);
    });
  });
});
