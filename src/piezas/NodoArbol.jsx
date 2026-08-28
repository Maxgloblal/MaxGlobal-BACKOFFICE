import React, { useState } from 'react';
import { ChevronRight, ChevronDown, User, ShieldCheck } from 'lucide-react';
import InsigniaEstado from './InsigniaEstado';

/**
 * NodoArbol - Pieza 8
 * Representa un socio dentro de la red multinivel (P-12 Mi red).
 * Garantía estricta de privacidad (Ley 29733):
 * NUNCA expone teléfono, correo ni comisiones ajenas.
 * Soporta 3 estados: 'datos', 'vacio', 'cargando'
 */
export default function NodoArbol({
  socio,
  hijos = [],
  nivel = 1,
  esRaiz = false,
  expandidoPorDefecto = true,
  estado = 'datos',
  className = ''
}) {
  const [expandido, setExpandido] = useState(expandidoPorDefecto);

  if (estado === 'cargando') {
    return (
      <div className={`nodo-arbol-contenedor ${className}`}>
        <div className="nodo-arbol-item">
          <div className="nodo-arbol-izq">
            <span className="mg-skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
            <div className="nodo-arbol-info">
              <span className="mg-skeleton" style={{ width: '140px', height: '16px', marginBottom: '4px' }} />
              <span className="mg-skeleton" style={{ width: '90px', height: '12px' }} />
            </div>
          </div>
          <div className="nodo-arbol-der">
            <span className="mg-skeleton" style={{ width: '60px', height: '20px', borderRadius: '999px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (estado === 'vacio' || !socio) {
    return (
      <div className={`nodo-arbol-contenedor ${className}`}>
        <div className="nodo-arbol-item" style={{ opacity: 0.6, borderStyle: 'dashed' }}>
          <div className="nodo-arbol-izq">
            <User size={20} style={{ color: 'var(--text-muted)' }} />
            <div className="nodo-arbol-info">
              <span className="nodo-arbol-nombre">Sin socios en esta posición</span>
              <span className="nodo-arbol-meta">Invita a nuevos afiliados para expandir tu red</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tieneHijos = hijos && hijos.length > 0;
  const estaActivo = socio.activo ?? (socio.puntos >= 70);

  return (
    <div className={`nodo-arbol-contenedor ${className}`}>
      <div className={`nodo-arbol-item ${estaActivo ? 'activo' : 'inactivo'}`}>
        <div className="nodo-arbol-izq">
          {tieneHijos ? (
            <button
              className="nodo-arbol-btn-expand"
              onClick={() => setExpandido(!expandido)}
              aria-label={expandido ? 'Colapsar rama' : 'Expandir rama'}
            >
              {expandido ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: estaActivo ? 'var(--green-500)' : 'var(--danger)'
                }}
              />
            </div>
          )}

          <div className="nodo-arbol-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span className="nodo-arbol-nombre">{socio.nombre}</span>
              {esRaiz && (
                <span
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--gold-100)',
                    color: 'var(--gold-700)',
                    padding: '1px 6px',
                    borderRadius: 'var(--r-badge)'
                  }}
                >
                  [tú]
                </span>
              )}
            </div>
            <div className="nodo-arbol-meta">
              <span>{socio.pack || 'Socio'}</span>
              <span>·</span>
              <span>{socio.puntos ?? 0} pts</span>
              <span>·</span>
              <span>Nivel {nivel}</span>
            </div>
          </div>
        </div>

        <div className="nodo-arbol-der">
          <InsigniaEstado
            estadoTipo={estaActivo ? 'activo' : 'inactivo'}
            textoPersonalizado={estaActivo ? 'Activo' : 'Sin activar'}
          />
        </div>
      </div>

      {tieneHijos && expandido && (
        <div className="nodo-arbol-hijos">
          {hijos.map((hijo, idx) => (
            <NodoArbol
              key={hijo.id || idx}
              socio={hijo}
              hijos={hijo.hijos || []}
              nivel={nivel + 1}
              esRaiz={false}
              expandidoPorDefecto={expandidoPorDefecto}
            />
          ))}
        </div>
      )}
    </div>
  );
}
