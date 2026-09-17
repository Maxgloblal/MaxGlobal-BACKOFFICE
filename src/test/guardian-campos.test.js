import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * TAREA-13 · Bloque 6: Guardián de Nombres de Campo y Columnas de Postgres
 * 
 * Verifica que todos los accesos a propiedades del tipo:
 *   .algo_cent, .algo_id, .saldo_*, .precio_*, .puntos_*, .numero_cuenta, .cci
 * correspondan a columnas reales de la base de datos Postgres (scripts/schema-columnas.json)
 * o pertenezcan a la lista controlada y justificada de excepciones.
 * 
 * Si se detecta un campo inventado, la prueba falla señalando el archivo y la línea.
 */

// Lista breve y documentada de excepciones para respuestas de RPC, cálculos en memoria y tests
export const EXCEPCIONES_VALIDAS = new Set([
  // RPC fn_rango_lineas_socio (nodos en array lineas)
  'puntos_computados',
  'puntos_totales_rama',
  'frontal_id',
  'puntos_objetivo_evaluado',

  // RPC fn_ejecutar_cierre_ciclo (resumen retornado por el RPC de cierre)
  'total_pagado_cent',
  'total_bloqueado_empresa_cent',
  'total_teorico_cent',
  'total_abonado_cent',
  'nuevo_ciclo_id',
  'ciclo_cerrado_id',

  // Totales acumulados en memoria por servicios frontend
  'total_cobrado_cent',
  'total_patrocinio_cent',
  'total_residual_cent',
  'total_rango_cent',
  'puntos_personales_actuales',
  'puntos_acumulados', // motor global in-memory

  // Variables y mocks de pruebas unitarias
  'total_repartido_cent',
  'sobrante_empresa_cent',
  'precio_lista',
  'p_ciclo_id',
  'saldo_disponible_cent',

  // Auditoría y RPCs de TAREA-19 (payloads JSON y respuestas RPC)
  'puntos_acreditados',
  'saldo_nuevo_cent',
  'saldo_anterior_cent',
  'movimiento_id',

  // RPC fn_vista_previa_eliminar_socio (resumen de auditoría contable)
  'ordenes_monto_cent',
  'comisiones_generadas_cent'
]);

export function analizarCodigo(code, filename, validCols) {
  const errores = [];
  const lines = code.split(/\r?\n/);

  lines.forEach((line, idx) => {
    // 1. Accesos por punto (.algo_cent, .algo_id, .saldo_*, .precio_*, .puntos_*, etc.)
    const dotMatches = line.matchAll(/\.([a-zA-Z0-9_]+)\b/g);
    for (const m of dotMatches) {
      const prop = m[1];
      if (
        prop.endsWith('_cent') ||
        prop.endsWith('_id') ||
        prop.startsWith('saldo_') ||
        prop.startsWith('precio_') ||
        prop.startsWith('puntos_') ||
        prop === 'numero_cuenta' ||
        prop === 'cci'
      ) {
        if (EXCEPCIONES_VALIDAS.has(prop)) continue;

        if (!validCols.has(prop)) {
          errores.push({
            prop,
            archivo: filename,
            linea: idx + 1,
            texto: line.trim(),
            motivo: `El campo '${prop}' no existe en ninguna tabla o vista de Postgres`
          });
        } else if (
          prop === 'subtotal_cent' &&
          (line.includes('d.subtotal_cent') ||
            line.includes('item.subtotal_cent') ||
            line.includes('detalle.subtotal_cent'))
        ) {
          // subtotal_cent existe en la cabecera de orden, pero NO en orden_detalle
          errores.push({
            prop,
            archivo: filename,
            linea: idx + 1,
            texto: line.trim(),
            motivo: `El campo 'subtotal_cent' pertenece a la orden, no al detalle de productos`
          });
        }
      }
    }

    // 2. Claves de insert o select para cci o numero_cuenta en objetos
    const insertMatches = line.matchAll(/\b(numero_cuenta|cci)\s*[:=,]/g);
    for (const m of insertMatches) {
      const prop = m[1];
      if (!EXCEPCIONES_VALIDAS.has(prop) && !validCols.has(prop)) {
        errores.push({
          prop,
          archivo: filename,
          linea: idx + 1,
          texto: line.trim(),
          motivo: `La propiedad '${prop}' no es una columna válida en Postgres`
        });
      }
    }
  });

  return errores;
}

function listarArchivosFuente(dir) {
  const archivos = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
        archivos.push(...listarArchivosFuente(full));
      }
    } else if (/\.(jsx?|tsx?)$/.test(item)) {
      archivos.push(full);
    }
  }
  return archivos;
}

describe('TAREA-13 · Bloque 6: El Guardián de Nombres de Campo', () => {
  const rutaSchema = path.resolve(__dirname, '../../scripts/schema-columnas.json');
  let schema;
  let validCols;

  beforeAll(() => {
    expect(fs.existsSync(rutaSchema)).toBe(true);
    schema = JSON.parse(fs.readFileSync(rutaSchema, 'utf8'));
    validCols = new Set(schema.columnas_unicas);
  });

  it('1. schema-columnas.json contiene las 25 tablas/vistas y más de 200 columnas oficiales', () => {
    expect(schema.total_tablas).toBe(25);
    expect(schema.total_columnas).toBeGreaterThanOrEqual(220);
    expect(validCols.has('precio_final_cent')).toBe(true);
    expect(validCols.has('saldo_despues_cent')).toBe(true);
    expect(validCols.has('cuenta')).toBe(true);
    // Verificar que los inventados NO existen en Postgres
    expect(validCols.has('precio_unit_cent')).toBe(false);
    expect(validCols.has('saldo_posterior_cent')).toBe(false);
    expect(validCols.has('cci')).toBe(false);
    expect(validCols.has('numero_cuenta')).toBe(false);
  });

  it('2. El código actual en src/ NO contiene campos inventados ni accesos inválidos', () => {
    const rutaSrc = path.resolve(__dirname, '..');
    const archivos = listarArchivosFuente(rutaSrc);
    const todosLosErrores = [];

    for (const f of archivos) {
      // Omitir el propio archivo del guardián para no auto-evaluar strings de prueba
      if (f.includes('guardian-campos.test.js')) continue;
      const code = fs.readFileSync(f, 'utf8');
      const errs = analizarCodigo(code, path.relative(path.resolve(__dirname, '../..'), f), validCols);
      todosLosErrores.push(...errs);
    }

    if (todosLosErrores.length > 0) {
      const detalle = todosLosErrores
        .map((e) => `  - [${e.archivo}:${e.linea}] '${e.prop}': ${e.motivo}\n    Línea: "${e.texto}"`)
        .join('\n');
      expect.fail(`Se encontraron ${todosLosErrores.length} accesos a campos inexistentes en src/:\n${detalle}`);
    }

    expect(todosLosErrores.length).toBe(0);
  });

  it('3. Verificación de eficacia: El guardián detecta los 5 errores históricos en el commit anterior', () => {
    // Obtener las versiones anteriores de los 3 archivos afectados antes de TAREA-13
    const archivosHistoricos = [
      'src/paginas/P17MisPedidos.jsx',
      'src/paginas/P19MiBilletera.jsx',
      'src/servicios/socio.js'
    ];

    let erroresDetectados = [];
    for (const relPath of archivosHistoricos) {
      try {
        const codigoPrevio = execSync(`git show 33cd3c0:${relPath}`, { encoding: 'utf8' });
        const errs = analizarCodigo(codigoPrevio, relPath, validCols);
        erroresDetectados.push(...errs);
      } catch (e) {
        console.warn(`No se pudo leer ${relPath} de 33cd3c0:`, e.message);
      }
    }

    const camposDetectados = new Set(erroresDetectados.map((e) => e.prop));

    // Debe detectar con precisión los cinco errores conocidos
    expect(camposDetectados.has('precio_unit_cent')).toBe(true);
    expect(camposDetectados.has('subtotal_cent')).toBe(true);
    expect(camposDetectados.has('saldo_posterior_cent')).toBe(true);
    expect(camposDetectados.has('numero_cuenta')).toBe(true);
    expect(camposDetectados.has('cci')).toBe(true);

    expect(erroresDetectados.length).toBeGreaterThanOrEqual(5);
  });
});
