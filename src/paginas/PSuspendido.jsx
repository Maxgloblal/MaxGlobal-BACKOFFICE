﻿import React from 'react';
import { useSesion } from '../auth/SesionContext';
import { AlertOctagon, LogOut, Mail } from 'lucide-react';
import { Boton } from '../piezas/Formulario';

export default function PSuspendido() {
  const { socio, salir } = useSesion();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        padding: 'var(--sp-4)',
        fontFamily: 'var(--font-cuerpo)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--surface-card)',
          borderRadius: 'var(--r-tarjeta)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          padding: 'var(--sp-6)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            marginBottom: 'var(--sp-4)'
          }}
        >
          <AlertOctagon size={32} />
        </div>

        <h1
          style={{
            fontSize: 'var(--fs-xl)',
            fontWeight: 700,
            color: 'var(--text-strong)',
            marginBottom: 'var(--sp-2)'
          }}
        >
          Cuenta Suspendida
        </h1>

        <p
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--sp-4)'
          }}
        >
          Hola <strong>{socio?.nombres || 'Socio'}</strong>, tu cuenta de socio ha sido suspendida por el departamento de ética y administración de Max Global Corporation.
        </p>

        <div
          style={{
            background: 'var(--danger-soft)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: 'var(--r-input)',
            padding: 'var(--sp-3)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--danger)',
            marginBottom: 'var(--sp-5)',
            textAlign: 'left'
          }}
        >
          <div><strong>Motivo:</strong> Revisión administrativa de cumplimiento.</div>
          <div style={{ marginTop: '4px' }}>
            <strong>Contacto:</strong> Para apelar o solicitar información, comunícate con <a href="mailto:soporte@maxglobal.pe" style={{ color: 'var(--danger)', fontWeight: 600 }}>soporte@maxglobal.pe</a>.
          </div>
        </div>

        <Boton
          variante="secundario"
          bloque
          onClick={() => salir()}
          icono={LogOut}
        >
          Cerrar Sesión
        </Boton>
      </div>
    </div>
  );
}
