import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, QrCode, ScanFace, Wine } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Checkbox } from '../../../components/ui/Field.jsx'
import { Steps } from '../../../components/ui/Progress.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes } from '../../../data/geo.js'
const STEPS = ['Face match', 'Bus QR', 'Fitness']
export default function CheckIn() {
  const { driver, vehicle, blockers, setSes, audit, notify } = useDriver()
  const toast = useToast()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [face, setFace] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [fit, setFit] = useState({ rested: false, sober: false, fit: false })
  const route = routes.find((r) => r.id === vehicle?.route)
  const allFit = fit.rested && fit.sober && fit.fit
  const doFace = () => {
    setFace('scanning')
    setTimeout(() => {
      setFace('match')
      setTimeout(() => setStep(1), 600)
    }, 1200)
  }
  const doScan = () => {
    setScanned(true)
    setTimeout(() => setStep(2), 600)
  }
  const start = () => {
    const startedAt = new Date().toISOString()
    setSes({ shift: { startedAt, vehicle: vehicle.id, route: vehicle.route } })
    audit({ actor: driver.id, role: 'driver', action: 'Shift check-in', object: vehicle.plate, category: 'Access' })
    notify({
      audience: 'operator',
      title: 'Driver checked in',
      body: `${driver.name} started a shift on ${vehicle.plate}. Tracking is now on.`,
    })
    toast({ title: 'Shift started', body: 'Tracking is on. Complete the pre-trip inspection before your first trip.' })
    nav('/driver/inspection')
  }
  if (blockers.length > 0) {
    return (
      <div>
        <AppBar title="Shift check-in" back />
        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-[14px] font-semibold text-red-900">Check-in blocked</p>
            <ul className="mt-2 space-y-1">
              {blockers.map((b) => (
                <li key={b} className="text-[13px] text-red-800">
                  · {b}
                </li>
              ))}
            </ul>
            <p className="text-[12.5px] text-red-700/80 mt-3">
              A driver can only start a shift with a valid operating licence, a valid driving licence of the right class
              and a successful face match. Your operator and the authority have both been notified.
            </p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div>
      <AppBar title="Shift check-in" subtitle={`${vehicle?.plate} · ${route?.line}`} back />

      <div className="p-4">
        <Steps steps={STEPS} current={step} className="mb-5" />

        {step === 0 && (
          <div className="text-center">
            <div
              className={`mx-auto w-48 h-48 rounded-3xl grid place-items-center border-2 ${face === 'match' ? 'border-emerald-400 bg-emerald-50' : face === 'scanning' ? 'border-brand-400 bg-brand-50 animate-pulse' : 'border-dashed border-ink-300 bg-ink-50'}`}
            >
              {face === 'match' ? (
                <div>
                  <CheckCircle2 size={44} className="text-emerald-600 mx-auto" />
                  <p className="text-[13px] text-emerald-700 mt-2 font-medium">Match 98.4%</p>
                </div>
              ) : (
                <div>
                  <ScanFace
                    size={44}
                    className={face === 'scanning' ? 'text-brand-600 mx-auto' : 'text-ink-400 mx-auto'}
                  />
                  <p className="text-[13px] text-ink-500 mt-2">
                    {face === 'scanning' ? 'Checking…' : 'Position your face in the frame'}
                  </p>
                </div>
              )}
            </div>
            <p className="text-[13px] text-ink-600 mt-4 leading-relaxed">
              Your selfie is matched against the photo on your operating licence. The score is advisory — a failed match
              sends the check-in to your operator rather than locking you out permanently.
            </p>
            <Button
              variant="primary"
              full
              size="lg"
              className="mt-5"
              icon={Camera}
              disabled={face === 'scanning'}
              onClick={doFace}
            >
              {face === 'match' ? 'Matched' : 'Capture selfie'}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <div
              className={`mx-auto w-48 h-48 rounded-3xl grid place-items-center border-2 ${scanned ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-ink-300 bg-ink-50'}`}
            >
              {scanned ? (
                <div>
                  <CheckCircle2 size={44} className="text-emerald-600 mx-auto" />
                  <p className="text-[13px] text-emerald-700 mt-2 font-medium">{vehicle?.plate}</p>
                </div>
              ) : (
                <div>
                  <QrCode size={44} className="text-ink-400 mx-auto" />
                  <p className="text-[13px] text-ink-500 mt-2">Scan the QR inside the bus</p>
                </div>
              )}
            </div>
            <p className="text-[13px] text-ink-600 mt-4 leading-relaxed">
              Scanning the bus QR binds you to this vehicle for the shift. If the bus is blocked by a critical defect
              the scan is refused.
            </p>
            <Button variant="primary" full size="lg" className="mt-5" icon={QrCode} onClick={doScan}>
              {scanned ? 'Bus confirmed' : 'Scan bus QR'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="bg-white rounded-xl border border-ink-200 p-4 space-y-3">
              <p className="text-[13.5px] font-semibold text-ink-900">Fitness declaration</p>
              <Checkbox
                checked={fit.rested}
                onChange={(e) => setFit((f) => ({ ...f, rested: e.target.checked }))}
                label="I have had at least 8 hours of rest since my last shift"
              />
              <Checkbox
                checked={fit.sober}
                onChange={(e) => setFit((f) => ({ ...f, sober: e.target.checked }))}
                label="I have not consumed alcohol or impairing medication"
              />
              <Checkbox
                checked={fit.fit}
                onChange={(e) => setFit((f) => ({ ...f, fit: e.target.checked }))}
                label="I am medically fit to drive today"
              />
              <div className="flex items-center gap-2 pt-2 border-t border-ink-100">
                <Wine size={14} className="text-ink-400" />
                <span className="text-[12.5px] text-ink-500 flex-1">Breathalyser device</span>
                <Badge tone="slate">Optional · not fitted</Badge>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-3.5">
              <p className="text-[13px] text-brand-900 leading-relaxed">
                Starting the shift turns tracking on. It stops the moment you end the shift — the platform never tracks
                you off duty.
              </p>
            </div>

            <Button variant="primary" full size="lg" className="mt-4" disabled={!allFit} onClick={start}>
              Start shift and turn tracking on
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
