import { Navigate, useParams } from 'react-router-dom'

/** Old quick-buy entry point — every purchase now goes through the departure list. */
export default function BuyUrban() {
  const { routeId } = useParams()
  return <Navigate to={`/citizen/book/${routeId}`} replace />
}
