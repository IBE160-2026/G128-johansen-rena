// Sanntid er et signal om å hente på nytt (AD-10). Ren logikk uten avhengigheter.
export const CHANNEL_NAME = 'tripbuilder-demo'
export const REFRESH_GAP_MS = 2000

/** Melding som sendes når en fane har lagret en lokal endring. Inneholder aldri turdata. */
export function makeMessage(tripId, sender) {
  return { type: 'changed', tripId, sender }
}

/** Gjelder meldingen denne fanen? Ugyldige meldinger, egne meldinger og andre turer ignoreres. */
export function isRelevant(message, tripId, sender) {
  if (!message || typeof message !== 'object') return false
  if (message.type !== 'changed') return false
  if (typeof message.tripId !== 'string' || typeof message.sender !== 'string') return false
  if (typeof tripId !== 'string' || typeof sender !== 'string') return false
  if (message.tripId !== tripId) return false
  if (message.sender === sender) return false
  return true
}

/** Skal turen hentes nå? Høyst én henting per `gap` ms. */
export function shouldRefreshNow(last, now, gap = REFRESH_GAP_MS) {
  if (typeof last !== 'number' || !Number.isFinite(last)) return true
  if (now < last) return true // klokka gikk bakover
  return now - last >= gap
}
