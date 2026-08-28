import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// mulberry32 — determinista, misma semilla, misma secuencia
export function createPrng(semilla = 20260828) {
  return function () {
    semilla |= 0; semilla = (semilla + 0x6D2B79F5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function precioFinal(precioListaCent, descuentoPct) {
  return Math.round(precioListaCent * (1 - (descuentoPct / 100)));
}

export function descuentoCent(subtotalCent, totalCent) {
  return subtotalCent - totalCent;
}

export function puntosDe(puntosUnitario, cantidad) {
  return puntosUnitario * cantidad;
}

export function puntosMovimiento(orden) {
  return orden.puntos_total;
}

export function generarRedDeterminista() {
  const azar = createPrng(20260828); // Semilla fija: 20260828

  const PACKS = {
    EMPRENDEDOR: { id: 1, codigo: 'EMPRENDEDOR', precio_cent: 12000, puntos_rango: 0, descuento_recompra_pct: 40.0, solo_afilia_igual: true },
    EJECUTIVO: { id: 2, codigo: 'EJECUTIVO', precio_cent: 36000, puntos_rango: 70, descuento_recompra_pct: 50.0, solo_afilia_igual: false },
    GOLD: { id: 3, codigo: 'GOLD', precio_cent: 120000, puntos_rango: 150, descuento_recompra_pct: 50.0, solo_afilia_igual: false },
    FAMILIAR: { id: 4, codigo: 'FAMILIAR', precio_cent: 400000, puntos_rango: 400, descuento_recompra_pct: 50.0, solo_afilia_igual: false },
    EMPRESARIAL: { id: 5, codigo: 'EMPRESARIAL', precio_cent: 800000, puntos_rango: 800, descuento_recompra_pct: 50.0, solo_afilia_igual: false }
  };

  const PRODUCTOS = [
    { id: 1, codigo: 'CAFE', precio_lista_cent: 15000, puntos: 18 },
    { id: 2, codigo: 'COLAGENO', precio_lista_cent: 15000, puntos: 18 },
    { id: 3, codigo: 'AC-MORINGA', precio_lista_cent: 12000, puntos: 14 },
    { id: 4, codigo: 'ESPLENDOR', precio_lista_cent: 12000, puntos: 14 },
    { id: 5, codigo: 'AC-OREGANO', precio_lista_cent: 6000, puntos: 8 },
    { id: 6, codigo: 'CAP-MORINGA', precio_lista_cent: 6000, puntos: 8 },
    { id: 7, codigo: 'HAR-MORINGA', precio_lista_cent: 5000, puntos: 6 },
    { id: 8, codigo: 'DALBA', precio_lista_cent: 7000, puntos: 10 }
  ];

  const NOMBRES = ['CARLOS', 'JUAN', 'PEDRO', 'MIGUEL', 'JOSE', 'LUCIA', 'MARIA', 'ROSA', 'ANA', 'JORGE', 'MANUEL', 'VICTOR', 'CESAR', 'PATRICIA', 'CARMEN', 'RAQUEL', 'GABRIEL', 'ANDRES', 'FERNANDO', 'RICARDO', 'SONIA', 'TERESA', 'MONICA', 'SILVIA', 'VALERIA', 'PAOLA', 'CLAUDIA', 'DANIEL', 'SERGIO', 'ROBERTO'];
  const APELLIDOS = ['QUISPE', 'ROJAS', 'MENDOZA', 'VARGAS', 'LEON', 'PAREDES', 'CASTRO', 'FLORES', 'RAMOS', 'DIAZ', 'TORRES', 'MORALES', 'GUERRERO', 'HERRERA', 'GUTIERREZ', 'SANCHEZ', 'CRUZ', 'REYES', 'CHAVEZ', 'VASQUEZ', 'RAMIREZ', 'ESPINOZA', 'ALVAREZ', 'CABRERA', 'BENITEZ'];
  const CIUDADES = ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura', 'Chiclayo', 'Iquitos'];
  const BANCOS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank'];

  const PASSWORD_HASH = '$2a$12$e8YnCsmfU8oYhJ14KkY59e5q1o7w/G1rG5k4mJk9d0h5l1z8u3e2q';

  // 1. RAMA DE LABORATORIO ESCRITA A MANO (Socios 1 al 13)
  // Socio 12 está a nivel 11 (11 ancestros).
  // Socio 13 cuelga del 2 (nivel 2, inactivo en todos los ciclos).
  const socios = [
    { id: 1, nombres: 'MAXIMO', apellidos: 'ADMIN', pack: 'EMPRESARIAL', patrocinador_id: null, rol: 'admin', fecha_afiliacion: '2026-06-01', ciudad: 'Lima', banco: 'BCP', nivel: 0 },
    { id: 2, nombres: 'ANA', apellidos: 'QUISPE', pack: 'GOLD', patrocinador_id: 1, rol: 'socio', fecha_afiliacion: '2026-06-01', ciudad: 'Lima', banco: 'BCP', nivel: 1 },
    { id: 3, nombres: 'BRUNO', apellidos: 'ROJAS', pack: 'GOLD', patrocinador_id: 2, rol: 'socio', fecha_afiliacion: '2026-06-02', ciudad: 'Arequipa', banco: 'BBVA', nivel: 2 },
    { id: 4, nombres: 'CARLA', apellidos: 'MENDOZA', pack: 'EJECUTIVO', patrocinador_id: 3, rol: 'socio', fecha_afiliacion: '2026-07-01', ciudad: 'Trujillo', banco: 'Interbank', nivel: 3 },
    { id: 5, nombres: 'DIEGO', apellidos: 'SALAS', pack: 'EJECUTIVO', patrocinador_id: 4, rol: 'socio', fecha_afiliacion: '2026-06-03', ciudad: 'Cusco', banco: 'Scotiabank', nivel: 4 },
    { id: 6, nombres: 'ELENA', apellidos: 'VARGAS', pack: 'GOLD', patrocinador_id: 5, rol: 'socio', fecha_afiliacion: '2026-06-03', ciudad: 'Piura', banco: 'BCP', nivel: 5 },
    { id: 7, nombres: 'FABIO', apellidos: 'LEON', pack: 'GOLD', patrocinador_id: 6, rol: 'socio', fecha_afiliacion: '2026-06-04', ciudad: 'Chiclayo', banco: 'BBVA', nivel: 6 },
    { id: 8, nombres: 'GINA', apellidos: 'PAREDES', pack: 'GOLD', patrocinador_id: 7, rol: 'socio', fecha_afiliacion: '2026-06-04', ciudad: 'Iquitos', banco: 'Interbank', nivel: 7 },
    { id: 9, nombres: 'HUGO', apellidos: 'CASTRO', pack: 'GOLD', patrocinador_id: 8, rol: 'socio', fecha_afiliacion: '2026-06-05', ciudad: 'Lima', banco: 'BCP', nivel: 8 },
    { id: 10, nombres: 'IRIS', apellidos: 'FLORES', pack: 'GOLD', patrocinador_id: 9, rol: 'socio', fecha_afiliacion: '2026-06-05', ciudad: 'Arequipa', banco: 'BBVA', nivel: 9 },
    { id: 11, nombres: 'JOEL', apellidos: 'RAMOS', pack: 'GOLD', patrocinador_id: 10, rol: 'socio', fecha_afiliacion: '2026-06-06', ciudad: 'Trujillo', banco: 'Interbank', nivel: 10 },
    { id: 12, nombres: 'KARLA', apellidos: 'DIAZ', pack: 'GOLD', patrocinador_id: 11, rol: 'socio', fecha_afiliacion: '2026-06-06', ciudad: 'Cusco', banco: 'Scotiabank', nivel: 11 },
    { id: 13, nombres: 'LUIS', apellidos: 'TORRES', pack: 'EMPRENDEDOR', patrocinador_id: 2, rol: 'socio', fecha_afiliacion: '2026-06-07', ciudad: 'Lima', banco: 'BCP', nivel: 2 }
  ];

  // Socio 14 cuelga de 12 para garantizar exactamente profundidad 12
  // Contabilidad de packs en socios 2..13:
  // EMPRENDEDOR: 1 (socio 13)
  // EJECUTIVO: 2 (socios 4, 5)
  // GOLD: 9 (socios 2, 3, 6, 7, 8, 9, 10, 11, 12)
  // FAMILIAR: 0
  // EMPRESARIAL: 0

  // Distribución objetivo total de 500 socios (socios 2..501):
  // EMPRENDEDOR: 225
  // EJECUTIVO: 150
  // GOLD: 75
  // FAMILIAR: 35
  // EMPRESARIAL: 15
  // (Total: 500)

  // Creamos la bolsa exacta de packs restantes para los socios 14..501 (488 socios):
  const bolsaPacks = [];
  const restantes = {
    EMPRENDEDOR: 225 - 1, // 224
    EJECUTIVO: 150 - 2,    // 148
    GOLD: 75 - 9,          // 66
    FAMILIAR: 35 - 0,      // 35
    EMPRESARIAL: 15 - 0    // 15
  };

  for (const [cod, cant] of Object.entries(restantes)) {
    for (let i = 0; i < cant; i++) {
      bolsaPacks.push(cod);
    }
  }

  // Barajamos la bolsa de manera determinista con Fisher-Yates usando azar()
  for (let i = bolsaPacks.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [bolsaPacks[i], bolsaPacks[j]] = [bolsaPacks[j], bolsaPacks[i]];
  }

  let colgadosDeRaizPorFaltaCompatible = 0;

  // 2. GENERACIÓN DETERMINISTA DE SOCIOS 14 AL 501
  for (let id = 14; id <= 501; id++) {
    let packCodigo;

    // Socio 14: garantizamos que sea GOLD o el siguiente de la bolsa, colgado de 12 para nivel 12
    if (id === 14) {
      // Tomamos un pack no-EMPRENDEDOR de la bolsa (ej. GOLD o el primero disponible)
      const idxNonEmp = bolsaPacks.findIndex(p => p !== 'EMPRENDEDOR');
      packCodigo = bolsaPacks.splice(idxNonEmp, 1)[0];
    } else {
      packCodigo = bolsaPacks.pop();
    }

    let patrocinador;

    if (id === 14) {
      // Socio 14 cuelga de 12 (nivel 11 -> nivel 12)
      patrocinador = socios.find(s => s.id === 12);
    } else {
      // Regla de patrocinador con tope de profundidad 12 (patrocinador.nivel <= 11)
      // Si el pack NO es EMPRENDEDOR -> patrocinador SOLO no-EMPRENDEDOR
      // Si el pack ES EMPRENDEDOR -> patrocinador cualquiera con nivel <= 11
      let candidatos;
      if (packCodigo === 'EMPRENDEDOR') {
        candidatos = socios.filter(s => s.nivel <= 11);
      } else {
        candidatos = socios.filter(s => s.pack !== 'EMPRENDEDOR' && s.nivel <= 11);
      }

      if (candidatos.length > 0) {
        const idx = Math.floor(azar() * candidatos.length);
        patrocinador = candidatos[idx];
      } else {
        // Fallback a raíz
        patrocinador = socios[0]; // ID 1
        colgadosDeRaizPorFaltaCompatible++;
      }
    }

    const rFecha = azar();
    let fechaAfiliacion;
    if (rFecha < 0.55) {
      const dia = String(Math.floor(azar() * 28) + 1).padStart(2, '0');
      fechaAfiliacion = `2026-06-${dia}`;
    } else if (rFecha < 0.82) {
      const dia = String(Math.floor(azar() * 28) + 1).padStart(2, '0');
      fechaAfiliacion = `2026-07-${dia}`;
    } else {
      const dia = String(Math.floor(azar() * 24) + 1).padStart(2, '0');
      fechaAfiliacion = `2026-08-${dia}`;
    }

    const nombre = NOMBRES[Math.floor(azar() * NOMBRES.length)];
    const apellido = APELLIDOS[Math.floor(azar() * APELLIDOS.length)];
    const ciudad = CIUDADES[Math.floor(azar() * CIUDADES.length)];
    const banco = BANCOS[Math.floor(azar() * BANCOS.length)];

    socios.push({
      id,
      nombres: nombre,
      apellidos: apellido,
      pack: packCodigo,
      patrocinador_id: patrocinador.id,
      rol: 'socio',
      fecha_afiliacion: fechaAfiliacion,
      ciudad,
      banco,
      nivel: patrocinador.nivel + 1
    });
  }

  const sociosCompletos = socios.map(s => {
    const padId = String(s.id).padStart(5, '0');
    const dni = String(10000000 + s.id);
    const tel = '9' + String(80000000 + s.id);
    const cta = '0011' + String(1000000000000000n + BigInt(s.id)).slice(0, 16);
    const anioNac = 1975 + (s.id % 25);
    const mesNac = String((s.id % 12) + 1).padStart(2, '0');
    const diaNac = String((s.id % 28) + 1).padStart(2, '0');

    return {
      ...s,
      codigo: `MG${padId}`,
      email: `socio${String(s.id).padStart(3, '0')}@ejemplo.test`,
      password_hash: PASSWORD_HASH,
      documento: dni,
      telefono: tel,
      direccion: `Av. Los Pinos ${100 + (s.id % 500)}`,
      cuenta_bancaria: cta,
      fecha_nacimiento: `${anioNac}-${mesNac}-${diaNac}`,
      pack_id: PACKS[s.pack].id,
      estado: 'activo'
    };
  });

  // 3. ÓRDENES, VOUCHERS, DETALLES Y MOVIMIENTOS
  const ordenes = [];
  const vouchers = [];
  const ordenDetalles = [];
  const movimientoPuntos = [];

  let ordenSeq = 1;
  let voucherSeq = 1;
  let detalleSeq = 1;
  let movSeq = 1;

  const idsPorConfirmar = new Set([496, 497, 498, 499, 500, 501]);

  for (const s of sociosCompletos) {
    if (s.id === 1) continue;

    const packInfo = PACKS[s.pack];
    const mesAfiliacion = parseInt(s.fecha_afiliacion.slice(5, 7), 10);
    const cicloId = mesAfiliacion === 6 ? 1 : mesAfiliacion === 7 ? 2 : 3;

    const esPorConfirmar = idsPorConfirmar.has(s.id);
    const estadoOrden = esPorConfirmar ? 'por_confirmar' : 'confirmada';
    const estadoVoucher = esPorConfirmar ? 'pendiente' : 'aprobado';
    const aprobadaPor = esPorConfirmar ? null : 1;
    const aprobadaEn = esPorConfirmar ? null : `${s.fecha_afiliacion} 12:00:00`;

    const ordenId = ordenSeq++;
    const numOp = String(10000000 + ordenId);

    const ordenAfil = {
      id: ordenId,
      codigo: `ORD-2026-${String(ordenId).padStart(6, '0')}`,
      socio_id: s.id,
      ciclo_id: cicloId,
      pack_id: packInfo.id,
      tipo: 'afiliacion',
      canal: 'directo',
      punto_entrega_id: 1,
      subtotal_cent: packInfo.precio_cent,
      descuento_cent: 0,
      total_cent: packInfo.precio_cent,
      puntos_total: packInfo.puntos_rango,
      estado: estadoOrden,
      creada_en: `${s.fecha_afiliacion} 09:00:00`,
      aprobada_en: aprobadaEn,
      aprobada_por: aprobadaPor
    };
    ordenes.push(ordenAfil);

    vouchers.push({
      id: voucherSeq++,
      orden_id: ordenAfil.id,
      imagen_url: `https://storage.maxglobal.com/vouchers/vou-${ordenAfil.id}.jpg`,
      monto_cent: ordenAfil.total_cent,
      banco: s.banco,
      numero_operacion: numOp,
      fecha_deposito: s.fecha_afiliacion,
      estado: estadoVoucher,
      subido_en: `${s.fecha_afiliacion} 09:30:00`,
      revisado_en: aprobadaEn,
      revisado_por: aprobadaPor
    });

    if (ordenAfil.estado === 'confirmada') {
      movimientoPuntos.push({
        id: movSeq++,
        socio_id: ordenAfil.socio_id,       // 🔴 Derivado directamente de la orden
        ciclo_id: ordenAfil.ciclo_id,       // 🔴 Derivado directamente de la orden
        orden_id: ordenAfil.id,             // 🔴 Derivado directamente de la orden
        origen: 'afiliacion',
        puntos: ordenAfil.puntos_total,     // 🔴 SIEMPRE orden.puntos_total
        cuenta_activacion: true,
        cuenta_residual: false,             // 🔴 NUNCA genera residual
        cuenta_rango: true,
        creado_en: `${s.fecha_afiliacion} 12:00:00`,
        nota: `Afiliación Pack ${packInfo.codigo}`
      });
    }
  }

  // 4. RECOMPRAS
  function crearOrdenRecompra(socio, cicloId, fecha, productosItems) {
    const packInfo = PACKS[socio.pack];
    const descuentoPct = packInfo.descuento_recompra_pct;

    let subtotalCent = 0;
    let totalCent = 0;
    let puntosTotal = 0;

    const itemsCalculados = productosItems.map(item => {
      const prod = PRODUCTOS.find(p => p.id === item.producto_id);
      const precioFinalUnit = precioFinal(prod.precio_lista_cent, descuentoPct);
      const puntosSub = puntosDe(prod.puntos, item.cantidad);
      const subtotalItem = prod.precio_lista_cent * item.cantidad;
      const totalItem = precioFinalUnit * item.cantidad;

      subtotalCent += subtotalItem;
      totalCent += totalItem;
      puntosTotal += puntosSub;

      return {
        id: detalleSeq++,
        producto_id: prod.id,
        cantidad: item.cantidad,
        precio_lista_cent: prod.precio_lista_cent,
        descuento_pct: descuentoPct,
        precio_final_cent: precioFinalUnit,
        puntos_unitario: prod.puntos,
        puntos_subtotal: puntosSub
      };
    });

    // 🔴 Aritmética exacta por resta: descuento_cent = subtotal_cent - total_cent
    const descCent = descuentoCent(subtotalCent, totalCent);
    const ordenId = ordenSeq++;
    const numOp = String(20000000 + ordenId);

    const orden = {
      id: ordenId,
      codigo: `ORD-2026-${String(ordenId).padStart(6, '0')}`,
      socio_id: socio.id,
      ciclo_id: cicloId,
      pack_id: null,
      tipo: 'recompra',
      canal: 'directo',
      punto_entrega_id: 1,
      subtotal_cent: subtotalCent,
      descuento_cent: descCent,
      total_cent: totalCent,
      puntos_total: puntosTotal,
      estado: 'confirmada',
      creada_en: `${fecha} 10:00:00`,
      aprobada_en: `${fecha} 11:00:00`,
      aprobada_por: 1
    };
    ordenes.push(orden);

    for (const item of itemsCalculados) {
      ordenDetalles.push({
        ...item,
        orden_id: orden.id
      });
    }

    vouchers.push({
      id: voucherSeq++,
      orden_id: orden.id,
      imagen_url: `https://storage.maxglobal.com/vouchers/vou-${orden.id}.jpg`,
      monto_cent: orden.total_cent, // 🔴 Siempre coincide con total_cent
      banco: socio.banco,
      numero_operacion: numOp,
      fecha_deposito: fecha,
      estado: 'aprobado',
      subido_en: `${fecha} 10:30:00`,
      revisado_en: `${fecha} 11:00:00`,
      revisado_por: 1
    });

    movimientoPuntos.push({
      id: movSeq++,
      socio_id: orden.socio_id,     // 🔴 Derivado directamente de la orden
      ciclo_id: orden.ciclo_id,     // 🔴 Derivado directamente de la orden
      orden_id: orden.id,           // 🔴 Derivado directamente de la orden
      origen: 'recompra',
      puntos: orden.puntos_total,   // 🔴 SIEMPRE orden.puntos_total
      cuenta_activacion: true,
      cuenta_residual: true,
      cuenta_rango: true,
      creado_en: `${fecha} 11:00:00`,
      nota: `Recompra Ciclo ${cicloId}`
    });
  }

  // Casos Borde Específicos:
  // Socio 2: Activo en los 3 ciclos (jun: 150 afil + 36 recompra = 186; jul: 72 recompra; ago: 72 recompra)
  crearOrdenRecompra(sociosCompletos.find(s => s.id === 2), 1, '2026-06-15', [{ producto_id: 1, cantidad: 2 }]);
  crearOrdenRecompra(sociosCompletos.find(s => s.id === 2), 2, '2026-07-15', [{ producto_id: 1, cantidad: 4 }]);
  crearOrdenRecompra(sociosCompletos.find(s => s.id === 2), 3, '2026-08-15', [{ producto_id: 2, cantidad: 4 }]);

  // Socio 3: Activo ciclo 2 (72 pts), inactivo ciclo 3 (0 pts)
  crearOrdenRecompra(sociosCompletos.find(s => s.id === 3), 2, '2026-07-16', [{ producto_id: 1, cantidad: 4 }]);

  // Socio 4: Activo ciclo 3 (72 pts)
  crearOrdenRecompra(sociosCompletos.find(s => s.id === 4), 3, '2026-08-16', [{ producto_id: 1, cantidad: 4 }]);

  // Socio 5: Exactamente 70 pts en jul (5 x Esplendor a 14 pts = 70 pts) -> ACTIVO
  crearOrdenRecompra(sociosCompletos.find(s => s.id === 5), 2, '2026-07-17', [{ producto_id: 4, cantidad: 5 }]);

  // Socio 6: Exactamente 68 pts en jul (3 x Café [54] + 1 x Moringa [14] = 68 pts) -> INACTIVO
  crearOrdenRecompra(sociosCompletos.find(s => s.id === 6), 2, '2026-07-18', [{ producto_id: 1, cantidad: 3 }, { producto_id: 3, cantidad: 1 }]);

  // Recompras deterministas en masa para alcanzar 35% - 50% de activos por ciclo
  for (let id = 14; id <= 501; id++) {
    if (idsPorConfirmar.has(id) || id === 13) continue;
    const s = sociosCompletos.find(soc => soc.id === id);
    const mesAfiliacion = parseInt(s.fecha_afiliacion.slice(5, 7), 10);

    // Recompras deterministas para alcanzar entre 35% y 50% de socios activos en cada ciclo
    // Ciclo 1 (Junio): si se afilió en junio
    if (mesAfiliacion === 6 && azar() < 0.60) {
      crearOrdenRecompra(s, 1, '2026-06-20', [
        { producto_id: (id % 2) + 1, cantidad: (id % 3) + 4 }, // Café o Colágeno (18 pts c/u) -> 72 a 108 pts
        { producto_id: ((id + 2) % 8) + 1, cantidad: 1 }
      ]);
    }

    // Ciclo 2 (Julio): si se afilió en junio o julio
    if (mesAfiliacion <= 7 && azar() < 0.46) {
      crearOrdenRecompra(s, 2, '2026-07-20', [
        { producto_id: (id % 2) + 1, cantidad: (id % 3) + 4 }, // Café o Colágeno (18 pts c/u) -> 72 a 108 pts
        { producto_id: ((id + 3) % 8) + 1, cantidad: 1 }
      ]);
    }

    // Ciclo 3 (Agosto): si se afilió en junio, julio o agosto
    if (mesAfiliacion <= 8 && azar() < 0.44) {
      crearOrdenRecompra(s, 3, '2026-08-20', [
        { producto_id: ((id + 1) % 2) + 1, cantidad: (id % 3) + 4 }, // Café o Colágeno (18 pts c/u) -> 72 a 108 pts
        { producto_id: ((id + 4) % 8) + 1, cantidad: 1 }
      ]);
    }
  }

  // 5. ACTIVACIÓN POR CICLO
  const activaciones = [];
  for (let cicloId = 1; cicloId <= 3; cicloId++) {
    for (let id = 1; id <= 501; id++) {
      const puntosCiclo = movimientoPuntos
        .filter(m => m.socio_id === id && m.ciclo_id === cicloId && m.cuenta_activacion)
        .reduce((sum, m) => sum + m.puntos, 0);

      const ordenAfiliacion = ordenes.find(o => o.socio_id === id && o.tipo === 'afiliacion');
      const cubreAfiliacion = ordenAfiliacion &&
        ordenAfiliacion.ciclo_id === cicloId &&
        ordenAfiliacion.estado === 'confirmada';

      const activo = (puntosCiclo >= 70) || Boolean(cubreAfiliacion);

      activaciones.push({
        socio_id: id,
        ciclo_id: cicloId,
        puntos_personales: puntosCiclo,
        activo: activo,
        calculado_en: '2026-08-28 10:00:00'
      });
    }
  }

  // Validación de consistencia estricta orden <-> movimiento_puntos (socio_id, ciclo_id, puntos)
  for (const m of movimientoPuntos) {
    const o = ordenes.find(ord => ord.id === m.orden_id);
    if (!o) throw new Error(`Inconsistencia: Movimiento ${m.id} apunta a orden inexistente ${m.orden_id}`);
    if (o.socio_id !== m.socio_id) throw new Error(`Inconsistencia: Movimiento ${m.id} (socio ${m.socio_id}) apunta a orden ${o.id} de otro socio (${o.socio_id})`);
    if (o.ciclo_id !== m.ciclo_id) throw new Error(`Inconsistencia: Movimiento ${m.id} (ciclo ${m.ciclo_id}) apunta a orden ${o.id} de otro ciclo (${o.ciclo_id})`);
    if (o.puntos_total !== m.puntos) throw new Error(`Inconsistencia: Movimiento ${m.id} puntos ${m.puntos} <> orden ${o.id} puntos ${o.puntos_total}`);
  }

  return {
    socios: sociosCompletos,
    ordenes,
    vouchers,
    ordenDetalles,
    movimientoPuntos,
    activaciones,
    colgadosDeRaizPorFaltaCompatible
  };
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function construirChunksSQL(data) {
  const { socios, ordenes, vouchers, ordenDetalles, movimientoPuntos, activaciones } = data;
  const chunks = [];

  // 1. Limpieza y ciclos iniciales
  chunks.push({
    name: '00_reset_y_ciclos.sql',
    sql: `TRUNCATE activacion, movimiento_puntos, orden_detalle, voucher, envio, orden, red_ancestro, ciclo RESTART IDENTITY CASCADE;\n` +
      `DELETE FROM socio;\n` +
      `ALTER SEQUENCE socio_id_seq RESTART WITH 1;\n` +
      `INSERT INTO ciclo (id, anio, mes, fecha_inicio, fecha_fin, estado) VALUES\n` +
      `  (1, 2026, 6, '2026-06-01', '2026-06-30', 'abierto'),\n` +
      `  (2, 2026, 7, '2026-07-01', '2026-07-31', 'abierto'),\n` +
      `  (3, 2026, 8, '2026-08-01', '2026-08-31', 'abierto');`
  });

  // 2. Socios en chunks de 100
  const socioChunks = chunkArray(socios, 100);
  socioChunks.forEach((batch, idx) => {
    chunks.push({
      name: `01_socios_parte_${idx + 1}.sql`,
      sql: `INSERT INTO socio (id, codigo, nombres, apellidos, documento, email, password_hash, telefono, direccion, ciudad, banco, cuenta_bancaria, patrocinador_id, pack_id, fecha_afiliacion, fecha_nacimiento, rol, estado) VALUES\n` +
        batch.map(s => {
          const patVal = s.patrocinador_id === null ? 'NULL' : s.patrocinador_id;
          return `  (${s.id}, '${s.codigo}', '${s.nombres}', '${s.apellidos}', '${s.documento}', '${s.email}', '${s.password_hash}', '${s.telefono}', '${s.direccion}', '${s.ciudad}', '${s.banco}', '${s.cuenta_bancaria}', ${patVal}, ${s.pack_id}, '${s.fecha_afiliacion}', '${s.fecha_nacimiento}', '${s.rol}', '${s.estado}')`;
        }).join(',\n') + ';'
    });
  });

  // 3. Red Ancestro
  chunks.push({
    name: '02_red_ancestro.sql',
    sql: `TRUNCATE red_ancestro;\n` +
      `WITH RECURSIVE cadena AS (\n` +
      `  SELECT id AS descendiente_id, patrocinador_id AS ancestro_id, 1::smallint AS nivel\n` +
      `  FROM socio WHERE patrocinador_id IS NOT NULL\n` +
      `  UNION ALL\n` +
      `  SELECT c.descendiente_id, s.patrocinador_id, (c.nivel + 1)::smallint\n` +
      `  FROM cadena c JOIN socio s ON s.id = c.ancestro_id\n` +
      `  WHERE s.patrocinador_id IS NOT NULL AND c.nivel < 50\n` +
      `)\n` +
      `INSERT INTO red_ancestro (descendiente_id, ancestro_id, nivel)\n` +
      `SELECT descendiente_id, ancestro_id, nivel FROM cadena;`
  });

  // 4. Órdenes en chunks de 150
  const ordenChunks = chunkArray(ordenes, 150);
  ordenChunks.forEach((batch, idx) => {
    chunks.push({
      name: `03_ordenes_parte_${idx + 1}.sql`,
      sql: `INSERT INTO orden (id, codigo, socio_id, ciclo_id, pack_id, tipo, canal, punto_entrega_id, subtotal_cent, descuento_cent, total_cent, puntos_total, estado, creada_en, aprobada_en, aprobada_por) VALUES\n` +
        batch.map(o => {
          const packVal = o.pack_id === null ? 'NULL' : o.pack_id;
          const apPorVal = o.aprobada_por === null ? 'NULL' : o.aprobada_por;
          const apEnVal = o.aprobada_en === null ? 'NULL' : `'${o.aprobada_en}'`;
          return `  (${o.id}, '${o.codigo}', ${o.socio_id}, ${o.ciclo_id}, ${packVal}, '${o.tipo}', '${o.canal}', ${o.punto_entrega_id}, ${o.subtotal_cent}, ${o.descuento_cent}, ${o.total_cent}, ${o.puntos_total}, '${o.estado}', '${o.creada_en}', ${apEnVal}, ${apPorVal})`;
        }).join(',\n') + ';'
    });
  });

  // 5. Orden Detalle en chunks de 150
  const detChunks = chunkArray(ordenDetalles, 150);
  detChunks.forEach((batch, idx) => {
    chunks.push({
      name: `04_detalles_parte_${idx + 1}.sql`,
      sql: `INSERT INTO orden_detalle (id, orden_id, producto_id, cantidad, precio_lista_cent, descuento_pct, precio_final_cent, puntos_unitario, puntos_subtotal) VALUES\n` +
        batch.map(d => {
          return `  (${d.id}, ${d.orden_id}, ${d.producto_id}, ${d.cantidad}, ${d.precio_lista_cent}, ${d.descuento_pct}, ${d.precio_final_cent}, ${d.puntos_unitario}, ${d.puntos_subtotal})`;
        }).join(',\n') + ';'
    });
  });

  // 6. Vouchers en chunks de 150
  const vouChunks = chunkArray(vouchers, 150);
  vouChunks.forEach((batch, idx) => {
    chunks.push({
      name: `05_vouchers_parte_${idx + 1}.sql`,
      sql: `INSERT INTO voucher (id, orden_id, imagen_url, monto_cent, banco, numero_operacion, fecha_deposito, estado, subido_en, revisado_en, revisado_por) VALUES\n` +
        batch.map(v => {
          const revPorVal = v.revisado_por === null ? 'NULL' : v.revisado_por;
          const revEnVal = v.revisado_en === null ? 'NULL' : `'${v.revisado_en}'`;
          return `  (${v.id}, ${v.orden_id}, '${v.imagen_url}', ${v.monto_cent}, '${v.banco}', '${v.numero_operacion}', '${v.fecha_deposito}', '${v.estado}', '${v.subido_en}', ${revEnVal}, ${revPorVal})`;
        }).join(',\n') + ';'
    });
  });

  // 7. Movimientos en chunks de 150
  const movChunks = chunkArray(movimientoPuntos, 150);
  movChunks.forEach((batch, idx) => {
    chunks.push({
      name: `06_movimientos_parte_${idx + 1}.sql`,
      sql: `INSERT INTO movimiento_puntos (id, socio_id, ciclo_id, orden_id, origen, puntos, cuenta_activacion, cuenta_residual, cuenta_rango, creado_en, nota) VALUES\n` +
        batch.map(m => {
          return `  (${m.id}, ${m.socio_id}, ${m.ciclo_id}, ${m.orden_id}, '${m.origen}', ${m.puntos}, ${m.cuenta_activacion}, ${m.cuenta_residual}, ${m.cuenta_rango}, '${m.creado_en}', '${m.nota}')`;
        }).join(',\n') + ';'
    });
  });

  // 8. Activaciones en chunks de 250
  const actChunks = chunkArray(activaciones, 250);
  actChunks.forEach((batch, idx) => {
    chunks.push({
      name: `07_activaciones_parte_${idx + 1}.sql`,
      sql: `INSERT INTO activacion (socio_id, ciclo_id, puntos_personales, activo, calculado_en) VALUES\n` +
        batch.map(a => {
          return `  (${a.socio_id}, ${a.ciclo_id}, ${a.puntos_personales}, ${a.activo}, '${a.calculado_en}')`;
        }).join(',\n') + ';'
    });
  });

  // 9. Cierre de ciclos
  chunks.push({
    name: '08_cerrar_ciclos.sql',
    sql: `UPDATE ciclo SET estado = 'cerrado', cerrado_en = '2026-07-01 00:00:00', cerrado_por = 1 WHERE id = 1;\n` +
      `UPDATE ciclo SET estado = 'cerrado', cerrado_en = '2026-08-01 00:00:00', cerrado_por = 1 WHERE id = 2;`
  });

  return chunks;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('🌱 Generando red determinista y chunks SQL...');
  const data = generarRedDeterminista();
  console.log(`Socios: ${data.socios.length}`);
  console.log(`Colgados de raíz por falta de compatible: ${data.colgadosDeRaizPorFaltaCompatible}`);
  
  // Pack distribution check
  const packCounts = {};
  for (const s of data.socios) {
    if (s.id === 1) continue;
    packCounts[s.pack] = (packCounts[s.pack] || 0) + 1;
  }
  console.log('Distribución de packs (socios 2..501):', packCounts);

  // Depth check
  const maxDepth = Math.max(...data.socios.map(s => s.nivel));
  console.log('Profundidad máxima de socios:', maxDepth);

  // Activation check
  for (let c = 1; c <= 3; c++) {
    const act = data.activaciones.filter(a => a.ciclo_id === c && a.activo);
    const pct = ((act.length / 501) * 100).toFixed(1);
    console.log(`Ciclo ${c} activos: ${act.length} (${pct}%)`);
  }

  const chunks = construirChunksSQL(data);
  const chunksDir = path.join(__dirname, '..', 'supabase', 'seed_chunks');
  if (!fs.existsSync(chunksDir)) {
    fs.mkdirSync(chunksDir, { recursive: true });
  }

  for (const chunk of chunks) {
    const filePath = path.join(chunksDir, chunk.name);
    fs.writeFileSync(filePath, chunk.sql, 'utf8');
    console.log(`  ✓ Generado ${chunk.name}`);
  }
}
