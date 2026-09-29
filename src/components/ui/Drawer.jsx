import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button.jsx'
export default function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-xl' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/35" onClick={onClose} />
      <aside className={`relative w-full ${width} bg-white h-full shadow-2xl flex flex-col`}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-ink-100">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-ink-900 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <IconButton
            icon={X}
            label="
Close"
            onClick={onClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-ink-100 bg-ink-50/50 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  )
}
