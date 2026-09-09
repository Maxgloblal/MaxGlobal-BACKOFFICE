import React, { useState } from 'react';
import { Package } from 'lucide-react';

/**
 * TAREA-33 · Foto o miniatura de producto con marcador fallback infalible.
 * 
 * - Renderiza en proporción cuadrada (1:1) o dimensiones dadas.
 * - object-fit: cover
 * - loading="lazy"
 * - alt={nombre}
 * - Si imagen_url es null o falla al cargar (onError), muestra marcador con icono de producto
 * - NUNCA muestra imagen rota
 */
export default function FotoProducto({
  url,
  nombre = 'Producto',
  tamano = null, // e.g. 48, '100%', 80
  aspectRatio = '1 / 1',
  borderRadius = 'var(--radius-md, 8px)',
  className = '',
  style = {}
}) {
  const [errorCarga, setErrorCarga] = useState(false);

  const tieneFoto = Boolean(url && url.trim() && !errorCarga);

  const contenedorStyle = {
    position: 'relative',
    width: tamano ? (typeof tamano === 'number' ? `${tamano}px` : tamano) : '100%',
    height: tamano ? (typeof tamano === 'number' ? `${tamano}px` : tamano) : 'auto',
    aspectRatio: aspectRatio || '1 / 1',
    borderRadius: borderRadius,
    overflow: 'hidden',
    backgroundColor: 'var(--surface-subtle, var(--fondo-suave, #f4f4f5))',
    border: '1px solid var(--borde, rgba(0,0,0,0.08))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...style
  };

  if (!tieneFoto) {
    return (
      <div
        className={`marcador-foto-producto ${className}`}
        style={contenedorStyle}
        aria-label={`Sin foto de ${nombre}`}
        title={`Sin foto de ${nombre}`}
      >
        <Package
          size={tamano && typeof tamano === 'number' && tamano <= 40 ? 18 : 28}
          style={{ color: 'var(--texto-apagado, #a1a1aa)', strokeWidth: 1.6 }}
        />
      </div>
    );
  }

  return (
    <div className={`contenedor-foto-producto ${className}`} style={contenedorStyle}>
      <img
        src={url}
        alt={nombre}
        loading="lazy"
        onError={() => setErrorCarga(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
}
