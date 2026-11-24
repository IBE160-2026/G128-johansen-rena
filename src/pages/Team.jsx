import { useTrip } from '../context/TripContext.jsx'

export default function Team() {
  const { data, own, leaderboard, offline } = useTrip()
  const { teams, members } = data
  const myTeam = teams.find((team) => team.id === own.team_id)
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">LAGET</span><h1>Laget<span className="copper-dot">.</span></h1><p>Dere som er med i samme lag.</p></div>
    <section className="surface"><span className="eyebrow">MITT LAG</span><h3>{myTeam ? `${myTeam.emoji} ${myTeam.name}` : 'Ikke på lag'}</h3><p className="muted">{myTeam ? members.filter((member) => member.team_id === myTeam.id).map((member) => member.display_name).join(' · ') : 'Arrangøren tildeler lag.'}</p>{!offline && <div className="points-summary"><strong>{leaderboard.find((t) => t.id === myTeam?.id)?.points ?? 0}</strong><span>godkjente poeng</span></div>}</section>
  </div>
}
