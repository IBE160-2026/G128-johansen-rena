import { rebaseDemoDates } from './core.js'

/**
 * Lagring av demo-data (AD-4). Ren modul: lagringen sendes inn (localStorage i appen, en fake i tester).
 * Importerer bare core.js, og ingen sideeffekter utover kallene til `storage`.
 *
 * Prøveturen ligger under DEMO_DATA_KEY. Hver publisert tur (Story 2.7) ligger under sin egen nøkkel som
 * `{ original, data }`, der `original` er turen slik den ble publisert. Oversikten brukes til Mine turer.
 */
export const DEMO_DATA_KEY = 'tripbuilder-demo-v2'
export const DEMO_USER_KEY = 'tripbuilder-user-v2'
export const PUBLISHED_INDEX_KEY = 'tripbuilder-demo-published-v1'
export const PUBLISHED_TRIP_PREFIX = 'tripbuilder-demo-trip-v1:'
const LEGACY_KEYS = ['tripbuilder-demo-v1', 'tripbuilder-user-v1']

const isRecord = (entry) => entry && typeof entry === 'object' && typeof entry.id === 'string'

const hasShape = (item) => item && typeof item === 'object' && isRecord(item.trip) && typeof item.trip.slug === 'string'
  && ['teams', 'program', 'checkpoints', 'members'].every((key) => Array.isArray(item[key]) && item[key].every(isRecord))
  && Array.isArray(item.submissions) && Array.isArray(item.photos)

const looksValid = (item, seedVersion) => hasShape(item) && item.seed_version === seedVersion

// En ugyldig dato ville fått datoformateringen til å kaste
const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))

const looksPublished = (item, slug) => Boolean(hasShape(item) && item.trip.slug === slug && item.trip.demo_published === true
  && isDate(item.trip.start_date) && isDate(item.trip.end_date) && item.program.every((entry) => isDate(entry.event_date)))

const looksListed = (entry) => Boolean(entry) && typeof entry === 'object'
  && ['slug', 'name', 'join_code'].every((key) => typeof entry[key] === 'string' && entry[key] !== '')
  && isDate(entry.start_date) && isDate(entry.end_date)

const summaryOf = ({ trip }) => ({
  slug: trip.slug, name: trip.name, destination: trip.destination, start_date: trip.start_date, end_date: trip.end_date,
  join_code: trip.join_code, published_at: trip.published_at,
})

// Når sessionStorage ikke finnes eller kaster, gjelder rollen i minnet (delt mellom alle providere i fanen).
let memoryUser = null

/** Leser demo-brukeren (rollen) for denne fanen. */
export function readDemoUser(userStorage) {
  try {
    const stored = userStorage?.getItem(DEMO_USER_KEY)
    if (stored) return stored
  } catch { /* bruk minnet */ }
  return memoryUser
}

/** Husker demo-brukeren for denne fanen. */
export function writeDemoUser(userStorage, id) {
  memoryUser = id
  try { userStorage?.setItem(DEMO_USER_KEY, id) } catch { /* minnet holder */ }
}

/** Glemmer demo-brukeren for denne fanen. */
export function clearDemoUser(userStorage) {
  memoryUser = null
  removeKeys(userStorage, [DEMO_USER_KEY])
}

/** Oversikten over publiserte turer, i den rekkefølgen de ble publisert. Ødelagt lagring gir tom liste. */
export function listPublished(storage) {
  try {
    const stored = JSON.parse(storage.getItem(PUBLISHED_INDEX_KEY))
    return Array.isArray(stored) ? stored.filter(looksListed) : []
  } catch { return [] }
}

function readEntry(storage, slug) {
  try {
    const entry = JSON.parse(storage.getItem(PUBLISHED_TRIP_PREFIX + slug))
    return entry && typeof entry === 'object' ? entry : null
  } catch { return null }
}

function writeEntry(storage, slug, entry) {
  try { storage.setItem(PUBLISHED_TRIP_PREFIX + slug, JSON.stringify(entry)); return true } catch { return false }
}

/** Den publiserte turen med denne adressen, eller null når den ikke finnes eller er ødelagt. */
export function loadPublished(storage, slug) {
  const data = readEntry(storage, slug)?.data
  return looksPublished(data, slug) ? data : null
}

/**
 * Lagrer en nylig publisert tur med originalbildet og fører den opp i oversikten. Alt eller ingenting:
 * returnerer false (uten rester) hvis lagringen er full eller utilgjengelig, eller adressen er opptatt.
 */
export function publishDemo(storage, data) {
  const slug = data?.trip?.slug
  if (!looksPublished(data, slug)) return false
  const key = PUBLISHED_TRIP_PREFIX + slug
  try { if (storage.getItem(key) !== null) return false } catch { return false }
  if (!writeEntry(storage, slug, { original: data, data })) return false
  try {
    storage.setItem(PUBLISHED_INDEX_KEY, JSON.stringify([...listPublished(storage), summaryOf(data)]))
    return true
  } catch {
    removeKeys(storage, [key])
    return false
  }
}

/** Holder navn og periode i oversikten like turen etter en endring. Turen er alt lagret, så feil her ignoreres. */
function refreshSummary(storage, data) {
  const list = listPublished(storage)
  const next = list.map((entry) => (entry.slug === data.trip.slug ? summaryOf(data) : entry)).filter(looksListed)
  if (next.length !== list.length || JSON.stringify(next) === JSON.stringify(list)) return
  try { storage.setItem(PUBLISHED_INDEX_KEY, JSON.stringify(next)) } catch { /* oversikten er en bonus */ }
}

/**
 * Gir den publiserte turen med `slug`. Uten `slug`, for prøveturens slug og for en ukjent adresse gis prøveturen:
 * lagret demo-data hvis de er gyldige og har riktig seed-versjon, ellers seed-turen (som lagres).
 */
export function loadDemo(storage, makeSeed, userStorage = storage, slug) {
  const seed = makeSeed()
  removeKeys(storage, LEGACY_KEYS) // frigjør plass fra eldre demo-lagring
  if (slug && slug !== seed.trip.slug) {
    const published = loadPublished(storage, slug)
    if (published) return published // datoene beholdes slik de ble publisert
  }
  try {
    const stored = JSON.parse(storage.getItem(DEMO_DATA_KEY))
    if (looksValid(stored, seed.seed_version)) {
      const rebased = rebaseDemoDates(stored) // turen skal alltid være i gang, også dagen etter
      if (rebased !== stored) saveDemo(storage, rebased)
      return rebased
    }
  } catch { /* ødelagt eller utilgjengelig lagring: bruk seed */ }
  clearDemoUser(userStorage) // en gammel bruker passer ikke til ny seed
  saveDemo(storage, seed)
  return seed
}

/** Lagrer demo-data (en publisert tur under sin egen nøkkel). Returnerer false hvis lagringen er full eller utilgjengelig. */
export function saveDemo(storage, data) {
  if (data?.trip?.demo_published === true) {
    const slug = data.trip.slug
    const entry = readEntry(storage, slug)
    if (!entry || !writeEntry(storage, slug, { original: entry.original, data })) return false
    refreshSummary(storage, data)
    return true
  }
  try { storage.setItem(DEMO_DATA_KEY, JSON.stringify(data)); return true } catch { return false }
}

/** Tekstene ved nullstilling, like i demo-banneret og i Admin. En publisert tur nullstilles bare for seg selv. */
export function resetTexts(trip) {
  return trip?.demo_published === true
    ? {
      title: 'Tilbakestill turen',
      description: 'Turen går tilbake til slik den ble publisert',
      question: 'Tilbakestille turen? Den går tilbake til slik den ble publisert, og endringer, innsendinger og bilder på turen slettes.',
    }
    : {
      title: 'Nullstill demo',
      description: 'Sletter alle endringer og bilder i prøveturen',
      question: 'Tilbakestille demoen? Alle endringer og bilder i prøveturen slettes.',
    }
}

/**
 * Nullstiller demoen (brukeren ligger per fane i `userStorage`): sletter innlogget demo-bruker. En publisert tur
 * (`slug`) går tilbake til slik den ble publisert. Ellers lastes seed-turen på nytt.
 */
export function resetDemo(storage, makeSeed, userStorage = storage, slug) {
  clearDemoUser(userStorage)
  const seed = makeSeed()
  if (slug && slug !== seed.trip.slug) {
    const original = readEntry(storage, slug)?.original
    if (looksPublished(original, slug)) {
      // Går ikke lagringen, vises det som faktisk er lagret (turen skal aldri forsvinne)
      return saveDemo(storage, original) ? original : (loadPublished(storage, slug) ?? original)
    }
    const current = loadPublished(storage, slug)
    if (current) return current // uten originalbilde er det ingenting å gå tilbake til
  }
  // Får vi ikke lagret seed, fjernes gammel data så den ikke dukker opp igjen ved neste lasting
  if (!saveDemo(storage, seed)) removeKeys(storage, [DEMO_DATA_KEY])
  return seed
}

function removeKeys(storage, keys) {
  for (const key of keys) {
    try { storage.removeItem(key) } catch { /* ignorer */ }
  }
}
