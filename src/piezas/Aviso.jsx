import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Aviso - Pieza de Comunicación en Línea
 * Reemplaza alert() del navegador por un contenedor semántico dentro de la pantalla.
 *
 * Variantes:
 * - 'error': fondo suave + borde var(--danger)
 * - 'aviso' | 'alerta': fondo suave + borde var(--warning)
 * - 'exito': fondo suave + borde var(--success)
 * - 'info': fondo suave + borde var(--info)
 *
 * Respeta tokens.css: CERO hexadecimales escritos directamente.
 */
export default function Aviso({
  tipo = 'info', // 'error' | 'aviso' | 'alerta' | 'exito' | 'info'
  titulo,
  mensaje,
  icono: IconoPersonalizado,
  onCerrar,
  children,
  className = '',
  style = {}
}) {
  const estilosPorTipo = {
    error: {
      background: 'var(--danger-soft)',
      border: '1px solid var(--border-danger, var(--danger))',
      borderLeft: '4px solid var(--danger)',
      color: 'var(--text-danger, var(--danger))',
      iconoDefecto: AlertCircle
    },
    aviso: {
      background: 'var(--warning-soft)',
      border: '1px solid var(--warning)',
      borderLeft: '4px solid var(--warning)',
      color: 'var(--text-warning, var(--warning))',
      iconoDefecto: AlertTriangle
    },
    alerta: {
      background: 'var(--warning-soft)',
      border: '1px solid var(--warning)',
      borderLeft: '4px solid var(--warning)',
      color: 'var(--text-warning, var(--warning))',
      iconoDefecto: AlertTriangle
    },
    exito: {
      background: 'var(--success-soft)',
      border: '1px solid var(--border-green, var(--success))',
      borderLeft: '4px solid var(--success)',
      color: 'var(--text-green, var(--green-600))',
      iconoDefecto: CheckCircle2
    },
    info: {
      background: 'var(--info-soft)',
      border: '1px solid var(--info)',
      borderLeft: '4px solid var(--info)',
      color: 'var(--info)',
      iconoDefecto: Info
    }
  };

  const configuracion = estilosPorTipo[tipo] || estilosPorTipo.info;
  const IconoComponente = IconoPersonalizado || configuracion.iconoDefecto;

  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`aviso-en-linea aviso-${tipo} ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-3) var(--sp-4)',
        borderRadius: 'var(--r-card, var(--r-md))',
        backgroundColor: configuracion.background,
        border: configuracion.border,
        borderLeft: configuracion.borderLeft,
        color: configuracion.color,
        marginBottom: 'var(--sp-4)',
        fontSize: 'var(--fs-sm)',
        lineHeight: 'var(--lh-normal)',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)', flex: 1 }}>
        {IconoComponente && (
          <span style={{ display: 'inline-flex', flexShrink: 0, marginTop: '2px' }}>
            <IconoComponente size={18} />
          </span>
        )}
        <div style={{ flex: 1 }}>
          {titulo && (
            <div style={{ fontWeight: 'var(--fw-bold, 700)', marginBottom: mensaje || children ? '2px' : 0 }}>
              {titulo}
            </div>
          )}
          {mensaje && <div>{mensaje}</div>}
          {children}
        </div>
      </div>

      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'inherit',
            opacity: 0.7,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
