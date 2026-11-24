/** Ren logikk for innsending av bilde og notat (Story 3.4). Ingen avhengigheter. */

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
