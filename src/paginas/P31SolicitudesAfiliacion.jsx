import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerSolicitudesAfiliacionAdmin,
  descartarSolicitudAfiliacion
} from '../servicios/operacionAdmin';
import { TarjetaDato, Tabla, InsigniaEstado, Boton, EstadoVacio } from '../piezas';
import {
  Inbox,
  UserCheck,
  UserX,
  MessageCircle,
  RefreshCw,
  Clock,
  Package,
  Share2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function P31SolicitudesAfiliacion() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Modal descartar
  const [solicitudADescartar, setSolicitudADescartar] = useState(null);
  const [motivoDescarte, setMotivoDescarte] = useState('');
  const [descartando, setDescartando] = useState(false);
  const [errorDescarte, setErrorDescarte] = useState(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  async function cargarSolicitudes() {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerSolicitudesAfiliacionAdmin();
      setSolicitudes(data || []);
    } catch (err) {
      console.error('Error al cargar solicitudes de afiliación:', err);
      setError(err.message || 'Error al cargar las solicitudes de afiliación.');
    } finally {
      setCargando(false);
    }
  }

  const handleAbrirWhatsApp = (solicitud) => {
    const tel = (solicitud.telefono || '').replace(/\D/g, '');
    const packNombre = solicitud.pack_codigo || 'Pack de Afiliación';
    const texto = `Hola ${solicitud.nombres}, te saludamos de Max Global Corporation respecto a tu solicitud de afiliación con el ${packNombre}. ¿Cómo estás?`;
    const waUrl = `https://wa.me/51${tel}?text=${encodeURIComponent(texto)}`;
    window.open(waUrl, '_blank');
  };

  const handleConvertir = (solicitud) => {
    navigate('/admin/afiliacion', {
      state: { solicitud }
    });
  };

  const handleConfirmarDescarte = async () => {
    if (!motivoDescarte.trim()) {
      setErrorDescarte('El motivo de descarte es obligatorio para auditar la operación.');
      return;
    }

    try {
      setDescartando(true);
      setErrorDescarte(null);
      await descartarSolicitudAfiliacion(solicitudADescartar.id, motivoDescarte.trim());
      setMensajeExito(`Solicitud #${solicitudADescartar.id} descartada correctamente.`);
      setSolicitudADescartar(null);
      setMotivoDescarte('');
      setTimeout(() => setMensajeExito(null), 4000);
      await cargarSolicitudes();
    } catch (err) {
      console.error('Error al descartar solicitud:', err);
      setErrorDescarte(err.message || 'No se pudo descartar la solicitud.');
    } finally {
      setDescartando(false);
    }
  };

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '—';
    const d = new Date(fechaIso);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columnas = [
    {
      key: 'solicitud',
      label: 'Prospecto',
      render: (f) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>
            {f.nombres} {f.apellidos}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            {f.documento ? `DNI: ${f.documento} · ` : ''}{f.email}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            Tel: {f.telefono}
          </div>
        </div>
      )
    },
    {
      key: 'pack',
      label: 'Pack Elegido',
      render: (f) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--gold-50)',
            border: '1px solid var(--gold-200)',
            color: 'var(--gold-800)',
            borderRadius: 'var(--r-pill)',
            padding: '4px 10px',
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          <Package size={12} />
          {f.pack_codigo || 'Sin especificar'}
        </span>
      )
    },
    {
      key: 'referido',
      label: 'Referido Por',
      render: (f) => {
        if (f.patrocinador) {
          return (
            <div>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                {f.patrocinador.nombres} {f.patrocinador.apellidos}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                {f.patrocinador.codigo}
              </div>
            </div>
          );
        }
        return (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Sin referido → Empresa
          </span>
        );
      }
    },
    {
      key: 'fecha',
      label: 'Cuándo Llegó',
      render: (f) => (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-strong)' }}>
          {formatearFecha(f.creado_en)}
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (f) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleAbrirWhatsApp(f)}
            title="Llamar o contactar por WhatsApp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--r-input)',
              border: 'none',
              backgroundColor: 'var(--whatsapp, #25D366)',
              color: '#FFFFFF',
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => handleConvertir(f)}
            title="Convertir en socio (lleva a P-22 con datos precargados)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: 'var(--r-input)',
              border: 'none',
              backgroundColor: 'var(--gold-500)',
              color: '#FFFFFF',
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <UserCheck size={14} />
            <span>Convertir</span>
          </button>

          <button
            onClick={() => {
              setSolicitudADescartar(f);
              setMotivoDescarte('');
              setErrorDescarte(null);
            }}
            title="Descartar solicitud"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--r-input)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--error, #DC2626)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <UserX size={14} />
            <span>Descartar</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="pagina-contenedor">
      {/* Header */}
      <div className="pagina-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
          <div>
            <span className="kit-header-badge">Panel Administración · P-31</span>
            <h1 className="pagina-titulo">Solicitudes de Afiliación</h1>
            <p className="pagina-subtitulo">
              Bandeja de prospectos que completaron el formulario en la landing page oficial
            </p>
          </div>
          <button
            onClick={cargarSolicitudes}
            disabled={cargando}
            className="btn btn-secundario"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={cargando ? 'icono-giratorio' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="panel-alerta panel-alerta-verde" style={{ marginBottom: 'var(--sp-4)' }}>
          <CheckCircle2 size={20} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="panel-alerta panel-alerta-rojo" style={{ marginBottom: 'var(--sp-4)' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjeta de Métricas */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Solicitudes Nuevas"
          valor={`${solicitudes.length}`}
          subrotulo="Prospectos pendientes de atención"
          icono={Inbox}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Con Referido"
          valor={`${solicitudes.filter(s => s.patrocinador_id).length}`}
          subrotulo="Asignadas a socios activos"
          icono={Share2}
          variante="verde"
        />
        <TarjetaDato
          rotulo="Directas a Empresa"
          valor={`${solicitudes.filter(s => !s.patrocinador_id).length}`}
          subrotulo="Sin código de patrocinio"
          icono={UserCheck}
          variante="apagada"
        />
      </div>

      {/* Contenido Principal */}
      {cargando ? (
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <RefreshCw size={28} className="icono-giratorio" style={{ color: 'var(--gold-500)', marginBottom: 'var(--sp-3)' }} />
          <p className="seccion-desc">Cargando solicitudes de afiliación...</p>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="panel-blanco" style={{ padding: 'var(--sp-8)' }}>
          <EstadoVacio
            icono={Inbox}
            titulo="No hay solicitudes nuevas pendientes"
            descripcion="Todos los prospectos registrados han sido contactados, convertidos en socios o descartados."
          />
        </div>
      ) : (
        <div className="panel-blanco" style={{ overflowX: 'auto' }}>
          <Tabla columnas={columnas} datos={solicitudes} claveId="id" />
        </div>
      )}

      {/* Modal Descartar Solicitud */}
      {solicitudADescartar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--sp-4)'
          }}
        >
          <div
            className="panel-blanco"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: 'var(--sp-6)',
              borderRadius: 'var(--r-card)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--sp-2)', color: 'var(--text-strong)' }}>
              Descartar Solicitud #{solicitudADescartar.id}
            </h3>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginBottom: 'var(--sp-4)' }}>
              Prospecto: <strong>{solicitudADescartar.nombres} {solicitudADescartar.apellidos}</strong> ({solicitudADescartar.email})
            </p>

            <label style={{ display: 'block', marginBottom: 'var(--sp-4)' }}>
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-strong)' }}>
                Motivo de descarte *
              </span>
              <textarea
                rows={3}
                required
                value={motivoDescarte}
                onChange={(e) => setMotivoDescarte(e.target.value)}
                placeholder="Ej. Datos de contacto inexistentes / No contesta / Prospecto desistió"
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px 12px',
                  borderRadius: 'var(--r-input)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)',
                  boxSizing: 'border-box'
                }}
              />
            </label>

            {errorDescarte && (
              <div style={{ color: 'var(--error, #DC2626)', fontSize: 'var(--fs-xs)', marginBottom: 'var(--sp-3)' }}>
                {errorDescarte}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)' }}>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setSolicitudADescartar(null)}
                disabled={descartando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-peligro"
                onClick={handleConfirmarDescarte}
                disabled={descartando || !motivoDescarte.trim()}
              >
                {descartando ? 'Descartando...' : 'Confirmar Descarte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
