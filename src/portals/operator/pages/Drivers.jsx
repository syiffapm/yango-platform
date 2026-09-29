import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IdCard, Mail, UserPlus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dateOnly, daysUntil } from '../../../lib/format.js'
export default function Drivers() {
  const { drivers, vehicles, update, notify, op } = useOperator()
  const toast = useToast()
  const [invite, setInvite] = useState(null)
  const rows = drivers.map((d) => ({
    ...d,
    plate: vehicles.find((v) => v.id === d.vehicle)?.plate || '—',
    licenceDays: daysUntil(d.licenceExpiry),
    medicalDays: daysUntil(d.medicalExpiry),
    blocker:
      daysUntil(d.medicalExpiry) < 0
        ? 'Medical expired'
        : daysUntil(d.licenceExpiry) < 0
          ? 'Licence expired'
          : d.status === 'blocked'
            ? 'Suspended'
            : null,
  }))
  const sendInvite = () => {
    const id = `D${String(900 + drivers.length)}`
    update((d) => {
      d.drivers.unshift({
        id,
        name: invite.name,
        nrc: invite.nrc,
        phone: invite.phone,
        operator: op.id,
        licenceNo: invite.licenceNo,
        licenceClass: 'D',
        licenceExpiry: '2028-01-31',
        medicalExpiry: '2027-06-30',
        trainingExpiry: '2027-12-31',
        policeClearance: '2026-09-01',
        status: 'pending',
        rating: 0,
        violations: 0,
        hoursThisWeek: 0,
        vehicle: null,
        photo: null,
      })
    })
    notify({
      audience: 'driver',
      title: 'You have been invited',
      body: `${op.name} invited you to activate the YanGo Driver App. Complete eKYC to finish registration.`,
    })
    toast({ title: 'SMS invite sent', body: `${invite.name} must activate the Driver App and complete eKYC.` })
    setInvite(null)
  }
  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle="Driver list, invites, self-registered applications, document expiry, rating, violations and driving hours. A driver can only start a shift with a valid operating licence and a successful face match."
        actions={
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setInvite({ name: '', nrc: '', phone: '', licenceNo: '' })}
          >
            Invite driver
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Drivers"
          value={drivers.length}
          icon={IdCard}
          method="Drivers bound to your company in the national driver registry."
        />
        <Stat
          label="Licensed & active"
          value={drivers.filter((d) => d.status === 'active').length}
          tone="good"
          method="Operating licence valid and not suspended."
        />
        <Stat
          label="Cannot start a shift"
          value={rows.filter((r) => r.blocker).length}
          tone={rows.some((r) => r.blocker) ? 'bad' : 'good'}
          method="Expired medical, expired licence or suspension — the Driver App blocks check-in."
        />
        <Stat
          label="Docs expiring ≤ 60 days"
          value={rows.filter((r) => r.medicalDays <= 60 || r.licenceDays <= 60).length}
          tone="warn"
          method="Medical, training or licence approaching expiry."
        />
      </StatGrid>

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Driver',
            render: (r) => (
              <div>
                <span className="font-medium text-ink-900">{r.name}</span>
                <span className="block text-[11.5px] text-ink-400 font-mono">{r.nrc}</span>
              </div>
            ),
          },
          {
            key: 'licenceNo',
            header: 'Licence',
            render: (r) => (
              <span>
                {r.licenceNo} <Badge tone="slate">class {r.licenceClass}</Badge>
              </span>
            ),
          },
          { key: 'plate', header: 'Regular bus' },
          {
            key: 'licenceExpiry',
            header: 'Licence to',
            render: (r) => (
              <span className={r.licenceDays <= 60 ? 'text-amber-700' : ''}>{dateOnly(r.licenceExpiry)}</span>
            ),
          },
          {
            key: 'medicalExpiry',
            header: 'Medical to',
            render: (r) => (
              <span
                className={
                  r.medicalDays <= 0 ? 'text-red-600 font-medium' : r.medicalDays <= 60 ? 'text-amber-700' : ''
                }
              >
                {dateOnly(r.medicalExpiry)}
              </span>
            ),
          },
          {
            key: 'hoursThisWeek',
            header: 'Hours/wk',
            align: 'right',
            render: (r) => (
              <span className={r.hoursThisWeek > 36 ? 'text-amber-700 font-medium' : ''}>{r.hoursThisWeek}</span>
            ),
          },
          {
            key: 'rating',
            header: 'Rating',
            align: 'right',
            render: (r) => (r.rating ? `${r.rating.toFixed(1)} ★` : '—'),
          },
          { key: 'violations', header: 'Violations', align: 'right', render: (r) => r.violations || '—' },
          {
            key: 'status',
            header: 'Status',
            render: (r) => (r.blocker ? <Badge tone="red">{r.blocker}</Badge> : <StatusPill status={r.status} />),
          },
        ]}
        rows={rows}
        searchKeys={['name', 'nrc', 'licenceNo', 'phone']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'blocked', label: 'Blocked' },
            ],
          },
        ]}
        exportName="drivers"
        pageSize={12}
      />

      <p className="text-[12px] text-ink-400 mt-3">
        Driver licensing is filed through the{' '}
        <Link to="/licensing/apply" className="text-brand-700 underline">
          Licensing Portal
        </Link>
        . Path A: you invite the driver by SMS. Path B: the driver self-registers and chooses your company — you accept
        before the authority reviews.
      </p>

      <Modal
        open={!!invite}
        onClose={() => setInvite(null)}
        title="Invite a driver"
        subtitle="The driver receives an SMS to activate the Driver App and complete eKYC."
        footer={
          <>
            <Button onClick={() => setInvite(null)}>Cancel</Button>
            <Button variant="primary" icon={Mail} disabled={!invite?.name || !invite?.phone} onClick={sendInvite}>
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Full name" required>
            <Input value={invite?.name || ''} onChange={(e) => setInvite((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="Mobile number" required hint="The activation SMS goes to this number.">
            <Input
              value={invite?.phone || ''}
              onChange={(e) => setInvite((s) => ({ ...s, phone: e.target.value }))}
              placeholder="+95 9 …"
            />
          </Field>
          <Field label="National ID (NRC)">
            <Input value={invite?.nrc || ''} onChange={(e) => setInvite((s) => ({ ...s, nrc: e.target.value }))} />
          </Field>
          <Field label="Driving licence number">
            <Input
              value={invite?.licenceNo || ''}
              onChange={(e) => setInvite((s) => ({ ...s, licenceNo: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
