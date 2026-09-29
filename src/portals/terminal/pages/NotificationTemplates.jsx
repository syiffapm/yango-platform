import { useState } from 'react'
import { Bell, Eye, Plus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Textarea } from '../../../components/ui/Field.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
const EVENTS = [
  {
    id: 'otp',
    event: 'OTP, new-device login',
    recipient: 'Any user',
    channels: 'SMS, push',
    timing: 'Instant',
    safety: true,
  },
  {
    id: 'booking',
    event: 'Booking confirmed / e-ticket',
    recipient: 'Passenger',
    channels: 'Push, SMS, email',
    timing: 'Instant',
  },
  {
    id: 'reminder',
    event: 'Trip reminder, bay, bus assigned',
    recipient: 'Passenger',
    channels: 'Push, SMS',
    timing: 'T-24h, T-2h, T-30m',
  },
  {
    id: 'delay',
    event: 'Delay, cancellation, refund status',
    recipient: 'Passenger',
    channels: 'Push, SMS',
    timing: 'Instant',
  },
  {
    id: 'approach',
    event: 'Bus approaching drop point',
    recipient: 'Passenger',
    channels: 'Push',
    timing: '~5 min before',
  },
  {
    id: 'share',
    event: 'Share-trip updates',
    recipient: "Passenger's contact",
    channels: 'SMS link',
    timing: 'Start / arrival / SOS',
  },
  {
    id: 'sos',
    event: 'SOS raised',
    recipient: 'PO ops, duty officer, dispatch, emergency contact',
    channels: 'Push, SMS, alarm, voice',
    timing: 'Instant; escalate after 2 min',
    safety: true,
  },
  {
    id: 'incident',
    event: 'Incident forwarded / SLA near breach',
    recipient: 'PO, owner officer',
    channels: 'Push, email',
    timing: 'Per SLA',
  },
  {
    id: 'application',
    event: 'Application status, invoice, receipt',
    recipient: 'Applicant',
    channels: 'Email, SMS, in-app',
    timing: 'Instant',
  },
  {
    id: 'expiry',
    event: 'Licence expiry',
    recipient: 'PO, driver',
    channels: 'Email, SMS, push',
    timing: '90/60/30/7 days',
  },
  {
    id: 'finding',
    event: 'Finding issued / dispute ruled',
    recipient: 'PO',
    channels: 'Email, in-app',
    timing: 'Instant',
  },
  {
    id: 'roster',
    event: 'Roster published, trip changed, broadcast',
    recipient: 'Driver',
    channels: 'Push (acknowledge)',
    timing: 'Instant',
  },
  { id: 'settlement', event: 'Settlement paid / failed', recipient: 'PO finance', channels: 'Email', timing: 'Daily' },
  {
    id: 'alert',
    event: 'Service alert',
    recipient: 'Passengers on affected routes',
    channels: 'Push, in-app banner',
    timing: 'Instant or scheduled',
    safety: true,
  },
  {
    id: 'report',
    event: 'Scheduled report ready',
    recipient: 'Office mailbox',
    channels: 'Email',
    timing: 'Per schedule',
  },
]
const SAMPLE = {
  reminder: 'YanGo: your trip {{route}} departs {{time}} from {{terminal}}, bay {{bay}}. Bus {{plate}}. PNR {{pnr}}.',
  sos: 'SOS {{ref}} — {{category}} at {{location}}. Vehicle {{plate}}, driver {{driver}}. Acknowledge within {{sla}}.',
  expiry: 'YanGo: {{document}} for {{holder}} expires on {{date}} ({{days}} days). Renew in the Licensing Portal.',
}
export default function NotificationTemplates() {
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  return (
    <>
      <PageHeader
        title="Notification templates"
        subtitle="One engine sends every message on every channel from versioned templates in Myanmar and English. Preferences are respected, except for safety messages, which always go through."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() =>
              toast({ title: 'Template created', body: 'New templates start as a draft in both languages.' })
            }
          >
            New template
          </Button>
        }
      />

      <DataTable
        columns={[
          { key: 'event', header: 'Event' },
          { key: 'recipient', header: 'Recipient' },
          { key: 'channels', header: 'Channels' },
          { key: 'timing', header: 'Timing' },
          {
            key: 'safety',
            header: 'Bypass',
            render: (r) =>
              r.safety ? (
                <Badge tone="red">Safety — bypasses preferences</Badge>
              ) : (
                <Badge tone="slate">Respects preferences</Badge>
              ),
          },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) => (
              <Button size="xs" icon={Eye} onClick={() => setEditing(r)}>
                Preview
              </Button>
            ),
          },
        ]}
        rows={EVENTS}
        exportName="notification-templates"
        pageSize={16}
      />

      <Card className="mt-4">
        <CardHeader
          title="Channels"
          icon={Bell}
          subtitle="With fallback from push to SMS and rate limiting at the gateway"
        />
        <CardBody className="flex flex-wrap gap-2">
          {[
            'Push (FCM / APNs)',
            'SMS',
            'Email',
            'In-app inbox',
            'Viber Business',
            'WhatsApp Business',
            'Console alarm',
            'Voice call (SOS escalation)',
          ].map((c) => (
            <Badge key={c} tone="brand">
              {c}
            </Badge>
          ))}
        </CardBody>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.event}
        subtitle={`${editing?.channels} · ${editing?.timing}`}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              toast({
                title: 'Template saved',
                body: 'A new version is created; messages already sent keep the old text.',
              })
              setEditing(null)
            }}
          >
            Save version
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="English" hint="Variables in double braces are filled at send time">
            <Textarea rows={3} defaultValue={SAMPLE[editing?.id] || `YanGo: ${editing?.event} — {{details}}.`} />
          </Field>
          <Field label="Myanmar (Unicode)">
            <Textarea rows={3} defaultValue="YanGo — {{details}}" />
          </Field>
          {editing?.safety && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-[12.5px] text-red-900 leading-relaxed">
                This is a safety message. It ignores quiet hours, marketing opt-out and channel preferences, and falls
                back from push to SMS automatically.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
