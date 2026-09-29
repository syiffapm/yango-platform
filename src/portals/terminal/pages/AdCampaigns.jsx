import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Link } from 'react-router-dom'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import { BarsChart } from '../../../components/domain/Charts.jsx'
import { useDb } from '../../../lib/store.jsx'
import { MMK, dateOnly, num, pct } from '../../../lib/format.js'
import { ExternalLink } from 'lucide-react'
export default function AdCampaigns() {
  const { db } = useDb()
  const rows = db.campaigns
  const impressions = rows.reduce((s, c) => s + c.impressions, 0)
  const clicks = rows.reduce((s, c) => s + c.clicks, 0)
  const perf = rows
    .filter((c) => c.impressions > 0)
    .map((c) => ({ name: c.advertiser.split(' ')[0], value: c.impressions }))
  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Bookings with contextual targeting and aggregate delivery reporting. Creative approval sits with the authority."
        actions={
          <Button icon={ExternalLink} as={Link} to="/authority/approvals">
            Open approval queue
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat label="Campaigns" value={rows.length} method="All bookings regardless of state." />
        <Stat
          label="Live"
          value={rows.filter((c) => c.status === 'live').length}
          tone="good"
          method="Approved and delivering now."
        />
        <Stat label="Impressions" value={num(impressions)} method="Aggregate counts; no personal profiling is used." />
        <Stat
          label="Click-through"
          value={pct((clicks / Math.max(1, impressions)) * 100, 2)}
          method="Clicks ÷ impressions across every live campaign."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'id', header: 'Campaign' },
          { key: 'advertiser', header: 'Advertiser' },
          { key: 'slot', header: 'Slot', render: (r) => r.slot.replace(/_/g, ' ') },
          { key: 'start', header: 'Runs', render: (r) => `${dateOnly(r.start)} – ${dateOnly(r.end)}` },
          {
            key: 'budget',
            header: 'Budget',
            align: 'right',
            render: (r) => (r.budget ? MMK(r.budget) : <Badge tone="green">Free · PSA</Badge>),
          },
          { key: 'impressions', header: 'Impressions', align: 'right', render: (r) => num(r.impressions) },
          { key: 'clicks', header: 'Clicks', align: 'right', render: (r) => num(r.clicks) },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        exportName="ad-campaigns"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: ['live', 'pending', 'rejected'].map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      <Card className="mt-4">
        <CardHeader title="Delivery by advertiser" subtitle="Impressions, current period" />
        <CardBody>
          <BarsChart data={perf} x="name" height={220} series={[{ key: 'value', label: 'Impressions' }]} format={num} />
        </CardBody>
      </Card>
    </>
  )
}
