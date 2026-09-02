import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import P11PanelSocio from '../paginas/P11PanelSocio';
import P14MisComisiones from '../paginas/P14MisComisiones';
import P15MiRango from '../paginas/P15MiRango';
import P19MiBilletera from '../paginas/P19MiBilletera';
import P12MiRed from '../paginas/P12MiRed';
import P23BandejaConfirmacion from '../paginas/P23BandejaConfirmacion';
import P25CierreCiclo from '../paginas/P25CierreCiclo';

vi.mock('../servicios/socio', () => ({
  obtenerPerfilSocio: vi.fn().mockResolvedValue({
    id: 2,
    nombres: 'MARIA',
    apellidos: 'QUISPE',
    codigo: 'MG00002',
    pack: { nombre: 'Pack Gold' }
  }),
  obtenerCiclos: vi.fn().mockResolvedValue([
    { id: 3, anio: 2026, mes: 8, nombre: 'Ciclo 3', estado: 'abierto' }
  ]),
  obtenerPanelPrincipal: vi.fn().mockResolvedValue({
    estaActivo: true,
    puntosPersonales: 72,
    puntosFaltantes: 0,
    puntosGrupales: 25270,
    puntosComputables: 3514,
    frontalesActivos: 2,
    rangoVigenteNombre: 'Sin Calificación',
    rangoHonorificoNombre: 'Platino',
    saldoDisponibleCent: 0,
    estimadoCicloCent: 5828736,
    diasRestantes: 6,
    cicloNombre: 'Ciclo 3 (Agosto 2026)'
  }),
  obtenerDesgloseComisiones: vi.fn().mockResolvedValue({
    exito: true,
    resumen: {
      socio_id: 2,
      ciclo_id: 3,
      socio_nombre: 'MARIA QUISPE',
      pack_nombre: 'Pack Gold',
      niveles_patrocinio: 7,
      niveles_residual: 10,
      activo: true,
      puntos_personales: 72,
      total_cobrado_cent: 5828736,
      total_patrocinio_cent: 5062560,
      total_residual_cent: 766176,
      total_rango_cent: 0,
      comisiones_count: 5
    },
    items: [
      {
        comision_id: 1,
        orden_id: 10,
        orden_codigo: 'ORD-2026-000010',
        tipo_bono: 'residual',
        generador_nombre: 'Carlos Ríos',
        generador_codigo: 'MG00010',
        nivel: 1,
        porcentaje: 40,
        base_puntos: 18,
        monto_cent: 720,
        pagado: true,
        motivo: 'Pagado exitosamente'
      },
      {
        comision_id: null,
        orden_id: 15,
        orden_codigo: 'ORD-2026-000015',
        tipo_bono: 'patrocinio',
        generador_nombre: 'Pedro Soto',
        generador_codigo: 'MG00015',
        nivel: 4,
        porcentaje: 2,
        base_cent: 40000,
        monto_cent: 0,
        pagado: false,
        motivo: 'No cobrado · tu pack Pack Ejecutivo habilita hasta el nivel 3'
      }
    ]
  }),
  obtenerMiRango: vi.fn().mockResolvedValue({
    exito: true,
    rango_ciclo: { califica: false, rango_nombre: 'Sin Calificación', puntos_computables: 3514, puntos_grupales: 25270, frontales_activos: 2, bono_cent: 0 },
    rango_honorifico: { nombre: 'Platino' },
    rango_siguiente: { nombre: 'Jade', puntos_grupales: 500, frontales_activos: 1, bono_cent: 5000 },
    lineas: [
      {
        frontal_id: 3,
        frontal_nombre: 'BRUNO ROJAS',
        frontal_codigo: 'MG00003',
        activo: false,
        puntos_totales_rama: 21214,
        puntos_computados: 250,
        tope_alcanzado: true
      }
    ],
    rangos_escala: [
      { id: 1, orden: 1, nombre: 'Jade', puntos_grupales: 500, frontales_activos: 1, bono_cent: 5000, definido: true },
      { id: 9, orden: 9, nombre: 'Diamante Negro', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false }
    ],
    tope_linea_evaluado: 250,
    puntos_objetivo_evaluado: 500
  }),
  obtenerMiBilletera: vi.fn().mockResolvedValue({
    saldoDisponibleCent: 0,
    estimadoCicloCent: 5828736,
    montoMinimoRetiroCent: 10000,
    movimientos: [],
    solicitudes: []
  })
}));

describe('Bloque E · Pantallas de Referencia del Sistema', () => {
  describe('P-11 Panel Principal del Socio', () => {
    it('muestra alerta de activación cuando está activo y sus métricas', async () => {
      render(
        <MemoryRouter>
          <P11PanelSocio />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/ESTÁS ACTIVO ESTE MES/i)).toBeInTheDocument();
      });
      expect(screen.getAllByText(/Puntos Personales/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Puntos Grupales/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('P-14 Mis Comisiones — 🔴 La que más cuidado necesita', () => {
    it('muestra versión con comisiones y explicaciones de no pago', async () => {
      render(
        <MemoryRouter>
          <P14MisComisiones />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Mis Comisiones/i)).toBeInTheDocument();
      });
      expect(screen.getAllByText(/Carlos Ríos/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/habilita hasta el nivel 3/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('P-15 Mi Rango — Visualización de Línea Estirada', () => {
    it('renderiza la regla de línea estirada y la escala', async () => {
      render(
        <MemoryRouter>
          <P15MiRango />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Mi Rango/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Regla de Línea Estirada/i)).toBeInTheDocument();
      expect(screen.getAllByText(/BRUNO ROJAS/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/⚠️ Tope 250 pts/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('P-19 Mi Billetera', () => {
    it('muestra saldo disponible 0 y estimado diferenciado', async () => {
      render(
        <MemoryRouter>
          <P19MiBilletera />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Mi Billetera/i)).toBeInTheDocument();
      });
      expect(screen.getAllByText(/Saldo Disponible/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Comisión Estimada/i).length).toBeGreaterThanOrEqual(1);
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
    it('muestra el encabezado oficial y la interfaz de bandeja', () => {
      render(
        <MemoryRouter>
          <P23BandejaConfirmacion />
        </MemoryRouter>
      );
      expect(screen.getByText(/Bandeja de Confirmación/i)).toBeInTheDocument();
      expect(screen.getByText(/Revisión de comprobantes bancarios/i)).toBeInTheDocument();
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
      expect(screen.getByText('187')).toBeInTheDocument();
      expect(screen.getByText('S/. 42,380.00')).toBeInTheDocument();
      expect(screen.getByText('313')).toBeInTheDocument();
    });
  });
});
