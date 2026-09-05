import React, { useState, useEffect } from 'react';
import { formatearSoles } from '../utilidades/dinero';
import { TarjetaDato, Boton } from '../piezas';
import {
  obtenerPerfilSocio,
  obtenerPerfilCompleto,
  actualizarPerfilSocio,
  cambiarPasswordSocio,
  validarCuentaBancaria,
  validarCCI,
  obtenerCodigosBancoCci
} from '../servicios/socio';
import {
  User,
  Shield,
  CreditCard,
  KeyRound,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  MessageCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  Award
} from 'lucide-react';

const WHATSAPP_EMPRESA = '51993516053';

/**
 * P-18 · Mi Perfil
 * Gestión de datos personales, dirección de envío, cuenta bancaria, cambio de contraseña y Upgrade de pack.
 * 🔴 RF-285: El upgrade paga el pack completo.
 * 🔴 RF-286: El patrocinador NO se puede modificar.
 */
export default function P18MiPerfil() {
  const [datosPerfil, setDatosPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de Datos Personales
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [exitoPerfil, setExitoPerfil] = useState(false);

  // Formulario Bancario
  const [banco, setBanco] = useState('');
  const [cuentaBancaria, setCuentaBancaria] = useState('');
  const [codigoCci, setCodigoCci] = useState('');
  const [codigosBanco, setCodigosBanco] = useState(null);
  const [errorBanco, setErrorBanco] = useState(null);
  const [avisoBanco, setAvisoBanco] = useState(null);
  const [guardandoBanco, setGuardandoBanco] = useState(false);
  const [exitoBanco, setExitoBanco] = useState(false);

  // Formulario Contraseña
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [errorPass, setErrorPass] = useState(null);
  const [exitoPass, setExitoPass] = useState(false);

  // Modal / Selector de Upgrade
  const [packUpgradeSeleccionado, setPackUpgradeSeleccionado] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        const sesion = await obtenerPerfilSocio();
        const perfil = await obtenerPerfilCompleto(sesion.id);
        const configBancos = await obtenerCodigosBancoCci();
        if (!cancelado) {
          setDatosPerfil(perfil);
          if (configBancos) setCodigosBanco(configBancos);
          const s = perfil.socio;
          setTelefono(s.telefono || '');
          setDireccion(s.direccion || '');
          setCiudad(s.ciudad || '');
          setFechaNacimiento(s.fecha_nacimiento || '');
          setBanco(s.banco || '');
          setCuentaBancaria(s.cuenta_bancaria || '');
          setCodigoCci(s['cci'] || '');
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar perfil del socio');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, []);

  // Aviso de discrepancia entre banco seleccionado y prefijo del CCI (AVISO, NUNCA BLOQUEO)
  useEffect(() => {
    if (!codigosBanco || !banco || !codigoCci) {
      setAvisoBanco(null);
      return;
    }
    const soloDigitos = codigoCci.replace(/[\s-]/g, '');
    if (soloDigitos.length >= 3) {
      const prefijo = soloDigitos.slice(0, 3);
      const prefijosEsperados = codigosBanco[banco];
      if (prefijosEsperados && Array.isArray(prefijosEsperados) && !prefijosEsperados.includes(prefijo)) {
        setAvisoBanco(`El CCI que ingresaste no parece ser de ${banco}. Verifica que sea el correcto.`);
      } else {
        setAvisoBanco(null);
      }
    } else {
      setAvisoBanco(null);
    }
  }, [banco, codigoCci, codigosBanco]);

  if (cargando && !datosPerfil) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando información de tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco panel-alerta-cero-borde" style={{ padding: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <AlertCircle className="txt-gold" size={24} />
            <h2 className="txt-gold txt-lg">Error al cargar perfil</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const socio = datosPerfil?.socio || {};
  const packActual = socio.pack || {};
  const patrocinador = socio.patrocinador || {};
  const packs = datosPerfil?.packs || [];

  // Packs superiores disponibles para Upgrade
  const packsSuperiores = packs.filter((p) => (p.orden || 0) > (packActual.orden || 0));

  // Guardar Datos Personales y Dirección
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    try {
      setGuardandoPerfil(true);
      setExitoPerfil(false);
      await actualizarPerfilSocio(socio.id, {
        telefono,
        direccion,
        ciudad,
        banco,
        cuenta_bancaria: cuentaBancaria,
        ['cci']: codigoCci ? codigoCci.replace(/[\s-]/g, '') : null,
        fecha_nacimiento: fechaNacimiento
      });
      setExitoPerfil(true);
      setTimeout(() => setExitoPerfil(false), 3500);
    } catch (err) {
      alert('Error al guardar datos: ' + err.message);
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Guardar Datos Bancarios (RF-282 y TAREA-18)
  const handleGuardarBanco = async (e) => {
    e.preventDefault();
    setErrorBanco(null);

    const resCuenta = validarCuentaBancaria(cuentaBancaria);
    if (!resCuenta.valido) {
      setErrorBanco(resCuenta.error);
      return;
    }

    const resCci = validarCCI(codigoCci);
    if (!resCci.valido) {
      setErrorBanco(resCci.error);
      return;
    }

    try {
      setGuardandoBanco(true);
      setExitoBanco(false);
      await actualizarPerfilSocio(socio.id, {
        telefono,
        direccion,
        ciudad,
        banco,
        cuenta_bancaria: resCuenta.cuentaLimpia,
        ['cci']: resCci.cciLimpio,
        fecha_nacimiento: fechaNacimiento
      });
      if (resCci.cciLimpio) {
        setCodigoCci(resCci.cciLimpio);
      }
      setExitoBanco(true);
      setTimeout(() => setExitoBanco(false), 3500);
    } catch (err) {
      setErrorBanco(err.message || 'Error al guardar datos bancarios');
    } finally {
      setGuardandoBanco(false);
    }
  };

  // Cambiar Contraseña (RF-283)
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPass(null);
    setExitoPass(false);

    if (nuevaPassword.length < 6) {
      setErrorPass('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPass('Las contraseñas no coinciden');
      return;
    }

    try {
      setGuardandoPass(true);
      await cambiarPasswordSocio(nuevaPassword);
      setExitoPass(true);
      setNuevaPassword('');
      setConfirmarPassword('');
      setTimeout(() => setExitoPass(false), 3500);
    } catch (err) {
      setErrorPass(err.message || 'Error al actualizar contraseña');
    } finally {
      setGuardandoPass(false);
    }
  };

  // Solicitar Upgrade por WhatsApp (RF-285)
  const handleSolicitarUpgradeWhatsApp = (packDestino) => {
    let msg = `Hola Max Global, soy ${socio.nombres} ${socio.apellidos} (${socio.codigo}).\n`;
    msg += `Deseo solicitar una MEJORA DE PACK (Upgrade):\n\n`;
    msg += `• Pack actual: ${packActual.nombre || 'Sin Pack'}\n`;
    msg += `• Pack solicitado: ${packDestino.nombre}\n`;
    msg += `• Monto a pagar (Pack Completo): ${formatearSoles(packDestino.precio_cent)}\n\n`;
    msg += `Socio: ${socio.nombres} ${socio.apellidos}\n`;
    msg += `Código: ${socio.codigo}\n`;
    msg += `DNI: ${socio.documento || ''}\n`;
    msg += `Adjunto mi comprobante de depósito por el pack completo para su confirmación y activación inmediata.`;

    const url = `https://wa.me/${WHATSAPP_EMPRESA}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <span className="kit-header-badge">Backoffice Socio · P-18</span>
        <h1 className="pagina-titulo">Mi Perfil</h1>
        <p className="pagina-subtitulo">
          Configuración de datos personales, dirección de envío, cuenta bancaria y mejora de membresía
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Tu Código de Socio"
          valor={socio.codigo}
          subrotulo={`Registrado el ${socio.fecha_afiliacion || '-'}`}
          icono={User}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Pack Actual"
          valor={packActual.nombre || 'Sin Pack'}
          subrotulo={`${packActual.descuento_recompra_pct}% desc. en recompras`}
          icono={Award}
          variante="verde"
        />
        <TarjetaDato
          rotulo="Tu Patrocinador"
          valor={patrocinador.nombres ? `${patrocinador.nombres} ${patrocinador.apellidos}` : 'Empresa (Directo)'}
          subrotulo={patrocinador.codigo ? `Código: ${patrocinador.codigo}` : 'Línea de patrocinio'}
          icono={Shield}
        />
      </div>

      {/* SECCIÓN 1: DATOS PERSONALES Y DIRECCIÓN DE ENVÍO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
        <section className="panel-blanco">
          <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-4)' }}>
            <User size={20} style={{ color: 'var(--oro)' }} />
            Datos Personales y Contacto
          </h2>

          <form onSubmit={handleGuardarPerfil}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="formulario-label">Nombres:</label>
                <input type="text" className="formulario-input" value={socio.nombres || ''} disabled style={{ backgroundColor: 'var(--fondo-suave)', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="formulario-label">Apellidos:</label>
                <input type="text" className="formulario-input" value={socio.apellidos || ''} disabled style={{ backgroundColor: 'var(--fondo-suave)', cursor: 'not-allowed' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="formulario-label">DNI / Documento:</label>
                <input type="text" className="formulario-input" value={socio.documento || ''} disabled style={{ backgroundColor: 'var(--fondo-suave)', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="formulario-label">Correo Electrónico:</label>
                <input type="email" className="formulario-input" value={socio.email || ''} disabled style={{ backgroundColor: 'var(--fondo-suave)', cursor: 'not-allowed' }} />
              </div>
            </div>

            {/* 🔴 CAMPO PATROCINADOR BLOQUEADO (RF-286) */}
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="formulario-label" style={{ margin: 0 }}>Patrocinador Asignado:</label>
                <span className="txt-2xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Lock size={12} /> Inmutable por red
                </span>
              </div>
              <input
                type="text"
                className="formulario-input"
                value={patrocinador.nombres ? `${patrocinador.nombres} ${patrocinador.apellidos} (${patrocinador.codigo})` : 'Empresa'}
                disabled
                style={{ backgroundColor: 'var(--fondo-suave)', cursor: 'not-allowed', color: 'var(--texto-secundario)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="formulario-label">Teléfono / Celular:</label>
                <input
                  type="text"
                  className="formulario-input"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 993516053"
                />
              </div>
              <div>
                <label className="formulario-label">Fecha de Nacimiento:</label>
                <input
                  type="date"
                  className="formulario-input"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="formulario-label">Dirección de Envío por Defecto:</label>
              <input
                type="text"
                className="formulario-input"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Av. Principal 123, Dpto 402"
              />
            </div>

            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <label className="formulario-label">Ciudad / Departamento / Provincia:</label>
              <input
                type="text"
                className="formulario-input"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Lima, Perú"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
              <Boton type="submit" variante="primario" deshabilitado={guardandoPerfil}>
                {guardandoPerfil ? 'Guardando...' : 'Guardar Datos Personales'}
              </Boton>
              {exitoPerfil && (
                <span style={{ color: 'var(--verde)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Cambios guardados
                </span>
              )}
            </div>
          </form>
        </section>

        {/* SECCIÓN 2: DATOS BANCARIOS Y SEGURIDAD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {/* CUENTA BANCARIA PARA RETIROS (RF-282) */}
          <section className="panel-blanco">
            <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-3)' }}>
              <CreditCard size={20} style={{ color: 'var(--oro)' }} />
              Datos Bancarios para Retiro
            </h2>
            <p className="seccion-desc" style={{ marginBottom: 'var(--sp-3)' }}>
              Indica la cuenta donde recibirás tus pagos de comisiones solicitados en Mi Billetera.
            </p>

            <form onSubmit={handleGuardarBanco}>
              <div style={{ marginBottom: 'var(--sp-3)' }}>
                <label className="formulario-label">Entidad Bancaria:</label>
                <select
                  className="formulario-select"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                >
                  <option value="">-- Selecciona un banco --</option>
                  <option value="BCP">Banco de Crédito del Perú (BCP)</option>
                  <option value="BBVA">BBVA Perú</option>
                  <option value="Interbank">Interbank</option>
                  <option value="Scotiabank">Scotiabank</option>
                  <option value="Banco de la Nación">Banco de la Nación</option>
                  <option value="Otro">Otro Banco / Caja</option>
                </select>
              </div>

              <div style={{ marginBottom: 'var(--sp-3)' }}>
                <label className="formulario-label">Número de cuenta:</label>
                <input
                  type="text"
                  className="formulario-input"
                  value={cuentaBancaria}
                  onChange={(e) => {
                    setCuentaBancaria(e.target.value);
                    setErrorBanco(null);
                  }}
                  placeholder="Ej. 194-7426439033 (8 a 25 caracteres)"
                />
              </div>

              <div style={{ marginBottom: 'var(--sp-3)' }}>
                <label className="formulario-label">CCI (20 dígitos):</label>
                <input
                  type="text"
                  className="formulario-input"
                  value={codigoCci}
                  onChange={(e) => {
                    setCodigoCci(e.target.value);
                    setErrorBanco(null);
                  }}
                  placeholder="Ej. 011-366-000100032542-21 o 20 dígitos seguidos"
                  maxLength={25}
                />
              </div>

              {/* AVISO DEL BANCO: AVISO REACTIVO, NUNCA BLOQUEA (TAREA-18) */}
              {avisoBanco && (
                <div
                  className="panel-blanco"
                  style={{
                    borderLeft: '4px solid var(--alerta)',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    padding: 'var(--sp-3)',
                    marginBottom: 'var(--sp-3)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--alerta)' }}>
                    <AlertTriangle size={18} />
                    <span className="txt-xs txt-bold">⚠️ {avisoBanco}</span>
                  </div>
                </div>
              )}

              {/* ERROR DE VALIDACIÓN BANCARIA */}
              {errorBanco && (
                <div
                  style={{
                    color: 'var(--peligro)',
                    fontSize: '13px',
                    marginBottom: 'var(--sp-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorBanco}</span>
                </div>
              )}

              {/* MENSAJE INFORMATIVO OFICIAL CCI (TAREA-18) */}
              <div
                className="box-alerta-info"
                style={{
                  padding: 'var(--sp-3)',
                  marginBottom: 'var(--sp-4)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
                  <p className="txt-xs" style={{ margin: 0, color: 'var(--texto-secundario)' }}>
                    ℹ️ El CCI es obligatorio si tu banco es distinto al de la empresa. Lo encuentras en tu app bancaria o en tu estado de cuenta.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
                <Boton type="submit" variante="secundario" deshabilitado={guardandoBanco}>
                  {guardandoBanco ? 'Guardando...' : 'Guardar Cuenta Bancaria'}
                </Boton>
                {exitoBanco && (
                  <span style={{ color: 'var(--verde)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> Cuenta guardada
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* CAMBIO DE CONTRASEÑA (RF-283) */}
          <section className="panel-blanco">
            <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-3)' }}>
              <KeyRound size={20} style={{ color: 'var(--oro)' }} />
              Seguridad y Contraseña
            </h2>

            <form onSubmit={handleCambiarPassword}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                <div>
                  <label className="formulario-label">Nueva Contraseña:</label>
                  <input
                    type="password"
                    className="formulario-input"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="formulario-label">Confirmar Contraseña:</label>
                  <input
                    type="password"
                    className="formulario-input"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                  />
                </div>
              </div>

              {errorPass && (
                <div style={{ color: 'var(--peligro)', fontSize: '13px', marginBottom: 'var(--sp-2)' }}>
                  {errorPass}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
                <Boton type="submit" variante="secundario" deshabilitado={guardandoPass || !nuevaPassword}>
                  {guardandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Boton>
                {exitoPass && (
                  <span style={{ color: 'var(--verde)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> Contraseña actualizada
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* SECCIÓN 3: MEJORA DE PACK (UPGRADE) (RF-284 y RF-285) */}
      <section className="pagina-seccion">
        <div className="panel-blanco" style={{ borderTop: '4px solid var(--oro)' }}>
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--oro)' }} />
              Mejora de Membresía (Upgrade de Pack)
            </h2>
            <p className="seccion-desc">
              Mejora tu pack para desbloquear más niveles de comisiones residuales y bonos de patrocinio extendidos.
            </p>
          </div>

          {/* 🔴 AVISO OBLIGATORIO: PAGA PACK COMPLETO (RF-285) */}
          <div className="box-alerta-info" style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={20} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong className="txt-sm" style={{ color: 'var(--texto-principal)' }}>
                  Regla Oficial de Mejora de Pack (Respuesta 13.3)
                </strong>
                <p className="txt-sm" style={{ margin: '4px 0 0 0', color: 'var(--texto-secundario)' }}>
                  La mejora de membresía abona el <strong>precio del pack completo</strong> seleccionado (recibes todos los productos del pack y sus beneficios al 100%), <strong>NO la diferencia de precio</strong>.
                  Al solicitar la mejora, se abrirá WhatsApp para que envíes tu comprobante y Administración confirme tu nuevo pack.
                </p>
              </div>
            </div>
          </div>

          {/* LISTADO DE PACKS PARA UPGRADE */}
          {packsSuperiores.length === 0 ? (
            <div style={{ padding: 'var(--sp-4)', backgroundColor: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <Award size={32} style={{ color: 'var(--oro)', margin: '0 auto 8px auto' }} />
              <h3 className="txt-md txt-bold">¡Tienes el Pack Máximo!</h3>
              <p className="txt-sm txt-muted" style={{ margin: 0 }}>
                Cuentas con <strong>{packActual.nombre}</strong>, el cual ya te otorga los máximos beneficios y profundidad en la red.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
              {packsSuperiores.map((p) => (
                <div
                  key={p.id}
                  className="panel-blanco"
                  style={{
                    border: '1px solid var(--borde)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 'var(--sp-4)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-2)' }}>
                      <span className="txt-xs txt-muted" style={{ fontWeight: 600 }}>{p.codigo}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--verde)', backgroundColor: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '12px' }}>
                        {p.puntos_rango} PTS
                      </span>
                    </div>

                    <h3 className="txt-md txt-bold" style={{ marginBottom: '4px' }}>{p.nombre}</h3>
                    <div className="txt-xl txt-bold" style={{ color: 'var(--oro)', marginBottom: 'var(--sp-3)' }}>
                      {formatearSoles(p.precio_cent)}
                    </div>

                    <ul className="txt-xs txt-muted" style={{ paddingLeft: '16px', margin: '0 0 var(--sp-3) 0', lineHeight: 1.6 }}>
                      <li>Descuento recompra: <strong>{p.descuento_recompra_pct}%</strong></li>
                      <li>Niveles residual: <strong>Hasta nivel {p.niveles_residual}</strong></li>
                      <li>Niveles patrocinio: <strong>Hasta nivel {p.niveles_patrocinio}</strong></li>
                      {p.aplica_bono_global && <li>Califica para <strong>Bono Fondo Global</strong></li>}
                    </ul>
                  </div>

                  <Boton
                    variante="primario"
                    anchoCompleto
                    onClick={() => handleSolicitarUpgradeWhatsApp(p)}
                  >
                    <MessageCircle size={16} /> Solicitar Upgrade ({formatearSoles(p.precio_cent)})
                  </Boton>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
