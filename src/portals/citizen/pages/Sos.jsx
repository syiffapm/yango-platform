import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, ShieldAlert, X } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { RadioCards } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { myTickets } from '../mine.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { stops, routes } from '../../../data/geo.js'
import { timeOnly } from '../../../lib/format.js'
const KINDS = [
  { value: 'Medical', label: 'Medical' },
  { value: 'Accident', label: 'Accident' },
  { value: 'Robbery', label: 'Robbery' },
  { value: 'Harassment', label: 'Harassment' },
]
const NEAR_STOP = 'S03'
export default function Sos() {
  const { db, update, notify } = useDb()
  const [ses] = useSession('citizen')
  const toast = useToast()
  const nav = useNavigate()
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sent, setSent] = useState(null)
  const [kind, setKind] = useState('Medical')
  const stop = stops.find((s) => s.id === NEAR_STOP)
  const activeTicket = myTickets(db, ses).find((t) => ['active', 'booked'].includes(t.status))
  useEffect(() => {
    if (!holding) {
      setProgress(0)
      return
    }
    const t = setInterval(
      () =>
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(t)
            return 100
          }
          return p + 4
        }),
      40,
    )
    return () => clearInterval(t)
  }, [holding])
  useEffect(() => {
    if (progress >= 100 && !sent) fire()
  }, [progress]) // eslint-disable-line react-hooks/exhaustive-deps
  const fire = () => {
    const id = `INC-${3000 + db.incidents.length}`
    const ref = `REF-${9000 + db.incidents.length}`
    const route = routes.find((r) => r.stops.includes(NEAR_STOP))
    const at = new Date().toISOString()
    update((d) => {
      d.incidents.unshift({
        id,
        ref,
        priority: 'P1',
        category: kind,
        source: 'passenger',
        isSOS: true,
        route: route?.id,
        vehicle: activeTicket?.vehicle || d.vehicles.find((v) => v.route === route?.id)?.id,
        operator: route?.operator,
        lat: stop.lat,
        lng: stop.lng,
        location: stop.name,
        reportedAt: at,
        status: 'new',
        owner: null,
        slaDueAt: new Date(Date.now() + 5 * 60000).toISOString(),
        acknowledgedAt: null,
        description: `Passenger SOS (${kind}) raised near ${stop.name}. Live location shared until cancelled.`,
        anonymous: false,
        evidence: ['audio-live-stream'],
        dispatch: null,
        operatorResponse: null,
        closure: null,
        timeline: [],
      })
      d.citizenReports.unshift({
        id: `RP-${600 + d.citizenReports.length}`,
        category: `SOS — ${kind}`,
        route: route?.id,
        at,
        status: 'new',
        ref,
        anonymous: false,
      })
    })
    notify({
      audience: 'authority',
      title: `P1 SOS raised — ${id}`,
      body: `${kind} near ${stop.name}. Acknowledge within 5 minutes.`,
    })
    notify({
      audience: 'operator',
      title: `SOS on your line — ${id}`,
      body: `${kind} near ${stop.name}. Dispatch a supervisor.`,
    })
    setSent({ id, ref, at })
    setHolding(false)
    toast({ title: 'SOS sent', body: 'The authority control room has been alerted.', kind: 'error' })
  }
  if (sent) {
    return (
      <div>
        <AppBar title="SOS active" tone="dark" back onBack={() => nav('/citizen/safety')} />
        <div className="p-5">
          <div className="rounded-2xl bg-red-600 text-white p-5 text-center">
            <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-white/15 relative text-white/40 pulse-ring">
              <ShieldAlert size={26} className="text-white relative z-10" />
            </span>
            <p className="text-[17px] font-semibold mt-3">Help is being arranged</p>
            <p className="text-[13px] text-white/80 mt-1">
              Reference {sent.ref} · raised {timeOnly(sent.at)}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {[
              ['Live location', `${stop.name} — shared until you cancel`],
              ['Authority control room', 'Alerted · acknowledgement due within 5 minutes'],
              ['Operator', 'Notified to dispatch a supervisor'],
              ['Emergency dispatch', 'Police and ambulance options offered to the duty officer'],
              activeTicket && ['Active ticket', `${activeTicket.pnr} shared with responders`],
            ]
              .filter(Boolean)
              .map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 bg-white rounded-xl border border-ink-200 px-3.5 py-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-ink-900">{k}</p>
                    <p className="text-[12.5px] text-ink-500">{v}</p>
                  </div>
                </div>
              ))}
          </div>

          <a
            href="tel:199"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-ink-900 text-white py-3 text-[14px] font-medium"
          >
            <Phone size={16} /> Call police (199)
          </a>
          <Button
            full
            className="mt-2"
            icon={X}
            onClick={() => {
              setSent(null)
              nav('/citizen/safety')
            }}
          >
            Cancel SOS and stop sharing location
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div>
      <AppBar title="Emergency SOS" back />
      <div className="p-5">
        <div className="rounded-xl border border-ink-200 bg-white p-3.5 mb-5">
          <p className="text-[13px] font-medium text-ink-900 inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-brand-600" />
            {stop.name}
          </p>
          <p className="text-[12.5px] text-ink-500 mt-1">
            Your location, the time, the nearest stop and your active ticket are shared with responders.
            {activeTicket && (
              <>
                {' '}
                Active ticket <Badge tone="brand">{activeTicket.pnr}</Badge>.
              </>
            )}
          </p>
        </div>

        <p className="text-[13px] font-medium text-ink-600 mb-2">What is happening?</p>
        <RadioCards cols={2} value={kind} onChange={setKind} options={KINDS} />

        <div className="mt-8 flex flex-col items-center">
          <button
            onMouseDown={() => setHolding(true)}
            onMouseUp={() => setHolding(false)}
            onMouseLeave={() => setHolding(false)}
            onTouchStart={() => setHolding(true)}
            onTouchEnd={() => setHolding(false)}
            className="relative w-40 h-40 rounded-full bg-red-600 text-white grid place-items-center active:bg-red-700 select-none shadow-xl"
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="5" />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={289}
                strokeDashoffset={289 - (289 * progress) / 100}
              />
            </svg>
            <div className="text-center relative z-10">
              <ShieldAlert size={34} className="mx-auto" />
              <p className="text-[14px] font-semibold mt-1.5">Hold for SOS</p>
              <p className="text-[12px] text-white/70">{holding ? 'Keep holding…' : '1 second'}</p>
            </div>
          </button>
          <p className="text-[12.5px] text-ink-400 mt-5 text-center leading-relaxed max-w-xs">
            SOS is always treated as priority P1. If you have no data connection the alert falls back to SMS. False
            alarms can be cancelled immediately and are not penalised.
          </p>
        </div>
      </div>
    </div>
  )
}
