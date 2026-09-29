import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Hub from './portals/hub/Hub.jsx'
import Verify from './portals/hub/Verify.jsx'
import Blueprint from './portals/hub/Blueprint.jsx'
import DepartureBoard from './portals/terminal/DepartureBoard.jsx'
import LicensingMoved from './portals/hub/LicensingMoved.jsx'
import { PORTAL, portalHome } from './lib/portal.js'
const CitizenApp = lazy(() => import('./portals/citizen/CitizenApp.jsx'))
const DriverApp = lazy(() => import('./portals/driver/DriverApp.jsx'))
const OperatorPortal = lazy(() => import('./portals/operator/OperatorPortal.jsx'))
const AuthorityConsole = lazy(() => import('./portals/authority/AuthorityConsole.jsx'))
const PORTALS = {
  citizen: { path: '/citizen/*', element: <CitizenApp /> },
  driver: { path: '/driver/*', element: <DriverApp /> },
  operator: { path: '/operator/*', element: <OperatorPortal /> },
  authority: { path: '/authority/*', element: <AuthorityConsole /> },
}
function Loading() {
  return (
    <div className="h-screen grid place-items-center bg-ink-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center text-[13px] font-bold animate-pulse">
          YG
        </div>
        <p className="text-xs text-ink-400">Loading portal…</p>
      </div>
    </div>
  )
}
export default function App() {
  const only = PORTAL && PORTALS[PORTAL] ? PORTALS[PORTAL] : null
  // The old Licensing deployment now only says where the two sides went.
  if (PORTAL === 'licensing') return <LicensingMoved />

  // A departure-board deployment carries nothing but the board itself.
  if (PORTAL === 'board')
    return (
      <Routes>
        <Route path="/board/:terminalId" element={<DepartureBoard public />} />
        <Route path="/verify/:id" element={<Verify />} />
        <Route path="*" element={<Navigate to={portalHome()} replace />} />
      </Routes>
    )
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* public pages ship with every build */}
        <Route path="/verify/:id" element={<Verify />} />
        <Route path="/blueprint" element={<Blueprint />} />
        <Route path="/board/:terminalId" element={<DepartureBoard public />} />
        {/* the content and terminal back office now lives inside the Authority Console */}
        <Route path="/terminal/*" element={<Navigate to="/authority/terminals" replace />} />
        {/* licensing split in two: the company applies, the authority approves */}
        <Route path="/licensing/queue" element={<Navigate to="/authority/licensing/queue" replace />} />
        <Route path="/licensing/inspections" element={<Navigate to="/authority/licensing/inspections" replace />} />
        <Route path="/licensing/register" element={<Navigate to="/authority/licensing/register" replace />} />
        <Route path="/licensing/fees" element={<Navigate to="/authority/licensing/fees" replace />} />
        <Route path="/licensing/reports" element={<Navigate to="/authority/licensing/reports" replace />} />
        <Route path="/licensing/apply" element={<Navigate to="/operator/licensing/apply" replace />} />
        <Route path="/licensing/tracker" element={<Navigate to="/operator/licensing/tracker" replace />} />
        <Route path="/licensing/vault" element={<Navigate to="/operator/licensing/vault" replace />} />
        <Route path="/licensing/licences" element={<Navigate to="/operator/licences" replace />} />
        <Route path="/licensing/renewals" element={<Navigate to="/operator/licensing/renewals" replace />} />
        <Route path="/licensing/invoices" element={<Navigate to="/operator/licensing/invoices" replace />} />
        <Route path="/licensing/appeals" element={<Navigate to="/operator/licensing/appeals" replace />} />
        <Route path="/licensing/*" element={<Navigate to="/operator/licensing" replace />} />

        {only ? (
          <>
            <Route path="/" element={<Navigate to={portalHome()} replace />} />
            <Route path={only.path} element={only.element} />
            <Route path="*" element={<Navigate to={portalHome()} replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Hub />} />
            {Object.entries(PORTALS).map(([key, p]) => (
              <Route key={key} path={p.path} element={p.element} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Suspense>
  )
}
