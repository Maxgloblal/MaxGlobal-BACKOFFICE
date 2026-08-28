import React from 'react';
import { redMaria } from '../datos-falsos/redEjemplo';
import { NodoArbol, TarjetaDato } from '../piezas';
import { Users, ShieldCheck, UserCheck } from 'lucide-react';

/**
 * P-12 · Mi Red
 * Visualización del árbol de afiliados multinivel.
 * Garantía de Protección de Datos Personales (Ley 29733).
 */
export default function P12MiRed() {
  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <span className="kit-header-badge">Backoffice Socio · P-12</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Mi Red de Afiliados</h1>
            <p className="pagina-subtitulo">Estructura unilevel y estado de activación del ciclo actual</p>
          </div>
          <span className="armazon-badge-rango txt-sm">
            Total: {redMaria.totalSocios} socios en red
          </span>
        </div>
      </div>

      {/* Tarjetas de Resumen de Red */}
      <div className="grid-tarjetas-datos">
        <TarjetaDato
          rotulo="Total de la Red"
          valor={redMaria.totalSocios}
          subrotulo="Socios en tu descendencia"
          icono={Users}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Frontales Directos"
          valor="4"
          subrotulo="3 activos · 1 sin activar"
          icono={UserCheck}
        />
        <TarjetaDato
          rotulo="Profundidad Máxima"
          valor="3 niveles"
          subrotulo="Habilitados por tu Pack Gold (hasta 10)"
          icono={ShieldCheck}
          variante="verde"
        />
      </div>

      {/* LEYENDA Y AVISO DE PRIVACIDAD */}
      <div className="panel-blanco" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <div className="leyenda-item">
            <span className="dot-indicador dot-verde" />
            <span>🟢 Activo este mes (≥ 70 pts)</span>
          </div>
          <div className="leyenda-item">
            <span className="dot-indicador dot-rojo" />
            <span>🔴 Sin activar (&lt; 70 pts)</span>
          </div>
        </div>

        <div className="txt-2xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--green-600)' }} />
          <span>Datos protegidos bajo Ley 29733</span>
        </div>
      </div>

      {/* ÁRBOL DE LA RED */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">Árbol Genealógico Descendente</h2>
        <div className="panel-blanco">
          <NodoArbol
            socio={redMaria.raiz}
            hijos={redMaria.raiz.hijos}
            nivel={0}
            esRaiz={true}
            expandidoPorDefecto={true}
          />
        </div>
      </section>
    </div>
  );
}
