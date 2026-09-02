import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, Tabla, InsigniaEstado, Boton } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerCiclos,
  obtenerDesgloseComisiones
} from '../servicios/socio';
import {
  Coins,
  DollarSign,
  Award,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

/**
 * P-14 · Mis Comisiones
 * Muestra el historial mensual, desglose por tipo de bono y la explicación de niveles no pagados.
 */
export default function P14MisComisiones() {
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(3);
  const [socio, setSocio] = useState(null);
  const [desglose, setDesglose] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'residual' | 'patrocinio' | 'rango'
  const [ordenDesplegada, setOrdenDesplegada] = useState(null);

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
        const cicloId = cicloSeleccionado || listaCiclos.find((c) => c.estado === 'abierto')?.id || listaCiclos[0]?.id || 3;
        const datos = await obtenerDesgloseComisiones(perfil.id, cicloId);
        if (!cancelado) {
          setDesglose(datos);
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar comisiones');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, [cicloSeleccionado]);

  if (cargando && !desglose) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando desglose de comisiones...</p>
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
            <h2 className="txt-gold txt-lg">No se pudieron cargar las comisiones</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const resumen = desglose?.resumen || {};
  const items = desglose?.items || [];

  const itemsFiltrados = items.filter((it) => {
    if (filtroTipo === 'todos') return true;
    return it.tipo_bono === filtroTipo;
  });

  const columnasComisiones = [
    {
      key: 'nivel',
      label: 'Nivel',
      render: (f) => (f.nivel ? `Nivel ${f.nivel}` : 'Bono Global')
    },
    {
      key: 'tipo_bono',
      label: 'Tipo',
      render: (f) => (
        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
          {f.tipo_bono}
        </span>
      )
    },
    {
      key: 'generador_nombre',
      label: 'De quién',
      render: (f) => (
        <div>
          <div className="txt-bold">{f.generador_nombre || 'Empresa Max Global'}</div>
          {f.generador_codigo && (
            <div className="txt-xs txt-muted">{f.generador_codigo}</div>
          )}
        </div>
      )
    },
    {
      key: 'base_puntos',
      label: 'Puntos / Base',
      render: (f) =>
        f.base_puntos ? `${f.base_puntos} pts` : f.base_cent ? formatearSoles(f.base_cent) : '—'
    },
    {
      key: 'porcentaje',
      label: '%',
      render: (f) => (f.porcentaje ? `${Number(f.porcentaje).toFixed(1)}%` : '—')
    },
    {
      key: 'monto_cent',
      label: 'Ganaste',
      render: (f) => (
        <span className={f.pagado ? 'txt-bold' : 'txt-muted'}>
          {formatearSoles(f.monto_cent)}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado / Explicación',
      render: (f) => (
        <div>
          {f.pagado ? (
            <InsigniaEstado estadoTipo="activo" textoPersonalizado="Pagado" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <InsigniaEstado estadoTipo="inactivo" textoPersonalizado="No Cobrado" />
              <span className="txt-xs txt-muted" style={{ maxWidth: '280px', lineHeight: 1.2 }}>
                {f.motivo}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Detalle',
      render: (f) =>
        f.orden_id ? (
          <button
            type="button"
            className="btn-link"
            style={{ fontSize: 'var(--txt-xs)', display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--oro)' }}
            onClick={() => setOrdenDesplegada(ordenDesplegada === f.orden_id ? null : f.orden_id)}
          >
            {f.orden_codigo || `Orden #${f.orden_id}`}
            {ordenDesplegada === f.orden_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : null
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
            <p className="pagina-subtitulo">
              Historial y desglose auditado por ciclo mensual
            </p>
          </div>

          {/* Selector de Ciclo (RF-240) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <label htmlFor="select-ciclo" className="txt-sm txt-bold">
              Ciclo:
            </label>
            <select
              id="select-ciclo"
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

      {/* CASO: SOCIO INACTIVO O TOTAL EN CERO (RF-244 / RF-245) */}
      {!resumen.activo && (
        <div className="panel-explicacion-cero" style={{ marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertCircle size={22} className="txt-gold" />
            <h3 className="txt-gold">No calificaste para cobro de comisiones este ciclo</h3>
          </div>
          <p className="seccion-desc txt-strong txt-bold" style={{ marginTop: 'var(--sp-1)' }}>
            Acumulaste {resumen.puntos_personales || 0} de los 70 puntos mínimos requeridos de activación mensual.
          </p>
          <div className="box-alerta-info" style={{ marginTop: 'var(--sp-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-1)' }}>
              <Info size={18} style={{ color: 'var(--info)' }} />
              <span className="txt-bold txt-xs">Regla de Negocio (Sin Compresión)</span>
            </div>
            <p className="seccion-desc">
              Las comisiones generadas por tu equipo durante este ciclo no se pagaron y quedan retenidas por la empresa según las reglas oficiales del Plan Max Global.
            </p>
          </div>
        </div>
      )}

      {/* Tarjetas de Resumen por Tipo de Bono (RF-241 / RF-246) */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Total del Ciclo"
          valor={formatearSoles(resumen.total_cobrado_cent || 0)}
          subrotulo={resumen.activo ? 'Liquidado para abono a billetera' : 'Ciclo no calificado (0 pts)'}
          icono={Coins}
          variante={resumen.total_cobrado_cent > 0 ? 'verde' : 'default'}
        />
        <TarjetaDato
          rotulo="Bono Patrocinio"
          valor={formatearSoles(resumen.total_patrocinio_cent || 0)}
          subrotulo="Afiliaciones en tu red"
          icono={DollarSign}
        />
        <TarjetaDato
          rotulo="Bono Residual"
          valor={formatearSoles(resumen.total_residual_cent || 0)}
          subrotulo="Recompras de equipo"
          icono={Coins}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Bono de Rango"
          valor={formatearSoles(resumen.total_rango_cent || 0)}
          subrotulo="Por calificación de rango"
          icono={Award}
        />
      </div>

      {/* Filtros por tipo de bono */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        {[
          { id: 'todos', label: `Todos (${items.length})` },
          { id: 'residual', label: 'Residual' },
          { id: 'patrocinio', label: 'Patrocinio' },
          { id: 'rango', label: 'Rango' }
        ].map((f) => (
          <Boton
            key={f.id}
            variante={filtroTipo === f.id ? 'primario' : 'secundario'}
            className="btn-compacto"
            onClick={() => setFiltroTipo(f.id)}
          >
            {f.label}
          </Boton>
        ))}
      </div>

      {/* TABLA DE DETALLE DE COMISIONES Y DESGLOSE EXPLICATIVO (RF-242 a RF-245) */}
      <section className="pagina-seccion">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <h2 className="seccion-titulo">Detalle y Transparencia de Liquidación</h2>
          <span className="seccion-desc">
            Tu pack actual: <strong style={{ color: 'var(--oro)' }}>{resumen.pack_nombre}</strong> (Patrocinio: Niv. {resumen.niveles_patrocinio} · Residual: Niv. {resumen.niveles_residual})
          </span>
        </div>

        {itemsFiltrados.length === 0 ? (
          <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
            <p className="seccion-desc">No se registraron movimientos para el filtro seleccionado.</p>
          </div>
        ) : (
          <Tabla columnas={columnasComisiones} datos={itemsFiltrados} />
        )}

        <div className="box-alerta-inactivos" style={{ marginTop: 'var(--sp-4)' }}>
          <HelpCircle size={18} className="txt-gold" style={{ flexShrink: 0 }} />
          <span className="txt-xs txt-gold">
            Transparencia total: Max Global muestra todos los niveles generados en tu organización. Los niveles que no habilitó tu pack o por falta de activación no se pagan ni se comprimen.
          </span>
        </div>
      </section>
    </div>
  );
}
