import { Building2, Gauge } from 'lucide-react'
import { HUB_URL } from '../../lib/portal.js'

/**
 * The Licensing Portal was a channel of its own until licensing was put back
 * where it belongs: a bus company applies for its own licences from the
 * Operator Portal, and the transport authority verifies and approves from the
 * Authority Console. This page keeps the old link working and says where each
 * side went.
 */
const SIDES = [
  {
    href: 'https://yango-operator.vercel.app/operator/licensing',
    icon: Building2,
    who: 'If you are a bus company',
    what: 'Bus Operator Portal',
    desc: 'Apply for a licence, attach documents, pay the invoice, track the application, hold your permits and file an appeal — alongside the fleet those licences cover.',
  },
  {
    href: 'https://yango-authority.vercel.app/authority/licensing/queue',
    icon: Gauge,
    who: 'If you are a transport officer',
    what: 'Authority Console',
    desc: 'Work queue, verification checklist, inspections, approval with maker–checker separation, the licence register, the fee schedule and licensing reports.',
  },
]

export default function LicensingMoved() {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <p className="text-[12px] uppercase tracking-[2px] text-ink-400 mb-2">YanGo Smart Mobility Platform</p>
        <h1 className="text-[24px] font-semibold text-ink-900 leading-tight">
          Licensing has moved into the portals that own it
        </h1>
        <p className="text-[14px] text-ink-600 mt-2 leading-relaxed">
          A licence is applied for by the company that will hold it and approved by the authority that regulates it, so
          the two sides now sit in those two consoles rather than in a portal of their own.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {SIDES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="block bg-white rounded-xl border border-ink-200 p-4 hover:border-brand-400 transition-colors"
            >
              <s.icon size={20} className="text-brand-600" />
              <p className="text-[12px] text-ink-400 mt-2.5">{s.who}</p>
              <p className="text-[15px] font-semibold text-ink-900 mt-0.5">{s.what}</p>
              <p className="text-[12.5px] text-ink-600 mt-1.5 leading-relaxed">{s.desc}</p>
            </a>
          ))}
        </div>

        <a href={HUB_URL} className="inline-block text-[13px] text-brand-700 mt-5">
          All portals →
        </a>
      </div>
    </div>
  )
}
