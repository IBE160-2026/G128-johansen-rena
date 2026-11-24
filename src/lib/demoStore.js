/**
 * Lagring av demo-data (AD-4). Ren modul: lagringen sendes inn (localStorage i appen, en fake i tester).
 * Importerer ingenting, og ingen sideeffekter utover kallene til `storage`.
 */
export const DEMO_DATA_KEY = 'tripbuilder-demo-v2'
export const DEMO_USER_KEY = 'tripbuilder-user-v2'
const LEGACY_KEYS = ['tripbuilder-demo-v1', 'tripbuilder-user-v1']

const isRecord = (entry) => entry && typeof entry === 'object' && typeof entry.id === 'string'

const looksValid = (item, seedVersion) => item && typeof item === 'object' && item.seed_version === seedVersion
  && isRecord(item.trip) && typeof item.trip.slug === 'string'
  && ['teams', 'program', 'checkpoints', 'members'].every((key) => Array.isArray(item[key]) && item[key].every(isRecord))
  && Array.isArray(item.submissions) && Array.isArray(item.photos)

/** Gir lagret demo-data hvis de er gyldige og har riktig seed-versjon, ellers seed-turen (som lagres). */
export function loadDemo(storage, makeSeed) {
  const seed = makeSeed()
  removeKeys(storage, LEGACY_KEYS) // frigjør plass fra eldre demo-lagring
  try {
    const stored = JSON.parse(storage.getItem(DEMO_DATA_KEY))
    if (looksValid(stored, seed.seed_version)) return stored
  } catch { /* ødelagt eller utilgjengelig lagring: bruk seed */ }
  removeKeys(storage, [DEMO_USER_KEY]) // en gammel bruker passer ikke til ny seed
  saveDemo(storage, seed)
  return seed
}

/** Lagrer demo-data. Returnerer false hvis lagringen er full eller utilgjengelig. */
export function saveDemo(storage, data) {
  try { storage.setItem(DEMO_DATA_KEY, JSON.stringify(data)); return true } catch { return false }
}

/** Nullstiller demoen: sletter innlogget demo-bruker og laster seed-turen på nytt. */
export function resetDemo(storage, makeSeed) {
  removeKeys(storage, [DEMO_USER_KEY])
  const seed = makeSeed()
  // Får vi ikke lagret seed, fjernes gammel data så den ikke dukker opp igjen ved neste lasting
  if (!saveDemo(storage, seed)) removeKeys(storage, [DEMO_DATA_KEY])
  return seed
}

function removeKeys(storage, keys) {
  for (const key of keys) {
    try { storage.removeItem(key) } catch { /* ignorer */ }
  }
}
