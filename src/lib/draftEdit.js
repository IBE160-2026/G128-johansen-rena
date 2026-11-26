import { validateTrip, THEME_ACCENTS, THEME_ICONS } from './validate.js'

/**
 * Ren redigering av utkastet (Story 2.5, AD-1). Ingen sideeffekter, ingen avhengigheter utenom validate.js.
 * Alle funksjoner gir et nytt utkast, eller det samme objektet når inputen er ugyldig.
 */

export const SECTIONS = ['program_items', 'checkpoints', 'teams']

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/**
 * Bytter ut bare elementet med gitt id i `section`. Andre elementer beholdes som de samme objektene.
 * Ukjent seksjon, ukjent id eller ugyldig patch gir det samme utkastet.
 */
export function updateElement(draft, section, id, patch) {
  if (!isObject(draft) || !SECTIONS.includes(section) || !isObject(patch)) return draft
  const list = draft[section]
  if (!Array.isArray(list)) return draft
  const index = list.findIndex((el) => isObject(el) && el.id === id)
  if (index < 0) return draft
  const { id: _ignored, ...fields } = patch // id kan ikke endres
  const next = list.map((el, i) => (i === index ? { ...el, ...fields } : el))
  return { ...draft, [section]: next }
}

/** Turens tekster som arrangøren kan redigere, med lengste lengde (beskjeden har samme grense som i Admin). */
export const TRIP_TEXT_LIMITS = { name: 120, description: 500, announcement: 500 }

/** Endrer navn, beskrivelse eller velkomstbeskjed. Andre felt og verdier som ikke er tekst, ignoreres. */
export function updateTripText(draft, patch) {
  if (!isObject(draft) || !isObject(draft.trip) || !isObject(patch)) return draft
  const fields = Object.entries(patch).filter(([key, value]) => Object.hasOwn(TRIP_TEXT_LIMITS, key) && typeof value === 'string')
  return fields.length ? { ...draft, trip: { ...draft.trip, ...Object.fromEntries(fields) } } : draft
}

/** Feil for et område, ellers null. Samme grenser som validateTrip. */
export function areaError(area) {
  if (!isObject(area) || !isObject(area.center)) return 'Området mangler midtpunkt.'
  if (!isNum(area.center.lat) || Math.abs(area.center.lat) > 90) return 'Breddegrad må være et tall mellom -90 og 90.'
  if (!isNum(area.center.lng) || Math.abs(area.center.lng) > 180) return 'Lengdegrad må være et tall mellom -180 og 180.'
  if (!isNum(area.radius_m) || area.radius_m < 1) return 'Radius må være minst 1 meter.'
  return null
}

/** Endrer turens område. Ugyldig område endrer ingenting. */
export function updateArea(draft, area) {
  if (!isObject(draft) || !isObject(draft.trip) || areaError(area)) return draft
  return { ...draft, trip: { ...draft.trip, area: { center: { lat: area.center.lat, lng: area.center.lng }, radius_m: area.radius_m } } }
}

/** Setter temaet. Bare aksent og ikon fra de faste listene godtas, ellers er utkastet uendret. */
export function updateTheme(draft, theme) {
  if (!isObject(draft) || !isObject(draft.trip) || !isObject(theme)) return draft
  if (!THEME_ACCENTS.includes(theme.accent) || !THEME_ICONS.includes(theme.icon)) return draft
  return { ...draft, trip: { ...draft.trip, theme: { accent: theme.accent, icon: theme.icon } } }
}

const PATH = /^(program_items|checkpoints|teams)\[(\d+)\](?:\.(\w+))?$/

/**
 * Kjører validateTrip og knytter feil til elementets id og felt.
 * @returns {{ count: number, byId: Record<string, Array<{ field: string, message: string }>>, general: Array<{ path: string, message: string }> }}
 */
export function draftErrors(draft) {
  const result = validateTrip(draft)
  const out = { count: 0, byId: {}, general: [] }
  if (result.ok) return out
  for (const { path, message } of result.issues) {
    out.count += 1
    const m = PATH.exec(path)
    const el = m && isObject(draft) && Array.isArray(draft[m[1]]) ? draft[m[1]][Number(m[2])] : null
    if (m && isObject(el) && typeof el.id === 'string' && el.id) {
      const field = m[3] ?? (m[1] === 'checkpoints' ? 'position' : 'element')
      ;(out.byId[el.id] ??= []).push({ field, message })
    } else out.general.push({ path, message })
  }
  return out
}
