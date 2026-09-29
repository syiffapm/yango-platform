import { useTx } from '../../lib/adminLang.js'
export default function Progress({ value, max = 100, tone = 'brand', className = '', height = 6, label }) {
  const tx = useTx()
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const colors = {
    brand: 'bg-brand-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-ink-400',
  }
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-[12px] text-ink-500 mb-1">
          <span>{tx(label)}</span>
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full rounded-full bg-ink-100 overflow-hidden" style={{ height }}>
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${colors[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
export function Steps({ steps, current, className = '' }) {
  return (
    <ol className={`flex items-center gap-1 ${className}`}>
      {steps.map((s, i) => {
        const done = i < current,
          active = i === current
        return (
          <li key={s} className="flex items-center gap-1 flex-1 min-w-0 last:flex-none">
            <span
              className={`shrink-0 w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${done ? 'bg-brand-600 text-white' : active ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-300' : 'bg-ink-100 text-ink-400'}`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={`text-[12px] truncate ${active ? 'text-ink-900 font-medium' : 'text-ink-400'}`}>{s}</span>
            {i < steps.length - 1 && <span className={`flex-1 h-px ${done ? 'bg-brand-300' : 'bg-ink-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
