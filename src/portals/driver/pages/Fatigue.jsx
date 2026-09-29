import { AlertTriangle, Coffee, Gauge, Timer } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
export default function Fatigue() {
  const { driver } = useDriver()
  const toast = useToast()
  const hours = driver?.hoursThisWeek || 0
  const events = [
    { label: 'Harsh braking', count: driver?.violations ?? 0, tone: 'amber' },
    { label: 'Speeding over limit', count: Math.max(0, (driver?.violations ?? 0) - 1), tone: 'red' },
    { label: 'Sharp cornering', count: 1, tone: 'slate' },
  ]
  return (
    <div>
      <AppBar title="Fatigue & safety" back />
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader
            title="Driving time"
            icon={Timer}
            subtitle="Hours of service are checked before every roster assignment"
          />
          <CardBody className="space-y-3">
            <Progress
              label={`${hours} of 40 hours this week`}
              value={hours}
              max={40}
              tone={hours > 36 ? 'amber' : 'green'}
              height={8}
            />
            <Progress label="3h 10m since your last break" value={190} max={270} tone="brand" height={8} />
            {hours > 36 && (
              <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle size={15} className="text-amber-600 mt-px shrink-0" />
                <p className="text-[13px] text-amber-900 leading-relaxed">
                  You are approaching the weekly limit. Further assignments will be blocked at 40 hours.
                </p>
              </div>
            )}
            <Button
              full
              icon={Coffee}
              onClick={() =>
                toast({ title: 'Break logged', body: 'A 20-minute break has been recorded against this shift.' })
              }
            >
              Log a break
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Driving behaviour"
            icon={Gauge}
            subtitle="Advisory scoring — a named officer still makes every regulatory decision"
          />
          <CardBody className="space-y-2">
            {events.map((e) => (
              <div key={e.label} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <span className="flex-1 text-[13.5px] text-ink-800">{e.label}</span>
                <Badge tone={e.count ? e.tone : 'slate'}>{e.count} this week</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-ink-100">
              <span className="text-[13px] text-ink-600">Driver risk score</span>
              <Badge tone={(driver?.violations ?? 0) > 1 ? 'amber' : 'green'}>
                {(driver?.violations ?? 0) > 1 ? 'Watch' : 'Good'}
              </Badge>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
