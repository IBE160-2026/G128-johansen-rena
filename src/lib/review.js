/** Ren logikk for godkjenning (Story 3.5, AD-7). Ingen avhengigheter. */

export const REVIEW_DELAY_MS = 5000
export const REASON_MAX = 500
export const EMPTY_QUEUE_MESSAGE = 'Alt er godkjent. Godt jobbet!'
const DECISIONS = ['approved', 'rejected']

/** Begrunnelsen trimmes, og tom blir null. Gir `{ reason }` eller `{ error }` ved for lang tekst. */
export function normalizeReason(reason) {
  const text = typeof reason === 'string' ? reason.trim() : ''
  if (text.length > REASON_MAX) return { error: `Begrunnelsen kan ikke være lengre enn ${REASON_MAX} tegn.` }
  return { reason: text === '' ? null : text }
}

/** Feltene som skrives til databasen for en beslutning: status, og begrunnelse bare ved avvisning. */
export function buildReviewUpdate(decision, reason = null) {
  const { reason: text } = normalizeReason(reason)
  return { status: decision, rejection_reason: decision === 'rejected' ? text : null }
}

/**
 * Bruker en beslutning på en innsending. Bare ventende innsendinger kan avgjøres.
 * Samme beslutning to ganger (med samme begrunnelse) endrer ingenting og gir samme liste tilbake.
 * @returns {{ submissions: object[], changed: boolean, error?: string }}
 */
export function applyReview(submissions, id, decision, reason = null) {
  if (!DECISIONS.includes(decision)) return { submissions, changed: false, error: 'Ugyldig beslutning.' }
  const current = submissions.find((entry) => entry.id === id)
  if (!current) return { submissions, changed: false, error: 'Fant ikke innsendingen.' }
  const normalized = normalizeReason(reason)
  if (normalized.error) return { submissions, changed: false, error: normalized.error }
  const nextReason = decision === 'rejected' ? normalized.reason : null
  // En avgjort innsending skrives aldri om: samme beslutning (med eller uten ny begrunnelse) endrer ingenting, en annen gir feil.
  if (current.status === decision) return { submissions, changed: false }
  if (current.status !== 'pending') return { submissions, changed: false, error: 'Innsendingen er allerede avgjort.' }
  return {
    submissions: submissions.map((entry) => (entry.id === id ? { ...entry, status: decision, rejection_reason: nextReason } : entry)),
    changed: true,
  }
}

/**
 * Forsinkelseskø for beslutninger: en beslutning sendes først etter `delay`, og kan angres før det.
 * Tidtakerne injiseres, så køen kan testes uten ekte tid.
 */
export function createDecisionQueue({ delay = REVIEW_DELAY_MS, onCommit, onChange = () => {}, onError = () => {}, setTimer = setTimeout, clearTimer = clearTimeout, now = () => Date.now() }) {
  const items = new Map()
  const sending = new Set() // sendt, men ikke bekreftet ennå: kortet skal ikke kunne avgjøres på nytt
  const notify = () => onChange()

  function commit(id) {
    const item = items.get(id)
    if (!item) return
    clearTimer(item.timer)
    items.delete(id)
    sending.add(id)
    notify()
    const finish = () => { sending.delete(id); notify() }
    try {
      Promise.resolve(onCommit(id, item.decision, item.reason)).then(finish, (error) => { finish(); onError(id, error) })
    } catch (error) { // en feil i én sending stopper ikke de andre (flush)
      finish()
      onError(id, error)
    }
  }

  return {
    /** Planlegger en beslutning. En ny beslutning for samme innsending erstatter den forrige. */
    schedule(id, decision, reason = null) {
      const old = items.get(id)
      if (old) clearTimer(old.timer)
      items.set(id, { decision, reason, dueAt: now() + delay, timer: setTimer(() => commit(id), delay) })
      notify()
    },
    /** Angrer en ventende beslutning. Ingenting sendes. */
    undo(id) {
      const item = items.get(id)
      if (!item) return false
      clearTimer(item.timer)
      items.delete(id)
      notify()
      return true
    },
    /** Sender alle ventende beslutninger med en gang (siden forlates). */
    flush() { for (const id of [...items.keys()]) commit(id) },
    has: (id) => items.has(id),
    /** Er en beslutning sendt, men ikke bekreftet? */
    isSending: (id) => sending.has(id),
    ids: () => [...items.keys()],
    get: (id) => (items.has(id) ? { decision: items.get(id).decision, reason: items.get(id).reason, dueAt: items.get(id).dueAt } : null),
    get size() { return items.size },
  }
}
