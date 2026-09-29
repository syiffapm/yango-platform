import { Navigate, Route, Routes } from 'react-router-dom'
import {
  Activity,
  BadgeCheck,
  Inbox,
  Wrench,
  Banknote,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  Coins,
  FileBarChart,
  FileText,
  Gauge,
  Gavel,
  Globe2,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  MapPinned,
  Megaphone,
  MonitorSpeaker,
  Plug,
  Radio,
  ScanLine,
  ScrollText,
  Server,
  Settings2,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react'
import PortalShell, { IdentityMenu } from '../../components/layout/PortalShell.jsx'
import { Select } from '../../components/ui/Field.jsx'
import { useSession } from '../../lib/session.jsx'
import { useTx } from '../../lib/adminLang.js'
import { useDb, openIncidents } from '../../lib/store.jsx'
import CommandCenter from './pages/CommandCenter.jsx'
import Incidents from './pages/Incidents.jsx'
import SosBoard from './pages/SosBoard.jsx'
import Compliance from './pages/Compliance.jsx'
import Analytics from './pages/Analytics.jsx'
import Planning from './pages/Planning.jsx'
import Reports from './pages/Reports.jsx'
import LicensingOverview from './pages/LicensingOverview.jsx'
import Revenue from './pages/Revenue.jsx'
import Settlement from './pages/Settlement.jsx'
import Registries from './pages/Registries.jsx'
import CmsOverview from '../terminal/pages/CmsDashboard.jsx'
import { AsOfficer } from '../licensing/mount.jsx'
import OfficerQueue from '../licensing/pages/OfficerQueue.jsx'
import ApplicationDetail from '../licensing/pages/ApplicationDetail.jsx'
import Inspections from '../licensing/pages/Inspections.jsx'
import LicenceRegister from '../licensing/pages/Register.jsx'
import FeeSchedule from '../licensing/pages/FeeSchedule.jsx'
import LicensingReports from '../licensing/pages/LicensingReports.jsx'
import Enforcement from './pages/Enforcement.jsx'
import NationalDashboard from './pages/NationalDashboard.jsx'
import RegionalDashboard from './pages/RegionalDashboard.jsx'
import AiInsights from './pages/AiInsights.jsx'
import Accounts from './pages/Accounts.jsx'
import Permissions from './pages/Permissions.jsx'
import PermitRegister from './pages/PermitRegister.jsx'
import Thresholds from './pages/Thresholds.jsx'
import AuditLog from './pages/AuditLog.jsx'
import Integrations from './pages/Integrations.jsx'
import Approvals from './pages/Approvals.jsx'
import Complaints from './pages/Complaints.jsx'

// Content, advertising, terminals and platform admin — the same government, one console.
import TerminalOps from '../terminal/pages/TerminalOps.jsx'
import Bays from '../terminal/pages/Bays.jsx'
import DepartureBoard from '../terminal/DepartureBoard.jsx'
import GateCheckIn from '../terminal/pages/GateCheckIn.jsx'
import CrowdMonitor from '../terminal/pages/CrowdMonitor.jsx'
import Announcements from '../terminal/pages/Announcements.jsx'
import Knowledge from '../terminal/pages/Knowledge.jsx'
import HomeLayout from '../terminal/pages/HomeLayout.jsx'
import FareBands from '../terminal/pages/FareBands.jsx'
import AdInventory from '../terminal/pages/AdInventory.jsx'
import AdCampaigns from '../terminal/pages/AdCampaigns.jsx'
import Advertisers from '../terminal/pages/Advertisers.jsx'
import AdBilling from '../terminal/pages/AdBilling.jsx'
import NotificationTemplates from '../terminal/pages/NotificationTemplates.jsx'
import Broadcasts from '../terminal/pages/Broadcasts.jsx'
import DeliveryLogs from '../terminal/pages/DeliveryLogs.jsx'
import Helpdesk from '../terminal/pages/Helpdesk.jsx'
import PlatformAdmin from '../terminal/pages/PlatformAdmin.jsx'
import useCms from '../terminal/useCms.js'
const JURISDICTIONS = [
  { value: 'NATIONAL', label: 'National — all regions' },
  { value: 'YGN', label: 'Yangon Region' },
  { value: 'MDY', label: 'Mandalay Region' },
  { value: 'BAG', label: 'Bago Region' },
]
export default function AuthorityConsole() {
  const tx = useTx()
  const [ses, setSes] = useSession('authority')
  const { db } = useDb()
  const { can } = useCms()
  const me = db.users.find((u) => u.id === ses.userId) || db.users[0]
  const open = openIncidents(db)
  const sos = open.filter((i) => i.isSOS)
  const pendingApps = db.applications.filter((a) =>
    ['submitted', 'in_review', 'awaiting_approval', 'inspection'].includes(a.state),
  ).length
  const pendingAds = db.campaigns.filter((c) => c.status === 'pending').length
  const draftContent = db.announcements.filter((a) => a.status === 'draft').length
  const disputes = db.findings.filter((f) => f.status === 'disputed').length
  const nav = [
    {
      label: 'Operations',
      items: [
        { to: '/cms/command', icon: Activity, label: 'Command center', end: true },
        { to: '/cms/incidents', icon: ShieldAlert, label: 'Incidents', badge: open.length },
        { to: '/cms/sos', icon: Siren, label: 'SOS live board', badge: sos.length },
        { to: '/cms/compliance', icon: BadgeCheck, label: 'Compliance', badge: disputes },
        { to: '/cms/enforcement', icon: Gavel, label: 'Enforcement' },
      ],
    },
    {
      label: 'Insight',
      items: [
        { to: '/cms/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/cms/planning', icon: Globe2, label: 'Planning' },
        { to: '/cms/reports', icon: FileBarChart, label: 'Reports' },
        { to: '/cms/national', icon: LayoutDashboard, label: 'National dashboard' },
        { to: '/cms/regional', icon: MapPinned, label: 'Regional dashboard' },
        { to: '/cms/ai', icon: Sparkles, label: 'AI & automation' },
      ],
    },
    {
      label: 'Licensing & money',
      items: [
        { to: '/cms/licensing', icon: ClipboardList, label: 'Licensing overview', badge: pendingApps },
        { to: '/cms/licensing/queue', icon: Inbox, label: 'Approval work queue', badge: pendingApps },
        { to: '/cms/licensing/inspections', icon: Wrench, label: 'Inspections' },
        { to: '/cms/licensing/register', icon: BadgeCheck, label: 'Licence register' },
        { to: '/cms/licensing/fees', icon: Coins, label: 'Fee schedule' },
        { to: '/cms/licensing/reports', icon: FileBarChart, label: 'Licensing reports' },
        { to: '/cms/permits', icon: ScrollText, label: 'Permit register' },
        { to: '/cms/revenue', icon: Banknote, label: 'Regulated revenue' },
        { to: '/cms/settlement', icon: Landmark, label: 'Settlement oversight' },
      ],
    },
    {
      label: 'Registries',
      items: [
        { to: '/cms/registries', icon: Building2, label: 'Operators, fleet & drivers' },
        { to: '/cms/fares', icon: Coins, label: 'Fare bands', locked: !can.fareBands },
      ],
    },
    can.terminal && {
      label: 'Terminals',
      items: [
        { to: '/cms/terminals', icon: Building2, label: 'Terminal overview' },
        { to: '/cms/bays', icon: MonitorSpeaker, label: 'Bay allocation' },
        { to: '/cms/board', icon: Radio, label: 'Departure board' },
        { to: '/cms/gate', icon: ScanLine, label: 'Gate check-in' },
        { to: '/cms/crowd', icon: Users, label: 'Crowd monitor' },
      ],
    },
    {
      label: 'CMS · Content & messaging',
      items: [
        { to: '/cms/cms', icon: LayoutTemplate, label: 'CMS overview' },
        { to: '/cms/approvals', icon: Megaphone, label: 'Ads & content approval', badge: pendingAds },
        ...(can.content
          ? [
              { to: '/cms/announcements', icon: FileText, label: 'Announcements & alerts', badge: draftContent },
              { to: '/cms/knowledge', icon: BookOpen, label: 'FAQs & legal pages' },
              { to: '/cms/layout', icon: LayoutTemplate, label: 'App home layout' },
            ]
          : []),
        ...(can.notify
          ? [
              { to: '/cms/templates', icon: Bell, label: 'Notification templates' },
              ...(can.broadcast ? [{ to: '/cms/broadcasts', icon: Megaphone, label: 'Broadcasts' }] : []),
              { to: '/cms/delivery', icon: Server, label: 'Delivery logs' },
            ]
          : []),
        { to: '/cms/complaints', icon: LifeBuoy, label: 'Complaints' },
        ...(can.helpdesk ? [{ to: '/cms/helpdesk', icon: LifeBuoy, label: 'Helpdesk' }] : []),
      ],
    },
    can.ads && {
      label: 'CMS · Advertising',
      items: [
        { to: '/cms/ads/inventory', icon: Megaphone, label: 'Inventory & rate card' },
        { to: '/cms/ads/campaigns', icon: Megaphone, label: 'Campaigns' },
        { to: '/cms/ads/advertisers', icon: Users, label: 'Advertiser accounts' },
        { to: '/cms/ads/billing', icon: Coins, label: 'Billing & revenue split' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { to: '/cms/accounts', icon: Users, label: 'Accounts' },
        { to: '/cms/permissions', icon: SlidersHorizontal, label: 'Permissions' },
        { to: '/cms/thresholds', icon: Gauge, label: 'Thresholds & policy' },
        { to: '/cms/integrations', icon: Plug, label: 'Integration monitor' },
        { to: '/cms/audit', icon: FileText, label: 'Audit log' },
        ...(can.platform ? [{ to: '/cms/platform', icon: Settings2, label: 'Platform admin' }] : []),
      ],
    },
  ].filter(Boolean)
  return (
    <PortalShell
      portal={{
        name: 'CMS Ministry',
        tagline: ses.jurisdiction === 'NATIONAL' ? 'Ministry of Transport' : 'Yangon Region Transport Committee',
      }}
      nav={nav}
      notificationsAudience="authority"
      right={
        <Select
          value={ses.jurisdiction}
          onChange={(e) => setSes({ jurisdiction: e.target.value })}
          className="w-52 hidden sm:block"
        >
          {JURISDICTIONS.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </Select>
      }
      identity={
        <IdentityMenu
          name={me?.name}
          role={db.roles.find((r) => r.id === me?.role)?.label}
          org={me?.org}
          options={db.users.map((u) => ({
            value: u.id,
            label: u.name,
            hint: db.roles.find((r) => r.id === u.role)?.label,
          }))}
          onSelect={(userId) => setSes({ userId })}
        />
      }
    >
      <Routes>
        <Route index element={<Navigate to="command" replace />} />
        <Route path="command" element={<CommandCenter />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="sos" element={<SosBoard />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="enforcement" element={<Enforcement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="planning" element={<Planning />} />
        <Route path="reports" element={<Reports />} />
        <Route path="national" element={<NationalDashboard />} />
        <Route path="regional" element={<RegionalDashboard />} />
        <Route path="ai" element={<AiInsights />} />
        <Route path="licensing" element={<LicensingOverview />} />
        <Route path="permits" element={<PermitRegister />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="settlement" element={<Settlement />} />
        <Route path="registries" element={<Registries />} />
        <Route path="cms" element={<CmsOverview />} />
        <Route
          path="licensing/queue"
          element={
            <AsOfficer>
              <OfficerQueue />
            </AsOfficer>
          }
        />
        <Route
          path="licensing/application/:id"
          element={
            <AsOfficer>
              <ApplicationDetail />
            </AsOfficer>
          }
        />
        <Route
          path="licensing/inspections"
          element={
            <AsOfficer>
              <Inspections />
            </AsOfficer>
          }
        />
        <Route
          path="licensing/register"
          element={
            <AsOfficer>
              <LicenceRegister />
            </AsOfficer>
          }
        />
        <Route
          path="licensing/fees"
          element={
            <AsOfficer>
              <FeeSchedule />
            </AsOfficer>
          }
        />
        <Route
          path="licensing/reports"
          element={
            <AsOfficer>
              <LicensingReports />
            </AsOfficer>
          }
        />
        <Route path="approvals" element={<Approvals />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="thresholds" element={<Thresholds />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="audit" element={<AuditLog />} />

        <Route path="fares" element={<FareBands />} />
        <Route path="terminals" element={<TerminalOps />} />
        <Route path="bays" element={<Bays />} />
        <Route path="board" element={<DepartureBoard />} />
        <Route path="gate" element={<GateCheckIn />} />
        <Route path="crowd" element={<CrowdMonitor />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="layout" element={<HomeLayout />} />
        <Route path="ads/inventory" element={<AdInventory />} />
        <Route path="ads/campaigns" element={<AdCampaigns />} />
        <Route path="ads/advertisers" element={<Advertisers />} />
        <Route path="ads/billing" element={<AdBilling />} />
        <Route path="templates" element={<NotificationTemplates />} />
        <Route path="broadcasts" element={<Broadcasts />} />
        <Route path="delivery" element={<DeliveryLogs />} />
        <Route path="helpdesk" element={<Helpdesk />} />
        <Route path="platform" element={<PlatformAdmin />} />
        <Route path="*" element={<Navigate to="/cms/command" replace />} />
      </Routes>
    </PortalShell>
  )
}
