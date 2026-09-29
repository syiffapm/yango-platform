import { useState } from 'react'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input, Select } from '../../../components/ui/Field.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { relative } from '../../../lib/format.js'
import { permissionMatrix } from '../../../data/org.js'
const PO_ROLES = [
  { id: 'po_admin', label: 'PO Admin', desc: 'Company profile, users, licences, everything below' },
  { id: 'po_ops', label: 'Operations / Dispatcher', desc: 'Rosters, schedules, live ops, incident responses' },
  { id: 'po_finance', label: 'Finance', desc: 'Sales, settlement, invoices, statements' },
  { id: 'po_marketing', label: 'Marketing', desc: 'Ads, promotions and campaign reporting' },
  { id: 'po_viewer', label: 'Viewer', desc: 'Read-only across the portal' },
]
const PO_COLS = ['po_admin', 'po_ops', 'po_finance']
export default function UsersRoles() {
  const { users, update, op } = useOperator()
  const toast = useToast()
  const [adding, setAdding] = useState(null)
  const add = () => {
    update((d) => {
      d.poUsers.unshift({
        id: `PU${Date.now().toString(36).slice(-4)}`,
        name: adding.name,
        email: adding.email,
        role: adding.role,
        operator: op.id,
        twoFA: false,
        lastActive: null,
        status: 'active',
      })
    })
    toast({ title: 'User invited', body: '2FA must be enrolled before first sign-in.' })
    setAdding(null)
  }
  return (
    <>
      <PageHeader
        title="Users & roles"
        subtitle="Each side administers its own people. You manage your company's accounts; the authority manages its own. 2FA is mandatory for every portal user."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setAdding({ name: '', email: '', role: 'po_ops' })}>
            Add user
          </Button>
        }
      />

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          {
            key: 'role',
            header: 'Role',
            render: (r) => <Badge tone="brand">{PO_ROLES.find((x) => x.id === r.role)?.label || r.role}</Badge>,
          },
          {
            key: 'twoFA',
            header: '2FA',
            render: (r) =>
              r.twoFA ? (
                <Badge tone="green" icon={ShieldCheck}>
                  Enrolled
                </Badge>
              ) : (
                <Badge tone="red">Not enrolled</Badge>
              ),
          },
          {
            key: 'lastActive',
            header: 'Last active',
            render: (r) => (r.lastActive ? relative(r.lastActive) : 'Never'),
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={users}
        exportName="po-users"
        empty="No users"
      />

      <Card className="mt-4">
        <CardHeader
          title="What each role may do"
          subtitle="Permissions are held by role, never by person. A = allowed, R = allowed with a written reason, – = not permitted."
        />
        <CardBody className="p-0 overflow-x-auto scroll-thin">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="px-4 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">Permission</th>
                {PO_COLS.map((c) => (
                  <th key={c} className="px-3 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400 text-center">
                    {PO_ROLES.find((r) => r.id === c)?.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionMatrix
                .filter((p) => PO_COLS.some((c) => p[c] !== '-'))
                .map((p) => (
                  <tr key={p.key} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-2 text-[12px] text-ink-700">{p.label}</td>
                    {PO_COLS.map((c) => (
                      <td key={c} className="px-3 py-2 text-center">
                        {p[c] === 'A' ? (
                          <Badge tone="green">A</Badge>
                        ) : p[c] === 'R' ? (
                          <Badge tone="amber">R</Badge>
                        ) : p[c] === 'own' ? (
                          <Badge tone="slate">own</Badge>
                        ) : (
                          <span className="text-ink-300">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title="Add a user"
        subtitle="The invitee enrols 2FA before first sign-in."
        footer={
          <>
            <Button onClick={() => setAdding(null)}>Cancel</Button>
            <Button variant="primary" disabled={!adding?.name || !adding?.email} onClick={add}>
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Full name" required>
            <Input value={adding?.name || ''} onChange={(e) => setAdding((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={adding?.email || ''}
              onChange={(e) => setAdding((s) => ({ ...s, email: e.target.value }))}
            />
          </Field>
          <Field label="Role" hint={PO_ROLES.find((r) => r.id === adding?.role)?.desc}>
            <Select value={adding?.role} onChange={(e) => setAdding((s) => ({ ...s, role: e.target.value }))}>
              {PO_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </>
  )
}
