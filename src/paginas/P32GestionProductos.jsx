import React, { useState, useEffect } from 'react';
import { obtenerProductosAdmin } from '../servicios/operacionAdmin';
import { TarjetaDato, Tabla, InsigniaEstado, Boton, EstadoVacio } from '../piezas';
import {
  Package,
  Plus,
  Edit2,
  Power,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

export default function P32GestionProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Carga inicial
  useEffect(() => {
    cargarListaProductos();
  }, []);

  async function cargarListaProductos() {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerProductosAdmin();
      setProductos(data || []);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError(err.message || 'Error al cargar el catálogo de productos.');
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
            onClick={() => {
              // El modal completo se activa en Bloque 2
              alert('Formulario de nuevo producto (Bloque 2)');
            }}
          >
            Nuevo producto
          </Boton>
        </div>
      </div>

      {/* Alertas */}
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
      <div className="grid-tarjetas">
        <TarjetaDato
          titulo="Total productos"
          valor={productos.length}
          icono={Package}
          color="dorado"
        />
        <TarjetaDato
          titulo="Activos en tienda"
          valor={totalActivos}
          icono={CheckCircle2}
          color="verde"
        />
        <TarjetaDato
          titulo="Inactivos"
          valor={totalInactivos}
          icono={Power}
          color="neutral"
        />
        <TarjetaDato
          titulo="Categorías"
          valor={categoriasExistentes.length}
          icono={Filter}
          color="azul"
        />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="panel-blanco" style={{ padding: 'var(--sp-3)' }}>
        <div className="flex-entre wrap gap-3" style={{ alignItems: 'center' }}>
          <div className="flex-alineado wrap gap-2" style={{ flex: 1, minWidth: '240px' }}>
            {/* Buscador */}
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

            {/* Filtro Categoría */}
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

            {/* Filtro Estado */}
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
                    {/* Miniatura */}
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

                    {/* Código */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="badge-codigo" style={{ fontWeight: 600 }}>
                        {prod.codigo}
                      </span>
                    </td>

                    {/* Nombre y presentación */}
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

                    {/* Categoría */}
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

                    {/* Precio público */}
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

                    {/* Puntos */}
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

                    {/* Orden */}
                    <td
                      style={{
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        color: 'var(--text-muted)'
                      }}
                    >
                      #{prod.orden}
                    </td>

                    {/* Activo */}
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <InsigniaEstado
                        estado={prod.activo ? 'activo' : 'inactivo'}
                        texto={prod.activo ? 'Activo' : 'Inactivo'}
                      />
                    </td>

                    {/* Acciones: Editar y Activar/Desactivar (NO BORRAR) */}
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div className="flex-centro gap-1">
                        <button
                          type="button"
                          className="btn-icono"
                          title="Editar producto"
                          onClick={() => {
                            alert(`Editar producto ${prod.codigo} (Bloque 2)`);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icono"
                          title={prod.activo ? 'Desactivar producto' : 'Activar producto'}
                          onClick={() => {
                            alert(`Cambiar estado de ${prod.codigo} (Bloque 2)`);
                          }}
                          style={{
                            color: prod.activo ? 'var(--color-error)' : 'var(--color-exito)'
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
    </div>
  );
}
