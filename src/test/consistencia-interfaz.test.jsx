import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

import P32GestionProductos from '../paginas/P32GestionProductos';
import P27GestionSocios from '../paginas/P27GestionSocios';
import P31SolicitudesAfiliacion from '../paginas/P31SolicitudesAfiliacion';
import * as operacionAdmin from '../servicios/operacionAdmin';

// Mock de servicios de operacionAdmin
vi.mock('../servicios/operacionAdmin', async () => {
  const actual = await vi.importActual('../servicios/operacionAdmin');
  return {
    ...actual,
    obtenerProductosAdmin: vi.fn(),
    obtenerParametrosConsecuencias: vi.fn(),
    cambiarEstadoProducto: vi.fn(),
    obtenerListaSociosAdmin: vi.fn(),
    obtenerDetalleSocioAdmin: vi.fn(),
    obtenerVistaPreviaBajaSocio: vi.fn(),
    darDeBajaSocio: vi.fn(),
    obtenerSolicitudesAfiliacionAdmin: vi.fn(),
    descartarSolicitudAfiliacion: vi.fn()
  };
});

describe('TAREA-24 · Bloque 6: Pruebas de Consistencia de Interfaz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1 · No queda ningún window.confirm() en src/paginas/
  it('1 · No queda ningún window.confirm() en src/paginas/', () => {
    const paginasDir = path.resolve(__dirname, '../paginas');
    const files = fs.readdirSync(paginasDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
    const violaciones = [];
    const regexConfirm = /\b(?:window\.)?confirm\s*\(/;

    for (const file of files) {
      const content = fs.readFileSync(path.join(paginasDir, file), 'utf8');
      if (regexConfirm.test(content)) {
        violaciones.push(file);
      }
    }

    expect(violaciones).toEqual([]);
  });

  // 2 · No queda ningún alert() en src/paginas/ (salvo Kit.jsx)
  it('2 · No queda ningún alert() en src/paginas/ (salvo Kit.jsx)', () => {
    const paginasDir = path.resolve(__dirname, '../paginas');
    const files = fs
      .readdirSync(paginasDir)
      .filter(f => (f.endsWith('.jsx') || f.endsWith('.js')) && f !== 'Kit.jsx');
    const violaciones = [];
    const regexAlert = /\balert\s*\(/;

    for (const file of files) {
      const content = fs.readFileSync(path.join(paginasDir, file), 'utf8');
      if (regexAlert.test(content)) {
        violaciones.push(file);
      }
    }

    expect(violaciones).toEqual([]);
  });

  // 3 · Desactivar un producto abre DialogoConfirmar, no el del navegador
  it('3 · Desactivar un producto abre DialogoConfirmar, no el del navegador', async () => {
    const spyConfirm = vi.spyOn(window, 'confirm');

    const productoActivo = {
      id: 101,
      codigo: 'PROD-TEST',
      slug: 'prod-test',
      nombre: 'Producto Activo Test',
      categoria: 'Salud',
      precio_lista_cent: 15000,
      puntos: 18,
      orden: 1,
      activo: true,
      imagen_url: null
    };

    operacionAdmin.obtenerProductosAdmin.mockResolvedValue([productoActivo]);
    operacionAdmin.obtenerParametrosConsecuencias.mockResolvedValue({
      descGold: 30,
      descKit: 20,
      pctResidual: 97,
      bandaMin: 3.5,
      bandaMax: 4.5
    });

    render(
      <MemoryRouter>
        <P32GestionProductos />
      </MemoryRouter>
    );

    // Esperar a que el producto cargue en la tabla
    await waitFor(() => {
      expect(screen.getByText('Producto Activo Test')).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de desactivar producto
    const btnDesactivar = screen.getByTitle('Desactivar producto');
    expect(btnDesactivar).toBeInTheDocument();
    fireEvent.click(btnDesactivar);

    // Debe abrirse el DialogoConfirmar
    await waitFor(() => {
      expect(screen.getByText('¿Desactivar producto?')).toBeInTheDocument();
      expect(screen.getByText('Sí, desactivar')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    // El confirm nativo del navegador NUNCA debe haberse llamado
    expect(spyConfirm).not.toHaveBeenCalled();
    spyConfirm.mockRestore();
  });

  // 4 · Dar de baja un socio abre DialogoConfirmar
  it('4 · Dar de baja un socio abre DialogoConfirmar', async () => {
    const spyConfirm = vi.spyOn(window, 'confirm');

    operacionAdmin.obtenerListaSociosAdmin.mockResolvedValue({
      socios: [
        {
          id: 50,
          nombreCompleto: 'JUAN PEREZ',
          codigo: 'MG00050',
          documento: '44556677',
          email: 'juan@test.pe',
          estado: 'activo',
          pack: { id: 1, nombre: 'Pack Gold' },
          activacionCiclo: { activo: true, puntos_personales: 100 }
        }
      ],
      total: 1,
      totalPaginas: 1,
      cicloId: 4
    });

    operacionAdmin.obtenerVistaPreviaBajaSocio.mockResolvedValue({
      socio: { id: 50, nombres: 'JUAN', apellidos: 'PEREZ', codigo: 'MG00050', documento: '44556677' },
      patrocinador: { id: 1, nombres: 'CARLOS', apellidos: 'ADMIN', codigo: 'MG00001' },
      frontales_count: 2,
      frontales: [
        { id: 51, nombres: 'PEDRO', apellidos: 'GARCIA', codigo: 'MG00051' },
        { id: 52, nombres: 'LUCIA', apellidos: 'RAMOS', codigo: 'MG00052' }
      ],
      ordenes_count: 5,
      saldo_disponible_cent: 25000,
      puede_dar_baja: true
    });

    render(
      <MemoryRouter>
        <P27GestionSocios />
      </MemoryRouter>
    );

    // Carga de la lista de socios
    await waitFor(() => {
      expect(screen.getByText('MG00050')).toBeInTheDocument();
    });

    // Clic en el botón "Baja" en la fila del socio
    const btnBaja = screen.getByRole('button', { name: /Baja/i });
    expect(btnBaja).toBeInTheDocument();
    fireEvent.click(btnBaja);

    // Esperar a que se abra el modal de vista previa
    await waitFor(() => {
      expect(screen.getByText('Baja de Socio con Reenganche de Red')).toBeInTheDocument();
    });

    // Escribir motivo obligatorio
    const inputMotivo = document.getElementById('motivo-baja');
    expect(inputMotivo).toBeInTheDocument();
    fireEvent.change(inputMotivo, { target: { value: 'Incumplimiento grave de normas comerciales' } });

    // Clic en Confirmar Baja y Reenganche
    const btnConfirmarModal = screen.getByRole('button', { name: /Confirmar Baja y Reenganche/i });
    expect(btnConfirmarModal).not.toBeDisabled();
    fireEvent.click(btnConfirmarModal);

    // Debe abrirse DialogoConfirmar
    await waitFor(() => {
      expect(screen.getByText('¿Confirmar baja definitiva y reenganche de red?')).toBeInTheDocument();
      expect(screen.getByText('Sí, dar de baja')).toBeInTheDocument();
    });

    // window.confirm NUNCA fue llamado
    expect(spyConfirm).not.toHaveBeenCalled();
    spyConfirm.mockRestore();
  });

  // 5 · Cancelar en el diálogo NO ejecuta la acción (el producto sigue activo = true)
  it('5 · Cancelar en el diálogo NO ejecuta la acción (producto sigue activo = true)', async () => {
    const productoActivo = {
      id: 102,
      codigo: 'PROD-CANCEL',
      slug: 'prod-cancel',
      nombre: 'Producto Para Cancelar',
      categoria: 'Salud',
      precio_lista_cent: 18000,
      puntos: 20,
      orden: 2,
      activo: true,
      imagen_url: null
    };

    operacionAdmin.obtenerProductosAdmin.mockResolvedValue([productoActivo]);
    operacionAdmin.obtenerParametrosConsecuencias.mockResolvedValue({
      descGold: 30,
      descKit: 20,
      pctResidual: 97,
      bandaMin: 3.5,
      bandaMax: 4.5
    });

    render(
      <MemoryRouter>
        <P32GestionProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Producto Para Cancelar')).toBeInTheDocument();
    });

    // Clic en desactivar
    const btnDesactivar = screen.getByTitle('Desactivar producto');
    fireEvent.click(btnDesactivar);

    // Esperar que el modal de confirmación esté visible
    await waitFor(() => {
      expect(screen.getByText('¿Desactivar producto?')).toBeInTheDocument();
    });

    // Clic en el botón "Cancelar"
    const btnCancelar = screen.getByText('Cancelar');
    fireEvent.click(btnCancelar);

    // Verificar que el diálogo se cierra
    await waitFor(() => {
      expect(screen.queryByText('¿Desactivar producto?')).not.toBeInTheDocument();
    });

    // La función cambiarEstadoProducto NUNCA debe haber sido ejecutada
    expect(operacionAdmin.cambiarEstadoProducto).not.toHaveBeenCalled();

    // El producto en pantalla sigue activo (muestra badge activo y botón de desactivar)
    expect(productoActivo.activo).toBe(true);
    expect(screen.getByTitle('Desactivar producto')).toBeInTheDocument();
  });

  // 6 · Una pantalla sin datos muestra EstadoVacio, no una tabla vacía
  it('6 · Una pantalla sin datos muestra EstadoVacio, no una tabla vacía', async () => {
    operacionAdmin.obtenerSolicitudesAfiliacionAdmin.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <P31SolicitudesAfiliacion />
      </MemoryRouter>
    );

    // Esperar a que termine de cargar
    await waitFor(() => {
      expect(screen.getByText('No hay solicitudes nuevas pendientes')).toBeInTheDocument();
    });

    // Debe mostrar la descripción amigable del EstadoVacio
    expect(
      screen.getByText(/Todos los prospectos registrados han sido contactados/i)
    ).toBeInTheDocument();

    // NO debe existir tabla de datos vacía en el DOM
    expect(document.querySelector('table')).toBeNull();
  });

  // 7 · Con 42 filas, la lista muestra 20 y el paginador
  it('7 · Con 42 filas, la lista muestra 20 y el paginador', async () => {
    // Generar 42 solicitudes simuladas
    const solicitudesMock = Array.from({ length: 42 }, (_, i) => ({
      id: i + 1,
      nombres: `Prospecto ${i + 1}`,
      apellidos: `Apellido ${i + 1}`,
      telefono: `9876543${String(i).padStart(2, '0')}`,
      email: `prospecto${i + 1}@correo.test`,
      departamento: 'Lima',
      pack_codigo: 'GOLD',
      patrocinador_codigo: i % 2 === 0 ? 'MG00001' : null,
      patrocinador_id: i % 2 === 0 ? 1 : null,
      creado_en: '2026-09-01T12:00:00Z',
      estado: 'nuevo'
    }));

    operacionAdmin.obtenerSolicitudesAfiliacionAdmin.mockResolvedValue(solicitudesMock);

    render(
      <MemoryRouter>
        <P31SolicitudesAfiliacion />
      </MemoryRouter>
    );

    // Esperar a que cargue la lista
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 1 - 20 de 42 solicitudes/i)).toBeInTheDocument();
    });

    // La tabla debe contener exactamente 20 filas en el tbody
    const filas = document.querySelectorAll('table tbody tr');
    expect(filas.length).toBe(20);

    // El indicador de página debe indicar 1 / 3
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // El botón Anterior debe estar deshabilitado en página 1
    const btnAnterior = screen.getByRole('button', { name: /Anterior/i });
    expect(btnAnterior).toBeDisabled();

    // El botón Siguiente debe estar habilitado
    const btnSiguiente = screen.getByRole('button', { name: /Siguiente/i });
    expect(btnSiguiente).not.toBeDisabled();

    // Al hacer clic en Siguiente, avanza a la página 2
    fireEvent.click(btnSiguiente);

    await waitFor(() => {
      expect(screen.getByText(/Mostrando 21 - 40 de 42 solicitudes/i)).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    // La página 2 vuelve a mostrar exactamente 20 filas
    const filasPagina2 = document.querySelectorAll('table tbody tr');
    expect(filasPagina2.length).toBe(20);
  });

  // 8 · Ningún componente tiene un color hexadecimal escrito a mano
  it('8 · Ningún componente tiene un color hexadecimal escrito a mano (#RRGGBB en src/paginas/ y src/piezas/)', () => {
    const carpetas = [
      path.resolve(__dirname, '../paginas'),
      path.resolve(__dirname, '../piezas')
    ];

    const violaciones = [];
    const regexHex = /#[0-9A-Fa-f]{3,8}\b/;

    for (const dir of carpetas) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (regexHex.test(line)) {
            violaciones.push({
              archivo: path.relative(path.resolve(__dirname, '..'), fullPath),
              linea: index + 1,
              contenido: line.trim()
            });
          }
        });
      }
    }

    if (violaciones.length > 0) {
      console.error('Violaciones de colores hexadecimales encontradas:', violaciones);
    }

    expect(violaciones).toEqual([]);
  });
});
