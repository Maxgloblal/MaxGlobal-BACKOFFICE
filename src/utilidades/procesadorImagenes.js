import {
  LIMITE_VOUCHER_BYTES,
  LIMITE_PRODUCTO_BYTES,
  CALIDAD_WEBP_DEFAULT,
  MAX_DIMENSION_PRODUCTO_PX
} from '../constantes/almacenamiento';

/**
 * Convierte un archivo de imagen en memoria usando Canvas del navegador.
 * Respeta la orientación EXIF nativa y preserva el canal alfa de transparencia.
 */
async function codificarAWebpCanvas(archivo, { maxDimension = null, calidad = CALIDAD_WEBP_DEFAULT } = {}) {
  let bitmap = null;
  let objectUrl = null;
  let origWidth = 0;
  let origHeight = 0;

  // Si estamos en un entorno sin soporte gráfico (ej: tests en Node.js puro):
  const haySoporteGrafico = typeof createImageBitmap === 'function' ||
    (typeof Image !== 'undefined' && typeof document !== 'undefined');
  if (!haySoporteGrafico) {
    throw new Error('Entorno sin soporte de Canvas/Image para procesamiento gráfico.');
  }

  // 1. Cargar con createImageBitmap respetando orientación EXIF (RF-547)
  let imgElement = null;
  if (typeof createImageBitmap === 'function') {
    bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    origWidth = bitmap?.width || 0;
    origHeight = bitmap?.height || 0;
  } else if (typeof Image !== 'undefined') {
    // Fallback para entornos donde createImageBitmap no esté implementado
    imgElement = new Image();
    objectUrl = URL.createObjectURL(archivo);
    await new Promise((resolve, reject) => {
      imgElement.onload = () => resolve();
      imgElement.onerror = () => reject(new Error('No se pudo decodificar el archivo de imagen.'));
      imgElement.src = objectUrl;
    });
    origWidth = imgElement.naturalWidth || imgElement.width;
    origHeight = imgElement.naturalHeight || imgElement.height;
  } else {
    throw new Error('Entorno sin soporte de Canvas/Image para procesamiento gráfico.');
  }

  if (!origWidth || !origHeight) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (bitmap?.close) bitmap.close();
    throw new Error('Dimensiones de imagen inválidas o ilegibles.');
  }

  // 2. Calcular dimensiones reducidas si se especifica maxDimension (RF-546)
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (maxDimension && Math.max(origWidth, origHeight) > maxDimension) {
    const factor = maxDimension / Math.max(origWidth, origHeight);
    targetWidth = Math.round(origWidth * factor);
    targetHeight = Math.round(origHeight * factor);
  }

  // 3. Crear canvas y dibujar imagen (conserva transparencia alfa para PNG - RF-540)
  if (typeof document === 'undefined' || !document.createElement) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (bitmap?.close) bitmap.close();
    throw new Error('Documento DOM no disponible para crear canvas.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (bitmap?.close) bitmap.close();
    throw new Error('No se pudo inicializar el contexto 2D del canvas.');
  }

  // Dibujar sobre canvas transparente
  if (bitmap) {
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    if (bitmap.close) bitmap.close();
  } else if (imgElement) {
    ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);
  }

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }

  // 4. Codificar a WebP con la calidad indicada (RF-539)
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Fallo al exportar el archivo WebP desde canvas.'));
      },
      'image/webp',
      calidad
    );
  });

  return {
    blob,
    width: targetWidth,
    height: targetHeight
  };
}

/**
 * Módulo unificado para procesar imágenes antes de la subida a Storage.
 * Utilizado para Vouchers (comprobantes) y Fotos de Producto.
 *
 * @param {Object} params
 * @param {File|Blob} params.archivo - Archivo original seleccionado por el usuario.
 * @param {'producto'|'voucher'} params.tipo - Tipo de recurso a procesar.
 * @param {number|null} [params.maxDimension] - Límite de píxeles en el lado mayor.
 * @param {number} [params.calidad=0.85] - Calidad de compresión WebP.
 * @returns {Promise<{ archivo: File|Blob, convertido: boolean, motivo?: string, ancho?: number, alto?: number }>}
 */
export async function procesarImagenParaSubida({
  archivo,
  tipo = 'producto',
  maxDimension = undefined,
  calidad = CALIDAD_WEBP_DEFAULT
}) {
  if (!archivo) {
    return { archivo: null, convertido: false };
  }

  // RF-542: Los comprobantes en PDF nunca se tocan ni se convierten
  const esPdf = archivo.type === 'application/pdf' || (archivo.name && archivo.name.toLowerCase().endsWith('.pdf'));
  if (esPdf) {
    return {
      archivo,
      convertido: false,
      motivo: 'pdf_intacto'
    };
  }

  // RF-541: El voucher se guarda tal cual si ya cabe dentro del límite
  if (tipo === 'voucher' && archivo.size <= LIMITE_VOUCHER_BYTES) {
    return {
      archivo,
      convertido: false,
      motivo: 'voucher_cabe_en_limite'
    };
  }

  // Definir dimensión máxima:
  // - Para productos: máximo 1600 px en el lado mayor (RF-546)
  // - Para vouchers: nunca reducir resolución para no perder nitidez en números pequeños (RF-541 regla)
  const limiteDimension = maxDimension !== undefined
    ? maxDimension
    : (tipo === 'producto' ? MAX_DIMENSION_PRODUCTO_PX : null);

  try {
    const resultado = await codificarAWebpCanvas(archivo, {
      maxDimension: limiteDimension,
      calidad
    });

    const blobWebp = resultado.blob;

    // RF-543: Si el WebP resultante pesa igual o más que el original, subir original y descartar
    if (blobWebp.size >= archivo.size) {
      return {
        archivo,
        convertido: false,
        motivo: 'webp_pesaba_mas_o_igual'
      };
    }

    // Construir nuevo File en formato .webp
    const nombreBase = (archivo.name || (tipo === 'producto' ? 'producto' : 'voucher')).replace(/\.[^/.]+$/, '');
    const nombreFinal = `${nombreBase}.webp`;

    let archivoFinal;
    if (typeof File !== 'undefined') {
      archivoFinal = new File([blobWebp], nombreFinal, {
        type: 'image/webp',
        lastModified: Date.now()
      });
    } else {
      blobWebp.name = nombreFinal;
      archivoFinal = blobWebp;
    }

    return {
      archivo: archivoFinal,
      convertido: true,
      ancho: resultado.width,
      alto: resultado.height,
      pesoOriginal: archivo.size,
      pesoFinal: blobWebp.size
    };
  } catch (err) {
    // Tratamiento diferenciado de fallos según el tipo de recurso (RF-544 y RF-545):

    if (tipo === 'producto') {
      // RF-545: Si falla en producto, rechazar con mensaje claro en español pidiendo otra foto
      throw new Error(
        'No se pudo procesar la imagen del producto. Por favor selecciona otra fotografía en formato válido (JPG, PNG o WebP).'
      );
    }

    // RF-544: Si falla en comprobante, subir el original para no perder la evidencia de pago
    return {
      archivo,
      convertido: false,
      motivo: 'fallback_error_voucher',
      error: err.message
    };
  }
}
