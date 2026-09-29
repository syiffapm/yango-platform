import { NavLink, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { isSinglePortal } from '../../lib/portal.js'

/**
 * Mobile-first web app shell. Not a device mock-up: the app fills the viewport on a
 * phone and is centred at phone width on a desktop browser, which is how the PWA is
 * actually served.
 */
export default function MobileShell({ tabs, children, tone = 'brand' }) {
  return (
    <div className="min-h-screen bg-ink-100">
      <div
        className="mx-auto w-full max-w-[480px] min-h-screen bg-white flex flex-col sm:shadow-[0_0_0_1px_rgba(16,24,40,.07)]"
        style={{ '--tab-h': tabs ? 'calc(3.75rem + env(safe-area-inset-bottom))' : '0px' }}
      >
        <div className="flex-1 min-h-0">{children}</div>

        {tabs && (
          <nav
            className={`sticky bottom-0 z-30 h-[calc(3.75rem+env(safe-area-inset-bottom))] border-t border-ink-200 bg-white/95 backdrop-blur px-1 pb-[env(safe-area-inset-bottom)] ${tone === 'dark' ? 'border-ink-300' : ''}`}
          >
            <div className="flex">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-colors ${isActive ? 'text-brand-700' : 'text-ink-400'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`relative grid place-items-center w-10 h-7 rounded-full ${isActive ? 'bg-brand-50' : ''}`}
                      >
                        <t.icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                        {t.badge > 0 && (
                          <span className="absolute -top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                        )}
                      </span>
                      <span className="text-[11.5px] font-medium">{t.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
/** The same phone-width column, for screens that sit outside the tabbed shell. */
export function MobileFrame({ children }) {
  return (
    <div className="min-h-screen bg-ink-100">
      <div className="mx-auto w-full max-w-[480px] min-h-screen bg-white flex flex-col sm:shadow-[0_0_0_1px_rgba(16,24,40,.07)]">
        {children}
      </div>
    </div>
  )
}

export function AppBar({ title, subtitle, back, right, tone = 'light', sticky = true, onBack }) {
  const nav = useNavigate()
  const dark = tone === 'dark'
  return (
    <div
      className={`${sticky ? 'sticky top-0 z-20' : ''} ${dark ? 'bg-ink-900 text-white' : 'bg-white/95 backdrop-blur border-b border-ink-100'} px-3 py-3 flex items-center gap-2`}
    >
      {back && (
        <button
          onClick={() => (onBack ? onBack() : nav(-1))}
          className={`p-[11px] -ml-1 rounded-lg ${dark ? 'hover:bg-white/10' : 'hover:bg-ink-100'}`}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className={`text-[15.5px] font-semibold truncate ${dark ? '' : 'text-ink-900'}`}>{title}</h1>
        {subtitle && <p className={`text-[12px] truncate ${dark ? 'text-white/60' : 'text-ink-500'}`}>{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
export function PortalJump() {
  if (isSinglePortal) return null
  const cls =
    'fixed bottom-20 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-ink-900 text-white text-[12px] px-3 py-2 shadow-lg hover:bg-ink-800'
  const inner = (
    <>
      <LayoutGrid size={13} /> All portals
    </>
  )
  return (
    <Link to="/" className={cls}>
      {inner}
    </Link>
  )
}
