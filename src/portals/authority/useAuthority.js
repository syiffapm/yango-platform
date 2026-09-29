import { useMemo } from 'react'
import { useDb } from '../../lib/store.jsx'
import { useSession } from '../../lib/session.jsx'

/** The signed-in officer, their role and what that role may do (BR-13, section 22). */
export default function useAuthority() {
  const { db, update, audit, notify } = useDb()
  const [ses, setSes] = useSession('authority')

  return useMemo(() => {
    const me = db.users.find((u) => u.id === ses.userId) || db.users[0]
    const role = me?.role
    return {
      db,
      update,
      audit,
      notify,
      ses,
      setSes,
      me,
      role,
      roleLabel: db.roles.find((r) => r.id === role)?.label || role,
      can: {
        acknowledge: role === 'safety',
        close: role === 'safety',
        issueFinding: role === 'compliance',
        ruleDispute: role === 'adjudicator',
        approveLicence: role === 'lic_approver',
        changeThreshold: role === 'nat_policy',
        approveAds: role === 'nat_policy',
        reconcile: role === 'finance',
        manageAccounts: role === 'nat_policy',
      },
    }
  }, [db, update, audit, notify, ses, setSes])
}
