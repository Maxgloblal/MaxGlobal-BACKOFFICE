import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  Coins,
  Users,
  Award,
  Package,
  Wallet,
  Link as LinkIcon,
  User,
  Menu,
  X,
  LogOut,
  Layers,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { useSesion } from '../auth/SesionContext';

export default function ArmazonSocio({ children, socioData }) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const location = useLocation();
  const { socio: socioAuth, salir, esAdmin } = useSesion();

  const socio = socioData || {
    nombre: socioAuth ? `${socioAuth.nombres || ''} ${socioAuth.apellidos || ''}`.trim() : 'María Torres',
    codigo: socioAuth?.codigo || 'MG-00417',
    pack: socioAuth?.pack_id === 3 ? 'Gold' : (socioAuth?.pack_id === 1 ? 'Emprendedor' : 'Socio'),
    rangoVigente: 'Bronce',
    rangoHonorifico: 'Oro',
    ciclo: 'Agosto 2026',
    estado: socioAuth?.estado || 'activo'
  };

  const navPrincipal = [
    { label: 'Inicio', path: '/socio', icon: Home, end: true },
    { label: 'Tienda', path: '/socio/tienda', icon: ShoppingBag },
    { label: 'Comisiones', path: '/socio/comisiones', icon: Coins },
    { label: 'Mi red', path: '/socio/red', icon: Users },
  ];

  const navSecundario = [
    { label: 'Mi rango', path: '/socio/rango', icon: Award },
    { label: 'Mis pedidos', path: '/socio/pedidos', icon: Package },
    { label: 'Mi billetera', path: '/socio/billetera', icon: Wallet },
    { label: 'Mi enlace', path: '/socio/enlace', icon: LinkIcon },
    { label: 'Mi perfil', path: '/socio/perfil', icon: User },
  ];

  const cerrarDrawer = () => setDrawerAbierto(false);

  const handleCerrarSesion = async () => {
    cerrarDrawer();
    if (salir) {
      await salir();
    }
  };

  return (
    <div className="armazon-socio">
      {/* SIDEBAR ESCRITORIO (Visible >= 768px) */}
      <aside className="armazon-socio-sidebar-desktop">
        <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/brand/logo-color-horizontal.png" alt="Max Global" className="armazon-logo-img" style={{ height: '36px' }} />
        </div>
        <div className="armazon-drawer-socio-card">
          <div className="armazon-drawer-socio-nombre">{socio.nombre}</div>
          <div className="armazon-drawer-socio-meta">Código: {socio.codigo} · Pack {socio.pack}</div>
          <div style={{ marginTop: 'var(--sp-2)', display: 'flex', gap: 'var(--sp-1)' }}>
            <span className="armazon-badge-rango">Rango: {socio.rangoVigente}</span>
          </div>
        </div>
        <nav className="armazon-drawer-nav">
          {navPrincipal.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `armazon-nav-link ${isActive ? 'activo' : ''}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: 'var(--sp-2) var(--sp-3)' }} />
          {navSecundario.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `armazon-nav-link ${isActive ? 'activo' : ''}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: 'var(--sp-2) var(--sp-3)' }} />
          <NavLink to="/kit" className={({ isActive }) => `armazon-nav-link ${isActive ? 'activo' : ''}`}>
            <Layers size={20} />
            <span>Kit de Piezas UI</span>
          </NavLink>
          {esAdmin && (
            <NavLink to="/admin" className="armazon-nav-link">
              <ShieldAlert size={20} />
              <span>Panel Admin</span>
            </NavLink>
          )}
        </nav>
        <div className="armazon-drawer-footer">
          <button className="armazon-btn-logout" onClick={handleCerrarSesion}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL SOCIO */}
      <div className="armazon-socio-main-desktop">
        {/* HEADER SUPERIOR */}
        <header className="armazon-socio-header">
          <div className="armazon-socio-header-left">
            <button
              className="armazon-btn-menu"
              onClick={() => setDrawerAbierto(true)}
              aria-label="Abrir menú de navegación"
            >
              <Menu size={24} />
            </button>
            <Link to="/socio">
              <img src="/brand/logo-color-horizontal.png" alt="Max Global" className="armazon-logo-img" />
            </Link>
          </div>

          <div className="armazon-socio-info-badge">
            <span className="armazon-badge-rango">{socio.rangoVigente}</span>
            <button
              className="armazon-avatar-btn"
              onClick={() => setDrawerAbierto(true)}
              title={socio.nombre}
            >
              {socio.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </button>
          </div>
        </header>

        {/* SUBBARRA CONTEXTUAL EN MÓVIL */}
        <div className="armazon-socio-subbar">
          <span className="armazon-socio-subbar-user">{socio.nombre} ({socio.codigo})</span>
          <span className="armazon-socio-subbar-cycle">Ciclo: {socio.ciclo}</span>
        </div>

        {/* ALERTA VISIBLE PARA SOCIO INACTIVO (RF-208) */}
        {socio.estado === 'inactivo' && (
          <div
            role="alert"
            style={{
              background: 'var(--gold-100)',
              borderBottom: '1px solid var(--gold-300)',
              color: 'var(--gold-800)',
              padding: 'var(--sp-3) var(--sp-4)',
              fontSize: 'var(--fs-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-2)',
              fontWeight: 500
            }}
          >
            <AlertTriangle size={18} style={{ color: 'var(--gold-700)', flexShrink: 0 }} />
            <span>
              Tu cuenta está inactiva en este ciclo. Realiza una recompra mínima para reactivar tus beneficios y calificar a comisiones.
            </span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL DE LA PANTALLA */}
        <main className="armazon-contenido">
          {children}
        </main>
      </div>

      {/* BARRA INFERIOR MÓVIL FIJA (EXACTAMENTE 4 ENTRADAS) */}
      <nav className="armazon-bottom-nav" aria-label="Navegación principal móvil">
        {navPrincipal.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `armazon-bottom-nav-item ${isActive ? 'activo' : ''}`}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* CAJÓN DESPLEGABLE MÓVIL (DRAWER) */}
      <div
        className={`armazon-drawer-overlay ${drawerAbierto ? 'abierto' : ''}`}
        onClick={cerrarDrawer}
      />
      <div className={`armazon-drawer ${drawerAbierto ? 'abierto' : ''}`}>
        <div className="armazon-drawer-header">
          <img src="/brand/logo-color-horizontal.png" alt="Max Global" className="armazon-logo-img" />
          <button className="armazon-btn-menu" onClick={cerrarDrawer} aria-label="Cerrar menú">
            <X size={24} />
          </button>
        </div>

        <div className="armazon-drawer-socio-card">
          <div className="armazon-drawer-socio-nombre">{socio.nombre}</div>
          <div className="armazon-drawer-socio-meta">Código: {socio.codigo} · Pack {socio.pack}</div>
          <div style={{ marginTop: 'var(--sp-2)', display: 'flex', gap: 'var(--sp-2)' }}>
            <span className="armazon-badge-rango">Vigente: {socio.rangoVigente}</span>
            <span className="armazon-badge-rango" style={{ backgroundColor: 'var(--n-100)', color: 'var(--n-600)', borderColor: 'var(--n-300)' }}>
              Título: {socio.rangoHonorifico}
            </span>
          </div>
        </div>

        <nav className="armazon-drawer-nav">
          {navPrincipal.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={cerrarDrawer}
                className={({ isActive }) => `armazon-nav-link ${isActive ? 'activo' : ''}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: 'var(--sp-2) var(--sp-3)' }} />
          {navSecundario.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={cerrarDrawer}
                className={({ isActive }) => `armazon-nav-link ${isActive ? 'activo' : ''}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: 'var(--sp-2) var(--sp-3)' }} />
          <NavLink to="/kit" onClick={cerrarDrawer} className={({ isActive }) => `armazon-nav-link ${isActive ? 'activo' : ''}`}>
            <Layers size={20} />
            <span>Kit de Piezas UI</span>
          </NavLink>
          {esAdmin && (
            <NavLink to="/admin" onClick={cerrarDrawer} className="armazon-nav-link">
              <ShieldAlert size={20} />
              <span>Panel de Administración</span>
            </NavLink>
          )}
        </nav>

        <div className="armazon-drawer-footer">
          <button className="armazon-btn-logout" onClick={handleCerrarSesion}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
