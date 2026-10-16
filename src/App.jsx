import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { SesionProvider } from './auth/SesionContext';
import { RutaProtegidaSocio, RutaAdmin } from './auth/RutaProtegida';
import ArmazonSocio from './armazon/ArmazonSocio';
import ArmazonAdmin from './armazon/ArmazonAdmin';

// Componente de carga para transiciones diferidas (Code Splitting · TAREA-70)
function CargandoPantalla() {
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-6)',
        fontFamily: 'var(--font-cuerpo)'
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--gold-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
        Cargando pantalla...
      </span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function suspender(Componente) {
  return (
    <Suspense fallback={<CargandoPantalla />}>
      <Componente />
    </Suspense>
  );
}

// Carga perezosa (Lazy loading) de páginas para optimizar carga inicial móvil
const Kit = lazy(() => import('./paginas/Kit'));
const P10InicioSesion = lazy(() => import('./paginas/P10InicioSesion'));
const PNuevaContrasena = lazy(() => import('./paginas/PNuevaContrasena'));
const PEspera = lazy(() => import('./paginas/PEspera'));
const PSuspendido = lazy(() => import('./paginas/PSuspendido'));

// Páginas Socio
const P11PanelSocio = lazy(() => import('./paginas/P11PanelSocio'));
const P12MiRed = lazy(() => import('./paginas/P12MiRed'));
const P13TiendaRecompra = lazy(() => import('./paginas/P13TiendaRecompra'));
const P14MisComisiones = lazy(() => import('./paginas/P14MisComisiones'));
const P15MiRango = lazy(() => import('./paginas/P15MiRango'));
const P16MiEnlace = lazy(() => import('./paginas/P16MiEnlace'));
const P17MisPedidos = lazy(() => import('./paginas/P17MisPedidos'));
const P18MiPerfil = lazy(() => import('./paginas/P18MiPerfil'));
const P19MiBilletera = lazy(() => import('./paginas/P19MiBilletera'));

// Páginas Admin
const P20TableroAdmin = lazy(() => import('./paginas/P20TableroAdmin'));
const P21RegistrarPedido = lazy(() => import('./paginas/P21RegistrarPedido'));
const P22RegistrarAfiliacion = lazy(() => import('./paginas/P22RegistrarAfiliacion'));
const P23BandejaConfirmacion = lazy(() => import('./paginas/P23BandejaConfirmacion'));
const P24Envios = lazy(() => import('./paginas/P24Envios'));
const P25CierreCiclo = lazy(() => import('./paginas/P25CierreCiclo'));
const P26Configuracion = lazy(() => import('./paginas/P26Configuracion'));
const P27GestionSocios = lazy(() => import('./paginas/P27GestionSocios'));
const P28Reportes = lazy(() => import('./paginas/P28Reportes'));
const P29Auditoria = lazy(() => import('./paginas/P29Auditoria'));
const P30GestionRetiros = lazy(() => import('./paginas/P30GestionRetiros'));
const P31SolicitudesAfiliacion = lazy(() => import('./paginas/P31SolicitudesAfiliacion'));
const P32GestionProductos = lazy(() => import('./paginas/P32GestionProductos'));

export default function App() {
  return (
    <SesionProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/socio" replace />} />

        {/* Página de Inicio de Sesión (P-10) */}
        <Route path="/login" element={suspender(P10InicioSesion)} />

        {/* Página de Restablecimiento de Contraseña (TAREA-57) */}
        <Route path="/nueva-contrasena" element={suspender(PNuevaContrasena)} />

        {/* Pantallas de estado de socio */}
        <Route path="/socio/espera" element={suspender(PEspera)} />
        <Route path="/socio/suspendido" element={suspender(PSuspendido)} />

        {/* Página de Catálogo Visual /kit */}
        {import.meta.env.DEV && (
          <Route
            path="/kit"
            element={
              <div style={{ minHeight: '100vh', padding: 'var(--sp-4)', maxWidth: '1200px', margin: '0 auto' }}>
                {suspender(Kit)}
              </div>
            }
          />
        )}

        {/* Rutas Backoffice Socio (Protegidas) */}
        <Route
          path="/socio"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P11PanelSocio)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/comisiones"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P14MisComisiones)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/red"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P12MiRed)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/tienda"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P13TiendaRecompra)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/rango"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P15MiRango)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/pedidos"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P17MisPedidos)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/billetera"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P19MiBilletera)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/enlace"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P16MiEnlace)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/perfil"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                {suspender(P18MiPerfil)}
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />

        {/* Rutas Panel Administración (Solo Admin) */}
        <Route
          path="/admin"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P20TableroAdmin)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/registrar-pedido"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P21RegistrarPedido)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/pedido"
          element={<Navigate to="/admin/registrar-pedido" replace />}
        />
        <Route
          path="/admin/afiliacion"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P22RegistrarAfiliacion)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/registrar-afiliacion"
          element={<Navigate to="/admin/afiliacion" replace />}
        />
        <Route
          path="/admin/solicitudes"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P31SolicitudesAfiliacion)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/confirmacion"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P23BandejaConfirmacion)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/envios"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P24Envios)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/cierre"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P25CierreCiclo)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/retiros"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P30GestionRetiros)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/configuracion"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P26Configuracion)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P32GestionProductos)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/socios"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P27GestionSocios)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P28Reportes)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/auditoria"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                {suspender(P29Auditoria)}
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }}>
              <div className="panel-blanco" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                <h2>404 · Página no encontrada</h2>
                <p style={{ margin: 'var(--sp-3) 0', color: 'var(--text-muted)' }}>
                  La ruta especificada no existe en el sistema.
                </p>
                <Link to="/socio" className="btn btn-primario">
                  Ir al Backoffice
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </SesionProvider>
  );
}
