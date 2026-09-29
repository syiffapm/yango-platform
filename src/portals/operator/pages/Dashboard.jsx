import { Link } from 'react-router-dom'
import { useTx } from '../../../lib/adminLang.js'
import { Activity, AlertTriangle, BadgeCheck, Bus, Radio, Ticket, Users } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { PriorityPill, StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import CoverageChip from '../../../components/domain/CoverageChip.jsx'
import { coverageIndex, useLiveVehicles } from '../../../lib/store.jsx'
import useOperator from '../useOperator.js'
import { daysUntil, num, relative } from '../../../lib/format.js'
import { outsideServiceHours, soFarToday, serviceStartLabel } from '../../../lib/serviceday.js'
export default function Dashboard() {
  const tx = useTx()
  const { db, op, vehicles, drivers, trips, incidents, findings, permits, routes: myRoutes } = useOperator()
  const live = useLiveVehicles({ operator: op.id })
  const cov = coverageIndex(db, op.id)
  const runningTrips = trips.filter((t) => t.status === 'running')
  const doneTrips = trips.filter((t) => t.status === 'completed')
  const onTime = doneTrips.length
    ? Math.round((doneTrips.filter((t) => t.delayMin <= 5).length / doneTrips.length) * 100)
    : null
  const loadFactor = doneTrips.length
    ? Math.round((doneTrips.reduce((s, t) => s + t.boarded / t.capacity, 0) / doneTrips.length) * 100)
    : 0
  const openInc = incidents.filter((i) => !['closed'].includes(i.status))
  const expiring = permits.filter((p) => daysUntil(p.expiry) <= 90 && daysUntil(p.expiry) > 0)
  const awaitingReply = findings.filter((f) => f.status === 'issued')
  // Sales reported "today" can only be the part of the day that has happened.
  const asleep = outsideServiceHours()
  const dayTickets = Math.round((db.salesDaily[db.salesDaily.length - 1]?.tickets || 0) / 8)
  const todayTickets = soFarToday(dayTickets)
  return (
    <>
      <PageHeader
        title="Today"
        subtitle={`${op.name} — the same figures the transport authority sees for your lines.`}
        meta={
          <>
            <CoverageChip coverage={cov} compact />
            <Badge tone="slate">{op.depot}</Badge>
            <StatusPill status={op.licence} />
            {asleep && <Badge tone="slate">Outside service hours · first bus {serviceStartLabel()}</Badge>}
          </>
        }
        actions={
          <Button variant="primary" icon={Activity} as={Link} to="/operator/live">
            Live operations
          </Button>
        }
      />

      <StatGrid cols={6} className="mb-5">
        <Stat
          label="Trips today"
          value={trips.length}
          hint={`${runningTrips.length} running`}
          icon={Bus}
          method="Scheduled trips on your permitted lines for the current service day."
        />
        <Stat
          label="Buses on road"
          value={live.filter((v) => v.transmitting).length}
          unit={`/ ${vehicles.length}`}
          hint={asleep ? 'Depot — service has not started' : undefined}
          icon={Radio}
          method="Vehicles transmitting a position in the last 10 minutes ÷ vehicles expected in service."
        />
        <Stat
          label="On-time"
          value={onTime == null ? '—' : `${onTime}%`}
          hint={onTime == null ? `First bus ${serviceStartLabel()}` : undefined}
          tone={onTime == null ? undefined : onTime >= 85 ? 'good' : 'warn'}
          method="Completed trips departing within 5 minutes of the planned time."
        />
        <Stat
          label="Load factor"
          value={doneTrips.length ? `${loadFactor}%` : '—'}
          hint={doneTrips.length ? undefined : 'No trip has finished yet'}
          method="Boardings ÷ capacity, averaged over completed trips."
        />
        <Stat
          label="Tickets today"
          value={num(todayTickets)}
          icon={Ticket}
          method="Digital tickets sold on your lines through the platform. Money and settlement live in Finance."
        />
        <Stat
          label="Open incidents"
          value={openInc.length}
          tone={openInc.length ? 'bad' : 'good'}
          icon={AlertTriangle}
          method="Incidents on your vehicles not yet closed by the authority."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Your fleet, live"
            subtitle="Only your own vehicles — network totals you could be ranked against are never shown here."
            icon={Activity}
            action={
              <Button size="xs" as={Link} to="/operator/live">
                Open map
              </Button>
            }
          />
          <CardBody className="p-0">
            <MapView vehicles={live} highlightRoutes={myRoutes.map((r) => r.id)} height={300} showLabels={false} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Service delivery today"
            subtitle={
              doneTrips.length
                ? 'The same measures the authority uses for your lines'
                : `Nothing has run yet — the first bus leaves at ${serviceStartLabel()}`
            }
          />
          <CardBody className="space-y-3">
            {doneTrips.length > 0 && (
              <Progress
                label="Headway / on-time adherence"
                value={onTime ?? 0}
                tone={(onTime ?? 0) >= 85 ? 'green' : 'amber'}
              />
            )}
            <Progress
              label="Fleet availability"
              value={Math.round(
                (vehicles.filter((v) => v.status === 'active').length / Math.max(1, vehicles.length)) * 100,
              )}
              tone="green"
            />
            <Progress
              label="Drivers licensed and available"
              value={Math.round(
                (drivers.filter((d) => d.status === 'active').length / Math.max(1, drivers.length)) * 100,
              )}
              tone="brand"
            />
            <Progress label="Vehicles transmitting" value={cov.pct} tone={cov.pct >= 85 ? 'green' : 'amber'} />
            <div className="pt-2 border-t border-ink-100 grid grid-cols-2 gap-3">
              {[
                ['Trips completed', doneTrips.length],
                ['Trips running', runningTrips.length],
                [
                  'Average delay',
                  doneTrips.length
                    ? `${Math.round(doneTrips.reduce((s, t) => s + Math.max(0, t.delayMin), 0) / doneTrips.length)} min`
                    : '—',
                ],
                ['Load factor', doneTrips.length ? `${loadFactor}%` : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                  <p className="text-[14px] font-medium text-ink-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Open SOS & incidents"
            icon={AlertTriangle}
            action={
              <Button size="xs" as={Link} to="/operator/incidents">
                All
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {openInc.slice(0, 4).map((i) => (
              <Link
                key={i.id}
                to="/operator/incidents"
                className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2 hover:border-brand-300"
              >
                <PriorityPill priority={i.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-ink-900 truncate">{i.category}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {i.location} · {relative(i.reportedAt)}
                  </p>
                </div>
                <StatusPill status={i.status} />
              </Link>
            ))}
            {openInc.length === 0 && <Empty compact title="No open incidents" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Findings awaiting reply"
            icon={BadgeCheck}
            action={
              <Button size="xs" as={Link} to="/operator/compliance">
                Respond
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {awaitingReply.map((f) => (
              <div key={f.id} className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
                <p className="text-[12px] font-medium text-ink-900">
                  {f.id} · {f.dimension.replace(/_/g, ' ')}
                </p>
                <p className="text-[11.5px] text-ink-500 mt-0.5">
                  measured {f.measured} vs required {f.required} · {relative(f.issuedAt)}
                </p>
              </div>
            ))}
            {awaitingReply.length === 0 && <Empty compact title="No findings awaiting reply" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Expiring licences"
            icon={Users}
            action={
              <Button size="xs" as={Link} to="/operator/licences">
                Renew
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {expiring.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2">
                <span className="flex-1 min-w-0 text-[12px] text-ink-800 truncate">{p.holderName}</span>
                <Badge tone={daysUntil(p.expiry) <= 30 ? 'red' : 'amber'}>{daysUntil(p.expiry)}d</Badge>
              </div>
            ))}
            {expiring.length === 0 && <Empty compact title="Nothing expiring within 90 days" />}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
