import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { validarArchivoVoucher } from '../servicios/operacionAdmin';

export default function CampoArchivoVoucher({
  archivo,
  onArchivoChange,
  id = 'archivo-voucher',
  label = 'Foto o PDF del Comprobante (Opcional)',
  disabled = false
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorLocal, setErrorLocal] = useState(null);

  useEffect(() => {
    if (!archivo) {
      setPreviewUrl(null);
      return;
    }
    if (archivo.type.startsWith('image/')) {
      const url = URL.createObjectURL(archivo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [archivo]);

  const handleFileSelect = (e) => {
    setErrorLocal(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validacion = validarArchivoVoucher(file);
    if (!validacion.valido) {
      setErrorLocal(validacion.error);
      if (inputRef.current) inputRef.current.value = '';
      onArchivoChange(null);
      return;
    }

    onArchivoChange(file);
  };

  const handleQuitar = () => {
    setErrorLocal(null);
    if (inputRef.current) inputRef.current.value = '';
    onArchivoChange(null);
  };

  const esPdf = archivo?.type === 'application/pdf';

  return (
    <div style={{ marginBottom: 'var(--sp-3)' }}>
      <label htmlFor={id} className="formulario-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
        {label}
      </label>

      {/* Input oculto nativo */}
      <input
        ref={inputRef}
        type="file"
        id={id}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {/* Si no hay archivo seleccionado: Área de drop / selección */}
      {!archivo && (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-subtle, #cbd5e1)',
            borderRadius: 'var(--r-input, 6px)',
            padding: 'var(--sp-4, 16px)',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: 'var(--bg-app, #f8fafc)',
            transition: 'border-color 0.2s, background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = 'var(--primary, #d4a017)';
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = 'var(--border-subtle, #cbd5e1)';
          }}
        >
          <Upload size={24} style={{ color: 'var(--texto-apagado, #94a3b8)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 'var(--fs-sm, 13px)', fontWeight: 600, color: 'var(--texto-principal, #1e293b)' }}>
            Haz clic para adjuntar voucher
          </div>
          <div style={{ fontSize: 'var(--fs-xs, 11px)', color: 'var(--texto-apagado, #94a3b8)', marginTop: '2px' }}>
            JPG, PNG, WEBP o PDF · Máximo 5 MB
          </div>
        </div>
      )}

      {/* Mensaje de error de validación en navegador */}
      {errorLocal && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--danger, #ef4444)',
            fontSize: 'var(--fs-xs, 12px)',
            marginTop: '6px'
          }}
        >
          <AlertCircle size={14} />
          <span>{errorLocal}</span>
        </div>
      )}

      {/* Si hay archivo seleccionado: Miniatura / Preview */}
      {archivo && (
        <div
          style={{
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: 'var(--r-input, 6px)',
            padding: 'var(--sp-3, 12px)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--sp-3, 12px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3, 12px)', overflow: 'hidden' }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa del comprobante"
                style={{
                  width: '56px',
                  height: '56px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '4px',
                  backgroundColor: esPdf ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app, #f1f5f9)',
                  color: esPdf ? '#ef4444' : 'var(--texto-apagado, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {esPdf ? <FileText size={28} /> : <ImageIcon size={28} />}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--fs-sm, 13px)',
                  fontWeight: 600,
                  color: 'var(--texto-principal, #1e293b)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={archivo.name}
              >
                {archivo.name}
              </div>
              <div style={{ fontSize: 'var(--fs-xs, 11px)', color: 'var(--texto-apagado, #94a3b8)', marginTop: '2px' }}>
                {(archivo.size / 1024).toFixed(1)} KB · {esPdf ? 'Documento PDF' : 'Imagen'}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#10b981',
                  marginTop: '2px'
                }}
              >
                <CheckCircle2 size={11} /> Listo para guardar
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuitar}
            disabled={disabled}
            title="Quitar archivo"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--texto-apagado, #94a3b8)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger, #ef4444)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--texto-apagado, #94a3b8)';
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
