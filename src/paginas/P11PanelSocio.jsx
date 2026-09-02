import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, BarraProgreso, Boton } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerCiclos,
  obtenerPanelPrincipal
} from '../servicios/socio';
import {
  Users,
  Award,
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * P-11 · Panel Principal del Socio
 * Tablero central: estado de activación prominente, contadores diferenciados, rango y estimación.
 */
export default function P11PanelSocio() {
  const [socio, setSocio] = useState(null);
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(3);
  const [panel, setPanel] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarInicial() {
      try {
        setCargando(true);
        const [perfil, listaCiclos] = await Promise.all([
          obtenerPerfilSocio(),
          obtenerCiclos()
        ]);
        setSocio(perfil);
        setCiclos(listaCiclos);
        const cicloActivo = listaCiclos.find((c) => c.estado === 'abierto')?.id || listaCiclos[0]?.id || 3;
        setCicloSeleccionado(cicloActivo);
      } catch (err) {
        setError(err.message || 'Error al cargar perfil');
      } finally {
        setCargando(false);
      }
    }
    cargarInicial();
  }, []);

  useEffect(() => {
    async function cargarDatosPanel() {
      if (!socio?.id || !cicloSeleccionado) return;
      try {
        setCargando(true);
        const datos = await obtenerPanelPrincipal(socio.id, cicloSeleccionado);
        setPanel(datos);
      } catch (err) {
        setError(err.message || 'Error al cargar datos del panel');
      } finally {
        setCargando(false);
      }
    }
    cargarDatosPanel();
  }, [socio?.id, cicloSeleccionado]);

  if (cargando && !panel) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando panel principal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertCircle className="txt-gold" size={24} />
            <h2 className="txt-gold txt-lg">Error al cargar panel</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const primerNombre = socio?.nombres ? socio.nombres.split(' ')[0] : 'Socio';
  const estaActivo = panel?.estaActivo || false;
  const puntosPersonales = panel?.puntosPersonales || 0;
  const puntosFaltantes = panel?.puntosFaltantes || 0;
  const puntosGrupales = panel?.puntosGrupales || 0;
  const puntosComputables = panel?.puntosComputables || 0;
  const frontalesActivos = panel?.frontalesActivos || 0;
  const saldoDisponibleCent = panel?.saldoDisponibleCent || 0;
  const estimadoCicloCent = panel?.estimadoCicloCent || 0;
  const diasRestantes = panel?.diasRestantes || 0;
  const rangoVigenteNombre = panel?.rangoVigenteNombre || 'Sin Rango';
  const rangoHonorificoNombre = panel?.rangoHonorificoNombre || 'Sin Rango';

  return (
    <div className="pagina-contenedor">
      {/* Encabezado con Saludo y Contador de Cierre */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Backoffice Socio · P-11</span>
            <h1 className="pagina-titulo">Hola, {primerNombre}</h1>
            <p className="pagina-subtitulo">
              Código: <strong>{socio?.codigo}</strong> · Pack: <strong style={{ color: 'var(--oro)' }}>{socio?.pack?.nombre}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            {/* Selector de Ciclo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <label htmlFor="select-ciclo-panel" className="txt-sm txt-bold">
                Ciclo:
              </label>
              <select
                id="select-ciclo-panel"
                className="formulario-select"
                value={cicloSeleccionado}
                onChange={(e) => setCicloSeleccionado(Number(e.target.value))}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
              >
                {ciclos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre || `Ciclo ${c.id}`} ({c.estado})
                  </option>
                ))}
              </select>
            </div>

            {/* Contador de Cierre con aviso prominente (RF-217 / RF-218) */}
            <span
              className={estaActivo ? 'armazon-admin-cycle-badge' : 'armazon-admin-cycle-badge'}
              style={{
                backgroundColor: !estaActivo ? 'rgba(239, 68, 68, 0.15)' : undefined,
                color: !estaActivo ? '#ef4444' : undefined,
                borderColor: !estaActivo ? 'rgba(239, 68, 68, 0.4)' : undefined,
                fontWeight: 700
              }}
            >
              <Clock size={16} />
              <span>Cierre del mes en {diasRestantes} días ⏳</span>
            </span>
          </div>
        </div>
      </div>

      {/* BLOQUE DE ALERTA DE ACTIVACIÓN (RF-210 / RF-211 / RF-218 · El elemento más visible) */}
      {estaActivo ? (
        <div className="panel-activa-exito" style={{ marginBottom: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <CheckCircle size={24} style={{ color: 'var(--green-600)' }} />
            <h3 style={{ color: 'var(--green-700)' }}>ESTÁS ACTIVO ESTE MES</h3>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)' }}>
            Cumpliste con {puntosPersonales} puntos personales (mínimo 70 pts). Tienes derecho a cobrar todas las comisiones de patrocinio, residual y rango de tu equipo en el cierre de ciclo.
          </p>
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <BarraProgreso
              etiqueta="Puntos Personales Acumulados"
              valor={puntosPersonales}
              meta={70}
              unidad="pts"
              variante="verde"
            />
          </div>
        </div>
      ) : (
        <div className="panel-alerta-activacion" style={{ marginBottom: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
            <h3 className="txt-gold">
              TE FALTAN {puntosFaltantes} PUNTOS PARA ACTIVARTE Y COBRAR
            </h3>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)' }}>
            Llevas {puntosPersonales} de los 70 puntos personales requeridos. Quedan {diasRestantes} días para el cierre contable. Sin 70 puntos personales, no podrás cobrar ninguna comisión de tu red este ciclo (regla sin compresión).
          </p>
          <div style={{ marginTop: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
            <BarraProgreso
              etiqueta="Progreso de Activación Mensual"
              valor={puntosPersonales}
              meta={70}
              unidad="pts"
              variante="alerta"
            />
          </div>
          <div>
            <Link to="/socio/tienda" className="btn btn-dorado">
              <ShoppingBag size={18} />
              <span>Ir a la Tienda y Completar Activación</span>
            </Link>
          </div>
        </div>
      )}

      {/* REJILLA DE TARJETAS DE DATOS (RF-212 a RF-216) */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <h2 className="seccion-titulo">Métricas Clave del Ciclo</h2>
          <span className="seccion-desc">Los tres contadores de volumen operan de forma independiente</span>
        </div>

        <div className="grid-tarjetas-datos">
          {/* Contador 1: Puntos Personales */}
          <TarjetaDato
            rotulo="Puntos Personales"
            valor={`${puntosPersonales} pts`}
            subrotulo="Solo para tu activación de 70 pts"
            icono={ShoppingBag}
            variante={estaActivo ? 'verde' : 'default'}
          />

          {/* Contador 2: Puntos Grupales */}
          <TarjetaDato
            rotulo="Puntos Grupales"
            valor={`${puntosGrupales.toLocaleString()} pts`}
            subrotulo="Volumen bruto de toda tu red"
            icono={Users}
            variante="destacada"
          />

          {/* Contador 3: Puntos Computables tras Línea Estirada */}
          <TarjetaDato
            rotulo="Puntos Computables"
            valor={`${puntosComputables.toLocaleString()} pts`}
            subrotulo="Para calificación de Rango (con tope 50%)"
            icono={Target}
          />

          {/* Frontales Activos */}
          <TarjetaDato
            rotulo="Frontales Activos"
            valor={`${frontalesActivos} frontales`}
            subrotulo="Directos con >= 70 pts este ciclo"
            icono={Award}
          />

          {/* Saldo Disponible en Billetera */}
          <TarjetaDato
            rotulo="Saldo Disponible"
            valor={formatearSoles(saldoDisponibleCent)}
            subrotulo="Líquido para retiro inmediato"
            icono={Wallet}
          />

          {/* Rango Vigente y Honorífico */}
          <TarjetaDato
            rotulo="Rango Vigente"
            valor={rangoVigenteNombre}
            subrotulo={`Honorífico Máx: ${rangoHonorificoNombre}`}
            icono={Award}
          />
        </div>
      </section>

      {/* ESTIMACIÓN DE COMISIONES DEL CICLO (RF-215 / RF-292) */}
      <section className="pagina-seccion">
        <div className="panel-blanco" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            <div>
              <h3 className="seccion-titulo">Comisión Estimada de este Ciclo</h3>
              <p className="seccion-desc">Cálculo en vivo de compras confirmadas de tu equipo pendientes de liquidación.</p>
            </div>
            <div className="txt-display-num txt-3xl" style={{ color: 'var(--verde)', fontWeight: 800 }}>
              {formatearSoles(estimadoCicloCent)}
            </div>
          </div>
          <div
            className="txt-xs txt-muted"
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 'var(--sp-3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--sp-2)'
            }}
          >
            <span>
              ℹ️ Este monto se acreditará a tu <strong>Saldo Disponible</strong> en el cierre contable del mes si cumples tu activación de 70 puntos.
            </span>
            <Link to="/socio/comisiones" className="btn btn-secundario btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>Ver Desglose Completo</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
