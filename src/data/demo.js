import seed from '../seed/demo-trip.json' with { type: 'json' }
import { daysBetween, localDate, shiftDate } from '../lib/core.js'

/**
 * Bygger appens demo-data fra seed-turen (src/seed/demo-trip.json, en TripDraft med fiktive deltakere).
 * Datoene flyttes slik at turen er i gang og `now` er dag 2 (seed-filen er uendret).
 */
export function initialDemoData(now = new Date()) {
  const draft = structuredClone(seed) // kopi, så endringer i appen aldri rører seed-modulen
  const { trip } = draft
  const offset = daysBetween(trip.start_date, shiftDate(localDate(now), -1))
  trip.start_date = shiftDate(trip.start_date, offset)
  trip.end_date = shiftDate(trip.end_date, offset)
  for (const item of draft.program_items) item.event_date = shiftDate(item.event_date, offset)
  const tripId = trip.id
  return {
    seed_version: draft.seed_version,
    trip: {
      id: tripId, slug: trip.slug, name: trip.name, destination: trip.destination, description: trip.description,
      start_date: trip.start_date, end_date: trip.end_date, announcement: trip.announcement,
      destination_revealed: trip.destination_revealed, area: trip.area, theme: trip.theme,
    },
    teams: draft.teams.map((team) => ({ ...team, trip_id: tripId })),
    members: draft.members.map((member) => ({ ...member, trip_id: tripId, role: 'participant' })),
    program: draft.program_items.map((item) => ({ ...item, trip_id: tripId })),
    checkpoints: draft.checkpoints.map((checkpoint) => ({ ...checkpoint, trip_id: tripId })),
    submissions: [],
    photos: [],
  }
}

/** Den rå seed-turen som TripDraft (for validering). */
export const seedDraft = seed
