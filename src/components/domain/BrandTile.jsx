/** A payment brand mark — initials on the brand colour, no third-party artwork. */
export default function BrandTile({ method, size = 30, className = '' }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-lg font-bold shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: method.bg,
        color: method.fg,
        fontSize: size * 0.34,
        letterSpacing: '.02em',
      }}
      aria-hidden
    >
      {method.short}
    </span>
  )
}
