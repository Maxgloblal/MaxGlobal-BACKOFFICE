﻿import React from 'react';
import { useSesion } from '../auth/SesionContext';
import { Clock, LogOut } from 'lucide-react';
import { Boton } from '../piezas/Formulario';

export default function PEspera() {
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
            background: 'var(--gold-100)',
            color: 'var(--gold-700)',
            marginBottom: 'var(--sp-4)'
          }}
        >
          <Clock size={32} />
        </div>

        <h1
          style={{
            fontSize: 'var(--fs-xl)',
            fontWeight: 700,
            color: 'var(--text-strong)',
            marginBottom: 'var(--sp-2)'
          }}
        >
          Solicitud en Revisión
        </h1>

        <p
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--sp-4)'
          }}
        >
          Hola <strong>{socio?.nombres || 'Socio'}</strong>, tu registro se encuentra en estado <strong>Pendiente de Aprobación</strong>.
          La administración está validando tu afiliación y comprobante de pago.
        </p>

        <div
          style={{
            background: 'var(--bg-app)',
            borderRadius: 'var(--r-input)',
            padding: 'var(--sp-3)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            marginBottom: 'var(--sp-5)',
            textAlign: 'left'
          }}
        >
          <div><strong>Código temporal:</strong> {socio?.codigo || 'En asignación'}</div>
          <div><strong>Correo:</strong> {socio?.email}</div>
          <div><strong>Estado:</strong> Pendiente</div>
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
