import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, IdCard, ScanFace, Smartphone, Upload } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Field, Input, Select } from '../../../components/ui/Field.jsx'
import { Steps } from '../../../components/ui/Progress.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
const STEPS = ['Phone OTP', 'eKYC', 'Documents', 'Choose operator']
const DOCS = [
  'Driving licence',
  'National ID (NRC)',
  'Medical certificate',
  'Police clearance',
  'Training certificate',
  'Photo',
]
export default function Onboarding() {
  const { db, update, notify } = useDb()
  const toast = useToast()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [docs, setDocs] = useState({})
  const [name, setName] = useState('')
  const [operator, setOperator] = useState('PO03')
  const allDocs = DOCS.every((d) => docs[d])
  const submit = () => {
    const id = `D${String(950 + db.drivers.length)}`
    update((d) => {
      d.drivers.unshift({
        id,
        name: name || 'New Driver',
        nrc: '12/MaGaDa(N)000000',
        phone,
        operator,
        licenceNo: `DL-${300000 + d.drivers.length}`,
        licenceClass: 'D',
        licenceExpiry: '2029-01-31',
        medicalExpiry: '2027-12-31',
        trainingExpiry: '2028-06-30',
        policeClearance: '2026-09-01',
        status: 'pending',
        rating: 0,
        violations: 0,
        hoursThisWeek: 0,
        vehicle: null,
        photo: null,
      })
    })
    notify({
      audience: 'operator',
      title: 'Driver self-registration',
      body: `${name || 'A driver'} applied to join your company. Accept before the authority reviews.`,
    })
    toast({ title: 'Application submitted', body: 'Your chosen operator accepts first, then the authority reviews.' })
    nav('/driver/home')
  }
  return (
    <div>
      <AppBar title="Driver registration" subtitle="Path B — self-apply and choose a licensed operator" back />

      <div className="p-4">
        <Steps steps={STEPS} current={step} className="mb-5" />

        {step === 0 && (
          <div className="space-y-3">
            <div className="grid place-items-center py-6">
              <Smartphone size={40} className="text-brand-600" />
            </div>
            <Field label="Mobile number" required>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+95 9 …" />
            </Field>
            <Field label="One-time code" hint="Any 6 digits work in this demo">
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
            </Field>
            <Button variant="primary" full disabled={!phone || otp.length < 4} onClick={() => setStep(1)}>
              Verify and continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="grid place-items-center py-6">
              <ScanFace size={40} className="text-brand-600" />
            </div>
            <Field label="Full name (as on the NRC)" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="rounded-xl border border-ink-200 bg-white p-3.5">
              <p className="text-[13px] text-ink-700 leading-relaxed">
                Your ID photo is read by OCR and matched against a liveness-checked selfie. Match and liveness scores
                are advisory — a licensing officer makes the decision.
              </p>
              <Badge tone="green" className="mt-2">
                <Check size={10} /> Match 97.1% · liveness passed
              </Badge>
            </div>
            <Button variant="primary" full disabled={!name} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            {DOCS.map((d) => (
              <button
                key={d}
                onClick={() => setDocs((s) => ({ ...s, [d]: !s[d] }))}
                className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left ${docs[d] ? 'border-brand-300 bg-brand-50' : 'border-dashed border-ink-300'}`}
              >
                {docs[d] ? (
                  <Check size={16} className="text-brand-600" />
                ) : (
                  <Upload size={16} className="text-ink-400" />
                )}
                <span className="flex-1 text-[13.5px] text-ink-900">{d}</span>
                {docs[d] && <Badge tone="green">Uploaded</Badge>}
              </button>
            ))}
            <Button variant="primary" full className="mt-2" disabled={!allDocs} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="grid place-items-center py-4">
              <IdCard size={40} className="text-brand-600" />
            </div>
            <Field
              label="Which operator do you want to drive for?"
              required
              hint="Only licensed operators are listed. They accept you before the authority reviews."
            >
              <Select value={operator} onChange={(e) => setOperator(e.target.value)}>
                {(db.operators || [])
                  .filter((o) => o.licence === 'valid')
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-3.5">
              <p className="text-[13px] text-brand-900 leading-relaxed">
                Next: the operator accepts, a licence fee is invoiced, an officer verifies your documents against the
                driving-licence and blacklist registries, and an approver issues your digital driver card.
              </p>
            </div>
            <Button variant="primary" full onClick={submit}>
              Submit registration
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
