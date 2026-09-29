import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Accessibility, Armchair, BadgeCheck, Bus, ChevronDown, Clock, History, Star, Wifi } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Pills } from '../../../components/ui/Tabs.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useT } from '../../../lib/i18n.jsx'
import { departuresFor, seatsSoldFor, isSeatReserved } from '../../../lib/schedule.js'
import { routes, stops, terminals } from '../../../data/geo.js'
import { MMK, timeOnly } from '../../../lib/format.js'
const nameOf = (id) => [...stops, ...terminals].find((s) => s.id === id)?.name || id
function DepartureCard({ dep, db, reserved, onPick, past, t }) {
  const op = (db.operators || []).find((o) => o.id === dep.operator)
  const veh = db.vehicles.find((v) => v.id === dep.vehicle)
  const mins = Math.round((new Date(dep.arrive) - new Date(dep.depart)) / 60000)
  const full = dep.left <= 0
  return (
    <button
      disabled={past || full}
      onClick={onPick}
      className={`w-full text-left bg-white rounded-xl border p-3.5 active:bg-ink-50 disabled:cursor-default ${past ? 'border-ink-150 border-ink-200 opacity-60' : 'border-ink-200'} ${full && !past ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-[19px] font-semibold tabular-nums leading-none ${past ? 'text-ink-500 line-through' : 'text-ink-900'}`}
            >
              {timeOnly(dep.depart)}
            </span>
            <span className="text-[12.5px] text-ink-400">→ {timeOnly(dep.arrive)}</span>
          </div>
          <p className="text-[12.5px] text-ink-500 mt-1 inline-flex items-center gap-1">
            <Clock size={11} />
            {mins < 60
              ? `${mins} ${t('common.min')}`
              : `${Math.round(mins / 60)} h ${mins % 60} ${t('common.min')}`} · {veh?.plate}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-[16px] font-semibold leading-none ${past ? 'text-ink-400' : 'text-brand-700'}`}>
            {MMK(dep.fare).replace(' MMK', '')}
          </p>
          <p className="text-[11.5px] text-ink-400 mt-0.5">MMK {reserved ? 'per seat' : 'per rider'}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-ink-100">
        <Badge tone="slate">
          <Bus size={10} /> {op?.short}
        </Badge>
        {op && (
          <Badge tone="amber" icon={Star}>
            {op.rating}
          </Badge>
        )}
        <Badge tone="brand" icon={Armchair}>
          {veh?.seatLayout?.replace('coach-', '').replace('-', '–') || 'standard'}
        </Badge>
        {veh?.amenities?.includes('Wi-Fi') && (
          <Badge tone="blue" icon={Wifi}>
            Wi-Fi
          </Badge>
        )}
        {veh?.amenities?.includes('Wheelchair') && (
          <Badge tone="blue" icon={Accessibility}>
            Step-free
          </Badge>
        )}
        {!past && (
          <Badge tone="green" icon={BadgeCheck}>
            {t('common.licensed')}
          </Badge>
        )}
        <Badge tone={past ? 'slate' : dep.left < 6 ? 'red' : dep.left < 15 ? 'amber' : 'green'} className="ml-auto">
          {past ? t('book.departed') : full ? t('book.full') : `${dep.left} ${t('common.seatsLeft')}`}
        </Badge>
      </div>
    </button>
  )
}

/** Step 2 of the journey: which bus, at what time. Same screen for city and intercity. */
export default function DeparturePicker() {
  const { routeId } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { db } = useDb()
  const { t } = useT()
  const when = params.get('when')
  const whenTs = when && when !== 'now' ? new Date(when).getTime() : Date.now()
  const startDay = useMemo(() => {
    const midnight = new Date()
    midnight.setHours(0, 0, 0, 0)
    const diff = Math.floor((whenTs - midnight.getTime()) / 86400000)
    return Math.max(0, Math.min(4, diff))
  }, [whenTs])
  const [day, setDay] = useState(startDay)
  const [sort, setSort] = useState('time')
  const [showEarlier, setShowEarlier] = useState(false)
  const route = routes.find((r) => r.id === routeId)
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      value: i,
      label:
        i === 0
          ? t('common.today')
          : i === 1
            ? t('common.tomorrow')
            : d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
    }
  })
  const { upcoming, earlier, firstTomorrow } = useMemo(() => {
    if (!route) return { upcoming: [], earlier: [], firstTomorrow: null }
    const cut = day === startDay ? whenTs : Date.now()
    const withSeats = departuresFor(routeId, day, db).map((d) => {
      const sold = seatsSoldFor(d, db)
      return { ...d, sold, left: d.capacity - sold.length }
    })
    const after = withSeats.filter((d) => new Date(d.depart).getTime() > cut - 60000)
    const before = withSeats.filter((d) => new Date(d.depart).getTime() <= cut - 60000)
    const sorted =
      sort === 'price'
        ? [...after].sort((a, b) => a.fare - b.fare)
        : sort === 'seats'
          ? [...after].sort((a, b) => b.left - a.left)
          : after
    let next = null
    if (after.length === 0) {
      for (let d = day + 1; d <= 4 && !next; d++) {
        const list = departuresFor(routeId, d, db)
        if (list.length) next = { dep: list[0], day: d }
      }
    }
    return { upcoming: sorted.slice(0, 40), earlier: before.slice(-6).reverse(), firstTomorrow: next }
  }, [route, routeId, day, db, sort, whenTs, startDay])
  if (!route) return <Empty title="Route not found" />
  const reserved = isSeatReserved({ route: routeId })
  const pick = (dep) => nav(`/citizen/book/${routeId}/seats/${dep.id}`)
  return (
    <div>
      <AppBar
        title={`${route.line} · ${route.name}`}
        subtitle={`${nameOf(route.stops[0])} → ${nameOf(route.stops[route.stops.length - 1])} · ${route.class}`}
        back
      />

      <div className="px-4 pt-3 pb-2 border-b border-ink-100 bg-white sticky top-[61px] z-10">
        <div className="flex gap-1.5 overflow-x-auto scroll-thin pb-1">
          {days.map((d) => (
            <button
              key={d.value}
              onClick={() => {
                setDay(d.value)
                setShowEarlier(false)
              }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition ${day === d.value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-600'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12.5px] text-ink-500">
            {upcoming.length >= 40 ? t('book.nextDepartures') : `${upcoming.length} ${t('book.departures')}`}
          </span>
          <Pills
            value={sort}
            onChange={setSort}
            options={[
              { value: 'time', label: t('common.time') },
              { value: 'price', label: t('common.price') },
              { value: 'seats', label: t('common.seats') },
            ]}
          />
        </div>
      </div>

      <div className="p-4 space-y-2">
        {/* nothing left today — show what ran and where the next service is */}
        {upcoming.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-1">
            <p className="text-[14px] font-semibold text-amber-900">{t('book.dayFinished')}</p>
            <p className="text-[13px] text-amber-800 mt-1 leading-relaxed">
              {route.class === 'Intercity' ? t('book.noneLeftIntercity') : `${t('book.lineHours')} ${route.hours}.`}
            </p>
            {firstTomorrow && (
              <Button
                size="sm"
                variant="primary"
                className="mt-3"
                onClick={() => {
                  setDay(firstTomorrow.day)
                  setShowEarlier(false)
                }}
              >
                {t('book.nextService')} · {days[firstTomorrow.day]?.label} {timeOnly(firstTomorrow.dep.depart)}
              </Button>
            )}
          </div>
        )}

        {upcoming.map((dep) => (
          <DepartureCard key={dep.id} dep={dep} db={db} reserved={reserved} t={t} onPick={() => pick(dep)} />
        ))}

        {/* earlier runs stay visible so the screen is never blank */}
        {earlier.length > 0 && (
          <>
            <button
              onClick={() => setShowEarlier((v) => !v)}
              className="w-full flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-left active:bg-ink-50"
            >
              <History size={15} className="text-ink-400" />
              <span className="flex-1 text-[13.5px] text-ink-700">
                {t('book.earlier')} ({earlier.length})
              </span>
              <ChevronDown
                size={15}
                className={`text-ink-400 transition-transform ${showEarlier ? 'rotate-180' : ''}`}
              />
            </button>
            {showEarlier &&
              earlier.map((dep) => <DepartureCard key={dep.id} dep={dep} db={db} reserved={reserved} t={t} past />)}
          </>
        )}

        <p className="text-[12px] text-ink-400 leading-relaxed pt-1">
          {reserved
            ? 'Intercity seats are reserved — the seat you choose is yours for the whole journey.'
            : 'City services run to a headway. Choosing a time reserves your fare for that run; on board, seating is first come, first served.'}
        </p>
      </div>
    </div>
  )
}
