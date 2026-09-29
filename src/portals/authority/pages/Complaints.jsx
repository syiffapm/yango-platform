import { useState } from 'react'
import { LifeBuoy, MessageSquare, Send } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Drawer from '../../../components/ui/Drawer.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Field, Textarea } from '../../../components/ui/Field.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { countdown, dt, relative } from '../../../lib/format.js'
export default function Complaints() {
  const { db, update, audit, me } = useAuthority()
  const toast = useToast()
  const [sel, setSel] = useState(null)
  const [reply, setReply] = useState('')
  const rows = db.helpdesk.map((t) => ({ ...t, sla: countdown(t.sla) }))
  const open = rows.filter((t) => t.status === 'open')
  const breaching = open.filter((t) => t.sla.overdue)
  const send = () => {
    update((d) => {
      const t = d.helpdesk.find((x) => x.id === sel.id)
      t.messages.push({ at: new Date().toISOString(), by: 'YRTC', text: reply })
      t.status = 'resolved'
    })
    audit({
      actor: me.id,
      role: me.role,
      action: 'Resolved complaint',
      object: sel.id,
      reason: reply,
      category: 'Administration',
    })
    toast({ title: 'Reply sent', body: 'The complainant is notified and the ticket is resolved.' })
    setReply('')
    setSel(null)
  }
  return (
    <>
      <PageHeader
        title="Complaints oversight"
        subtitle="Helpdesk SLA and refund disputes across the platform. Complaints assigned to an operator are visible here so the authority can see whether they are answered."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Open tickets"
          value={open.length}
          tone={open.length ? 'warn' : 'good'}
          icon={LifeBuoy}
          method="Complaints, refund disputes and lost-property cases not yet resolved."
        />
        <Stat
          label="Breaching SLA"
          value={breaching.length}
          tone={breaching.length ? 'bad' : 'good'}
          method="Open past the response target for their category."
        />
        <Stat
          label="Refund disputes"
          value={rows.filter((t) => t.category.toLowerCase().includes('refund')).length}
          method="Cases where a passenger contests a refund decision."
        />
        <Stat
          label="Median resolution"
          value="1.8"
          unit="days"
          tone="good"
          method="Time from first message to resolution over the last 30 days."
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
        exportName="complaints"
        empty="No complaints"
      />

      <Card className="mt-4">
        <CardHeader
          title="Where complaints come from"
          subtitle="App, chatbot handover and the web form all land in one queue"
          icon={MessageSquare}
        />
        <CardBody className="flex flex-wrap gap-2">
          {['Citizen App', 'Ask YanGo handover', 'Web form', 'Terminal desk', 'Operator escalation'].map((s) => (
            <Badge key={s} tone="brand">
              {s}
            </Badge>
          ))}
        </CardBody>
      </Card>

      <Drawer
        open={!!sel}
        onClose={() => {
          setSel(null)
          setReply('')
        }}
        title={sel?.subject}
        subtitle={sel ? `${sel.id} · ${sel.category} · raised ${relative(sel.at)}` : ''}
        footer={
          sel?.status === 'open' && (
            <Button variant="primary" icon={Send} disabled={!reply} onClick={send}>
              Send reply and resolve
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
              <Field label="Reply" hint="Never include another passenger's personal details in a reply.">
                <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} />
              </Field>
            )}
          </div>
        )}
      </Drawer>
    </>
  )
}
