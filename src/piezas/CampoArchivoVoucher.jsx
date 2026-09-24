import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { validarArchivoVoucher } from '../servicios/operacionAdmin';
import { procesarImagenParaSubida } from '../utilidades/procesadorImagenes';
import { LIMITE_VOUCHER_BYTES } from '../constantes/almacenamiento';

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
  const [procesandoVoucher, setProcesandoVoucher] = useState(false);

  useEffect(() => {
    if (!archivo) {
      setPreviewUrl(null);
      return;
    }
    if (archivo.type && archivo.type.startsWith('image/')) {
      const url = URL.createObjectURL(archivo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [archivo]);

  const handleFileSelect = async (e) => {
    setErrorLocal(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Si es un PDF, pasa intacto (RF-542)
    if (file.type === 'application/pdf') {
      const validacion = validarArchivoVoucher(file);
      if (!validacion.valido) {
        setErrorLocal(validacion.error);
        if (inputRef.current) inputRef.current.value = '';
        onArchivoChange(null);
        return;
      }
      onArchivoChange(file);
      return;
    }

    // RF-541: Si supera los 5 MB, convertir a WebP sin reducir resolución
    if (file.size > LIMITE_VOUCHER_BYTES) {
      try {
        setProcesandoVoucher(true);
        const resProc = await procesarImagenParaSubida({ archivo: file, tipo: 'voucher' });
        const archivoFinal = resProc.archivo || file;
        const validacion = validarArchivoVoucher(archivoFinal);
        if (!validacion.valido) {
          setErrorLocal(validacion.error);
          if (inputRef.current) inputRef.current.value = '';
          onArchivoChange(null);
        } else {
          onArchivoChange(archivoFinal);
        }
      } catch (err) {
        setErrorLocal(err.message || 'Error al procesar el comprobante.');
        if (inputRef.current) inputRef.current.value = '';
        onArchivoChange(null);
      } finally {
        setProcesandoVoucher(false);
      }
      return;
    }

    // Si ya cabe en el límite (<= 5 MB), se guarda tal cual (RF-541)
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
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--r-input, 6px)',
            padding: 'var(--sp-4, 16px)',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: 'var(--surface-sunken)',
            transition: 'border-color 0.2s, background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = 'var(--mg-dorado)';
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <Upload size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 'var(--fs-sm, 13px)', fontWeight: 600, color: 'var(--text-strong)' }}>
            Haz clic para adjuntar voucher
          </div>
          <div style={{ fontSize: 'var(--fs-xs, 11px)', color: 'var(--text-muted)', marginTop: '2px' }}>
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
            color: 'var(--danger)',
            fontSize: 'var(--fs-xs, 12px)',
            marginTop: '6px'
          }}
        >
          <AlertCircle size={14} />
          <span>{errorLocal}</span>
        </div>
      )}

      {/* Indicador no bloqueante mientras convierte (RF-548) */}
      {procesandoVoucher && (
        <div
          role="status"
          data-testid="voucher-procesando-aviso"
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-input, 6px)',
            padding: 'var(--sp-3, 12px)',
            backgroundColor: 'var(--surface-sunken)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2, 8px)',
            color: 'var(--text-strong)',
            fontSize: 'var(--fs-xs, 12px)',
            marginTop: '6px'
          }}
        >
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--mg-dorado)' }} />
          <span>Optimizando comprobante de pago...</span>
        </div>
      )}

      {/* Si hay archivo seleccionado: Miniatura / Preview */}
      {archivo && (
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-input, 6px)',
            padding: 'var(--sp-3, 12px)',
            backgroundColor: 'var(--surface-card)',
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
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '4px',
                  backgroundColor: esPdf ? 'var(--danger-soft)' : 'var(--surface-sunken)',
                  color: esPdf ? 'var(--danger)' : 'var(--text-muted)',
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
                  color: 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={archivo.name}
              >
                {archivo.name}
              </div>
              <div style={{ fontSize: 'var(--fs-xs, 11px)', color: 'var(--text-muted)', marginTop: '2px' }}>
                {(archivo.size / 1024).toFixed(1)} KB · {esPdf ? 'Documento PDF' : 'Imagen'}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--success)',
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
              color: 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
