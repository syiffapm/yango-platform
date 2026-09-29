import { useState } from 'react'
import { LifeBuoy, Send, Zap } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Drawer from '../../../components/ui/Drawer.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Field, Select, Textarea } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { countdown, dt, relative } from '../../../lib/format.js'
const MACROS = [
  {
    id: 'refund',
    label: 'Refund timeline',
    text: 'Your refund has been approved and will reach your original payment method within 7 working days. The reference is {{ref}}.',
  },
  {
    id: 'lost',
    label: 'Lost property found',
    text: 'Good news — the item was found and is held at the depot. Please bring your ID and the ticket PNR to collect it within 14 days.',
  },
  {
    id: 'accessibility',
    label: 'Accessibility follow-up',
    text: 'Thank you for reporting this. The operator has been asked to retrain the crew on ramp deployment and to confirm the fix within 14 days.',
  },
  {
    id: 'escalate',
    label: 'Escalated to the authority',
    text: 'This case has been escalated to the Yangon Region Transport Committee. An officer will contact you with the outcome.',
  },
]
export default function Helpdesk() {
  const { db, update } = useDb()
  const toast = useToast()
  const [sel, setSel] = useState(null)
  const [reply, setReply] = useState('')
  const rows = db.helpdesk.map((t) => ({ ...t, sla: countdown(t.sla) }))
  const open = rows.filter((t) => t.status === 'open')
  const send = () => {
    update((d) => {
      const t = d.helpdesk.find((x) => x.id === sel.id)
      t.messages.push({ at: new Date().toISOString(), by: 'Support agent', text: reply })
      t.status = 'resolved'
    })
    toast({ title: 'Reply sent', body: 'The ticket is resolved and the complainant is notified.' })
    setReply('')
    setSel(null)
  }
  return (
    <>
      <PageHeader
        title="Helpdesk"
        subtitle="Ticketed complaints from the app, the chatbot and the web, with categories, SLA, assignment and an agent console with macros."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Open tickets"
          value={open.length}
          tone={open.length ? 'warn' : 'good'}
          icon={LifeBuoy}
          method="Cases not yet resolved across every channel."
        />
        <Stat
          label="Breaching SLA"
          value={open.filter((t) => t.sla.overdue).length}
          tone={open.some((t) => t.sla.overdue) ? 'bad' : 'good'}
          method="Open past the response target for their category."
        />
        <Stat
          label="Resolved"
          value={rows.filter((t) => t.status === 'resolved').length}
          tone="good"
          method="Cases closed with a reply to the complainant."
        />
        <Stat
          label="Median first response"
          value="3.2"
          unit="hours"
          method="Time from the first message to the first agent reply over the last 30 days."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'id', header: 'Ticket' },
          { key: 'subject', header: 'Subject' },
          { key: 'category', header: 'Category', render: (r) => <Badge tone="slate">{r.category}</Badge> },
          { key: 'from', header: 'From' },
          { key: 'assignee', header: 'Assigned to' },
          { key: 'at', header: 'Raised', render: (r) => relative(r.at) },
          {
            key: 'sla',
            header: 'SLA',
            align: 'right',
            sortable: false,
            render: (r) =>
              r.status === 'resolved' ? (
                <span className="text-ink-300">—</span>
              ) : (
                <span
                  className={`text-[12.5px] tabular-nums ${r.sla.overdue ? 'text-red-600 font-semibold' : 'text-ink-500'}`}
                >
                  {r.sla.text}
                </span>
              ),
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        onRowClick={setSel}
        exportName="helpdesk"
        empty="No tickets"
      />

      <Drawer
        open={!!sel}
        onClose={() => {
          setSel(null)
          setReply('')
        }}
        title={sel?.subject}
        subtitle={sel ? `${sel.id} · ${sel.category} · ${relative(sel.at)}` : ''}
        footer={
          sel?.status === 'open' && (
            <Button variant="primary" icon={Send} disabled={!reply} onClick={send}>
              Send and resolve
            </Button>
          )
        }
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusPill status={sel.status} />
              <Badge tone="slate">Assigned to {sel.assignee}</Badge>
            </div>

            <div className="space-y-2">
              {sel.messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${m.by === 'Citizen' ? 'border-ink-200 bg-white' : 'border-brand-200 bg-brand-50'}`}
                >
                  <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">
                    {m.by} · {dt(m.at)}
                  </p>
                  <p className="text-[12.5px] text-ink-800 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            {sel.status === 'open' && (
              <>
                <div>
                  <p className="text-[12.5px] font-medium text-ink-600 mb-2 inline-flex items-center gap-1.5">
                    <Zap size={12} />
                    Macros
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MACROS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setReply(m.text)}
                        className="rounded-full border border-ink-200 px-2.5 py-1 text-[12px] text-ink-600 hover:border-brand-300 hover:bg-brand-50"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Reply">
                  <Textarea rows={5} value={reply} onChange={(e) => setReply(e.target.value)} />
                </Field>
                <Field label="Reassign to">
                  <Select defaultValue={sel.assignee}>
                    <option>Platform</option>
                    <option>YRTC</option>
                    {(db.operators || []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
          </div>
        )}
      </Drawer>
    </>
  )
}
