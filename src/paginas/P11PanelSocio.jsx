import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, BarraProgreso, Boton, Aviso } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerCiclos,
  obtenerPanelPrincipal,
  formatearNombreCiclo
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
  Target,
  Truck,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * P-11 · Panel Principal del Socio
 * Tablero central: estado de activación prominente, contadores diferenciados, rango y estimación.
 */
export default function P11PanelSocio() {
  const [socio, setSocio] = useState(null);
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [panel, setPanel] = useState(null);
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
        const cicloId = cicloSeleccionado || cicloAbierto?.id || listaCiclos[0]?.id || 6;
        if (!cicloSeleccionado && cicloId && !cancelado) {
          setCicloSeleccionado(cicloId);
        }
        const datos = await obtenerPanelPrincipal(perfil.id, cicloId);
        if (!cancelado) {
          setPanel(datos);
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar datos del panel');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, [cicloSeleccionado]);

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
  const metaActivacion = panel?.metaActivacion;
  const alertasPedidos = panel?.alertasPedidos || { rechazados: [], enCamino: [], entregados: [] };
  const rechazados = alertasPedidos.rechazados || [];
  const enCamino = alertasPedidos.enCamino || [];
  const entregados = alertasPedidos.entregados || [];

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

            {/* Contador de Cierre con aviso prominente (RF-217 / RF-218) */}
            <span
              className={estaActivo ? 'armazon-admin-cycle-badge' : 'armazon-admin-cycle-badge'}
              style={{
                backgroundColor: !estaActivo ? 'var(--danger-soft)' : undefined,
                color: !estaActivo ? 'var(--danger)' : undefined,
                borderColor: !estaActivo ? 'var(--border-danger)' : undefined,
                fontWeight: 700
              }}
            >
              <Clock size={16} />
              <span>Cierre del mes en {diasRestantes} días ⏳</span>
            </span>
          </div>
        </div>
      </div>

      {/* AVISO DE CONTRASEÑA TEMPORAL (TAREA-25 Bloque 3) */}
      {socio && !socio.password_cambiada && (
        <Aviso
          tipo="aviso"
          style={{
            marginBottom: 'var(--sp-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <span>
              Estás usando la contraseña que te dieron al registrarte. Cámbiala desde Mi Perfil.
            </span>
          </div>
          <Link
            to="/socio/perfil"
            className="btn btn-secundario"
            style={{
              padding: '6px 14px',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Cambiar ahora</span>
            <ArrowRight size={14} />
          </Link>
        </Aviso>
      )}

      {/* TAREA-47 BLOQUE 4: AVISO SI TIENE SALDO Y LE FALTA EL CCI */}
      {saldoDisponibleCent > 0 && !socio?.cci && (
        <Aviso
          tipo="aviso"
          style={{
            marginBottom: 'var(--sp-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <strong style={{ color: 'var(--texto-principal)', display: 'block' }}>
              Completa tus datos bancarios para poder cobrar
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--texto-secundario)' }}>
              Tienes un saldo disponible de {formatearSoles(saldoDisponibleCent)} en tu billetera pero aún no registras tu CCI.
            </span>
          </div>
          <Link
            to="/socio/perfil"
            className="btn btn-secundario"
            style={{
              padding: '6px 14px',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Ir a Mi Perfil</span>
            <ArrowRight size={14} />
          </Link>
        </Aviso>
      )}

      {/* 🔴 RF-219: AVISO DE PAGOS RECHAZADOS (con enlace a P-17 Mis Pedidos) */}
      {rechazados.length > 0 && (
        <Aviso
          tipo="error"
          style={{
            marginBottom: 'var(--sp-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle size={18} />
              {rechazados.length === 1
                ? `Pago rechazado en orden ${rechazados[0].codigo}`
                : `Tienes ${rechazados.length} pedidos con pago rechazado`}
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--texto-secundario)', marginTop: '4px', display: 'block' }}>
              {rechazados.length === 1
                ? `Motivo: ${rechazados[0].motivoRechazo || 'Comprobante observado por Administración'}. Revisa el detalle en Mis Pedidos para regularizarlo.`
                : `Órdenes observadas: ${rechazados.map((r) => r.codigo).join(', ')}. Revisa el motivo en Mis Pedidos para regularizarlas.`}
            </span>
          </div>
          <Link
            to="/socio/pedidos"
            className="btn btn-peligro"
            style={{
              padding: '6px 14px',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Ver Mis Pedidos</span>
            <ArrowRight size={14} />
          </Link>
        </Aviso>
      )}

      {/* 🚚 RF-219: AVISO DE ENVÍOS EN CAMINO O ENTREGADOS */}
      {enCamino.length > 0 && (
        <Aviso
          tipo="info"
          style={{
            marginBottom: 'var(--sp-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={18} />
              {enCamino.length === 1
                ? `Envío en camino · Orden ${enCamino[0].ordenCodigo}`
                : `Tienes ${enCamino.length} pedidos en camino`}
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--texto-secundario)', marginTop: '4px', display: 'block' }}>
              {enCamino.length === 1
                ? `Tu paquete ha sido despachado${enCamino[0].guia ? ` con N° de Guía ${enCamino[0].guia}` : ''}${enCamino[0].agencia ? ` por ${enCamino[0].agencia}` : ''}.`
                : `Pedidos despachados: ${enCamino.map((e) => e.ordenCodigo).join(', ')}. Puedes hacer seguimiento desde Mis Pedidos.`}
            </span>
          </div>
          <Link
            to="/socio/pedidos"
            className="btn btn-secundario"
            style={{
              padding: '6px 14px',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Ver Seguimiento</span>
            <ArrowRight size={14} />
          </Link>
        </Aviso>
      )}

      {enCamino.length === 0 && entregados.length > 0 && (
        <Aviso
          tipo="exito"
          style={{
            marginBottom: 'var(--sp-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={18} />
              {entregados.length === 1
                ? `Pedido ${entregados[0].ordenCodigo} entregado con éxito`
                : `Tus últimos ${entregados.length} pedidos fueron entregados`}
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--texto-secundario)', marginTop: '4px', display: 'block' }}>
              Tus productos ya se encuentran en destino. Revisa el comprobante y detalle en Mis Pedidos.
            </span>
          </div>
          <Link
            to="/socio/pedidos"
            className="btn btn-secundario"
            style={{
              padding: '6px 14px',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Ver Mis Pedidos</span>
            <ArrowRight size={14} />
          </Link>
        </Aviso>
      )}

      {/* BLOQUE DE ALERTA DE ACTIVACIÓN (RF-210 / RF-211 / RF-218 · El elemento más visible) */}
      {estaActivo ? (
        <div className="panel-activa-exito" style={{ marginBottom: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <CheckCircle size={24} style={{ color: 'var(--green-600)' }} />
            <h3 style={{ color: 'var(--green-700)' }}>ESTÁS ACTIVO ESTE MES</h3>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)' }}>
            Cumpliste con {puntosPersonales} puntos personales (mínimo {metaActivacion || '...'} pts). Tienes derecho a cobrar todas las comisiones de patrocinio, residual y rango de tu equipo en el cierre de ciclo.
          </p>
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <BarraProgreso
              etiqueta="Puntos Personales Acumulados"
              valor={puntosPersonales}
              meta={metaActivacion}
              unidad="pts"
              variante="verde"
              estado={metaActivacion > 0 ? 'datos' : 'cargando'}
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
            Llevas {puntosPersonales} de los {metaActivacion || '...'} puntos personales requeridos. Quedan {diasRestantes} días para el cierre contable. Sin {metaActivacion || '...'} puntos personales, no podrás cobrar ninguna comisión de tu red este ciclo (regla sin compresión).
          </p>
          <div style={{ marginTop: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
            <BarraProgreso
              etiqueta="Progreso de Activación Mensual"
              valor={puntosPersonales}
              meta={metaActivacion}
              unidad="pts"
              variante="alerta"
              estado={metaActivacion > 0 ? 'datos' : 'cargando'}
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
            subrotulo="Solo para tu activación personal"
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
            subrotulo={`Directos con >= ${metaActivacion || '...'} pts este ciclo`}
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
              ℹ️ Este monto se acreditará a tu <strong>Saldo Disponible</strong> en el cierre contable del mes si cumples tu activación de {metaActivacion || '...'} puntos.
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
