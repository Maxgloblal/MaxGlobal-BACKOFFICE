import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, Boton } from '../piezas';
import { obtenerPerfilSocio, obtenerMisPedidos } from '../servicios/socio';
import {
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  MapPin,
  Receipt,
  FileText,
  ZoomIn,
  X
} from 'lucide-react';
import { obtenerUrlVisualizacionVoucher } from '../servicios/operacionAdmin';

/**
 * P-17 · Mis Pedidos
 * Historial de órdenes de compra, estado de pago, tracking logístico y motivo de rechazo.
 * 🔴 RF-274: El socio no puede editar ni anular pedidos (solo lectura).
 */
/**
 * TAREA-14 · Visualizador del comprobante para el socio autenticado con URL firmada privada.
 */
function ComprobantePedidoSocio({ voucher, codigoOrden }) {
  const [urlFirmada, setUrlFirmada] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const v = Array.isArray(voucher) ? voucher[0] : voucher;

  useEffect(() => {
    let cancelado = false;
    const urlRaw = v?.imagen_url;
    if (!urlRaw || urlRaw.includes('placehold.co')) {
      setUrlFirmada(null);
      return;
    }

    async function cargar() {
      setCargando(true);
      try {
        const url = await obtenerUrlVisualizacionVoucher(urlRaw, 900);
        if (!cancelado) setUrlFirmada(url);
      } catch (err) {
        if (!cancelado) setUrlFirmada(null);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => {
      cancelado = true;
    };
  }, [v?.imagen_url]);

  if (cargando) {
    return <span className="txt-xs txt-muted">Cargando comprobante...</span>;
  }

  if (!urlFirmada) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--texto-apagado)', fontSize: 'var(--fs-xs)' }}>
        <FileText size={15} />
        <span>Sin comprobante adjunto</span>
      </div>
    );
  }

  const esPdf = urlFirmada.toLowerCase().includes('.pdf') || voucher?.imagen_url?.toLowerCase().includes('.pdf');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        {esPdf ? (
          <a
            href={urlFirmada}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#fff',
              border: '1px solid var(--borde)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--texto-principal)',
              textDecoration: 'none'
            }}
          >
            <FileText size={14} style={{ color: '#ef4444' }} />
            <span>Ver PDF</span>
            <ExternalLink size={11} />
          </a>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={urlFirmada}
              alt="Voucher de pago"
              onClick={() => setModalAbierto(true)}
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--borde)',
                cursor: 'pointer'
              }}
              title="Clic para ampliar comprobante"
            />
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--borde)',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              <ZoomIn size={12} /> Ver foto
            </button>
          </div>
        )}
      </div>

      {modalAbierto && (
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
          onClick={() => setModalAbierto(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#fff',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong className="txt-sm">Comprobante de Pago — {codigoOrden}</strong>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={urlFirmada}
              alt="Comprobante ampliado"
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }}
            />
            <div className="txt-xs txt-muted" style={{ marginTop: '8px', textAlign: 'center' }}>
              {v?.banco ? `${v.banco} · Op: ${v.numero_operacion || 'S/N'}` : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function P17MisPedidos() {
  const [socio, setSocio] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        let perfil = socio;
        if (!perfil) {
          perfil = await obtenerPerfilSocio();
          if (!cancelado) setSocio(perfil);
        }
        const lista = await obtenerMisPedidos(perfil.id);
        if (!cancelado) {
          setPedidos(lista);
          if (lista.length > 0) {
            setPedidoExpandidoId(lista[0].id);
          }
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar historial de pedidos');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, []);

  if (cargando && pedidos.length === 0) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando tus pedidos y comprobantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertCircle className="txt-gold" size={24} />
            <h2 className="txt-gold txt-lg">Error al cargar pedidos</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const confirmados = pedidos.filter((p) => p.estado === 'confirmada' || p.estado === 'pagada');
  const pendientes = pedidos.filter((p) => p.estado === 'por_confirmar');
  const totalPuntosHistorico = pedidos.reduce((acc, p) => acc + (p.puntos_total || 0), 0);

  const toggleExpandir = (id) => {
    setPedidoExpandidoId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <span className="kit-header-badge">Backoffice Socio · P-17</span>
        <h1 className="pagina-titulo">Mis Pedidos</h1>
        <p className="pagina-subtitulo">
          Historial de compras, estado de confirmación de pago y seguimiento de envíos
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Total de Pedidos"
          valor={`${pedidos.length} pedidos`}
          subrotulo="Historial registrado en sistema"
          icono={Package}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Pagos Confirmados"
          valor={`${confirmados.length} pedidos`}
          subrotulo={pendientes.length > 0 ? `${pendientes.length} pendientes de validación` : 'Todos al día'}
          icono={CheckCircle2}
          variante="verde"
        />
        <TarjetaDato
          rotulo="Puntos Generados"
          valor={`${totalPuntosHistorico} pts`}
          subrotulo="Puntos acumulados de tus compras"
          icono={ShoppingBag}
        />
      </div>

      {/* LISTADO DE PEDIDOS */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo" style={{ marginBottom: 'var(--sp-4)' }}>
          Historial de Órdenes ({pedidos.length})
        </h2>

        {pedidos.length === 0 ? (
          <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <ShoppingBag size={48} style={{ color: 'var(--texto-apagado)', margin: '0 auto 12px auto' }} />
            <h3 className="txt-md txt-bold">No tienes pedidos registrados</h3>
            <p className="txt-sm txt-muted" style={{ marginTop: '4px' }}>
              Realiza tu pedido de recompra en la Tienda Oficial para sumar puntos y mantener tu activación.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {pedidos.map((ord) => {
              const estaExpandido = pedidoExpandidoId === ord.id;
              const detalles = ord.detalles || [];
              const envio = ord.envio;
              const voucher = ord.voucher;
              const esRechazado = ord.estado === 'rechazada';

              let badgeBg = 'rgba(212,160,23,0.12)';
              let badgeColor = '#d4a017';
              let IconoEstado = Clock;

              if (ord.estado === 'confirmada' || ord.estado === 'pagada') {
                badgeBg = 'rgba(16,185,129,0.12)';
                badgeColor = 'var(--verde)';
                IconoEstado = CheckCircle2;
              } else if (ord.estado === 'rechazada') {
                badgeBg = 'rgba(239,68,68,0.12)';
                badgeColor = 'var(--peligro)';
                IconoEstado = XCircle;
              }

              return (
                <div
                  key={ord.id}
                  className="panel-blanco"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderLeft: `4px solid ${badgeColor}`,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* CABECERA DE LA ORDEN */}
                  <div
                    onClick={() => toggleExpandir(ord.id)}
                    style={{
                      padding: 'var(--sp-4)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      flexWrap: 'wrap',
                      gap: 'var(--sp-3)',
                      backgroundColor: estaExpandido ? 'var(--fondo-suave)' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="txt-md txt-bold">{ord.codigo}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: ord.tipo === 'afiliacion' ? 'rgba(59,130,246,0.12)' : 'rgba(212,160,23,0.12)',
                              color: ord.tipo === 'afiliacion' ? '#2563eb' : '#d4a017'
                            }}
                          >
                            {ord.tipo}
                          </span>
                        </div>
                        <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>
                          Fecha: {ord.creada_en ? new Date(ord.creada_en).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="txt-lg txt-bold" style={{ color: 'var(--verde)' }}>
                          {formatearSoles(ord.total_cent)}
                        </div>
                        <div className="txt-xs txt-muted">
                          <strong>{ord.puntos_total}</strong> pts
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <IconoEstado size={15} />
                        <span>{ord.estadoHumano}</span>
                      </div>

                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--texto-apagado)', cursor: 'pointer', padding: '4px' }}
                        aria-label={estaExpandido ? 'Colapsar detalles' : 'Ver detalles'}
                      >
                        {estaExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* CONTENIDO EXPANDIBLE: DETALLE Y LOGÍSTICA */}
                  {estaExpandido && (
                    <div style={{ padding: 'var(--sp-4)', borderTop: '1px solid var(--borde)' }}>
                      {/* 🔴 AVISO DE PAGO RECHAZADO Y MOTIVO (RF-273) */}
                      {esRechazado && (
                        <div className="box-alerta-alerta" style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <XCircle size={20} style={{ color: 'var(--peligro)', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong className="txt-sm" style={{ color: 'var(--peligro)' }}>
                                Pago Rechazado por Administración
                              </strong>
                              <p className="txt-sm" style={{ margin: '4px 0 0 0', color: 'var(--texto-principal)' }}>
                                <strong>Motivo: </strong> {ord.motivoRechazo || 'Comprobante no coincide o datos de operación ilegibles.'}
                              </p>
                              <p className="txt-xs txt-muted" style={{ margin: '4px 0 0 0' }}>
                                Comunícate por WhatsApp con Administración o presenta un nuevo voucher válido para regularizar este pedido.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TABLA DE PRODUCTOS EN EL PEDIDO */}
                      <div style={{ marginBottom: 'var(--sp-4)' }}>
                        <h4 className="txt-sm txt-bold" style={{ marginBottom: 'var(--sp-2)' }}>
                          Productos en esta orden ({detalles.length})
                        </h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="tabla-transparente" style={{ width: '100%', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--borde)', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Producto / Pack</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Cant.</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Precio Unit.</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Puntos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalles.map((d) => (
                                <tr key={d.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                                  <td style={{ padding: '8px' }}>
                                    <strong>{d.producto?.nombre || d.pack?.nombre || 'Item'}</strong>
                                    <span className="txt-xs txt-muted" style={{ marginLeft: '6px' }}>
                                      ({d.producto?.codigo || d.pack?.codigo || ''})
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>{d.cantidad}</td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>{formatearSoles(d.precio_final_cent)}</td>
                                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{formatearSoles((d.precio_final_cent || 0) * (d.cantidad || 0))}</td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--oro)', fontWeight: 600 }}>{d.puntos_subtotal} pts</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* SECCIÓN DE SEGUIMIENTO Y ENVÍO (RF-272) */}
                      <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-3)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Truck size={16} style={{ color: 'var(--info)' }} />
                            <strong className="txt-xs">Estado del Envío:</strong>
                          </div>
                          <span className="txt-sm txt-bold">{ord.envioEstadoHumano}</span>
                          {envio?.agencia && (
                            <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>
                              Agencia: <strong>{envio.agencia}</strong>
                            </div>
                          )}
                          {envio?.numero_guia && (
                            <div className="txt-xs txt-muted">
                              N° de Guía: <strong>{envio.numero_guia}</strong>
                            </div>
                          )}
                        </div>

                        {(envio?.direccion || envio?.distrito || envio?.departamento) && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <MapPin size={16} style={{ color: 'var(--texto-apagado)' }} />
                              <strong className="txt-xs">Dirección de Destino:</strong>
                            </div>
                            <p className="txt-xs" style={{ margin: 0, color: 'var(--texto-secundario)' }}>
                              {envio.direccion || 'Dirección registrada'}
                              {envio.distrito ? `, ${envio.distrito}` : ''}
                              {envio.provincia ? ` - ${envio.provincia}` : ''}
                              {envio.departamento ? ` (${envio.departamento})` : ''}
                            </p>
                          </div>
                        )}

                        {/* TAREA-14 · COMPROBANTE DE PAGO ADJUNTO */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Receipt size={16} style={{ color: 'var(--oro)' }} />
                            <strong className="txt-xs">Comprobante de Pago:</strong>
                          </div>
                          <ComprobantePedidoSocio voucher={voucher} codigoOrden={ord.codigo} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
