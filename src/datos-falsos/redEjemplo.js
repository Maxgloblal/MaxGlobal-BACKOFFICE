/**
 * Datos falsos de la Red (P-12 Mi Red)
 * Total: 47 socios
 * Regla de protección de datos (Ley 29733): Sin teléfono, correo ni comisiones ajenas.
 */
export const redMaria = {
  totalSocios: 47,
  raiz: {
    id: 'm1',
    nombre: 'María Torres',
    pack: 'Gold',
    puntos: 72,
    activo: true,
    hijos: [
      {
        id: 'c1',
        nombre: 'Carlos Ríos',
        pack: 'Gold',
        puntos: 180,
        activo: true,
        hijos: [
          {
            id: 'l1',
            nombre: 'Lucía Pérez',
            pack: 'Ejecutivo',
            puntos: 70,
            activo: true,
            hijos: [
              {
                id: 'j1',
                nombre: 'Jorge M.',
                pack: 'Kit',
                puntos: 0,
                activo: false,
                hijos: []
              }
            ]
          }
        ]
      },
      {
        id: 'r1',
        nombre: 'Rosa Díaz',
        pack: 'Ejecutivo',
        puntos: 94,
        activo: true,
        hijos: []
      },
      {
        id: 'p1',
        nombre: 'Pedro Salas',
        pack: 'Gold',
        puntos: 150,
        activo: true,
        hijos: []
      },
      {
        id: 'e1',
        nombre: 'Elena Vargas',
        pack: 'Ejecutivo',
        puntos: 12,
        activo: false,
        hijos: []
      }
    ]
  }
};
