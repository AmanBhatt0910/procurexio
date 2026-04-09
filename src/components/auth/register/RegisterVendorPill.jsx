export default function RegisterVendorPill({ show }) {
  if (!show) return null;

  return (
    <div className="register-vendor-pill">
      <span className="register-vendor-pill-dot" />
      Vendor Portal
    </div>
  );
}
