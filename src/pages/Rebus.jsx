import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { LOCKED_HINT, activeCheckpoints, checkpointStatus } from '../lib/core.js'
import PostMap from '../components/PostMap.jsx'
import usePosition from '../hooks/usePosition.js'

export default function Rebus() {
  const { data, own, submit, setError } = useTrip()
  const [selected, setSelected] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submissionError, setSubmissionError] = useState('')
  const [busy, setBusy] = useState(false)
  const { checkpoints, teams, submissions, trip } = data
  const myTeam = teams.find((team) => team.id === own.team_id)
  const posts = activeCheckpoints(checkpoints)
  // Sporing bare når kartet vises og minst én post er geolåst. Posisjonen holdes i minnet og stopper når Kart forlates.
  const { position, status: positionStatus, retry } = usePosition({ enabled: Boolean(trip.destination_revealed) && posts.some((post) => post.requires_location === true) })
  const [params, setParams] = useSearchParams()
  const activeId = posts.some((post) => post.id === params.get('post')) ? params.get('post') : null
  const selectPost = (id) => {
    if (id === activeId) return
    setParams((previous) => { const next = new URLSearchParams(previous); if (id) next.set('post', id); else next.delete('post'); return next }, { replace: true })
  }

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

  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">KONKURRANSEN</span><h1>Kart<span className="copper-dot">.</span></h1><p>Finn postene, løs oppgavene og samle poeng.</p></div>
    {trip.destination_revealed && posts.length > 0 && <section className="surface map-section"><div className="section-title"><div><span className="eyebrow">UTFORSK</span><h3>Postene på kartet</h3></div></div>{positionStatus === 'denied' || positionStatus === 'unavailable' ? <div className="notice position-notice" role="status"><span>{positionStatus === 'denied' ? 'Vi får ikke tilgang til posisjonen din. Tillat posisjon for dette nettstedet i nettleserinnstillingene og prøv igjen. Geolåste poster forblir låst, mens åpne poster virker som vanlig.' : 'Vi finner ikke posisjonen din akkurat nå. Geolåste poster forblir låst, mens åpne poster virker som vanlig.'}</span><button type="button" className="button small outline" onClick={retry}>Prøv igjen</button></div> : positionStatus === 'waiting' ? <p className="micro" role="status">Venter på posisjon …</p> : null}<PostMap checkpoints={checkpoints} submissions={submissions} teamId={myTeam?.id} position={position} positionStatus={positionStatus} selectedId={activeId} onSelect={selectPost} onSolve={setSelected} /></section>}
    <section><div className="section-title"><div><span className="eyebrow">UTFORDRINGENE</span><h3>Alle rebusposter</h3></div><span className="pill">{posts.length} poster</span></div>
      <div className="checkpoint-grid">{posts.map((checkpoint, index) => {
        const st = checkpointStatus(checkpoint, submissions, myTeam?.id, position)
        const entry = st.submission === 'pending' || st.submission === 'approved' ? st.latest : null
        return <article className="checkpoint-card" key={checkpoint.id}><div className="checkpoint-top"><span className="checkpoint-number">POST {String(index + 1).padStart(2, '0')}</span><span className="points-pill">+{checkpoint.points} P</span></div><h3>{checkpoint.title}</h3><p>{st.canSeeTask ? checkpoint.description : st.hint ?? LOCKED_HINT}</p>{entry?.url && <img className="checkpoint-proof" src={entry.url} alt="Lagets innsendte bildebevis" loading="lazy"/>}<div className="checkpoint-bottom"><span className={`status ${st.submission}`}>{st.icon} {st.label}</span><button className="button small outline" disabled={!st.canSubmit} onClick={() => setSelected(checkpoint)}>{{ solve: 'Send bilde →', locked: 'Låst', sent: 'Sendt inn', noteam: 'Ikke på lag' }[st.action]}</button></div></article>
      })}</div>
      {!posts.length && <div className="empty-state">Ingen poster lagt inn ennå.</div>}
    </section>
    {selected && <div className="modal-backdrop" onClick={closeSubmission}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" aria-label="Lukk" disabled={busy} onClick={closeSubmission}>×</button><span className="eyebrow">{selected.points} POENG</span><h2 id="task-title">{selected.title}</h2><p className="muted">{selected.description}</p><form onSubmit={send} className="form-stack"><p className="photo-instruction">Ta et bilde av at laget har fullført oppgaven. Bildet sendes til arrangøren for godkjenning.</p>{preview && <img className="submission-preview" src={preview} alt="Forhåndsvisning av bildebeviset"/>}<div className="photo-picker"><label className="button outline"><input type="file" accept="image/*" capture="environment" disabled={busy} onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); setSubmissionError(''); e.target.value = '' }}/>📷 Ta bilde</label><label className="button outline"><input type="file" accept="image/*" disabled={busy} onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); setSubmissionError(''); e.target.value = '' }}/>▧ Velg bilde</label></div>{photo && <p className="photo-filename">✓ {photo.name}</p>}{submissionError && <div className="notice danger" role="alert">{submissionError}</div>}<p className="micro">Maks 8 MB. Arrangøren må godkjenne bildet før laget får poeng.</p><button className="button primary full" disabled={busy || !photo}>{busy ? 'Laster opp bilde …' : 'Send bilde til godkjenning →'}</button></form></div></div>}
  </div>
}
