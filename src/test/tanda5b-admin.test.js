import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  obtenerConfiguracionPlan,
  actualizarParametroConfig,
  guardarRangoConfig,
  obtenerListaSociosAdmin,
  obtenerDetalleSocioAdmin,
  actualizarDatosSocioAdmin,
  obtenerResumenTableroAdmin,
  obtenerReporteCicloAdmin,
  obtenerListaAuditoriaAdmin
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-10 · Tanda 5B: Cinco Pantallas de Administración (P-20, P-26, P-27, P-28, P-29)', () => {
  let sbAdmin;
  let sbAnon;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-tanda5b-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo al autenticar ADMIN: ${errAdmin.message}`);

    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-tanda5b-anon', persistSession: false, autoRefreshToken: false }
    });
  });

  afterAll(async () => {
    // Restaurar rango 9 a su estado original (definido = false)
    if (sbAdmin) {
      await sbAdmin.from('rango').update({
        nombre: 'Diamante Negro',
        puntos_grupales: null,
        frontales_activos: null,
        bono_cent: null,
        definido: false
      }).eq('id', 9);
    }
  });

  describe('1. P-26 · Configuración del Plan y Escala de Rangos (RF-410 a RF-416)', () => {
    it('Carga los 36 valores de config agrupados y los 16 rangos oficiales', async () => {
      const { configs, rangos } = await obtenerConfiguracionPlan(sbAdmin);
      expect(configs.length).toBe(36);
      expect(rangos.length).toBe(16);

      // Claves ajustables vs reglas duras
      const ajustables = configs.filter(c => c.esAjustable);
      expect(ajustables.length).toBe(5);

      const reglaDura = configs.find(c => c.clave === 'compresion_activa');
      expect(reglaDura.esAjustable).toBe(false);
      expect(reglaDura.valor).toBe('false');

      // Rangos 1 al 8 definidos
      const r1a8 = rangos.filter(r => r.id <= 8);
      r1a8.forEach(r => {
        expect(r.definido).toBe(true);
        expect(r.puntos_grupales).toBeGreaterThan(0);
        expect(r.bono_cent).toBeGreaterThan(0);
      });
    });

    it('Se puede actualizar un parámetro ajustable como activacion_puntos_mes y persiste', async () => {
      const res = await actualizarParametroConfig('activacion_puntos_mes', '70', sbAdmin);
      expect(res.exito).toBe(true);
      expect(res.valor).toBe('70');

      const { data } = await sbAdmin.from('config').select('valor').eq('clave', 'activacion_puntos_mes').single();
      expect(data.valor).toBe('70');
    });

    it('Guardar rango 9 actualiza sus requisitos y fija definido = true en la base', async () => {
      const res = await guardarRangoConfig(9, {
        nombre: 'Diamante Negro',
        puntos_grupales: 120000,
        frontales_activos: 8,
        bono_soles: 20000
      }, sbAdmin);
      expect(res.exito).toBe(true);

      const { data: r9 } = await sbAdmin.from('rango').select('*').eq('id', 9).single();
      expect(r9.definido).toBe(true);
      expect(r9.puntos_grupales).toBe(120000);
      expect(r9.frontales_activos).toBe(8);
      expect(r9.bono_cent).toBe(2000000); // S/. 20,000.00 en centavos

      // Restaurar inmediatamente para no afectar otras suites
      await sbAdmin.from('rango').update({
        nombre: 'Diamante Negro',
        puntos_grupales: null,
        frontales_activos: null,
        bono_cent: null,
        definido: false
      }).eq('id', 9);
    });
  });

  describe('2. P-27 · Gestión de Socios y Padrón Oficial (RF-420 a RF-427)', () => {
    it('Paginación oficial devuelve 25 socios por página de un total de 501', async () => {
      const res = await obtenerListaSociosAdmin({ pagina: 1, limite: 25 }, sbAdmin);
      expect(res.socios.length).toBe(25);
      expect(res.total).toBeGreaterThanOrEqual(501);
      expect(res.totalPaginas).toBeGreaterThanOrEqual(21);
      expect(res.pagina).toBe(1);
    });

    it('Búsqueda por nombre o código filtra correctamente por ILIKE en servidor', async () => {
      const res = await obtenerListaSociosAdmin({ busqueda: 'ANA', limite: 25 }, sbAdmin);
      expect(res.socios.length).toBeGreaterThan(0);
      const ana = res.socios.find(s => s.id === 2);
      expect(ana).toBeDefined();
      expect(ana.codigo).toBe('MG00002');
    });

    it('🔴 ANA (socio 2) tiene 0 puntos personales en Ciclo 4 (sin filas en ciclo abierto)', async () => {
      const res = await obtenerDetalleSocioAdmin(2, 4, sbAdmin);
      expect(res.socio.id).toBe(2);
      expect(res.socio.codigo).toBe('MG00002');
      expect(res.activacion.puntos_personales).toBe(0);
      expect(res.activacion.activo).toBe(false);
    });

    it('🔴 El patrocinador y el código del socio permanecen inmutables tras actualizar datos', async () => {
      const socioAntes = await obtenerDetalleSocioAdmin(2, null, sbAdmin);
      const patroIdAntes = socioAntes.socio.patrocinador_id;
      const codigoAntes = socioAntes.socio.codigo;

      // Actualizar teléfono y dirección
      await actualizarDatosSocioAdmin(2, {
        nombres: socioAntes.socio.nombres,
        apellidos: socioAntes.socio.apellidos,
        telefono: '999888777',
        direccion: 'Av. Las Flores 123',
        banco: 'BCP',
        cuenta_bancaria: '193-12345678-0-01'
      }, sbAdmin);

      const socioDespues = await obtenerDetalleSocioAdmin(2, null, sbAdmin);
      expect(socioDespues.socio.patrocinador_id).toBe(patroIdAntes);
      expect(socioDespues.socio.codigo).toBe(codigoAntes);
      expect(socioDespues.socio.telefono).toBe('999888777');
    });
  });

  describe('3. P-20 · Tablero de Control Admin (RF-400 a RF-406)', () => {
    it('Muestra Ciclo 4 como ciclo activo con estimado de comisiones inicial en S/. 0.00', async () => {
      const resumen = await obtenerResumenTableroAdmin(sbAdmin);
      expect(resumen.ciclo.id).toBe(4);
      expect(resumen.ciclo.estado).toBe('abierto');
      expect(resumen.totalSocios).toBeGreaterThanOrEqual(501);
      expect(resumen.comisionesEstimadasCent).toBe(0);
      expect(resumen.comisionesEstimadasSoles).toBe(0);
      expect(Array.isArray(resumen.ultimasOrdenes)).toBe(true);
    });
  });

  describe('4. P-28 · Reportes Financieros y Operativos (RF-430 a RF-436)', () => {
    it('Reporte de Ciclo 3 cuadra exactamente con S/. 13,479.68 en comisiones pagadas', async () => {
      const rep = await obtenerReporteCicloAdmin(3, sbAdmin);
      expect(rep.cicloActual.id).toBe(3);
      expect(rep.totalComisionesCent).toBe(1347968);
      expect(rep.totalComisionesSoles).toBe(13479.68);

      // Desglose de bonos
      expect(rep.desgloseBonos.patrocinio.totalCent).toBe(679540); // S/. 6,795.40
      expect(rep.desgloseBonos.residual.totalCent).toBe(608428);   // S/. 6,084.28
      expect(rep.desgloseBonos.rango.totalCent).toBe(60000);       // S/. 600.00

      // Margen de la empresa positivo y calculado
      expect(rep.totalRecaudadoCent).toBeGreaterThan(1347968);
      expect(rep.margenEmpresaCent).toBe(rep.totalRecaudadoCent - rep.totalComisionesCent);
      expect(rep.top10Socios.length).toBe(10);
    });
  });

  describe('5. P-29 · Auditoría del Sistema (RF-440 a RF-444)', () => {
    it('Carga la lista de eventos sin error aunque la tabla auditoria esté vacía', async () => {
      const res = await obtenerListaAuditoriaAdmin({ pagina: 1, limite: 25 }, sbAdmin);
      expect(res).toBeDefined();
      expect(Array.isArray(res.eventos)).toBe(true);
      expect(res.total).toBeGreaterThanOrEqual(0);
      expect(res.pagina).toBe(1);
    });
  });

});
