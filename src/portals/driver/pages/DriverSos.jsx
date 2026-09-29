import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Phone, ShieldAlert, Video, X } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { RadioCards } from '../../../components/ui/Field.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes, stops } from '../../../data/geo.js'
import { timeOnly } from '../../../lib/format.js'
const KINDS = [
  { value: 'Medical', label: 'Medical' },
  { value: 'Accident', label: 'Accident' },
  { value: 'Robbery', label: 'Robbery' },
  { value: 'Harassment', label: 'Harassment' },
  { value: 'Breakdown', label: 'Breakdown' },
  { value: 'Other', label: 'Other' },
]
export default function DriverSos() {
  const { db, update, notify, driver, vehicle } = useDriver()
  const toast = useToast()
  const nav = useNavigate()
  const [kind, setKind] = useState('Accident')
  const [audio, setAudio] = useState(true)
  const [dashcam, setDashcam] = useState(true)
  const [sent, setSent] = useState(null)
  const route = routes.find((r) => r.id === vehicle?.route)
  const stop = stops.find((s) => s.id === route?.stops?.[1]) || stops[0]
  const fire = () => {
    const id = `INC-${6000 + db.incidents.length}`
    const ref = `REF-${9900 + db.incidents.length}`
    const at = new Date().toISOString()
    const evidence = [audio && 'driver-audio-live.m4a', dashcam && 'dashcam-30s.mp4'].filter(Boolean)
    update((d) => {
      d.incidents.unshift({
        id,
        ref,
        priority: 'P1',
        category: kind,
        source: 'driver',
        isSOS: true,
        route: route?.id,
        vehicle: vehicle?.id,
        operator: vehicle?.operator,
        lat: stop.lat,
        lng: stop.lng,
        location: stop.name,
        reportedAt: at,
        status: 'new',
        owner: null,
        slaDueAt: new Date(Date.now() + 5 * 60000).toISOString(),
        acknowledgedAt: null,
        description: `Driver SOS (${kind}) on ${route?.line} near ${stop.name}. Bus ${vehicle?.plate}, driver ${driver?.name}.`,
        anonymous: false,
        evidence,
        dispatch: null,
        operatorResponse: null,
        closure: null,
        timeline: [],
      })
    })
    notify({
      audience: 'authority',
      title: `P1 driver SOS — ${id}`,
      body: `${kind} on ${route?.line}, bus ${vehicle?.plate}. Escalates in 2 minutes if unacknowledged.`,
    })
    notify({
      audience: 'operator',
      title: `Driver SOS — ${vehicle?.plate}`,
      body: `${driver?.name} raised a ${kind} SOS near ${stop.name}.`,
    })
    setSent({ id, ref, at })
    toast({ title: 'SOS sent', body: 'Operator, authority and dispatch alerted.', kind: 'error' })
  }
  if (sent) {
    return (
      <div>
        <AppBar title="SOS active" tone="dark" back onBack={() => nav('/driver/home')} />
        <div className="p-5">
          <div className="rounded-2xl bg-red-600 text-white p-5 text-center">
            <ShieldAlert size={30} className="mx-auto" />
            <p className="text-[17px] font-semibold mt-2">{kind} SOS raised</p>
            <p className="text-[13px] text-white/80 mt-1">
              Reference {sent.ref} · {timeOnly(sent.at)}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {[
              ['Authority control room', 'P1 · acknowledgement due within 5 minutes'],
              ['Operator dispatch', 'Notified with your live position'],
              ['Emergency services', 'Police and ambulance offered to the duty officer'],
              [
                'Evidence',
                [audio && 'Live audio', dashcam && 'Dashcam clip'].filter(Boolean).join(' · ') || 'None attached',
              ],
            ].map(([k, v]) => (
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
          <Button full className="mt-2" icon={X} onClick={() => nav('/driver/home')}>
            Back to home
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div>
      <AppBar title="Emergency SOS" back />
      <div className="p-4">
        <div className="rounded-xl border border-ink-200 bg-white p-3.5 mb-4">
          <p className="text-[13px] text-ink-900 font-medium">
            {vehicle?.plate} · {route?.line}
          </p>
          <p className="text-[12.5px] text-ink-500 mt-0.5">
            Near {stop.name} · your position, bus and driver ID are shared with responders
          </p>
        </div>

        <p className="text-[13px] font-medium text-ink-600 mb-2">What is happening?</p>
        <RadioCards cols={3} value={kind} onChange={setKind} options={KINDS} />

        <div className="mt-4 space-y-2">
          <button
            onClick={() => setAudio((a) => !a)}
            className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 ${audio ? 'border-brand-300 bg-brand-50' : 'border-ink-200 bg-white'}`}
          >
            <Mic size={16} className={audio ? 'text-brand-600' : 'text-ink-400'} />
            <span className="flex-1 text-left text-[13.5px] text-ink-900">Stream live audio to the control room</span>
            <Badge tone={audio ? 'green' : 'slate'}>{audio ? 'On' : 'Off'}</Badge>
          </button>
          <button
            onClick={() => setDashcam((d) => !d)}
            className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 ${dashcam ? 'border-brand-300 bg-brand-50' : 'border-ink-200 bg-white'}`}
          >
            <Video size={16} className={dashcam ? 'text-brand-600' : 'text-ink-400'} />
            <span className="flex-1 text-left text-[13.5px] text-ink-900">Attach the last 30 seconds of dashcam</span>
            <Badge tone={dashcam ? 'green' : 'slate'}>
              {vehicle?.dashcam ? (dashcam ? 'On' : 'Off') : 'Not fitted'}
            </Badge>
          </button>
        </div>

        <Button variant="danger" full size="lg" className="mt-6" icon={ShieldAlert} onClick={fire}>
          Raise P1 SOS now
        </Button>
        <p className="text-[12px] text-ink-400 mt-3 text-center leading-relaxed">
          SOS is always P1. With no data connection the alert falls back to SMS with your last known position.
        </p>
      </div>
    </div>
  )
}
