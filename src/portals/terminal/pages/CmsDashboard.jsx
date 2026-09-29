import { Link } from 'react-router-dom'
import {
  Bell,
  Building2,
  Coins,
  FileText,
  Megaphone,
  ShieldCheck,
  TicketCheck,
  Users,
  Radio,
  Coins as CoinsIcon,
} from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { TrendChart, DonutChart, Legend2 } from '../../../components/domain/Charts.jsx'
import { coverageIndex, openIncidents } from '../../../lib/store.jsx'
import useCms from '../useCms.js'
import { MMK, num, relative, timeOnly } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function CmsDashboard() {
  const { db, role, can, region, regionLabel, terminal, terminals: visibleTerminals } = useCms()
  const published = db.announcements.filter((a) => a.status === 'published')
  const drafts = db.announcements.filter((a) => a.status === 'draft')
  const liveAds = db.campaigns.filter((c) => c.status === 'live')
  const pendingAds = db.campaigns.filter((c) => c.status === 'pending')
  const openTickets = db.helpdesk.filter((t) => t.status === 'open')
  const adRevenue = liveAds.reduce((s, c) => s + c.budget, 0)
  const departures = db.departures.filter(
    (d) => visibleTerminals.some((t) => d.boardingPoints.includes(t.id)) && new Date(d.depart) > Date.now(),
  )
  const todayDepartures = departures.filter((d) => new Date(d.depart).toDateString() === new Date().toDateString())
  const unassignedBays = todayDepartures.filter((d) => !d.bay).length
  const outOfBand = db.fareCaps.filter((c) => c.current > c.cap || c.current < c.floor)
  const cov = coverageIndex(db)
  const incidents = openIncidents(db)
  const doneTrips = db.trips.filter((t) => t.status === 'completed')
  const onTime = doneTrips.length
    ? Math.round((doneTrips.filter((t) => t.delayMin <= 5).length / doneTrips.length) * 100)
    : null
  const expiring = db.permits.filter((p) => {
    const days = Math.ceil((new Date(p.expiry) - Date.now()) / 86400000)
    return days > 0 && days <= 30
  }).length
  const serviceTrend = db.salesDaily.map((d) => ({ date: d.date.slice(5), journeys: d.tickets }))
  const delivery = [
    { name: 'Push', value: 396_104, color: '#38663b' },
    { name: 'SMS', value: 95_662, color: '#6a9d6c' },
    { name: 'Email', value: 20_811, color: '#0284c7' },
    { name: 'In-app', value: 184_000, color: '#d97706' },
  ]
  const adTrend = db.salesDaily.map((d) => ({ date: d.date.slice(5), ads: Math.round(d.gross * 0.006) }))
  return (
    <>
      <PageHeader
        title="CMS overview"
        subtitle="What the transport authority needs to watch day to day: service on the road, safety, licences, terminals and fare policy — plus the content and advertising this office publishes. Scoped to what your role may see."
        meta={
          <>
            <Badge tone="brand" icon={ShieldCheck}>
              {role.label}
            </Badge>
            <Badge tone="slate">{can.allRegions ? regionLabel : 'Yangon Region'}</Badge>
            {role.id === 'terminal_mgr' && <Badge tone="slate">{terminal.name}</Badge>}
          </>
        }
      />

      <StatGrid cols={6} className="mb-5">
        <Stat
          label="Buses transmitting"
          value={cov.transmitting}
          unit={`/ ${cov.expected}`}
          icon={Radio}
          hint={`Coverage ${cov.pct}%`}
          tone={cov.pct >= 85 ? 'good' : 'warn'}
          method="Vehicles reporting a position in the last 10 minutes ÷ vehicles expected in service. This is the Coverage Index."
        />
        <Stat
          label="Service on time"
          value={onTime == null ? '—' : `${onTime}%`}
          tone={(onTime ?? 0) >= 85 ? 'good' : 'warn'}
          method="Completed trips departing within five minutes of the planned time across the jurisdiction."
        />
        <Stat
          label="Open incidents"
          value={incidents.length}
          tone={incidents.length ? 'warn' : 'good'}
          icon={ShieldCheck}
          hint={`${incidents.filter((i) => i.priority === 'P1').length} P1`}
          method="Reports not yet closed, all sources. P1 carries a five-minute acknowledgement SLA."
        />
        <Stat
          label="Licences expiring ≤ 30 days"
          value={expiring}
          tone={expiring ? 'warn' : 'good'}
          icon={ShieldCheck}
          method="Operator, vehicle, route and driver permits approaching expiry. Reminders run at 90/60/30/7 days."
        />
        <Stat
          label="Departures today"
          value={todayDepartures.length}
          icon={Building2}
          hint={`${unassignedBays} without a bay`}
          method="Scheduled departures boarding at the terminals in your scope."
        />
        <Stat
          label="Fares outside band"
          value={outOfBand.length}
          tone={outOfBand.length ? 'bad' : 'good'}
          icon={CoinsIcon}
          method="Routes priced above the ceiling or below the floor set centrally. Operators cannot publish these."
        />
      </StatGrid>

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Live passenger alerts"
          value={published.length}
          icon={FileText}
          hint={`${drafts.length} awaiting approval`}
          method="Announcements and service alerts currently visible to passengers."
        />
        <Stat
          label="Live campaigns"
          value={liveAds.length}
          icon={Megaphone}
          hint={`${pendingAds.length} pending approval`}
          method="Approved advertising delivering now. Public service announcements always take priority."
        />
        <Stat
          label="Open helpdesk"
          value={openTickets.length}
          tone={openTickets.length ? 'warn' : 'good'}
          icon={Users}
          method="Complaints, refund disputes and lost-property cases not yet resolved."
        />
        <Stat
          label="Non-tax revenue booked"
          value={MMK(adRevenue)}
          icon={Coins}
          method="Advertising budget committed on live campaigns. Ticket money is settled to operators and is not this office's income."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Journeys carried"
            subtitle="Daily, last 14 days — the headline the ministry asks for"
            icon={TicketCheck}
          />
          <CardBody>
            <TrendChart
              data={serviceTrend}
              height={210}
              series={[{ key: 'journeys', label: 'Journeys' }]}
              format={num}
            />
            <p className="text-[11.5px] text-ink-400 mt-2 leading-relaxed">
              Counted from validated tickets and gate check-ins. Figures carry the Coverage Index of {cov.pct}% when
              exported, and no aggregate below {db.thresholds.kAnonymity} journeys is produced.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notification delivery" subtitle="Last 30 days, by channel" icon={Bell} />
          <CardBody>
            <DonutChart
              data={delivery}
              format={num}
              center={{ value: num(delivery.reduce((s, d) => s + d.value, 0)), label: 'delivered' }}
            />
            <Legend2 items={delivery} />
          </CardBody>
        </Card>

        {can.fareBands && (
          <Card className="lg:col-span-2">
            <CardHeader
              title="Fare bands"
              icon={CoinsIcon}
              subtitle="Floor and ceiling per route. Operators price inside the band from their own portal, so they compete on service rather than by undercutting."
              action={
                <Button size="xs" as={Link} to="/terminal/fares">
                  Manage bands
                </Button>
              }
            />
            <CardBody className="space-y-2.5">
              {db.fareCaps.slice(0, 6).map((c) => {
                const route = routes.find((r) => r.id === c.route)
                const span = c.cap - c.floor || 1
                const pos = Math.max(0, Math.min(100, ((c.current - c.floor) / span) * 100))
                const bad = c.current > c.cap || c.current < c.floor
                return (
                  <div key={c.route}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1">
                      <span className="text-ink-700">
                        {route?.line} · {route?.name}
                      </span>
                      <span className={bad ? 'text-red-600 font-medium' : 'text-ink-500'}>
                        {MMK(c.floor).replace(' MMK', '')} – {MMK(c.cap).replace(' MMK', '')} · now{' '}
                        {MMK(c.current).replace(' MMK', '')}
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-ink-100">
                      <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-brand-100" />
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${bad ? 'bg-red-500' : 'bg-brand-600'}`}
                        style={{ left: `calc(${pos}% - 5px)` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Awaiting action" />
          <CardBody className="space-y-2">
            {[
              can.content &&
                drafts.length > 0 && {
                  label: `${drafts.length} content item(s) awaiting approval`,
                  to: '/terminal/announcements',
                  tone: 'amber',
                },
              can.ads &&
                pendingAds.length > 0 && {
                  label: `${pendingAds.length} campaign(s) awaiting approval`,
                  to: '/terminal/ads/campaigns',
                  tone: 'amber',
                },
              unassignedBays > 0 && {
                label: `${unassignedBays} departure(s) without a bay`,
                to: '/terminal/bays',
                tone: 'amber',
              },
              openTickets.length > 0 && {
                label: `${openTickets.length} helpdesk ticket(s) open`,
                to: '/terminal/helpdesk',
                tone: 'blue',
              },
              outOfBand.length > 0 &&
                can.fareBands && {
                  label: `${outOfBand.length} route(s) priced outside the band`,
                  to: '/terminal/fares',
                  tone: 'red',
                },
            ]
              .filter(Boolean)
              .map((x) => (
                <Link
                  key={x.label}
                  to={x.to}
                  className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2.5 hover:border-brand-300"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${x.tone === 'red' ? 'bg-red-500' : x.tone === 'amber' ? 'bg-amber-500' : 'bg-sky-500'}`}
                  />
                  <span className="flex-1 text-[12px] text-ink-800">{x.label}</span>
                </Link>
              ))}
            {drafts.length === 0 && pendingAds.length === 0 && unassignedBays === 0 && openTickets.length === 0 && (
              <Empty compact title="Nothing waiting on you" />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Terminals in your scope" icon={Building2} />
          <CardBody className="space-y-2">
            {visibleTerminals.map((t) => {
              const deps = db.departures.filter(
                (d) =>
                  d.boardingPoints.includes(t.id) && new Date(d.depart).toDateString() === new Date().toDateString(),
              )
              const pax = deps.reduce((s, d) => s + d.soldSeats.length, 0)
              return (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-[12.5px] font-medium text-ink-900">{t.name}</p>
                    <p className="text-[11.5px] text-ink-400">
                      {t.openHours} · {t.bays.length} bays · {t.operators.length} operators
                    </p>
                  </div>
                  <Badge tone="slate">
                    <TicketCheck size={10} /> {num(pax)} pax
                  </Badge>
                  <Badge tone={deps.some((d) => !d.bay) ? 'amber' : 'green'}>{deps.length} departures</Badge>
                  <Button size="xs" as={Link} to={`/board/${t.id}`}>
                    Board
                  </Button>
                </div>
              )
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Content live now" icon={Radio} />
          <CardBody className="space-y-2">
            {published.slice(0, 4).map((a) => (
              <div key={a.id} className="rounded-lg border border-ink-200 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-ink-900 flex-1 truncate">{a.title}</span>
                  <StatusPill status={a.status} />
                </div>
                <p className="text-[11.5px] text-ink-400 mt-0.5">
                  {a.routes
                    .map((r) => routes.find((x) => x.id === r)?.line)
                    .filter(Boolean)
                    .join(', ') || 'Network-wide'}{' '}
                  · until {timeOnly(a.to)}
                </p>
              </div>
            ))}
            {published.length === 0 && <Empty compact title="No live alerts" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Advertising revenue"
            subtitle="Non-tax revenue, last 14 days"
            icon={Megaphone}
            action={
              can.ads && (
                <Button size="xs" as={Link} to="/terminal/ads/billing">
                  Billing
                </Button>
              )
            }
          />
          <CardBody>
            <TrendChart
              data={adTrend}
              height={180}
              series={[{ key: 'ads', label: 'Ad revenue' }]}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Service levels" subtitle="What the ministry asks this office for" />
          <CardBody className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Content approved within 24 h', 94, 90],
              ['Bay allocated before T-30 min', 88, 95],
              ['Notification delivery rate', 97.4, 97],
              ['Helpdesk first response < 4 h', 91, 90],
            ].map(([label, actual, target]) => (
              <div key={label}>
                <div className="flex justify-between text-[12.5px] mb-1">
                  <span className="text-ink-600">{label}</span>
                  <span className={actual >= target ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                    {actual}%
                  </span>
                </div>
                <Progress value={actual} tone={actual >= target ? 'green' : 'amber'} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <p className="text-[12px] text-ink-400 mt-4 leading-relaxed">
        Role in use: <strong className="text-ink-600">{role.label}</strong> — {role.scope}. Switch role from the
        identity menu to see how the portal narrows. {relative(new Date().toISOString())}.
      </p>
    </>
  )
}
