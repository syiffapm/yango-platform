import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fuel, Gauge, LogOut, Radio } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Field, Input, Textarea, Checkbox } from '../../../components/ui/Field.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { relative } from '../../../lib/format.js'
export default function EndShift() {
  const { driver, vehicle, trips, setSes, ses, audit, notify, update } = useDriver()
  const toast = useToast()
  const nav = useNavigate()
  const [odo, setOdo] = useState(String((vehicle?.odometerKm || 0) + 142))
  const [fuel, setFuel] = useState('58')
  const [notes, setNotes] = useState('')
  const [checked, setChecked] = useState(false)
  const done = trips.filter((t) => t.status === 'completed').length
  const end = () => {
    update((d) => {
      const v = d.vehicles.find((x) => x.id === vehicle?.id)
      if (v) v.odometerKm = Number(odo)
    })
    audit({ actor: driver?.id, role: 'driver', action: 'End shift', object: vehicle?.plate, category: 'Access' })
    notify({
      audience: 'operator',
      title: 'Driver ended shift',
      body: `${driver?.name} finished on ${vehicle?.plate}. ${done} trips completed. Tracking is off.`,
    })
    setSes({ shift: null })
    toast({ title: 'Shift ended', body: 'Tracking has stopped. You are off duty.' })
    nav('/driver/home')
  }
  return (
    <div>
      <AppBar title="End shift" subtitle={vehicle?.plate} back />

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-ink-200 p-4">
          <p className="text-[13.5px] font-semibold text-ink-900 mb-2.5">Shift summary</p>
          <dl className="space-y-2 text-[13px]">
            {[
              ['Started', ses.shift ? relative(ses.shift.startedAt) : '—'],
              ['Trips completed', done],
              ['Bus', vehicle?.plate],
              ['Driver', driver?.name],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-ink-500">{k}</dt>
                <dd className="text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Odometer (km)">
            <Input type="number" value={odo} onChange={(e) => setOdo(e.target.value)} />
          </Field>
          <Field label="Fuel level (%)">
            <Input type="number" value={fuel} onChange={(e) => setFuel(e.target.value)} />
          </Field>
        </div>

        <Field label="Handover notes" hint="Anything the next driver or maintenance should know">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Rear door sensor was slow to close twice this afternoon…"
          />
        </Field>

        <div className="bg-white rounded-xl border border-ink-200 p-4">
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            label="Final walk-round completed — no passengers or property left on board"
          />
        </div>

        <div className="rounded-xl bg-brand-50 border border-brand-100 p-3.5 flex items-start gap-2.5">
          <Radio size={15} className="text-brand-600 mt-px shrink-0" />
          <p className="text-[13px] text-brand-900 leading-relaxed">
            Ending the shift turns tracking off immediately. Nothing about your location is recorded again until your
            next check-in.
          </p>
        </div>

        <div className="flex gap-2 text-[12.5px] text-ink-400">
          <Gauge size={13} /> Odometer and <Fuel size={13} /> fuel readings feed the maintenance schedule.
        </div>
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <Button variant="primary" full size="lg" icon={LogOut} disabled={!checked} onClick={end}>
          End shift and stop tracking
        </Button>
      </div>
    </div>
  )
}
