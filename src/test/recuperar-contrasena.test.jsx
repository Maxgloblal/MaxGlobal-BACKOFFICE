import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PNuevaContrasena from '../paginas/PNuevaContrasena';
import P10InicioSesion from '../paginas/P10InicioSesion';
import * as socioServicio from '../servicios/socio';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../auth/SesionContext', () => ({
  useSesion: () => ({
    entrar: vi.fn(),
    socio: null,
    sesion: null,
    cargando: false,
    esAdmin: false
  })
}));

describe('TAREA-57 · Recuperación de Contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    window.location.search = '';
  });

  describe('1. Pantalla /nueva-contrasena (PNuevaContrasena)', () => {
    it('Muestra estado de enlace inválido o caducado si NO hay sesión de recuperación y NO muestra el formulario', async () => {
      const mockSbClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
          updateUser: vi.fn(),
          signOut: vi.fn().mockResolvedValue({ error: null })
        }
      };

      render(
        <MemoryRouter>
          <PNuevaContrasena sbClient={mockSbClient} />
        </MemoryRouter>
      );

      // Esperar a que termine la verificación
      await waitFor(() => {
        expect(screen.getByTestId('estado-enlace-invalido')).toBeInTheDocument();
      });

      expect(screen.getByText(/Enlace inválido o caducado/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-solicitar-nuevo-enlace')).toBeInTheDocument();

      // 🔴 NUNCA debe dejar el formulario visible sin sesión válida
      expect(screen.queryByTestId('form-nueva-contrasena')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Nueva contraseña/i)).not.toBeInTheDocument();
    });

    it('Muestra el formulario si se recibe el evento PASSWORD_RECOVERY o hay sesión válida', async () => {
      let authCallback;
      const mockSbClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { id: 'usr-1', email: 'socio@test.com' } } },
            error: null
          }),
          onAuthStateChange: vi.fn().mockImplementation((cb) => {
            authCallback = cb;
            // Emitir evento PASSWORD_RECOVERY inmediatamente
            cb('PASSWORD_RECOVERY', { user: { id: 'usr-1', email: 'socio@test.com' } });
            return { data: { subscription: { unsubscribe: vi.fn() } } };
          }),
          updateUser: vi.fn(),
          signOut: vi.fn().mockResolvedValue({ error: null })
        }
      };

      render(
        <MemoryRouter>
          <PNuevaContrasena sbClient={mockSbClient} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-nueva-contrasena')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/^Nueva contraseña/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirmar nueva contraseña/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-guardar-contrasena')).toBeInTheDocument();
    });

    it('Valida que las contraseñas coincidan y tengan mínimo 6 caracteres', async () => {
      const mockSbClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { id: 'usr-1', email: 'socio@test.com' } } },
            error: null
          }),
          onAuthStateChange: vi.fn().mockImplementation((cb) => {
            cb('PASSWORD_RECOVERY', { user: { id: 'usr-1' } });
            return { data: { subscription: { unsubscribe: vi.fn() } } };
          }),
          updateUser: vi.fn(),
          signOut: vi.fn().mockResolvedValue({ error: null })
        }
      };

      render(
        <MemoryRouter>
          <PNuevaContrasena sbClient={mockSbClient} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-nueva-contrasena')).toBeInTheDocument();
      });

      const inputClave = screen.getByLabelText(/^Nueva contraseña/i);
      const inputRepetir = screen.getByLabelText(/Confirmar nueva contraseña/i);
      const btnGuardar = screen.getByTestId('btn-guardar-contrasena');

      // Clave corta (< 6 caracteres)
      fireEvent.change(inputClave, { target: { value: '123' } });
      fireEvent.change(inputRepetir, { target: { value: '123' } });
      fireEvent.click(btnGuardar);

      expect(await screen.findByText(/al menos 6 caracteres/i)).toBeInTheDocument();

      // Claves no coincidentes
      fireEvent.change(inputClave, { target: { value: 'Segura123' } });
      fireEvent.change(inputRepetir, { target: { value: 'OtraClaveDistinta' } });
      fireEvent.click(btnGuardar);

      expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });

    it('Al guardar: actualiza contraseña, cierra sesión de recuperación y redirige al login con mensaje', async () => {
      const mockUpdateUser = vi.fn().mockResolvedValue({
        data: { user: { email: 'socio@test.com' } },
        error: null
      });
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });

      const mockSbClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { id: 'usr-1', email: 'socio@test.com' } } },
            error: null
          }),
          onAuthStateChange: vi.fn().mockImplementation((cb) => {
            cb('PASSWORD_RECOVERY', { user: { id: 'usr-1', email: 'socio@test.com' } });
            return { data: { subscription: { unsubscribe: vi.fn() } } };
          }),
          updateUser: mockUpdateUser,
          signOut: mockSignOut
        },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };

      const spyCambiar = vi.spyOn(socioServicio, 'cambiarPasswordSocio');

      render(
        <MemoryRouter>
          <PNuevaContrasena sbClient={mockSbClient} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-nueva-contrasena')).toBeInTheDocument();
      });

      const inputClave = screen.getByLabelText(/^Nueva contraseña/i);
      const inputRepetir = screen.getByLabelText(/Confirmar nueva contraseña/i);
      const btnGuardar = screen.getByTestId('btn-guardar-contrasena');

      fireEvent.change(inputClave, { target: { value: 'NuevaClaveValida2026!' } });
      fireEvent.change(inputRepetir, { target: { value: 'NuevaClaveValida2026!' } });
      fireEvent.click(btnGuardar);

      await waitFor(() => {
        expect(spyCambiar).toHaveBeenCalledWith('NuevaClaveValida2026!', mockSbClient);
      });

      // Debe cerrar la sesión de recuperación
      expect(mockSignOut).toHaveBeenCalled();

      // Debe redirigir a /login con mensaje de éxito
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: expect.objectContaining({
          mensajeExito: expect.stringMatching(/éxito/i)
        })
      });
    });
  });

  describe('2. Cambios en P-10 (P10InicioSesion)', () => {
    it('resetPasswordForEmail usa redirectTo apuntando a /nueva-contrasena', async () => {
      const mockResetPassword = vi.fn().mockResolvedValue({ data: {}, error: null });

      // Mock de Supabase para este test
      vi.mock('../lib/supabaseClient', () => ({
        supabase: {
          auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
            resetPasswordForEmail: vi.fn()
          },
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          })
        }
      }));

      const { supabase } = await import('../lib/supabaseClient');
      supabase.auth.resetPasswordForEmail = mockResetPassword;

      render(
        <MemoryRouter initialEntries={['/login']}>
          <P10InicioSesion />
        </MemoryRouter>
      );

      // Cambiar a modo recuperación
      const btnOlvide = screen.getByText(/¿Olvidaste tu contraseña\?/i);
      fireEvent.click(btnOlvide);

      const inputEmail = screen.getByLabelText(/Correo electrónico/i);
      const btnEnviar = screen.getByText(/Enviar enlace de recuperación/i);

      fireEvent.change(inputEmail, { target: { value: 'socio_test@gmail.com' } });
      fireEvent.click(btnEnviar);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith(
          'socio_test@gmail.com',
          expect.objectContaining({
            redirectTo: expect.stringMatching(/\/nueva-contrasena$/)
          })
        );
      });
    });

    it('Muestra mensaje de éxito si proviene redirigido desde /nueva-contrasena', () => {
      render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { mensajeExito: '¡Contraseña actualizada con éxito!' } }]}>
          <P10InicioSesion />
        </MemoryRouter>
      );

      expect(screen.getByText(/¡Contraseña actualizada con éxito!/i)).toBeInTheDocument();
    });
  });
});
