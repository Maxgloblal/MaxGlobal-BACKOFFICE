import React from 'react';

/**
 * BarraProgreso - Pieza 2
 * Muestra el avance hacia una meta (ej. 48 / 70 puntos de activación).
 * Regla de oro: si valor > meta, el ancho NUNCA supera el 100%.
 * Soporta 3 estados: 'datos' (default), 'vacio', 'cargando'
 */
export default function BarraProgreso({
  etiqueta,
  valor = 0,
  meta = 100,
  unidad = 'pts',
  mensaje,
  variante = 'verde', // 'verde' | 'dorado' | 'alerta' | 'peligro'
  estado = 'datos',   // 'datos' | 'vacio' | 'cargando'
  className = ''
}) {
  if (estado === 'cargando') {
    return (
      <div className={`barra-progreso-contenedor ${className}`}>
        <div className="barra-progreso-header">
          <span className="mg-skeleton" style={{ width: '120px', height: '16px' }} />
          <span className="mg-skeleton" style={{ width: '60px', height: '16px' }} />
        </div>
        <div className="mg-skeleton" style={{ width: '100%', height: '12px', borderRadius: '999px' }} />
        <span className="mg-skeleton" style={{ width: '180px', height: '12px' }} />
      </div>
    );
  }

  if (estado === 'vacio' || meta <= 0) {
    return (
      <div className={`barra-progreso-contenedor ${className}`}>
        <div className="barra-progreso-header">
          <span className="barra-progreso-etiqueta">{etiqueta || 'Progreso'}</span>
          <span className="barra-progreso-conteo">0 / {meta} {unidad}</span>
        </div>
        <div className="barra-progreso-track">
          <div className="barra-progreso-fill" style={{ width: '0%' }} />
        </div>
        <div className="barra-progreso-mensaje">
          {mensaje || 'Sin progreso registrado en este ciclo.'}
        </div>
      </div>
    );
  }

  // CÁLCULO ESTRICTO: acotado matemáticamente a [0, 100]
  const porcentajeCalculado = meta > 0 ? (valor / meta) * 100 : 0;
  const porcentajeVisual = Math.min(100, Math.max(0, porcentajeCalculado));
  const completado = valor >= meta;

  return (
    <div className={`barra-progreso-contenedor ${className}`}>
      <div className="barra-progreso-header">
        <span className="barra-progreso-etiqueta">{etiqueta}</span>
        <span className="barra-progreso-conteo">
          {valor} <span className="barra-progreso-meta">/ {meta} {unidad}</span>
        </span>
      </div>

      <div className="barra-progreso-track" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={meta}>
        <div
          className={`barra-progreso-fill ${variante}`}
          style={{ width: `${porcentajeVisual}%` }}
        />
      </div>

      <div className="barra-progreso-mensaje">
        {mensaje ? (
          mensaje
        ) : completado ? (
          <span style={{ color: 'var(--green-600)', fontWeight: 'bold' }}>✓ Meta cumplida</span>
        ) : (
          <span>Te faltan {Math.max(0, meta - valor)} {unidad} para la meta</span>
        )}
      </div>
    </div>
  );
}
