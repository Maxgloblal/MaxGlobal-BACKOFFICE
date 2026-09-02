import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [socio, setSocio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorSesion, setErrorSesion] = useState(null);

  const cargarSocio = useCallback(async (email) => {
    if (!email) {
      setSocio(null);
      return { data: null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('socio')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        await supabase.auth.signOut();
        setSesion(null);
        setSocio(null);
        const err = new Error('Esta cuenta no está registrada como socio');
        setErrorSesion(err.message);
        return { data: null, error: err };
      }

      setSocio(data);
      setErrorSesion(null);
      return { data, error: null };
    } catch (err) {
      console.error('Error al cargar datos del socio:', err);
      setErrorSesion(err.message || 'Error al cargar socio');
      return { data: null, error: err };
    }
  }, []);

  useEffect(() => {
    let montado = true;

    async function inicializarSesion() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (montado) {
          setSesion(session);
          if (session?.user?.email) {
            await cargarSocio(session.user.email);
          } else {
            setSocio(null);
          }
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    }

    inicializarSesion();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (!montado) return;

      setSesion(session);
      if (session?.user?.email) {
        await cargarSocio(session.user.email);
      } else {
        setSocio(null);
      }
      setCargando(false);
    });

    return () => {
      montado = false;
      subscription?.unsubscribe();
    };
  }, [cargarSocio]);

  const entrar = async (email, password) => {
    setErrorSesion(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { data: null, error };
    }

    if (data?.session?.user?.email) {
      const resSocio = await cargarSocio(data.session.user.email);
      if (resSocio.error) {
        return { data: null, error: resSocio.error };
      }
      return { data: { ...data, socio: resSocio.data }, error: null };
    }

    return { data, error: null };
  };

  const salir = async () => {
    setErrorSesion(null);
    const { error } = await supabase.auth.signOut();
    setSesion(null);
    setSocio(null);
    return { error };
  };

  const esAdmin = Boolean(
    socio && (socio.rol === 'admin' || socio.rol === 'superadmin')
  );

  const valor = {
    sesion,
    socio,
    cargando,
    esAdmin,
    errorSesion,
    entrar,
    salir,
    recargarSocio: () => cargarSocio(sesion?.user?.email)
  };

  return (
    <SesionContext.Provider value={valor}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error('useSesion debe ser utilizado dentro de un SesionProvider');
  }
  return contexto;
}
