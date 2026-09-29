import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, EyeOff, Send } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Checkbox, Field, RadioCards, Select, Textarea } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes, stops } from '../../../data/geo.js'
const CATEGORIES = [
  { value: 'Harassment', label: 'Harassment' },
  { value: 'Reckless driving', label: 'Reckless driving' },
  { value: 'Dangerous overcrowding', label: 'Overcrowding' },
  { value: 'Vehicle condition', label: 'Vehicle condition' },
  { value: 'Accessibility', label: 'Accessibility' },
  { value: 'Other', label: 'Other' },
]
export default function ReportIncident() {
  const { db, update, notify } = useDb()
  const toast = useToast()
  const nav = useNavigate()
  const [category, setCategory] = useState('Reckless driving')
  const [route, setRoute] = useState('R01')
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(true)
  const [photo, setPhoto] = useState(false)
  const submit = () => {
    const r = routes.find((x) => x.id === route)
    const stop = stops.find((s) => s.id === r.stops[1]) || stops[0]
    const id = `INC-${4000 + db.incidents.length}`
    const ref = `REF-${9500 + db.incidents.length}`
    const priority = category === 'Harassment' ? 'P2' : category === 'Dangerous overcrowding' ? 'P2' : 'P3'
    const at = new Date().toISOString()
    update((d) => {
      d.incidents.unshift({
        id,
        ref,
        priority,
        category,
        source: 'passenger',
        isSOS: false,
        route: r.id,
        vehicle: d.vehicles.find((v) => v.route === r.id)?.id,
        operator: r.operator,
        lat: stop.lat,
        lng: stop.lng,
        location: stop.name,
        reportedAt: at,
        status: 'new',
        owner: null,
        slaDueAt: new Date(Date.now() + (priority === 'P2' ? 15 : 240) * 60000).toISOString(),
        acknowledgedAt: null,
        description: text || `${category} reported on ${r.line}.`,
        anonymous: anon,
        evidence: photo ? ['passenger-photo.jpg'] : [],
        dispatch: null,
        operatorResponse: null,
        closure: null,
        timeline: [],
      })
      d.citizenReports.unshift({
        id: `RP-${700 + d.citizenReports.length}`,
        category,
        route: r.id,
        at,
        status: 'new',
        ref,
        anonymous: anon,
      })
    })
    notify({
      audience: 'authority',
      title: `New ${priority} report — ${id}`,
      body: `${category} on ${r.line} near ${stop.name}.`,
    })
    toast({ title: 'Report submitted', body: `Reference ${ref}. Track it under My reports.` })
    nav('/citizen/reports')
  }
  return (
    <div>
      <AppBar
        title="Report an incident"
        subtitle="Goes to the transport authority, not to the operator directly"
        back
      />

      <div className="p-4 space-y-4">
        <div>
          <p className="text-[13px] font-medium text-ink-600 mb-2">What happened?</p>
          <RadioCards cols={2} value={category} onChange={setCategory} options={CATEGORIES} />
        </div>

        <Field label="Which bus or line?" required>
          <Select value={route} onChange={(e) => setRoute(e.target.value)}>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.line} · {r.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Describe what happened"
          hint="Time and place are recorded automatically. Avoid naming other passengers."
        >
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="The driver overtook on the inside lane twice between Hledan and Myaynigone…"
          />
        </Field>

        <button
          onClick={() => setPhoto((p) => !p)}
          className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 ${photo ? 'border-brand-300 bg-brand-50' : 'border-dashed border-ink-300'}`}
        >
          <Camera size={17} className={photo ? 'text-brand-600' : 'text-ink-400'} />
          <span className="text-left flex-1">
            <span className="block text-[13.5px] font-medium text-ink-900">
              {photo ? 'Photo attached' : 'Attach a photo (optional)'}
            </span>
            <span className="block text-[12.5px] text-ink-500">Helps the authority verify the report</span>
          </span>
          {photo && <Badge tone="green">1 file</Badge>}
        </button>

        <div className="rounded-xl border border-ink-200 bg-white p-3.5">
          <Checkbox
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            label="Report anonymously"
            hint="Time and place are still recorded. Your identity is never stored with the incident — the console shows a reference number only."
          />
          {anon && (
            <p className="text-[12px] text-ink-400 mt-2 inline-flex items-center gap-1.5">
              <EyeOff size={11} /> You will still be able to track the report with its reference number.
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <Button variant="primary" full size="lg" icon={Send} onClick={submit}>
          Submit report
        </Button>
      </div>
    </div>
  )
}
