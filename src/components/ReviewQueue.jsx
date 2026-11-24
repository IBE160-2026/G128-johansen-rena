import { useEffect, useRef, useState } from 'react'
import { EMPTY_QUEUE_MESSAGE, REASON_MAX, createDecisionQueue } from '../lib/review.js'

const timeOf = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/**
 * Godkjenningskøen (Story 3.5, UX-DR8). Godkjenn og Avvis sendes først etter 5 sekunder, og Angre innen da sender ingenting.
 * Forlater arrangøren siden mens en beslutning venter, sendes den med en gang.
 */
export default function ReviewQueue({ pending, checkpoints, teams, review, onError, onFocus }) {
  const [, rerender] = useState(0)
  const [reasons, setReasons] = useState({})
  const [errors, setErrors] = useState({})
  const [now, setNow] = useState(() => Date.now())
  const latest = useRef({ review, onError })
  latest.current = { review, onError }
  const queueRef = useRef(null)
  if (!queueRef.current) {
    queueRef.current = createDecisionQueue({
      onCommit: async (id, decision, reason) => {
        setErrors((e) => { const { [id]: _removed, ...rest } = e; return rest })
        setReasons((r) => { const { [id]: _removed, ...rest } = r; return rest })
        await latest.current.review(id, decision, reason) // feil går til onError og vises på kortet
      },
      onChange: () => rerender((n) => n + 1),
      onError: (id, error) => setErrors((e) => ({ ...e, [id]: error?.message || 'Beslutningen kunne ikke sendes.' })),
    })
  }
  const queue = queueRef.current

  const waiting = queue.size > 0
  useEffect(() => {
    if (!waiting) return undefined
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [waiting])
  useEffect(() => () => queue.flush(), [queue]) // siden forlates: send ventende beslutninger nå
  useEffect(() => {
    const onHide = () => queue.flush() // lukket fane eller sidebytte: forsøk å sende (best effort)
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [queue])
  useEffect(() => { // et kort som er avgjort andre steder, skal ikke få en usynlig frist
    const visible = new Set(pending.map((entry) => entry.id))
    for (const id of queue.ids()) if (!visible.has(id)) queue.undo(id)
  }, [pending, queue])

  if (!pending.length) return <div className="empty-state"><span>✓</span><h3>{EMPTY_QUEUE_MESSAGE}</h3><p>Ingen oppgaver venter på godkjenning.</p></div>

  return pending.map((entry) => {
    const checkpoint = checkpoints.find((task) => task.id === entry.checkpoint_id)
    const team = teams.find((t) => t.id === entry.team_id)
    const planned = queue.get(entry.id)
    const sending = queue.isSending(entry.id)
    const seconds = planned ? Math.max(0, Math.ceil((planned.dueAt - now) / 1000)) : 0
    return (
      <div className="submission-card" key={entry.id}>
        <div className="submission-details">
          <span className="eyebrow">{team?.emoji} {team?.name} · {checkpoint?.points ?? 0} POENG</span>
          <h3>{checkpoint?.title}</h3>
          <small className="muted">{timeOf(entry.created_at)}</small>
          {entry.note && <p className="submission-note">{entry.note}</p>}
          {entry.url ? <button className="submission-thumbnail" onClick={() => onFocus(entry)} title="Se innsendt bilde i stort format"><img src={entry.url} alt={`Bildebevis fra ${team?.name ?? 'laget'}`} /><span>Se større bilde ↗</span></button> : <p className="muted">Bildebevis mangler fra eldre innsending.</p>}
        </div>
        {sending ? (
          <div className="submission-decision" role="status"><strong>Sender …</strong></div>
        ) : planned ? (
          <div className="submission-decision">
            <span className="sr-only" role="status">{planned.decision === 'approved' ? 'Godkjent' : 'Avvist'}. Du kan angre i 5 sekunder.</span>
            <strong aria-hidden="true">{planned.decision === 'approved' ? '✓ Godkjent' : '↺ Avvist'} om {seconds} s</strong>
            {planned.reason && <small>Begrunnelse: {planned.reason}</small>}
            <button type="button" className="button small outline" onClick={() => queue.undo(entry.id)}>Angre</button>
          </div>
        ) : (
          <div className="submission-decision">
            {errors[entry.id] && <div className="notice danger" role="alert">{errors[entry.id]}</div>}
            <label className="micro" htmlFor={`reason-${entry.id}`}>Begrunnelse (valgfritt, brukes bare ved avvisning og vises til laget)</label>
            <input id={`reason-${entry.id}`} type="text" maxLength={REASON_MAX} value={reasons[entry.id] ?? ''} onChange={(e) => setReasons((r) => ({ ...r, [entry.id]: e.target.value }))} placeholder="For eksempel: Bildet er uskarpt" />
            <div className="row-buttons">
              <button type="button" className="button small primary" onClick={() => queue.schedule(entry.id, 'approved')}>✓ Godkjenn</button>
              <button type="button" className="button small outline" onClick={() => queue.schedule(entry.id, 'rejected', reasons[entry.id] ?? null)}>Avvis</button>
            </div>
          </div>
        )}
      </div>
    )
  })
}
