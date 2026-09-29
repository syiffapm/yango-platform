import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Radio,
  ScrollText,
  Siren,
  Star,
  Ticket,
  Users,
} from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { PriorityPill, StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import MapView, { STATUS_LABEL } from '../../../components/domain/MapView.jsx'
import CoverageChip, { NotMeasurable } from '../../../components/domain/CoverageChip.jsx'
import { coverageIndex, openIncidents, useClock, useLiveVehicles } from '../../../lib/store.jsx'
import useAuthority from '../useAuthority.js'
import { MMK, countdown, daysUntil, num, relative } from '../../../lib/format.js'
import { routes, routeRegion, REGIONS } from '../../../data/geo.js'
import { useTx } from '../../../lib/adminLang.js'
import { outsideServiceHours, soFarToday, serviceStartLabel } from '../../../lib/serviceday.js'
export default function CommandCenter() {
  const tx = useTx()
  const { db, ses } = useAuthority()
  // An officer with a regional mandate sees their region, not the country.
  const scope = ses.jurisdiction && ses.jurisdiction !== 'NATIONAL' ? ses.jurisdiction : null
  const inScope = (routeId) => !scope || routeRegion(routes.find((r) => r.id === routeId)) === scope
  const regionLabel = scope ? REGIONS.find((r) => r.id === scope)?.name || scope : 'All regions'
  const allLive = useLiveVehicles()
  const live = allLive.filter((v) => inScope(v.route))
  const onRoad = live.filter((v) => v.transmitting)
  const asleep = outsideServiceHours()
  const cov = coverageIndex(db)
  useClock(1000)
  const open = openIncidents(db).filter((i) => !i.route || inScope(i.route))
  const sos = open.filter((i) => i.isSOS)
  const notResponding = live.filter((v) => v.status === 'not_responding')
  const bunching = live.filter((v) => v.status === 'bunching')
  const expiring = db.permits.filter((p) => daysUntil(p.expiry) <= 30 && daysUntil(p.expiry) > 0)
  const sales = db.salesDaily[db.salesDaily.length - 1]
  const onShift = db.drivers.filter((d) => d.status === 'active').length
  const compliantToday = db.compliance.filter((c) =>
    c.dimensions.filter((d) => d.measurable).every((d) => !d.breach),
  ).length
  const measurable = db.compliance.filter((c) => c.coveragePct >= db.thresholds.coverageFloors.censusFloor).length
  const worst = db.compliance
    .flatMap((c) => c.dimensions.filter((d) => d.measurable && d.breach).map((d) => ({ route: c.route, ...d })))
    .sort((a, b) => a.measured / a.required - b.measured / b.required)
    .slice(0, 5)
  const ratings = db.reviews.length ? db.reviews.reduce((s, r) => s + r.rating, 0) / db.reviews.length : null
  return (
    <>
      <PageHeader
        title="Command center"
        subtitle={`${regionLabel} · live network, incidents and compliance for the current service day.`}
        meta={
          <>
            <CoverageChip coverage={cov} />
            <Badge tone="slate">Today</Badge>
            {asleep && <Badge tone="slate">Outside service hours · first bus {serviceStartLabel()}</Badge>}
          </>
        }
        actions={
          <>
            <Button as={Link} to="/authority/sos" variant="danger" icon={Siren}>
              {tx('SOS board')} ({sos.length})
            </Button>
            <Button as={Link} to="/authority/reports" icon={ScrollText}>
              Build report
            </Button>
          </>
        }
      />

      <StatGrid cols={6} className="mb-4">
        <Stat
          label="Vehicles tracked today"
          value={cov.transmitting}
          unit={`/ ${cov.expected}`}
          icon={Radio}
          hint={`${cov.pct}% over the service day`}
          tone={cov.pct >= 85 ? 'good' : 'warn'}
          method="Vehicles transmitting a position in the last 10 minutes ÷ vehicles expected in service. This is the Coverage Index."
        />
        <Stat
          label="Open incidents"
          value={open.length}
          tone={open.length ? 'warn' : 'good'}
          icon={AlertTriangle}
          hint={`${open.filter((i) => i.priority === 'P1').length} P1 · ${open.filter((i) => i.priority === 'P2').length} P2`}
          method="Incidents not yet closed, by priority. SOS is always P1 with a 5-minute acknowledgement SLA."
        />
        <Stat
          label="Active SOS"
          value={sos.length}
          tone={sos.length ? 'bad' : 'good'}
          icon={Siren}
          method="Passenger or driver SOS still open. Escalates to the duty officer after 2 minutes unacknowledged."
        />
        <Stat
          label="Compliant today"
          value={measurable ? `${Math.round((compliantToday / measurable) * 100)}%` : '—'}
          tone={!measurable ? undefined : compliantToday / measurable >= 0.8 ? 'good' : 'warn'}
          hint={`${measurable} of ${db.compliance.length} lines measurable`}
          method="Lines where every measurable dimension is within the threshold in force. Lines below the census floor are excluded, not failed."
        />
        <Stat
          label="Tickets today"
          value={num(soFarToday(sales.tickets))}
          icon={Ticket}
          hint={MMK(soFarToday(sales.gross))}
          method="Digital tickets sold platform-wide today, with gross value. Regulated money only — no operator internal costs."
        />
        <Stat
          label="Public satisfaction"
          value={ratings ? ratings.toFixed(1) : '—'}
          unit="/ 5"
          icon={Star}
          hint={`${db.reviews.length} ratings, 7 days`}
          method="Mean trip rating over the last 7 days. Below 20 ratings the figure is withheld."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Live network"
            subtitle={
              onRoad.length
                ? `${onRoad.length} buses on the road · avg speed ${Math.round(onRoad.reduce((s, v) => s + v.speedKph, 0) / onRoad.length)} km/h · ${bunching.length} bunching · ${onRoad.filter((v) => (v.occupancyPct ?? 0) > 90).length} over 90% full`
                : `No bus is running — service resumes at ${serviceStartLabel()}`
            }
            icon={Activity}
          />
          <CardBody className="p-0">
            <MapView vehicles={onRoad} incidents={open} height={420} />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Latest alert" subtitle="Verify, acknowledge or forward" />
            <CardBody>
              {open[0] ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <PriorityPill priority={open[0].priority} />
                    <span className="text-[12.5px] font-medium text-ink-900">{open[0].category}</span>
                    {open[0].isSOS && <Badge tone="red">SOS</Badge>}
                  </div>
                  <p className="text-[12.5px] text-ink-600 leading-relaxed">{open[0].description}</p>
                  <p className="text-[11.5px] text-ink-400 mt-1.5">
                    {open[0].location} · {relative(open[0].reportedAt)} · owner{' '}
                    {db.users.find((u) => u.id === open[0].owner)?.name || 'unassigned'}
                  </p>
                  <Button size="sm" variant="primary" className="mt-3" as={Link} to="/authority/incidents">
                    Open incident queue
                  </Button>
                </>
              ) : (
                <Empty compact title="No open alerts" />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Coverage Index" subtitle="Lowest-coverage vehicles" />
            <CardBody>
              <div className="rounded-lg border border-ink-200 p-3 mb-3">
                <p className="text-[24px] font-semibold text-ink-900 leading-none tabular-nums">{cov.pct}%</p>
                <p className="text-[12px] text-ink-500 mt-1.5 leading-relaxed">
                  {cov.qualifier === 'full' && 'At or above 80% — figures are published in full.'}
                  {cov.qualifier === 'indicative' && '50–79% — figures are labelled indicative.'}
                  {cov.qualifier === 'warning' && '20–49% — a prominent warning travels with every figure.'}
                  {cov.qualifier === 'withheld' && 'Below 20% — aggregates are withheld entirely.'}
                </p>
              </div>
              <div className="space-y-1.5">
                {notResponding.slice(0, 5).map((v) => (
                  <div key={v.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400" />
                    <span className="flex-1 text-ink-700">{v.plate}</span>
                    <span className="text-ink-400">{routes.find((r) => r.id === v.route)?.line}</span>
                  </div>
                ))}
                {notResponding.length === 0 && (
                  <p className="text-[12.5px] text-ink-400">Every vehicle is transmitting.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Open incident queue"
            subtitle="Next acknowledgement deadline"
            action={
              <Button size="xs" as={Link} to="/authority/incidents">
                All
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {open.slice(0, 5).map((i) => {
              const c = countdown(i.slaDueAt)
              return (
                <div key={i.id} className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2">
                  <PriorityPill priority={i.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-ink-900 truncate">{i.category}</p>
                    <p className="text-[11.5px] text-ink-400 truncate">{i.location}</p>
                  </div>
                  <span
                    className={`text-[12px] tabular-nums ${c.overdue ? 'text-red-600 font-semibold' : 'text-ink-500'}`}
                  >
                    {c.text}
                  </span>
                </div>
              )
            })}
            {open.length === 0 && <Empty compact title="Queue is clear" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Worst deviations today" subtitle="Measurable lines only" icon={BadgeCheck} />
          <CardBody className="space-y-2">
            {worst.map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2">
                <Badge tone="slate">{routes.find((r) => r.id === w.route)?.line}</Badge>
                <span className="flex-1 text-[12.5px] text-ink-700 capitalize">{w.key.replace(/_/g, ' ')}</span>
                <span className="text-[12.5px] text-red-600 font-medium tabular-nums">
                  {w.measured} vs {w.required}
                </span>
              </div>
            ))}
            {worst.length === 0 && <NotMeasurable reason="No measurable breach today" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Today at a glance" />
          <CardBody className="space-y-2.5">
            {[
              ['Licences expiring in 30 days', expiring.length, <ScrollText key="i" size={13} />],
              ['Drivers licensed and active', onShift, <Users key="i" size={13} />],
              ['Regulated revenue today', MMK(Math.round(sales.gross * 0.02)), <Banknote key="i" size={13} />],
              ['Vehicles not responding', notResponding.length, <Radio key="i" size={13} />],
            ].map(([label, value, icon]) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="text-ink-400">{icon}</span>
                <span className="flex-1 text-[12px] text-ink-600">{label}</span>
                <span className="text-[13px] font-semibold text-ink-900 tabular-nums">{value}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-ink-100">
              <p className="text-[11.5px] text-ink-400 leading-relaxed">
                Status legend: {Object.values(STATUS_LABEL).slice(0, 4).join(' · ')}.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
