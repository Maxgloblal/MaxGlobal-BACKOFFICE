import React, { useState } from 'react';
import { pedidosPorConfirmar } from '../datos-falsos/adminEjemplo';
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
  ShieldCheck
} from 'lucide-react';

/**
 * P-23 · Bandeja de Confirmación de Pagos (Admin)
 * Pantalla crítica: Acredita puntos y dispara comisiones al confirmar.
 * Requiere vista previa del comprobante + detalle del impacto + confirmación explícita.
 */
export default function P23BandejaConfirmacion() {
  const [pedidos, setPedidos] = useState(pedidosPorConfirmar);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(pedidosPorConfirmar[0] || null);
  const [dialogoConfirmarAbierto, setDialogoConfirmarAbierto] = useState(false);
  const [dialogoRechazarAbierto, setDialogoRechazarAbierto] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const columnasPedidos = [
    { key: 'numero', label: 'Pedido' },
    { key: 'socio', label: 'Socio', render: (f) => `${f.socio} (${f.codigoSocio})` },
    { key: 'tipo', label: 'Tipo' },
    { key: 'montoEsperado', label: 'Monto', render: (f) => `S/. ${f.montoEsperado}` },
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

  const handleEjecutarConfirmacion = () => {
    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      setDialogoConfirmarAbierto(false);
      const restantes = pedidos.filter(p => p.id !== pedidoSeleccionado.id);
      setPedidos(restantes);
      setPedidoSeleccionado(restantes[0] || null);
      alert(`Pago del pedido ${pedidoSeleccionado.numero} confirmado exitosamente. Puntos y comisiones acreditados.`);
    }, 1000);
  };

  const handleEjecutarRechazo = () => {
    if (!motivoRechazo.trim()) {
      setErrorMotivo('El motivo de rechazo es obligatorio para auditar la operación.');
      return;
    }
    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      setDialogoRechazarAbierto(false);
      setMotivoRechazo('');
      setErrorMotivo('');
      const restantes = pedidos.filter(p => p.id !== pedidoSeleccionado.id);
      setPedidos(restantes);
      setPedidoSeleccionado(restantes[0] || null);
      alert(`Pedido ${pedidoSeleccionado.numero} rechazado. Se registró el motivo: "${motivoRechazo}".`);
    }, 1000);
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-23</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Bandeja de Confirmación</h1>
            <p className="pagina-subtitulo">
              Revisión de vouchers bancarios para acreditación de compras y comisiones
            </p>
          </div>
          <span className="armazon-badge-rango" style={{ backgroundColor: 'var(--gold-100)', color: 'var(--gold-800)' }}>
            {pedidos.length} pedidos pendientes
          </span>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <EstadoVacio
          icono={ShieldCheck}
          titulo="Bandeja limpia · Sin pagos pendientes"
          mensaje="Todos los comprobantes de pago han sido confirmados o procesados."
          accionTexto="Actualizar Bandeja"
          onAccion={() => setPedidos(pedidosPorConfirmar)}
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
              <Tabla
                columnas={columnasPedidos}
                datos={pedidos}
              />
            </div>

            {/* Visualizador del Voucher */}
            {pedidoSeleccionado && (
              <div className="panel-blanco">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                  <h3 className="seccion-titulo">
                    <Receipt size={20} />
                    <span>Comprobante de Pago</span>
                  </h3>
                  <InsigniaEstado estadoTipo="por_confirmar" />
                </div>

                <div className="box-voucher-preview">
                  <img
                    src={pedidoSeleccionado.voucherUrl}
                    alt="Voucher de pago"
                    style={{ maxHeight: '140px', objectFit: 'contain', marginBottom: 'var(--sp-2)' }}
                  />
                  <span className="txt-xs txt-muted">
                    {pedidoSeleccionado.banco} · {pedidoSeleccionado.numOperacion}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: DATOS DEL PEDIDO + IMPACTO + ACCIONES */}
          {pedidoSeleccionado && (
            <div className="panel-blanco" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--sp-3)' }}>
                <span className="kit-estado-label">Detalle del Pedido</span>
                <h2 className="txt-xl" style={{ margin: '4px 0' }}>
                  {pedidoSeleccionado.numero} — {pedidoSeleccionado.socio}
                </h2>
                <span className="txt-xs txt-muted">
                  Código: {pedidoSeleccionado.codigoSocio} · Fecha: {pedidoSeleccionado.fecha}
                </span>
              </div>

              {/* Comparación de Montos */}
              <div className="box-comparativa-montos">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                  <span className="txt-xs txt-muted">Monto Esperado:</span>
                  <span className="txt-bold">S/. {pedidoSeleccionado.montoEsperado}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                  <span className="txt-xs txt-muted">Monto Declarado en Voucher:</span>
                  <span className="txt-bold txt-green">S/. {pedidoSeleccionado.montoDeclarado}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="txt-xs txt-muted">Puntos a Acreditar:</span>
                  <span className="txt-bold">{pedidoSeleccionado.puntos} pts</span>
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
                <ul className="lista-impacto">
                  <li><strong>Activación:</strong> {pedidoSeleccionado.impacto.socioActiva}</li>
                  <li><strong>Volumen:</strong> Acredita {pedidoSeleccionado.impacto.puntosAcreditar} puntos personales y grupales</li>
                  <li><strong>Comisiones:</strong> Dispara S/. {pedidoSeleccionado.impacto.comisionesGenerar} repartidos en la línea ascendente</li>
                </ul>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                <Boton
                  variante="primario"
                  bloque={true}
                  icono={CheckCircle}
                  onClick={() => setDialogoConfirmarAbierto(true)}
                >
                  Confirmar Pago
                </Boton>
                <Boton
                  variante="peligro"
                  bloque={true}
                  icono={XCircle}
                  onClick={() => setDialogoRechazarAbierto(true)}
                >
                  Rechazar...
                </Boton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN DE PAGO */}
      {pedidoSeleccionado && (
        <DialogoConfirmar
          abierto={dialogoConfirmarAbierto}
          titulo={`¿Confirmar pago de ${pedidoSeleccionado.numero}?`}
          mensaje={`Se acreditarán ${pedidoSeleccionado.puntos} puntos a ${pedidoSeleccionado.socio} y se calcularán las comisiones de la línea. Esta operación queda auditada.`}
          textoConfirmar="Sí, Confirmar y Acreditar"
          textoCancelar="Cancelar"
          variante="primario"
          cargando={procesando}
          onConfirmar={handleEjecutarConfirmacion}
          onCancelar={() => setDialogoConfirmarAbierto(false)}
        />
      )}

      {/* MODAL DE RECHAZO DE PAGO CON MOTIVO OBLIGATORIO */}
      {pedidoSeleccionado && (
        <DialogoConfirmar
          abierto={dialogoRechazarAbierto}
          titulo={`Rechazar pedido ${pedidoSeleccionado.numero}`}
          mensaje="El socio recibirá una notificación con el motivo del rechazo para adjuntar un nuevo comprobante."
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
    </div>
  );
}
