import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { DonutChart, Legend2, TrendChart } from '../../../components/domain/Charts.jsx'
import { useDb } from '../../../lib/store.jsx'
import { MMK, dateOnly, num } from '../../../lib/format.js'
import { Coins } from 'lucide-react'
const SPLIT = { authority: 50, platform: 30, operator: 20 }
export default function AdBilling() {
  const { db } = useDb()
  const live = db.campaigns.filter((c) => c.status === 'live' && c.budget > 0)
  const gross = live.reduce((s, c) => s + c.budget, 0)
  const mix = [
    { name: `Authority ${SPLIT.authority}%`, value: Math.round((gross * SPLIT.authority) / 100), color: '#38663b' },
    { name: `Platform ${SPLIT.platform}%`, value: Math.round((gross * SPLIT.platform) / 100), color: '#6a9d6c' },
    { name: `Operator ${SPLIT.operator}%`, value: Math.round((gross * SPLIT.operator) / 100), color: '#0284c7' },
  ]
  const trend = db.salesDaily.map((d) => ({ date: d.date.slice(5), ads: Math.round(d.gross * 0.006) }))
  const invoices = live.map((c, i) => ({
    id: `INV-A-${4000 + i}`,
    advertiser: c.advertiser,
    campaign: c.id,
    period: `${dateOnly(c.start)} – ${dateOnly(c.end)}`,
    impressions: c.impressions,
    amount: c.budget,
    status: i % 3 === 0 ? 'unpaid' : 'paid',
  }))
  return (
    <>
      <PageHeader
        title="Billing & revenue split"
        subtitle="Invoices and the revenue split between authority, platform and operator. Ad revenue is non-tax revenue for the authority."
        meta={<Badge tone="amber">Split still to be agreed in the commercial model (Q4)</Badge>}
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Gross ad revenue"
          value={MMK(gross)}
          icon={Coins}
          method="Budget committed on live commercial campaigns in the current period."
        />
        <Stat
          label="Authority share"
          value={MMK(mix[0].value)}
          tone="good"
          method={`${SPLIT.authority}% of gross, posted to the treasury account as non-tax revenue.`}
        />
        <Stat
          label="Operator share"
          value={MMK(mix[2].value)}
          method={`${SPLIT.operator}% where the slot is on an operator's own bus or a route they hold the permit for.`}
        />
        <Stat
          label="Impressions billed"
          value={num(live.reduce((s, c) => s + c.impressions, 0))}
          method="Delivered impressions used to compute CPM billing."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Ad revenue trend" subtitle="Last 14 days" />
          <CardBody>
            <TrendChart
              data={trend}
              height={220}
              series={[{ key: 'ads', label: 'Ad revenue' }]}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Revenue split" />
          <CardBody>
            <DonutChart
              data={mix}
              format={MMK}
              center={{ value: MMK(gross).replace(' MMK', ''), label: 'gross MMK' }}
            />
            <Legend2 items={mix} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Advertiser invoices" />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'id', header: 'Invoice', render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span> },
              { key: 'advertiser', header: 'Advertiser' },
              { key: 'campaign', header: 'Campaign' },
              { key: 'period', header: 'Period' },
              { key: 'impressions', header: 'Impressions', align: 'right', render: (r) => num(r.impressions) },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => MMK(r.amount) },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge tone={r.status === 'paid' ? 'green' : 'amber'}>{r.status}</Badge>,
              },
            ]}
            rows={invoices}
            exportName="ad-invoices"
            empty="No billable campaigns"
          />
        </CardBody>
      </Card>
    </>
  )
}
