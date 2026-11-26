import { Link, Navigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { formatDate, tripPath } from '../lib/core.js'
import { listPublished } from '../lib/api.js'
import DemoBanner from '../components/DemoBanner.jsx'

// Mine turer i demo-modus: prøveturen (Story 1.4) og turene som er publisert i denne nettleseren (Story 2.7).
const storage = (() => { try { return window.localStorage } catch { return null } })()

export default function MineTurer() {
  const { data, isOrganizer } = useTrip()
  if (!isOrganizer) return <Navigate to="/" replace />
  const published = listPublished(storage).reverse() // nyeste først
  const trips = [...(data.trip ? [data.trip] : []), ...published.map((trip) => ({ ...trip, published: true }))]
  return (
    <>
      <DemoBanner />
      <main className="start">
        <div className="start-panel">
          <span className="eyebrow">ARRANGØR</span>
          <h1>Mine turer</h1>
          <Link className="button gold role-button" to="/ny-tur">Ny tur</Link>
          {trips.length === 0 && <p>Ingen turer ennå.</p>}
          <ul className="trip-list">
            {trips.map((trip) => (
            <li key={trip.slug} className="surface">
              <div>
                <strong>{trip.name}</strong>
                <small>{trip.published ? 'Publisert · ' : ''}{trip.destination ? `${trip.destination} · ` : ''}{formatDate(trip.start_date, { day: 'numeric', month: 'long' })} – {formatDate(trip.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}</small>
              </div>
              <div className="trip-actions">
                <Link className="button gold role-button" to={tripPath(trip.slug)} aria-label={`Åpne ${trip.name}`}>Åpne</Link>
                {trip.published && <Link className="button outline role-button" to={`/del/${trip.slug}`} aria-label={`Del ${trip.name}`}>Del</Link>}
              </div>
            </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}
