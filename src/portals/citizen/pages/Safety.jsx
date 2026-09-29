import { Link } from 'react-router-dom'
import { FileWarning, Phone, ShieldAlert, ScanLine, ClipboardList, MessageCircle } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { useDb } from '../../../lib/store.jsx'
const NUMBERS = [
  { label: 'Police', number: '199', tone: 'red' },
  { label: 'Ambulance', number: '192', tone: 'red' },
  { label: 'Fire', number: '191', tone: 'amber' },
  { label: 'YRTC control room', number: '+95 1 638 000', tone: 'brand' },
]
export default function Safety() {
  const { db } = useDb()
  const myReports = db.citizenReports.length
  return (
    <div>
      <AppBar title="Safety" subtitle="Emergency, reporting and licence checks" />

      <div className="p-4 space-y-4">
        <Link to="/citizen/sos" className="block rounded-2xl bg-red-600 text-white p-5 active:bg-red-700">
          <ShieldAlert size={26} />
          <p className="text-[17px] font-semibold mt-2.5">Emergency SOS</p>
          <p className="text-[13px] text-white/80 mt-1 leading-relaxed">
            Shares your live location, nearest stop and active ticket with the authority, the operator and emergency
            dispatch. Acknowledged within 5 minutes.
          </p>
        </Link>

        <div>
          <p className="text-[14px] font-semibold text-ink-900 mb-2">Emergency numbers</p>
          <div className="grid grid-cols-2 gap-2">
            {NUMBERS.map((n) => (
              <a
                key={n.label}
                href={`tel:${n.number}`}
                className="flex items-center gap-2.5 bg-white rounded-xl border border-ink-200 px-3 py-3 active:bg-ink-50"
              >
                <Phone size={16} className="text-brand-600" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900 truncate">{n.label}</p>
                  <p className="text-[12.5px] text-ink-500">{n.number}</p>
                </div>
              </a>
            ))}
          </div>
          <p className="text-[12px] text-ink-400 mt-2">Numbers are maintained per jurisdiction by the authority.</p>
        </div>

        <div className="space-y-2">
          {[
            {
              to: '/citizen/report',
              icon: FileWarning,
              title: 'Report an incident',
              desc: 'Harassment, reckless driving, overcrowding, vehicle condition, accessibility. You may report anonymously.',
            },
            {
              to: '/citizen/reports',
              icon: ClipboardList,
              title: 'My reports',
              desc: 'Track what happened to reports you filed, by reference number.',
              badge: myReports,
            },
            {
              to: '/verify/PM-RTE-R01',
              icon: ScanLine,
              title: 'Verify a bus or driver licence',
              desc: 'Scan the QR on the windscreen or the driver card to check the licence is valid.',
            },
            {
              to: '/citizen/chat',
              icon: MessageCircle,
              title: 'Ask YanGo',
              desc: 'Questions about fares, routes, refunds and lost property.',
            },
          ].map((x) => (
            <Link
              key={x.to}
              to={x.to}
              className="flex items-start gap-3 bg-white rounded-xl border border-ink-200 px-3.5 py-3 active:bg-ink-50"
            >
              <span className="w-9 h-9 rounded-lg bg-brand-50 grid place-items-center shrink-0">
                <x.icon size={16} className="text-brand-600" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-ink-900">
                  {x.title} {x.badge > 0 && <Badge tone="brand">{x.badge}</Badge>}
                </p>
                <p className="text-[12.5px] text-ink-500 leading-snug mt-0.5">{x.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-3.5">
          <p className="text-[13px] font-medium text-ink-900">Your identity is protected</p>
          <p className="text-[12.5px] text-ink-500 mt-1 leading-relaxed">
            Reports reach the authority with a reference number only. Your name is never shown on any dashboard, and
            aggregates covering fewer than 20 journeys are never produced.
          </p>
        </div>
      </div>
    </div>
  )
}
