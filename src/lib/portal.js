/**
 * Single-portal builds.
 *
 * With VITE_PORTAL set, the bundle ships one portal only — that is how each
 * portal gets its own link. Paths stay the same (/citizen/…, /operator/…) so
 * every internal link keeps working; "all portals" points at the combined
 * deployment instead of a local route.
 */
export const PORTAL = import.meta.env.VITE_PORTAL || null
export const HUB_URL = import.meta.env.VITE_HUB_URL || 'https://yango-platform.vercel.app'
export const isSinglePortal = !!PORTAL

/** 'cms' and the older 'authority' are the same console. */
export const canonicalPortal = (p) => (p === 'authority' ? 'cms' : p)

export const PORTAL_ROOT = {
  citizen: '/citizen',
  driver: '/driver',
  operator: '/operator',
  licensing: '/licensing',
  cms: '/cms',
  authority: '/cms',
  terminal: '/cms',
  // The public hall display is its own deployment: one screen, no sign-in.
  board: '/board/T01',
}

export const portalHome = () => (PORTAL ? PORTAL_ROOT[PORTAL] || '/' : '/')
