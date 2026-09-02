import React, { useState, useEffect, useCallback } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import {
  Tabla,
  InsigniaEstado,
  Boton,
  DialogoConfirmar,
  CampoTextarea,
  EstadoVacio
} from '../piezas';
import {
  CheckCircle,
  XCircle,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  X,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  cargarBandejaConfirmacion,
  calcularImpactoOrden,
  confirmarPagoOrden,
  rechazarPagoOrden
} from '../servicios/operacionAdmin';

/**
 * P-23 · Bandeja de Confirmación de Pagos (Admin)
 * Operación crítica: Acredita puntos y dispara comisiones al confirmar.
 * Conexión a datos reales de Supabase con protección de base de datos contra doble confirmación (RF-347).
 */
export default function P23BandejaConfirmacion() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [impactoCalculado, setImpactoCalculado] = useState(null);
  const [calculandoImpacto, setCalculandoImpacto] = useState(false);

  const [dialogoConfirmarAbierto, setDialogoConfirmarAbierto] = useState(false);
  const [dialogoRechazarAbierto, setDialogoRechazarAbierto] = useState(false);
  const [modalZoomVoucher, setModalZoomVoucher] = useState(false);

  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const data = await cargarBandejaConfirmacion();
      setPedidos(data);
      if (data.length > 0) {
        // Mantener selección o elegir el primero
        setPedidoSeleccionado((prev) => {
          if (prev) {
            const encontrado = data.find((p) => p.id === prev.id);
            return encontrado || data[0];
          }
          return data[0];
        });
      } else {
        setPedidoSeleccionado(null);
      }
    } catch (err) {
      setErrorCarga(err.message || 'Error al cargar la bandeja de confirmación');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Calcular el impacto en seco cada vez que cambia el pedido seleccionado (RF-344, RF-345)
  useEffect(() => {
    let cancelado = false;
    async function obtenerImpacto() {
      if (!pedidoSeleccionado) {
        setImpactoCalculado(null);
        return;
      }
      setCalculandoImpacto(true);
      try {
        const res = await calcularImpactoOrden(pedidoSeleccionado);
        if (!cancelado) {
          setImpactoCalculado(res);
        }
      } catch (err) {
        console.error('Error al calcular impacto en seco:', err);
      } finally {
        if (!cancelado) setCalculandoImpacto(false);
      }
    }
    obtenerImpacto();
    return () => {
      cancelado = true;
    };
  }, [pedidoSeleccionado]);

  const columnasPedidos = [
    { key: 'codigo', label: 'Pedido' },
    {
      key: 'socio',
      label: 'Socio',
      render: (f) =>
        `${f.socio?.nombres || ''} ${f.socio?.apellidos || ''} (${f.socio?.codigo || ''})`
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (f) => (f.tipo === 'afiliacion' ? 'Afiliación' : 'Recompra')
    },
    {
      key: 'montoEsperado',
      label: 'Monto Esperado',
      render: (f) => formatearSoles(f.total_cent)
    },
    {
      key: 'accion',
      label: 'Detalle',
      render: (f) => (
        <Boton
          variante={pedidoSeleccionado?.id === f.id ? 'primario' : 'secundario'}
          className="btn-mini"
          onClick={() => setPedidoSeleccionado(f)}
        >
          Revisar
        </Boton>
      )
    }
  ];

  // RF-347 y RF-348: Ejecutar confirmación en base de datos con UPDATE condicional
  const handleEjecutarConfirmacion = async () => {
    if (!pedidoSeleccionado) return;
    setProcesando(true);
    setMensajeAlerta(null);

    try {
      const comisionesAInsertar = impactoCalculado?.comisiones || [];
      const res = await confirmarPagoOrden(pedidoSeleccionado.id, comisionesAInsertar);

      if (res && res.exito === false) {
        setMensajeAlerta({
          tipo: 'error',
          texto: res.mensaje || 'La orden ya fue confirmada por otro operador.'
        });
      } else {
        setMensajeAlerta({
          tipo: 'exito',
          texto: `Pago de la orden ${pedidoSeleccionado.codigo} confirmado exitosamente. Puntos y comisiones acreditados.`
        });
      }

      setDialogoConfirmarAbierto(false);
      await cargarDatos();
    } catch (err) {
      setMensajeAlerta({
        tipo: 'error',
        texto: err.message || 'Ocurrió un error al confirmar el pago en la base de datos.'
      });
      setDialogoConfirmarAbierto(false);
    } finally {
      setProcesando(false);
    }
  };

  // RF-350: Ejecutar rechazo con motivo obligatorio
  const handleEjecutarRechazo = async () => {
    if (!motivoRechazo.trim()) {
      setErrorMotivo('El motivo de rechazo es obligatorio para auditar la operación.');
      return;
    }
    if (!pedidoSeleccionado) return;

    setProcesando(true);
    setMensajeAlerta(null);

    try {
      const res = await rechazarPagoOrden(pedidoSeleccionado.id, motivoRechazo);

      if (res && res.exito === false) {
        setMensajeAlerta({
          tipo: 'error',
          texto: res.mensaje || 'No se pudo rechazar la orden.'
        });
      } else {
        setMensajeAlerta({
          tipo: 'exito',
          texto: `Orden ${pedidoSeleccionado.codigo} rechazada. Se registró el motivo para el socio.`
        });
      }

      setDialogoRechazarAbierto(false);
      setMotivoRechazo('');
      setErrorMotivo('');
      await cargarDatos();
    } catch (err) {
      setMensajeAlerta({
        tipo: 'error',
        texto: err.message || 'Error al rechazar el pedido.'
      });
      setDialogoRechazarAbierto(false);
    } finally {
      setProcesando(false);
    }
  };

  const voucherActual = Array.isArray(pedidoSeleccionado?.voucher)
    ? pedidoSeleccionado.voucher[0]
    : pedidoSeleccionado?.voucher;

  const montoEsperadoCent = Number(pedidoSeleccionado?.total_cent || 0);
  const montoDeclaradoCent = Number(voucherActual?.monto_cent ?? montoEsperadoCent);
  const hayDescuadre = voucherActual && montoDeclaradoCent !== montoEsperadoCent;
  const diferenciaCent = Math.abs(montoEsperadoCent - montoDeclaradoCent);

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-23</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Bandeja de Confirmación</h1>
            <p className="pagina-subtitulo">
              Revisión de comprobantes bancarios para acreditación de compras y comisiones
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <Boton
              variante="secundario"
              icono={RefreshCw}
              onClick={cargarDatos}
              disabled={cargando}
            >
              Actualizar
            </Boton>
            <span
              className="armazon-badge-rango"
              style={{ backgroundColor: 'var(--gold-100)', color: 'var(--gold-800)' }}
            >
              {pedidos.length} pedidos pendientes
            </span>
          </div>
        </div>
      </div>

      {/* Alertas de Operación */}
      {mensajeAlerta && (
        <div
          role="alert"
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--r-input)',
            marginBottom: 'var(--sp-4)',
            background: mensajeAlerta.tipo === 'error' ? 'var(--danger-soft)' : 'var(--success-soft)',
            color: mensajeAlerta.tipo === 'error' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${mensajeAlerta.tipo === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}`,
            fontSize: 'var(--fs-sm)',
            fontWeight: 500
          }}
        >
          {mensajeAlerta.texto}
        </div>
      )}

      {errorCarga && (
        <div
          role="alert"
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--r-input)',
            marginBottom: 'var(--sp-4)',
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            fontSize: 'var(--fs-sm)'
          }}
        >
          {errorCarga}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
          <Clock size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: 'var(--sp-2)' }} />
          <div>Cargando pedidos por confirmar...</div>
        </div>
      ) : pedidos.length === 0 ? (
        <EstadoVacio
          icono={ShieldCheck}
          titulo="Bandeja limpia · Sin pagos pendientes"
          mensaje="Todos los comprobantes de pago han sido confirmados o procesados."
          accionTexto="Actualizar Bandeja"
          onAccion={cargarDatos}
        />
      ) : (
        /* VISTA SPLIT: LISTA + DETALLE DE REVISIÓN */
        <div className="grid-panel-split">
          {/* COLUMNA IZQUIERDA: LISTADO Y VOUCHER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                Cola de Pedidos por Confirmar
              </h3>
              <Tabla columnas={columnasPedidos} datos={pedidos} />
            </div>

            {/* Visualizador del Voucher (RF-341, RF-343) */}
            {pedidoSeleccionado && (
              <div className="panel-blanco">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--sp-3)'
                  }}
                >
                  <h3 className="seccion-titulo">
                    <Receipt size={20} />
                    <span>Comprobante de Pago</span>
                  </h3>
                  <InsigniaEstado estadoTipo="por_confirmar" />
                </div>

                <div className="box-voucher-preview">
                  <div
                    style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
                    onClick={() => setModalZoomVoucher(true)}
                    title="Clic para ampliar comprobante"
                  >
                    <img
                      src={voucherActual?.imagen_url || '/brand/voucher-demo.jpg'}
                      alt="Voucher de pago"
                      style={{
                        maxHeight: '160px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: 'var(--r-input)',
                        border: '1px solid var(--border-subtle)'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300?text=Voucher+Bancario';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: '8px',
                        bottom: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ZoomIn size={12} /> Ampliar
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--sp-2)' }} className="txt-xs txt-muted">
                    {voucherActual?.banco || 'Banco no especificado'} · Op:{' '}
                    {voucherActual?.numero_operacion || 'S/N'} · Fecha:{' '}
                    {voucherActual?.fecha_deposito || 'No indicada'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: DATOS DEL PEDIDO + IMPACTO + ACCIONES */}
          {pedidoSeleccionado && (
            <div
              className="panel-blanco"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
            >
              <div
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 'var(--sp-3)'
                }}
              >
                <span className="kit-estado-label">Detalle del Pedido</span>
                <h2 className="txt-xl" style={{ margin: '4px 0' }}>
                  {pedidoSeleccionado.codigo} — {pedidoSeleccionado.socio?.nombres}{' '}
                  {pedidoSeleccionado.socio?.apellidos}
                </h2>
                <span className="txt-xs txt-muted">
                  Código: {pedidoSeleccionado.socio?.codigo} · Pack:{' '}
                  {pedidoSeleccionado.socio?.pack?.nombre || 'Socio'} · Tipo:{' '}
                  {pedidoSeleccionado.tipo === 'afiliacion' ? 'Afiliación' : 'Recompra'}
                </span>
              </div>

              {/* RF-342: Descuadre de Montos visiblemente destacado en rojo */}
              {hayDescuadre && (
                <div
                  role="alert"
                  style={{
                    background: 'var(--danger-soft)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--r-input)',
                    padding: 'var(--sp-3)',
                    color: 'var(--danger)',
                    fontSize: 'var(--fs-xs)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--sp-2)'
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>⚠️ Advertencia de Descuadre de Montos (RF-342):</strong>
                    <div>
                      Monto Esperado: <strong>{formatearSoles(montoEsperadoCent)}</strong> vs
                      Declarado en Voucher: <strong>{formatearSoles(montoDeclaradoCent)}</strong>
                    </div>
                    <div>Diferencia exacta: {formatearSoles(diferenciaCent)}</div>
                  </div>
                </div>
              )}

              {/* Comparación de Montos */}
              <div className="box-comparativa-montos">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--sp-2)'
                  }}
                >
                  <span className="txt-xs txt-muted">Monto Esperado:</span>
                  <span className="txt-bold">{formatearSoles(montoEsperadoCent)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--sp-2)'
                  }}
                >
                  <span className="txt-xs txt-muted">Monto Declarado en Voucher:</span>
                  <span className={`txt-bold ${hayDescuadre ? 'txt-danger' : 'txt-green'}`}>
                    {formatearSoles(montoDeclaradoCent)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="txt-xs txt-muted">Puntos a Acreditar:</span>
                  <span className="txt-bold">{pedidoSeleccionado.puntos_total} pts</span>
                </div>
              </div>

              {/* BLOQUE OBLIGATORIO: QUÉ VA A OCURRIR (RF-344 / RF-345) */}
              <div className="panel-explicacion-cero">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <ShieldCheck size={20} className="txt-gold" />
                  <h4 className="txt-gold" style={{ margin: 0 }}>
                    Impacto en el Motor al Confirmar
                  </h4>
                </div>
                {calculandoImpacto ? (
                  <p className="txt-xs txt-muted" style={{ margin: 'var(--sp-2) 0' }}>
                    Calculando comisiones y activación en seco...
                  </p>
                ) : (
                  <ul className="lista-impacto">
                    <li>
                      <strong>Activación:</strong>{' '}
                      {pedidoSeleccionado.tipo === 'afiliacion'
                        ? `${pedidoSeleccionado.socio?.nombres} ${pedidoSeleccionado.socio?.apellidos} (${pedidoSeleccionado.socio?.codigo}) pasará a ACTIVO`
                        : `${pedidoSeleccionado.socio?.nombres} ${pedidoSeleccionado.socio?.apellidos} mantiene activación en ciclo actual`}
                    </li>
                    <li>
                      <strong>Volumen:</strong> Acredita {pedidoSeleccionado.puntos_total} puntos
                      personales en el ciclo
                    </li>
                    <li>
                      <strong>Comisiones:</strong> Se generarán{' '}
                      {impactoCalculado?.cantidadComisiones || 0} comisiones por un total de{' '}
                      {formatearSoles(impactoCalculado?.totalPagadoCent || 0)}
                    </li>
                  </ul>
                )}
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                <Boton
                  variante="primario"
                  bloque={true}
                  icono={CheckCircle}
                  onClick={() => setDialogoConfirmarAbierto(true)}
                  disabled={procesando}
                >
                  Confirmar Pago
                </Boton>
                <Boton
                  variante="peligro"
                  bloque={true}
                  icono={XCircle}
                  onClick={() => setDialogoRechazarAbierto(true)}
                  disabled={procesando}
                >
                  Rechazar...
                </Boton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN EXPLÍCITA (RF-346, RF-347) */}
      {pedidoSeleccionado && (
        <DialogoConfirmar
          abierto={dialogoConfirmarAbierto}
          titulo={`¿Confirmar pago de ${pedidoSeleccionado.codigo}?`}
          mensaje={
            `AL CONFIRMAR ESTE PAGO:\n` +
            `• ${pedidoSeleccionado.socio?.nombres} ${pedidoSeleccionado.socio?.apellidos} (${pedidoSeleccionado.socio?.codigo}) ${pedidoSeleccionado.tipo === 'afiliacion' ? 'pasará a ACTIVO' : 'acumula puntos'}\n` +
            `• Se acreditarán ${pedidoSeleccionado.puntos_total} puntos\n` +
            `• Se generarán ${impactoCalculado?.cantidadComisiones || 0} comisiones por un total de ${formatearSoles(impactoCalculado?.totalPagadoCent || 0)}\n\n` +
            `Esta acción es irreversible en la base de datos.`
          }
          textoConfirmar="Sí, Confirmar y Acreditar"
          textoCancelar="Cancelar"
          variante="primario"
          cargando={procesando}
          onConfirmar={handleEjecutarConfirmacion}
          onCancelar={() => setDialogoConfirmarAbierto(false)}
        />
      )}

      {/* MODAL DE RECHAZO DE PAGO CON MOTIVO OBLIGATORIO (RF-350) */}
      {pedidoSeleccionado && (
        <DialogoConfirmar
          abierto={dialogoRechazarAbierto}
          titulo={`Rechazar pedido ${pedidoSeleccionado.codigo}`}
          mensaje="El socio recibirá una notificación con el motivo del rechazo para adjuntar un nuevo comprobante (RF-351)."
          textoConfirmar="Rechazar Pedido"
          textoCancelar="Cancelar"
          variante="peligro"
          cargando={procesando}
          onConfirmar={handleEjecutarRechazo}
          onCancelar={() => {
            setDialogoRechazarAbierto(false);
            setErrorMotivo('');
          }}
        >
          <CampoTextarea
            label="Motivo del Rechazo (Obligatorio)"
            id="motivo-rechazo"
            placeholder="Ej. Voucher ilegible, monto no coincide con la cuenta, operación duplicada..."
            value={motivoRechazo}
            onChange={(e) => {
              setMotivoRechazo(e.target.value);
              if (e.target.value.trim()) setErrorMotivo('');
            }}
            error={errorMotivo}
            required={true}
          />
        </DialogoConfirmar>
      )}

      {/* MODAL DE AMPLIACIÓN DE VOUCHER (RF-343) */}
      {modalZoomVoucher && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-4)'
          }}
          onClick={() => setModalZoomVoucher(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#fff',
              borderRadius: 'var(--r-tarjeta)',
              padding: 'var(--sp-4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--sp-3)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--fs-base)' }}>
                Comprobante: {pedidoSeleccionado?.codigo}
              </h3>
              <button
                onClick={() => setModalZoomVoucher(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={voucherActual?.imagen_url || '/brand/voucher-demo.jpg'}
              alt="Voucher ampliado"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/800x600?text=Voucher+Bancario+Completo';
              }}
            />
            <div style={{ marginTop: 'var(--sp-2)', textAlign: 'center' }} className="txt-xs txt-muted">
              {voucherActual?.banco} · Op: {voucherActual?.numero_operacion} · Monto:{' '}
              {formatearSoles(montoDeclaradoCent)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
