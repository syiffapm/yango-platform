import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button.jsx'
export default function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative w-full ${width} bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col fade-up`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-ink-100">
          <div>
            <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="text-xs text-ink-500 mt-0.5 leading-snug">{subtitle}</p>}
          </div>
          <IconButton
            icon={X}
            label="
Close"
            onClick={onClose}
          />
        </div>
        <div className="px-5 py-4 overflow-y-auto scroll-thin flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-ink-100 bg-ink-50/50 flex items-center justify-end gap-2 sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
