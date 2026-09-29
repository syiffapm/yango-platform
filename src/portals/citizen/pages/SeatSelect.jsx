import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, Info, MapPin } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import SeatMap from '../../../components/domain/SeatMap.jsx'
import BookingSteps from '../../../components/domain/BookingSteps.jsx'
import { Select } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useBooking } from '../booking.jsx'
import { findDeparture, seatsSoldFor, isSeatReserved } from '../../../lib/schedule.js'
import { routes, stops, terminals } from '../../../data/geo.js'
import { MMK, dt } from '../../../lib/format.js'

// Seats are held for ten minutes while the traveller pays.
const HOLD_SECONDS = 600

export default function SeatSelect() {
  const { routeId, depId } = useParams()
  const nav = useNavigate()
  const { db } = useDb()
  const { draft, patch } = useBooking()
  const [seats, setSeats] = useState(draft.departureId === depId ? draft.seats : [])
  const [left, setLeft] = useState(HOLD_SECONDS)

  const dep = findDeparture(depId, db)
  const route = routes.find((r) => r.id === routeId)

  useEffect(() => {
    if (seats.length === 0) {
      setLeft(HOLD_SECONDS)
      return
    }
    const t = setInterval(() => setLeft((l) => (l <= 1 ? (setSeats([]), HOLD_SECONDS) : l - 1)), 1000)
    return () => clearInterval(t)
  }, [seats.length])

  if (!dep || !route) return <Empty title="Departure not found" />

  const reserved = isSeatReserved(dep)
  const sold = seatsSoldFor(dep, db)
  const toggle = (n) => setSeats((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))
  const nameOf = (id) => [...stops, ...terminals].find((s) => s.id === id)?.name || id

  const next = () => {
    patch({
      departureId: depId,
      seats,
      boardingPoint: draft.boardingPoint || dep.boardingPoints[0],
      droppingPoint: draft.droppingPoint || dep.droppingPoints[0],
      passengers: reserved || seats.length > 1 ? draft.passengers : [],
    })
    // Ask who is travelling whenever the booking is for more than the buyer.
    nav(
      reserved || seats.length > 1
        ? `/citizen/book/${routeId}/passenger/${depId}`
        : `/citizen/book/${routeId}/pay/${depId}`,
    )
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <div>
      <AppBar title="Pick a seat" subtitle={`${route.line} · ${dt(dep.depart)}`} back />
      <BookingSteps current={1} hasPassengers={reserved || seats.length > 1} />

      {seats.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <Clock size={14} className="text-amber-600" />
          <span className="text-[13px] text-amber-900">
            Held for{' '}
            <strong className="tabular-nums">
              {mm}:{ss}
            </strong>{' '}
            — please pay before the time runs out.
          </span>
        </div>
      )}

      <div className="p-4">
        {!reserved && (
          <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 border border-sky-200 p-3 mb-4">
            <Info size={15} className="text-sky-600 mt-px shrink-0" />
            <p className="text-[13px] text-sky-900 leading-relaxed">
              City bus — your fare is tied to this run. The seat you pick is a preference the crew will honour where
              they can, and priority seats stay free for passengers who need them.
            </p>
          </div>
        )}

        <SeatMap layout={dep.seatLayout} sold={sold} held={dep.heldSeats} selected={seats} max={4} onToggle={toggle} />

        <div className="mt-5 space-y-3">
          <div>
            <p className="text-[13px] font-medium text-ink-600 mb-1.5 inline-flex items-center gap-1.5">
              <MapPin size={12} />
              Where you get on
            </p>
            <Select
              value={draft.boardingPoint || dep.boardingPoints[0]}
              onChange={(e) => patch({ boardingPoint: e.target.value })}
            >
              {(dep.boardingPoints.length ? dep.boardingPoints : route.stops).map((b) => (
                <option key={b} value={b}>
                  {nameOf(b)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink-600 mb-1.5 inline-flex items-center gap-1.5">
              <MapPin size={12} />
              Where you get off
            </p>
            <Select
              value={draft.droppingPoint || dep.droppingPoints[0]}
              onChange={(e) => patch({ droppingPoint: e.target.value })}
            >
              {(dep.droppingPoints.length ? dep.droppingPoints : route.stops).map((b) => (
                <option key={b} value={b}>
                  {nameOf(b)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex flex-wrap gap-1">
            {seats.length ? (
              seats.map((s) => (
                <Badge key={s} tone="brand">
                  Seat {s}
                </Badge>
              ))
            ) : (
              <span className="text-[13px] text-ink-400">Tap a seat to choose it</span>
            )}
          </div>
          <span className="text-[15px] font-semibold text-brand-700">{MMK(dep.fare * seats.length)}</span>
        </div>
        <Button variant="primary" full size="lg" disabled={seats.length === 0} onClick={next}>
          Continue{seats.length ? ` · ${seats.length} seat${seats.length > 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  )
}
