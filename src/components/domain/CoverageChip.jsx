import { useTx } from '../../lib/adminLang.js'
import Badge from '../ui/Badge.jsx'
import { Radio } from 'lucide-react'

const QUALIFIER = {
  full: { tone: 'green', label: 'Full' },
  indicative: { tone: 'amber', label: 'Indicative' },
  warning: { tone: 'red', label: 'Low coverage' },
  withheld: { tone: 'slate', label: 'Withheld' },
}

/** The coverage qualifier travels with every figure it qualifies. */
export default function CoverageChip({ coverage, compact }) {
  const tx = useTx()
  const q = QUALIFIER[coverage.qualifier]
  if (compact)
    return (
      <Badge tone={q.tone} icon={Radio}>
        {coverage.pct}% · {q.label}
      </Badge>
    )
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5">
      <Radio size={13} className="text-brand-600" />
      <span className="text-[12.5px] text-ink-600">{tx('Data coverage')}</span>
      <span className="text-[13px] font-semibold text-ink-900 tabular-nums">{coverage.pct}%</span>
      <Badge tone={q.tone}>{q.label}</Badge>
    </div>
  )
}

export function NotMeasurable({ reason = 'Coverage below the census floor' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-400 italic" title={reason}>
      <span className="w-1.5 h-1.5 rounded-full bg-ink-300" />
      not measurable
    </span>
  )
}
