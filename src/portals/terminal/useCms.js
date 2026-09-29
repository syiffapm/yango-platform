import { useMemo } from 'react'
import { useDb } from '../../lib/store.jsx'
import { useSession } from '../../lib/session.jsx'
import { terminals } from '../../data/geo.js'

export const REGIONS = [
  { id: 'ALL', label: 'All regions' },
  { id: 'YGN', label: 'Yangon Region' },
  { id: 'MDY', label: 'Mandalay Region' },
  { id: 'BAG', label: 'Bago Region' },
]

/**
 * The content, advertising and terminal screens live inside the Authority
 * Console, so they answer to the same officer identity and the same permission
 * matrix — there is no second login and no second role model.
 */
const CAPABILITIES = {
  nat_policy: {
    dashboard: true,
    terminal: true,
    content: true,
    ads: true,
    adsApprove: true,
    notify: true,
    broadcast: true,
    helpdesk: true,
    platform: true,
    fareBands: true,
    allRegions: true,
  },
  nat_auditor: {
    dashboard: true,
    terminal: true,
    content: false,
    ads: true,
    adsApprove: false,
    notify: false,
    broadcast: false,
    helpdesk: true,
    platform: false,
    fareBands: false,
    allRegions: true,
  },
  lic_officer: {
    dashboard: true,
    terminal: false,
    content: false,
    ads: false,
    adsApprove: false,
    notify: false,
    broadcast: false,
    helpdesk: true,
    platform: false,
    fareBands: false,
    allRegions: false,
  },
  lic_approver: {
    dashboard: true,
    terminal: false,
    content: false,
    ads: false,
    adsApprove: false,
    notify: false,
    broadcast: false,
    helpdesk: true,
    platform: false,
    fareBands: false,
    allRegions: false,
  },
  compliance: {
    dashboard: true,
    terminal: true,
    content: true,
    ads: false,
    adsApprove: false,
    notify: true,
    broadcast: false,
    helpdesk: true,
    platform: false,
    fareBands: false,
    allRegions: false,
  },
  adjudicator: {
    dashboard: true,
    terminal: false,
    content: false,
    ads: false,
    adsApprove: false,
    notify: false,
    broadcast: false,
    helpdesk: true,
    platform: false,
    fareBands: false,
    allRegions: false,
  },
  safety: {
    dashboard: true,
    terminal: true,
    content: true,
    ads: false,
    adsApprove: false,
    notify: true,
    broadcast: true,
    helpdesk: true,
    platform: false,
    fareBands: false,
    allRegions: false,
  },
  planning: {
    dashboard: true,
    terminal: true,
    content: false,
    ads: false,
    adsApprove: false,
    notify: false,
    broadcast: false,
    helpdesk: false,
    platform: false,
    fareBands: false,
    allRegions: true,
  },
  finance: {
    dashboard: true,
    terminal: false,
    content: false,
    ads: true,
    adsApprove: false,
    notify: false,
    broadcast: false,
    helpdesk: false,
    platform: false,
    fareBands: true,
    allRegions: true,
  },
  terminal_mgr: {
    dashboard: true,
    terminal: true,
    content: false,
    ads: false,
    adsApprove: false,
    notify: false,
    broadcast: false,
    helpdesk: true,
    platform: false,
    fareBands: false,
    allRegions: false,
  },
}

const FALLBACK = CAPABILITIES.nat_policy

export default function useCms() {
  const { db, update, audit, notify } = useDb()
  const [ses, setSes] = useSession('authority')

  return useMemo(() => {
    const me = db.users.find((u) => u.id === ses.userId) || db.users[0]
    const roleId = me?.role
    const can = CAPABILITIES[roleId] || FALLBACK
    const roleLabel = db.roles.find((r) => r.id === roleId)?.label || roleId
    const terminal = terminals.find((t) => t.id === ses.terminalId) || terminals[0]
    const region = can.allRegions ? ses.region || 'ALL' : me?.jurisdiction || 'YGN'
    return {
      db,
      update,
      audit,
      notify,
      ses,
      setSes,
      me,
      role: { id: roleId, label: roleLabel, org: me?.org, scope: can.allRegions ? 'All regions' : 'Own jurisdiction' },
      can,
      terminal,
      region,
      regionLabel: REGIONS.find((r) => r.id === region)?.label || 'Yangon Region',
      terminals: roleId === 'terminal_mgr' ? [terminal] : terminals,
    }
  }, [db, update, audit, notify, ses, setSes])
}
