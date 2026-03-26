'use client';

import { useState } from 'react';

/**
 * AuthInput — reusable input field for auth forms.
 *
 * Props:
 *   label       {string}   - label text
 *   type        {string}   - input type (text, email, password)
 *   value       {string}
 *   onChange    {function}
 *   placeholder {string}
 *   error       {string}   - inline error message
 *   required    {boolean}
 *   autoComplete {string}
 *   disabled    {boolean}
 *   icon        {ReactNode} - optional leading icon
 */
export default function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoComplete,
  disabled = false,
  icon,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="auth-input-wrapper">
      {label && (
        <label className="auth-input-label">
          {label}
          {required && <span className="auth-input-required">*</span>}
        </label>
      )}

      <div className={`auth-input-container ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {icon && <span className="auth-input-icon">{icon}</span>}

        <input
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className="auth-input-field"
        />

        {isPassword && (
          <button
            type="button"
            className="auth-input-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              // Eye-off icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              // Eye icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {error && <p className="auth-input-error">{error}</p>}
    </div>
  );
}