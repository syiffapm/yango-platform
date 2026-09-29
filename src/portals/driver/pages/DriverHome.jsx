import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  ClipboardCheck,
  LogIn,
  LogOut,
  MapPin,
  Radio,
  ShieldAlert,
  Timer,
  Users,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import useDriver from '../useDriver.js'
import { useT } from '../../../lib/i18n.jsx'
import { routes } from '../../../data/geo.js'
import { daysUntil, timeOnly, relative } from '../../../lib/format.js'
export default function DriverHome() {
  const { db, driver, vehicle, operator, trips, blockers, onShift, ses } = useDriver()
  const { t } = useT('driver')
  const route = routes.find((r) => r.id === vehicle?.route)
  const todo = trips.filter((t) => t.status !== 'completed')
  const done = trips.filter((t) => t.status === 'completed')
  const unread = db.notifications.filter((n) => n.audience === 'driver' && !n.read)
  const docWarnings = [
    daysUntil(driver?.licenceExpiry) <= 60 && `Operating licence expires in ${daysUntil(driver.licenceExpiry)} days`,
    daysUntil(driver?.medicalExpiry) <= 60 && `Medical certificate expires in ${daysUntil(driver.medicalExpiry)} days`,
  ].filter(Boolean)
  return (
    <div>
      <div className="bg-ink-900 text-white px-4 pt-3 pb-5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-white/10 grid place-items-center text-[14px] font-semibold">
            {driver?.name
              .split(' ')
              .map((w) => w[0])
              .join('')}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[14px] font-semibold truncate">{driver?.name}</h1>
            <p className="text-[12.5px] text-white/60 truncate">
              {operator?.name} · licence class {driver?.licenceClass}
            </p>
          </div>
          {onShift ? (
            <Badge tone="green" dot>
              {t('drv.onDuty')}
            </Badge>
          ) : (
            <Badge tone="slate" className="bg-white/10 text-white/80 border-white/20">
              {t('drv.offDuty')}
            </Badge>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-white/10 p-3.5">
          <div className="flex items-center gap-2 text-white/70 text-[12.5px] mb-1.5">
            <Radio size={12} />
            {onShift ? 'Tracking is on — you are on duty' : 'Tracking is off — the platform never tracks you off duty'}
          </div>
          <p className="text-[13.5px]">
            {onShift
              ? `Shift started ${relative(ses.shift.startedAt)} · bus ${vehicle?.plate}`
              : 'Check in with a face match and the bus QR to start tracking.'}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-2">
        {blockers.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
            <p className="text-[13.5px] font-semibold text-red-900 inline-flex items-center gap-1.5">
              <AlertTriangle size={14} /> You cannot start a shift
            </p>
            <ul className="mt-2 space-y-1">
              {blockers.map((b) => (
                <li key={b} className="text-[13px] text-red-800">
                  · {b}
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-red-700/80 mt-2">
              Contact your operator — blocks check-in until this is resolved.
            </p>
          </div>
        )}

        {!onShift ? (
          <Button
            variant="primary"
            full
            size="lg"
            icon={LogIn}
            as={Link}
            to="/driver/checkin"
            disabled={blockers.length > 0}
          >
            {t('drv.startShift')}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" size="lg" icon={ClipboardCheck} as={Link} to="/driver/trips">
              My trips
            </Button>
            <Button variant="danger" size="lg" icon={ShieldAlert} as={Link} to="/driver/sos">
              SOS
            </Button>
          </div>
        )}

        {!onShift && (
          <Button variant="danger" full size="lg" icon={ShieldAlert} as={Link} to="/driver/sos">
            {t('drv.sos')}
          </Button>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t('drv.tripsToday'), value: trips.length, icon: Bus },
            { label: t('drv.completed'), value: done.length, icon: CheckCircle2 },
            { label: t('drv.hoursWeek'), value: driver?.hoursThisWeek, icon: Timer },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-ink-200 p-3">
              <s.icon size={14} className="text-brand-600" />
              <p className="text-[16px] font-semibold text-ink-900 mt-1.5 tabular-nums">{s.value}</p>
              <p className="text-[11.5px] text-ink-400 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {driver && (
          <div className="bg-white rounded-xl border border-ink-200 p-3.5">
            <Progress
              label={`Driving hours — ${driver.hoursThisWeek} of 40 this week`}
              value={driver.hoursThisWeek}
              max={40}
              tone={driver.hoursThisWeek > 36 ? 'amber' : 'green'}
            />
            <Link
              to="/driver/fatigue"
              className="text-[12.5px] text-brand-700 mt-1 inline-flex items-center min-h-[40px]"
            >
              Fatigue & safety →
            </Link>
          </div>
        )}

        {vehicle && (
          <div className="bg-white rounded-xl border border-ink-200 p-3.5">
            <p className="text-[13.5px] font-semibold text-ink-900 mb-2">{t('drv.assignedBus')}</p>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-brand-50 grid place-items-center">
                <Bus size={18} className="text-brand-600" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-ink-900">{vehicle.plate}</p>
                <p className="text-[12.5px] text-ink-500">
                  {vehicle.class} · {vehicle.capacity} seats · {route?.line}
                </p>
              </div>
              <Badge tone={vehicle.status === 'active' ? 'green' : 'red'}>{vehicle.status}</Badge>
            </div>
          </div>
        )}

        {todo.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[14px] font-semibold text-ink-900">{t('drv.nextTrips')}</p>
              <Link
                to="/driver/trips"
                className="text-[12.5px] text-brand-700 inline-flex items-center px-2 min-h-[40px]"
              >
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {todo.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  to={`/driver/trip/${t.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-3 py-2.5 active:bg-ink-50"
                >
                  <span className="text-[14px] font-semibold text-ink-900 tabular-nums w-11">
                    {timeOnly(t.plannedStart)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink-900">{routes.find((r) => r.id === t.route)?.line}</p>
                    <p className="text-[12px] text-ink-500 truncate">{routes.find((r) => r.id === t.route)?.name}</p>
                  </div>
                  <Badge tone={t.status === 'running' ? 'green' : 'slate'}>{t.status}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {docWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-[13px] font-semibold text-amber-900 inline-flex items-center gap-1.5">
              <AlertTriangle size={13} />
              Documents expiring
            </p>
            {docWarnings.map((w) => (
              <p key={w} className="text-[13px] text-amber-800 mt-1">
                · {w}
              </p>
            ))}
          </div>
        )}

        {unread.length > 0 && (
          <Link
            to="/driver/messages"
            className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3"
          >
            <Users size={16} className="text-sky-600" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-sky-900">{unread.length} message(s) need acknowledgement</p>
              <p className="text-[12.5px] text-sky-700/80 truncate">{unread[0].title}</p>
            </div>
          </Link>
        )}

        {onShift && (
          <Button full icon={LogOut} as={Link} to="/driver/endshift">
            End shift
          </Button>
        )}

        <p className="text-[12px] text-ink-400 text-center inline-flex items-center gap-1 w-full justify-center">
          <MapPin size={11} /> Offline-first — events, scans and SOS are queued and sync when you have signal
        </p>
      </div>
    </div>
  )
}
