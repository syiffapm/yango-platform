import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  ChevronRight,
  GraduationCap,
  IdCard,
  Languages,
  LayoutGrid,
  ScanLine,
  Star,
  TriangleAlert,
} from 'lucide-react'
import { isSinglePortal, HUB_URL } from '../../../lib/portal.js'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Qr from '../../../components/ui/Qr.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import useDriver from '../useDriver.js'
import { useT, LANGS } from '../../../lib/i18n.jsx'
import { dateOnly, daysUntil } from '../../../lib/format.js'
export default function Profile() {
  const { db, driver, operator, setSes } = useDriver()
  const { lang, setLang } = useT('driver')
  const permit = db.permits.find((p) => p.holder === driver?.id)
  const docs = [
    ['Operating licence', driver?.licenceExpiry],
    ['Driving licence', driver?.licenceExpiry],
    ['Medical certificate', driver?.medicalExpiry],
    ['Training certificate', driver?.trainingExpiry],
    ['Police clearance', driver?.policeClearance],
  ]
  return (
    <div>
      <AppBar title="Profile" />

      <div className="p-4 space-y-4">
        <Card>
          <CardBody className="flex gap-4">
            <Qr value={permit?.id || driver?.id} size={92} className="border border-ink-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11.5px] uppercase tracking-wider text-ink-400">Digital driver card</p>
              <p className="text-[14px] font-semibold text-ink-900 mt-0.5">{driver?.name}</p>
              <p className="text-[12.5px] text-ink-500">{operator?.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <StatusPill status={driver?.status} />
                <Badge tone="slate">Class {driver?.licenceClass}</Badge>
                {driver?.rating > 0 && (
                  <Badge tone="amber" icon={Star}>
                    {driver.rating}
                  </Badge>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {permit && (
          <Button full icon={ScanLine} as={Link} to={`/verify/${permit.id}`}>
            Show public verification page
          </Button>
        )}

        <Card>
          <CardHeader title="Documents" icon={IdCard} subtitle="Expiry is checked at every shift check-in" />
          <CardBody className="space-y-2">
            {docs.map(([label, date]) => {
              const days = date ? daysUntil(date) : null
              return (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                  <span className="flex-1 text-[13.5px] text-ink-800">{label}</span>
                  <span className="text-[12.5px] text-ink-500">{dateOnly(date)}</span>
                  <Badge tone={days < 0 ? 'red' : days <= 60 ? 'amber' : 'green'}>
                    {days < 0 ? 'Expired' : `${days}d`}
                  </Badge>
                </div>
              )
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Record" />
          <CardBody className="grid grid-cols-3 gap-3">
            {[
              ['Rating', driver?.rating ? `${driver.rating} ★` : '—'],
              ['Violations', driver?.violations ?? 0],
              ['Hours/week', driver?.hoursThisWeek ?? 0],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[16px] font-semibold text-ink-900 tabular-nums">{v}</p>
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{k}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Training" icon={GraduationCap} />
          <CardBody className="space-y-2">
            {[
              ['Defensive driving refresher', 'Completed'],
              ['Passenger safety & accessibility', 'Completed'],
              ['Emergency response drill', 'Due in 30 days'],
            ].map(([m, s]) => (
              <div key={m} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <span className="flex-1 text-[13.5px] text-ink-800">{m}</span>
                <Badge tone={s === 'Completed' ? 'green' : 'amber'}>{s}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-4 py-3">
          <Languages size={17} className="text-ink-400" />
          <span className="flex-1 text-[14px] text-ink-800">Language</span>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium border ${lang === l.code ? 'bg-brand-600 text-white border-brand-600' : 'border-ink-200 text-ink-500'}`}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>

        <a
          href={isSinglePortal ? HUB_URL : '/'}
          className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 px-4 py-3.5 active:bg-ink-50"
        >
          <LayoutGrid size={17} className="text-ink-400" />
          <span className="flex-1 text-[14px] text-ink-800">All YanGo portals</span>
          <ChevronRight size={15} className="text-ink-300" />
        </a>

        <Card>
          <CardHeader
            title="Switch driver"
            subtitle="Demo only — try a driver whose medical has expired to see check-in blocked"
          />
          <CardBody className="p-0">
            {db.drivers.slice(0, 6).map((d) => (
              <button
                key={d.id}
                onClick={() => setSes({ driverId: d.id, shift: null })}
                className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-ink-50 last:border-0 text-left active:bg-ink-50"
              >
                <span className="w-8 h-8 rounded-full bg-ink-100 grid place-items-center text-[12px] font-semibold text-ink-600">
                  {d.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-ink-900 truncate">{d.name}</p>
                  <p className="text-[12px] text-ink-400">
                    {(db.operators || []).find((o) => o.id === d.operator)?.short} · {d.status}
                  </p>
                </div>
                {d.status !== 'active' && <TriangleAlert size={14} className="text-amber-500" />}
                {d.id === driver?.id ? (
                  <BadgeCheck size={15} className="text-brand-600" />
                ) : (
                  <ChevronRight size={15} className="text-ink-300" />
                )}
              </button>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
