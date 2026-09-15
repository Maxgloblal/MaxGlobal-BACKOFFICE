import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerResumenTableroAdmin } from '../servicios/operacionAdmin';
import { formatearSoles } from '../utilidades/dinero';
import { Boton } from '../piezas';
import {
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  Users,
  DollarSign,
  ShoppingCart,
  UserPlus,
  Lock,
  ArrowRight,
  TrendingUp,
  Clock,
  RefreshCw,
  Package,
  AlertCircle
} from 'lucide-react';

/**
 * P-20 · Tablero de Control del Administrador
 * - Vista general en tiempo real del ciclo abierto
 * - Órdenes por confirmar con acceso directo a P-23
 * - Comisiones estimadas en curso
 * - Últimas órdenes y afiliaciones
 * - Accesos rápidos operativos
 */
export default function P20TableroAdmin() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    cargarTablero();
  }, []);

  async function cargarTablero() {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerResumenTableroAdmin();
      setResumen(data);
    } catch (err) {
      console.error('Error al cargar tablero:', err);
      setError(err.message || 'Error al obtener las métricas del tablero.');
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <RefreshCw className="icono-giratorio" size={32} style={{ color: 'var(--gold-500)', marginBottom: 'var(--sp-3)' }} />
          <p className="seccion-desc">Cargando métricas del ciclo en tiempo real...</p>
        </div>
      </div>
    );
  }

  const ciclo = resumen?.ciclo || { id: 4, mes: 9, anio: 2026 };

  return (
    <div className="pagina-contenedor">
      {/* ENCABEZADO */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-20</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Tablero de Control</h1>
            <p className="pagina-subtitulo">
              Monitoreo operativo en vivo, estado del ciclo activo y cola de pagos
            </p>
          </div>
          <span className="armazon-admin-cycle-badge">
            <CalendarCheck size={16} />
            <span>Ciclo {ciclo.id} Activo · {ciclo.mes}/{ciclo.anio} ({resumen?.diasParaCierre} días para cierre)</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} className="txt-gold" />
            <strong className="txt-sm txt-gold">{error}</strong>
          </div>
        </div>
      )}

      {/* TARJETAS DE MÉTRICAS PRINCIPALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
        {/* 1. ÓRDENES POR CONFIRMAR (P-23) */}
        <div className="panel-blanco" style={{ borderLeft: resumen?.ordenesPorConfirmar > 0 ? '4px solid var(--alerta)' : '4px solid var(--green-600)', padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">ÓRDENES POR CONFIRMAR</span>
            <CheckSquare size={20} style={{ color: resumen?.ordenesPorConfirmar > 0 ? 'var(--alerta)' : 'var(--green-600)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 4px 0', color: resumen?.ordenesPorConfirmar > 0 ? 'var(--alerta)' : 'var(--texto-principal)' }}>
            {resumen?.ordenesPorConfirmar}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="txt-xs txt-muted">Bandeja de verificación</span>
            <Link to="/admin/confirmacion" className="txt-xs txt-gold txt-bold" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              Revisar <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* 2. SOCIOS ACTIVOS EN EL CICLO */}
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--gold-500)', padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">SOCIOS ACTIVOS (CICLO {ciclo.id})</span>
            <Users size={20} style={{ color: 'var(--gold-500)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 4px 0' }}>
            {resumen?.sociosActivos} <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--texto-muted)' }}>de {resumen?.totalSocios}</span>
          </div>
          <span className="txt-xs txt-muted">Con activación personal cumplida</span>
        </div>

        {/* 3. COMISIONES ESTIMADAS EN CURSO */}
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--info)', padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">ESTIMADO DE COMISIONES</span>
            <DollarSign size={20} style={{ color: 'var(--info)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 4px 0', color: 'var(--gold-700)' }}>
            {formatearSoles(resumen?.comisionesEstimadasCent)}
          </div>
          <span className="txt-xs txt-muted">Se actualiza con cada pago confirmado</span>
        </div>

        {/* 4. CIERRE DEL CICLO */}
        <div className="panel-blanco" style={{ borderLeft: '4px solid var(--gold-600)', padding: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="txt-xs txt-muted txt-bold">CIERRE MENSUAL</span>
            <Clock size={20} style={{ color: 'var(--gold-600)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 4px 0' }}>
            {resumen?.diasParaCierre} <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--texto-muted)' }}>días rest.</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="txt-xs txt-muted">Fecha fin: {ciclo.fecha_fin || 'Fin de mes'}</span>
            <Link to="/admin/cierre" className="txt-xs txt-gold txt-bold" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              Cierre <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ACCESOS RÁPIDOS OPERATIVOS */}
      <div className="panel-blanco" style={{ padding: 'var(--sp-5)' }}>
        <h3 className="seccion-titulo" style={{ fontSize: '15px', marginBottom: 'var(--sp-3)' }}>
          Acciones Rápidas del Administrador (RF-406)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-3)' }}>
          <Link to="/admin/registrar-pedido" className="btn btn-secundario" style={{ justifyContent: 'center', padding: '12px' }}>
            <ShoppingCart size={16} /> Registrar Pedido
          </Link>
          <Link to="/admin/afiliacion" className="btn btn-secundario" style={{ justifyContent: 'center', padding: '12px' }}>
            <UserPlus size={16} /> Registrar Afiliación
          </Link>
          <Link to="/admin/confirmacion" className="btn btn-secundario" style={{ justifyContent: 'center', padding: '12px' }}>
            <CheckSquare size={16} /> Bandeja de Confirmación
          </Link>
          <Link to="/admin/cierre" className="btn btn-primario" style={{ justifyContent: 'center', padding: '12px' }}>
            <Lock size={16} /> Cierre de Ciclo
          </Link>
        </div>
      </div>

      {/* TABLAS DE ÚLTIMOS REGISTROS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--sp-5)' }}>
        {/* ÚLTIMAS 5 ÓRDENES (RF-404) */}
        <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong className="txt-sm">Últimas 5 Órdenes Registradas</strong>
            <Link to="/admin/confirmacion" className="txt-xs txt-gold">Ver todas</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-limpia" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', backgroundColor: 'var(--fondo-suave)', borderBottom: '1px solid var(--borde)' }}>
                  <th style={{ padding: '8px 12px' }}>Código</th>
                  <th style={{ padding: '8px 12px' }}>Socio</th>
                  <th style={{ padding: '8px 12px' }}>Total</th>
                  <th style={{ padding: '8px 12px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(resumen?.ultimasOrdenes || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--sp-4)', color: 'var(--texto-muted)' }}>
                      No hay órdenes recientes en el ciclo.
                    </td>
                  </tr>
                ) : (
                  resumen.ultimasOrdenes.map(ord => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                      <td style={{ padding: '8px 12px' }}><strong>{ord.codigo}</strong></td>
                      <td style={{ padding: '8px 12px' }}>{ord.socio?.nombres} {ord.socio?.apellidos}</td>
                      <td style={{ padding: '8px 12px' }}><strong>{formatearSoles(ord.total_cent)}</strong></td>
                      <td style={{ padding: '8px 12px' }}>
                        <span className={ord.estado === 'confirmada' || ord.estado === 'pagada' ? 'badge badge-activo' : 'badge badge-inactivo'} style={{ fontSize: '10px' }}>
                          {ord.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ÚLTIMAS 5 AFILIACIONES (RF-405) */}
        <div className="panel-blanco" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong className="txt-sm">Últimas 5 Afiliaciones Registradas</strong>
            <Link to="/admin/socios" className="txt-xs txt-gold">Ver socios</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-limpia" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', backgroundColor: 'var(--fondo-suave)', borderBottom: '1px solid var(--borde)' }}>
                  <th style={{ padding: '8px 12px' }}>Orden</th>
                  <th style={{ padding: '8px 12px' }}>Nuevo Socio</th>
                  <th style={{ padding: '8px 12px' }}>Pack</th>
                  <th style={{ padding: '8px 12px' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {(resumen?.ultimasAfiliaciones || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--sp-4)', color: 'var(--texto-muted)' }}>
                      No hay afiliaciones recientes en el ciclo.
                    </td>
                  </tr>
                ) : (
                  resumen.ultimasAfiliaciones.map(afi => (
                    <tr key={afi.id} style={{ borderBottom: '1px solid var(--fondo-suave)' }}>
                      <td style={{ padding: '8px 12px' }}><strong>{afi.codigo}</strong></td>
                      <td style={{ padding: '8px 12px' }}>{afi.socio?.nombres} {afi.socio?.apellidos}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span className="badge badge-oro" style={{ fontSize: '10px' }}>
                          {afi.pack?.nombre || 'Kit'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}><strong>{formatearSoles(afi.total_cent)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
