export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      activacion: {
        Row: {
          activo: boolean
          calculado_en: string | null
          ciclo_id: number
          puntos_personales: number
          socio_id: number
        }
        Insert: {
          activo?: boolean
          calculado_en?: string | null
          ciclo_id: number
          puntos_personales?: number
          socio_id: number
        }
        Update: {
          activo?: boolean
          calculado_en?: string | null
          ciclo_id?: number
          puntos_personales?: number
          socio_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "activacion_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activacion_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          creado_en: string
          datos_antes: Json | null
          datos_despues: Json | null
          id: number
          ip: string | null
          registro_id: number | null
          tabla: string | null
          usuario_id: number | null
        }
        Insert: {
          accion: string
          creado_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: number
          ip?: string | null
          registro_id?: number | null
          tabla?: string | null
          usuario_id?: number | null
        }
        Update: {
          accion?: string
          creado_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: number
          ip?: string | null
          registro_id?: number | null
          tabla?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclo: {
        Row: {
          anio: number
          cerrado_en: string | null
          cerrado_por: number | null
          estado: string
          fecha_fin: string
          fecha_inicio: string
          id: number
          mes: number
        }
        Insert: {
          anio: number
          cerrado_en?: string | null
          cerrado_por?: number | null
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          id?: number
          mes: number
        }
        Update: {
          anio?: number
          cerrado_en?: string | null
          cerrado_por?: number | null
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: number
          mes?: number
        }
        Relationships: [
          {
            foreignKeyName: "ciclo_cerrado_por_fkey"
            columns: ["cerrado_por"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      comision: {
        Row: {
          base_cent: number
          base_puntos: number | null
          beneficiario_id: number
          ciclo_id: number
          creado_en: string
          detalle: Json | null
          estado: string
          generador_id: number | null
          id: number
          monto_cent: number
          nivel: number | null
          orden_id: number | null
          porcentaje: number | null
          tipo: string
        }
        Insert: {
          base_cent: number
          base_puntos?: number | null
          beneficiario_id: number
          ciclo_id: number
          creado_en?: string
          detalle?: Json | null
          estado?: string
          generador_id?: number | null
          id?: number
          monto_cent: number
          nivel?: number | null
          orden_id?: number | null
          porcentaje?: number | null
          tipo: string
        }
        Update: {
          base_cent?: number
          base_puntos?: number | null
          beneficiario_id?: number
          ciclo_id?: number
          creado_en?: string
          detalle?: Json | null
          estado?: string
          generador_id?: number | null
          id?: number
          monto_cent?: number
          nivel?: number | null
          orden_id?: number | null
          porcentaje?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "comision_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comision_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comision_generador_id_fkey"
            columns: ["generador_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comision_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "orden"
            referencedColumns: ["id"]
          },
        ]
      }
      config: {
        Row: {
          actualizado_en: string
          actualizado_por: number | null
          clave: string
          descripcion: string | null
          tipo: string
          valor: string
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: number | null
          clave: string
          descripcion?: string | null
          tipo?: string
          valor: string
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: number | null
          clave?: string
          descripcion?: string | null
          tipo?: string
          valor?: string
        }
        Relationships: []
      }
      envio: {
        Row: {
          agencia: string | null
          costo_cent: number
          creado_en: string
          departamento: string | null
          destinatario: string
          direccion: string
          distrito: string | null
          estado: string
          fecha_despacho: string | null
          fecha_entrega: string | null
          id: number
          numero_guia: string | null
          orden_id: number
          provincia: string | null
          referencia: string | null
          telefono: string | null
        }
        Insert: {
          agencia?: string | null
          costo_cent?: number
          creado_en?: string
          departamento?: string | null
          destinatario: string
          direccion: string
          distrito?: string | null
          estado?: string
          fecha_despacho?: string | null
          fecha_entrega?: string | null
          id?: number
          numero_guia?: string | null
          orden_id: number
          provincia?: string | null
          referencia?: string | null
          telefono?: string | null
        }
        Update: {
          agencia?: string | null
          costo_cent?: number
          creado_en?: string
          departamento?: string | null
          destinatario?: string
          direccion?: string
          distrito?: string | null
          estado?: string
          fecha_despacho?: string | null
          fecha_entrega?: string | null
          id?: number
          numero_guia?: string | null
          orden_id?: number
          provincia?: string | null
          referencia?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envio_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "orden"
            referencedColumns: ["id"]
          },
        ]
      }
      movimiento_puntos: {
        Row: {
          ciclo_id: number
          creado_en: string
          cuenta_activacion: boolean
          cuenta_rango: boolean
          cuenta_residual: boolean
          id: number
          nota: string | null
          orden_id: number | null
          origen: string
          puntos: number
          socio_id: number
        }
        Insert: {
          ciclo_id: number
          creado_en?: string
          cuenta_activacion?: boolean
          cuenta_rango?: boolean
          cuenta_residual?: boolean
          id?: number
          nota?: string | null
          orden_id?: number | null
          origen: string
          puntos: number
          socio_id: number
        }
        Update: {
          ciclo_id?: number
          creado_en?: string
          cuenta_activacion?: boolean
          cuenta_rango?: boolean
          cuenta_residual?: boolean
          id?: number
          nota?: string | null
          orden_id?: number | null
          origen?: string
          puntos?: number
          socio_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimiento_puntos_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_puntos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "orden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_puntos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      nivel_comision: {
        Row: {
          nivel: number
          porcentaje: number
          tipo: string
        }
        Insert: {
          nivel: number
          porcentaje: number
          tipo: string
        }
        Update: {
          nivel?: number
          porcentaje?: number
          tipo?: string
        }
        Relationships: []
      }
      orden: {
        Row: {
          aprobada_en: string | null
          aprobada_por: number | null
          asesor_id: number | null
          canal: string
          ciclo_id: number
          codigo: string
          creada_en: string
          descuento_cent: number
          estado: string
          id: number
          pack_id: number | null
          punto_entrega_id: number | null
          puntos_total: number
          socio_id: number
          subtotal_cent: number
          tipo: string
          total_cent: number
        }
        Insert: {
          aprobada_en?: string | null
          aprobada_por?: number | null
          asesor_id?: number | null
          canal?: string
          ciclo_id: number
          codigo: string
          creada_en?: string
          descuento_cent?: number
          estado?: string
          id?: number
          pack_id?: number | null
          punto_entrega_id?: number | null
          puntos_total?: number
          socio_id: number
          subtotal_cent?: number
          tipo: string
          total_cent?: number
        }
        Update: {
          aprobada_en?: string | null
          aprobada_por?: number | null
          asesor_id?: number | null
          canal?: string
          ciclo_id?: number
          codigo?: string
          creada_en?: string
          descuento_cent?: number
          estado?: string
          id?: number
          pack_id?: number | null
          punto_entrega_id?: number | null
          puntos_total?: number
          socio_id?: number
          subtotal_cent?: number
          tipo?: string
          total_cent?: number
        }
        Relationships: [
          {
            foreignKeyName: "orden_aprobada_por_fkey"
            columns: ["aprobada_por"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "pack"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_detalle: {
        Row: {
          cantidad: number
          descuento_pct: number
          id: number
          orden_id: number
          precio_final_cent: number
          precio_lista_cent: number
          producto_id: number
          puntos_subtotal: number
          puntos_unitario: number
        }
        Insert: {
          cantidad: number
          descuento_pct?: number
          id?: number
          orden_id: number
          precio_final_cent: number
          precio_lista_cent: number
          producto_id: number
          puntos_subtotal: number
          puntos_unitario: number
        }
        Update: {
          cantidad?: number
          descuento_pct?: number
          id?: number
          orden_id?: number
          precio_final_cent?: number
          precio_lista_cent?: number
          producto_id?: number
          puntos_subtotal?: number
          puntos_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orden_detalle_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "orden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_detalle_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
        ]
      }
      pack: {
        Row: {
          activo: boolean
          aplica_bono_global: boolean
          cant_productos: number | null
          codigo: string
          cubre_activacion: boolean
          descuento_en_pack_pct: number
          descuento_recompra_pct: number
          id: number
          niveles_patrocinio: number
          niveles_residual: number
          nombre: string
          orden: number
          precio_cent: number
          puntos_rango: number
          solo_afilia_igual: boolean
        }
        Insert: {
          activo?: boolean
          aplica_bono_global?: boolean
          cant_productos?: number | null
          codigo: string
          cubre_activacion?: boolean
          descuento_en_pack_pct?: number
          descuento_recompra_pct?: number
          id?: number
          niveles_patrocinio?: number
          niveles_residual?: number
          nombre: string
          orden?: number
          precio_cent: number
          puntos_rango?: number
          solo_afilia_igual?: boolean
        }
        Update: {
          activo?: boolean
          aplica_bono_global?: boolean
          cant_productos?: number | null
          codigo?: string
          cubre_activacion?: boolean
          descuento_en_pack_pct?: number
          descuento_recompra_pct?: number
          id?: number
          niveles_patrocinio?: number
          niveles_residual?: number
          nombre?: string
          orden?: number
          precio_cent?: number
          puntos_rango?: number
          solo_afilia_igual?: boolean
        }
        Relationships: []
      }
      pack_comision_especial: {
        Row: {
          nivel: number
          pack_codigo: string
          porcentaje: number
        }
        Insert: {
          nivel: number
          pack_codigo: string
          porcentaje: number
        }
        Update: {
          nivel?: number
          pack_codigo?: string
          porcentaje?: number
        }
        Relationships: [
          {
            foreignKeyName: "pack_comision_especial_pack_codigo_fkey"
            columns: ["pack_codigo"]
            isOneToOne: false
            referencedRelation: "pack"
            referencedColumns: ["codigo"]
          },
        ]
      }
      periodo_global: {
        Row: {
          anio: number
          calificados: number
          cerrado_en: string | null
          estado: string
          id: number
          pool_cent: number
          puntos_totales: number
          semestre: number
        }
        Insert: {
          anio: number
          calificados?: number
          cerrado_en?: string | null
          estado?: string
          id?: number
          pool_cent?: number
          puntos_totales?: number
          semestre: number
        }
        Update: {
          anio?: number
          calificados?: number
          cerrado_en?: string | null
          estado?: string
          id?: number
          pool_cent?: number
          puntos_totales?: number
          semestre?: number
        }
        Relationships: []
      }
      producto: {
        Row: {
          activo: boolean
          codigo: string
          creado_en: string
          descripcion: string | null
          descuento_pct: number | null
          id: number
          imagen_url: string | null
          nombre: string
          orden: number
          precio_lista_cent: number
          puntos: number
        }
        Insert: {
          activo?: boolean
          codigo: string
          creado_en?: string
          descripcion?: string | null
          descuento_pct?: number | null
          id?: number
          imagen_url?: string | null
          nombre: string
          orden?: number
          precio_lista_cent: number
          puntos: number
        }
        Update: {
          activo?: boolean
          codigo?: string
          creado_en?: string
          descripcion?: string | null
          descuento_pct?: number | null
          id?: number
          imagen_url?: string | null
          nombre?: string
          orden?: number
          precio_lista_cent?: number
          puntos?: number
        }
        Relationships: []
      }
      punto_entrega: {
        Row: {
          activo: boolean
          ciudad: string | null
          direccion: string | null
          id: number
          nombre: string
          telefono: string | null
          tipo: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          direccion?: string | null
          id?: number
          nombre: string
          telefono?: string | null
          tipo: string
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          direccion?: string | null
          id?: number
          nombre?: string
          telefono?: string | null
          tipo?: string
        }
        Relationships: []
      }
      rango: {
        Row: {
          activo: boolean
          bono_cent: number | null
          codigo: string
          definido: boolean
          frontales_activos: number | null
          id: number
          nombre: string
          orden: number
          puntos_grupales: number | null
        }
        Insert: {
          activo?: boolean
          bono_cent?: number | null
          codigo: string
          definido?: boolean
          frontales_activos?: number | null
          id?: number
          nombre: string
          orden: number
          puntos_grupales?: number | null
        }
        Update: {
          activo?: boolean
          bono_cent?: number | null
          codigo?: string
          definido?: boolean
          frontales_activos?: number | null
          id?: number
          nombre?: string
          orden?: number
          puntos_grupales?: number | null
        }
        Relationships: []
      }
      rango_ciclo: {
        Row: {
          bono_cent: number
          calculado_en: string | null
          califica: boolean
          ciclo_id: number
          frontales_activos: number
          puntos_computables: number
          puntos_grupales: number
          puntos_linea_mayor: number
          puntos_personales: number
          rango_id: number | null
          socio_id: number
        }
        Insert: {
          bono_cent?: number
          calculado_en?: string | null
          califica?: boolean
          ciclo_id: number
          frontales_activos?: number
          puntos_computables?: number
          puntos_grupales?: number
          puntos_linea_mayor?: number
          puntos_personales?: number
          rango_id?: number | null
          socio_id: number
        }
        Update: {
          bono_cent?: number
          calculado_en?: string | null
          califica?: boolean
          ciclo_id?: number
          frontales_activos?: number
          puntos_computables?: number
          puntos_grupales?: number
          puntos_linea_mayor?: number
          puntos_personales?: number
          rango_id?: number | null
          socio_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "rango_ciclo_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rango_ciclo_rango_id_fkey"
            columns: ["rango_id"]
            isOneToOne: false
            referencedRelation: "rango"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rango_ciclo_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      red_ancestro: {
        Row: {
          ancestro_id: number
          descendiente_id: number
          nivel: number
        }
        Insert: {
          ancestro_id: number
          descendiente_id: number
          nivel: number
        }
        Update: {
          ancestro_id?: number
          descendiente_id?: number
          nivel?: number
        }
        Relationships: [
          {
            foreignKeyName: "red_ancestro_ancestro_id_fkey"
            columns: ["ancestro_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_ancestro_descendiente_id_fkey"
            columns: ["descendiente_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      socio: {
        Row: {
          actualizado_en: string
          apellidos: string
          banco: string | null
          ciudad: string | null
          codigo: string
          creado_en: string
          cuenta_bancaria: string | null
          direccion: string | null
          documento: string | null
          email: string
          estado: string
          fecha_afiliacion: string | null
          fecha_nacimiento: string | null
          id: number
          nombres: string
          pack_id: number | null
          password_hash: string
          patrocinador_id: number | null
          rango_honorifico_id: number | null
          rol: string
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string
          apellidos: string
          banco?: string | null
          ciudad?: string | null
          codigo: string
          creado_en?: string
          cuenta_bancaria?: string | null
          direccion?: string | null
          documento?: string | null
          email: string
          estado?: string
          fecha_afiliacion?: string | null
          fecha_nacimiento?: string | null
          id?: number
          nombres: string
          pack_id?: number | null
          password_hash: string
          patrocinador_id?: number | null
          rango_honorifico_id?: number | null
          rol?: string
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string
          apellidos?: string
          banco?: string | null
          ciudad?: string | null
          codigo?: string
          creado_en?: string
          cuenta_bancaria?: string | null
          direccion?: string | null
          documento?: string | null
          email?: string
          estado?: string
          fecha_afiliacion?: string | null
          fecha_nacimiento?: string | null
          id?: number
          nombres?: string
          pack_id?: number | null
          password_hash?: string
          patrocinador_id?: number | null
          rango_honorifico_id?: number | null
          rol?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socio_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "pack"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socio_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socio_rango_honorifico_id_fkey"
            columns: ["rango_honorifico_id"]
            isOneToOne: false
            referencedRelation: "rango"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitud_retiro: {
        Row: {
          banco: string | null
          cuenta: string | null
          estado: string
          id: number
          monto_cent: number
          motivo_rechazo: string | null
          procesado_en: string | null
          procesado_por: number | null
          socio_id: number
          solicitado_en: string
        }
        Insert: {
          banco?: string | null
          cuenta?: string | null
          estado?: string
          id?: number
          monto_cent: number
          motivo_rechazo?: string | null
          procesado_en?: string | null
          procesado_por?: number | null
          socio_id: number
          solicitado_en?: string
        }
        Update: {
          banco?: string | null
          cuenta?: string | null
          estado?: string
          id?: number
          monto_cent?: number
          motivo_rechazo?: string | null
          procesado_en?: string | null
          procesado_por?: number | null
          socio_id?: number
          solicitado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitud_retiro_procesado_por_fkey"
            columns: ["procesado_por"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_retiro_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher: {
        Row: {
          banco: string | null
          estado: string
          fecha_deposito: string | null
          id: number
          imagen_url: string
          monto_cent: number
          motivo_rechazo: string | null
          numero_operacion: string | null
          orden_id: number
          revisado_en: string | null
          revisado_por: number | null
          subido_en: string
        }
        Insert: {
          banco?: string | null
          estado?: string
          fecha_deposito?: string | null
          id?: number
          imagen_url: string
          monto_cent: number
          motivo_rechazo?: string | null
          numero_operacion?: string | null
          orden_id: number
          revisado_en?: string | null
          revisado_por?: number | null
          subido_en?: string
        }
        Update: {
          banco?: string | null
          estado?: string
          fecha_deposito?: string | null
          id?: number
          imagen_url?: string
          monto_cent?: number
          motivo_rechazo?: string | null
          numero_operacion?: string | null
          orden_id?: number
          revisado_en?: string | null
          revisado_por?: number | null
          subido_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "orden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_movimiento: {
        Row: {
          ciclo_id: number | null
          comision_id: number | null
          concepto: string
          creado_en: string
          id: number
          monto_cent: number
          saldo_despues_cent: number
          socio_id: number
          tipo: string
        }
        Insert: {
          ciclo_id?: number | null
          comision_id?: number | null
          concepto: string
          creado_en?: string
          id?: number
          monto_cent: number
          saldo_despues_cent: number
          socio_id: number
          tipo: string
        }
        Update: {
          ciclo_id?: number | null
          comision_id?: number | null
          concepto?: string
          creado_en?: string
          id?: number
          monto_cent?: number
          saldo_despues_cent?: number
          socio_id?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_movimiento_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_movimiento_comision_id_fkey"
            columns: ["comision_id"]
            isOneToOne: false
            referencedRelation: "comision"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_movimiento_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_frontales_activos: {
        Row: {
          ciclo_id: number | null
          frontales_activos: number | null
          socio_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activacion_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_ancestro_ancestro_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      v_puntos_ciclo: {
        Row: {
          ciclo_id: number | null
          puntos_activacion: number | null
          puntos_rango: number | null
          puntos_residual: number | null
          socio_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimiento_puntos_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_puntos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
      v_wallet_saldo: {
        Row: {
          saldo_cent: number | null
          socio_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_movimiento_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socio"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_current_socio_id: { Args: never; Returns: number }
      fn_is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
