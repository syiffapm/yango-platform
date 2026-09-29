import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, ShieldAlert, Sparkles } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { myTickets } from '../mine.js'
import { routes } from '../../../data/geo.js'
import { MMK } from '../../../lib/format.js'
const SUGGESTIONS = [
  'When is the next bus to Sule Pagoda?',
  'How much is a ticket on YBS-37?',
  'What is the refund policy?',
  'I left my bag on the bus',
  'Which terminal for Yangon–Bago?',
]
const SAFETY_WORDS = ['accident', 'harassment', 'fire', 'robbery', 'hurt', 'emergency']
function answer(q, db, ses) {
  const t = q.toLowerCase()
  if (SAFETY_WORDS.some((w) => t.includes(w))) {
    return {
      text: 'If you are in danger right now, use the SOS button — it shares your live location with the authority and emergency dispatch and is acknowledged within 5 minutes.',
      safety: true,
      source: 'Safety policy',
    }
  }
  if (t.includes('another person') || t.includes("someone else's")) {
    return {
      text: 'I can only answer about your own tickets and trips. I have no access to anyone else’s booking.',
      source: 'Privacy guardrail',
    }
  }
  if (t.includes('refund') || t.includes('cancel')) {
    return {
      text: 'Refunds are 90% more than 24 hours before departure and 50% between 2 and 24 hours. Within 2 hours a scheduled ticket is not refundable. If the operator cancels the trip you always get a full refund — that is the authority minimum.',
      source: 'Refund policy · CMS legal pages',
      action: { label: 'Open my tickets', to: '/citizen/tickets' },
    }
  }
  if (t.includes('fare') || t.includes('how much') || t.includes('price') || t.includes('ticket')) {
    const brt = routes.find((r) => r.line === 'YBS-37')
    return {
      text: `An urban single is a flat ${MMK(brt.fare)} and is valid until 23:59 on the day you buy it, transfers on the same journey included. Intercity fares depend on the corridor — Yangon–Bago starts at ${MMK(4500)}.`,
      source: 'Fare engine',
      action: { label: 'Buy a ticket', to: '/citizen/explore' },
    }
  }
  if (t.includes('next bus') || t.includes('when')) {
    return {
      text: 'The next buses at Hledan Junction are on lines YBS-37, YBS-61 and YBS-39. Live arrivals with occupancy are on the home screen — they update every 10 seconds from the vehicle trackers.',
      source: 'GTFS-RT · live AVL',
      action: { label: 'See live arrivals', to: '/citizen/home' },
    }
  }
  if (t.includes('terminal') || t.includes('bago') || t.includes('mandalay')) {
    return {
      text: 'Intercity services to Bago, Pyay, Mandalay and Mawlamyine all leave from Aung Mingalar Highway Terminal. It opens 04:00–23:30 and has a waiting hall, toilets, prayer room, ATM and step-free access.',
      source: 'Terminal registry',
      action: { label: 'Open terminal page', to: '/citizen/terminal/T01' },
    }
  }
  if (t.includes('lost') || t.includes('bag') || t.includes('left')) {
    return {
      text: 'I can open a lost-property case for you. Tell me the line, the approximate time and what you left — the operator checks the depot and replies within 48 hours.',
      source: 'Helpdesk · lost & found',
      action: { label: 'Report to helpdesk', to: '/citizen/report' },
    }
  }
  if (t.includes('legal') || t.includes('medical advice')) {
    return {
      text: 'I cannot give legal or medical advice. For a medical emergency call 192, and for legal questions contact the Yangon Region Transport Committee directly.',
      source: 'Guardrail',
    }
  }
  const active = myTickets(db, ses).find((x) => ['active', 'booked'].includes(x.status))
  return {
    text: active
      ? `I can help with journey planning, fares, terminals, your own tickets, refunds and lost property. Your ticket ${active.pnr} is currently ${active.status}.`
      : 'I can help with journey planning, fares, terminal facilities, your own ticket status, refunds and lost property. Anything I cannot answer, I hand over to a human agent with the transcript.',
    source: 'Ask YanGo',
  }
}
export default function Chatbot() {
  const { db } = useDb()
  const [ses] = useSession('citizen')
  const [msgs, setMsgs] = useState([
    {
      from: 'bot',
      text: 'Hello — I am Ask YanGo. I answer from approved content and your own booking data only. What can I help with?',
      source: 'Ask YanGo',
    },
  ])
  const [q, setQ] = useState('')
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])
  const send = (text) => {
    const question = (text ?? q).trim()
    if (!question) return setMsgs((m) => [...m, { from: 'me', text: question }])
    setQ('')
    setTimeout(() => setMsgs((m) => [...m, { from: 'bot', ...answer(question, db, ses) }]), 420)
  }
  return (
    <div className="flex flex-col h-full">
      <AppBar
        title="Ask YanGo"
        subtitle="Answers cite their source · transactions are handed back to the app"
        back
        right={
          <Badge tone="violet" icon={Sparkles}>
            AI
          </Badge>
        }
      />

      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'gap-2'}`}>
            {m.from === 'bot' && (
              <span className="w-7 h-7 rounded-full bg-brand-100 grid place-items-center shrink-0 mt-0.5">
                <Bot size={14} className="text-brand-700" />
              </span>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${m.from === 'me' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white border border-ink-200 rounded-bl-sm'}`}
            >
              <p className={`text-[13.5px] leading-relaxed ${m.from === 'me' ? '' : 'text-ink-800'}`}>{m.text}</p>
              {m.source && <p className="text-[11.5px] text-ink-400 mt-1.5">Source: {m.source}</p>}
              {m.safety && (
                <Link
                  to="/citizen/sos"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white px-2.5 py-1.5 text-[13px] font-medium"
                >
                  <ShieldAlert size={13} /> Open SOS
                </Link>
              )}
              {m.action && (
                <Link
                  to={m.action.to}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-800 px-2.5 py-1.5 text-[13px] font-medium"
                >
                  {m.action.label}
                </Link>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-ink-200 bg-white p-3">
        <div className="flex gap-1.5 overflow-x-auto scroll-thin pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 rounded-full border border-ink-200 px-2.5 py-1 text-[12.5px] text-ink-600 active:bg-ink-100"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about routes, fares or your ticket…"
            className="flex-1 px-3.5 py-2.5 text-[14px] bg-ink-50 border border-ink-200 rounded-xl outline-none focus:bg-white focus:border-brand-400"
          />
          <button
            onClick={() => send()}
            className="w-10 h-10 rounded-xl bg-brand-600 text-white grid place-items-center active:bg-brand-700"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[11px] text-ink-400 mt-2 text-center">
          Only your own session data is used. Conversations are kept 90 days and PII is redacted in logs.
        </p>
      </div>
    </div>
  )
}
