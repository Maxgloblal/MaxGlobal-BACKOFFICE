import React from 'react';

/**
 * InsigniaEstado - Pieza 4
 * Muestra el estado del pedido, socio o ciclo con colores accesibles.
 * Soporta 3 estados: 'datos', 'vacio', 'cargando'
 */
const TEXTOS_ESTADO = {
  por_confirmar: 'Por confirmar',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
  activo: 'Activo',
  inactivo: 'Inactivo',
  pendiente: 'Pendiente',
  anulado: 'Anulado'
};

export default function InsigniaEstado({
  estadoTipo = 'pendiente', // tipo de valor: 'por_confirmar' | 'confirmado' | etc.
  textoPersonalizado,
  estado = 'datos',         // 'datos' | 'vacio' | 'cargando'
  className = ''
}) {
  if (estado === 'cargando') {
    return (
      <span
        className={`mg-skeleton ${className}`}
        style={{ width: '90px', height: '22px', borderRadius: '999px', display: 'inline-block' }}
      />
    );
  }

  if (estado === 'vacio' || !estadoTipo) {
    return (
      <span className={`insignia-estado insignia-pendiente ${className}`}>
        <span className="insignia-dot" />
        <span>Sin estado</span>
      </span>
    );
  }

  const claveClase = estadoTipo.toLowerCase().replace(/\s+/g, '_');
  const textoAMostrar = textoPersonalizado || TEXTOS_ESTADO[claveClase] || estadoTipo;

  return (
    <span className={`insignia-estado insignia-${claveClase} ${className}`}>
      <span className="insignia-dot" />
      <span>{textoAMostrar}</span>
    </span>
  );
}
