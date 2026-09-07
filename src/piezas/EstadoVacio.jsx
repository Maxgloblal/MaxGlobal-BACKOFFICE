import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EstadoVacio - Pieza 6
 * Muestra icono, título, mensaje y acción sugerida.
 * Pieza crucial para no dejar pantallas desiertas.
 */
export default function EstadoVacio({
  icono: Icono = Inbox,
  titulo = 'No hay información disponible',
  mensaje: mensajeProp,
  descripcion,
  accionTexto,
  onAccion,
  className = ''
}) {
  const textoMensaje = mensajeProp || descripcion || 'Los datos aparecerán aquí cuando se registren movimientos.';

  return (
    <div className={`estado-vacio ${className}`}>
      <div className="estado-vacio-icono">
        <Icono size={28} />
      </div>
      <h3 className="estado-vacio-titulo">{titulo}</h3>
      <p className="estado-vacio-desc">{textoMensaje}</p>
      {accionTexto && onAccion && (
        <button className="btn btn-primario" onClick={onAccion}>
          {accionTexto}
        </button>
      )}
    </div>
  );
}
