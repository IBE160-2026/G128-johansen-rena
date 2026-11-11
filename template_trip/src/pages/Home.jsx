import { Link } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { currentTripDay, formatDate, sortEvents } from '../lib/core.js'

export default function Home() {
  const { data, own, leaderboard } = useTrip()
  const { trip, program, teams, members, checkpoints } = data
  const date = currentTripDay(trip.start_date, trip.end_date)
  const today = sortEvents(program.filter((event) => event.event_date === date))
  const myTeam = teams.find((t) => t.id === own.team_id)
  const rank = leaderboard.findIndex((t) => t.id === myTeam?.id)

  return <div className="page-stack">
    <div className="page-heading"><span className="eyebrow">GODT Å SE DEG, {own.display_name.toUpperCase()}</span><h1>{trip.destination_revealed ? trip.destination : trip.name}<span className="copper-dot">.</span></h1><p>{trip.description}</p></div>
    {trip.announcement && <div className="notice announcement"><span>✳</span> {trip.announcement}</div>}
    <section className="hero-card">
      <div className="hero-orbit"/><div className="hero-content"><span className="eyebrow">TURPROGRAM</span><h2>{formatDate(date)}</h2><p>{formatDate(trip.start_date, { day: 'numeric', month: 'long' })} — {formatDate(trip.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}</p><Link className="button gold" to="/program">Se hele programmet <span>↗</span></Link></div><strong className="hero-numeral">{date.slice(-2)}</strong>
    </section>
    <div className="stat-grid">
      <div className="stat-card"><span className="eyebrow">DELTAGERE</span><strong>{members.length}</strong><span>på turen</span></div>
      <div className="stat-card"><span className="eyebrow">LAG</span><strong>{teams.length}</strong><span>klare til kamp</span></div>
      <div className="stat-card"><span className="eyebrow">REBUSPOSTER</span><strong>{checkpoints.length}</strong><span>venter på dere</span></div>
    </div>
    <section className="surface"><div className="section-title"><div><span className="eyebrow">DAGENS PLAN</span><h3>{formatDate(date)}</h3></div><Link to="/program" className="text-link">Hele programmet ↗</Link></div>
      {today.length ? <div className="timeline">{today.slice(0, 5).map((event) => <div className="timeline-item" key={event.id}><time>{event.start_time.slice(0, 5)}</time><div><strong>{event.title}</strong><p>{event.description}</p></div></div>)}</div> : <p className="muted">Ingen aktiviteter lagt inn denne dagen.</p>}
    </section>
    <div className="split-grid">
      <section className="surface team-home"><span className="eyebrow">DITT LAG</span><h3>{myTeam ? `${myTeam.emoji} ${myTeam.name}` : 'Ikke fordelt'}</h3><p>{myTeam ? `${members.filter((m) => m.team_id === myTeam.id).length} medlemmer · ${rank + 1}. plass` : 'Arrangøren kan sette deg på et lag.'}</p><Link to="/rebus" className="text-link">Rebus og poeng ↗</Link></section>
      <section className="surface team-home"><span className="eyebrow">MINNER</span><h3>📸 Bildegalleri</h3><p>Del øyeblikkene fra turen med resten av gjengen.</p><Link to="/bilder" className="text-link">Se bildene ↗</Link></section>
    </div>
  </div>
}
