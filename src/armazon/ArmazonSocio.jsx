import React, { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabaseClient';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ArmazonSocio({ children, socioData }) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [cicloTexto, setCicloTexto] = useState('Cargando ciclo...');
  const [rangoVigente, setRangoVigente] = useState('Sin rango');
  const [rangoHonorifico, setRangoHonorifico] = useState('Sin rango');
  const location = useLocation();
  const { socio: socioAuth, salir, esAdmin } = useSesion();

  useEffect(() => {
    let montado = true;
    async function cargarDatosContexto() {
      try {
        // 1. Ciclo abierto
        const { data: cicloData, error: errCiclo } = await supabase
          .from('ciclo')
          .select('id, anio, mes, estado')
          .eq('estado', 'abierto')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (errCiclo) throw errCiclo;

        let cicloStr = 'Sin ciclo abierto';
        let cicloId = null;
        if (cicloData && cicloData.mes) {
          const nombreMes = MESES[cicloData.mes - 1] || `Mes ${cicloData.mes}`;
          cicloStr = `${nombreMes} ${cicloData.anio}`;
          cicloId = cicloData.id;
        }

        if (montado) {
          setCicloTexto(cicloStr);
        }

        // 2. Rango vigente y honorífico desde fn_rango_lineas_socio
        const sId = socioAuth?.id || socioData?.id;
        if (sId && cicloId) {
          const { data: rpcRes, error: errRpc } = await supabase.rpc('fn_rango_lineas_socio', {
            p_socio_id: sId,
            p_ciclo_id: cicloId
          });

          if (montado && rpcRes && !errRpc) {
            const hono = rpcRes?.rango_honorifico?.nombre || 'Sin rango';
            setRangoHonorifico(hono);

            let vig = 'Sin rango';
            if (rpcRes?.rango_ciclo?.califica && rpcRes?.rango_ciclo?.rango_nombre) {
              vig = rpcRes.rango_ciclo.rango_nombre;
            } else if (rpcRes?.lineas && rpcRes?.rangos_escala) {
              const lineas = rpcRes.lineas || [];
              const puntosComputables = lineas.reduce((acc, l) => acc + (Number(l.puntos_computados) || 0), 0);
              const frontalesActivos = lineas.filter(l => Boolean(l.activo)).length;
              const escalas = (rpcRes.rangos_escala || []).filter(r => r.definido);
              const calificado = [...escalas].reverse().find(r => puntosComputables >= r.puntos_grupales && frontalesActivos >= r.frontales_activos);
              vig = calificado?.nombre || 'Sin rango';
            }
            setRangoVigente(vig);
          }
        } else if (montado) {
          setRangoVigente('Sin rango');
          setRangoHonorifico('Sin rango');
        }
      } catch (err) {
        if (montado) {
          setCicloTexto('Sin ciclo abierto');
          setRangoVigente('Sin rango');
          setRangoHonorifico('Sin rango');
        }
      }
    }

    cargarDatosContexto();
    return () => { montado = false; };
  }, [socioAuth?.id, socioData?.id]);

  const socio = {
    nombre: socioData?.nombre || (socioAuth ? `${socioAuth.nombres || ''} ${socioAuth.apellidos || ''}`.trim() : (socioAuth?.nombres || 'Socio')),
    codigo: socioData?.codigo || socioAuth?.codigo || '',
    pack: socioData?.pack || (socioAuth?.pack_id === 3 ? 'Gold' : (socioAuth?.pack_id === 1 ? 'Emprendedor' : 'Socio')),
    rangoVigente: socioData?.rangoVigente || rangoVigente,
    rangoHonorifico: socioData?.rangoHonorifico || rangoHonorifico,
    ciclo: socioData?.ciclo || cicloTexto,
    estado: socioData?.estado || socioAuth?.estado || 'activo'
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
          <div style={{ marginTop: 'var(--sp-2)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
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
