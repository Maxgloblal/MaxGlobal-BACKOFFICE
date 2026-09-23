import React from 'react';

/**
 * Formulario - Pieza 5
 * Colección de campos de entrada reutilizables y botones accesibles.
 * Regla: Bajo 768px ocupan 100% del ancho con altura táctil mínima de 44px.
 * Soporta 3 estados: 'datos', 'vacio', 'cargando'
 */

export function CampoTexto({
  label,
  id,
  type = 'text',
  value = '',
  onChange,
  placeholder,
  error,
  ayuda,
  required = false,
  disabled = false,
  estado = 'datos',
  className = ''
}) {
  if (estado === 'cargando') {
    return (
      <div className={`form-grupo ${className}`}>
        <span className="mg-skeleton" style={{ width: '100px', height: '14px', marginBottom: '4px' }} />
        <div className="mg-skeleton" style={{ width: '100%', height: '44px' }} />
      </div>
    );
  }

  return (
    <div className={`form-grupo ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={estado === 'vacio' ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled || estado === 'cargando'}
        className="form-input"
      />
      {error && <span className="form-error">{error}</span>}
      {ayuda && !error && <span className="form-ayuda">{ayuda}</span>}
    </div>
  );
}

export function CampoSelect({
  label,
  id,
  value = '',
  onChange,
  opciones = [],
  error,
  ayuda,
  required = false,
  disabled = false,
  estado = 'datos',
  className = ''
}) {
  if (estado === 'cargando') {
    return (
      <div className={`form-grupo ${className}`}>
        <span className="mg-skeleton" style={{ width: '100px', height: '14px', marginBottom: '4px' }} />
        <div className="mg-skeleton" style={{ width: '100%', height: '44px' }} />
      </div>
    );
  }

  return (
    <div className={`form-grupo ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={estado === 'vacio' ? '' : value}
        onChange={onChange}
        required={required}
        disabled={disabled || estado === 'cargando'}
        className="form-select"
      >
        {estado === 'vacio' && <option value="">Seleccionar opción...</option>}
        {opciones.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
      {ayuda && !error && <span className="form-ayuda">{ayuda}</span>}
    </div>
  );
}

export function CampoTextarea({
  label,
  id,
  value = '',
  onChange,
  placeholder,
  error,
  ayuda,
  required = false,
  disabled = false,
  rows = 3,
  estado = 'datos',
  className = ''
}) {
  if (estado === 'cargando') {
    return (
      <div className={`form-grupo ${className}`}>
        <span className="mg-skeleton" style={{ width: '100px', height: '14px', marginBottom: '4px' }} />
        <div className="mg-skeleton" style={{ width: '100%', height: '88px' }} />
      </div>
    );
  }

  return (
    <div className={`form-grupo ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={estado === 'vacio' ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled || estado === 'cargando'}
        className="form-textarea"
      />
      {error && <span className="form-error">{error}</span>}
      {ayuda && !error && <span className="form-ayuda">{ayuda}</span>}
    </div>
  );
}

export function CampoArchivo({
  label,
  id,
  onChange,
  nombreArchivo,
  error,
  ayuda = 'Formato JPG o PNG, máx. 5MB',
  required = false,
  disabled = false,
  estado = 'datos',
  className = ''
}) {
  if (estado === 'cargando') {
    return (
      <div className={`form-grupo ${className}`}>
        <span className="mg-skeleton" style={{ width: '120px', height: '14px', marginBottom: '4px' }} />
        <div className="mg-skeleton" style={{ width: '100%', height: '44px' }} />
      </div>
    );
  }

  return (
    <div className={`form-grupo ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-3)',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-input)',
          padding: 'var(--sp-2) var(--sp-3)',
          minHeight: '44px'
        }}
      >
        <input
          id={id}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={onChange}
          disabled={disabled || estado === 'cargando'}
          style={{ display: 'none' }}
        />
        <label
          htmlFor={id}
          className="btn btn-secundario"
          style={{ minHeight: '34px', padding: '4px 12px', fontSize: 'var(--fs-xs)', cursor: 'pointer' }}
        >
          Examinar...
        </label>
        <span style={{ fontSize: 'var(--fs-xs)', color: nombreArchivo ? 'var(--text-strong)' : 'var(--text-muted)' }}>
          {nombreArchivo || 'Ningún archivo seleccionado'}
        </span>
      </div>
      {error && <span className="form-error">{error}</span>}
      {ayuda && !error && <span className="form-ayuda">{ayuda}</span>}
    </div>
  );
}

export function Boton({
  children,
  onClick,
  type = 'button',
  variante = 'primario', // 'primario' | 'dorado' | 'secundario' | 'peligro'
  bloque = false,
  disabled = false,
  cargando = false,
  icono: Icono,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || cargando}
      className={`btn btn-${variante} ${bloque ? 'btn-bloque' : ''} ${className}`}
      {...props}
    >
      {cargando ? (
        <span className="mg-skeleton" style={{ width: '80px', height: '16px', borderRadius: '4px' }} />
      ) : (
        <>
          {Icono && <Icono size={18} />}
          {children}
        </>
      )}
    </button>
  );
}
