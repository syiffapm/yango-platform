import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Tag } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { Input } from '../../../components/ui/Field.jsx'
import BookingSteps from '../../../components/domain/BookingSteps.jsx'
import BrandTile from '../../../components/domain/BrandTile.jsx'
import PaymentSheet from '../../../components/domain/PaymentSheet.jsx'
import { paymentMethods, methodById } from '../../../data/payments.js'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { useBooking } from '../booking.jsx'
import { findDeparture, isSeatReserved } from '../../../lib/schedule.js'
import { routes, stops, terminals } from '../../../data/geo.js'
import { MMK, dt, timeOnly } from '../../../lib/format.js'
import { pnr as makePnr, signedQr } from '../../../lib/id.js'
const DISCOUNTS = [
  { value: '', label: 'No discount' },
  { value: 'student', label: 'Student — half price' },
  { value: 'elderly', label: 'Age 60+ — half price' },
]
export default function ReviewPay() {
  const { routeId, depId } = useParams()
  const nav = useNavigate()
  const { db, update, notify } = useDb()
  const [ses] = useSession('citizen')
  const toast = useToast()
  const { draft, patch, reset } = useBooking()
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState(null)
  const [sheet, setSheet] = useState(false)
  const dep = findDeparture(depId, db)
  const route = routes.find((r) => r.id === routeId)
  if (!dep || !route || draft.seats.length === 0) {
    return (
      <Empty title="Your seat hold has ended" hint="Seats are held for 10 minutes. Please pick a departure again." />
    )
  }
  const reserved = isSeatReserved(dep)
  const nameOf = (id) => [...stops, ...terminals].find((s) => s.id === id)?.name || id
  const qty = draft.seats.length
  const base = dep.fare * qty
  const discountCount = draft.passengers.length
    ? draft.passengers.filter((p) => p.concession).length
    : draft.concession
      ? qty
      : 0
  const discountOff = Math.round(dep.fare * discountCount * 0.5)
  const promoOff = applied ? Math.round((base - discountOff) * 0.1) : 0
  // YPS card and YPS QR are cheaper than cash on YBS lines; the saving is per seat.
  const ypsOff = (methodById(draft.method)?.discount || 0) * qty
  const total = Math.max(0, base - discountOff - promoOff - ypsOff)
  const walletShort = draft.method === 'wallet' && db.wallet.balance < total
  const reference = `YG${dep.id
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-6)
    .toUpperCase()}${qty}`
  const applyPromo = () => {
    if (promo.trim().toUpperCase() === 'THADINGYUT') {
      setApplied('THADINGYUT')
      toast({ title: 'Discount added', body: '10% off this booking.' })
    } else toast({ title: 'That code does not work', body: 'Check the spelling and try again.', kind: 'error' })
  }
  const issueTickets = () => {
    const id = `TK-${3000 + db.tickets.length}`
    const code = makePnr()
    const people = draft.passengers.length
      ? draft.passengers
      : draft.seats.map((seat) => ({
          seat,
          name: ses.name || 'Demo Citizen',
          phone: ses.phone || '+95 9 7700 1234',
          concession: draft.concession || '',
        }))

    // One ticket and one QR per seat, so travellers can board separately.
    const passengers = people.map((p, i) => ({
      ...p,
      ticketNo: `${code}-${i + 1}`,
      qr: signedQr({ booking: code, seat: p.seat, dep: dep.id, n: i + 1 }),
    }))
    update((d) => {
      if (!dep.synthetic) {
        const x = d.departures.find((y) => y.id === depId)
        if (x) x.soldSeats.push(...draft.seats)
      }
      d.tickets.unshift({
        id,
        kind: reserved ? 'scheduled' : 'urban',
        route: route.id,
        operator: dep.operator,
        fare: Math.round(total / qty),
        qty,
        passenger: passengers[0]?.name || ses.name || 'Demo Citizen',
        phone: ses.phone || passengers[0]?.phone || '+95 9 7700 1234',
        passengers,
        purchasedAt: new Date().toISOString(),
        departureId: dep.id,
        departAt: dep.depart,
        arriveAt: dep.arrive,
        validUntil: reserved
          ? dep.arrive
          : (() => {
              const e = new Date(dep.depart)
              e.setHours(23, 59, 0, 0)
              return e.toISOString()
            })(),
        seats: draft.seats,
        seatsReserved: reserved,
        boardingPoint: draft.boardingPoint,
        droppingPoint: draft.droppingPoint,
        status: 'booked',
        pnr: code,
        vehicle: dep.vehicle,
        method: draft.method,
        concession: draft.concession || null,
        qr: passengers[0]?.qr,
      })
      if (draft.method === 'wallet') {
        d.wallet.balance -= total
        d.wallet.history.unshift({
          id: `W${Date.now()}`,
          at: new Date().toISOString(),
          type: 'payment',
          amount: -total,
          note: `Ticket ${code} · ${route.line}`,
        })
      }
    })
    notify({
      audience: 'citizen',
      title: 'Ticket ready',
      body: `${code} · ${route.line} ${route.name}, ${dt(dep.depart)}. ${qty} ticket${qty > 1 ? 's' : ''}.`,
      deepLink: '/citizen/tickets',
    })
    toast({ title: 'Ticket ready', body: `${qty} ticket${qty > 1 ? 's' : ''} sent to your phone.` })
    reset()
    setSheet(false)
    nav(`/citizen/ticket/${id}`)
  }
  return (
    <div>
      <AppBar title="Check and pay" subtitle={`${route.line} · ${dt(dep.depart)}`} back />
      <BookingSteps current={reserved || qty > 1 ? 3 : 2} hasPassengers={reserved || qty > 1} />

      <div className="p-4 space-y-4">
        {/* trip summary in plain words */}
        <div className="bg-white rounded-xl border border-ink-200 p-4">
          <p className="text-[13.5px] font-semibold text-ink-900 mb-3">Your trip</p>
          <div className="flex items-center gap-2 text-[14px] text-ink-900">
            <span className="truncate">{nameOf(draft.boardingPoint)}</span>
            <ArrowRight size={14} className="text-ink-300 shrink-0" />
            <span className="truncate">{nameOf(draft.droppingPoint)}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-ink-100">
            {[
              ['Leaves', timeOnly(dep.depart)],
              ['Arrives (about)', timeOnly(dep.arrive)],
              [qty > 1 ? 'Tickets' : 'Ticket', qty],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{k}</p>
                <p className="text-[14px] font-semibold text-ink-900 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] text-ink-500 mt-3">
            {new Date(dep.depart).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })} · bus{' '}
            {db.vehicles.find((v) => v.id === dep.vehicle)?.plate} · seat {draft.seats.join(', ')}
          </p>
        </div>

        {/* who is travelling */}
        {draft.passengers.length > 0 && (
          <div className="bg-white rounded-xl border border-ink-200 p-4">
            <p className="text-[13.5px] font-semibold text-ink-900 mb-2">Who is travelling</p>
            <div className="space-y-1.5">
              {draft.passengers.map((p) => (
                <div key={p.seat} className="flex items-center gap-2 text-[13.5px]">
                  <Badge tone="brand">Seat {p.seat}</Badge>
                  <span className="flex-1 text-ink-800 truncate">{p.name}</span>
                  {p.concession && <Badge tone="green">Half price</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* discount, only when it is the buyer alone */}
        {draft.passengers.length === 0 && (
          <div>
            <p className="text-[13px] font-medium text-ink-600 mb-2">Any discount?</p>
            <div className="grid grid-cols-3 gap-2">
              {DISCOUNTS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => patch({ concession: d.value })}
                  className={`rounded-lg border px-2 py-2.5 text-[13px] font-medium ${(draft.concession || '') === d.value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-ink-400 mt-1.5">Bring your card — the conductor may ask to see it.</p>
          </div>
        )}

        {/* promo */}
        <div className="bg-white rounded-xl border border-ink-200 p-4">
          <p className="text-[13.5px] font-semibold text-ink-900 mb-2">Have a promo code?</p>
          <div className="flex gap-2">
            <Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="THADINGYUT" />
            <Button icon={Tag} onClick={applyPromo}>
              Use
            </Button>
          </div>
          {applied && (
            <Badge tone="green" className="mt-2">
              {applied} · 10% off
            </Badge>
          )}
        </div>

        {/* payment method with brand marks */}
        <div>
          <p className="text-[13px] font-medium text-ink-600 mb-2">How would you like to pay?</p>
          <div className="space-y-2">
            {paymentMethods.map((m) => {
              const on = draft.method === m.id
              const short = m.id === 'wallet' && db.wallet.balance < total
              return (
                <button
                  key={m.id}
                  onClick={() => patch({ method: m.id })}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${on ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-ink-200 bg-white'}`}
                >
                  <BrandTile method={m} size={34} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-medium text-ink-900">{m.name}</span>
                    <span className={`block text-[12.5px] ${short ? 'text-red-600' : 'text-ink-500'}`}>
                      {m.id === 'wallet' ? `Balance ${MMK(db.wallet.balance)}${short ? ' — not enough' : ''}` : m.note}
                    </span>
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${on ? 'border-brand-600 bg-brand-600' : 'border-ink-300'}`}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* price */}
        <div className="bg-white rounded-xl border border-ink-200 p-4">
          <dl className="space-y-2 text-[13.5px]">
            {[
              [`Fare × ${qty}`, MMK(base)],
              discountCount > 0 && ['Discount', `− ${MMK(discountOff)}`],
              applied && ['Promo code', `− ${MMK(promoOff)}`],
              ypsOff > 0 && ['YPS fare discount', `− ${MMK(ypsOff)}`],
            ]
              .filter(Boolean)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="text-ink-800">{v}</dd>
                </div>
              ))}
            <div className="flex justify-between pt-2 border-t border-ink-100">
              <dt className="text-[14px] font-medium text-ink-900">To pay</dt>
              <dd className="text-[18px] font-semibold text-brand-700">{MMK(total)}</dd>
            </div>
          </dl>
          <p className="text-[12px] text-ink-400 mt-3 leading-relaxed">
            Taxes and fees are already included.{' '}
            {reserved
              ? 'Cancel more than 24 hours before you travel and you get 90% back.'
              : 'City tickets are valid until 23:59 on the day you travel.'}
          </p>
        </div>
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <Button variant="primary" full size="lg" disabled={walletShort} onClick={() => setSheet(true)}>
          Pay {MMK(total)}
        </Button>
        <p className="text-[11.5px] text-ink-400 text-center mt-2 inline-flex items-center gap-1 w-full justify-center">
          <ShieldCheck size={11} /> Your card or wallet details are never stored by YanGo
        </p>
      </div>

      <PaymentSheet
        open={sheet}
        onClose={() => setSheet(false)}
        methodId={draft.method}
        amount={total}
        reference={reference}
        onPaid={issueTickets}
      />
    </div>
  )
}
