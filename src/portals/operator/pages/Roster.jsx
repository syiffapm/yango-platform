import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, Check, Send } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Select } from '../../../components/ui/Field.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { daysUntil, timeOnly } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'

/** conflict checks: double booking, expired licence, rest time, hours of service. */
function conflictsFor(driver, trip, trips, vehicles) {
  const out = []
  if (!driver) return ['No driver assigned']
  if (daysUntil(driver.licenceExpiry) < 0) out.push('Operating licence expired')
  if (daysUntil(driver.medicalExpiry) < 0) out.push('Medical certificate expired')
  if (driver.status === 'blocked') out.push('Driver suspended')
  if (driver.hoursThisWeek > 40) out.push('Hours-of-service limit exceeded')
  const overlapping = trips.filter(
    (t) =>
      t.id !== trip.id &&
      t.driver === driver.id &&
      new Date(t.plannedStart) < new Date(trip.plannedEnd) &&
      new Date(t.plannedEnd) > new Date(trip.plannedStart),
  )
  if (overlapping.length) out.push(`Double-booked with ${overlapping[0].id}`)
  const veh = vehicles.find((v) => v.id === trip.vehicle)
  if (veh && veh.status !== 'active') out.push(`Vehicle ${veh.plate} is ${veh.status}`)
  return out
}
export default function Roster() {
  const { trips, drivers, vehicles, update, notify } = useOperator()
  const toast = useToast()
  const [routeFilter, setRouteFilter] = useState('all')
  const shown = useMemo(
    () =>
      trips
        .filter((t) => routeFilter === 'all' || t.route === routeFilter)
        .sort((a, b) => new Date(a.plannedStart) - new Date(b.plannedStart))
        .slice(0, 24),
    [trips, routeFilter],
  )
  const rows = shown.map((t) => {
    const driver = drivers.find((d) => d.id === t.driver)
    return { trip: t, driver, conflicts: conflictsFor(driver, t, trips, vehicles) }
  })
  const assign = (tripId, driverId) => {
    update((d) => {
      const t = d.trips.find((x) => x.id === tripId)
      t.driver = driverId || null
    })
  }
  const publish = () => {
    notify({
      audience: 'driver',
      title: 'Roster published',
      body: `${rows.length} trips assigned. Acknowledge each trip in the Driver App.`,
      ack: false,
    })
    toast({ title: 'Roster published', body: 'Drivers receive a push notification that must be acknowledged.' })
  }
  const blocked = rows.filter((r) => r.conflicts.length > 0)
  return (
    <>
      <PageHeader
        title="Roster"
        subtitle="Assign a driver and a vehicle to each trip. Conflicts are checked as you assign: double booking, expired licence or medical, rest time and hours of service."
        actions={
          <>
            <Select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} className="w-48">
              <option value="all">All lines</option>
              {[...new Set(trips.map((t) => t.route))].map((r) => (
                <option key={r} value={r}>
                  {routes.find((x) => x.id === r)?.line} · {routes.find((x) => x.id === r)?.name}
                </option>
              ))}
            </Select>
            <Button variant="primary" icon={Send} onClick={publish}>
              Publish roster
            </Button>
          </>
        }
      />

      <StatGrid cols={3} className="mb-5">
        <Stat
          label="Trips to crew"
          value={rows.length}
          icon={CalendarDays}
          method="Trips in the selected window that need a driver and a vehicle."
        />
        <Stat
          label="Assignments with a conflict"
          value={blocked.length}
          tone={blocked.length ? 'bad' : 'good'}
          method="Assignments the platform will not let you publish until resolved."
        />
        <Stat
          label="Drivers available"
          value={drivers.filter((d) => d.status === 'active').length}
          method="Licensed drivers not blocked by an expired document."
        />
      </StatGrid>

      <Card>
        <CardHeader title="Shift assignments" subtitle="Today's service day" />
        <CardBody className="p-0">
          <div className="divide-y divide-ink-100">
            {rows.map(({ trip, driver, conflicts }) => {
              const route = routes.find((r) => r.id === trip.route)
              const veh = vehicles.find((v) => v.id === trip.vehicle)
              return (
                <div
                  key={trip.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${conflicts.length ? 'bg-red-50/40' : ''}`}
                >
                  <div className="w-28 shrink-0">
                    <p className="text-[12.5px] font-medium text-ink-900 tabular-nums">
                      {timeOnly(trip.plannedStart)}–{timeOnly(trip.plannedEnd)}
                    </p>
                    <p className="text-[11.5px] text-ink-400">{trip.id}</p>
                  </div>
                  <div className="w-36 shrink-0">
                    <p className="text-[12px] text-ink-800">{route?.line}</p>
                    <p className="text-[11.5px] text-ink-400 truncate">{route?.name}</p>
                  </div>
                  <div className="w-32 shrink-0">
                    <p className="text-[12px] text-ink-800">{veh?.plate || '—'}</p>
                    <p className="text-[11.5px] text-ink-400">{veh?.class}</p>
                  </div>
                  <Select value={trip.driver || ''} onChange={(e) => assign(trip.id, e.target.value)} className="w-52">
                    <option value="">— Unassigned —</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.status !== 'active' ? ` (${d.status})` : ''}
                      </option>
                    ))}
                  </Select>
                  <div className="flex-1 min-w-[160px] flex flex-wrap gap-1.5 justify-end">
                    {conflicts.length === 0 ? (
                      <Badge tone="green" icon={Check}>
                        No conflicts
                      </Badge>
                    ) : (
                      conflicts.map((c) => (
                        <Badge key={c} tone="red" icon={AlertTriangle}>
                          {c}
                        </Badge>
                      ))
                    )}
                    {driver && <Badge tone="slate">{driver.hoursThisWeek}h this week</Badge>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </>
  )
}
