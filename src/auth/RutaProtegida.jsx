﻿import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSesion } from './SesionContext';

export function RutaProtegidaSocio({ children, permitirInactivo = true }) {
  const { sesion, socio, cargando } = useSesion();
  const location = useLocation();

  if (cargando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
          gap: 'var(--sp-3)',
          fontFamily: 'var(--font-cuerpo)'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-subtle)',
            borderTopColor: 'var(--gold-500)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Cargando sesión...
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

  if (!sesion || !socio) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirecciones estrictas según estado del socio
  if (socio.estado === 'pendiente') {
    return <Navigate to="/socio/espera" replace />;
  }

  if (socio.estado === 'suspendido') {
    return <Navigate to="/socio/suspendido" replace />;
  }

  return children;
}

export function RutaAdmin({ children }) {
  const { sesion, socio, cargando, esAdmin } = useSesion();
  const location = useLocation();

  if (cargando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
          gap: 'var(--sp-3)',
          fontFamily: 'var(--font-cuerpo)'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-subtle)',
            borderTopColor: 'var(--gold-500)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Cargando panel de administración...
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

  if (!sesion || !socio) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!esAdmin) {
    // Un socio normal no puede entrar a /admin
    return <Navigate to="/socio" replace />;
  }

  return children;
}
