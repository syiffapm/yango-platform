import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, LayoutGrid, Lock, LogOut, Menu, Search, X, Clock } from 'lucide-react'
import { useClock, useDb } from '../../lib/store.jsx'
import { IconButton } from '../ui/Button.jsx'
import { useTx, useAdminLang, setAdminLang, ADMIN_LANGS } from '../../lib/adminLang.js'
import Badge from '../ui/Badge.jsx'
import { isSinglePortal, HUB_URL } from '../../lib/portal.js'

/** In a single-portal build the hub lives on another deployment. */
function HubLink({ children, ...rest }) {
  if (isSinglePortal)
    return (
      <a href={HUB_URL} {...rest}>
        {children}
      </a>
    )
  return (
    <Link to="/" {...rest}>
      {children}
    </Link>
  )
}
function NavItem({ to, icon: Icon, label, badge, end, locked }) {
  const tx = useTx()
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-colors ${
          isActive
            ? 'bg-brand-50 text-brand-800'
            : locked
              ? 'text-ink-400 hover:bg-ink-100'
              : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={15}
            strokeWidth={2.1}
            className={isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600'}
          />
          <span className="flex-1 truncate">{tx(label)}</span>
          {locked && <Lock size={12} className="text-ink-300 shrink-0" aria-label="Needs a different role" />}
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 text-[11px] font-semibold px-1.5 py-px tabular-nums">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
export default function PortalShell({ portal, nav, children, right, identity, notificationsAudience }) {
  const tx = useTx()
  const lang = useAdminLang()
  const [open, setOpen] = useState(false)
  const { db } = useDb()
  const now = useClock(1000)
  const loc = useLocation()
  const [bellOpen, setBellOpen] = useState(false)
  const unread = db.notifications.filter((n) => n.audience === notificationsAudience && !n.read).length
  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      {/* sidebar */}
      <aside
        className={`fixed lg:static z-40 inset-y-0 left-0 w-60 bg-white border-r border-ink-200 flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-ink-100 shrink-0">
          <HubLink
            className="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center text-[13px] font-bold shrink-0"
            title="All portals"
          >
            YG
          </HubLink>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink-900 leading-tight truncate">{portal.name}</p>
            <p className="text-[11.5px] text-ink-400 leading-tight truncate">{tx(portal.tagline)}</p>
          </div>
          <IconButton icon={X} label="Close menu" className="lg:hidden" onClick={() => setOpen(false)} />
        </div>

        <nav className="flex-1 overflow-y-auto scroll-thin px-2.5 py-3 space-y-4">
          {nav.map((group) => (
            <div key={group.label}>
              {group.label && (
                <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  {tx(group.label)}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((it) => (
                  <NavItem key={it.to} {...it} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-ink-100 p-2.5 shrink-0">
          <HubLink className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors">
            <LayoutGrid size={15} /> {tx('All portals')}
          </HubLink>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-ink-900/30 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-ink-200 flex items-center gap-2 px-3 sm:px-4 shrink-0">
          <IconButton icon={Menu} label="Menu" className="lg:hidden" onClick={() => setOpen(true)} />
          <div className="relative hidden md:block w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              placeholder={tx('Search route, stop, vehicle…')}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-ink-50 border border-ink-200 rounded-lg outline-none focus:bg-white focus:border-brand-400"
            />
          </div>
          <div className="flex-1" />
          {right}
          <div className="flex gap-0.5 rounded-lg bg-ink-100 p-0.5" role="group" aria-label="Language">
            {ADMIN_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setAdminLang(l.code)}
                title={l.label}
                className={`px-2 py-1 rounded-md text-[11.5px] font-semibold transition-colors ${
                  lang === l.code ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {l.short}
              </button>
            ))}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 tabular-nums px-2">
            <Clock size={13} className="text-ink-400" />
            {new Date(now).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          <div className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              className="relative p-2 rounded-lg text-ink-500 hover:bg-ink-100"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-xl border border-ink-200 shadow-xl overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-ink-100 flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold">Notifications</span>
                    <Badge tone="brand">{unread} new</Badge>
                  </div>
                  <div className="max-h-80 overflow-y-auto scroll-thin divide-y divide-ink-50">
                    {db.notifications
                      .filter((n) => n.audience === notificationsAudience)
                      .slice(0, 8)
                      .map((n) => (
                        <div key={n.id} className={`px-3.5 py-2.5 ${n.read ? '' : 'bg-brand-50/40'}`}>
                          <p className="text-[12px] font-medium text-ink-900">{n.title}</p>
                          <p className="text-[12px] text-ink-500 mt-0.5 leading-snug">{n.body}</p>
                        </div>
                      ))}
                    {db.notifications.filter((n) => n.audience === notificationsAudience).length === 0 && (
                      <p className="px-3.5 py-6 text-center text-[12.5px] text-ink-400">{tx('No notifications')}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {identity}
        </header>

        <main key={loc.pathname} className="flex-1 overflow-y-auto scroll-thin">
          <div className="max-w-[1400px] mx-auto p-4 sm:p-5 lg:p-6 fade-up">{children}</div>
        </main>
      </div>
    </div>
  )
}
export function IdentityMenu({ name, role, org, options = [], onSelect, footer }) {
  const tx = useTx()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg pl-1.5 pr-2 py-1.5 hover:bg-ink-100 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 grid place-items-center text-[12px] font-semibold">
          {name
            ?.split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')}
        </span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-[12px] font-medium text-ink-900 max-w-[130px] truncate">{name}</span>
          <span className="block text-[11px] text-ink-400 max-w-[130px] truncate">{tx(role)}</span>
        </span>
        <ChevronDown size={13} className="text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-xl border border-ink-200 shadow-xl overflow-hidden">
            <div className="px-3.5 py-3 border-b border-ink-100">
              <p className="text-[12.5px] font-semibold text-ink-900">{name}</p>
              <p className="text-[12px] text-ink-500">
                {tx(role)}
                {org ? ` · ${org}` : ''}
              </p>
            </div>
            {options.length > 0 && (
              <div className="max-h-72 overflow-y-auto scroll-thin py-1.5">
                <p className="px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  {tx('Switch identity')}
                </p>
                {options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => {
                      onSelect(o.value)
                      setOpen(false)
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-ink-50"
                  >
                    <span className="block text-[12px] text-ink-800">{o.label}</span>
                    {o.hint && <span className="block text-[11.5px] text-ink-400">{tx(o.hint)}</span>}
                  </button>
                ))}
              </div>
            )}
            {footer}
            <HubLink className="flex items-center gap-2 px-3.5 py-2.5 border-t border-ink-100 text-[12px] text-ink-600 hover:bg-ink-50">
              <LogOut size={14} /> {tx('Leave portal')}
            </HubLink>
          </div>
        </>
      )}
    </div>
  )
}
export function PageHeader({ title, subtitle, actions, breadcrumb, meta }) {
  const tx = useTx()
  return (
    <div className="mb-5">
      {breadcrumb && <div className="mb-1.5 text-[12px] text-ink-400">{breadcrumb}</div>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-ink-900 leading-tight">{tx(title)}</h1>
          {subtitle && <p className="text-[12.5px] text-ink-500 mt-1 max-w-3xl leading-relaxed">{tx(subtitle)}</p>}
          {meta && <div className="flex flex-wrap items-center gap-2 mt-2.5">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
