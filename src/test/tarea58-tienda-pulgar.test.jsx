import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import P13TiendaRecompra from '../paginas/P13TiendaRecompra';
import { Boton, CampoTexto } from '../piezas/Formulario';

// Mock de servicios
vi.mock('../servicios/socio', () => ({
  obtenerPerfilSocio: vi.fn().mockResolvedValue({
    id: 1,
    codigo: 'MG00001',
    nombre: 'MAXIMO ADMIN',
    nombreCompleto: 'MAXIMO ADMIN',
    documento: '12345678',
    pack: 'EMPRESARIAL',
    pack_nombre: 'Pack Empresarial',
    rangoVigente: 'Diamante',
    rangoHonorifico: 'Diamante',
    estado: 'activo'
  }),
  obtenerCiclos: vi.fn().mockResolvedValue([
    { id: 1, anio: 2026, mes: 9, estado: 'abierto', nombre: 'Septiembre 2026' }
  ]),
  obtenerCatalogoRecompra: vi.fn().mockResolvedValue({
    socio: {
      id: 1,
      codigo: 'MG00001',
      nombreCompleto: 'MAXIMO ADMIN',
      pack_nombre: 'Pack Empresarial',
      descuento_pct: 50,
      puntos_personales_actuales: 20
    },
    meta_activacion: 70,
    productos: [
      {
        id: 1,
        codigo: 'CAFE',
        nombre: 'Coffee Capuccino con Moringa',
        descripcion: 'Café instantáneo enriquecido con moringa y ganoderma',
        categoria: 'Salud y Nutrición',
        presentacion: 'Caja 20 sobres',
        precio_lista_cent: 15000,
        precio_final_cent: 7500,
        puntos: 18,
        imagen_url: 'https://example.com/cafe.webp'
      },
      {
        id: 2,
        codigo: 'COLAGENO',
        nombre: 'Colágeno Aeterna Hidrolizado',
        descripcion: 'Colágeno en polvo con arándano y vitaminas',
        categoria: 'Salud y Nutrición',
        presentacion: 'Pote 150 g',
        precio_lista_cent: 15000,
        precio_final_cent: 7500,
        puntos: 18,
        imagen_url: 'https://example.com/colageno.webp'
      },
      {
        id: 3,
        codigo: 'AC-MORINGA',
        nombre: 'Aceite de Moringa',
        descripcion: 'Aceite 100% natural de moringa para la piel',
        categoria: 'Cuidado Personal',
        presentacion: 'Frasco gotero 50 ml',
        precio_lista_cent: 12000,
        precio_final_cent: 6000,
        puntos: 14,
        imagen_url: 'https://example.com/aceite.webp'
      }
    ]
  }),
  formatearNombreCiclo: vi.fn().mockReturnValue('Septiembre 2026')
}));

describe('TAREA-58 · P-13 Tienda con el pulgar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1 · Renderiza catálogo y filtros de búsqueda y categoría', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Tienda de Recompra/i)).toBeInTheDocument();
    });

    // Filtros presentes
    expect(screen.getByTestId('input-buscar-tienda')).toBeInTheDocument();
    expect(screen.getByTestId('select-categoria-tienda')).toBeInTheDocument();

    // 3 productos visibles inicialmente
    expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    expect(screen.getByText('Colágeno Aeterna Hidrolizado')).toBeInTheDocument();
    expect(screen.getByText('Aceite de Moringa')).toBeInTheDocument();
  });

  it('2 · Busca por nombre ignorando tildes y mayúsculas ("moringa" encuentra "Moringa")', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    });

    const inputBuscar = screen.getByTestId('input-buscar-tienda');
    fireEvent.change(inputBuscar, { target: { value: 'móringá' } });

    // Encuentra Coffee (tiene moringa) y Aceite de Moringa, pero NO Colágeno
    expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    expect(screen.getByText('Aceite de Moringa')).toBeInTheDocument();
    expect(screen.queryByText('Colágeno Aeterna Hidrolizado')).not.toBeInTheDocument();
  });

  it('3 · Busca por código de producto ("colageno" encuentra COLAGENO)', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Colágeno Aeterna Hidrolizado')).toBeInTheDocument();
    });

    const inputBuscar = screen.getByTestId('input-buscar-tienda');
    fireEvent.change(inputBuscar, { target: { value: 'colageno' } });

    expect(screen.getByText('Colágeno Aeterna Hidrolizado')).toBeInTheDocument();
    expect(screen.queryByText('Coffee Capuccino con Moringa')).not.toBeInTheDocument();
  });

  it('4 · Muestra estado vacío si no hay coincidencias y permite limpiar la búsqueda', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    });

    const inputBuscar = screen.getByTestId('input-buscar-tienda');
    fireEvent.change(inputBuscar, { target: { value: 'producto-inexistente-xyz' } });

    expect(screen.getByTestId('tienda-sin-resultados')).toBeInTheDocument();
    expect(screen.getByText(/No encontramos productos/i)).toBeInTheDocument();

    // Click en limpiar búsqueda
    const btnLimpiar = screen.getByTestId('btn-sin-resultados-limpiar');
    fireEvent.click(btnLimpiar);

    // Vuelven los 3 productos
    expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    expect(screen.getByText('Colágeno Aeterna Hidrolizado')).toBeInTheDocument();
    expect(screen.getByText('Aceite de Moringa')).toBeInTheDocument();
  });

  it('5 · Filtra por categoría y permite restablecer con botón X', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    });

    const selectCat = screen.getByTestId('select-categoria-tienda');
    fireEvent.change(selectCat, { target: { value: 'Cuidado Personal' } });

    // Solo Aceite de Moringa
    expect(screen.getByText('Aceite de Moringa')).toBeInTheDocument();
    expect(screen.queryByText('Coffee Capuccino con Moringa')).not.toBeInTheDocument();
    expect(screen.queryByText('Colágeno Aeterna Hidrolizado')).not.toBeInTheDocument();

    // Limpiar filtros desde el badge
    const btnLimpiarFiltros = screen.getByTestId('btn-limpiar-filtros');
    fireEvent.click(btnLimpiarFiltros);

    expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
  });

  it('6 · Barra fija de carrito: no aparece con carrito vacío, aparece al agregar producto', async () => {
    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    });

    // Inicialmente no hay barra fija
    expect(screen.queryByTestId('barra-fija-carrito')).not.toBeInTheDocument();

    // Agregar un producto al carrito
    const botonesAgregar = screen.getAllByRole('button', { name: /agregar/i });
    fireEvent.click(botonesAgregar[0]);

    // Ahora la barra fija DEBE estar visible con sus datos
    const barraFija = screen.getByTestId('barra-fija-carrito');
    expect(barraFija).toBeInTheDocument();
    expect(barraFija.textContent).toContain('1 producto');
    expect(barraFija.textContent).toContain('S/. 75.00');
    expect(barraFija.textContent).toContain('18 pts');
    expect(barraFija.textContent).toContain('Ver pedido');
  });

  it('7 · Clic en la barra fija o en Ver pedido invoca scrollIntoView hacia el resumen', async () => {
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    render(
      <MemoryRouter>
        <P13TiendaRecompra />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coffee Capuccino con Moringa')).toBeInTheDocument();
    });

    const botonesAgregar = screen.getAllByRole('button', { name: /agregar/i });
    fireEvent.click(botonesAgregar[0]);

    const barraFija = screen.getByTestId('barra-fija-carrito');
    fireEvent.click(barraFija);

    expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('8 · Formulario no emite avisos de deshabilitado, anchoCompleto o value sin onChange', () => {
    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <div>
        <Boton variante="primario" anchoCompleto deshabilitado={false}>
          Botón Test
        </Boton>
        <CampoTexto label="Campo Solo Lectura" id="test-read-only" value="Valor Fijo" />
      </div>
    );

    expect(screen.getByRole('button', { name: /botón test/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /botón test/i })).toHaveClass('btn-bloque');
    expect(screen.getByLabelText(/campo solo lectura/i)).toHaveAttribute('readonly');

    // No hubo warnings de React en consola
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
