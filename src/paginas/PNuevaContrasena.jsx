import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { cambiarPasswordSocio } from '../servicios/socio';
import { CampoTexto, Boton } from '../piezas/Formulario';
import { Lock, AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';

export default function PNuevaContrasena({ sbClient = supabase }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [verificando, setVerificando] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let montado = true;

    async function verificarSesionRecuperacion() {
      // 1. Detectar si la URL trae error de expiración de Supabase en hash o query
      const hash = location.hash || window.location.hash || '';
      const search = location.search || window.location.search || '';
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
      const searchParams = new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);
      const getParam = (k) => searchParams.get(k) || hashParams.get(k);

      if (getParam('error') || getParam('error_code')) {
        if (montado) {
          setSesionValida(false);
          setVerificando(false);
        }
        return;
      }

      // 2. Si la URL contiene access_token y refresh_token, inicializar sesión de recuperación
      const accessToken = getParam('access_token');
      const refreshToken = getParam('refresh_token');
      if (accessToken && refreshToken) {
        try {
          const { data: setData, error: setErr } = await sbClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (!setErr && setData?.session) {
            if (montado) {
              setSesionValida(true);
              setVerificando(false);
            }
            return;
          }
        } catch {
          // Continuar con getSession
        }
      }

      // 3. Verificar si hay indicadores de recuperación en el hash o búsqueda
      const esUrlRecuperacion = hash.includes('type=recovery') || 
                                search.includes('type=recovery') || 
                                search.includes('code=') ||
                                getParam('type') === 'recovery';

      // 3. Consultar sesión actual
      try {
        const { data: { session }, error: errSession } = await sbClient.auth.getSession();
        
        if (errSession) {
          if (montado) {
            setSesionValida(false);
            setVerificando(false);
          }
          return;
        }

        // Si hay sesión y proviene de recuperación o hay sesión activa en esta ruta
        if (session && (esUrlRecuperacion || hash.includes('access_token'))) {
          if (montado) {
            setSesionValida(true);
            setVerificando(false);
          }
          return;
        }

        // Si la URL no tiene ningún indicador de token de recuperación ni sesión
        if (!session && !esUrlRecuperacion) {
          if (montado) {
            setSesionValida(false);
            setVerificando(false);
          }
        }
      } catch (err) {
        if (montado) {
          setSesionValida(false);
          setVerificando(false);
        }
      }
    }

    verificarSesionRecuperacion();

    // 4. Suscripción a eventos de autenticación (evento PASSWORD_RECOVERY oficial)
    const { data: { subscription } } = sbClient.auth.onAuthStateChange((event, session) => {
      if (!montado) return;
      if (event === 'PASSWORD_RECOVERY') {
        setSesionValida(true);
        setVerificando(false);
      } else if (event === 'SIGNED_IN' && session) {
        const hash = window.location.hash || '';
        if (hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
          setSesionValida(true);
          setVerificando(false);
        }
      }
    });

    // Timeout de seguridad: si en 2.5s no se detecta sesión de recuperación, terminar verificación
    const timer = setTimeout(() => {
      if (montado && verificando) {
        setVerificando(false);
      }
    }, 2500);

    return () => {
      montado = false;
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, [sbClient, location.hash, location.search]);

  function traducirError(err) {
    if (!err) return null;
    const msg = (err.message || String(err)).toLowerCase();
    if (msg.includes('should be at least') || msg.includes('weak_password')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'No hay conexión. Revisa tu internet e inténtalo de nuevo';
    }
    return err.message || 'Error al actualizar la contraseña';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const claveLimpia = password.trim();
    if (claveLimpia.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (claveLimpia !== confirmPassword.trim()) {
      setError('Las contraseñas no coinciden. Verifícalas e inténtalo de nuevo');
      return;
    }

    setProcesando(true);

    try {
      // 1. Actualizar contraseña y marcar password_cambiada = true (vía socio.js)
      await cambiarPasswordSocio(claveLimpia, sbClient);

      // 2. Cerrar sesión de recuperación
      await sbClient.auth.signOut();

      // 3. Redirigir a login con aviso de éxito
      navigate('/login', {
        replace: true,
        state: {
          mensajeExito: '¡Contraseña actualizada con éxito! Ya puedes iniciar sesión con tu nueva clave.'
        }
      });
    } catch (err) {
      setError(traducirError(err));
      setProcesando(false);
    }
  };

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
        {/* Cabecera común */}
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
            <KeyRound size={28} />
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
            Definir Nueva Contraseña
          </p>
        </div>

        {/* Estado 1: Verificando enlace */}
        {verificando ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              Verificando enlace de recuperación...
            </p>
          </div>
        ) : !sesionValida ? (
          /* Estado 2: Enlace inválido, caducado o acceso directo sin sesión (RF-203) */
          <div data-testid="estado-enlace-invalido" style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                marginBottom: 'var(--sp-3)'
              }}
            >
              <ShieldAlert size={24} />
            </div>

            <h2
              style={{
                fontSize: 'var(--fs-md)',
                fontWeight: 700,
                color: 'var(--text-strong)',
                margin: '0 0 var(--sp-2) 0'
              }}
            >
              Enlace inválido o caducado
            </h2>

            <p
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: 'var(--sp-4)'
              }}
            >
              Por motivos de seguridad, los enlaces para restablecer contraseña solo pueden utilizarse una sola vez y expiran en breve.
            </p>

            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--sp-2)',
                padding: 'var(--sp-3)',
                borderRadius: 'var(--r-input)',
                background: 'var(--surface-subtle, #f8fafc)',
                color: 'var(--text-muted)',
                fontSize: 'var(--fs-xs)',
                marginBottom: 'var(--sp-5)',
                textAlign: 'left',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-muted)' }} />
              <span>
                Al solicitar un nuevo enlace, llegará en unos minutos. Revisa también tu carpeta de spam o correo no deseado y busca &quot;Max Global&quot;.
              </span>
            </div>

            <Boton
              type="button"
              variante="primario"
              bloque
              onClick={() => navigate('/login', { state: { modoRecuperar: true } })}
              data-testid="btn-solicitar-nuevo-enlace"
            >
              Solicitar nuevo enlace
            </Boton>

            <div style={{ marginTop: 'var(--sp-4)' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--sp-1)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-xs)',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          /* Estado 3: Formulario activo con sesión de recuperación válida */
          <form onSubmit={handleSubmit} noValidate data-testid="form-nueva-contrasena">
            <p
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--sp-4)',
                lineHeight: 1.5
              }}
            >
              Ingresa y confirma tu nueva contraseña de acceso.
            </p>

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

            <CampoTexto
              id="input-nueva-contrasena"
              label="Nueva contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={procesando}
            />

            <CampoTexto
              id="input-confirmar-contrasena"
              label="Confirmar nueva contraseña"
              type="password"
              placeholder="Repite tu nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={procesando}
            />

            <Boton
              type="submit"
              variante="primario"
              bloque
              disabled={procesando || !password || !confirmPassword}
              cargando={procesando}
              data-testid="btn-guardar-contrasena"
              style={{ marginTop: 'var(--sp-4)' }}
            >
              Guardar nueva contraseña
            </Boton>

            <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--sp-1)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-xs)',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={14} />
                Cancelar y volver al login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
