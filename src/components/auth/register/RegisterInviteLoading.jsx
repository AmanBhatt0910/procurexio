export default function RegisterInviteLoading() {
  return (
    <div className="register-invite-loading">
      <svg className="register-invite-loading-spinner" width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#e4e0db" strokeWidth="2.5" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#0f0e0d" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="register-invite-loading-text">Validating invitation…</p>
    </div>
  );
}
