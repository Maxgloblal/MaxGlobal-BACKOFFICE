import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TarjetaDato, Boton, InsigniaEstado, EstadoVacio } from '../piezas';
import { obtenerPerfilSocio, obtenerCiclos, obtenerMiRed, formatearNombreCiclo } from '../servicios/socio';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  User,
  AlertCircle,
  Award,
  Zap,
  ListTree
} from 'lucide-react';

/**
 * Componente recursivo para vista de árbol en pantallas de escritorio
 */
function RamaArbol({ nodo, todosLosNodos, nivel = 0, esRaiz = false }) {
  const [expandido, setExpandido] = useState(nivel < 2);
  const hijos = todosLosNodos.filter((n) => n.patrocinador_id === nodo.id && n.id !== nodo.id);
  const tieneHijos = hijos.length > 0;
  const estaActivo = nodo.activo;

  return (
    <div className="nodo-arbol-contenedor" style={{ marginLeft: nivel === 0 ? 0 : '16px' }}>
      <div className={`nodo-arbol-item ${estaActivo ? 'activo' : 'inactivo'}`}>
        <div className="nodo-arbol-izq">
          {tieneHijos ? (
            <button
              type="button"
              className="nodo-arbol-btn-expand"
              onClick={() => setExpandido(!expandido)}
              aria-label={expandido ? 'Colapsar rama' : 'Expandir rama'}
            >
              {expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div style={{ width: '28px', display: 'flex', justifyContent: 'center' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: estaActivo ? 'var(--verde)' : 'var(--peligro)'
                }}
              />
            </div>
          )}

          <div className="nodo-arbol-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span className="nodo-arbol-nombre">{nodo.nombre}</span>
              {esRaiz && (
                <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: 'var(--gold-100)', color: 'var(--gold-600)', padding: '1px 6px', borderRadius: '4px' }}>
                  [TÚ]
                </span>
              )}
              {nodo.esFrontal && (
                <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--verde)', padding: '1px 6px', borderRadius: '4px' }}>
                  Frontal (Niv. 1)
                </span>
              )}
              {nodo.nivel > 1 && (
                <span style={{ fontSize: '10px', color: 'var(--texto-apagado)' }}>
                  Nivel {nodo.nivel}
                </span>
              )}
            </div>
            <div className="nodo-arbol-meta">
              <span>{nodo.codigo}</span>
              <span>·</span>
              <span>{nodo.pack_nombre}</span>
              <span>·</span>
              <strong>{nodo.puntos} pts</strong>
            </div>
          </div>
        </div>

        <div className="nodo-arbol-der">
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: estaActivo ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: estaActivo ? 'var(--verde)' : 'var(--peligro)'
            }}
          >
            {estaActivo ? '🟢 Activo' : '🔴 Sin activar'}
          </span>
        </div>
      </div>

      {tieneHijos && expandido && (
        <div style={{ borderLeft: '1px dashed var(--borde)', marginLeft: '14px', paddingLeft: '8px' }}>
          {hijos.map((hijo) => (
            <RamaArbol
              key={hijo.id}
              nodo={hijo}
              todosLosNodos={todosLosNodos}
              nivel={nivel + 1}
              esRaiz={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * P-12 · Mi Red
 * Visualización del árbol de afiliados multinivel y navegación por niveles en móvil (RF-224).
 * Garantía de Protección de Datos Personales (Ley 29733).
 */
export default function P12MiRed() {
  const navigate = useNavigate();
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [socio, setSocio] = useState(null);
  const [datosRed, setDatosRed] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Navegación por niveles (RF-224)
  const [rutaMigas, setRutaMigas] = useState([]); // [{ id, nombre, nivel }]
  const [modoVista, setModoVista] = useState('niveles'); // 'niveles' | 'arbol'

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        let perfil = socio;
        let listaCiclos = ciclos;

        if (!perfil) {
          perfil = await obtenerPerfilSocio();
          if (!cancelado) setSocio(perfil);
        }
        if (!listaCiclos || listaCiclos.length === 0) {
          listaCiclos = await obtenerCiclos();
          if (!cancelado) setCiclos(listaCiclos);
        }

        const cicloAbierto = (listaCiclos || []).find((c) => c.estado === 'abierto');
        const cicloId = cicloSeleccionado || cicloAbierto?.id || listaCiclos[0]?.id || 6;
        if (!cicloSeleccionado && cicloId && !cancelado) {
          setCicloSeleccionado(cicloId);
        }
        const red = await obtenerMiRed(perfil.id, cicloId);
        if (!cancelado) {
          setDatosRed(red);
          setRutaMigas([red.raiz]);
        }
      } catch (err) {
        if (!cancelado) setError(err.message || 'Error al cargar red de afiliados');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, [cicloSeleccionado]);

  if (cargando && !datosRed) {
    return (
      <div className="pagina-contenedor">
        <div className="panel-blanco" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p className="seccion-desc">Cargando árbol genealógico y activación de la red...</p>
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
            <h2 className="txt-gold txt-lg">Error al cargar red</h2>
          </div>
          <p className="seccion-desc" style={{ marginTop: 'var(--sp-2)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const { raiz, nodos, totalSocios, frontalesTotal, frontalesActivos, frontalesInactivos, profundidadMaxima } = datosRed || {};

  // Nodo actual enfocado en la navegación por niveles
  const nodoActual = rutaMigas[rutaMigas.length - 1] || raiz;
  const hijosNodoActual = (nodos || []).filter((n) => n.patrocinador_id === nodoActual.id && n.id !== nodoActual.id);

  const irANodoEnMiga = (indice) => {
    setRutaMigas((prev) => prev.slice(0, indice + 1));
  };

  const bajarANodoHijo = (nodoHijo) => {
    setRutaMigas((prev) => [...prev, nodoHijo]);
  };

  const subirUnNivel = () => {
    if (rutaMigas.length > 1) {
      setRutaMigas((prev) => prev.slice(0, prev.length - 1));
    }
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <div>
            <span className="kit-header-badge">Backoffice Socio · P-12</span>
            <h1 className="pagina-titulo">Mi Red de Afiliados</h1>
            <p className="pagina-subtitulo">Estructura unilevel y estado de activación del ciclo actual</p>
          </div>

          {/* Selector de Ciclo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <label htmlFor="select-ciclo-red" className="txt-sm txt-bold">
              Ciclo:
            </label>
            <select
              id="select-ciclo-red"
              className="formulario-select"
              value={cicloSeleccionado ?? ''}
              onChange={(e) => setCicloSeleccionado(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
            >
              {ciclos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || formatearNombreCiclo(c)} ({c.estado})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen de Red */}
      <div className="grid-tarjetas-datos" style={{ marginBottom: 'var(--sp-6)' }}>
        <TarjetaDato
          rotulo="Total de la Red"
          valor={`${totalSocios} socios`}
          subrotulo="Socios en tu descendencia"
          icono={Users}
          variante="destacada"
        />
        <TarjetaDato
          rotulo="Frontales Directos"
          valor={`${frontalesTotal} socios`}
          subrotulo={`${frontalesActivos} activos · ${frontalesInactivos} sin activar`}
          icono={UserCheck}
          variante={frontalesActivos >= 2 ? 'verde' : 'default'}
        />
        <TarjetaDato
          rotulo="Profundidad Máxima"
          valor={`${profundidadMaxima} niveles`}
          subrotulo="Niveles de descendencia activos"
          icono={Layers}
        />
      </div>

      {/* LEYENDA Y AVISO DE PRIVACIDAD LEY 29733 */}
      <div className="panel-blanco" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--verde)' }} />
            <span>Activo este mes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--peligro)' }} />
            <span>Sin activar</span>
          </div>
        </div>

        {/* Selector de Modo de Vista */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <button
            type="button"
            className={`formulario-boton ${modoVista === 'niveles' ? 'formulario-boton-primario' : 'formulario-boton-secundario'}`}
            onClick={() => setModoVista('niveles')}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            <Layers size={14} /> Navegación por Niveles
          </button>
          <button
            type="button"
            className={`formulario-boton ${modoVista === 'arbol' ? 'formulario-boton-primario' : 'formulario-boton-secundario'}`}
            onClick={() => setModoVista('arbol')}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            <ListTree size={14} /> Árbol Completo
          </button>
        </div>

        <div className="txt-xs txt-muted" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--verde)' }} />
          <span>Datos protegidos bajo Ley 29733 (comisiones privadas)</span>
        </div>
      </div>

      {/* 🔴 MODO NAVEGACIÓN POR NIVELES (RF-224 · SIN SCROLL HORIZONTAL EN MÓVIL) */}
      {modoVista === 'niveles' && (
        <section className="pagina-seccion">
          <div className="panel-blanco" style={{ borderTop: '4px solid var(--oro)' }}>
            {/* MIGAS DE PAN (BREADCRUMBS) */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--sp-4)', paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--borde)' }}>
              <span className="txt-xs txt-muted" style={{ fontWeight: 600 }}>Ruta:</span>
              {rutaMigas.map((miga, idx) => {
                const esUltimo = idx === rutaMigas.length - 1;
                return (
                  <React.Fragment key={miga.id}>
                    {idx > 0 && <ChevronRight size={14} style={{ color: 'var(--texto-apagado)' }} />}
                    <button
                      type="button"
                      onClick={() => irANodoEnMiga(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: esUltimo ? 'default' : 'pointer',
                        fontWeight: esUltimo ? 700 : 500,
                        color: esUltimo ? 'var(--oro)' : 'var(--texto-principal)',
                        backgroundColor: esUltimo ? 'rgba(212,160,23,0.1)' : 'transparent',
                        fontSize: '13px'
                      }}
                    >
                      {idx === 0 ? `Tú (${miga.nombres || miga.nombre})` : miga.nombre}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* ENCABEZADO DEL NIVEL ACTUAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <h2 className="seccion-titulo" style={{ margin: 0 }}>
                  {nodoActual.id === raiz.id ? 'Tus Frontales Directos (Nivel 1)' : `Equipo de ${nodoActual.nombre}`}
                </h2>
                <p className="seccion-desc" style={{ marginTop: '2px' }}>
                  {hijosNodoActual.length} socio{hijosNodoActual.length === 1 ? '' : 's'} registrado{hijosNodoActual.length === 1 ? '' : 's'} directamente bajo este código
                </p>
              </div>

              {rutaMigas.length > 1 && (
                <button
                  type="button"
                  className="formulario-boton formulario-boton-secundario"
                  onClick={subirUnNivel}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px' }}
                >
                  <ChevronLeft size={16} /> Subir un nivel
                </button>
              )}
            </div>

            {/* LISTADO DE SOCIOS DEL NIVEL */}
            {hijosNodoActual.length === 0 ? (
              nodoActual.id === raiz.id ? (
                <EstadoVacio
                  icono={Users}
                  titulo="Aún no tienes afiliados"
                  mensaje="Comparte tu enlace de afiliación para registrar tus primeros socios directos y empezar a construir tu red."
                  accionTexto="Ver mi enlace"
                  onAccion={() => navigate('/socio/enlace')}
                />
              ) : (
                <EstadoVacio
                  icono={Users}
                  titulo="Sin afiliados directos"
                  mensaje={`El socio ${nodoActual.nombre} aún no tiene afiliados directos registrados.`}
                />
              )
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
                {hijosNodoActual.map((hijo) => {
                  const tieneDescendencia = (nodos || []).some((n) => n.patrocinador_id === hijo.id && n.id !== hijo.id);
                  const cantNietos = (nodos || []).filter((n) => n.patrocinador_id === hijo.id && n.id !== hijo.id).length;
                  const estaActivo = hijo.activo;

                  return (
                    <div
                      key={hijo.id}
                      className="panel-blanco"
                      style={{
                        padding: 'var(--sp-3)',
                        borderLeft: estaActivo ? '4px solid var(--verde)' : '4px solid var(--peligro)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 'var(--sp-2)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="txt-sm txt-bold">{hijo.nombre}</span>
                            <span style={{ fontSize: '11px', color: 'var(--texto-apagado)' }}>({hijo.codigo})</span>
                          </div>
                          <div className="txt-xs txt-muted" style={{ marginTop: '2px' }}>
                            {hijo.pack_nombre} · Nivel {hijo.nivel}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: estaActivo ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: estaActivo ? 'var(--verde)' : 'var(--peligro)'
                          }}
                        >
                          {estaActivo ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--sp-2)', borderTop: '1px solid var(--borde)' }}>
                        <span className="txt-xs">
                          Puntos del mes: <strong style={{ color: 'var(--oro)' }}>{hijo.puntos} pts</strong>
                        </span>

                        {tieneDescendencia ? (
                          <button
                            type="button"
                            className="formulario-boton formulario-boton-secundario"
                            onClick={() => bajarANodoHijo(hijo)}
                            style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            Ver equipo ({cantNietos}) <ChevronRight size={14} />
                          </button>
                        ) : (
                          <span className="txt-2xs txt-muted">Sin afiliados</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* MODO ÁRBOL COMPLETO */}
      {modoVista === 'arbol' && (
        <section className="pagina-seccion">
          <div className="panel-blanco">
            <h2 className="seccion-titulo" style={{ marginBottom: 'var(--sp-4)' }}>
              Estructura Genealógica Completa (hasta {profundidadMaxima} niveles)
            </h2>
            <RamaArbol
              nodo={raiz}
              todosLosNodos={nodos || []}
              nivel={0}
              esRaiz={true}
            />
          </div>
        </section>
      )}
    </div>
  );
}
