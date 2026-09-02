import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import P10InicioSesion from '../paginas/P10InicioSesion';
import { SesionContext } from '../auth/SesionContext';

describe('TAREA-05 · Bloque 2: Pantalla P-10 Inicio de Sesión', () => {
  const mockEntrar = vi.fn();
  const mockSalir = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderizar(valorContexto = {}) {
    const valorDefault = {
      sesion: null,
      socio: null,
      cargando: false,
      esAdmin: false,
      errorSesion: null,
      entrar: mockEntrar,
      salir: mockSalir,
      recargarSocio: vi.fn(),
      ...valorContexto
    };

    return render(
      <SesionContext.Provider value={valorDefault}>
        <MemoryRouter>
          <P10InicioSesion />
        </MemoryRouter>
      </SesionContext.Provider>
    );
  }

  it('renderiza correctamente el formulario de login con correo, contraseña y botón', () => {
    renderizar();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeDefined();
    expect(screen.getByLabelText(/Contraseña/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeDefined();
    expect(screen.getByText(/¿Olvidaste tu contraseña\?/i)).toBeDefined();
  });

  it('permite cambiar a la vista de recuperación de contraseña y volver', () => {
    renderizar();
    const btnOlvide = screen.getByText(/¿Olvidaste tu contraseña\?/i);
    fireEvent.click(btnOlvide);

    expect(screen.getByRole('button', { name: /Enviar enlace de recuperación/i })).toBeDefined();
    expect(screen.getByText(/Volver al inicio de sesión/i)).toBeDefined();

    const btnVolver = screen.getByText(/Volver al inicio de sesión/i);
    fireEvent.click(btnVolver);

    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeDefined();
  });

  it('muestra el mensaje de error en español ante credenciales incorrectas', async () => {
    mockEntrar.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid login credentials')
    });

    renderizar();

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'socio002@ejemplo.test' }
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'clave_invalida' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/Correo o contraseña incorrectos/i)).toBeDefined();
    });
  });

  it('bloquea los intentos en cliente al 5to intento fallido (RF-202)', async () => {
    mockEntrar.mockResolvedValue({
      data: null,
      error: new Error('Invalid login credentials')
    });

    renderizar();

    const inputEmail = screen.getByLabelText(/Correo electrónico/i);
    const inputPass = screen.getByLabelText(/Contraseña/i);

    fireEvent.change(inputEmail, { target: { value: 'socio002@ejemplo.test' } });
    fireEvent.change(inputPass, { target: { value: 'errada' } });

    for (let i = 0; i < 5; i++) {
      const btn = screen.getByRole('button', { name: /Iniciar Sesión|Espera/i });
      fireEvent.click(btn);
      await waitFor(() => expect(mockEntrar).toHaveBeenCalledTimes(i + 1));
    }

    await waitFor(() => {
      expect(screen.getByText(/Demasiados intentos fallidos/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Espera \d+s/i })).toBeDefined();
    });
  });
});
