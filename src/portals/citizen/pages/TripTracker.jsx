import { useParams, Link } from 'react-router-dom'
import { Navigation, Share2, ShieldAlert, Clock } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import { useDb, useLiveVehicles } from '../../../lib/store.jsx'
import { findDeparture } from '../../../lib/schedule.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes, stops, terminals } from '../../../data/geo.js'
import { timeOnly, dt } from '../../../lib/format.js'
import { distanceKm } from '../arrivals.js'
export default function TripTracker() {
  const { id } = useParams()
  const { db } = useDb()
  const toast = useToast()
  const ticket = db.tickets.find((t) => t.id === id)
  const live = useLiveVehicles({ route: ticket?.route })
  if (!ticket) return <Empty title="Ticket not found" />
  const route = routes.find((r) => r.id === ticket.route)
  const dep = findDeparture(ticket?.departureId, db)
  const departAt = ticket.departAt || dep?.depart
  const minsToDeparture = departAt ? Math.round((new Date(departAt) - Date.now()) / 60000) : 0
  // The map only means something once the bus is actually on the road that day.
  const notYet = departAt && minsToDeparture > 30
  const bus = live.find((v) => v.id === (dep?.vehicle || ticket.vehicle)) || live[0]
  const nameOf = (x) => [...stops, ...terminals].find((s) => s.id === x)?.name || x
  const seq = (route?.stops || [])
    .map((sid) => stops.find((s) => s.id === sid) || terminals.find((t) => t.id === sid))
    .filter(Boolean)
  const dropStop = seq.find((s) => s.id === ticket.droppingPoint) || seq[seq.length - 1]
  const etaMin =
    bus && dropStop ? Math.max(1, Math.round((distanceKm(bus, dropStop) / Math.max(8, bus.speedKph)) * 60)) : null
  const progress = bus ? Math.round((bus.progress || 0) * 100) : 0
  if (notYet) {
    const d = new Date(departAt)
    return (
      <div>
        <AppBar title="Live tracking" subtitle={`${route?.line} · ${ticket.pnr}`} back />
        <div className="p-5">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
            <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-brand-50">
              <Clock size={26} className="text-brand-600" />
            </span>
            <p className="text-[15px] font-semibold text-ink-900 mt-3">Your bus has not started yet</p>
            <p className="text-[13.5px] text-ink-600 mt-1.5 leading-relaxed">
              It leaves {nameOf(ticket.boardingPoint)} at {timeOnly(departAt)} on{' '}
              {d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })}.
            </p>
            <p className="text-[13px] text-ink-500 mt-3">
              Live tracking opens 30 minutes before departure — about{' '}
              <strong className="text-ink-800">
                {minsToDeparture > 1440
                  ? `${Math.round(minsToDeparture / 1440)} day(s)`
                  : minsToDeparture > 60
                    ? `${Math.round(minsToDeparture / 60)} hour(s)`
                    : `${minsToDeparture} minutes`}
              </strong>{' '}
              from now.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Button as={Link} to={`/citizen/ticket/${ticket.id}`}>
                Back to ticket
              </Button>
              <Button variant="danger" icon={ShieldAlert} as={Link} to="/citizen/sos">
                SOS
              </Button>
            </div>
          </div>
          <p className="text-[12.5px] text-ink-400 text-center mt-4 leading-relaxed">
            We will send you a reminder when the bus is assigned and again when it is approaching your stop.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div>
      <AppBar title="Live trip" subtitle={`${route?.line} · ${ticket.pnr}`} back />

      <MapView
        legend="simple"
        vehicles={bus ? [bus] : []}
        highlightRoutes={[ticket.route]}
        height={260}
        showLabels={false}
        focus={dropStop}
      />

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-ink-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12.5px] text-ink-400 uppercase tracking-wider">Arriving at {dropStop?.name}</p>
              <p className="text-[24px] font-semibold text-brand-700 tabular-nums leading-tight">
                {etaMin ?? '—'}
                <span className="text-[13px] font-normal text-ink-400 ml-1">min</span>
              </p>
            </div>
            <Badge tone="green" dot>
              LIVE
            </Badge>
          </div>
          <Progress value={progress} tone="brand" height={8} />
          <div className="flex justify-between text-[12px] text-ink-400 mt-1.5">
            <span>{seq[0]?.name}</span>
            <span>{seq[seq.length - 1]?.name}</span>
          </div>
        </div>

        {bus && (
          <div className="bg-white rounded-xl border border-ink-200 p-4">
            <p className="text-[13.5px] font-semibold text-ink-900 mb-2.5">Your bus</p>
            <dl className="space-y-2 text-[13px]">
              {[
                ['Plate', bus.plate],
                ['Driver', bus.driverName || '—'],
                ['Speed', `${bus.speedKph} km/h`],
                ['Next stop', bus.nextStop?.name || '—'],
                dep && ['Departed', timeOnly(dep.depart)],
                dep && ['Scheduled arrival', dt(dep.arrive)],
              ]
                .filter(Boolean)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="text-ink-900">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}

        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {seq.map((s, i) => {
            const passed = bus ? (bus.progress || 0) * (seq.length - 1) > i : false
            return (
              <div key={s.id} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-ink-50 last:border-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${passed ? 'bg-brand-600' : 'bg-white border-2 border-ink-300'}`}
                />
                <span className={`flex-1 text-[13.5px] truncate ${passed ? 'text-ink-400' : 'text-ink-900'}`}>
                  {s.name}
                </span>
                {s.id === ticket.droppingPoint && <Badge tone="brand">Your stop</Badge>}
                {s.id === bus?.nextStop?.id && (
                  <Badge tone="green">
                    <Clock size={10} /> next
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            icon={Share2}
            onClick={() =>
              toast({
                title: 'Trip shared',
                body: 'Your contact receives SMS updates at start, arrival and if you raise SOS.',
              })
            }
          >
            Share trip
          </Button>
          <Button variant="danger" icon={ShieldAlert} as={Link} to="/citizen/sos">
            SOS
          </Button>
        </div>

        <p className="text-[12px] text-ink-400 text-center inline-flex items-center gap-1 w-full justify-center">
          <Navigation size={11} /> Position updates every 10 seconds while the bus is on duty
        </p>
      </div>
    </div>
  )
}
