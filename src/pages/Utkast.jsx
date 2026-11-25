import { Link, Navigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import { loadDraft } from '../lib/draftStore.js'
import { formatDate } from '../lib/core.js'

const storage = (() => { try { return window.localStorage } catch { return null } })()
const safe = storage ?? { getItem: () => null }

// Story 2.3: skrivebeskyttet visning av det lagrede utkastet. Redigering og publisering kommer senere.
export default function Utkast() {
  const { isOrganizer } = useTrip()
  if (!isOrganizer) return <Navigate to="/" replace />
  const stored = loadDraft(safe)
  const draft = stored?.draft

  if (!draft) {
    return (
      <>
        <DemoBanner />
        <main className="start">
          <div className="start-panel">
            <span className="eyebrow">UTKAST</span>
            <h1>Ingen utkast ennå.</h1>
            <Link className="button gold role-button" to="/ny-tur">Lag en ny tur</Link>
          </div>
        </main>
      </>
    )
  }

  const { trip } = draft
  const items = Array.isArray(draft.program_items) ? draft.program_items : []
  const checkpoints = Array.isArray(draft.checkpoints) ? draft.checkpoints : []
  const teams = Array.isArray(draft.teams) ? draft.teams : []
  const dates = [...new Set(items.map((item) => item.event_date))].sort()
  const period = `${formatDate(trip.start_date, { day: 'numeric', month: 'long' })} – ${formatDate(trip.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <>
      <DemoBanner />
      <main className="start draft-view">
        <div className="start-panel draft-panel">
          <span className="eyebrow">UTKAST</span>
          <h1>{trip.name}</h1>
          <p className="muted">Demo: KI-en er simulert, og destinasjonen er alltid prøveturens.</p>
          <dl className="request-summary surface">
            <dt>Periode</dt><dd>{period}</dd>
            {stored.request?.participant_count > 0 && <><dt>Deltakere</dt><dd>{stored.request.participant_count}</dd></>}
            <dt>Lag</dt><dd>{teams.length}</dd>
            <dt>Poster</dt><dd>{checkpoints.length}</dd>
          </dl>

          <h2>Lag</h2>
          <ul className="draft-list surface">
            {teams.map((team) => <li key={team.id}><span aria-hidden="true">{team.emoji}</span> {team.name}</li>)}
          </ul>

          <h2>Program</h2>
          {dates.map((date) => (
            <section key={date} className="surface draft-day">
              <h3>{formatDate(date)}</h3>
              <ul className="draft-list">
                {items.filter((item) => item.event_date === date).sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item) => (
                  <li key={item.id}><time>{item.start_time}</time> {item.title}</li>
                ))}
              </ul>
            </section>
          ))}

          <h2>Poster</h2>
          <ul className="draft-list surface">
            {checkpoints.map((cp) => <li key={cp.id}>{cp.position}. {cp.title} <span className="points-pill">{cp.points} poeng</span></li>)}
          </ul>
          <Link className="text-link" to="/mine-turer">Til Mine turer</Link>
        </div>
      </main>
    </>
  )
}
