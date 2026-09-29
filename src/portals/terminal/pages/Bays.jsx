import { useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Select } from '../../../components/ui/Field.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes, terminals } from '../../../data/geo.js'
import { timeOnly, dt } from '../../../lib/format.js'

/** two departures may not share a bay within a 20-minute window. */
function conflictsFor(dep, all) {
  if (!dep.bay) return []
  return all.filter(
    (d) => d.id !== dep.id && d.bay === dep.bay && Math.abs(new Date(d.depart) - new Date(dep.depart)) < 20 * 60000,
  )
}
export default function Bays() {
  const { db, update } = useDb()
  const [ses] = useSession('terminal')
  const toast = useToast()
  const t = terminals.find((x) => x.id === ses.terminalId) || terminals[0]
  const [day, setDay] = useState(0)
  const target = new Date()
  target.setDate(target.getDate() + day)
  target.setHours(0, 0, 0, 0)
  const deps = db.departures
    .filter((d) => d.boardingPoints.includes(t.id))
    .filter((d) => new Date(d.depart).toDateString() === target.toDateString())
    .sort((a, b) => new Date(a.depart) - new Date(b.depart))
  const assign = (id, bay) => {
    update((d) => {
      const x = d.departures.find((y) => y.id === id)
      x.bay = bay || null
    })
    toast({
      title: bay ? `Bay ${bay} assigned` : 'Bay cleared',
      body: 'The public board and the Citizen App update immediately.',
    })
  }
  const conflicted = deps.filter((d) => conflictsFor(d, deps).length > 0)
  return (
    <>
      <PageHeader
        title="Bay allocation"
        subtitle="Assign a bay to each departure. Two services may not share a bay within 20 minutes; conflicts are flagged before they reach the board."
        actions={
          <Select value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-44">
            {[0, 1, 2].map((i) => {
              const d = new Date()
              d.setDate(d.getDate() + i)
              return (
                <option key={i} value={i}>
                  {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'long' })}
                </option>
              )
            })}
          </Select>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat label="Departures" value={deps.length} method="Services boarding at this terminal on the selected day." />
        <Stat label="Bays" value={t.bays.length} method="Physical bays registered for this terminal." />
        <Stat
          label="Unassigned"
          value={deps.filter((d) => !d.bay).length}
          tone={deps.some((d) => !d.bay) ? 'warn' : 'good'}
          method="Departures without a bay. The board shows them as TBA until assigned."
        />
        <Stat
          label="Conflicts"
          value={conflicted.length}
          tone={conflicted.length ? 'bad' : 'good'}
          method="Two departures sharing a bay within 20 minutes."
        />
      </StatGrid>

      <Card>
        <CardHeader
          title="Allocation"
          subtitle={`${t.name} · ${target.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })}`}
        />
        <CardBody className="p-0">
          <div className="divide-y divide-ink-100">
            {deps.map((d) => {
              const r = routes.find((x) => x.id === d.route)
              const op = (db.operators || []).find((o) => o.id === d.operator)
              const conflicts = conflictsFor(d, deps)
              return (
                <div
                  key={d.id}
                  className={`flex flex-wrap items-center gap-4 px-4 py-3 ${conflicts.length ? 'bg-red-50/50' : ''}`}
                >
                  <span className="text-[14px] font-semibold text-ink-900 tabular-nums w-16">{timeOnly(d.depart)}</span>
                  <div className="w-56 min-w-0">
                    <p className="text-[12.5px] font-medium text-ink-900 truncate">{r?.name}</p>
                    <p className="text-[11.5px] text-ink-400">
                      {r?.line} · {op?.short}
                    </p>
                  </div>
                  <Select value={d.bay || ''} onChange={(e) => assign(d.id, e.target.value)} className="w-32">
                    <option value="">Unassigned</option>
                    {t.bays.map((b) => (
                      <option key={b} value={b}>
                        Bay {b}
                      </option>
                    ))}
                  </Select>
                  <span className="text-[12.5px] text-ink-500 w-28">
                    {d.soldSeats.length}/{d.capacity} sold
                  </span>
                  <div className="flex-1 flex justify-end gap-1.5">
                    {conflicts.length === 0 ? (
                      <Badge tone="green" icon={Check}>
                        No conflict
                      </Badge>
                    ) : (
                      conflicts.map((c) => (
                        <Badge key={c.id} tone="red" icon={AlertTriangle}>
                          Clashes with {timeOnly(c.depart)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
            {deps.length === 0 && (
              <p className="px-4 py-10 text-center text-[12.5px] text-ink-400">No departures on this day.</p>
            )}
          </div>
        </CardBody>
      </Card>

      <p className="text-[12px] text-ink-400 mt-3">
        Allocations are confirmed 30 minutes before departure and pushed to the public board, the in-app terminal page
        and the passenger's trip reminder. Last refresh {dt(new Date().toISOString())}.
      </p>
    </>
  )
}
