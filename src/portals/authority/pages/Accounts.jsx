import { useState } from 'react'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input, Select } from '../../../components/ui/Field.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { relative } from '../../../lib/format.js'
export default function Accounts() {
  const { db, update, audit, me, can } = useAuthority()
  const toast = useToast()
  const [adding, setAdding] = useState(null)
  const rows = db.users.map((u) => ({
    ...u,
    roleLabel: db.roles.find((r) => r.id === u.role)?.label || u.role,
  }))
  const passwordOnly = rows.filter((u) => !u.twoFA)
  const reasonsMissing = db.audit.filter((a) => a.flag).length
  const permitsNeedingAttention = db.permits.filter((p) => p.status === 'suspended').length
  const add = () => {
    update((d) => {
      d.users.unshift({
        id: `U${Date.now().toString(36).slice(-3).toUpperCase()}`,
        name: adding.name,
        email: adding.email,
        role: adding.role,
        org: adding.org || 'YRTC',
        jurisdiction: 'YGN',
        twoFA: false,
        lastActive: null,
        status: 'active',
      })
    })
    audit({ actor: me.id, role: me.role, action: 'Created account', object: adding.email, category: 'Administration' })
    toast({ title: 'Account created', body: '2FA must be enrolled before first sign-in.' })
    setAdding(null)
  }
  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="The authority administers its own people; each operator administers its own. Permissions are held by role, never by person."
        actions={
          can.manageAccounts && (
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={() => setAdding({ name: '', email: '', role: 'compliance' })}
            >
              Add account
            </Button>
          )
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Accounts"
          value={rows.length}
          method="Active authority and ministry accounts in this jurisdiction."
        />
        <Stat
          label="Password only"
          value={passwordOnly.length}
          tone={passwordOnly.length ? 'bad' : 'good'}
          method="Accounts without 2FA enrolled. 2FA is mandatory for every authority and operator user."
        />
        <Stat
          label="Permits needing attention"
          value={permitsNeedingAttention}
          tone={permitsNeedingAttention ? 'warn' : 'good'}
          method="Suspended or revoked permits awaiting a decision."
        />
        <Stat
          label="Reasons not recorded"
          value={reasonsMissing}
          tone={reasonsMissing ? 'warn' : 'good'}
          method="Audit entries where a written reason was required but none was captured. Flagged, never hidden."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'roleLabel', header: 'Role', render: (r) => <Badge tone="brand">{r.roleLabel}</Badge> },
          { key: 'org', header: 'Organisation' },
          { key: 'jurisdiction', header: 'Jurisdiction', render: (r) => <Badge tone="slate">{r.jurisdiction}</Badge> },
          {
            key: 'twoFA',
            header: '2FA',
            render: (r) =>
              r.twoFA ? (
                <Badge tone="green" icon={ShieldCheck}>
                  Enrolled
                </Badge>
              ) : (
                <Badge tone="red">Password only</Badge>
              ),
          },
          {
            key: 'lastActive',
            header: 'Last active',
            render: (r) => (r.lastActive ? relative(r.lastActive) : 'Never'),
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        exportName="authority-accounts"
        searchKeys={['name', 'email', 'roleLabel', 'org']}
        filters={[{ key: 'role', label: 'Role', options: db.roles.map((r) => ({ value: r.id, label: r.label })) }]}
        pageSize={14}
      />

      <p className="text-[12px] text-ink-400 mt-3">
        Government SSO (SAML/OIDC) is supported; sessions time out after 15 minutes idle on consoles. The platform
        super-admin manages tenants, master data and integrations but holds no business permission.
      </p>

      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title="Add an account"
        subtitle="Permissions come from the role. Nothing is granted to a person directly."
        footer={
          <>
            <Button onClick={() => setAdding(null)}>Cancel</Button>
            <Button variant="primary" disabled={!adding?.name || !adding?.email} onClick={add}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Full name" required>
            <Input value={adding?.name || ''} onChange={(e) => setAdding((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="Official email" required>
            <Input
              type="email"
              value={adding?.email || ''}
              onChange={(e) => setAdding((s) => ({ ...s, email: e.target.value }))}
            />
          </Field>
          <Field label="Role">
            <Select value={adding?.role} onChange={(e) => setAdding((s) => ({ ...s, role: e.target.value }))}>
              {db.roles
                .filter((r) => !r.id.startsWith('po_') && r.id !== 'driver')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Organisation">
            <Input
              value={adding?.org || ''}
              onChange={(e) => setAdding((s) => ({ ...s, org: e.target.value }))}
              placeholder="YRTC"
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
