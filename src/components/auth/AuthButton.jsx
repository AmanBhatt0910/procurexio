'use client';

/**
 * AuthButton — reusable submit/action button for auth forms.
 *
 * Props:
 *   children    {ReactNode}
 *   loading     {boolean}  - shows spinner + disables
 *   disabled    {boolean}
 *   onClick     {function}
 *   type        {string}   - 'submit' | 'button'
 *   variant     {string}   - 'primary' | 'ghost'
 *   fullWidth   {boolean}
 */
export default function AuthButton({
  children,
  loading = false,
  disabled = false,
  onClick,
  type = 'submit',
  variant = 'primary',
  fullWidth = true,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`auth-btn auth-btn--${variant} ${fullWidth ? 'auth-btn--full' : ''} ${loading ? 'auth-btn--loading' : ''}`}
    >
      {loading ? (
        <span className="auth-btn-spinner-wrap">
          <svg className="auth-btn-spinner" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span>Please wait…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}