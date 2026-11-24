import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { useTrip } from '../context/TripContext.jsx'

export default function Rebus() {
  const { data, own, leaderboard, submit, setError } = useTrip()
  const [selected, setSelected] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submissionError, setSubmissionError] = useState('')
  const [busy, setBusy] = useState(false)
  const { checkpoints, teams, members, submissions, trip } = data
  const myTeam = teams.find((team) => team.id === own.team_id)
  const center = checkpoints.length ? [checkpoints[0].latitude, checkpoints[0].longitude] : [59.9139, 10.7522]

  useEffect(() => {
    if (!photo) { setPreview(null); return undefined }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  function closeSubmission() {
    if (busy) return
    setSelected(null)
    setPhoto(null)
    setSubmissionError('')
  }

  if (!trip.destination_revealed) return <div className="page-stack"><div className="page-heading"><span className="eyebrow">KONKURRANSEN</span><h1>Rebus<span className="copper-dot">.</span></h1><p>Oppgavene blir tilgjengelige når arrangøren avslører destinasjonen.</p></div><div className="empty-state tall"><span>🔒</span><h3>Rebusen er ikke åpnet</h3><p>Følg med på startsiden for oppdateringer.</p></div></div>

  async function send(e) {
    e.preventDefault()
    if (!photo) { setSubmissionError('Velg eller ta et bilde før du sender inn.'); return }
    setBusy(true)
    setSubmissionError('')
    try { await submit(selected.id, photo); setSelected(null); setPhoto(null); setError('') }
    catch (err) { setSubmissionError(err.message) }
    finally { setBusy(false) }
  }

  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">KONKURRANSEN</span><h1>Rebus<span className="copper-dot">.</span></h1><p>Finn postene, løs oppgavene og samle poeng.</p></div>
    <div className="split-grid">
      <section className="surface"><div className="section-title"><div><span className="eyebrow">LEDETAVLE</span><h3>Stillingen</h3></div><span className="pill">Oppdateres live</span></div>
        <div className="leaderboard">{leaderboard.map((team, index) => <div className={`leader-row ${team.id === own.team_id ? 'my-team' : ''}`} key={team.id}><span className="leader-rank">{index === 0 ? '🥇' : `${index + 1}.`}</span><span><strong>{team.emoji} {team.name}</strong><small>{members.filter((m) => m.team_id === team.id).length} medlemmer · {team.completed} godkjente</small></span><b>{team.points} <small>poeng</small></b></div>)}</div>
      </section>
      <section className="surface"><span className="eyebrow">MITT LAG</span><h3>{myTeam ? `${myTeam.emoji} ${myTeam.name}` : 'Ikke på lag'}</h3><p className="muted">{myTeam ? members.filter((member) => member.team_id === myTeam.id).map((member) => member.display_name).join(' · ') : 'Arrangøren tildeler lag.'}</p><div className="points-summary"><strong>{leaderboard.find((t) => t.id === myTeam?.id)?.points ?? 0}</strong><span>godkjente poeng</span></div></section>
    </div>
    {trip.destination_revealed && checkpoints.length > 0 && <section className="surface map-section"><div className="section-title"><div><span className="eyebrow">UTFORSK</span><h3>Postene på kartet</h3></div></div><MapContainer center={center} zoom={12} scrollWheelZoom={false} className="map" aria-label="Kart over rebusposter"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{checkpoints.map((checkpoint) => <CircleMarker key={checkpoint.id} center={[checkpoint.latitude, checkpoint.longitude]} radius={8} pathOptions={{ color: '#fff', fillColor: '#b8732a', fillOpacity: 1, weight: 2 }}><Popup><strong>{checkpoint.title}</strong><br/>{checkpoint.points} poeng</Popup></CircleMarker>)}</MapContainer></section>}
    <section><div className="section-title"><div><span className="eyebrow">UTFORDRINGENE</span><h3>Alle rebusposter</h3></div><span className="pill">{checkpoints.length} poster</span></div>
      <div className="checkpoint-grid">{checkpoints.map((checkpoint, index) => {
        const entry = submissions.find((s) => s.checkpoint_id === checkpoint.id && s.team_id === myTeam?.id && s.status !== 'rejected')
        const rejected = submissions.some((s) => s.checkpoint_id === checkpoint.id && s.team_id === myTeam?.id && s.status === 'rejected')
        return <article className="checkpoint-card" key={checkpoint.id}><div className="checkpoint-top"><span className="checkpoint-number">POST {String(index + 1).padStart(2, '0')}</span><span className="points-pill">+{checkpoint.points} P</span></div><h3>{checkpoint.title}</h3><p>{checkpoint.description}</p>{entry?.url && <img className="checkpoint-proof" src={entry.url} alt="Lagets innsendte bildebevis" loading="lazy"/>}<div className="checkpoint-bottom"><span className={`status ${entry?.status ?? ''}`}>{entry ? entry.status === 'approved' ? '✓ Godkjent' : '⏳ Venter på godkjenning' : rejected ? '↺ Avvist – prøv igjen' : 'Ikke levert'}</span><button className="button small outline" disabled={!myTeam || Boolean(entry)} onClick={() => setSelected(checkpoint)}>{entry ? 'Sendt inn' : 'Send bilde →'}</button></div></article>
      })}</div>
      {!checkpoints.length && <div className="empty-state">Ingen poster lagt inn ennå.</div>}
    </section>
    {selected && <div className="modal-backdrop" onClick={closeSubmission}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" aria-label="Lukk" disabled={busy} onClick={closeSubmission}>×</button><span className="eyebrow">{selected.points} POENG</span><h2 id="task-title">{selected.title}</h2><p className="muted">{selected.description}</p><form onSubmit={send} className="form-stack"><p className="photo-instruction">Ta et bilde av at laget har fullført oppgaven. Bildet sendes til arrangøren for godkjenning.</p>{preview && <img className="submission-preview" src={preview} alt="Forhåndsvisning av bildebeviset"/>}<div className="photo-picker"><label className="button outline"><input type="file" accept="image/*" capture="environment" disabled={busy} onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); setSubmissionError(''); e.target.value = '' }}/>📷 Ta bilde</label><label className="button outline"><input type="file" accept="image/*" disabled={busy} onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); setSubmissionError(''); e.target.value = '' }}/>▧ Velg bilde</label></div>{photo && <p className="photo-filename">✓ {photo.name}</p>}{submissionError && <div className="notice danger" role="alert">{submissionError}</div>}<p className="micro">Maks 8 MB. Arrangøren må godkjenne bildet før laget får poeng.</p><button className="button primary full" disabled={busy || !photo}>{busy ? 'Laster opp bilde …' : 'Send bilde til godkjenning →'}</button></form></div></div>}
  </div>
}
