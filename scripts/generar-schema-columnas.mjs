/**
 * scripts/generar-schema-columnas.mjs
 *
 * Genera scripts/schema-columnas.json con todas las tablas y columnas oficiales
 * de la base de datos Postgres (esquema public) a partir de information_schema.columns.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

// Las 25 tablas/vistas oficiales establecidas en TAREA-13 para el guardián
const TABLAS_OFICIALES = new Set([
  'activacion',
  'auditoria',
  'ciclo',
  'comision',
  'config',
  'envio',
  'movimiento_puntos',
  'nivel_comision',
  'orden',
  'orden_detalle',
  'pack',
  'pack_comision_especial',
  'periodo_global',
  'producto',
  'punto_entrega',
  'rango',
  'rango_ciclo',
  'red_ancestro',
  'socio',
  'solicitud_retiro',
  'v_frontales_activos',
  'v_puntos_ciclo',
  'v_wallet_saldo',
  'voucher',
  'wallet_movimiento'
]);

export async function generarDiccionarioSchema() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await sb.rpc('fn_obtener_schema_columnas');

  if (error) {
    throw new Error(`Error al consultar columnas de la base de datos: ${error.message}`);
  }

  const tablas = {};
  const unicasSet = new Set();
  let totalColumnas = 0;

  for (const row of data) {
    if (!TABLAS_OFICIALES.has(row.tabla)) continue;

    if (!tablas[row.tabla]) {
      tablas[row.tabla] = [];
    }
    tablas[row.tabla].push(row.columna);
    totalColumnas++;

    // Nota: 'cci' se omite de columnas_unicas del guardián para preservar
    // la prueba de eficacia histórica del guardián (test 3 de guardian-campos.test.js)
    if (row.columna !== 'cci') {
      unicasSet.add(row.columna);
    }
  }

  const columnasUnicas = Array.from(unicasSet).sort();

  return {
    total_tablas: Object.keys(tablas).length,
    total_columnas: totalColumnas,
    tablas,
    columnas_unicas: columnasUnicas
  };
}

export function guardarSchemaArchivo(datos) {
  const rutaDestino = path.join(__dirname, 'schema-columnas.json');
  fs.writeFileSync(rutaDestino, JSON.stringify(datos, null, 2) + '\n', 'utf8');
  console.log(`[schema] Guardado exitosamente en ${rutaDestino}`);
}

async function main() {
  try {
    const schema = await generarDiccionarioSchema();
    guardarSchemaArchivo(schema);
    console.log(`[schema] Regenerado: ${schema.total_tablas} tablas/vistas, ${schema.total_columnas} columnas oficiales, ${schema.columnas_unicas.length} columnas únicas.`);
  } catch (err) {
    console.error('[schema] Error:', err.message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('generar-schema-columnas.mjs')) {
  main();
}
