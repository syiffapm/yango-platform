import { createContext, useCallback, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
const Ctx = createContext(null)
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2)
    setItems((s) => [...s, { id, kind: 'success', ...toast }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), toast.duration || 4200)
  }, [])
  const dismiss = (id) => setItems((s) => s.filter((t) => t.id !== id))
  return (
    <Ctx.Provider value={push}>
      {children}
      {createPortal(
        <div className="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 items-end pointer-events-none">
          {items.map((t) => {
            const Icon = t.kind === 'error' ? AlertTriangle : t.kind === 'info' ? Info : CheckCircle2
            const tone =
              t.kind === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : t.kind === 'info'
                  ? 'border-sky-200 bg-sky-50 text-sky-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            return (
              <div
                key={t.id}
                className={`pointer-events-auto w-full sm:w-80 rounded-xl border shadow-lg px-3.5 py-3 flex items-start gap-2.5 fade-up ${tone}`}
              >
                <Icon size={16} className="mt-px shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold leading-snug">{t.title}</p>
                  {t.body && <p className="text-[12.5px] opacity-80 mt-0.5 leading-snug">{t.body}</p>}
                </div>
                <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}
export function useToast() {
  const ctx = useContext(Ctx)
  return ctx || (() => {})
}
