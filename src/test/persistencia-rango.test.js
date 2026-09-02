import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  procesarRangoYGlobalCompleto,
  generarSqlLotesRangoCiclo,
  generarSqlComisionesRango,
  generarSqlPeriodoGlobal
} from '../../scripts/calcular-rango-y-global.mjs';

describe('TAREA-04B · Cálculo de Rangos sobre los 500 Socios', () => {
  it('procesa los 3 ciclos para los 501 socios (1,503 registros) y genera SQL', () => {
    const { resultadosRangoCiclo, comisionesRango } = procesarRangoYGlobalCompleto();

    expect(resultadosRangoCiclo.length).toBe(1503); // 501 socios x 3 ciclos

    for (let c = 1; c <= 3; c++) {
      const cicloRows = resultadosRangoCiclo.filter(r => r.ciclo_id === c);
      const calificados = cicloRows.filter(r => r.califica);
      const comisionesCiclo = comisionesRango.filter(r => r.ciclo_id === c);
      const totalBonoCent = comisionesCiclo.reduce((sum, cm) => sum + cm.monto_cent, 0);

      console.log(`[RANGOS CICLO ${c}]`);
      console.log(`  Total registros: ${cicloRows.length} | Calificados: ${calificados.length} | Comisiones pagadas: ${comisionesCiclo.length} | Total Bono: S/. ${(totalBonoCent / 100).toFixed(2)} (${totalBonoCent} cent)`);

      const conteoPorRango = {};
      for (const cal of calificados) {
        conteoPorRango[cal.rango_codigo] = (conteoPorRango[cal.rango_codigo] || 0) + 1;
      }
      console.log(`  Desglose rangos:`, conteoPorRango);
    }

    const scratch = 'C:\\Users\\JACK FRANKLIN\\.gemini\\antigravity\\brain\\eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a\\scratch';
    if (!fs.existsSync(scratch)) fs.mkdirSync(scratch, { recursive: true });

    const lotesRango = generarSqlLotesRangoCiclo(500);
    expect(lotesRango.length).toBe(4); // 500, 500, 500, 3
    lotesRango.forEach((lote, idx) => {
      fs.writeFileSync(path.join(scratch, `rango_lote_${idx}.sql`), lote);
    });

    const sqlCom = generarSqlComisionesRango();
    expect(sqlCom.length).toBeGreaterThan(0);
    fs.writeFileSync(path.join(scratch, 'comisiones_rango.sql'), sqlCom);

    const sqlGlob = generarSqlPeriodoGlobal();
    expect(sqlGlob.length).toBeGreaterThan(0);
    fs.writeFileSync(path.join(scratch, 'periodo_global.sql'), sqlGlob);
  });
});

