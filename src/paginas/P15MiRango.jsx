import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, Tabla, InsigniaEstado, BarraProgreso, Boton } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerCiclos,
  obtenerMiRango
} from '../servicios/socio';
import {
  Award,
  Users,
  Target,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

/**
 * P-15 · Mi Rango
 * Visualización del rango vigente, honorífico, avance de puntos, regla de línea estirada y escala oficial.
 */
export default function P15MiRango() {
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(3);
  const [socio, setSocio] = useState(null);
  const [datosRango, setDatosRango] = useState(null);
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
        setError(err.message || 'Error al cargar perfil de socio');
      } finally {
        setCargando(false);
      }
    }
    cargarInicial();
  }, []);

  useEffect(() => {
    async function cargarDetallesRango() {
      if (!socio?.id || !cicloSeleccionado) return;
      try {
        setCargando(true);
        const datos = await obtenerMiRango(socio.id, cicloSeleccionado);
        setDatosRango(datos);
      } catch (err) {
        setError(err.message || 'Error al cargar datos de rango');
      } finally {
        setCargando(false);
      }
    }
    cargarDetallesRango();
  }, [socio?.id, cicloSeleccionado]);

  if (cargando && !datosRango) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando estado de rango...</p>
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
            <h2 className="txt-gold txt-lg">Error al cargar rango</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const rc = datosRango?.rango_ciclo || {};
  const rHonorifico = datosRango?.rango_honorifico || {};
  const rSiguiente = datosRango?.rango_siguiente || {};
  const lineas = datosRango?.lineas || [];
  const rangosEscala = datosRango?.rangos_escala || [];
  const topeLinea = datosRango?.tope_linea_evaluado || 250;
  const puntosObjetivo = datosRango?.puntos_objetivo_evaluado || 500;

  const puntosComputables = rc.puntos_computables || 0;
  const puntosGrupales = rc.puntos_grupales || 0;
  const frontalesActivos = rc.frontales_activos || 0;
  const califica = rc.califica || false;
  const bonoCent = rc.bono_cent || 0;

  const reqPuntosSiguiente = rSiguiente.puntos_grupales || 500;
  const reqFrontalesSiguiente = rSiguiente.frontales_activos || 1;

  const pctPuntos = Math.min(100, Math.round((puntosComputables / reqPuntosSiguiente) * 100));
  const pctFrontales = Math.min(100, Math.round((frontalesActivos / reqFrontalesSiguiente) * 100));

  const columnasLineas = [
    {
      key: 'frontal_nombre',
      label: 'Línea (Frontal Directo)',
      render: (f) => (
        <div>
          <div className="txt-bold">{f.frontal_nombre}</div>
          <div className="txt-xs txt-muted">{f.frontal_codigo}</div>
        </div>
      )
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (f) => (
        <InsigniaEstado
          estadoTipo={f.activo ? 'activo' : 'inactivo'}
          textoPersonalizado={f.activo ? 'Activo (>=70 pts)' : 'Inactivo'}
        />
      )
    },
    {
      key: 'puntos_totales_rama',
      label: 'Puntos Totales de la Rama',
      render: (f) => `${f.puntos_totales_rama} pts`
    },
    {
      key: 'puntos_computados',
      label: 'Puntos Computables (50% Máx)',
      render: (f) => (
        <div>
          <span className="txt-bold">{f.puntos_computados} pts</span>
          {f.tope_alcanzado && (
            <span
              style={{
                marginLeft: '6px',
                fontSize: '11px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#eab308',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              ⚠️ Tope {topeLinea} pts
            </span>
          )}
        </div>
      )
    }
  ];

  const columnasEscala = [
    {
      key: 'nombre',
      label: 'Rango',
      render: (r) => (
        <div style={{ opacity: r.definido ? 1 : 0.45 }}>
          <strong style={{ color: r.definido ? 'var(--oro)' : 'var(--texto-apagado)' }}>
            {r.nombre}
          </strong>
          {!r.definido && <span className="txt-xs txt-muted"> (Próximamente)</span>}
        </div>
      )
    },
    {
      key: 'puntos_grupales',
      label: 'Puntos Grupales',
      render: (r) => (r.puntos_grupales ? `${r.puntos_grupales.toLocaleString()} pts` : '—')
    },
    {
      key: 'frontales_activos',
      label: 'Frontales Activos Requeridos',
      render: (r) => (r.frontales_activos ? `${r.frontales_activos} frontales` : '—')
    },
    {
      key: 'bono_cent',
      label: 'Bono en Soles',
      render: (r) => (r.bono_cent ? formatearSoles(r.bono_cent) : '—')
    }
  ];

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Backoffice Socio · P-15</span>
            <h1 className="pagina-titulo">Mi Rango</h1>
            <p className="pagina-subtitulo">
              Calificación mensual, balance de líneas estiradas y escala de crecimiento
            </p>
          </div>

          {/* Selector de Ciclo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <label htmlFor="select-ciclo-rango" className="txt-sm txt-bold">
              Ciclo:
            </label>
            <select
              id="select-ciclo-rango"
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
        </div>
      </div>

      {/* Tarjetas de Resumen de Rangos (RF-250 a RF-253) */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Rango del Ciclo Vigente"
          valor={califica ? rc.rango_nombre : 'Sin Calificación'}
          subrotulo={califica ? `Bono ganado: ${formatearSoles(bonoCent)}` : 'No calificado este ciclo (S/. 0.00)'}
          icono={Award}
          variante={califica ? 'verde' : 'default'}
        />
        <TarjetaDato
          rotulo="Rango Honorífico Máximo"
          valor={rHonorifico.nombre || rc.rango_nombre || 'Sin Rango'}
          subrotulo="Máximo alcanzado en el sistema"
          icono={ShieldCheck}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Puntos Computables"
          valor={`${puntosComputables} pts`}
          subrotulo={`Total grupal sin topear: ${puntosGrupales} pts`}
          icono={Target}
        />
        <TarjetaDato
          rotulo="Frontales Activos"
          valor={`${frontalesActivos} frontales`}
          subrotulo={`Requeridos para ${rSiguiente.nombre || 'siguiente'}: ${reqFrontalesSiguiente}`}
          icono={Users}
        />
      </div>

      {/* AVISO CLARO SI NO CALIFICA O BAJA DE RANGO */}
      {!califica && (
        <div className="panel-explicacion-cero" style={{ marginBottom: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertCircle size={22} className="txt-gold" />
            <h3 className="txt-gold">Sin bono de rango en este ciclo</h3>
          </div>
          <p className="seccion-desc txt-strong txt-bold" style={{ marginTop: 'var(--sp-1)' }}>
            Para cobrar el Bono de Rango debes calificar con los puntos computables requeridos y el mínimo de frontales activos. Si bajas de rango, la regla oficial establece S/. 0.00 de bono.
          </p>
        </div>
      )}

      {/* PROGRESO HACIA EL SIGUIENTE RANGO */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="panel-blanco">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <div>
              <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} style={{ color: 'var(--oro)' }} />
                Meta: {rSiguiente.nombre || 'Siguiente Rango'} ({reqPuntosSiguiente} pts)
              </h2>
              <p className="seccion-desc">
                Bono asignado: <strong style={{ color: 'var(--verde)' }}>{formatearSoles(rSiguiente.bono_cent || 0)}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="txt-sm txt-bold">Puntos Computables:</span>
                <span className="txt-sm txt-muted">{puntosComputables} / {reqPuntosSiguiente} pts ({pctPuntos}%)</span>
              </div>
              <BarraProgreso porcentaje={pctPuntos} variante="oro" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="txt-sm txt-bold">Frontales Activos:</span>
                <span className="txt-sm txt-muted">{frontalesActivos} / {reqFrontalesSiguiente} ({pctFrontales}%)</span>
              </div>
              <BarraProgreso porcentaje={pctFrontales} variante="verde" />
            </div>
          </div>
        </div>
      </section>

      {/* REGLA DE LÍNEA ESTIRADA · DESGLOSE LÍNEA POR LÍNEA (RF-254 a RF-256) */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <h2 className="seccion-titulo">Regla de Línea Estirada (Tope 50% por Línea)</h2>
          <span className="seccion-desc">
            Tope máximo por rama para {rSiguiente.nombre || 'el rango'}: <strong>{topeLinea} pts</strong> (50% de {puntosObjetivo} pts)
          </span>
        </div>

        <div className="box-alerta-info" style={{ marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
            <Info size={18} style={{ color: 'var(--info)' }} />
            <span className="txt-bold txt-xs">¿Cómo funciona la Línea Estirada?</span>
          </div>
          <p className="seccion-desc">
            Ninguna línea individual puede aportar más del 50% de los puntos exigidos para el rango que se evalúa ({topeLinea} pts). Los puntos excedentes de una línea fuerte protegen la sostenibilidad del plan y fomentan el desarrollo de múltiples equipos.
          </p>
        </div>

        {lineas.length === 0 ? (
          <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
            <p className="seccion-desc">Aún no tienes frontales directos patrocinados.</p>
          </div>
        ) : (
          <Tabla columnas={columnasLineas} datos={lineas} />
        )}
      </section>

      {/* ESCALA OFICIAL DE RANGOS (RF-257) */}
      <section className="pagina-seccion">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <h2 className="seccion-titulo">Escala Oficial de Rangos Max Global</h2>
          <span className="seccion-desc">16 Rangos del Plan de Compensación Oficial</span>
        </div>

        <Tabla columnas={columnasEscala} datos={rangosEscala} />
      </section>
    </div>
  );
}
