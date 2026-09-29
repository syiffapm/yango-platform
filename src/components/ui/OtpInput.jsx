import { useEffect, useRef } from 'react'

/**
 * Six boxes, one digit each — the pattern every phone user already knows.
 * Typing moves forward, backspace moves back, and pasting a whole code from
 * the SMS fills the row in one go.
 */
export default function OtpInput({ value = '', onChange, length = 6, autoFocus = true }) {
  const refs = useRef([])
  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const setAt = (i, digit) => {
    const next = (value.padEnd(length, ' ').slice(0, i) + digit + value.padEnd(length, ' ').slice(i + 1))
      .replace(/ /g, '')
      .slice(0, length)
    onChange(next)
  }

  return (
    <div className="flex gap-2 justify-between" role="group" aria-label={`${length}-digit code`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          value={value[i] || ''}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1)
            if (!d) return
            setAt(i, d)
            refs.current[Math.min(i + 1, length - 1)]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              if (value[i]) setAt(i, '')
              else {
                refs.current[Math.max(i - 1, 0)]?.focus()
                onChange(value.slice(0, Math.max(i - 1, 0)))
              }
            }
            if (e.key === 'ArrowLeft') refs.current[Math.max(i - 1, 0)]?.focus()
            if (e.key === 'ArrowRight') refs.current[Math.min(i + 1, length - 1)]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
            if (!pasted) return
            onChange(pasted)
            refs.current[Math.min(pasted.length, length - 1)]?.focus()
          }}
          className="w-full h-14 rounded-xl border border-ink-300 bg-white text-center text-[22px] font-semibold text-ink-900 tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      ))}
    </div>
  )
}
