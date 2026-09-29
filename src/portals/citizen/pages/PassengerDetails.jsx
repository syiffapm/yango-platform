import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck, UserRound } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import BookingSteps from '../../../components/domain/BookingSteps.jsx'
import { Checkbox, Field, Input, Select } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useBooking } from '../booking.jsx'
import { routes } from '../../../data/geo.js'
import { isSeatReserved } from '../../../lib/schedule.js'
import { findDeparture } from '../../../lib/schedule.js'
import { dt, MMK } from '../../../lib/format.js'
export default function PassengerDetails() {
  const { routeId, depId } = useParams()
  const nav = useNavigate()
  const { db } = useDb()
  const { draft, patch } = useBooking()
  const [ses] = useSession('citizen')
  const dep = findDeparture(depId, db)
  const route = routes.find((r) => r.id === routeId)
  const [people, setPeople] = useState(
    draft.passengers.length === draft.seats.length
      ? draft.passengers
      : draft.seats.map((seat, i) => ({
          seat,
          name: i === 0 ? ses.name || '' : '',
          phone: i === 0 ? ses.phone || '' : '',
          idNo: '',
          concession: '',
        })),
  )
  const reserved = dep ? isSeatReserved(dep) : false
  const [save, setSave] = useState(true)
  if (!dep || !route) return <Empty title="Booking not found" />
  const setP = (i, k, v) => setPeople((ps) => ps.map((p, pi) => (pi === i ? { ...p, [k]: v } : p)))
  // On a reserved-seat service the ID number is genuinely required, so the
  // form says so and the button waits for it.
  const ready = people.every((p) => p.name.trim() && (!reserved || p.idNo?.trim())) && Boolean(people[0]?.phone?.trim())
  const total = (dep?.fare || route?.fare || 0) * people.length
  const next = () => {
    patch({ passengers: people })
    nav(`/citizen/book/${routeId}/pay/${depId}`)
  }
  return (
    <div>
      <AppBar title="Passenger details" subtitle={`${route.line} · ${dt(dep.depart)}`} back />
      <BookingSteps current={2} hasPassengers />

      <div className="p-4 space-y-4">
        <p className="inline-flex items-start gap-2 text-[12.5px] text-ink-500 leading-relaxed">
          <ShieldCheck size={14} className="text-brand-600 mt-px shrink-0" />
          Every seat gets its own ticket and QR. Only the name and seat reach the crew.
        </p>

        {people.map((p, i) => (
          <div key={p.seat} className="bg-white rounded-xl border border-ink-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserRound size={15} className="text-ink-400" />
              <span className="text-[13.5px] font-medium text-ink-900">Passenger {i + 1}</span>
              <Badge tone="brand" className="ml-auto">
                Seat {p.seat}
              </Badge>
            </div>
            <div className="space-y-3">
              <Field label="Full name" required>
                <Input
                  value={p.name}
                  onChange={(e) => setP(i, 'name', e.target.value)}
                  placeholder="As written on the ID"
                />
              </Field>
              {i === 0 && (
                <Field label="Mobile number" required hint="Trip reminders and the e-ticket are sent to this number">
                  <Input value={p.phone} onChange={(e) => setP(i, 'phone', e.target.value)} />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Concession">
                  <Select value={p.concession} onChange={(e) => setP(i, 'concession', e.target.value)}>
                    <option value="">None</option>
                    <option value="student">Student</option>
                    <option value="elderly">Elderly 60+</option>
                    <option value="disabled">Disability</option>
                  </Select>
                </Field>
                {reserved && (
                  <Field label="ID number" required hint="Checked at the terminal gate on this service">
                    <Input value={p.idNo} onChange={(e) => setP(i, 'idNo', e.target.value)} />
                  </Field>
                )}
              </div>
            </div>
          </div>
        ))}

        <Checkbox
          checked={save}
          onChange={(e) => setSave(e.target.checked)}
          label="Save these passengers for next time"
          hint="Stored on your device and in your account only."
        />
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12.5px] text-ink-500">
            {people.length} {people.length === 1 ? 'passenger' : 'passengers'}
          </span>
          <span className="text-[16px] font-semibold text-ink-900">{MMK(total)}</span>
        </div>
        <Button variant="primary" full size="lg" disabled={!ready} onClick={next}>
          Continue to payment
        </Button>
      </div>
    </div>
  )
}
