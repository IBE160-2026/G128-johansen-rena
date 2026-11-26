import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ChangedChip from '../components/ChangedChip.jsx'
import PostList from '../components/PostList.jsx'
import { useTrip } from '../context/TripContext.jsx'
import { activeCheckpoints, countText, currentEventId, currentTripDay, formatDate, localDate, sortEvents } from '../lib/core.js'

export default function Home() {
  const { data, own, leaderboard, path, isOrganizer, changes } = useTrip()
  const [params] = useSearchParams()
  const showChanges = !isOrganizer && params.get('endret') === '1'
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = setInterval(tick, 30000)
    document.addEventListener('visibilitychange', tick) // ny klokke når fanen våkner
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  const { trip, program, teams, members, checkpoints, submissions } = data
  const date = currentTripDay(trip.start_date, trip.end_date, now)
  const today = sortEvents(program.filter((event) => event.event_date === date))
  const pendingCount = (data.submissions ?? []).filter((s) => s.status === 'pending').length
  const nowId = date === localDate(now) ? currentEventId(program, now) : null
  const myTeam = teams.find((t) => t.id === own.team_id)
  const rank = leaderboard.findIndex((t) => t.id === myTeam?.id)

  return <div className="page-stack">
    <div className="page-heading"><span className="eyebrow">GODT Å SE DEG, {own.display_name.toUpperCase()}</span><h1>{trip.destination_revealed ? trip.destination : trip.name}<span className="copper-dot">.</span></h1><p>{trip.description}</p></div>
    {isOrganizer && pendingCount > 0 && <div className="notice" role="status"><span>⏳</span> {pendingCount} venter på godkjenning <Link to={`${path('admin')}?fane=inbox`} className="text-link">Åpne køen ↗</Link></div>}
    {trip.announcement && <div className="notice announcement"><span>✳</span> {trip.announcement}</div>}
    {showChanges && <section className="surface changes-section" aria-labelledby="changes-title"><div className="section-title"><div><span className="eyebrow">ENDRINGER</span><h3 id="changes-title">Endret siden sist</h3></div>{changes.count > 0 && <button type="button" className="button small outline" onClick={changes.markAllSeen}>Merk alle som sett</button>}</div>
      {changes.count ? <ul className="program-cards">{changes.items.map((item) => item.kind === 'program'
        ? <li className="program-card changed" key={item.id} role="button" tabIndex={0} onClick={() => changes.markSeen(item)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); changes.markSeen(item) } }}><time>{item.start_time?.slice(0, 5)}</time><div><strong>{item.title}</strong><ChangedChip /><p>{formatDate(item.event_date)}{item.description ? ` · ${item.description}` : ''}</p></div></li>
        : <li className="program-card changed" key={item.id}><time>Post</time><div><strong><Link to={`${path('kart')}?post=${encodeURIComponent(item.id)}`} className="text-link">{item.title}</Link></strong><ChangedChip /></div></li>)}</ul> : <p className="muted">Ingen nye endringer.</p>}
    </section>}
    <section className="surface"><div className="section-title"><div><span className="eyebrow">I DAG</span><h3>{formatDate(date)}</h3></div><Link to={path('program')} className="text-link">Hele programmet ↗</Link></div>
      {today.length ? <ul className="program-cards">{today.map((event) => {
        const current = event.id === nowId
        const changed = changes.isChanged(event)
        const open = () => changes.markSeen(event)
        return <li className={`program-card${current ? ' now' : ''}${changed ? ' changed' : ''}`} key={event.id} aria-current={current ? 'true' : undefined} onClick={changed ? open : undefined} onKeyDown={changed ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } } : undefined} tabIndex={changed ? 0 : undefined} role={changed ? 'button' : undefined}><time>{event.start_time.slice(0, 5)}</time><div><strong>{event.title}</strong>{changed && <ChangedChip />}{current && <span className="now-chip">Pågår nå</span>}<p>{event.description}</p></div></li>
      })}</ul> : <p className="muted">Ingen aktiviteter lagt inn denne dagen.</p>}
    </section>
    <section className="hero-card">
      <div className="hero-orbit"/><div className="hero-content"><span className="eyebrow">TURPROGRAM</span><h2>{formatDate(date)}</h2><p>{formatDate(trip.start_date, { day: 'numeric', month: 'long' })} — {formatDate(trip.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}</p><Link className="button gold" to={path('program')}>Se hele programmet <span>↗</span></Link></div><strong className="hero-numeral">{date.slice(-2)}</strong>
    </section>
    <div className="stat-grid">
      <div className="stat-card"><span className="eyebrow">DELTAKERE</span><strong>{members.length}</strong><span>på turen</span></div>
      <div className="stat-card"><span className="eyebrow">LAG</span><strong>{teams.length}</strong><span>klare til kamp</span></div>
      <div className="stat-card"><span className="eyebrow">REBUSPOSTER</span><strong>{activeCheckpoints(checkpoints).length}</strong><span>venter på dere</span></div>
    </div>
    {trip.destination_revealed && <section className="surface"><div className="section-title"><div><span className="eyebrow">POSTER</span><h3>Rebusposter</h3></div><Link to={path('kart')} className="text-link">Se kartet ↗</Link></div><PostList checkpoints={checkpoints} submissions={submissions} teamId={own.team_id} path={path} isChanged={changes.isChanged} /></section>}
    <div className="split-grid">
      <section className="surface team-home"><span className="eyebrow">DITT LAG</span><h3>{myTeam ? `${myTeam.emoji} ${myTeam.name}` : 'Ikke fordelt'}</h3><p>{myTeam ? `${countText(members.filter((m) => m.team_id === myTeam.id).length, 'medlem', 'medlemmer')} · ${rank + 1}. plass` : 'Arrangøren kan sette deg på et lag.'}</p><Link to={path('ledertavle')} className="text-link">Ledertavle og poeng ↗</Link></section>
      <section className="surface team-home"><span className="eyebrow">MINNER</span><h3>📸 Bildegalleri</h3><p>Del øyeblikkene fra turen med resten av gjengen.</p><Link to={path('bilder')} className="text-link">Se bildene ↗</Link></section>
    </div>
  </div>
}
