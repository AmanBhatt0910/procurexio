export default function RegisterContextBadge({ isInvite, isVendorInvite, inviteData }) {
  if (!isInvite) return null;

  if (isVendorInvite) {
    return (
      <div className="register-context-badge register-context-badge--vendor">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2"
          className="register-context-badge-icon"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <div>
          <div className="register-context-badge-title">Vendor Portal Invitation</div>
          <div>
            Joining as the vendor contact for{' '}
            <strong className="register-context-badge-strong">{inviteData?.vendorName}</strong>
            {' '}—{' '}invited by{' '}
            <strong className="register-context-badge-strong">{inviteData?.companyName}</strong>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-context-badge register-context-badge--team">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6660" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      <span>
        Joining{' '}
        <strong className="register-context-badge-strong">{inviteData?.companyName}</strong>
        {' '}as{' '}
        <strong className="register-context-badge-strong">
          {inviteData?.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </strong>
      </span>
    </div>
  );
}
