import Image from 'next/image';

const SIZE_MAP = { sm: 24, md: 32, lg: 34 };

/**
 * Reusable Procurexio logo component.
 *
 * Renders the logo image followed by the "Procure**xio**" text wordmark.
 * Designed to be placed inside an existing link / container element.
 *
 * Props:
 *   variant  – "light" (for light/white backgrounds)  | "dark" (for dark backgrounds)
 *   size     – "sm" (24px) | "md" (32px) | "lg" (34px) | number (custom px)
 *   showText – whether to render the text wordmark (default: true)
 */
export default function Logo({ variant = 'light', size = 'md', showText = true }) {
  const src = variant === 'dark' ? '/logo-dark.png' : '/logo-light.png';
  const px  = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 32);

  const textColor  = variant === 'dark' ? '#ffffff' : 'var(--ink, #0f0e0d)';
  const accentColor = 'var(--accent, #c8501a)';
  const fontSize   = px >= 34 ? '1.1rem' : px >= 32 ? '1.05rem' : px >= 30 ? '1rem' : '0.88rem';

  return (
    <>
      <Image
        src={src}
        alt="Procurexio"
        width={px * 2}
        height={px * 2}
        style={{ width: px, height: px, objectFit: 'contain', flexShrink: 0 }}
        priority
      />
      {showText && (
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize,
          color: textColor,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          textDecoration: 'none',
        }}>
          Procure<span style={{ color: accentColor }}>xio</span>
        </span>
      )}
    </>
  );
}
