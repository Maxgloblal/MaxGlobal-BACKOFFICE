import { describe, it, expect } from 'vitest';
import { formatearSoles, formatearMonto } from '../utilidades/dinero';
import { pedidosPorConfirmar, resumenCierreCiclo } from '../datos-falsos/adminEjemplo';
import { comisionesMaria } from '../datos-falsos/comisionesEjemplo';
import { socioMaria } from '../datos-falsos/socioEjemplo';

describe('TAREA-02B · Formato e Integridad de Dinero', () => {
  describe('Función formatearSoles y formatearMonto', () => {
    it('formatearSoles(15000) === "S/. 150.00"', () => {
      expect(formatearSoles(15000)).toBe('S/. 150.00');
    });

    it('formatearSoles(4238000) === "S/. 42,380.00"', () => {
      expect(formatearSoles(4238000)).toBe('S/. 42,380.00');
    });

    it('formatearSoles(0) === "S/. 0.00"', () => {
      expect(formatearSoles(0)).toBe('S/. 0.00');
    });

    it('formatearSoles(null) === "S/. 0.00" no "NaN"', () => {
      expect(formatearSoles(null)).toBe('S/. 0.00');
    });

    it('formatearSoles(undefined) === "S/. 0.00"', () => {
      expect(formatearSoles(undefined)).toBe('S/. 0.00');
    });

    it('formatearSoles(8040) === "S/. 80.40"', () => {
      expect(formatearSoles(8040)).toBe('S/. 80.40');
    });

    it('formatearMonto devuelve solo el número con 2 decimales y separador de miles', () => {
      expect(formatearMonto(4238000)).toBe('42,380.00');
      expect(formatearMonto(0)).toBe('0.00');
      expect(formatearMonto(null)).toBe('0.00');
    });
  });

  describe('Integridad de Datos Falsos: todo dinero es entero en céntimos (*Cent)', () => {
    function validarCentimosEnteros(obj, nombreFuente) {
      function recorrer(nodo, ruta) {
        for (const [k, v] of Object.entries(nodo)) {
          const rutaActual = `${ruta}.${k}`;
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            recorrer(v, rutaActual);
          } else if (Array.isArray(v)) {
            v.forEach((elem, idx) => {
              if (elem && typeof elem === 'object') {
                recorrer(elem, `${rutaActual}[${idx}]`);
              }
            });
          } else if (k.endsWith('Cent')) {
            expect(typeof v).toBe('number');
            expect(Number.isInteger(v)).toBe(true);
            expect(v).not.toBeNaN();
          }
        }
      }
      recorrer(obj, nombreFuente);
    }

    it('Ningún monto en adminEjemplo es string ni tiene decimales', () => {
      validarCentimosEnteros(pedidosPorConfirmar, 'pedidosPorConfirmar');
      validarCentimosEnteros(resumenCierreCiclo, 'resumenCierreCiclo');
    });

    it('Ningún monto en comisionesEjemplo es string ni tiene decimales', () => {
      validarCentimosEnteros(comisionesMaria, 'comisionesMaria');
    });

    it('Ningún monto en socioEjemplo es string ni tiene decimales', () => {
      validarCentimosEnteros(socioMaria, 'socioMaria');
    });
  });
});
