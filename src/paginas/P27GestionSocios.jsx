import React, { useState, useEffect } from 'react';
import {
  obtenerListaSociosAdmin,
  obtenerDetalleSocioAdmin,
  actualizarDatosSocioAdmin,
  obtenerVistaPreviaBajaSocio,
  darDeBajaSocio,
  obtenerVistaPreviaEliminarSocio,
  eliminarSocioDefinitivo,
  cargarPacks,
  subirComprobanteVoucher,
  registrarUpgradePack
} from '../servicios/operacionAdmin';
import { formatearSoles } from '../utilidades/dinero';
import { Boton, DialogoConfirmar, EstadoVacio, CampoArchivoVoucher } from '../piezas';
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
  Trash2,
  Package,
  TrendingUp,
  Sparkles,
  ArrowUpRight
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
  const [cicloId, setCicloId] = useState(null);
  const [cicloNombre, setCicloNombre] = useState('');

  // Detalle y edición
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formularioEdicion, setFormularioEdicion] = useState({});
  const [errorModal, setErrorModal] = useState(null);
  const [mensajeExitoModal, setMensajeExitoModal] = useState(null);

  // TAREA-17: Modal y flujo de Vista Previa y Baja con Reenganche
  const [modalBajaAbierto, setModalBajaAbierto] = useState(false);
  const [cargandoVistaPrevia, setCargandoVistaPrevia] = useState(false);
  const [vistaPreviaBaja, setVistaPreviaBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errorBaja, setErrorBaja] = useState(null);
  const [procesandoBaja, setProcesandoBaja] = useState(false);
  const [resultadoBaja, setResultadoBaja] = useState(null);
  const [dialogoBajaAbierto, setDialogoBajaAbierto] = useState(false);

  // TAREA-26: Modal y flujo de Upgrade de Pack (FLUJO 9)
  const [packsDisponibles, setPacksDisponibles] = useState([]);
  const [modalUpgradeAbierto, setModalUpgradeAbierto] = useState(false);
  const [socioUpgrade, setSocioUpgrade] = useState(null);
  const [packDestinoId, setPackDestinoId] = useState('');
  const [bancoUpgrade, setBancoUpgrade] = useState('BCP');
  const [numOperacionUpgrade, setNumOperacionUpgrade] = useState('');
  const [fechaDepositoUpgrade, setFechaDepositoUpgrade] = useState(new Date().toISOString().split('T')[0]);
  const [archivoVoucherUpgrade, setArchivoVoucherUpgrade] = useState(null);
  const [guardandoUpgrade, setGuardandoUpgrade] = useState(false);
  const [errorUpgrade, setErrorUpgrade] = useState(null);

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

  // Estado y controladores para Eliminación Definitiva de Socio
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [cargandoVistaPreviaEliminar, setCargandoVistaPreviaEliminar] = useState(false);
  const [vistaPreviaEliminar, setVistaPreviaEliminar] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState(null);
  const [motivoEliminar, setMotivoEliminar] = useState('');
  const [palabraConfirmarEliminar, setPalabraConfirmarEliminar] = useState('');
  const [procesandoEliminar, setProcesandoEliminar] = useState(false);

  const abrirVistaPreviaEliminar = async (socioId) => {
    try {
      setModalEliminarAbierto(true);
      setCargandoVistaPreviaEliminar(true);
      setErrorEliminar(null);
      setMotivoEliminar('');
      setPalabraConfirmarEliminar('');
      const vp = await obtenerVistaPreviaEliminarSocio(socioId);
      setVistaPreviaEliminar(vp);
    } catch (err) {
      setErrorEliminar(err.message || 'Error al cargar la vista previa de eliminación.');
    } finally {
      setCargandoVistaPreviaEliminar(false);
    }
  };

  const handleEjecutarEliminar = async () => {
    if (!vistaPreviaEliminar || !vistaPreviaEliminar.socio) return;
    if (!motivoEliminar.trim()) {
      setErrorEliminar('El motivo de la eliminación es obligatorio.');
      return;
    }
    if (palabraConfirmarEliminar.trim().toUpperCase() !== 'ELIMINAR') {
      setErrorEliminar('Debes escribir la palabra ELIMINAR para confirmar.');
      return;
    }

    try {
      setProcesandoEliminar(true);
      setErrorEliminar(null);
      const res = await eliminarSocioDefinitivo(vistaPreviaEliminar.socio.id, motivoEliminar);
      setMensajeExito(`Socio ${vistaPreviaEliminar.socio.codigo} (${vistaPreviaEliminar.socio.nombres}) eliminado definitivamente. Se reengancharon ${res.frontales_movidos || 0} frontales.`);
      setModalEliminarAbierto(false);
      setSocioSeleccionado(null);
      await cargarSocios();
    } catch (err) {
      setErrorEliminar(err.message || 'Error al procesar la eliminación.');
    } finally {
      setProcesandoEliminar(false);
    }
  };

  useEffect(() => {
    async function initPacks() {
      try {
        const pks = await cargarPacks();
        setPacksDisponibles(pks || []);
      } catch (err) {
        console.warn('Error cargando packs en P-27:', err);
      }
    }
    initPacks();
  }, []);

  const abrirModalUpgrade = (socio) => {
    setSocioUpgrade(socio);
    setPackDestinoId('');
    setBancoUpgrade('BCP');
    setNumOperacionUpgrade('');
    setFechaDepositoUpgrade(new Date().toISOString().split('T')[0]);
    setArchivoVoucherUpgrade(null);
    setErrorUpgrade(null);
    setModalUpgradeAbierto(true);
  };

  const handleCrearUpgrade = async (e) => {
    if (e) e.preventDefault();
    if (!socioUpgrade || !packDestinoId) {
      setErrorUpgrade('Por favor selecciona el pack de destino.');
      return;
    }
    setGuardandoUpgrade(true);
    setErrorUpgrade(null);
    try {
      let imagenUrl = null;
      if (archivoVoucherUpgrade) {
        imagenUrl = await subirComprobanteVoucher(archivoVoucherUpgrade, cicloId, socioUpgrade.codigo);
      }

      const packDest = packsDisponibles.find((p) => String(p.id) === String(packDestinoId));
      const voucherData = {
        banco: bancoUpgrade,
        numero_operacion: numOperacionUpgrade ? numOperacionUpgrade.trim() : null,
        fecha_deposito: fechaDepositoUpgrade,
        monto_cent: packDest ? packDest.precio_cent : null,
        imagen_url: imagenUrl
      };

      const res = await registrarUpgradePack({
        socioId: socioUpgrade.id,
        packIdNuevo: Number(packDestinoId),
        voucher: voucherData,
        canal: 'oficina'
      });

      setModalUpgradeAbierto(false);
      setMensajeExito(`Orden ${res.orden_codigo} de Upgrade a ${packDest?.nombre} creada exitosamente para ${socioUpgrade.nombreCompleto || socioUpgrade.codigo}. Pendiente de confirmación en P-23.`);
      await cargarSocios();
    } catch (err) {
      setErrorUpgrade(err.message || 'Error al registrar orden de upgrade.');
    } finally {
      setGuardandoUpgrade(false);
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
      if (res.cicloNombre) setCicloNombre(res.cicloNombre);
    } catch (err) {
      console.error('Error al cargar socios:', err);
      setError(err.message || 'Error al obtener la lista de socios.');
    } finally {
      setCargando(false);
    }
  }

  const cerrarModalDetalle = () => {
    setSocioSeleccionado(null);
    setDetalle(null);
    setEditando(false);
    setErrorModal(null);
    setMensajeExitoModal(null);
  };

  async function verDetalle(socioId) {
    try {
      setCargandoDetalle(true);
      setEditando(false);
      setError(null);
      setErrorModal(null);
      setMensajeExitoModal(null);
      const data = await obtenerDetalleSocioAdmin(socioId, cicloId);
      setDetalle(data);
      if (data.cicloNombre && !cicloNombre) setCicloNombre(data.cicloNombre);
      setSocioSeleccionado(data.socio);
      setFormularioEdicion({
        nombres: data.socio.nombres || '',
        apellidos: data.socio.apellidos || '',
        email: data.socio.email || '',
        telefono: data.socio.telefono || '',
        direccion: data.socio.direccion || '',
        ciudad: data.socio.ciudad || '',
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

  const handleCancelarEdicion = () => {
    if (detalle?.socio) {
      setFormularioEdicion({
        nombres: detalle.socio.nombres || '',
        apellidos: detalle.socio.apellidos || '',
        email: detalle.socio.email || '',
        telefono: detalle.socio.telefono || '',
        direccion: detalle.socio.direccion || '',
        ciudad: detalle.socio.ciudad || '',
        banco: detalle.socio.banco || '',
        cuenta_bancaria: detalle.socio.cuenta_bancaria || ''
      });
    }
    setErrorModal(null);
    setEditando(false);
  };

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setErrorModal(null);
      setError(null);
      setMensajeExitoModal(null);

      // Validaciones básicas de cliente
      if (!formularioEdicion.nombres?.trim() || !formularioEdicion.apellidos?.trim()) {
        throw new Error('Los nombres y apellidos son obligatorios.');
      }
      if (!formularioEdicion.email?.trim() || !formularioEdicion.email.includes('@')) {
        throw new Error('El correo electrónico es obligatorio y debe tener un formato válido (ejemplo@correo.com).');
      }

      const res = await actualizarDatosSocioAdmin(socioSeleccionado.id, formularioEdicion);
      
      // Sincronizar estados locales inmediatamente para feedback en tiempo real
      setSocioSeleccionado((prev) => ({ ...prev, ...res }));
      setDetalle((prev) => (prev ? { ...prev, socio: { ...prev.socio, ...res } } : prev));
      setFormularioEdicion({
        nombres: res.nombres || '',
        apellidos: res.apellidos || '',
        email: res.email || '',
        telefono: res.telefono || '',
        direccion: res.direccion || '',
        ciudad: res.ciudad || '',
        banco: res.banco || '',
        cuenta_bancaria: res.cuenta_bancaria || ''
      });

      const msg = `Datos y correo de ${res.nombres} ${res.apellidos} actualizados correctamente.`;
      setMensajeExitoModal(msg);
      setMensajeExito(msg);
      setEditando(false);
      setTimeout(() => {
        setMensajeExito(null);
        setMensajeExitoModal(null);
      }, 5000);
      await cargarSocios();
    } catch (err) {
      console.error('Error al guardar datos:', err);
      setErrorModal(err.message || 'Error al actualizar los datos del socio.');
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
                  <td colSpan={6} style={{ padding: 'var(--sp-4)' }}>
                    <EstadoVacio
                      icono={Users}
                      titulo="No se encontraron socios"
                      mensaje="No hay registros que coincidan con la búsqueda o los filtros seleccionados. Intenta cambiar los criterios de búsqueda."
                      accionTexto="Limpiar Filtros"
                      onAccion={() => {
                        setBusqueda('');
                        setPackId('');
                        setEstadoFiltro('todos');
                        setPagina(1);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                socios.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                    <td style={{ padding: '10px var(--sp-4)' }}>
                      <strong>{s.codigo}</strong>
                      {s.estado === 'baja' && (
                        <span className="badge badge-inactivo" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', marginLeft: '6px', fontSize: '10px' }}>
                          BAJA
                        </span>
                      )}
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
                            onClick={() => abrirModalUpgrade(s)}
                            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--oro)', borderColor: 'var(--border-subtle)' }}
                            title="Mejorar pack del socio"
                          >
                            <TrendingUp size={14} /> Mejorar pack
                          </Boton>
                        )}
                        {s.estado !== 'baja' && (
                          <Boton
                            variante="secundario"
                            onClick={() => abrirVistaPreviaBaja(s.id)}
                            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--border-danger)' }}
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
                onClick={cerrarModalDetalle}
                style={{ color: 'var(--texto-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* FEEDBACK INMEDIATO DENTRO DEL MODAL */}
            {mensajeExitoModal && (
              <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--green-600)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-700)' }}>
                <CheckCircle size={16} />
                <strong className="txt-xs">{mensajeExitoModal}</strong>
              </div>
            )}

            {errorModal && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <AlertTriangle size={16} />
                <strong className="txt-xs">{errorModal}</strong>
              </div>
            )}

            {/* ESTADO DE ACTIVACIÓN DEL CICLO */}
            <div style={{ backgroundColor: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong className="txt-xs">Ciclo Actual ({cicloId} · {detalle?.cicloNombre || cicloNombre || 'Ciclo Abierto'}):</strong>
                  <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>
                    Puntos personales: <strong>{detalle?.activacion?.puntos_personales || 0}</strong> para activación
                  </div>
                </div>
                {Boolean(detalle?.activacion?.activo) ? (
                  <span className="badge badge-activo">ACTIVO</span>
                ) : (
                  <span className="badge badge-inactivo">INACTIVO</span>
                )}
              </div>
            </div>

            {/* 🔴 INMUTABLES PROTEGIDOS (RF-425) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', fontSize: '12px' }}>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span className="txt-xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Patrocinador (Inmutable):
                </span>
                <strong className="txt-xs" style={{ display: 'block', marginTop: '2px' }}>
                  {detalle?.socio?.patrocinador?.codigo || 'MG00001'} — {detalle?.socio?.patrocinador?.nombres || 'SISTEMA'} {detalle?.socio?.patrocinador?.apellidos || 'MAX GLOBAL'}
                </strong>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span className="txt-xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Frontales Directos:
                </span>
                <strong className="txt-xs" style={{ display: 'block', marginTop: '2px' }}>
                  {detalle?.frontalesTotal} socios patrocinados
                </strong>
              </div>
            </div>

            {/* SALDO EN BILLETERA VIRTUAL */}
            <div style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 'var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="txt-xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                  <CreditCard size={14} style={{ color: 'var(--oro)' }} /> Saldo Disponible en Billetera:
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--oro)', marginTop: '2px' }}>
                  {formatearSoles(detalle?.saldo_disponible_cent || 0)}
                </div>
              </div>
              <a
                href="/admin/retiros"
                className="btn btn-sm btn-secundario"
                style={{ fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                title="Ir a Gestión de Retiros para pagar o transferir al socio"
              >
                Pagar Billetera <ArrowUpRight size={14} />
              </a>
            </div>

            {/* DATOS PERSONALES Y BANCARIOS (EDITABLES RF-426) */}
            <form onSubmit={handleGuardarDatos}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                <strong className="txt-xs txt-principal">Datos Personales y Bancarios</strong>
                {!editando && (
                  <Boton
                    variante="secundario"
                    type="button"
                    onClick={() => {
                      setErrorModal(null);
                      setMensajeExitoModal(null);
                      setEditando(true);
                    }}
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                  >
                    <Edit size={12} /> Editar
                  </Boton>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', fontSize: '12px' }}>
                <div>
                  <label className="txt-xs txt-muted">Nombres: <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    disabled={!editando}
                    required
                    className="campo-input"
                    value={formularioEdicion.nombres || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, nombres: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
                <div>
                  <label className="txt-xs txt-muted">Apellidos: <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    disabled={!editando}
                    required
                    className="campo-input"
                    value={formularioEdicion.apellidos || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, apellidos: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
                <div>
                  <label className="txt-xs txt-muted">Correo Electrónico (Login): <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="email"
                    disabled={!editando}
                    required
                    className="campo-input"
                    value={formularioEdicion.email || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, email: e.target.value })}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    placeholder="ejemplo@correo.com"
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
                  <label className="txt-xs txt-muted">Ciudad / Región:</label>
                  <input
                    type="text"
                    disabled={!editando}
                    className="campo-input"
                    placeholder="Ej. Lima, Cusco, Arequipa"
                    value={formularioEdicion.ciudad || ''}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, ciudad: e.target.value })}
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
                    onClick={handleCancelarEdicion}
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
                    {guardando ? 'Guardando...' : <><Save size={14} /> Guardar Cambios</>}
                  </Boton>
                </div>
              )}
            </form>

            <div style={{ borderTop: '1px solid var(--borde)', paddingTop: 'var(--sp-3)', marginTop: 'var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {detalle?.estado !== 'baja' && (
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      const sId = detalle.id;
                      setSocioSeleccionado(null);
                      abrirVistaPreviaBaja(sId);
                    }}
                    style={{ fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--border-danger)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UserMinus size={14} /> Dar de baja
                  </Boton>
                )}
                {detalle?.id !== 1 && (
                  <Boton
                    variante="peligro"
                    onClick={() => {
                      const sId = detalle.id;
                      setSocioSeleccionado(null);
                      abrirVistaPreviaEliminar(sId);
                    }}
                    style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={14} /> Eliminar definitivamente
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
                <span className="kit-header-badge" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
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
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>
                            {vistaPreviaBaja.patrocinador.nombres} {vistaPreviaBaja.patrocinador.apellidos}
                          </div>
                          <div className="txt-xs txt-muted">
                            Código: <strong>{vistaPreviaBaja.patrocinador.codigo}</strong> (acá se van a enganchar sus frontales)
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>
                          Sin patrocinador (Es la raíz)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ADVERTENCIA SI ES LA RAÍZ (MG00001) */}
                {vistaPreviaBaja.es_raiz && (
                  <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--border-danger)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                    <div className="txt-xs" style={{ color: 'var(--danger)' }}>
                      <strong>BLOQUEO DE SEGURIDAD (Regla 2):</strong> {vistaPreviaBaja.motivo_bloqueo}
                    </div>
                  </div>
                )}

                {/* 2. MÉTRICAS DEL SUBÁRBOL */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  <div style={{ border: '1px solid var(--borde)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', textAlign: 'center' }}>
                    <span className="txt-xs txt-muted txt-bold">FRONTALES DIRECTOS</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--info)', margin: '4px 0' }}>
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
                  <div style={{ background: 'var(--surface-page)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)' }}>
                    <div className="txt-xs txt-muted txt-bold">COMISIONES QUE YA COBRÓ</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0', color: 'var(--texto-principal)' }}>
                      {formatearSoles(vistaPreviaBaja.total_cobrado_cent)}
                    </div>
                    <span className="txt-xs" style={{ color: 'var(--success)', fontWeight: 600 }}>✓ NO se tocan (histórico append-only)</span>
                  </div>

                  <div style={{ background: 'var(--surface-page)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)' }}>
                    <div className="txt-xs txt-muted txt-bold">SALDO EN SU BILLETERA</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0', color: 'var(--texto-principal)' }}>
                      {formatearSoles(vistaPreviaBaja.saldo_disponible_cent)}
                    </div>
                    <span className="txt-xs" style={{ color: 'var(--success)', fontWeight: 600 }}>✓ NO se toca (saldo resguardado)</span>
                  </div>
                </div>

                {/* 4. LISTA DE FRONTALES QUE SUBIRÁN */}
                {vistaPreviaBaja.frontales_count > 0 && (
                  <div style={{ marginBottom: 'var(--sp-4)' }}>
                    <span className="txt-xs txt-muted txt-bold">
                      FRONTALES DIRECTOS QUE SERÁN REENGANCHADOS ({vistaPreviaBaja.frontales_count}):
                    </span>
                    <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid var(--borde)', borderRadius: 'var(--radius-sm)', padding: 'var(--sp-2)', marginTop: '4px', background: 'var(--surface-card)' }}>
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
                    Motivo de la Baja <span style={{ color: 'var(--danger)' }}>* (Obligatorio · Regla S-4)</span>
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
                    <span className="txt-xs" style={{ color: 'var(--danger)', marginTop: '2px', display: 'block' }}>
                      El botón de confirmación se habilitará al escribir el motivo.
                    </span>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--sp-4)' }}>
                  <Boton
                    variante="secundario"
                    onClick={() => setModalBajaAbierto(false)}
                    disabled={procesandoBaja}
                  >
                    Cancelar
                  </Boton>
                  <Boton
                    id="btn-confirmar-baja"
                    variante="peligro"
                    onClick={() => setDialogoBajaAbierto(true)}
                    disabled={!vistaPreviaBaja.puede_dar_baja || !motivoBaja.trim() || procesandoBaja}
                  >
                    {procesandoBaja ? 'Procesando reenganche...' : 'Confirmar Baja y Reenganche'}
                  </Boton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIÁLOGO CONFIRMAR BAJA DEFINITIVA (TAREA-24) */}
      {vistaPreviaBaja && (
        <DialogoConfirmar
          abierto={dialogoBajaAbierto}
          titulo="¿Confirmar baja definitiva y reenganche de red?"
          mensaje={
            `Se va a dar de baja a ${vistaPreviaBaja.socio?.nombres} ${vistaPreviaBaja.socio?.apellidos} (${vistaPreviaBaja.socio?.codigo}). ` +
            `Sus ${vistaPreviaBaja.frontales_count || 0} frontales pasarán a colgar de ` +
            `${vistaPreviaBaja.patrocinador ? `${vistaPreviaBaja.patrocinador.nombres} ${vistaPreviaBaja.patrocinador.apellidos} (${vistaPreviaBaja.patrocinador.codigo})` : 'la Empresa'}. ` +
            `Esta acción no se puede deshacer.`
          }
          textoConfirmar="Sí, dar de baja"
          textoCancelar="Cancelar"
          variante="peligro"
          cargando={procesandoBaja}
          onConfirmar={async () => {
            await handleEjecutarBaja();
            setDialogoBajaAbierto(false);
          }}
          onCancelar={() => setDialogoBajaAbierto(false)}
        />
      )}

      {/* MODAL DE ELIMINACIÓN DEFINITIVA DE SOCIO (HARD DELETE) */}
      {modalEliminarAbierto && (
        <div className="dialogo-overlay" role="dialog" aria-modal="true" style={{ zIndex: 1100 }}>
          <div className="panel-blanco" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--sp-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--borde)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <span className="kit-header-badge" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}>
                  Acción Destructiva · Borrado Definitivo
                </span>
                <h2 style={{ fontSize: '18px', margin: '4px 0', color: 'var(--danger)' }}>
                  Eliminar Socio Definitivamente
                </h2>
                <p className="txt-xs txt-muted">
                  Borra por completo la cuenta, libera el documento y correo, elimina órdenes y bonos del ciclo actual.
                </p>
              </div>
              <button
                onClick={() => setModalEliminarAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {cargandoVistaPreviaEliminar ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
                <RefreshCw className="icono-giratorio" size={28} style={{ color: 'var(--danger)', marginBottom: 'var(--sp-2)' }} />
                <p className="txt-sm txt-muted">Calculando impacto del borrado sobre el sistema...</p>
              </div>
            ) : errorEliminar ? (
              <div className="panel-alerta-cero-borde" style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                  <AlertTriangle size={18} />
                  <span className="txt-sm txt-bold">{errorEliminar}</span>
                </div>
              </div>
            ) : vistaPreviaEliminar && (
              <div>
                {/* 1. DATOS DEL SOCIO */}
                <div style={{ background: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                    <div>
                      <span className="txt-xs txt-muted txt-bold">SOCIO A ELIMINAR:</span>
                      <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                        {vistaPreviaEliminar.socio?.nombres} {vistaPreviaEliminar.socio?.apellidos}
                      </div>
                      <div className="txt-xs txt-muted">
                        Código: <strong>{vistaPreviaEliminar.socio?.codigo}</strong> · DNI: {vistaPreviaEliminar.socio?.documento}
                      </div>
                      <div className="txt-xs txt-muted">
                        Email: {vistaPreviaEliminar.socio?.email}
                      </div>
                    </div>
                    <div>
                      <span className="txt-xs txt-muted txt-bold">PATROCINADOR RECEPTOR:</span>
                      {vistaPreviaEliminar.patrocinador ? (
                        <>
                          <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                            {vistaPreviaEliminar.patrocinador.nombres} {vistaPreviaEliminar.patrocinador.apellidos}
                          </div>
                          <div className="txt-xs txt-muted">
                            Código: <strong>{vistaPreviaEliminar.patrocinador.codigo}</strong>
                          </div>
                        </>
                      ) : (
                        <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>Sin patrocinador (nodo raíz)</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. CANDADO CONTABLE / BLOQUEO */}
                {!vistaPreviaEliminar.puede_eliminar && (
                  <div className="panel-alerta-cero-borde" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)', borderLeft: '4px solid var(--danger)' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div className="txt-sm txt-bold" style={{ color: 'var(--danger)' }}>
                          OPERACIÓN BLOQUEADA POR SEGURIDAD CONTABLE
                        </div>
                        <p className="txt-xs" style={{ margin: '4px 0 0 0', color: 'var(--texto-principal)' }}>
                          {vistaPreviaEliminar.motivo_bloqueo}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. RESUMEN DE IMPACTO */}
                {vistaPreviaEliminar.puede_eliminar && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--borde)', borderRadius: 'var(--radius-sm)', padding: 'var(--sp-3)', textAlign: 'center' }}>
                      <div className="txt-xs txt-muted">Frontales a reenganchar</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--texto-principal)', marginTop: '2px' }}>
                        {vistaPreviaEliminar.frontales_count || 0}
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--borde)', borderRadius: 'var(--radius-sm)', padding: 'var(--sp-3)', textAlign: 'center' }}>
                      <div className="txt-xs txt-muted">Órdenes a borrar</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger)', marginTop: '2px' }}>
                        {vistaPreviaEliminar.ordenes_count || 0}
                      </div>
                      <div className="txt-xs txt-muted">{formatearSoles(vistaPreviaEliminar.ordenes_monto_cent || 0)}</div>
                    </div>
                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--borde)', borderRadius: 'var(--radius-sm)', padding: 'var(--sp-3)', textAlign: 'center' }}>
                      <div className="txt-xs txt-muted">Bonos a anular (Ciclo actual)</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger)', marginTop: '2px' }}>
                        {vistaPreviaEliminar.comisiones_generadas_count || 0}
                      </div>
                      <div className="txt-xs txt-muted">{formatearSoles(vistaPreviaEliminar.comisiones_generadas_cent || 0)}</div>
                    </div>
                  </div>
                )}

                {/* 4. CAMPOS DE CONFIRMACIÓN */}
                {vistaPreviaEliminar.puede_eliminar && (
                  <>
                    <div style={{ marginBottom: 'var(--sp-3)' }}>
                      <label htmlFor="motivo-eliminar" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: 'var(--texto-principal)' }}>
                        Motivo de la Eliminación <span style={{ color: 'var(--danger)' }}>* (Obligatorio)</span>
                      </label>
                      <input
                        id="motivo-eliminar"
                        type="text"
                        disabled={procesandoEliminar}
                        className="campo-input"
                        placeholder="Ej. Registro duplicado, error en patrocinio, cuenta de prueba..."
                        value={motivoEliminar}
                        onChange={(e) => setMotivoEliminar(e.target.value)}
                        style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
                      />
                    </div>

                    <div style={{ marginBottom: 'var(--sp-4)' }}>
                      <label htmlFor="palabra-confirmar-eliminar" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: 'var(--texto-principal)' }}>
                        Escribe la palabra <strong style={{ color: 'var(--danger)' }}>ELIMINAR</strong> para confirmar:
                      </label>
                      <input
                        id="palabra-confirmar-eliminar"
                        type="text"
                        disabled={procesandoEliminar}
                        className="campo-input"
                        placeholder="ELIMINAR"
                        value={palabraConfirmarEliminar}
                        onChange={(e) => setPalabraConfirmarEliminar(e.target.value)}
                        style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderColor: palabraConfirmarEliminar.trim().toUpperCase() === 'ELIMINAR' ? 'var(--danger)' : undefined }}
                      />
                    </div>
                  </>
                )}

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--sp-4)' }}>
                  <Boton
                    variante="secundario"
                    onClick={() => setModalEliminarAbierto(false)}
                    disabled={procesandoEliminar}
                  >
                    Cancelar
                  </Boton>
                  {vistaPreviaEliminar.puede_eliminar && (
                    <Boton
                      id="btn-confirmar-eliminar-definitivo"
                      variante="peligro"
                      onClick={handleEjecutarEliminar}
                      disabled={!motivoEliminar.trim() || palabraConfirmarEliminar.trim().toUpperCase() !== 'ELIMINAR' || procesandoEliminar}
                    >
                      {procesandoEliminar ? 'Eliminando socio...' : 'Confirmar Eliminación Definitiva'}
                    </Boton>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE MEJORA DE PACK (TAREA-26 / FLUJO 9) */}
      {modalUpgradeAbierto && socioUpgrade && (() => {
        const packActualId = socioUpgrade.pack_id || socioUpgrade.pack?.id;
        const packActualObj = packsDisponibles.find((p) => p.id === packActualId) || socioUpgrade.pack;
        const packActualPrecio = Number(packActualObj?.precio_cent || 0);
        // Regla 1: El selector muestra SOLO packs de precio_cent mayor al actual. Nunca uno igual ni menor.
        const packsSuperiores = packsDisponibles.filter((p) => Number(p.precio_cent) > packActualPrecio);
        const packDestinoObj = packsDisponibles.find((p) => String(p.id) === String(packDestinoId));
        const totalPagarCent = packDestinoObj ? Number(packDestinoObj.precio_cent) : 0;
        const puntosAcreditar = packDestinoObj ? Number(packDestinoObj.puntos_rango || 0) : 0;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-upgrade"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--sp-4)'
            }}
          >
            <div
              className="panel-blanco"
              style={{
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 'var(--sp-5)',
                borderRadius: 'var(--r-tarjeta, 8px)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
                borderTop: '4px solid var(--oro)'
              }}
            >
              {/* ENCABEZADO */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--sp-3)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} style={{ color: 'var(--oro)' }} />
                    <h2 id="titulo-modal-upgrade" className="txt-lg txt-bold" style={{ margin: 0 }}>
                      Mejorar Pack de Socio (Upgrade)
                    </h2>
                  </div>
                  <p className="txt-xs txt-muted" style={{ margin: '4px 0 0 0' }}>
                    Socio: <strong>{socioUpgrade.codigo}</strong> · {socioUpgrade.nombreCompleto || `${socioUpgrade.nombres} ${socioUpgrade.apellidos}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalUpgradeAbierto(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-muted)', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* MENSAJES DE ERROR */}
              {errorUpgrade && (
                <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} className="txt-gold" />
                    <strong className="txt-xs txt-gold">{errorUpgrade}</strong>
                  </div>
                </div>
              )}

              <form onSubmit={handleCrearUpgrade}>
                {/* 1. COMPARATIVA DE PACKS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  {/* PACK ACTUAL */}
                  <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--r-input)' }}>
                    <span className="txt-xs txt-muted" style={{ display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                      Pack Actual
                    </span>
                    <strong className="txt-sm txt-principal" style={{ display: 'block' }}>
                      {packActualObj?.nombre || 'Sin Pack'}
                    </strong>
                    <span className="txt-xs txt-muted">
                      {formatearSoles(packActualPrecio)}
                    </span>
                  </div>

                  {/* PACK DESTINO */}
                  <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--r-input)' }}>
                    <label htmlFor="selector-pack-nuevo" className="txt-xs txt-muted" style={{ display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                      Pack Nuevo <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    {packsSuperiores.length === 0 ? (
                      <span className="txt-xs txt-gold" style={{ fontWeight: 600, display: 'block', marginTop: '4px' }}>
                        ¡Tiene el Pack Máximo!
                      </span>
                    ) : (
                      <select
                        id="selector-pack-nuevo"
                        className="campo-input"
                        value={packDestinoId}
                        onChange={(e) => setPackDestinoId(e.target.value)}
                        style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                        required
                      >
                        <option value="">Selecciona un pack superior...</option>
                        {packsSuperiores.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} — {formatearSoles(p.precio_cent)} ({p.puntos_rango} pts)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* 2. REGLA NO NEGOCIABLE: TOTAL A PAGAR COMPLETO (RF-509) */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--r-input)',
                    padding: 'var(--sp-3)',
                    marginBottom: 'var(--sp-4)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="txt-xs txt-muted" style={{ display: 'block', fontWeight: 600 }}>
                        Total a Pagar (RF-509):
                      </span>
                      <span className="txt-xs txt-muted">
                        Se abona el pack <strong>COMPLETO</strong>, no la diferencia.
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="txt-xl txt-bold" style={{ color: 'var(--oro)', display: 'block' }}>
                        {packDestinoObj ? formatearSoles(totalPagarCent) : 'S/. 0.00'}
                      </span>
                      {packDestinoObj && (
                        <span className="badge badge-activo" style={{ fontSize: '10px' }}>
                          +{puntosAcreditar} pts de rango
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. DATOS DEL COMPROBANTE DE PAGO */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <h3 className="txt-sm txt-bold" style={{ marginBottom: 'var(--sp-2)', color: 'var(--texto-principal)' }}>
                    Comprobante de Pago (Voucher)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                    <div>
                      <label htmlFor="banco-upgrade" className="txt-xs txt-muted" style={{ display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                        Banco de Destino
                      </label>
                      <select
                        id="banco-upgrade"
                        className="campo-input"
                        value={bancoUpgrade}
                        onChange={(e) => setBancoUpgrade(e.target.value)}
                        style={{ width: '100%', fontSize: '12px' }}
                      >
                        <option value="BCP">BCP (Banco de Crédito)</option>
                        <option value="BBVA">BBVA Continental</option>
                        <option value="Interbank">Interbank</option>
                        <option value="Scotiabank">Scotiabank</option>
                        <option value="Banco de la Nación">Banco de la Nación</option>
                        <option value="Yape">Yape</option>
                        <option value="Plin">Plin</option>
                        <option value="Oficina">Efectivo / Oficina</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="num-operacion-upgrade" className="txt-xs txt-muted" style={{ display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                        Nº de Operación
                      </label>
                      <input
                        id="num-operacion-upgrade"
                        type="text"
                        className="campo-input"
                        placeholder="Ej. 0829104"
                        value={numOperacionUpgrade}
                        onChange={(e) => setNumOperacionUpgrade(e.target.value)}
                        style={{ width: '100%', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 'var(--sp-3)' }}>
                    <label htmlFor="fecha-deposito-upgrade" className="txt-xs txt-muted" style={{ display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                      Fecha de Depósito
                    </label>
                    <input
                      id="fecha-deposito-upgrade"
                      type="date"
                      className="campo-input"
                      value={fechaDepositoUpgrade}
                      onChange={(e) => setFechaDepositoUpgrade(e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>

                  {/* CAMPO ARCHIVO VOUCHER (TAREA-14 / TAREA-26) */}
                  <CampoArchivoVoucher
                    archivo={archivoVoucherUpgrade}
                    onArchivoChange={setArchivoVoucherUpgrade}
                    id="voucher-upgrade-archivo"
                    label="Foto o PDF del Voucher (Opcional)"
                  />
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--sp-4)' }}>
                  <Boton
                    variante="secundario"
                    type="button"
                    onClick={() => setModalUpgradeAbierto(false)}
                    disabled={guardandoUpgrade}
                  >
                    Cancelar
                  </Boton>
                  <Boton
                    id="btn-crear-upgrade"
                    variante="primario"
                    type="submit"
                    disabled={!packDestinoId || guardandoUpgrade || packsSuperiores.length === 0}
                  >
                    {guardandoUpgrade ? 'Creando orden...' : 'Crear Orden de Upgrade'}
                  </Boton>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
