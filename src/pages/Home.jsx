import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { currentEventId, currentTripDay, formatDate, localDate, sortEvents } from '../lib/core.js'

export default function Home() {
  const { data, own, leaderboard, path } = useTrip()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = setInterval(tick, 30000)
    document.addEventListener('visibilitychange', tick) // ny klokke når fanen våkner
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  const { trip, program, teams, members, checkpoints } = data
  const date = currentTripDay(trip.start_date, trip.end_date, now)
  const today = sortEvents(program.filter((event) => event.event_date === date))
  const nowId = date === localDate(now) ? currentEventId(program, now) : null
  const myTeam = teams.find((t) => t.id === own.team_id)
  const rank = leaderboard.findIndex((t) => t.id === myTeam?.id)

  return <div className="page-stack">
    <div className="page-heading"><span className="eyebrow">GODT Å SE DEG, {own.display_name.toUpperCase()}</span><h1>{trip.destination_revealed ? trip.destination : trip.name}<span className="copper-dot">.</span></h1><p>{trip.description}</p></div>
    {trip.announcement && <div className="notice announcement"><span>✳</span> {trip.announcement}</div>}
    <section className="surface"><div className="section-title"><div><span className="eyebrow">I DAG</span><h3>{formatDate(date)}</h3></div><Link to={path('program')} className="text-link">Hele programmet ↗</Link></div>
      {today.length ? <ul className="program-cards">{today.map((event) => {
        const current = event.id === nowId
        return <li className={`program-card${current ? ' now' : ''}`} key={event.id} aria-current={current ? 'true' : undefined}><time>{event.start_time.slice(0, 5)}</time><div><strong>{event.title}</strong>{current && <span className="now-chip">Pågår nå</span>}<p>{event.description}</p></div></li>
      })}</ul> : <p className="muted">Ingen aktiviteter lagt inn denne dagen.</p>}
    </section>
    <section className="hero-card">
      <div className="hero-orbit"/><div className="hero-content"><span className="eyebrow">TURPROGRAM</span><h2>{formatDate(date)}</h2><p>{formatDate(trip.start_date, { day: 'numeric', month: 'long' })} — {formatDate(trip.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}</p><Link className="button gold" to={path('program')}>Se hele programmet <span>↗</span></Link></div><strong className="hero-numeral">{date.slice(-2)}</strong>
    </section>
    <div className="stat-grid">
      <div className="stat-card"><span className="eyebrow">DELTAGERE</span><strong>{members.length}</strong><span>på turen</span></div>
      <div className="stat-card"><span className="eyebrow">LAG</span><strong>{teams.length}</strong><span>klare til kamp</span></div>
      <div className="stat-card"><span className="eyebrow">REBUSPOSTER</span><strong>{checkpoints.length}</strong><span>venter på dere</span></div>
    </div>
    <div className="split-grid">
      <section className="surface team-home"><span className="eyebrow">DITT LAG</span><h3>{myTeam ? `${myTeam.emoji} ${myTeam.name}` : 'Ikke fordelt'}</h3><p>{myTeam ? `${members.filter((m) => m.team_id === myTeam.id).length} medlemmer · ${rank + 1}. plass` : 'Arrangøren kan sette deg på et lag.'}</p><Link to={path('ledertavle')} className="text-link">Ledertavle og poeng ↗</Link></section>
      <section className="surface team-home"><span className="eyebrow">MINNER</span><h3>📸 Bildegalleri</h3><p>Del øyeblikkene fra turen med resten av gjengen.</p><Link to={path('bilder')} className="text-link">Se bildene ↗</Link></section>
    </div>
  </div>
}
