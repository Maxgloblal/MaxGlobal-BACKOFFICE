﻿import React from 'react';
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
import P14MisComisiones from './paginas/P14MisComisiones';
import P12MiRed from './paginas/P12MiRed';
import P21RegistrarPedido from './paginas/P21RegistrarPedido';
import P22RegistrarAfiliacion from './paginas/P22RegistrarAfiliacion';
import P23BandejaConfirmacion from './paginas/P23BandejaConfirmacion';
import P25CierreCiclo from './paginas/P25CierreCiclo';
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
                <div className="pagina-contenedor">
                  <div className="pagina-header">
                    <span className="kit-header-badge">Backoffice Socio · P-13</span>
                    <h1 className="pagina-titulo">Tienda de Recompra</h1>
                    <p className="pagina-subtitulo">Precios con 50% de descuento socio (Pack Gold) y puntos en vivo</p>
                  </div>
                  <EstadoVacio
                    icono={ShoppingBag}
                    titulo="Catálogo de Recompra"
                    mensaje="Los productos estarán disponibles para compra en la Etapa 4."
                    accionTexto="Volver al Panel"
                    onAccion={() => window.location.href = '/socio'}
                  />
                </div>
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/rango"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <div className="pagina-contenedor">
                  <div className="pagina-header">
                    <span className="kit-header-badge">Backoffice Socio · P-15</span>
                    <h1 className="pagina-titulo">Mi Rango</h1>
                    <p className="pagina-subtitulo">Requisitos de calificación y avance hacia el siguiente rango</p>
                  </div>
                  <EstadoVacio
                    icono={Award}
                    titulo="Avance de Rango"
                    mensaje="Pantalla disponible en la Etapa 4 con barras de línea estirada."
                    accionTexto="Volver al Panel"
                    onAccion={() => window.location.href = '/socio'}
                  />
                </div>
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/pedidos"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <div className="pagina-contenedor">
                  <div className="pagina-header">
                    <span className="kit-header-badge">Backoffice Socio · P-17</span>
                    <h1 className="pagina-titulo">Mis Pedidos</h1>
                    <p className="pagina-subtitulo">Historial de compras personales y estado de envíos</p>
                  </div>
                  <EstadoVacio
                    icono={Package}
                    titulo="Historial de Pedidos"
                    mensaje="Pantalla en construcción para la Etapa 4."
                    accionTexto="Volver al Panel"
                    onAccion={() => window.location.href = '/socio'}
                  />
                </div>
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/billetera"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <div className="pagina-contenedor">
                  <div className="pagina-header">
                    <span className="kit-header-badge">Backoffice Socio · P-19</span>
                    <h1 className="pagina-titulo">Mi Billetera</h1>
                    <p className="pagina-subtitulo">Saldo disponible y solicitud de retiros bancarios</p>
                  </div>
                  <EstadoVacio
                    icono={Wallet}
                    titulo="Billetera y Retiros"
                    mensaje="Pantalla en construcción para la Etapa 4."
                    accionTexto="Volver al Panel"
                    onAccion={() => window.location.href = '/socio'}
                  />
                </div>
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/enlace"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <div className="pagina-contenedor">
                  <div className="pagina-header">
                    <span className="kit-header-badge">Backoffice Socio · P-16</span>
                    <h1 className="pagina-titulo">Mi Enlace de Patrocinio</h1>
                    <p className="pagina-subtitulo">Comparte tu enlace para afiliar nuevos miembros a tu red</p>
                  </div>
                  <EstadoVacio
                    icono={LinkIcon}
                    titulo="Enlace de Patrocinio"
                    mensaje="maxglobaloficial.com/?ref=MG-00417"
                    accionTexto="Volver al Panel"
                    onAccion={() => window.location.href = '/socio'}
                  />
                </div>
              </ArmazonSocio>
            </RutaProtegidaSocio>
          }
        />
        <Route
          path="/socio/perfil"
          element={
            <RutaProtegidaSocio>
              <ArmazonSocio>
                <div className="pagina-contenedor">
                  <div className="pagina-header">
                    <span className="kit-header-badge">Backoffice Socio · P-18</span>
                    <h1 className="pagina-titulo">Mi Perfil</h1>
                    <p className="pagina-subtitulo">Datos personales y configuración de cuenta</p>
                  </div>
                  <EstadoVacio
                    icono={User}
                    titulo="Perfil del Socio"
                    mensaje="Pantalla en construcción para la Etapa 4."
                    accionTexto="Volver al Panel"
                    onAccion={() => window.location.href = '/socio'}
                  />
                </div>
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
                <div className="pagina-contenedor">
                  <div className="pagina-header">
                    <span className="kit-header-badge">Panel Administración · P-20</span>
                    <h1 className="pagina-titulo">Tablero de Control</h1>
                    <p className="pagina-subtitulo">Métricas del ciclo en curso y accesos rápidos de gestión</p>
                  </div>
                  <div className="grid-dos-columnas">
                    <Link to="/admin/confirmacion" className="panel-blanco" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 className="seccion-titulo">Bandeja de Confirmación (P-23)</h3>
                      <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)' }}>
                        Revisar vouchers de pago y acreditar compras y comisiones pendientes.
                      </p>
                      <span className="btn btn-dorado" style={{ marginTop: 'var(--sp-3)', display: 'inline-flex' }}>
                        Abrir Bandeja →
                      </span>
                    </Link>
                    <Link to="/admin/cierre" className="panel-blanco" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 className="seccion-titulo">Cierre de Ciclo Mensual (P-25)</h3>
                      <p className="seccion-desc" style={{ marginTop: 'var(--sp-1)' }}>
                        Vista previa de liquidación de comisiones y ejecución irreversible del cierre.
                      </p>
                      <span className="btn btn-primario" style={{ marginTop: 'var(--sp-3)', display: 'inline-flex' }}>
                        Ir al Cierre de Ciclo →
                      </span>
                    </Link>
                  </div>
                </div>
              </ArmazonAdmin>
            </RutaAdmin>
          }
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
          path="/admin/cierre"
          element={
            <RutaAdmin>
              <ArmazonAdmin>
                <P25CierreCiclo />
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
