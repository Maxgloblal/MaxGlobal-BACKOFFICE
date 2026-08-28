import React from 'react';
import EstadoVacio from './EstadoVacio';

/**
 * Tabla - Pieza 3
 * Muestra filas con columnas en escritorio y se transforma en tarjetas apiladas en móvil (< 768px).
 * Regla innegociable: si está vacía, RENDERIZA <EstadoVacio>, no una tabla sin filas.
 * Soporta 3 estados: 'datos', 'vacio', 'cargando'
 */
export default function Tabla({
  columnas = [],
  datos = [],
  estado = 'datos',
  vacioTitulo = 'No hay registros',
  vacioMensaje = 'No se encontraron filas para mostrar en este momento.',
  vacioAccionTexto,
  onVacioAccion,
  className = ''
}) {
  // 1. ESTADO CARGANDO
  if (estado === 'cargando') {
    return (
      <div className={`tabla-wrapper ${className}`}>
        {/* Esqueleto Escritorio */}
        <div className="tabla-escritorio" style={{ padding: 'var(--sp-4)' }}>
          <div className="mg-skeleton" style={{ width: '100%', height: '36px', marginBottom: 'var(--sp-2)' }} />
          <div className="mg-skeleton" style={{ width: '100%', height: '48px', marginBottom: 'var(--sp-2)' }} />
          <div className="mg-skeleton" style={{ width: '100%', height: '48px', marginBottom: 'var(--sp-2)' }} />
          <div className="mg-skeleton" style={{ width: '100%', height: '48px' }} />
        </div>
        {/* Esqueleto Móvil */}
        <div className="tabla-movil-cards">
          {[1, 2, 3].map((i) => (
            <div key={i} className="tabla-card-fila">
              <div className="mg-skeleton" style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
              <div className="mg-skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
              <div className="mg-skeleton" style={{ width: '80%', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. ESTADO VACÍO: Renderiza EstadoVacio sin tabla desierta
  if (estado === 'vacio' || !datos || datos.length === 0) {
    return (
      <EstadoVacio
        titulo={vacioTitulo}
        mensaje={vacioMensaje}
        accionTexto={vacioAccionTexto}
        onAccion={onVacioAccion}
        className={className}
      />
    );
  }

  // 3. ESTADO CON DATOS: Tabla en escritorio y Tarjetas apiladas en móvil
  return (
    <div className={`tabla-wrapper ${className}`}>
      {/* VISTA ESCRITORIO (>= 768px) */}
      <table className="tabla-escritorio">
        <thead>
          <tr>
            {columnas.map((col, idx) => (
              <th key={col.key || idx} style={col.ancho ? { width: col.ancho } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, fIdx) => (
            <tr key={fila.id || fIdx}>
              {columnas.map((col, cIdx) => (
                <td key={col.key || cIdx}>
                  {col.render ? col.render(fila) : fila[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* VISTA MÓVIL (< 768px): TARJETAS APILADAS CON RÓTULOS */}
      <div className="tabla-movil-cards">
        {datos.map((fila, fIdx) => (
          <div key={fila.id || fIdx} className="tabla-card-fila">
            {columnas.map((col, cIdx) => (
              <div key={col.key || cIdx} className="tabla-card-campo">
                <span className="tabla-card-label">{col.label}</span>
                <span className="tabla-card-value">
                  {col.render ? col.render(fila) : fila[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
