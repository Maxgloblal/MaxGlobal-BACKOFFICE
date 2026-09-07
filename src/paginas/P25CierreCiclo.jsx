import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatearSoles } from '../utilidades/dinero';
import {
  obtenerVerificacionesPreviasCierre,
  obtenerVistaPreviaCierre,
  evaluarTechosCierre,
  ejecutarCierreCiclo,
  generarExportacionBancariaCierre
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
  CreditCard
} from 'lucide-react';

/**
 * P-25 · Cierre de Ciclo Mensual (Admin)
 * La operación más delicada del sistema:
 * - Verificaciones previas
 * - Vista previa en seco (0 escrituras en BD)
 * - Red de seguridad RF-376 (bloqueo por techos teóricos)
 * - Ejecución atómica que abona a billeteras y abre el nuevo ciclo
 * - Exportación bancaria de liquidación (RF-384, RF-385)
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
    } catch (err) {
      console.error('Error al cargar datos del cierre:', err);
      setError(err.message || 'Error al preparar la vista previa del cierre de ciclo.');
    } finally {
      setCargando(false);
    }
  }

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

      {resultadoCierre ? (
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

              {/* TOTAL A PAGAR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 8px 0', borderTop: '2px solid var(--texto-principal)', marginTop: '8px' }}>
                <strong className="txt-lg">TOTAL A PAGAR</strong>
                <strong className="txt-xl txt-gold">{formatearSoles(vistaPrevia?.totalAPagarCent)}</strong>
              </div>

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

            {/* BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)', borderTop: '1px solid var(--borde)', paddingTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <Boton variante="secundario" onClick={handleDescargarCSV}>
                <Download size={16} />
                Descargar Padrón Bancario (CSV)
              </Boton>

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
    </div>
  );
}
