import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { Field, Textarea } from '../ui/Field.jsx'
import { ShieldAlert } from 'lucide-react'

/**
 * closing an incident, issuing a finding, ruling a dispute, changing a
 * threshold or permit and exporting line-level figures all require a written reason.
 */
export default function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  subtitle,
  confirmLabel = 'Confirm',
  variant = 'primary',
  minLength = 15,
  extra,
}) {
  const [reason, setReason] = useState('')
  const short = reason.trim().length < minLength
  const submit = () => {
    if (short) return onConfirm(reason.trim())
    setReason('')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={() => {
        setReason('')
        onClose()
      }}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button
            onClick={() => {
              setReason('')
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button variant={variant} disabled={short} onClick={submit}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
        <ShieldAlert size={15} className="text-amber-600 mt-px shrink-0" />
        <p className="text-[12.5px] text-amber-900 leading-relaxed">
          A measurement is not a finding. This action is attributed to you by name, stored in the append-only audit log,
          and cannot be recorded without a written reason.
        </p>
      </div>
      {extra}
      <Field
        label="Written reason"
        required
        hint={
          short
            ? `At least ${minLength} characters — explain the decision, not just the outcome.`
            : 'This text is visible to the affected party and to auditors.'
        }
      >
        <Textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State the facts relied on and the decision taken…"
        />
      </Field>
    </Modal>
  )
}
