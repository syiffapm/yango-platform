import { useTx } from '../../lib/adminLang.js'
const tones = {
  neutral: 'bg-ink-100 text-ink-700 border-ink-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
}
export default function Badge({ tone = 'neutral', children, icon: Icon, className = '', dot }) {
  const tx = useTx()
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[11.5px] font-semibold leading-none tracking-wide ${tones[tone] || tones.neutral} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {Icon && <Icon size={11} strokeWidth={2.4} />}
      {typeof children === 'string' ? tx(children) : children}
    </span>
  )
}
const statusMap = {
  // generic
  active: ['green', 'Active'],
  valid: ['green', 'Valid'],
  paid: ['green', 'Paid'],
  live: ['green', 'Live'],
  approved: ['green', 'Approved'],
  pass: ['green', 'Pass'],
  completed: ['green', 'Completed'],
  closed: ['slate', 'Closed'],
  published: ['green', 'Published'],
  resolved: ['green', 'Resolved'],
  balanced: ['green', 'Balanced'],
  up: ['green', 'Operational'],
  verified: ['green', 'Verified'],
  // in flight
  running: ['blue', 'Running'],
  scheduled: ['blue', 'Scheduled'],
  booked: ['blue', 'Booked'],
  in_review: ['blue', 'In review'],
  submitted: ['blue', 'Submitted'],
  new: ['blue', 'New'],
  acknowledged: ['blue', 'Acknowledged'],
  in_progress: ['blue', 'In progress'],
  checked_in: ['blue', 'Checked in'],
  // waiting on someone
  pending: ['amber', 'Pending'],
  unpaid: ['amber', 'Unpaid'],
  awaiting_payment: ['amber', 'Awaiting payment'],
  awaiting_approval: ['amber', 'Awaiting approval'],
  inspection: ['amber', 'Inspection'],
  revision: ['amber', 'Revision requested'],
  forwarded: ['amber', 'Forwarded'],
  operator_responded: ['amber', 'Operator responded'],
  disputed: ['amber', 'Disputed'],
  held: ['amber', 'Held'],
  degraded: ['amber', 'Degraded'],
  exceptions: ['amber', 'Exceptions'],
  open: ['amber', 'Open'],
  // stopped
  draft: ['slate', 'Draft'],
  maintenance: ['slate', 'Maintenance'],
  sandbox: ['violet', 'Sandbox'],
  rejected: ['red', 'Rejected'],
  suspended: ['red', 'Suspended'],
  blocked: ['red', 'Blocked'],
  failed: ['red', 'Failed'],
  fail: ['red', 'Fail'],
  down: ['red', 'Down'],
  upheld: ['red', 'Upheld'],
  issued: ['red', 'Issued'],
  overdue: ['red', 'Overdue'],
  used: ['slate', 'Used'],
  expired: ['slate', 'Expired'],
  withdrawn: ['slate', 'Withdrawn'],
  not_measurable: ['slate', 'Not measurable'],
  off_service: ['slate', 'Off service'],
}
export function StatusPill({ status, label, className = '' }) {
  const tx = useTx()
  const [tone, text] = statusMap[status] || ['neutral', label || status]
  return (
    <Badge tone={tone} dot className={className}>
      {tx(label || text)}
    </Badge>
  )
}
export function PriorityPill({ priority }) {
  const tone = priority === 'P1' ? 'red' : priority === 'P2' ? 'amber' : priority === 'P3' ? 'blue' : 'slate'
  return <Badge tone={tone}>{priority}</Badge>
}
