import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, BarraProgreso, Boton, FotoProducto } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerCiclos,
  obtenerCatalogoRecompra,
  formatearNombreCiclo
} from '../servicios/socio';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  Info,
  PackageCheck,
  Search,
  X,
  Filter,
  PackageSearch
} from 'lucide-react';

const WHATSAPP_EMPRESA = '51993516053';

// Normaliza texto eliminando acentos/diacríticos y pasando a minúsculas (reusado de la landing)
const normalizar = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * P-13 · Tienda de Recompra
 * Los productos se muestran con el descuento correspondiente al pack del socio.
 * 🔴 RF-238: Esta tienda no crea órdenes en la base de datos; arma el pedido y abre WhatsApp.
 */
export default function P13TiendaRecompra() {
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [socio, setSocio] = useState(null);
  const [datosCatalogo, setDatosCatalogo] = useState(null);
  const [carrito, setCarrito] = useState({}); // { productoId: cantidad }
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        let perfil = socio;
        let listaCiclos = ciclos;

        if (!perfil) {
          perfil = await obtenerPerfilSocio();
          if (!cancelado) setSocio(perfil);
        }
        if (!listaCiclos || listaCiclos.length === 0) {
          listaCiclos = await obtenerCiclos();
          if (!cancelado) setCiclos(listaCiclos);
        }

        const cicloAbierto = (listaCiclos || []).find((c) => c.estado === 'abierto');
        const cicloId = cicloSeleccionado || cicloAbierto?.id || listaCiclos[0]?.id;
        if (!cicloSeleccionado && cicloId && !cancelado) {
          setCicloSeleccionado(cicloId);
        }
        if (!cicloId) return;

        const catalogo = await obtenerCatalogoRecompra(perfil.id, cicloId);
        if (!cancelado) {
          setDatosCatalogo(catalogo);
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar catálogo de recompra');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, [cicloSeleccionado]);

  if (cargando && !datosCatalogo) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando catálogo y precios de socio...</p>
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
            <h2 className="txt-gold txt-lg">Error al cargar tienda</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const socioInfo = datosCatalogo?.socio || {};
  const productos = datosCatalogo?.productos || [];
  const descuentoPct = socioInfo.descuento_pct || 0;
  const puntosActuales = socioInfo.puntos_personales_actuales || 0;

  // Categorías dinámicas extraídas del catálogo
  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];

  // Limpiar filtros de búsqueda y categoría
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setCategoriaSeleccionada('');
  };

  // Filtrado en memoria: busca por nombre y código, ignorando tildes y mayúsculas
  const productosFiltrados = productos.filter((prod) => {
    if (categoriaSeleccionada && prod.categoria !== categoriaSeleccionada) {
      return false;
    }
    if (busqueda.trim()) {
      const term = normalizar(busqueda.trim());
      const nombreNorm = normalizar(prod.nombre);
      const codigoNorm = normalizar(prod.codigo);
      const descNorm = normalizar(prod.descripcion);
      return nombreNorm.includes(term) || codigoNorm.includes(term) || descNorm.includes(term);
    }
    return true;
  });

  // Scroll suave al resumen del pedido (TAREA-58 Bloque 1)
  const irAlResumen = () => {
    const el = document.getElementById('resumen-pedido');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Manejo de Carrito
  const agregarAlCarrito = (prodId) => {
    setCarrito((prev) => ({
      ...prev,
      [prodId]: (prev[prodId] || 0) + 1
    }));
  };

  const modificarCantidad = (prodId, delta) => {
    setCarrito((prev) => {
      const actual = prev[prodId] || 0;
      const nuevo = actual + delta;
      if (nuevo <= 0) {
        const copia = { ...prev };
        delete copia[prodId];
        return copia;
      }
      return { ...prev, [prodId]: nuevo };
    });
  };

  const eliminarDelCarrito = (prodId) => {
    setCarrito((prev) => {
      const copia = { ...prev };
      delete copia[prodId];
      return copia;
    });
  };

  // Cálculos del Carrito
  const itemsCarrito = Object.entries(carrito).map(([prodIdStr, cant]) => {
    const prodId = Number(prodIdStr);
    const prod = productos.find((p) => p.id === prodId) || {};
    const subtotalCent = (prod.precio_final_cent || 0) * cant;
    const subtotalPuntos = (prod.puntos || 0) * cant;
    return {
      producto: prod,
      cantidad: cant,
      subtotalCent,
      subtotalPuntos
    };
  });

  const totalSolesCent = itemsCarrito.reduce((acc, it) => acc + it.subtotalCent, 0);
  const totalPuntosCarrito = itemsCarrito.reduce((acc, it) => acc + it.subtotalPuntos, 0);
  const totalItemsCount = itemsCarrito.reduce((acc, it) => acc + it.cantidad, 0);

  // Avance de Activación (desde config, sin fallback inventado)
  const metaActivacion = datosCatalogo?.meta_activacion;
  const puntosTotalesProyectados = puntosActuales + totalPuntosCarrito;
  const pctActual = metaActivacion > 0 ? Math.min(100, Math.round((puntosActuales / metaActivacion) * 100)) : 0;
  const pctConCarrito = metaActivacion > 0 ? Math.min(100, Math.round((puntosTotalesProyectados / metaActivacion) * 100)) : 0;
  const alcanzaActivacion = metaActivacion > 0 ? puntosTotalesProyectados >= metaActivacion : false;
  const yaEstabaActivo = metaActivacion > 0 ? puntosActuales >= metaActivacion : false;

  // Generación de Mensaje de WhatsApp
  const generarMensajeWhatsApp = () => {
    let msg = `Hola Max Global, soy ${socioInfo.nombreCompleto} (${socioInfo.codigo}).\n`;
    msg += `Quiero solicitar mi pedido de recompra (${socioInfo.pack_nombre} - ${descuentoPct}% desc.):\n\n`;

    itemsCarrito.forEach((it) => {
      msg += `• ${it.cantidad}× ${it.producto.nombre} (${it.producto.puntos} pts) ..... ${formatearSoles(it.subtotalCent)} (${formatearSoles(it.producto.precio_final_cent)} c/u)\n`;
    });

    msg += `\nTotal a pagar: ${formatearSoles(totalSolesCent)}\n`;
    msg += `Puntos del pedido: ${totalPuntosCarrito} pts\n\n`;
    msg += `Socio: ${socioInfo.nombreCompleto}\n`;
    msg += `Código: ${socioInfo.codigo}\n`;
    msg += `DNI/Documento: ${socio?.documento || ''}\n`;
    msg += `Adjunto mi comprobante de depósito para su validación y confirmación.`;

    return msg;
  };

  const handleEnviarPedidoWhatsApp = () => {
    if (itemsCarrito.length === 0) return;
    const texto = generarMensajeWhatsApp();
    const url = `https://wa.me/${WHATSAPP_EMPRESA}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="pagina-contenedor"
      style={{
        paddingBottom: totalItemsCount > 0 ? '140px' : '80px'
      }}
    >
      {/* Encabezado */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Backoffice Socio · P-13</span>
            <h1 className="pagina-titulo">Tienda de Recompra</h1>
            <p className="pagina-subtitulo">
              Precios con {descuentoPct}% de descuento aplicado ({socioInfo.pack_nombre}) y acumulación de puntos en vivo
            </p>
          </div>

          {/* Selector de Ciclo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <label htmlFor="select-ciclo-tienda" className="txt-sm txt-bold">
              Ciclo:
            </label>
            <select
              id="select-ciclo-tienda"
              className="formulario-select"
              value={cicloSeleccionado || ''}
              onChange={(e) => setCicloSeleccionado(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
            >
              {ciclos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || formatearNombreCiclo(c)} ({c.estado})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BARRA DE AVANCE HACIA LA ACTIVACIÓN MENSUAL (RF-234 y RF-235) */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="panel-blanco" style={{ borderLeft: yaEstabaActivo ? '4px solid var(--verde)' : alcanzaActivacion ? '4px solid var(--oro)' : '4px solid var(--borde)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
            <div>
              <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={22} style={{ color: yaEstabaActivo || alcanzaActivacion ? 'var(--verde)' : 'var(--oro)' }} />
                Meta de Activación Mensual: {metaActivacion || '...'} Puntos Personales
              </h2>
              <p className="seccion-desc">
                {yaEstabaActivo
                  ? `Ya estás ACTIVO este mes con ${puntosActuales} pts personales. Tus compras adicionales generan residual y comisiones.`
                  : totalPuntosCarrito > 0 && alcanzaActivacion
                  ? `🎉 ¡Excelente! Con los ${totalPuntosCarrito} pts de tu carrito acumularás ${puntosTotalesProyectados} pts y quedarás ACTIVO este mes.`
                  : `Llevas ${puntosActuales} de ${metaActivacion || '...'} pts este mes. Te faltan ${Math.max(0, (metaActivacion || 0) - puntosTotalesProyectados)} pts para activar tu código.`}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="txt-sm txt-muted">Acumulado actual: </span>
              <strong className="txt-md">{puntosActuales} pts</strong>
              {totalPuntosCarrito > 0 && (
                <span className="txt-sm" style={{ color: 'var(--verde)', marginLeft: '6px', fontWeight: 600 }}>
                  (+{totalPuntosCarrito} en carrito = {puntosTotalesProyectados} pts)
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <BarraProgreso
              etiqueta="Progreso de Activación"
              valor={puntosTotalesProyectados}
              meta={metaActivacion}
              unidad="pts"
              variante={alcanzaActivacion || yaEstabaActivo ? 'verde' : 'dorado'}
              estado={metaActivacion > 0 ? 'datos' : 'cargando'}
            />
          </div>

          {totalPuntosCarrito > 0 && alcanzaActivacion && !yaEstabaActivo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'var(--sp-2)', color: 'var(--verde)', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Con este pedido quedas activo este mes.</span>
            </div>
          )}
        </div>
      </section>

      {/* CONTENEDOR PRINCIPAL: CATÁLOGO Y CARRITO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)', alignItems: 'start' }}>
        {/* LISTADO DE 8 PRODUCTOS */}
        <section>
          {/* BUSCADOR Y CATEGORÍA (TAREA-58 BLOQUE 2) */}
          <div className="panel-blanco" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
            <div className="tienda-filtros-fila">
              <div className="tienda-buscador-wrapper">
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  id="input-buscar-tienda"
                  data-testid="input-buscar-tienda"
                  placeholder="Buscar producto por nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="tienda-buscador-input"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    data-testid="btn-limpiar-busqueda"
                    aria-label="Limpiar búsqueda"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', flex: '0 1 auto' }}>
                <select
                  id="select-categoria-tienda"
                  data-testid="select-categoria-tienda"
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  className="tienda-categoria-select"
                >
                  <option value="">Todas las categorías ({productos.length})</option>
                  {categorias.map((cat) => {
                    const count = productos.filter((p) => p.categoria === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {(busqueda.trim() || categoriaSeleccionada) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>
                  Mostrando {productosFiltrados.length} de {productos.length} productos
                </span>
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  data-testid="btn-limpiar-filtros"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-gold-dark, var(--gold-700))',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 'var(--fs-xs)',
                    textDecoration: 'underline'
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-3)' }}>
            <h2 className="seccion-titulo">Catálogo de Productos ({productosFiltrados.length})</h2>
            <span className="txt-xs txt-muted">Descuento aplicado: {descuentoPct}%</span>
          </div>

          {productosFiltrados.length === 0 ? (
            <div
              data-testid="tienda-sin-resultados"
              className="panel-blanco"
              style={{
                textAlign: 'center',
                padding: 'var(--sp-8) var(--sp-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--borde)',
                margin: 'var(--sp-4) 0'
              }}
            >
              <PackageSearch size={44} style={{ color: 'var(--oro)', margin: '0 auto var(--sp-3)' }} />
              <h3 className="txt-lg txt-bold" style={{ margin: '0 0 var(--sp-2) 0' }}>
                No encontramos productos
              </h3>
              <p className="seccion-desc" style={{ maxWidth: '420px', margin: '0 auto var(--sp-4)' }}>
                No hay coincidencias para {busqueda ? `«${busqueda}»` : 'la categoría seleccionada'}. Intenta con otro término o limpia los filtros.
              </p>
              <Boton
                variante="secundario"
                onClick={handleLimpiarFiltros}
                data-testid="btn-sin-resultados-limpiar"
              >
                Limpiar búsqueda
              </Boton>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
              {productosFiltrados.map((p) => {
              const cantEnCarrito = carrito[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="panel-blanco tarjeta-producto-tienda"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    padding: 'var(--sp-4)'
                  }}
                >
                  <div>
                    {/* Fila superior: Foto 1:1 + Info (Nombre, Presentación, Código, Puntos) */}
                    <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                      <FotoProducto
                        url={p.imagen_url}
                        nombre={p.nombre}
                        tamano={88}
                        aspectRatio="1 / 1"
                        borderRadius="var(--radius-md)"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px', marginBottom: '2px' }}>
                          <span className="txt-xs txt-muted" style={{ fontWeight: 600 }}>{p.codigo}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: 'var(--gold-50)',
                              color: 'var(--text-gold)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {p.puntos} PTS
                          </span>
                        </div>
                        <h3 className="txt-md txt-bold" style={{ margin: '0 0 4px 0', lineHeight: 1.25 }}>
                          {p.nombre}
                        </h3>
                        {p.presentacion && (
                          <p className="txt-xs txt-muted" style={{ margin: 0, lineHeight: 1.3 }}>
                            {p.presentacion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Precios y puntos */}
                    <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-sm)', marginTop: 'var(--sp-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span className="txt-xs txt-muted">Público</span>
                        <span className="txt-xs txt-muted" style={{ textDecoration: 'line-through' }}>
                          {formatearSoles(p.precio_lista_cent)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                        <span className="txt-sm txt-bold">Tu precio</span>
                        <span className="txt-lg txt-bold" style={{ color: 'var(--verde)' }}>
                          {formatearSoles(p.precio_final_cent)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="txt-xs txt-muted">Puntos</span>
                        <span className="txt-xs txt-bold" style={{ color: 'var(--oro)' }}>
                          {p.puntos} puntos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--sp-3)', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--borde)' }}>
                    {cantEnCarrito > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="formulario-boton formulario-boton-secundario"
                            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => modificarCantidad(p.id, -1)}
                            aria-label={`Reducir ${p.nombre}`}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="txt-bold" style={{ minWidth: '24px', textAlign: 'center' }}>
                            {cantEnCarrito}
                          </span>
                          <button
                            type="button"
                            className="formulario-boton formulario-boton-secundario"
                            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => modificarCantidad(p.id, 1)}
                            aria-label={`Aumentar ${p.nombre}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="txt-xs txt-muted">
                          {p.puntos * cantEnCarrito} pts
                        </span>
                      </div>
                    ) : (
                      <Boton
                        variante="secundario"
                        anchoCompleto
                        onClick={() => agregarAlCarrito(p.id)}
                      >
                        <Plus size={16} /> Agregar
                      </Boton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

        {/* RESUMEN DEL CARRITO Y ENVÍO POR WHATSAPP */}
        <section id="resumen-pedido" style={{ position: 'sticky', top: 'var(--sp-4)' }}>
          <div className="panel-blanco" style={{ borderTop: '4px solid var(--oro)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)', paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--borde)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} style={{ color: 'var(--oro)' }} />
                <h2 className="seccion-titulo" style={{ margin: 0 }}>Tu Pedido ({totalItemsCount})</h2>
              </div>
              {itemsCarrito.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCarrito({})}
                  className="txt-xs txt-muted"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Vaciar
                </button>
              )}
            </div>

            {itemsCarrito.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-6) var(--sp-2)' }}>
                <ShoppingBag size={40} style={{ color: 'var(--texto-apagado)', margin: '0 auto var(--sp-2)' }} />
                <p className="txt-sm txt-muted">Tu carrito está vacío.</p>
                <p className="txt-xs txt-muted" style={{ marginTop: '4px' }}>Selecciona productos del catálogo para armar tu pedido.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', maxHeight: '280px', overflowY: 'auto' }}>
                  {itemsCarrito.map((it) => (
                    <div key={it.producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', gap: 'var(--sp-2)' }}>
                      <FotoProducto
                        url={it.producto.imagen_url}
                        nombre={it.producto.nombre}
                        tamano={40}
                        aspectRatio="1 / 1"
                        borderRadius="4px"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="txt-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.producto.nombre}
                        </div>
                        <div className="txt-xs txt-muted">
                          {it.cantidad} × {formatearSoles(it.producto.precio_final_cent)} ({it.subtotalPuntos} pts)
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: 'var(--texto-principal)' }}>{formatearSoles(it.subtotalCent)}</strong>
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(it.producto.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--texto-apagado)', cursor: 'pointer' }}
                          aria-label={`Eliminar ${it.producto.nombre}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--borde)', paddingTop: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="txt-sm txt-muted">Puntos del pedido:</span>
                    <strong className="txt-sm" style={{ color: 'var(--oro)' }}>{totalPuntosCarrito} pts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="txt-md txt-bold">Total a pagar:</span>
                    <span className="txt-xl txt-bold" style={{ color: 'var(--verde)' }}>{formatearSoles(totalSolesCent)}</span>
                  </div>
                </div>

                <div className="box-alerta-info" style={{ marginBottom: 'var(--sp-4)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Info size={15} style={{ color: 'var(--info)' }} />
                    <strong className="txt-xs">Pedido oficial vía WhatsApp</strong>
                  </div>
                  <p className="txt-xs" style={{ margin: 0, color: 'var(--texto-secundario)' }}>
                    Al confirmar, se abrirá WhatsApp con el pedido precargado para que administración lo registre y valide tu comprobante de pago.
                  </p>
                </div>

                <Boton
                  variante="primario"
                  anchoCompleto
                  onClick={handleEnviarPedidoWhatsApp}
                >
                  <MessageCircle size={18} /> Enviar Pedido por WhatsApp
                </Boton>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* BARRA FIJA CON EL CARRITO (TAREA-58 BLOQUE 1) */}
      {totalItemsCount > 0 && (
        <aside
          className="tienda-barra-carrito-flotante"
          data-testid="barra-fija-carrito"
          onClick={irAlResumen}
          aria-label="Barra fija de acceso rápido al pedido"
        >
          <div className="tienda-barra-carrito-texto">
            <span>{totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'}</span>
            <span className="separador">·</span>
            <span>{formatearSoles(totalSolesCent)}</span>
            <span className="separador">·</span>
            <span className="tienda-barra-carrito-pts">{totalPuntosCarrito} pts</span>
          </div>
          <button
            type="button"
            className="btn btn-primario tienda-barra-carrito-btn"
            onClick={(e) => {
              e.stopPropagation();
              irAlResumen();
            }}
          >
            Ver pedido
          </button>
        </aside>
      )}
    </div>
  );
}
