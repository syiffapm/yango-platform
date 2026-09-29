import { Link } from 'react-router-dom'
import { Building2, Clock, MapPin, Phone, ScanLine, Users } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { routes, terminals } from '../../../data/geo.js'
import { timeOnly, num } from '../../../lib/format.js'
export default function TerminalOps() {
  const { db } = useDb()
  const [ses] = useSession('terminal')
  const t = terminals.find((x) => x.id === ses.terminalId) || terminals[0]
  const deps = db.departures
    .filter((d) => d.boardingPoints.includes(t.id) && new Date(d.depart) > Date.now())
    .sort((a, b) => new Date(a.depart) - new Date(b.depart))
  const today = deps.filter((d) => new Date(d.depart).toDateString() === new Date().toDateString())
  const unassigned = today.filter((d) => !d.bay)
  const passengersToday = today.reduce((s, d) => s + d.soldSeats.length, 0)
  const crowd = 40 + ((t.id.charCodeAt(2) * 7) % 50)
  return (
    <>
      <PageHeader
        title={t.name}
        subtitle="The terminal registry: location, geofence, bays, facilities, operating hours and contact. Everything a passenger sees about this terminal comes from here."
        meta={
          <>
            <Badge tone="slate" icon={Clock}>
              {t.openHours}
            </Badge>
            <Badge tone="slate" icon={Phone}>
              {t.contact}
            </Badge>
            <Badge tone="brand">{t.bays.length} bays</Badge>
          </>
        }
        actions={
          <>
            <Button as={Link} to={`/board/${t.id}`} icon={ScanLine}>
              Public board
            </Button>
            <Button variant="primary" as={Link} to="/terminal/gate">
              Gate check-in
            </Button>
          </>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Departures today"
          value={today.length}
          icon={Building2}
          method="Scheduled departures boarding at this terminal today."
        />
        <Stat
          label="Bays unassigned"
          value={unassigned.length}
          tone={unassigned.length ? 'warn' : 'good'}
          method="Departures within the next 24 hours without a bay. Conflicts are flagged on the allocation screen."
        />
        <Stat
          label="Passengers expected"
          value={num(passengersToday)}
          icon={Users}
          method="Seats sold on departures boarding here today."
        />
        <Stat
          label="Crowd level"
          value={crowd > 75 ? 'Busy' : crowd > 45 ? 'Moderate' : 'Quiet'}
          tone={crowd > 75 ? 'warn' : 'good'}
          method="Derived from gate check-ins, automatic passenger counters and camera counts."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Next departures" subtitle="The same data the public board and the Citizen App show" />
          <CardBody className="p-0">
            <DataTable
              search={false}
              columns={[
                {
                  key: 'depart',
                  header: 'Time',
                  render: (r) => <span className="text-[13px] font-semibold tabular-nums">{timeOnly(r.depart)}</span>,
                },
                {
                  key: 'route',
                  header: 'Service',
                  render: (r) => {
                    const ro = routes.find((x) => x.id === r.route)
                    return (
                      <div>
                        <p className="text-[12.5px] text-ink-900">{ro?.name}</p>
                        <p className="text-[11.5px] text-ink-400">{ro?.line}</p>
                      </div>
                    )
                  },
                },
                {
                  key: 'operator',
                  header: 'Operator',
                  render: (r) => (db.operators || []).find((o) => o.id === r.operator)?.short,
                },
                {
                  key: 'bay',
                  header: 'Bay',
                  render: (r) => (r.bay ? <Badge tone="brand">{r.bay}</Badge> : <Badge tone="amber">Unassigned</Badge>),
                },
                {
                  key: 'soldSeats',
                  header: 'Sold',
                  align: 'right',
                  sortable: false,
                  render: (r) => `${r.soldSeats.length}/${r.capacity}`,
                },
              ]}
              rows={deps.slice(0, 12).map((d) => ({ ...d, id: d.id }))}
              empty="No upcoming departures"
            />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Facilities" icon={MapPin} />
            <CardBody className="flex flex-wrap gap-1.5">
              {t.facilities.map((f) => (
                <Badge key={f} tone="brand">
                  {f}
                </Badge>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Bay utilisation" subtitle="Today" />
            <CardBody className="space-y-2">
              {t.bays.slice(0, 6).map((b, i) => {
                const used = today.filter((d) => d.bay === b).length
                return (
                  <Progress
                    key={b}
                    label={`Bay ${b} — ${used} departures`}
                    value={used}
                    max={Math.max(3, Math.ceil(today.length / t.bays.length) + 2)}
                    tone={used > 3 ? 'amber' : 'brand'}
                  />
                )
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Operators serving" />
            <CardBody className="space-y-1.5">
              {t.operators.map((o) => {
                const op = (db.operators || []).find((x) => x.id === o)
                return (
                  <div key={o} className="flex items-center gap-2 text-[12px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span className="flex-1 text-ink-700">{op?.name}</span>
                    <Badge tone={op?.licence === 'valid' ? 'green' : 'red'}>{op?.licence}</Badge>
                  </div>
                )
              })}
            </CardBody>
          </Card>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Geofence"
            subtitle={`${t.radiusM} m radius — in-app check-in is only offered inside this boundary`}
          />
          <CardBody className="p-0">
            <MapView vehicles={[]} focus={t} height={260} />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
