import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Download, Globe2, Plus, Sparkles, Target } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { Select } from '../../../components/ui/Field.jsx'
import { BarsChart, TrendChart } from '../../../components/domain/Charts.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { num } from '../../../lib/format.js'
import { routes, stops } from '../../../data/geo.js'
const KPIS = [
  { name: 'Service coverage (within 400 m)', actual: 62, target: 75 },
  { name: 'Headway adherence (urban)', actual: 81, target: 85 },
  { name: 'On-time departure (scheduled)', actual: 88, target: 90 },
  { name: 'Incidents per 100k journeys', actual: 3.4, target: 2.5, lowerBetter: true },
  { name: 'Effective wait P50 (min)', actual: 6.8, target: 6, lowerBetter: true },
  { name: 'Coverage Index', actual: 84, target: 85 },
  { name: 'Passenger satisfaction', actual: 4.1, target: 4.0 },
]
export default function Planning() {
  const tx = useTx()
  const { db, audit } = useAuthority()
  const toast = useToast()
  const [extendRoute, setExtendRoute] = useState('R06')
  const [extendTo, setExtendTo] = useState('S12')
  const [exporting, setExporting] = useState(false)
  const reach = [
    { name: 'Within 400 m', value: 62, color: '#38663b' },
    { name: '400–800 m', value: 23, color: '#6a9d6c' },
    { name: 'Beyond 800 m', value: 15, color: '#c2d9c2' },
  ]
  const corridors = db.failedSearches.map((f, i) => ({
    id: i,
    corridor: `${f.from} → ${f.to}`,
    searches: f.count,
    waitMin: 12 + ((i * 3) % 14),
    linesAtWeakEnd: (i % 3) + 1,
    reason: f.reason,
    score: Math.round(f.count / 10 + (i % 3) * 4),
  }))
  const forecast = Array.from({ length: 12 }, (_, i) => ({
    hour: `${String(6 + i).padStart(2, '0')}:00`,
    actual: [820, 1240, 980, 720, 690, 740, 820, 910, 1180, 1420, 1010, 640][i],
    forecast: [850, 1290, 950, 760, 700, 780, 860, 960, 1220, 1380, 1050, 690][i],
  }))
  const doExport = (reason) => {
    audit({
      actor: 'U08',
      role: 'planning',
      action: 'Exported corridor dossier',
      object: corridors[0]?.corridor,
      reason,
      category: 'Exports',
    })
    toast({
      title: 'Dossier exported',
      body: 'The data-limitations block travels with the export and cannot be edited out.',
    })
    setExporting(false)
  }
  return (
    <>
      <PageHeader
        title="Planning"
        subtitle="Walking reach, candidate corridors ranked by unserved demand, a what-if tool and policy KPIs against targets."
        actions={
          <Button variant="primary" icon={Download} onClick={() => setExporting(true)}>
            Export corridor dossier
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Population within 400 m"
          value="62%"
          icon={Globe2}
          method="Share of the pilot population within 400 m walking distance of a registered stop. Measured to the nearest stop in the stop register."
        />
        <Stat
          label="Candidate corridors"
          value={corridors.length}
          method="Ranked by unserved searches, waiting time and the number of lines at the weaker end."
        />
        <Stat
          label="Unserved searches"
          value={num(db.failedSearches.reduce((s, f) => s + f.count, 0))}
          tone="warn"
          method="The target is a 30% reduction on the top 20 corridors within 12 months."
        />
        <Stat
          label="Policy KPIs met"
          value={`${KPIS.filter((k) => (k.lowerBetter ? k.actual <= k.target : k.actual >= k.target)).length} / ${KPIS.length}`}
          method="Quarterly policy targets. Reported only once a full quarter of real data exists."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Walking reach of the network" icon={Target} />
          <CardBody>
            <BarsChart
              data={reach}
              x="name"
              layout="vertical"
              height={150}
              series={[{ key: 'value', label: 'Population %' }]}
            />
            <p className="text-[11.5px] text-ink-400 mt-2 leading-relaxed">
              Measured to the nearest stop once the stop register exists. Areas beyond 800 m are candidates for feeder
              service.
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Candidate corridors" subtitle="Highest unserved demand first" />
          <CardBody className="p-0">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'corridor', header: 'Corridor' },
                { key: 'searches', header: 'Searches', align: 'right', render: (r) => num(r.searches) },
                { key: 'waitMin', header: 'Wait', align: 'right', render: (r) => `${r.waitMin} min` },
                { key: 'linesAtWeakEnd', header: 'Lines at weak end', align: 'right' },
                { key: 'reason', header: 'Why it fails' },
                {
                  key: '_a',
                  header: '',
                  sortable: false,
                  align: 'right',
                  render: () => (
                    <Button size="xs" icon={Plus}>
                      Add to dossier
                    </Button>
                  ),
                },
              ]}
              rows={corridors}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="What if we extended a line?" subtitle="Pick a bus and a place to extend it to" />
          <CardBody>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <Select value={extendRoute} onChange={(e) => setExtendRoute(e.target.value)}>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.line} · {r.name}
                  </option>
                ))}
              </Select>
              <Select value={extendTo} onChange={(e) => setExtendTo(e.target.value)}>
                {stops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <MapView
              highlightRoutes={[extendRoute]}
              vehicles={[]}
              height={220}
              focus={stops.find((s) => s.id === extendTo)}
            />
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              {[
                ['Extra population reached', '+18,400'],
                ['Additional vehicles needed', '+2'],
                ['Searches satisfied', '+286 / week'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-ink-200 p-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                  <p className="text-[14px] font-semibold text-ink-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-ink-400 mt-2">
              Indicative only. Figures assume current headway and the spare ratio of {db.thresholds.spareRatio}×.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="AI demand forecast"
            subtitle="Advisory overlay — an officer still decides"
            icon={Sparkles}
          />
          <CardBody>
            <TrendChart
              data={forecast}
              x="hour"
              height={200}
              series={[
                { key: 'actual', label: 'Actual' },
                { key: 'forecast', label: 'Forecast' },
              ]}
              format={num}
            />
            <Badge tone="violet" className="mt-2">
              Mean absolute error 6.1%
            </Badge>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Policy KPIs vs targets"
            subtitle="Reported by quarter, only once at least one quarter of real data exists"
          />
          <CardBody className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KPIS.map((k) => {
              const met = k.lowerBetter ? k.actual <= k.target : k.actual >= k.target
              const pct = k.lowerBetter ? Math.min(100, (k.target / k.actual) * 100) : (k.actual / k.target) * 100
              return (
                <div key={k.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12.5px] text-ink-700">{k.name}</span>
                    <Badge tone={met ? 'green' : 'amber'}>
                      {k.actual}
                      {k.name.includes('%') || k.actual > 10 ? '' : ''} / {k.target}
                    </Badge>
                  </div>
                  <Progress value={Math.min(100, pct)} tone={met ? 'green' : 'amber'} />
                </div>
              )
            })}
          </CardBody>
        </Card>
      </div>

      <ReasonDialog
        open={exporting}
        onClose={() => setExporting(false)}
        onConfirm={doExport}
        title="Export corridor dossier"
        confirmLabel="Export"
        variant="primary"
        subtitle="Exporting line-level figures requires a written reason. The data-limitations block travels with the export."
      />
    </>
  )
}
