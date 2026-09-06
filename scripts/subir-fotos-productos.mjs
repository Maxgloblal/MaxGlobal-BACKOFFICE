import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

const IMAGES_DIR = path.resolve('../SITIO WEB 06 PAGINAS LANDINGS/public/images/productos');

async function main() {
  console.log('Iniciando subida de fotos a Supabase Storage...');
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { error: errAuth } = await sb.auth.signInWithPassword({
    email: 'socio001@ejemplo.test',
    password: 'MaxGlobal2026!'
  });

  if (errAuth) {
    console.error('Error al autenticar admin:', errAuth.message);
    process.exit(1);
  }
  console.log('Admin autenticado con éxito.');

  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
  console.log(`Encontrados ${files.length} archivos .webp en ${IMAGES_DIR}`);

  const urlsPorSlug = {};

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`Subiendo ${file} (${fileBuffer.length} bytes)...`);

    const { data, error } = await sb.storage
      .from('productos')
      .upload(file, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error(`Error subiendo ${file}:`, error.message);
      process.exit(1);
    }

    const { data: pubData } = sb.storage.from('productos').getPublicUrl(file);
    console.log(`  -> Subido exitosamente: ${pubData.publicUrl}`);

    // Si coincide con slug (sin .webp)
    const slug = file.replace(/\.webp$/, '');
    urlsPorSlug[slug] = pubData.publicUrl;
  }

  // Ahora actualizar los 8 productos en la base de datos
  const productosSlugMap = [
    { codigo: 'CAFE', slug: 'cafe-moringa' },
    { codigo: 'COLAGENO', slug: 'colageno-hidrolizado' },
    { codigo: 'AC-MORINGA', slug: 'aceite-moringa' },
    { codigo: 'ESPLENDOR', slug: 'esplendor' },
    { codigo: 'AC-OREGANO', slug: 'aceite-oregano' },
    { codigo: 'CAP-MORINGA', slug: 'capsulas-moringa' },
    { codigo: 'HAR-MORINGA', slug: 'harina-moringa' },
    { codigo: 'DALBA', slug: 'perfume-dalba' }
  ];

  for (const item of productosSlugMap) {
    const publicUrl = urlsPorSlug[item.slug];
    if (!publicUrl) {
      console.error(`No se encontró URL para el slug: ${item.slug}`);
      process.exit(1);
    }

    const { error: errUpdate } = await sb
      .from('producto')
      .update({ imagen_url: publicUrl })
      .eq('codigo', item.codigo);

    if (errUpdate) {
      console.error(`Error actualizando producto ${item.codigo}:`, errUpdate.message);
      process.exit(1);
    }
    console.log(`Producto ${item.codigo} actualizado con imagen_url: ${publicUrl}`);
  }

  console.log('Subida y actualización completadas con éxito.');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
