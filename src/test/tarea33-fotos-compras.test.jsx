import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import FotoProducto from '../piezas/FotoProducto';
import { obtenerCatalogoRecompra } from '../servicios/socio';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-33 · Las Fotos del Producto al Comprar (Bloque 4 - 6 Pruebas)', () => {
  let sbClient;
  let catalogo;

  beforeAll(async () => {
    sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-t33-auth', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAuth } = await sbClient.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAuth) throw new Error(`Fallo login: ${errAuth.message}`);

    // Obtener catálogo oficial del socio 1 en ciclo 30
    catalogo = await obtenerCatalogoRecompra(1, 30, sbClient);
  });

  // 1 · P-13 muestra 8 productos, los 8 con su imagen
  it('1 · P-13 muestra 8 productos, los 8 con su imagen', () => {
    expect(catalogo.productos.length).toBe(8);
    catalogo.productos.forEach((p) => {
      expect(p.imagen_url).toBeTruthy();
      expect(typeof p.imagen_url).toBe('string');
      expect(p.imagen_url.length).toBeGreaterThan(10);
    });
  });

  // 2 · Un producto sin imagen_url muestra el marcador, no una imagen rota
  it('2 · Un producto sin imagen_url muestra el marcador, no una imagen rota', () => {
    // Caso 1: url null o vacía
    const { container: c1 } = render(
      <FotoProducto url={null} nombre="Producto Sin Foto" tamano={64} />
    );
    expect(c1.querySelector('img')).toBeNull();
    expect(c1.querySelector('.marcador-foto-producto')).not.toBeNull();
    expect(c1.querySelector('svg')).not.toBeNull();

    // Caso 2: error en la carga de la imagen (onError conmuta al marcador)
    const { container: c2 } = render(
      <FotoProducto url="https://ejemplo.test/foto-inexistente.jpg" nombre="Producto Roto" tamano={64} />
    );
    const img = c2.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img);
    // Tras el fallo, la imagen rota desaparece y se muestra el marcador
    expect(c2.querySelector('img')).toBeNull();
    expect(c2.querySelector('.marcador-foto-producto')).not.toBeNull();
  });

  // 3 · Las URLs apuntan al bucket público de Supabase y NO están firmadas (no llevan ?token=)
  it('3 · Las URLs apuntan al bucket público de Supabase y NO están firmadas (no llevan ?token=)', () => {
    catalogo.productos.forEach((p) => {
      // Debe apuntar al bucket público productos
      expect(p.imagen_url).toContain('/storage/v1/object/public/productos/');
      // NO debe tener token de firma (eso es solo de vouchers privados)
      expect(p.imagen_url).not.toContain('?token=');
    });
  });

  // 4 · Los precios NO cambiaron ← número a mano: Café público 15000 · socio 7500
  it('4 · Los precios NO cambiaron (Café público 15000 · socio 7500)', () => {
    const cafe = catalogo.productos.find((p) => p.codigo === 'CAFE');
    expect(cafe).toBeDefined();
    expect(cafe.precio_lista_cent).toBe(15000); // S/. 150.00 exacto
    expect(cafe.precio_final_cent).toBe(7500); // 50% de descuento Gold -> S/. 75.00 exacto

    const colageno = catalogo.productos.find((p) => p.codigo === 'COLAGENO');
    expect(colageno.precio_lista_cent).toBe(15000);

    const acMoringa = catalogo.productos.find((p) => p.codigo === 'AC-MORINGA');
    expect(acMoringa.precio_lista_cent).toBe(12000);

    const esplendor = catalogo.productos.find((p) => p.codigo === 'ESPLENDOR');
    expect(esplendor.precio_lista_cent).toBe(12000);

    const acOregano = catalogo.productos.find((p) => p.codigo === 'AC-OREGANO');
    expect(acOregano.precio_lista_cent).toBe(6000);

    const capMoringa = catalogo.productos.find((p) => p.codigo === 'CAP-MORINGA');
    expect(capMoringa.precio_lista_cent).toBe(6000);

    const harMoringa = catalogo.productos.find((p) => p.codigo === 'HAR-MORINGA');
    expect(harMoringa.precio_lista_cent).toBe(5000);

    const dalba = catalogo.productos.find((p) => p.codigo === 'DALBA');
    expect(dalba.precio_lista_cent).toBe(7000);
  });

  // 5 · Los puntos NO cambiaron ← Café 18 puntos
  it('5 · Los puntos NO cambiaron (Café 18 puntos)', () => {
    const cafe = catalogo.productos.find((p) => p.codigo === 'CAFE');
    expect(cafe.puntos).toBe(18);

    const colageno = catalogo.productos.find((p) => p.codigo === 'COLAGENO');
    expect(colageno.puntos).toBe(18);

    const acMoringa = catalogo.productos.find((p) => p.codigo === 'AC-MORINGA');
    expect(acMoringa.puntos).toBe(14);

    const esplendor = catalogo.productos.find((p) => p.codigo === 'ESPLENDOR');
    expect(esplendor.puntos).toBe(14);

    const acOregano = catalogo.productos.find((p) => p.codigo === 'AC-OREGANO');
    expect(acOregano.puntos).toBe(8);

    const capMoringa = catalogo.productos.find((p) => p.codigo === 'CAP-MORINGA');
    expect(capMoringa.puntos).toBe(8);

    const harMoringa = catalogo.productos.find((p) => p.codigo === 'HAR-MORINGA');
    expect(harMoringa.puntos).toBe(6);

    const dalba = catalogo.productos.find((p) => p.codigo === 'DALBA');
    expect(dalba.puntos).toBe(10);
  });

  // 6 · Ninguna consulta de src/servicios/ se modificó
  it('6 · Ninguna consulta de src/servicios/ se modificó', () => {
    const diff = execSync('git diff --stat src/servicios/').toString().trim();
    expect(diff).toBe('');
  });
});
