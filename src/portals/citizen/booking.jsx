import { createContext, useContext, useMemo, useState } from 'react'
const Ctx = createContext(null)
const EMPTY = {
  departureId: null,
  seats: [],
  boardingPoint: null,
  droppingPoint: null,
  passengers: [],
  promo: null,
  concession: null,
  method: 'kbzpay',
}
export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(EMPTY)
  const value = useMemo(
    () => ({ draft, patch: (p) => setDraft((d) => ({ ...d, ...p })), reset: () => setDraft(EMPTY) }),
    [draft],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useBooking() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>')
  return ctx
}
