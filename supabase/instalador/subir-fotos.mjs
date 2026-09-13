#!/usr/bin/env node
/**
 * MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
 * Script para subir las 8 fotos oficiales al bucket 'productos'
 * y actualizar la columna imagen_url en la tabla public.producto.
 *
 * USO:
 *   node subir-fotos.mjs <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY_OR_ANON_KEY> [ADMIN_PASSWORD]
 *
 * O definiendo variables de entorno:
 *   SUPABASE_URL=... SUPABASE_KEY=... node subir-fotos.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.argv[2] || process.env.SUPABASE_URL;
const supabaseKey = process.argv[3] || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.argv[4] || process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Se requiere URL y KEY de Supabase.');
  console.error('Uso: node subir-fotos.mjs <SUPABASE_URL> <SUPABASE_KEY> [ADMIN_PASSWORD]');
  process.exit(1);
}

// Directorio de fotos: local 'fotos/' o fallback '../SITIO WEB 06 PAGINAS LANDINGS/public/images/productos'
let fotosDir = path.join(__dirname, 'fotos');
if (!fs.existsSync(fotosDir) || fs.readdirSync(fotosDir).length === 0) {
  const fallback = path.resolve(__dirname, '../../SITIO WEB 06 PAGINAS LANDINGS/public/images/productos');
  if (fs.existsSync(fallback)) {
    fotosDir = fallback;
  }
}

console.log('MAX GLOBAL · Subida de Fotos de Catálogo');
console.log('URL de Destino:', supabaseUrl);
console.log('Directorio Fotos:', fotosDir);

const sb = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const PRODUCTOS_CATALOGO = [
  { codigo: 'CAFE', slug: 'cafe-moringa', archivo: 'cafe-moringa.webp' },
  { codigo: 'COLAGENO', slug: 'colageno-hidrolizado', archivo: 'colageno-hidrolizado.webp' },
  { codigo: 'AC-MORINGA', slug: 'aceite-moringa', archivo: 'aceite-moringa.webp' },
  { codigo: 'ESPLENDOR', slug: 'esplendor', archivo: 'esplendor.webp' },
  { codigo: 'AC-OREGANO', slug: 'aceite-oregano', archivo: 'aceite-oregano.webp' },
  { codigo: 'CAP-MORINGA', slug: 'capsulas-moringa', archivo: 'capsulas-moringa.webp' },
  { codigo: 'HAR-MORINGA', slug: 'harina-moringa', archivo: 'harina-moringa.webp' },
  { codigo: 'DALBA', slug: 'perfume-dalba', archivo: 'perfume-dalba.webp' }
];

async function main() {
  // Si nos dieron clave de admin y la key es anon, autenticar admin
  if (adminPassword) {
    console.log('Autenticando con cuenta de administrador...');
    const { error: authErr } = await sb.auth.signInWithPassword({
      email: 'admin@maxglobal.com',
      password: adminPassword
    });
    if (authErr) {
      console.warn('Aviso al autenticar admin:', authErr.message);
      console.log('Continuando con privilegios provistos...');
    } else {
      console.log('✓ Admin autenticado con éxito.');
    }
  }

  for (const item of PRODUCTOS_CATALOGO) {
    const filePath = path.join(fotosDir, item.archivo);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado: ${filePath}`);
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    console.log(`Subiendo ${item.archivo} (${fileBuffer.length} bytes)...`);

    const { error: errUpload } = await sb.storage
      .from('productos')
      .upload(item.archivo, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (errUpload) {
      console.error(`❌ Error al subir ${item.archivo}:`, errUpload.message);
      process.exit(1);
    }

    const { data: pubData } = sb.storage.from('productos').getPublicUrl(item.archivo);
    const publicUrl = pubData.publicUrl;
    console.log(`  ✓ URL pública: ${publicUrl}`);

    const { error: errUpdate } = await sb
      .from('producto')
      .update({ imagen_url: publicUrl })
      .eq('codigo', item.codigo);

    if (errUpdate) {
      console.error(`❌ Error actualizando producto ${item.codigo}:`, errUpdate.message);
      process.exit(1);
    }

    console.log(`  ✓ Producto ${item.codigo} actualizado con imagen_url.`);
  }

  console.log('====================================================');
  console.log('✓ Las 8 fotos se subieron y asociaron exitosamente.');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
