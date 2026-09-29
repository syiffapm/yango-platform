import { Link } from 'react-router-dom'
import { useTx } from '../../../lib/adminLang.js'
import { Activity, AlertTriangle, Banknote, Building2, Radio, Ticket, Users } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import CoverageChip, { NotMeasurable } from '../../../components/domain/CoverageChip.jsx'
import { BarsChart, TrendChart } from '../../../components/domain/Charts.jsx'
import { coverageIndex, openIncidents, useLiveVehicles } from '../../../lib/store.jsx'
import useAuthority from '../useAuthority.js'
import { MMK, num } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'

/** the command centre scoped to one jurisdiction, with the operator league table. */
export default function RegionalDashboard() {
  const tx = useTx()
  const { db, ses } = useAuthority()
  const live = useLiveVehicles()
  const cov = coverageIndex(db)
  const open = openIncidents(db)
  const sales = db.salesDaily[db.salesDaily.length - 1]
  const operators = (db.operators || []).map((o) => {
    const lines = routes.filter((r) => r.operator === o.id)
    const vehicles = db.vehicles.filter((v) => v.operator === o.id)
    const opCov = coverageIndex(db, o.id)
    const comp = db.compliance.filter((c) => c.operator === o.id)
    const breaches = comp.reduce((s, c) => s + c.dimensions.filter((d) => d.measurable && d.breach).length, 0)
    const measurable = comp.some((c) => c.coveragePct >= db.thresholds.coverageFloors.censusFloor)
    return {
      id: o.id,
      name: o.name,
      short: o.short,
      licence: o.licence,
      lines: lines.length,
      vehicles: vehicles.length,
      drivers: db.drivers.filter((d) => d.operator === o.id).length,
      coverage: opCov.pct,
      measurable,
      breaches,
      incidents: db.incidents.filter((i) => i.operator === o.id && i.status !== 'closed').length,
      findings: db.findings.filter((f) => f.operator === o.id).length,
      rating: o.rating,
      revenue: Math.round(sales.gross / 8),
    }
  })
  const byLine = routes
    .slice(0, 10)
    .map((r) => ({ name: r.line, value: db.compliance.find((c) => c.route === r.id)?.coveragePct ?? 0 }))
  const trend = db.salesDaily.map((d) => ({ date: d.date.slice(5), tickets: d.tickets, levy: d.levy }))
  const jurisdiction = ses.jurisdiction === 'NATIONAL' ? 'All regions' : 'Yangon Region'
  return (
    <>
      <PageHeader
        title={`Regional dashboard — ${jurisdiction}`}
        subtitle="The national view, scoped to this jurisdiction and broken down by operator."
        meta={
          <>
            <CoverageChip coverage={cov} />
            <Badge tone="slate">{operators.length} operators</Badge>
            <Badge tone="slate">{routes.length} lines</Badge>
          </>
        }
        actions={
          <Button as={Link} to="/cms/national" icon={Activity}>
            National view
          </Button>
        }
      />

      <StatGrid cols={6} className="mb-5">
        <Stat
          label="Coverage Index"
          value={`${cov.pct}%`}
          tone={cov.pct >= 85 ? 'good' : 'warn'}
          icon={Radio}
          method="Vehicles transmitting ÷ vehicles expected in service for this jurisdiction."
        />
        <Stat
          label="Licensed operators"
          value={operators.filter((o) => o.licence === 'valid').length}
          unit={`/ ${operators.length}`}
          icon={Building2}
          method="Operators holding a valid PO business licence here."
        />
        <Stat
          label="Vehicles in service"
          value={live.filter((v) => v.transmitting).length}
          icon={Activity}
          method="Transmitting a position in the last 10 minutes."
        />
        <Stat
          label="Drivers licensed"
          value={db.drivers.filter((d) => d.status === 'active').length}
          icon={Users}
          method="Drivers with a valid operating licence bound to an operator here."
        />
        <Stat
          label="Tickets today"
          value={num(sales.tickets)}
          icon={Ticket}
          hint={MMK(sales.gross)}
          method="Digital tickets sold in this jurisdiction today."
        />
        <Stat
          label="Open incidents"
          value={open.length}
          tone={open.length ? 'warn' : 'good'}
          icon={AlertTriangle}
          method="Incidents not yet closed, all priorities."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Operator league table"
            subtitle="Ranked by Coverage Index. An operator below the census floor reads “not measurable”, never “failed”."
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              columns={[
                {
                  key: 'name',
                  header: 'Operator',
                  render: (r) => (
                    <div>
                      <span className="font-medium text-ink-900">{r.short}</span>
                      <span className="block text-[11.5px] text-ink-400 truncate max-w-[150px]">{r.name}</span>
                    </div>
                  ),
                },
                { key: 'lines', header: 'Lines', align: 'right' },
                { key: 'vehicles', header: 'Vehicles', align: 'right' },
                { key: 'drivers', header: 'Drivers', align: 'right' },
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
                  key: 'breaches',
                  header: 'In breach',
                  align: 'right',
                  render: (r) =>
                    r.measurable ? r.breaches ? <Badge tone="amber">{r.breaches}</Badge> : '—' : <NotMeasurable />,
                },
                {
                  key: 'findings',
                  header: 'Findings',
                  align: 'right',
                  render: (r) => (r.findings ? <Badge tone="red">{r.findings}</Badge> : '—'),
                },
                { key: 'incidents', header: 'Open incidents', align: 'right' },
                { key: 'rating', header: 'Rating', align: 'right', render: (r) => `${r.rating} ★` },
                { key: 'licence', header: 'Licence', render: (r) => <StatusPill status={r.licence} /> },
              ]}
              rows={operators}
              exportName="regional-operators"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Regulated revenue" subtitle="Tickets and levy, 14 days" icon={Banknote} />
          <CardBody>
            <TrendChart
              data={trend}
              height={180}
              series={[{ key: 'levy', label: 'Government levy' }]}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
            <div className="mt-3 pt-3 border-t border-ink-100 space-y-2 text-[12px]">
              {[
                ['Levy (14 days)', MMK(db.salesDaily.reduce((s, d) => s + d.levy, 0))],
                [
                  'Licence fees paid',
                  MMK(
                    db.invoices
                      .filter((i) => i.kind === 'licence' && i.status === 'paid')
                      .reduce((s, i) => s + i.amount, 0),
                  ),
                ],
                [
                  'Fines collected',
                  MMK(
                    db.invoices
                      .filter((i) => i.kind === 'fine' && i.status === 'paid')
                      .reduce((s, i) => s + i.amount, 0),
                  ),
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-ink-500">{tx(k)}</span>
                  <span className="font-medium text-ink-900">{v}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Jurisdiction map" subtitle="Every licensed vehicle in this region" />
          <CardBody className="p-0">
            <MapView vehicles={live} incidents={open} height={320} showLabels={false} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Coverage by line" subtitle="Data quality drives what can be measured at all" />
          <CardBody>
            <BarsChart
              data={byLine}
              x="name"
              layout="vertical"
              height={320}
              series={[{ key: 'value', label: 'Coverage %' }]}
            />
          </CardBody>
        </Card>
      </div>

      <p className="text-[12px] text-ink-400 mt-4 leading-relaxed">
        This jurisdiction sees its own operators in full operational detail. It does not see other jurisdictions except
        as a national benchmark, and never sees passenger identity or an aggregate covering fewer than{' '}
        {db.thresholds.kAnonymity} journeys.
      </p>
    </>
  )
}
