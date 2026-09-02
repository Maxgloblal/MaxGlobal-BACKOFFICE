import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TarjetaDato, Boton } from '../piezas';
import { obtenerPerfilSocio, obtenerDatosEnlace } from '../servicios/socio';
import {
  Link as LinkIcon,
  Copy,
  Check,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Share2,
  HelpCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

/**
 * P-16 · Mi Enlace de Patrocinio
 * Visualización y copia del enlace personal de referido (?ref=CODIGO).
 * 🔴 RF-263: Si es Kit Emprendedor, muestra advertencia de restricción de afiliación.
 */
export default function P16MiEnlace() {
  const [socio, setSocio] = useState(null);
  const [datosEnlace, setDatosEnlace] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        let perfil = socio;
        if (!perfil) {
          perfil = await obtenerPerfilSocio();
          if (!cancelado) setSocio(perfil);
        }
        const datos = await obtenerDatosEnlace(perfil.id);
        if (!cancelado) {
          setDatosEnlace(datos);
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar datos del enlace');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, []);

  if (cargando && !datosEnlace) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando enlace de patrocinio...</p>
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
            <h2 className="txt-gold txt-lg">Error al cargar enlace</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const socioActual = datosEnlace?.socio || {};
  const pack = socioActual.pack || {};
  const frontalesDirectos = datosEnlace?.frontalesDirectos || 0;
  const codigo = socioActual.codigo || 'MG00000';
  const soloAfiliaIgual = pack.solo_afilia_igual || false;

  // Formato oficial de URL de referido
  const dominioBase = typeof window !== 'undefined' ? window.location.origin : 'https://maxglobal.pe';
  const urlReferido = `${dominioBase}/registro?ref=${codigo}`;

  const handleCopiarEnlace = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(urlReferido);
      } else {
        const input = document.getElementById('input-url-referido');
        if (input) {
          input.select();
          document.execCommand('copy');
        }
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (err) {
      console.error('Fallo al copiar', err);
    }
  };

  const handleCompartirWhatsApp = () => {
    const texto = `¡Hola! Te invito a formar parte de Max Global Corporation y emprender juntos. Regístrate en mi equipo usando este enlace oficial:\n\n${urlReferido}\n\nCódigo de patrocinador: ${codigo}`;
    const urlWa = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWa, '_blank');
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <span className="kit-header-badge">Backoffice Socio · P-16</span>
        <h1 className="pagina-titulo">Mi Enlace de Patrocinio</h1>
        <p className="pagina-subtitulo">
          Comparte tu enlace oficial para registrar nuevos socios en tu equipo y hacer crecer tu red
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Tu Código de Patrocinio"
          valor={codigo}
          subrotulo="Identificador único en el sistema"
          icono={LinkIcon}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Afiliados Directos"
          valor={`${frontalesDirectos} socios`}
          subrotulo="Socios en tu Nivel 1"
          icono={Users}
          variante="verde"
        />
        <TarjetaDato
          rotulo="Tu Pack Actual"
          valor={pack.nombre || 'Sin Pack'}
          subrotulo={soloAfiliaIgual ? 'Restricción: solo afilia Kit' : 'Habilita todos los packs'}
          icono={Award}
        />
      </div>

      {/* 🔴 ADVERTENCIA CRÍTICA PARA KIT EMPRENDEDOR (RF-263) */}
      {soloAfiliaIgual ? (
        <div className="box-alerta-alerta" style={{ marginBottom: 'var(--sp-6)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
            <AlertTriangle size={24} style={{ color: 'var(--peligro)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 className="txt-md txt-bold" style={{ color: 'var(--peligro)', margin: '0 0 6px 0' }}>
                ⚠️ Restricción de Afiliación (Kit Emprendedor)
              </h3>
              <p className="txt-sm" style={{ margin: '0 0 8px 0', color: 'var(--texto-principal)', lineHeight: 1.5 }}>
                Como socio con <strong>Kit Emprendedor</strong>, tu enlace solo permite afiliar a nuevos socios que ingresen con el <strong>Kit Emprendedor</strong>.
                Si un invitado intenta registrarse con un Pack Ejecutivo o Gold, el sistema rechazará la afiliación por restricción del plan.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                <span className="txt-xs txt-muted">¿Deseas afiliar con todos los packs?</span>
                <Link
                  to="/socio/perfil"
                  className="txt-xs txt-bold"
                  style={{ color: 'var(--oro)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  Solicitar Mejora de Pack en Mi Perfil <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="box-alerta-exito" style={{ marginBottom: 'var(--sp-6)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--verde)' }} />
            <span className="txt-sm txt-bold" style={{ color: 'var(--verde)' }}>
              Enlace habilitado para afiliar con todos los Packs (Kit, Ejecutivo, Gold, Familiar, Empresarial).
            </span>
          </div>
        </div>
      )}

      {/* SECCIÓN PRINCIPAL: ENLACE PERSONAL Y ACCIONES */}
      <section className="pagina-seccion" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="panel-blanco" style={{ borderTop: '4px solid var(--oro)' }}>
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={20} style={{ color: 'var(--oro)' }} />
              Tu Enlace Oficial de Registro
            </h2>
            <p className="seccion-desc">
              Copia y envía este enlace a tus prospectos. Al registrarse, tu código de patrocinador quedará preasignado automáticamente.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
              <input
                id="input-url-referido"
                type="text"
                readOnly
                value={urlReferido}
                className="formulario-input"
                style={{ flex: 1, minWidth: '240px', fontWeight: 600, color: 'var(--oro)', backgroundColor: 'var(--fondo-suave)' }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={`formulario-boton ${copiado ? 'formulario-boton-primario' : 'formulario-boton-secundario'}`}
                onClick={handleCopiarEnlace}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: '140px', justifyContent: 'center' }}
              >
                {copiado ? (
                  <>
                    <Check size={16} /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copiar Enlace
                  </>
                )}
              </button>
              <button
                type="button"
                className="formulario-boton formulario-boton-primario"
                onClick={handleCompartirWhatsApp}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageCircle size={16} /> Compartir por WhatsApp
              </button>
            </div>

            {copiado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--verde)', fontSize: '13px', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>Enlace copiado al portapapeles. Listo para pegar y enviar.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GUÍA DE AFILIACIÓN PASO A PASO */}
      <section className="pagina-seccion">
        <div className="panel-blanco">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-3)' }}>
            <HelpCircle size={18} style={{ color: 'var(--info)' }} />
            <h3 className="txt-md txt-bold">¿Cómo funciona la afiliación con tu enlace?</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)', marginTop: 'var(--sp-3)' }}>
            <div style={{ padding: 'var(--sp-3)', backgroundColor: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)' }}>
              <div className="txt-bold txt-sm" style={{ color: 'var(--oro)', marginBottom: '4px' }}>1. Envías el enlace</div>
              <p className="txt-xs txt-muted" style={{ margin: 0 }}>
                Tu invitado ingresa al formulario de registro con tu código <strong>{codigo}</strong> asignado como patrocinador.
              </p>
            </div>
            <div style={{ padding: 'var(--sp-3)', backgroundColor: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)' }}>
              <div className="txt-bold txt-sm" style={{ color: 'var(--oro)', marginBottom: '4px' }}>2. Elige su Pack y Paga</div>
              <p className="txt-xs txt-muted" style={{ margin: 0 }}>
                Completa sus datos, selecciona su pack inicial y envía su comprobante de pago por WhatsApp a la empresa.
              </p>
            </div>
            <div style={{ padding: 'var(--sp-3)', backgroundColor: 'var(--fondo-suave)', borderRadius: 'var(--radius-md)' }}>
              <div className="txt-bold txt-sm" style={{ color: 'var(--oro)', marginBottom: '4px' }}>3. Cobras tu Comisión</div>
              <p className="txt-xs txt-muted" style={{ margin: 0 }}>
                Cuando Administración confirma el pago, el nuevo socio se activa en tu red y se calcula tu Bono de Patrocinio al instante.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
