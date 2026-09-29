import { ShieldCheck, UserCog } from 'lucide-react'
import Empty from '../ui/Empty.jsx'
import Button from '../ui/Button.jsx'

/**
 * A page the signed-in officer may not use.
 *
 * Separation of duties means some screens are closed to some roles — but a
 * dead end is not an answer. The gate names the role that does hold the right
 * and, in this demo estate, offers to sign in as that person.
 */
export default function PermissionGate({ what, roleLabel, holder, onSwitch }) {
  return (
    <Empty
      icon={ShieldCheck}
      title={`${roleLabel} cannot ${what}`}
      hint={
        holder
          ? `This screen belongs to ${holder.roleLabel}. ${holder.name} holds that role.`
          : 'Ask an officer who holds this right to make the change.'
      }
      action={
        holder && onSwitch ? (
          <Button icon={UserCog} variant="primary" onClick={onSwitch}>
            Continue as {holder.name}
          </Button>
        ) : null
      }
    />
  )
}
