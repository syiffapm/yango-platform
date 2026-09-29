import { useState } from 'react'
import { useLicensingBase } from '../mount.jsx'
import { useTx } from '../../../lib/adminLang.js'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  BadgeCheck,
  CalendarClock,
  Check,
  CreditCard,
  FileText,
  Gavel,
  RotateCcw,
  ScanLine,
  Send,
  ShieldCheck,
  Stamp,
  X,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input, Select } from '../../../components/ui/Field.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import Qr from '../../../components/ui/Qr.jsx'
import { Steps } from '../../../components/ui/Progress.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { countdown, dt, MMK, relative } from '../../../lib/format.js'
import { licenceTypes, operators } from '../../../data/org.js'
const FLOW = ['Submitted', 'Paid', 'Verified', 'Inspected', 'Approved']
const stepOf = (a) => {
  if (a.state === 'approved') return 4
  if (a.state === 'awaiting_approval') return 3
  if (a.state === 'inspection') return 2
  if (a.state === 'in_review' || a.state === 'revision') return 2
  if (a.paid) return 1
  return 0
}
export default function ApplicationDetail() {
  const licBase = useLicensingBase()
  const tx = useTx()
  const { id } = useParams()
  const nav = useNavigate()
  const { db, update, audit, notify } = useDb()
  const [ses] = useSession('licensing')
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [reasonAction, setReasonAction] = useState(null)
  const [inspectOpen, setInspectOpen] = useState(false)
  const [inspect, setInspect] = useState({ date: '', inspector: 'U03', location: 'Aung Mingalar ramp bay 3' })
  const app = db.applications.find((a) => a.id === id)
  if (!app)
    return (
      <Empty
        title="Application not found"
        action={
          <Button as={Link} to={`${licBase}/queue`}>
            Back to queue
          </Button>
        }
      />
    )
  const me = db.users.find((u) => u.id === ses.userId)
  const isApprover = me?.role === 'lic_approver'
  const isOfficer = me?.role === 'lic_officer'
  const officerMode = ses.mode === 'officer'
  const type = licenceTypes.find((t) => t.code === app.type)
  const invoice = db.invoices.find((i) => i.id === app.invoiceId)
  const sla = countdown(app.slaDueAt)
  const allChecked = app.checklist.every((c) => c.result === 'pass')
  const sameOfficer = app.officer === ses.userId
  const touch = (fn, timelineEntry) =>
    update((d) => {
      const a = d.applications.find((x) => x.id === id)
      fn(a, d)
      if (timelineEntry) a.timeline.unshift({ at: new Date().toISOString(), actor: ses.userId, ...timelineEntry })
    })

  /* ------------------------------------------------------------- actions */ const payNow = () => {
    touch(
      (a, d) => {
        a.paid = true
        a.state = 'in_review'
        const inv = d.invoices.find((i) => i.id === a.invoiceId)
        if (inv) {
          inv.status = 'paid'
          inv.method = 'Bank virtual account (KBZ)'
          inv.receiptNo = `RCT-${Math.floor(70000 + Math.random() * 9000)}`
          inv.treasuryPosted = true
        }
      },
      { action: 'Payment confirmed — e-receipt issued' },
    )
    audit({
      actor: ses.userId,
      role: 'applicant',
      action: 'Paid licence invoice',
      object: app.invoiceId,
      category: 'Administration',
    })
    notify({
      audience: 'operator',
      title: 'Payment received',
      body: `Invoice ${app.invoiceId} paid. ${app.id} moved to officer review.`,
    })
    toast({ title: 'Payment confirmed', body: 'A numbered, digitally signed e-receipt has been issued.' })
  }
  const setCheck = (idx, result) =>
    touch((a) => {
      a.checklist[idx].result = result
    })
  const scheduleInspection = () => {
    touch(
      (a) => {
        a.state = 'inspection'
        a.inspection = {
          scheduledAt: new Date(inspect.date || Date.now() + 86400000).toISOString(),
          inspector: inspect.inspector,
          location: inspect.location,
          result: null,
          photos: [],
        }
      },
      { action: 'Inspection scheduled' },
    )
    audit({
      actor: ses.userId,
      role: 'lic_officer',
      action: 'Scheduled inspection',
      object: app.id,
      category: 'Administration',
    })
    notify({
      audience: 'operator',
      title: 'Inspection scheduled',
      body: `${app.id}: ramp check at ${inspect.location}.`,
    })
    setInspectOpen(false)
    toast({ title: 'Inspection scheduled' })
  }
  const recordInspection = (result) => {
    touch(
      (a) => {
        a.inspection.result = result
        a.state = result === 'pass' ? 'awaiting_approval' : 'revision'
      },
      { action: `Inspection recorded: ${result}` },
    )
    audit({
      actor: ses.userId,
      role: 'lic_officer',
      action: 'Recorded inspection result',
      object: app.id,
      reason: `Ramp check ${result}`,
      category: 'Administration',
    })
    toast({ title: `Inspection ${result}`, kind: result === 'pass' ? 'success' : 'error' })
  }
  const sendToApproval = () => {
    touch(
      (a) => {
        a.state = 'awaiting_approval'
      },
      { action: 'Verification complete — sent to approver' },
    )
    audit({
      actor: ses.userId,
      role: 'lic_officer',
      action: 'Verified application',
      object: app.id,
      category: 'Administration',
    })
    toast({ title: 'Sent for approval', body: 'A different officer must sign this off.' })
  }
  const issuePermits = (a, d) => {
    const op = operators.find((o) => o.id === a.operator)
    const years = a.type === 'PO_BUSINESS' ? 5 : a.type === 'ROUTE' ? 3 : 1
    for (let i = 0; i < a.quantity; i++) {
      d.permits.unshift({
        id: `PM-${a.type.slice(0, 3)}-${a.id.slice(-4)}${i ? `-${i + 1}` : ''}`,
        type: a.type,
        holderType: a.type === 'DRIVER' ? 'driver' : a.type === 'VEHICLE' ? 'vehicle' : 'operator',
        holder: a.operator || 'self',
        holderName: op ? op.name : a.applicantName,
        operator: a.operator,
        issued: new Date().toISOString().slice(0, 10),
        expiry: new Date(Date.now() + years * 365 * 86400000).toISOString().slice(0, 10),
        status: 'valid',
        terms: { class: a.typeLabel, source: a.id },
        version: 1,
        history: [],
      })
    }
  }
  const approve = (reason) => {
    touch(
      (a, d) => {
        a.state = 'approved'
        a.approver = ses.userId
        a.decision = { by: ses.userId, at: new Date().toISOString(), reason }
        issuePermits(a, d)
      },
      { action: 'Approved — e-permit issued' },
    )
    audit({
      actor: ses.userId,
      role: 'lic_approver',
      action: 'Approved application',
      object: app.id,
      reason,
      category: 'Administration',
    })
    notify({
      audience: 'operator',
      title: 'Licence approved',
      body: `${app.typeLabel} approved. Signed e-permit with QR is available in My licences.`,
    })
    toast({ title: 'Approved', body: `${app.quantity} e-permit(s) issued with a verifiable QR.` })
  }
  const reject = (reason) => {
    touch(
      (a) => {
        a.state = 'rejected'
        a.approver = ses.userId
        a.decision = { by: ses.userId, at: new Date().toISOString(), reason }
      },
      { action: 'Rejected' },
    )
    audit({
      actor: ses.userId,
      role: 'lic_approver',
      action: 'Rejected application',
      object: app.id,
      reason,
      category: 'Administration',
    })
    notify({ audience: 'operator', title: 'Application rejected', body: `${app.id}: ${reason}` })
    toast({ title: 'Rejected', kind: 'error' })
  }
  const requestRevision = (reason) => {
    touch(
      (a) => {
        a.state = 'revision'
        a.decision = { by: ses.userId, at: new Date().toISOString(), reason }
      },
      { action: 'Revision requested' },
    )
    audit({
      actor: ses.userId,
      role: 'lic_officer',
      action: 'Requested revision',
      object: app.id,
      reason,
      category: 'Administration',
    })
    notify({ audience: 'operator', title: 'Revision requested', body: `${app.id}: ${reason}` })
    toast({ title: 'Returned to applicant', kind: 'info' })
  }
  const resubmit = () => {
    touch(
      (a) => {
        a.state = 'in_review'
        a.checklist.forEach((c) => {
          c.result = null
        })
        a.documents.forEach((doc) => {
          doc.status = 'verified'
        })
      },
      { action: 'Resubmitted with corrected documents' },
    )
    toast({ title: 'Resubmitted', body: 'The application is back in the officer queue.' })
  }

  /* ------------------------------------------------------------ rendering */ const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'documents', label: 'Documents', count: app.documents.length },
    { value: 'checklist', label: 'Verification', count: app.checklist.length },
    { value: 'registry', label: 'Registry checks' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'timeline', label: 'Timeline', count: app.timeline.length },
  ]
  return (
    <>
      <div className="mb-4">
        <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={() => nav(-1)}>
          Back
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[20px] font-semibold text-ink-900">{app.id}</h1>
            <StatusPill status={app.state} />
            {app.selfApply && <Badge tone="violet">Self-apply</Badge>}
          </div>
          <p className="text-[12.5px] text-ink-500 mt-1">
            {app.typeLabel} · {app.applicantName} · qty {app.quantity} · submitted {relative(app.submittedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[12.5px] tabular-nums px-2.5 py-1.5 rounded-lg border ${sla.overdue ? 'border-red-200 bg-red-50 text-red-700' : 'border-ink-200 bg-white text-ink-600'}`}
          >
            SLA {sla.text}
          </span>

          {!app.paid && (
            <Button variant="primary" icon={CreditCard} onClick={payNow}>
              Pay {MMK(app.fee)}
            </Button>
          )}
          {officerMode && app.state === 'in_review' && (
            <>
              <Button icon={CalendarClock} onClick={() => setInspectOpen(true)}>
                Schedule inspection
              </Button>
              <Button variant="warning" icon={RotateCcw} onClick={() => setReasonAction('revision')}>
                Request revision
              </Button>
              <Button
                variant="primary"
                icon={Send}
                disabled={!allChecked}
                onClick={sendToApproval}
                title={allChecked ? '' : 'Mark every checklist item first'}
              >
                Send to approver
              </Button>
            </>
          )}
          {officerMode && app.state === 'inspection' && (
            <>
              <Button variant="danger" icon={X} onClick={() => recordInspection('fail')}>
                Inspection failed
              </Button>
              <Button variant="primary" icon={Check} onClick={() => recordInspection('pass')}>
                Inspection passed
              </Button>
            </>
          )}
          {officerMode &&
            app.state === 'awaiting_approval' &&
            (isApprover && !sameOfficer ? (
              <>
                <Button variant="danger" icon={Ban} onClick={() => setReasonAction('reject')}>
                  Reject
                </Button>
                <Button variant="primary" icon={Stamp} onClick={() => setReasonAction('approve')}>
                  Approve &amp; issue e-permit
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <ShieldCheck size={13} />
                {sameOfficer
                  ? 'Blocked — you verified this application (maker ≠ checker)'
                  : 'Switch to the approver identity to sign off'}
              </span>
            ))}
          {!officerMode && app.state === 'revision' && (
            <Button variant="primary" icon={Send} onClick={resubmit}>
              Resubmit corrected documents
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-5">
        <CardBody>
          <Steps steps={FLOW} current={stepOf(app)} />
        </CardBody>
      </Card>

      <Tabs value={tab} onChange={setTab} tabs={tabs} className="mb-4" />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Application" subtitle={app.note} icon={FileText} />
            <CardBody className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                ['Licence type', app.typeLabel],
                ['Validity', type?.validity],
                ['Fee basis', type?.feeBasis],
                ['Quantity', app.quantity],
                ['Applicant', app.applicantName],
                ['Assigned officer', db.users.find((u) => u.id === app.officer)?.name || 'Unassigned'],
                ['Approver', db.users.find((u) => u.id === app.approver)?.name || '—'],
                ['Submitted', dt(app.submittedAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                  <p className="text-[13px] text-ink-900 mt-0.5">{v ?? '—'}</p>
                </div>
              ))}
              {app.decision && (
                <div className="sm:col-span-2 rounded-lg border border-ink-200 bg-ink-50 p-3 mt-1">
                  <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">
                    Written reason on the last decision
                  </p>
                  <p className="text-[12.5px] text-ink-800 leading-relaxed">“{app.decision.reason}”</p>
                  <p className="text-[11.5px] text-ink-400 mt-1.5">
                    {db.users.find((u) => u.id === app.decision.by)?.name || app.decision.by} · {dt(app.decision.at)}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="E-Permit" subtitle="Issued on approval, signed and verifiable" icon={BadgeCheck} />
            <CardBody>
              {app.state === 'approved' ? (
                <div className="text-center">
                  <Qr
                    value={`PM-${app.type.slice(0, 3)}-${app.id.slice(-4)}`}
                    size={132}
                    className="mx-auto border border-ink-200"
                  />
                  <p className="text-[12px] text-ink-700 mt-3 font-medium">
                    {app.quantity}
                    permit(s) issued
                  </p>
                  <Button
                    size="sm"
                    className="mt-2.5"
                    as={Link}
                    to={`/verify/PM-${app.type.slice(0, 3)}-${app.id.slice(-4)}`}
                    icon={ScanLine}
                  >
                    Open public verification
                  </Button>
                </div>
              ) : (
                <Empty
                  compact
                  icon={Stamp}
                  title="Not issued yet"
                  hint="A signed PDF with a verifiable QR is generated the moment an approver signs the application off."
                />
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'documents' && (
        <Card>
          <CardHeader
            title="Document vault"
            subtitle="Uploaded, virus-scanned, OCR-read and reusable across applications"
          />
          <CardBody className="space-y-2">
            {app.documents.map((doc) => (
              <div key={doc.name} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <FileText size={16} className="text-ink-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-ink-900 truncate">{doc.name}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {doc.size} · uploaded {relative(doc.uploadedAt)} · OCR expiry {doc.ocr?.expiry}
                  </p>
                </div>
                <StatusPill status={doc.status} />
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {tab === 'checklist' && (
        <Card>
          <CardHeader
            title="Verification checklist"
            subtitle="The officer marks each item pass or fail; every item must pass before the application can go to an approver."
          />
          <CardBody className="space-y-2">
            {app.checklist.map((c, i) => (
              <div key={c.item} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <span className="flex-1 text-[12.5px] text-ink-800">{c.item}</span>
                {officerMode ? (
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      variant={c.result === 'pass' ? 'primary' : 'secondary'}
                      icon={Check}
                      onClick={() => setCheck(i, 'pass')}
                    >
                      Pass
                    </Button>
                    <Button
                      size="xs"
                      variant={c.result === 'fail' ? 'danger' : 'secondary'}
                      icon={X}
                      onClick={() => setCheck(i, 'fail')}
                    >
                      Fail
                    </Button>
                  </div>
                ) : (
                  <StatusPill status={c.result || 'pending'} />
                )}
              </div>
            ))}
            {officerMode && !allChecked && (
              <p className="text-[12.5px] text-amber-700 flex items-center gap-1.5 pt-1">
                <AlertTriangle size={13} /> All items must pass before the application can be sent to an approver.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'registry' && (
        <Card>
          <CardHeader
            title="Automatic registry validation"
            subtitle="National ID, driving licence, vehicle and company registries plus duplicate detection"
          />
          <CardBody className="space-y-2">
            {app.registryChecks.map((c) => (
              <div key={c.registry} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <span className="flex-1 text-[12.5px] text-ink-800">{c.registry}</span>
                <span className="text-[12px] text-ink-400">{c.ref}</span>
                <Badge
                  tone={c.result === 'match' || c.result === 'clear' ? 'green' : c.result === 'flag' ? 'red' : 'slate'}
                >
                  {c.result}
                </Badge>
              </div>
            ))}
            <p className="text-[12px] text-ink-400 pt-1">
              Where a registry API is unavailable, the officer falls back to manual verification against the uploaded
              document.
            </p>
          </CardBody>
        </Card>
      )}

      {tab === 'inspection' && (
        <Card>
          <CardHeader
            title="Physical inspection (ramp check)"
            subtitle="Slot booking, inspector assignment and result entry"
          />
          <CardBody>
            {app.inspection ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['Scheduled', dt(app.inspection.scheduledAt)],
                  [
                    'Inspector',
                    db.users.find((u) => u.id === app.inspection.inspector)?.name || app.inspection.inspector,
                  ],
                  ['Location', app.inspection.location],
                  ['Result', app.inspection.result || 'Pending'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                    <p className="text-[13px] text-ink-900 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                compact
                icon={CalendarClock}
                title="No inspection scheduled"
                hint="Vehicle and route permits normally require a ramp check before approval."
                action={
                  officerMode && (
                    <Button size="sm" variant="primary" onClick={() => setInspectOpen(true)}>
                      Schedule inspection
                    </Button>
                  )
                }
              />
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'invoice' && (
        <Card>
          <CardHeader
            title={`Invoice ${app.invoiceId}`}
            subtitle="Issued automatically from the versioned fee schedule"
          />
          <CardBody>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-ink-100">
              <div>
                <p className="text-[12px] text-ink-400 uppercase tracking-wider">Amount due</p>
                <p className="text-[24px] font-semibold text-ink-900 mt-1">{MMK(app.fee)}</p>
                <p className="text-[12.5px] text-ink-500 mt-1">
                  {type?.label} × {app.quantity} at {MMK(type?.fee)} each
                </p>
              </div>
              <StatusPill status={invoice?.status || (app.paid ? 'paid' : 'unpaid')} />
            </div>
            <dl className="divide-y divide-ink-100">
              {[
                ['Payment method', invoice?.method || 'Bank VA · e-wallet · card · counter'],
                ['Receipt number', invoice?.receiptNo || '—'],
                ['Treasury posting', invoice?.treasuryPosted ? 'Posted, reconciled daily' : 'Pending payment'],
                ['Fee schedule version', 'v2 · effective 2026-01-01'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-[12px] text-ink-500">{tx(k)}</dt>
                  <dd className="text-[12.5px] text-ink-900 font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {!app.paid && (
              <Button variant="primary" full icon={CreditCard} className="mt-4" onClick={payNow}>
                Pay now
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'timeline' && (
        <Card>
          <CardHeader
            title="Transition log"
            subtitle="Every state change is logged with actor and time; decisions carry a written reason."
          />
          <CardBody>
            <ol className="relative border-l border-ink-200 ml-1.5 space-y-4">
              {app.timeline.map((t, i) => (
                <li key={i} className="pl-5 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
                  <p className="text-[12.5px] text-ink-900">{t.action}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {dt(t.at)} · {db.users.find((u) => u.id === t.actor)?.name || t.actor}
                  </p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      {/* ----------------------------------------------------------- modals */}
      <Modal
        open={inspectOpen}
        onClose={() => setInspectOpen(false)}
        title="Schedule inspection"
        subtitle="Book a ramp-check slot and assign an inspector."
        footer={
          <>
            <Button onClick={() => setInspectOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={scheduleInspection}>
              Book slot
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Date and time" required>
            <Input
              type="datetime-local"
              value={inspect.date}
              onChange={(e) => setInspect((s) => ({ ...s, date: e.target.value }))}
            />
          </Field>
          <Field label="Inspector">
            <Select
              value={inspect.inspector}
              onChange={(e) => setInspect((s) => ({ ...s, inspector: e.target.value }))}
            >
              {db.users
                .filter((u) => ['lic_officer', 'compliance'].includes(u.role))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Location">
            <Input value={inspect.location} onChange={(e) => setInspect((s) => ({ ...s, location: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      <ReasonDialog
        open={reasonAction === 'approve'}
        onClose={() => setReasonAction(null)}
        onConfirm={approve}
        title="Approve and issue e-permit"
        variant="primary"
        confirmLabel="Approve"
        subtitle="Signing this off issues a permit with a verifiable QR and makes the holder sellable and trackable."
      />
      <ReasonDialog
        open={reasonAction === 'reject'}
        onClose={() => setReasonAction(null)}
        onConfirm={reject}
        title="Reject application"
        variant="danger"
        confirmLabel="Reject"
        subtitle="The applicant may appeal a rejection; the appeal is adjudicated by a different officer."
      />
      <ReasonDialog
        open={reasonAction === 'revision'}
        onClose={() => setReasonAction(null)}
        onConfirm={requestRevision}
        title="Request revision"
        variant="warning"
        confirmLabel="Return to applicant"
        subtitle="State exactly which document or field must be corrected."
      />

      {officerMode && (
        <p className="text-[12px] text-ink-400 mt-4 flex items-center gap-1.5">
          <Gavel size={12} /> Maker–checker:{' '}
          {isOfficer ? 'you verify, a different approver signs off' : 'you approve work verified by another officer'}.
        </p>
      )}
    </>
  )
}
