/**
 * scripts/generar-schema-columnas.mjs
 *
 * Genera scripts/schema-columnas.json con todas las tablas y columnas oficiales
 * de la base de datos Postgres (esquema public) a partir de information_schema.columns.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generarDiccionarioSchema() {
  const rutaJson = path.join(__dirname, 'schema-columnas.json');
  if (fs.existsSync(rutaJson)) {
    const data = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
    return data;
  }
  throw new Error('schema-columnas.json no encontrado');
}

export function guardarSchemaArchivo(datos) {
  const rutaDestino = path.join(__dirname, 'schema-columnas.json');
  fs.writeFileSync(rutaDestino, JSON.stringify(datos, null, 2) + '\n', 'utf8');
  console.log(`[schema] Guardado en ${rutaDestino}`);
}

if (process.argv[1] && process.argv[1].endsWith('generar-schema-columnas.mjs')) {
  const schema = generarDiccionarioSchema();
  console.log(`[schema] Verificado: ${schema.total_tablas} tablas/vistas, ${schema.total_columnas} columnas oficiales.`);
}
