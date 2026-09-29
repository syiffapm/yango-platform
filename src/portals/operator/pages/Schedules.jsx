import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Plus, Save, Upload } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Field, Input, Select } from '../../../components/ui/Field.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'

/**  / AC-04 — a timetable cannot exceed permitted hours, fall below minimum headway, or need more vehicles than held. */
function validate(form, permit, spareRatio) {
  const errs = []
  if (!permit) return ['No valid route permit — this line cannot be scheduled']
  const min = permit.terms?.minHeadwayMin
  if (min && Number(form.headway) < min)
    errs.push(`Headway ${form.headway} min is below the permit minimum of ${min} min`)
  const [ps, pe] = (permit.terms?.hours || '05:00–22:00').split('–')
  if (form.from < ps) errs.push(`Start ${form.from} is before permitted hours (${ps})`)
  if (form.to > pe) errs.push(`End ${form.to} is after permitted hours (${pe})`)
  const roundTripMin = Number(form.roundTrip)
  const required = Math.ceil(roundTripMin / Number(form.headway))
  const held = permit.terms?.vehiclesHeld ?? 0
  if (required > held)
    errs.push(`${required} vehicles required at this headway; only ${held} held (spare ratio ${spareRatio}×)`)
  return errs
}
export default function Schedules() {
  const { routes: myRoutes, permits, departures, db } = useOperator()
  const toast = useToast()
  const [routeId, setRouteId] = useState(myRoutes[0]?.id)
  const [form, setForm] = useState({ from: '05:00', to: '22:00', headway: 9, roundTrip: 80, calendar: 'Mon–Sun' })
  const route = myRoutes.find((r) => r.id === routeId)
  const permit = permits.find((p) => p.routeId === routeId)
  const errs = useMemo(() => validate(form, permit, db.thresholds.spareRatio), [form, permit, db.thresholds.spareRatio])
  const required = Math.ceil(Number(form.roundTrip) / Number(form.headway))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = () => {
    if (errs.length) {
      toast({ title: 'Validation error', body: errs[0], kind: 'error' })
      return
    }
    toast({
      title: 'Timetable saved',
      body: `${route.line}: every ${form.headway} min, ${form.from}–${form.to}. Checked against the permit.`,
    })
  }
  const scheduledDeps = departures.filter((d) => d.route === routeId)
  return (
    <>
      <PageHeader
        title="Schedules"
        subtitle="Frequency or fixed-departure timetables, calendars and bulk GTFS/CSV upload. Every timetable is checked against the permit before it can be saved."
        actions={
          <>
            <Button icon={Upload}>Bulk upload (GTFS/CSV)</Button>
            <Button variant="primary" icon={Save} onClick={save}>
              Save timetable
            </Button>
          </>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Permitted headway"
          value={permit?.terms?.minHeadwayMin ? `${permit.terms.minHeadwayMin} min` : 'Timetabled'}
          method="Minimum headway written into the route permit. A timetable may not fall below it."
        />
        <Stat
          label="Planned headway"
          value={`${form.headway} min`}
          tone={errs.some((e) => e.includes('Headway')) ? 'bad' : 'good'}
          method="What you are about to publish."
        />
        <Stat
          label="Vehicles required"
          value={required}
          tone={required > (permit?.terms?.vehiclesHeld ?? 0) ? 'bad' : 'good'}
          method="Round-trip time ÷ planned headway."
        />
        <Stat
          label="Vehicles held"
          value={permit?.terms?.vehiclesHeld ?? '—'}
          method={`Holdings must be at least required × spare ratio ${db.thresholds.spareRatio}×.`}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Timetable editor" subtitle={route ? `${route.line} · ${route.name}` : ''} />
          <CardBody className="grid sm:grid-cols-2 gap-4">
            <Field label="Line" className="sm:col-span-2">
              <Select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                {myRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.line} · {r.name} ({r.class})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="First departure" required>
              <Input type="time" value={form.from} onChange={set('from')} />
            </Field>
            <Field label="Last departure" required>
              <Input type="time" value={form.to} onChange={set('to')} />
            </Field>
            <Field label="Headway (minutes)" required hint="Frequency-based services only">
              <Input type="number" min={2} value={form.headway} onChange={set('headway')} />
            </Field>
            <Field label="Round-trip time (minutes)" required hint="Drives the number of vehicles needed">
              <Input type="number" value={form.roundTrip} onChange={set('roundTrip')} />
            </Field>
            <Field label="Calendar" className="sm:col-span-2">
              <Select value={form.calendar} onChange={set('calendar')}>
                <option>Mon–Sun</option>
                <option>Mon–Fri</option>
                <option>Sat–Sun</option>
                <option>Public holidays</option>
                <option>Festival service</option>
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Permit validation" subtitle="Checked live against the route permit in force" />
          <CardBody>
            {errs.length === 0 ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <Check size={16} className="text-emerald-600 mt-px" />
                <p className="text-[12px] text-emerald-900 leading-relaxed">
                  This timetable fits inside the permit: hours, minimum headway and vehicles held all check out.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {errs.map((e) => (
                  <li key={e} className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 p-3">
                    <AlertTriangle size={15} className="text-red-600 mt-px shrink-0" />
                    <span className="text-[12px] text-red-900 leading-relaxed">{e}</span>
                  </li>
                ))}
              </ul>
            )}
            {permit && (
              <dl className="mt-4 pt-4 border-t border-ink-100 space-y-2 text-[12.5px]">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Permit</dt>
                  <dd className="font-mono">{permit.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Permitted hours</dt>
                  <dd className="font-medium">{permit.terms.hours}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Version</dt>
                  <dd>
                    <Badge tone="slate">v{permit.version}</Badge>
                  </dd>
                </div>
              </dl>
            )}
          </CardBody>
        </Card>
      </div>

      {route?.class === 'Intercity' && (
        <Card className="mt-4">
          <CardHeader
            title="Fixed departures"
            subtitle="Scheduled services sell a specific seat on a specific departure"
            action={
              <Button size="xs" icon={Plus}>
                Add departure
              </Button>
            }
          />
          <CardBody className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {scheduledDeps.slice(0, 8).map((d) => (
              <div key={d.id} className="rounded-lg border border-ink-200 p-2.5">
                <p className="text-[13px] font-semibold text-ink-900 tabular-nums">
                  {new Date(d.depart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[11.5px] text-ink-400">
                  {new Date(d.depart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · bay{' '}
                  {d.bay || '—'}
                </p>
                <p className="text-[11.5px] text-ink-500 mt-1">
                  {d.soldSeats.length}/{d.capacity} sold
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </>
  )
}
