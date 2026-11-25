/**
 * Lagring av utkastet lokalt (Story 2.3). Ren modul med injisert lagring.
 * Innhold: { request, draft, created_at }.
 */
import { validateTrip } from './validate.js'

export const DRAFT_KEY = 'tripbuilder-draft-v1'

export function saveDraft(storage, request, draft, now = new Date()) {
  try { storage.setItem(DRAFT_KEY, JSON.stringify({ request, draft, created_at: now.toISOString() })); return true } catch { return false }
}

/** Gir `{ request, draft, created_at }`, eller null når lagringen er tom, ødelagt eller utilgjengelig. */
export function loadDraft(storage) {
  try {
    const stored = JSON.parse(storage.getItem(DRAFT_KEY))
    if (!stored || typeof stored !== 'object' || !stored.draft || typeof stored.draft !== 'object' || !stored.draft.trip) return null
    if (!validateTrip(stored.draft).ok) return null // et eldre eller ødelagt utkast skal ikke krasje visningen
    return stored
  } catch { return null }
}

export function clearDraft(storage) {
  try { storage.removeItem(DRAFT_KEY) } catch { /* ignorer */ }
}
