import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TarjetaDato,
  BarraProgreso,
  Tabla,
  InsigniaEstado,
  CampoTexto,
  CampoSelect,
  Boton,
  EstadoVacio,
  DialogoConfirmar,
  NodoArbol
} from '../piezas';

describe('Bloque C · Las 8 Piezas del Sistema', () => {

  describe('1. TarjetaDato', () => {
    it('renderiza con datos correctamente', () => {
      render(<TarjetaDato rotulo="Puntos Grupales" valor="1,240" subrotulo="Agosto 2026" />);
      expect(screen.getByText('Puntos Grupales')).toBeInTheDocument();
      expect(screen.getByText('1,240')).toBeInTheDocument();
      expect(screen.getByText('Agosto 2026')).toBeInTheDocument();
    });

    it('renderiza estado vacío', () => {
      render(<TarjetaDato rotulo="Comisiones" estado="vacio" />);
      expect(screen.getByText('Comisiones')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renderiza estado cargando con esqueleto', () => {
      const { container } = render(<TarjetaDato estado="cargando" />);
      expect(container.querySelectorAll('.mg-skeleton').length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('2. BarraProgreso', () => {
    it('renderiza con datos y calcula porcentaje', () => {
      render(<BarraProgreso etiqueta="Activación Personal" valor={48} meta={70} unidad="pts" />);
      expect(screen.getByText('Activación Personal')).toBeInTheDocument();
      expect(screen.getByText('48')).toBeInTheDocument();
      expect(screen.getByText('/ 70 pts')).toBeInTheDocument();
    });

    it('NO sobrepasa el 100% cuando el valor excede la meta (regla innegociable)', () => {
      const { container } = render(<BarraProgreso etiqueta="Exceso" valor={150} meta={70} />);
      const fill = container.querySelector('.barra-progreso-fill');
      expect(fill).toBeInTheDocument();
      expect(fill.style.width).toBe('100%');
    });

    it('renderiza estado vacío (0%)', () => {
      render(<BarraProgreso etiqueta="Sin Puntos" estado="vacio" meta={70} />);
      expect(screen.getByText('0 / 70 pts')).toBeInTheDocument();
    });

    it('renderiza estado cargando', () => {
      const { container } = render(<BarraProgreso estado="cargando" />);
      expect(container.querySelectorAll('.mg-skeleton').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Tabla', () => {
    const columnas = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'puntos', label: 'Puntos' },
    ];
    const datos = [
      { id: 1, nombre: 'Carlos Ríos', puntos: 180 },
      { id: 2, nombre: 'Rosa Díaz', puntos: 94 },
    ];

    it('renderiza tabla con filas en escritorio y móvil', () => {
      render(<Tabla columnas={columnas} datos={datos} />);
      expect(screen.getAllByText('Carlos Ríos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rosa Díaz').length).toBeGreaterThanOrEqual(1);
    });

    it('renderiza EstadoVacio cuando datos es un array vacío (no tabla desierta)', () => {
      render(<Tabla columnas={columnas} datos={[]} vacioTitulo="Sin pedidos" />);
      expect(screen.getByText('Sin pedidos')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('renderiza estado cargando con esqueletos', () => {
      const { container } = render(<Tabla columnas={columnas} estado="cargando" />);
      expect(container.querySelectorAll('.mg-skeleton').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('4. InsigniaEstado', () => {
    it('renderiza estado confirmado y activo', () => {
      render(<InsigniaEstado estadoTipo="confirmado" />);
      expect(screen.getByText('Confirmado')).toBeInTheDocument();
    });

    it('renderiza estado vacío / neutral', () => {
      render(<InsigniaEstado estado="vacio" />);
      expect(screen.getByText('Sin estado')).toBeInTheDocument();
    });

    it('renderiza estado cargando', () => {
      const { container } = render(<InsigniaEstado estado="cargando" />);
      expect(container.querySelector('.mg-skeleton')).toBeInTheDocument();
    });
  });

  describe('5. Formulario', () => {
    it('renderiza campos y responde a eventos', () => {
      const handleChange = vi.fn();
      render(<CampoTexto label="Nombre" id="nombre" value="María" onChange={handleChange} />);
      expect(screen.getByLabelText(/Nombre/)).toHaveValue('María');
      fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Ana' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('renderiza estado cargando en campos', () => {
      const { container } = render(<CampoTexto label="Nombre" estado="cargando" />);
      expect(container.querySelectorAll('.mg-skeleton').length).toBeGreaterThanOrEqual(1);
    });

    it('maneja value sin onChange asignando readOnly sin lanzar advertencia', () => {
      render(<CampoTexto label="Solo Lectura" id="solo-lectura" value="Texto Fijo" />);
      const input = screen.getByLabelText(/Solo Lectura/);
      expect(input).toHaveValue('Texto Fijo');
      expect(input).toHaveAttribute('readonly');
    });

    it('Boton soporta anchoCompleto y deshabilitado sin pasarlos como atributos DOM inválidos', () => {
      const { container } = render(
        <Boton variante="primario" anchoCompleto deshabilitado={true}>
          Pagar Ahora
        </Boton>
      );
      const boton = container.querySelector('button');
      expect(boton).toBeDisabled();
      expect(boton).toHaveClass('btn-bloque');
      expect(boton).not.toHaveAttribute('anchocompleto');
      expect(boton).not.toHaveAttribute('deshabilitado');
    });
  });

  describe('6. EstadoVacio', () => {
    it('renderiza mensaje y botón de acción', () => {
      const handleAction = vi.fn();
      render(
        <EstadoVacio
          titulo="Todavía no tienes comisiones"
          mensaje="Aparecen acá después del cierre del mes."
          accionTexto="Ver cómo se generan"
          onAccion={handleAction}
        />
      );
      expect(screen.getByText('Todavía no tienes comisiones')).toBeInTheDocument();
      const btn = screen.getByText('Ver cómo se generan');
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe('7. DialogoConfirmar', () => {
    it('NO ejecuta onConfirmar hasta pulsar el botón de confirmar', () => {
      const onConfirmar = vi.fn();
      const onCancelar = vi.fn();

      render(
        <DialogoConfirmar
          abierto={true}
          titulo="¿Cerrar ciclo?"
          mensaje="Esta acción pagará a todos los socios."
          onConfirmar={onConfirmar}
          onCancelar={onCancelar}
        />
      );

      expect(screen.getByText('¿Cerrar ciclo?')).toBeInTheDocument();
      expect(onConfirmar).not.toHaveBeenCalled();

      // Click cancelar
      fireEvent.click(screen.getByText('Cancelar'));
      expect(onCancelar).toHaveBeenCalledTimes(1);
      expect(onConfirmar).not.toHaveBeenCalled();

      // Click confirmar
      fireEvent.click(screen.getByText('Confirmar'));
      expect(onConfirmar).toHaveBeenCalledTimes(1);
    });
  });

  describe('8. NodoArbol', () => {
    const socio = {
      id: '1',
      nombre: 'Carlos Ríos',
      pack: 'Gold',
      puntos: 180,
      activo: true
    };
    const hijo = {
      id: '2',
      nombre: 'Lucía Pérez',
      pack: 'Ejecutivo',
      puntos: 70,
      activo: true
    };

    it('renderiza nodo de socio y permite expandir descendientes', () => {
      render(<NodoArbol socio={socio} hijos={[hijo]} nivel={1} />);
      expect(screen.getByText('Carlos Ríos')).toBeInTheDocument();
      expect(screen.getByText('180 pts')).toBeInTheDocument();
      expect(screen.getByText('Lucía Pérez')).toBeInTheDocument();
    });

    it('GARANTÍA DE PRIVACIDAD (Ley 29733): No contiene teléfono ni correo', () => {
      const { container } = render(<NodoArbol socio={socio} hijos={[hijo]} />);
      const textoCompleto = container.textContent;
      expect(textoCompleto).not.toMatch(/@/);
      expect(textoCompleto).not.toMatch(/9\d{8}/); // Números de teléfono peruanos
    });

    it('renderiza estado cargando', () => {
      const { container } = render(<NodoArbol estado="cargando" />);
      expect(container.querySelectorAll('.mg-skeleton').length).toBeGreaterThanOrEqual(3);
    });
  });
});
