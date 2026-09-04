import React, { useState, useEffect } from 'react';
import {
  obtenerListaSociosAdmin,
  obtenerDetalleSocioAdmin,
  actualizarDatosSocioAdmin,
  obtenerVistaPreviaBajaSocio,
  darDeBajaSocio
} from '../servicios/operacionAdmin';
import { formatearSoles } from '../utilidades/dinero';
import { Boton } from '../piezas';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Building2,
  RefreshCw,
  UserCheck,
  UserX,
  UserMinus,
  Package
} from 'lucide-react';

/**
 * P-27 · Gestión de Socios (Admin)
 * - Lista paginada (25 por página) con búsqueda por ILIKE en servidor
 * - Filtro por Pack y estado de activación en ciclo abierto
 * - Detalle modal completo del socio con edición de datos permitidos
 * - Protección RF-425: Patrocinador, código y rol bloqueados
 */
export default function P27GestionSocios() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Lista y filtros
  const [socios, setSocios] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [packId, setPackId] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [cicloId, setCicloId] = useState(4);

  // Detalle y edición
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formularioEdicion, setFormularioEdicion] = useState({});

  // TAREA-17: Modal y flujo de Vista Previa y Baja con Reenganche
  const [modalBajaAbierto, setModalBajaAbierto] = useState(false);
  const [cargandoVistaPrevia, setCargandoVistaPrevia] = useState(false);
  const [vistaPreviaBaja, setVistaPreviaBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errorBaja, setErrorBaja] = useState(null);
  const [procesandoBaja, setProcesandoBaja] = useState(false);
  const [resultadoBaja, setResultadoBaja] = useState(null);

  const abrirVistaPreviaBaja = async (socioId) => {
    try {
      setModalBajaAbierto(true);
      setCargandoVistaPrevia(true);
      setErrorBaja(null);
      setResultadoBaja(null);
      setMotivoBaja('');
      const vp = await obtenerVistaPreviaBajaSocio(socioId);
      setVistaPreviaBaja(vp);
    } catch (err) {
      setErrorBaja(err.message || 'Error al cargar la vista previa.');
    } finally {
      setCargandoVistaPrevia(false);
    }
  };

  const handleEjecutarBaja = async () => {
    if (!vistaPreviaBaja || !vistaPreviaBaja.socio) return;
    if (!motivoBaja.trim()) {
      setErrorBaja('El motivo de la baja es obligatorio (regla S-4).');
      return;
    }

    try {
      setProcesandoBaja(true);
      setErrorBaja(null);
      const res = await darDeBajaSocio(vistaPreviaBaja.socio.id, motivoBaja);
      setResultadoBaja(res);
      setMensajeExito(`Baja del socio ${vistaPreviaBaja.socio.codigo} ejecutada exitosamente. Se reengancharon ${res.frontales_movidos || 0} frontales.`);
      setModalBajaAbierto(false);
      setSocioSeleccionado(null);
      await cargarSocios();
    } catch (err) {
      setErrorBaja(err.message || 'Error al procesar la baja.');
    } finally {
      setProcesandoBaja(false);
    }
  };

  useEffect(() => {
    cargarSocios();
  }, [pagina, packId, estadoFiltro]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setPagina(1);
    cargarSocios();
  };

  async function cargarSocios() {
    try {
      setCargando(true);
      setError(null);
      const res = await obtenerListaSociosAdmin({
        pagina,
        limite: 25,
        busqueda,
        packId: packId || null,
        estadoFiltro
      });
      setSocios(res.socios || []);
      setTotal(res.total || 0);
      setTotalPaginas(res.totalPaginas || 1);
      setCicloId(res.cicloId);
    } catch (err) {
      console.error('Error al cargar socios:', err);
      setError(err.message || 'Error al obtener la lista de socios.');
    } finally {
      setCargando(false);
    }
  }

  async function verDetalle(socioId) {
    try {
      setCargandoDetalle(true);
      setEditando(false);
      setError(null);
      const data = await obtenerDetalleSocioAdmin(socioId, cicloId);
      setDetalle(data);
      setSocioSeleccionado(data.socio);
      setFormularioEdicion({
        nombres: data.socio.nombres || '',
        apellidos: data.socio.apellidos || '',
        telefono: data.socio.telefono || '',
        direccion: data.socio.direccion || '',
        departamento: data.socio.departamento || '',
        provincia: data.socio.provincia || '',
        distrito: data.socio.distrito || '',
        banco: data.socio.banco || '',
        cuenta_bancaria: data.socio.cuenta_bancaria || ''
      });
    } catch (err) {
      console.error('Error al cargar detalle:', err);
      setError(err.message || 'No se pudo cargar el detalle del socio.');
    } finally {
      setCargandoDetalle(false);
    }
  }

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setError(null);
      const res = await actualizarDatosSocioAdmin(socioSeleccionado.id, formularioEdicion);
      setSocioSeleccionado(res);
      setMensajeExito(`Datos de ${res.nombres} ${res.apellidos} actualizados.`);
      setEditando(false);
      setTimeout(() => setMensajeExito(null), 4000);
      await cargarSocios();
    } catch (err) {
      console.error('Error al guardar datos:', err);
      setError(err.message || 'Error al actualizar los datos del socio.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pagina-contenedor">
      {/* ENCABEZADO */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-27</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Gestión de Socios</h1>
            <p className="pagina-subtitulo">
              Padrón oficial de afiliados, búsqueda inteligente, estado de activación y ficha individual
            </p>
          </div>
          <span className="armazon-admin-cycle-badge">
            <Users size={16} />
            <span>Total: {total} Socios</span>
          </span>
        </div>
      </div>

      {/* MENSAJES */}
      {mensajeExito && (
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--green-600)', padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-700)' }}>
            <CheckCircle size={20} />
            <strong className="txt-sm">{mensajeExito}</strong>
          </div>
        </div>
      )}

      {error && (
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} className="txt-gold" />
            <strong className="txt-sm txt-gold">{error}</strong>
          </div>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="panel-blanco" style={{ padding: 'var(--sp-4)' }}>
        <form onSubmit={handleBuscar} style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--texto-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, código, email o DNI..."
              className="campo-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '13px' }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="campo-input"
              value={packId}
              onChange={(e) => { setPackId(e.target.value); setPagina(1); }}
              style={{ fontSize: '13px' }}
            >
              <option value="">Todos los Packs</option>
              <option value="1">Kit Emprendedor</option>
              <option value="2">Pack Junior</option>
              <option value="3">Pack Senior</option>
              <option value="4">Pack Master</option>
              <option value="5">Pack Gold</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="campo-input"
              value={estadoFiltro}
              onChange={(e) => { setEstadoFiltro(e.target.value); setPagina(1); }}
              style={{ fontSize: '13px' }}
            >
              <option value="todos">Todos los Estados</option>
              <option value="activo">Activos en Ciclo {cicloId}</option>
              <option value="inactivo">Inactivos en Ciclo {cicloId}</option>
            </select>
          </div>

          <Boton variante="primario" type="submit" style={{ padding: '8px 16px', fontSize: '13px' }}>
            Buscar
          </Boton>
        </form>
      </div>

      {/* TABLA DE SOCIOS (25 POR PÁGINA) */}
      <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-limpia" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--fondo-suave)', borderBottom: '1px solid var(--borde)' }}>
                <th style={{ padding: '12px var(--sp-4)' }}>Código</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Socio</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Documento</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Pack</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Ciclo {cicloId} (Act.)</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                    <RefreshCw className="icono-giratorio" size={24} style={{ color: 'var(--gold-500)' }} />
                    <p className="txt-xs txt-muted" style={{ marginTop: '8px' }}>Cargando página de socios...</p>
                  </td>
                </tr>
              ) : socios.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--texto-muted)' }}>
                    No se encontraron socios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                socios.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <strong>{s.codigo}</strong>
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <div>
                        <strong className="txt-principal">{s.nombreCompleto}</strong>
                        <div className="txt-xs txt-muted">{s.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      {s.documento}
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <span className="badge badge-oro" style={{ fontSize: '11px' }}>
                        {s.pack?.nombre || 'Sin Pack'}
                      </span>
                    </td>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      {s.activacionCiclo?.activo ? (
                        <span className="badge badge-activo" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={12} /> Activo ({s.activacionCiclo.puntos_personales} pts)
                        </span>
                      ) : (
                        <span className="badge badge-inactivo" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserX size={12} /> Inactivo ({s.activacionCiclo.puntos_personales} pts)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px var(--sp-4)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Boton
                          variante="secundario"
                          onClick={() => verDetalle(s.id)}
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          <Eye size={14} /> Ficha
                        </Boton>
                        {s.estado !== 'baja' && (
                          <Boton
                            variante="secundario"
                            onClick={() => abrirVistaPreviaBaja(s.id)}
                            style={{ padding: '4px 8px', fontSize: '12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
                            title="Dar de baja con reenganche de red"
                          >
                            <UserMinus size={14} /> Baja
                          </Boton>
                        )}
                      </div>
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
            Mostrando página {pagina} de {totalPaginas} ({total} socios en total)
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

      {/* MODAL DE DETALLE DEL SOCIO (RF-423 a RF-427) */}
      {socioSeleccionado && (
        <div className="dialogo-overlay" role="dialog" aria-modal="true">
          <div className="dialogo-caja" style={{ maxWidth: '640px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--borde)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <span className="badge badge-oro" style={{ fontSize: '11px', marginBottom: '4px' }}>
                  {detalle?.socio?.pack?.nombre || 'Socio Oficial'}
                </span>
                <h3 className="dialogo-titulo" style={{ margin: 0, fontSize: '18px' }}>
                  {socioSeleccionado.codigo} · {socioSeleccionado.nombres} {socioSeleccionado.apellidos}
                </h3>
                <span className="txt-xs txt-muted">{socioSeleccionado.email} · DNI: {socioSeleccionado.documento}</span>
              </div>
              <button
                onClick={() => setSocioSeleccionado(null)}
                style={{ color: 'var(--texto-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* ESTADO DE ACTIVACIÓN DEL CICLO */}
            <div style={{ backgroundColor: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong className="txt-xs">Ciclo Actual ({cicloId} · Septiembre 2026):</strong>
                  <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>
                    Puntos personales: <strong>{detalle?.activacion?.puntos_personales || 0}</strong> de 70 · Grupales: <strong>{detalle?.activacion?.puntos_grupales || 0}</strong>
                  </div>
                </div>
                {detalle?.activacion?.activo || (detalle?.activacion?.puntos_personales >= 70) ? (
                  <span className="badge badge-activo">ACTIVO</span>
                ) : (
                  <span className="badge badge-inactivo">INACTIVO</span>
                )}
              </div>
            </div>

            {/* 🔴 INMUTABLES PROTEGIDOS (RF-425) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', fontSize: '12px' }}>
              <div style={{ padding: '8px 10px', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-sm)', border: '1px solid #E5E7EB' }}>
                <span className="txt-xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Patrocinador (Inmutable):
                </span>
                <strong className="txt-xs" style={{ display: 'block', marginTop: '2px' }}>
                  {detalle?.socio?.patrocinador?.codigo || 'MG00001'} — {detalle?.socio?.patrocinador?.nombres || 'SISTEMA'} {detalle?.socio?.patrocinador?.apellidos || 'MAX GLOBAL'}
                </strong>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-sm)', border: '1px solid #E5E7EB' }}>
                <span className="txt-xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Frontales Directos:
                </span>
                <strong className="txt-xs" style={{ display: 'block', marginTop: '2px' }}>
                  {detalle?.frontalesTotal} socios patrocinados
                </strong>
              </div>
            </div>

            {/* DATOS PERSONALES Y BANCARIOS (EDITABLES RF-426) */}
            <form onSubmit={handleGuardarDatos}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                <strong className="txt-xs txt-principal">Datos Personales y Bancarios</strong>
                {!editando && (
                  <Boton
                    variante="secundario"
                    type="button"
                    onClick={() => setEditando(true)}
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                  >
                    <Edit size={12} /> Editar
                  </Boton>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', fontSize: '12px' }}>
                <div>
                  <label className="txt-xs txt-muted">Nombres:</label>
                  <input
                    type="text"
                    disabled={!editando}
                    className="campo-input"
                    value={formularioEdicion.nombres || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, nombres: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
                <div>
                  <label className="txt-xs txt-muted">Apellidos:</label>
                  <input
                    type="text"
                    disabled={!editando}
                    className="campo-input"
                    value={formularioEdicion.apellidos || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, apellidos: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
                <div>
                  <label className="txt-xs txt-muted">Teléfono:</label>
                  <input
                    type="text"
                    disabled={!editando}
                    className="campo-input"
                    value={formularioEdicion.telefono || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, telefono: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
                <div>
                  <label className="txt-xs txt-muted">Dirección:</label>
                  <input
                    type="text"
                    disabled={!editando}
                    className="campo-input"
                    value={formularioEdicion.direccion || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, direccion: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
                <div>
                  <label className="txt-xs txt-muted">Banco:</label>
                  <input
                    type="text"
                    disabled={!editando}
                    placeholder="Ej. BCP, BBVA, Interbank"
                    className="campo-input"
                    value={formularioEdicion.banco || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, banco: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
                <div>
                  <label className="txt-xs txt-muted">Número de Cuenta:</label>
                  <input
                    type="text"
                    disabled={!editando}
                    placeholder="Número de cuenta bancaria"
                    className="campo-input"
                    value={formularioEdicion.cuenta_bancaria || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, cuenta_bancaria: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
              </div>

              {editando && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--sp-4)' }}>
                  <Boton
                    variante="secundario"
                    type="button"
                    onClick={() => setEditando(false)}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Cancelar
                  </Boton>
                  <Boton
                    variante="primario"
                    type="submit"
                    disabled={guardando}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Save size={14} /> Guardar Cambios
                  </Boton>
                </div>
              )}
            </form>

            <div style={{ borderTop: '1px solid var(--borde)', paddingTop: 'var(--sp-3)', marginTop: 'var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {detalle?.estado !== 'baja' && (
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      const sId = detalle.id;
                      setSocioSeleccionado(null);
                      abrirVistaPreviaBaja(sId);
                    }}
                    style={{ fontSize: '12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UserMinus size={14} /> Dar de baja con reenganche
                  </Boton>
                )}
              </div>
              <Boton
                variante="secundario"
                onClick={() => setSocioSeleccionado(null)}
                style={{ fontSize: '12px' }}
              >
                Cerrar Ficha
              </Boton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA DE BAJA CON REENGANCHE (TAREA-17) */}
      {modalBajaAbierto && (
        <div className="dialogo-overlay" role="dialog" aria-modal="true" style={{ zIndex: 1100 }}>
          <div className="panel-blanco" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--sp-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--borde)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <span className="kit-header-badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                  Operación Crítica · Jerarquía de Red
                </span>
                <h2 style={{ fontSize: '18px', margin: '4px 0', color: 'var(--texto-principal)' }}>
                  Baja de Socio con Reenganche de Red
                </h2>
                <p className="txt-xs txt-muted">
                  Los frontales directos subirán un nivel al patrocinador y se reconstruirá red_ancestro para todo el subárbol
                </p>
              </div>
              <button
                onClick={() => setModalBajaAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {cargandoVistaPrevia ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
                <RefreshCw className="icono-giratorio" size={28} style={{ color: 'var(--gold-500)', marginBottom: 'var(--sp-2)' }} />
                <p className="txt-sm txt-muted">Calculando impacto en seco sobre la red...</p>
              </div>
            ) : errorBaja ? (
              <div className="panel-alerta-cero-borde" style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger, #dc2626)' }}>
                  <AlertTriangle size={18} />
                  <span className="txt-sm txt-bold">{errorBaja}</span>
                </div>
              </div>
            ) : vistaPreviaBaja && (
              <div>
                {/* 1. DATOS DEL SOCIO Y SU PATROCINADOR RECEPTOR */}
                <div style={{ background: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                    <div>
                      <span className="txt-xs txt-muted txt-bold">SOCIO A DAR DE BAJA:</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                        {vistaPreviaBaja.socio.nombres} {vistaPreviaBaja.socio.apellidos}
                      </div>
                      <div className="txt-xs txt-muted">
                        Código: <strong>{vistaPreviaBaja.socio.codigo}</strong> · DNI: {vistaPreviaBaja.socio.documento}
                      </div>
                    </div>
                    <div>
                      <span className="txt-xs txt-muted txt-bold">SU PATROCINADOR (RECEPTOR):</span>
                      {vistaPreviaBaja.patrocinador ? (
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--verde, #16a34a)', marginTop: '2px' }}>
                            {vistaPreviaBaja.patrocinador.nombres} {vistaPreviaBaja.patrocinador.apellidos}
                          </div>
                          <div className="txt-xs txt-muted">
                            Código: <strong>{vistaPreviaBaja.patrocinador.codigo}</strong> (acá se van a enganchar sus frontales)
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>
                          Sin patrocinador (Es la raíz)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ADVERTENCIA SI ES LA RAÍZ (MG00001) */}
                {vistaPreviaBaja.es_raiz && (
                  <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                    <div className="txt-xs" style={{ color: '#991b1b' }}>
                      <strong>BLOQUEO DE SEGURIDAD (Regla 2):</strong> {vistaPreviaBaja.motivo_bloqueo}
                    </div>
                  </div>
                )}

                {/* 2. MÉTRICAS DEL SUBÁRBOL */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  <div style={{ border: '1px solid var(--borde)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', textAlign: 'center' }}>
                    <span className="txt-xs txt-muted txt-bold">FRONTALES DIRECTOS</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--azul, #2563eb)', margin: '4px 0' }}>
                      {vistaPreviaBaja.frontales_count}
                    </div>
                    <span className="txt-xs txt-muted">suben un nivel</span>
                  </div>

                  <div style={{ border: '1px solid var(--borde)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', textAlign: 'center' }}>
                    <span className="txt-xs txt-muted txt-bold">DESCENDENCIA TOTAL</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--texto-principal)', margin: '4px 0' }}>
                      {vistaPreviaBaja.descendencia_total}
                    </div>
                    <span className="txt-xs txt-muted">se reconstruye cadena</span>
                  </div>

                  <div style={{ border: '1px solid var(--borde)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', textAlign: 'center' }}>
                    <span className="txt-xs txt-muted txt-bold">PROFUNDIDAD SUBÁRBOL</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--texto-principal)', margin: '4px 0' }}>
                      {vistaPreviaBaja.profundidad_subarbol}
                    </div>
                    <span className="txt-xs txt-muted">niveles afectados</span>
                  </div>
                </div>

                {/* 3. HISTORIAL FINANCIERO INTACTO (REGLAS DE HIERRO) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)' }}>
                    <div className="txt-xs txt-muted txt-bold">COMISIONES QUE YA COBRÓ</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0', color: 'var(--texto-principal)' }}>
                      {formatearSoles(vistaPreviaBaja.total_cobrado_cent)}
                    </div>
                    <span className="txt-xs" style={{ color: '#16a34a', fontWeight: 600 }}>✓ NO se tocan (histórico append-only)</span>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)' }}>
                    <div className="txt-xs txt-muted txt-bold">SALDO EN SU BILLETERA</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0', color: 'var(--texto-principal)' }}>
                      {formatearSoles(vistaPreviaBaja.saldo_disponible_cent)}
                    </div>
                    <span className="txt-xs" style={{ color: '#16a34a', fontWeight: 600 }}>✓ NO se toca (saldo resguardado)</span>
                  </div>
                </div>

                {/* 4. LISTA DE FRONTALES QUE SUBIRÁN */}
                {vistaPreviaBaja.frontales_count > 0 && (
                  <div style={{ marginBottom: 'var(--sp-4)' }}>
                    <span className="txt-xs txt-muted txt-bold">
                      FRONTALES DIRECTOS QUE SERÁN REENGANCHADOS ({vistaPreviaBaja.frontales_count}):
                    </span>
                    <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid var(--borde)', borderRadius: 'var(--radius-sm)', padding: 'var(--sp-2)', marginTop: '4px', background: '#fff' }}>
                      {vistaPreviaBaja.frontales.map(f => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '12px', borderBottom: '1px solid var(--fondo-suave)' }}>
                          <span><strong>{f.codigo}</strong> — {f.nombres} {f.apellidos}</span>
                          <span className="txt-muted txt-xs">Nuevo patrocinador: {vistaPreviaBaja.patrocinador?.codigo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. CAMPO MOTIVO OBLIGATORIO (S-4) */}
                <div style={{ marginBottom: 'var(--sp-4)' }}>
                  <label htmlFor="motivo-baja" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: 'var(--texto-principal)' }}>
                    Motivo de la Baja <span style={{ color: '#dc2626' }}>* (Obligatorio · Regla S-4)</span>
                  </label>
                  <input
                    id="motivo-baja"
                    type="text"
                    disabled={!vistaPreviaBaja.puede_dar_baja || procesandoBaja}
                    className="campo-input"
                    placeholder="Ej. Solicitud voluntaria del socio, falta grave según reglamento..."
                    value={motivoBaja}
                    onChange={(e) => setMotivoBaja(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
                  />
                  {!motivoBaja.trim() && vistaPreviaBaja.puede_dar_baja && (
                    <span className="txt-xs" style={{ color: '#dc2626', marginTop: '2px', display: 'block' }}>
                      El botón de confirmación se habilitará al escribir el motivo.
                    </span>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', borderTop: '1px solid var(--borde)', paddingTop: 'var(--sp-4)' }}>
                  <Boton
                    variante="secundario"
                    onClick={() => setModalBajaAbierto(false)}
                    disabled={procesandoBaja}
                  >
                    Cancelar
                  </Boton>
                  <Boton
                    id="btn-confirmar-baja"
                    variante="primario"
                    onClick={handleEjecutarBaja}
                    disabled={!vistaPreviaBaja.puede_dar_baja || !motivoBaja.trim() || procesandoBaja}
                    style={{ backgroundColor: (!vistaPreviaBaja.puede_dar_baja || !motivoBaja.trim()) ? undefined : '#dc2626', borderColor: '#b91c1c' }}
                  >
                    {procesandoBaja ? 'Procesando reenganche...' : 'Confirmar Baja y Reenganche'}
                  </Boton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
