import { useState } from 'react'
import { LifeBuoy, MessageSquarePlus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input, Select, Textarea } from '../../../components/ui/Field.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dt, relative } from '../../../lib/format.js'
export default function AuditLog() {
  const { db, update, op } = useOperator()
  const toast = useToast()
  const [tab, setTab] = useState('audit')
  const [ticket, setTicket] = useState(null)
  const mine = db.audit.filter(
    (a) => a.actor === op.id || String(a.object || '').includes(op.id) || String(a.role || '').startsWith('po_'),
  )
  const tickets = db.helpdesk.filter((t) => t.assignee === op.id || t.from === op.name)
  const raise = () => {
    update((d) => {
      d.helpdesk.unshift({
        id: `HD-${800 + d.helpdesk.length}`,
        subject: ticket.subject,
        category: ticket.category,
        from: op.name,
        at: new Date().toISOString(),
        status: 'open',
        assignee: 'Platform',
        sla: new Date(Date.now() + 86400000).toISOString(),
        messages: [{ at: new Date().toISOString(), by: op.name, text: ticket.body }],
      })
    })
    toast({ title: 'Ticket raised', body: 'The platform support desk responds within the contracted SLA.' })
    setTicket(null)
  }
  return (
    <>
      <PageHeader
        title="Help & audit"
        subtitle="Helpdesk tickets to the platform and a read-only view of your own audit entries. The audit log is append-only and hash-chained; you read your own lines, never anyone else's."
        actions={
          <Button
            variant="primary"
            icon={MessageSquarePlus}
            onClick={() => setTicket({ subject: '', category: 'Technical', body: '' })}
          >
            Raise a ticket
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'audit', label: 'Audit log', count: mine.length },
          { value: 'help', label: 'Helpdesk', count: tickets.length },
        ]}
      />

      {tab === 'audit' && (
        <>
          <Card className="mb-4">
            <CardBody className="flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-brand-600 mt-px shrink-0" />
              <p className="text-[12px] text-ink-600 leading-relaxed">
                Every create, update, approval, export and sign-in is written to an append-only, hash-chained log. Where
                an action required a written reason and none was recorded, the entry is flagged rather than hidden.
              </p>
            </CardBody>
          </Card>
          <DataTable
            columns={[
              { key: 'at', header: 'When', render: (r) => <span title={dt(r.at)}>{relative(r.at)}</span> },
              { key: 'actor', header: 'Actor' },
              { key: 'role', header: 'Role', render: (r) => <Badge tone="slate">{r.role}</Badge> },
              { key: 'action', header: 'Action' },
              { key: 'object', header: 'Object' },
              {
                key: 'reason',
                header: 'Written reason',
                className: 'max-w-md',
                render: (r) =>
                  r.reason ? (
                    <span className="text-[12.5px] text-ink-600">“{r.reason}”</span>
                  ) : r.flag ? (
                    <Badge tone="red">{r.flag}</Badge>
                  ) : (
                    <span className="text-ink-300">—</span>
                  ),
              },
            ]}
            rows={mine}
            exportName="audit-log"
            filters={[
              {
                key: 'category',
                label: 'Category',
                options: [...new Set(mine.map((a) => a.category))].map((c) => ({ value: c, label: c })),
              },
            ]}
            empty="No audit entries for your company yet"
          />
        </>
      )}

      {tab === 'help' && (
        <DataTable
          columns={[
            { key: 'id', header: 'Ticket' },
            { key: 'subject', header: 'Subject' },
            { key: 'category', header: 'Category' },
            { key: 'from', header: 'From' },
            { key: 'at', header: 'Raised', render: (r) => relative(r.at) },
            { key: 'assignee', header: 'Assigned to' },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
          rows={tickets}
          exportName="helpdesk"
          empty="No tickets"
        />
      )}

      <Modal
        open={!!ticket}
        onClose={() => setTicket(null)}
        title="Raise a support ticket"
        footer={
          <>
            <Button onClick={() => setTicket(null)}>Cancel</Button>
            <Button variant="primary" disabled={!ticket?.subject} onClick={raise}>
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Subject" required>
            <Input
              value={ticket?.subject || ''}
              onChange={(e) => setTicket((s) => ({ ...s, subject: e.target.value }))}
            />
          </Field>
          <Field label="Category">
            <Select value={ticket?.category} onChange={(e) => setTicket((s) => ({ ...s, category: e.target.value }))}>
              {['Technical', 'Settlement', 'Licensing', 'Device / telematics', 'Account access'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Describe the problem" required>
            <Textarea
              rows={4}
              value={ticket?.body || ''}
              onChange={(e) => setTicket((s) => ({ ...s, body: e.target.value }))}
            />
          </Field>
          <p className="text-[12px] text-ink-400 inline-flex items-center gap-1.5">
            <LifeBuoy size={12} /> 24×7 for SOS and payments; business hours otherwise.
          </p>
        </div>
      </Modal>
    </>
  )
}
