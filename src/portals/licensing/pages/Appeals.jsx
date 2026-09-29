import { useState } from 'react'
import { Gavel } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dt } from '../../../lib/format.js'
export default function Appeals() {
  const { db, update, audit, notify } = useDb()
  const [ses] = useSession('licensing')
  const toast = useToast()
  const [appealing, setAppealing] = useState(null)
  const refused = db.applications.filter(
    (a) => a.operator === ses.operator && ['rejected', 'revision'].includes(a.state),
  )
  const filed = db.applications.filter((a) => a.operator === ses.operator && a.appeal)
  const fileAppeal = (reason) => {
    update((d) => {
      const a = d.applications.find((x) => x.id === appealing.id)
      a.appeal = { at: new Date().toISOString(), reason, status: 'submitted', adjudicator: null, ruling: null }
      a.timeline.unshift({
        at: new Date().toISOString(),
        actor: ses.operator,
        action: 'Appeal filed against the decision',
      })
    })
    audit({
      actor: ses.operator,
      role: 'po_admin',
      action: 'Filed appeal',
      object: appealing.id,
      reason,
      category: 'Administration',
    })
    notify({
      audience: 'authority',
      title: 'Appeal filed',
      body: `${appealing.id} — appeal must be adjudicated by an officer who did not take the original decision.`,
    })
    toast({ title: 'Appeal filed', body: 'A different officer will adjudicate.' })
    setAppealing(null)
  }
  return (
    <>
      <PageHeader
        title="Appeals"
        subtitle="Appeal a rejection or a suspension. The appeal is adjudicated by an officer who did not take the original decision."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Decisions you can appeal" icon={Gavel} />
          <CardBody className="space-y-2">
            {refused.map((a) => (
              <div key={a.id} className="rounded-lg border border-ink-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-ink-900">
                      {a.typeLabel} · {a.id}
                    </p>
                    <p className="text-[12.5px] text-ink-600 mt-1 leading-relaxed">“{a.decision?.reason}”</p>
                    <p className="text-[11.5px] text-ink-400 mt-1">{dt(a.decision?.at)}</p>
                  </div>
                  <StatusPill status={a.state} />
                </div>
                {!a.appeal && (
                  <Button size="xs" variant="primary" className="mt-2.5" onClick={() => setAppealing(a)}>
                    Appeal this decision
                  </Button>
                )}
              </div>
            ))}
            {refused.length === 0 && (
              <Empty
                compact
                title="No refused decisions"
                hint="Nothing to appeal — all your applications are progressing."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Appeals filed" />
          <CardBody className="space-y-2">
            {filed.map((a) => (
              <div key={a.id} className="rounded-lg border border-ink-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] font-medium text-ink-900">{a.id}</p>
                  <Badge tone="blue">{a.appeal.status}</Badge>
                </div>
                <p className="text-[12.5px] text-ink-600 mt-1.5 leading-relaxed">“{a.appeal.reason}”</p>
                <p className="text-[11.5px] text-ink-400 mt-1">
                  Filed {dt(a.appeal.at)} · awaiting adjudicator assignment
                </p>
              </div>
            ))}
            {filed.length === 0 && <Empty compact title="No appeals filed" />}
          </CardBody>
        </Card>
      </div>

      <ReasonDialog
        open={!!appealing}
        onClose={() => setAppealing(null)}
        onConfirm={fileAppeal}
        title="File an appeal"
        confirmLabel="Submit appeal"
        variant="primary"
        minLength={25}
        subtitle="Set out the grounds and attach any evidence that contradicts the original finding."
      />
    </>
  )
}
