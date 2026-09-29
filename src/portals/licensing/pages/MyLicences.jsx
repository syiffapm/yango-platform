import { Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody } from '../../../components/ui/Card.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Qr from '../../../components/ui/Qr.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { dateOnly, daysUntil } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
import { useState } from 'react'
export default function MyLicences() {
  const { db } = useDb()
  const [ses] = useSession('licensing')
  const [tab, setTab] = useState('ALL')
  const mine = db.permits.filter((p) => p.holder === ses.operator || p.operator === ses.operator)
  const shown = tab === 'ALL' ? mine : mine.filter((p) => p.type === tab)
  return (
    <>
      <PageHeader
        title="My licences"
        subtitle="Every e-permit issued to your company, with a signed QR that anyone can verify from the roadside."
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'ALL', label: 'All', count: mine.length },
          ...licenceTypes
            .map((t) => ({
              value: t.code,
              label: t.label.replace(' licence', '').replace(' permit', ''),
              count: mine.filter((p) => p.type === t.code).length,
            }))
            .filter((t) => t.count > 0),
        ]}
      />

      {shown.length === 0 ? (
        <Empty title="No licences of this type" hint="Apply from the New application page." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const days = daysUntil(p.expiry)
            return (
              <Card key={p.id}>
                <CardBody>
                  <div className="flex gap-3">
                    <Qr value={p.id} size={76} className="border border-ink-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wider text-ink-400">
                        {licenceTypes.find((t) => t.code === p.type)?.label}
                      </p>
                      <p className="text-[13px] font-semibold text-ink-900 truncate mt-0.5">{p.holderName}</p>
                      {p.routeLabel && <p className="text-[12px] text-ink-500 truncate">{p.routeLabel}</p>}
                      <div className="flex items-center gap-1.5 mt-2">
                        <StatusPill status={p.status} />
                        {days <= 90 && days > 0 && <Badge tone="amber">{days}d left</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-100">
                    <span className="text-[12px] text-ink-500">Valid to {dateOnly(p.expiry)}</span>
                    <Button size="xs" icon={ScanLine} as={Link} to={`/verify/${p.id}`}>
                      Verify
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
