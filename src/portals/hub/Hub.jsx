import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bus,
  Building2,
  Gauge,
  MonitorSmartphone,
  Smartphone,
  ShieldCheck,
  RotateCcw,
  Database,
  Users,
  Route as RouteIcon,
  TicketCheck,
  Radio,
} from 'lucide-react'
import { useDb, coverageIndex, openIncidents } from '../../lib/store.jsx'
import { routes } from '../../data/geo.js'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { num, MMK } from '../../lib/format.js'
const PORTALS = [
  {
    to: '/citizen',
    name: 'Citizen App',
    code: 'Passengers',
    desc: 'Plan a journey, buy an urban or intercity ticket, track the bus live, check in with a signed QR, raise SOS.',
    icon: Smartphone,
    accent: 'from-brand-500 to-brand-700',
    highlights: ['Journey planner', 'Seat booking', 'Wallet & passes', 'SOS & reports', 'Ask YanGo chatbot'],
  },
  {
    to: '/driver',
    name: 'Driver App',
    code: 'Drivers',
    desc: 'Shift check-in with face match and bus QR, pre-trip inspection, manifest, boarding scan, SOS. Tracking only on duty.',
    icon: MonitorSmartphone,
    accent: 'from-ink-700 to-ink-900',
    highlights: [
      'Check-in & inspection',
      'Manifest & QR boarding',
      'Trip status events',
      'One-tap SOS',
      'Offline queue',
    ],
  },
  {
    to: '/operator',
    name: 'Bus Operator Portal',
    code: 'Bus companies',
    desc: 'The operator back office: fleet, drivers, rosters, timetables, fares, inventory, live operations, compliance, settlement.',
    icon: Building2,
    accent: 'from-sky-600 to-sky-800',
    highlights: [
      'Fleet & maintenance',
      'Roster with conflict checks',
      'Timetable vs permit',
      'Live ops map',
      'Settlement & reports',
      'Licence applications',
    ],
  },
  {
    to: '/authority',
    name: 'Government Console',
    code: 'Authority · CMS · Terminals',
    desc: 'One console for the transport authority: live network, incidents and SOS, compliance, analytics, revenue, terminals, passenger information, advertising and platform administration.',
    icon: Gauge,
    accent: 'from-violet-600 to-violet-800',
    highlights: [
      'Command center',
      'Incident SLA queue',
      'Compliance matrix',
      'Licence approval',
      'Fare bands',
      'Terminals & gate',
      'CMS: content & ads',
    ],
  },
]
export default function Hub() {
  const { db, reset } = useDb()
  const cov = coverageIndex(db)
  const incidents = openIncidents(db)
  const todaySales = db.salesDaily[db.salesDaily.length - 1]
  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-white border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center text-[13px] font-bold">
            YG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ink-900 leading-tight">YanGo Smart Mobility Platform</p>
            <p className="text-[12px] text-ink-500 leading-tight">
              PT. LinkIT 360 · GovTech — pilot tenant: Yangon (YRTC)
            </p>
          </div>
          <Badge tone="brand">BRD v0.1</Badge>
          <Button size="sm" icon={RotateCcw} onClick={reset} title="Reseed the shared demo database">
            Reset data
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <section className="mb-8">
          <h1 className="text-[26px] sm:text-[32px] font-semibold text-ink-900 tracking-tight leading-tight">
            {' '}
            license → operate → sell → ride → monitor → enforce
          </h1>
          <p className="text-[13.5px] text-ink-600 mt-2.5 max-w-3xl leading-relaxed">
            Six portals, one set of master data. What an operator files once in Licensing becomes the permit the
            Operator Portal plans against, the shift the Driver App can start, the bus the Citizen App can sell a seat
            on, and the line the Authority Console measures. Every portal below has its own link and works end to end on
            the same shared demo database.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
            {[
              {
                icon: Radio,
                label: 'Coverage Index',
                value: `${cov.pct}%`,
                hint: `${cov.transmitting}/${cov.expected} transmitting`,
              },
              { icon: RouteIcon, label: 'Licensed lines', value: routes.length, hint: '8 operators' },
              {
                icon: Bus,
                label: 'Vehicles',
                value: db.vehicles.length,
                hint: `${db.vehicles.filter((v) => v.status === 'active').length} active`,
              },
              {
                icon: Users,
                label: 'Drivers',
                value: db.drivers.length,
                hint: `${db.drivers.filter((d) => d.status === 'active').length} licensed`,
              },
              {
                icon: TicketCheck,
                label: 'Tickets today',
                value: num(todaySales.tickets),
                hint: MMK(todaySales.gross),
              },
              {
                icon: ShieldCheck,
                label: 'Open incidents',
                value: incidents.length,
                hint: `${incidents.filter((i) => i.priority === 'P1').length} P1`,
              },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-ink-200/70 p-3">
                <s.icon size={14} className="text-brand-600" />
                <p className="text-[19px] font-semibold text-ink-900 mt-2 leading-none tabular-nums">{s.value}</p>
                <p className="text-[12px] text-ink-500 mt-1.5 leading-tight">{s.label}</p>
                <p className="text-[11px] text-ink-400 leading-tight">{s.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {PORTALS.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="group bg-white rounded-2xl border border-ink-200/70 overflow-hidden hover:border-brand-300 hover:shadow-md transition-all"
            >
              <div className={`h-1.5 bg-gradient-to-r ${p.accent}`} />
              <div className="p-5">
                <div className="flex items-start gap-3.5">
                  <span
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.accent} text-white grid place-items-center shrink-0`}
                  >
                    <p.icon size={19} strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-ink-900">{p.name}</h2>
                      <Badge tone="slate">{p.code}</Badge>
                    </div>
                    <p className="text-[12.5px] text-ink-500 mt-1.5 leading-relaxed">{p.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-[11.5px] text-ink-500 bg-ink-50 border border-ink-100 rounded-full px-2 py-0.5"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-700 mt-4 group-hover:gap-2.5 transition-all">
                      Open {p.to} <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="bg-white rounded-2xl border border-ink-200/70 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database size={15} className="text-brand-600" />
              <h3 className="text-[14px] font-semibold text-ink-900">Shared demo database</h3>
            </div>
            <p className="text-[12.5px] text-ink-600 leading-relaxed">
              All six portals read and write one browser-local database. Approve an application in Licensing and the
              permit appears in the Operator Portal and the Authority permit register. Press SOS in the Citizen App and
              a P1 incident lands in the Authority queue and the operator inbox within seconds. Nothing is re-keyed.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" icon={RotateCcw} onClick={reset}>
                Reseed demo data
              </Button>
              <Button size="sm" as={Link} to="/verify/PM-RTE-R01" icon={ShieldCheck}>
                Public permit verification
              </Button>
              <Button size="sm" as={Link} to="/board/T01" icon={Bus}>
                Public departure board
              </Button>
              <Button size="sm" as={Link} to="/blueprint" icon={Database}>
                Solution blueprint
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-ink-200/70 p-5">
            <h3 className="text-[14px] font-semibold text-ink-900 mb-3">Design principles carried into every module</h3>
            <ul className="space-y-2 text-[12px] text-ink-600">
              {[
                [
                  'A measurement is not a finding',
                  'the system measures; a named officer decides, with a written reason.',
                ],
                ['Measured vs. not measurable', 'low data coverage is shown as “not measurable”, never as failure.'],
                [
                  'Privacy by construction',
                  'aggregates below 20 journeys are never produced; reporter identity is never exposed.',
                ],
                ['Each side administers its own people', 'operators only ever see their own data.'],
                ['Thresholds are versioned', 'and never retroactive to issued findings or published reports.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                  <span>
                    <strong className="text-ink-800 font-medium">{t}</strong> — {d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="mt-10 pt-6 border-t border-ink-200 text-[12px] text-ink-400">
          Confidential — prepared for the transport authority (pilot tenant: Yangon). Demo build against BRD v0.1, 24
          September 2026. Data is simulated and stored only in this browser.
        </footer>
      </main>
    </div>
  )
}
