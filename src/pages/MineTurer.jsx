import { Link, Navigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { formatDate } from '../lib/core.js'
import DemoBanner from '../components/DemoBanner.jsx'

// Enkel Mine turer for demo-modus (Story 1.4). Ekte turliste og «Ny tur» kommer i Epic 2.
export default function MineTurer() {
  const { data, isOrganizer, path } = useTrip()
  if (!isOrganizer) return <Navigate to="/" replace />
  const trip = data.trip
  return (
    <>
      <DemoBanner />
      <main className="start">
        <div className="start-panel">
          <span className="eyebrow">ARRANGØR</span>
          <h1>Mine turer</h1>
          <ul className="trip-list">
            <li className="surface">
              <div>
                <strong>{trip.name}</strong>
                <small>{trip.destination} · {formatDate(trip.start_date, { day: 'numeric', month: 'long' })} – {formatDate(trip.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}</small>
              </div>
              <Link className="button gold role-button" to={path()}>Åpne</Link>
            </li>
          </ul>
        </div>
      </main>
    </>
  )
}
