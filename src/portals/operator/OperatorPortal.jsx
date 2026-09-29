import { Navigate, Route, Routes } from 'react-router-dom'
import {
  Activity,
  BadgeCheck,
  Banknote,
  Bus,
  CalendarDays,
  ClipboardList,
  Coins,
  FileBarChart,
  Home,
  KeyRound,
  LifeBuoy,
  Megaphone,
  Map as MapIcon,
  Receipt,
  ScrollText,
  Settings,
  ScanLine,
  ShieldAlert,
  Star,
  Ticket,
  Timer,
  Users,
  Wrench,
  Building2,
} from 'lucide-react'
import PortalShell, { IdentityMenu } from '../../components/layout/PortalShell.jsx'
import { useSession } from '../../lib/session.jsx'
import { useDb, openIncidents } from '../../lib/store.jsx'
import { operators } from '../../data/org.js'
import Dashboard from './pages/Dashboard.jsx'
import Company from './pages/Company.jsx'
import UsersRoles from './pages/UsersRoles.jsx'
import Licences from './pages/Licences.jsx'
import Fleet from './pages/Fleet.jsx'
import VehicleDetail from './pages/VehicleDetail.jsx'
import Maintenance from './pages/Maintenance.jsx'
import Drivers from './pages/Drivers.jsx'
import Roster from './pages/Roster.jsx'
import RoutesPage from './pages/RoutesPage.jsx'
import Schedules from './pages/Schedules.jsx'
import Fares from './pages/Fares.jsx'
import Inventory from './pages/Inventory.jsx'
import Bookings from './pages/Bookings.jsx'
import Boarding from './pages/Boarding.jsx'
import Refunds from './pages/Refunds.jsx'
import LiveOps from './pages/LiveOps.jsx'
import Incidents from './pages/Incidents.jsx'
import Compliance from './pages/Compliance.jsx'
import Ads from './pages/Ads.jsx'
import Reviews from './pages/Reviews.jsx'
import Finance from './pages/Finance.jsx'
import Reports from './pages/Reports.jsx'
import ApiKeys from './pages/ApiKeys.jsx'
import AuditLog from './pages/AuditLog.jsx'
export default function OperatorPortal() {
  const [ses, setSes] = useSession('operator')
  const { db } = useDb()
  const op = operators.find((o) => o.id === ses.operator) || operators[0]
  const openInc = openIncidents(db, op.id).length
  const openFindings = db.findings.filter(
    (f) => f.operator === op.id && ['issued', 'disputed'].includes(f.status),
  ).length
  const nav = [
    {
      label: 'Overview',
      items: [
        { to: '/operator/home', icon: Home, label: 'Dashboard', end: true },
        { to: '/operator/live', icon: Activity, label: 'Live operations' },
      ],
    },
    {
      label: 'Fleet & people',
      items: [
        { to: '/operator/fleet', icon: Bus, label: 'Fleet' },
        { to: '/operator/maintenance', icon: Wrench, label: 'Maintenance' },
        { to: '/operator/drivers', icon: Users, label: 'Drivers' },
        { to: '/operator/roster', icon: CalendarDays, label: 'Roster' },
      ],
    },
    {
      label: 'Network & sales',
      items: [
        { to: '/operator/routes', icon: MapIcon, label: 'Routes' },
        { to: '/operator/schedules', icon: Timer, label: 'Schedules' },
        { to: '/operator/fares', icon: Coins, label: 'Fares & promos' },
        { to: '/operator/inventory', icon: ClipboardList, label: 'Seat inventory' },
        { to: '/operator/bookings', icon: Ticket, label: 'Bookings & manifest' },
        { to: '/operator/boarding', icon: ScanLine, label: 'Boarding & check-in' },
        { to: '/operator/refunds', icon: Receipt, label: 'Refunds' },
      ],
    },
    {
      label: 'Safety & compliance',
      items: [
        { to: '/operator/incidents', icon: ShieldAlert, label: 'SOS & incidents', badge: openInc },
        { to: '/operator/compliance', icon: BadgeCheck, label: 'Compliance', badge: openFindings },
      ],
    },
    {
      label: 'Commercial',
      items: [
        { to: '/operator/finance', icon: Banknote, label: 'Finance & settlement' },
        { to: '/operator/ads', icon: Megaphone, label: 'Ads & promotions' },
        { to: '/operator/reviews', icon: Star, label: 'Reviews' },
        { to: '/operator/reports', icon: FileBarChart, label: 'Reports' },
      ],
    },
    {
      label: 'Company',
      items: [
        { to: '/operator/company', icon: Building2, label: 'Company profile' },
        { to: '/operator/users', icon: Users, label: 'Users & roles' },
        { to: '/operator/licences', icon: ScrollText, label: 'Licences' },
        { to: '/operator/api', icon: KeyRound, label: 'API & webhooks' },
        { to: '/operator/audit', icon: LifeBuoy, label: 'Help & audit' },
      ],
    },
  ]
  const myUsers = db.poUsers.filter((u) => u.operator === op.id)
  const me = myUsers.find((u) => u.id === ses.userId) || myUsers[0]
  return (
    <PortalShell
      portal={{ name: op.name, tagline: 'Bus Operator Portal' }}
      nav={nav}
      notificationsAudience="operator"
      identity={
        <IdentityMenu
          name={me?.name}
          role={me?.role?.replace('po_', 'PO ')}
          org={op.short}
          options={[
            ...myUsers.map((u) => ({ value: `user:${u.id}`, label: u.name, hint: u.role.replace('po_', 'PO ') })),
            ...operators
              .filter((o) => o.id !== op.id)
              .map((o) => ({
                value: `op:${o.id}`,
                label: `Switch to ${o.name}`,
                hint: 'Operators only ever see their own data',
              })),
          ]}
          onSelect={(v) => {
            const [kind, id] = v.split(':')
            if (kind === 'user') setSes({ userId: id })
            else setSes({ operator: id, userId: db.poUsers.find((u) => u.operator === id)?.id })
          }}
          footer={
            <div className="px-3.5 py-2 text-[11.5px] text-ink-400 border-t border-ink-100">
              Settings · <Settings size={10} className="inline" /> 2FA enabled
            </div>
          }
        />
      }
    >
      <Routes>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Dashboard />} />
        <Route path="live" element={<LiveOps />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="fleet/:id" element={<VehicleDetail />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="roster" element={<Roster />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="fares" element={<Fares />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="boarding" element={<Boarding />} />
        <Route path="refunds" element={<Refunds />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="finance" element={<Finance />} />
        <Route path="ads" element={<Ads />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="reports" element={<Reports />} />
        <Route path="company" element={<Company />} />
        <Route path="users" element={<UsersRoles />} />
        <Route path="licences" element={<Licences />} />
        <Route path="api" element={<ApiKeys />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/operator/home" replace />} />
      </Routes>
    </PortalShell>
  )
}
