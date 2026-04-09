import Link from 'next/link';

export default function RegisterInviteError({ inviteError }) {
  return (
    <div className="register-invite-error-page">
      <div className="register-invite-error-card">
        <div className="register-invite-error-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8501a" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="register-invite-error-title">Invitation invalid</h2>
        <p className="register-invite-error-message">{inviteError}</p>
        <p className="register-invite-error-help">Please ask your admin to resend the invitation.</p>

        <Link href="/login" className="register-invite-error-link">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
