import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { procesarImagenParaSubida } from '../utilidades/procesadorImagenes';
import {
  LIMITE_VOUCHER_BYTES,
  LIMITE_PRODUCTO_BYTES,
  MAX_DIMENSION_PRODUCTO_PX,
  CALIDAD_WEBP_DEFAULT
} from '../constantes/almacenamiento';
import {
  validarArchivoVoucher,
  validarArchivoFotoProducto
} from '../servicios/operacionAdmin';

describe('TAREA-60 · Conversor Unificado de Imágenes y Reglas RF-537 a RF-549', () => {
  let originalCreateImageBitmap;
  let originalCreateElement;
  let originalRevokeObjectURL;
  let originalCreateObjectURL;

  beforeEach(() => {
    originalCreateImageBitmap = globalThis.createImageBitmap;
    originalCreateElement = document.createElement.bind(document);
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    document.createElement = originalCreateElement;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  // Helper para crear un mock de Canvas y Context2D
  function setupMockCanvas({
    blobSize = 100 * 1024,
    fallaBlob = false,
    onDrawImage = null,
    onToBlob = null
  } = {}) {
    const mockContext = {
      drawImage: vi.fn((...args) => {
        if (onDrawImage) onDrawImage(...args);
      }),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn()
    };

    document.createElement = vi.fn((tag) => {
      if (tag === 'canvas') {
        const canvas = {
          width: 0,
          height: 0,
          getContext: vi.fn((type) => {
            if (type === '2d') return mockContext;
            return null;
          }),
          toBlob: vi.fn((cb, mime, quality) => {
            if (onToBlob) onToBlob(mime, quality);
            if (fallaBlob) {
              cb(null);
            } else {
              const mockBlob = new Blob(['x'.repeat(blobSize)], { type: mime || 'image/webp' });
              cb(mockBlob);
            }
          })
        };
        return canvas;
      }
      return originalCreateElement(tag);
    });

    return { mockContext };
  }

  // Helper para simular createImageBitmap
  function setupMockBitmap({
    width = 1000,
    height = 800,
    falla = false,
    captureOptions = null
  } = {}) {
    globalThis.createImageBitmap = vi.fn(async (file, options) => {
      if (captureOptions) captureOptions(options);
      if (falla) {
        throw new Error('Decodificación de imagen bitmap fallida.');
      }
      return {
        width,
        height,
        close: vi.fn()
      };
    });
  }

  // 1 · Un PNG con transparencia · sale WebP y la transparencia se conserva
  it('1 · Un PNG con transparencia · sale WebP y la transparencia se conserva', async () => {
    let drawCallArgs = null;
    setupMockCanvas({
      blobSize: 40 * 1024, // menor que el original
      onDrawImage: (...args) => {
        drawCallArgs = args;
      }
    });
    setupMockBitmap({ width: 800, height: 600 });

    const pngFile = new File(['mock-png-data-with-alpha'], 'logo.png', {
      type: 'image/png'
    });
    // Forzamos un tamaño original mayor
    Object.defineProperty(pngFile, 'size', { value: 80 * 1024 });

    const resultado = await procesarImagenParaSubida({
      archivo: pngFile,
      tipo: 'producto'
    });

    expect(resultado.convertido).toBe(true);
    expect(resultado.archivo.type).toBe('image/webp');
    expect(resultado.archivo.name).toBe('logo.webp');
    // Verifica que se haya dibujado directamente en el canvas transparente sin crear fondo blanco
    expect(drawCallArgs).not.toBeNull();
  });

  // 2 · Una foto ya comprimida que engorda en WebP · se sube el original
  it('2 · Una foto ya comprimida que engorda en WebP · se sube el original', async () => {
    const pesoOriginal = 304 * 1024; // 304 KB
    const pesoWebpEngordado = 305 * 1024; // 305 KB (+0.4% como el caso medido de TAREA-59)

    setupMockCanvas({ blobSize: pesoWebpEngordado });
    setupMockBitmap({ width: 1200, height: 900 });

    const jpegFile = new File(['fake-jpeg-compressed'], 'foto-comprimida.jpg', {
      type: 'image/jpeg'
    });
    Object.defineProperty(jpegFile, 'size', { value: pesoOriginal });

    const resultado = await procesarImagenParaSubida({
      archivo: jpegFile,
      tipo: 'producto'
    });

    // RF-543: Si el WebP pesa igual o más, se sube el original y se descarta la conversión
    expect(resultado.convertido).toBe(false);
    expect(resultado.motivo).toBe('webp_pesaba_mas_o_igual');
    expect(resultado.archivo).toBe(jpegFile);
    expect(resultado.archivo.name).toBe('foto-comprimida.jpg');
  });

  // 3 · Una foto vertical con EXIF · no sale de costado
  it('3 · Una foto vertical con EXIF · no sale de costado', async () => {
    let bitmapOptions = null;
    setupMockBitmap({
      width: 1200, // Alto vertical
      height: 1600,
      captureOptions: (opts) => {
        bitmapOptions = opts;
      }
    });
    setupMockCanvas({ blobSize: 150 * 1024 });

    const verticalFile = new File(['foto-vertical-exif'], 'foto-movil.jpg', {
      type: 'image/jpeg'
    });
    Object.defineProperty(verticalFile, 'size', { value: 2 * 1024 * 1024 });

    const resultado = await procesarImagenParaSubida({
      archivo: verticalFile,
      tipo: 'producto'
    });

    // RF-547: createImageBitmap(file, { imageOrientation: 'from-image' })
    expect(bitmapOptions).toEqual({ imageOrientation: 'from-image' });
    expect(resultado.convertido).toBe(true);
    // Debe mantener la orientación vertical (alto > ancho)
    expect(resultado.alto).toBeGreaterThan(resultado.ancho);
  });

  // 4 · Una foto de 4000 px · sale a 1600 px
  it('4 · Una foto de 4000 px · sale a 1600 px', async () => {
    // Foto de cámara de 4000 x 3000 px
    setupMockBitmap({ width: 4000, height: 3000 });
    setupMockCanvas({ blobSize: 350 * 1024 });

    const fotoGrande = new File(['foto-4000px'], 'camara.jpg', {
      type: 'image/jpeg'
    });
    Object.defineProperty(fotoGrande, 'size', { value: 3.5 * 1024 * 1024 });

    const resultado = await procesarImagenParaSubida({
      archivo: fotoGrande,
      tipo: 'producto'
    });

    // RF-546: Las fotos de producto deben reducirse a un máximo de 1600 px en su lado mayor
    expect(resultado.convertido).toBe(true);
    expect(resultado.ancho).toBe(1600);
    expect(resultado.alto).toBe(1200); // 3000 * (1600 / 4000) = 1200
  });

  // 5 · Un voucher de 300 KB · se sube SIN TOCAR
  it('5 · Un voucher de 300 KB · se sube SIN TOCAR', async () => {
    const voucherFile = new File(['voucher-liviano'], 'voucher-bcp.jpg', {
      type: 'image/jpeg'
    });
    const peso300Kb = 300 * 1024;
    Object.defineProperty(voucherFile, 'size', { value: peso300Kb });

    const bitmapSpy = vi.fn();
    globalThis.createImageBitmap = bitmapSpy;

    const resultado = await procesarImagenParaSubida({
      archivo: voucherFile,
      tipo: 'voucher'
    });

    // RF-541: El comprobante se guarda tal cual si ya cabe dentro del límite (<= 5 MB)
    expect(resultado.convertido).toBe(false);
    expect(resultado.motivo).toBe('voucher_cabe_en_limite');
    expect(resultado.archivo).toBe(voucherFile);
    // No debe invocar procesamiento gráfico ni canvas
    expect(bitmapSpy).not.toHaveBeenCalled();
  });

  // 6 · Un voucher de 6 MB · se convierte y cabe
  it('6 · Un voucher de 6 MB · se convierte y cabe', async () => {
    // Voucher pesado de alta resolución (3200 x 2400)
    setupMockBitmap({ width: 3200, height: 2400 });
    // Al convertirse a WebP q85 queda en 1.2 MB (< 5 MB)
    setupMockCanvas({ blobSize: 1.2 * 1024 * 1024 });

    const voucherPesado = new File(['voucher-pesado-6mb'], 'voucher-scanner.png', {
      type: 'image/png'
    });
    Object.defineProperty(voucherPesado, 'size', { value: 6 * 1024 * 1024 });

    const resultado = await procesarImagenParaSubida({
      archivo: voucherPesado,
      tipo: 'voucher'
    });

    // RF-541: Si no cabe en 5 MB se convierte SIN REDUCIR resolución
    expect(resultado.convertido).toBe(true);
    expect(resultado.ancho).toBe(3200); // No se redujo a 1600 px, preservó nitidez
    expect(resultado.alto).toBe(2400);
    expect(resultado.archivo.size).toBeLessThan(LIMITE_VOUCHER_BYTES);
    expect(resultado.archivo.name).toBe('voucher-scanner.webp');
  });

  // 7 · Un PDF · pasa intacto
  it('7 · Un PDF · pasa intacto', async () => {
    const pdfFile = new File(['%PDF-1.4 mock content'], 'comprobante-banco.pdf', {
      type: 'application/pdf'
    });
    Object.defineProperty(pdfFile, 'size', { value: 7 * 1024 * 1024 }); // 7 MB

    const bitmapSpy = vi.fn();
    globalThis.createImageBitmap = bitmapSpy;

    const resultado = await procesarImagenParaSubida({
      archivo: pdfFile,
      tipo: 'voucher'
    });

    // RF-542: Los comprobantes en PDF nunca se tocan ni se convierten
    expect(resultado.convertido).toBe(false);
    expect(resultado.motivo).toBe('pdf_intacto');
    expect(resultado.archivo).toBe(pdfFile);
    expect(bitmapSpy).not.toHaveBeenCalled();
  });

  // 8 · Conversión que falla en producto · rechaza
  it('8 · Conversión que falla en producto · rechaza', async () => {
    // Simular error al decodificar bitmap
    setupMockBitmap({ falla: true });

    const productoCorrupto = new File(['bytes-corruptos'], 'foto-danada.jpg', {
      type: 'image/jpeg'
    });
    Object.defineProperty(productoCorrupto, 'size', { value: 1.5 * 1024 * 1024 });

    // RF-545: Si la conversión de una foto de producto falla, el sistema NO debe
    // subir el original: debe rechazarla y pedir otra foto con mensaje claro en español.
    await expect(
      procesarImagenParaSubida({
        archivo: productoCorrupto,
        tipo: 'producto'
      })
    ).rejects.toThrow(
      /No se pudo procesar la imagen del producto\. Por favor selecciona otra fotografía en formato válido/i
    );
  });

  // 9 · Conversión que falla en voucher · sube original
  it('9 · Conversión que falla en voucher · sube original', async () => {
    // Simular error al decodificar bitmap
    setupMockBitmap({ falla: true });

    const voucherDañadoPesado = new File(['bytes-voucher-pesado'], 'voucher-pesado.jpg', {
      type: 'image/jpeg'
    });
    Object.defineProperty(voucherDañadoPesado, 'size', { value: 6 * 1024 * 1024 });

    // RF-544: Si la conversión de un comprobante falla, el sistema DEBE subir el
    // archivo original en lugar de rechazarlo (salvaguarda de la evidencia de pago).
    const resultado = await procesarImagenParaSubida({
      archivo: voucherDañadoPesado,
      tipo: 'voucher'
    });

    expect(resultado.convertido).toBe(false);
    expect(resultado.motivo).toBe('fallback_error_voucher');
    expect(resultado.archivo).toBe(voucherDañadoPesado);
    expect(resultado.archivo.name).toBe('voucher-pesado.jpg');
  });

  // 10 · RF-539 · La constante de calidad vale 0.85 y el conversor la usa al codificar en toBlob
  it('10 · RF-539 · La constante de calidad vale 0.85 y el conversor la usa al codificar en toBlob', async () => {
    // 1. Afirmar el valor exacto de la constante
    expect(CALIDAD_WEBP_DEFAULT).toBe(0.85);

    // 2. Afirmar que el conversor lo usa al llamar a toBlob
    let capturedMime = null;
    let capturedQuality = null;

    setupMockBitmap({ width: 800, height: 600 });
    setupMockCanvas({
      blobSize: 30 * 1024,
      onToBlob: (mime, quality) => {
        capturedMime = mime;
        capturedQuality = quality;
      }
    });

    const file = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 60 * 1024 });

    const res = await procesarImagenParaSubida({ archivo: file, tipo: 'producto' });

    expect(res.convertido).toBe(true);
    expect(capturedMime).toBe('image/webp');
    expect(capturedQuality).toBe(0.85);
    expect(capturedQuality).toBe(CALIDAD_WEBP_DEFAULT);
  });

  // 11 · RF-549 · validarArchivoVoucher y validarArchivoFotoProducto toman sus límites de constantes/almacenamiento.js
  it('11 · RF-549 · validarArchivoVoucher y validarArchivoFotoProducto toman sus límites de constantes/almacenamiento.js', () => {
    // 1. Constantes definidas y congruentes
    expect(LIMITE_VOUCHER_BYTES).toBe(5 * 1024 * 1024); // 5 MB
    expect(LIMITE_PRODUCTO_BYTES).toBe(2 * 1024 * 1024); // 2 MB

    // 2. validarArchivoVoucher usa LIMITE_VOUCHER_BYTES (acepta en el límite exacto, rechaza con +1 byte)
    const voucherEnLimite = { name: 'voucher.jpg', type: 'image/jpeg', size: LIMITE_VOUCHER_BYTES };
    expect(validarArchivoVoucher(voucherEnLimite).valido).toBe(true);

    const voucherExcedido = { name: 'voucher.jpg', type: 'image/jpeg', size: LIMITE_VOUCHER_BYTES + 1 };
    const resVoucher = validarArchivoVoucher(voucherExcedido);
    expect(resVoucher.valido).toBe(false);
    expect(resVoucher.error).toMatch(/excede el tamaño máximo permitido de 5 MB/i);

    // 3. validarArchivoFotoProducto usa LIMITE_PRODUCTO_BYTES (acepta en el límite exacto, rechaza con +1 byte)
    const productoEnLimite = { name: 'foto.webp', type: 'image/webp', size: LIMITE_PRODUCTO_BYTES };
    expect(() => validarArchivoFotoProducto(productoEnLimite)).not.toThrow();

    const productoExcedido = { name: 'foto.webp', type: 'image/webp', size: LIMITE_PRODUCTO_BYTES + 1 };
    expect(() => validarArchivoFotoProducto(productoExcedido)).toThrow(
      /excede el tamaño máximo permitido de 2 MB/i
    );

    // 4. Verificación estática: operacionAdmin.js importa de almacenamiento.js y no tiene límites quemados
    const codigoOperacionAdmin = fs.readFileSync(
      path.resolve(__dirname, '../servicios/operacionAdmin.js'),
      'utf8'
    );
    expect(codigoOperacionAdmin).toMatch(/import\s*\{[^}]*LIMITE_VOUCHER_BYTES[^}]*\}\s*from\s*['"]\.\.\/constantes\/almacenamiento['"]/);
    expect(codigoOperacionAdmin).toMatch(/import\s*\{[^}]*LIMITE_PRODUCTO_BYTES[^}]*\}\s*from\s*['"]\.\.\/constantes\/almacenamiento['"]/);
    expect(codigoOperacionAdmin).not.toMatch(/maxBytes\s*=\s*5\s*\*\s*1024\s*\*\s*1024/);
    expect(codigoOperacionAdmin).not.toMatch(/limiteBytes\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  });
});
