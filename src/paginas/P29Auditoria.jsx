import React, { useState, useEffect } from 'react';
import { obtenerListaAuditoriaAdmin } from '../servicios/operacionAdmin';
import { Boton } from '../piezas';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  Clock,
  Terminal,
  AlertCircle
} from 'lucide-react';

/**
 * P-29 · Auditoría del Sistema (Admin)
 * - Registro inmutable de acciones de administración
 * - Filtros por acción, tabla y rango de fechas
 * - Visualizador de datos_antes y datos_despues en JSON formateado
 * - Manejo seguro de tabla vacía ("No hay eventos registrados aún")
 */
export default function P29Auditoria() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros y paginación
  const [eventos, setEventos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Modal JSON
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  useEffect(() => {
    cargarAuditoria();
  }, [pagina, filtroAccion, filtroTabla]);

  async function cargarAuditoria() {
    try {
      setCargando(true);
      setError(null);
      const res = await obtenerListaAuditoriaAdmin({
        pagina,
        limite: 25,
        accion: filtroAccion || null,
        tabla: filtroTabla || null,
        fechaDesde: fechaDesde || null,
        fechaHasta: fechaHasta || null
      });
      setEventos(res.eventos || []);
      setTotal(res.total || 0);
      setTotalPaginas(res.totalPaginas || 1);
    } catch (err) {
      console.error('Error al cargar auditoría:', err);
      setError(err.message || 'Error al obtener los eventos de auditoría.');
    } finally {
      setCargando(false);
    }
  }

  const handleFiltrarFechas = (e) => {
    e.preventDefault();
    setPagina(1);
    cargarAuditoria();
  };

  return (
    <div className="pagina-contenedor">
      {/* ENCABEZADO */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-29</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Auditoría del Sistema</h1>
            <p className="pagina-subtitulo">
              Trazabilidad inmutable de eventos, modificaciones operativas y confirmaciones críticas
            </p>
          </div>
          <span className="armazon-admin-cycle-badge">
            <ShieldCheck size={16} />
            <span>{total} Eventos Registrados</span>
          </span>
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

      {/* FILTROS DE AUDITORÍA */}
      <div className="panel-blanco" style={{ padding: 'var(--sp-4)' }}>
        <form onSubmit={handleFiltrarFechas} style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '180px' }}>
            <select
              className="campo-input"
              value={filtroAccion}
              onChange={(e) => { setFiltroAccion(e.target.value); setPagina(1); }}
              style={{ fontSize: '13px' }}
            >
              <option value="">Todas las Acciones</option>
              <option value="INSERT">INSERT (Creación)</option>
              <option value="UPDATE">UPDATE (Modificación)</option>
              <option value="DELETE">DELETE (Eliminación)</option>
              <option value="CONFIRMAR_PAGO">CONFIRMAR_PAGO</option>
              <option value="RECHAZAR_PAGO">RECHAZAR_PAGO</option>
              <option value="CIERRE_CICLO">CIERRE_CICLO</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="campo-input"
              value={filtroTabla}
              onChange={(e) => { setFiltroTabla(e.target.value); setPagina(1); }}
              style={{ fontSize: '13px' }}
            >
              <option value="">Todas las Tablas</option>
              <option value="orden">orden</option>
              <option value="comision">comision</option>
              <option value="ciclo">ciclo</option>
              <option value="socio">socio</option>
              <option value="config">config</option>
              <option value="rango">rango</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="txt-xs txt-muted">Desde:</span>
            <input
              type="date"
              className="campo-input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 8px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="txt-xs txt-muted">Hasta:</span>
            <input
              type="date"
              className="campo-input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 8px' }}
            />
          </div>

          <Boton variante="primario" type="submit" style={{ padding: '7px 14px', fontSize: '13px' }}>
            Filtrar
          </Boton>
        </form>
      </div>

      {/* TABLA DE AUDITORÍA O ESTADO VACÍO */}
      <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-limpia" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--fondo-suave)', borderBottom: '1px solid var(--borde)' }}>
                <th style={{ padding: '12px var(--sp-4)' }}>Fecha / Hora</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Usuario / Admin</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Acción</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Tabla Afectada</th>
                <th style={{ padding: '12px var(--sp-4)' }}>ID Registro</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Datos</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                    <RefreshCw className="icono-giratorio" size={24} style={{ color: 'var(--gold-500)' }} />
                    <p className="txt-xs txt-muted" style={{ marginTop: '8px' }}>Cargando bitácora de auditoría...</p>
                  </td>
                </tr>
              ) : eventos.length === 0 ? (
                /* 🔴 NOTA 2: P-29 PUEDE TENER LA TABLA AUDITORIA VACÍA · NO ES ERROR */
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
                    <ShieldCheck size={36} style={{ color: 'var(--gold-500)', opacity: 0.6, marginBottom: 'var(--sp-2)' }} />
                    <p className="txt-sm txt-bold" style={{ margin: 0, color: 'var(--texto-principal)' }}>
                      No hay eventos registrados aún
                    </p>
                    <span className="txt-xs txt-muted">
                      Las acciones administrativas y de base de datos se irán registrando en esta bitácora inmutable.
                    </span>
                  </td>
                </tr>
              ) : (
                eventos.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} className="txt-muted" />
                        <span>{new Date(ev.creado_en).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <strong>{ev.socio_codigo || `Admin #${ev.usuario_id || 'Sistema'}`}</strong>
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <span className="badge badge-oro" style={{ fontSize: '11px' }}>
                        {ev.accion}
                      </span>
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <code>{ev.tabla || 'general'}</code>
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      #{ev.registro_id || '-'}
                    </td>
                    <td style={{ padding: '10px var(--sp-4)', textAlign: 'right' }}>
                      <Boton
                        variante="secundario"
                        onClick={() => setEventoSeleccionado(ev)}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        <Eye size={14} /> Inspeccionar
                      </Boton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINADOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-3) var(--sp-4)', borderTop: '1px solid var(--borde)', backgroundColor: 'var(--fondo-suave)' }}>
          <span className="txt-xs txt-muted">
            Página {pagina} de {totalPaginas} ({total} eventos totales)
          </span>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Boton
              variante="secundario"
              disabled={pagina <= 1 || cargando}
              onClick={() => setPagina(pagina - 1)}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              <ChevronLeft size={14} /> Anterior
            </Boton>
            <Boton
              variante="secundario"
              disabled={pagina >= totalPaginas || cargando}
              onClick={() => setPagina(pagina + 1)}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              Siguiente <ChevronRight size={14} />
            </Boton>
          </div>
        </div>
      </div>

      {/* MODAL DE INSPECCIÓN JSON (RF-443) */}
      {eventoSeleccionado && (
        <div className="dialogo-overlay" role="dialog" aria-modal="true">
          <div className="dialogo-caja" style={{ maxWidth: '680px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--borde)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <h3 className="dialogo-titulo" style={{ margin: 0, fontSize: '16px' }}>
                  Evento #{eventoSeleccionado.id} · {eventoSeleccionado.accion} sobre <code>{eventoSeleccionado.tabla}</code>
                </h3>
                <span className="txt-xs txt-muted">{new Date(eventoSeleccionado.creado_en).toLocaleString()} · IP: {eventoSeleccionado.ip || 'Local'}</span>
              </div>
              <button
                onClick={() => setEventoSeleccionado(null)}
                style={{ color: 'var(--texto-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', fontSize: '12px' }}>
              <div>
                <strong className="txt-xs txt-muted" style={{ display: 'block', marginBottom: '4px' }}>
                  Datos Anteriores (datos_antes):
                </strong>
                <pre style={{ backgroundColor: '#1E293B', color: '#E2E8F0', padding: '12px', borderRadius: 'var(--radius-md)', maxHeight: '240px', overflowY: 'auto', fontSize: '11px' }}>
                  {eventoSeleccionado.datos_antes ? JSON.stringify(eventoSeleccionado.datos_antes, null, 2) : 'null (Creación nueva)'}
                </pre>
              </div>

              <div>
                <strong className="txt-xs txt-muted" style={{ display: 'block', marginBottom: '4px' }}>
                  Datos Posteriores (datos_despues):
                </strong>
                <pre style={{ backgroundColor: '#1E293B', color: '#10B981', padding: '12px', borderRadius: 'var(--radius-md)', maxHeight: '240px', overflowY: 'auto', fontSize: '11px' }}>
                  {eventoSeleccionado.datos_despues ? JSON.stringify(eventoSeleccionado.datos_despues, null, 2) : 'null'}
                </pre>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--borde)', paddingTop: 'var(--sp-3)', marginTop: 'var(--sp-4)', display: 'flex', justifyContent: 'flex-end' }}>
              <Boton
                variante="secundario"
                onClick={() => setEventoSeleccionado(null)}
                style={{ fontSize: '12px' }}
              >
                Cerrar Visor
              </Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
