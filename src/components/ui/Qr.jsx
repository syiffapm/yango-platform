import { useMemo } from 'react'
const CELLS = 25
const FINDERS = [
  [0, 0],
  [0, CELLS - 7],
  [CELLS - 7, 0],
]

/** Deterministic pseudo-QR rendered from a payload hash — a visual stand-in for a signed QR. */
export default function Qr({ value = '', size = 148, className = '' }) {
  const bits = useMemo(() => {
    let h = 2166136261
    const out = []
    for (let i = 0; i < CELLS * CELLS; i++) {
      h ^= (value.charCodeAt(i % Math.max(1, value.length)) || i) + i * 31
      h = Math.imul(h, 16777619)
      out.push(((h >>> (i % 17)) & 1) === 1)
    }
    return out
  }, [value])

  // A finder square is a 7×7 ring with a 3×3 core; cells around it are quiet.
  const finderCell = (r, c) => {
    for (const [r0, c0] of FINDERS) {
      if (r >= r0 - 1 && r <= r0 + 7 && c >= c0 - 1 && c <= c0 + 7) {
        const lr = r - r0,
          lc = c - c0
        if (lr < 0 || lr > 6 || lc < 0 || lc > 6) return false
        const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6
        const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
        return ring || core
      }
    }
    return null
  }
  const px = size / CELLS
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-lg bg-white ${className}`}
      role="img"
      aria-label="Ticket QR code"
    >
      <rect width={size} height={size} fill="#fff" />
      {Array.from({ length: CELLS }).flatMap((_, r) =>
        Array.from({ length: CELLS }).map((__, c) => {
          const f = finderCell(r, c)
          const on = f === null ? bits[r * CELLS + c] : f
          return on ? <rect key={`${r}-${c}`} x={c * px} y={r * px} width={px} height={px} fill="#22262e" /> : null
        }),
      )}
    </svg>
  )
}
