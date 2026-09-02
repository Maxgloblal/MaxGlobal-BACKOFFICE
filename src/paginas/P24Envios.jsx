import React, { useState, useEffect, useCallback } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import {
  Tabla,
  InsigniaEstado,
  Boton,
  DialogoConfirmar,
  CampoTexto,
  CampoTextarea,
  EstadoVacio
} from '../piezas';
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  Printer,
  Package,
  Clock,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import {
  cargarEnvios,
  marcarEnvioDespachado,
  marcarEnvioEntregado,
  registrarIncidenciaEnvio
} from '../servicios/operacionAdmin';

export default function P24Envios() {
  const [envios, setEnvios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);

  // Modales
  const [modalDespacharAbierto, setModalDespacharAbierto] = useState(false);
  const [agenciaDespacho, setAgenciaDespacho] = useState('Shalom');
  const [numeroGuia, setNumeroGuia] = useState('');

  const [modalEntregarAbierto, setModalEntregarAbierto] = useState(false);

  const [modalIncidenciaAbierto, setModalIncidenciaAbierto] = useState(false);
  const [motivoIncidencia, setMotivoIncidencia] = useState('');
  const [errorIncidencia, setErrorIncidencia] = useState('');

  const [modalEtiqueta, setModalEtiqueta] = useState(false);

  const [procesando, setProcesando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const data = await cargarEnvios();
      setEnvios(data);
    } catch (err) {
      console.error('Error al cargar envíos:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const enviosFiltrados = envios.filter((e) => {
    if (filtroEstado === 'todos') return true;
    return e.estado === filtroEstado;
  });

  const handleEjecutarDespacho = async () => {
    if (!numeroGuia.trim()) {
      alert('Por favor ingresa el número de guía de remisión / tracking (RF-362).');
      return;
    }
    if (!envioSeleccionado) return;

    setProcesando(true);
    try {
      await marcarEnvioDespachado(envioSeleccionado.id, {
        agencia: agenciaDespacho,
        numeroGuia: numeroGuia.trim()
      });
      setModalDespacharAbierto(false);
      setNumeroGuia('');
      setMensajeAlerta({
        tipo: 'exito',
        texto: 'Envío marcado como DESPACHADO con guía ' + numeroGuia + ' (RF-361/362).'
      });
      await cargarDatos();
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: err.message || 'Error al despachar envío.' });
    } finally {
      setProcesando(false);
    }
  };

  const handleEjecutarEntrega = async () => {
    if (!envioSeleccionado) return;
    setProcesando(true);
    try {
      await marcarEnvioEntregado(envioSeleccionado.id);
      setModalEntregarAbierto(false);
      setMensajeAlerta({
        tipo: 'exito',
        texto: 'Envío marcado como ENTREGADO con éxito (RF-363).'
      });
      await cargarDatos();
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: err.message || 'Error al marcar entrega.' });
    } finally {
      setProcesando(false);
    }
  };

  const handleEjecutarIncidencia = async () => {
    if (!motivoIncidencia.trim()) {
      setErrorIncidencia('El motivo de la incidencia es obligatorio (RF-364).');
      return;
    }
    if (!envioSeleccionado) return;

    setProcesando(true);
    try {
      await registrarIncidenciaEnvio(envioSeleccionado.id, motivoIncidencia);
      setModalIncidenciaAbierto(false);
      setMotivoIncidencia('');
      setErrorIncidencia('');
      setMensajeAlerta({
        tipo: 'exito',
        texto: 'Incidencia registrada en el envío.'
      });
      await cargarDatos();
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: err.message || 'Error al registrar incidencia.' });
    } finally {
      setProcesando(false);
    }
  };

  const columnas = [
    {
      key: 'orden',
      label: 'Orden',
      render: (f) => f.orden?.codigo || ('Orden #' + f.orden_id)
    },
    {
      key: 'destinatario',
      label: 'Destinatario',
      render: (f) => (
        <div>
          <strong>{f.destinatario}</strong>
          <div className="txt-xs txt-muted">{f.departamento} - {f.provincia} - {f.distrito}</div>
        </div>
      )
    },
    {
      key: 'agencia',
      label: 'Agencia / Guía',
      render: (f) => (
        <div>
          <div>{f.agencia || 'Por definir'}</div>
          {f.numero_guia && <span className="txt-xs txt-bold txt-gold">Guía: {f.numero_guia}</span>}
        </div>
      )
    },
    {
      key: 'costo',
      label: 'Flete',
      render: (f) => formatearSoles(f.costo_cent)
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (f) => <InsigniaEstado estadoTipo={f.estado} />
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (f) => (
        <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
          <Boton
            variante="secundario"
            className="btn-mini"
            icono={Printer}
            onClick={() => {
              setEnvioSeleccionado(f);
              setModalEtiqueta(true);
            }}
            title="Imprimir Etiqueta"
          >
            Etiqueta
          </Boton>
          {f.estado === 'pendiente' && (
            <Boton
              variante="primario"
              className="btn-mini"
              onClick={() => {
                setEnvioSeleccionado(f);
                setAgenciaDespacho(f.agencia || 'Shalom');
                setNumeroGuia(f.numero_guia || '');
                setModalDespacharAbierto(true);
              }}
            >
              Despachar
            </Boton>
          )}
          {f.estado === 'despachado' && (
            <Boton
              variante="primario"
              className="btn-mini"
              onClick={() => {
                setEnvioSeleccionado(f);
                setModalEntregarAbierto(true);
              }}
            >
              Entregado
            </Boton>
          )}
          {f.estado !== 'entregado' && (
            <Boton
              variante="peligro"
              className="btn-mini"
              onClick={() => {
                setEnvioSeleccionado(f);
                setModalIncidenciaAbierto(true);
              }}
            >
              Incidencia
            </Boton>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="pagina-contenedor">
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-24</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Control de Envíos y Despacho</h1>
            <p className="pagina-subtitulo">
              Gestión logística de pedidos pagados para transporte terrestre y entrega
            </p>
          </div>
          <Boton variante="secundario" icono={RefreshCw} onClick={cargarDatos} disabled={cargando}>
            Actualizar
          </Boton>
        </div>
      </div>

      {/* RF-365: Invariante explícito de no alteración de puntos ni dinero */}
      <div
        style={{
          background: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-tarjeta)',
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)'
        }}
      >
        <Package size={16} className="txt-gold" />
        <span>
          <strong>Regla RF-365:</strong> Los puntos y comisiones se acreditan al confirmar el PAGO de la orden. Ningún cambio de estado en envíos (despachado, entregado o incidencia) altera los saldos de los socios ni los libros de comisiones.
        </span>
      </div>

      {mensajeAlerta && (
        <div
          role="alert"
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--r-input)',
            marginBottom: 'var(--sp-4)',
            background: mensajeAlerta.tipo === 'error' ? 'var(--danger-soft)' : 'var(--success-soft)',
            color: mensajeAlerta.tipo === 'error' ? 'var(--danger)' : 'var(--success)',
            border: '1px solid ' + (mensajeAlerta.tipo === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'),
            fontSize: 'var(--fs-sm)',
            fontWeight: 500
          }}
        >
          {mensajeAlerta.texto}
        </div>
      )}

      {/* FILTROS POR ESTADO */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        {['todos', 'pendiente', 'despachado', 'entregado', 'incidencia'].map((st) => (
          <button
            key={st}
            onClick={() => setFiltroEstado(st)}
            style={{
              padding: 'var(--sp-1) var(--sp-3)',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
              background: filtroEstado === st ? 'var(--gold-600)' : '#fff',
              color: filtroEstado === st ? '#fff' : 'var(--text-strong)',
              fontWeight: filtroEstado === st ? 600 : 400,
              fontSize: 'var(--fs-xs)',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {st} ({envios.filter((e) => (st === 'todos' ? true : e.estado === st)).length})
          </button>
        ))}
      </div>

      {/* LISTADO DE ENVÍOS */}
      <div className="panel-blanco">
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
            <Clock size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: 'var(--sp-2)' }} />
            <div>Cargando envíos...</div>
          </div>
        ) : enviosFiltrados.length === 0 ? (
          <EstadoVacio
            icono={Truck}
            titulo="No hay envíos en este estado"
            mensaje="Todos los pedidos han sido gestionados o no hay registros con el filtro seleccionado."
            accionTexto="Ver Todos los Envíos"
            onAccion={() => setFiltroEstado('todos')}
          />
        ) : (
          <Tabla columnas={columnas} datos={enviosFiltrados} />
        )}
      </div>

      {/* MODAL DESPACHAR (RF-361, RF-362) */}
      {modalDespacharAbierto && envioSeleccionado && (
        <DialogoConfirmar
          abierto={modalDespacharAbierto}
          titulo={'Marcar Despacho · ' + (envioSeleccionado.orden?.codigo || '')}
          mensaje="Registra la agencia de transporte y el número de guía asignado para el tracking del socio."
          textoConfirmar="Confirmar Despacho"
          textoCancelar="Cancelar"
          variante="primario"
          cargando={procesando}
          onConfirmar={handleEjecutarDespacho}
          onCancelar={() => setModalDespacharAbierto(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
            <CampoTexto
              id="agencia-despacho"
              label="Agencia de Transporte"
              value={agenciaDespacho}
              onChange={(e) => setAgenciaDespacho(e.target.value)}
              required
            />
            <CampoTexto
              id="num-guia"
              label="Número de Guía de Remisión / Tracking"
              placeholder="Ej. TRK-984721"
              value={numeroGuia}
              onChange={(e) => setNumeroGuia(e.target.value)}
              required
            />
          </div>
        </DialogoConfirmar>
      )}

      {/* MODAL ENTREGAR (RF-363) */}
      {modalEntregarAbierto && envioSeleccionado && (
        <DialogoConfirmar
          abierto={modalEntregarAbierto}
          titulo={'¿Confirmar Entrega de ' + (envioSeleccionado.orden?.codigo || '') + '?'}
          mensaje={'Se marcará como entregado el pedido a ' + envioSeleccionado.destinatario + ' en ' + envioSeleccionado.direccion + '.'}
          textoConfirmar="Sí, Marcar como Entregado"
          textoCancelar="Cancelar"
          variante="primario"
          cargando={procesando}
          onConfirmar={handleEjecutarEntrega}
          onCancelar={() => setModalEntregarAbierto(false)}
        />
      )}

      {/* MODAL INCIDENCIA (RF-364) */}
      {modalIncidenciaAbierto && envioSeleccionado && (
        <DialogoConfirmar
          abierto={modalIncidenciaAbierto}
          titulo={'Registrar Incidencia en Envío · ' + (envioSeleccionado.orden?.codigo || '')}
          mensaje="Registra el motivo de la incidencia para seguimiento con la agencia de transporte."
          textoConfirmar="Registrar Incidencia"
          textoCancelar="Cancelar"
          variante="peligro"
          cargando={procesando}
          onConfirmar={handleEjecutarIncidencia}
          onCancelar={() => {
            setModalIncidenciaAbierto(false);
            setErrorIncidencia('');
          }}
        >
          <CampoTextarea
            id="motivo-incidencia"
            label="Motivo / Detalle de la Incidencia (Obligatorio)"
            placeholder="Ej. Dirección no encontrada, paquete dañado en transporte, destinatario ausente..."
            value={motivoIncidencia}
            onChange={(e) => {
              setMotivoIncidencia(e.target.value);
              if (e.target.value.trim()) setErrorIncidencia('');
            }}
            error={errorIncidencia}
            required
          />
        </DialogoConfirmar>
      )}

      {/* MODAL ETIQUETA DE DESPACHO (RF-366) */}
      {modalEtiqueta && envioSeleccionado && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-4)'
          }}
          onClick={() => setModalEtiqueta(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '480px',
              width: '100%',
              background: '#fff',
              borderRadius: 'var(--r-tarjeta)',
              padding: 'var(--sp-5)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #000', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-lg)', fontWeight: 800 }}>MAX GLOBAL CORPORATION</h3>
                <span className="txt-xs txt-muted">ETIQUETA DE DESPACHO OFICIAL</span>
              </div>
              <button
                onClick={() => setModalEtiqueta(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span className="txt-xs txt-muted" style={{ textTransform: 'uppercase' }}>Destinatario:</span>
                <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{envioSeleccionado.destinatario}</div>
              </div>

              <div>
                <span className="txt-xs txt-muted" style={{ textTransform: 'uppercase' }}>Teléfono / Celular:</span>
                <div>{envioSeleccionado.telefono || envioSeleccionado.orden?.socio?.telefono || 'No indicado'}</div>
              </div>

              <div>
                <span className="txt-xs txt-muted" style={{ textTransform: 'uppercase' }}>Destino:</span>
                <div><strong>{envioSeleccionado.departamento}</strong> / {envioSeleccionado.provincia} / {envioSeleccionado.distrito}</div>
              </div>

              <div>
                <span className="txt-xs txt-muted" style={{ textTransform: 'uppercase' }}>Dirección / Agencia:</span>
                <div>{envioSeleccionado.direccion}</div>
                {envioSeleccionado.referencia && <div className="txt-xs txt-muted">Ref: {envioSeleccionado.referencia}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)', paddingTop: 'var(--sp-2)', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <span className="txt-xs txt-muted">Agencia:</span>
                  <div><strong>{envioSeleccionado.agencia || 'Shalom'}</strong></div>
                </div>
                <div>
                  <span className="txt-xs txt-muted">Orden ID:</span>
                  <div><strong>{envioSeleccionado.orden?.codigo}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--sp-5)', display: 'flex', gap: 'var(--sp-2)' }}>
              <Boton variante="primario" bloque icono={Printer} onClick={() => window.print()}>
                Imprimir Etiqueta
              </Boton>
              <Boton variante="secundario" onClick={() => setModalEtiqueta(false)}>
                Cerrar
              </Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
