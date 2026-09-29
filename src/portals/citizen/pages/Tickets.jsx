import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bus, CalendarDays, MapPin, Plus, QrCode, Ticket as TicketIcon } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Pills } from '../../../components/ui/Tabs.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { myTickets } from '../mine.js'
import { useT } from '../../../lib/i18n.jsx'
import { findDeparture } from '../../../lib/schedule.js'
import { routes, stops, terminals } from '../../../data/geo.js'
import { MMK, timeOnly } from '../../../lib/format.js'
const nameOf = (id) => [...stops, ...terminals].find((s) => s.id === id)?.name || id

/** The big date block, the way a rail or coach app leads its ticket list. */
function DateBlock({ iso, dim }) {
  const d = new Date(iso)
  return (
    <div
      className={`shrink-0 w-14 rounded-lg border text-center py-1.5 ${dim ? 'border-ink-200 bg-ink-50' : 'border-brand-200 bg-brand-50'}`}
    >
      <p className={`text-[11px] uppercase tracking-wider ${dim ? 'text-ink-400' : 'text-gold-700'}`}>
        {d.toLocaleDateString('en-GB', { month: 'short' })}
      </p>
      <p className={`text-[20px] font-bold leading-none ${dim ? 'text-ink-500' : 'text-gold-700'}`}>
        {String(d.getDate()).padStart(2, '0')}
      </p>
      <p className={`text-[11px] ${dim ? 'text-ink-400' : 'text-gold-600'}`}>
        {d.toLocaleDateString('en-GB', { weekday: 'short' })}
      </p>
    </div>
  )
}

/** Passenger-facing status wording, in the language the app is set to. */
const statusLabel = (status, t) =>
  ({
    active: t('common.active'),
    booked: t('common.booked'),
    used: t('common.used'),
    checked_in: t('common.checkedIn'),
    expired: t('common.expired'),
  })[status]

export default function Tickets() {
  const { db } = useDb()
  const [ses] = useSession('citizen')
  const { t } = useT()
  const [tab, setTab] = useState('upcoming')
  const enrich = (tk) => {
    const dep = findDeparture(tk.departureId, db)
    const route = routes.find((r) => r.id === tk.route)
    const op = (db.operators || []).find((o) => o.id === tk.operator)
    const first = route?.stops?.[0]
    const last = route?.stops?.[route.stops.length - 1]
    return {
      ...tk,
      dep,
      route,
      op,
      when: tk.departAt || dep?.depart || tk.purchasedAt,
      fromName: nameOf(tk.boardingPoint || first),
      toName: nameOf(tk.droppingPoint || last),
    }
  }
  const all = myTickets(db, ses).map(enrich)
  const upcoming = all
    .filter((x) => ['booked', 'active', 'checked_in'].includes(x.status))
    .sort((a, b) => new Date(a.when) - new Date(b.when))
  const past = all
    .filter((x) => !['booked', 'active', 'checked_in'].includes(x.status))
    .sort((a, b) => new Date(b.when) - new Date(a.when))
  const shown = tab === 'upcoming' ? upcoming : past
  const next = upcoming[0]
  return (
    <div>
      <AppBar
        title={t('ticket.myTickets')}
        right={
          <Button size="xs" variant="primary" icon={Plus} as={Link} to="/citizen/explore">
            {t('ticket.buyTicket')}
          </Button>
        }
      />

      <div className="px-4 pt-3">
        <Pills
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: `${t('ticket.upcoming')} (${upcoming.length})` },
            { value: 'past', label: `${t('ticket.history')} (${past.length})` },
          ]}
        />
      </div>

      {tab === 'upcoming' && next && (
        <div className="px-4 pt-3">
          <Link
            to={`/citizen/ticket/${next.id}`}
            className="block rounded-2xl overflow-hidden border border-brand-200 bg-white shadow-sm"
          >
            <div className="h-1.5 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400" />
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-800 to-brand-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] font-medium inline-flex items-center gap-1.5">
                <CalendarDays size={13} />
                {new Date(next.when).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })}
              </span>
              <span className="text-[16px] font-semibold tabular-nums">{timeOnly(next.when)}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-1.5 py-0.5 rounded text-[12px] font-bold text-white ${next.route?.class === 'BRT' ? 'bg-brand-600' : next.route?.class === 'Intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                >
                  {next.route?.line}
                </span>
                <span className="font-mono text-[13.5px] font-semibold text-ink-900">{next.pnr}</span>
                <StatusPill
                  status={next.status === 'checked_in' ? 'verified' : next.status}
                  label={statusLabel(next.status, t)}
                  className="ml-auto"
                />
              </div>

              <div className="flex items-center gap-2 text-[13.5px] text-ink-800">
                <span className="truncate">{next.fromName}</span>
                <ArrowRight size={13} className="text-ink-300 shrink-0" />
                <span className="truncate">{next.toName}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-ink-100">
                <Badge tone="slate">
                  <Bus size={10} /> {next.op?.short}
                </Badge>
                <Badge tone="brand">
                  {next.seatsReserved
                    ? `${t('common.seats')} ${next.seats?.join(', ')}`
                    : `${next.qty} × ${t('common.seats')}`}
                </Badge>
                <span className="ml-auto text-[14px] font-semibold text-gold-600">{MMK(next.fare * next.qty)}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2">
                <QrCode size={15} className="text-brand-700" />
                <span className="text-[13px] text-brand-900 flex-1">{t('ticket.offlineQr')}</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="p-4 space-y-2">
        {shown.slice(tab === 'upcoming' && next ? 1 : 0).map((tk) => (
          <Link
            key={tk.id}
            to={`/citizen/ticket/${tk.id}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 p-3 active:bg-ink-50"
          >
            <DateBlock iso={tk.when} dim={tab === 'past'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-1.5 py-0.5 rounded text-[11.5px] font-bold text-white ${tk.route?.class === 'BRT' ? 'bg-brand-600' : tk.route?.class === 'Intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                >
                  {tk.route?.line}
                </span>
                <span className="font-mono text-[13px] text-ink-600">{tk.pnr}</span>
              </div>
              <p className="text-[13.5px] text-ink-900 mt-1 truncate">{tk.route?.name}</p>
              <p className="text-[12px] text-ink-400 inline-flex items-center gap-1 mt-0.5">
                <MapPin size={10} />
                {tk.fromName} → {tk.toName} · {timeOnly(tk.when)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <StatusPill
                status={tk.status === 'checked_in' ? 'verified' : tk.status}
                label={statusLabel(tk.status, t)}
              />
              <p className="text-[13px] font-semibold text-gold-600 mt-1.5">{MMK(tk.fare * tk.qty)}</p>
            </div>
          </Link>
        ))}

        {shown.length === 0 && (
          <Empty
            icon={TicketIcon}
            title={t('ticket.none')}
            hint={tab === 'upcoming' ? t('ticket.noneHint') : undefined}
            action={
              tab === 'upcoming' && (
                <Button size="sm" variant="primary" icon={Plus} as={Link} to="/citizen/explore">
                  {t('ticket.buyTicket')}
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}
