import { useCallback, useEffect, useState } from 'react'
const KEY = 'yango.session.v6'
const DEFAULTS = {
  authority: { userId: 'U07', jurisdiction: 'YGN', terminalId: 'T01', region: 'ALL' },
  licensing: { mode: 'officer', userId: 'U03', operator: 'PO03' },
  operator: { operator: 'PO01', userId: 'PU01', role: 'po_admin' },
  driver: { driverId: 'D001', shift: null, signedIn: false },
  citizen: { name: 'Demo Citizen', phone: '+95 9 7700 1234', lang: 'en', signedIn: false },
  terminal: { terminalId: 'T01', userId: 'U10', role: 'cms_national', region: 'ALL' },
}
function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULTS
}
let cache = null
const listeners = new Set()
function getAll() {
  if (!cache) cache = read()
  return cache
}
function setPortal(portal, patch) {
  const all = getAll()
  cache = { ...all, [portal]: { ...all[portal], ...patch } }
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}
export function useSession(portal) {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => listeners.delete(l)
  }, [])
  const set = useCallback((patch) => setPortal(portal, patch), [portal])
  return [getAll()[portal], set]
}
export function resetSession() {
  cache = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}
