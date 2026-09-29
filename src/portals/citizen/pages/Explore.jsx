import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Accessibility, Building2, ChevronDown, MapPin, Navigation, Search as SearchIcon, X } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Tabs, { Pills } from '../../../components/ui/Tabs.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useT } from '../../../lib/i18n.jsx'
import { distanceKm, destinationOf } from '../arrivals.js'
import { routes, stops, terminals, REGIONS, regionName } from '../../../data/geo.js'
import { MMK } from '../../../lib/format.js'
const HOME_STOP = 'S03'
const LineChip = ({ r }) => (
  <span
    className={`px-2 py-1 rounded text-[12.5px] font-bold text-white shrink-0 ${
      r.class === 'BRT'
        ? 'bg-brand-600'
        : r.class === 'Intercity'
          ? 'bg-sky-600'
          : r.class === 'Feeder'
            ? 'bg-brand-400'
            : 'bg-brand-500'
    }`}
  >
    {r.line}
  </span>
)
function RouteRow({ r, note }) {
  return (
    <Link
      to={`/citizen/route/${r.id}`}
      className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-3 py-3 active:bg-ink-50"
    >
      <LineChip r={r} />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-ink-900 truncate">{r.name}</p>
        <p className="text-[12px] text-ink-500 truncate">
          → {destinationOf(r)} · {r.headwayMin ? `every ${r.headwayMin} min` : 'timetabled'}
          {note ? ` · ${note}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13.5px] font-semibold text-brand-700">{MMK(r.fare).replace(' MMK', '')}</p>
        <p className="text-[11.5px] text-ink-400">MMK</p>
      </div>
    </Link>
  )
}
function Section({ title, subtitle, children, count, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-1 mb-2">
        <div className="flex-1 text-left">
          <p className="text-[13.5px] font-semibold text-ink-900">{title}</p>
          {subtitle && <p className="text-[12px] text-ink-400">{subtitle}</p>}
        </div>
        {count != null && <Badge tone="slate">{count}</Badge>}
        <ChevronDown size={15} className={`text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  )
}
export default function Explore() {
  const { db } = useDb()
  const { t } = useT()
  const [tab, setTab] = useState('routes')
  const [kind, setKind] = useState('all')
  const [wheelchair, setWheelchair] = useState(false)
  const [q, setQ] = useState('')
  const here = stops.find((s) => s.id === HOME_STOP) || stops[0]
  const myRegion = here.region
  const withDistance = (place) => ({ ...place, km: distanceKm(here, place) })

  /** Nearest stop on a line tells us how far that line is from the traveller. */ const routeDistance = useMemo(() => {
    const map = {}
    routes.forEach((r) => {
      const pts = r.stops
        .map((id) => stops.find((s) => s.id === id) || terminals.find((x) => x.id === id))
        .filter(Boolean)
      map[r.id] = pts.length ? Math.min(...pts.map((p) => distanceKm(here, p))) : Infinity
    })
    return map
  }, [here])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return routes
      .filter((r) => (kind === 'all' ? true : kind === 'intercity' ? r.class === 'Intercity' : r.class !== 'Intercity'))
      .filter((r) =>
        !wheelchair ? true : db.vehicles.some((v) => v.route === r.id && v.amenities.includes('Wheelchair')),
      )
      .filter((r) => {
        if (!needle) return true
        const dest = destinationOf(r).toLowerCase()
        const stopNames = r.stops
          .map(
            (id) => (stops.find((s) => s.id === id) || terminals.find((x) => x.id === id))?.name?.toLowerCase() || '',
          )
          .join(' ')
        return (
          r.line.toLowerCase().includes(needle) ||
          r.name.toLowerCase().includes(needle) ||
          dest.includes(needle) ||
          stopNames.includes(needle)
        )
      })
      .sort((a, b) => (routeDistance[a.id] ?? 9e9) - (routeDistance[b.id] ?? 9e9))
  }, [q, kind, wheelchair, db.vehicles, routeDistance])
  const nearby = filtered.filter((r) => (routeDistance[r.id] ?? 9e9) <= 3)
  const byRegion = REGIONS.map((reg) => ({
    ...reg,
    list: filtered.filter((r) => r.region === reg.id && !nearby.includes(r)),
  })).filter((g) => g.list.length > 0)
  const placeMatches = (list) => {
    const needle = q.trim().toLowerCase()
    return list
      .map(withDistance)
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.nameMM || '').includes(q))
      .sort((a, b) => a.km - b.km)
  }
  const stopGroups = REGIONS.map((reg) => ({
    ...reg,
    list: placeMatches(stops.filter((s) => s.region === reg.id)),
  })).filter((g) => g.list.length)
  const terminalGroups = REGIONS.map((reg) => ({
    ...reg,
    list: placeMatches(terminals.filter((x) => x.region === reg.id)),
  })).filter((g) => g.list.length)
  const PlaceRow = ({ p, terminal }) => (
    <Link
      to={terminal ? `/citizen/terminal/${p.id}` : `/citizen/stop/${p.id}`}
      className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-3 py-2.5 active:bg-ink-50"
    >
      <span
        className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${terminal ? 'bg-brand-100' : 'bg-brand-50'}`}
      >
        {terminal ? (
          <Building2 size={16} className="text-brand-700" />
        ) : (
          <MapPin size={16} className="text-brand-600" />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-ink-900 truncate">{p.name}</p>
        <p className="text-[12px] text-ink-500 truncate">
          {p.km < 1 ? `${Math.round(p.km * 1000)} m away` : `${p.km.toFixed(1)} km away`}
          {' · '}
          {routes.filter((r) => r.stops.includes(p.id) || (r.terminals || []).includes(p.id)).length} lines
        </p>
      </div>
    </Link>
  )
  return (
    <div>
      <AppBar title={t('explore.title')} subtitle={`${regionName(myRegion)} · ${t('explore.subtitle')}`} />

      <div className="px-4 pt-3 pb-2 bg-white border-b border-ink-100 sticky top-[61px] z-10">
        <div className="relative">
          <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a line, a place or a stop"
            className="w-full pl-9 pr-9 py-2.5 text-[14px] bg-ink-50 border border-ink-200 rounded-xl outline-none focus:bg-white focus:border-brand-400"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-ink-100"
            >
              <X size={14} className="text-ink-400" />
            </button>
          )}
        </div>
        <div className="mt-2">
          <Tabs
            value={tab}
            onChange={setTab}
            size="sm"
            tabs={[
              { value: 'routes', label: t('home.routes'), count: filtered.length },
              { value: 'stops', label: t('explore.stops'), count: stopGroups.reduce((n, g) => n + g.list.length, 0) },
              {
                value: 'terminals',
                label: t('explore.terminals'),
                count: terminalGroups.reduce((n, g) => n + g.list.length, 0),
              },
            ]}
          />
        </div>
      </div>

      <div className="p-4">
        {tab === 'routes' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <Pills
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'all', label: t('common.all') },
                  { value: 'city', label: t('explore.inCity') },
                  { value: 'intercity', label: t('explore.intercity') },
                ]}
              />
              <button
                onClick={() => setWheelchair((w) => !w)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] ${wheelchair ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}
              >
                <Accessibility size={12} /> Step-free
              </button>
            </div>

            {nearby.length > 0 && (
              <Section title="Lines near you" subtitle={`Within 3 km of ${here.name}`} count={nearby.length}>
                {nearby.map((r) => (
                  <RouteRow
                    key={r.id}
                    r={r}
                    note={
                      routeDistance[r.id] < 1
                        ? `${Math.round(routeDistance[r.id] * 1000)} m away`
                        : `${routeDistance[r.id].toFixed(1)} km away`
                    }
                  />
                ))}
              </Section>
            )}

            {byRegion.map((g) => (
              <Section
                key={g.id}
                title={g.name}
                subtitle={g.id === myRegion ? 'Rest of your region' : 'Other region'}
                count={g.list.length}
                defaultOpen={g.id === myRegion}
              >
                {g.list.map((r) => (
                  <RouteRow key={r.id} r={r} />
                ))}
              </Section>
            ))}

            {filtered.length === 0 && (
              <Empty icon={Navigation} title="Nothing matches that" hint="Try a line number, a place name or a stop." />
            )}
          </>
        )}

        {tab === 'stops' &&
          (stopGroups.length ? (
            stopGroups.map((g) => (
              <Section key={g.id} title={g.name} count={g.list.length} defaultOpen={g.id === myRegion}>
                {g.list.map((p) => (
                  <PlaceRow key={p.id} p={p} />
                ))}
              </Section>
            ))
          ) : (
            <Empty title="No stop matches that" />
          ))}

        {tab === 'terminals' &&
          (terminalGroups.length ? (
            terminalGroups.map((g) => (
              <Section key={g.id} title={g.name} count={g.list.length} defaultOpen={g.id === myRegion}>
                {g.list.map((p) => (
                  <PlaceRow key={p.id} p={p} terminal />
                ))}
              </Section>
            ))
          ) : (
            <Empty title="No terminal matches that" />
          ))}
      </div>
    </div>
  )
}
