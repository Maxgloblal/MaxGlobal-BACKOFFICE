import { describe, it, expect, vi } from 'vitest';
import { obtenerMapaFotosProductos, obtenerDatosEnlace } from '../servicios/socio';

describe('TAREA-68 · Integridad Operativa, Dominio Oficial y Servicios', () => {
  it('1 · obtenerMapaFotosProductos retorna un mapa indexado por id y codigo', async () => {
    const mockProds = [
      { id: 1, codigo: 'PROD01', imagen_url: 'https://ejemplo.com/foto1.webp' },
      { id: 2, codigo: 'PROD02', imagen_url: 'https://ejemplo.com/foto2.webp' },
    ];
    const mockSb = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockProds, error: null })
      })
    };

    const map = await obtenerMapaFotosProductos(mockSb);
    expect(map[1]).toBe('https://ejemplo.com/foto1.webp');
    expect(map['PROD01']).toBe('https://ejemplo.com/foto1.webp');
    expect(map[2]).toBe('https://ejemplo.com/foto2.webp');
    expect(map['PROD02']).toBe('https://ejemplo.com/foto2.webp');
  });

  it('2 · obtenerDatosEnlace utiliza la URL oficial https://maxglobaloficial.com desde config', async () => {
    const mockSocio = { id: 7, codigo: 'MG00007', pack: { id: 2, solo_afilia_igual: false } };
    const mockSb = {
      from: vi.fn((tabla) => {
        if (tabla === 'socio') {
          return {
            select: vi.fn((cols, opts) => {
              if (opts?.count) {
                return { eq: vi.fn().mockResolvedValue({ count: 5, error: null }) };
              }
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockSocio, error: null })
                })
              };
            })
          };
        }
        if (tabla === 'config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { valor: 'https://maxglobaloficial.com' },
                  error: null
                })
              })
            })
          };
        }
        return {};
      })
    };

    const res = await obtenerDatosEnlace(7, mockSb);
    expect(res.urlLanding).toBe('https://maxglobaloficial.com');
    expect(res.socio.codigo).toBe('MG00007');
    expect(res.frontalesDirectos).toBe(5);
  });

  it('3 · obtenerMapaFotosProductos propaga errores de base de datos', async () => {
    const mockSb = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('Error de conexión') })
      })
    };

    await expect(obtenerMapaFotosProductos(mockSb)).rejects.toThrow('Error de conexión');
  });

  it('4 · obtenerDatosEnlace lanza error si url_landing no está definida en config', async () => {
    const mockSocio = { id: 7, codigo: 'MG00007', pack: { id: 2 } };
    const mockSb = {
      from: vi.fn((tabla) => {
        if (tabla === 'socio') {
          return {
            select: vi.fn((cols, opts) => {
              if (opts?.count) return { eq: vi.fn().mockResolvedValue({ count: 0, error: null }) };
              return { eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockSocio, error: null }) }) };
            })
          };
        }
        if (tabla === 'config') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        }
        return {};
      })
    };

    await expect(obtenerDatosEnlace(7, mockSb)).rejects.toThrow('Configuración incompleta: falta definir la clave "url_landing"');
  });
});
