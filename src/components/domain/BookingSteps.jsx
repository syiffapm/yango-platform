import { Check } from 'lucide-react'
const STEPS = ['Bus', 'Seat', 'Who', 'Pay']

/** Where am I, how much is left — the question every first-time buyer asks. */
export default function BookingSteps({ current, hasPassengers = true }) {
  const steps = hasPassengers ? STEPS : STEPS.filter((s) => s !== 'Who')
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-b border-ink-100">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s} className="flex items-center gap-1.5 flex-1 last:flex-none">
            <span
              className={`shrink-0 w-5 h-5 rounded-full grid place-items-center text-[11px] font-semibold ${
                done
                  ? 'bg-brand-600 text-white'
                  : active
                    ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-300'
                    : 'bg-ink-100 text-ink-400'
              }`}
            >
              {done ? <Check size={11} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={`text-[12px] ${active ? 'text-ink-900 font-medium' : done ? 'text-ink-500' : 'text-ink-300'}`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className={`flex-1 h-px ${done ? 'bg-brand-300' : 'bg-ink-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}
