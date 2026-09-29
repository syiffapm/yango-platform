import { useParams } from 'react-router-dom'
import { UserCheck, UserX } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes } from '../../../data/geo.js'
import { timeOnly } from '../../../lib/format.js'
import { useState } from 'react'
export default function Manifest() {
  const { id } = useParams()
  const { db, trips, vehicle } = useDriver()
  const toast = useToast()
  const [noShows, setNoShows] = useState([])
  const trip = trips.find((t) => t.id === id)
  const route = routes.find((r) => r.id === (trip?.route || vehicle?.route))
  const dep = db.departures.find((d) => d.vehicle === vehicle?.id && new Date(d.depart) > Date.now() - 3600000)
  const sold = dep?.soldSeats || []
  const tickets = db.tickets.filter((t) => t.departureId === dep?.id)
  const rows = sold.map((seat, i) => {
    const t = tickets.find((x) => x.seats?.includes(seat))
    return {
      seat,
      name: t?.passenger || `Passenger ${String.fromCharCode(65 + (i % 26))}`,
      ticket: t?.id || `TK-${7000 + i}`,
      checkedIn: !noShows.includes(seat) && i % 4 !== 3,
    }
  })
  const boarded = rows.filter((r) => r.checkedIn).length
  const markNoShow = (seat) => {
    setNoShows((n) => (n.includes(seat) ? n.filter((s) => s !== seat) : [...n, seat]))
    toast({
      title: `Seat ${seat} marked`,
      body: 'No-show recorded. The operator can release or refund the seat under policy.',
    })
  }
  if (!dep) {
    return (
      <div>
        <AppBar title="Manifest" back />
        <Empty
          title="No seat manifest for this trip"
          hint="Urban services carry no seat manifest — passengers board any bus on the line and scan a time-valid QR."
        />
      </div>
    )
  }
  return (
    <div>
      <AppBar title="Passenger manifest" subtitle={`${route?.line} · ${timeOnly(dep.depart)}`} back />

      <div className="p-4">
        <div className="bg-white rounded-xl border border-ink-200 p-3.5 mb-3">
          <Progress
            label={`Boarded ${boarded} of ${rows.length}`}
            value={boarded}
            max={Math.max(1, rows.length)}
            tone="brand"
          />
          <p className="text-[12px] text-ink-400 mt-2">
            You see name, seat and ticket ID only. No other passenger data reaches the Driver App.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {rows.map((r) => (
            <div key={r.seat} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-ink-50 last:border-0">
              <span className="w-9 h-9 rounded-lg bg-ink-100 grid place-items-center text-[13px] font-semibold text-ink-700 shrink-0">
                {r.seat}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-ink-900 truncate">{r.name}</p>
                <p className="text-[12px] text-ink-400 font-mono">{r.ticket}</p>
              </div>
              {r.checkedIn ? (
                <Badge tone="green" icon={UserCheck}>
                  Boarded
                </Badge>
              ) : (
                <Button size="xs" variant="secondary" icon={UserX} onClick={() => markNoShow(r.seat)}>
                  No-show
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
