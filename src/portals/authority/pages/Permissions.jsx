import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import useAuthority from '../useAuthority.js'
import { permissionMatrix } from '../../../data/org.js'
const COLS = [
  ['nat_policy', 'Nat. policy'],
  ['nat_auditor', 'Nat. auditor'],
  ['lic_officer', 'Lic. officer'],
  ['lic_approver', 'Lic. approver'],
  ['compliance', 'Compliance'],
  ['adjudicator', 'Adjudicator'],
  ['safety', 'Safety'],
  ['planning', 'Planning'],
  ['finance', 'Finance'],
  ['terminal_mgr', 'Terminal mgr'],
  ['po_admin', 'PO admin'],
  ['po_ops', 'PO ops'],
  ['po_finance', 'PO finance'],
  ['driver', 'Driver'],
]
function Cell({ value }) {
  if (value === 'A') return <Badge tone="green">A</Badge>
  if (value === 'R') return <Badge tone="amber">R</Badge>
  if (value === 'V') return <Badge tone="blue">V</Badge>
  if (value === 'own') return <Badge tone="slate">own</Badge>
  if (value === 'A\n(own)' || value === 'A (own)') return <Badge tone="green">A own</Badge>
  return <span className="text-ink-300">–</span>
}
export default function Permissions() {
  const { db, roleLabel } = useAuthority()
  return (
    <>
      <PageHeader
        title="Permissions"
        subtitle="15 roles across 5 tiers. Permissions are held by role, never by person, so removing someone from a role removes every power that came with it."
        meta={
          <>
            <Badge tone="brand">{db.roles.length} roles</Badge>
            <Badge tone="slate">Signed in as {roleLabel}</Badge>
          </>
        }
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap gap-3">
          {[
            ['A', 'green', 'Allowed'],
            ['R', 'amber', 'Allowed with a written reason'],
            ['V', 'blue', 'View only'],
            ['own', 'slate', 'Own records only'],
            ['–', null, 'Not permitted'],
          ].map(([k, tone, label]) => (
            <span key={k} className="inline-flex items-center gap-2 text-[12.5px] text-ink-600">
              {tone ? <Badge tone={tone}>{k}</Badge> : <span className="text-ink-300 px-1.5">–</span>}
              {label}
            </span>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Permission matrix"
          subtitle="Separation of duties is enforced in the platform, not only in policy: licence maker ≠ approver, dispute adjudicator ≠ finding issuer, and the officer who changes a threshold cannot issue findings based on it in the same period."
        />
        <CardBody className="p-0 overflow-x-auto scroll-thin">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="px-4 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400 sticky left-0 bg-white z-10 min-w-[220px]">
                  Permission
                </th>
                {COLS.map(([k, label]) => (
                  <th
                    key={k}
                    className="px-2 py-2.5 text-[11px] uppercase tracking-wider text-ink-400 text-center whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((p) => (
                <tr key={p.key} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                  <td className="px-4 py-2 text-[12px] text-ink-700 sticky left-0 bg-white">{p.label}</td>
                  {COLS.map(([k]) => (
                    <td key={k} className="px-2 py-2 text-center">
                      <Cell value={p[k]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Roles" subtitle="Five tiers: national, authority, terminal, operator and field" />
        <CardBody className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {db.roles.map((r) => (
            <div key={r.id} className="rounded-lg border border-ink-200 p-3">
              <p className="text-[12.5px] font-medium text-ink-900">{r.label}</p>
              <p className="text-[11.5px] text-ink-400 mt-0.5">
                {r.tier} · {r.org}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  )
}
