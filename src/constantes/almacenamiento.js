/**
 * Constantes centralizadas de almacenamiento y tratamiento de imágenes.
 * Referencia: RF-537 a RF-549 (DOCS/03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md)
 */

// Límites de tamaño por archivo en bytes
export const LIMITE_VOUCHER_BYTES = 5 * 1024 * 1024; // 5 MB (5,242,880 B)
export const LIMITE_PRODUCTO_BYTES = 2 * 1024 * 1024; // 2 MB (2,097,152 B)

// Formatos MIME permitidos por tipo de recurso
export const FORMATOS_VOUCHER = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

export const FORMATOS_PRODUCTO = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// Calidad de compresión WebP estándar (RF-539)
export const CALIDAD_WEBP_DEFAULT = 0.85;

// Dimensión máxima en píxeles para el lado mayor en productos (RF-546)
export const MAX_DIMENSION_PRODUCTO_PX = 1600;
