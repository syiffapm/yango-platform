import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import { BarsChart, TrendChart } from '../../../components/domain/Charts.jsx'
import CoverageChip from '../../../components/domain/CoverageChip.jsx'
import { coverageIndex } from '../../../lib/store.jsx'
import useAuthority from '../useAuthority.js'
import { MMK, num } from '../../../lib/format.js'
const REGIONS = [
  {
    id: 'YGN',
    name: 'Yangon Region',
    operators: 8,
    vehicles: 36,
    lines: 14,
    coverage: 84,
    onTime: 86,
    incidents: 10,
    revenue: 8_100_000,
  },
  {
    id: 'MDY',
    name: 'Mandalay Region',
    operators: 5,
    vehicles: 22,
    lines: 9,
    coverage: 71,
    onTime: 82,
    incidents: 6,
    revenue: 4_400_000,
  },
  {
    id: 'BAG',
    name: 'Bago Region',
    operators: 3,
    vehicles: 12,
    lines: 5,
    coverage: 58,
    onTime: 79,
    incidents: 3,
    revenue: 1_900_000,
  },
  {
    id: 'SHN',
    name: 'Shan State',
    operators: 4,
    vehicles: 15,
    lines: 6,
    coverage: 44,
    onTime: 74,
    incidents: 4,
    revenue: 2_200_000,
  },
  {
    id: 'AYE',
    name: 'Ayeyarwady Region',
    operators: 2,
    vehicles: 8,
    lines: 4,
    coverage: 31,
    onTime: null,
    incidents: 1,
    revenue: 900_000,
  },
]
const KPI_DOMAINS = [
  ['Network & fleet', 'Registered, licensed, active buses; Coverage Index; speed; bunching; not responding'],
  ['Licensing', 'Applications, SLA, expiring, suspended, fees'],
  ['Service & compliance', 'Headway/on-time, hours, route coverage, fleet availability, findings'],
  ['Ticketing', 'Tickets by channel/route/class, load factor, seat utilisation, no-shows'],
  ['Payment & revenue', 'Gross sales, platform fee, levy, settlement, failed payments, fines'],
  ['Safety', 'SOS count & response time, incidents, accidents, speeding, fatigue'],
  ['Drivers', 'Licensed, on shift, violations, rating, expiring documents'],
  ['Demand', 'Ridership, OD (k-anonymous), failed searches, peaks, terminal throughput'],
  ['Experience', 'Ratings, complaints, refund time, chatbot resolution'],
  ['Ads', 'Impressions, clicks, revenue share'],
]
export default function NationalDashboard() {
  const { db } = useAuthority()
  const cov = coverageIndex(db)
  const totalRevenue = REGIONS.reduce((s, r) => s + r.revenue, 0)
  const trend = db.salesDaily.map((d) => ({
    date: d.date.slice(5),
    levy: Math.round(d.gross * 0.02),
    fees: Math.round(d.gross * 0.04),
  }))
  return (
    <>
      <PageHeader
        title="National dashboard"
        subtitle="Region league tables with drill-down from region to city, route, trip and vehicle. One KPI dictionary rolls up so a figure never changes meaning between levels."
        meta={
          <>
            <CoverageChip coverage={cov} />
            <Badge tone="brand">5 regions</Badge>
          </>
        }
      />

      <StatGrid cols={5} className="mb-5">
        <Stat
          label="Regions live"
          value={REGIONS.length}
          method="Regions with at least one licensed operator on the platform."
        />
        <Stat
          label="Licensed vehicles"
          value={num(REGIONS.reduce((s, r) => s + r.vehicles, 0))}
          method="Vehicles with a valid fleet licence nationally."
        />
        <Stat
          label="National Coverage Index"
          value={`${Math.round(REGIONS.reduce((s, r) => s + r.coverage, 0) / REGIONS.length)}%`}
          tone="warn"
          method="Weighted mean of regional Coverage Index. Regions below 20% are excluded from published aggregates."
        />
        <Stat
          label="Regulated revenue (month)"
          value={MMK(totalRevenue)}
          method="Government levy, licence fees and fines collected through the platform. No operator internal costs."
        />
        <Stat
          label="Open incidents"
          value={REGIONS.reduce((s, r) => s + r.incidents, 0)}
          tone="warn"
          method="Incidents not yet closed across all regions."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Region league table"
            subtitle="Ranked by Coverage Index. Regions below the census floor show as not measurable rather than failing."
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              columns={[
                { key: 'name', header: 'Region' },
                { key: 'operators', header: 'POs', align: 'right' },
                { key: 'lines', header: 'Lines', align: 'right' },
                { key: 'vehicles', header: 'Vehicles', align: 'right' },
                {
                  key: 'coverage',
                  header: 'Coverage',
                  render: (r) => (
                    <div className="w-24">
                      <Progress
                        value={r.coverage}
                        tone={r.coverage >= 80 ? 'green' : r.coverage >= 50 ? 'amber' : 'red'}
                        height={5}
                      />
                    </div>
                  ),
                },
                {
                  key: 'onTime',
                  header: 'On-time',
                  align: 'right',
                  render: (r) =>
                    r.onTime == null ? (
                      <span className="text-[12px] text-ink-400 italic">not measurable</span>
                    ) : (
                      `${r.onTime}%`
                    ),
                },
                { key: 'incidents', header: 'Open incidents', align: 'right' },
                { key: 'revenue', header: 'Regulated revenue', align: 'right', render: (r) => MMK(r.revenue) },
              ]}
              rows={REGIONS}
              exportName="region-league"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Regulated revenue" subtitle="Levy and licence fees, 14 days" />
          <CardBody>
            <TrendChart
              data={trend}
              height={190}
              stacked
              series={[
                { key: 'levy', label: 'Government levy' },
                { key: 'fees', label: 'Licence fees' },
              ]}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Coverage by region" subtitle="Vehicles transmitting ÷ vehicles expected" />
          <CardBody>
            <BarsChart
              data={REGIONS.map((r) => ({
                name: r.name.replace(' Region', '').replace(' State', ''),
                value: r.coverage,
              }))}
              x="name"
              height={210}
              series={[{ key: 'value', label: 'Coverage %' }]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="KPI dictionary" subtitle="What each level sees" />
          <CardBody className="space-y-2 max-h-[300px] overflow-y-auto scroll-thin">
            {KPI_DOMAINS.map(([domain, metrics]) => (
              <div key={domain} className="rounded-lg border border-ink-200 p-2.5">
                <p className="text-[12px] font-medium text-ink-900">{domain}</p>
                <p className="text-[11.5px] text-ink-500 leading-snug mt-0.5">{metrics}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <p className="text-[12px] text-ink-400 mt-4 leading-relaxed">
        The national level sees all regions in aggregate plus policy KPIs and regulated revenue. It never sees passenger
        identity, and no aggregate covering fewer than {db.thresholds.kAnonymity} journeys is produced at any level.
      </p>
    </>
  )
}
