import { useSyncExternalStore } from 'react'
import { ADMIN_MM } from './adminDict.js'

/**
 * Language for the back-office consoles.
 *
 * The citizen and driver apps keep their language in the portal session,
 * because it belongs to the traveller. An officer's console language belongs
 * to the workstation instead: it is shared by every console open on this
 * machine and survives a switch between the Operator, Authority and Licensing
 * portals, which are three deployments of the same estate.
 *
 * Strings are looked up by their English text, so a screen that has not been
 * translated yet keeps working and simply stays in English.
 */
const KEY = 'yango.lang.admin'
const listeners = new Set()
let lang = 'en'
try {
  const saved = localStorage.getItem(KEY)
  if (saved === 'my' || saved === 'en') lang = saved
} catch {
  /* private window — English it is */
}

export function setAdminLang(next) {
  lang = next === 'my' ? 'my' : 'en'
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAdminLang() {
  return useSyncExternalStore(
    subscribe,
    () => lang,
    () => 'en',
  )
}

/** Translate one English string; unknown text is returned unchanged. */
export function tx(text, forLang = lang) {
  if (forLang !== 'my' || typeof text !== 'string') return text
  return ADMIN_MM[text] || ADMIN_MM[text.trim()] || text
}

/**
 * The traveller-facing apps have their own language switch, so shared
 * components must not pick up the console setting when they are rendered
 * inside the Citizen or Driver app on the same browser.
 */
const isTravellerApp = () => {
  try {
    return /^\/(citizen|driver)(\/|$)/.test(location.pathname)
  } catch {
    return false
  }
}

/** Hook form, so a component re-renders when the officer switches language. */
export function useTx() {
  const l = useAdminLang()
  if (isTravellerApp()) return (text) => text
  return (text) => tx(text, l)
}

export const ADMIN_LANGS = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'my', short: 'MM', label: 'မြန်မာ' },
]
