import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Clock, Star, Ticket, Wifi } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb, useLiveVehicles } from '../../../lib/store.jsx'
import { routes, stops, terminals, isScheduled } from '../../../data/geo.js'
import { arrivalsAt, occupancyLabel, occupancyTone } from '../arrivals.js'
import { MMK } from '../../../lib/format.js'
export default function RouteDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { db } = useDb()
  const live = useLiveVehicles({ route: id })
  const route = routes.find((r) => r.id === id)
  if (!route) return <Empty title="Route not found" />
  const operator = (db.operators || []).find((o) => o.id === route.operator)
  const permit = db.permits.find((p) => p.routeId === route.id)
  const vehicle = db.vehicles.find((v) => v.route === route.id)
  const scheduled = isScheduled(route)
  const seq = route.stops
    .map((sid) => stops.find((s) => s.id === sid) || terminals.find((t) => t.id === sid))
    .filter(Boolean)
  return (
    <div>
      <AppBar
        title={`${route.line} · ${route.name}`}
        subtitle={`${route.class} · operated by ${operator?.name || route.operator}`}
        back
      />

      <MapView vehicles={live} highlightRoutes={[route.id]} height={200} showLabels={false} legend="simple" />

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge tone={route.class === 'BRT' ? 'brand' : 'slate'}>{route.class}</Badge>
          {permit?.status === 'valid' && (
            <Badge tone="green" icon={BadgeCheck}>
              Licensed
            </Badge>
          )}
          <Badge tone="slate" icon={Clock}>
            {route.hours}
          </Badge>
          {operator && (
            <Badge tone="amber" icon={Star}>
              {operator.rating}
            </Badge>
          )}
          {vehicle?.amenities.includes('Wi-Fi') && (
            <Badge tone="blue" icon={Wifi}>
              Wi-Fi
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ['Fare', MMK(route.fare).replace(' MMK', '')],
            [scheduled ? 'Departures' : 'Frequency', scheduled ? 'Timetabled' : `${route.headwayMin} min`],
            ['Distance', `${route.km} km`],
          ].map(([k, v]) => (
            <div key={k} className="bg-white rounded-xl border border-ink-200 px-3 py-2.5">
              <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{k}</p>
              <p className="text-[14.5px] font-semibold text-ink-900 mt-0.5">{v}</p>
            </div>
          ))}
        </div>

        {!scheduled && (
          <>
            <p className="text-[14px] font-semibold text-ink-900 mb-2">Next vehicles</p>
            <div className="space-y-2 mb-4">
              {arrivalsAt(route.stops[0], live)
                .slice(0, 3)
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-3 py-2.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 relative pulse-ring text-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] text-ink-900">{a.vehicle.plate}</p>
                      <p className="text-[12px] text-ink-500">
                        {a.km.toFixed(1)} km from {seq[0].name}
                      </p>
                    </div>
                    <Badge tone={occupancyTone(a.occupancyPct)}>{occupancyLabel(a.occupancyPct)}</Badge>
                    <span className="text-[14px] font-semibold text-brand-700 tabular-nums">{a.etaMin}m</span>
                  </div>
                ))}
            </div>
          </>
        )}

        <p className="text-[14px] font-semibold text-ink-900 mb-2">Stops</p>
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {seq.map((s, i) => (
            <Link
              key={`${s.id}-${i}`}
              to={s.bays ? `/citizen/terminal/${s.id}` : `/citizen/stop/${s.id}`}
              className="flex items-center gap-3 px-3.5 py-2.5 border-b border-ink-50 last:border-0 active:bg-ink-50"
            >
              <div className="flex flex-col items-center shrink-0">
                {i > 0 && <span className="w-px h-2 bg-brand-300" />}
                <span
                  className={`w-2.5 h-2.5 rounded-full ${i === 0 || i === seq.length - 1 ? 'bg-brand-600' : 'bg-white border-2 border-brand-400'}`}
                />
                {i < seq.length - 1 && <span className="w-px h-2 bg-brand-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-ink-900 truncate">{s.name}</p>
                {s.nameMM && <p className="text-[12px] text-ink-400 truncate">{s.nameMM}</p>}
              </div>
              <span className="text-[12px] text-ink-400 tabular-nums">
                {(i * (route.km / Math.max(1, seq.length - 1))).toFixed(1)} km
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-ink-200 bg-white p-3.5">
          <p className="text-[13.5px] font-medium text-ink-900">{operator?.name}</p>
          <p className="text-[12.5px] text-ink-500 mt-0.5">
            Permit {permit?.id} · valid to {permit?.expiry}
          </p>
          {permit && (
            <Button size="xs" className="mt-2" as={Link} to={`/verify/${permit.id}`} icon={BadgeCheck}>
              Verify licence
            </Button>
          )}
        </div>
      </div>

      <div className="sticky bottom-[var(--tab-h,0px)] z-20 p-4 bg-white/95 backdrop-blur border-t border-ink-200">
        <Button variant="primary" full size="lg" icon={Ticket} onClick={() => nav(`/citizen/book/${route.id}`)}>
          {scheduled ? `Choose a departure · from ${MMK(route.fare)}` : `See departures · ${MMK(route.fare)}`}
        </Button>
      </div>
    </div>
  )
}
