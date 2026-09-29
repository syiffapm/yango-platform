import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Camera, Check, X } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
const ITEMS = [
  { key: 'brakes', label: 'Brakes and handbrake', critical: true },
  { key: 'tyres', label: 'Tyres and wheel nuts', critical: true },
  { key: 'lights', label: 'Lights and indicators', critical: true },
  { key: 'doors', label: 'Doors and emergency exit', critical: true },
  { key: 'extinguisher', label: 'Fire extinguisher', critical: false },
  { key: 'firstaid', label: 'First aid kit', critical: false },
  { key: 'cctv', label: 'CCTV / dashcam recording', critical: false },
  { key: 'clean', label: 'Interior cleanliness', critical: false },
]
export default function Inspection() {
  const { driver, vehicle, update, notify } = useDriver()
  const toast = useToast()
  const nav = useNavigate()
  const [result, setResult] = useState({})
  const [photos, setPhotos] = useState({})
  const done = ITEMS.every((i) => result[i.key])
  const criticalFail = ITEMS.some((i) => i.critical && result[i.key] === 'fail')
  const submit = () => {
    if (criticalFail) {
      const failed = ITEMS.filter((i) => i.critical && result[i.key] === 'fail').map((i) => i.label)
      update((d) => {
        const veh = d.vehicles.find((v) => v.id === vehicle.id)
        if (veh) veh.status = 'blocked'
        d.maintenance.unshift({
          id: `WO-${400 + d.maintenance.length}`,
          vehicle: vehicle.id,
          operator: vehicle.operator,
          type: 'defect',
          source: 'Driver inspection',
          item: failed.join(', '),
          severity: 'critical',
          opened: new Date().toISOString(),
          status: 'open',
          blocksVehicle: true,
          note: `Reported by ${driver.name} at pre-trip inspection; vehicle auto-blocked.`,
        })
      })
      notify({
        audience: 'operator',
        title: 'Critical defect — vehicle blocked',
        body: `${vehicle.plate}: ${failed.join(', ')}. A work order has been raised and the bus cannot be rostered.`,
      })
      toast({
        title: 'Trip blocked',
        body: 'A critical defect blocks the trip. Maintenance has been notified.',
        kind: 'error',
      })
      nav('/driver/home')
      return
    }
    notify({
      audience: 'operator',
      title: 'Pre-trip inspection passed',
      body: `${vehicle.plate} cleared by ${driver.name}.`,
    })
    toast({ title: 'Inspection complete', body: 'You are cleared to start your first trip.' })
    nav('/driver/trips')
  }
  return (
    <div>
      <AppBar title="Pre-trip inspection" subtitle={vehicle?.plate} back />

      <div className="p-4 space-y-2">
        {ITEMS.map((i) => (
          <div
            key={i.key}
            className={`rounded-xl border p-3 ${result[i.key] === 'fail' ? 'border-red-200 bg-red-50' : result[i.key] === 'pass' ? 'border-emerald-200 bg-emerald-50/50' : 'border-ink-200 bg-white'}`}
          >
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[13.5px] text-ink-900">{i.label}</span>
              {i.critical && <Badge tone="red">Critical</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <Button
                size="sm"
                variant={result[i.key] === 'pass' ? 'primary' : 'secondary'}
                icon={Check}
                onClick={() => setResult((r) => ({ ...r, [i.key]: 'pass' }))}
                className="flex-1"
              >
                Pass
              </Button>
              <Button
                size="sm"
                variant={result[i.key] === 'fail' ? 'danger' : 'secondary'}
                icon={X}
                onClick={() => setResult((r) => ({ ...r, [i.key]: 'fail' }))}
                className="flex-1"
              >
                Fail
              </Button>
              <Button
                size="sm"
                variant={photos[i.key] ? 'subtle' : 'secondary'}
                icon={Camera}
                onClick={() => setPhotos((p) => ({ ...p, [i.key]: !p[i.key] }))}
              />
            </div>
          </div>
        ))}

        {criticalFail && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-red-600 mt-px shrink-0" />
            <p className="text-[13px] text-red-900 leading-relaxed">
              A critical item has failed. Submitting will block the vehicle, raise a work order and notify your
              operator's maintenance team. The bus cannot be rostered or sold on until the work order is closed.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <Button variant={criticalFail ? 'danger' : 'primary'} full size="lg" disabled={!done} onClick={submit}>
          {criticalFail
            ? 'Submit and block the vehicle'
            : done
              ? 'Submit inspection'
              : `Mark ${ITEMS.length - Object.keys(result).length} more item(s)`}
        </Button>
      </div>
    </div>
  )
}
