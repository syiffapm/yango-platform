import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CircleStop, Flag, MapPin, Play, TriangleAlert, Users } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { RadioCards, Textarea, Field } from '../../../components/ui/Field.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { useLiveVehicles } from '../../../lib/store.jsx'
import { routes, stops, terminals } from '../../../data/geo.js'
import { timeOnly } from '../../../lib/format.js'
const DELAY_REASONS = [
  { value: 'traffic', label: 'Traffic congestion' },
  { value: 'roadworks', label: 'Roadworks / diversion' },
  { value: 'boarding', label: 'Long boarding time' },
  { value: 'weather', label: 'Weather' },
]
export default function TripDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { trips, vehicle, update, notify, onShift } = useDriver()
  const toast = useToast()
  const live = useLiveVehicles({ route: vehicle?.route })
  const [delayOpen, setDelayOpen] = useState(false)
  const [reason, setReason] = useState('traffic')
  const [note, setNote] = useState('')
  const trip = trips.find((t) => t.id === id)
  if (!trip) return <Empty title="Trip not found" />
  const route = routes.find((r) => r.id === trip.route)
  const seq = route.stops
    .map((sid) => stops.find((s) => s.id === sid) || terminals.find((t) => t.id === sid))
    .filter(Boolean)
  const bus = live.find((v) => v.id === trip.vehicle)
  const setStatus = (status, extra = {}) => {
    update((d) => {
      const t = d.trips.find((x) => x.id === id)
      t.status = status
      if (status === 'running') t.actualStart = new Date().toISOString()
      if (status === 'completed') t.actualEnd = new Date().toISOString()
      Object.assign(t, extra)
    })
  }
  const start = () => {
    setStatus('running')
    toast({ title: 'Trip started', body: 'Position and stop events now feed the ETA and the authority dashboards.' })
  }
  const end = () => {
    setStatus('completed')
    toast({ title: 'Trip ended' })
    nav('/driver/trips')
  }
  const reportDelay = () => {
    setStatus(trip.status, { delayMin: trip.delayMin + 5, delayReason: reason })
    notify({
      audience: 'operator',
      title: 'Delay reported',
      body: `${route.line} ${timeOnly(trip.plannedStart)} — ${DELAY_REASONS.find((r) => r.value === reason).label}. ${note}`,
    })
    toast({ title: 'Delay reported', body: 'Passengers tracking this trip are notified automatically.' })
    setDelayOpen(false)
  }
  const breakdown = () => {
    update((d) => {
      const t = d.trips.find((x) => x.id === id)
      t.status = 'breakdown'
      d.incidents.unshift({
        id: `INC-${5000 + d.incidents.length}`,
        ref: `REF-${9800 + d.incidents.length}`,
        priority: 'P2',
        category: 'Breakdown',
        source: 'driver',
        isSOS: false,
        route: trip.route,
        vehicle: trip.vehicle,
        operator: route.operator,
        lat: seq[1].lat,
        lng: seq[1].lng,
        location: seq[1].name,
        reportedAt: new Date().toISOString(),
        status: 'new',
        owner: null,
        slaDueAt: new Date(Date.now() + 15 * 60000).toISOString(),
        acknowledgedAt: null,
        description: `Vehicle breakdown reported by the driver on ${route.line}.`,
        anonymous: false,
        evidence: [],
        dispatch: null,
        operatorResponse: null,
        closure: null,
        timeline: [],
      })
    })
    notify({
      audience: 'operator',
      title: 'Breakdown reported',
      body: `${vehicle?.plate} on ${route.line}. A P2 incident has been raised.`,
    })
    toast({ title: 'Breakdown reported', body: 'Your operator and the authority have been alerted.', kind: 'error' })
  }
  return (
    <div>
      <AppBar title={`${route.line} · ${timeOnly(trip.plannedStart)}`} subtitle={route.name} back />

      <MapView vehicles={bus ? [bus] : []} highlightRoutes={[route.id]} height={190} showLabels={false} />

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <StatusPill status={trip.status} />
          {trip.delayMin > 0 && <Badge tone="amber">{trip.delayMin} min late</Badge>}
          <Badge tone="slate">
            <Users size={10} /> {trip.boarded}/{trip.capacity}
          </Badge>
        </div>

        {trip.status === 'scheduled' && (
          <Button variant="primary" full size="lg" icon={Play} disabled={!onShift} onClick={start}>
            {onShift ? 'Start trip' : 'Check in first to start a trip'}
          </Button>
        )}

        {trip.status === 'running' && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="lg"
              icon={MapPin}
              onClick={() => toast({ title: 'At stop recorded', body: 'Arrival event sent to the ETA engine.' })}
            >
              At stop
            </Button>
            <Button size="lg" icon={TriangleAlert} variant="warning" onClick={() => setDelayOpen(true)}>
              Delay
            </Button>
            <Button size="lg" icon={CircleStop} variant="danger" onClick={breakdown}>
              Breakdown
            </Button>
            <Button size="lg" icon={Flag} variant="primary" onClick={end}>
              End trip
            </Button>
          </div>
        )}

        <Button as={Link} to={`/driver/manifest/${trip.id}`} icon={Users} full>
          Passenger list
        </Button>

        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          <p className="px-3.5 py-2.5 text-[13.5px] font-semibold text-ink-900 border-b border-ink-100">Route</p>
          {seq.map((s, i) => (
            <div
              key={`${s.id}-${i}`}
              className="flex items-center gap-3 px-3.5 py-2.5 border-b border-ink-50 last:border-0"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${i === 0 ? 'bg-brand-600' : 'bg-white border-2 border-brand-400'}`}
              />
              <span className="flex-1 text-[13.5px] text-ink-800 truncate">{s.name}</span>
              <span className="text-[12px] text-ink-400 tabular-nums">
                {timeOnly(new Date(new Date(trip.plannedStart).getTime() + i * 6 * 60000).toISOString())}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={delayOpen}
        onClose={() => setDelayOpen(false)}
        title="Report a delay"
        subtitle="Passengers tracking this trip are notified, and the reason travels with the compliance measurement."
        footer={
          <>
            <Button onClick={() => setDelayOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={reportDelay}>
              Report delay
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <RadioCards cols={2} value={reason} onChange={setReason} options={DELAY_REASONS} />
          <Field label="Note (optional)">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
