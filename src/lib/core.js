/** Pure functions; used by both the UI and automated tests. */
export function currentTripDay(startDate, endDate, now = new Date()) {
  const current = localDate(now)
  if (current < startDate) return startDate
  if (current > endDate) return endDate
  return current
}

function localDate(date) {
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

export function validateImage(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(file.type)) {
    throw new Error('Velg et bilde i JPG, PNG, WebP, GIF eller HEIC-format.')
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Bildet er for stort (maks 8 MB).')
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
