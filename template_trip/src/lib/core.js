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

export function distanceMeters(aLat, aLng, bLat, bLng) {
  const r = 6371000
  const toRad = (v) => v * Math.PI / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function validateImage(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(file.type)) {
    throw new Error('Velg et bilde i JPG, PNG, WebP, GIF eller HEIC-format.')
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Bildet er for stort (maks 8 MB).')
}
