import { Link, useParams } from 'react-router-dom'
import { Accessibility, Lightbulb, MapPin, Armchair, Info } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import { useDb, useLiveVehicles } from '../../../lib/store.jsx'
import { useT } from '../../../lib/i18n.jsx'
import { MMK, timeOnly } from '../../../lib/format.js'
import { nextDepartures } from '../../../lib/schedule.js'
import { arrivalsAt, destinationOf, occupancyLabel, occupancyTone } from '../arrivals.js'
import { routes, stops } from '../../../data/geo.js'
const FACILITY_ICON = {
  shelter: MapPin,
  seating: Armchair,
  lighting: Lightbulb,
  accessible: Accessibility,
  information: Info,
  toilet: Info,
}
export default function StopDetail() {
  const { id } = useParams()
  const { db } = useDb()
  const { t } = useT()
  const live = useLiveVehicles().filter((v) => v.transmitting)
  const stop = stops.find((s) => s.id === id)
  if (!stop) return <Empty title="Stop not found" />
  const arrivals = arrivalsAt(id, live)
  const serving = routes.filter((r) => r.stops.includes(id))
  return (
    <div>
      <AppBar title={stop.name} subtitle={`${stop.nameMM} · ${stop.type}`} back />
      <MapView
        legend="simple"
        vehicles={live.filter((v) => serving.some((r) => r.id === v.route))}
        highlightRoutes={serving.map((r) => r.id)}
        focus={stop}
        height={190}
        showLabels={false}
      />

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {stop.facilities.map((f) => {
            const Icon = FACILITY_ICON[f] || Info
            return (
              <Badge key={f} tone="slate" icon={Icon}>
                {f}
              </Badge>
            )
          })}
          {stop.facilities.length === 0 && <Badge tone="slate">No facilities recorded</Badge>}
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-[14px] font-semibold text-ink-900">{t('home.busesHere')}</p>
          <Badge tone="green" dot>
            LIVE
          </Badge>
        </div>

        <div className="space-y-2 mb-5">
          {arrivals.map((a) => (
            <Link
              key={a.id}
              to={`/citizen/route/${a.route.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-3 py-2.5 active:bg-ink-50"
            >
              <span
                className={`w-11 h-9 rounded-lg grid place-items-center text-[13px] font-bold text-white ${a.route.class === 'BRT' ? 'bg-brand-600' : 'bg-brand-500'}`}
              >
                {a.route.line}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-ink-900 truncate">{a.destination}</p>
                <p className="text-[12px] text-ink-500">
                  {a.vehicle.plate} · {a.km.toFixed(1)} km
                </p>
              </div>
              <Badge tone={occupancyTone(a.occupancyPct)}>{occupancyLabel(a.occupancyPct)}</Badge>
              <span className="text-[15px] font-semibold text-brand-700 tabular-nums">{a.etaMin}m</span>
            </Link>
          ))}
          {arrivals.length === 0 && (
            <p className="text-[13px] text-ink-400 py-4 text-center">No buses transmitting on these lines right now.</p>
          )}
        </div>

        <p className="text-[14px] font-semibold text-ink-900 mb-2">{t('home.routesFromHere')}</p>
        <div className="space-y-2">
          {serving.map((r) => {
            const next = nextDepartures(r.id, db, 1)[0]
            return (
              <Link
                key={r.id}
                to={`/citizen/book/${r.id}`}
                className="block bg-white rounded-xl border border-ink-200 px-3 py-3 active:bg-ink-50"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-1 rounded text-[12.5px] font-bold text-white shrink-0 ${r.class === 'BRT' ? 'bg-brand-600' : r.class === 'Intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                  >
                    {r.line}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-ink-900 truncate">→ {destinationOf(r)}</p>
                    <p className="text-[12px] text-ink-500 truncate">
                      {r.name} · {r.hours}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13.5px] font-semibold text-brand-700">{MMK(r.fare).replace(' MMK', '')}</p>
                    {next && <p className="text-[11.5px] text-ink-400">{timeOnly(next.depart)}</p>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
