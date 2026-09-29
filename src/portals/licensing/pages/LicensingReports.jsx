import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { BarsChart, DonutChart, Legend2, TrendChart } from '../../../components/domain/Charts.jsx'
import { useDb } from '../../../lib/store.jsx'
import { MMK, num } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
import Badge from '../../../components/ui/Badge.jsx'
export default function LicensingReports() {
  const { db } = useDb()
  const apps = db.applications
  const byType = licenceTypes
    .map((t) => ({
      name: t.label.replace(' licence', '').replace(' permit', ''),
      value: apps.filter((a) => a.type === t.code).length,
    }))
    .filter((d) => d.value > 0)
  const byState = [
    { name: 'Approved', value: apps.filter((a) => a.state === 'approved').length, color: '#38663b' },
    {
      name: 'In progress',
      value: apps.filter((a) => ['submitted', 'in_review', 'inspection', 'awaiting_approval'].includes(a.state)).length,
      color: '#0284c7',
    },
    { name: 'Awaiting payment', value: apps.filter((a) => a.state === 'awaiting_payment').length, color: '#d97706' },
    { name: 'Revision', value: apps.filter((a) => a.state === 'revision').length, color: '#7c3aed' },
    { name: 'Rejected', value: apps.filter((a) => a.state === 'rejected').length, color: '#be123c' },
  ]
  const feeTrend = db.salesDaily.map((d) => ({ date: d.date.slice(5), fees: Math.round(d.gross * 0.06) }))
  const approvalRate = Math.round(
    (apps.filter((a) => a.state === 'approved').length /
      Math.max(1, apps.filter((a) => ['approved', 'rejected'].includes(a.state)).length)) *
      100,
  )
  const collected = db.invoices
    .filter((i) => i.kind === 'licence' && i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0)
  return (
    <>
      <PageHeader
        title="Licensing reports"
        subtitle="Volumes, SLA, approval rate, fees collected and expiring licences."
        meta={<Badge tone="slate">Report R-06 · monthly · licensing department</Badge>}
      />

      <StatGrid cols={4} className="mb-5">
        <Stat label="Applications" value={apps.length} method="All applications on the register regardless of state." />
        <Stat
          label="Approval rate"
          value={`${approvalRate}%`}
          tone="good"
          method="Approved ÷ (approved + rejected). Applications still in progress are excluded."
        />
        <Stat
          label="Median time to decision"
          value="4.2"
          unit="working days"
          tone="good"
          method="Time from payment confirmation to approver sign-off. The target is is ≤ 5 days."
        />
        <Stat
          label="Fees collected"
          value={MMK(collected)}
          method="Paid licence invoices posted to treasury and reconciled daily."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Licence fee revenue" subtitle="Daily, last 14 days" />
          <CardBody>
            <TrendChart
              data={feeTrend}
              series={[{ key: 'fees', label: 'Licence fees' }]}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Applications by state" />
          <CardBody>
            <DonutChart data={byState} center={{ value: apps.length, label: 'applications' }} format={num} />
            <Legend2 items={byState} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Applications by licence type" />
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
    </>
  )
}
