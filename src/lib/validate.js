import { distanceMeters } from './geo.js'

/**
 * Ren validering av turdata (AD-1, AD-2). Ingen avhengigheter, ingen sideeffekter.
 *
 * @typedef {{ lat: number, lng: number }} LatLng
 * @typedef {{ center: LatLng, radius_m: number }} Area
 * @typedef {{ name: string, start_date: string, end_date: string, area: Area, theme?: { accent: string, icon: string } }} TripFields
 * @typedef {{ id: string, event_date: string, start_time: string, title: string }} ProgramItem
 * @typedef {{ id: string, title: string, latitude: number, longitude: number, radius_m: number, requires_location: boolean, points: number, status: 'active' | 'deactivated' }} Checkpoint
 * @typedef {{ id: string, name: string }} Team
 * @typedef {{ trip: TripFields, program_items: ProgramItem[], checkpoints: Checkpoint[], teams: Team[] }} TripDraft
 * @typedef {{ path: string, message: string }} Issue
 *
 * Grensene her speiler CHECK-begrensningene i databasen (poeng 0 til 500, radius > 0, unike lagnavn per tur),
 * og kontrollen må holdes i synk med `supabase/migrations/`. Valideringen er ikke det harde vernet (AD-17).
 */

export const MAX_POINTS = 500
const MAX_TRIP_DAYS = 366

/** Felles regel for poeng på en post: heltall fra 1 til 500. Gir en feilmelding, ellers null. */
export function pointsError(points) {
  return Number.isInteger(points) && points >= 1 && points <= MAX_POINTS ? null : `Poeng må være et helt tall fra 1 til ${MAX_POINTS}.`
}

/** Poeng fra et tekstfelt: bare hele tall (siffer). Gir NaN for tomt, mellomrom, desimaler, 0x10 og 1e2. */
export function pointsFromInput(text) {
  const trimmed = typeof text === 'string' ? text.trim() : String(text ?? '')
  return /^\d+$/.test(trimmed) ? Number(trimmed) : NaN
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const isText = (value) => typeof value === 'string' && value.trim().length > 0
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const validTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

const DAY_MS = 24 * 60 * 60 * 1000
const toUtc = (value) => { const [y, m, d] = value.split('-').map(Number); return Date.UTC(y, m - 1, d) }

function datesBetween(start, end) {
  const dates = []
  for (let t = toUtc(start); t <= toUtc(end); t += DAY_MS) dates.push(new Date(t).toISOString().slice(0, 10))
  return dates
}

/**
 * @param {unknown} draft
 * @returns {{ ok: true } | { ok: false, issues: Issue[] }}
 */
export function validateTrip(draft) {
  /** @type {Issue[]} */
  const issues = []
  const add = (path, message) => issues.push({ path, message })
  const checkId = (id, seenIds, path, what) => {
    if (!isText(id)) add(path, `${what} må ha en id.`)
    else if (seenIds.has(id)) add(path, `${what} har en id som allerede er brukt.`)
    else seenIds.add(id)
  }

  if (!isObject(draft)) return { ok: false, issues: [{ path: '', message: 'Turen mangler eller har feil format.' }] }

  const trip = isObject(draft.trip) ? draft.trip : null
  if (!trip) add('trip', 'Turen mangler grunnopplysninger.')

  let period = null
  let area = null
  if (trip) {
    if (!isText(trip.name)) add('trip.name', 'Turen må ha et navn.')
    const startOk = validDate(trip.start_date)
    const endOk = validDate(trip.end_date)
    if (!startOk) add('trip.start_date', 'Startdato må være en gyldig dato (ÅÅÅÅ-MM-DD).')
    if (!endOk) add('trip.end_date', 'Sluttdato må være en gyldig dato (ÅÅÅÅ-MM-DD).')
    if (startOk && endOk) {
      if (trip.end_date < trip.start_date) add('trip.end_date', 'Sluttdato kan ikke være før startdato.')
      else if ((toUtc(trip.end_date) - toUtc(trip.start_date)) / DAY_MS + 1 > MAX_TRIP_DAYS) add('trip.end_date', `Turen kan ikke vare mer enn ${MAX_TRIP_DAYS} dager.`)
      else period = { start: trip.start_date, end: trip.end_date }
    }

    const a = trip.area
    const centerOk = isObject(a) && isObject(a.center) && isNumber(a.center.lat) && isNumber(a.center.lng)
    if (!centerOk) add('trip.area.center', 'Turens område må ha et midtpunkt med breddegrad og lengdegrad.')
    else if (Math.abs(a.center.lat) > 90 || Math.abs(a.center.lng) > 180) add('trip.area.center', 'Midtpunktet ligger utenfor kartet.')
    const radiusOk = isObject(a) && isNumber(a.radius_m) && a.radius_m > 0
    if (!radiusOk) add('trip.area.radius_m', 'Turens område må ha en radius større enn 0 meter.')
    if (centerOk && radiusOk && Math.abs(a.center.lat) <= 90 && Math.abs(a.center.lng) <= 180) area = a

    if (trip.theme !== undefined && (!isObject(trip.theme) || !isText(trip.theme.accent) || !isText(trip.theme.icon))) {
      add('trip.theme', 'Temaet må ha en aksentfarge og et ikon.')
    }
  }

  const items = Array.isArray(draft.program_items) ? draft.program_items : null
  if (!items) add('program_items', 'Turen mangler programposter.')
  else {
    const seen = new Set()
    const ids = new Set()
    items.forEach((item, i) => {
      const at = `program_items[${i}]`
      if (!isObject(item)) return add(at, 'Programposten har feil format.')
      checkId(item.id, ids, `${at}.id`, 'Programposten')
      if (!isText(item.title)) add(`${at}.title`, 'Programposten må ha en tittel.')
      if (!validTime(item.start_time)) add(`${at}.start_time`, 'Klokkeslettet må være på formen TT:MM.')
      if (!validDate(item.event_date)) add(`${at}.event_date`, 'Datoen må være gyldig (ÅÅÅÅ-MM-DD).')
      else if (period && (item.event_date < period.start || item.event_date > period.end)) {
        add(`${at}.event_date`, `Programposten ligger utenfor turens periode (${period.start} til ${period.end}).`)
      } else seen.add(item.event_date)
    })
    if (period) {
      for (const date of datesBetween(period.start, period.end)) {
        if (!seen.has(date)) add('program_items', `Datoen ${date} mangler programposter.`)
      }
    }
  }

  const checkpoints = Array.isArray(draft.checkpoints) ? draft.checkpoints : null
  if (!checkpoints) add('checkpoints', 'Turen mangler poster.')
  else {
    const ids = new Set()
    checkpoints.forEach((cp, i) => {
      const at = `checkpoints[${i}]`
      if (!isObject(cp)) return add(at, 'Posten har feil format.')
      checkId(cp.id, ids, `${at}.id`, 'Posten')
      if (!isText(cp.title)) add(`${at}.title`, 'Posten må ha en tittel.')
      if (typeof cp.requires_location !== 'boolean') add(`${at}.requires_location`, 'Posten må si om den krever at man er på stedet.')
      if (cp.status !== undefined && cp.status !== 'active' && cp.status !== 'deactivated') add(`${at}.status`, 'Status må være aktiv eller deaktivert.')
      if (!isNumber(cp.radius_m) || cp.radius_m <= 0) add(`${at}.radius_m`, 'Radius må være større enn 0 meter.')
      const pointsProblem = pointsError(cp.points)
      if (pointsProblem) add(`${at}.points`, pointsProblem)
      const latOk = isNumber(cp.latitude) && Math.abs(cp.latitude) <= 90
      const lngOk = isNumber(cp.longitude) && Math.abs(cp.longitude) <= 180
      if (!latOk) add(`${at}.latitude`, 'Posten må ha en gyldig breddegrad.')
      if (!lngOk) add(`${at}.longitude`, 'Posten må ha en gyldig lengdegrad.')
      if (latOk && lngOk && area && distanceMeters(area.center.lat, area.center.lng, cp.latitude, cp.longitude) > area.radius_m) {
        add(at, 'Posten ligger utenfor turens område.')
      }
    })
  }

  if (!Array.isArray(draft.teams)) add('teams', 'Turen mangler lag.')
  else {
    const ids = new Set()
    const names = new Set()
    draft.teams.forEach((team, i) => {
      const at = `teams[${i}]`
      if (!isObject(team)) return add(at, 'Laget har feil format.')
      checkId(team.id, ids, `${at}.id`, 'Laget')
      if (!isText(team.name)) add(`${at}.name`, 'Laget må ha et navn.')
      else if (names.has(team.name.trim())) add(`${at}.name`, 'To lag kan ikke ha samme navn.')
      else names.add(team.name.trim())
    })
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues }
}

export const MIN_DESCRIPTION = 30
export const MAX_DESCRIPTION = 4000
export const MAX_TEAMS = 6
export const MAX_PARTICIPANTS = 1000
export const MAX_POSTS = 100
export const DESCRIPTION_HINT = 'Beskriv gjerne sted, datoer, antall, program og rebus.'

/**
 * Kontrakten for generering (AD-15, Story 2.2).
 * @typedef {{ destination: string, start_date: string, end_date: string, participant_count: number, team_count?: number, post_count?: number, description: string }} TripRequest
 *
 * @param {unknown} req
 * @returns {{ ok: true } | { ok: false, issues: Issue[] }} issues har `path` lik feltnavnet. `code: 'TOO_SHORT'` markerer for kort beskrivelse.
 */
export function validateTripRequest(req) {
  /** @type {Array<Issue & { code?: string }>} */
  const issues = []
  const add = (path, message, code) => issues.push(code ? { path, message, code } : { path, message })
  if (!isObject(req)) return { ok: false, issues: [{ path: '', message: 'Forespørselen mangler eller har feil format.' }] }

  const isInt = (v) => typeof v === 'number' && Number.isSafeInteger(v)
  if (!isText(req.destination)) add('destination', 'Skriv inn en destinasjon.')
  const startOk = validDate(req.start_date)
  const endOk = validDate(req.end_date)
  if (!startOk) add('start_date', req.start_date ? 'Fra må være en gyldig dato (ÅÅÅÅ-MM-DD).' : 'Velg en fradato.')
  if (!endOk) add('end_date', req.end_date ? 'Til må være en gyldig dato (ÅÅÅÅ-MM-DD).' : 'Velg en tildato.')
  if (startOk && endOk) {
    if (req.end_date < req.start_date) add('end_date', 'Til kan ikke være før Fra.')
    else if ((toUtc(req.end_date) - toUtc(req.start_date)) / DAY_MS + 1 > MAX_TRIP_DAYS) add('end_date', `Turen kan ikke vare mer enn ${MAX_TRIP_DAYS} dager.`)
  }
  const participantsOk = isInt(req.participant_count) && req.participant_count >= 1 && req.participant_count <= MAX_PARTICIPANTS
  if (!participantsOk) add('participant_count', `Deltakere må være et helt tall fra 1 til ${MAX_PARTICIPANTS}.`)
  if (req.team_count !== undefined) {
    if (!isInt(req.team_count) || req.team_count < 1 || req.team_count > MAX_TEAMS) add('team_count', `Lag må være et helt tall fra 1 til ${MAX_TEAMS}.`)
    else if (participantsOk && req.team_count > req.participant_count) add('team_count', 'Det kan ikke være flere lag enn deltakere.')
  }
  if (req.post_count !== undefined && (!isInt(req.post_count) || req.post_count < 1 || req.post_count > MAX_POSTS)) add('post_count', `Antall poster må være et helt tall fra 1 til ${MAX_POSTS}.`)
  const text = typeof req.description === 'string' ? req.description.trim() : ''
  if (text.length < MIN_DESCRIPTION) add('description', DESCRIPTION_HINT, 'TOO_SHORT')
  else if (text.length > MAX_DESCRIPTION) add('description', `Beskrivelsen kan ikke være lengre enn ${MAX_DESCRIPTION} tegn.`)

  return issues.length === 0 ? { ok: true } : { ok: false, issues }
}
