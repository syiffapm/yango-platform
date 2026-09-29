import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bus, Check, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { MobileFrame } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import OtpInput from '../../../components/ui/OtpInput.jsx'
import { phoneMM } from '../../../lib/format.js'
import { useSession } from '../../../lib/session.jsx'
import { useT, LANGS } from '../../../lib/i18n.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'

/**
 * Sign in or create an account — phone number and a six-digit code, nothing else.
 * Anything more is a barrier for a first-time rider.
 */
export default function Welcome() {
  const [, setSes] = useSession('citizen')
  const { t, lang, setLang } = useT()
  const toast = useToast()
  const nav = useNavigate()
  const [mode, setMode] = useState('signin')
  const [step, setStep] = useState('phone')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [resendIn, setResendIn] = useState(0)
  useEffect(() => {
    if (!resendIn) return
    const id = setInterval(() => setResendIn((n) => Math.max(0, n - 1)), 1000)
    return () => clearInterval(id)
  }, [resendIn])
  const phoneOk = phone.replace(/\D/g, '').length >= 7
  const ready = mode === 'register' ? phoneOk && name.trim().length > 1 : phoneOk
  const sendCode = () => {
    setStep('code')
    setResendIn(30)
    toast({ title: 'Code sent', body: `We sent a 6-digit code to ${phoneMM(phone)}. Any 6 digits work in this demo.` })
  }
  const finish = () => {
    setSes({
      signedIn: true,
      phone: phoneMM(phone),
      name: mode === 'register' ? name.trim() : 'Demo Citizen',
    })
    toast({ title: mode === 'register' ? 'Welcome to YanGo' : 'Welcome back' })
    nav('/citizen/home', { replace: true })
  }
  return (
    <MobileFrame>
      {/* brand panel */}
      <div className="bg-brand-800 text-white px-6 pt-10 pb-8 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.10] pagoda-pattern" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="w-12 h-12 rounded-2xl bg-white/15 grid place-items-center">
              <Bus size={24} />
            </span>
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-[12.5px] font-medium border ${lang === l.code ? 'bg-white text-brand-800 border-white' : 'border-white/30 text-white/80'}`}
                >
                  {l.short}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-[24px] font-semibold mt-5 leading-tight">YanGo</h1>
          <p className="text-[15px] text-white/90 leading-tight">မြန်မာ့ဘတ်စ်ကားခရီး</p>
          <p className="text-[13.5px] text-white/70 mt-2 leading-relaxed max-w-[280px]">
            Find your bus, buy a ticket and see where it is — across Myanmar.
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-8">
        {step === 'phone' ? (
          <>
            <div className="inline-flex rounded-xl bg-ink-100 p-1 mb-5">
              {[
                { v: 'signin', l: 'Sign in' },
                { v: 'register', l: 'Create account' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setMode(o.v)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium ${mode === o.v ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
                >
                  {o.l}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {mode === 'register' && (
                <Field label="Your name" required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="The name a conductor would call you"
                  />
                </Field>
              )}
              <Field label="Mobile number" required hint="We send a 6-digit code to this number.">
                <Input
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09 7xxx xxxx"
                />
              </Field>

              <Button variant="primary" full size="lg" icon={Phone} disabled={!ready} onClick={sendCode}>
                Send code
              </Button>

              <Button
                full
                size="lg"
                onClick={() => {
                  setSes({ signedIn: true })
                  nav('/citizen/home', { replace: true })
                }}
              >
                Look around first
              </Button>

              <p className="text-[12.5px] text-ink-400 leading-relaxed inline-flex items-start gap-2">
                <ShieldCheck size={13} className="text-brand-600 mt-px shrink-0" />
                Your number is used to send tickets and safety messages. It is never shown on any government dashboard.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep('phone')}
                className="p-2 -ml-2 rounded-lg text-ink-500 hover:bg-ink-100"
                aria-label={t('common.back')}
              >
                <ArrowLeft size={18} />
              </button>
              <span className="inline-grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 shrink-0">
                <UserRound size={21} className="text-brand-700" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[18px] font-semibold text-ink-900 leading-tight">Enter the code</h2>
                <p className="text-[13.5px] text-ink-500 truncate">
                  Sent to {phoneMM(phone)} ·{' '}
                  <button onClick={() => setStep('phone')} className="text-brand-700 underline">
                    change
                  </button>
                </p>
              </div>
            </div>

            <OtpInput value={code} onChange={setCode} />

            <Button
              variant="primary"
              full
              size="lg"
              className="mt-5"
              icon={Check}
              disabled={code.length < 6}
              onClick={finish}
            >
              {mode === 'register' ? 'Create my account' : 'Sign in'}
            </Button>

            <button
              onClick={sendCode}
              disabled={resendIn > 0}
              className="w-full text-[13.5px] py-3 text-brand-700 disabled:text-ink-400"
            >
              {resendIn > 0 ? `Send it again in ${resendIn}s` : 'Send it again'}
            </button>
          </>
        )}
      </div>
    </MobileFrame>
  )
}
