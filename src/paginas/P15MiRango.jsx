import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, Tabla, InsigniaEstado, BarraProgreso, EstadoVacio } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerCiclos,
  obtenerMiRango,
  formatearNombreCiclo
} from '../servicios/socio';
import {
  Award,
  Users,
  Target,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

/**
 * P-15 · Mi Rango
 * Visualización del rango vigente, honorífico, avance de puntos,
 * doble perspectiva (Encuadre Rango Actual vs Proyección Próxima Meta)
 * y regla de línea estirada 50% / Parche Jade 100%.
 */
export default function P15MiRango() {
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [socio, setSocio] = useState(null);
  const [datosRango, setDatosRango] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Modo de perspectiva: 'actual' (Encuadre de Rango Conquistado) | 'siguiente' (Proyección Próxima Meta)
  const [vistaModo, setVistaModo] = useState('actual');

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
  const rAlcanzadoEnVivo = datosRango?.rango_alcanzado_en_vivo || null;
  const lineasRaw = datosRango?.lineas || [];
  const rangosEscala = datosRango?.rangos_escala || [];
  const pctLinea = datosRango?.linea_estirada_pct || 50;

  const cicloActualObj = (ciclos || []).find((c) => c.id === cicloSeleccionado);
  const esCicloAbierto = cicloActualObj ? cicloActualObj.estado === 'abierto' : !rc.id;
  const puntosPersonales = datosRango?.puntos_personales ?? rc.puntos_personales ?? 0;
  const activoPersonal = datosRango?.activo ?? rc.activo ?? false;
  const calificaOficial = rc.califica || false;
  const bonoCentOficial = rc.bono_cent || 0;

  // Datos históricos y ciclo anterior
  const rangoAlcanzadoNombre = rc.rango_nombre || null;
  const rangoAlcanzadoOrden = rc.rango_orden || 0;
  const rangoAnteriorNombre = rcAnterior?.rango_nombre || null;
  const rangoAnteriorOrden = rcAnterior?.rango_orden || 0;
  const bajoDeRango = !calificaOficial && rangoAlcanzadoNombre && rangoAnteriorNombre && (rangoAlcanzadoOrden < rangoAnteriorOrden);
  const inactivoPersonal = !activoPersonal;

  // 1. Identificar RANGO ACTUAL conquistado en este ciclo
  const nombresSinRango = ['sin rango', 'sin calificación', 'sin calificacion'];
  const tieneNombreValido = rc.rango_nombre && !nombresSinRango.includes(rc.rango_nombre.toLowerCase().trim());
  const rangoActual = rAlcanzadoEnVivo || (tieneNombreValido && (rc.califica || !esCicloAbierto)
    ? (rangosEscala.find(r => r.nombre?.toLowerCase() === rc.rango_nombre?.toLowerCase()) || {
        nombre: rc.rango_nombre,
        orden: rc.rango_orden || 1,
        puntos_grupales: rc.rango_puntos_req || 500,
        frontales_activos: rc.rango_frontales_req || 1,
        bono_cent: rc.bono_cent || 0
      })
    : null);

  const tieneRangoActual = Boolean(rangoActual && rangoActual.orden >= 1 && (rc.califica || rAlcanzadoEnVivo));

  // 2. Rango Siguiente (Próxima Meta)
  const rangoMeta = (rSiguiente && rSiguiente.orden)
    ? rSiguiente
    : (rangosEscala.find((r) => r.orden === 1) || { nombre: 'Jade', orden: 1, puntos_grupales: 500, frontales_activos: 1, bono_cent: 5000 });

  // 3. Perspectiva / Modo activo: si no tiene rango actual, siempre evalúa la meta siguiente (Jade)
  const modoEfectivo = tieneRangoActual ? vistaModo : 'siguiente';
  const esModoActual = (modoEfectivo === 'actual' && tieneRangoActual);
  const rangoEvaluado = esModoActual ? rangoActual : rangoMeta;

  // 4. Parámetros del rango evaluado en la vista activa
  const reqPuntos = rangoEvaluado?.puntos_grupales || 500;
  const reqFrontales = rangoEvaluado?.frontales_activos || 1;
  const esJade = rangoEvaluado?.orden === 1;

  // PARCHE JADE (TAREA-68): Jade (orden 1) = 100% computable (tope = reqPuntos = 500 pts)
  // Rangos superiores (orden >= 2) = 50% de los puntos exigidos por el rango
  const topeLinea = esJade ? reqPuntos : Math.floor((reqPuntos * pctLinea) / 100);

  // Topes para los botones de perspectiva
  const topeActualBtn = rangoActual
    ? (rangoActual.orden === 1 ? rangoActual.puntos_grupales : Math.floor((rangoActual.puntos_grupales * pctLinea) / 100))
    : 500;
  const topeMetaBtn = rangoMeta.orden === 1
    ? rangoMeta.puntos_grupales
    : Math.floor((rangoMeta.puntos_grupales * pctLinea) / 100);

  // 5. Recalcular dinámicamente cada rama frontal según el rango evaluado
  const lineasEvaluadas = lineasRaw.map((f, index) => {
    const ptsRama = f.puntos_totales_rama || 0;
    const ptsComputados = Math.min(ptsRama, topeLinea);
    const topeAlcanzado = ptsRama >= topeLinea;
    return {
      ...f,
      puntos_computados: ptsComputados,
      tope_alcanzado: topeAlcanzado,
      es_linea_mayor: index === 0,
      tope_maximo_linea: topeLinea
    };
  });

  const frontalesActivos = (esCicloAbierto || rc.frontales_activos == null)
    ? lineasEvaluadas.filter((l) => l.activo).length
    : rc.frontales_activos;

  const puntosComputables = lineasEvaluadas.reduce((acc, l) => acc + (l.puntos_computados || 0), 0);
  const puntosGrupales = lineasEvaluadas.reduce((acc, l) => acc + (l.puntos_totales_rama || 0), 0);

  const faltanPuntos = Math.max(0, reqPuntos - puntosComputables);
  const faltanFrontales = Math.max(0, reqFrontales - frontalesActivos);
  const cumplePuntos = puntosComputables >= reqPuntos;
  const cumpleFrontales = frontalesActivos >= reqFrontales;

  // Puntos de la rama mayor y resto de ramas en la vista activa
  const lineaMayor = lineasEvaluadas[0] || null;
  const puntosAporteMayor = lineaMayor ? lineaMayor.puntos_computados : 0;
  const puntosOtrasRamas = Math.max(0, puntosComputables - puntosAporteMayor);

  // Columnas para la tabla de balance de líneas
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
          textoPersonalizado={f.activo ? 'Activo' : 'Inactivo'}
        />
      )
    },
    {
      key: 'puntos_totales_rama',
      label: 'Puntos Totales de la Rama',
      render: (f) => `${(f.puntos_totales_rama || 0).toLocaleString()} pts`
    },
    {
      key: 'puntos_computados',
      label: esModoActual
        ? `Aporte Calificación ${rangoActual.nombre.toUpperCase()} (Tope ${topeLinea.toLocaleString()} pts)`
        : `Aporte a la Meta ${rangoMeta.nombre.toUpperCase()} (Tope ${topeLinea.toLocaleString()} pts)`,
      render: (f) => (
        <div>
          <span className="txt-bold">{f.puntos_computados.toLocaleString()} pts</span>
          {f.es_linea_mayor && f.tope_alcanzado && (
            <span
              style={{
                marginLeft: '6px',
                fontSize: '11px',
                backgroundColor: esModoActual ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                color: esModoActual ? 'var(--verde)' : 'var(--oro)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              {rangoEvaluado.orden === 1
                ? `✓ Línea mayor: 100% computable (${topeLinea.toLocaleString()} pts)`
                : esModoActual
                ? `✓ Línea mayor: tope 50% de ${rangoEvaluado.nombre} (${topeLinea.toLocaleString()} pts)`
                : `✓ Línea mayor: tope 50% hacia ${rangoEvaluado.nombre} (${topeLinea.toLocaleString()} pts)`}
            </span>
          )}
          {f.es_linea_mayor && !f.tope_alcanzado && f.puntos_totales_rama > 0 && (
            <span
              style={{
                marginLeft: '6px',
                fontSize: '11px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--info)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              ★ Línea mayor (100% computado)
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
      render: (r) => {
        const esEsteRangoActual = tieneRangoActual && rangoActual.orden === r.orden;
        const esEsteRangoMeta = rangoMeta.orden === r.orden;
        return (
          <div style={{ opacity: r.definido ? 1 : 0.45, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: esEsteRangoActual ? 'var(--verde)' : esEsteRangoMeta ? 'var(--oro)' : 'var(--texto-principal)' }}>
              {r.nombre}
            </strong>
            {esEsteRangoActual && (
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--verde)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}
              >
                ✓ RANGO ACTUAL
              </span>
            )}
            {esEsteRangoMeta && !esEsteRangoActual && (
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  color: 'var(--oro)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}
              >
                🎯 PRÓXIMA META
              </span>
            )}
            {!r.definido && <span className="txt-xs txt-muted"> (Próximamente)</span>}
          </div>
        );
      }
    },
    {
      key: 'puntos_grupales',
      label: 'Puntos Grupales',
      render: (r) => (r.puntos_grupales ? `${r.puntos_grupales.toLocaleString()} pts` : '—')
    },
    {
      key: 'tope_linea',
      label: 'Tope Línea Fuerte (50%)',
      render: (r) => {
        if (!r.puntos_grupales) return '—';
        if (r.orden === 1) return '500 pts (100%)';
        return `${Math.floor(r.puntos_grupales * 0.5).toLocaleString()} pts (50%)`;
      }
    },
    {
      key: 'frontales_activos',
      label: 'Frontales Activos',
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
                  {c.nombre || formatearNombreCiclo(c)} ({c.estado})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SELECTOR DE PERSPECTIVA: RANGO ACTUAL (ENCUADRE) vs PRÓXIMA META (PROYECCIÓN) */}
      {tieneRangoActual && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--sp-3)',
            marginBottom: 'var(--sp-6)',
            padding: '12px 18px',
            backgroundColor: 'var(--fondo-tarjeta)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--borde)'
          }}
        >
          <div>
            <span className="txt-bold" style={{ fontSize: '14px', color: 'var(--texto-principal)' }}>
              Perspectiva de Cálculo:
            </span>
            <p className="txt-xs txt-muted" style={{ margin: '2px 0 0' }}>
              Alterna entre la justificación de tu rango conquistado y la proyección hacia tu siguiente rango.
            </p>
          </div>

          <div style={{ display: 'inline-flex', gap: '8px', padding: '4px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setVistaModo('actual')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: esModoActual ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: esModoActual ? 'var(--verde)' : 'var(--texto-secundario)',
                border: esModoActual ? '1px solid var(--verde)' : '1px solid transparent'
              }}
            >
              <Award size={16} />
              <span>🏆 Rango Conquistado: <strong>{rangoActual.nombre.toUpperCase()}</strong> (Tope 50%: {topeActualBtn.toLocaleString()} pts)</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaModo('siguiente')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: !esModoActual ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
                color: !esModoActual ? 'var(--oro)' : 'var(--texto-secundario)',
                border: !esModoActual ? '1px solid var(--oro)' : '1px solid transparent'
              }}
            >
              <TrendingUp size={16} />
              <span>🚀 Próxima Meta: <strong>{rangoMeta.nombre.toUpperCase()}</strong> (Tope 50%: {topeMetaBtn.toLocaleString()} pts)</span>
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas de Resumen de Rangos (RF-250 a RF-253) */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo={
            esModoActual
              ? 'Rango Conquistado (En Vivo)'
              : esCicloAbierto ? 'Rango en Curso (En Vivo)' : 'Rango del Ciclo'
          }
          valor={
            esModoActual
              ? `${rangoActual.nombre} (Calificado)`
              : calificaOficial
              ? rc.rango_nombre
              : esCicloAbierto
              ? (rAlcanzadoEnVivo?.nombre ? `${rAlcanzadoEnVivo.nombre} (Calificando)` : 'Sin Calificación (En progreso)')
              : bajoDeRango
              ? `${rangoAlcanzadoNombre}`
              : 'Sin Calificación'
          }
          subrotulo={
            esModoActual
              ? `Bono asegurado al cierre: ${formatearSoles(rangoActual.bono_cent || 0)}`
              : calificaOficial
              ? `Bono ganado: ${formatearSoles(bonoCentOficial)}`
              : esCicloAbierto
              ? (rAlcanzadoEnVivo?.nombre
                ? `Bono en curso: ${formatearSoles(rAlcanzadoEnVivo.bono_cent || 0)} · Meta: ${rangoMeta.nombre}`
                : `Objetivo inicial: ${rangoMeta.nombre} (${reqPuntos} pts)`)
              : bajoDeRango
              ? `Alcanzaste ${rangoAlcanzadoNombre}, pero venías de ${rangoAnteriorNombre} (S/. 0.00)`
              : 'No calificado este ciclo (S/. 0.00)'
          }
          icono={Award}
          variante={
            esModoActual || calificaOficial || (esCicloAbierto && rAlcanzadoEnVivo?.nombre && activoPersonal)
              ? 'verde'
              : bajoDeRango
              ? 'oro'
              : 'default'
          }
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
          subrotulo={
            esModoActual
              ? `Meta superada: ${reqPuntos.toLocaleString()} pts (Tope 50%: ${topeLinea.toLocaleString()} pts)`
              : `Meta: ${reqPuntos.toLocaleString()} pts (Tope 50%: ${topeLinea.toLocaleString()} pts)`
          }
          icono={Target}
        />
        <TarjetaDato
          rotulo="Frontales Activos"
          valor={`${frontalesActivos} frontales`}
          subrotulo={`Requeridos para ${rangoEvaluado.nombre}: ${reqFrontales}`}
          icono={Users}
        />
      </div>

      {/* AVISO Y EXPLICACIÓN DETALLADA SEGÚN EL CASO EXACTO */}
      {inactivoPersonal ? (
        <div className="panel-explicacion-cero" style={{ marginBottom: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertCircle size={22} className="txt-gold" />
            <h3 className="txt-gold">Activación personal pendiente</h3>
          </div>
          <p className="seccion-desc txt-strong" style={{ marginTop: 'var(--sp-2)', fontSize: '15px' }}>
            {esCicloAbierto
              ? 'Para calificar a los bonos de rango al cierre de este ciclo, necesitas estar activo'
              : 'No calificaste este ciclo porque no estabas activo'} (tienes {puntosPersonales} pts personales de activación).
          </p>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)', color: 'var(--texto-secundario)' }}>
            Realiza una compra personal de al menos 70 pts para activar tu código y habilitar la calificación de rango.
          </p>
        </div>
      ) : bajoDeRango ? (
        <div className="panel-explicacion-cero" style={{ marginBottom: 'var(--sp-6)' }}>
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
        </div>
      ) : esModoActual ? (
        /* VISTA 1: ENCUADRE DE RANGO ACTUAL CONQUISTADO */
        <div className="box-alerta-info" style={{ marginBottom: 'var(--sp-6)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '6px' }}>
            <CheckCircle2 size={22} style={{ color: 'var(--verde)' }} />
            <h3 style={{ color: 'var(--verde)', margin: 0, fontSize: '16px' }}>
              Encuadre Oficial: Calificación al Rango {rangoActual.nombre.toUpperCase()} Conquistada
            </h3>
          </div>
          <p className="seccion-desc txt-strong" style={{ marginTop: 'var(--sp-1)', fontSize: '14px', color: 'var(--texto-principal)' }}>
            Has cumplido al 100% los requisitos para el rango <strong>{rangoActual.nombre.toUpperCase()}</strong>:
            necesitas {reqPuntos.toLocaleString()} pts y {reqFrontales} frontales activos.
          </p>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)', color: 'var(--texto-secundario)' }}>
            • <strong>Línea Mayor ({lineaMayor?.frontal_nombre || 'Brazo Fuerte'}):</strong> Aportó <strong>{puntosAporteMayor.toLocaleString()} pts</strong> (tope del 50% de {rangoActual.nombre}: {topeLinea.toLocaleString()} pts).<br />
            • <strong>Otras Líneas Directas:</strong> Aportaron <strong>{puntosOtrasRamas.toLocaleString()} pts</strong> al 100% sin tope.<br />
            • <strong>Total Computable:</strong> <strong>{puntosComputables.toLocaleString()} pts</strong> (superando los {reqPuntos.toLocaleString()} pts requeridos).<br />
            • <strong>Bono a cobrar al cierre:</strong> <strong style={{ color: 'var(--verde)' }}>{formatearSoles(rangoActual.bono_cent || 0)}</strong>.
          </p>
        </div>
      ) : (
        /* VISTA 2: PROYECCIÓN A LA PRÓXIMA META */
        <div className="box-alerta-info" style={{ marginBottom: 'var(--sp-6)', borderColor: 'rgba(217, 119, 6, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '6px' }}>
            <TrendingUp size={22} style={{ color: 'var(--oro)' }} />
            <h3 className="txt-gold" style={{ margin: 0, fontSize: '16px' }}>
              Proyección hacia la Próxima Meta: Rango {rangoMeta.nombre.toUpperCase()}
            </h3>
          </div>
          <p className="seccion-desc txt-strong" style={{ marginTop: 'var(--sp-1)', fontSize: '14px', color: 'var(--texto-principal)' }}>
            Para alcanzar <strong>{rangoMeta.nombre.toUpperCase()}</strong> se requieren <strong>{reqPuntos.toLocaleString()} pts computables</strong> y <strong>{reqFrontales} frontales activos</strong>.
            Bono al ascender: <strong style={{ color: 'var(--verde)' }}>{formatearSoles(rangoMeta.bono_cent || 0)}</strong>.
          </p>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)', color: 'var(--texto-secundario)' }}>
            Hacia esta meta, tu línea mayor ({lineaMayor?.frontal_nombre || 'Brazo Fuerte'}) amplía su aporte computable hasta <strong>{topeLinea.toLocaleString()} pts</strong> (50% de {rangoMeta.nombre}).
            {faltanPuntos > 0 ? (
              <> Actualmente te faltan <strong>{faltanPuntos.toLocaleString()} pts computables</strong>{faltanFrontales > 0 ? ` y ${faltanFrontales} frontal activo` : ''} para conquistar {rangoMeta.nombre}.</>
            ) : (
              <> ¡Ya cuentas con los puntos necesarios para calificar!</>
            )}
          </p>
        </div>
      )}

      {/* PROGRESO DE LA VISTA ACTIVA */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="panel-blanco">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <div>
              <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {esModoActual ? <Award size={20} style={{ color: 'var(--verde)' }} /> : <TrendingUp size={20} style={{ color: 'var(--oro)' }} />}
                {esModoActual
                  ? `Calificación Conquistada: ${rangoActual.nombre} (${reqPuntos.toLocaleString()} pts)`
                  : `Meta: ${rangoMeta.nombre} (${reqPuntos.toLocaleString()} pts)`}
              </h2>
              <p className="seccion-desc">
                Bono asignado: <strong style={{ color: 'var(--verde)' }}>{formatearSoles(rangoEvaluado.bono_cent || 0)}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
            <div>
              <BarraProgreso
                etiqueta="Puntos Computables"
                valor={puntosComputables}
                meta={reqPuntos}
                unidad="pts"
                variante={puntosComputables >= reqPuntos ? 'verde' : 'dorado'}
              />
            </div>

            <div>
              <BarraProgreso
                etiqueta="Frontales Activos"
                valor={frontalesActivos}
                meta={reqFrontales}
                unidad="frontales"
                variante={frontalesActivos >= reqFrontales ? 'verde' : 'dorado'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* REGLA DE LÍNEA MAYOR · DESGLOSE LÍNEA POR LÍNEA */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <h2 className="seccion-titulo">
            Regla de Equilibrio de Red (Línea Mayor / Línea Estirada · Máx 50%)
          </h2>
          <span className="seccion-desc">
            Tope 50% {esModoActual ? `de ${rangoActual.nombre}` : `hacia meta ${rangoMeta.nombre || 'del rango'}`}: <strong>{topeLinea.toLocaleString()} pts</strong>
          </span>
        </div>

        <div className="box-alerta-info" style={{ marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
            <Info size={18} style={{ color: 'var(--info)' }} />
            <span className="txt-bold txt-xs">¿Cómo funciona el cálculo de líneas para {rangoEvaluado.nombre}?</span>
          </div>
          <p className="seccion-desc">
            {rangoEvaluado.orden === 1 ? (
              <>
                Para el rango <strong>JADE (500 pts)</strong>, gracias a la regla de excepción (exige 1 solo frontal), tu línea mayor aporta hasta el <strong>100% de los 500 puntos</strong> ({topeLinea} pts).
              </>
            ) : (
              <>
                Para evaluar el rango <strong>{rangoEvaluado.nombre} ({reqPuntos.toLocaleString()} pts)</strong>, únicamente tu <strong>línea con mayor volumen (brazo fuerte)</strong> tiene un tope máximo del 50% (<strong>{topeLinea.toLocaleString()} pts</strong>), mientras que el resto de tus líneas directas aportan el 100% de sus puntos sin restricción.
              </>
            )}
          </p>
        </div>

        {lineasEvaluadas.length === 0 ? (
          <EstadoVacio
            icono={Users}
            titulo="Sin líneas de patrocinio este ciclo"
            mensaje="Aún no tienes frontales directos registrados para calcular la regla de línea estirada."
          />
        ) : (
          <Tabla columnas={columnasLineas} datos={lineasEvaluadas} />
        )}
      </section>

      {/* ESCALA OFICIAL DE RANGOS */}
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
