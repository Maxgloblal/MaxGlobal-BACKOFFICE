import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TAREA-70 · Optimización Móvil y Rendimiento: Code Splitting con React.lazy()', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  it('1 · App.jsx importa lazy y Suspense desde react', () => {
    expect(appContent).toMatch(/import\s+React,\s*\{\s*[^}]*\blazy\b[^}]*\}\s*from\s*['"]react['"]/);
    expect(appContent).toMatch(/import\s+React,\s*\{\s*[^}]*\bSuspense\b[^}]*\}\s*from\s*['"]react['"]/);
  });

  it('2 · Las páginas principales de Socio y Admin se importan mediante lazy()', () => {
    const paginasClave = [
      'P10InicioSesion',
      'P11PanelSocio',
      'P12MiRed',
      'P13TiendaRecompra',
      'P14MisComisiones',
      'P15MiRango',
      'P16MiEnlace',
      'P17MisPedidos',
      'P18MiPerfil',
      'P19MiBilletera',
      'P20TableroAdmin',
      'P23BandejaConfirmacion',
      'P25CierreCiclo',
      'P27GestionSocios',
      'P30GestionRetiros',
      'P32GestionProductos'
    ];

    for (const pag of paginasClave) {
      const regex = new RegExp(`const\\s+${pag}\\s*=\\s*lazy\\s*\\(\\s*\\(\\)\\s*=>\\s*import\\(['"\`]./paginas/${pag}['"\`]\\)\\)`);
      expect(appContent, `Se esperaba que ${pag} fuera importado con lazy()`).toMatch(regex);
    }
  });

  it('3 · Cada ruta dinámica está protegida con Suspense y un fallback de carga', () => {
    expect(appContent).toContain('Suspense');
    expect(appContent).toContain('fallback=');
    expect(appContent).toContain('CargandoPantalla');
  });

  it('4 · Todos los archivos referenciados en los lazy imports existen físicamente en disco', () => {
    const importRegex = /import\(['"`]\.\/paginas\/([^'"`]+)['"`]\)/g;
    let match;
    const paginasEncontradas = [];

    while ((match = importRegex.exec(appContent)) !== null) {
      paginasEncontradas.push(match[1]);
    }

    expect(paginasEncontradas.length).toBeGreaterThanOrEqual(25);

    const paginasDir = path.resolve(__dirname, '../paginas');
    for (const nom of paginasEncontradas) {
      const existeJsx = fs.existsSync(path.join(paginasDir, `${nom}.jsx`));
      const existeJs = fs.existsSync(path.join(paginasDir, `${nom}.js`));
      expect(existeJsx || existeJs, `El archivo para la página ${nom} no existe en ${paginasDir}`).toBe(true);
    }
  });
});
