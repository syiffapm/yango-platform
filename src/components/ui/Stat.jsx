import { Info, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useTx } from '../../lib/adminLang.js'

/** Every KPI tile carries an info tooltip with method and data source. */
export default function Stat({
  label,
  value,
  unit,
  delta,
  hint,
  method,
  icon: Icon,
  tone = 'default',
  onClick,
  className = '',
}) {
  const [show, setShow] = useState(false)
  const tx = useTx()
  const toneRing = {
    default: 'border-ink-200/70',
    good: 'border-emerald-200 bg-emerald-50/40',
    warn: 'border-amber-200 bg-amber-50/40',
    bad: 'border-red-200 bg-red-50/40',
    muted: 'border-ink-200 bg-ink-50/60',
  }[tone]
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border p-3.5 ${toneRing} ${onClick ? 'cursor-pointer hover:border-brand-300 transition-colors' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] font-medium text-ink-500 leading-tight">{tx(label)}</span>
        <div className="flex items-center gap-1 shrink-0">
          {Icon && <Icon size={14} className="text-ink-300" />}
          {method && (
            <button
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(false)}
              onClick={(e) => {
                e.stopPropagation()
                setShow((s) => !s)
              }}
              className="text-ink-300 hover:text-ink-600"
              aria-label="Method and data source"
            >
              <Info size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[22px] font-semibold text-ink-900 tabular-nums leading-none">{value}</span>
        {unit && <span className="text-[12px] text-ink-500">{unit}</span>}
      </div>
      {(hint || delta != null) && (
        <div className="mt-1.5 flex items-center gap-2">
          {delta != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-[12px] text-ink-400 truncate">{tx(hint)}</span>}
        </div>
      )}
      {show && method && (
        <div className="absolute z-20 top-9 right-2 w-60 bg-ink-900 text-white text-[12px] leading-relaxed rounded-lg p-2.5 shadow-xl">
          <span className="block font-semibold mb-1">Method &amp; source</span>
          {method}
        </div>
      )}
    </div>
  )
}
export function StatGrid({ children, cols = 4, className = '' }) {
  const map = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
    6: 'sm:grid-cols-3 lg:grid-cols-6',
  }
  return <div className={`grid grid-cols-1 ${map[cols]} gap-3 ${className}`}>{children}</div>
}
