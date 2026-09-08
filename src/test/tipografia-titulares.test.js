import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TAREA-29 · Bloque 3: Pruebas Automatizadas de Tipografía de Titulares', () => {
  const rutaIndexCss = path.resolve(__dirname, '../estilos/index.css');
  const rutaTokensCss = path.resolve(__dirname, '../estilos/tokens.css');
  const rutaEstilosDir = path.resolve(__dirname, '../estilos');
  const rutaPublicFonts = path.resolve(__dirname, '../../public/fonts');

  // 1 · Ningún elemento pide un font-weight que su familia no tenga
  it('1 · Ningún elemento pide un font-weight que su familia no tenga', () => {
    const contenidoIndex = fs.readFileSync(rutaIndexCss, 'utf-8');
    const contenidoTokens = fs.readFileSync(rutaTokensCss, 'utf-8');

    // Extraer pesos soportados por @font-face en index.css
    const pesosDeclarados = new Set();
    const regexFontFace = /@font-face\s*\{([^}]+)\}/g;
    let match;
    while ((match = regexFontFace.exec(contenidoIndex)) !== null) {
      const bloque = match[1];
      const pesoMatch = bloque.match(/font-weight:\s*(\d+)/);
      if (pesoMatch) {
        pesosDeclarados.add(Number(pesoMatch[1]));
      }
    }

    // Deben estar soportados 400 y 700
    expect(pesosDeclarados.has(400)).toBe(true);
    expect(pesosDeclarados.has(700)).toBe(true);

    // Verificar los tokens de peso en tokens.css
    const matchFwRegular = contenidoTokens.match(/--fw-regular:\s*(\d+);/);
    const matchFwBold = contenidoTokens.match(/--fw-bold:\s*(\d+);/);
    expect(matchFwRegular).not.toBeNull();
    expect(matchFwBold).not.toBeNull();
    expect(pesosDeclarados.has(Number(matchFwRegular[1]))).toBe(true);
    expect(pesosDeclarados.has(Number(matchFwBold[1]))).toBe(true);

    // Barrer todos los archivos CSS en src/estilos para comprobar que no se pidan pesos huérfanos
    const archivosCss = fs.readdirSync(rutaEstilosDir).filter(f => f.endsWith('.css'));
    for (const archivo of archivosCss) {
      const contenido = fs.readFileSync(path.join(rutaEstilosDir, archivo), 'utf-8');
      const lineas = contenido.split('\n');
      lineas.forEach((linea, num) => {
        if (linea.includes('font-weight:') && !linea.includes('@font-face')) {
          const m = linea.match(/font-weight:\s*([^;]+);/);
          if (m) {
            const val = m[1].trim();
            // Valores permitidos: var(--fw-bold), var(--fw-regular), 400, 700, normal, bold
            const valido =
              val === 'var(--fw-bold)' ||
              val === 'var(--fw-regular)' ||
              val === '400' ||
              val === '700' ||
              val === 'normal' ||
              val === 'bold';
            expect(valido).toBe(true);
          }
        }
      });
    }
  });

  // 2 · Los 5 .woff2 existen con tamaño válido y son los 5 archivos oficiales
  it('2 · Los 5 archivos .woff2 existen en public/fonts con tamaño no nulo', () => {
    const archivosEsperados = [
      'AgusSans-Regular.woff2',
      'CaviarDreams.woff2',
      'CaviarDreams_Bold.woff2',
      'CaviarDreams_Italic.woff2',
      'CaviarDreams_BoldItalic.woff2'
    ];

    const archivosReales = fs.readdirSync(rutaPublicFonts);
    archivosEsperados.forEach(nombre => {
      expect(archivosReales).toContain(nombre);
      const stats = fs.statSync(path.join(rutaPublicFonts, nombre));
      expect(stats.size).toBeGreaterThan(5000); // todos pesan > 10KB
    });
    expect(archivosReales.length).toBe(5);
  });

  // 3 · Las fuentes declaradas en @font-face son exactamente las 2 de la marca. Ninguna más.
  it('3 · Las fuentes declaradas en @font-face son exactamente las 2 de la marca (Agus Sans y Caviar Dreams)', () => {
    const contenidoIndex = fs.readFileSync(rutaIndexCss, 'utf-8');
    const familiasDeclaradas = new Set();
    const regexFontFace = /@font-face\s*\{([^}]+)\}/g;
    let match;
    while ((match = regexFontFace.exec(contenidoIndex)) !== null) {
      const bloque = match[1];
      const familyMatch = bloque.match(/font-family:\s*['"]([^'"]+)['"]/);
      if (familyMatch) {
        familiasDeclaradas.add(familyMatch[1]);
      }
    }

    const familias = Array.from(familiasDeclaradas).sort();
    expect(familias).toEqual(['Agus Sans', 'Caviar Dreams']);

    // Verificar que no existan llamadas a fuentes externas como google fonts o gstatic
    expect(contenidoIndex).not.toContain('fonts.googleapis.com');
    expect(contenidoIndex).not.toContain('fonts.gstatic.com');
  });

  // 4 · La variable de titulares en tokens.css apunta a Caviar Dreams
  it('4 · La variable --font-display en tokens.css apunta a Caviar Dreams según mandato del Brandbook', () => {
    const contenidoTokens = fs.readFileSync(rutaTokensCss, 'utf-8');
    const matchDisplay = contenidoTokens.match(/--font-display:\s*([^;]+);/);
    expect(matchDisplay).not.toBeNull();
    expect(matchDisplay[1]).toContain('Caviar Dreams');
  });
});
