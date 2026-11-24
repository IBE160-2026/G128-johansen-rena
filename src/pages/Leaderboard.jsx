import { useTrip } from '../context/TripContext.jsx'

export default function Leaderboard() {
  const { data, own, leaderboard, offline } = useTrip()
  const { members } = data
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">KONKURRANSEN</span><h1>Ledertavle<span className="copper-dot">.</span></h1><p>Slik ligger lagene an.</p></div>
    <section className="surface"><div className="section-title"><div><span className="eyebrow">LEDERTAVLE</span><h3>Stillingen</h3></div><span className="pill">Oppdateres live</span></div>
      {offline ? <p className="muted">Stillingen vises ikke uten nett.</p> : !leaderboard.length ? <p className="muted">Ingen lag ennå.</p> : <div className="leaderboard" aria-live="polite">{leaderboard.map((team, index) => <div className={`leader-row ${team.id === own.team_id ? 'my-team' : ''}`} key={team.id}><span className="leader-rank">{index === 0 ? '🥇' : `${index + 1}.`}</span><span><strong>{team.emoji} {team.name}</strong><small>{members.filter((m) => m.team_id === team.id).length} medlemmer · {team.completed} godkjente</small></span><b>{team.points} <small>poeng</small></b></div>)}</div>}
    </section>
  </div>
}
