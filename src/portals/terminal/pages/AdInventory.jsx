import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { useDb } from '../../../lib/store.jsx'
import { MMK, num } from '../../../lib/format.js'
import { Megaphone } from 'lucide-react'
const SLOTS = [
  {
    id: 'sponsored_result',
    slot: 'Sponsored result',
    location: 'Journey results (labelled “Sponsored”)',
    format: 'Native card',
    cpm: 6800,
    capacity: 1,
  },
  {
    id: 'eticket_footer',
    slot: 'E-ticket footer',
    location: 'Ticket screen and PDF',
    format: 'Image',
    cpm: 3100,
    capacity: 2,
  },
  {
    id: 'confirmation_offer',
    slot: 'Confirmation offer',
    location: 'After payment',
    format: 'Image + offer code',
    cpm: 7400,
    capacity: 1,
  },
  {
    id: 'push_offer',
    slot: 'Push offer',
    location: 'Opted-in users only',
    format: 'Text + deep link',
    cpm: 9200,
    capacity: 1,
  },
  {
    id: 'in_bus',
    slot: 'In-bus screen',
    location: 'Bus displays (via operator)',
    format: 'Video / image loop',
    cpm: 2600,
    capacity: 6,
  },
  {
    id: 'terminal_signage',
    slot: 'Terminal signage',
    location: 'Terminal screens',
    format: 'Video / image loop',
    cpm: 3400,
    capacity: 8,
  },
  {
    id: 'psa',
    slot: 'Public service announcement',
    location: 'All slots',
    format: 'Always prioritised, free',
    cpm: 0,
    capacity: 99,
  },
]
export default function AdInventory() {
  const { db } = useDb()
  const rows = SLOTS.map((s) => ({
    ...s,
    booked: db.campaigns.filter((c) => c.slot === s.id && c.status === 'live').length,
  }))
  const impressions = db.campaigns.reduce((s, c) => s + c.impressions, 0)
  const revenue = db.campaigns.filter((c) => c.status === 'live').reduce((s, c) => s + c.budget, 0)
  return (
    <>
      <PageHeader
        title="Inventory & rate card"
        subtitle="Every slot with its location, format, rate and how much of it is sold. The citizen home screen carries no advertising: the map, arrivals and safety shortcuts stay clear."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Slots"
          value={SLOTS.length}
          icon={Megaphone}
          method="Distinct advertising placements across the app, buses and terminals."
        />
        <Stat
          label="Sold"
          value={rows.reduce((s, r) => s + r.booked, 0)}
          method="Live campaigns currently occupying a slot."
        />
        <Stat
          label="Impressions"
          value={num(impressions)}
          method="Aggregate delivery across all live campaigns. No personal profiling."
        />
        <Stat
          label="Booked revenue"
          value={MMK(revenue)}
          method="Budget committed on live campaigns before the authority/platform/operator split."
        />
      </StatGrid>

      <DataTable
        search={false}
        columns={[
          { key: 'slot', header: 'Slot' },
          { key: 'location', header: 'Location' },
          { key: 'format', header: 'Format' },
          {
            key: 'cpm',
            header: 'Rate (CPM)',
            align: 'right',
            render: (r) => (r.cpm ? MMK(r.cpm) : <Badge tone="green">Free</Badge>),
          },
          {
            key: 'capacity',
            header: 'Capacity',
            align: 'right',
            render: (r) => (r.capacity > 50 ? 'Unlimited' : r.capacity),
          },
          {
            key: 'booked',
            header: 'Sold',
            align: 'right',
            render: (r) => (
              <Badge tone={r.booked >= r.capacity ? 'red' : r.booked ? 'amber' : 'slate'}>
                {r.booked} / {r.capacity > 50 ? '∞' : r.capacity}
              </Badge>
            ),
          },
        ]}
        rows={rows}
        exportName="ad-inventory"
      />

      <Card className="mt-4">
        <CardHeader title="Rate card notes" />
        <CardBody>
          <ul className="space-y-2 text-[12px] text-ink-600">
            {[
              'Rates are per thousand impressions and vary by region and time band; peak (07:00–09:00, 16:00–19:00) carries a 35% uplift.',
              'Public service announcements are free and always displace commercial inventory.',
              'Frequency caps stop the same viewer seeing a creative more than three times a day.',
              'In-bus and terminal signage are sold through the operator or terminal manager and split three ways.',
            ].map((n) => (
              <li key={n} className="flex gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  )
}
