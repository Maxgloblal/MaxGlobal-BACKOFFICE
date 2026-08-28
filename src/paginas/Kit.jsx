import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearSoles } from '../utilidades/dinero';
import {
  TarjetaDato,
  BarraProgreso,
  Tabla,
  InsigniaEstado,
  CampoTexto,
  CampoSelect,
  CampoTextarea,
  CampoArchivo,
  Boton,
  EstadoVacio,
  DialogoConfirmar,
  NodoArbol
} from '../piezas';
import {
  Coins,
  Users,
  Award,
  Inbox,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Kit - Página de Desarrollo para el Catálogo de Piezas UI
 * Muestra las 8 piezas con sus 3 estados: [con datos] [vacía] [cargando]
 */
export default function Kit() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCargando, setModalCargando] = useState(false);
  const [opcionesPacks, setOpcionesPacks] = useState([
    { value: 'emprendedor', label: `Kit Emprendedor (${formatearSoles(12000)})` },
    { value: 'ejecutivo', label: `Pack Ejecutivo (${formatearSoles(36000)})` },
    { value: 'gold', label: `Pack Gold (${formatearSoles(120000)})` },
    { value: 'familiar', label: `Pack Familiar (${formatearSoles(400000)})` },
    { value: 'empresarial', label: `Pack Empresarial (${formatearSoles(800000)})` }
  ]);

  useEffect(() => {
    supabase.from('pack').select('codigo, nombre, precio_cent').order('precio_cent').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setOpcionesPacks(data.map(p => ({
          value: p.codigo.toLowerCase(),
          label: `${p.nombre} (${formatearSoles(p.precio_cent)})`
        })));
      }
    });
  }, []);

  const columnasEjemplo = [
    { key: 'concepto', label: 'Concepto' },
    { key: 'puntos', label: 'Puntos' },
    { key: 'monto', label: 'Monto Ganado' },
    {
      key: 'estado',
      label: 'Estado',
      render: (fila) => <InsigniaEstado estadoTipo={fila.estado} />
    }
  ];

  const datosTablaEjemplo = [
    { id: 1, concepto: 'Bono Patrocinio', puntos: '—', monto: formatearSoles(4800), estado: 'confirmado' },
    { id: 2, concepto: 'Bono Residual N1', puntos: '180 pts', monto: formatearSoles(7200), estado: 'confirmado' },
    { id: 3, concepto: 'Bono Residual N2', puntos: '70 pts', monto: formatearSoles(1400), estado: 'por_confirmar' },
  ];

  const socioArbolEjemplo = {
    id: 's1',
    nombre: 'Carlos Ríos',
    pack: 'Gold',
    puntos: 180,
    activo: true
  };

  const hijosArbolEjemplo = [
    {
      id: 's2',
      nombre: 'Lucía Pérez',
      pack: 'Ejecutivo',
      puntos: 70,
      activo: true,
      hijos: [
        {
          id: 's3',
          nombre: 'Jorge Mendoza',
          pack: 'Kit Emprendedor',
          puntos: 0,
          activo: false
        }
      ]
    }
  ];

  const handleConfirmarAccion = () => {
    setModalCargando(true);
    setTimeout(() => {
      setModalCargando(false);
      setModalAbierto(false);
      alert('Acción confirmada con éxito');
    }, 1000);
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado del Kit */}
      <div className="pagina-header">
        <div className="pagina-header-row">
          <span className="kit-header-badge">Fase 2 · Etapa D</span>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Link to="/socio" className="btn btn-secundario btn-compacto">
              <ArrowLeft size={16} />
              <span>Ir a Backoffice Socio</span>
            </Link>
            <Link to="/admin" className="btn btn-secundario btn-compacto">
              <span>Ir a Panel Admin</span>
            </Link>
          </div>
        </div>
        <h1 className="pagina-titulo">Kit de Piezas UI — Sistema Max Global</h1>
        <p className="pagina-subtitulo">
          Catálogo visual centralizado con las 8 piezas del sistema y sus 3 estados reglamentarios: con datos, vacía y cargando.
        </p>
      </div>

      {/* 1. TARJETA DE DATO */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">1 · Tarjeta de Dato (TarjetaDato)</h2>
        <p className="seccion-desc">Muestra cifras clave del negocio con formato prominente y contexto.</p>

        <div className="grid-tres-estados">
          <div className="kit-item-box">
            <span className="kit-estado-label">1. Con Datos</span>
            <TarjetaDato
              rotulo="Puntos Grupales"
              valor="1,240"
              subrotulo="Ciclo Agosto 2026"
              icono={Users}
              variante="destacada"
            />
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">2. Vacía</span>
            <TarjetaDato
              rotulo="Comisiones del Mes"
              subrotulo="Sin comisiones generadas"
              icono={Coins}
              estado="vacio"
            />
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">3. Cargando</span>
            <TarjetaDato
              rotulo="Socios Frontales"
              icono={Award}
              estado="cargando"
            />
          </div>
        </div>
      </section>

      {/* 2. BARRA DE PROGRESO */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">2 · Barra de Progreso (BarraProgreso)</h2>
        <p className="seccion-desc">
          Avance hacia metas de puntos o rangos. Regla innegociable: acotada estrictamente al 100% máximo.
        </p>

        <div className="grid-tres-estados">
          <div className="kit-item-box">
            <span className="kit-estado-label">1. Con Datos (48 / 70 pts)</span>
            <BarraProgreso
              etiqueta="Puntos Personales"
              valor={48}
              meta={70}
              unidad="pts"
              variante="alerta"
            />
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">2. Vacía (0 / 70 pts)</span>
            <BarraProgreso
              etiqueta="Activación Mensual"
              valor={0}
              meta={70}
              unidad="pts"
              estado="vacio"
            />
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">3. Cargando</span>
            <BarraProgreso
              etiqueta="Puntos de Rango"
              estado="cargando"
            />
          </div>
        </div>
      </section>

      {/* 3. TABLA RESPONSIVA */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">3 · Tabla Responsiva (Tabla)</h2>
        <p className="seccion-desc">
          Estructura tabular en escritorio que conmuta a tarjetas apiladas en móvil. En estado vacío muestra EstadoVacio.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <div className="kit-item-box">
            <span className="kit-estado-label">1. Con Datos</span>
            <Tabla
              columnas={columnasEjemplo}
              datos={datosTablaEjemplo}
            />
          </div>

          <div className="grid-dos-columnas">
            <div className="kit-item-box">
              <span className="kit-estado-label">2. Vacía (muestra EstadoVacio automáticamente)</span>
              <Tabla
                columnas={columnasEjemplo}
                datos={[]}
                vacioTitulo="No tienes comisiones aún"
                vacioMensaje="Tus comisiones aparecerán aquí una vez cerrado el ciclo mensual."
                vacioAccionTexto="Ver cómo se calculan"
                onVacioAccion={() => alert('Guía de comisiones')}
              />
            </div>

            <div className="kit-item-box">
              <span className="kit-estado-label">3. Cargando</span>
              <Tabla
                columnas={columnasEjemplo}
                estado="cargando"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. INSIGNIA DE ESTADO */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">4 · Insignia de Estado (InsigniaEstado)</h2>
        <p className="seccion-desc">Indicadores cromáticos de estado con alto contraste y legibilidad.</p>

        <div className="grid-tres-estados">
          <div className="kit-item-box">
            <span className="kit-estado-label">1. Con Datos (Variantes)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
              <InsigniaEstado estadoTipo="confirmado" />
              <InsigniaEstado estadoTipo="por_confirmar" />
              <InsigniaEstado estadoTipo="enviado" />
              <InsigniaEstado estadoTipo="rechazado" />
              <InsigniaEstado estadoTipo="activo" />
              <InsigniaEstado estadoTipo="inactivo" />
            </div>
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">2. Vacía / Neutral</span>
            <div>
              <InsigniaEstado estado="vacio" />
            </div>
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">3. Cargando</span>
            <div>
              <InsigniaEstado estado="cargando" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FORMULARIO */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">5 · Formulario y Botones (Formulario)</h2>
        <p className="seccion-desc">Controles con altura mínima de 44px táctil y apilamiento a 1 columna bajo 768px.</p>

        <div className="grid-tres-estados">
          <div className="kit-item-box">
            <span className="kit-estado-label">1. Con Datos</span>
            <CampoTexto
              label="Nombre Completo"
              id="kit-nombre"
              value="María Torres"
              onChange={() => {}}
            />
            <CampoSelect
              label="Pack de Afiliación"
              id="kit-pack"
              value="gold"
              onChange={() => {}}
              opciones={opcionesPacks}
            />
            <Boton variante="primario" bloque={true}>Guardar Cambios</Boton>
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">2. Vacío / Inicial</span>
            <CampoTexto
              label="Buscar por Código"
              id="kit-buscar"
              placeholder="Ej. MG-00417..."
              estado="vacio"
            />
            <CampoArchivo
              label="Comprobante de Pago"
              id="kit-archivo"
              estado="vacio"
            />
            <Boton variante="secundario" bloque={true}>Examinar</Boton>
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">3. Cargando</span>
            <CampoTexto label="Campo en Carga" estado="cargando" />
            <CampoTextarea label="Notas de Auditoría" estado="cargando" />
            <Boton variante="primario" cargando={true} bloque={true}>Procesando...</Boton>
          </div>
        </div>
      </section>

      {/* 6. ESTADO VACÍO */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">6 · Estado Vacío (EstadoVacio)</h2>
        <p className="seccion-desc">Evita pantallas en blanco y orienta al usuario hacia la siguiente acción.</p>

        <div className="panel-blanco">
          <EstadoVacio
            icono={Inbox}
            titulo="Todavía no tienes pedidos registrados"
            mensaje="Realiza tu primera compra en la tienda de recompra para activar tus puntos del ciclo."
            accionTexto="Ir a la Tienda"
            onAccion={() => alert('Navegando a la tienda')}
          />
        </div>
      </section>

      {/* 7. DIÁLOGO DE CONFIRMACIÓN */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">7 · Diálogo de Confirmación (DialogoConfirmar)</h2>
        <p className="seccion-desc">
          Para acciones destructivas o irreversibles (cierre de ciclo, eliminar usuario, anular pedido).
        </p>

        <div className="panel-blanco" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="txt-bold">Acción Crítica: Cierre Mensual de Comisiones</span>
            <span className="txt-xs txt-muted" style={{ display: 'block' }}>
              Requiere confirmación explícita para evitar ejecuciones accidentales.
            </span>
          </div>
          <Boton variante="peligro" onClick={() => setModalAbierto(true)}>
            Abrir Diálogo de Prueba
          </Boton>
        </div>

        <DialogoConfirmar
          abierto={modalAbierto}
          titulo="¿Confirmar Cierre de Ciclo?"
          mensaje={`Esta operación liquidará las comisiones de 187 socios por un total de ${formatearSoles(4238000)}. Es irreversible.`}
          textoConfirmar="Sí, Liquidar Comisiones"
          textoCancelar="Cancelar y Revisar"
          cargando={modalCargando}
          onConfirmar={handleConfirmarAccion}
          onCancelar={() => setModalAbierto(false)}
        />
      </section>

      {/* 8. NODO DE ÁRBOL */}
      <section className="pagina-seccion">
        <h2 className="seccion-titulo">8 · Nodo del Árbol (NodoArbol)</h2>
        <p className="seccion-desc">
          Nodo de red colapsable con protección estricta de datos personales (Ley 29733).
        </p>

        <div className="grid-tres-estados">
          <div className="kit-item-box">
            <span className="kit-estado-label">1. Con Datos (Expandible)</span>
            <NodoArbol
              socio={socioArbolEjemplo}
              hijos={hijosArbolEjemplo}
              nivel={1}
              esRaiz={true}
            />
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">2. Vacío / Sin Descendencia</span>
            <NodoArbol estado="vacio" />
          </div>

          <div className="kit-item-box">
            <span className="kit-estado-label">3. Cargando</span>
            <NodoArbol estado="cargando" />
          </div>
        </div>
      </section>
    </div>
  );
}
