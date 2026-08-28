import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Boton } from './Formulario';

/**
 * DialogoConfirmar - Pieza 7
 * Modal para acciones peligrosas o irreversibles.
 * Requiere confirmación explícita antes de ejecutar la acción.
 * Soporta estados: 'abierto', 'cargando'
 */
export default function DialogoConfirmar({
  abierto = false,
  titulo = '¿Confirmar esta acción?',
  mensaje = 'Esta acción no se puede deshacer una vez confirmada.',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'peligro', // 'peligro' | 'primario' | 'dorado'
  cargando = false,
  onConfirmar,
  onCancelar,
  children
}) {
  if (!abierto) return null;

  return (
    <div className="dialogo-overlay" role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo">
      <div className="dialogo-caja">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="dialogo-icono-alerta">
            <AlertTriangle size={24} />
          </div>
          <button
            onClick={onCancelar}
            disabled={cargando}
            style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
            aria-label="Cerrar diálogo"
          >
            <X size={20} />
          </button>
        </div>

        <h3 id="dialogo-titulo" className="dialogo-titulo">{titulo}</h3>
        <p className="dialogo-mensaje">{mensaje}</p>

        {children && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            {children}
          </div>
        )}

        <div className="dialogo-acciones">
          <Boton
            variante="secundario"
            onClick={onCancelar}
            disabled={cargando}
          >
            {textoCancelar}
          </Boton>
          <Boton
            variante={variante}
            onClick={onConfirmar}
            cargando={cargando}
            disabled={cargando}
          >
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  );
}
