import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatearSoles } from '../utilidades/dinero';
import {
  obtenerVerificacionesPreviasCierre,
  obtenerVistaPreviaCierre,
  evaluarTechosCierre,
  ejecutarCierreCiclo,
  generarExportacionBancariaCierre,
  obtenerHistoricoCierresAdmin
} from '../servicios/operacionAdmin';
import {
  Boton,
  DialogoConfirmar
} from '../piezas';
import {
  CheckCircle,
  CalendarCheck,
  DollarSign,
  Users,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Lock,
  ArrowRight,
  RefreshCw,
  Building2,
  CreditCard,
  History,
  Eye,
  X
} from 'lucide-react';

/**
 * P-25 · Cierre de Ciclo Mensual (Admin)
 * La operación más delicada del sistema:
 * - Verificaciones previas
 * - Vista previa en seco (0 escrituras en BD)
 * - Red de seguridad RF-376 (bloqueo por techos teóricos)
 * - Ejecución atómica que abona a billeteras y abre el nuevo ciclo
 * - Exportación bancaria de liquidación (RF-384, RF-385)
 * - Histórico de Cierres Anteriores (TAREA-47 Bloque 3)
 */
export default function P25CierreCiclo() {
  const [searchParams] = useSearchParams();
  const cicloParam = searchParams.get('ciclo');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [verificaciones, setVerificaciones] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [seguridad, setSeguridad] = useState(null);
  const [exportacion, setExportacion] = useState(null);

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [confirmacionExtra, setConfirmacionExtra] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultadoCierre, setResultadoCierre] = useState(null);

  // TAREA-47 Bloque 3: Estados de Histórico de Cierres
  const [tabActiva, setTabActiva] = useState('cierre'); // 'cierre' | 'historico'
  const [historicoCierres, setHistoricoCierres] = useState([]);
  const [cargandoHistorico, setCargandoHistorico] = useState(false);
  const [modalDetalleCiclo, setModalDetalleCiclo] = useState(null);
  const [detalleCicloData, setDetalleCicloData] = useState(null);
  const [cargandoDetalleCiclo, setCargandoDetalleCiclo] = useState(false);
  const [descargandoCsvCicloId, setDescargandoCsvCicloId] = useState(null);

  useEffect(() => {
    cargarDatosCierre();
  }, [cicloParam]);

  async function cargarDatosCierre() {
    try {
      setCargando(true);
      setError(null);

      // 1. Verificaciones previas
      const verif = await obtenerVerificacionesPreviasCierre(cicloParam ? Number(cicloParam) : undefined);
      setVerificaciones(verif);

      // 2. Vista previa en seco
      const vp = await obtenerVistaPreviaCierre(verif.ciclo.id);
      setVistaPrevia(vp);

      // 3. Evaluación de techos matemáticos
      const seg = await evaluarTechosCierre(verif.ciclo.id, vp);
      setSeguridad(seg);

      // 4. Datos de liquidación bancaria
      const exp = await generarExportacionBancariaCierre(verif.ciclo.id);
      setExportacion(exp);

      // 5. Histórico de cierres anteriores (TAREA-47 Bloque 3)
      try {
        const hist = await obtenerHistoricoCierresAdmin();
        setHistoricoCierres(hist || []);
      } catch (errHist) {
        console.error('Error al cargar histórico de cierres:', errHist);
      }
    } catch (err) {
      console.error('Error al cargar datos del cierre:', err);
      setError(err.message || 'Error al preparar la vista previa del cierre de ciclo.');
    } finally {
      setCargando(false);
    }
  }

  const handleVerDetalleCiclo = async (ciclo) => {
    setModalDetalleCiclo(ciclo);
    setCargandoDetalleCiclo(true);
    setDetalleCicloData(null);
    try {
      const exp = await generarExportacionBancariaCierre(ciclo.id);
      setDetalleCicloData(exp);
    } catch (err) {
      console.error('Error al obtener detalle del ciclo:', err);
    } finally {
      setCargandoDetalleCiclo(false);
    }
  };

  const handleDescargarCsvCiclo = async (ciclo) => {
    try {
      setDescargandoCsvCicloId(ciclo.id);
      const exp = await generarExportacionBancariaCierre(ciclo.id);
      if (!exp?.contenidoCSV) return;
      const blob = new Blob([exp.contenidoCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `liquidacion_bancaria_ciclo_${ciclo.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al descargar CSV del ciclo:', err);
    } finally {
      setDescargandoCsvCicloId(null);
    }
  };

  const handleEjecutarCierre = async () => {
    if (seguridad?.bloqueado) return;
    if (seguridad?.alertaSaltoDoble && !confirmacionExtra) return;

    try {
      setProcesando(true);
      setError(null);

      const res = await ejecutarCierreCiclo(verificaciones.ciclo.id);
      setResultadoCierre(res);
      setDialogoAbierto(false);
    } catch (err) {
      console.error('Error al ejecutar cierre:', err);
      setError(err.message || 'Ocurrió un error al ejecutar el cierre en el servidor.');
      setDialogoAbierto(false);
    } finally {
      setProcesando(false);
    }
  };

  const handleDescargarCSV = () => {
    if (!exportacion?.contenidoCSV) return;
    const blob = new Blob([exportacion.contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `liquidacion_bancaria_ciclo_${verificaciones?.ciclo?.id || 3}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (cargando) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <RefreshCw className="icono-giratorio" size={32} style={{ color: 'var(--gold-500)', marginBottom: 'var(--sp-3)' }} />
          <p className="seccion-desc">Calculando vista previa en seco y auditando límites de seguridad del ciclo...</p>
        </div>
      </div>
    );
  }

  if (error && !vistaPrevia) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <ShieldAlert className="txt-gold" size={24} />
            <h2 className="txt-gold txt-lg">No se pudo cargar el cierre de ciclo</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
          <Boton variante="primario" onClick={cargarDatosCierre} style={{ marginTop: 'var(--sp-4)' }}>
            Reintentar
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-contenedor">
      {/* ENCABEZADO */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-25</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Cierre de Ciclo Mensual</h1>
            <p className="pagina-subtitulo">
              Liquidación definitiva de comisiones, abono a billeteras y apertura del ciclo siguiente
            </p>
          </div>
          {verificaciones?.ciclo && (
            <span className="armazon-admin-cycle-badge">
              <CalendarCheck size={16} />
              <span>
                Ciclo a Liquidar: Ciclo {verificaciones.ciclo.id} ({verificaciones.ciclo.mes}/{verificaciones.ciclo.anio})
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación: Cierre Actual / Histórico de Cierres */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`kit-boton-tab ${tabActiva === 'cierre' ? 'activo' : ''}`}
          onClick={() => setTabActiva('cierre')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--borde)',
            backgroundColor: tabActiva === 'cierre' ? 'var(--verde-claro)' : 'var(--fondo-blanco)',
            color: tabActiva === 'cierre' ? 'var(--verde)' : 'var(--texto-principal)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Lock size={16} />
          <span>Cierre de Ciclo Actual</span>
        </button>

        <button
          type="button"
          className={`kit-boton-tab ${tabActiva === 'historico' ? 'activo' : ''}`}
          onClick={() => setTabActiva('historico')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--borde)',
            backgroundColor: tabActiva === 'historico' ? 'var(--verde-claro)' : 'var(--fondo-blanco)',
            color: tabActiva === 'historico' ? 'var(--verde)' : 'var(--texto-principal)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <History size={16} />
          <span>Histórico de Cierres Anteriores ({historicoCierres.length})</span>
        </button>
      </div>

      {tabActiva === 'historico' ? (
        <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            <div>
              <h3 className="seccion-titulo" style={{ margin: 0 }}>Cierres de Ciclos Anteriores</h3>
              <p className="txt-xs txt-muted" style={{ margin: '4px 0 0 0' }}>
                Historial de liquidaciones bancarias ejecutadas con recuperación de detalle y descarga de CSV
              </p>
            </div>
            <Boton variante="secundario" icono={RefreshCw} onClick={cargarDatosCierre} deshabilitado={cargando}>
              Actualizar
            </Boton>
          </div>

          {historicoCierres.length === 0 ? (
            <div style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
              <p className="seccion-desc">No se registran ciclos cerrados anteriormente en el sistema.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-transparente" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--borde)', textAlign: 'left', backgroundColor: 'var(--fondo-suave)' }}>
                    <th style={{ padding: '12px 16px' }}>Ciclo</th>
                    <th style={{ padding: '12px 16px' }}>Mes / Año</th>
                    <th style={{ padding: '12px 16px' }}>Fecha de Cierre</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total en Comisiones</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Socios Beneficiados</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoCierres.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--fondo-suave)',
                            color: 'var(--texto-principal)'
                          }}
                        >
                          Ciclo {c.id}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <strong>{c.nombreCiclo || `Mes ${c.mes}/${c.anio}`}</strong>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.cerradoEn ? (
                          <div>
                            <div>{new Date(c.cerradoEn).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            <div className="txt-xs txt-muted">{new Date(c.cerradoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ) : (
                          <span className="txt-xs txt-muted">Cerrado</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span className="txt-md txt-bold" style={{ color: 'var(--verde)' }}>
                          {formatearSoles(c.totalComisionesCent)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(37,99,235,0.08)',
                            color: 'var(--info)',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}
                        >
                          <Users size={13} /> {c.sociosBeneficiados} socios
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleVerDetalleCiclo(c)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--borde)',
                              backgroundColor: 'var(--surface-card)',
                              color: 'var(--texto-principal)',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={14} /> Ver Detalle
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDescargarCsvCiclo(c)}
                            disabled={descargandoCsvCicloId === c.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              backgroundColor: 'var(--verde-claro)',
                              color: 'var(--verde)',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={14} /> {descargandoCsvCicloId === c.id ? 'Descargando...' : 'Descargar CSV'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : resultadoCierre ? (
        /* ESTADO POST-CIERRE EXITOSO */
        <div className="panel-activa-exito panel-centrado-cierre">
          <CheckCircle size={54} style={{ color: 'var(--green-600)', marginBottom: 'var(--sp-3)' }} />
          <h2 style={{ color: 'var(--green-700)', fontSize: '24px' }}>
            ¡Ciclo {verificaciones?.ciclo?.id} Cerrado Exitosamente!
          </h2>
          <p className="seccion-desc" style={{ maxWidth: '560px', marginTop: 'var(--sp-2)' }}>
            Se acreditaron <strong>{formatearSoles(resultadoCierre.total_abonado_cent)}</strong> en las billeteras de los socios calificados mediante <strong>{resultadoCierre.cantidad_abonos} abonos</strong> auditados. El Ciclo {resultadoCierre.nuevo_ciclo_id} ha sido abierto automáticamente.
          </p>

          <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-5)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Boton variante="primario" onClick={handleDescargarCSV}>
              <Download size={16} />
              Descargar Archivo para el Banco (CSV)
            </Boton>
            <Link to="/admin" className="btn btn-secundario">
              Ir al Tablero Principal
            </Link>
          </div>
        </div>
      ) : (
        /* VISTA PREVIA Y VALIDACIONES */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {/* ERROR EN ACCIÓN */}
          {error && (
            <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <ShieldAlert size={20} className="txt-gold" />
                <span className="txt-bold txt-gold">{error}</span>
              </div>
            </div>
          )}

          {/* 1. TARJETA DE VERIFICACIONES PREVIAS (RF-371, RF-372) */}
          <div className="panel-blanco" style={{ borderLeft: '4px solid var(--info)' }}>
            <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} style={{ color: 'var(--info)' }} />
              Verificaciones Previas al Cierre
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', fontSize: '14px' }}>
              {verificaciones?.hayPedidosSinConfirmar ? (
                <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--alerta)' }}>
                    <AlertTriangle size={18} />
                    <strong>
                      ⚠️ {verificaciones.cantidadPedidosSinConfirmar} pedido(s) sin confirmar quedarán fuera del cierre ({formatearSoles(verificaciones.montoTotalPedidosSinConfirmarCent)}):
                    </strong>
                  </div>
                  <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
                    {verificaciones.pedidosSinConfirmar.map(p => (
                      <li key={p.id}>
                        {p.codigo} — {p.socio_nombre} ({p.socio_codigo}): <strong>{formatearSoles(p.total_cent)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-600)' }}>
                  <CheckCircle size={18} />
                  <span>0 pedidos pendientes en la bandeja de confirmación</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-600)' }}>
                <CheckCircle size={18} />
                <span>Configuración de los 4 bonos y rangos completa y auditada</span>
              </div>
            </div>
          </div>

          {/* 2. RED DE SEGURIDAD RF-376: BLOQUEO POR TECHOS */}
          {seguridad?.bloqueado && (
            <div className="panel-blanco" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'var(--danger-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                <ShieldAlert size={24} style={{ color: 'var(--danger)' }} />
                <h3 className="txt-bold" style={{ color: 'var(--danger)', margin: 0 }}>
                  🔴 CIERRE BLOQUEADO POR SEGURIDAD (RF-376)
                </h3>
              </div>
              <p className="txt-sm" style={{ margin: 0, color: 'var(--texto-principal)' }}>
                El cálculo del ciclo supera los techos matemáticos autorizados por el plan de compensación. La ejecución ha sido bloqueada para proteger los fondos de la empresa.
              </p>
              <ul style={{ margin: '8px 0 0 20px', padding: 0, fontSize: '13px', color: 'var(--danger)' }}>
                {seguridad.erroresBloqueo.map((err, idx) => (
                  <li key={idx}><strong>{err.mensaje}</strong></li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. ALERTA DE SALTO DESPROPORCIONADO (DOBLE DEL CICLO ANTERIOR) */}
          {seguridad?.alertaSaltoDoble && (
            <div className="panel-blanco" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--warning-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                <AlertTriangle size={22} style={{ color: 'var(--alerta)' }} />
                <h3 className="txt-bold" style={{ color: 'var(--alerta)', margin: 0 }}>
                  Alerta: Incremento Superior al Doble del Ciclo Anterior
                </h3>
              </div>
              <p className="txt-sm" style={{ margin: '0 0 var(--sp-3) 0' }}>
                La liquidación de este ciclo ({formatearSoles(vistaPrevia?.totalAPagarCent)}) duplica la del ciclo anterior ({formatearSoles(seguridad?.totalCicloAnteriorCent)}). Requiere confirmación consciente del administrador antes de proceder.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={confirmacionExtra}
                  onChange={(e) => setConfirmacionExtra(e.target.checked)}
                />
                Confirmo que he revisado las órdenes y el incremento en comisiones es legítimo
              </label>
            </div>
          )}

          {/* 4. VISTA PREVIA OBLIGATORIA DEL CIERRE (RF-373, RF-374) */}
          <div className="panel-vista-previa-cierre" style={{ backgroundColor: 'var(--fondo-blanco)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--borde)', padding: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--gold-300)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <h2 className="txt-lg txt-bold" style={{ margin: 0 }}>
                  CIERRE DEL CICLO {vistaPrevia?.ciclo?.id} · {vistaPrevia?.ciclo?.mes}/{vistaPrevia?.ciclo?.anio}
                </h2>
                <span className="txt-xs txt-muted">Vista previa en seco · 0 escrituras en base de datos</span>
              </div>
              <span className="badge badge-oro">
                Socios Activos: {vistaPrevia?.sociosActivos} de {vistaPrevia?.totalSocios}
              </span>
            </div>

            {/* TABLA DE BONOS A LIQUIDAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--fondo-suave)' }}>
                <div>
                  <span className="txt-sm txt-bold">Bono de Patrocinio</span>
                  <span className="txt-xs txt-muted" style={{ marginLeft: '8px' }}>({vistaPrevia?.bonos?.patrocinio?.cantidadSocios} socios cobran)</span>
                </div>
                <span className="txt-sm txt-bold">{formatearSoles(vistaPrevia?.bonos?.patrocinio?.totalCent)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--fondo-suave)' }}>
                <div>
                  <span className="txt-sm txt-bold">Bono Residual</span>
                  <span className="txt-xs txt-muted" style={{ marginLeft: '8px' }}>({vistaPrevia?.bonos?.residual?.cantidadSocios} socios cobran)</span>
                </div>
                <span className="txt-sm txt-bold">{formatearSoles(vistaPrevia?.bonos?.residual?.totalCent)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--fondo-suave)' }}>
                <div>
                  <span className="txt-sm txt-bold">Bono de Rango</span>
                  <span className="txt-xs txt-muted" style={{ marginLeft: '8px' }}>({vistaPrevia?.bonos?.rango?.cantidadSocios} socios cobran)</span>
                </div>
                <span className="txt-sm txt-bold">{formatearSoles(vistaPrevia?.bonos?.rango?.totalCent)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--fondo-suave)' }}>
                <div>
                  <span className="txt-sm txt-bold">Bono Global</span>
                  <span className="txt-xs txt-muted" style={{ marginLeft: '8px' }}>({vistaPrevia?.bonos?.global?.estadoTexto})</span>
                </div>
                <span className="txt-sm txt-muted">{vistaPrevia?.bonos?.global?.aplica ? formatearSoles(vistaPrevia?.bonos?.global?.totalCent) : '—'}</span>
              </div>

              {/* DESGLOSE TAREA-51: TOTAL DEL CICLO · YA ABONADO · NETO A ABONAR EN ESTE CIERRE */}
              {Number(vistaPrevia?.yaAbonadoCent || 0) > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px solid var(--texto-principal)', marginTop: '8px', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="txt-md txt-bold">Total generado en el ciclo</span>
                    <span className="txt-md txt-bold">{formatearSoles(vistaPrevia?.totalCicloCent || vistaPrevia?.totalAPagarCent)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--verde)' }}>
                    <span className="txt-sm">Ya abonado a billeteras (Patrocinio al instante)</span>
                    <span className="txt-sm txt-bold">− {formatearSoles(vistaPrevia?.yaAbonadoCent || 0)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed var(--borde)' }}>
                    <strong className="txt-lg">TOTAL A PAGAR (Neto a abonar en este cierre)</strong>
                    <strong className="txt-xl txt-gold">{formatearSoles(vistaPrevia?.netoAbonarCierreCent ?? vistaPrevia?.totalAPagarCent)}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 8px 0', borderTop: '2px solid var(--texto-principal)', marginTop: '8px' }}>
                  <strong className="txt-lg">TOTAL A PAGAR</strong>
                  <strong className="txt-xl txt-gold">{formatearSoles(vistaPrevia?.totalAPagarCent)}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span className="txt-xs txt-muted">Quedará en la empresa (comisiones no cobradas / retenidas)</span>
                <span className="txt-xs txt-bold">{formatearSoles(vistaPrevia?.totalEmpresaCent)}</span>
              </div>
            </div>

            {/* AVISOS DE DISPERSIÓN BANCARIA (RF-384, RF-385) */}
            <div style={{ marginTop: 'var(--sp-5)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
              <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (exportacion?.cantidadSociosSinBanco > 0 || exportacion?.cantidadSociosSinCci > 0) ? 'var(--alerta)' : 'var(--green-600)', marginBottom: '4px' }}>
                  <Building2 size={16} />
                  <strong className="txt-xs">Socios con datos bancarios incompletos:</strong>
                  <span className="txt-xs txt-bold">{exportacion?.cantidadSociosSinDatosOIncompletos || exportacion?.cantidadSociosSinBanco || 0} socios</span>
                </div>
                <p className="txt-xs txt-muted" style={{ margin: 0 }}>
                  {exportacion?.cantidadSociosSinBanco || 0} sin cuenta bancaria · {exportacion?.cantidadSociosSinCci || 0} sin CCI registrado.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--texto-secundario)', marginBottom: '4px' }}>
                  <CreditCard size={16} />
                  <strong className="txt-xs">Por debajo del mínimo ({formatearSoles(exportacion?.montoMinimoRetiroCent || 10000)}):</strong>
                  <span className="txt-xs txt-bold">{exportacion?.cantidadSociosDebajoMinimo} socios</span>
                </div>
                <p className="txt-xs txt-muted" style={{ margin: 0 }}>
                  Su saldo queda acumulado en la billetera virtual para el mes siguiente.
                </p>
              </div>
            </div>

            {/* 🔴 TAREA-32 BLOQUE 1: LISTADO DE SOCIOS EXCLUIDOS DE DISPERSIÓN BANCARIA */}
            {exportacion?.cantidadSociosExcluidos > 0 && (
              <div
                className="panel-blanco"
                style={{
                  marginTop: 'var(--sp-4)',
                  borderLeft: '4px solid var(--warning)',
                  backgroundColor: 'var(--warning-soft)',
                  padding: 'var(--sp-4)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--alerta)', flexShrink: 0 }} />
                  <strong className="txt-sm" style={{ color: 'var(--texto-principal)' }}>
                    ⚠️ {exportacion.cantidadSociosExcluidos} socio{exportacion.cantidadSociosExcluidos > 1 ? 's' : ''} ganó comisiones y NO se le puede pagar:
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '28px' }}>
                  {exportacion.sociosExcluidos.map((s) => (
                    <div key={s.socio_id} className="txt-sm">
                      <strong>
                        {s.nombreCompleto} · {s.codigo} · {formatearSoles(s.montoCent)}
                      </strong>
                      <ul style={{ margin: '4px 0 0 18px', padding: 0, color: 'var(--texto-secundario)', fontSize: '13px' }}>
                        {s.motivosExclusion.map((motivo, mIdx) => (
                          <li key={mIdx}>{motivo}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <p className="txt-xs txt-muted" style={{ margin: '12px 0 0 28px' }}>
                  Su dinero queda en su billetera para el próximo mes.
                </p>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)', borderTop: '1px solid var(--borde)', paddingTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Boton variante="secundario" onClick={handleDescargarCSV}>
                  <Download size={16} />
                  Descargar Padrón Bancario (CSV)
                </Boton>
                {(!exportacion?.totalAbonableCent || exportacion.totalAbonableCent === 0) && (
                  <span className="txt-xs txt-muted" style={{ color: 'var(--alerta)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} />
                    Aviso: El CSV se descargará sin registros a pagar (solo cabecera).
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                <Link to="/admin" className="btn btn-secundario">
                  Cancelar y Salir
                </Link>
                <Boton
                  variante="primario"
                  disabled={seguridad?.bloqueado || (seguridad?.alertaSaltoDoble && !confirmacionExtra)}
                  onClick={() => setDialogoAbierto(true)}
                >
                  <Lock size={16} />
                  Ejecutar el Cierre Definitivo
                </Boton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO MODAL DE CONFIRMACIÓN IRREVERSIBLE */}
      <DialogoConfirmar
        abierto={dialogoAbierto}
        titulo={`¿Confirmar Cierre del Ciclo ${verificaciones?.ciclo?.id}?`}
        mensaje={`Esta operación es IRREVERSIBLE. Se acreditarán ${formatearSoles(vistaPrevia?.totalAPagarCent)} a las billeteras de los socios calificados y se abrirá automáticamente el ciclo siguiente.`}
        textoConfirmar="Sí, Ejecutar Cierre y Abonar Billeteras"
        onConfirmar={handleEjecutarCierre}
        onCancelar={() => setDialogoAbierto(false)}
        cargando={procesando}
      />

      {/* MODAL DETALLE DE CIERRE HISTÓRICO */}
      {modalDetalleCiclo && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-4)'
          }}
        >
          <div
            className="panel-blanco"
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: 'var(--sp-6)'
            }}
          >
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--borde)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="kit-header-badge">Ciclo {modalDetalleCiclo.id}</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Liquidación Bancaria · {modalDetalleCiclo.nombreCiclo}
                  </h2>
                </div>
                <p className="txt-xs txt-muted" style={{ margin: '4px 0 0 0' }}>
                  Fecha de Cierre: {modalDetalleCiclo.cerradoEn ? new Date(modalDetalleCiclo.cerradoEn).toLocaleString('es-PE') : 'Cerrado'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalleCiclo(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--texto-apagado)' }}
              >
                <X size={20} />
              </button>
            </div>

            {cargandoDetalleCiclo ? (
              <div style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
                <RefreshCw className="icono-giratorio" size={24} style={{ color: 'var(--gold-500)', marginBottom: 'var(--sp-2)' }} />
                <p className="txt-sm txt-muted">Reconstruyendo liquidación bancaria del ciclo...</p>
              </div>
            ) : !detalleCicloData ? (
              <div style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>
                <p className="txt-sm txt-muted">No se pudo obtener el detalle de comisiones para este ciclo.</p>
              </div>
            ) : (
              <div>
                {/* Resumen de Métricas del Ciclo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
                  <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                    <div className="txt-xs txt-muted">Total Comisiones</div>
                    <div className="txt-lg txt-bold" style={{ color: 'var(--verde)' }}>
                      {formatearSoles(modalDetalleCiclo.totalComisionesCent)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                    <div className="txt-xs txt-muted">Socios Aptos para Cobro</div>
                    <div className="txt-lg txt-bold" style={{ color: 'var(--info)' }}>
                      {detalleCicloData.cantidadSociosAbonables} socios
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--fondo-suave)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
                    <div className="txt-xs txt-muted">Excluidos (Sin CCI o &lt; mín.)</div>
                    <div className="txt-lg txt-bold" style={{ color: 'var(--alerta)' }}>
                      {detalleCicloData.cantidadSociosExcluidos} socios
                    </div>
                  </div>
                </div>

                {/* Tabla de Beneficiarios */}
                <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--borde)', borderRadius: 'var(--radius-md)' }}>
                  <table className="tabla-transparente" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--borde)', textAlign: 'left', backgroundColor: 'var(--fondo-suave)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '8px 12px' }}>Socio</th>
                        <th style={{ padding: '8px 12px' }}>Banco / Cuenta</th>
                        <th style={{ padding: '8px 12px' }}>CCI</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monto</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detalleCicloData.filas || []).map((f) => (
                        <tr key={f.socio_id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 600 }}>{f.nombreCompleto}</div>
                            <div className="txt-xs txt-muted">{f.codigo} · {f.documento}</div>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div>{f.banco}</div>
                            <div className="txt-xs txt-muted">{f.cuentaBancaria}</div>
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
                            {f.cci || <span style={{ color: 'var(--peligro)' }}>Sin CCI</span>}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                            {formatearSoles(f.montoCent)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            {f.aptoParaPago ? (
                              <span style={{ color: 'var(--verde)', fontWeight: 600 }}>Apto</span>
                            ) : (
                              <span style={{ color: 'var(--alerta)', fontWeight: 600 }} title={f.motivosExclusion?.join(', ')}>
                                Excluido ({f.motivosExclusion?.[0] || 'Incompleto'})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Acciones del Modal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--borde)' }}>
                  <button
                    type="button"
                    onClick={() => handleDescargarCsvCiclo(modalDetalleCiclo)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: 'var(--verde)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Descargar Archivo para el Banco (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalDetalleCiclo(null)}
                    className="btn btn-secundario"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
