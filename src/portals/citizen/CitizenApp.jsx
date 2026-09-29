import { Navigate, Route, Routes } from 'react-router-dom'
import { Home, Ticket, UserRound } from 'lucide-react'
import { useT } from '../../lib/i18n.jsx'
import MobileShell from '../../components/layout/MobileShell.jsx'
import { BookingProvider } from './booking.jsx'
import { useDb } from '../../lib/store.jsx'
import { myTickets } from './mine.js'
import { useSession } from '../../lib/session.jsx'
import Welcome from './pages/Welcome.jsx'
import CitizenHome from './pages/CitizenHome.jsx'
import Search from './pages/Search.jsx'
import JourneyResults from './pages/JourneyResults.jsx'
import Explore from './pages/Explore.jsx'
import RouteDetail from './pages/RouteDetail.jsx'
import StopDetail from './pages/StopDetail.jsx'
import TerminalDetail from './pages/TerminalDetail.jsx'
import DeparturePicker from './pages/DeparturePicker.jsx'
import SeatSelect from './pages/SeatSelect.jsx'
import PassengerDetails from './pages/PassengerDetails.jsx'
import ReviewPay from './pages/ReviewPay.jsx'
import Eticket from './pages/Eticket.jsx'
import Tickets from './pages/Tickets.jsx'
import TripTracker from './pages/TripTracker.jsx'
import BuyUrban from './pages/BuyUrban.jsx'
import Wallet from './pages/Wallet.jsx'
import Alerts from './pages/Alerts.jsx'
import Safety from './pages/Safety.jsx'
import Sos from './pages/Sos.jsx'
import ReportIncident from './pages/ReportIncident.jsx'
import MyReports from './pages/MyReports.jsx'
import Notifications from './pages/Notifications.jsx'
import Account from './pages/Account.jsx'
import Chatbot from './pages/Chatbot.jsx'
export default function CitizenApp() {
  const { db } = useDb()
  const { t } = useT()
  const [ses] = useSession('citizen')
  const unread = db.notifications.filter((n) => n.audience === 'citizen' && !n.read).length
  const activeTickets = myTickets(db, ses).filter((t) => ['active', 'booked'].includes(t.status)).length

  // Three tabs only: find a bus, carry the ticket, manage the account.
  // Everything else is reachable from those three.
  const tabs = [
    { to: '/citizen/home', icon: Home, label: t('nav.home'), end: true },
    { to: '/citizen/tickets', icon: Ticket, label: t('nav.tickets'), badge: activeTickets },
    { to: '/citizen/account', icon: UserRound, label: t('nav.account'), badge: unread },
  ]
  if (!ses.signedIn) {
    return (
      <BookingProvider>
        <Routes>
          <Route path="*" element={<Welcome />} />
        </Routes>
      </BookingProvider>
    )
  }
  return (
    <BookingProvider>
      <MobileShell tabs={tabs}>
        <Routes>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<CitizenHome />} />
          <Route path="search" element={<Search />} />
          <Route path="results" element={<JourneyResults />} />
          <Route path="explore" element={<Explore />} />
          <Route path="route/:id" element={<RouteDetail />} />
          <Route path="stop/:id" element={<StopDetail />} />
          <Route path="terminal/:id" element={<TerminalDetail />} />
          <Route path="buy/:routeId" element={<BuyUrban />} />
          <Route path="book/:routeId" element={<DeparturePicker />} />
          <Route path="book/:routeId/seats/:depId" element={<SeatSelect />} />
          <Route path="book/:routeId/passenger/:depId" element={<PassengerDetails />} />
          <Route path="book/:routeId/pay/:depId" element={<ReviewPay />} />
          <Route path="ticket/:id" element={<Eticket />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="track/:id" element={<TripTracker />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="safety" element={<Safety />} />
          <Route path="sos" element={<Sos />} />
          <Route path="report" element={<ReportIncident />} />
          <Route path="reports" element={<MyReports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="account" element={<Account />} />
          <Route path="chat" element={<Chatbot />} />
          <Route path="*" element={<Navigate to="/citizen/home" replace />} />
        </Routes>
      </MobileShell>
    </BookingProvider>
  )
}
