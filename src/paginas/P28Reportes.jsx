import React, { useState, useEffect } from 'react';
import { obtenerReporteCicloAdmin } from '../servicios/operacionAdmin';
import { formatearSoles } from '../utilidades/dinero';
import { Boton } from '../piezas';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  PieChart,
  Award,
  Users,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

/**
 * P-28 · Reportes Financieros y Operativos
 * - Selector de ciclo con métricas recaudadas vs comisiones
 * - Margen de la empresa calculado exactamente
 * - Desglose de bonos, Top 10 socios y distribución por pack
 * - Exportación de reporte consolidado en CSV desde el cliente
 */
export default function P28Reportes() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(3);
  const [reporte, setReporte] = useState(null);

  useEffect(() => {
    cargarReporte(cicloSeleccionado);
  }, [cicloSeleccionado]);

  async function cargarReporte(cId) {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerReporteCicloAdmin(cId);
      setReporte(data);
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      setError(err.message || 'Error al obtener los datos del reporte.');
    } finally {
      setCargando(false);
    }
  }

  const exportarCSV = () => {
    if (!reporte) return;

    let csv = `REPORTE FINANCIERO Y OPERATIVO · MAX GLOBAL CORPORATION\n`;
    csv += `Ciclo:;${reporte.cicloActual?.id} (${reporte.cicloActual?.mes || ''}/${reporte.cicloActual?.anio || ''})\n`;
    csv += `Generado el:;${new Date().toLocaleString()}\n\n`;

    csv += `RESUMEN FINANCIERO\n`;
    csv += `Total Recaudado:;S/. ${reporte.totalRecaudadoSoles.toFixed(2)}\n`;
    csv += `  - Ventas a Socios:;S/. ${(reporte.totalSocioSoles || 0).toFixed(2)} (${reporte.ordenesSocioCount || 0} pedidos)\n`;
    csv += `  - Ventas a Clientes Finales:;S/. ${(reporte.totalClienteSoles || 0).toFixed(2)} (${reporte.ordenesClienteCount || 0} pedidos)\n`;
    csv += `Total Pagado en Comisiones:;S/. ${reporte.totalComisionesSoles.toFixed(2)}\n`;
    csv += `Margen Neto Empresa:;S/. ${reporte.margenEmpresaSoles.toFixed(2)} (${reporte.margenPorcentaje}%)\n\n`;

    csv += `DISTRIBUCIÓN DE BONOS\n`;
    csv += `Tipo de Bono;Monto (S/.);Cantidad Pagos;Socios Beneficiados\n`;
    csv += `Bono Patrocinio;${reporte.desgloseBonos.patrocinio.totalSoles.toFixed(2)};${reporte.desgloseBonos.patrocinio.cantidad};${reporte.desgloseBonos.patrocinio.socios}\n`;
    csv += `Bono Residual;${reporte.desgloseBonos.residual.totalSoles.toFixed(2)};${reporte.desgloseBonos.residual.cantidad};${reporte.desgloseBonos.residual.socios}\n`;
    csv += `Bono Rango;${reporte.desgloseBonos.rango.totalSoles.toFixed(2)};${reporte.desgloseBonos.rango.cantidad};${reporte.desgloseBonos.rango.socios}\n`;
    csv += `Bono Global;${reporte.desgloseBonos.global.totalSoles.toFixed(2)};${reporte.desgloseBonos.global.cantidad};${reporte.desgloseBonos.global.socios}\n`;
    csv += `TOTAL;${reporte.totalComisionesSoles.toFixed(2)};-;\n\n`;

    csv += `TOP 10 SOCIOS CON MAYORES COMISIONES\n`;
    csv += `Posición;Código;Nombre Completo;Pack;Total Comisiones (S/.)\n`;
    reporte.top10Socios.forEach((s, idx) => {
      csv += `${idx + 1};${s.codigo};${s.nombreCompleto};${s.pack};${(s.totalCent / 100).toFixed(2)}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-ciclo-${reporte.cicloActual?.id}-maxglobal.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (cargando && !reporte) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <RefreshCw className="icono-giratorio" size={32} style={{ color: 'var(--gold-500)', marginBottom: 'var(--sp-3)' }} />
          <p className="seccion-desc">Cargando reporte financiero y consolidado del ciclo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-contenedor">
      {/* ENCABEZADO */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-28</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Reportes del Negocio</h1>
            <p className="pagina-subtitulo">
              Consolidado financiero, márgenes de utilidad, desglose de bonos y ranking de comisiones
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} className="txt-muted" />
              <select
                className="campo-input"
                value={cicloSeleccionado}
                onChange={(e) => setCicloSeleccionado(Number(e.target.value))}
                style={{ fontSize: '13px', padding: '6px 12px', minWidth: '130px' }}
              >
                {(reporte?.ciclos || []).map(c => (
                  <option key={c.id} value={c.id}>
                    Ciclo {c.id} ({c.mes}/{c.anio}) {c.estado === 'abierto' ? '· Activo' : ''}
                  </option>
                ))}
              </select>
            </div>
            <Boton variante="secundario" onClick={exportarCSV} style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Download size={15} /> Exportar CSV
            </Boton>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} className="txt-gold" />
            <strong className="txt-sm txt-gold">{error}</strong>
          </div>
        </div>
      )}

      {/* TARJETAS FINANCIERAS PRINCIPALES (RF-431) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)' }}>
        {/* RECAUDADO */}
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--gold-500)', padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">TOTAL RECAUDADO</span>
            <DollarSign size={20} style={{ color: 'var(--gold-500)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 4px 0', color: 'var(--texto-principal)' }}>
            {formatearSoles(reporte?.totalRecaudadoCent)}
          </div>
          <span className="txt-xs txt-muted">Órdenes confirmadas y pagadas</span>
        </div>

        {/* PAGADO EN COMISIONES */}
        <div className="panel-blanco" style={{ borderLeft: '4px solid #3B82F6', padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">PAGADO EN COMISIONES</span>
            <TrendingUp size={20} style={{ color: '#3B82F6' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 4px 0', color: 'var(--gold-700)' }}>
            {formatearSoles(reporte?.totalComisionesCent)}
          </div>
          <span className="txt-xs txt-muted">
            {reporte?.totalRecaudadoCent > 0
              ? `${((reporte.totalComisionesCent / reporte.totalRecaudadoCent) * 100).toFixed(1)}% del total recaudado`
              : 'Sin recaudación en el ciclo'}
          </span>
        </div>

        {/* MARGEN EMPRESA */}
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--green-600)', padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">MARGEN EMPRESA</span>
            <PieChart size={20} style={{ color: 'var(--green-600)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 4px 0', color: 'var(--green-700)' }}>
            {formatearSoles(reporte?.margenEmpresaCent)}
          </div>
          <span className="txt-xs txt-muted">
            {reporte?.margenPorcentaje}% de retención operativa
          </span>
        </div>
      </div>

      {/* SEPARACIÓN VENTAS SOCIOS VS CLIENTES FINALES (TAREA-16) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
        <div className="panel-blanco" style={{ borderLeft: '4px solid #6366f1', padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">VENTAS A SOCIOS (DESCUENTO SEGÚN PACK)</span>
            <Users size={18} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '6px 0 2px 0', color: 'var(--texto-principal)' }}>
            {formatearSoles(reporte?.totalSocioCent)}
          </div>
          <span className="txt-xs txt-muted">
            {reporte?.ordenesSocioCount || 0} pedidos confirmados/pagados
          </span>
        </div>

        <div className="panel-blanco" style={{ borderLeft: '4px solid #0284c7', padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">VENTAS A CLIENTES FINALES (PRECIO PÚBLICO)</span>
            <ShoppingBag size={18} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '6px 0 2px 0', color: '#0284c7' }}>
            {formatearSoles(reporte?.totalClienteCent)}
          </div>
          <span className="txt-xs txt-muted">
            {reporte?.ordenesClienteCount || 0} pedidos a precio de lista oficial (0% descuento)
          </span>
        </div>
      </div>

      {/* SECCIÓN 1: DESGLOSE POR TIPO DE BONO (RF-432) */}
      <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--borde)' }}>
          <h3 className="seccion-titulo" style={{ margin: 0, fontSize: '15px' }}>
            Distribución por Tipo de Bono (Ciclo {cicloSeleccionado})
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-limpia" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--fondo-suave)', borderBottom: '1px solid var(--borde)' }}>
                <th style={{ padding: '10px var(--sp-4)' }}>Bono</th>
                <th style={{ padding: '10px var(--sp-4)' }}>Monto Pagado</th>
                <th style={{ padding: '10px var(--sp-4)' }}>% del Total</th>
                <th style={{ padding: '10px var(--sp-4)' }}>Cantidad Pagos</th>
                <th style={{ padding: '10px var(--sp-4)' }}>Socios Beneficiarios</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>Bono Patrocinio</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>{formatearSoles(reporte?.desgloseBonos?.patrocinio?.totalCent)}</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}>
                  {reporte?.totalComisionesCent > 0 ? `${((reporte.desgloseBonos.patrocinio.totalCent / reporte.totalComisionesCent) * 100).toFixed(1)}%` : '0%'}
                </td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.patrocinio?.cantidad} comisiones</td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.patrocinio?.socios} socios</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>Bono Residual</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>{formatearSoles(reporte?.desgloseBonos?.residual?.totalCent)}</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}>
                  {reporte?.totalComisionesCent > 0 ? `${((reporte.desgloseBonos.residual.totalCent / reporte.totalComisionesCent) * 100).toFixed(1)}%` : '0%'}
                </td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.residual?.cantidad} comisiones</td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.residual?.socios} socios</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>Bono Rango</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>{formatearSoles(reporte?.desgloseBonos?.rango?.totalCent)}</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}>
                  {reporte?.totalComisionesCent > 0 ? `${((reporte.desgloseBonos.rango.totalCent / reporte.totalComisionesCent) * 100).toFixed(1)}%` : '0%'}
                </td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.rango?.cantidad} comisiones</td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.rango?.socios} socios</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>Bono Global</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}><strong>{formatearSoles(reporte?.desgloseBonos?.global?.totalCent)}</strong></td>
                <td style={{ padding: '10px var(--sp-4)' }}>0%</td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.global?.cantidad} comisiones</td>
                <td style={{ padding: '10px var(--sp-4)' }}>{reporte?.desgloseBonos?.global?.socios} socios</td>
              </tr>
              <tr style={{ backgroundColor: 'var(--fondo-suave)', fontWeight: 'bold' }}>
                <td style={{ padding: '12px var(--sp-4)' }}>TOTAL COMISIONES</td>
                <td style={{ padding: '12px var(--sp-4)', color: 'var(--gold-700)' }}>{formatearSoles(reporte?.totalComisionesCent)}</td>
                <td style={{ padding: '12px var(--sp-4)' }}>100.0%</td>
                <td style={{ padding: '12px var(--sp-4)' }}>
                  {(reporte?.desgloseBonos?.patrocinio?.cantidad || 0) + (reporte?.desgloseBonos?.residual?.cantidad || 0) + (reporte?.desgloseBonos?.rango?.cantidad || 0)}
                </td>
                <td style={{ padding: '12px var(--sp-4)' }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 2: TOP 10 SOCIOS (RF-433) Y DISTRIBUCIÓN POR PACK (RF-434) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--sp-5)' }}>
        {/* TOP 10 SOCIOS */}
        <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--borde)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--gold-500)' }} />
            <strong className="txt-sm">Top 10 Socios por Comisiones (Ciclo {cicloSeleccionado})</strong>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-limpia" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', backgroundColor: 'var(--fondo-suave)', borderBottom: '1px solid var(--borde)' }}>
                  <th style={{ padding: '8px 12px' }}>#</th>
                  <th style={{ padding: '8px 12px' }}>Socio</th>
                  <th style={{ padding: '8px 12px' }}>Pack</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Cobrado</th>
                </tr>
              </thead>
              <tbody>
                {(reporte?.top10Socios || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--sp-4)', color: 'var(--texto-muted)' }}>
                      No hay comisiones registradas en este ciclo.
                    </td>
                  </tr>
                ) : (
                  reporte.top10Socios.map((s, idx) => (
                    <tr key={s.socio_id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                      <td style={{ padding: '8px 12px' }}><strong>{idx + 1}</strong></td>
                      <td style={{ padding: '8px 12px' }}>
                        <strong className="txt-principal">{s.nombreCompleto}</strong>
                        <div className="txt-xs txt-muted">{s.codigo}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span className="badge badge-oro" style={{ fontSize: '10px' }}>
                          {s.pack}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <strong>{formatearSoles(s.totalCent)}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DISTRIBUCIÓN POR PACK */}
        <div className="panel-blanco" style={{ padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-4)', borderBottom: '1px solid var(--borde)', paddingBottom: 'var(--sp-3)' }}>
            <Users size={18} style={{ color: 'var(--gold-500)' }} />
            <strong className="txt-sm">Distribución de Socios por Pack Oficial</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {(reporte?.distribucionPacks || []).map(p => (
              <div key={p.nombre}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <strong>{p.nombre}</strong>
                  <span className="txt-muted">{p.cantidad} socios ({p.porcentaje}%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--fondo-suave)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${p.porcentaje}%`,
                      backgroundColor: 'var(--gold-500)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--borde)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-2)' }}>
              <CreditCard size={16} className="txt-muted" />
              <strong className="txt-xs">Estado Global de Solicitudes de Retiro</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span className="txt-muted">Total Solicitado: <strong>{formatearSoles(reporte?.retiros?.solicitadosCent)}</strong></span>
              <span className="txt-muted">Total Procesado: <strong className="txt-green">{formatearSoles(reporte?.retiros?.procesadosCent)}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
