/**
 * Lagring av utkastet lokalt (Story 2.3). Ren modul med injisert lagring.
 * Innhold: { request, draft, created_at }.
 */
export const DRAFT_KEY = 'tripbuilder-draft-v1'

export function saveDraft(storage, request, draft, now = new Date()) {
  try { storage.setItem(DRAFT_KEY, JSON.stringify({ request, draft, created_at: now.toISOString() })); return true } catch { return false }
}

/** Gir `{ request, draft, created_at }`, eller null når lagringen er tom, ødelagt eller utilgjengelig. */
export function loadDraft(storage) {
  try {
    const stored = JSON.parse(storage.getItem(DRAFT_KEY))
    if (!stored || typeof stored !== 'object' || !stored.draft || typeof stored.draft !== 'object' || !stored.draft.trip) return null
    // Valideringsfeil er lov (arrangøren skal kunne rette dem, Story 2.5), men formen må bære visningen.
    const d = stored.draft
    const isList = (v) => Array.isArray(v) && v.every((el) => el !== null && typeof el === 'object' && !Array.isArray(el))
    const date = /^\d{4}-\d{2}-\d{2}$/
    if (typeof d.trip !== 'object' || Array.isArray(d.trip) || !date.test(d.trip.start_date) || !date.test(d.trip.end_date)) return null
    const area = d.trip.area
    if (!area || typeof area !== 'object' || !area.center || !Number.isFinite(area.center.lat) || !Number.isFinite(area.center.lng) || !Number.isFinite(area.radius_m)) return null
    const unique = (v) => new Set(v.map((el) => el.id)).size === v.length && v.every((el) => typeof el.id === 'string' && el.id !== '')
    if (!isList(d.program_items) || !isList(d.checkpoints) || !isList(d.teams)) return null
    if (!unique(d.program_items) || !unique(d.checkpoints) || !unique(d.teams)) return null // redigering går på id
    return stored
  } catch { return null }
}

export function clearDraft(storage) {
  try { storage.removeItem(DRAFT_KEY) } catch { /* ignorer */ }
}
