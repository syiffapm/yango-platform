import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Activity, Megaphone, Radio, Rewind } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { Field, Textarea, Select } from '../../../components/ui/Field.jsx'
import MapView, { STATUS_LABEL } from '../../../components/domain/MapView.jsx'
import CoverageChip from '../../../components/domain/CoverageChip.jsx'
import { coverageIndex, useLiveVehicles } from '../../../lib/store.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes } from '../../../data/geo.js'
export default function LiveOps() {
  const tx = useTx()
  const { db, op, routes: myRoutes, incidents, notify } = useOperator()
  const live = useLiveVehicles({ operator: op.id })
  const cov = coverageIndex(db, op.id)
  const toast = useToast()
  const [sel, setSel] = useState(null)
  const [broadcast, setBroadcast] = useState(null)
  const openInc = incidents.filter((i) => i.status !== 'closed')
  const send = () => {
    notify({ audience: 'driver', title: 'Broadcast from dispatch', body: broadcast.text, ack: false })
    toast({ title: 'Broadcast sent', body: 'Drivers must acknowledge before the message clears.' })
    setBroadcast(null)
  }
  return (
    <>
      <PageHeader
        title="Live operations"
        subtitle="Your buses in real time with delays, bunching, geofence and speeding alerts, driver status, broadcast to drivers and 90-day trip replay."
        meta={
          <>
            <CoverageChip coverage={cov} compact />
            <Badge tone="slate">{live.length} vehicles</Badge>
          </>
        }
        actions={
          <>
            <Button
              icon={Rewind}
              onClick={() =>
                toast({
                  title: 'Trip replay',
                  body: 'Replay of the last 90 days is available per vehicle and per trip.',
                  kind: 'info',
                })
              }
            >
              Trip replay
            </Button>
            <Button variant="primary" icon={Megaphone} onClick={() => setBroadcast({ text: '', target: 'all' })}>
              Broadcast
            </Button>
          </>
        }
      />

      <StatGrid cols={5} className="mb-4">
        <Stat
          label="Transmitting"
          value={live.filter((v) => v.transmitting).length}
          unit={`/ ${live.length}`}
          icon={Radio}
          method="Vehicles reporting a position in the last 10 minutes."
        />
        <Stat
          label="On headway"
          value={live.filter((v) => v.status === 'on_headway').length}
          tone="good"
          method="Actual gap to the bus in front within the permitted slack."
        />
        <Stat
          label="Deviating"
          value={live.filter((v) => v.status === 'deviating').length}
          tone="warn"
          method="Off the permitted route shape or outside the headway slack."
        />
        <Stat
          label="Bunching"
          value={live.filter((v) => v.status === 'bunching').length}
          tone="warn"
          method="Two vehicles within a third of the planned headway."
        />
        <Stat
          label="Not responding"
          value={live.filter((v) => v.status === 'not_responding').length}
          tone={live.some((v) => v.status === 'not_responding') ? 'bad' : 'good'}
          method="Stopped transmitting mid-shift. Lowers your Coverage Index."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Fleet map" subtitle="Your vehicles only" icon={Activity} />
          <CardBody className="p-0">
            <MapView
              vehicles={live}
              highlightRoutes={myRoutes.map((r) => r.id)}
              incidents={openInc}
              height={460}
              selectedVehicle={sel?.id}
              onVehicleClick={setSel}
            />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title={sel ? sel.plate : 'Select a vehicle'}
              subtitle={
                sel ? `${sel.class} · ${routes.find((r) => r.id === sel.route)?.line}` : 'Click a bus on the map'
              }
            />
            <CardBody>
              {sel ? (
                <dl className="space-y-2.5">
                  {[
                    ['Status', STATUS_LABEL[sel.status]],
                    ['Driver', sel.driverName || '—'],
                    ['Speed', `${sel.speedKph} km/h`],
                    ['Occupancy', sel.occupancyPct == null ? 'not measurable' : `${sel.occupancyPct}%`],
                    ['Next stop', sel.nextStop?.name || '—'],
                    ['Device IMEI', sel.imei],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-[12.5px] text-ink-500">{tx(k)}</dt>
                      <dd className="text-[12px] text-ink-900 font-medium text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-[12px] text-ink-400">Vehicle telemetry, driver on duty and next stop appear here.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Alerts" subtitle="Geofence, speeding and harsh events" />
            <CardBody className="space-y-2">
              {live
                .filter((v) => v.status !== 'on_headway')
                .slice(0, 6)
                .map((v) => (
                  <div key={v.id} className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="flex-1 text-[12px] text-ink-800">{v.plate}</span>
                    <Badge tone={v.status === 'not_responding' ? 'slate' : 'amber'}>{STATUS_LABEL[v.status]}</Badge>
                  </div>
                ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={!!broadcast}
        onClose={() => setBroadcast(null)}
        title="Broadcast to drivers"
        subtitle="Drivers must acknowledge the message in the Driver App before it clears."
        footer={
          <>
            <Button onClick={() => setBroadcast(null)}>Cancel</Button>
            <Button variant="primary" disabled={!broadcast?.text} onClick={send}>
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Recipients">
            <Select
              value={broadcast?.target || 'all'}
              onChange={(e) => setBroadcast((s) => ({ ...s, target: e.target.value }))}
            >
              <option value="all">All drivers on duty</option>
              {myRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.line} · {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Message" required>
            <Textarea
              rows={4}
              value={broadcast?.text || ''}
              onChange={(e) => setBroadcast((s) => ({ ...s, text: e.target.value }))}
              placeholder="Tamwe Market closed until 16:00 — divert via Thitsar Road."
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
