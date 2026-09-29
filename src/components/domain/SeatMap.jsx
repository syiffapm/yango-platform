import { Fragment } from 'react'
import { seatTemplates } from '../../data/org.js'
import { Armchair, CircleDot } from 'lucide-react'

/**
 * Seat map for a bus. Sold seats are locked; held seats show the 10-minute
 * hold. Priority and women-only seats keep their number and are marked
 * by colour, so the plan still reads as a seating plan.
 */
export default function SeatMap({
  layout = 'coach-2-2',
  sold = [],
  held = [],
  selected = [],
  onToggle,
  max = 4,
  readOnly,
}) {
  const tpl = seatTemplates[layout] || seatTemplates['coach-2-2']
  const { rows, cols, aisleAfter } = tpl
  const priority = [1, 2, 3, 4]
  const women = [5, 6]
  const seatNo = (r, c) => r * cols + c + 1
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-500">
          <Armchair size={13} /> {tpl.capacity} seats · {layout.replace('coach-', '').replace('-', '–')} layout
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2 py-1 text-[11px] text-ink-500">
          <CircleDot size={11} className="text-ink-400" /> Driver · front
        </span>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-ink-50/50 p-3">
        <div className="space-y-1.5">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-1.5 justify-center">
              <span className="w-4 text-[11px] text-ink-300 tabular-nums">{r + 1}</span>
              {Array.from({ length: cols }).map((__, c) => {
                const n = seatNo(r, c)
                if (n > tpl.capacity) return <span key={c} className="w-8 h-8" />
                const isSold = sold.includes(n)
                const isHeld = held.includes(n)
                const isSel = selected.includes(n)
                const isPriority = priority.includes(n)
                const isWomen = women.includes(n)
                const disabled = readOnly || isSold || isHeld || (!isSel && selected.length >= max)
                const cls = isSold
                  ? 'bg-ink-200 text-ink-400 border-ink-200 cursor-not-allowed'
                  : isHeld
                    ? 'bg-amber-100 text-amber-700 border-amber-300 cursor-not-allowed'
                    : isSel
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : isPriority
                        ? 'bg-sky-50 text-sky-800 border-sky-300 hover:border-sky-500'
                        : isWomen
                          ? 'bg-violet-50 text-violet-800 border-violet-300 hover:border-violet-500'
                          : 'bg-white text-ink-600 border-ink-200 hover:border-brand-400'
                return (
                  <Fragment key={c}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggle?.(n)}
                      className={`w-8 h-8 rounded-lg border text-[11.5px] font-semibold transition tabular-nums flex items-center justify-center ${cls}`}
                      title={
                        isSold
                          ? `Seat ${n} — sold`
                          : isHeld
                            ? `Seat ${n} — held`
                            : isPriority
                              ? `Seat ${n} — priority seat`
                              : isWomen
                                ? `Seat ${n} — women only`
                                : `Seat ${n}`
                      }
                    >
                      {n}
                    </button>
                    {c === aisleAfter - 1 && <span className="w-4" />}
                  </Fragment>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Only explain the colours that are actually on this plan. */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {[
          ['bg-white border-ink-300', 'Available', true],
          ['bg-brand-600 border-brand-600', 'Selected', selected.length > 0],
          ['bg-ink-200 border-ink-200', 'Sold', sold.length > 0],
          ['bg-amber-100 border-amber-300', 'Held by someone else', held.length > 0],
          ['bg-sky-50 border-sky-300', 'Priority seat', true],
          ['bg-violet-50 border-violet-300', 'Women only', true],
        ]
          .filter(([, , show]) => show)
          .map(([cls, label]) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-500">
              <span className={`w-3 h-3 rounded border ${cls}`} />
              {label}
            </span>
          ))}
      </div>
    </div>
  )
}
