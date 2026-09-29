import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  Bus,
  MapPin,
  Navigation,
  Search as SearchIcon,
  ShieldAlert,
  Ticket,
  TriangleAlert,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useT } from '../../../lib/i18n.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import { useDb, useLiveVehicles } from '../../../lib/store.jsx'
import { outsideServiceHours, serviceStartLabel } from '../../../lib/serviceday.js'
import { useSession } from '../../../lib/session.jsx'
import { myTickets } from '../mine.js'
import { nearestPlaces, nextArrivalAt, occupancyTone } from '../arrivals.js'
import { stops } from '../../../data/geo.js'
import { MMK, relative } from '../../../lib/format.js'
const HOME_STOP = 'S03' // Hledan Junction — the simulated current location
export default function CitizenHome() {
  const { db } = useDb()
  const [ses] = useSession('citizen')
  const { t, lang } = useT()
  const nav = useNavigate()
  const allLive = useLiveVehicles()
  const live = allLive.filter((v) => v.transmitting)
  const asleep = outsideServiceHours()
  const stop = stops.find((s) => s.id === HOME_STOP)
  const places = nearestPlaces(stop, 6)
  const unread = db.notifications.filter((n) => n.audience === 'citizen' && !n.read).length
  const alerts = db.announcements.filter((a) => a.status === 'published')
  const activeTicket = myTickets(db, ses).find((t) => t.status === 'active')
  return (
    <div className="pb-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white px-4 pt-3 pb-7 rounded-b-[1.75rem]">
        <div className="absolute inset-0 opacity-[0.09] pagoda-pattern pointer-events-none" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12.5px] text-white/70">{t('home.greeting')}</p>
              <h1 className="text-[16px] font-semibold leading-tight">YanGo</h1>
              <p className="text-[13.5px] text-white/80 leading-tight">မြန်မာ့ဘတ်စ်ကားခရီး</p>
            </div>
            <Link to="/citizen/notifications" className="relative p-2 rounded-lg hover:bg-white/10">
              <Bell size={19} />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-300" />}
            </Link>
          </div>

          <button
            onClick={() => nav('/citizen/search')}
            className="w-full flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3.5 text-left shadow-md"
          >
            <SearchIcon size={18} className="text-brand-600" />
            <span className="text-[14.5px] text-ink-400">{t('home.searchPlaceholder')}</span>
          </button>

          <div className="flex gap-2 mt-4">
            {[
              { to: '/citizen/explore', icon: Bus, label: t('home.buyTicket') },
              { to: `/citizen/stop/${HOME_STOP}`, icon: MapPin, label: t('home.busStop') },
              { to: '/citizen/explore', icon: Navigation, label: t('home.routes') },
              { to: '/citizen/safety', icon: ShieldAlert, label: t('safety.title') },
            ].map((q) => (
              <Link
                key={q.label}
                to={q.to}
                className="flex-1 flex flex-col items-center gap-1.5 bg-white/12 hover:bg-white/20 active:bg-white/25 rounded-2xl py-3 transition-colors"
              >
                <q.icon size={19} strokeWidth={2.1} />
                <span className="text-[12px] font-medium leading-tight text-center">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 -mt-4">
        {activeTicket && (
          <Link
            to={`/citizen/ticket/${activeTicket.id}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-brand-200 shadow-sm px-3.5 py-3 mb-3"
          >
            <span className="w-9 h-9 rounded-lg bg-brand-50 grid place-items-center">
              <Ticket size={17} className="text-brand-600" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-ink-900">
                {t('home.activeTicket')} · {activeTicket.pnr}
              </p>
              <p className="text-[12.5px] text-ink-500">
                {t('home.validUntil')} · {MMK(activeTicket.fare * activeTicket.qty)}
              </p>
            </div>
            <Badge tone="green" dot>
              {t('common.active')}
            </Badge>
          </Link>
        )}

        {alerts.length > 0 && (
          <Link
            to="/citizen/alerts"
            className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mb-3"
          >
            <TriangleAlert size={15} className="text-amber-600 mt-px shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-amber-900">{alerts[0].title}</p>
              <p className="text-[12.5px] text-amber-800/80 truncate">{alerts[0].body}</p>
            </div>
          </Link>
        )}

        <div className="rounded-xl overflow-hidden border border-ink-200 mb-3">
          <MapView
            legend="simple"
            vehicles={live}
            height={260}
            showLabels={false}
            focus={stop}
            lockToFocus
            onVehicleClick={(v) => nav(`/citizen/route/${v.route}`)}
          />
        </div>

        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[14.5px] font-semibold text-ink-900">{t('home.nearby')}</p>
            <p className="text-[12.5px] text-ink-500 inline-flex items-center gap-1">
              <MapPin size={11} />
              {t('home.nearYou')} · {stop.name}
            </p>
          </div>
          {asleep ? (
            <Badge tone="slate">{t('home.resumes').replace('{t}', serviceStartLabel())}</Badge>
          ) : (
            <Badge tone="green" dot>
              {t('common.live')}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {places.map((p) => {
            const next = nextArrivalAt(p.id, live)
            const isTerminal = p.kind === 'terminal'
            return (
              <Link
                key={p.id}
                to={isTerminal ? `/citizen/terminal/${p.id}` : `/citizen/stop/${p.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-3 py-3 active:bg-ink-50"
              >
                <span
                  className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${isTerminal ? 'bg-brand-100' : 'bg-brand-50'}`}
                >
                  {isTerminal ? (
                    <Building2 size={17} className="text-brand-700" />
                  ) : (
                    <MapPin size={17} className="text-brand-600" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-ink-900 truncate">{p.name}</p>
                  <p className="text-[12px] text-ink-500 truncate">
                    {p.km < 0.12
                      ? t('home.rightHere')
                      : p.km < 1
                        ? `${Math.round(p.km * 1000)} m`
                        : `${p.km.toFixed(1)} km`}{' '}
                    · {p.lines.length} {t(p.lines.length === 1 ? 'explore.line' : 'explore.lines')}
                    {isTerminal ? ` · ${t('explore.intercity')}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.lines.slice(0, 4).map((r) => (
                      <span
                        key={r.id}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold text-white ${r.class === 'BRT' ? 'bg-brand-600' : r.class === 'Intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                      >
                        {r.line}
                      </span>
                    ))}
                    {p.lines.length > 4 && <span className="text-[11px] text-ink-400">+{p.lines.length - 4}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {next ? (
                    <>
                      <p className="text-[11px] font-bold text-ink-400 leading-none mb-1">{next.route.line}</p>
                      <p className="text-[17px] font-semibold text-brand-700 tabular-nums leading-none">
                        {next.etaMin}
                        <span className="text-[11.5px] font-normal text-ink-400 ml-0.5">{t('common.min')}</span>
                      </p>
                      <Badge tone={occupancyTone(next.occupancyPct)} className="mt-1">
                        {next.occupancyPct == null
                          ? t('occ.unknown')
                          : next.occupancyPct < 45
                            ? t('occ.empty')
                            : next.occupancyPct < 80
                              ? t('occ.some')
                              : t('occ.full')}
                      </Badge>
                    </>
                  ) : (
                    <span className="text-[12px] text-ink-400">
                      {asleep ? t('home.firstBus').replace('{t}', serviceStartLabel()) : t('home.noneSoon')}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Link
            to="/citizen/wallet"
            className="flex items-center gap-2.5 bg-white rounded-xl border border-ink-200 px-3 py-3"
          >
            <WalletIcon size={16} className="text-brand-600" />
            <div>
              <p className="text-[13px] font-medium text-ink-900">{t('home.wallet')}</p>
              <p className="text-[12.5px] text-ink-500">{MMK(db.wallet.balance)}</p>
            </div>
          </Link>
          <Link
            to="/citizen/sos"
            className="flex items-center gap-2.5 bg-red-50 rounded-xl border border-red-200 px-3 py-3"
          >
            <ShieldAlert size={16} className="text-red-600" />
            <div>
              <p className="text-[13px] font-medium text-red-900">{t('home.emergency')}</p>
              <p className="text-[12.5px] text-red-700/70">{t('home.holdSos')}</p>
            </div>
          </Link>
        </div>

        <p className="text-[12px] text-ink-400 text-center mt-5">
          {t('home.demoNote')} · {relative(new Date().toISOString(), lang)}
        </p>
      </div>
    </div>
  )
}
