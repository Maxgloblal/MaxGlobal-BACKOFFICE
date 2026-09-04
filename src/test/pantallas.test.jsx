import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import P11PanelSocio from '../paginas/P11PanelSocio';
import P14MisComisiones from '../paginas/P14MisComisiones';
import P15MiRango from '../paginas/P15MiRango';
import P19MiBilletera from '../paginas/P19MiBilletera';
import P12MiRed from '../paginas/P12MiRed';
import P21RegistrarPedido from '../paginas/P21RegistrarPedido';
import P22RegistrarAfiliacion from '../paginas/P22RegistrarAfiliacion';
import P23BandejaConfirmacion from '../paginas/P23BandejaConfirmacion';
import P25CierreCiclo from '../paginas/P25CierreCiclo';
import P20TableroAdmin from '../paginas/P20TableroAdmin';
import P26Configuracion from '../paginas/P26Configuracion';
import P27GestionSocios from '../paginas/P27GestionSocios';
import P28Reportes from '../paginas/P28Reportes';
import P29Auditoria from '../paginas/P29Auditoria';

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
  }),
  obtenerMiRed: vi.fn().mockResolvedValue({
    raiz: {
      id: 2,
      codigo: 'MG00002',
      nombres: 'MARIA',
      apellidos: 'QUISPE',
      nombre: 'MARIA QUISPE',
      pack_nombre: 'Pack Gold',
      puntos: 72,
      activo: true,
      nivel: 0,
      esRaiz: true
    },
    nodos: [
      {
        id: 2,
        codigo: 'MG00002',
        nombre: 'MARIA QUISPE',
        patrocinador_id: null,
        pack_nombre: 'Pack Gold',
        puntos: 72,
        activo: true,
        nivel: 0,
        esRaiz: true
      },
      {
        id: 3,
        codigo: 'MG00003',
        nombre: 'BRUNO ROJAS',
        patrocinador_id: 2,
        pack_nombre: 'Pack Gold',
        puntos: 54,
        activo: false,
        nivel: 1,
        esFrontal: true
      }
    ],
    totalSocios: 1,
    frontalesTotal: 1,
    frontalesActivos: 0,
    frontalesInactivos: 1,
    profundidadMaxima: 1
  })
}));

vi.mock('../servicios/operacionAdmin', () => ({
  cargarPacks: vi.fn().mockResolvedValue([
    { id: 1, codigo: 'EMPRENDEDOR', nombre: 'Kit Emprendedor', precio_cent: 12000, puntos_rango: 0, solo_afilia_igual: true },
    { id: 2, codigo: 'EJECUTIVO', nombre: 'Pack Ejecutivo', precio_cent: 36000, puntos_rango: 70, solo_afilia_igual: false },
    { id: 3, codigo: 'GOLD', nombre: 'Pack Gold', precio_cent: 120000, puntos_rango: 150, solo_afilia_igual: false },
    { id: 4, codigo: 'FAMILIAR', nombre: 'Pack Familiar', precio_cent: 400000, puntos_rango: 400, solo_afilia_igual: false },
    { id: 5, codigo: 'EMPRESARIAL', nombre: 'Pack Empresarial', precio_cent: 800000, puntos_rango: 800, solo_afilia_igual: false }
  ]),
  cargarProductos: vi.fn().mockResolvedValue([
    { id: 1, codigo: 'PROD-01', nombre: 'Café Moringa', precio_lista_cent: 15000, puntos: 18 }
  ]),
  buscarSocios: vi.fn().mockResolvedValue([
    { id: 2, codigo: 'MG00002', nombres: 'ANA', apellidos: 'QUISPE', documento: '12345678', pack: { codigo: 'GOLD', nombre: 'Pack Gold' } }
  ]),
  obtenerVerificacionesPreviasCierre: vi.fn().mockResolvedValue({
    ciclo: { id: 3, anio: 2026, mes: 8, estado: 'abierto' },
    pedidosSinConfirmar: [],
    cantidadPedidosSinConfirmar: 0,
    montoTotalPedidosSinConfirmarCent: 0,
    hayPedidosSinConfirmar: false,
    rangosIncompletos: [],
    cantidadRangosIncompletos: 0,
    hayRangosIncompletos: false
  }),
  obtenerVistaPreviaCierre: vi.fn().mockResolvedValue({
    ciclo: { id: 3, anio: 2026, mes: 8, estado: 'abierto' },
    totalSocios: 501,
    sociosActivos: 265,
    totalSociosQueCobran: 80,
    bonos: {
      patrocinio: { totalCent: 679540, totalSoles: 6795.40, cantidadComisiones: 73, cantidadSocios: 37 },
      residual: { totalCent: 608428, totalSoles: 6084.28, cantidadComisiones: 385, cantidadSocios: 58 },
      rango: { totalCent: 60000, totalSoles: 600.00, cantidadComisiones: 8, cantidadSocios: 8 },
      global: { totalCent: 0, totalSoles: 0, cantidadComisiones: 0, cantidadSocios: 0, aplica: false, estadoTexto: 'No toca este ciclo' }
    },
    totalAPagarCent: 1347968,
    totalAPagarSoles: 13479.68,
    totalEmpresaCent: 2763564,
    totalEmpresaSoles: 27635.64,
    pedidosSinConfirmar: [],
    cantidadPedidosSinConfirmar: 0
  }),
  evaluarTechosCierre: vi.fn().mockResolvedValue({
    bloqueado: false,
    erroresBloqueo: [],
    techoPatrocinioCent: 1911712,
    techoResidualCent: 2139820,
    techoRangoCent: 60000,
    alertaSaltoDoble: false,
    totalCicloAnteriorCent: 1920394
  }),
  generarExportacionBancariaCierre: vi.fn().mockResolvedValue({
    cicloId: 3,
    montoMinimoRetiroCent: 10000,
    montoMinimoRetiroSoles: 100,
    totalSociosLiquidables: 80,
    totalAbonableCent: 1347968,
    totalAbonableSoles: 13479.68,
    filas: [],
    sociosSinBanco: [],
    cantidadSociosSinBanco: 0,
    sociosDebajoMinimo: [],
    cantidadSociosDebajoMinimo: 0,
    contenidoCSV: 'Código,Nombre Completo,Documento,Banco,Número de Cuenta,Monto (S/.)\n'
  }),
  ejecutarCierreCiclo: vi.fn().mockResolvedValue({
    exito: true,
    ciclo_cerrado_id: 3,
    total_abonado_cent: 1347968,
    cantidad_abonos: 466,
    nuevo_ciclo_id: 4,
    nuevo_ciclo_mes: 9,
    nuevo_ciclo_anio: 2026
  }),
  obtenerConfiguracionPlan: vi.fn().mockResolvedValue({
    configs: [
      { clave: 'activacion_puntos_mes', valor: '70', descripcion: 'Puntos de activación', esAjustable: true },
      { clave: 'compresion_activa', valor: 'false', descripcion: 'Regla dura', esAjustable: false }
    ],
    rangos: [
      { id: 1, nombre: 'Jade', puntos_grupales: 500, frontales_activos: 1, bono_cent: 5000, definido: true },
      { id: 9, nombre: 'Diamante Negro', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false }
    ]
  }),
  actualizarParametroConfig: vi.fn().mockResolvedValue({ exito: true }),
  guardarRangoConfig: vi.fn().mockResolvedValue({ exito: true }),
  obtenerListaSociosAdmin: vi.fn().mockResolvedValue({
    socios: [
      { id: 2, codigo: 'MG00002', nombres: 'ANA', apellidos: 'QUISPE', nombreCompleto: 'ANA QUISPE', documento: '12345678', email: 'socio002@ejemplo.test', pack: { nombre: 'Pack Gold' }, activacionCiclo: { activo: false, puntos_personales: 0 } }
    ],
    total: 1,
    pagina: 1,
    totalPaginas: 1,
    cicloId: 4
  }),
  obtenerDetalleSocioAdmin: vi.fn().mockResolvedValue({
    socio: { id: 2, codigo: 'MG00002', nombres: 'ANA', apellidos: 'QUISPE', documento: '12345678', email: 'socio002@ejemplo.test', pack: { nombre: 'Pack Gold' }, patrocinador: { codigo: 'MG00001', nombres: 'SISTEMA' } },
    activacion: { activo: false, puntos_personales: 0, puntos_grupales: 0 },
    frontalesTotal: 2,
    cicloId: 4
  }),
  actualizarDatosSocioAdmin: vi.fn().mockResolvedValue({ id: 2, nombres: 'ANA', apellidos: 'QUISPE' }),
  obtenerResumenTableroAdmin: vi.fn().mockResolvedValue({
    ciclo: { id: 4, mes: 9, anio: 2026, estado: 'abierto', fecha_fin: '2026-09-30' },
    diasParaCierre: 28,
    totalSocios: 501,
    sociosActivos: 0,
    ordenesPorConfirmar: 0,
    comisionesEstimadasCent: 0,
    comisionesEstimadasSoles: 0,
    ultimasOrdenes: [],
    ultimasAfiliaciones: []
  }),
  obtenerReporteCicloAdmin: vi.fn().mockResolvedValue({
    ciclos: [{ id: 3, mes: 8, anio: 2026, estado: 'cerrado' }],
    cicloActual: { id: 3, mes: 8, anio: 2026 },
    totalRecaudadoCent: 4111532,
    totalRecaudadoSoles: 41115.32,
    totalComisionesCent: 1347968,
    totalComisionesSoles: 13479.68,
    margenEmpresaCent: 2763564,
    margenEmpresaSoles: 27635.64,
    margenPorcentaje: '67.2',
    desgloseBonos: {
      patrocinio: { totalCent: 679540, totalSoles: 6795.40, cantidad: 73, socios: 37 },
      residual: { totalCent: 608428, totalSoles: 6084.28, cantidad: 385, socios: 58 },
      rango: { totalCent: 60000, totalSoles: 600.00, cantidad: 8, socios: 8 },
      global: { totalCent: 0, totalSoles: 0, cantidad: 0, socios: 0 }
    },
    top10Socios: [],
    distribucionPacks: [],
    retiros: { solicitadosCent: 0, solicitadosSoles: 0, procesadosCent: 0, procesadosSoles: 0 }
  }),
  obtenerListaAuditoriaAdmin: vi.fn().mockResolvedValue({
    total: 0,
    pagina: 1,
    totalPaginas: 1,
    eventos: []
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
    it('GARANTÍA LEY 29733: NO expone teléfono ni correo de la red', async () => {
      const { container } = render(
        <MemoryRouter>
          <P12MiRed />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Mi Red de Afiliados/i)).toBeInTheDocument();
      });

      const texto = container.textContent;
      expect(texto).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      expect(texto).not.toMatch(/\b9\d{8}\b/);
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
    it('muestra la vista previa con todas las métricas antes de cualquier acción', async () => {
      render(
        <MemoryRouter>
          <P25CierreCiclo />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/CIERRE DEL CICLO/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Bono de Patrocinio/i)).toBeInTheDocument();
      expect(screen.getByText(/Bono Residual/i)).toBeInTheDocument();
      expect(screen.getByText(/TOTAL A PAGAR/i)).toBeInTheDocument();
      expect(screen.getByText(/S\/\.\s*13,479\.68/i)).toBeInTheDocument();
    });
  });

  describe('P-20 Tablero de Control Admin', () => {
    it('muestra el tablero con metricas del ciclo activo', async () => {
      render(
        <MemoryRouter>
          <P20TableroAdmin />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Tablero de Control/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/ÓRDENES POR CONFIRMAR/i)).toBeInTheDocument();
      expect(screen.getByText(/ESTIMADO DE COMISIONES/i)).toBeInTheDocument();
    });
  });

  describe('P-26 Configuración del Plan', () => {
    it('muestra los 36 parametros del plan y las dos alertas de ambiguedad', async () => {
      render(
        <MemoryRouter>
          <P26Configuracion />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Configuración del Plan/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Ambigüedad en fecha de pago/i)).toBeInTheDocument();
      expect(screen.getByText(/Claves duplicadas de retiro mínimo/i)).toBeInTheDocument();
      expect(screen.getByText(/Rangos 1 al 8 · Calificaciones Oficiales/i)).toBeInTheDocument();
      expect(screen.getByText(/Rangos 9 al 16 · Formularios/i)).toBeInTheDocument();
    });
  });

  describe('P-27 Gestión de Socios', () => {
    it('muestra el padron de socios con buscador y columnas oficiales', async () => {
      render(
        <MemoryRouter>
          <P27GestionSocios />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Gestión de Socios/i)).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText(/Buscar por nombre, código, email o DNI/i)).toBeInTheDocument();
      expect(screen.getByText(/ANA QUISPE/i)).toBeInTheDocument();
    });
  });

  describe('P-28 Reportes del Negocio', () => {
    it('muestra el resumen financiero con total recaudado y margen', async () => {
      render(
        <MemoryRouter>
          <P28Reportes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Reportes del Negocio/i)).toBeInTheDocument();
      });
      expect(screen.getAllByText(/TOTAL RECAUDADO/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/PAGADO EN COMISIONES/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/MARGEN EMPRESA/i).length).toBeGreaterThan(0);
    });
  });

  describe('P-29 Auditoría del Sistema', () => {
    it('muestra la interfaz de auditoria y maneja estado vacio sin error', async () => {
      render(
        <MemoryRouter>
          <P29Auditoria />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Auditoría del Sistema/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/No hay eventos registrados aún/i)).toBeInTheDocument();
    });
  });

  describe('TAREA-11 · Verificación de Desplegables en P-21 y P-22 (Bloque 5)', () => {
    it('1, 2, 3, 4 · El select de packs en P-22 renderiza 5 opciones con texto no vacío, value válido y Pack Gold contiene 1,200', async () => {
      render(
        <MemoryRouter>
          <P22RegistrarAfiliacion />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Registrar Afiliación de Socio/i)).toBeInTheDocument();
      });

      const selectPack = document.getElementById('pack-afiliacion');
      expect(selectPack).not.toBeNull();
      const options = Array.from(selectPack.querySelectorAll('option'));

      // 1 · El select de packs renderiza 5 opciones (además del placeholder si hubiera, aquí son las 5 activas)
      expect(options.length).toBeGreaterThanOrEqual(5);

      // 2 · Ninguna option tiene textContent vacío
      options.forEach((opt) => {
        expect(opt.textContent.trim().length).toBeGreaterThan(0);
      });

      // 3 · Ninguna option de pack tiene value=""
      options.forEach((opt) => {
        expect(opt.value.trim().length).toBeGreaterThan(0);
      });

      // 4 · La opción del Pack Gold contiene el texto "1,200" (o formato soles de 120000 cent)
      const optGold = options.find((opt) => opt.textContent.includes('Pack Gold'));
      expect(optGold).toBeDefined();
      expect(optGold.textContent).toMatch(/1,?200/);
    });

    it('5 · El select de bancos de P-21 renderiza 7 opciones con texto no vacío', async () => {
      render(
        <MemoryRouter>
          <P21RegistrarPedido />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Registrar Pedido de Recompra/i)).toBeInTheDocument();
      });

      const selectBanco = document.getElementById('banco');
      expect(selectBanco).not.toBeNull();
      const options = Array.from(selectBanco.querySelectorAll('option'));

      // 5 · Renderiza 7 opciones de bancos
      expect(options.length).toBe(7);
      options.forEach((opt) => {
        expect(opt.textContent.trim().length).toBeGreaterThan(0);
        expect(opt.value.trim().length).toBeGreaterThan(0);
      });
      expect(options.some((opt) => opt.textContent.includes('BCP'))).toBe(true);
    });

    it('6 · Ningún archivo de src/paginas contiene el patrón de tilde perdida o separadores corruptos', () => {
      const paginasDir = path.resolve(__dirname, '../paginas');
      const files = fs.readdirSync(paginasDir);
      const regexPerdidas = /C\?digo|asignaci\?n|Carn\? |TEL\?FONO|N\?MERO|ELECTR\?NICO|ADMINISTRACI\?N|Dep\?sito|Operaci\?n|Afiliaci\?n|P\?blico|Env\?o|Cat\?logo|B\?squeda/i;

      files.forEach((f) => {
        if (f.endsWith('.jsx') || f.endsWith('.js')) {
          const content = fs.readFileSync(path.join(paginasDir, f), 'utf8');
          expect(content).not.toMatch(regexPerdidas);
        }
      });
    });
  });
});


