import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  CalendarClock,
  Clock,
  MapPin,
  Search as SearchIcon,
  Star,
  X,
} from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Input } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useT } from '../../../lib/i18n.jsx'
import { planJourney, nearestPlaces } from '../arrivals.js'
import { stops, terminals } from '../../../data/geo.js'
const ALL = [...stops, ...terminals]
const nameOf = (id) => ALL.find((s) => s.id === id)?.name || ''
const HOME_STOP = 'S03'

/** Two steps: say where you are going, then confirm when — nothing else. */
export default function Search() {
  const { db } = useDb()
  const { t } = useT()
  const nav = useNavigate()
  const [from, setFrom] = useState(HOME_STOP)
  const [to, setTo] = useState('')
  const [picking, setPicking] = useState('to') // 'to' | 'from' | null
  const [q, setQ] = useState('')
  const [whenMode, setWhenMode] = useState('now')
  const [whenAt, setWhenAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60000)
    d.setMinutes(0, 0, 0)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const matches = useMemo(() => {
    if (!q.trim()) return []
    const needle = q.toLowerCase()
    return ALL.filter((s) => s.name.toLowerCase().includes(needle) || (s.nameMM || '').includes(q)).slice(0, 8)
  }, [q])
  const here = ALL.find((x) => x.id === from) || ALL[0]
  const nearby = useMemo(() => nearestPlaces(here, 4).filter((p) => p.id !== from), [here, from])
  const options = useMemo(() => (from && to ? planJourney(from, to) : []), [from, to])
  const best = options[0]
  const choose = (id) => {
    if (picking === 'from') setFrom(id)
    else setTo(id)
    setQ('')
    setPicking(null)
  }
  const search = () => {
    const when = whenMode === 'now' ? 'now' : new Date(whenAt).toISOString()
    nav(`/citizen/results?from=${from}&to=${to}&when=${encodeURIComponent(when)}`)
  }
  const Suggestion = ({ icon: Icon, title, sub, onClick, badge }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 border-b border-ink-50 last:border-0 text-left active:bg-ink-50"
    >
      <Icon size={15} className="text-ink-400 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] text-ink-900 truncate">{title}</span>
        {sub && <span className="block text-[12.5px] text-ink-400 truncate">{sub}</span>}
      </span>
      {badge}
    </button>
  )

  /* ------------------------------------------------- picker (search mode) */ if (picking) {
    return (
      <div>
        <AppBar
          title={picking === 'to' ? t('search.destination') : t('search.startingFrom')}
          back
          onBack={() => setPicking(null)}
        />
        <div className="p-4">
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={picking === 'to' ? t('search.searchTo') : t('search.searchFrom')}
              className="w-full pl-9 pr-10 py-3 text-[14px] bg-white border-2 border-brand-400 rounded-xl outline-none"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                aria-label="Clear"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-400 hover:bg-ink-100"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {matches.length > 0 && (
            <div className="mt-3 bg-white rounded-xl border border-ink-200 overflow-hidden">
              {matches.map((s) => (
                <Suggestion
                  key={s.id}
                  icon={s.bays ? Building2 : MapPin}
                  title={s.name}
                  sub={s.nameMM}
                  badge={s.bays ? <Badge tone="brand">{t('explore.terminals')}</Badge> : null}
                  onClick={() => choose(s.id)}
                />
              ))}
            </div>
          )}

          {!q && (
            <>
              <p className="text-[12.5px] font-semibold uppercase tracking-wider text-ink-400 mt-5 mb-2">
                {t('search.savedPlaces')}
              </p>
              <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
                {db.savedPlaces.map((p) => (
                  <Suggestion key={p.id} icon={Star} title={p.label} sub={p.name} onClick={() => choose(p.stop)} />
                ))}
              </div>

              <p className="text-[12.5px] font-semibold uppercase tracking-wider text-ink-400 mt-5 mb-2">
                {t('search.recent')}
              </p>
              <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
                {['S01', 'S11', 'T01'].map((id) => (
                  <Suggestion key={id} icon={Clock} title={nameOf(id)} onClick={() => choose(id)} />
                ))}
              </div>

              <p className="text-[12.5px] font-semibold uppercase tracking-wider text-ink-400 mt-5 mb-2">
                {t('search.nearby')}
              </p>
              <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
                {nearby.map((p) => (
                  <Suggestion
                    key={p.id}
                    icon={p.bays ? Building2 : MapPin}
                    title={p.name}
                    sub={`${p.km < 1 ? `${Math.round(p.km * 1000)} m` : `${p.km.toFixed(1)} km`} away`}
                    onClick={() => choose(p.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------ plan + preview */ return (
    <div>
      <AppBar title={t('search.title')} subtitle={t('search.subtitle')} back />

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-ink-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center pt-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              <span className="w-px h-7 bg-ink-200 my-1" />
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <button
                onClick={() => setPicking('from')}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-ink-200 text-[14px] text-ink-800 truncate active:bg-ink-50"
              >
                {nameOf(from)}
              </button>
              <button
                onClick={() => setPicking('to')}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-[14px] truncate active:bg-ink-50 ${to ? 'border-ink-200 text-ink-800' : 'border-brand-400 bg-brand-50 text-brand-700 font-medium'}`}
              >
                {to ? nameOf(to) : t('search.destination')}
              </button>
            </div>
            <button
              onClick={() => {
                const a = from
                setFrom(to || HOME_STOP)
                setTo(a)
              }}
              className="p-2 rounded-lg hover:bg-ink-100"
              aria-label="Swap"
            >
              <ArrowUpDown size={16} className="text-ink-400" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-ink-600 mb-2 inline-flex items-center gap-1.5">
            <CalendarClock size={13} />
            {t('search.when')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'now', label: t('search.now') },
              { v: 'later', label: t('search.later') },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setWhenMode(o.v)}
                className={`rounded-lg border px-3 py-2.5 text-[13.5px] font-medium transition ${whenMode === o.v ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {whenMode === 'later' && (
            <Input type="datetime-local" value={whenAt} onChange={(e) => setWhenAt(e.target.value)} className="mt-2" />
          )}
        </div>

        {to ? (
          <div className="bg-white rounded-xl border border-ink-200 p-4">
            <p className="text-[13.5px] font-semibold text-ink-900 mb-3">{t('search.preview')}</p>
            <div className="flex items-center gap-2 text-[14px] text-ink-900">
              <span className="truncate">{nameOf(from)}</span>
              <ArrowRight size={14} className="text-ink-300 shrink-0" />
              <span className="truncate">{nameOf(to)}</span>
            </div>

            {best ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {best.legs.map((l, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      {i > 0 && <span className="text-ink-300 text-[12.5px]">→</span>}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[12px] font-bold text-white ${l.route.class === 'BRT' ? 'bg-brand-600' : l.route.class === 'Intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                      >
                        {l.route.line}
                      </span>
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-ink-100">
                  {[
                    [t('common.time'), `${Math.round(best.minutes)} ${t('common.min')}`],
                    [t('results.transfers'), best.transfers],
                    [t('common.price'), `${best.fare} MMK`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{k}</p>
                      <p className="text-[14.5px] font-semibold text-ink-900 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-ink-400 mt-2.5">
                  {options.length} {t('results.options')} ·{' '}
                  {whenMode === 'now'
                    ? t('search.now')
                    : new Date(whenAt).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-ink-500 mt-3 leading-relaxed">
                {t('results.noRoute')} — {nameOf(from)} → {nameOf(to)}. Try a nearby stop or a different destination.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-ink-300 p-6 text-center">
            <SearchIcon size={22} className="text-ink-300 mx-auto" />
            <p className="text-[13.5px] text-ink-500 mt-2">{t('search.chooseDestination')}</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <Button variant="primary" full size="lg" icon={SearchIcon} disabled={!to || !best} onClick={search}>
          {t('search.findBuses')}
        </Button>
      </div>
    </div>
  )
}
