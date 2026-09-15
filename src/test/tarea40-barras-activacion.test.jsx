import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import P13TiendaRecompra from '../paginas/P13TiendaRecompra';
import { obtenerCatalogoRecompra, obtenerCiclos, formatearNombreCiclo } from '../servicios/socio';

vi.mock('../servicios/socio', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    obtenerPerfilSocio: vi.fn().mockResolvedValue({
      id: 1,
      nombres: 'ADMINISTRADOR',
      apellidos: 'MAX GLOBAL',
      codigo: 'MG00001',
      pack: { id: 5, nombre: 'Pack Empresarial', descuento_recompra_pct: 50 }
    }),
    obtenerCiclos: vi.fn().mockResolvedValue([
      { id: 1, anio: 2026, mes: 9, estado: 'abierto' }
    ]),
    obtenerCatalogoRecompra: vi.fn().mockResolvedValue({
      socio: {
        id: 1,
        codigo: 'MG00001',
        nombres: 'ADMINISTRADOR',
        apellidos: 'MAX GLOBAL',
        nombreCompleto: 'ADMINISTRADOR MAX GLOBAL',
        pack_nombre: 'Pack Empresarial',
        descuento_pct: 50,
        puntos_personales_actuales: 0,
        esta_activo: false,
        meta_activacion: 70
      },
      meta_activacion: 70,
      productos: [
        {
          id: 1,
          nombre: 'Coffee Capuccino Con Ganoderma y Moringa',
          puntos: 18,
          precio_lista_cent: 15000,
          precio_final_cent: 7500,
          descuento_pct: 50
        }
      ]
    })
  };
});

describe('TAREA-40 · Las Barras Muertas y la Meta de Activación (7 Pruebas de Certificación)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1 · P-13 con 0 pts y meta 70 muestra "0 / 70", no "0 / 100"
  it('1 · P-13 con 0 pts y meta 70 muestra "0 / 70", no "0 / 100"', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Meta de Activación Mensual: 70 Puntos Personales/i)).toBeInTheDocument();
    });

    // Contador dentro de BarraProgreso
    const conteo0 = screen.getByText((content, el) => {
      return el?.classList?.contains('barra-progreso-conteo') && el.textContent.replace(/\s+/g, ' ').trim() === '0 / 70 pts';
    });
    expect(conteo0).toBeInTheDocument();
    expect(conteo0.textContent).not.toContain('/ 100');

    // Mensaje inferior dentro de BarraProgreso
    expect(screen.getByText(/Te faltan 70 pts para la meta/i)).toBeInTheDocument();
    expect(screen.queryByText(/Te faltan 100 pts para la meta/i)).not.toBeInTheDocument();

    // Track con 0%
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '70');
    const fill = progressbar.querySelector('.barra-progreso-fill');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  // 2 · Con 18 pts de carrito muestra "18 / 70" y variante dorada
  it('2 · Con 18 pts de carrito muestra "18 / 70" y variante dorada', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Coffee Capuccino/i)).toBeInTheDocument();
    });

    // Agregar 1 café (18 pts)
    const btnAgregar = screen.getByRole('button', { name: /^Agregar$/i });
    fireEvent.click(btnAgregar);

    // Debe mostrar 18 / 70 pts
    await waitFor(() => {
      const conteo18 = screen.getByText((content, el) => {
        return el?.classList?.contains('barra-progreso-conteo') && el.textContent.replace(/\s+/g, ' ').trim() === '18 / 70 pts';
      });
      expect(conteo18).toBeInTheDocument();
    });

    expect(screen.getByText(/Te faltan 52 pts para la meta/i)).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '18');
    const fill = progressbar.querySelector('.barra-progreso-fill');
    // 18 / 70 * 100 = 25.714%
    expect(fill?.className).toContain('dorado');
    expect(parseFloat(fill?.style?.width || '0')).toBeCloseTo(25.71, 1);
  });

  // 3 · Con 72 pts el ancho es 100%, no 102%
  it('3 · Con 72 pts el ancho es 100%, no 102%', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Coffee Capuccino/i)).toBeInTheDocument();
    });

    // 1 café con Agregar
    const btnAgregar = screen.getByRole('button', { name: /^Agregar$/i });
    fireEvent.click(btnAgregar);

    // 3 cafés más con Aumentar (+1 cada vez = 4 cafés = 72 pts)
    const btnAumentar = await screen.findByRole('button', { name: /Aumentar/i });
    fireEvent.click(btnAumentar);
    fireEvent.click(btnAumentar);
    fireEvent.click(btnAumentar);

    await waitFor(() => {
      const conteo72 = screen.getByText((content, el) => {
        return el?.classList?.contains('barra-progreso-conteo') && el.textContent.replace(/\s+/g, ' ').trim() === '72 / 70 pts';
      });
      expect(conteo72).toBeInTheDocument();
    });

    // Regla de oro: tope matemático al 100%
    const progressbar = screen.getByRole('progressbar');
    const fill = progressbar.querySelector('.barra-progreso-fill');
    expect(fill).toHaveStyle({ width: '100%' });
    expect(fill?.className).toContain('verde');
    expect(screen.getByText(/✓ Meta cumplida/i)).toBeInTheDocument();
  });

  // 4 · Ninguna llamada a BarraProgreso usa porcentaje
  it('4 · Ninguna llamada a BarraProgreso usa porcentaje', () => {
    const srcDir = path.resolve(__dirname, '..');
    const paginasDir = path.join(srcDir, 'paginas');
    const armazonDir = path.join(srcDir, 'armazon');
    
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      let matches = [];
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          matches = matches.concat(scanDir(full));
        } else if (/\.(jsx|tsx)$/.test(file)) {
          const content = fs.readFileSync(full, 'utf8');
          if (/<BarraProgreso[^>]*porcentaje/i.test(content)) {
            matches.push(full);
          }
        }
      }
      return matches;
    }

    const matches = scanDir(paginasDir).concat(scanDir(armazonDir));
    expect(matches).toEqual([]);
  });

  // 5 · Ninguna pantalla tiene el 70 escrito a mano en activacion/meta
  it('5 · Ninguna pantalla tiene el 70 escrito a mano en activacion/meta', () => {
    const paginasDir = path.resolve(__dirname, '../paginas');
    const files = fs.readdirSync(paginasDir).filter((f) => f !== 'Kit.jsx' && /\.(jsx|js)$/.test(f));

    const violations = [];
    for (const file of files) {
      const fullPath = path.join(paginasDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Busca patrones como / 70, >= 70, > 70, meta={70} asociados a activacion/puntos
        if (/((\/|>=|>)\s*70\b|meta=\{\s*70\s*\})/.test(line)) {
          violations.push(`${file}:${idx + 1} -> ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  // 6 · El selector de ciclo muestra el MES, no "Ciclo N"
  it('6 · El selector de ciclo muestra el MES, no "Ciclo N"', async () => {
    const res = formatearNombreCiclo({ anio: 2026, mes: 9 });
    expect(res).toBe('Septiembre 2026');

    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    expect(select.textContent).toContain('Septiembre 2026 (abierto)');
    expect(select.textContent).not.toContain('Ciclo 1 (abierto)');
  });

  // 7 · Si config no responde, la barra NO inventa un número
  it('7 · Si config no responde, la barra NO inventa un número', async () => {
    const { obtenerCatalogoRecompra: fnReal } = await vi.importActual('../servicios/socio');

    // Simular un cliente supabase donde la lectura de config falla
    const fakeClient = {
      from(tabla) {
        if (tabla === 'socio') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { id: 1, pack: {} }, error: null })
              })
            })
          };
        }
        if (tabla === 'producto') {
          return {
            select: () => ({
              order: async () => ({ data: [], error: null })
            })
          };
        }
        if (tabla === 'activacion') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { puntos_personales: 0, activo: false }, error: null })
                })
              })
            })
          };
        }
        if (tabla === 'config') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: null, error: { message: 'Network connection timeout' } })
              })
            })
          };
        }
        return {};
      }
    };

    // La función debe LANZAR error, NUNCA inventar 70
    await expect(fnReal(1, 1, fakeClient)).rejects.toThrow(/No se pudo obtener activacion_puntos_mes/);
  });
});
