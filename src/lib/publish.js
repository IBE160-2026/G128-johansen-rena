import { validateTrip } from './validate.js'
import { listPublished, publishDemo } from './demoStore.js'

/**
 * Publisering av et utkast i demo (Story 2.7). Ren modul: tilfeldighet og tidspunkt sendes inn.
 * Resultatet har samme form som demo-dataene, så turen kan spilles på /t/<slug>.
 */

/** Tegnene i turkoden: ingen 0, O, 1 eller I, så koden kan leses opp og skrives av uten feil. */
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const JOIN_CODE_LENGTH = 6
/** Prøveturens slug er opptatt (testes mot seed-filen). */
export const DEMO_TRIP_SLUG = 'provetur'
export const MAX_DEMO_PARTICIPANTS = 30

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const MAX_SLUG_BASE = 40
const MAX_ATTEMPTS = 100

const FIRST_NAMES = [
  'Nora', 'Jakob', 'Emma', 'Noah', 'Olivia', 'Emil', 'Ingrid', 'Oskar', 'Sofie', 'Lukas',
  'Maja', 'Filip', 'Thea', 'Henrik', 'Frida', 'Magnus', 'Ida', 'Sander', 'Astrid', 'Jonas',
]

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

/** Kan utkastet publiseres? Bare `validateTrip` avgjør det. */
export function canPublish(draft) {
  return validateTrip(draft).ok
}

/** Et tilfeldig heltall fra 0 til `size - 1`. `random` gir tall i [0, 1). */
const pick = (random, size) => Math.min(size - 1, Math.max(0, Math.floor(random() * size) || 0))
const randomText = (random, alphabet, length) => Array.from({ length }, () => alphabet[pick(random, alphabet.length)]).join('')

/** UUID v4 fra `random` (crypto.randomUUID finnes ikke over http på LAN-IP, og testene trenger styrt tilfeldighet). */
function uuid(random) {
  const hex = randomText(random, '0123456789abcdef', 32)
  const variant = '89ab'[parseInt(hex[16], 16) % 4]
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20)}`
}

/** Turnavnet som adresse: bare a–z, 0–9 og bindestrek. Et navn uten slike tegn gir «tur». */
export function slugBase(name) {
  const text = String(name ?? '').normalize('NFC').toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // é blir e
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, MAX_SLUG_BASE)
    .replace(/-+$/, '')
  return text || 'tur'
}

/** Prøver til verdien er ledig. Gir null hvis `random` aldri gir en ledig verdi. */
function unique(make, taken) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const value = make()
    if (!taken.has(value)) return value
  }
  return null
}

function participantCount(request) {
  const wanted = Math.floor(Number(request?.participant_count))
  return Number.isNaN(wanted) ? 1 : Math.min(MAX_DEMO_PARTICIPANTS, Math.max(1, wanted))
}

/** Fiktive deltakere, fordelt jevnt på lagene (på omgang). */
function demoMembers(count, teams, tripId, random) {
  return Array.from({ length: count }, (_, i) => {
    const round = Math.floor(i / FIRST_NAMES.length)
    const name = FIRST_NAMES[i % FIRST_NAMES.length]
    return {
      id: uuid(random),
      user_id: uuid(random),
      trip_id: tripId,
      display_name: round === 0 ? name : `${name} ${round + 1}`,
      team_id: teams.length ? teams[i % teams.length].id : null,
      role: 'participant',
    }
  })
}

/**
 * @param {{ draft: import('./validate.js').TripDraft, request?: object }} input
 * @param {{ existing?: Array<{ slug?: string, join_code?: string }>, random: () => number, now?: Date }} options
 *   `existing` er turene som alt er publisert, og `random` gir tall i [0, 1).
 * @returns {{ ok: true, data: object } | { ok: false, error: 'INVALID_INPUT' | 'VALIDATION_FAILED' | 'NOT_UNIQUE', issues?: object[] }}
 */
export function publishTrip(input, options) {
  const { draft, request } = isObject(input) ? input : {}
  const { existing = [], random, now = new Date() } = isObject(options) ? options : {}
  if (!isObject(draft) || typeof random !== 'function' || !(now instanceof Date) || Number.isNaN(now.getTime())) {
    return { ok: false, error: 'INVALID_INPUT' }
  }
  const checked = validateTrip(draft)
  if (!checked.ok) return { ok: false, error: 'VALIDATION_FAILED', issues: checked.issues }

  const published = Array.isArray(existing) ? existing.filter(isObject) : []
  const joinCode = unique(() => randomText(random, JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH), new Set(published.map((trip) => trip.join_code)))
  const base = slugBase(draft.trip.name)
  const slug = unique(() => `${base}-${randomText(random, SLUG_ALPHABET, 4)}`, new Set([DEMO_TRIP_SLUG, ...published.map((trip) => trip.slug)]))
  if (!joinCode || !slug) return { ok: false, error: 'NOT_UNIQUE' }

  const copy = structuredClone(draft) // den publiserte turen deler ingen objekter med utkastet
  const source = copy.trip
  const tripId = uuid(random) // ny id: mock-utkast fra samme forespørsel har lik id
  const withTrip = (list) => list.map((item) => ({ ...item, trip_id: tripId }))
  const teams = withTrip(copy.teams)

  return {
    ok: true,
    data: {
      trip: {
        id: tripId, slug, name: source.name, destination: source.destination ?? '', description: source.description ?? '',
        start_date: source.start_date, end_date: source.end_date, announcement: source.announcement ?? '',
        destination_revealed: true, area: source.area, theme: source.theme,
        status: 'published', join_code: joinCode, demo_published: true, published_at: now.toISOString(),
      },
      teams,
      members: demoMembers(participantCount(request), teams, tripId, random),
      program: withTrip(copy.program_items),
      checkpoints: withTrip(copy.checkpoints),
      submissions: [],
      photos: [],
    },
  }
}

/**
 * Publiserer og lagrer i demo. `ok: true` betyr at turen er lagret, så utkastet trygt kan tømmes.
 * Turkoder og adresser som alt er i bruk, hentes fra oversikten.
 */
export function publishToDemo(storage, draft, request, options) {
  const result = publishTrip({ draft, request }, { ...options, existing: listPublished(storage) })
  if (!result.ok) return result
  return publishDemo(storage, result.data) ? result : { ok: false, error: 'STORAGE_FAILED' }
}
