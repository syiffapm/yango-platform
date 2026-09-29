import { useMemo, useState } from 'react'
import { useLicensingBase } from '../mount.jsx'
import { useTx } from '../../../lib/adminLang.js'
import { useNavigate } from 'react-router-dom'
import { Bus, Check, FileText, IdCard, Route as RouteIcon, ShieldCheck, Upload, Users } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import { Steps } from '../../../components/ui/Progress.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Field, Input, RadioCards, Select, Textarea, Checkbox } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK } from '../../../lib/format.js'
import { licenceTypes, operators } from '../../../data/org.js'
import { routes } from '../../../data/geo.js'
const ICONS = {
  PO_BUSINESS: ShieldCheck,
  VEHICLE: Bus,
  ROUTE: RouteIcon,
  CHARTER: FileText,
  DRIVER: IdCard,
  CREW: Users,
}
const STEPS = ['Licence type', 'Details', 'Documents', 'Review & submit']
export default function Wizard() {
  const licBase = useLicensingBase()
  const tx = useTx()
  const { db, update, audit, notify } = useDb()
  const [ses] = useSession('licensing')
  const toast = useToast()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [type, setType] = useState('VEHICLE')
  const [form, setForm] = useState({
    quantity: 1,
    note: '',
    route: 'R01',
    hours: '05:00–22:00',
    headway: 9,
    vehicles: 3,
    plate: '',
    chassis: '',
    imei: '',
    driverName: '',
    nrc: '',
  })
  const [docs, setDocs] = useState({})
  const [declare, setDeclare] = useState(false)
  const lt = licenceTypes.find((t) => t.code === type)
  const op = operators.find((o) => o.id === ses.operator)
  const fee = lt.fee * Number(form.quantity || 1)
  const allDocs = useMemo(() => lt.docs.every((d) => docs[d]), [lt, docs])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = () => {
    const id = `APP-2026-${1100 + db.applications.length}`
    const invoiceId = `INV-L-${5300 + db.applications.length}`
    update((d) => {
      d.applications.unshift({
        id,
        type,
        typeLabel: lt.label,
        operator: ses.operator,
        applicantName: op.name,
        quantity: Number(form.quantity || 1),
        note: form.note || `${lt.label} application`,
        selfApply: false,
        state: 'awaiting_payment',
        officer: null,
        approver: null,
        submittedAt: new Date().toISOString(),
        slaDueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        fee,
        paid: false,
        invoiceId,
        documents: lt.docs.map((name) => ({
          name,
          status: 'verified',
          uploadedAt: new Date().toISOString(),
          ocr: { expiry: '2027-12-31' },
          size: '820 KB',
        })),
        checklist: lt.docs.map((name) => ({ item: `Verify ${name.toLowerCase()}`, result: null, comment: '' })),
        inspection: null,
        registryChecks: [
          { registry: 'National ID', result: 'match', ref: 'NRC-OK' },
          { registry: 'Driving licence', result: type === 'DRIVER' ? 'match' : 'n/a', ref: 'DL-OK' },
          { registry: 'Vehicle registry', result: type === 'VEHICLE' ? 'match' : 'n/a', ref: 'VR-OK' },
          { registry: 'Company registry', result: 'match', ref: 'DICA-OK' },
          { registry: 'Duplicate detection', result: 'clear', ref: '—' },
        ],
        decision: null,
        timeline: [
          { at: new Date().toISOString(), actor: 'Applicant', action: 'Application submitted — invoice issued' },
        ],
        formData: { ...form },
      })
      d.invoices.unshift({
        id: invoiceId,
        kind: 'licence',
        party: ses.operator,
        partyName: op.name,
        amount: fee,
        issuedAt: new Date().toISOString(),
        status: 'unpaid',
        ref: id,
        method: null,
        receiptNo: null,
        treasuryPosted: false,
      })
    })
    audit({
      actor: ses.operator,
      role: 'po_admin',
      action: 'Submitted licence application',
      object: id,
      category: 'Administration',
    })
    notify({ audience: 'authority', title: 'New application submitted', body: `${op.name} filed ${lt.label} (${id}).` })
    toast({ title: 'Application submitted', body: `Invoice ${invoiceId} for ${MMK(fee)} has been issued.` })
    nav(`${licBase}/application/${id}`)
  }
  return (
    <>
      <PageHeader
        title="New licence application"
        subtitle="A guided wizard with a document checklist driven by the licence type you choose. The fee is invoiced automatically from the versioned fee schedule."
      />

      <Card className="mb-5">
        <CardBody>
          <Steps steps={STEPS.map(tx)} current={step} />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {step === 0 && (
            <Card>
              <CardHeader
                title="What are you applying for?"
                subtitle="Each licence type has its own requirements, validity and fee basis."
              />
              <CardBody>
                <RadioCards
                  value={type}
                  onChange={setType}
                  cols={2}
                  options={licenceTypes.map((t) => ({
                    value: t.code,
                    label: tx(t.label),
                    icon: ICONS[t.code],
                    hint: `${tx(t.validity)} · ${tx(t.feeBasis)} · ${MMK(t.fee)}`,
                  }))}
                />
              </CardBody>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader title="Application details" subtitle={`${tx(lt.label)} — ${tx(lt.validity)}`} />
              <CardBody className="grid sm:grid-cols-2 gap-4">
                <Field label="Quantity" hint="Vehicles, drivers or crew covered by this application" required>
                  <Input type="number" min={1} max={20} value={form.quantity} onChange={set('quantity')} />
                </Field>
                {type === 'ROUTE' && (
                  <>
                    <Field label="Route" required>
                      <Select value={form.route} onChange={set('route')}>
                        {routes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.line} · {r.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Operating hours" required>
                      <Input value={form.hours} onChange={set('hours')} />
                    </Field>
                    <Field label="Minimum headway (min)" required>
                      <Input type="number" value={form.headway} onChange={set('headway')} />
                    </Field>
                    <Field
                      label="Vehicles required"
                      hint="Holdings must be at least required × spare ratio 1.42"
                      required
                    >
                      <Input type="number" value={form.vehicles} onChange={set('vehicles')} />
                    </Field>
                  </>
                )}
                {type === 'VEHICLE' && (
                  <>
                    <Field label="Plate number" required>
                      <Input placeholder="YGN-1A-2233" value={form.plate} onChange={set('plate')} />
                    </Field>
                    <Field label="Chassis number" required>
                      <Input placeholder="CHS90000" value={form.chassis} onChange={set('chassis')} />
                    </Field>
                    <Field
                      label="GPS device IMEI"
                      hint="Required before the vehicle can be tracked or sold on"
                      required
                    >
                      <Input placeholder="862045000000000" value={form.imei} onChange={set('imei')} />
                    </Field>
                  </>
                )}
                {(type === 'DRIVER' || type === 'CREW') && (
                  <>
                    <Field label="Full name" required>
                      <Input value={form.driverName} onChange={set('driverName')} />
                    </Field>
                    <Field label="National ID (NRC)" required>
                      <Input placeholder="12/MaGaDa(N)123456" value={form.nrc} onChange={set('nrc')} />
                    </Field>
                  </>
                )}
                <Field label="Note to the licensing officer" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={form.note}
                    onChange={set('note')}
                    placeholder="Anything the officer should know about this application…"
                  />
                </Field>
              </CardBody>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader
                title="Documents"
                subtitle="PDF or JPG up to 10 MB. Files are virus-scanned, OCR-read for expiry dates and reusable across applications."
              />
              <CardBody className="space-y-2">
                {lt.docs.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDocs((s) => ({ ...s, [d]: !s[d] }))}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${docs[d] ? 'border-brand-300 bg-brand-50/60' : 'border-dashed border-ink-300 hover:border-ink-400'}`}
                  >
                    {docs[d] ? (
                      <Check size={16} className="text-brand-600" />
                    ) : (
                      <Upload size={16} className="text-ink-400" />
                    )}
                    <span className="flex-1">
                      <span className="block text-[12.5px] font-medium text-ink-900">{tx(d)}</span>
                      <span className="block text-[12px] text-ink-500">
                        {docs[d]
                          ? tx('Uploaded · scanned') + ' · OCR 31 Dec 2027'
                          : tx('Click to attach from the document vault')}
                      </span>
                    </span>
                    {docs[d] && <Badge tone="green">Verified</Badge>}
                  </button>
                ))}
              </CardBody>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader
                title="Review and submit"
                subtitle="On submission an invoice is issued immediately. Officer review starts once payment is confirmed."
              />
              <CardBody>
                <dl className="divide-y divide-ink-100">
                  {[
                    ['Licence type', tx(lt.label)],
                    ['Applicant', op.name],
                    ['Quantity', form.quantity],
                    type === 'ROUTE' && ['Route', routes.find((r) => r.id === form.route)?.name],
                    type === 'VEHICLE' && ['Plate', form.plate || '—'],
                    (type === 'DRIVER' || type === 'CREW') && ['Name', form.driverName || '—'],
                    ['Documents attached', `${Object.values(docs).filter(Boolean).length} of ${lt.docs.length}`],
                    ['Validity if approved', tx(lt.validity)],
                  ]
                    .filter(Boolean)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[12px] text-ink-500">{tx(k)}</dt>
                        <dd className="text-[12.5px] text-ink-900 font-medium text-right">{v}</dd>
                      </div>
                    ))}
                </dl>
                <div className="mt-4 rounded-lg bg-brand-50 border border-brand-100 p-3.5 flex items-center justify-between">
                  <span className="text-[12.5px] text-brand-900">Fee payable on submission</span>
                  <span className="text-[17px] font-semibold text-brand-800">{MMK(fee)}</span>
                </div>
                <Checkbox
                  className="mt-4"
                  checked={declare}
                  onChange={(e) => setDeclare(e.target.checked)}
                  label="I declare that the information and documents provided are true and complete."
                  hint="False declarations are grounds for refusal, suspension or revocation."
                />
              </CardBody>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < 3 ? (
              <Button variant="primary" disabled={step === 2 && !allDocs} onClick={() => setStep((s) => s + 1)}>
                {step === 2 && !allDocs
                  ? `Attach ${lt.docs.length - Object.values(docs).filter(Boolean).length} more document(s)`
                  : 'Continue'}
              </Button>
            ) : (
              <Button variant="primary" disabled={!declare} onClick={submit}>
                Submit and issue invoice
              </Button>
            )}
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader title="Requirements" subtitle={tx(lt.label)} />
          <CardBody>
            <ul className="space-y-2">
              {lt.docs.map((d) => (
                <li key={d} className="flex items-start gap-2 text-[12px] text-ink-700">
                  <span
                    className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${docs[d] ? 'bg-brand-500' : 'bg-ink-300'}`}
                  />
                  {tx(d)}
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-ink-100 space-y-2 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">{tx('Validity')}</dt>
                <dd className="font-medium">{tx(lt.validity)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Fee basis</dt>
                <dd className="font-medium">{tx(lt.feeBasis)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Unit fee</dt>
                <dd className="font-medium">{MMK(lt.fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">SLA target</dt>
                <dd className="font-medium">5 working days</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
