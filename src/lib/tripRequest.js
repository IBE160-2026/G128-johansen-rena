import { pointsFromInput, validateTripRequest } from './validate.js'

/**
 * Skjema for «Ny tur» (Story 2.2). Ren modul med injisert lagring (som tripCache.js).
 * Skjemaet har tekstverdier; `buildTripRequest` gjør dem om til en TripRequest (AD-15).
 */
export const FORM_KEY = 'tripbuilder-newtrip-v1'
export const REQUEST_KEY = 'tripbuilder-newtrip-request-v1'
export const FIELDS = ['destination', 'start_date', 'end_date', 'participant_count', 'team_count', 'post_count', 'description']

export function emptyForm() {
  return Object.fromEntries(FIELDS.map((f) => [f, '']))
}

const text = (v) => (typeof v === 'string' ? v.trim() : '')
const num = (v) => (text(v) === '' ? undefined : pointsFromInput(v))

/** Bygger en TripRequest fra skjemaet. Ugyldige tall blir NaN (fanges av validateTripRequest), tomme valgfrie felt utelates. */
export function buildTripRequest(form) {
  const req = {
    destination: text(form.destination),
    start_date: text(form.start_date),
    end_date: text(form.end_date),
    participant_count: num(form.participant_count) ?? NaN,
  }
  const teams = num(form.team_count)
  const posts = num(form.post_count)
  if (teams !== undefined) req.team_count = teams
  if (posts !== undefined) req.post_count = posts
  req.description = text(form.description)
  return req
}

/**
 * Validerer skjemaet felt for felt.
 * @returns {{ errors: Record<string, string>, hint: string, request: object|null, firstInvalid: string|null }}
 */
export function validateForm(form) {
  const req = buildTripRequest(form)
  const result = validateTripRequest(req)
  const errors = {}
  let hint = ''
  if (!result.ok) {
    for (const issue of result.issues) {
      if (issue.code === 'TOO_SHORT') hint = issue.message
      else if (issue.path && !errors[issue.path]) errors[issue.path] = issue.message
    }
  }
  const firstInvalid = FIELDS.find((f) => errors[f] || (f === 'description' && hint)) ?? null
  return { errors, hint, request: result.ok ? req : null, firstInvalid }
}

export function loadForm(storage) {
  const form = emptyForm()
  try {
    const stored = JSON.parse(storage.getItem(FORM_KEY))
    if (stored && typeof stored === 'object') for (const f of FIELDS) if (typeof stored[f] === 'string') form[f] = stored[f]
  } catch { /* ødelagt eller utilgjengelig lagring gir tomt skjema */ }
  return form
}

export function saveForm(storage, form) {
  try { storage.setItem(FORM_KEY, JSON.stringify(form)); return true } catch { return false }
}

/** Lagrer den ventende forespørselen (Story 2.3 tar over). */
export function saveRequest(storage, request) {
  try { storage.setItem(REQUEST_KEY, JSON.stringify(request)); return true } catch { return false }
}

export function loadRequest(storage) {
  try {
    const req = JSON.parse(storage.getItem(REQUEST_KEY))
    return validateTripRequest(req).ok ? req : null
  } catch { return null }
}

export function clearRequest(storage) {
  try { storage.removeItem(REQUEST_KEY) } catch { /* ignorer */ }
}
