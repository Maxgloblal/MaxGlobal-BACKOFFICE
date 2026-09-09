import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatearSoles } from '../utilidades/dinero';
import {
  CampoTexto,
  CampoSelect,
  Boton,
  CampoArchivoVoucher,
  FotoProducto
} from '../piezas';
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Truck,
  Receipt,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  buscarSocios,
  cargarProductos,
  registrarPedidoRecompra,
  subirComprobanteVoucher
} from '../servicios/operacionAdmin';

export default function P21RegistrarPedido() {
  const navigate = useNavigate();

  // TAREA-16: Venta a Cliente Final (Precio Público)
  const [esVentaCliente, setEsVentaCliente] = useState(false);

  // 1. Estado de Búsqueda y Selección de Socio (RF-310, RF-311, RF-312)
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosSocios, setResultadosSocios] = useState([]);
  const [buscandoSocio, setBuscandoSocio] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [socioConfirmadoVisualmente, setSocioConfirmadoVisualmente] = useState(false);

  // 2. Catálogo de Productos y Carrito (RF-313, RF-314)
  const [catalogoProductos, setCatalogoProductos] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [carrito, setCarrito] = useState({});

  // 3. Comprobante de Pago / Voucher (RF-315)
  const [banco, setBanco] = useState('BCP');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [fechaDeposito, setFechaDeposito] = useState(new Date().toISOString().split('T')[0]);
  const [imagenVoucherUrl, setImagenVoucherUrl] = useState('');
  const [archivoVoucher, setArchivoVoucher] = useState(null);

  // 4. Datos de Envío (RF-316, RF-317)
  const [requiereEnvio, setRequiereEnvio] = useState(false);
  const [destinatario, setDestinatario] = useState('');
  const [telefonoEnvio, setTelefonoEnvio] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [agencia, setAgencia] = useState('Shalom');
  const [costoEnvioSoles, setCostoEnvioSoles] = useState('15.00');

  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);
  const [pedidoCreado, setPedidoCreado] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const prods = await cargarProductos();
        setCatalogoProductos(prods);
      } catch (err) {
        console.error('Error al cargar productos:', err);
      } finally {
        setCargandoCatalogo(false);
      }
    }
    cargar();
  }, []);

  useEffect(() => {
    if (!terminoBusqueda.trim() || socioSeleccionado) {
      setResultadosSocios([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoSocio(true);
      try {
        const res = await buscarSocios(terminoBusqueda);
        setResultadosSocios(res);
      } catch (err) {
        console.error('Error al buscar socio:', err);
      } finally {
        setBuscandoSocio(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [terminoBusqueda, socioSeleccionado]);

  const handleSeleccionarSocio = (socio) => {
    setSocioSeleccionado(socio);
    setSocioConfirmadoVisualmente(false);
    setResultadosSocios([]);
    setTerminoBusqueda('');
    setDestinatario(socio.nombres + ' ' + socio.apellidos);
    setTelefonoEnvio(socio.telefono || '');
  };

  const handleCambiarSocio = () => {
    setSocioSeleccionado(null);
    setSocioConfirmadoVisualmente(false);
    setCarrito({});
  };

  const descuentoPctSocio = useMemo(() => {
    // TAREA-16: Si es venta a cliente final, descuento es 0% (precio público)
    if (esVentaCliente) return 0;
    if (!socioSeleccionado) return 50;
    return Number(socioSeleccionado.pack?.descuento_recompra_pct ?? 50);
  }, [socioSeleccionado, esVentaCliente]);

  const actualizarCantidad = (productoId, delta) => {
    setCarrito((prev) => {
      const actual = prev[productoId] || 0;
      const nueva = actual + delta;
      if (nueva <= 0) {
        const copia = { ...prev };
        delete copia[productoId];
        return copia;
      }
      return { ...prev, [productoId]: nueva };
    });
  };

  const { subtotalCent, totalCent, descuentoCent, puntosTotal, itemsDetalle } = useMemo(() => {
    let subtotal = 0;
    let total = 0;
    let puntos = 0;
    const items = [];

    for (const prod of catalogoProductos) {
      const cant = carrito[prod.id] || 0;
      if (cant > 0) {
        const precioLista = Number(prod.precio_lista_cent);
        const precioFinal = Math.round(precioLista * (1.0 - descuentoPctSocio / 100.0));
        const pts = Number(prod.puntos) * cant;

        subtotal += precioLista * cant;
        total += precioFinal * cant;
        puntos += pts;

        items.push({
          producto_id: prod.id,
          nombre: prod.nombre,
          imagen_url: prod.imagen_url,
          cantidad: cant,
          precio_lista_cent: precioLista,
          precio_final_cent: precioFinal,
          puntos_unitario: Number(prod.puntos),
          puntos_subtotal: pts
        });
      }
    }

    const descuento = subtotal - total;
    return {
      subtotalCent: subtotal,
      totalCent: total,
      descuentoCent: descuento,
      puntosTotal: puntos,
      itemsDetalle: items
    };
  }, [catalogoProductos, carrito, descuentoPctSocio]);

  const costoEnvioCent = useMemo(() => {
    if (!requiereEnvio) return 0;
    const num = parseFloat(costoEnvioSoles) || 0;
    return Math.round(num * 100);
  }, [requiereEnvio, costoEnvioSoles]);

  const totalConEnvioCent = totalCent + costoEnvioCent;

  const montoDeclaradoCent = useMemo(() => {
    const num = parseFloat(montoDeclarado) || 0;
    return Math.round(num * 100);
  }, [montoDeclarado]);

  const hayDescuadreVoucher = montoDeclarado && montoDeclaradoCent !== totalConEnvioCent && totalConEnvioCent > 0;

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    if (!socioSeleccionado || !socioConfirmadoVisualmente) {
      setErrorGuardado('Debes confirmar visualmente al socio antes de registrar el pedido (RF-312).');
      return;
    }
    if (itemsDetalle.length === 0) {
      setErrorGuardado('Debes agregar al menos un producto al pedido.');
      return;
    }
    if (!numeroOperacion.trim()) {
      setErrorGuardado('El número de operación bancaria es obligatorio (RF-315).');
      return;
    }

    setErrorGuardado(null);
    setGuardando(true);

    try {
      const itemsPayload = itemsDetalle.map((it) => ({
        producto_id: it.producto_id,
        cantidad: it.cantidad
      }));

      // TAREA-14: Si hay archivo adjunto, subir primero al bucket 'vouchers'
      // Si la subida falla, la orden NO se crea (Regla 1)
      let rutaVoucher = null;
      if (archivoVoucher) {
        try {
          rutaVoucher = await subirComprobanteVoucher(archivoVoucher, null, 'ORD-RECOMPRA');
        } catch (errSubida) {
          setErrorGuardado(`Error al subir el comprobante: ${errSubida.message}. La orden NO fue registrada.`);
          setGuardando(false);
          return;
        }
      } else if (imagenVoucherUrl.trim()) {
        rutaVoucher = imagenVoucherUrl.trim();
      }

      const voucherPayload = {
        banco,
        numero_operacion: numeroOperacion.trim(),
        monto_cent: montoDeclaradoCent > 0 ? montoDeclaradoCent : totalConEnvioCent,
        fecha_deposito: fechaDeposito,
        imagen_url: rutaVoucher || null
      };

      const envioPayload = requiereEnvio
        ? {
            destinatario: destinatario.trim(),
            telefono: telefonoEnvio.trim(),
            departamento: departamento.trim(),
            provincia: provincia.trim(),
            distrito: distrito.trim(),
            direccion: direccion.trim(),
            referencia: referencia.trim(),
            agencia: agencia.trim(),
            costo_cent: costoEnvioCent
          }
        : null;

      const res = await registrarPedidoRecompra({
        socioId: socioSeleccionado.id,
        items: itemsPayload,
        voucher: voucherPayload,
        envio: envioPayload,
        canal: 'oficina',
        tipoVenta: esVentaCliente ? 'cliente' : 'socio'
      });

      if (res && res.exito) {
        setPedidoCreado(res);
      } else {
        throw new Error(res?.mensaje || 'No se pudo registrar el pedido.');
      }
    } catch (err) {
      setErrorGuardado(err.message || 'Error al guardar el pedido.');
    } finally {
      setGuardando(false);
    }
  };

  if (pedidoCreado) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', maxWidth: '540px', margin: 'var(--sp-6) auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-soft)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--sp-4)'
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h2 className="pagina-titulo" style={{ margin: '0 0 var(--sp-2) 0' }}>
            ¡Pedido Registrado con Éxito!
          </h2>
          <p className="txt-sm txt-muted" style={{ marginBottom: 'var(--sp-4)' }}>
            El pedido <strong>{pedidoCreado.codigo}</strong> ha quedado registrado en estado <strong>por_confirmar</strong>.
          </p>

          <div
            style={{
              background: 'var(--bg-app)',
              borderRadius: 'var(--r-input)',
              padding: 'var(--sp-4)',
              textAlign: 'left',
              fontSize: 'var(--fs-sm)',
              marginBottom: 'var(--sp-5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Tipo de Venta:</span>
              <strong>{pedidoCreado.tipo_venta === 'cliente' ? 'Venta a Cliente Final (Precio Público)' : 'Recompra Socio'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Socio Beneficiario:</span>
              <strong>{socioSeleccionado.nombres} {socioSeleccionado.apellidos}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Puntos a Acreditar:</span>
              <strong>{pedidoCreado.puntos_total} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Total a Pagar:</span>
              <strong className="txt-bold">{formatearSoles(pedidoCreado.total_cent)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            <Boton
              variante="secundario"
              bloque
              onClick={() => {
                setPedidoCreado(null);
                setEsVentaCliente(false);
                setSocioSeleccionado(null);
                setSocioConfirmadoVisualmente(false);
                setCarrito({});
                setNumeroOperacion('');
                setMontoDeclarado('');
              }}
            >
              Registrar Otro Pedido
            </Boton>
            <Boton
              variante="primario"
              bloque
              icono={ArrowRight}
              onClick={() => navigate('/admin/confirmacion')}
            >
              Ir a la Bandeja de Confirmación
            </Boton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-contenedor">
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-21</span>
        <h1 className="pagina-titulo">Registrar Pedido de Recompra</h1>
        <p className="pagina-subtitulo">
          Venta de productos a precio socio oficial según el pack afiliado
        </p>
      </div>

      {errorGuardado && (
        <div
          role="alert"
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--r-input)',
            marginBottom: 'var(--sp-4)',
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            fontSize: 'var(--fs-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2)'
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorGuardado}</span>
        </div>
      )}

      {/* TAREA-16 · CASILLA DE VENTA A CLIENTE FINAL */}
      <div
        style={{
          backgroundColor: esVentaCliente ? 'var(--info-soft)' : 'var(--surface-card)',
          border: esVentaCliente ? '2px solid var(--info)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--sp-4)',
          flexWrap: 'wrap'
        }}
      >
        <label
          htmlFor="check-precio-publico"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--texto-principal)'
          }}
        >
          <input
            id="check-precio-publico"
            type="checkbox"
            checked={esVentaCliente}
            onChange={(e) => setEsVentaCliente(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--info)' }}
          />
          <span>Precio público — cliente que no es socio</span>
        </label>

        {esVentaCliente && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--info-soft)',
              color: 'var(--info)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Info size={16} />
            <span>Precio público — el cliente no tiene descuento</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitPedido}>
        <div className="grid-dos-columnas" style={{ alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {/* 1. SELECCIÓN DE SOCIO */}
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                {esVentaCliente ? '1. Socio que refirió · si no hay, poner MG00001' : '1. Selección del Socio Comprador'}
              </h3>

              {!socioSeleccionado ? (
                <div>
                  <CampoTexto
                    id="busqueda-socio"
                    label={esVentaCliente ? 'Socio que refirió · si no hay, poner MG00001' : 'Buscar socio por código, nombre o documento (DNI)'}
                    placeholder={esVentaCliente ? 'Ej. MG00001 (Máximo), MG00002...' : 'Ej. MG00002, Ana Quispe, 45892147...'}
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                  />

                  {buscandoSocio && <p className="txt-xs txt-muted">Buscando socios...</p>}

                  {resultadosSocios.length > 0 && (
                    <div
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--r-input)',
                        overflow: 'hidden',
                        marginTop: 'var(--sp-2)'
                      }}
                    >
                      {resultadosSocios.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSeleccionarSocio(s)}
                          style={{
                            padding: 'var(--sp-2) var(--sp-3)',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          className="resultado-busqueda-item"
                        >
                          <div>
                            <span className="txt-bold">{s.nombres} {s.apellidos}</span>{' '}
                            <span className="txt-muted txt-xs">({s.codigo} · DNI: {s.documento})</span>
                          </div>
                          <span className="kit-estado-label">{s.pack?.nombre || 'Socio'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: 'var(--sp-3)',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--r-input)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="kit-estado-label">
                        {esVentaCliente ? 'Socio Referidor (Acredita Puntos)' : 'Socio Identificado'}
                      </span>
                      <h4 style={{ margin: '4px 0', fontSize: 'var(--fs-lg)' }}>
                        {socioSeleccionado.nombres} {socioSeleccionado.apellidos}
                      </h4>
                      <div className="txt-xs txt-muted" style={{ lineHeight: 1.6 }}>
                        <div><strong>Código:</strong> {socioSeleccionado.codigo} · <strong>DNI:</strong> {socioSeleccionado.documento}</div>
                        <div>
                          <strong>Pack:</strong> {socioSeleccionado.pack?.nombre}{' '}
                          {esVentaCliente ? (
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>· Venta a cliente (0% descuento aplicado)</span>
                          ) : (
                            `(${descuentoPctSocio}% descuento recompra)`
                          )}
                        </div>
                        <div>
                          <strong>Patrocinador:</strong>{' '}
                          {socioSeleccionado.patrocinador
                            ? socioSeleccionado.patrocinador.nombres + ' ' + socioSeleccionado.patrocinador.apellidos + ' (' + socioSeleccionado.patrocinador.codigo + ')'
                            : 'Directo de la Empresa'}
                        </div>
                        <div><strong>Estado Actual:</strong> {socioSeleccionado.estado.toUpperCase()}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCambiarSocio}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: 'var(--fs-xs)',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Cambiar socio
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 'var(--sp-3)',
                      paddingTop: 'var(--sp-3)',
                      borderTop: '1px dashed var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sp-2)'
                    }}
                  >
                    <input
                      id="check-confirmacion-socio"
                      type="checkbox"
                      checked={socioConfirmadoVisualmente}
                      onChange={(e) => setSocioConfirmadoVisualmente(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="check-confirmacion-socio"
                      style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {esVentaCliente
                        ? `Confirmo visualmente que los puntos se acreditarán al socio ${socioSeleccionado.nombres} ${socioSeleccionado.apellidos}.`
                        : `Confirmo visualmente que ${socioSeleccionado.nombres} ${socioSeleccionado.apellidos} es el socio correcto para este pedido (RF-312).`}
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CATÁLOGO DE PRODUCTOS */}
            <div className="panel-blanco">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                <h3 className="seccion-titulo">
                  2. Selección de Productos
                </h3>
                <span className="armazon-badge-rango">
                  Descuento: {esVentaCliente ? '0% (Precio Público)' : `${descuentoPctSocio}%`}
                </span>
              </div>

              {cargandoCatalogo ? (
                <p className="txt-xs txt-muted">Cargando catálogo oficial...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  {catalogoProductos.map((p) => {
                    const cant = carrito[p.id] || 0;
                    const precioPublico = Number(p.precio_lista_cent);
                    const precioFinalUnitario = Math.round(precioPublico * (1.0 - descuentoPctSocio / 100.0));

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--sp-3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--r-input)',
                          background: cant > 0 ? 'var(--gold-100)' : 'var(--surface-card)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
                          <FotoProducto
                            url={p.imagen_url}
                            nombre={p.nombre}
                            tamano={44}
                            aspectRatio="1 / 1"
                            borderRadius="var(--radius-sm, 6px)"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                            <div className="txt-xs txt-muted">
                              {esVentaCliente ? (
                                <span>
                                  Precio Público: <strong className="txt-gold">{formatearSoles(precioPublico)}</strong> ·{' '}
                                  <strong>{p.puntos} pts</strong>
                                </span>
                              ) : (
                                <span>
                                  Público: {formatearSoles(precioPublico)} · Socio ({descuentoPctSocio}%):{' '}
                                  <strong className="txt-gold">{formatearSoles(precioFinalUnitario)}</strong> ·{' '}
                                  <strong>{p.puntos} pts</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <button
                            type="button"
                            onClick={() => actualizarCantidad(p.id, -1)}
                            disabled={cant === 0}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--surface-card)',
                              cursor: cant === 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ width: '24px', textAlign: 'center', fontWeight: 700 }}>
                            {cant}
                          </span>
                          <button
                            type="button"
                            onClick={() => actualizarCantidad(p.id, 1)}
                            disabled={!socioSeleccionado || !socioConfirmadoVisualmente}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--surface-card)',
                              cursor: (!socioSeleccionado || !socioConfirmadoVisualmente) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {/* RESUMEN DEL PEDIDO */}
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                Resumen del Pedido
              </h3>

              {itemsDetalle.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)', paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {itemsDetalle.map((item) => (
                    <div key={item.producto_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)', fontSize: 'var(--fs-xs)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FotoProducto
                          url={item.imagen_url}
                          nombre={item.nombre}
                          tamano={32}
                          aspectRatio="1 / 1"
                          borderRadius="4px"
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.cantidad}× {item.nombre}
                          </div>
                          <div className="txt-muted" style={{ fontSize: '11px' }}>
                            {item.puntos_subtotal} pts
                          </div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, flexShrink: 0 }}>
                        {formatearSoles(item.precio_final_cent * item.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', fontSize: 'var(--fs-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="txt-muted">Subtotal (Precio Lista):</span>
                  <span>{formatearSoles(subtotalCent)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: esVentaCliente ? 'var(--texto-secundario)' : 'var(--success)' }}>
                  <span>{esVentaCliente ? 'Descuento Cliente (0%):' : `Descuento Pack (${descuentoPctSocio}%):`}</span>
                  <span>- {formatearSoles(descuentoCent)}</span>
                </div>
                {requiereEnvio && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="txt-muted">Costo de Envío:</span>
                    <span>{formatearSoles(costoEnvioCent)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--fs-lg)',
                    fontWeight: 700,
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 'var(--sp-2)'
                  }}
                >
                  <span>Total a Pagar:</span>
                  <span className="txt-gold">{formatearSoles(totalConEnvioCent)}</span>
                </div>

                <div
                  style={{
                    background: 'var(--gold-100)',
                    borderRadius: 'var(--r-input)',
                    padding: 'var(--sp-2) var(--sp-3)',
                    marginTop: 'var(--sp-2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 700,
                    color: 'var(--gold-800)'
                  }}
                >
                  <span>Puntos Personales a Acreditar:</span>
                  <span>{puntosTotal} pts</span>
                </div>
              </div>
            </div>

            {/* 3. COMPROBANTE BANCARIO */}
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                <Receipt size={18} />
                <span>3. Comprobante de Pago</span>
              </h3>

              <CampoSelect
                id="banco"
                label="Banco de Depósito / Transferencia"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                opciones={[
                  { value: 'BCP', label: 'BCP - Banco de Crédito' },
                  { value: 'BBVA', label: 'BBVA Continental' },
                  { value: 'Interbank', label: 'Interbank' },
                  { value: 'Scotiabank', label: 'Scotiabank' },
                  { value: 'Banco de la Nación', label: 'Banco de la Nación' },
                  { value: 'Yape', label: 'Yape' },
                  { value: 'Plin', label: 'Plin' }
                ]}
              />

              <CampoTexto
                id="num-operacion"
                label="Número de Operación"
                placeholder="Ej. 10000502"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                <CampoTexto
                  id="monto-declarado"
                  label="Monto Depositado (S/.)"
                  placeholder={(totalConEnvioCent / 100).toFixed(2)}
                  value={montoDeclarado}
                  onChange={(e) => setMontoDeclarado(e.target.value)}
                />
                <CampoTexto
                  id="fecha-deposito"
                  label="Fecha de Depósito"
                  type="date"
                  value={fechaDeposito}
                  onChange={(e) => setFechaDeposito(e.target.value)}
                />
              </div>

              {hayDescuadreVoucher && (
                <div
                  role="alert"
                  style={{
                    background: 'var(--danger-soft)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--r-input)',
                    padding: 'var(--sp-2) var(--sp-3)',
                    color: 'var(--danger)',
                    fontSize: 'var(--fs-xs)',
                    marginBottom: 'var(--sp-3)'
                  }}
                >
                  ⚠️ El monto declarado ({formatearSoles(montoDeclaradoCent)}) no coincide con el total esperado ({formatearSoles(totalConEnvioCent)}). Se registrará con observación (RF-318).
                </div>
              )}

              <CampoArchivoVoucher
                id="archivo-voucher-recompra"
                archivo={archivoVoucher}
                onArchivoChange={setArchivoVoucher}
                disabled={guardando}
              />
            </div>

            {/* 4. ENVÍO */}
            <div className="panel-blanco">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                <h3 className="seccion-titulo">
                  <Truck size={18} />
                  <span>4. Despacho y Envío</span>
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', fontSize: 'var(--fs-xs)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requiereEnvio}
                    onChange={(e) => setRequiereEnvio(e.target.checked)}
                  />
                  <span>Requiere Envío</span>
                </label>
              </div>

              {requiereEnvio && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <CampoTexto
                    id="destinatario"
                    label="Nombre Completo del Destinatario"
                    value={destinatario}
                    onChange={(e) => setDestinatario(e.target.value)}
                    required={requiereEnvio}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                    <CampoTexto
                      id="telefono-envio"
                      label="Teléfono Destinatario"
                      value={telefonoEnvio}
                      onChange={(e) => setTelefonoEnvio(e.target.value)}
                    />
                    <CampoTexto
                      id="agencia"
                      label="Agencia de Transporte"
                      value={agencia}
                      onChange={(e) => setAgencia(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-2)' }}>
                    <CampoTexto
                      id="departamento"
                      label="Departamento"
                      placeholder="Lima"
                      value={departamento}
                      onChange={(e) => setDepartamento(e.target.value)}
                      required={requiereEnvio}
                    />
                    <CampoTexto
                      id="provincia"
                      label="Provincia"
                      placeholder="Lima"
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      required={requiereEnvio}
                    />
                    <CampoTexto
                      id="distrito"
                      label="Distrito"
                      placeholder="Miraflores"
                      value={distrito}
                      onChange={(e) => setDistrito(e.target.value)}
                      required={requiereEnvio}
                    />
                  </div>

                  <CampoTexto
                    id="direccion"
                    label="Dirección de Entrega / Agencia"
                    placeholder="Av. Principal 123"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required={requiereEnvio}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                    <CampoTexto
                      id="referencia"
                      label="Referencia"
                      placeholder="Frente al parque"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                    />
                    <CampoTexto
                      id="costo-envio"
                      label="Costo de Envío (S/.)"
                      value={costoEnvioSoles}
                      onChange={(e) => setCostoEnvioSoles(e.target.value)}
                    />
                  </div>

                  <p className="txt-xs txt-muted" style={{ margin: 0 }}>
                    ⚠️ El costo de envío va en la tabla de envíos y <strong>no genera puntos</strong> ni comisiones (RF-317).
                  </p>
                </div>
              )}
            </div>

            <Boton
              type="submit"
              variante="primario"
              bloque
              disabled={guardando || !socioConfirmadoVisualmente || itemsDetalle.length === 0 || !numeroOperacion.trim()}
              cargando={guardando}
            >
              Registrar Pedido por Confirmar
            </Boton>
          </div>
        </div>
      </form>
    </div>
  );
}
