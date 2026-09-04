import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { SesionProvider } from './auth/SesionContext';
import { RutaProtegidaSocio, RutaAdmin } from './auth/RutaProtegida';
import ArmazonSocio from './armazon/ArmazonSocio';
import ArmazonAdmin from './armazon/ArmazonAdmin';
import Kit from './paginas/Kit';
import P10InicioSesion from './paginas/P10InicioSesion';
import PEspera from './paginas/PEspera';
import PSuspendido from './paginas/PSuspendido';
import P11PanelSocio from './paginas/P11PanelSocio';
import P13TiendaRecompra from './paginas/P13TiendaRecompra';
import P14MisComisiones from './paginas/P14MisComisiones';
import P15MiRango from './paginas/P15MiRango';
import P16MiEnlace from './paginas/P16MiEnlace';
import P17MisPedidos from './paginas/P17MisPedidos';
import P18MiPerfil from './paginas/P18MiPerfil';
import P19MiBilletera from './paginas/P19MiBilletera';
import P12MiRed from './paginas/P12MiRed';
import P20TableroAdmin from './paginas/P20TableroAdmin';
import P21RegistrarPedido from './paginas/P21RegistrarPedido';
import P22RegistrarAfiliacion from './paginas/P22RegistrarAfiliacion';
import P24Envios from './paginas/P24Envios';
import P23BandejaConfirmacion from './paginas/P23BandejaConfirmacion';
import P25CierreCiclo from './paginas/P25CierreCiclo';
import P30GestionRetiros from './paginas/P30GestionRetiros';
import P26Configuracion from './paginas/P26Configuracion';
import P27GestionSocios from './paginas/P27GestionSocios';
import P28Reportes from './paginas/P28Reportes';
import P29Auditoria from './paginas/P29Auditoria';
import { EstadoVacio } from './piezas';
import { ShoppingBag, Award, Package, Wallet, Link as LinkIcon, User } from 'lucide-react';

export default function App() {
  return (
    <SesionProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/socio" replace />} />

        {/* Página de Inicio de Sesión (P-10) */}
        <Route path="/login" element={<P10InicioSesion />} />

        {/* Pantallas de estado de socio */}
        <Route path="/socio/espera" element={<PEspera />} />
        <Route path="/socio/suspendido" element={<PSuspendido />} />

        {/* Página de Catálogo Visual /kit */}
        <Route
          path="/kit"
          element={
            <div style={{ minHeight: '100vh', padding: 'var(--sp-4)', maxWidth: '1200px', margin: '0 auto' }}>
              <Kit />
            </div>
          }
        />

        {/* Rutas Backoffice Socio (Protegidas) */}
        <Route
          path="/socio"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P11PanelSocio />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/comisiones"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P14MisComisiones />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/red"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P12MiRed />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/tienda"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P13TiendaRecompra />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/rango"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P15MiRango />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/pedidos"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P17MisPedidos />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/billetera"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P19MiBilletera />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/enlace"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P16MiEnlace />
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/perfil"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <P18MiPerfil />
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
                <P20TableroAdmin />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/registrar-pedido"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P21RegistrarPedido />
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
                <P22RegistrarAfiliacion />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/registrar-afiliacion"
          element={<Navigate to="/admin/afiliacion" replace />}
        />
        <Route
          path="/admin/confirmacion"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P23BandejaConfirmacion />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/envios"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P24Envios />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/cierre"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P25CierreCiclo />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/retiros"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P30GestionRetiros />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/configuracion"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P26Configuracion />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/socios"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P27GestionSocios />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P28Reportes />
              </ArmazonAdmin>
            </RutaAdmin>
          }
        />
        <Route
          path="/admin/auditoria"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P29Auditoria />
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
