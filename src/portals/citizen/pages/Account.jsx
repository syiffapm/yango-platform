import { Link } from 'react-router-dom'
import {
  Accessibility,
  Bell,
  ChevronRight,
  CreditCard,
  Clock,
  FileWarning,
  Globe,
  LogOut,
  LayoutGrid,
  MapPin,
  MessageCircle,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Wallet as WalletIcon,
  ClipboardList,
} from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Toggle } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { myTickets } from '../mine.js'
import { isSinglePortal, HUB_URL } from '../../../lib/portal.js'
import { useSession } from '../../../lib/session.jsx'
import { useT, LANGS } from '../../../lib/i18n.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dateOnly } from '../../../lib/format.js'
import { useState } from 'react'

/** One row in a grouped list. */
function Row({ to, onClick, icon: Icon, label, value, danger, badge }) {
  const inner = (
    <>
      <Icon size={17} className={danger ? 'text-red-500 shrink-0' : 'text-brand-600 shrink-0'} />
      <span className={`flex-1 text-[14px] ${danger ? 'text-red-600 font-medium' : 'text-ink-800'}`}>{label}</span>
      {badge > 0 && <Badge tone="red">{badge}</Badge>}
      {value && <span className="text-[13px] text-ink-500">{value}</span>}
      {!danger && <ChevronRight size={15} className="text-ink-300" />}
    </>
  )
  const cls =
    'w-full flex items-center gap-3 px-4 py-3.5 border-b border-ink-50 last:border-0 active:bg-ink-50 text-left'
  if (onClick)
    return (
      <button onClick={onClick} className={cls}>
        {inner}
      </button>
    )
  return (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  )
}
function Group({ title, children }) {
  return (
    <div className="mb-4">
      <p className="px-1 mb-1.5 text-[12.5px] font-semibold uppercase tracking-wider text-ink-400">{title}</p>
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">{children}</div>
    </div>
  )
}
export default function Account() {
  const { db, reset } = useDb()
  const [ses, setSes] = useSession('citizen')
  const { t, lang, setLang } = useT()
  const toast = useToast()
  const [langOpen, setLangOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [prefs, setPrefs] = useState({
    push: true,
    sms: true,
    marketing: false,
    quiet: true,
    largeText: false,
    highContrast: false,
    lite: false,
  })
  const unread = db.notifications.filter((n) => n.audience === 'citizen' && !n.read).length
  const activeLang = LANGS.find((l) => l.code === lang)
  return (
    <div>
      <AppBar title={t('account.title')} />

      <div className="p-4">
        {/* identity */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-ink-200 p-4 mb-4">
          <span className="w-14 h-14 rounded-full bg-brand-100 text-brand-800 grid place-items-center text-[18px] font-semibold">
            {ses.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-ink-900">{ses.name}</p>
            <p className="text-[13px] text-ink-500">{ses.phone}</p>
            <p className="text-[12.5px] text-ink-400 mt-0.5">
              {t('account.member')} {dateOnly('2026-09-02')}
            </p>
          </div>
          <Badge tone="green" icon={ShieldCheck}>
            eKYC
          </Badge>
        </div>

        <Group title={t('account.title')}>
          <Row to="/citizen/account" icon={UserRound} label={t('account.editProfile')} />
        </Group>

        <Group title={t('account.travel')}>
          <Row
            to="/citizen/tickets"
            icon={ClipboardList}
            label={t('ticket.myTickets')}
            value={`${myTickets(db, ses).length}`}
          />
          <Row to="/citizen/explore" icon={MapPin} label={t('account.favourites')} value={`${db.savedPlaces.length}`} />
          <Row to="/citizen/search" icon={Clock} label={t('account.recentPlaces')} value="3" />
          <Row
            to="/citizen/alerts"
            icon={Bell}
            label={t('account.alerts')}
            value={`${db.announcements.filter((a) => a.status === 'published').length}`}
          />
        </Group>

        <Group title={t('account.moneyGroup')}>
          <Row to="/citizen/wallet" icon={WalletIcon} label={t('account.wallet')} value={MMK(db.wallet.balance)} />
          <Row
            onClick={() =>
              toast({
                title: 'Payment methods',
                body: 'KBZPay, Wave Money, AYA Pay, CB Pay and cards are offered at checkout.',
                kind: 'info',
              })
            }
            icon={CreditCard}
            label={t('account.paymentMethods')}
            value="5"
          />
        </Group>

        <Group title={t('account.safetyGroup')}>
          <Row to="/citizen/sos" icon={ShieldAlert} label={t('account.sos')} />
          <Row to="/citizen/report" icon={FileWarning} label={t('account.report')} />
          <Row
            to="/citizen/reports"
            icon={ClipboardList}
            label={t('account.myReports')}
            value={`${db.citizenReports.length}`}
          />
          <Row to="/citizen/safety" icon={ShieldCheck} label={t('safety.numbers')} />
          <Row to="/verify/PM-RTE-R01" icon={ScanLine} label={t('account.verify')} />
          <Row to="/citizen/chat" icon={MessageCircle} label={t('account.assistant')} />
        </Group>

        <Group title={t('account.settingsGroup')}>
          <Row to="/citizen/notifications" icon={Bell} label={t('account.notifications')} badge={unread} />
          <Row onClick={() => setLangOpen(true)} icon={Globe} label={t('account.language')} value={activeLang?.short} />
          <Row onClick={() => setSettingsOpen(true)} icon={Accessibility} label={t('account.accessibility')} />
          <Row
            onClick={() =>
              toast({ title: 'Data request filed', body: 'You will receive a copy of your data within 30 days.' })
            }
            icon={ShieldCheck}
            label={t('account.privacy')}
          />
        </Group>

        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden mb-3">
          <a
            href={isSinglePortal ? HUB_URL : '/'}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-ink-50 active:bg-ink-50"
          >
            <LayoutGrid size={17} className="text-ink-400 shrink-0" />
            <span className="flex-1 text-[14px] text-ink-800">All YanGo portals</span>
            <ChevronRight size={15} className="text-ink-300" />
          </a>
          <Row onClick={() => setSes({ signedIn: false })} icon={LogOut} label={t('account.signOut')} danger />
        </div>

        <p className="text-[13px] text-ink-400 text-center">{t('account.ticketsStay')}</p>
        <div className="flex items-center justify-center gap-2 mt-4 opacity-60">
          <span className="w-7 h-7 rounded-lg bg-brand-700 text-white grid place-items-center text-[11.5px] font-bold">
            YG
          </span>
          <span className="text-[13.5px] text-ink-500">YanGo</span>
        </div>
      </div>

      <Modal open={langOpen} onClose={() => setLangOpen(false)} title={t('account.language')} width="max-w-sm">
        <div className="space-y-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code)
                setLangOpen(false)
              }}
              className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left ${lang === l.code ? 'border-brand-400 bg-brand-50' : 'border-ink-200'}`}
            >
              <Globe size={16} className={lang === l.code ? 'text-brand-600' : 'text-ink-400'} />
              <span className="flex-1 text-[14px] text-ink-900">{l.label}</span>
              {lang === l.code && <Badge tone="green">✓</Badge>}
            </button>
          ))}
          <p className="text-[12.5px] text-ink-400 pt-1 leading-relaxed">
            Zawgyi input is converted to Unicode automatically. Long policy text stays in English so a rough translation
            never changes the meaning of a rule.
          </p>
        </div>
      </Modal>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t('account.accessibility')}
        width="max-w-sm"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setSettingsOpen(false)
              toast({ title: 'Preferences saved' })
            }}
          >
            Save
          </Button>
        }
      >
        <div className="space-y-1">
          <Toggle
            label="Large text"
            checked={prefs.largeText}
            onChange={(v) => setPrefs((p) => ({ ...p, largeText: v }))}
          />
          <Toggle
            label="High contrast"
            checked={prefs.highContrast}
            onChange={(v) => setPrefs((p) => ({ ...p, highContrast: v }))}
          />
          <Toggle
            label="Lite mode"
            hint="Skip map tiles on a slow connection"
            checked={prefs.lite}
            onChange={(v) => setPrefs((p) => ({ ...p, lite: v }))}
          />
          <div className="pt-2 mt-2 border-t border-ink-100 space-y-1">
            <Toggle
              label="Push notifications"
              checked={prefs.push}
              onChange={(v) => setPrefs((p) => ({ ...p, push: v }))}
            />
            <Toggle label="SMS" checked={prefs.sms} onChange={(v) => setPrefs((p) => ({ ...p, sms: v }))} />
            <Toggle
              label="Offers and promotions"
              checked={prefs.marketing}
              onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
            />
            <Toggle
              label="Quiet hours 22:00–06:00"
              checked={prefs.quiet}
              onChange={(v) => setPrefs((p) => ({ ...p, quiet: v }))}
            />
          </div>
          <p className="text-[12.5px] text-ink-400 pt-2 leading-relaxed">
            Safety messages always reach you, whatever these settings say.
          </p>
        </div>
      </Modal>
    </div>
  )
}
