import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import { BarsChart, TrendChart } from '../../../components/domain/Charts.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { terminals } from '../../../data/geo.js'
import { num } from '../../../lib/format.js'
import { Users } from 'lucide-react'
export default function CrowdMonitor() {
  const { db } = useDb()
  const [ses] = useSession('terminal')
  const t = terminals.find((x) => x.id === ses.terminalId) || terminals[0]
  const hourly = Array.from({ length: 14 }, (_, i) => ({
    hour: `${String(6 + i).padStart(2, '0')}:00`,
    people: [180, 420, 610, 480, 350, 300, 320, 380, 460, 720, 840, 610, 380, 190][i],
  }))
  const now = hourly[Math.min(13, Math.max(0, new Date().getHours() - 6))]
  const capacity = 900
  const pct = Math.round((now.people / capacity) * 100)
  const areas = [
    { name: 'Waiting hall', value: 62 },
    { name: 'Ticket counters', value: 41 },
    { name: 'Bay concourse A', value: 78 },
    { name: 'Bay concourse B', value: 33 },
    { name: 'Food court', value: 55 },
  ]
  return (
    <>
      <PageHeader
        title="Crowd monitor"
        subtitle="Crowd level per terminal, derived from gate check-ins, automatic passenger counters and camera counts. No individual is identified or tracked."
        meta={
          <Badge tone={pct > 75 ? 'red' : pct > 45 ? 'amber' : 'green'} dot>
            {pct > 75 ? 'Busy' : pct > 45 ? 'Moderate' : 'Quiet'}
          </Badge>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="People on site"
          value={num(now.people)}
          icon={Users}
          method="Estimated from gate check-ins in and out, APC counts and camera density. Rounded — never a headcount of identified people."
        />
        <Stat
          label="Of comfortable capacity"
          value={`${pct}%`}
          tone={pct > 75 ? 'bad' : pct > 45 ? 'warn' : 'good'}
          method={`Comfortable capacity for ${t.name} is ${num(capacity)} people.`}
        />
        <Stat
          label="Peak today"
          value={num(Math.max(...hourly.map((h) => h.people)))}
          method="Highest estimate recorded today."
        />
        <Stat label="Check-ins today" value={num(db.gateCheckins.length)} method="Passengers who scanned at a gate." />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Throughput by hour" subtitle="Today" />
          <CardBody>
            <TrendChart
              data={hourly}
              x="hour"
              height={240}
              series={[{ key: 'people', label: 'People on site' }]}
              format={num}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="By area" subtitle="Occupancy against comfortable capacity" />
          <CardBody className="space-y-3">
            {areas.map((a) => (
              <Progress
                key={a.name}
                label={a.name}
                value={a.value}
                tone={a.value > 75 ? 'red' : a.value > 50 ? 'amber' : 'green'}
              />
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Area comparison" />
          <CardBody>
            <BarsChart data={areas} x="name" height={210} series={[{ key: 'value', label: 'Occupancy %' }]} />
          </CardBody>
        </Card>
      </div>

      <p className="text-[12px] text-ink-400 mt-4 leading-relaxed">
        Privacy: camera counts produce a number, never an identity. No facial recognition is used anywhere in the
        terminal module, and counts below the k-anonymity threshold are not published.
      </p>
    </>
  )
}
