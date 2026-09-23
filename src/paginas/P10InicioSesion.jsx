import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSesion } from '../auth/SesionContext';
import { supabase } from '../lib/supabaseClient';
import { CampoTexto, Boton } from '../piezas/Formulario';
import { Lock, Mail, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function P10InicioSesion() {
  const { entrar, socio, sesion, cargando: cargandoSesion, esAdmin } = useSesion();
  const navigate = useNavigate();
  const location = useLocation();

  const [modo, setModo] = useState(location.state?.modoRecuperar ? 'recuperar' : 'login'); // 'login' | 'recuperar'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(location.state?.mensajeExito || null);
  const [procesando, setProcesando] = useState(false);

  // RF-202: Limitación de intentos fallidos en cliente
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  // Destino original antes de ser redirigido al login
  const destino = location.state?.from?.pathname || (esAdmin ? '/admin' : '/socio');

  useEffect(() => {
    // Si ya está autenticado y tiene socio cargado, redirigir
    if (!cargandoSesion && sesion && socio) {
      if (socio.estado === 'pendiente') {
        navigate('/socio/espera', { replace: true });
      } else if (socio.estado === 'suspendido') {
        navigate('/socio/suspendido', { replace: true });
      } else if (esAdmin) {
        navigate(destino === '/login' ? '/admin' : destino, { replace: true });
      } else {
        navigate(destino === '/login' ? '/socio' : destino, { replace: true });
      }
    }
  }, [cargandoSesion, sesion, socio, esAdmin, navigate, destino]);

  // Temporizador para bloqueo por intentos fallidos
  useEffect(() => {
    if (!bloqueadoHasta) return;

    const intervalo = setInterval(() => {
      const restante = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      if (restante <= 0) {
        setBloqueadoHasta(null);
        setSegundosRestantes(0);
        setIntentosFallidos(0);
        setError(null);
      } else {
        setSegundosRestantes(restante);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [bloqueadoHasta]);

  function traducirError(err) {
    if (!err) return null;
    const msg = (err.message || String(err)).toLowerCase();
    if (
      msg.includes('invalid login credentials') ||
      msg.includes('invalid_grant') ||
      msg.includes('invalid_credentials') ||
      msg.includes('invalid password')
    ) {
      return 'Correo o contraseña incorrectos';
    }
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
      return 'No hay conexión. Revisa tu internet e inténtalo de nuevo';
    }
    if (msg.includes('email not confirmed')) {
      return 'Por favor, confirma tu correo electrónico antes de ingresar';
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return 'Demasiados intentos fallidos. Por favor, espera unos minutos antes de intentar de nuevo.';
    }
    if (msg.includes('no está registrada como socio')) {
      return 'Esta cuenta no está registrada como socio';
    }
    return 'Correo o contraseña incorrectos';
  }

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    if (bloqueadoHasta && segundosRestantes > 0) return;

    setError(null);
    setMensajeExito(null);
    setProcesando(true);

    try {
      const { data, error: errAuth } = await entrar(email.trim(), password);

      if (errAuth) {
        const nuevosIntentos = intentosFallidos + 1;
        setIntentosFallidos(nuevosIntentos);

        if (nuevosIntentos >= 5) {
          const bloqueoMs = 60000;
          setBloqueadoHasta(Date.now() + bloqueoMs);
          setSegundosRestantes(60);
          setError('Demasiados intentos fallidos. Por favor, espera 60 segundos antes de intentar de nuevo.');
        } else {
          setError(traducirError(errAuth));
        }
      } else {
        setIntentosFallidos(0);
      }
    } catch (err) {
      setError(traducirError(err));
    } finally {
      setProcesando(false);
    }
  };

  const handleSubmitRecuperar = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);
    setProcesando(true);

    try {
      // RF-203 / TAREA-57: Recuperación de contraseña con destino en /nueva-contrasena
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/nueva-contrasena`
      });

      // Regla de seguridad: Siempre mostrar el mismo mensaje sin revelar existencia
      setMensajeExito(
        'Si ese correo está registrado, te llegará un enlace en unos minutos. ' +
        'Revisa también tu carpeta de spam o correo no deseado, y busca "Max Global".'
      );
    } catch (err) {
      if ((err.message || '').toLowerCase().includes('fetch')) {
        setError('No hay conexión. Revisa tu internet e inténtalo de nuevo');
      } else {
        setMensajeExito(
          'Si ese correo está registrado, te llegará un enlace en unos minutos. ' +
          'Revisa también tu carpeta de spam o correo no deseado, y busca "Max Global".'
        );
      }
    } finally {
      setProcesando(false);
    }
  };

  const estaBloqueado = Boolean(bloqueadoHasta && segundosRestantes > 0);

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
          maxWidth: '420px',
          background: 'var(--surface-card)',
          borderRadius: 'var(--r-tarjeta)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          padding: 'var(--sp-6)',
          boxSizing: 'border-box'
        }}
      >
        {/* Cabecera / Identidad */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--gold-100)',
              color: 'var(--gold-700)',
              marginBottom: 'var(--sp-3)'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1
            style={{
              fontSize: 'var(--fs-xl)',
              fontWeight: 700,
              color: 'var(--text-strong)',
              margin: '0 0 var(--sp-1) 0'
            }}
          >
            MAX GLOBAL
          </h1>
          <p
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-muted)',
              margin: 0
            }}
          >
            {modo === 'login' ? 'Sistema de Socios & Backoffice' : 'Recuperación de Contraseña'}
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-2)',
              padding: 'var(--sp-3)',
              borderRadius: 'var(--r-input)',
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              fontSize: 'var(--fs-sm)',
              marginBottom: 'var(--sp-4)'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {mensajeExito && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-2)',
              padding: 'var(--sp-3)',
              borderRadius: 'var(--r-input)',
              background: 'var(--success-soft)',
              color: 'var(--success)',
              fontSize: 'var(--fs-sm)',
              marginBottom: 'var(--sp-4)'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Formulario de Login (P-10) */}
        {modo === 'login' ? (
          <form onSubmit={handleSubmitLogin} noValidate>
            <CampoTexto
              id="input-email"
              label="Correo electrónico"
              type="email"
              placeholder="tu.correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={procesando || estaBloqueado}
            />

            <CampoTexto
              id="input-password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={procesando || estaBloqueado}
            />

            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: 'var(--sp-4)' }}>
              <button
                type="button"
                onClick={() => {
                  setModo('recuperar');
                  setError(null);
                  setMensajeExito(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-600)',
                  fontSize: 'var(--fs-xs)',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Boton
              type="submit"
              variante="primario"
              bloque
              disabled={procesando || estaBloqueado || !email || !password}
              cargando={procesando}
            >
              {estaBloqueado
                ? ('Espera ' + segundosRestantes + 's')
                : 'Iniciar Sesión'}
            </Boton>
          </form>
        ) : (
          /* Formulario de Recuperación de Contraseña (RF-203) */
          <form onSubmit={handleSubmitRecuperar} noValidate>
            <p
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--sp-4)',
                lineHeight: 1.5
              }}
            >
              Ingresa el correo electrónico asociado a tu cuenta de socio y te enviaremos un enlace de restablecimiento.
            </p>

            <CampoTexto
              id="input-email-recuperar"
              label="Correo electrónico"
              type="email"
              placeholder="tu.correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={procesando}
            />

            <Boton
              type="submit"
              variante="primario"
              bloque
              disabled={procesando || !email}
              cargando={procesando}
              style={{ marginBottom: 'var(--sp-3)' }}
            >
              Enviar enlace de recuperación
            </Boton>

            <div style={{ textAlign: 'center', marginTop: 'var(--sp-3)' }}>
              <button
                type="button"
                onClick={() => {
                  setModo('login');
                  setError(null);
                  setMensajeExito(null);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--sp-1)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-xs)',
                  cursor: 'pointer',
                  padding: 'var(--sp-2)'
                }}
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
