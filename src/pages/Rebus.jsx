import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { LOCKED_HINT, activeCheckpoints, checkpointStatus, validateImage, visibleCheckpoints } from '../lib/core.js'
import { NOTE_MAX, SENT_MESSAGE, canSendSubmission, submissionErrorMessage, validateNote } from '../lib/submission.js'
import ChangedChip from '../components/ChangedChip.jsx'
import PostMap from '../components/PostMap.jsx'
import usePosition from '../hooks/usePosition.js'
import PositionSimulator from '../components/PositionSimulator.jsx'
import { normalizePosition, resolvePosition, shouldTrackReal } from '../lib/geo.js'

export default function Rebus() {
  const { data, own, submit, setError, demoMode, changes } = useTrip()
  const [openedChanged, setOpenedChanged] = useState(null) // posten som var endret da den ble åpnet: merket står på kortet mens den er valgt
  const [simulated, setSimulated] = useState(null) // demo: bare i minnet, glemt når Kart forlates
  const [selected, setSelected] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const [preview, setPreview] = useState(null)
  const [submissionError, setSubmissionError] = useState('')
  const [busy, setBusy] = useState(false)
  const { checkpoints, teams, submissions, trip } = data
  const myTeam = teams.find((team) => team.id === own.team_id)
  const posts = activeCheckpoints(checkpoints) // sporing og simulator bruker bare aktive poster
  const shown = visibleCheckpoints(checkpoints)
  // Sporing bare når kartet vises og minst én post er geolåst. Posisjonen holdes i minnet og stopper når Kart forlates.
  const real = usePosition({ enabled: shouldTrackReal({ demoMode, revealed: trip.destination_revealed, posts }) })
  // I demo-modus er simulatoren posisjonskilden, og nettleserens geolokasjon brukes ikke
  const position = resolvePosition({ demoMode, simulated, real: real.position })
  const positionStatus = demoMode ? 'idle' : real.status
  const retry = real.retry
  const [params, setParams] = useSearchParams()
  const activeId = shown.some((post) => post.id === params.get('post')) ? params.get('post') : null
  const selectPost = (id) => {
    if (id === activeId) return
    setParams((previous) => { const next = new URLSearchParams(previous); if (id) next.set('post', id); else next.delete('post'); return next }, { replace: true })
  }

  const activePost = shown.find((post) => post.id === activeId)
  const activeUpdated = activePost?.updated_at
  useEffect(() => {
    if (!activePost) { setOpenedChanged(null); return }
    if (changes.isChanged(activePost)) { setOpenedChanged(activePost.id); changes.markSeen(activePost) } // å velge posten er å åpne den
    else setOpenedChanged((previous) => previous === activePost.id ? previous : null)
  }, [activeId, activeUpdated]) // eslint-disable-line react-hooks/exhaustive-deps
  const postChanged = (post) => changes.isChanged(post) || post.id === openedChanged

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
    setNote('')
    setSent(false)
    setSubmissionError('')
  }

  function pickPhoto(file) {
    setSubmissionError('')
    if (!file) return
    try { validateImage(file); setPhoto(file) } catch (err) { setPhoto(null); setSubmissionError(err.message) }
  }

  if (!trip.destination_revealed) return <div className="page-stack"><div className="page-heading"><span className="eyebrow">KONKURRANSEN</span><h1>Rebus<span className="copper-dot">.</span></h1><p>Oppgavene blir tilgjengelige når arrangøren avslører destinasjonen.</p></div><div className="empty-state tall"><span>🔒</span><h3>Rebusen er ikke åpnet</h3><p>Følg med på startsiden for oppdateringer.</p></div></div>

  async function send(e) {
    e.preventDefault()
    if (busy || !canSendSubmission({ photo, note, busy })) return // også mot dobbelt trykk
    setBusy(true)
    setSubmissionError('')
    try {
      await submit(selected.id, photo, note)
      setSent(true) // kvitteringen vises først når sendingen er bekreftet
      setError('')
    } catch (err) {
      setSubmissionError(submissionErrorMessage(err, typeof navigator === 'undefined' ? true : navigator.onLine)) // bilde og notat blir stående
    } finally { setBusy(false) }
  }

  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">KONKURRANSEN</span><h1>Kart<span className="copper-dot">.</span></h1><p>Finn postene, løs oppgavene og samle poeng.</p></div>
    {trip.destination_revealed && shown.length > 0 && <section className="surface map-section"><div className="section-title"><div><span className="eyebrow">UTFORSK</span><h3>Postene på kartet</h3></div></div>{positionStatus === 'denied' || positionStatus === 'unavailable' ? <div className="notice position-notice" role="status"><span>{positionStatus === 'denied' ? 'Vi får ikke tilgang til posisjonen din. Tillat posisjon for dette nettstedet i nettleserinnstillingene og prøv igjen. Geolåste poster forblir låst, mens åpne poster virker som vanlig.' : 'Vi finner ikke posisjonen din akkurat nå. Geolåste poster forblir låst, mens åpne poster virker som vanlig.'}</span><button type="button" className="button small outline" onClick={retry}>Prøv igjen</button></div> : positionStatus === 'waiting' ? <p className="micro" role="status">Venter på posisjon …</p> : null}{demoMode && <PositionSimulator posts={posts} simulated={simulated} onSet={setSimulated} onClear={() => setSimulated(null)} />}<PostMap onMapClick={demoMode ? (point) => { const next = normalizePosition(point); if (next) setSimulated(next) } : undefined} checkpoints={checkpoints} submissions={submissions} teamId={myTeam?.id} position={position} positionStatus={positionStatus} selectedId={activeId} onSelect={selectPost} onSolve={setSelected} isChanged={postChanged} /></section>}
    <section><div className="section-title"><div><span className="eyebrow">UTFORDRINGENE</span><h3>Alle rebusposter</h3></div><span className="pill">{shown.length} poster</span></div>
      <div className="checkpoint-grid">{shown.map((checkpoint, index) => {
        const st = checkpointStatus(checkpoint, submissions, myTeam?.id, position)
        const entry = st.submission === 'pending' || st.submission === 'approved' ? st.latest : null
        return <article className={`checkpoint-card${st.deactivated ? ' deactivated' : ''}`} key={checkpoint.id}><div className="checkpoint-top"><span className="checkpoint-number">POST {String(index + 1).padStart(2, '0')}</span><span className="points-pill">+{checkpoint.points} P</span></div><h3>{checkpoint.title}{postChanged(checkpoint) && <> <ChangedChip /></>}</h3><p>{st.canSeeTask ? checkpoint.description : st.hint ?? LOCKED_HINT}</p>{entry?.url && <img className="checkpoint-proof" src={entry.url} alt="Lagets innsendte bildebevis" loading="lazy"/>}<div className="checkpoint-bottom"><span className={`status ${st.submission}`}>{st.icon} {st.label}</span>{st.chip && <span className="status deactivated">⊘ Deaktivert</span>}{st.reason && <small className="reject-reason">Begrunnelse: {st.reason}</small>}<button className="button small outline" disabled={!st.canSubmit} onClick={() => setSelected(checkpoint)}>{{ solve: 'Send bilde →', locked: 'Låst', sent: 'Sendt inn', noteam: 'Ikke på lag', deactivated: 'Deaktivert' }[st.action]}</button></div></article>
      })}</div>
      {!shown.length && <div className="empty-state">Ingen poster lagt inn ennå.</div>}
    </section>
    {selected && <div className="modal-backdrop" onClick={closeSubmission}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" aria-label="Lukk" disabled={busy} onClick={closeSubmission}>×</button><span className="eyebrow">{selected.points} POENG</span><h2 id="task-title">{selected.title}</h2><p className="muted">{selected.description}</p>
      {sent ? <div className="form-stack"><div className="notice success" role="status">✓ {SENT_MESSAGE}</div><span className="status pending">⏳ Venter på godkjenning</span><button type="button" className="button primary full" onClick={closeSubmission}>Lukk</button></div> : <form onSubmit={send} className="form-stack"><p className="photo-instruction">Ta et bilde av at laget har fullført oppgaven, og skriv et kort notat. Arrangøren må godkjenne før laget får poeng.</p>{preview && <img className="submission-preview" src={preview} alt="Forhåndsvisning av bildebeviset"/>}<div className="photo-picker"><label className="button outline"><input type="file" accept="image/*" capture="environment" disabled={busy} onChange={(e) => { pickPhoto(e.target.files?.[0] ?? null); e.target.value = '' }}/>📷 Ta bilde</label><label className="button outline"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { pickPhoto(e.target.files?.[0] ?? null); e.target.value = '' }}/>▧ Velg bilde</label></div>{photo && <p className="photo-filename">✓ {photo.name}</p>}
        <label htmlFor="submission-note">Notat</label><textarea id="submission-note" rows={3} maxLength={NOTE_MAX} value={note} disabled={busy} placeholder="Hva gjorde dere?" aria-describedby="submission-note-hint" onChange={(e) => { setNote(e.target.value); setSubmissionError('') }}/><p id="submission-note-hint" className="micro">{note.trim() && validateNote(note) ? validateNote(note) : `${note.trim().length}/${NOTE_MAX} tegn`}</p>
        {submissionError && <div className="notice danger" role="alert">{submissionError}</div>}<p className="micro">JPG, PNG eller WebP, maks 15 MB. Bildet komprimeres før det sendes.</p><button className="button primary full" disabled={!canSendSubmission({ photo, note, busy })}>{busy ? <><span className="btn-spinner" aria-hidden="true"/> Sender …</> : 'Send til godkjenning →'}</button></form>}</div></div>}
  </div>
}
