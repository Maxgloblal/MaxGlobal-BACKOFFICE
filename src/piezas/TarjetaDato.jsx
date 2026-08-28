import React from 'react';

/**
 * TarjetaDato - Pieza 1
 * Muestra un número grande con su rótulo.
 * Soporta 3 estados: 'datos' (default), 'vacio', 'cargando'
 */
export default function TarjetaDato({
  rotulo,
  valor,
  subrotulo,
  icono: Icono,
  variante = 'default', // 'default' | 'destacada' | 'verde'
  estado = 'datos',     // 'datos' | 'vacio' | 'cargando'
  className = ''
}) {
  if (estado === 'cargando') {
    return (
      <div className={`tarjeta-dato ${variante === 'destacada' ? 'tarjeta-dato-destacada' : ''} ${className}`}>
        <div className="tarjeta-dato-header">
          <span className="mg-skeleton" style={{ width: '80px', height: '14px' }} />
          <span className="mg-skeleton" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
        </div>
        <div className="mg-skeleton" style={{ width: '120px', height: '32px', margin: '8px 0' }} />
        <span className="mg-skeleton" style={{ width: '90px', height: '12px' }} />
      </div>
    );
  }

  if (estado === 'vacio' || valor === null || valor === undefined) {
    return (
      <div className={`tarjeta-dato ${variante === 'destacada' ? 'tarjeta-dato-destacada' : ''} ${className}`}>
        <div className="tarjeta-dato-header">
          <span className="tarjeta-dato-rotulo">{rotulo || 'Sin datos'}</span>
          {Icono && <span className="tarjeta-dato-icono"><Icono size={20} /></span>}
        </div>
        <div className="tarjeta-dato-valor" style={{ color: 'var(--text-muted)' }}>—</div>
        <div className="tarjeta-dato-subrotulo">{subrotulo || 'Sin registro en este periodo'}</div>
      </div>
    );
  }

  const claseVariante = variante === 'destacada'
    ? 'tarjeta-dato-destacada'
    : variante === 'verde'
    ? 'tarjeta-dato-verde'
    : '';

  return (
    <div className={`tarjeta-dato ${claseVariante} ${className}`}>
      <div className="tarjeta-dato-header">
        <span className="tarjeta-dato-rotulo">{rotulo}</span>
        {Icono && <span className="tarjeta-dato-icono"><Icono size={20} /></span>}
      </div>
      <div className="tarjeta-dato-valor">{valor}</div>
      {subrotulo && <div className="tarjeta-dato-subrotulo">{subrotulo}</div>}
    </div>
  );
}
