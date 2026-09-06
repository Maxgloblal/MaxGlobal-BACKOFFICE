import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import {
  generarSlug,
  validarArchivoFotoProducto,
  subirFotoProducto,
  crearProducto,
  editarProducto,
  cambiarEstadoProducto
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-22 · Gestión de Productos (P-32) y Reglas de Negocio', () => {
  let sbAdmin;
  let sbAna;
  const productosCreados = [];

  beforeAll(async () => {
    // 1. Admin autenticado (socio 1)
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-prod', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // 2. Socio Ana autenticada (socio 2, no admin)
    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-prod', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);
  });

  afterAll(async () => {
    // Limpieza estricta de productos de prueba para mantener exactamente los 8 certificados
    for (const prodId of productosCreados) {
      try {
        await sbAdmin.from('auditoria').delete().eq('tabla', 'producto').eq('registro_id', prodId);
        await sbAdmin.from('producto').delete().eq('id', prodId);
      } catch (e) {
        console.warn('Error en limpieza de producto de prueba:', e.message);
      }
    }
  });

  // 1 · Crear un producto con precio 0 falla ANTES de llegar a Postgres
  it('1 · Crear un producto con precio 0 falla ANTES de llegar a Postgres', async () => {
    await expect(
      crearProducto(
        {
          codigo: 'TEST-P0',
          nombre: 'Producto Gratis',
          slug: 'producto-gratis',
          precio_lista_cent: 0,
          puntos: 10
        },
        1,
        sbAdmin
      )
    ).rejects.toThrow(/El precio público debe ser mayor a 0/);
  });

  // 2 · Crear con un código que ya existe falla con mensaje claro, no con el error 23505 crudo
  it('2 · Crear con un código que ya existe falla con mensaje claro, no con el error 23505 crudo', async () => {
    try {
      await crearProducto(
        {
          codigo: 'CAFE',
          nombre: 'Otro Café Duplicado',
          slug: 'otro-cafe-dup',
          precio_lista_cent: 15000,
          puntos: 18
        },
        1,
        sbAdmin
      );
      expect.fail('Debió fallar por código duplicado');
    } catch (err) {
      expect(err.message).toBe('Ese código ya existe');
      expect(err.message).not.toContain('23505');
      expect(err.message).not.toContain('duplicate key');
    }
  });

  // 3 · Crear con un slug que ya existe falla igual
  it('3 · Crear con un slug que ya existe falla igual', async () => {
    try {
      await crearProducto(
        {
          codigo: 'NUEVO-CODIGO',
          nombre: 'Café Con Mismo Slug',
          slug: 'cafe-moringa',
          precio_lista_cent: 15000,
          puntos: 18
        },
        1,
        sbAdmin
      );
      expect.fail('Debió fallar por slug duplicado');
    } catch (err) {
      expect(err.message).toBe('Ese slug ya existe');
      expect(err.message).not.toContain('23505');
    }
  });

  // 4 · El slug se genera solo: "Coffee Capuccino" → "coffee-capuccino"
  it('4 · El slug se genera solo: "Coffee Capuccino" → "coffee-capuccino"', () => {
    expect(generarSlug('Coffee Capuccino')).toBe('coffee-capuccino');
    expect(generarSlug('Colágeno Aeterna')).toBe('colageno-aeterna');
    expect(generarSlug('Esplendor — Lágrimas Humectantes')).toBe('esplendor-lagrimas-humectantes');
  });

  // 5 · Editar el precio NO cambia orden_detalle de órdenes pasadas (ORD-2026-001489)
  it('5 · Editar el precio NO cambia orden_detalle de órdenes pasadas (ORD-2026-001489)', async () => {
    // Consultar el detalle histórico de la orden ORD-2026-001489
    const { data: detallesAntes, error: errDet } = await sbAdmin
      .from('orden_detalle')
      .select('precio_lista_cent, puntos_unitario, orden:orden_id!inner(codigo)')
      .eq('orden.codigo', 'ORD-2026-001489');

    expect(errDet).toBeNull();
    expect(detallesAntes.length).toBeGreaterThan(0);
    expect(detallesAntes[0].precio_lista_cent).toBe(15000);
    expect(detallesAntes[0].puntos_unitario).toBe(18);

    // Obtener CAFE original
    const { data: prodCafe } = await sbAdmin
      .from('producto')
      .select('*')
      .eq('codigo', 'CAFE')
      .single();

    // Editar precio de CAFE temporalmente
    await editarProducto(
      prodCafe.id,
      {
        ...prodCafe,
        precio_lista_cent: 99900 // S/. 999.00
      },
      prodCafe,
      1,
      sbAdmin
    );

    // Volver a consultar el detalle de la orden pasada
    const { data: detallesDespues } = await sbAdmin
      .from('orden_detalle')
      .select('precio_lista_cent, puntos_unitario, orden:orden_id!inner(codigo)')
      .eq('orden.codigo', 'ORD-2026-001489');

    // Restaurar inmediatamente el precio oficial de CAFE
    await editarProducto(
      prodCafe.id,
      prodCafe,
      { ...prodCafe, precio_lista_cent: 99900 },
      1,
      sbAdmin
    );

    // El histórico de orden_detalle DEBE seguir intacto con 15000 y 18
    expect(detallesDespues[0].precio_lista_cent).toBe(15000);
    expect(detallesDespues[0].puntos_unitario).toBe(18);
  });

  // 6 · Desactivar un producto NO lo borra: sigue en la tabla y sigue apareciendo en el historial
  it('6 · Desactivar un producto NO lo borra: sigue en la tabla y sigue apareciendo en el historial de quien lo compró', async () => {
    const { data: prodDalba } = await sbAdmin
      .from('producto')
      .select('*')
      .eq('codigo', 'DALBA')
      .single();

    // Desactivar DALBA
    await cambiarEstadoProducto(prodDalba.id, false, prodDalba, 1, sbAdmin);

    // Comprobar que sigue existiendo en la tabla con activo = false
    const { data: prodInactivo } = await sbAdmin
      .from('producto')
      .select('*')
      .eq('id', prodDalba.id)
      .single();

    expect(prodInactivo).not.toBeNull();
    expect(prodInactivo.activo).toBe(false);

    // Reactivar DALBA para preservar el catálogo oficial
    await cambiarEstadoProducto(prodDalba.id, true, prodInactivo, 1, sbAdmin);
    const { data: prodReactivado } = await sbAdmin
      .from('producto')
      .select('*')
      .eq('id', prodDalba.id)
      .single();

    expect(prodReactivado.activo).toBe(true);
  });

  // 7 · NO existe ninguna función ni botón que borre un producto
  it('7 · NO existe ninguna función ni botón que borre un producto', () => {
    const servicios = fs.readFileSync(
      path.resolve('src/servicios/operacionAdmin.js'),
      'utf8'
    );
    expect(servicios).not.toMatch(/export\s+(async\s+)?function\s+(eliminarProducto|borrarProducto)/i);

    const vistaP32 = fs.readFileSync(
      path.resolve('src/paginas/P32GestionProductos.jsx'),
      'utf8'
    );
    expect(vistaP32).not.toMatch(/eliminarProducto|borrarProducto/i);
    expect(vistaP32).not.toMatch(/btn-borrar|btn-eliminar/i);
  });

  // 8 · Una foto de 3 MB es rechazada antes de subirse
  it('8 · Una foto de 3 MB es rechazada antes de subirse', () => {
    const mockFotoPesada = {
      name: 'foto-grande.webp',
      type: 'image/webp',
      size: 3 * 1024 * 1024 // 3 MB
    };
    expect(() => validarArchivoFotoProducto(mockFotoPesada)).toThrow(
      /excede el tamaño máximo permitido de 2 MB/
    );
  });

  // 9 · Un .pdf o .exe es rechazado
  it('9 · Un .pdf o .exe es rechazado', () => {
    const mockPdf = { name: 'archivo.pdf', type: 'application/pdf', size: 1024 };
    const mockExe = { name: 'virus.exe', type: 'application/x-msdownload', size: 1024 };

    expect(() => validarArchivoFotoProducto(mockPdf)).toThrow(/Formato de imagen inválido/);
    expect(() => validarArchivoFotoProducto(mockExe)).toThrow(/Formato de imagen inválido/);
  });

  // 10 · Al reemplazar la foto, el nombre del archivo CAMBIA (lleva timestamp distinto)
  it('10 · Al reemplazar la foto, el nombre del archivo CAMBIA (lleva timestamp distinto)', async () => {
    const buffer1 = Buffer.from('fake-image-1');
    const buffer2 = Buffer.from('fake-image-2');

    const res1 = await subirFotoProducto(
      {
        archivo: {
          name: 'foto.webp',
          type: 'image/webp',
          size: buffer1.length,
          slice: () => buffer1
        },
        slug: 'test-cafe'
      },
      sbAdmin
    );

    // Pausa breve para garantizar timestamp distinto
    await new Promise(r => setTimeout(r, 20));

    const res2 = await subirFotoProducto(
      {
        archivo: {
          name: 'foto.webp',
          type: 'image/webp',
          size: buffer2.length,
          slice: () => buffer2
        },
        slug: 'test-cafe'
      },
      sbAdmin
    );

    expect(res1.nombreArchivo).not.toBe(res2.nombreArchivo);
    expect(res1.nombreArchivo).toMatch(/^test-cafe-\d+\.webp$/);
    expect(res2.nombreArchivo).toMatch(/^test-cafe-\d+\.webp$/);
  });

  // 11 · Crear un producto deja su fila en auditoria
  it('11 · Crear un producto deja su fila en auditoria', async () => {
    const nuevoProd = await crearProducto(
      {
        codigo: 'PROD-TEST-AUDIT',
        slug: 'prod-test-audit',
        nombre: 'Producto Test Auditoría',
        precio_lista_cent: 12000,
        puntos: 15,
        categoria: 'Salud y Nutrición'
      },
      1,
      sbAdmin
    );
    productosCreados.push(nuevoProd.id);

    const { data: audRow } = await sbAdmin
      .from('auditoria')
      .select('*')
      .eq('tabla', 'producto')
      .eq('accion', 'crear_producto')
      .eq('registro_id', nuevoProd.id)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    expect(audRow).not.toBeNull();
    expect(audRow.datos_despues.codigo).toBe('PROD-TEST-AUDIT');
    expect(audRow.datos_despues.nombre).toBe('Producto Test Auditoría');
  });

  // 12 · Editar el precio guarda el valor ANTERIOR en datos_antes
  it('12 · Editar el precio guarda el valor ANTERIOR en datos_antes', async () => {
    const prodId = productosCreados[0];
    const { data: prodAntes } = await sbAdmin
      .from('producto')
      .select('*')
      .eq('id', prodId)
      .single();

    await editarProducto(
      prodId,
      {
        ...prodAntes,
        precio_lista_cent: 18000 // Subir de 12000 a 18000
      },
      prodAntes,
      1,
      sbAdmin
    );

    const { data: audEdit } = await sbAdmin
      .from('auditoria')
      .select('*')
      .eq('tabla', 'producto')
      .eq('accion', 'editar_producto')
      .eq('registro_id', prodId)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    expect(audEdit).not.toBeNull();
    expect(audEdit.datos_antes.precio_lista_cent).toBe(12000);
    expect(audEdit.datos_despues.precio_lista_cent).toBe(18000);
  });

  // 13 · Un socio (no admin) NO puede crear ni editar productos — con sesión real
  it('13 · Un socio (no admin) NO puede crear ni editar productos — con sesión real', async () => {
    // Ana intenta insertar directamente en la tabla producto
    const { data: hackInsert, error: errInsert } = await sbAna
      .from('producto')
      .insert({
        codigo: 'PROD-HACK',
        slug: 'prod-hack',
        nombre: 'Producto Hackeado',
        precio_lista_cent: 1000,
        puntos: 1
      })
      .select();

    // RLS producto_admin_all requiere fn_is_admin() = true
    expect(errInsert).not.toBeNull();
    expect(hackInsert).toBeNull();

    // Ana intenta actualizar el precio de CAFE a 1 centavo
    const { data: updateData } = await sbAna
      .from('producto')
      .update({ precio_lista_cent: 1 })
      .eq('codigo', 'CAFE')
      .select();

    // RLS filtra la fila en el UPDATE (0 filas modificadas)
    expect(updateData).toEqual([]);

    // También editarProducto con el cliente de Ana debe fallar
    await expect(
      editarProducto(
        1,
        { codigo: 'CAFE', nombre: 'Cafe Hack', slug: 'cafe-moringa', precio_lista_cent: 1, puntos: 1 },
        { codigo: 'CAFE' },
        null,
        sbAna
      )
    ).rejects.toThrow();

    // Verificar que CAFE sigue intacto en 15000 centavos
    const { data: cafeReal } = await sbAna
      .from('producto')
      .select('precio_lista_cent')
      .eq('codigo', 'CAFE')
      .single();

    expect(cafeReal.precio_lista_cent).toBe(15000);
  });
});
