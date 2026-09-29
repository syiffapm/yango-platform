import { useMemo } from 'react'
import { useDb } from '../../lib/store.jsx'
import { useSession } from '../../lib/session.jsx'
import { daysUntil } from '../../lib/format.js'

/** Everything a driver screen needs: the signed-in driver, their bus, their shift and today's trips. */
export default function useDriver() {
  const { db, update, audit, notify } = useDb()
  const [ses, setSes] = useSession('driver')

  return useMemo(() => {
    const driver = db.drivers.find((d) => d.id === ses.driverId) || db.drivers[0]
    const vehicle = db.vehicles.find((v) => v.id === driver?.vehicle)
    const trips = db.trips.filter((t) => t.driver === driver?.id)
    const operator = (db.operators || []).find((o) => o.id === driver?.operator)

    const blockers = []
    if (!driver) blockers.push('No driver record')
    else {
      if (daysUntil(driver.licenceExpiry) < 0) blockers.push('Operating licence expired')
      if (daysUntil(driver.medicalExpiry) < 0) blockers.push('Medical certificate expired')
      if (driver.status === 'blocked') blockers.push('Driver licence suspended by the authority')
      if (driver.status === 'pending') blockers.push('Registration not yet approved')
    }
    if (vehicle?.status === 'blocked') blockers.push(`Vehicle ${vehicle.plate} is blocked by a critical defect`)
    if (vehicle?.status === 'maintenance') blockers.push(`Vehicle ${vehicle.plate} is in maintenance`)

    return { db, update, audit, notify, ses, setSes, driver, vehicle, operator, trips, blockers, onShift: !!ses.shift }
  }, [db, update, audit, notify, ses, setSes])
}
