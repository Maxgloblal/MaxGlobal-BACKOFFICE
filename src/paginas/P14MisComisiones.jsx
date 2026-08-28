import React, { useState } from 'react';
import { comisionesMaria } from '../datos-falsos/comisionesEjemplo';
import { TarjetaDato, Tabla, InsigniaEstado, Boton } from '../piezas';
import {
  Coins,
  DollarSign,
  Award,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';

/**
 * P-14 · Mis Comisiones
 * Muestra el desglose de bonos ganados y OBLIGATORIAMENTE la explicación en caso de cero.
 */
export default function P14MisComisiones() {
  const [mostrarCasoCero, setMostrarCasoCero] = useState(false);

  const columnasResidual = [
    { key: 'nivel', label: 'Nivel', render: (f) => `Nivel ${f.nivel}` },
    { key: 'deQuien', label: 'De quién' },
    { key: 'puntos', label: 'Puntos', render: (f) => `${f.puntos} pts` },
    { key: 'porcentaje', label: '%' },
    { key: 'ganaste', label: 'Ganaste', render: (f) => `S/. ${f.ganaste}` },
    {
      key: 'estado',
      label: 'Estado',
      render: (f) => <InsigniaEstado estadoTipo={f.estado} />
    }
  ];

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Backoffice Socio · P-14</span>
            <h1 className="pagina-titulo">Mis Comisiones</h1>
            <p className="pagina-subtitulo">Ciclo: {comisionesMaria.ciclo}</p>
          </div>
          <Boton
            variante="secundario"
            className="btn-compacto"
            onClick={() => setMostrarCasoCero(!mostrarCasoCero)}
          >
            Simular: {mostrarCasoCero ? 'Con Comisiones (S/. 228.40)' : 'En Cero con Explicación (S/. 0.00)'}
          </Boton>
        </div>
      </div>

      {/* CASO 1: EN CERO CON BLOQUE DE EXPLICACIÓN DETALLADO */}
      {mostrarCasoCero ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* Tarjeta de Total en Cero */}
          <div className="panel-blanco panel-alerta-cero-borde">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="tarjeta-dato-rotulo">Total del Ciclo</span>
                <div className="txt-display-num txt-3xl txt-strong">
                  S/. {comisionesMaria.casoCero.total}
                </div>
              </div>
              <InsigniaEstado estadoTipo="inactivo" textoPersonalizado="No Cobrado" />
            </div>
          </div>

          {/* BLOQUE EXPLICATIVO OBLIGATORIO DE POR QUÉ NO COBRÓ */}
          <div className="panel-explicacion-cero">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <AlertCircle size={22} className="txt-gold" />
              <h3 className="txt-gold">
                {comisionesMaria.casoCero.motivoTitulo}
              </h3>
            </div>
            <p className="seccion-desc txt-strong txt-bold">
              {comisionesMaria.casoCero.motivoDetalle}
            </p>
            <div className="box-alerta-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-1)' }}>
                <Info size={18} style={{ color: 'var(--info)' }} />
                <span className="txt-bold txt-xs">¿Qué pasó con las compras de tu red?</span>
              </div>
              <p className="seccion-desc">
                {comisionesMaria.casoCero.explicacionRed}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* CASO 2: CON COMISIONES DETALLADAS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {/* Tarjetas de Resumen por Tipo de Bono */}
          <div className="grid-tarjetas-datos">
            <TarjetaDato
              rotulo="Total del Ciclo"
              valor={`S/. ${comisionesMaria.totalCiclo}`}
              subrotulo="Abonado a tu billetera"
              icono={Coins}
              variante="verde"
            />
            <TarjetaDato
              rotulo="Bono Patrocinio"
              valor={`S/. ${comisionesMaria.bonoPatrocinio}`}
              subrotulo="Nuevas afiliaciones"
              icono={DollarSign}
            />
            <TarjetaDato
              rotulo="Bono Residual"
              valor={`S/. ${comisionesMaria.bonoResidual}`}
              subrotulo="Recompras de equipo"
              icono={Coins}
              variante="destacada"
            />
            <TarjetaDato
              rotulo="Bono de Rango"
              valor={`S/. ${comisionesMaria.bonoRango}`}
              subrotulo="Rango Bronce"
              icono={Award}
            />
          </div>

          {/* TABLA DE DETALLE RESIDUAL */}
          <section className="pagina-seccion">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="seccion-titulo">Detalle del Bono Residual</h2>
              <span className="seccion-desc">1 punto = S/. 1.00</span>
            </div>

            <Tabla
              columnas={columnasResidual}
              datos={comisionesMaria.detalleResidual}
            />

            <div className="box-alerta-inactivos">
              <HelpCircle size={18} className="txt-gold" style={{ flexShrink: 0 }} />
              <span className="txt-xs txt-gold">
                {comisionesMaria.observacionInactivo}
              </span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
