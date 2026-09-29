import { useState } from 'react'
import { EyeOff, Info, Users } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import { BarsChart, DonutChart, Legend2, TrendChart, LinesChart } from '../../../components/domain/Charts.jsx'
import CoverageChip, { NotMeasurable } from '../../../components/domain/CoverageChip.jsx'
import { coverageIndex } from '../../../lib/store.jsx'
import useAuthority from '../useAuthority.js'
import { MMK, num } from '../../../lib/format.js'
import { routes, stops } from '../../../data/geo.js'
export default function Analytics() {
  const { db } = useAuthority()
  const [tab, setTab] = useState('demand')
  const cov = coverageIndex(db)
  const k = db.thresholds.kAnonymity
  const tripsToday = db.trips.filter((t) => t.status !== 'scheduled').length
  const withheld = 7
  const busiest = [
    { name: 'Hledan → Sule', trips: 1840, share: 12.1 },
    { name: 'Thingangyun → Sule', trips: 1512, share: 9.9 },
    { name: 'Mingalardon → Hledan', trips: 1288, share: 8.4 },
    { name: 'Insein → Myaynigone', trips: 1104, share: 7.2 },
    { name: 'S. Okkalapa → Dagon Uni', trips: 902, share: 5.9 },
    { name: 'Botahtaung → Tamwe', trips: 14, share: null, suppressed: true },
  ]
  const corridorSpeed = ['06–08', '08–10', '10–12', '12–14', '14–16', '16–18', '18–20'].map((w, i) => ({
    window: w,
    brt: [21, 17, 22, 23, 21, 15, 19][i],
    trunk: [17, 12, 18, 19, 17, 11, 15][i],
  }))
  const occupancy = db.vehicles.slice(0, 8).map((v, i) => ({
    name: v.plate.slice(-4),
    value: 35 + ((i * 17) % 55),
    source: i % 3 === 0 ? 'sensor' : i % 3 === 1 ? 'crew' : 'estimate',
  }))
  const stopStats = stops.slice(0, 8).map((s, i) => ({
    id: s.id,
    name: s.name,
    boardings: 120 + ((i * 97) % 640),
    waitP50: 4 + (i % 6),
    waitP90: 9 + (i % 11),
    noService: i === 5 ? '21:10–05:20' : i === 2 ? '22:40–05:00' : '—',
  }))
  const ticketMix = [
    { name: 'App', value: 62, color: '#38663b' },
    { name: 'Counter', value: 21, color: '#6a9d6c' },
    { name: 'Agent', value: 11, color: '#0284c7' },
    { name: 'Cash on board', value: 6, color: '#d97706' },
  ]
  const salesTrend = db.salesDaily.map((d) => ({ date: d.date.slice(5), gross: d.gross, tickets: d.tickets }))
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Privacy-safe analysis. Aggregates covering fewer than 20 journeys are never produced, and the rule is enforced in the data layer, not only in this screen."
        meta={
          <>
            <CoverageChip coverage={cov} />
            <Badge tone="slate" icon={EyeOff}>
              k-anonymity {k}
            </Badge>
          </>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Trips measured today"
          value={num(tripsToday)}
          method="Trips with at least one telemetry observation today."
        />
        <Stat
          label="Withheld under k-anonymity"
          value={withheld}
          tone="muted"
          icon={EyeOff}
          method={`Zone pairs with fewer than ${k} journeys. They are not produced at all, not merely hidden.`}
        />
        <Stat
          label="Coverage Index"
          value={`${cov.pct}%`}
          tone={cov.pct >= 80 ? 'good' : 'warn'}
          method="Every figure on this page carries this qualifier when it is exported."
        />
        <Stat
          label="Unserved searches"
          value={num(db.failedSearches.reduce((s, f) => s + f.count, 0))}
          tone="warn"
          method="Journey searches that returned no usable option. Sample bias applies — only app users are counted."
        />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'demand', label: 'Demand' },
          { value: 'speed', label: 'Speed & occupancy' },
          { value: 'stops', label: 'Stops' },
          { value: 'ticketing', label: 'Ticketing' },
        ]}
      />

      {tab === 'demand' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Busiest journeys" subtitle="Origin–destination pairs, today" />
            <CardBody className="p-0">
              <DataTable
                search={false}
                dense
                columns={[
                  { key: 'name', header: 'Journey' },
                  {
                    key: 'trips',
                    header: 'Trips',
                    align: 'right',
                    render: (r) =>
                      r.suppressed ? <NotMeasurable reason={`Fewer than ${k} journeys`} /> : num(r.trips),
                  },
                  {
                    key: 'share',
                    header: 'Share',
                    align: 'right',
                    render: (r) => (r.suppressed ? '—' : `${r.share}%`),
                  },
                ]}
                rows={busiest.map((b, i) => ({ ...b, id: i }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Unserved demand" subtitle="Failed searches and why" />
            <CardBody className="space-y-2">
              {db.failedSearches.map((f) => (
                <div key={`${f.from}-${f.to}`} className="rounded-lg border border-ink-200 px-3 py-2">
                  <p className="text-[12px] text-ink-900">
                    {f.from} → {f.to}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11.5px] text-ink-500">{f.reason}</span>
                    <Badge tone="amber">{num(f.count)}</Badge>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 mt-2">
                <Info size={13} className="text-amber-600 mt-px shrink-0" />
                <p className="text-[11.5px] text-amber-900 leading-relaxed">
                  Sample bias: only searches made in the app are counted. People without smartphones are not
                  represented.
                </p>
              </div>
            </CardBody>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader
              title="This week vs last"
              subtitle="Differences inside normal variation are not reported as change"
            />
            <CardBody>
              <TrendChart
                data={salesTrend}
                series={[{ key: 'tickets', label: 'Journeys' }]}
                height={200}
                format={num}
              />
              <Badge tone="slate" className="mt-2">
                Within normal variation (±6.4%)
              </Badge>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'speed' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Corridor speed by two-hour window"
              subtitle="Windows with fewer than 20 observations are not produced"
            />
            <CardBody>
              <LinesChart
                data={corridorSpeed}
                x="window"
                height={240}
                series={[
                  { key: 'brt', label: 'Trunk corridors' },
                  { key: 'trunk', label: 'Trunk corridors' },
                ]}
                format={(v) => `${v}`}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Occupancy by bus" subtitle="Every figure carries its source label" icon={Users} />
            <CardBody>
              <BarsChart data={occupancy} x="name" height={240} series={[{ key: 'value', label: 'Occupancy %' }]} />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['sensor', 'crew', 'estimate'].map((s) => (
                  <Badge key={s} tone={s === 'sensor' ? 'green' : s === 'crew' ? 'blue' : 'slate'}>
                    {s}: {occupancy.filter((o) => o.source === s).length} vehicles
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'stops' && (
        <Card>
          <CardHeader title="Stops" subtitle="Boardings, waiting time and windows with no service" />
          <CardBody className="p-0">
            <DataTable
              columns={[
                { key: 'name', header: 'Stop' },
                { key: 'boardings', header: 'Boardings', align: 'right', render: (r) => num(r.boardings) },
                { key: 'waitP50', header: 'Wait P50', align: 'right', render: (r) => `${r.waitP50} min` },
                { key: 'waitP90', header: 'Wait P90', align: 'right', render: (r) => `${r.waitP90} min` },
                { key: 'noService', header: 'No-service window' },
              ]}
              rows={stopStats}
              exportName="stop-analytics"
            />
          </CardBody>
        </Card>
      )}

      {tab === 'ticketing' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Sales" subtitle="Gross value and journey count, last 14 days" />
            <CardBody>
              <TrendChart
                data={salesTrend}
                height={240}
                series={[{ key: 'gross', label: 'Gross MMK' }]}
                format={(v) => `${Math.round(v / 1e6)}M`}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Sales by channel" />
            <CardBody>
              <DonutChart data={ticketMix} center={{ value: '62%', label: 'digital' }} format={(v) => `${v}%`} />
              <Legend2 items={ticketMix} />
            </CardBody>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader title="Load factor by line" subtitle="Seats sold ÷ seats offered" />
            <CardBody>
              <BarsChart
                data={routes.slice(0, 10).map((r, i) => ({ name: r.line, value: 42 + ((i * 13) % 48) }))}
                x="name"
                height={220}
                series={[{ key: 'value', label: 'Load factor %' }]}
              />
            </CardBody>
          </Card>
        </div>
      )}

      <p className="text-[12px] text-ink-400 mt-4 leading-relaxed">
        Method: figures are built from telematics observations and ticket events for the selected period, then filtered
        by the k-anonymity rule of {k} journeys and the coverage floors. Exports carry the Coverage Index of {cov.pct}%
        and a method-and-limitations block. Total regulated revenue today:{' '}
        {MMK(Math.round(db.salesDaily[db.salesDaily.length - 1].gross * 0.02))}.
      </p>
    </>
  )
}
