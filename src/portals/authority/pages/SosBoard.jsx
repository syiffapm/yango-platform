import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Ambulance, Check, Paperclip, Phone, Shield, Siren } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge, { PriorityPill, StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { useClock } from '../../../lib/store.jsx'
import { countdown, dt, relative } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function SosBoard() {
  const tx = useTx()
  const { db, update, audit, notify, me, can } = useAuthority()
  const toast = useToast()
  useClock(1000)
  const [sel, setSel] = useState(null)
  const sos = db.incidents.filter((i) => i.isSOS && i.status !== 'closed')
  const active = sel ? db.incidents.find((i) => i.id === sel) : sos[0]
  const escalated = sos.filter((i) => !i.acknowledgedAt && Date.now() - new Date(i.reportedAt) > 120000)
  const dispatch = (kind) => {
    update((d) => {
      const i = d.incidents.find((x) => x.id === active.id)
      i.dispatch = { ...(i.dispatch || {}), [kind]: true, at: new Date().toISOString() }
      if (!i.acknowledgedAt) {
        i.acknowledgedAt = new Date().toISOString()
        i.status = 'acknowledged'
        i.owner = me.id
      }
    })
    audit({ actor: me.id, role: me.role, action: `Dispatched ${kind}`, object: active.id, category: 'Incidents' })
    notify({
      audience: 'operator',
      title: `${kind} dispatched — ${active.id}`,
      body: `Emergency services are en route to ${active.location}.`,
    })
    toast({
      title: `${kind[0].toUpperCase()}${kind.slice(1)} dispatched`,
      body: 'Location, vehicle and driver details sent to the dispatch partner.',
    })
  }
  const acknowledge = () => {
    update((d) => {
      const i = d.incidents.find((x) => x.id === active.id)
      i.status = 'acknowledged'
      i.acknowledgedAt = new Date().toISOString()
      i.owner = me.id
    })
    audit({ actor: me.id, role: me.role, action: 'Acknowledged SOS', object: active.id, category: 'Incidents' })
    toast({ title: 'SOS acknowledged', body: 'The passenger or driver is told help is being arranged.' })
  }
  return (
    <>
      <PageHeader
        title="SOS live board"
        subtitle="Every open SOS on one screen with its map position, evidence and one-click dispatch. Unacknowledged SOS escalates to the duty officer after two minutes."
        meta={
          <Badge tone={sos.length ? 'red' : 'green'} dot>
            {sos.length} active
          </Badge>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Active SOS"
          value={sos.length}
          tone={sos.length ? 'bad' : 'good'}
          icon={Siren}
          method="Passenger or driver SOS not yet closed."
        />
        <Stat
          label="Escalated"
          value={escalated.length}
          tone={escalated.length ? 'bad' : 'good'}
          method="Unacknowledged for more than two minutes — automatically escalated to the duty officer."
        />
        <Stat
          label="Acknowledged within SLA"
          value="96%"
          tone="good"
          method="P1 acknowledged within 5 minutes over the last 30 days. The target is is ≥ 95%."
        />
        <Stat
          label="Dispatched today"
          value={db.incidents.filter((i) => i.dispatch).length}
          method="SOS where police, ambulance or fire were dispatched from the console."
        />
      </StatGrid>

      {sos.length === 0 ? (
        <Empty
          icon={Shield}
          title="No active SOS"
          hint="Raise one from the Citizen App or the Driver App to see it arrive here within seconds."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Active SOS" subtitle="Ordered by acknowledgement deadline" />
            <CardBody className="p-0">
              {sos.map((i) => {
                const c = countdown(i.slaDueAt)
                return (
                  <button
                    key={i.id}
                    onClick={() => setSel(i.id)}
                    className={`w-full text-left px-4 py-3 border-b border-ink-50 last:border-0 ${active?.id === i.id ? 'bg-red-50' : 'hover:bg-ink-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="relative w-2 h-2 rounded-full bg-red-500 text-red-500 pulse-ring" />
                      <span className="text-[12.5px] font-semibold text-ink-900">{i.category}</span>
                      <PriorityPill priority={i.priority} />
                    </div>
                    <p className="text-[12px] text-ink-500 mt-1">
                      {i.location} · {relative(i.reportedAt)}
                    </p>
                    <p
                      className={`text-[12px] mt-0.5 tabular-nums ${c.overdue ? 'text-red-600 font-semibold' : 'text-ink-500'}`}
                    >
                      SLA {c.text}
                    </p>
                  </button>
                )
              })}
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title={active ? `${active.category} · ${active.id}` : 'Select an SOS'}
              subtitle={
                active
                  ? `${routes.find((r) => r.id === active.route)?.line} · ${db.vehicles.find((v) => v.id === active.vehicle)?.plate || '—'}`
                  : ''
              }
              action={active && <StatusPill status={active.status} />}
            />
            <CardBody className="p-0">
              {active && <MapView vehicles={[]} incidents={[active]} focus={active} height={240} />}
              {active && (
                <div className="p-4 space-y-4">
                  <p className="text-[12.5px] text-ink-700 leading-relaxed">{active.description}</p>

                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {[
                      ['Reported', dt(active.reportedAt)],
                      ['Acknowledged', active.acknowledgedAt ? dt(active.acknowledgedAt) : 'Not yet'],
                      ['Source', active.source],
                      ['Reporter', 'Reference only — identity never shown'],
                      ['Operator', (db.operators || []).find((o) => o.id === active.operator)?.name],
                      ['Location', active.location],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <dt className="text-[12.5px] text-ink-500">{tx(k)}</dt>
                        <dd className="text-[12px] text-ink-900 text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {active.evidence?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {active.evidence.map((e) => (
                        <span
                          key={e}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[12.5px] text-ink-700"
                        >
                          <Paperclip size={12} />
                          {e}
                        </span>
                      ))}
                    </div>
                  )}

                  {can.acknowledge ? (
                    <div className="flex flex-wrap gap-2">
                      {!active.acknowledgedAt && (
                        <Button variant="primary" icon={Check} onClick={acknowledge}>
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        icon={Shield}
                        onClick={() => dispatch('police')}
                        disabled={active.dispatch?.police}
                      >
                        {active.dispatch?.police ? 'Police dispatched' : 'Dispatch police'}
                      </Button>
                      <Button
                        variant="warning"
                        icon={Ambulance}
                        onClick={() => dispatch('ambulance')}
                        disabled={active.dispatch?.ambulance}
                      >
                        {active.dispatch?.ambulance ? 'Ambulance dispatched' : 'Dispatch ambulance'}
                      </Button>
                      <Button icon={Phone}>Call reporter back</Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-[12.5px] text-amber-900">
                        Only the safety &amp; incident officer may dispatch. Switch identity from the top-right menu.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  )
}
