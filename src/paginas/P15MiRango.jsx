import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, Tabla, InsigniaEstado, BarraProgreso, Boton, EstadoVacio } from '../piezas';
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
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [socio, setSocio] = useState(null);
  const [datosRango, setDatosRango] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        let perfil = socio;
        let listaCiclos = ciclos;
        if (!perfil) {
          perfil = await obtenerPerfilSocio();
          if (!cancelado) setSocio(perfil);
        }
        if (!listaCiclos || listaCiclos.length === 0) {
          listaCiclos = await obtenerCiclos();
          if (!cancelado) setCiclos(listaCiclos);
        }
        const cicloAbierto = (listaCiclos || []).find((c) => c.estado === 'abierto');
        const cicloId = cicloSeleccionado || cicloAbierto?.id || listaCiclos[0]?.id;
        if (!cicloSeleccionado && cicloId && !cancelado) {
          setCicloSeleccionado(cicloId);
        }
        if (!cicloId) return;

        const datos = await obtenerMiRango(perfil.id, cicloId);
        if (!cancelado) {
          setDatosRango(datos);
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar datos de rango');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, [cicloSeleccionado]);

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
  const rcAnterior = datosRango?.rango_ciclo_anterior || null;
  const rHonorifico = datosRango?.rango_honorifico || {};
  const rSiguiente = datosRango?.rango_siguiente || {};
  const lineas = datosRango?.lineas || [];
  const rangosEscala = datosRango?.rangos_escala || [];
  const topeLinea = datosRango?.tope_linea_evaluado || 250;
  const puntosObjetivo = datosRango?.puntos_objetivo_evaluado || 500;

  const puntosComputables = rc.puntos_computables || 0;
  const puntosGrupales = rc.puntos_grupales || 0;
  const frontalesActivos = rc.frontales_activos || 0;
  const puntosPersonales = datosRango?.puntos_personales ?? rc.puntos_personales ?? 0;
  const califica = rc.califica || false;
  const bonoCent = rc.bono_cent || 0;

  // Datos de rango actual y ciclo anterior
  const rangoAlcanzadoNombre = rc.rango_nombre || null;
  const rangoAlcanzadoOrden = rc.rango_orden || 0;
  const rangoAnteriorNombre = rcAnterior?.rango_nombre || null;
  const rangoAnteriorOrden = rcAnterior?.rango_orden || 0;

  // Distinción de casos (RF-244 / RF-250)
  // Caso 1: Bajó de rango (alcanzó requisitos de un rango pero su orden es menor al ciclo anterior)
  const bajoDeRango = !califica && rangoAlcanzadoNombre && rangoAnteriorNombre && (rangoAlcanzadoOrden < rangoAnteriorOrden);

  // Rango meta a evaluar para socios que no califican
  const rangoMeta = (!califica && !bajoDeRango && !rangoAlcanzadoNombre)
    ? (rangosEscala.find((r) => r.orden === 1) || { nombre: 'Jade', puntos_grupales: 500, frontales_activos: 1 })
    : rSiguiente;

  const reqPuntosMeta = rangoMeta?.puntos_grupales || 500;
  const reqFrontalesMeta = rangoMeta?.frontales_activos || 1;

  const faltanPuntos = Math.max(0, reqPuntosMeta - puntosComputables);
  const faltanFrontales = Math.max(0, reqFrontalesMeta - frontalesActivos);

  // Caso 2 y Caso 3
  const inactivoPersonal = puntosPersonales < 70;
  const noLlegoPuntos = !califica && !bajoDeRango && faltanPuntos > 0;
  const noLlegoFrontales = !califica && !bajoDeRango && faltanPuntos === 0 && faltanFrontales > 0;

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
                backgroundColor: 'var(--warning-soft)',
                color: 'var(--text-warning)',
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
              value={cicloSeleccionado || ''}
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
          valor={
            califica
              ? rc.rango_nombre
              : bajoDeRango
              ? `${rangoAlcanzadoNombre}`
              : 'Sin Calificación'
          }
          subrotulo={
            califica
              ? `Bono ganado: ${formatearSoles(bonoCent)}`
              : bajoDeRango
              ? `Alcanzaste ${rangoAlcanzadoNombre}, pero venías de ${rangoAnteriorNombre} (S/. 0.00)`
              : 'No calificado este ciclo (S/. 0.00)'
          }
          icono={Award}
          variante={califica ? 'verde' : bajoDeRango ? 'oro' : 'default'}
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
          valor={`${puntosComputables.toLocaleString()} pts`}
          subrotulo={`Total grupal sin topear: ${puntosGrupales.toLocaleString()} pts`}
          icono={Target}
        />
        <TarjetaDato
          rotulo="Frontales Activos"
          valor={`${frontalesActivos} frontales`}
          subrotulo={`Requeridos para ${rSiguiente.nombre || 'siguiente'}: ${reqFrontalesSiguiente}`}
          icono={Users}
        />
      </div>

      {/* AVISO Y EXPLICACIÓN DETALLADA SEGÚN EL CASO EXACTO (RF-244 / RF-250) */}
      {!califica && (
        <div className="panel-explicacion-cero" style={{ marginBottom: 'var(--sp-6)' }}>
          {bajoDeRango ? (
            /* CASO 1: BAJÓ DE RANGO */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <AlertCircle size={22} className="txt-gold" />
                <h3 className="txt-gold">Descenso de Rango · Sin bono en este ciclo</h3>
              </div>
              <p className="seccion-desc txt-strong" style={{ marginTop: 'var(--sp-2)', fontSize: '15px', color: 'var(--texto-principal)' }}>
                Alcanzaste <strong>{rangoAlcanzadoNombre.toUpperCase()}</strong> este mes, pero venías de <strong>{rangoAnteriorNombre.toUpperCase()}</strong>.
              </p>
              <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)', color: 'var(--texto-secundario)' }}>
                Al bajar de rango no se cobra el bono. Mantén o sube tu rango el próximo ciclo para volver a cobrar.
              </p>
              <p className="txt-xs txt-muted" style={{ marginTop: 'var(--sp-2)' }}>
                Cumpliste los requisitos para {rangoAlcanzadoNombre}: {puntosComputables.toLocaleString()} puntos computables y {frontalesActivos} frontales activos.
              </p>
            </div>
          ) : inactivoPersonal ? (
            /* CASO ADICIONAL: INACTIVO POR PUNTOS PERSONALES */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <AlertCircle size={22} className="txt-gold" />
                <h3 className="txt-gold">Activación personal pendiente</h3>
              </div>
              <p className="seccion-desc txt-strong" style={{ marginTop: 'var(--sp-2)', fontSize: '15px' }}>
                No calificas este ciclo porque no estás activo (tienes {puntosPersonales} de los 70 pts de activación personal requeridos).
              </p>
              <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)', color: 'var(--texto-secundario)' }}>
                Realiza una compra personal de al menos 70 puntos para activar tu código y calificar a los bonos de rango.
              </p>
            </div>
          ) : noLlegoFrontales ? (
            /* CASO 3: NO LLEGÓ A LOS FRONTALES */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <AlertCircle size={22} className="txt-gold" />
                <h3 className="txt-gold">Frontales activos insuficientes para {rangoMeta.nombre}</h3>
              </div>
              <p className="seccion-desc txt-strong" style={{ marginTop: 'var(--sp-2)', fontSize: '15px' }}>
                Cumples con los puntos computables requeridos, pero te falta{faltanFrontales > 1 ? 'n' : ''} <strong>{faltanFrontales} frontal{faltanFrontales > 1 ? 'es' : ''} activo{faltanFrontales > 1 ? 's' : ''}</strong> (con 70+ pts) para calificar a <strong>{rangoMeta.nombre}</strong> (tienes {frontalesActivos} de {reqFrontalesMeta} requeridos).
              </p>
              <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)', color: 'var(--texto-secundario)' }}>
                Asegura la activación mensual de tus socios directos para habilitar la calificación y cobrar tu bono de rango.
              </p>
            </div>
          ) : (puntosComputables === 0 && frontalesActivos === 0) ? (
            <EstadoVacio
              icono={Award}
              titulo="Este ciclo todavía no calificas a un rango"
              mensaje={`Revisa los requisitos en la escala oficial para alcanzar el rango ${rangoMeta.nombre}. Requiere ${reqPuntosMeta.toLocaleString()} puntos computables y ${reqFrontalesMeta} frontales activos.`}
            />
          ) : (
            /* CASO 2: NO LLEGÓ A LOS PUNTOS (O A PUNTOS Y FRONTALES) */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <AlertCircle size={22} className="txt-gold" />
                <h3 className="txt-gold">Requisitos no alcanzados para calificar a {rangoMeta.nombre}</h3>
              </div>
              <p className="seccion-desc txt-strong" style={{ marginTop: 'var(--sp-2)', fontSize: '15px' }}>
                {faltanFrontales > 0 ? (
                  <>
                    Te faltan <strong>{faltanPuntos.toLocaleString()} puntos computables</strong> y <strong>{faltanFrontales} frontal{faltanFrontales > 1 ? 'es' : ''} activo{faltanFrontales > 1 ? 's' : ''}</strong> para calificar al rango <strong>{rangoMeta.nombre}</strong> (tienes {puntosComputables.toLocaleString()} de {reqPuntosMeta.toLocaleString()} pts, y {frontalesActivos} de {reqFrontalesMeta} frontales).
                  </>
                ) : (
                  <>
                    Te faltan <strong>{faltanPuntos.toLocaleString()} puntos computables</strong> para calificar al rango <strong>{rangoMeta.nombre}</strong> (tienes {puntosComputables.toLocaleString()} de {reqPuntosMeta.toLocaleString()} pts requeridos).
                  </>
                )}
              </p>
              <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)', color: 'var(--texto-secundario)' }}>
                Recuerda que cada línea directa aporta como máximo el 50% de los puntos exigidos para este rango ({topeLinea} pts).
              </p>
            </div>
          )}
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
          <EstadoVacio
            icono={Users}
            titulo="Sin líneas de patrocinio este ciclo"
            mensaje="Aún no tienes frontales directos registrados para calcular la regla de línea estirada."
          />
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
