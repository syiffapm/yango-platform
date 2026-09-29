import { useNavigate } from 'react-router-dom'
import { Inbox, UserPlus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Button from '../../../components/ui/Button.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { countdown, dt, MMK, relative } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
const OPEN_STATES = ['submitted', 'awaiting_payment', 'in_review', 'inspection', 'awaiting_approval', 'revision']
export default function OfficerQueue({ applicantMode }) {
  const { db, update, audit } = useDb()
  const [ses] = useSession('licensing')
  const nav = useNavigate()
  const toast = useToast()
  const rows = (applicantMode ? db.applications.filter((a) => a.operator === ses.operator) : db.applications).map(
    (a) => ({
      ...a,
      typeName: licenceTypes.find((t) => t.code === a.type)?.label || a.type,
      officerName: db.users.find((u) => u.id === a.officer)?.name || 'Unassigned',
      sla: countdown(a.slaDueAt),
    }),
  )
  const open = rows.filter((r) => OPEN_STATES.includes(r.state))
  const overdue = open.filter((r) => r.sla.overdue)
  const approvedThisMonth = rows.filter((r) => r.state === 'approved').length
  const feesCollected = db.invoices
    .filter((i) => i.kind === 'licence' && i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0)
  const assignToMe = (app) => {
    update((d) => {
      const a = d.applications.find((x) => x.id === app.id)
      a.officer = ses.userId
      if (a.state === 'submitted') a.state = 'in_review'
      a.timeline.unshift({ at: new Date().toISOString(), actor: ses.userId, action: 'Assigned to officer' })
    })
    audit({
      actor: ses.userId,
      role: 'lic_officer',
      action: 'Assigned application',
      object: app.id,
      category: 'Administration',
    })
    toast({ title: 'Assigned to you', body: `${app.id} moved to In review.` })
  }
  const columns = [
    {
      key: 'id',
      header: 'Application',
      width: 150,
      render: (r) => (
        <div>
          <span className="font-medium text-ink-900">{r.id}</span>
          <span className="block text-[11.5px] text-ink-400">{relative(r.submittedAt)}</span>
        </div>
      ),
    },
    { key: 'typeName', header: 'Licence type' },
    ...(applicantMode ? [] : [{ key: 'applicantName', header: 'Applicant' }]),
    { key: 'quantity', header: 'Qty', width: 60, align: 'right' },
    {
      key: 'fee',
      header: 'Fee',
      align: 'right',
      render: (r) => <span className={r.paid ? 'text-ink-700' : 'text-amber-700 font-medium'}>{MMK(r.fee)}</span>,
    },
    { key: 'state', header: 'Status', render: (r) => <StatusPill status={r.state} /> },
    ...(applicantMode
      ? []
      : [
          {
            key: 'officerName',
            header: 'Owner',
            render: (r) =>
              r.officer ? <span className="text-[12px]">{r.officerName}</span> : <Badge tone="amber">Unassigned</Badge>,
          },
        ]),
    {
      key: 'slaDueAt',
      header: 'SLA',
      align: 'right',
      render: (r) => (
        <span className={`text-[12.5px] tabular-nums ${r.sla.overdue ? 'text-red-600 font-semibold' : 'text-ink-500'}`}>
          {r.sla.text}
        </span>
      ),
    },
    {
      key: '_a',
      header: '',
      sortable: false,
      width: 90,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {!applicantMode && !r.officer && OPEN_STATES.includes(r.state) && (
            <Button
              size="xs"
              icon={UserPlus}
              onClick={(e) => {
                e.stopPropagation()
                assignToMe(r)
              }}
            >
              Take
            </Button>
          )}
          <Button
            size="xs"
            variant="subtle"
            onClick={(e) => {
              e.stopPropagation()
              nav(`/licensing/application/${r.id}`)
            }}
          >
            Open
          </Button>
        </div>
      ),
    },
  ]
  return (
    <>
      <PageHeader
        title={applicantMode ? 'Application tracker' : 'Officer work queue'}
        subtitle={
          applicantMode
            ? 'Every application your company has filed, with its current state, the officer handling it and the SLA clock.'
            : 'applications awaiting verification, inspection or approval. SLA target is five working days from payment.'
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Open applications"
          value={open.length}
          icon={Inbox}
          method="Applications in submitted, review, inspection, awaiting approval or revision."
        />
        <Stat
          label="SLA overdue"
          value={overdue.length}
          tone={overdue.length ? 'bad' : 'good'}
          method="Open applications whose five-working-day target has passed."
        />
        <Stat
          label="Approved"
          value={approvedThisMonth}
          tone="good"
          method="Applications signed off by an approver in the current register."
        />
        <Stat
          label="Fees collected"
          value={MMK(feesCollected)}
          method="Paid licence invoices posted to the treasury account."
        />
      </StatGrid>

      <DataTable
        columns={columns}
        rows={rows}
        exportName="licensing-queue"
        searchKeys={['id', 'typeName', 'applicantName', 'note']}
        onRowClick={(r) => nav(`/licensing/application/${r.id}`)}
        filters={[
          {
            key: 'state',
            label: 'Status',
            options: [...new Set(rows.map((r) => r.state))].map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          { key: 'type', label: 'Type', options: licenceTypes.map((t) => ({ value: t.code, label: t.label })) },
        ]}
        empty="No applications match this filter"
        pageSize={12}
      />

      <p className="text-[12px] text-ink-400 mt-3">
        Last refreshed {dt(new Date().toISOString())}. Maker–checker is enforced: the officer who verifies an
        application cannot be the approver who signs it off.
      </p>
    </>
  )
}
