import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { SesionProvider, useSesion } from '../auth/SesionContext';

describe('TAREASesionContext', () => {
  it('useSesion lanza un error claro si se usa fuera de un SesionProvider', () => {
    expect(() => {
      renderHook(() => useSesion());
    }).toThrow('useSesion debe ser utilizado dentro de un SesionProvider');
  });

  it('SesionProvider rinde con estado inicial', () => {
    function TestComponent() {
      const { cargando, sesion, socio, esAdmin } = useSesion();
      return (
        <div>
          <span data-testid="cargando">{cargando ? 'cargando' : 'listo'}</span>
          <span data-testid="esAdmin">{esAdmin ? 'si' : 'no'}</span>
        </div>
      );
    }

    render(
      <SesionProvider>
        <TestComponent />
      </SesionProvider>
    );

    expect(screen.getByTestId('cargando')).toBeDefined();
    expect(screen.getByTestId('esAdmin')).toBeDefined();
  });
});
