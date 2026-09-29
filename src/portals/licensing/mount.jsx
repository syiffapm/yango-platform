import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSession } from '../../lib/session.jsx'

/**
 * Licensing has two sides and they now live in two different consoles: a bus
 * company applies from the Operator Portal, and the transport authority
 * verifies and approves from the Authority Console. The screens are the same
 * screens; only the side changes, so each console pins the side when it mounts
 * one instead of offering a role switch nobody should have.
 */
function useLicensingSide(mode, userId) {
  const [ses, setSes] = useSession('licensing')
  useEffect(() => {
    if (ses.mode !== mode || (userId && ses.userId !== userId)) {
      setSes(userId ? { mode, userId } : { mode })
    }
  }, [ses.mode, ses.userId, mode, userId, setSes])
}

/** The bus company's side: apply, pay, track, hold licences, appeal. */
export function AsApplicant({ children }) {
  useLicensingSide('applicant')
  return children
}

/** The authority's side: verify, inspect, approve, register, fees. */
export function AsOfficer({ children }) {
  useLicensingSide('officer')
  return children
}

/**
 * Where these screens are mounted right now. The same licensing screens serve
 * two consoles, so a link between them has to be written relative to whichever
 * console the officer or the operator is actually in.
 */
export function useLicensingBase() {
  const { pathname } = useLocation()
  return pathname.startsWith('/authority') ? '/authority/licensing' : '/operator/licensing'
}
