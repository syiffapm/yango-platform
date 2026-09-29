import { Link } from 'react-router-dom'
import { BadgeCheck, FilePlus2, Receipt, Stamp, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { MMK, dateOnly, daysUntil, relative } from '../../../lib/format.js'
import { operators } from '../../../data/org.js'
export default function ApplicantHome() {
  const { db } = useDb()
  const [ses] = useSession('licensing')
  const op = operators.find((o) => o.id === ses.operator)
  const mine = db.applications.filter((a) => a.operator === ses.operator)
  const myPermits = db.permits.filter((p) => p.holder === ses.operator || p.operator === ses.operator)
  const unpaid = db.invoices.filter((i) => i.party === ses.operator && i.status === 'unpaid')
  const expiring = myPermits.filter((p) => daysUntil(p.expiry) <= 90 && daysUntil(p.expiry) > 0)
  return (
    <>
      <PageHeader
        title={op?.name}
        subtitle="Your regulatory workspace. Everything filed here flows straight into the Operator Portal, the Driver App and the Authority register — nothing is re-keyed."
        meta={
          <>
            <Badge tone="slate">Reg. {op?.regNo}</Badge>
            <Badge tone="slate">Tax {op?.taxId}</Badge>
            <StatusPill status={op?.licence} />
          </>
        }
        actions={
          <Button variant="primary" icon={FilePlus2} as={Link} to="/licensing/apply">
            New application
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Open applications"
          value={mine.filter((a) => !['approved', 'rejected'].includes(a.state)).length}
          method="Applications not yet approved or rejected."
        />
        <Stat
          label="Valid permits"
          value={myPermits.filter((p) => p.status === 'valid').length}
          tone="good"
          method="Business, vehicle, route and driver licences currently in force."
        />
        <Stat
          label="Expiring ≤ 90 days"
          value={expiring.length}
          tone={expiring.length ? 'warn' : 'default'}
          method="Reminders are sent at 90/60/30/7 days before expiry."
        />
        <Stat
          label="Unpaid invoices"
          value={MMK(unpaid.reduce((s, i) => s + i.amount, 0))}
          tone={unpaid.length ? 'warn' : 'default'}
          method="Licence fees invoiced but not yet settled."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Applications in progress"
            icon={Stamp}
            action={
              <Button size="xs" as={Link} to="/licensing/tracker">
                Open tracker
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {mine
              .filter((a) => !['approved', 'rejected'].includes(a.state))
              .slice(0, 5)
              .map((a) => (
                <Link
                  key={a.id}
                  to={`/licensing/application/${a.id}`}
                  className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5 hover:border-brand-300"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-ink-900">
                      {a.typeLabel} <span className="text-ink-400 font-normal">· {a.id}</span>
                    </p>
                    <p className="text-[12px] text-ink-500 truncate">
                      {a.note} · {relative(a.submittedAt)}
                    </p>
                  </div>
                  <StatusPill status={a.state} />
                </Link>
              ))}
            {mine.filter((a) => !['approved', 'rejected'].includes(a.state)).length === 0 && (
              <Empty
                compact
                title="No open applications"
                hint="Start a new application to add a vehicle, a route or a driver."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Expiring licences"
            icon={AlertTriangle}
            action={
              <Button size="xs" as={Link} to="/licensing/renewals">
                Renew
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {expiring.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-ink-900 truncate">{p.holderName}</p>
                  <p className="text-[12px] text-ink-500">
                    {p.routeLabel || p.terms?.class || p.type} · expires {dateOnly(p.expiry)}
                  </p>
                </div>
                <Badge tone="amber">{daysUntil(p.expiry)} days</Badge>
              </div>
            ))}
            {expiring.length === 0 && (
              <Empty
                compact
                icon={BadgeCheck}
                title="Nothing expiring soon"
                hint="All your licences are valid for more than 90 days."
              />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Unpaid invoices"
            icon={Receipt}
            action={
              <Button size="xs" as={Link} to="/licensing/invoices">
                All invoices
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {unpaid.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <span className="font-mono text-[12.5px] text-ink-500">{i.id}</span>
                <span className="flex-1 text-[12.5px] text-ink-800">
                  {db.applications.find((a) => a.invoiceId === i.id)?.typeLabel || i.kind}
                </span>
                <span className="text-[13px] font-medium">{MMK(i.amount)}</span>
                <Button size="xs" variant="primary" as={Link} to={`/licensing/application/${i.ref}`}>
                  Pay
                </Button>
              </div>
            ))}
            {unpaid.length === 0 && <Empty compact icon={Receipt} title="No outstanding invoices" />}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
