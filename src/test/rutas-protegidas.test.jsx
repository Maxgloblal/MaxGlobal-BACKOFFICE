import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SesionContext } from '../auth/SesionContext';
import { RutaProtegidaSocio, RutaAdmin } from '../auth/RutaProtegida';
import ArmazonSocio from '../armazon/ArmazonSocio';

describe('TAREA-05 · Bloque 3: Rutas Protegidas y Redirección por Estado', () => {
  function renderConRuta(valorContexto, rutaInicial = '/socio') {
    const valorDefault = {
      sesion: null,
      socio: null,
      cargando: false,
      esAdmin: false,
      errorSesion: null,
      entrar: () => {},
      salir: () => {},
      recargarSocio: () => {},
      ...valorContexto
    };

    return render(
      <SesionContext.Provider value={valorDefault}>
        <MemoryRouter initialEntries={[rutaInicial]}>
          <Routes>
            <Route path="/login" element={<div>Pantalla Login</div>} />
            <Route path="/socio/espera" element={<div>Pantalla Espera Pendiente</div>} />
            <Route path="/socio/suspendido" element={<div>Pantalla Suspendido</div>} />
            <Route
              path="/socio"
              element={
                <RutaProtegidaSocio>
                  <ArmazonSocio>
                    <div>Contenido Panel Socio</div>
                  </ArmazonSocio>
                </RutaProtegidaSocio>
              }
            />
            <Route
              path="/admin"
              element={
                <RutaAdmin>
                  <div>Contenido Panel Admin</div>
                </RutaAdmin>
              }
            />
          </Routes>
        </MemoryRouter>
      </SesionContext.Provider>
    );
  }

  it('1. Sin sesión: redirige al login', () => {
    renderConRuta({ sesion: null, socio: null, cargando: false }, '/socio');
    expect(screen.getByText('Pantalla Login')).toBeDefined();
  });

  it('2. Cargando: muestra spinner y no redirige prematuramente', () => {
    renderConRuta({ sesion: null, socio: null, cargando: true }, '/socio');
    expect(screen.getByText(/Cargando sesión.../i)).toBeDefined();
  });

  it('3. Socio pendiente: redirige a pantalla de espera (RF-207)', () => {
    renderConRuta(
      {
        sesion: { user: { email: 'socio022@ejemplo.test' } },
        socio: { id: 22, email: 'socio022@ejemplo.test', estado: 'pendiente', rol: 'socio' },
        cargando: false,
        esAdmin: false
      },
      '/socio'
    );
    expect(screen.getByText('Pantalla Espera Pendiente')).toBeDefined();
  });

  it('4. Socio suspendido: redirige a pantalla informativa (RF-209)', () => {
    renderConRuta(
      {
        sesion: { user: { email: 'socio031@ejemplo.test' } },
        socio: { id: 31, email: 'socio031@ejemplo.test', estado: 'suspendido', rol: 'socio' },
        cargando: false,
        esAdmin: false
      },
      '/socio'
    );
    expect(screen.getByText('Pantalla Suspendido')).toBeDefined();
  });

  it('5. Socio inactivo: ve su panel con aviso visible de inactividad (RF-208)', () => {
    renderConRuta(
      {
        sesion: { user: { email: 'socio028@ejemplo.test' } },
        socio: { id: 28, email: 'socio028@ejemplo.test', estado: 'inactivo', rol: 'socio', nombres: 'JUAN', apellidos: 'CASTRO' },
        cargando: false,
        esAdmin: false
      },
      '/socio'
    );
    expect(screen.getByText('Contenido Panel Socio')).toBeDefined();
    expect(screen.getByText(/Tu cuenta está inactiva en este ciclo/i)).toBeDefined();
  });

  it('6. Socio normal intentando entrar a /admin: es redirigido a /socio', () => {
    renderConRuta(
      {
        sesion: { user: { email: 'socio002@ejemplo.test' } },
        socio: { id: 2, email: 'socio002@ejemplo.test', estado: 'activo', rol: 'socio', nombres: 'ANA', apellidos: 'QUISPE' },
        cargando: false,
        esAdmin: false
      },
      '/admin'
    );
    expect(screen.getByText('Contenido Panel Socio')).toBeDefined();
  });

  it('7. Admin en /admin: accede al panel administrativo', () => {
    renderConRuta(
      {
        sesion: { user: { email: 'socio001@ejemplo.test' } },
        socio: { id: 1, email: 'socio001@ejemplo.test', estado: 'activo', rol: 'admin', nombres: 'MAXIMO', apellidos: 'ADMIN' },
        cargando: false,
        esAdmin: true
      },
      '/admin'
    );
    expect(screen.getByText('Contenido Panel Admin')).toBeDefined();
  });
});
