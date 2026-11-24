import { distanceHint, unlockStatus } from './geo.js'
/** Pure functions; used by both the UI and automated tests. */
export function currentTripDay(startDate, endDate, now = new Date()) {
  const current = localDate(now)
  if (current < startDate) return startDate
  if (current > endDate) return endDate
  return current
}

export function localDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(date, opts = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('nb-NO', { timeZone: 'UTC', ...opts }).format(new Date(`${date}T12:00:00Z`))
}

export function sortEvents(events) {
  return [...events].sort((a, b) => `${a.event_date} ${a.start_time}`.localeCompare(`${b.event_date} ${b.start_time}`))
}

export function standings(teams, checkpoints, submissions) {
  const approved = submissions.filter((submission) => submission.status === 'approved')
  return teams.map((team) => ({
    ...team,
    points: approved.reduce((sum, submission) => {
      if (submission.team_id !== team.id) return sum
      const checkpoint = checkpoints.find((entry) => entry.id === submission.checkpoint_id)
      return sum + (checkpoint?.points ?? 0)
    }, 0),
    completed: approved.filter((submission) => submission.team_id === team.id).length,
  })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'nb'))
}

export { distanceMeters } from './geo.js'

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024

/** Bare JPEG, PNG og WebP, og maks 15 MB før komprimering (Story 3.4). */
export function validateImage(file) {
  if (!file) throw new Error('Velg et bilde i JPG-, PNG- eller WebP-format.')
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    throw new Error('HEIC-bilder støttes ikke ennå. Velg et JPG-, PNG- eller WebP-bilde (på iPhone: Innstillinger › Kamera › Formater › Mest kompatibel).')
  }
  if (!file.type) throw new Error('Kunne ikke lese filtypen. Velg et JPG-, PNG- eller WebP-bilde.')
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Velg et bilde i JPG-, PNG- eller WebP-format.')
  if (!(file.size >= 0 && file.size <= MAX_IMAGE_BYTES)) throw new Error('Bildet er for stort (maks 15 MB).')
}

/** Adresser: alle turer ligger under /t/<slug>. */
export function tripPath(slug, sub = '') {
  return `/t/${encodeURIComponent(slug)}${sub ? `/${sub.replace(/^\/+/, '')}` : ''}`
}

export function slugFromPath(pathname) {
  const match = /^\/t\/([^/]+)/.exec(pathname || '')
  if (!match) return null
  try { return decodeURIComponent(match[1]) } catch { return null }
}

export function findTripBySlug(trips, slug) {
  return trips.find((trip) => trip.slug === slug) ?? null
}

/** Demo-roller (Start-flaten i demo-modus). */
export const DEMO_ORGANIZER_ID = 'demo-admin'

/** Bruker-id for en demo-rolle: arrangøren er `demo-admin`, deltakeren er første medlem i turen. */
export function demoUserForRole(role, members) {
  if (role === 'organizer') return DEMO_ORGANIZER_ID
  if (role === 'participant') return (members?.find((m) => m.role === 'participant') ?? members?.[0])?.user_id ?? null
  return null
}

/** Hvor en rolle havner etter valget: arrangør på Mine turer, deltaker på turen. */
export function roleHome(role, slug) {
  return role === 'organizer' ? '/mine-turer' : tripPath(slug)
}

/** Hvem demo-brukeren er: den syntetiske arrangøren, ellers medlemmet med denne bruker-id-en. */
export function demoOwn(userId, members) {
  if (userId === DEMO_ORGANIZER_ID) return { id: DEMO_ORGANIZER_ID, user_id: DEMO_ORGANIZER_ID, display_name: 'Arrangør', role: 'organizer', team_id: null }
  return members?.find((member) => member.user_id === userId) ?? null
}

const DAY_MS = 24 * 60 * 60 * 1000
const toUtc = (date) => { const [y, m, d] = date.split('-').map(Number); return Date.UTC(y, m - 1, d) }

/** Flytter en dato (ÅÅÅÅ-MM-DD) et antall dager. */
export function shiftDate(date, days) {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10)
}

/** Antall dager fra a til b (negativt hvis b er før a). */
export function daysBetween(a, b) {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS)
}

const LAST_EVENT_MINUTES = 60
const minutesOf = (time) => { const [h, m] = String(time).split(':').map(Number); return h * 60 + m }

/**
 * Id-en til aktiviteten som pågår nå, eller null. Bare for dagens faktiske dato.
 * En aktivitet pågår fra starttiden til neste aktivitets starttid, og den siste i dagen i 60 minutter.
 */
export function currentEventId(events, now = new Date()) {
  const today = localDate(now)
  const day = sortEvents(events.filter((event) => event.event_date === today && Number.isFinite(minutesOf(event.start_time))))
  const minutes = now.getHours() * 60 + now.getMinutes()
  for (let i = day.length - 1; i >= 0; i -= 1) {
    const start = minutesOf(day[i].start_time)
    if (minutes < start) continue
    // Slutter når en senere aktivitet starter. Ellers 60 minutter, men aldri etter midnatt.
    const later = day.slice(i + 1).find((event) => minutesOf(event.start_time) > start)
    const end = later ? minutesOf(later.start_time) : Math.min(start + LAST_EVENT_MINUTES, 24 * 60)
    return minutes < end ? day[i].id : null
  }
  return null
}

/** Flytter demo-data slik at turen er i gang og `now` er dag 2 (idempotent). Gir samme objekt hvis ingenting må flyttes. */
export function rebaseDemoDates(data, now = new Date()) {
  const offset = daysBetween(data.trip.start_date, shiftDate(localDate(now), -1))
  if (offset === 0) return data
  return {
    ...data,
    trip: { ...data.trip, start_date: shiftDate(data.trip.start_date, offset), end_date: shiftDate(data.trip.end_date, offset) },
    program: data.program.map((item) => ({ ...item, event_date: shiftDate(item.event_date, offset) })),
  }
}

/** Aktive poster (ikke deaktivert), sortert på `position`. */
export function activeCheckpoints(checkpoints) {
  return [...(checkpoints ?? [])]
    .filter((checkpoint) => checkpoint.status !== 'deactivated')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

/** Teksten for en låst post (kortet og listen sier det samme). */
export const LOCKED_HINT = 'Posten er låst. Oppgaven vises når du er på stedet.'

const SUBMISSION_STATUSES = ['approved', 'pending', 'rejected']

/**
 * Tilstanden til en post for et lag.
 * - `lock`: `open` (ikke geolåst, også eldre data uten `requires_location`), `unlocked` (geolåst og innenfor radius) eller `locked`. Posisjonen er valgfri.
 * - `submission`: lagets siste innsending avgjør (`latest`), ukjent status regnes som ingen.
 * - `canSubmit`: laget kan levere en åpen post uten innsending, eller levere på nytt etter avvisning (laget var da på stedet).
 * - `canSeeTask`: oppgaveteksten vises for åpne poster og for poster laget har levert på.
 * - `action`: hva knappen skal si (solve, locked, sent, noteam). Tekst og ikon brukes sammen, aldri bare farge.
 */
export function checkpointStatus(checkpoint, submissions, teamId, position = null) {
  const mine = (submissions ?? []).filter((s) => s.checkpoint_id === checkpoint.id && s.team_id === teamId)
  const latest = mine.length ? mine.reduce((a, b) => ((b.created_at ?? '') >= (a.created_at ?? '') ? b : a)) : null
  const unlock = unlockStatus(checkpoint, position)
  const lock = unlock.state
  const submission = SUBMISSION_STATUSES.includes(latest?.status) ? latest.status : 'none'
  const canSubmit = Boolean(teamId) && (submission === 'rejected' || (lock !== 'locked' && submission === 'none'))
  const canSeeTask = lock !== 'locked' || submission !== 'none'
  const label = { approved: 'Godkjent', pending: 'Venter på godkjenning', rejected: 'Avvist, prøv igjen' }[submission] ?? { open: 'Åpen', unlocked: 'Opplåst', locked: 'Låst' }[lock]
  const icon = { approved: '✓', pending: '⏳', rejected: '↺' }[submission] ?? { open: '○', unlocked: '🔓', locked: '🔒' }[lock]
  const action = canSubmit ? 'solve' : !teamId ? 'noteam' : submission === 'none' ? 'locked' : 'sent'
  const noCoordinates = !hasCoordinates(checkpoint) // posten kan aldri låses opp uten posisjon
  const hint = lock === 'locked' && submission === 'none' ? (noCoordinates ? 'Posten mangler posisjon og kan ikke låses opp ennå.' : distanceHint(unlock.distance)) : null
  return { lock, submission, latest, canSubmit, canSeeTask, action, label, icon, distance: unlock.distance, hint }
}

/** Har posten koordinater som kan tegnes på kartet? */
export const hasCoordinates = (checkpoint) => Number.isFinite(checkpoint?.latitude) && Number.isFinite(checkpoint?.longitude)

/** Grenser som rommer alle poster, ellers null. Gyldige koordinater er endelige tall. */
export function checkpointBounds(checkpoints) {
  const points = (checkpoints ?? []).filter(hasCoordinates)
  if (!points.length) return null
  const lats = points.map((c) => c.latitude)
  const lngs = points.map((c) => c.longitude)
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
}
