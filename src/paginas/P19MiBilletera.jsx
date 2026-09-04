import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, Tabla, InsigniaEstado, Boton, DialogoConfirmar } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerCiclos,
  obtenerMiBilletera,
  solicitarRetiro
} from '../servicios/socio';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  DollarSign,
  Building2,
  Calendar
} from 'lucide-react';

/**
 * P-19 · Mi Billetera
 * Muestra el saldo disponible (0 antes de cierre), comisiones estimadas, e historial de transferencias y solicitudes.
 */
export default function P19MiBilletera() {
  const [socio, setSocio] = useState(null);
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(3);
  const [billetera, setBilletera] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Formulario de Retiro
  const [mostrarModalRetiro, setMostrarModalRetiro] = useState(false);
  const [montoRetiro, setMontoRetiro] = useState('');
  const [banco, setBanco] = useState('BCP');
  const [cuenta, setCuenta] = useState('');
  const [mensajeRetiro, setMensajeRetiro] = useState(null);
  const [enviandoRetiro, setEnviandoRetiro] = useState(false);

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
        const datos = await obtenerMiBilletera(perfil.id, cicloId);
        if (!cancelado) {
          setBilletera(datos);
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar billetera');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, [cicloSeleccionado]);

  async function handleSolicitarRetiro(e) {
    e.preventDefault();
    setMensajeRetiro(null);

    const montoNum = parseFloat(montoRetiro);
    if (isNaN(montoNum) || montoNum <= 0) {
      setMensajeRetiro({ tipo: 'error', texto: 'Ingresa un monto válido para retirar.' });
      return;
    }

    const montoCent = Math.round(montoNum * 100);
    const minCent = billetera?.montoMinimoRetiroCent || 10000;

    if (montoCent < minCent) {
      setMensajeRetiro({
        tipo: 'error',
        texto: `El monto mínimo de retiro es ${formatearSoles(minCent)}. Te faltan ${formatearSoles(minCent - montoCent)}.`
      });
      return;
    }

    if (montoCent > (billetera?.saldoDisponibleCent || 0)) {
      setMensajeRetiro({
        tipo: 'error',
        texto: `Saldo disponible insuficiente (${formatearSoles(billetera?.saldoDisponibleCent || 0)}).`
      });
      return;
    }

    try {
      setEnviandoRetiro(true);
      await solicitarRetiro({
        socioId: socio.id,
        montoCent,
        banco,
        cuenta
      });
      setMensajeRetiro({
        tipo: 'exito',
        texto: 'Solicitud de retiro registrada exitosamente. Será procesada por Administración.'
      });
      // Recargar datos
      const datosActualizados = await obtenerMiBilletera(socio.id, cicloSeleccionado);
      setBilletera(datosActualizados);
      setTimeout(() => {
        setMostrarModalRetiro(false);
        setMensajeRetiro(null);
        setMontoRetiro('');
        setCuenta('');
      }, 2000);
    } catch (err) {
      setMensajeRetiro({ tipo: 'error', texto: err.message || 'Error al enviar solicitud.' });
    } finally {
      setEnviandoRetiro(false);
    }
  }

  if (cargando && !billetera) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando estado de billetera...</p>
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
            <h2 className="txt-gold txt-lg">Error en Billetera</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const saldoDisponibleCent = billetera?.saldoDisponibleCent || 0;
  const estimadoCicloCent = billetera?.estimadoCicloCent || 0;
  const minRetiroCent = billetera?.montoMinimoRetiroCent || 10000;
  const movimientos = billetera?.movimientos || [];
  const solicitudes = billetera?.solicitudes || [];

  const columnasMovimientos = [
    {
      key: 'creado_en',
      label: 'Fecha',
      render: (m) => new Date(m.creado_en).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    {
      key: 'concepto',
      label: 'Concepto / Detalle',
      render: (m) => <span className="txt-bold">{m.concepto || m.tipo}</span>
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (m) => (
        <InsigniaEstado
          estadoTipo={m.monto_cent >= 0 ? 'activo' : 'inactivo'}
          textoPersonalizado={m.monto_cent >= 0 ? 'Crédito (+)' : 'Débito (-)'}
        />
      )
    },
    {
      key: 'monto_cent',
      label: 'Monto',
      render: (m) => (
        <span className={m.monto_cent >= 0 ? 'txt-bold' : 'txt-muted'} style={{ color: m.monto_cent >= 0 ? 'var(--verde)' : 'inherit' }}>
          {formatearSoles(m.monto_cent)}
        </span>
      )
    },
    {
      key: 'saldo_despues_cent',
      label: 'Saldo Posterior',
      render: (m) => formatearSoles(m.saldo_despues_cent || 0)
    }
  ];

  const columnasSolicitudes = [
    {
      key: 'solicitado_en',
      label: 'Fecha Solicitud',
      render: (s) => new Date(s.solicitado_en).toLocaleDateString('es-PE')
    },
    {
      key: 'banco',
      label: 'Banco / Destino',
      render: (s) => `${s.banco} · Cta: ${s.cuenta || ''}`
    },
    {
      key: 'monto_cent',
      label: 'Monto Solicitado',
      render: (s) => <span className="txt-bold">{formatearSoles(s.monto_cent)}</span>
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (s) => (
        <InsigniaEstado
          estadoTipo={s.estado === 'aprobada' ? 'activo' : s.estado === 'rechazada' ? 'inactivo' : 'pendiente'}
          textoPersonalizado={s.estado === 'aprobada' ? 'Transferido' : s.estado === 'rechazada' ? 'Rechazado' : 'En Revisión'}
        />
      )
    }
  ];

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Backoffice Socio · P-19</span>
            <h1 className="pagina-titulo">Mi Billetera</h1>
            <p className="pagina-subtitulo">
              Saldo líquido disponible, retiros bancarios y estimación de comisiones
            </p>
          </div>

          <Boton
            variante="primario"
            icono={ArrowUpRight}
            onClick={() => setMostrarModalRetiro(true)}
            deshabilitado={saldoDisponibleCent < minRetiroCent}
          >
            Solicitar Retiro
          </Boton>
        </div>
      </div>

      {/* Tarjetas de Resumen Billetera (RF-290 a RF-292) */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Saldo Disponible"
          valor={formatearSoles(saldoDisponibleCent)}
          subrotulo="Disponible para retiro bancario inmediato"
          icono={Wallet}
          variante={saldoDisponibleCent > 0 ? 'verde' : 'default'}
        />
        <TarjetaDato
          rotulo="Comisión Estimada del Ciclo"
          valor={formatearSoles(estimadoCicloCent)}
          subrotulo="En acumulación · Se abona 3 días post cierre contable"
          icono={Clock}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Monto Mínimo de Retiro"
          valor={formatearSoles(minRetiroCent)}
          subrotulo="Establecido en la política contable oficial"
          icono={DollarSign}
        />
      </div>

      {/* AVISO DE CLARIDAD: ESTIMADO VS SALDO DISPONIBLE (RF-290 a RF-292) */}
      <div className="box-alerta-info" style={{ marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
          <Info size={18} style={{ color: 'var(--info)' }} />
          <span className="txt-bold txt-xs">Política de Abono y Liquidación Contable</span>
        </div>
        <p className="seccion-desc">
          Las comisiones generadas durante el ciclo en curso se muestran como <strong>Comisión Estimada ({formatearSoles(estimadoCicloCent)})</strong>. El abono efectivo a tu <strong>Saldo Disponible</strong> ocurre automáticamente al cierre contable del mes, tras la validación final de auditoría.
        </p>
      </div>

      {/* TABLA DE SOLICITUDES DE RETIRO (RF-293) */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <h2 className="seccion-titulo">Mis Solicitudes de Retiro</h2>
          <span className="seccion-desc">Aprobación administrativa y abono a cuenta bancaria</span>
        </div>

        {solicitudes.length === 0 ? (
          <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
            <p className="seccion-desc">No has registrado solicitudes de retiro pendientes.</p>
          </div>
        ) : (
          <Tabla columnas={columnasSolicitudes} datos={solicitudes} />
        )}
      </section>

      {/* TABLA DE HISTORIAL DE MOVIMIENTOS (RF-291) */}
      <section className="pagina-seccion">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <h2 className="seccion-titulo">Historial de Movimientos de Billetera</h2>
          <span className="seccion-desc">Libro mayor de créditos por cierre y débitos por retiro</span>
        </div>

        {movimientos.length === 0 ? (
          <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
            <p className="seccion-desc">Aún no se registran movimientos contables en tu billetera.</p>
          </div>
        ) : (
          <Tabla columnas={columnasMovimientos} datos={movimientos} />
        )}
      </section>

      {/* MODAL PARA SOLICITAR RETIRO (RF-293 / RF-294) */}
      {mostrarModalRetiro && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--sp-4)'
          }}
        >
          <div
            className="panel-blanco"
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <h3 className="txt-lg txt-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} style={{ color: 'var(--oro)' }} />
                Solicitar Retiro Bancario
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalRetiro(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--texto-apagado)' }}
              >
                ✕
              </button>
            </div>

            {mensajeRetiro && (
              <div
                className={mensajeRetiro.tipo === 'exito' ? 'box-alerta-info' : 'panel-explicacion-cero'}
                style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-3)' }}
              >
                <span className="txt-xs txt-bold">{mensajeRetiro.texto}</span>
              </div>
            )}

            <form onSubmit={handleSolicitarRetiro} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div>
                <label className="txt-sm txt-bold" style={{ display: 'block', marginBottom: '4px' }}>
                  Monto a Retirar (S/.):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={(minRetiroCent / 100).toFixed(2)}
                  className="formulario-input"
                  placeholder={`Mínimo S/. ${(minRetiroCent / 100).toFixed(2)}`}
                  value={montoRetiro}
                  onChange={(e) => setMontoRetiro(e.target.value)}
                  required
                />
                <span className="txt-xs txt-muted" style={{ marginTop: '2px', display: 'block' }}>
                  Saldo disponible: {formatearSoles(saldoDisponibleCent)}
                </span>
              </div>

              <div>
                <label className="txt-sm txt-bold" style={{ display: 'block', marginBottom: '4px' }}>
                  Banco de Destino:
                </label>
                <select
                  className="formulario-select"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                >
                  <option value="BCP">BCP - Banco de Crédito del Perú</option>
                  <option value="BBVA">BBVA Perú</option>
                  <option value="Interbank">Interbank</option>
                  <option value="Scotiabank">Scotiabank</option>
                  <option value="Banco de la Nacion">Banco de la Nación</option>
                </select>
              </div>

              <div>
                <label className="txt-sm txt-bold" style={{ display: 'block', marginBottom: '4px' }}>
                  Número de Cuenta:
                </label>
                <input
                  type="text"
                  className="formulario-input"
                  placeholder="Ej. 191-12345678-0-12"
                  value={cuenta}
                  onChange={(e) => setCuenta(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                <Boton
                  variante="secundario"
                  type="button"
                  onClick={() => setMostrarModalRetiro(false)}
                >
                  Cancelar
                </Boton>
                <Boton
                  variante="primario"
                  type="submit"
                  deshabilitado={enviandoRetiro}
                >
                  {enviandoRetiro ? 'Enviando...' : 'Confirmar Solicitud'}
                </Boton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
