import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { useTx } from '../../../lib/adminLang.js'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { BarsChart } from '../../../components/domain/Charts.jsx'
import { useDb } from '../../../lib/store.jsx'
import { num, relative } from '../../../lib/format.js'
import { Server } from 'lucide-react'
const CHANNELS = [
  { name: 'Push', sent: 412_880, delivered: 396_104, failed: 16_776 },
  { name: 'SMS', sent: 98_210, delivered: 95_662, failed: 2_548 },
  { name: 'Email', sent: 21_044, delivered: 20_811, failed: 233 },
  { name: 'In-app', sent: 184_000, delivered: 184_000, failed: 0 },
  { name: 'Viber', sent: 12_400, delivered: 11_988, failed: 412 },
  { name: 'Voice', sent: 86, delivered: 81, failed: 5 },
]
export default function DeliveryLogs() {
  const tx = useTx()
  const { db } = useDb()
  const recent = db.notifications.slice(0, 20).map((n, i) => ({
    id: n.id,
    title: n.title,
    audience: n.audience,
    channel: i % 4 === 0 ? 'SMS' : i % 3 === 0 ? 'Email' : 'Push',
    status: i % 9 === 0 ? 'failed' : i % 5 === 0 ? 'fallback' : 'delivered',
    attempts: i % 9 === 0 ? 3 : 1,
    at: n.at,
  }))
  const totalSent = CHANNELS.reduce((s, c) => s + c.sent, 0)
  const totalFailed = CHANNELS.reduce((s, c) => s + c.failed, 0)
  return (
    <>
      <PageHeader
        title="Delivery logs"
        subtitle="Delivery receipts, retries, push-to-SMS fallback and rate limiting. Every message the platform sends is accounted for."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Messages sent (30 days)"
          value={num(totalSent)}
          icon={Server}
          method="All channels, including in-app inbox writes."
        />
        <Stat
          label="Delivery rate"
          value={`${(((totalSent - totalFailed) / totalSent) * 100).toFixed(1)}%`}
          tone="good"
          method="Delivered ÷ sent after retries and fallback."
        />
        <Stat
          label="Failed"
          value={num(totalFailed)}
          tone="warn"
          method="Undeliverable after three attempts — usually an unreachable handset."
        />
        <Stat
          label="Fallback to SMS"
          value={num(16_776)}
          method="Push messages that did not acknowledge within 60 seconds and were resent by SMS."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader title="By channel" subtitle="Last 30 days" />
          <CardBody>
            <BarsChart
              data={CHANNELS}
              x="name"
              height={230}
              series={[
                { key: 'delivered', label: 'Delivered' },
                { key: 'failed', label: 'Failed', color: '#be123c' },
              ]}
              format={num}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Rate limits" subtitle="Protecting the SMS gateway and provider quotas" />
          <CardBody className="space-y-2">
            {[
              ['SMS', '400 / second'],
              ['Push', '5,000 / second'],
              ['Voice', '20 concurrent'],
              ['Email', '100 / second'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <span className="flex-1 text-[12.5px] text-ink-800">{tx(k)}</span>
                <Badge tone="slate">{v}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent deliveries" />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'title', header: 'Message' },
              { key: 'audience', header: 'Audience' },
              { key: 'channel', header: 'Channel', render: (r) => <Badge tone="brand">{r.channel}</Badge> },
              { key: 'attempts', header: 'Attempts', align: 'right' },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge tone={r.status === 'delivered' ? 'green' : r.status === 'fallback' ? 'amber' : 'red'}>
                    {r.status}
                  </Badge>
                ),
              },
              { key: 'at', header: 'When', render: (r) => relative(r.at) },
            ]}
            rows={recent}
            exportName="delivery-logs"
            empty="No messages yet"
          />
        </CardBody>
      </Card>
    </>
  )
}
