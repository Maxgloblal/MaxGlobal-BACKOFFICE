/**
 * Tipos de datos para el motor de comisiones (TypeScript puro)
 * Fuente: 00-INSTRUCCIONES/TAREA-04A-MOTOR-PATROCINIO-Y-RESIDUAL.md
 */

export interface OrdenEntrada {
  id: number;
  socio_id: number;
  ciclo_id: number;
  tipo: 'afiliacion' | 'recompra';
  total_cent: number;
  puntos_total?: number;
  pack_id?: number | null;
  pack_codigo?: string | null;
  cuenta_residual?: boolean;
}

export interface PackAncestro {
  id?: number;
  codigo?: string;
  niveles_patrocinio: number;
  niveles_residual: number;
}

export interface AncestroUpline {
  ancestro_id: number;
  nivel: number;
  activo: boolean;
  pack: PackAncestro;
}

export interface EscalaNivel {
  nivel: number;
  porcentaje: number;
}

export interface PackComisionEspecial {
  pack_id?: number;
  pack_codigo?: string;
  nivel: number;
  porcentaje: number;
}

export interface ConfigMotor {
  compresion_activa?: boolean;
  valor_punto_comision?: number;
}

export interface DetalleAuditoriaComision {
  motivo?: string;
  pack_comprado_id?: number | null;
  pack_ancestro_codigo?: string;
  niveles_habilitados?: number;
  activo_en_ciclo?: boolean;
  escala_usada?: 'estandar' | 'especial';
  porcentaje_millesimas?: number;
  formula?: string;
  [key: string]: unknown;
}

export interface ComisionCalculada {
  ciclo_id: number;
  beneficiario_id: number;
  generador_id: number;
  orden_id: number;
  tipo: 'patrocinio' | 'residual';
  nivel: number;
  base_cent: number;
  base_puntos: number | null;
  porcentaje: number;
  monto_cent: number;
  estado: 'confirmada';
  detalle: DetalleAuditoriaComision;
}

export interface NivelBloqueadoDetalle {
  nivel: number;
  ancestro_id: number | null;
  motivo: 'inactivo' | 'pack_insuficiente' | 'sin_ancestro';
  monto_cent: number;
  porcentaje: number;
}

export interface ResultadoCalculo {
  comisiones: ComisionCalculada[];
  total_pagado_cent: number;
  total_bloqueado_empresa_cent: number;
  total_teorico_cent: number;
  niveles_bloqueados: NivelBloqueadoDetalle[];
}

// ---------------------------------------------------------------------------
// TIPOS PARA RANGO Y LÍNEA ESTIRADA (TAREA-04B)
// ---------------------------------------------------------------------------

export interface RangoDefinicion {
  id: number;
  orden: number;
  codigo: string;
  nombre: string;
  puntos_grupales: number | null;
  frontales_activos: number | null;
  bono_cent: number | null;
  definido: boolean;
  activo: boolean;
}

export interface LineaFrontal {
  frontal_socio_id: number;
  puntos_totales: number;
}

export interface PuntosSocioCiclo {
  socio_id: number;
  ciclo_id: number;
  puntos_personales: number;
  puntos_grupales: number;
  lineas_frontales: LineaFrontal[];
  puntos_linea_mayor: number;
  frontales_activos: number;
  activo: boolean;
}

export interface ResultadoCalificacionRango {
  socio_id: number;
  ciclo_id: number;
  rango_id: number | null;
  rango_codigo: string | null;
  rango_nombre: string | null;
  rango_orden: number | null;
  puntos_personales: number;
  puntos_grupales: number;
  puntos_linea_mayor: number;
  puntos_computables: number;
  frontales_activos: number;
  califica: boolean;
  bono_cent: number;
  motivo_bono: 'mantiene' | 'asciende' | 'baja' | 'primer_ciclo' | 'no_califica' | 'inactivo';
  detalle?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// TIPOS PARA BONO GLOBAL (TAREA-04B)
// ---------------------------------------------------------------------------

export interface SocioGlobalPuntos {
  socio_id: number;
  aplica_pack: boolean;
  meses_activo: number;
  puntos_acumulados: number;
}

export interface SocioGlobalResultado {
  socio_id: number;
  aplica_pack: boolean;
  meses_activo: number;
  puntos_acumulados: number;
  califica: boolean;
  monto_cent: number;
}

export interface ResultadoBonoGlobal {
  anio: number;
  semestre: number;
  puntos_totales: number;
  pool_cent: number;
  calificados_count: number;
  socios: SocioGlobalResultado[];
  total_repartido_cent: number;
  sobrante_empresa_cent: number;
  estado: 'abierto' | 'cerrado';
}

