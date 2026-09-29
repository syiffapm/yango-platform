import { Link } from 'react-router-dom'
import { Bus, Clock } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Button from '../../../components/ui/Button.jsx'
import useDriver from '../useDriver.js'
import { routes } from '../../../data/geo.js'
import { timeOnly } from '../../../lib/format.js'
export default function Trips() {
  const { trips, vehicle, onShift } = useDriver()
  return (
    <div>
      <AppBar
        title="Today's trips"
        subtitle={vehicle ? `${vehicle.plate} · ${routes.find((r) => r.id === vehicle.route)?.line}` : ''}
      />

      {!onShift && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <p className="text-[13px] text-amber-900">You are off duty. Check in to start a trip and turn tracking on.</p>
          <Button size="sm" variant="primary" className="mt-2" as={Link} to="/driver/checkin">
            Start check-in
          </Button>
        </div>
      )}

      <div className="p-4 space-y-2">
        {trips.map((t) => {
          const route = routes.find((r) => r.id === t.route)
          return (
            <Link
              key={t.id}
              to={`/driver/trip/${t.id}`}
              className="block bg-white rounded-xl border border-ink-200 p-3.5 active:bg-ink-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold text-ink-900 tabular-nums leading-none">
                    {timeOnly(t.plannedStart)}
                  </p>
                  <p className="text-[12.5px] text-ink-500 mt-1">
                    to {timeOnly(t.plannedEnd)} · {t.id}
                  </p>
                </div>
                <StatusPill status={t.status} />
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink-100">
                <span
                  className={`px-1.5 py-0.5 rounded text-[12px] font-bold text-white ${route?.class === 'BRT' ? 'bg-brand-600' : 'bg-brand-500'}`}
                >
                  {route?.line}
                </span>
                <span className="flex-1 text-[13px] text-ink-600 truncate">{route?.name}</span>
                {t.delayMin > 5 && (
                  <Badge tone="amber" icon={Clock}>
                    {t.delayMin} min late
                  </Badge>
                )}
                {t.boarded > 0 && (
                  <Badge tone="slate">
                    {t.boarded}/{t.capacity}
                  </Badge>
                )}
              </div>
            </Link>
          )
        })}
        {trips.length === 0 && (
          <Empty icon={Bus} title="No trips assigned" hint="Your operator publishes the roster the evening before." />
        )}
      </div>
    </div>
  )
}
