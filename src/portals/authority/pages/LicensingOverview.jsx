import { Link } from 'react-router-dom'
import { ClipboardList, ExternalLink } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { BarsChart, DonutChart, Legend2 } from '../../../components/domain/Charts.jsx'
import useAuthority from '../useAuthority.js'
import { MMK, countdown, daysUntil, relative } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
export default function LicensingOverview() {
  const { db } = useAuthority()
  const apps = db.applications
  const open = apps.filter((a) =>
    ['submitted', 'awaiting_payment', 'in_review', 'inspection', 'awaiting_approval', 'revision'].includes(a.state),
  )
  const overdue = open.filter((a) => countdown(a.slaDueAt).overdue)
  const expiring = db.permits.filter((p) => daysUntil(p.expiry) <= 90 && daysUntil(p.expiry) > 0)
  const suspended = db.permits.filter((p) => p.status === 'suspended')
  const feesPaid = db.invoices
    .filter((i) => i.kind === 'licence' && i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0)
  const byState = [
    { name: 'In review', value: apps.filter((a) => a.state === 'in_review').length, color: '#0284c7' },
    { name: 'Awaiting approval', value: apps.filter((a) => a.state === 'awaiting_approval').length, color: '#d97706' },
    { name: 'Inspection', value: apps.filter((a) => a.state === 'inspection').length, color: '#7c3aed' },
    { name: 'Awaiting payment', value: apps.filter((a) => a.state === 'awaiting_payment').length, color: '#64748b' },
    { name: 'Approved', value: apps.filter((a) => a.state === 'approved').length, color: '#38663b' },
    { name: 'Rejected', value: apps.filter((a) => a.state === 'rejected').length, color: '#be123c' },
  ].filter((d) => d.value > 0)
  const byType = licenceTypes
    .map((t) => ({
      name: t.label.replace(' licence', '').replace(' permit', ''),
      value: apps.filter((a) => a.type === t.code).length,
    }))
    .filter((d) => d.value > 0)
  return (
    <>
      <PageHeader
        title="Licensing overview"
        subtitle="Applications by status and SLA, approvals, rejections, expiring and suspended licences. Decisions are taken in the Licensing Portal back office."
        actions={
          <Button variant="primary" icon={ExternalLink} as={Link} to="/licensing/queue">
            Open officer work queue
          </Button>
        }
      />

      <StatGrid cols={5} className="mb-5">
        <Stat
          label="Open applications"
          value={open.length}
          icon={ClipboardList}
          method="Applications not yet approved or rejected."
        />
        <Stat
          label="SLA overdue"
          value={overdue.length}
          tone={overdue.length ? 'bad' : 'good'}
          method="Past the five-working-day target from payment confirmation. The published target."
        />
        <Stat
          label="Expiring ≤ 90 days"
          value={expiring.length}
          tone="warn"
          method="Permits approaching expiry. Reminders at 90/60/30/7 days."
        />
        <Stat
          label="Suspended"
          value={suspended.length}
          tone={suspended.length ? 'bad' : 'good'}
          method="Suspension blocks new schedules, hides the holder from sale and blocks driver shift start."
        />
        <Stat
          label="Fees collected"
          value={MMK(feesPaid)}
          method="Paid licence invoices posted to the treasury account and reconciled daily."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card>
          <CardHeader title="By state" />
          <CardBody>
            <DonutChart data={byState} center={{ value: apps.length, label: 'applications' }} />
            <Legend2 items={byState} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="By licence type" />
          <CardBody>
            <BarsChart
              data={byType}
              x="name"
              layout="vertical"
              height={220}
              series={[{ key: 'value', label: 'Applications' }]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Applications"
          subtitle="Read-only here — verification and approval happen in the Licensing Portal with maker–checker separation."
        />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'id', header: 'Application' },
              { key: 'typeLabel', header: 'Type' },
              { key: 'applicantName', header: 'Applicant' },
              { key: 'quantity', header: 'Qty', align: 'right' },
              { key: 'fee', header: 'Fee', align: 'right', render: (r) => MMK(r.fee) },
              { key: 'submittedAt', header: 'Submitted', render: (r) => relative(r.submittedAt) },
              { key: 'state', header: 'Status', render: (r) => <StatusPill status={r.state} /> },
              {
                key: 'slaDueAt',
                header: 'SLA',
                align: 'right',
                render: (r) => {
                  const c = countdown(r.slaDueAt)
                  return ['approved', 'rejected'].includes(r.state) ? (
                    <span className="text-ink-300">—</span>
                  ) : (
                    <span
                      className={c.overdue ? 'text-red-600 font-semibold text-[12.5px]' : 'text-ink-500 text-[12.5px]'}
                    >
                      {c.text}
                    </span>
                  )
                },
              },
              {
                key: '_a',
                header: '',
                sortable: false,
                align: 'right',
                render: (r) => (
                  <Button size="xs" variant="subtle" as={Link} to={`/licensing/application/${r.id}`}>
                    Open
                  </Button>
                ),
              },
            ]}
            rows={apps}
            exportName="licensing-overview"
            searchKeys={['id', 'typeLabel', 'applicantName']}
            filters={[
              {
                key: 'state',
                label: 'Status',
                options: [...new Set(apps.map((a) => a.state))].map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Expiring permits"
          subtitle="Renewal reminders go out automatically at 90, 60, 30 and 7 days"
        />
        <CardBody className="p-0">
          <DataTable
            search={false}
            columns={[
              { key: 'id', header: 'Permit', render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span> },
              { key: 'holderName', header: 'Holder' },
              { key: 'type', header: 'Type' },
              { key: 'expiry', header: 'Expires' },
              {
                key: '_d',
                header: 'Days left',
                align: 'right',
                sortable: false,
                render: (r) => <Badge tone={daysUntil(r.expiry) <= 30 ? 'red' : 'amber'}>{daysUntil(r.expiry)}</Badge>,
              },
            ]}
            rows={expiring.slice(0, 20)}
            empty="Nothing expiring in the next 90 days"
          />
        </CardBody>
      </Card>
    </>
  )
}
