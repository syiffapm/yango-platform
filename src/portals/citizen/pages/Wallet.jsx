import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Plus, RotateCcw, Wallet as WalletIcon } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Field, Input, RadioCards } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dt } from '../../../lib/format.js'
const ICON = { topup: ArrowDownLeft, payment: ArrowUpRight, refund: RotateCcw }
export default function Wallet() {
  const { db, update } = useDb()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(10000)
  const [method, setMethod] = useState('kbzpay')
  const topUp = () => {
    update((d) => {
      d.wallet.balance += Number(amount)
      d.wallet.history.unshift({
        id: `W${Date.now()}`,
        at: new Date().toISOString(),
        type: 'topup',
        amount: Number(amount),
        note: `Top-up via ${method}`,
      })
    })
    toast({ title: 'Wallet topped up', body: `${MMK(amount)} added.` })
    setOpen(false)
  }
  return (
    <div>
      <AppBar title="Wallet" subtitle="Balance, top-up, history and refunds" back />

      <div className="p-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-5">
          <div className="flex items-center gap-2 text-white/70">
            <WalletIcon size={15} />
            <span className="text-[13px]">Available balance</span>
          </div>
          <p className="text-[30px] font-semibold mt-1.5 tabular-nums leading-none">{MMK(db.wallet.balance)}</p>
          <div className="flex items-center gap-2 mt-4">
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setOpen(true)}>
              Top up
            </Button>
            <Badge tone="slate" className="bg-white/15 text-white border-white/25">
              KYC level 1 · limit 500,000 MMK
            </Badge>
          </div>
        </div>

        <p className="text-[14px] font-semibold text-ink-900 mt-5 mb-2">Transactions</p>
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {db.wallet.history.map((h) => {
            const Icon = ICON[h.type] || ArrowUpRight
            const positive = h.amount > 0
            return (
              <div key={h.id} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-ink-50 last:border-0">
                <span
                  className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-100 text-ink-500'}`}
                >
                  <Icon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-ink-900 truncate">{h.note}</p>
                  <p className="text-[12px] text-ink-400">{dt(h.at)}</p>
                </div>
                <span
                  className={`text-[14px] font-semibold tabular-nums ${positive ? 'text-emerald-600' : 'text-ink-800'}`}
                >
                  {positive ? '+' : ''}
                  {MMK(h.amount)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Top up your wallet"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={topUp}>
              Top up {MMK(amount)}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[5000, 10000, 20000, 50000, 100000, 200000].map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`rounded-lg border py-2.5 text-[13.5px] font-medium ${amount === a ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-700'}`}
              >
                {a.toLocaleString()}
              </button>
            ))}
          </div>
          <Field label="Or enter an amount">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <div>
            <p className="text-[13px] font-medium text-ink-600 mb-2">Source</p>
            <RadioCards
              cols={2}
              value={method}
              onChange={setMethod}
              options={[
                { value: 'kbzpay', label: 'KBZPay' },
                { value: 'wave', label: 'Wave Money' },
                { value: 'ayapay', label: 'AYA Pay' },
                { value: 'bank', label: 'Bank transfer' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
