import { useTrip } from '../context/TripContext.jsx'

const STATUS = {
  pending: { icon: '⏳', label: 'Venter på godkjenning' },
  approved: { icon: '✓', label: 'Godkjent' },
  rejected: { icon: '↺', label: 'Avvist' },
}

function timeOf(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Team() {
  const { data, own, leaderboard, offline } = useTrip()
  const { teams, members, submissions, checkpoints } = data
  const myTeam = teams.find((team) => team.id === own.team_id)
  const mine = [...(submissions ?? [])].filter((entry) => entry.team_id === own.team_id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  const titleOf = (id) => checkpoints.find((c) => c.id === id)?.title ?? 'Post'
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">LAGET</span><h1>Laget<span className="copper-dot">.</span></h1><p>Dere som er med i samme lag.</p></div>
    <section className="surface"><span className="eyebrow">MITT LAG</span><h3>{myTeam ? `${myTeam.emoji} ${myTeam.name}` : 'Ikke på lag'}</h3><p className="muted">{myTeam ? members.filter((member) => member.team_id === myTeam.id).map((member) => member.display_name).join(' · ') : 'Arrangøren tildeler lag.'}</p>{!offline && <div className="points-summary"><strong>{leaderboard.find((t) => t.id === myTeam?.id)?.points ?? 0}</strong><span>godkjente poeng</span></div>}</section>
    <section className="surface"><span className="eyebrow">INNSENDINGER</span><h3>Lagets innsendinger</h3>{offline ? <p className="muted">Innsendinger vises når du er på nett.</p> : mine.length ? <ul className="submission-list">{mine.map((entry) => <li key={entry.id} className="submission-item"><div><strong>{titleOf(entry.checkpoint_id)}</strong><small>{timeOf(entry.created_at)}</small>{entry.note && <p>{entry.note}</p>}{entry.status === 'rejected' && entry.rejection_reason && <p className="reject-reason">Begrunnelse: {entry.rejection_reason}</p>}</div><span className={`status ${entry.status}`}>{STATUS[entry.status]?.icon} {STATUS[entry.status]?.label ?? entry.status}</span></li>)}</ul> : <p className="muted">Laget har ikke sendt inn noe ennå.</p>}</section>
  </div>
}
