import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bus, Camera, Gauge, ScanLine, Wrench } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import SeatMap from '../../../components/domain/SeatMap.jsx'
import Qr from '../../../components/ui/Qr.jsx'
import { Field, Select } from '../../../components/ui/Field.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dateOnly, num, relative } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
import { seatTemplates } from '../../../data/org.js'
export default function VehicleDetail() {
  const tx = useTx()
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { db, update, vehicles, drivers, maintenance } = useOperator()
  const [tab, setTab] = useState('overview')
  const v = vehicles.find((x) => x.id === id)
  if (!v)
    return (
      <Empty
        title="Vehicle not found"
        action={
          <Button as={Link} to="/operator/fleet">
            Back to fleet
          </Button>
        }
      />
    )
  const route = routes.find((r) => r.id === v.route)
  const driver = drivers.find((d) => d.vehicle === v.id)
  const wos = maintenance.filter((m) => m.vehicle === v.id)
  const permit = db.permits.find((p) => p.holder === v.id)
  const setLayout = (layout) => {
    update((d) => {
      const veh = d.vehicles.find((x) => x.id === v.id)
      veh.seatLayout = layout
      veh.capacity = seatTemplates[layout].capacity
    })
    toast({ title: 'Seat layout updated', body: `Capacity is now ${seatTemplates[layout].capacity} seats.` })
  }
  return (
    <>
      <Button size="sm" variant="ghost" icon={ArrowLeft} className="mb-4" onClick={() => nav(-1)}>
        Fleet
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-semibold text-ink-900">{v.plate}</h1>
            <StatusPill status={v.status} />
          </div>
          <p className="text-[12.5px] text-ink-500 mt-1">
            {v.class} · {route?.line} {route?.name} · chassis {v.chassis}
          </p>
        </div>
        <div className="flex gap-2">
          {permit && (
            <Button icon={ScanLine} as={Link} to={`/verify/${permit.id}`}>
              Verify permit
            </Button>
          )}
          <Button variant="primary" icon={Wrench} as={Link} to="/operator/maintenance">
            Raise work order
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'seats', label: 'Seat layout' },
          { value: 'devices', label: 'Devices' },
          { value: 'maintenance', label: 'Maintenance', count: wos.length },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Vehicle record" icon={Bus} />
            <CardBody className="grid sm:grid-cols-3 gap-x-6 gap-y-3">
              {[
                ['Plate', v.plate],
                ['Chassis', v.chassis],
                ['Class', v.class],
                ['Capacity', `${v.capacity} seats`],
                ['Seat layout', v.seatLayout],
                ['Odometer', `${num(v.odometerKm)} km`],
                ['Assigned line', route ? `${route.line} · ${route.name}` : '—'],
                ['Regular driver', driver?.name || '—'],
                ['Vehicle licence', dateOnly(v.licenceExpiry)],
                ['Roadworthiness', dateOnly(v.roadworthyExpiry)],
                ['Insurance', dateOnly(v.insuranceExpiry)],
                ['Permit', permit?.id || '—'],
              ].map(([k, val]) => (
                <div key={k}>
                  <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                  <p className="text-[12.5px] text-ink-900 mt-0.5">{val}</p>
                </div>
              ))}
              <div className="sm:col-span-3">
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1.5">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {v.amenities.map((a) => (
                    <Badge key={a} tone="brand">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Windscreen QR" subtitle="Passengers and inspectors scan this to verify the permit" />
            <CardBody className="text-center">
              <Qr value={permit?.id || v.id} size={140} className="mx-auto border border-ink-200" />
              <p className="text-[12px] text-ink-500 mt-3">{permit?.id || v.id}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'seats' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Seat-layout editor"
              subtitle="Templates with blocked and priority seats. Changing a layout updates seat inventory on future departures."
            />
            <CardBody>
              <SeatMap layout={v.seatLayout} readOnly sold={[]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Template" />
            <CardBody>
              <Field
                label="Layout template"
                hint="Priority seats 1–4 and women-only seats 5–6 are reserved automatically."
              >
                <Select value={v.seatLayout} onChange={(e) => setLayout(e.target.value)}>
                  {Object.entries(seatTemplates).map(([k, t]) => (
                    <option key={k} value={k}>
                      {k} — {t.capacity} seats
                    </option>
                  ))}
                </Select>
              </Field>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'devices' && (
        <Card>
          <CardHeader
            title="Telematics devices"
            subtitle="Position every ≤10 s, alarms, video clips and passenger counts"
            icon={Gauge}
          />
          <CardBody className="space-y-2">
            {[
              ['GPS tracker', v.imei, true],
              ['MDVR dashcam', v.dashcam ? `${v.imei}-DVR` : 'Not fitted', v.dashcam],
              ['Automatic passenger counter', v.apc ? `${v.imei}-APC` : 'Not fitted', v.apc],
              ['Panic button', `${v.imei}-SOS`, true],
            ].map(([name, ref, fitted]) => (
              <div key={name} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <Camera size={15} className="text-ink-400" />
                <span className="flex-1 text-[12.5px] text-ink-800">{name}</span>
                <span className="font-mono text-[12px] text-ink-500">{ref}</span>
                <Badge tone={fitted ? 'green' : 'slate'}>{fitted ? 'Transmitting' : 'Not fitted'}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {tab === 'maintenance' && (
        <Card>
          <CardHeader
            title="Work orders and defects"
            subtitle="A critical defect from a driver inspection automatically blocks the vehicle."
          />
          <CardBody className="space-y-2">
            {wos.map((w) => (
              <div key={w.id} className="flex items-start gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <div className="flex-1">
                  <p className="text-[12.5px] font-medium text-ink-900">{w.item}</p>
                  <p className="text-[12px] text-ink-500">
                    {w.source} · opened {relative(w.opened)} {w.note && `· ${w.note}`}
                  </p>
                </div>
                <Badge tone={w.severity === 'critical' ? 'red' : w.severity === 'major' ? 'amber' : 'slate'}>
                  {w.severity}
                </Badge>
                <StatusPill status={w.status} />
              </div>
            ))}
            {wos.length === 0 && (
              <Empty
                compact
                title="No work orders"
                hint="Defects raised at pre-trip inspection appear here automatically."
              />
            )}
          </CardBody>
        </Card>
      )}
    </>
  )
}
