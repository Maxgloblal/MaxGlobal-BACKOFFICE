import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  LayoutDashboard,
  ShoppingCart,
  UserPlus,
  CheckSquare,
  Truck,
  CalendarCheck,
  Settings,
  Users,
  BarChart3,
  FileSearch,
  Menu,
  X,
  LogOut,
  Layers,
  ArrowLeftRight,
  ArrowDownRight,
  ShieldCheck,
  Inbox,
  Package
} from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ArmazonAdmin({ children }) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [cicloBadge, setCicloBadge] = useState('Cargando ciclo...');
  const location = useLocation();

  const cerrarDrawer = () => setDrawerAbierto(false);

  useEffect(() => {
    let montado = true;
    async function cargarCicloAbierto() {
      try {
        const { data, error } = await supabase
          .from('ciclo')
          .select('id, anio, mes, estado')
          .eq('estado', 'abierto')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (montado) {
          if (data && data.mes) {
            const nombreMes = MESES[data.mes - 1] || `Mes ${data.mes}`;
            const estadoStr = data.estado ? data.estado.charAt(0).toUpperCase() + data.estado.slice(1) : 'Abierto';
            setCicloBadge(`Ciclo: ${nombreMes} ${data.anio} · ${estadoStr}`);
          } else {
            setCicloBadge('Sin ciclo abierto');
          }
        }
      } catch (err) {
        if (montado) {
          setCicloBadge('Sin ciclo abierto');
        }
      }
    }
    cargarCicloAbierto();
    return () => { montado = false; };
  }, []);

  const navItems = [
    { label: 'Tablero', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Solicitudes afiliación', path: '/admin/solicitudes', icon: Inbox },
    { label: 'Registrar pedido', path: '/admin/registrar-pedido', icon: ShoppingCart },
    { label: 'Registrar afiliación', path: '/admin/afiliacion', icon: UserPlus },
    { label: 'Bandeja de confirmación', path: '/admin/confirmacion', icon: CheckSquare },
    { label: 'Envíos', path: '/admin/envios', icon: Truck },
    { label: 'Cierre de ciclo', path: '/admin/cierre', icon: CalendarCheck },
    { label: 'Retiros', path: '/admin/retiros', icon: ArrowDownRight },
    { label: 'Configuración del plan', path: '/admin/configuracion', icon: Settings },
    { label: 'Productos', path: '/admin/productos', icon: Package },
    { label: 'Gestión de socios', path: '/admin/socios', icon: Users },
    { label: 'Reportes', path: '/admin/reportes', icon: BarChart3 },
    { label: 'Auditoría', path: '/admin/auditoria', icon: FileSearch },
  ];

  return (
    <div className="armazon-admin">
      {/* SIDEBAR ADMIN (Fijo en escritorio >= 1024px, drawer en móvil/tablet) */}
      <aside className={`armazon-admin-sidebar ${drawerAbierto ? 'abierto' : ''}`}>
        <div className="armazon-admin-sidebar-header">
          <Link to="/admin" onClick={cerrarDrawer} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <img
              src="/brand/logo-blanco-horizontal.png"
              alt="Max Global"
              className="armazon-logo-img"
              style={{ height: '32px' }}
            />
          </Link>
          <span className="armazon-admin-badge-role">ADMIN</span>
          {drawerAbierto && (
            <button
              onClick={cerrarDrawer}
              style={{ marginLeft: 'auto', color: 'var(--n-300)', padding: '8px' }}
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="armazon-admin-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={cerrarDrawer}
                className={({ isActive }) => `armazon-admin-nav-link ${isActive ? 'activo' : ''}`}
              >
                <IconComponent size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: 'var(--sp-2) var(--sp-2)' }} />

          <NavLink
            to="/kit"
            onClick={cerrarDrawer}
            className={({ isActive }) => `armazon-admin-nav-link ${isActive ? 'activo' : ''}`}
          >
            <Layers size={19} />
            <span>Kit de Piezas UI</span>
          </NavLink>

          <NavLink
            to="/socio"
            onClick={cerrarDrawer}
            className="armazon-admin-nav-link"
          >
            <ArrowLeftRight size={19} />
            <span>Ver Backoffice Socio</span>
          </NavLink>
        </nav>

        <div className="armazon-admin-sidebar-footer">
          <button className="armazon-admin-btn-logout" onClick={() => { cerrarDrawer(); alert('Sesión administrativa cerrada'); }}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY PARA MÓVIL/TABLET */}
      {drawerAbierto && (
        <div
          className="armazon-drawer-overlay abierto"
          onClick={cerrarDrawer}
          style={{ zIndex: 215 }}
        />
      )}

      {/* ÁREA PRINCIPAL ADMINISTRADOR */}
      <div className="armazon-admin-main">
        {/* HEADER ADMIN */}
        <header className="armazon-admin-header">
          <div className="armazon-admin-header-title">
            <button
              className="armazon-btn-menu"
              onClick={() => setDrawerAbierto(true)}
              aria-label="Abrir menú de administración"
              style={{ display: 'flex' }}
            >
              <Menu size={24} />
            </button>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', fontWeight: 'var(--fw-bold)' }}>
                Panel de Administración
              </div>
              <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>Max Global Oficial</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div className="armazon-admin-cycle-badge">
              <ShieldCheck size={16} />
              <span>{cicloBadge}</span>
            </div>

            <div className="armazon-admin-user">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--r-circle)',
                  backgroundColor: 'var(--gold-400)',
                  color: 'var(--n-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--fw-bold)',
                  fontSize: 'var(--fs-xs)'
                }}
              >
                M
              </div>
              <span style={{ display: 'none' }} className="admin-user-name">Máximo</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="armazon-contenido">
          {children}
        </main>
      </div>
    </div>
  );
}
