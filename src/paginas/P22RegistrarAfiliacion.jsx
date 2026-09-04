import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatearSoles } from '../utilidades/dinero';
import {
  CampoTexto,
  CampoSelect,
  Boton
} from '../piezas';
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import {
  buscarSocios,
  cargarPacks,
  registrarAfiliacionSocio
} from '../servicios/operacionAdmin';

export default function P22RegistrarAfiliacion() {
  const navigate = useNavigate();

  // 1. Patrocinador (RF-331)
  const [terminoPatrocinador, setTerminoPatrocinador] = useState('');
  const [resultadosPatrocinador, setResultadosPatrocinador] = useState([]);
  const [buscandoPatrocinador, setBuscandoPatrocinador] = useState(false);
  const [patrocinadorSeleccionado, setPatrocinadorSeleccionado] = useState(null);
  const [patrocinadorConfirmado, setPatrocinadorConfirmado] = useState(false);

  // 2. Packs (RF-332)
  const [packs, setPacks] = useState([]);
  const [packSeleccionadoId, setPackSeleccionadoId] = useState('');
  const [cargandoPacks, setCargandoPacks] = useState(true);

  // 3. Datos Personales del Nuevo Socio (RF-330)
  const [tipoDocumento, setTipoDocumento] = useState('DNI');
  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');

  // 4. Comprobante de Pago / Voucher Inicial (RF-315)
  const [banco, setBanco] = useState('BCP');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [fechaDeposito, setFechaDeposito] = useState(new Date().toISOString().split('T')[0]);
  const [imagenVoucherUrl, setImagenVoucherUrl] = useState('');

  // Estado de procesamiento y ?xito
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);
  const [afiliacionExitosa, setAfiliacionExitosa] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const dataPacks = await cargarPacks();
        setPacks(dataPacks);
        if (dataPacks.length > 0) {
          setPackSeleccionadoId(String(dataPacks[0].id));
        }
      } catch (err) {
        console.error('Error al cargar packs:', err);
      } finally {
        setCargandoPacks(false);
      }
    }
    cargar();
  }, []);

  // Búsqueda de patrocinador con debounce
  useEffect(() => {
    if (!terminoPatrocinador.trim() || patrocinadorSeleccionado) {
      setResultadosPatrocinador([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoPatrocinador(true);
      try {
        const res = await buscarSocios(terminoPatrocinador);
        setResultadosPatrocinador(res);
      } catch (err) {
        console.error('Error al buscar patrocinador:', err);
      } finally {
        setBuscandoPatrocinador(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [terminoPatrocinador, patrocinadorSeleccionado]);

  const handleSeleccionarPatrocinador = (pat) => {
    setPatrocinadorSeleccionado(pat);
    setPatrocinadorConfirmado(false);
    setResultadosPatrocinador([]);
    setTerminoPatrocinador('');

    // RF-332: Restricción si el patrocinador es Emprendedor
    if (pat.pack?.codigo === 'EMPRENDEDOR' || pat.pack?.solo_afilia_igual) {
      const packEmprendedor = packs.find((p) => p.codigo === 'EMPRENDEDOR');
      if (packEmprendedor) {
        setPackSeleccionadoId(String(packEmprendedor.id));
      }
    }
  };

  const handleCambiarPatrocinador = () => {
    setPatrocinadorSeleccionado(null);
    setPatrocinadorConfirmado(false);
  };

  // Determinar si aplica la restricción de Kit Emprendedor (RF-332)
  const esPatrocinadorEmprendedor = Boolean(
    patrocinadorSeleccionado &&
      (patrocinadorSeleccionado.pack?.codigo === 'EMPRENDEDOR' ||
        patrocinadorSeleccionado.pack?.solo_afilia_igual)
  );

  const packElegido = packs.find((p) => String(p.id) === String(packSeleccionadoId));
  const precioPackCent = Number(packElegido?.precio_cent || 0);

  const opcionesPacks = packs
    .filter((p) => {
      if (esPatrocinadorEmprendedor) {
        return p.codigo === 'EMPRENDEDOR';
      }
      return true;
    })
    .map((p) => ({
      value: String(p.id),
      label: p.nombre + ' (' + formatearSoles(p.precio_cent) + ')'
    }));

  const handleSubmitAfiliacion = async (e) => {
    e.preventDefault();

    if (!patrocinadorSeleccionado || !patrocinadorConfirmado) {
      setErrorGuardado('Debes confirmar visualmente al patrocinador (RF-331).');
      return;
    }
    if (!documento.trim() || !nombres.trim() || !apellidos.trim() || !email.trim()) {
      setErrorGuardado('Por favor completa todos los datos obligatorios del socio.');
      return;
    }
    if (!numeroOperacion.trim()) {
      setErrorGuardado('El número de operación bancaria es obligatorio para el pago del pack de afiliación.');
      return;
    }

    if (esPatrocinadorEmprendedor && packElegido?.codigo !== 'EMPRENDEDOR') {
      setErrorGuardado('Restricción RF-332: El patrocinador tiene Kit Emprendedor y solo puede afiliar nuevos socios con Kit Emprendedor.');
      return;
    }

    setErrorGuardado(null);
    setGuardando(true);

    try {
      const voucherPayload = {
        banco,
        numero_operacion: numeroOperacion.trim(),
        monto_cent: montoDeclarado ? Math.round(parseFloat(montoDeclarado) * 100) : precioPackCent,
        fecha_deposito: fechaDeposito,
        imagen_url: imagenVoucherUrl.trim() || 'https://placehold.co/400x300?text=Voucher+Afiliacion'
      };

      const res = await registrarAfiliacionSocio({
        patrocinadorId: patrocinadorSeleccionado.id,
        packId: Number(packSeleccionadoId),
        tipoDocumento,
        documento: documento.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        fechaNacimiento: fechaNacimiento || null,
        direccion: direccion.trim(),
        departamento: departamento.trim(),
        provincia: provincia.trim(),
        distrito: distrito.trim(),
        voucher: voucherPayload,
        canal: 'oficina'
      });

      if (res && res.exito) {
        setAfiliacionExitosa(res);
      } else {
        throw new Error(res?.mensaje || 'No se pudo completar la afiliación.');
      }
    } catch (err) {
      setErrorGuardado(err.message || 'Error al afiliar socio.');
    } finally {
      setGuardando(false);
    }
  };

  if (afiliacionExitosa) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', maxWidth: '540px', margin: 'var(--sp-6) auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-soft)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--sp-4)'
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h2 className="pagina-titulo" style={{ margin: '0 0 var(--sp-2) 0' }}>
            ¡Socio Afiliado Exitosamente!
          </h2>
          <p className="txt-sm txt-muted" style={{ marginBottom: 'var(--sp-4)' }}>
            Se ha creado el registro del socio en estado <strong>pendiente</strong> (RF-334) y su cuenta en Supabase Auth.
          </p>

          <div
            style={{
              background: 'var(--bg-app)',
              borderRadius: 'var(--r-input)',
              padding: 'var(--sp-4)',
              textAlign: 'left',
              fontSize: 'var(--fs-sm)',
              marginBottom: 'var(--sp-5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Código Asignado (RF-335):</span>
              <strong className="txt-gold" style={{ fontSize: 'var(--fs-base)' }}>{afiliacionExitosa.codigo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Socio:</span>
              <strong>{afiliacionExitosa.nombres}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Pack Afiliado:</span>
              <strong>{afiliacionExitosa.pack_nombre}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="txt-muted">Orden de Afiliación:</span>
              <strong>{afiliacionExitosa.orden_codigo} (por_confirmar)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="txt-muted">Monto del Pack:</span>
              <strong>{formatearSoles(afiliacionExitosa.total_cent)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            <Boton
              variante="secundario"
              bloque
              onClick={() => {
                setAfiliacionExitosa(null);
                setPatrocinadorSeleccionado(null);
                setPatrocinadorConfirmado(false);
                setDocumento('');
                setNombres('');
                setApellidos('');
                setEmail('');
                setTelefono('');
                setNumeroOperacion('');
                setMontoDeclarado('');
              }}
            >
              Afiliar Otro Socio
            </Boton>
            <Boton
              variante="primario"
              bloque
              icono={ArrowRight}
              onClick={() => navigate('/admin/confirmacion')}
            >
              Ir a Confirmar Pago
            </Boton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-contenedor">
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-22</span>
        <h1 className="pagina-titulo">Registrar Afiliación de Socio</h1>
        <p className="pagina-subtitulo">
          Alta de un nuevo socio en la red con asignación de patrocinador y pack inicial
        </p>
      </div>

      {errorGuardado && (
        <div
          role="alert"
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--r-input)',
            marginBottom: 'var(--sp-4)',
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            fontSize: 'var(--fs-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2)'
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorGuardado}</span>
        </div>
      )}

      <form onSubmit={handleSubmitAfiliacion}>
        <div className="grid-dos-columnas" style={{ alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {/* 1. SELECCIÓN DE PATROCINADOR (RF-331) */}
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                1. Patrocinador en la Red
              </h3>

              {!patrocinadorSeleccionado ? (
                <div>
                  <CampoTexto
                    id="busqueda-patrocinador"
                    label="Buscar patrocinador por código, nombre o DNI"
                    placeholder="Ej. MG00002, Ana Quispe..."
                    value={terminoPatrocinador}
                    onChange={(e) => setTerminoPatrocinador(e.target.value)}
                  />

                  {buscandoPatrocinador && <p className="txt-xs txt-muted">Buscando patrocinadores...</p>}

                  {resultadosPatrocinador.length > 0 && (
                    <div
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--r-input)',
                        overflow: 'hidden',
                        marginTop: 'var(--sp-2)'
                      }}
                    >
                      {resultadosPatrocinador.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSeleccionarPatrocinador(s)}
                          style={{
                            padding: 'var(--sp-2) var(--sp-3)',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fff'
                          }}
                        >
                          <div>
                            <strong>{s.nombres} {s.apellidos}</strong> ({s.codigo})
                            <div className="txt-xs txt-muted">Pack: {s.pack?.nombre} · DNI: {s.documento}</div>
                          </div>
                          <span className="armazon-badge-rango">{s.estado}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: patrocinadorConfirmado ? 'var(--success-soft)' : 'var(--gold-100)',
                    border: '1px solid ' + (patrocinadorConfirmado ? 'var(--success)' : 'var(--gold-400)'),
                    borderRadius: 'var(--r-tarjeta)',
                    padding: 'var(--sp-4)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="kit-estado-label">Patrocinador Asignado</span>
                      <h4 style={{ margin: '4px 0', fontSize: 'var(--fs-lg)' }}>
                        {patrocinadorSeleccionado.nombres} {patrocinadorSeleccionado.apellidos}
                      </h4>
                      <div className="txt-xs txt-muted" style={{ lineHeight: 1.6 }}>
                        <div><strong>Código:</strong> {patrocinadorSeleccionado.codigo} · <strong>DNI:</strong> {patrocinadorSeleccionado.documento}</div>
                        <div><strong>Pack Actual:</strong> {patrocinadorSeleccionado.pack?.nombre}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCambiarPatrocinador}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: 'var(--fs-xs)',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Cambiar
                    </button>
                  </div>

                  {esPatrocinadorEmprendedor && (
                    <div
                      style={{
                        background: 'var(--danger-soft)',
                        color: 'var(--danger)',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--r-input)',
                        fontSize: 'var(--fs-xs)',
                        marginTop: 'var(--sp-2)'
                      }}
                    >
                      ⚠️ <strong>Restricción RF-332:</strong> El patrocinador tiene Kit Emprendedor. Solo puede afiliar nuevos socios con Kit Emprendedor.
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 'var(--sp-3)',
                      paddingTop: 'var(--sp-3)',
                      borderTop: '1px solid rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sp-2)'
                    }}
                  >
                    <input
                      type="checkbox"
                      id="check-confirmar-patrocinador"
                      checked={patrocinadorConfirmado}
                      onChange={(e) => setPatrocinadorConfirmado(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="check-confirmar-patrocinador"
                      style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Confirmo visualmente que {patrocinadorSeleccionado.nombres} {patrocinadorSeleccionado.apellidos} es el patrocinador oficial (RF-331).
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 2. ELECCIÓN DEL PACK DE INGRESO (RF-332) */}
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                2. Pack de Afiliación
              </h3>

              {cargandoPacks ? (
                <p className="txt-xs txt-muted">Cargando packs oficiales...</p>
              ) : (
                <div>
                  <CampoSelect
                    id="pack-afiliacion"
                    label="Selecciona el Pack de Ingreso"
                    value={packSeleccionadoId}
                    onChange={(e) => setPackSeleccionadoId(e.target.value)}
                    opciones={opcionesPacks}
                  />

                  {packElegido && (
                    <div
                      style={{
                        background: 'var(--gold-100)',
                        padding: 'var(--sp-3)',
                        borderRadius: 'var(--r-input)',
                        fontSize: 'var(--fs-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="txt-muted">Precio del Pack:</span>
                        <strong className="txt-gold">{formatearSoles(packElegido.precio_cent)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="txt-muted">Puntos de Calificación:</span>
                        <strong>{packElegido.puntos_rango || 0} pts</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="txt-muted">Descuento Recompra:</span>
                        <strong>{packElegido.descuento_recompra_pct}%</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {/* 3. DATOS PERSONALES DEL SOCIO (RF-330, RF-333) */}
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                <UserPlus size={18} />
                <span>3. Datos Personales del Nuevo Socio</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--sp-2)' }}>
                <CampoSelect
                  id="tipo-doc"
                  label="Tipo Doc"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  opciones={[
                    { value: 'DNI', label: 'DNI' },
                    { value: 'CE', label: 'Carné Ext.' },
                    { value: 'PASAPORTE', label: 'Pasaporte' }
                  ]}
                />
                <CampoTexto
                  id="documento"
                  label="Número de Documento"
                  placeholder="Ej. 74859612"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                <CampoTexto
                  id="nombres"
                  label="Nombres"
                  placeholder="Ej. Carlos"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                />
                <CampoTexto
                  id="apellidos"
                  label="Apellidos"
                  placeholder="Ej. Mendoza"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                <CampoTexto
                  id="email"
                  label="Correo Electrónico (Auth)"
                  type="email"
                  placeholder="carlos.mendoza@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <CampoTexto
                  id="telefono"
                  label="Teléfono Móvil"
                  placeholder="987654321"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-2)' }}>
                <CampoTexto
                  id="departamento"
                  label="Departamento"
                  placeholder="Lima"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                />
                <CampoTexto
                  id="provincia"
                  label="Provincia"
                  placeholder="Lima"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                />
                <CampoTexto
                  id="distrito"
                  label="Distrito"
                  placeholder="San Isidro"
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                />
              </div>

              <CampoTexto
                id="direccion"
                label="Dirección Domiciliaria"
                placeholder="Av. Los Laureles 450"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>

            {/* 4. COMPROBANTE DE PAGO DEL PACK (RF-315) */}
            <div className="panel-blanco">
              <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-3)' }}>
                <Receipt size={18} />
                <span>4. Comprobante de Pago del Pack</span>
              </h3>

              <CampoSelect
                id="banco-pack"
                label="Banco de Depósito"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                opciones={[
                  { value: 'BCP', label: 'BCP - Banco de Crédito' },
                  { value: 'BBVA', label: 'BBVA Continental' },
                  { value: 'Interbank', label: 'Interbank' },
                  { value: 'Scotiabank', label: 'Scotiabank' },
                  { value: 'Banco de la Nación', label: 'Banco de la Nación' },
                  { value: 'Yape', label: 'Yape' },
                  { value: 'Plin', label: 'Plin' }
                ]}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                <CampoTexto
                  id="num-operacion-pack"
                  label="Número de Operación"
                  placeholder="Ej. 10000502"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  required
                />
                <CampoTexto
                  id="fecha-deposito-pack"
                  label="Fecha de Depósito"
                  type="date"
                  value={fechaDeposito}
                  onChange={(e) => setFechaDeposito(e.target.value)}
                />
              </div>

              <CampoTexto
                id="monto-declarado-pack"
                label="Monto Depositado (S/.)"
                placeholder={(precioPackCent / 100).toFixed(2)}
                value={montoDeclarado}
                onChange={(e) => setMontoDeclarado(e.target.value)}
              />
            </div>

            <Boton
              type="submit"
              variante="primario"
              bloque
              disabled={guardando || !patrocinadorConfirmado || !documento.trim() || !nombres.trim() || !email.trim() || !numeroOperacion.trim()}
              cargando={guardando}
            >
              Registrar Afiliación (Queda Pendiente)
            </Boton>
          </div>
        </div>
      </form>
    </div>
  );
}
