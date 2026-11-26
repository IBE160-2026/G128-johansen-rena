/** Ren logikk for innsending av bilde og notat (Story 3.4). Importerer bare core.js. */
import { acceptsSubmissions } from './core.js'

export const NOTE_MIN = 3
export const NOTE_MAX = 1000
export const MAX_SIDE_PX = 1600

export const SENT_MESSAGE = 'Sendt! Venter på godkjenning fra arrangøren.'
export const NETWORK_MESSAGE = 'Ingen dekning. Prøv igjen når du har nett.'

/** En feil som skyldes reglene (notat, bilde, lag, dobbel innsending), ikke nettet. Vises som den er. */
export function validationError(message) {
  return Object.assign(new Error(message), { validation: true })
}

/** Meldingen deltakeren ser når sendingen feiler. Regelfeil vises som de er, nettfeil gir «Ingen dekning». */
export function submissionErrorMessage(error, online = true) {
  if (error?.validation) return error.message
  const text = typeof error === 'string' ? error : typeof error?.message === 'string' ? error.message : ''
  const network = online === false || error instanceof TypeError || /failed to fetch|network ?error|load failed|networkerror/i.test(text)
  return network ? NETWORK_MESSAGE : text || 'Noe gikk galt. Prøv igjen.'
}

/** Raden som settes inn for en innsending. Notatet trimmes, og statusen er alltid ventende. */
export function buildSubmissionEntry({ tripId, teamId, checkpointId, userId, note }) {
  return { trip_id: tripId, team_id: teamId, checkpoint_id: checkpointId, submitted_by: userId, note: String(note ?? '').trim(), status: 'pending' }
}

/** Gir en feilmelding for et ugyldig notat, ellers null. Lengden regnes etter trim. */
export function validateNote(note) {
  const length = typeof note === 'string' ? note.trim().length : 0
  if (length < NOTE_MIN) return `Skriv et notat på minst ${NOTE_MIN} tegn.`
  if (length > NOTE_MAX) return `Notatet kan ikke være lengre enn ${NOTE_MAX} tegn.`
  return null
}

/** Kan innsendingen sendes? Krever bilde og gyldig notat, og at ingen sending pågår. */
export function canSendSubmission({ photo, note, busy = false }) {
  return !busy && Boolean(photo) && validateNote(note) === null
}

/** Skalerer mål så lengste side er høyst `maxSide`, uten å forstørre. Heltall, minst 1. */
export function scaleToFit(width, height, maxSide = MAX_SIDE_PX) {
  if (!(width > 0) || !(height > 0)) return { width: 1, height: 1 }
  const factor = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * factor)), height: Math.max(1, Math.round(height * factor)) }
}

/**
 * Legger en demo-innsending inn i de nyeste turdataene. Bildebehandlingen tar tid, og en annen fane kan ha endret
 * turen imens. Derfor må innsendingen aldri bygges på dataene fra før, og reglene sjekkes på nytt her.
 *
 * @param {object} latest turen slik den er lagret nå
 * @param {object} entry hele raden, med `trip_id`, `team_id`, `checkpoint_id` og `submitted_by`
 * @returns {{ data: object } | { error: string }} `latest` endres ikke
 */
export function addDemoSubmission(latest, entry) {
  if (!latest?.trip || latest.trip.id !== entry.trip_id) return { error: 'Turen ble endret mens bildet ble behandlet. Last siden på nytt og prøv igjen.' }
  const member = (latest.members ?? []).find((m) => m.user_id === entry.submitted_by)
  if (member?.team_id !== entry.team_id) return { error: 'Laget ditt ble endret mens bildet ble behandlet. Send inn på nytt.' }
  const post = (latest.checkpoints ?? []).find((c) => c.id === entry.checkpoint_id)
  if (!post) return { error: 'Posten finnes ikke lenger.' }
  if (!acceptsSubmissions(post)) return { error: 'Posten er deaktivert og tar ikke imot svar.' }
  const submissions = latest.submissions ?? []
  if (submissions.some((s) => s.team_id === entry.team_id && s.checkpoint_id === entry.checkpoint_id && s.status !== 'rejected')) return { error: 'Laget har allerede sendt inn denne posten.' }
  return { data: { ...latest, submissions: [entry, ...submissions] } }
}
