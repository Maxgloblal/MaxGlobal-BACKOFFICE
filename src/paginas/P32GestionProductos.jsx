import React, { useState, useEffect } from 'react';
import {
  obtenerProductosAdmin,
  obtenerParametrosConsecuencias,
  crearProducto,
  editarProducto,
  cambiarEstadoProducto,
  subirFotoProducto,
  validarArchivoFotoProducto,
  generarSlug
} from '../servicios/operacionAdmin';
import { procesarImagenParaSubida } from '../utilidades/procesadorImagenes';
import { TarjetaDato, InsigniaEstado, Boton, EstadoVacio, DialogoConfirmar } from '../piezas';
import {
  Package,
  Plus,
  Edit2,
  Power,
  Search,
  Filter,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  X,
  Info,
  Loader2
} from 'lucide-react';

export default function P32GestionProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Parámetros dinámicos para el Panel de Consecuencias
  const [parametros, setParametros] = useState(null);

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  // Campos del formulario
  const [formCodigo, setFormCodigo] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [slugModificadoManualmente, setSlugModificadoManualmente] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [escribiendoNuevaCat, setEscribiendoNuevaCat] = useState(false);
  const [formPresentacion, setFormPresentacion] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formPuntos, setFormPuntos] = useState('');
  const [formOrden, setFormOrden] = useState(10);
  const [formActivo, setFormActivo] = useState(true);

  // Foto
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);

  // Carga inicial
  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError(null);
      const [prods, params] = await Promise.all([
        obtenerProductosAdmin(),
        obtenerParametrosConsecuencias()
      ]);
      setProductos(prods || []);
      setParametros(params || null);
    } catch (err) {
      console.error('Error al cargar datos de productos:', err);
      setError(err.message || 'Error al consultar catálogo de productos.');
    } finally {
      setCargando(false);
    }
  }

  // Lista única de categorías basada en los datos existentes
  const categoriasExistentes = Array.from(
    new Set(productos.map(p => p.categoria).filter(Boolean))
  ).sort();

  // Filtrado de productos
  const productosFiltrados = productos.filter(p => {
    const coincideCategoria =
      filtroCategoria === 'todas' || p.categoria === filtroCategoria;
    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && p.activo) ||
      (filtroEstado === 'inactivos' && !p.activo);
    const coincideBusqueda =
      !busqueda.trim() ||
      (p.nombre && p.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (p.codigo && p.codigo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (p.slug && p.slug.toLowerCase().includes(busqueda.toLowerCase()));

    return coincideCategoria && coincideEstado && coincideBusqueda;
  });

  const totalActivos = productos.filter(p => p.activo).length;
  const totalInactivos = productos.filter(p => !p.activo).length;

  // Abrir modal para crear
  const handleAbrirCrear = () => {
    setModoEdicion(false);
    setProductoSeleccionado(null);
    setFormCodigo('');
    setFormNombre('');
    setFormSlug('');
    setSlugModificadoManualmente(false);
    setFormDescripcion('');
    setFormCategoria(categoriasExistentes[0] || 'Salud y Nutrición');
    setNuevaCategoria('');
    setEscribiendoNuevaCat(false);
    setFormPresentacion('');
    setFormPrecio('');
    setFormPuntos('');
    setFormOrden(productos.length + 1);
    setFormActivo(true);
    setArchivoFoto(null);
    setPreviewFoto(null);
    setErrorModal(null);
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const handleAbrirEditar = (prod) => {
    setModoEdicion(true);
    setProductoSeleccionado(prod);
    setFormCodigo(prod.codigo || '');
    setFormNombre(prod.nombre || '');
    setFormSlug(prod.slug || '');
    setSlugModificadoManualmente(true);
    setFormDescripcion(prod.descripcion || '');
    setFormCategoria(prod.categoria || '');
    setNuevaCategoria('');
    setEscribiendoNuevaCat(false);
    setFormPresentacion(prod.presentacion || '');
    setFormPrecio(((prod.precio_lista_cent || 0) / 100).toFixed(2));
    setFormPuntos(prod.puntos !== undefined ? String(prod.puntos) : '');
    setFormOrden(prod.orden || 1);
    setFormActivo(Boolean(prod.activo));
    setArchivoFoto(null);
    setPreviewFoto(prod.imagen_url || null);
    setErrorModal(null);
    setModalAbierto(true);
  };

  // Manejar cambio de nombre con auto-generación de slug
  const handleNombreChange = (val) => {
    setFormNombre(val);
    if (!slugModificadoManualmente) {
      setFormSlug(generarSlug(val));
    }
  };

  // Manejar cambio de slug manual
  const handleSlugChange = (val) => {
    setFormSlug(val.toLowerCase().replace(/\s+/g, '-'));
    setSlugModificadoManualmente(true);
  };

  // Estado para confirmación de cambio de estado de producto (RF TAREA-24)
  const [productoAEstado, setProductoAEstado] = useState(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [optimizandoFoto, setOptimizandoFoto] = useState(false);

  // Manejar selección de foto con optimización en cliente (WebP q85, max 1600px - RF-538, RF-546, RF-548)
  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setOptimizandoFoto(true);
      setErrorModal(null);

      // Procesar la imagen con el módulo unificado
      const resProc = await procesarImagenParaSubida({ archivo: file, tipo: 'producto' });
      const archivoFinal = resProc.archivo;

      // Validar el archivo resultante
      validarArchivoFotoProducto(archivoFinal);

      setArchivoFoto(archivoFinal);
      setPreviewFoto(URL.createObjectURL(archivoFinal));
    } catch (err) {
      setErrorModal(err.message || 'Error al procesar la imagen del producto.');
      e.target.value = '';
      setArchivoFoto(null);
    } finally {
      setOptimizandoFoto(false);
    }
  };

  // Abrir confirmación para Activar / Desactivar producto (NUNCA BORRAR)
  const handleAbrirToggleActivo = (prod) => {
    setProductoAEstado(prod);
  };

  const handleConfirmarToggleActivo = async () => {
    if (!productoAEstado) return;
    const prod = productoAEstado;
    const nuevoEstado = !prod.activo;

    try {
      setGuardandoEstado(true);
      setError(null);
      await cambiarEstadoProducto(prod.id, nuevoEstado, prod);
      setMensajeExito(`Producto "${prod.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
      setProductoAEstado(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError(err.message || 'Error al cambiar estado del producto.');
      setProductoAEstado(null);
    } finally {
      setGuardandoEstado(false);
    }
  };

  // Guardar formulario (Crear o Editar)
  const handleGuardar = async (e) => {
    e.preventDefault();
    setErrorModal(null);

    const precioNum = parseFloat(formPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setErrorModal('El precio público debe ser mayor a 0 soles.');
      return;
    }

    const puntosNum = parseInt(formPuntos, 10);
    if (isNaN(puntosNum) || puntosNum < 0) {
      setErrorModal('Los puntos deben ser un número entero mayor o igual a 0.');
      return;
    }

    const codigoSanitizado = formCodigo.trim().toUpperCase().replace(/\s+/g, '');
    if (!codigoSanitizado) {
      setErrorModal('El código es obligatorio (en mayúsculas y sin espacios).');
      return;
    }

    const slugSanitizado = (formSlug || generarSlug(formNombre)).trim().toLowerCase();
    if (!slugSanitizado) {
      setErrorModal('El slug es obligatorio.');
      return;
    }

    const categoriaFinal = escribiendoNuevaCat
      ? nuevaCategoria.trim()
      : formCategoria.trim();

    if (!categoriaFinal) {
      setErrorModal('La categoría es obligatoria.');
      return;
    }

    try {
      setGuardando(true);

      // Si se seleccionó una foto nueva, subirla primero con timestamp
      let urlImagenFinal = modoEdicion ? productoSeleccionado.imagen_url : null;
      if (archivoFoto) {
        const { urlPublica } = await subirFotoProducto({
          archivo: archivoFoto,
          slug: slugSanitizado
        });
        urlImagenFinal = urlPublica;
      }

      const datosProducto = {
        codigo: codigoSanitizado,
        slug: slugSanitizado,
        nombre: formNombre.trim(),
        descripcion: formDescripcion ? formDescripcion.trim() : null,
        categoria: categoriaFinal,
        presentacion: formPresentacion ? formPresentacion.trim() : null,
        precio_lista_cent: Math.round(precioNum * 100),
        puntos: puntosNum,
        imagen_url: urlImagenFinal,
        orden: parseInt(formOrden, 10) || 10,
        activo: Boolean(formActivo)
      };

      if (modoEdicion) {
        await editarProducto(productoSeleccionado.id, datosProducto, productoSeleccionado);
        setMensajeExito(`Producto "${datosProducto.nombre}" actualizado con éxito.`);
      } else {
        await crearProducto(datosProducto);
        setMensajeExito(`Producto "${datosProducto.nombre}" creado con éxito.`);
      }

      setModalAbierto(false);
      await cargarDatos();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setErrorModal(err.message || 'Error al guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  // CÁLCULOS EN VIVO DEL PANEL DE CONSECUENCIAS (BLOQUE 3)
  const precioPublicoNum = parseFloat(formPrecio) || 0;
  const puntosNum = parseInt(formPuntos, 10) || 0;

  const descGold = parametros?.descuentoGold ?? 50;
  const descKit = parametros?.descuentoKit ?? 40;
  const pctResidual = parametros?.pctResidualTotal ?? 97; // 97%
  const valPuntoCom = parametros?.valorPuntoComision ?? 1.0; // 1.00

  const precioSocioGold = precioPublicoNum * (1 - descGold / 100);
  const precioSocioKit = precioPublicoNum * (1 - descKit / 100);

  // Residual máximo a la red: puntos × valor_punto_comision × 97%
  const residualMaximoRed = puntosNum * valPuntoCom * (pctResidual / 100);

  // Márgenes empresa
  const empresaSiSocioGold = precioSocioGold - residualMaximoRed;
  const empresaSiCliente = precioPublicoNum - residualMaximoRed;

  // Banda de referencia dinámica basada en los otros productos activos
  const otrosProductosActivos = (parametros?.productosActivos || []).filter(p => {
    if (modoEdicion && productoSeleccionado && p.id === productoSeleccionado.id) return false;
    return p.puntos > 0 && p.precio_lista_cent > 0;
  });

  const ratiosOtros = otrosProductosActivos.map(p => {
    const precioSocio = (p.precio_lista_cent * (1 - descGold / 100)) / 100;
    return precioSocio / p.puntos;
  });

  const bandaMin = ratiosOtros.length > 0 ? Math.min(...ratiosOtros) : 3.50;
  const bandaMax = ratiosOtros.length > 0 ? Math.max(...ratiosOtros) : 4.29;

  const esteRatioSolesPorPunto = puntosNum > 0 ? (precioSocioGold / puntosNum) : 0;
  const fueraDeBandaPorExcesoPuntos =
    puntosNum > 0 && precioSocioGold > 0 && esteRatioSolesPorPunto < (bandaMin - 0.05);

  const pctRedLleva = precioSocioGold > 0 ? (residualMaximoRed / precioSocioGold) * 100 : 0;

  // Aviso de cambio de slug en edición
  const slugCambioEnEdicion =
    modoEdicion &&
    productoSeleccionado &&
    formSlug.trim().toLowerCase() !== (productoSeleccionado.slug || '').trim().toLowerCase();

  return (
    <div className="espacio-y-4">
      {/* Encabezado */}
      <div className="flex-entre wrap gap-3" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="h2 flex-alineado gap-2" style={{ margin: 0 }}>
            <Package size={28} className="texto-dorado" />
            P-32 · Gestión de Productos
          </h1>
          <p className="texto-muted" style={{ margin: '4px 0 0' }}>
            Catálogo oficial de productos para el backoffice y la tienda web.
          </p>
        </div>
        <div>
          <Boton
            tipo="primario"
            icono={Plus}
            onClick={handleAbrirCrear}
          >
            Nuevo producto
          </Boton>
        </div>
      </div>

      {/* Alertas Globales */}
      {error && (
        <div className="banner-alerta banner-alerta-error flex-alineado gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="banner-alerta banner-alerta-exito flex-alineado gap-2">
          <CheckCircle2 size={20} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Métricas rápidas */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-4)' }}>
        <TarjetaDato
          rotulo="Total productos"
          valor={productos.length}
          subrotulo="En el catálogo"
          icono={Package}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Activos en tienda"
          valor={totalActivos}
          subrotulo="Disponibles para venta"
          icono={CheckCircle2}
          variante="verde"
        />
        <TarjetaDato
          rotulo="Inactivos"
          valor={totalInactivos}
          subrotulo="Desactivados"
          icono={Power}
        />
        <TarjetaDato
          rotulo="Categorías"
          valor={categoriasExistentes.length}
          subrotulo="Líneas comerciales"
          icono={Filter}
        />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="panel-blanco" style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        <div className="flex-entre wrap gap-3" style={{ alignItems: 'center' }}>
          <div className="flex-alineado wrap gap-2" style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                className="input"
                placeholder="Buscar por código, nombre o slug..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%' }}
              />
            </div>

            <select
              className="input"
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
              style={{ width: 'auto', minWidth: '160px' }}
            >
              <option value="todas">Todas las categorías</option>
              {categoriasExistentes.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              style={{ width: 'auto', minWidth: '130px' }}
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
            </select>
          </div>

          <div className="texto-muted texto-sm">
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      {cargando ? (
        <div className="panel-blanco text-center py-6">
          <p className="texto-muted">Cargando catálogo de productos...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <EstadoVacio
          icono={Package}
          titulo="No se encontraron productos"
          descripcion="Ajusta los filtros o añade un nuevo producto al catálogo."
        />
      ) : (
        <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tabla-responsive">
            <table className="tabla" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Foto</th>
                  <th>Código</th>
                  <th>Nombre comercial</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'right' }}>Precio público</th>
                  <th style={{ textAlign: 'center' }}>Puntos</th>
                  <th style={{ textAlign: 'center' }}>Orden</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(prod => (
                  <tr key={prod.id} style={{ opacity: prod.activo ? 1 : 0.65 }}>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px' }}>
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          style={{
                            width: '42px',
                            height: '42px',
                            objectFit: 'cover',
                            borderRadius: 'var(--rad-md)',
                            border: '1px solid var(--n-200)',
                            display: 'inline-block'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--rad-md)',
                            backgroundColor: 'var(--n-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            margin: '0 auto'
                          }}
                        >
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>

                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="badge-codigo" style={{ fontWeight: 600 }}>
                        {prod.codigo}
                      </span>
                    </td>

                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: 'var(--n-900)' }}>
                        {prod.nombre}
                      </div>
                      {prod.presentacion && (
                        <div className="texto-muted texto-xs" style={{ marginTop: '2px' }}>
                          {prod.presentacion}
                        </div>
                      )}
                    </td>

                    <td style={{ verticalAlign: 'middle' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'var(--n-100)',
                          color: 'var(--n-700)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {prod.categoria || 'Sin categoría'}
                      </span>
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        verticalAlign: 'middle',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      S/. {((prod.precio_lista_cent || 0) / 100).toFixed(2)}
                    </td>

                    <td
                      style={{
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 600,
                        color: 'var(--dorado-600)'
                      }}
                    >
                      {prod.puntos} pts
                    </td>

                    <td
                      style={{
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        color: 'var(--text-muted)'
                      }}
                    >
                      #{prod.orden}
                    </td>

                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <InsigniaEstado
                        estadoTipo={prod.activo ? 'activo' : 'inactivo'}
                      />
                    </td>

                    {/* Acciones: Editar y Activar/Desactivar (PROHIBIDO EL BORRADO) */}
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div className="flex-centro gap-1">
                        <button
                          type="button"
                          className="btn-icono"
                          title="Editar producto"
                          onClick={() => handleAbrirEditar(prod)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icono"
                          title={prod.activo ? 'Desactivar producto' : 'Activar producto'}
                          onClick={() => handleAbrirToggleActivo(prod)}
                          style={{
                            color: prod.activo ? 'var(--danger)' : 'var(--success)'
                          }}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {modalAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-4)',
            zIndex: 1000,
            overflowY: 'auto'
          }}
        >
          <div
            className="panel-blanco"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 'var(--sp-4)',
              position: 'relative'
            }}
          >
            {/* Cabecera del modal */}
            <div className="flex-entre" style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--n-200)', paddingBottom: 'var(--sp-2)' }}>
              <div>
                <h2 className="h3 flex-alineado gap-2" style={{ margin: 0 }}>
                  <Package className="texto-dorado" size={24} />
                  {modoEdicion ? `Editar producto: ${productoSeleccionado?.codigo}` : 'Nuevo producto'}
                </h2>
                <p className="texto-muted texto-sm" style={{ margin: '2px 0 0' }}>
                  {modoEdicion ? 'Actualiza los datos del producto en el catálogo.' : 'Registra un nuevo producto comercial en la base de datos.'}
                </p>
              </div>
              <button
                type="button"
                className="btn-icono"
                onClick={() => setModalAbierto(false)}
                disabled={guardando}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error del modal */}
            {errorModal && (
              <div className="banner-alerta banner-alerta-error flex-alineado gap-2" style={{ marginBottom: 'var(--sp-3)' }}>
                <AlertCircle size={20} />
                <span>{errorModal}</span>
              </div>
            )}

            {/* Advertencia de cambio de slug en edición */}
            {slugCambioEnEdicion && (
              <div
                className="banner-alerta banner-alerta-aviso flex-alineado gap-2"
                style={{
                  marginBottom: 'var(--sp-3)',
                  backgroundColor: 'var(--warning-soft)',
                  borderColor: 'var(--border-gold)',
                  color: 'var(--text-warning)',
                  padding: '10px 14px',
                  borderRadius: 'var(--rad-md)'
                }}
              >
                <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                  <strong>Aviso sobre la URL de la web:</strong>
                  <br />
                  Cambiar el slug rompe el enlace de la web que ya compartieron. La URL vieja va a dar 404.
                </div>
              </div>
            )}

            <form onSubmit={handleGuardar}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--sp-4)' }}>
                {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 className="h4" style={{ margin: '0 0 4px', color: 'var(--n-800)' }}>
                    1. Información Comercial
                  </h3>

                  {/* Código */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Código del producto <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input input"
                      value={formCodigo}
                      onChange={e => setFormCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="EJ: CAFE, HAR-MORINGA"
                      required
                      style={{ textTransform: 'uppercase', fontWeight: 600, width: '100%' }}
                    />
                    <span className="texto-muted texto-xs">Único, en mayúsculas y sin espacios.</span>
                  </div>

                  {/* Nombre comercial */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Nombre comercial <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input input"
                      value={formNombre}
                      onChange={e => handleNombreChange(e.target.value)}
                      placeholder="EJ: Coffee Capuccino"
                      required
                      style={{ width: '100%' }}
                    />
                    <span className="texto-muted texto-xs">El nombre comercial visible para clientes y socios.</span>
                  </div>

                  {/* Slug */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Slug URL <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input input"
                      value={formSlug}
                      onChange={e => handleSlugChange(e.target.value)}
                      placeholder="EJ: coffee-capuccino"
                      required
                      style={{ fontFamily: 'monospace', width: '100%' }}
                    />
                    <span className="texto-muted texto-xs">Identificador único en minúsculas para la URL web.</span>
                  </div>

                  {/* Categoría */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Categoría <span style={{ color: 'red' }}>*</span>
                    </label>
                    {!escribiendoNuevaCat ? (
                      <div className="flex-alineado gap-2">
                        <select
                          className="form-input input"
                          value={formCategoria}
                          onChange={e => {
                            if (e.target.value === '__NUEVA__') {
                              setEscribiendoNuevaCat(true);
                              setNuevaCategoria('');
                            } else {
                              setFormCategoria(e.target.value);
                            }
                          }}
                          style={{ width: '100%' }}
                        >
                          {categoriasExistentes.map(cat => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__NUEVA__">+ Escribir nueva categoría...</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex-alineado gap-2">
                        <input
                          type="text"
                          className="form-input input"
                          placeholder="Nombre de la nueva categoría"
                          value={nuevaCategoria}
                          onChange={e => setNuevaCategoria(e.target.value)}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-secundario texto-xs"
                          onClick={() => {
                            setEscribiendoNuevaCat(false);
                            setFormCategoria(categoriasExistentes[0] || '');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Presentación */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Presentación</label>
                    <input
                      type="text"
                      className="form-input input"
                      value={formPresentacion}
                      onChange={e => setFormPresentacion(e.target.value)}
                      placeholder="EJ: Caja 20 sobres de 18 g, Frasco 50 ml"
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Descripción */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Descripción comercial</label>
                    <textarea
                      className="form-input input"
                      rows={3}
                      value={formDescripcion}
                      onChange={e => setFormDescripcion(e.target.value)}
                      placeholder="Detalles sobre beneficios, propiedades e instrucciones de uso..."
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Foto con Timestamp */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Foto del producto (cuadrada 1:1, max 2 MB)</label>
                    <div className="flex-alineado gap-3" style={{ alignItems: 'flex-start' }}>
                      {previewFoto ? (
                        <img
                          src={previewFoto}
                          alt="Preview"
                          style={{
                            width: '68px',
                            height: '68px',
                            objectFit: 'cover',
                            borderRadius: 'var(--rad-md)',
                            border: '1px solid var(--n-200)',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '68px',
                            height: '68px',
                            borderRadius: 'var(--rad-md)',
                            backgroundColor: 'var(--n-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            flexShrink: 0
                          }}
                        >
                          <ImageIcon size={28} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFotoChange}
                          style={{ fontSize: '0.85rem' }}
                          disabled={optimizandoFoto || guardando}
                        />
                        {optimizandoFoto ? (
                          <div
                            role="status"
                            data-testid="producto-optimizando-aviso"
                            className="texto-xs flex-alineado gap-2"
                            style={{
                              marginTop: '6px',
                              padding: '6px 10px',
                              borderRadius: 'var(--r-input)',
                              backgroundColor: 'var(--surface-sunken)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-strong)'
                            }}
                          >
                            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: 'var(--mg-dorado)' }} />
                            <span>Optimizando imagen para el catálogo...</span>
                          </div>
                        ) : (
                          <div
                            className="texto-xs flex-alineado gap-1"
                            style={{ color: 'var(--text-muted)', marginTop: '4px' }}
                          >
                            <Info size={14} style={{ flexShrink: 0 }} />
                            <span>La web muestra las fotos en cuadrado (1:1). Si subes una foto muy alargada, se va a recortar.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Orden y Activo */}
                  <div className="flex-alineado gap-3">
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Posición (orden)</label>
                      <input
                        type="number"
                        className="form-input input"
                        value={formOrden}
                        onChange={e => setFormOrden(e.target.value)}
                        min={1}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1, paddingTop: '20px' }}>
                      <label className="flex-alineado gap-2" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formActivo}
                          onChange={e => setFormActivo(e.target.checked)}
                        />
                        <span style={{ fontWeight: 600 }}>Producto activo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: PRECIO, PUNTOS Y PANEL DE CONSECUENCIAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 className="h4" style={{ margin: '0 0 4px', color: 'var(--n-800)' }}>
                    2. Precio, Puntos y Consecuencias
                  </h3>

                  <div className="flex-alineado gap-3">
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        Precio público (S/.) <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-input input"
                        value={formPrecio}
                        onChange={e => setFormPrecio(e.target.value)}
                        placeholder="150.00"
                        required
                        style={{ fontWeight: 600, fontSize: '1.05rem', width: '100%' }}
                      />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        Puntos <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="form-input input"
                        value={formPuntos}
                        onChange={e => setFormPuntos(e.target.value)}
                        placeholder="18"
                        required
                        style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-warning)', width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* PANEL DE CONSECUENCIAS EN VIVO (BLOQUE 3) */}
                  <div
                    style={{
                      border: '1px solid var(--n-300)',
                      borderRadius: 'var(--rad-md)',
                      backgroundColor: 'var(--n-50)',
                      padding: 'var(--sp-3)',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, borderBottom: '1px solid var(--n-200)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--n-900)' }}>
                      ── Qué pasa con estos números en vivo ──
                    </div>

                    <div className="flex-entre py-1">
                      <span>Precio público:</span>
                      <span style={{ fontWeight: 600 }}>S/. {precioPublicoNum.toFixed(2)}</span>
                    </div>

                    <div className="flex-entre py-1">
                      <span>Precio de socio (Gold, {descGold}%):</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-exito)' }}>S/. {precioSocioGold.toFixed(2)}</span>
                    </div>

                    <div className="flex-entre py-1">
                      <span>Precio de socio (Kit, {descKit}%):</span>
                      <span style={{ fontWeight: 600 }}>S/. {precioSocioKit.toFixed(2)}</span>
                    </div>

                    <div className="flex-entre py-1">
                      <span>Puntos:</span>
                      <span style={{ fontWeight: 600, color: 'var(--dorado-600)' }}>{puntosNum}</span>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--n-300)', margin: '8px 0', paddingTop: '6px' }}>
                      <div className="flex-entre py-1">
                        <span>Residual máximo a la red:</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-warning)' }}>
                          S/. {residualMaximoRed.toFixed(2)} ({pctResidual}% × {puntosNum})
                        </span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-card)', padding: '8px', borderRadius: '4px', border: '1px solid var(--n-200)', margin: '8px 0' }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>Si lo compra un SOCIO Gold:</div>
                      <div className="flex-entre">
                        <span className="texto-xs texto-muted">Paga S/. {precioSocioGold.toFixed(2)}</span>
                        <span>→ a la empresa: <strong>S/. {empresaSiSocioGold.toFixed(2)}</strong></span>
                      </div>
                      <div style={{ fontWeight: 600, marginTop: '6px', marginBottom: '4px' }}>Si lo compra un CLIENTE:</div>
                      <div className="flex-entre">
                        <span className="texto-xs texto-muted">Paga S/. {precioPublicoNum.toFixed(2)}</span>
                        <span>→ a la empresa: <strong>S/. {empresaSiCliente.toFixed(2)}</strong></span>
                      </div>
                    </div>

                    {/* Referencia de la banda */}
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      <div>
                        Referencia: tus otros productos dan entre {bandaMin.toFixed(2)} y {bandaMax.toFixed(2)} soles de socio por punto.
                      </div>
                      <div style={{ marginTop: '4px', fontWeight: 600 }}>
                        Este da: {esteRatioSolesPorPunto > 0 ? esteRatioSolesPorPunto.toFixed(2) : '0.00'}.{' '}
                        {fueraDeBandaPorExcesoPuntos ? '⚠️' : '✅'}
                      </div>
                    </div>

                    {/* Alerta si se sale de la banda */}
                    {fueraDeBandaPorExcesoPuntos && (
                      <div
                        style={{
                          backgroundColor: 'var(--warning-soft)',
                          border: '1px solid var(--border-gold)',
                          color: 'var(--text-warning)',
                          padding: '8px',
                          borderRadius: '4px',
                          marginTop: '8px',
                          fontSize: '0.8rem',
                          lineHeight: '1.4'
                        }}
                      >
                        ⚠️ <strong>Este producto daría más puntos por sol que todos los demás.</strong>
                        <br />
                        La red se llevaría el {Math.round(pctRedLleva)}% de la venta, contra el ~23% habitual.
                        Revisa que sea lo que quieres.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex-entre" style={{ marginTop: 'var(--sp-4)', borderTop: '1px solid var(--n-200)', paddingTop: 'var(--sp-3)' }}>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando || optimizandoFoto}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primario"
                  disabled={guardando || optimizandoFoto}
                >
                  {guardando ? 'Guardando...' : optimizandoFoto ? 'Optimizando foto...' : modoEdicion ? 'Actualizar producto' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN ACTIVAR / DESACTIVAR */}
      <DialogoConfirmar
        abierto={!!productoAEstado}
        titulo={productoAEstado?.activo ? '¿Desactivar producto?' : '¿Activar producto?'}
        mensaje={
          productoAEstado?.activo
            ? `El producto "${productoAEstado?.nombre}" dejará de estar disponible para compras y en el catálogo público. Los pedidos históricos no se verán afectados.`
            : `El producto "${productoAEstado?.nombre}" volverá a estar visible y disponible para compras en el catálogo.`
        }
        textoConfirmar={productoAEstado?.activo ? 'Sí, desactivar' : 'Sí, activar'}
        textoCancelar="Cancelar"
        variante={productoAEstado?.activo ? 'peligro' : 'primario'}
        cargando={guardandoEstado}
        onConfirmar={handleConfirmarToggleActivo}
        onCancelar={() => {
          if (!guardandoEstado) {
            setProductoAEstado(null);
          }
        }}
      />
    </div>
  );
}
