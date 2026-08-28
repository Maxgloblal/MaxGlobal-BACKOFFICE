/**
 * Utilidades de formateo de dinero
 * Regla innegociable: Todo dinero en la aplicación se maneja como entero en céntimos.
 * Fuente: 00-INSTRUCCIONES/TAREA-02B-CORRECCION-DINERO.md
 */

const formateadorNumero = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Solo el número, sin el símbolo de moneda. Para tablas apretadas o exportaciones.
 * @param {number|null|undefined} centimos - Monto en céntimos enteros
 * @returns {string} Monto formateado con 2 decimales y separador de miles (ej. "42,380.00")
 */
export function formatearMonto(centimos) {
  if (centimos === null || centimos === undefined || isNaN(centimos)) {
    return '0.00';
  }
  const soles = centimos / 100;
  return formateadorNumero.format(soles);
}

/**
 * Convierte céntimos enteros a texto en soles oficiales (PEN).
 *   15000   →  "S/. 150.00"
 *   4238000 →  "S/. 42,380.00"
 *   0       →  "S/. 0.00"
 *   null    →  "S/. 0.00"
 *
 * @param {number|null|undefined} centimos - Monto en céntimos enteros
 * @returns {string} Texto formateado en soles
 */
export function formatearSoles(centimos) {
  return `S/. ${formatearMonto(centimos)}`;
}
