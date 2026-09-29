import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Download,
  MapPin,
  Navigation,
  Share2,
  WifiOff,
} from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Qr from '../../../components/ui/Qr.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { useT } from '../../../lib/i18n.jsx'
import { findDeparture } from '../../../lib/schedule.js'
import { routes, stops, terminals } from '../../../data/geo.js'
import { MMK, timeOnly, relative } from '../../../lib/format.js'
const nameOf = (x) => [...stops, ...terminals].find((s) => s.id === x)?.name || x
const pad = (n) => String(n).padStart(2, '0')
const stamp = (iso) => {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
}
export default function Eticket() {
  const { id } = useParams()
  const { db, update, notify } = useDb()
  const toast = useToast()
  const { t, lang } = useT()
  const [calOpen, setCalOpen] = useState(false)
  const ticket = db.tickets.find((t) => t.id === id)
  if (!ticket) return <Empty title="Ticket not found" />
  const route = routes.find((r) => r.id === ticket.route)
  const dep = findDeparture(ticket.departureId, db)
  const op = (db.operators || []).find((o) => o.id === ticket.operator)
  const veh = db.vehicles.find((v) => v.id === (dep?.vehicle || ticket.vehicle))
  const drv = db.drivers.find((d) => d.vehicle === veh?.id)
  const departAt = ticket.departAt || dep?.depart
  const arriveAt = ticket.arriveAt || dep?.arrive
  const minsToDeparture = departAt ? Math.round((new Date(departAt) - Date.now()) / 60000) : null

  // One ticket per seat; fall back to a single ticket for older bookings.
  const passengers = ticket.passengers?.length
    ? ticket.passengers
    : [{ name: ticket.passenger, seat: ticket.seats?.[0], ticketNo: ticket.pnr, qr: ticket.qr || ticket.id }]
  const canCheckIn =
    ticket.status === 'booked' && minsToDeparture !== null && minsToDeparture < 60 && minsToDeparture > -30
  // Live tracking only makes sense once the bus is actually running that day.
  const trackingOpen =
    departAt && minsToDeparture <= 30 && (!arriveAt || Date.now() < new Date(arriveAt).getTime() + 15 * 60000)
  const checkIn = () => {
    update((d) => {
      const t = d.tickets.find((x) => x.id === id)
      t.checkedInAt = new Date().toISOString()
      t.status = 'checked_in'
    })
    notify({
      audience: 'citizen',
      title: 'You are checked in',
      body: `${ticket.pnr} — show the QR if the crew asks. Safe trip.`,
      deepLink: `/citizen/track/${id}`,
    })
    toast({ title: 'Checked in', body: 'The crew list now shows you as on board.' })
  }
  const title = `Bus ${route?.line} · ${nameOf(ticket.boardingPoint) || route?.name}`
  const details = `YanGo ticket ${ticket.pnr}. ${route?.name}. Seat ${ticket.seats?.join(', ')}. Operator ${op?.name}.`
  const place = nameOf(ticket.boardingPoint) || route?.name || ''
  const gcalUrl = departAt
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${stamp(departAt)}/${stamp(arriveAt || departAt)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(place)}`
    : '#'
  const downloadIcs = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YanGo//Ticket//EN',
      'BEGIN:VEVENT',
      `UID:${ticket.id}@yango`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(departAt)}`,
      `DTEND:${stamp(arriveAt || departAt)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${place}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Your bus leaves in an hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    a.download = `yango-${ticket.pnr}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: 'Added to your calendar', body: 'Open the downloaded file to save it on your phone.' })
    setCalOpen(false)
  }
  return (
    <div>
      <AppBar title="Your ticket" subtitle={`Code ${ticket.pnr}`} back />

      <div className="p-4">
        <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400" />
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-brand-600 text-white px-4 py-3.5">
            <div className="absolute inset-0 opacity-[0.10] pagoda-pattern pointer-events-none" aria-hidden />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[12.5px] text-white/70">
                  {new Date(departAt || ticket.purchasedAt).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                </p>
                <p className="text-[14px] font-semibold">
                  {route?.line} · {route?.name}
                </p>
              </div>
              <StatusPill
                status={ticket.status === 'checked_in' ? 'verified' : ticket.status}
                label={
                  {
                    active: t('common.active'),
                    booked: t('common.booked'),
                    used: t('common.used'),
                    checked_in: t('common.checkedIn'),
                    expired: t('common.expired'),
                  }[ticket.status]
                }
              />
            </div>
            <div className="relative flex items-center gap-2 mt-2.5 text-[13.5px]">
              <span className="truncate">{nameOf(ticket.boardingPoint)}</span>
              <ArrowRight size={13} className="opacity-60 shrink-0" />
              <span className="truncate">{nameOf(ticket.droppingPoint)}</span>
              <span className="ml-auto text-[15px] font-semibold tabular-nums">{timeOnly(departAt)}</span>
            </div>
          </div>

          {/* Every seat's QR lives in this one section — the crew scans them one after another. */}
          <div className="p-5 border-b border-dashed border-ink-200">
            {passengers.length > 1 && (
              <p className="text-[13px] text-ink-600 text-center mb-4">
                <strong className="text-ink-900">{passengers.length} passengers</strong> — one code for each seat. Show
                them one by one at the door.
              </p>
            )}

            <div className="divide-y divide-dashed divide-ink-200">
              {passengers.map((p, i) => (
                <div
                  key={p.ticketNo || i}
                  className={`text-center ${i === 0 ? 'pb-0' : 'pt-5'} ${i < passengers.length - 1 ? 'pb-5' : ''}`}
                >
                  {passengers.length > 1 && (
                    <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-2">
                      Ticket {i + 1} of {passengers.length}
                    </p>
                  )}
                  <Qr value={p.qr || ticket.id} size={passengers.length > 1 ? 148 : 168} className="mx-auto" />
                  <p className="text-[16px] font-bold tracking-[0.18em] text-ink-900 mt-3">
                    {p.ticketNo || ticket.pnr}
                  </p>
                  <p className="text-[13.5px] text-ink-700 mt-1">
                    {p.name}
                    {p.seat ? ` · seat ${p.seat}` : ''}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[12.5px] text-ink-400 inline-flex items-center gap-1 mt-4 w-full justify-center">
              <WifiOff size={11} /> Works without internet — just show
              {passengers.length > 1 ? ' these codes' : ' this code'}
            </p>
          </div>

          <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              ['Paid', MMK(ticket.fare * ticket.qty)],
              ['Bus company', op?.name],
              veh && ['Bus number', veh.plate],
              arriveAt && ['Arrives (about)', timeOnly(arriveAt)],
              !ticket.seatsReserved &&
                ticket.validUntil && [
                  'Good until',
                  `23:59, ${new Date(ticket.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
                ],
            ]
              .filter(Boolean)
              .map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{k}</p>
                  <p className="text-[13.5px] text-ink-900 mt-0.5">{v}</p>
                </div>
              ))}
          </div>

          {ticket.checkedInAt && (
            <div className="px-4 pb-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <p className="text-[13px] text-emerald-900">Checked in {relative(ticket.checkedInAt, lang)}.</p>
              </div>
            </div>
          )}

          {drv && ticket.seatsReserved && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <span className="w-8 h-8 rounded-full bg-ink-100 grid place-items-center text-[12.5px] font-semibold text-ink-600">
                  {drv.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink-900">{drv.name}</p>
                  <p className="text-[12px] text-ink-500">Your driver · {drv.rating} ★</p>
                </div>
                <Badge tone="green">Licensed</Badge>
              </div>
            </div>
          )}
        </div>

        {canCheckIn && !ticket.checkedInAt && (
          <Button variant="primary" full size="lg" className="mt-4" icon={CheckCircle2} onClick={checkIn}>
            I am here — check me in
          </Button>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3">
          <Button icon={CalendarPlus} onClick={() => setCalOpen(true)}>
            Calendar
          </Button>
          <Button
            icon={Share2}
            onClick={() =>
              toast({ title: 'Link copied', body: 'Anyone with the link can follow this trip until you arrive.' })
            }
          >
            Share
          </Button>
          {trackingOpen ? (
            <Button as={Link} to={`/citizen/track/${ticket.id}`} icon={Navigation} variant="primary">
              Track bus
            </Button>
          ) : (
            <Button icon={Navigation} disabled>
              Track bus
            </Button>
          )}
        </div>

        {!trackingOpen && departAt && (
          <p className="text-[12.5px] text-ink-400 text-center mt-2">
            Live tracking opens 30 minutes before the bus leaves.
          </p>
        )}

        {departAt && (
          <div className="mt-4 bg-white rounded-xl border border-ink-200 p-4">
            <p className="text-[13.5px] font-semibold text-ink-900 mb-2">On the day</p>
            <ul className="space-y-2 text-[13px] text-ink-600">
              <li className="flex gap-2">
                <MapPin size={13} className="text-brand-500 mt-0.5 shrink-0" />
                Be at {nameOf(ticket.boardingPoint)} a few minutes before {timeOnly(departAt)}
                {dep?.bay ? `, bay ${dep.bay}` : ''}.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={13} className="text-brand-500 mt-0.5 shrink-0" />
                Show the QR to the conductor, or tap “I am here” when the bus is close.
              </li>
              <li className="flex gap-2">
                <Download size={13} className="text-brand-500 mt-0.5 shrink-0" />
                The code is saved on your phone, so it still works with no signal.
              </li>
            </ul>
          </div>
        )}
      </div>

      <Modal
        open={calOpen}
        onClose={() => setCalOpen(false)}
        title="Add to your calendar"
        subtitle="We will remind you an hour before the bus leaves."
        width="max-w-sm"
      >
        <div className="space-y-2">
          <a
            href={gcalUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setCalOpen(false)}
            className="flex items-center gap-3 rounded-xl border border-ink-200 px-3.5 py-3 active:bg-ink-50"
          >
            <span className="w-8 h-8 rounded-lg bg-[#1a73e8] text-white grid place-items-center text-[12.5px] font-bold">
              G
            </span>
            <span className="flex-1 text-[14px] text-ink-900">Google Calendar</span>
            <ChevronRight size={15} className="text-ink-300" />
          </a>
          <button
            onClick={downloadIcs}
            className="w-full flex items-center gap-3 rounded-xl border border-ink-200 px-3.5 py-3 text-left active:bg-ink-50"
          >
            <span className="w-8 h-8 rounded-lg bg-ink-900 text-white grid place-items-center text-[12.5px] font-bold">
              📅
            </span>
            <span className="flex-1 text-[14px] text-ink-900">Phone calendar (Apple, Samsung, Outlook)</span>
            <ChevronRight size={15} className="text-ink-300" />
          </button>
        </div>
      </Modal>
    </div>
  )
}
