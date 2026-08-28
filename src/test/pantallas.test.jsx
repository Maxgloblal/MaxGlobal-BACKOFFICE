import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import P11PanelSocio from '../paginas/P11PanelSocio';
import P14MisComisiones from '../paginas/P14MisComisiones';
import P12MiRed from '../paginas/P12MiRed';
import P23BandejaConfirmacion from '../paginas/P23BandejaConfirmacion';
import P25CierreCiclo from '../paginas/P25CierreCiclo';

describe('Bloque E · Pantallas de Referencia del Sistema', () => {

  describe('P-11 Panel Principal del Socio', () => {
    it('muestra alerta de activación cuando faltan puntos y permite conmutar', () => {
      render(
        <MemoryRouter>
          <P11PanelSocio />
        </MemoryRouter>
      );
      expect(screen.getByText(/TE FALTAN 22 PUNTOS/i)).toBeInTheDocument();
      expect(screen.getByText(/1[,\s]?240/)).toBeInTheDocument();
      expect(screen.getByText('S/. 342.80')).toBeInTheDocument();

      // Simular socia activa
      fireEvent.click(screen.getByText(/Simular: Activa/i));
      expect(screen.getByText(/ESTÁS ACTIVA ESTE MES/i)).toBeInTheDocument();
    });
  });

  describe('P-14 Mis Comisiones — 🔴 La que más cuidado necesita', () => {
    it('muestra versión con comisiones por defecto', () => {
      render(
        <MemoryRouter>
          <P14MisComisiones />
        </MemoryRouter>
      );
      expect(screen.getByText('S/. 228.40')).toBeInTheDocument();
      expect(screen.getAllByText('Carlos Ríos').length).toBeGreaterThanOrEqual(1);
    });

    it('🔴 Versión en cero MUESTRA OBLIGATORIAMENTE el bloque de explicación', () => {
      render(
        <MemoryRouter>
          <P14MisComisiones />
        </MemoryRouter>
      );
      // Conmutar a versión en cero
      fireEvent.click(screen.getByText(/Simular: En Cero/i));

      expect(screen.getByText('S/. 0.00')).toBeInTheDocument();
      expect(screen.getByText(/No estuviste activa este mes/i)).toBeInTheDocument();
      expect(screen.getByText(/Te faltaron 22 puntos/i)).toBeInTheDocument();
      expect(screen.getByText(/regla de no compresión/i)).toBeInTheDocument();
    });
  });

  describe('P-12 Mi Red — Protección de Datos', () => {
    it('GARANTÍA LEY 29733: NO expone teléfono ni correo de la red', () => {
      const { container } = render(
        <MemoryRouter>
          <P12MiRed />
        </MemoryRouter>
      );
      expect(screen.getAllByText('Carlos Ríos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Total: 47 socios/i)).toBeInTheDocument();

      const texto = container.textContent;
      expect(texto).not.toMatch(/@/);
      expect(texto).not.toMatch(/9\d{8}/);
    });
  });

  describe('P-23 Bandeja de Confirmación', () => {
    it('muestra el pedido, el comprobante y el bloque de impacto', () => {
      render(
        <MemoryRouter>
          <P23BandejaConfirmacion />
        </MemoryRouter>
      );
      expect(screen.getByText(/Impacto en el Motor al Confirmar/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirmar Pago/i)).toBeInTheDocument();
      expect(screen.getByText(/Rechazar.../i)).toBeInTheDocument();
    });
  });

  describe('P-25 Cierre de Ciclo — 🔴 Vista Previa Obligatoria', () => {
    it('muestra la vista previa con todas las métricas antes de cualquier acción', () => {
      render(
        <MemoryRouter>
          <P25CierreCiclo />
        </MemoryRouter>
      );
      expect(screen.getByText(/VISTA PREVIA DEL CIERRE/i)).toBeInTheDocument();
      expect(screen.getByText('187')).toBeInTheDocument(); // socios que cobran
      expect(screen.getByText('S/. 42,380.00')).toBeInTheDocument(); // total a pagar
      expect(screen.getByText('313')).toBeInTheDocument(); // no cobran
    });

    it('abrir diálogo y pulsar cancelar NO ejecuta el cierre', () => {
      render(
        <MemoryRouter>
          <P25CierreCiclo />
        </MemoryRouter>
      );
      fireEvent.click(screen.getByText('Confirmar el Cierre'));
      expect(screen.getByText(/¿Ejecutar Cierre Definitivo de Ciclo?/i)).toBeInTheDocument();

      // Cancelar
      fireEvent.click(screen.getByText('Cancelar y Volver a Revisar'));
      expect(screen.queryByText(/¿Ejecutar Cierre Definitivo de Ciclo?/i)).not.toBeInTheDocument();
      expect(screen.getByText(/VISTA PREVIA DEL CIERRE/i)).toBeInTheDocument();
    });
  });
});
