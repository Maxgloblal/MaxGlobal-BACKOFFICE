import React, { useState, useEffect } from 'react';
import {
  obtenerConfiguracionPlan,
  actualizarParametroConfig,
  guardarRangoConfig
} from '../servicios/operacionAdmin';
import { formatearSoles } from '../utilidades/dinero';
import { Boton } from '../piezas';
import {
  Settings,
  Lock,
  AlertTriangle,
  CheckCircle,
  Save,
  ShieldCheck,
  Award,
  Layers,
  RefreshCw
} from 'lucide-react';

/**
 * P-26 · Configuración del Plan de Compensación (Admin)
 * - Muestra los 36 valores de config agrupados
 * - Solo 5 valores ajustables son editables
 * - Muestra las dos alertas amarillas de ambigüedad
 * - Rangos 1-8 en solo lectura
 * - Rangos 9-16 con formulario editable para cuando Máximo los defina
 */
export default function P26Configuracion() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoRangoId, setGuardandoRangoId] = useState(null);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const [configs, setConfigs] = useState([]);
  const [totalClaves, setTotalClaves] = useState(39);
  const [rangos, setRangos] = useState([]);
  const [valoresEditables, setValoresEditables] = useState({});
  const [rangosEditables, setRangosEditables] = useState({});

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerConfiguracionPlan();
      setConfigs(data.configs || []);
      setTotalClaves(data.totalClaves || 39);
      setRangos(data.rangos || []);

      // Mapear editables de config
      const editMap = {};
      (data.configs || []).forEach(c => {
        if (c.esAjustable) {
          if (c.clave === 'monto_minimo_retiro_cent' || c.clave === 'umbral_detraccion_cent') {
            editMap[c.clave] = (Number(c.valor) / 100).toString();
          } else {
            editMap[c.clave] = c.valor;
          }
        }
      });
      setValoresEditables(editMap);

      // Mapear editables de rangos 9-16
      const rMap = {};
      (data.rangos || []).forEach(r => {
        if (r.id >= 9) {
          rMap[r.id] = {
            nombre: r.nombre || '',
            puntos_grupales: r.puntos_grupales !== null ? r.puntos_grupales.toString() : '',
            frontales_activos: r.frontales_activos !== null ? r.frontales_activos.toString() : '',
            bono_soles: r.bono_cent !== null ? (r.bono_cent / 100).toString() : ''
          };
        }
      });
      setRangosEditables(rMap);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      setError(err.message || 'Error al obtener los parámetros de configuración.');
    } finally {
      setCargando(false);
    }
  }

  const handleGuardarParametro = async (clave) => {
    try {
      setGuardando(true);
      setError(null);
      setMensajeExito(null);

      let valorFinal = valoresEditables[clave];
      if (clave === 'monto_minimo_retiro_cent' || clave === 'umbral_detraccion_cent') {
        valorFinal = (Math.round(Number(valorFinal || 0) * 100)).toString();
      }

      await actualizarParametroConfig(clave, valorFinal);
      setMensajeExito(`Parámetro "${clave}" actualizado correctamente.`);
      setTimeout(() => setMensajeExito(null), 4000);
      await cargarConfiguracion();
    } catch (err) {
      console.error('Error al actualizar parámetro:', err);
      setError(err.message || 'No se pudo guardar el parámetro.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarRango = async (rangoId) => {
    try {
      setGuardandoRangoId(rangoId);
      setError(null);
      setMensajeExito(null);

      const rData = rangosEditables[rangoId];
      if (!rData.nombre || !rData.puntos_grupales || !rData.frontales_activos || !rData.bono_soles) {
        throw new Error('Debes completar todos los campos del rango (nombre, puntos grupales, frontales activos y bono).');
      }

      await guardarRangoConfig(rangoId, {
        nombre: rData.nombre,
        puntos_grupales: Number(rData.puntos_grupales),
        frontales_activos: Number(rData.frontales_activos),
        bono_cent: Math.round(Number(rData.bono_soles) * 100)
      });

      setMensajeExito(`Rango ${rangoId} (${rData.nombre}) guardado y definido exitosamente.`);
      setTimeout(() => setMensajeExito(null), 4000);
      await cargarConfiguracion();
    } catch (err) {
      console.error('Error al guardar rango:', err);
      setError(err.message || 'No se pudo guardar la configuración del rango.');
    } finally {
      setGuardandoRangoId(null);
    }
  };

  if (cargando) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <RefreshCw className="icono-giratorio" size={32} style={{ color: 'var(--gold-500)', marginBottom: 'var(--sp-3)' }} />
          <p className="seccion-desc">Cargando 36 parámetros del plan y escala oficial de rangos...</p>
        </div>
      </div>
    );
  }

  const rangosDefinidos = rangos.filter(r => r.id <= 8);
  const rangosPendientes = rangos.filter(r => r.id >= 9);

  return (
    <div className="pagina-contenedor">
      {/* ENCABEZADO */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-26</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Configuración del Plan</h1>
            <p className="pagina-subtitulo">
              Parámetros maestros del negocio, reglas duras del motor y escala oficial de rangos
            </p>
          </div>
        </div>
      </div>

      {/* MENSAJES DE ESTADO */}
      {mensajeExito && (
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--green-600)', padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-700)' }}>
            <CheckCircle size={20} />
            <strong className="txt-sm">{mensajeExito}</strong>
          </div>
        </div>
      )}

      {error && (
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} className="txt-gold" />
            <strong className="txt-sm txt-gold">{error}</strong>
          </div>
        </div>
      )}

      {/* 🔴 LAS DOS ALERTAS AMARILLAS DE AMBIGÜEDAD (REQUERIDAS POR MÁXIMO) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--warning-soft)', padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--alerta)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong className="txt-sm" style={{ color: 'var(--texto-principal)' }}>
                ⚠️ Ambigüedad en fecha de pago:
              </strong>
              <p className="txt-xs" style={{ margin: '4px 0 0 0', color: 'var(--texto-secundario)' }}>
                <code>dia_pago_comisiones = 5</code> (día 5 del mes siguiente) vs <code>dias_hasta_pago = 3</code> (3 días después del cierre). Ambas existen en la base de datos y no pueden ser correctas a la vez. Máximo debe decidir cuál eliminar.
              </p>
            </div>
          </div>
        </div>

        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--warning-soft)', padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--alerta)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong className="txt-sm" style={{ color: 'var(--texto-principal)' }}>
                ⚠️ Claves duplicadas de retiro mínimo:
              </strong>
              <p className="txt-xs" style={{ margin: '4px 0 0 0', color: 'var(--texto-secundario)' }}>
                <code>monto_minimo_retiro_cent = 10,000</code> vs <code>retiro_minimo_cent = 10,000</code>. Ambas claves contienen el mismo valor (S/. 100.00). Una de ellas es redundante en la tabla <code>config</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: PARÁMETROS DEL PLAN (36 CLAVES) */}
      <div className="panel-blanco" style={{ padding: 'var(--sp-6)' }}>
        <div style={{ borderBottom: '2px solid var(--gold-300)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
          <h2 className="txt-lg txt-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} style={{ color: 'var(--gold-500)' }} />
            Parámetros del Sistema ({configs.length} de {totalClaves} Claves de Configuración)
          </h2>
          <span className="txt-xs txt-muted">
            {configs.length} de {totalClaves} · 1 clave interna no editable (<code>codigos_banco_cci</code>). Solo los parámetros operativos son ajustables. Las reglas de negocio duras se encuentran protegidas en modo solo lectura.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-4)' }}>
          {configs.map((c) => (
            <div
              key={c.clave}
              style={{
                border: '1px solid var(--borde)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--sp-3)',
                backgroundColor: c.esAjustable ? 'var(--fondo-blanco)' : 'var(--fondo-suave)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <code style={{ fontSize: '13px', fontWeight: 'bold', color: c.esAjustable ? 'var(--gold-700)' : 'var(--texto-principal)' }}>
                    {c.clave}
                  </code>
                  {c.esAjustable ? (
                    <span className="badge badge-oro" style={{ fontSize: '10px' }}>Ajustable</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--texto-muted)' }}>
                      <Lock size={12} /> Regla Dura
                    </span>
                  )}
                </div>
                <p className="txt-xs txt-muted" style={{ margin: '0 0 var(--sp-2) 0' }}>
                  {c.descripcion}
                </p>
              </div>

              {c.esAjustable ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--sp-2)' }}>
                  <input
                    type="text"
                    className="campo-input"
                    value={valoresEditables[c.clave] || ''}
                    onChange={(e) => setValoresEditables({ ...valoresEditables, [c.clave]: e.target.value })}
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                  />
                  <Boton
                    variante="primario"
                    disabled={guardando}
                    onClick={() => handleGuardarParametro(c.clave)}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Save size={14} /> Guardar
                  </Boton>
                </div>
              ) : (
                <div style={{ marginTop: 'var(--sp-2)', padding: '6px 8px', backgroundColor: 'var(--fondo-blanco)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--borde-suave)' }}>
                  <span className="txt-xs txt-bold" style={{ color: 'var(--texto-principal)' }}>
                    Valor actual: <code>{c.valor}</code>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: ESCALA OFICIAL DE RANGOS */}
      <div className="panel-blanco" style={{ padding: 'var(--sp-6)' }}>
        <div style={{ borderBottom: '2px solid var(--gold-300)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
          <h2 className="txt-lg txt-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: 'var(--gold-500)' }} />
            Escala Oficial de Rangos (1 al 16)
          </h2>
          <span className="txt-xs txt-muted">
            Rangos 1 al 8 consolidados en el contrato del plan. Rangos 9 al 16 editables para cuando la empresa publique los requisitos.
          </span>
        </div>

        {/* RANGOS 1 AL 8: SOLO LECTURA */}
        <h3 className="seccion-titulo" style={{ fontSize: '15px', marginBottom: 'var(--sp-3)' }}>
          Rangos 1 al 8 · Calificaciones Oficiales Activas (Solo Lectura)
        </h3>
        <div style={{ overflowX: 'auto', marginBottom: 'var(--sp-6)' }}>
          <table className="tabla-limpia" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--borde)' }}>
                <th style={{ padding: '8px' }}>#</th>
                <th style={{ padding: '8px' }}>Rango</th>
                <th style={{ padding: '8px' }}>Puntos Grupales</th>
                <th style={{ padding: '8px' }}>Frontales Activos</th>
                <th style={{ padding: '8px' }}>Bono Mensual</th>
                <th style={{ padding: '8px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rangosDefinidos.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                  <td style={{ padding: '8px' }}><strong>{r.id}</strong></td>
                  <td style={{ padding: '8px' }}><strong className="txt-gold">{r.nombre}</strong></td>
                  <td style={{ padding: '8px' }}>{r.puntos_grupales?.toLocaleString()} pts</td>
                  <td style={{ padding: '8px' }}>{r.frontales_activos} frontales</td>
                  <td style={{ padding: '8px' }}><strong>{formatearSoles(r.bono_cent)}</strong></td>
                  <td style={{ padding: '8px' }}>
                    <span className="badge badge-activo" style={{ fontSize: '11px' }}>
                      <Lock size={10} style={{ marginRight: '4px' }} /> Definido
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RANGOS 9 AL 16: FORMULARIOS EDITABLES */}
        <h3 className="seccion-titulo" style={{ fontSize: '15px', marginBottom: 'var(--sp-3)' }}>
          Rangos 9 al 16 · Formularios para Nuevas Calificaciones (RF-414, RF-415)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-4)' }}>
          {rangosPendientes.map((r) => {
            const rData = rangosEditables[r.id] || { nombre: '', puntos_grupales: '', frontales_activos: '', bono_soles: '' };
            const isSaving = guardandoRangoId === r.id;

            return (
              <div
                key={r.id}
                style={{
                  border: r.definido ? '1px solid var(--gold-300)' : '1px dashed var(--borde)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--sp-4)',
                  backgroundColor: r.definido ? 'var(--fondo-blanco)' : 'var(--fondo-suave)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                  <span className="txt-bold" style={{ color: r.definido ? 'var(--gold-700)' : 'var(--texto-secundario)' }}>
                    Rango #{r.id} · {r.nombre}
                  </span>
                  <span className={r.definido ? 'badge badge-activo' : 'badge badge-inactivo'} style={{ fontSize: '10px' }}>
                    {r.definido ? 'Definido' : 'Pendiente'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', fontSize: '12px' }}>
                  <div>
                    <label className="txt-xs txt-muted">Nombre del Rango:</label>
                    <input
                      type="text"
                      className="campo-input"
                      value={rData.nombre}
                      onChange={(e) => setRangosEditables({
                        ...rangosEditables,
                        [r.id]: { ...rData, nombre: e.target.value }
                      })}
                      style={{ fontSize: '12px', padding: '6px 8px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label className="txt-xs txt-muted">Puntos Grupales:</label>
                      <input
                        type="number"
                        placeholder="Ej. 120000"
                        className="campo-input"
                        value={rData.puntos_grupales}
                        onChange={(e) => setRangosEditables({
                          ...rangosEditables,
                          [r.id]: { ...rData, puntos_grupales: e.target.value }
                        })}
                        style={{ fontSize: '12px', padding: '6px 8px' }}
                      />
                    </div>

                    <div>
                      <label className="txt-xs txt-muted">Frontales Activos:</label>
                      <input
                        type="number"
                        placeholder="Ej. 8"
                        className="campo-input"
                        value={rData.frontales_activos}
                        onChange={(e) => setRangosEditables({
                          ...rangosEditables,
                          [r.id]: { ...rData, frontales_activos: e.target.value }
                        })}
                        style={{ fontSize: '12px', padding: '6px 8px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="txt-xs txt-muted">Bono Mensual (S/.):</label>
                    <input
                      type="number"
                      placeholder="Ej. 20000"
                      className="campo-input"
                      value={rData.bono_soles}
                      onChange={(e) => setRangosEditables({
                        ...rangosEditables,
                        [r.id]: { ...rData, bono_soles: e.target.value }
                      })}
                      style={{ fontSize: '12px', padding: '6px 8px' }}
                    />
                  </div>

                  <div style={{ marginTop: 'var(--sp-2)', display: 'flex', justifyContent: 'flex-end' }}>
                    <Boton
                      variante="primario"
                      disabled={isSaving}
                      onClick={() => handleGuardarRango(r.id)}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      {isSaving ? <RefreshCw className="icono-giratorio" size={12} /> : <Save size={12} />}
                      Guardar Rango
                    </Boton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
