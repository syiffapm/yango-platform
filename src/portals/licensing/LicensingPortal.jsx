import { Navigate, Route, Routes } from 'react-router-dom'
import {
  ClipboardList,
  FilePlus2,
  FolderOpen,
  Gavel,
  Home,
  Inbox,
  Receipt,
  ScrollText,
  Settings2,
  Stamp,
  Wrench,
  BarChart3,
  BadgeCheck,
} from 'lucide-react'
import PortalShell, { IdentityMenu } from '../../components/layout/PortalShell.jsx'
import { Pills } from '../../components/ui/Tabs.jsx'
import { useSession } from '../../lib/session.jsx'
import { useDb } from '../../lib/store.jsx'
import { operators } from '../../data/org.js'
import OfficerQueue from './pages/OfficerQueue.jsx'
import ApplicationDetail from './pages/ApplicationDetail.jsx'
import Inspections from './pages/Inspections.jsx'
import FeeSchedule from './pages/FeeSchedule.jsx'
import Register from './pages/Register.jsx'
import LicensingReports from './pages/LicensingReports.jsx'
import ApplicantHome from './pages/ApplicantHome.jsx'
import Wizard from './pages/Wizard.jsx'
import DocumentVault from './pages/DocumentVault.jsx'
import Invoices from './pages/Invoices.jsx'
import MyLicences from './pages/MyLicences.jsx'
import Renewals from './pages/Renewals.jsx'
import Appeals from './pages/Appeals.jsx'
const OFFICER_NAV = (counts) => [
  {
    label: 'Back office',
    items: [
      { to: '/licensing/queue', icon: Inbox, label: 'Work queue', badge: counts.queue },
      { to: '/licensing/inspections', icon: Wrench, label: 'Inspections', badge: counts.inspections },
      { to: '/licensing/register', icon: ScrollText, label: 'Licence register' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/licensing/fees', icon: Settings2, label: 'Fee schedule' },
      { to: '/licensing/reports', icon: BarChart3, label: 'Licensing reports' },
    ],
  },
]
const APPLICANT_NAV = (counts) => [
  {
    label: 'My applications',
    items: [
      { to: '/licensing/home', icon: Home, label: 'Dashboard', end: true },
      { to: '/licensing/apply', icon: FilePlus2, label: 'New application' },
      { to: '/licensing/tracker', icon: ClipboardList, label: 'Application tracker', badge: counts.mine },
      { to: '/licensing/vault', icon: FolderOpen, label: 'Document vault' },
    ],
  },
  {
    label: 'Licences & money',
    items: [
      { to: '/licensing/licences', icon: BadgeCheck, label: 'My licences' },
      { to: '/licensing/renewals', icon: Stamp, label: 'Renewals', badge: counts.renewals },
      { to: '/licensing/invoices', icon: Receipt, label: 'Invoices & receipts', badge: counts.unpaid },
      { to: '/licensing/appeals', icon: Gavel, label: 'Appeals' },
    ],
  },
]
export default function LicensingPortal() {
  const [ses, setSes] = useSession('licensing')
  const { db } = useDb()
  const officer = ses.mode === 'officer'
  const mine = db.applications.filter((a) => a.operator === ses.operator)
  const counts = {
    queue: db.applications.filter((a) =>
      ['submitted', 'in_review', 'awaiting_approval', 'inspection'].includes(a.state),
    ).length,
    inspections: db.applications.filter((a) => a.state === 'inspection').length,
    mine: mine.filter((a) => !['approved', 'rejected'].includes(a.state)).length,
    unpaid: db.invoices.filter((i) => i.party === ses.operator && i.status === 'unpaid').length,
    renewals: db.permits.filter(
      (p) =>
        (p.holder === ses.operator || p.operator === ses.operator) && new Date(p.expiry) < Date.now() + 90 * 86400000,
    ).length,
  }
  const me = db.users.find((u) => u.id === ses.userId)
  const op = operators.find((o) => o.id === ses.operator)
  return (
    <PortalShell
      portal={{ name: 'Licensing Portal', tagline: officer ? 'Authority back office' : 'Applicant workspace' }}
      nav={officer ? OFFICER_NAV(counts) : APPLICANT_NAV(counts)}
      notificationsAudience={officer ? 'authority' : 'operator'}
      right={
        <Pills
          value={ses.mode}
          onChange={(mode) => setSes({ mode })}
          options={[
            { value: 'applicant', label: 'Applicant' },
            { value: 'officer', label: 'Officer' },
          ]}
        />
      }
      identity={
        officer ? (
          <IdentityMenu
            name={me?.name}
            role={me?.role === 'lic_approver' ? 'Licensing approver (checker)' : 'Licensing officer (maker)'}
            org="YRTC"
            options={db.users
              .filter((u) => ['lic_officer', 'lic_approver'].includes(u.role))
              .map((u) => ({
                value: u.id,
                label: u.name,
                hint:
                  u.role === 'lic_approver'
                    ? 'Approver — can sign off, cannot verify'
                    : 'Officer — verifies, cannot approve own work',
              }))}
            onSelect={(userId) => setSes({ userId })}
          />
        ) : (
          <IdentityMenu
            name={op?.name}
            role="PO administrator"
            org={op?.short}
            options={operators.map((o) => ({ value: o.id, label: o.name, hint: o.short }))}
            onSelect={(operator) => setSes({ operator })}
          />
        )
      }
    >
      <Routes>
        <Route index element={<Navigate to={officer ? 'queue' : 'home'} replace />} />
        {/* officer */}
        <Route path="queue" element={<OfficerQueue />} />
        <Route path="application/:id" element={<ApplicationDetail />} />
        <Route path="inspections" element={<Inspections />} />
        <Route path="register" element={<Register />} />
        <Route path="fees" element={<FeeSchedule />} />
        <Route path="reports" element={<LicensingReports />} />
        {/* applicant */}
        <Route path="home" element={<ApplicantHome />} />
        <Route path="apply" element={<Wizard />} />
        <Route path="tracker" element={<OfficerQueue applicantMode />} />
        <Route path="vault" element={<DocumentVault />} />
        <Route path="licences" element={<MyLicences />} />
        <Route path="renewals" element={<Renewals />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="appeals" element={<Appeals />} />
        <Route path="*" element={<Navigate to={officer ? '/licensing/queue' : '/licensing/home'} replace />} />
      </Routes>
    </PortalShell>
  )
}
