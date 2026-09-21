/**
 * Módulo de paginación centralizado para Supabase / PostgREST.
 * Evita el truncamiento silencioso del límite por defecto de 1,000 registros.
 * TAREA-48 · El límite de las mil filas.
 */

/**
 * Consulta todas las filas de una consulta en lotes consecutivos usando .range().
 * Registra un aviso en consola si se requirió más de un lote (Bloque 4.1).
 *
 * @param {Function} crearQuery - Función que retorna una nueva instancia de PostgrestFilterBuilder
 * @param {number} paso - Tamaño de cada lote (por defecto 1000)
 * @returns {Promise<Array>} Array con todas las filas acumuladas
 */
export async function consultarPaginado(crearQuery, paso = 1000) {
  let todas = [];
  let desde = 0;
  let lotes = 0;

  while (true) {
    const { data, error } = await crearQuery().range(desde, desde + paso - 1);
    if (error) throw error;
    lotes++;
    if (!data || data.length === 0) break;
    todas.push(...data);
    if (data.length < paso) break;
    desde += paso;
  }

  if (lotes > 1) {
    console.info(`[consultarPaginado] Paginación activada: se obtuvieron ${todas.length} filas en ${lotes} lotes.`);
  }

  return todas;
}

/**
 * Procesa una consulta que filtra por una lista grande de IDs (.in('columna', ids))
 * dividiendo el array en fragmentos (chunks) seguros para no exceder límites de URL
 * ni el límite de filas devueltas por PostgREST.
 *
 * @param {Array<string|number>} ids - Array completo de IDs a consultar
 * @param {Function} obtenerLote - Función async (loteIds) => Promise<Array>
 * @param {number} tamanoLote - Tamaño de cada lote (por defecto 500)
 * @returns {Promise<Array>} Array con todos los resultados concatenados
 */
export async function consultarPorLotesIds(ids, obtenerLote, tamanoLote = 500) {
  if (!ids || ids.length === 0) return [];
  let todas = [];

  for (let i = 0; i < ids.length; i += tamanoLote) {
    const lote = ids.slice(i, i + tamanoLote);
    const resultado = await obtenerLote(lote);
    if (resultado && resultado.length > 0) {
      todas.push(...resultado);
    }
  }

  return todas;
}
