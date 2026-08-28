import React, { useState } from 'react';
import { resumenCierreCiclo } from '../datos-falsos/adminEjemplo';
import { formatearSoles } from '../utilidades/dinero';
import {
  Boton,
  DialogoConfirmar
} from '../piezas';
import {
  CheckCircle,
  CalendarCheck,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * P-25 · Cierre de Ciclo Mensual (Admin)
 * Operación más crítica del sistema: VISTA PREVIA OBLIGATORIA antes de confirmar el cierre.
 */
export default function P25CierreCiclo() {
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [cierreCompletado, setCierreCompletado] = useState(false);

  const handleEjecutarCierre = () => {
    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      setDialogoAbierto(false);
      setCierreCompletado(true);
    }, 1500);
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <span className="kit-header-badge">Panel Administración · P-25</span>
        <div className="pagina-header-row">
          <div>
            <h1 className="pagina-titulo">Cierre de Ciclo Mensual</h1>
            <p className="pagina-subtitulo">
              Liquidación final de comisiones, evaluación de rangos y apertura del siguiente ciclo
            </p>
          </div>
          <span className="armazon-admin-cycle-badge">
            <CalendarCheck size={16} />
            <span>Ciclo a Liquidar: {resumenCierreCiclo.ciclo}</span>
          </span>
        </div>
      </div>

      {cierreCompletado ? (
        /* ESTADO POST-CIERRE EXITOSO */
        <div className="panel-activa-exito panel-centrado-cierre">
          <CheckCircle size={48} style={{ color: 'var(--green-600)', marginBottom: 'var(--sp-2)' }} />
          <h2 style={{ color: 'var(--green-700)' }}>¡Ciclo {resumenCierreCiclo.ciclo} Cerrado Exitosamente!</h2>
          <p className="seccion-desc" style={{ maxWidth: '500px' }}>
            Se acreditaron {formatearSoles(resumenCierreCiclo.totalAPagarCent)} en las billeteras de los {resumenCierreCiclo.sociosQueCobran} socios calificados. Los contadores de puntos han sido reseteados para el nuevo mes.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
            <Link to="/admin" className="btn btn-primario">
              Ir al Tablero Principal
            </Link>
            <Boton
              variante="secundario"
              onClick={() => setCierreCompletado(false)}
            >
              Ver Resumen Nuevamente
            </Boton>
          </div>
        </div>
      ) : (
        /* VISTA PREVIA OBLIGATORIA DEL CIERRE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {/* Tarjeta de Verificaciones Previas */}
          <div className="panel-blanco panel-alerta-seguridad-borde">
            <h3 className="seccion-titulo" style={{ marginBottom: 'var(--sp-2)' }}>
              Verificaciones de Seguridad Previas al Cierre
            </h3>
            <div className="txt-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <CheckCircle size={18} style={{ color: 'var(--green-500)' }} />
                <span>0 pedidos pendientes en la bandeja de confirmación</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <CheckCircle size={18} style={{ color: 'var(--green-500)' }} />
                <span>Configuración de los 4 bonos y rangos completa y auditada</span>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA DEL CIERRE — BLOQUE OBLIGATORIO */}
          <div className="panel-vista-previa-cierre">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--gold-300)', paddingBottom: 'var(--sp-3)' }}>
              <div>
                <span className="tarjeta-dato-rotulo txt-gold">
                  VISTA PREVIA DEL CIERRE
                </span>
                <h2 className="txt-2xl" style={{ margin: '4px 0' }}>
                  {resumenCierreCiclo.ciclo}
                </h2>
              </div>
              <span className="armazon-badge-rango txt-xs">
                Simulación Preliminar
              </span>
            </div>

            {/* Lista de Métricas Críticas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              <div className="cierre-metrica-fila">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <Users size={18} style={{ color: 'var(--green-600)' }} />
                  <span className="cierre-metrica-label">Socios que cobran comisiones</span>
                </div>
                <span className="cierre-metrica-valor">{resumenCierreCiclo.sociosQueCobran}</span>
              </div>

              <div className="cierre-metrica-fila cierre-total-destacado">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <DollarSign size={20} className="txt-gold" />
                  <span className="cierre-metrica-label txt-bold txt-md">
                    Total liquidado a pagar
                  </span>
                </div>
                <span className="cierre-metrica-valor txt-xl txt-gold">
                  {formatearSoles(resumenCierreCiclo.totalAPagarCent)}
                </span>
              </div>

              <div className="cierre-metrica-fila">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <TrendingUp size={18} style={{ color: 'var(--green-500)' }} />
                  <span className="cierre-metrica-label">Socios que suben de rango</span>
                </div>
                <span className="cierre-metrica-valor txt-green">
                  +{resumenCierreCiclo.subenDeRango}
                </span>
              </div>

              <div className="cierre-metrica-fila">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <TrendingDown size={18} style={{ color: 'var(--warning)' }} />
                  <span className="cierre-metrica-label">Socios que bajan de rango (no cobran bono de rango)</span>
                </div>
                <span className="cierre-metrica-valor" style={{ color: 'var(--warning)' }}>
                  {resumenCierreCiclo.bajanDeRango}
                </span>
              </div>

              <div className="cierre-metrica-fila">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <UserX size={18} style={{ color: 'var(--danger)' }} />
                  <span className="cierre-metrica-label">Socios que no cobran por inactividad (&lt; 70 pts)</span>
                </div>
                <span className="cierre-metrica-valor" style={{ color: 'var(--danger)' }}>
                  {resumenCierreCiclo.noCobranPorInactividad}
                </span>
              </div>
            </div>

            {/* Botones de Cancelar y Confirmar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--sp-4)' }}>
              <Link to="/admin" className="btn btn-secundario">
                Cancelar y Salir
              </Link>
              <Boton
                variante="primario"
                icono={ShieldAlert}
                onClick={() => setDialogoAbierto(true)}
              >
                Confirmar el Cierre
              </Boton>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN IRREVERSIBLE */}
      <DialogoConfirmar
        abierto={dialogoAbierto}
        titulo="¿Ejecutar Cierre Definitivo de Ciclo?"
        mensaje={`Esta operación liquidará ${formatearSoles(resumenCierreCiclo.totalAPagarCent)} a ${resumenCierreCiclo.sociosQueCobran} socios, actualizará rangos y reseteará puntos. Esta acción es irreversible.`}
        textoConfirmar="Sí, Liquidar y Cerrar Ciclo"
        textoCancelar="Cancelar y Volver a Revisar"
        variante="peligro"
        cargando={procesando}
        onConfirmar={handleEjecutarCierre}
        onCancelar={() => setDialogoAbierto(false)}
      />
    </div>
  );
}
