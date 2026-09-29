import { useState } from 'react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import SeatMap from '../../../components/domain/SeatMap.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dt, timeOnly } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function Inventory() {
  const { departures, update } = useOperator()
  const toast = useToast()
  const upcoming = departures
    .filter((d) => new Date(d.depart) > Date.now())
    .sort((a, b) => new Date(a.depart) - new Date(b.depart))
    .slice(0, 18)
  const [sel, setSel] = useState(upcoming[0]?.id)
  const dep = departures.find((d) => d.id === sel) || upcoming[0]
  const block = (seat) => {
    update((d) => {
      const x = d.departures.find((y) => y.id === dep.id)
      if (x.soldSeats.includes(seat)) x.soldSeats = x.soldSeats.filter((s) => s !== seat)
      else x.soldSeats.push(seat)
    })
    toast({ title: `Seat ${seat} toggled`, body: 'Manual seat blocks remove the seat from every sales channel.' })
  }
  if (!dep)
    return (
      <Empty
        title="No upcoming scheduled departures"
        hint="Seat inventory applies to intercity and express services."
      />
    )
  const route = routes.find((r) => r.id === dep.route)
  return (
    <>
      <PageHeader
        title="Seat inventory"
        subtitle="Seat inventory per trip, quotas per sales channel and manual seat blocks. A seat held during checkout is released after 10 minutes."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Upcoming departures" subtitle="Scheduled services only" />
          <CardBody className="p-0 max-h-[520px] overflow-y-auto scroll-thin">
            <div className="divide-y divide-ink-100">
              {upcoming.map((d) => {
                const r = routes.find((x) => x.id === d.route)
                const pct = Math.round((d.soldSeats.length / d.capacity) * 100)
                return (
                  <button
                    key={d.id}
                    onClick={() => setSel(d.id)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-ink-50 ${sel === d.id ? 'bg-brand-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-medium text-ink-900">
                        {r?.line} · {timeOnly(d.depart)}
                      </span>
                      <Badge tone={pct > 85 ? 'red' : pct > 60 ? 'amber' : 'green'}>{pct}%</Badge>
                    </div>
                    <p className="text-[11.5px] text-ink-400 mt-0.5">
                      {new Date(d.depart).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      · {d.soldSeats.length}/{d.capacity} sold
                    </p>
                  </button>
                )
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={`${route?.line} · ${route?.name}`}
            subtitle={`${dt(dep.depart)} · bay ${dep.bay || 'unassigned'} · ${dep.seatLayout}`}
            action={
              <Button
                size="xs"
                onClick={() => toast({ title: 'Channel quotas saved', body: 'App 70% · counter 20% · agents 10%.' })}
              >
                Channel quotas
              </Button>
            }
          />
          <CardBody>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <Progress label="Sold" value={dep.soldSeats.length} max={dep.capacity} tone="brand" />
              <Progress label="Held (checkout)" value={dep.heldSeats.length} max={dep.capacity} tone="amber" />
              <Progress
                label="Available"
                value={dep.capacity - dep.soldSeats.length - dep.heldSeats.length}
                max={dep.capacity}
                tone="green"
              />
            </div>
            <SeatMap
              layout={dep.seatLayout}
              sold={dep.soldSeats}
              held={dep.heldSeats}
              selected={[]}
              max={0}
              onToggle={block}
            />
            <p className="text-[12px] text-ink-400 mt-3">
              Click a seat to block or release it. Blocks apply across every sales channel immediately.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
