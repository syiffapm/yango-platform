import { useEffect, useMemo, useState } from 'react'
import { Banknote, Check, Copy, CreditCard, Loader2, ShieldCheck, Smartphone, Landmark } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Qr from '../ui/Qr.jsx'
import { Field, Input, Select } from '../ui/Field.jsx'
import BrandTile from './BrandTile.jsx'
import { methodById, VA_BANKS } from '../../data/payments.js'
import { MMK } from '../../lib/format.js'
import { useToast } from '../ui/Toast.jsx'
const EXPIRY_SECONDS = 600

/**
 * Checkout for one order. Each method completes the way it really does:
 * a wallet debit, a QR to scan, a virtual account to transfer to, or a card form.
 * Nothing here talks to a provider — the callback is simulated.
 */
export default function PaymentSheet({ open, onClose, methodId, amount, reference, onPaid }) {
  const method = methodById(methodId)
  const toast = useToast()
  const [stage, setStage] = useState('detail') // detail | waiting | done
  const [left, setLeft] = useState(EXPIRY_SECONDS)
  const [bank, setBank] = useState(VA_BANKS[0].code)
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '', otp: '' })
  const [cardStep, setCardStep] = useState('form')
  useEffect(() => {
    if (!open) {
      setStage('detail')
      setLeft(EXPIRY_SECONDS)
      setCardStep('form')
    }
  }, [open, methodId])
  useEffect(() => {
    if (!open || stage === 'done') return
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(t)
  }, [open, stage])
  const va = useMemo(() => {
    const b = VA_BANKS.find((x) => x.code === bank) || VA_BANKS[0]
    const tail = String(Math.abs(reference?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 1234) * 7)
      .slice(0, 8)
      .padEnd(8, '0')
    return `${b.prefix} ${tail.slice(0, 4)} ${tail.slice(4)}`
  }, [bank, reference])
  const qrPayload = `${method.id.toUpperCase()}|${reference}|${amount}|MMK`
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const settle = () => {
    setStage('waiting')
    setTimeout(() => {
      setStage('done')
      setTimeout(() => onPaid(), 700)
    }, 1200)
  }
  const copy = (text, what) => {
    navigator.clipboard?.writeText(text.replace(/\s/g, ''))
    toast({ title: `${what} copied` })
  }
  const cardValid = card.number.replace(/\s/g, '').length >= 15 && card.name && card.exp && card.cvv.length >= 3
  const header = (
    <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 mb-4">
      <BrandTile method={method} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink-900">{method.name}</p>
        <p className="text-[12px] text-ink-500">{method.note}</p>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-semibold text-brand-700">{MMK(amount)}</p>
        <p className="text-[11px] text-ink-400 font-mono">{reference}</p>
      </div>
    </div>
  )
  const expiry = stage !== 'done' && (
    <p className="text-[12px] text-ink-500 text-center mt-3">
      This payment expires in{' '}
      <strong className="tabular-nums text-ink-800">
        {mm}:{ss}
      </strong>
      . Your seat is held until then.
    </p>
  )
  return (
    <Modal
      open={open}
      onClose={stage === 'waiting' ? undefined : onClose}
      title={stage === 'done' ? 'Payment received' : 'Complete your payment'}
      subtitle={stage === 'done' ? 'Issuing your e-ticket…' : undefined}
      width="max-w-md"
    >
      {stage === 'done' ? (
        <div className="py-8 text-center">
          <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-emerald-50">
            <Check size={28} className="text-emerald-600" />
          </span>
          <p className="text-[14px] font-semibold text-ink-900 mt-3">{MMK(amount)} paid</p>
          <p className="text-[12px] text-ink-500 mt-1">Reference {reference}</p>
        </div>
      ) : stage === 'waiting' ? (
        <div className="py-10 text-center">
          <Loader2 size={30} className="text-brand-600 mx-auto animate-spin" />
          <p className="text-[13px] text-ink-700 mt-3">Waiting for the provider callback…</p>
          <p className="text-[12.5px] text-ink-400 mt-1">Requests are idempotent, so a retry never charges twice.</p>
        </div>
      ) : (
        <>
          {header}

          {method.kind === 'card-tap' && (
            <div className="text-center py-4">
              <CreditCard size={26} className="text-brand-600 mx-auto" />
              <p className="text-[12.5px] text-ink-700 mt-2 leading-relaxed">
                Tap your YPS card on the POS reader by the door. The POS is checked before every departure, so if it
                does not read, the conductor sells you a cash ticket instead.
              </p>
              <Button variant="primary" full size="lg" className="mt-4" onClick={settle}>
                I have tapped my card
              </Button>
            </div>
          )}

          {method.kind === 'cash' && (
            <div className="text-center py-4">
              <Banknote size={26} className="text-brand-600 mx-auto" />
              <p className="text-[12.5px] text-ink-700 mt-2 leading-relaxed">
                Pay {MMK(amount)} to the conductor on board. Your seat is held until the bus leaves.
              </p>
              <Button variant="primary" full size="lg" className="mt-4" onClick={settle}>
                Reserve and pay on board
              </Button>
            </div>
          )}

          {method.kind === 'wallet' && (
            <div className="text-center py-4">
              <Landmark size={26} className="text-brand-600 mx-auto" />
              <p className="text-[12.5px] text-ink-700 mt-2 leading-relaxed">
                {MMK(amount)} will be debited from your YanGo wallet immediately.
              </p>
              <Button variant="primary" full size="lg" className="mt-4" onClick={settle}>
                Pay from wallet
              </Button>
            </div>
          )}

          {method.kind === 'qr' && (
            <div className="text-center">
              <div className="inline-block rounded-2xl border-2 p-3" style={{ borderColor: method.bg }}>
                <Qr value={qrPayload} size={180} />
              </div>
              <p className="text-[12.5px] text-ink-700 mt-3">Open {method.name} and scan this code</p>
              <p className="text-[12px] text-ink-400 mt-1">Merchant: YanGo Ticketing · {reference}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  full
                  icon={Smartphone}
                  onClick={() =>
                    toast({
                      title: `Opening ${method.name}…`,
                      body: 'On a phone this deep-links straight into the wallet app.',
                    })
                  }
                >
                  Open app
                </Button>
                <Button full variant="primary" onClick={settle}>
                  I have paid
                </Button>
              </div>
              {expiry}
            </div>
          )}

          {method.kind === 'va' && (
            <div>
              <Field label="Transfer from" className="mb-3">
                <Select value={bank} onChange={(e) => setBank(e.target.value)}>
                  {VA_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-3.5">
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400">Virtual account number</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="flex-1 text-[19px] font-semibold tabular-nums text-ink-900 tracking-wide">{va}</p>
                  <Button size="xs" icon={Copy} onClick={() => copy(va, 'Account number')}>
                    Copy
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-ink-200">
                  <div>
                    <p className="text-[11.5px] uppercase tracking-wider text-ink-400">Amount</p>
                    <p className="text-[13.5px] font-semibold text-ink-900">{MMK(amount)}</p>
                  </div>
                  <div>
                    <p className="text-[11.5px] uppercase tracking-wider text-ink-400">Account name</p>
                    <p className="text-[13.5px] text-ink-900">YanGo Ticketing</p>
                  </div>
                </div>
              </div>

              <ol className="mt-3 space-y-1.5">
                {[
                  `Open your ${VA_BANKS.find((b) => b.code === bank)?.name} app and choose Transfer → Virtual account.`,
                  'Enter the account number above and transfer the exact amount.',
                  'Your ticket is issued automatically when the bank confirms.',
                ].map((s, i) => (
                  <li key={s} className="flex gap-2 text-[12.5px] text-ink-600">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-ink-100 text-ink-600 text-[10.5px] grid place-items-center font-semibold">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>

              <Button variant="primary" full size="lg" className="mt-4" onClick={settle}>
                I have transferred
              </Button>
              {expiry}
            </div>
          )}

          {method.kind === 'card' &&
            (cardStep === 'form' ? (
              <div className="space-y-3">
                <Field label="Card number" required>
                  <Input
                    inputMode="numeric"
                    value={card.number}
                    placeholder="5522 0000 0000 0000"
                    onChange={(e) =>
                      setCard((c) => ({ ...c, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) }))
                    }
                  />
                </Field>
                <Field label="Name on card" required>
                  <Input value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry" required>
                    <Input
                      placeholder="MM/YY"
                      value={card.exp}
                      onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value.slice(0, 5) }))}
                    />
                  </Field>
                  <Field label="CVV" required>
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={card.cvv}
                      onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['MPU', 'Visa', 'Mastercard', 'JCB'].map((n) => (
                    <Badge key={n} tone="slate">
                      {n}
                    </Badge>
                  ))}
                </div>
                <p className="text-[12px] text-ink-400 inline-flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Card details are tokenised at the gateway — YanGo never stores them.
                </p>
                <Button
                  variant="primary"
                  full
                  size="lg"
                  icon={CreditCard}
                  disabled={!cardValid}
                  onClick={() => setCardStep('otp')}
                >
                  Pay {MMK(amount)}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <ShieldCheck size={26} className="text-brand-600 mx-auto" />
                <p className="text-[13px] font-semibold text-ink-900 mt-2">3-D Secure</p>
                <p className="text-[12.5px] text-ink-500 mt-1">
                  Your bank sent a one-time code to the number ending 234.
                </p>
                <Input
                  className="mt-3 text-center tracking-[0.4em]"
                  inputMode="numeric"
                  placeholder="······"
                  value={card.otp}
                  onChange={(e) => setCard((c) => ({ ...c, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                />
                <Button
                  variant="primary"
                  full
                  size="lg"
                  className="mt-3"
                  disabled={card.otp.length < 4}
                  onClick={settle}
                >
                  Confirm payment
                </Button>
                {expiry}
              </div>
            ))}
        </>
      )}
    </Modal>
  )
}
