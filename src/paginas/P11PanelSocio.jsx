import React, { useState } from 'react';
import { socioMaria } from '../datos-falsos/socioEjemplo';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, BarraProgreso, Boton } from '../piezas';
import {
  Users,
  Award,
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * P-11 · Panel Principal del Socio
 * Muestra el tablero del socio con datos, progreso de activación y comisiones estimadas.
 */
export default function P11PanelSocio() {
  const [estaActiva, setEstaActiva] = useState(false);

  const puntosActuales = estaActiva
    ? socioMaria.puntosPersonalesActiva
    : socioMaria.puntosPersonalesInactiva;

  const puntosFaltantes = Math.max(0, socioMaria.metaPuntosPersonales - puntosActuales);

  return (
    <div className="pagina-contenedor">
      {/* Encabezado con Saludo y Contador de Cierre */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Backoffice Socio · P-11</span>
            <h1 className="pagina-titulo">Hola, {socioMaria.nombre.split(' ')[0]}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <span className="armazon-admin-cycle-badge">
              <Clock size={16} />
              <span>Cierre en {socioMaria.diasParaCierre} días ⏳</span>
            </span>
            <Boton
              variante="secundario"
              className="btn-compacto"
              onClick={() => setEstaActiva(!estaActiva)}
            >
              Simular: {estaActiva ? 'Sin Activar (48 pts)' : 'Activa (72 pts)'}
            </Boton>
          </div>
        </div>
      </div>

      {/* BLOQUE DE ALERTA DE ACTIVACIÓN (El elemento más importante del Backoffice) */}
      {estaActiva ? (
        <div className="panel-activa-exito">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <CheckCircle size={24} style={{ color: 'var(--green-600)' }} />
            <h3 style={{ color: 'var(--green-700)' }}>ESTÁS ACTIVA ESTE MES</h3>
          </div>
          <p className="seccion-desc">
            Cumpliste los {socioMaria.metaPuntosPersonales} puntos personales requeridos. Tienes derecho a cobrar todas las comisiones de tu red en el cierre de ciclo.
          </p>
          <BarraProgreso
            etiqueta="Puntos Personales Acumulados"
            valor={puntosActuales}
            meta={socioMaria.metaPuntosPersonales}
            unidad="pts"
            variante="verde"
          />
        </div>
      ) : (
        <div className="panel-alerta-activacion">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
            <h3 className="txt-gold">
              TE FALTAN {puntosFaltantes} PUNTOS PARA ACTIVARTE
            </h3>
          </div>
          <p className="seccion-desc">
            Quedan {socioMaria.diasParaCierre} días para el cierre del ciclo. Si no alcanzas los {socioMaria.metaPuntosPersonales} puntos personales, no podrás cobrar las comisiones generadas por tu equipo este mes.
          </p>
          <BarraProgreso
            etiqueta="Progreso de Activación"
            valor={puntosActuales}
            meta={socioMaria.metaPuntosPersonales}
            unidad="pts"
            variante="alerta"
          />
          <div>
            <Link to="/socio/tienda" className="btn btn-dorado">
              <ShoppingBag size={18} />
              <span>Ir a la Tienda de Recompra</span>
            </Link>
          </div>
        </div>
      )}

      {/* REJILLA DE TARJETAS DE DATOS */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">Resumen del Ciclo ({socioMaria.ciclo})</h2>
        <div className="grid-tarjetas-datos">
          <TarjetaDato
            rotulo="Puntos Grupales"
            valor={socioMaria.puntosGrupales.toLocaleString()}
            subrotulo="Volumen de tu equipo"
            icono={Users}
            variante="destacada"
          />
          <TarjetaDato
            rotulo="Frontales Activos"
            valor={`${socioMaria.frontalesActivos} / ${socioMaria.frontalesMinimos}`}
            subrotulo="Meta mensual cumplida"
            icono={Award}
            variante="verde"
          />
          <TarjetaDato
            rotulo="Mi Billetera"
            valor={formatearSoles(socioMaria.billeteraDisponibleCent)}
            subrotulo="Saldo disponible para retiro"
            icono={Wallet}
          />
          <TarjetaDato
            rotulo="Mi Rango"
            valor={socioMaria.rangoVigente}
            subrotulo={`Título: ${socioMaria.rangoHonorifico} (honorífico)`}
            icono={Award}
          />
        </div>
      </section>

      {/* ESTIMACIÓN DE COMISIONES DEL CICLO */}
      <section className="pagina-seccion">
        <div className="panel-blanco" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            <div>
              <h3 className="seccion-titulo">Comisión Estimada de este Ciclo</h3>
              <p className="seccion-desc">Cálculo en tiempo real según compras confirmadas de tu red.</p>
            </div>
            <div className="txt-display-num txt-3xl txt-green">
              {formatearSoles(socioMaria.comisionEstimadaCent)}
            </div>
          </div>
          <div className="txt-xs txt-muted" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--sp-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ Es una estimación. El monto definitivo se consolida al cierre del mes.</span>
            <Link to="/socio/comisiones" className="btn btn-secundario btn-mini">
              <span>Ver Detalle</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
