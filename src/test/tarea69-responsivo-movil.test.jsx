import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TAREA-69 · Auditoría y Adaptabilidad Responsiva Móvil (390px)', () => {
  const armazonCssPath = path.resolve(__dirname, '../estilos/armazon.css');
  const armazonCss = fs.readFileSync(armazonCssPath, 'utf8');
  const p25Path = path.resolve(__dirname, '../paginas/P25CierreCiclo.jsx');
  const p25Content = fs.readFileSync(p25Path, 'utf8');

  it('1 · .armazon-drawer tiene visibility: hidden cuando está cerrado y visible cuando está abierto', () => {
    // Drawer socio offcanvas cerrado
    expect(armazonCss).toMatch(/\.armazon-drawer\s*\{[^}]*visibility:\s*hidden/);
    expect(armazonCss).toMatch(/\.armazon-drawer\s*\{[^}]*transition:[^;]*visibility/);
    // Drawer socio offcanvas abierto
    expect(armazonCss).toMatch(/\.armazon-drawer\.abierto\s*\{[^}]*visibility:\s*visible/);
  });

  it('2 · .armazon-admin-sidebar tiene visibility: hidden cuando está cerrado en móvil/tablet y visible con .abierto', () => {
    // Media query móvil/tablet admin
    const mediaAdmin = armazonCss.slice(armazonCss.indexOf('@media (max-width: 1023px)'));
    expect(mediaAdmin).toMatch(/\.armazon-admin-sidebar\s*\{[^}]*visibility:\s*hidden/);
    expect(mediaAdmin).toMatch(/\.armazon-admin-sidebar\s*\{[^}]*transition:[^;]*visibility/);
    expect(mediaAdmin).toMatch(/\.armazon-admin-sidebar\.abierto\s*\{[^}]*visibility:\s*visible/);
  });

  it('3 · P-25 CierreCiclo tiene flexWrap y gap en el encabezado de vista previa para 390px', () => {
    expect(p25Content).toContain("flexWrap: 'wrap'");
    expect(p25Content).toContain("gap: 'var(--sp-2)'");
  });

  it('4 · Ningún archivo CSS tiene anchos mínimos fijos mayores a 390px en contenedores móviles', () => {
    const estilosDir = path.resolve(__dirname, '../estilos');
    const cssFiles = fs.readdirSync(estilosDir).filter(f => f.endsWith('.css'));
    const violaciones = [];

    for (const file of cssFiles) {
      const content = fs.readFileSync(path.join(estilosDir, file), 'utf8');
      // Buscar min-width hardcodeado mayor a 390px en selectores globales que no estén dentro de @media min-width
      // Verificamos que las clases principales respeten el viewport móvil
      const lineas = content.split('\n');
      lineas.forEach((linea, idx) => {
        if (/min-width:\s*([4-9]\d{2}|\d{4,})px/.test(linea) && !linea.includes('@media') && !linea.includes('/*')) {
          // Solo alertar si afecta al contenedor general sin ser un scroll horizontal contenido
          if (linea.includes('body') || linea.includes('armazon') || linea.includes('main')) {
            violaciones.push(`${file}:${idx + 1} -> ${linea.trim()}`);
          }
        }
      });
    }

    expect(violaciones).toEqual([]);
  });
});
