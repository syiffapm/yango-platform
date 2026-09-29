import { Navigate, Route, Routes } from 'react-router-dom'
import { Home, ListChecks, MessageSquare, UserRound } from 'lucide-react'
import MobileShell from '../../components/layout/MobileShell.jsx'
import { useDb } from '../../lib/store.jsx'
import { useT } from '../../lib/i18n.jsx'
import { useSession } from '../../lib/session.jsx'
import DriverWelcome from './pages/DriverWelcome.jsx'
import DriverHome from './pages/DriverHome.jsx'
import CheckIn from './pages/CheckIn.jsx'
import Inspection from './pages/Inspection.jsx'
import Trips from './pages/Trips.jsx'
import TripDetail from './pages/TripDetail.jsx'
import Manifest from './pages/Manifest.jsx'
import DriverSos from './pages/DriverSos.jsx'
import Messages from './pages/Messages.jsx'
import Fatigue from './pages/Fatigue.jsx'
import EndShift from './pages/EndShift.jsx'
import Profile from './pages/Profile.jsx'
import Onboarding from './pages/Onboarding.jsx'
export default function DriverApp() {
  const { db } = useDb()
  const [ses] = useSession('driver')
  const { t } = useT('driver')
  const unread = db.notifications.filter((n) => n.audience === 'driver' && !n.read).length
  const tabs = [
    { to: '/driver/home', icon: Home, label: t('drv.nav.home'), end: true },
    { to: '/driver/trips', icon: ListChecks, label: t('drv.nav.trips') },
    { to: '/driver/messages', icon: MessageSquare, label: t('drv.nav.inbox'), badge: unread },
    { to: '/driver/profile', icon: UserRound, label: t('drv.nav.profile') },
  ]
  if (!ses.signedIn) {
    return (
      <Routes>
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="*" element={<DriverWelcome />} />
      </Routes>
    )
  }
  return (
    <>
      <MobileShell tabs={tabs} tone="dark">
        <Routes>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<DriverHome />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="inspection" element={<Inspection />} />
          <Route path="trips" element={<Trips />} />
          <Route path="trip/:id" element={<TripDetail />} />
          <Route path="manifest/:id" element={<Manifest />} />
          <Route path="sos" element={<DriverSos />} />
          <Route path="messages" element={<Messages />} />
          <Route path="fatigue" element={<Fatigue />} />
          <Route path="endshift" element={<EndShift />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/driver/home" replace />} />
        </Routes>
      </MobileShell>
    </>
  )
}
