import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Building2, Check, IdCard, Phone, ShieldCheck, UserPlus } from 'lucide-react'
import { MobileFrame } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import OtpInput from '../../../components/ui/OtpInput.jsx'
import { useT, LANGS } from '../../../lib/i18n.jsx'
import { phoneMM } from '../../../lib/format.js'

/**
 * Two ways in, as the BRD sets out (P2):
 *   Path A — the operator enters the driver, who activates the app from an SMS invite.
 *   Path B — the driver signs up and chooses a licensed operator, which accepts them.
 */
export default function DriverWelcome() {
  const { db } = useDb()
  const [, setSes] = useSession('driver')
  const toast = useToast()
  const { t, lang, setLang } = useT('driver')
  const nav = useNavigate()
  const [step, setStep] = useState('start') // start | phone | code | invite
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [match, setMatch] = useState(null)
  const digits = (v) => (v || '').replace(/\D/g, '')
  const sendCode = () => {
    setStep('code')
    toast({ title: 'Code sent', body: `We sent a 6-digit code to ${phoneMM(phone)}. Any 6 digits work in this demo.` })
  }
  const verify = () => {
    // An invited driver already exists in the operator's list.
    const found =
      db.drivers.find((d) => digits(d.phone).endsWith(digits(phone).slice(-6)) && digits(phone).length >= 6) ||
      db.drivers.find((d) => d.status === 'pending') ||
      db.drivers[0]
    setMatch(found)
    setStep('invite')
  }
  const accept = () => {
    setSes({ signedIn: true, driverId: match.id, shift: null })
    toast({
      title: 'You are signed in',
      body: `${match.name} · ${(db.operators || []).find((o) => o.id === match.operator)?.name}`,
    })
    nav('/driver/home', { replace: true })
  }
  const selfRegister = () => {
    setSes({ signedIn: true })
    nav('/driver/onboarding', { replace: true })
  }
  const operator = match ? (db.operators || []).find((o) => o.id === match.operator) : null
  return (
    <MobileFrame>
      <div className="relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 text-white px-6 pt-10 pb-8 rounded-b-[2rem]">
        <div className="absolute inset-0 opacity-[0.08] pagoda-pattern" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="w-12 h-12 rounded-2xl bg-white/15 grid place-items-center">
              <IdCard size={24} />
            </span>
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-[12.5px] font-medium border ${lang === l.code ? 'bg-white text-ink-900 border-white' : 'border-white/30 text-white/80'}`}
                >
                  {l.short}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-[22px] font-semibold mt-5 leading-tight">{t('drv.title')}</h1>
          <p className="text-[14px] text-white/80 leading-tight">ယာဉ်မောင်းအက်ပ်</p>
          <p className="text-[13.5px] text-white/70 mt-2 leading-relaxed max-w-[280px]">{t('drv.tagline')}</p>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-8">
        {step === 'start' && (
          <div className="space-y-3">
            <button
              onClick={() => setStep('phone')}
              className="w-full flex items-center gap-3 rounded-2xl border-2 border-brand-500 bg-brand-50 px-4 py-4 text-left"
            >
              <span className="w-10 h-10 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0">
                <Building2 size={19} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-brand-900">{t('drv.invited')}</span>
                <span className="block text-[13px] text-brand-800/70 leading-snug mt-0.5">{t('drv.invitedHint')}</span>
              </span>
            </button>

            <button
              onClick={selfRegister}
              className="w-full flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-4 text-left active:bg-ink-50"
            >
              <span className="w-10 h-10 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">
                <UserPlus size={19} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-ink-900">{t('drv.selfReg')}</span>
                <span className="block text-[13px] text-ink-500 leading-snug mt-0.5">{t('drv.selfRegHint')}</span>
              </span>
            </button>

            <p className="text-[12.5px] text-ink-400 leading-relaxed inline-flex items-start gap-2 pt-2">
              <ShieldCheck size={13} className="text-brand-600 mt-px shrink-0" />
              {t('drv.reviewNote')}
            </p>
          </div>
        )}

        {step === 'phone' && (
          <>
            <button
              onClick={() => setStep('start')}
              className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-500 mb-4"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="text-[18px] font-semibold text-ink-900">Your mobile number</h2>
            <p className="text-[13.5px] text-ink-500 mt-1">Use the number your company registered for you.</p>
            <Field label="Mobile number" required className="mt-4">
              <Input
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09 7xxx xxxx"
              />
            </Field>
            <Button
              variant="primary"
              full
              size="lg"
              icon={Phone}
              className="mt-4"
              disabled={digits(phone).length < 7}
              onClick={sendCode}
            >
              Send code
            </Button>
          </>
        )}

        {step === 'code' && (
          <>
            <button
              onClick={() => setStep('phone')}
              className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-500 mb-4"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="text-[18px] font-semibold text-ink-900">{t('drv.enterCode')}</h2>
            <p className="text-[13.5px] text-ink-500 mt-1 mb-5">We sent it to {phoneMM(phone)}.</p>
            <OtpInput value={code} onChange={setCode} />
            <Button
              variant="primary"
              full
              size="lg"
              className="mt-4"
              icon={Check}
              disabled={code.length < 6}
              onClick={verify}
            >
              Continue
            </Button>
          </>
        )}

        {step === 'invite' && match && (
          <>
            <h2 className="text-[18px] font-semibold text-ink-900">Confirm your details</h2>
            <p className="text-[13.5px] text-ink-500 mt-1">This is what your company registered.</p>

            <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 grid place-items-center text-[15px] font-semibold">
                  {match.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-900">{match.name}</p>
                  <p className="text-[13px] text-ink-500 truncate">{operator?.name}</p>
                </div>
              </div>
              <dl className="mt-3 pt-3 border-t border-ink-100 space-y-2 text-[13px]">
                {[
                  ['Licence number', match.licenceNo],
                  ['Licence class', match.licenceClass],
                  ['Assigned bus', db.vehicles.find((v) => v.id === match.vehicle)?.plate || 'Not assigned yet'],
                  ['Status', match.status === 'active' ? 'Approved' : 'Waiting for approval'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="text-ink-900 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3">
                {match.status === 'active' ? (
                  <Badge tone="green" icon={BadgeCheck}>
                    Ready to drive
                  </Badge>
                ) : (
                  <Badge tone="amber">The authority is still reviewing your documents</Badge>
                )}
              </div>
            </div>

            <Button variant="primary" full size="lg" className="mt-4" onClick={accept}>
              Yes, this is me
            </Button>
            <button onClick={() => setStep('start')} className="w-full text-[13.5px] text-ink-500 py-3">
              This is not me
            </button>
          </>
        )}
      </div>
    </MobileFrame>
  )
}
