/**
 * Sett-status og «Endret»-regel for deltakere (AD-16). Ren modul med injisert lagring (localStorage i appen).
 * Tilstanden er `{ baseline_at, seen }`: `baseline_at` er første innlasting på enheten, og `seen[id]` er
 * `updated_at` elementet hadde da det sist ble sett.
 */
const SEEN_VERSION = 1
const keyFor = (tripId, userId) => `tripbuilder-seen-v${SEEN_VERSION}:${tripId}:${userId}`

/** Gyldig tid som millisekunder, ellers null. */
function toMs(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null
  const ms = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

const toIso = (value) => { const ms = toMs(value); return ms === null ? null : new Date(ms).toISOString() }
const hasId = (item) => item && typeof item === 'object' && (typeof item.id === 'string' || typeof item.id === 'number') && item.id !== ''

/** Leser lagret sett-status uten å opprette noe. Gir null når den mangler, er ødelagt eller lagringen er utilgjengelig. */
export function readSeen(storage, tripId, userId) {
  try {
    const stored = JSON.parse(storage.getItem(keyFor(tripId, userId)))
    const baseline = toIso(stored?.baseline_at)
    if (stored?.version === SEEN_VERSION && baseline && stored.seen && typeof stored.seen === 'object' && !Array.isArray(stored.seen)) {
      const seen = {}
      for (const [id, value] of Object.entries(stored.seen)) { const iso = toIso(value); if (iso) seen[id] = iso }
      return { baseline_at: baseline, seen }
    }
  } catch { /* ødelagt eller utilgjengelig lagring */ }
  return null
}

/** Henter sett-status, og oppretter `baseline_at` (nåtid) første gang eller når lagringen er ødelagt. Lagrer ved oppretting. */
export function loadSeen(storage, tripId, userId, now = new Date()) {
  const existing = readSeen(storage, tripId, userId)
  if (existing) return existing
  const state = { baseline_at: toIso(now) ?? new Date().toISOString(), seen: {} }
  saveSeen(storage, tripId, userId, state)
  return state
}

/** Lagrer sett-status. Returnerer false hvis lagringen er full eller utilgjengelig (tilstanden holdes da i minnet). */
export function saveSeen(storage, tripId, userId, state) {
  if (!tripId || !userId || !state?.baseline_at) return false
  try {
    storage.setItem(keyFor(tripId, userId), JSON.stringify({ version: SEEN_VERSION, baseline_at: state.baseline_at, seen: state.seen ?? {} }))
    return true
  } catch { return false }
}

/** Er elementet «Endret»? `updated_at` må være gyldig og nyere enn både `baseline_at` og `seen[id]`. */
export function isChanged(item, state) {
  if (!hasId(item)) return false
  const updated = toMs(item.updated_at)
  const baseline = toMs(state?.baseline_at)
  if (updated === null || baseline === null || updated <= baseline) return false
  const seen = toMs(state?.seen?.[item.id])
  return seen === null || updated > seen
}

/** De endrede elementene, i samme rekkefølge. Ugyldig input gir tom liste. */
export function changedItems(items, state) {
  return Array.isArray(items) ? items.filter((item) => isChanged(item, state)) : []
}

/** Ny tilstand der elementet er markert som sett. Uten gyldig id eller `updated_at` endres ingenting. */
export function markSeen(state, item) {
  const updated = toIso(item?.updated_at)
  if (!hasId(item) || !updated || !state) return state
  return { ...state, seen: { ...state.seen, [item.id]: updated } }
}

/** Ny tilstand der alle elementer som er endret nå, er markert som sett. Senere endringer forblir uleste. */
export function markAllSeen(state, items) {
  return changedItems(items, state).reduce(markSeen, state)
}

/** Slår sammen to sett-tilstander (for eksempel to faner): tidligste baseline og seneste sett-tid per element. */
export function mergeSeen(a, b) {
  if (!a) return b ?? null
  if (!b) return a
  const baseline = Math.min(toMs(a.baseline_at) ?? Infinity, toMs(b.baseline_at) ?? Infinity)
  const seen = { ...(a.seen ?? {}) }
  for (const [id, value] of Object.entries(b.seen ?? {})) {
    const next = toMs(value)
    const current = toMs(seen[id])
    if (next !== null && (current === null || next > current)) seen[id] = toIso(next)
  }
  return { baseline_at: Number.isFinite(baseline) ? new Date(baseline).toISOString() : (a.baseline_at ?? b.baseline_at), seen }
}
