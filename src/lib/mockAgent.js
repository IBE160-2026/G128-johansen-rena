/**
 * Mock-agenten (Story 2.3, demo): bygger en gyldig TripDraft fra seed-turen, tilpasset en TripRequest.
 * Ren (importerer ingenting) og deterministisk: samme forespørsel gir samme utkast, også id-ene.
 */
const DAY_MS = 24 * 60 * 60 * 1000
const toUtc = (value) => { const [y, m, d] = value.split('-').map(Number); return Date.UTC(y, m - 1, d) }
const datesBetween = (start, end) => {
  const dates = []
  for (let t = toUtc(start); t <= toUtc(end); t += DAY_MS) dates.push(new Date(t).toISOString().slice(0, 10))
  return dates
}

const EXTRA_TEAMS = [
  { name: 'Ulvene', emoji: '🐺' }, { name: 'Bjørnene', emoji: '🐻' }, { name: 'Falkene', emoji: '🦉' },
  { name: 'Delfinene', emoji: '🐬' }, { name: 'Hjortene', emoji: '🦌' }, { name: 'Pantrene', emoji: '🐆' },
]

/** Navn, beskrivelse og velkomstbeskjed som passer forespørselen, ikke prøveturens. */
function tripTexts(destination, dayCount, participants) {
  const days = dayCount === 1 ? 'En dag' : `${dayCount} dager`
  const group = participants > 0 ? ` for ${participants} ${participants === 1 ? 'deltaker' : 'deltakere'}` : ''
  return {
    name: `Tur til ${destination}`,
    description: `${days} i ${destination}${group}, med program og rebus gjennom byen.`,
    announcement: 'Velkommen til turen! 🎉',
  }
}

/** Stabil uuid-lignende id fra en tekst (FNV-1a i fire omganger). */
function stableId(text) {
  let hex = ''
  for (let round = 0; round < 4; round++) {
    let h = (0x811c9dc5 ^ (round * 0x9e3779b1)) >>> 0
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
    hex += h.toString(16).padStart(8, '0')
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

/**
 * @param {import('./validate.js').TripRequest} req
 * @param {import('./validate.js').TripDraft} seed seed-turen
 * @returns {import('./validate.js').TripDraft}
 */
export function buildMockDraft(req, seed) {
  const key = JSON.stringify([req.start_date, req.end_date, req.team_count ?? null, req.post_count ?? null])
  const id = (kind, n) => stableId(`${key}|${kind}|${n}`)

  const trip = { ...structuredClone(seed.trip), start_date: req.start_date, end_date: req.end_date }
  trip.id = id('trip', 0)
  const dates = datesBetween(req.start_date, req.end_date)
  Object.assign(trip, tripTexts(seed.trip.destination, dates.length, req.participant_count))

  // Programmet: seed-dagene i rekkefølge, om igjen når de er brukt opp.
  const seedDates = [...new Set(seed.program_items.map((item) => item.event_date))].sort()
  const days = seedDates.map((date) => seed.program_items.filter((item) => item.event_date === date))
  const program_items = []
  dates.forEach((date, dayIndex) => {
    days[dayIndex % days.length].forEach((item, i) => {
      program_items.push({ ...item, id: id('program', `${dayIndex}-${i}`), event_date: date })
    })
  })

  const postCount = req.post_count ?? seed.checkpoints.length
  const checkpoints = Array.from({ length: postCount }, (_, i) => {
    const base = seed.checkpoints[i % seed.checkpoints.length]
    const round = Math.floor(i / seed.checkpoints.length)
    const shift = round * 0.0007
    return {
      ...base,
      id: id('post', i),
      title: round === 0 ? base.title : `${base.title} ${round + 1}`,
      latitude: Number((base.latitude + shift).toFixed(5)),
      longitude: Number((base.longitude + (round % 2 === 0 ? shift : -shift)).toFixed(5)),
      status: 'active',
      position: i + 1,
    }
  })

  const teamCount = req.team_count ?? seed.teams.length
  const usedNames = new Set(seed.teams.map((t) => t.name))
  const usedEmoji = new Set(seed.teams.map((t) => t.emoji))
  const extras = EXTRA_TEAMS.filter((t) => !usedNames.has(t.name) && !usedEmoji.has(t.emoji))
  const teams = Array.from({ length: teamCount }, (_, i) => {
    if (i < seed.teams.length) return { ...seed.teams[i], id: id('team', i) }
    const extra = extras[i - seed.teams.length]
    const n = i + 1
    return { id: id('team', i), name: extra?.name ?? `Lag ${n}`, emoji: extra?.emoji ?? '⭐', color: `team-${(i % 6) + 1}` }
  })

  return { trip, program_items, checkpoints, teams }
}
