/**
 * Mellomlager for siste lastede tur (UX-DR19). Ren modul med injisert lagring (localStorage i appen).
 * Innsendinger og bilder lagres ikke, bare det deltakeren trenger uten nett.
 */
const CACHE_VERSION = 1
const keyFor = (slug, userId) => `tripbuilder-cache-v${CACHE_VERSION}:${slug}:${userId}`

/** Lagrer turen. Returnerer false hvis lagringen er full eller utilgjengelig. */
export function saveTripCache(storage, slug, userId, data) {
  if (!slug || !userId || !data?.trip) return false
  const { own, trip, members, teams, program, checkpoints } = data
  try {
    storage.setItem(keyFor(slug, userId), JSON.stringify({ version: CACHE_VERSION, saved_at: new Date().toISOString(), data: { own, trip, members, teams, program, checkpoints } }))
    return true
  } catch {
    clearTripCache(storage, slug, userId) // en eldre tur skal ikke vises som siste lasting
    return false
  }
}

/** Sletter mellomlageret for turen og brukeren (utlogging, eller når brukeren ikke lenger er med). */
export function clearTripCache(storage, slug, userId) {
  try { storage?.removeItem(keyFor(slug, userId)) } catch { /* ignorer */ }
}

/** Er feilen et tap av nett (bruk mellomlager), og ikke for eksempel en tilgangs- eller serverfeil? */
export function isNetworkError(error, online = true) {
  if (online === false) return true
  if (error instanceof TypeError) return true
  return /failed to fetch|network ?error|load failed|networkerror/i.test(String(error?.message ?? error ?? ''))
}

/** Gir den lagrede turen (med tomme innsendinger og bilder), eller null. */
export function loadTripCache(storage, slug, userId) {
  try {
    const stored = JSON.parse(storage.getItem(keyFor(slug, userId)))
    const data = stored?.version === CACHE_VERSION ? stored.data : null
    if (!data?.trip || data.trip.slug !== slug || !data.own || typeof data.own !== 'object') return null
    for (const key of ['members', 'teams', 'program', 'checkpoints']) if (!Array.isArray(data[key])) return null
    return { ...data, submissions: [], photos: [], saved_at: stored.saved_at }
  } catch { return null }
}
