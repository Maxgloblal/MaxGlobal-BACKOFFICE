import React, { useState, useEffect, useCallback } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import {
  Tabla,
  InsigniaEstado,
  Boton,
  TarjetaDato,
  EstadoVacio,
  DialogoConfirmar
} from '../piezas';
import {
  obtenerSolicitudesRetiroAdmin,
  aprobarSolicitudRetiro,
  rechazarSolicitudRetiro,
  buscarSociosConSaldoAdmin,
  registrarPagoDirectoSocioAdmin
} from '../servicios/operacionAdmin';
import { useSesion } from '../auth/SesionContext';
import {
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  AlertTriangle,
  AlertCircle,
  Building2,
  CreditCard,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  ShieldCheck,
  DollarSign,
  PlusCircle,
  UserCheck,
  Send
} from 'lucide-react';

/**
 * P-30 · Gestión de Retiros (Admin)
 * Aprobación y liquidación de solicitudes de retiro de billetera bancarias.
 * RF-293, RF-294 y TAREA-15.
 */
export default function P30GestionRetiros() {
  const { socio: adminActual } = useSesion();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Filtro de pestaña
  const [filtroTab, setFiltroTab] = useState('pendientes'); // 'pendientes' | 'historial'
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);
  const [modalRechazarAbierto, setModalRechazarAbierto] = useState(false);
  const [modalSaldoInsuficiente, setModalSaldoInsuficiente] = useState(false);

  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');

  // TAREA-43: Estados y flujo de Pago Directo a Socio por Administración
  const [modalPagoDirectoAbierto, setModalPagoDirectoAbierto] = useState(false);
  const [busquedaSocioPago, setBusquedaSocioPago] = useState('');
  const [sociosEncontrados, setSociosEncontrados] = useState([]);
  const [cargandoBusquedaSocio, setCargandoBusquedaSocio] = useState(false);
  const [socioSeleccionadoPago, setSocioSeleccionadoPago] = useState(null);
  const [montoPagoSoles, setMontoPagoSoles] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia BCP');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [notaPago, setNotaPago] = useState('');
  const [errorPagoDirecto, setErrorPagoDirecto] = useState('');
  const [procesandoPagoDirecto, setProcesandoPagoDirecto] = useState(false);
  const [modalConfirmarPagoDirecto, setModalConfirmarPagoDirecto] = useState(false);

  const handleAbrirModalPagoDirecto = async () => {
    setModalPagoDirectoAbierto(true);
    setSocioSeleccionadoPago(null);
    setBusquedaSocioPago('');
    setMontoPagoSoles('');
    setMetodoPago('Transferencia BCP');
    setNumeroOperacion('');
    setNotaPago('');
    setErrorPagoDirecto('');
    setCargandoBusquedaSocio(true);
    try {
      const socios = await buscarSociosConSaldoAdmin('');
      setSociosEncontrados(socios);
    } catch (err) {
      console.error('Error al precargar socios para pago:', err);
    } finally {
      setCargandoBusquedaSocio(false);
    }
  };

  const handleBuscarSociosPago = async (termino) => {
    setBusquedaSocioPago(termino);
    setCargandoBusquedaSocio(true);
    try {
      const socios = await buscarSociosConSaldoAdmin(termino);
      setSociosEncontrados(socios);
    } catch (err) {
      console.error('Error al buscar socios para pago:', err);
    } finally {
      setCargandoBusquedaSocio(false);
    }
  };

  const handleSeleccionarSocioPago = (socio) => {
    setSocioSeleccionadoPago(socio);
    setErrorPagoDirecto('');
    // Precargar banco si el socio lo tiene configurado
    if (socio.banco) {
      setMetodoPago(`Transferencia ${socio.banco}`);
    } else {
      setMetodoPago('Transferencia BCP');
    }
    if (socio.cuenta_bancaria || socio.cci) {
      setNumeroOperacion(socio.cuenta_bancaria || socio.cci || '');
    } else {
      setNumeroOperacion('');
    }
  };

  const handleSolicitarConfirmacionPagoDirecto = (e) => {
    if (e) e.preventDefault();
    setErrorPagoDirecto('');

    if (!socioSeleccionadoPago) {
      setErrorPagoDirecto('Por favor selecciona a un socio beneficiario.');
      return;
    }

    const montoNum = parseFloat(montoPagoSoles);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorPagoDirecto('Ingresa un monto válido mayor a cero.');
      return;
    }

    if (montoNum > socioSeleccionadoPago.saldoDisponibleSoles) {
      setErrorPagoDirecto(
        `El monto ingresado (${formatearSoles(Math.round(montoNum * 100))}) supera el saldo disponible actual del socio (${formatearSoles(socioSeleccionadoPago.saldoDisponibleCent)}).`
      );
      return;
    }

    setModalConfirmarPagoDirecto(true);
  };

  const handleEjecutarPagoDirecto = async () => {
    if (!socioSeleccionadoPago) return;
    const montoNum = parseFloat(montoPagoSoles);
    const montoCent = Math.round(montoNum * 100);

    setProcesandoPagoDirecto(true);
    setErrorPagoDirecto('');
    try {
      const adminId = adminActual?.id || 1;
      const res = await registrarPagoDirectoSocioAdmin({
        socioId: socioSeleccionadoPago.id,
        adminId,
        montoCent,
        metodoPago,
        numeroOperacion,
        nota: notaPago
      });

      setMensajeExito(
        `Pago directo de ${formatearSoles(montoCent)} a ${socioSeleccionadoPago.nombreCompleto} procesado con éxito. Se debitó de su billetera virtual.`
      );
      setModalConfirmarPagoDirecto(false);
      setModalPagoDirectoAbierto(false);
      setSocioSeleccionadoPago(null);
      await cargarDatos();
      setTimeout(() => setMensajeExito(null), 6000);
    } catch (err) {
      setErrorPagoDirecto(err.message || 'Error al procesar el pago directo al socio.');
      setModalConfirmarPagoDirecto(false);
    } finally {
      setProcesandoPagoDirecto(false);
    }
  };

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerSolicitudesRetiroAdmin();
      setSolicitudes(data);
    } catch (err) {
      console.error('Error al cargar solicitudes de retiro:', err);
      setError(err.message || 'Error al obtener la lista de solicitudes de retiro.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejadores de acciones
  const handleAbrirAprobar = (sol) => {
    setSolicitudSeleccionada(sol);
    if (!sol.saldoSuficiente) {
      // 🔴 Si el monto solicitado supera el saldo actual, no se puede aprobar
      setModalSaldoInsuficiente(true);
    } else {
      setModalAprobarAbierto(true);
    }
  };

  const handleAbrirRechazar = (sol) => {
    setSolicitudSeleccionada(sol);
    setMotivoRechazo('');
    setErrorMotivo('');
    setModalRechazarAbierto(true);
  };

  const handleConfirmarAprobacion = async () => {
    if (!solicitudSeleccionada) return;
    setProcesando(true);
    setError(null);
    try {
      const adminId = adminActual?.id || 1;
      await aprobarSolicitudRetiro(solicitudSeleccionada.id, adminId);
      setMensajeExito(
        `Retiro #${solicitudSeleccionada.id} por ${formatearSoles(solicitudSeleccionada.monto_cent)} de ${solicitudSeleccionada.nombreSocio} aprobado exitosamente. Se debitó de su billetera.`
      );
      setModalAprobarAbierto(false);
      setSolicitudSeleccionada(null);
      await cargarDatos();
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err) {
      setError(err.message || 'Error al aprobar la solicitud de retiro.');
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarRechazo = async () => {
    if (!solicitudSeleccionada) return;
    if (!motivoRechazo || !motivoRechazo.trim()) {
      setErrorMotivo('Debes indicar un motivo de rechazo claro para el socio.');
      return;
    }

    setProcesando(true);
    setError(null);
    try {
      const adminId = adminActual?.id || 1;
      await rechazarSolicitudRetiro(solicitudSeleccionada.id, adminId, motivoRechazo);
      setMensajeExito(
        `Solicitud #${solicitudSeleccionada.id} de ${solicitudSeleccionada.nombreSocio} rechazada. No se debitó saldo.`
      );
      setModalRechazarAbierto(false);
      setModalSaldoInsuficiente(false);
      setSolicitudSeleccionada(null);
      setMotivoRechazo('');
      await cargarDatos();
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err) {
      setError(err.message || 'Error al rechazar la solicitud de retiro.');
    } finally {
      setProcesando(false);
    }
  };

  // Filtrado
  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');
  const historial = solicitudes.filter((s) => s.estado !== 'pendiente');

  const totalPendienteCent = pendientes.reduce((acc, s) => acc + Number(s.monto_cent || 0), 0);
  const sociosPendientesCount = new Set(pendientes.map((s) => s.socio_id)).size;

  const listaActual = filtroTab === 'pendientes' ? pendientes : historial;
  const listaFiltrada = listaActual.filter((s) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      s.codigoSocio.toLowerCase().includes(term) ||
      s.nombreSocio.toLowerCase().includes(term) ||
      (s.banco && s.banco.toLowerCase().includes(term)) ||
      (s.cuenta && s.cuenta.toLowerCase().includes(term)) ||
      s.id.toString().includes(term)
    );
  });

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Panel Administración · P-30</span>
            <h1 className="pagina-titulo">Gestión de Retiros</h1>
            <p className="pagina-subtitulo">
              Aprobación y liquidación de solicitudes de retiro de billetera bancarias
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <Boton
              variante="primario"
              icono={PlusCircle}
              onClick={handleAbrirModalPagoDirecto}
              style={{ backgroundColor: 'var(--oro)', borderColor: 'var(--oro)', color: '#000', fontWeight: 600 }}
            >
              + Registrar Pago a Socio
            </Boton>
            <Boton variante="secundario" icono={RefreshCw} onClick={cargarDatos} deshabilitado={cargando}>
              Actualizar
            </Boton>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="box-alerta-exito" style={{ marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--verde)', flexShrink: 0 }} />
            <span className="txt-sm txt-bold">{mensajeExito}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="box-alerta-alerta" style={{ marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--peligro)', flexShrink: 0 }} />
            <span className="txt-sm txt-bold">{error}</span>
          </div>
        </div>
      )}

      {/* Métricas rápidas */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Solicitudes Pendientes"
          valor={pendientes.length}
          subrotulo="En cola de revisión contable"
          icono={Clock}
          variante={pendientes.length > 0 ? 'oro' : 'default'}
        />
        <TarjetaDato
          rotulo="Monto Solicitado Pendiente"
          valor={formatearSoles(totalPendienteCent)}
          subrotulo="Total a transferir si se aprueban"
          icono={Wallet}
          variante={totalPendienteCent > 0 ? 'destacada' : 'default'}
        />
        <TarjetaDato
          rotulo="Socios Solicitantes"
          valor={sociosPendientesCount}
          subrotulo="Socios distintos en espera"
          icono={Building2}
        />
      </div>

      {/* Pestañas de Navegación y Filtros */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--sp-4)',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)'
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button
            type="button"
            className={`kit-boton-tab ${filtroTab === 'pendientes' ? 'activo' : ''}`}
            onClick={() => setFiltroTab('pendientes')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--borde)',
              backgroundColor: filtroTab === 'pendientes' ? 'var(--verde-claro)' : 'var(--fondo-blanco)',
              color: filtroTab === 'pendientes' ? 'var(--verde)' : 'var(--texto-principal)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={16} />
            <span>Pendientes ({pendientes.length})</span>
          </button>

          <button
            type="button"
            className={`kit-boton-tab ${filtroTab === 'historial' ? 'activo' : ''}`}
            onClick={() => setFiltroTab('historial')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--borde)',
              backgroundColor: filtroTab === 'historial' ? 'var(--verde-claro)' : 'var(--fondo-blanco)',
              color: filtroTab === 'historial' ? 'var(--verde)' : 'var(--texto-principal)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={16} />
            <span>Historial Procesados ({historial.length})</span>
          </button>
        </div>

        {/* Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--texto-apagado)' }} />
          <input
            type="text"
            className="input-base"
            placeholder="Buscar por socio, código o banco..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
            <p className="seccion-desc">Cargando cola de retiros...</p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ padding: 'var(--sp-8)' }}>
            <EstadoVacio
              icono={Wallet}
              titulo={filtroTab === 'pendientes' ? 'No hay solicitudes pendientes' : 'No hay historial de solicitudes'}
              descripcion={
                filtroTab === 'pendientes'
                  ? 'Todas las solicitudes de retiro han sido procesadas o no hay solicitudes nuevas.'
                  : 'Aún no se registran retiros aprobados o rechazados.'
              }
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-transparente" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--borde)', textAlign: 'left', backgroundColor: 'var(--fondo-suave)' }}>
                  <th style={{ padding: '12px 16px' }}>Fecha</th>
                  <th style={{ padding: '12px 16px' }}>Socio</th>
                  <th style={{ padding: '12px 16px' }}>Destino Bancario</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Monto Solicitado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Saldo Actual Billetera</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Viabilidad</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((s) => {
                  const esPendiente = s.estado === 'pendiente';
                  const esAprobado = s.estado === 'aprobado' || s.estado === 'aprobada';
                  const esRechazado = s.estado === 'rechazado' || s.estado === 'rechazada';

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid var(--fondo-suave)',
                        backgroundColor: !s.saldoSuficiente && esPendiente ? 'rgba(239,68,68,0.03)' : 'transparent'
                      }}
                    >
                      {/* FECHA */}
                      <td style={{ padding: '12px 16px' }}>
                        <div>{new Date(s.solicitado_en).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                        <div className="txt-xs txt-muted">{new Date(s.solicitado_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* SOCIO */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(37,99,235,0.1)',
                              color: 'var(--info)'
                            }}
                          >
                            {s.codigoSocio || `ID: ${s.socio_id}`}
                          </span>
                          <strong className="txt-sm">{s.nombreSocio}</strong>
                        </div>
                        {s.documentoSocio && (
                          <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>
                            Doc: {s.documentoSocio}
                          </div>
                        )}
                      </td>

                      {/* BANCO Y CUENTA */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CreditCard size={14} style={{ color: 'var(--texto-apagado)' }} />
                          <strong className="txt-sm">{s.banco || 'No especificado'}</strong>
                        </div>
                        <div className="txt-xs txt-muted" style={{ marginTop: '2px', fontFamily: 'monospace' }}>
                          Cta: {s.cuenta || 'Sin cuenta'}
                        </div>
                      </td>

                      {/* MONTO SOLICITADO */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span className="txt-md txt-bold" style={{ color: 'var(--texto-principal)' }}>
                          {formatearSoles(s.monto_cent)}
                        </span>
                        {s.superaUmbral && (
                          <div
                            className="txt-xs"
                            style={{
                              color: 'var(--text-warning)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              marginTop: '2px'
                            }}
                            title="Supera el umbral de S/. 700.00 (detracción aplicable)"
                          >
                            <AlertTriangle size={11} /> Detracción
                          </div>
                        )}
                      </td>

                      {/* SALDO ACTUAL */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span
                          className="txt-md txt-bold"
                          style={{ color: s.saldoSuficiente ? 'var(--verde)' : 'var(--peligro)' }}
                        >
                          {formatearSoles(s.saldoActualCent)}
                        </span>
                        <div className="txt-xs txt-muted">en billetera</div>
                      </td>

                      {/* VIABILIDAD / ESTADO */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {esPendiente ? (
                          s.saldoSuficiente ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(16,185,129,0.12)',
                                color: 'var(--verde)'
                              }}
                            >
                              Saldo suficiente
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(239,68,68,0.12)',
                                color: 'var(--peligro)'
                              }}
                              title="El socio no cuenta con saldo disponible suficiente para cubrir este retiro"
                            >
                              Saldo insuficiente
                            </span>
                          )
                        ) : (
                          <div>
                            <InsigniaEstado
                              estadoTipo={esAprobado ? 'activo' : 'inactivo'}
                              textoPersonalizado={esAprobado ? 'Aprobado' : 'Rechazado'}
                            />
                            {esRechazado && s.motivo_rechazo && (
                              <div className="txt-xs txt-muted" style={{ marginTop: '4px', maxWidth: '200px' }}>
                                {s.motivo_rechazo}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {esPendiente ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleAbrirAprobar(s)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                backgroundColor: s.saldoSuficiente ? 'var(--green-400)' : 'var(--n-400)',
                                color: 'var(--text-on-dark)',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={14} /> Aprobar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAbrirRechazar(s)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--borde)',
                                backgroundColor: 'var(--surface-card)',
                                color: 'var(--peligro)',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={14} /> Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="txt-xs txt-muted">
                            Procesado {s.procesado_en ? new Date(s.procesado_en).toLocaleDateString('es-PE') : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: APROBAR RETIRO */}
      {modalAprobarAbierto && solicitudSeleccionada && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-4)'
          }}
          onClick={() => !procesando && setModalAprobarAbierto(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '520px',
              width: '100%',
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={22} style={{ color: 'var(--verde)' }} />
                <h3 className="txt-lg txt-bold">Aprobar Solicitud de Retiro</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAprobarAbierto(false)}
                disabled={procesando}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="txt-sm" style={{ color: 'var(--texto-secundario)', marginBottom: 'var(--sp-4)' }}>
              Al aprobar esta solicitud, se registrará un débito negativo inmediato en la billetera del socio. Máximo efectúa la transferencia bancaria fuera del sistema.
            </p>

            {/* Datos del Socio y Transferencia */}
            <div
              style={{
                backgroundColor: 'var(--fondo-suave)',
                padding: 'var(--sp-3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--sp-4)',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="txt-muted">Socio:</span>
                <strong>{solicitudSeleccionada.nombreSocio} ({solicitudSeleccionada.codigoSocio})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="txt-muted">Banco / Cuenta:</span>
                <span>{solicitudSeleccionada.banco} · Cta: {solicitudSeleccionada.cuenta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="txt-muted">Saldo actual en billetera:</span>
                <span className="txt-bold" style={{ color: 'var(--verde)' }}>
                  {formatearSoles(solicitudSeleccionada.saldoActualCent)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderTop: '1px dashed var(--borde)', paddingTop: '6px' }}>
                <span className="txt-muted">Monto a retirar (débito):</span>
                <strong style={{ color: 'var(--peligro)' }}>− {formatearSoles(solicitudSeleccionada.monto_cent)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--borde)' }}>
                <span className="txt-bold">Saldo posterior estimado:</span>
                <strong className="txt-bold" style={{ color: 'var(--texto-principal)' }}>
                  {formatearSoles(solicitudSeleccionada.saldoPosteriorEstimadoCent)}
                </strong>
              </div>
            </div>

            {/* BLOQUE 4: DETRACCIÓN (SI SUPERA S/. 700) */}
            {solicitudSeleccionada.superaUmbral && (
              <div
                style={{
                  backgroundColor: 'var(--warning-soft)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--sp-3)',
                  marginBottom: 'var(--sp-4)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-warning)', fontWeight: 700, marginBottom: '4px' }}>
                  <AlertTriangle size={15} />
                  <span>Monto superior a {formatearSoles(solicitudSeleccionada.umbralDetraccionCent)} · Corresponde Detracción</span>
                </div>

                {solicitudSeleccionada.detractionPendiente ? (
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-warning)', lineHeight: 1.4 }}>
                    ⚠️ <strong>Porcentaje pendiente de definir con el contador.</strong> No se calcula un importe neto estimado hasta que se configure la tasa en el sistema.
                  </p>
                ) : (
                  <div style={{ marginTop: '6px', color: 'var(--text-warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Monto Solicitado:</span>
                      <strong>{formatearSoles(solicitudSeleccionada.monto_cent)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Detracción ({solicitudSeleccionada.pctDetraccion}% Banco de la Nación):</span>
                      <strong>− {formatearSoles(solicitudSeleccionada.montoDetraccionCent)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-gold)', paddingTop: '4px', marginTop: '4px' }}>
                      <span className="txt-bold">Neto a transferir al socio:</span>
                      <strong className="txt-bold">{formatearSoles(solicitudSeleccionada.montoNetoCent)}</strong>
                    </div>
                  </div>
                )}

                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-warning)', fontStyle: 'italic' }}>
                  🔴 Regla contable: El débito a la billetera es SIEMPRE por el monto solicitado completo ({formatearSoles(solicitudSeleccionada.monto_cent)}).
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <Boton variante="secundario" onClick={() => setModalAprobarAbierto(false)} deshabilitado={procesando}>
                Cancelar
              </Boton>
              <Boton variante="primario" onClick={handleConfirmarAprobacion} cargando={procesando}>
                Aprobar Retiro y Debitar
              </Boton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SALDO INSUFICIENTE (PROTECCIÓN) */}
      {modalSaldoInsuficiente && solicitudSeleccionada && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-4)'
          }}
          onClick={() => setModalSaldoInsuficiente(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '480px',
              width: '100%',
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-3)' }}>
              <AlertCircle size={24} style={{ color: 'var(--peligro)' }} />
              <h3 className="txt-lg txt-bold" style={{ color: 'var(--peligro)' }}>
                Saldo Insuficiente para Aprobar
              </h3>
            </div>

            <p className="txt-sm" style={{ lineHeight: 1.5, marginBottom: 'var(--sp-4)' }}>
              El socio <strong>{solicitudSeleccionada.nombreSocio} ({solicitudSeleccionada.codigoSocio})</strong> ha solicitado{' '}
              <strong>{formatearSoles(solicitudSeleccionada.monto_cent)}</strong>, pero su saldo actual en billetera es de{' '}
              <strong style={{ color: 'var(--peligro)' }}>{formatearSoles(solicitudSeleccionada.saldoActualCent)}</strong>.
            </p>

            <p className="txt-xs txt-muted" style={{ marginBottom: 'var(--sp-4)' }}>
              Por regla de protección del sistema, no se puede aprobar un monto mayor al saldo disponible. Debes rechazar esta solicitud para que el socio ingrese una por un importe cubierto por su saldo.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <Boton variante="secundario" onClick={() => setModalSaldoInsuficiente(false)}>
                Cerrar
              </Boton>
              <Boton
                variante="peligro"
                onClick={() => {
                  setModalSaldoInsuficiente(false);
                  handleAbrirRechazar(solicitudSeleccionada);
                }}
              >
                Rechazar Solicitud
              </Boton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECHAZAR RETIRO (MOTIVO OBLIGATORIO) (TAREA-24) */}
      <DialogoConfirmar
        abierto={modalRechazarAbierto && !!solicitudSeleccionada}
        titulo="¿Rechazar solicitud de retiro?"
        mensaje={`Se va a rechazar la solicitud de retiro #${solicitudSeleccionada?.id} de ${solicitudSeleccionada?.nombreSocio} por ${formatearSoles(solicitudSeleccionada?.monto_cent || 0)}. No se debitará ningún monto de su billetera y el socio verá el motivo.`}
        textoConfirmar="Sí, rechazar"
        textoCancelar="Cancelar"
        variante="peligro"
        cargando={procesando}
        onConfirmar={handleConfirmarRechazo}
        onCancelar={() => {
          if (!procesando) {
            setModalRechazarAbierto(false);
            setErrorMotivo('');
          }
        }}
      >
        <div style={{ marginBottom: 'var(--sp-2)' }}>
          <label className="txt-xs txt-bold" style={{ display: 'block', marginBottom: '4px' }}>
            Motivo del Rechazo (Obligatorio) *
          </label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Indica el motivo claro (ej. Saldo insuficiente, datos de cuenta bancaria incorrectos, etc.)..."
            value={motivoRechazo}
            onChange={(e) => {
              setMotivoRechazo(e.target.value);
              if (errorMotivo) setErrorMotivo('');
            }}
            style={{
              width: '100%',
              fontSize: '13px',
              borderColor: errorMotivo ? 'var(--danger)' : 'var(--border-subtle)'
            }}
          />
          {errorMotivo && (
            <span className="txt-xs" style={{ color: 'var(--danger)', marginTop: '2px', display: 'block' }}>
              {errorMotivo}
            </span>
          )}
        </div>
      </DialogoConfirmar>

      {/* TAREA-43 · MODAL DE PAGO DIRECTO A SOCIO */}
      {modalPagoDirectoAbierto && (
        <div className="dialogo-overlay" role="dialog" aria-modal="true">
          <div className="dialogo-caja" style={{ maxWidth: '620px', width: '95%' }}>
            {/* Header del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--borde)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <span className="kit-header-badge" style={{ backgroundColor: 'var(--oro-claro)', color: 'var(--oro-oscuro)', marginBottom: '4px' }}>
                  Liquidación Administrativa · TAREA-43
                </span>
                <h3 className="dialogo-titulo" style={{ margin: 0, fontSize: '18px' }}>
                  Registrar Pago / Depósito Directo a Socio
                </h3>
                <span className="txt-xs txt-muted">
                  Transfiere y descuenta saldo de billetera en cualquier momento sin solicitud previa
                </span>
              </div>
              <button
                onClick={() => setModalPagoDirectoAbierto(false)}
                style={{ color: 'var(--texto-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error del formulario */}
            {errorPagoDirecto && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span className="txt-xs">{errorPagoDirecto}</span>
              </div>
            )}

            {/* PASO 1: SELECCIÓN DE SOCIO */}
            {!socioSeleccionadoPago ? (
              <div>
                <label className="txt-xs txt-bold" style={{ display: 'block', marginBottom: '6px' }}>
                  1. Buscar Socio Afiliado (por Código, Nombre o DNI):
                </label>
                <div style={{ position: 'relative', marginBottom: 'var(--sp-3)' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--texto-muted)' }} />
                  <input
                    type="text"
                    className="campo-input"
                    placeholder="Escribe para buscar (ej. Karla, MG00012, 10000012)..."
                    value={busquedaSocioPago}
                    onChange={(e) => handleBuscarSociosPago(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '13px' }}
                    autoFocus
                  />
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--borde)', borderRadius: 'var(--radius-sm)' }}>
                  {cargandoBusquedaSocio ? (
                    <div style={{ padding: 'var(--sp-4)', textAlign: 'center' }} className="txt-xs txt-muted">
                      Buscando socios y saldos...
                    </div>
                  ) : sociosEncontrados.length === 0 ? (
                    <div style={{ padding: 'var(--sp-4)', textAlign: 'center' }} className="txt-xs txt-muted">
                      No se encontraron socios con ese criterio de búsqueda.
                    </div>
                  ) : (
                    sociosEncontrados.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSeleccionarSocioPago(s)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--borde)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        className="item-socio-busqueda"
                      >
                        <div>
                          <strong className="txt-sm" style={{ display: 'block' }}>
                            {s.codigo} · {s.nombreCompleto}
                          </strong>
                          <span className="txt-xs txt-muted">
                            DNI: {s.documento || 'Sin doc'} {s.banco ? `· ${s.banco}` : ''}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: s.saldoDisponibleCent > 0 ? 'rgba(34, 197, 94, 0.15)' : 'var(--surface-sunken)',
                              color: s.saldoDisponibleCent > 0 ? 'var(--green-700)' : 'var(--texto-muted)',
                              fontWeight: 600,
                              fontSize: '12px'
                            }}
                          >
                            Saldo: {formatearSoles(s.saldoDisponibleCent)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* PASO 2: SOCIO SELECCIONADO Y DETALLES DEL PAGO */
              <form onSubmit={handleSolicitarConfirmacionPagoDirecto}>
                {/* Tarjeta del Socio Seleccionado */}
                <div style={{ backgroundColor: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 'var(--sp-4)', border: '1px solid var(--borde)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="txt-xs txt-muted" style={{ display: 'block' }}>Socio Beneficiario:</span>
                      <strong className="txt-sm" style={{ fontSize: '15px' }}>
                        {socioSeleccionadoPago.codigo} · {socioSeleccionadoPago.nombreCompleto}
                      </strong>
                      <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>
                        DNI: {socioSeleccionadoPago.documento || '—'} · Tel: {socioSeleccionadoPago.telefono || '—'}
                      </div>
                      {socioSeleccionadoPago.cuenta_bancaria && (
                        <div className="txt-xs" style={{ color: 'var(--texto-principal)', marginTop: '4px' }}>
                          <Building2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          <strong>{socioSeleccionadoPago.banco || 'Banco'}:</strong> {socioSeleccionadoPago.cuenta_bancaria}
                          {socioSeleccionadoPago.cci ? ` (CCI: ${socioSeleccionadoPago.cci})` : ''}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="txt-xs txt-muted" style={{ display: 'block' }}>Saldo Disponible:</span>
                      <strong className="txt-md txt-bold" style={{ color: 'var(--green-700)', fontSize: '18px' }}>
                        {formatearSoles(socioSeleccionadoPago.saldoDisponibleCent)}
                      </strong>
                      <button
                        type="button"
                        onClick={() => setSocioSeleccionadoPago(null)}
                        style={{
                          display: 'block',
                          marginTop: '4px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--primario)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Cambiar socio
                      </button>
                    </div>
                  </div>
                </div>

                {/* Formulario de Pago */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="txt-xs txt-bold">
                        Monto a Pagar (S/.) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setMontoPagoSoles(String(socioSeleccionadoPago.saldoDisponibleSoles))}
                        style={{ background: 'none', border: 'none', color: 'var(--oro-oscuro)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Pagar Todo el Saldo
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={socioSeleccionadoPago.saldoDisponibleSoles}
                      className="campo-input"
                      placeholder="0.00"
                      value={montoPagoSoles}
                      onChange={(e) => setMontoPagoSoles(e.target.value)}
                      required
                      style={{ fontSize: '14px', fontWeight: 600 }}
                    />
                    {parseFloat(montoPagoSoles) > socioSeleccionadoPago.saldoDisponibleSoles && (
                      <span className="txt-xs" style={{ color: 'var(--danger)', marginTop: '2px', display: 'block' }}>
                        Supera el saldo disponible ({formatearSoles(socioSeleccionadoPago.saldoDisponibleCent)})
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="txt-xs txt-bold" style={{ display: 'block', marginBottom: '4px' }}>
                      Método / Banco de Pago *
                    </label>
                    <select
                      className="campo-input"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="Transferencia BCP">Transferencia BCP</option>
                      <option value="Transferencia BBVA">Transferencia BBVA</option>
                      <option value="Transferencia Interbank">Transferencia Interbank</option>
                      <option value="Transferencia Banco de la Nación">Transferencia Banco de la Nación</option>
                      <option value="Yape / Plin">Yape / Plin</option>
                      <option value="Efectivo en Oficina">Efectivo en Oficina</option>
                      <option value="Transferencia Interbancaria (CCI)">Transferencia Interbancaria (CCI)</option>
                      <option value="Otro">Otro medio de pago</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  <div>
                    <label className="txt-xs txt-bold" style={{ display: 'block', marginBottom: '4px' }}>
                      Nº de Operación / Transferencia (Opcional):
                    </label>
                    <input
                      type="text"
                      className="campo-input"
                      placeholder="Ej. OP-984210"
                      value={numeroOperacion}
                      onChange={(e) => setNumeroOperacion(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label className="txt-xs txt-bold" style={{ display: 'block', marginBottom: '4px' }}>
                      Concepto / Nota Contable:
                    </label>
                    <input
                      type="text"
                      className="campo-input"
                      placeholder="Ej. Liquidación de comisiones quincena"
                      value={notaPago}
                      onChange={(e) => setNotaPago(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Resumen Contable Previo */}
                {parseFloat(montoPagoSoles) > 0 && parseFloat(montoPagoSoles) <= socioSeleccionadoPago.saldoDisponibleSoles && (
                  <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 'var(--sp-4)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>Monto a debitar de la billetera:</span>
                      <strong style={{ color: 'var(--danger)' }}>− {formatearSoles(Math.round(parseFloat(montoPagoSoles) * 100))}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                      <span>Nuevo saldo restante del socio:</span>
                      <strong style={{ color: 'var(--green-700)' }}>
                        {formatearSoles(Math.max(0, socioSeleccionadoPago.saldoDisponibleCent - Math.round(parseFloat(montoPagoSoles) * 100)))}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Botones del Modal */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Boton
                    variante="secundario"
                    type="button"
                    onClick={() => setModalPagoDirectoAbierto(false)}
                  >
                    Cancelar
                  </Boton>
                  <Boton
                    variante="primario"
                    type="submit"
                    icono={Send}
                    deshabilitado={
                      !parseFloat(montoPagoSoles) ||
                      parseFloat(montoPagoSoles) <= 0 ||
                      parseFloat(montoPagoSoles) > socioSeleccionadoPago.saldoDisponibleSoles
                    }
                    style={{ backgroundColor: 'var(--oro)', borderColor: 'var(--oro)', color: '#000', fontWeight: 600 }}
                  >
                    Continuar al Pago
                  </Boton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN FINAL */}
      <DialogoConfirmar
        abierto={modalConfirmarPagoDirecto}
        titulo="Confirmar Pago y Débito de Billetera"
        mensaje={
          socioSeleccionadoPago && montoPagoSoles
            ? `¿Estás seguro de registrar el pago de ${formatearSoles(Math.round(parseFloat(montoPagoSoles) * 100))} a ${socioSeleccionadoPago.nombreCompleto} (${socioSeleccionadoPago.codigo})? Este monto se descontará inmediatamente de su billetera virtual.`
            : '¿Confirmar pago?'
        }
        textoConfirmar="Sí, Descontar y Procesar Pago"
        textoCancelar="Cancelar"
        variante="peligro"
        procesando={procesandoPagoDirecto}
        onConfirmar={handleEjecutarPagoDirecto}
        onCancelar={() => setModalConfirmarPagoDirecto(false)}
      />
    </div>
  );
}
