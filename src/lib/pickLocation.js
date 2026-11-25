import { distanceMeters } from './geo.js'

/**
 * Ren kartvelger-regel (Story 5.2, AD-1): godtar et punkt bare når det er gyldig og ligger innenfor turens område.
 * Mangler `area`, godtas ethvert gyldig punkt.
 *
 * @param {{ lat: number, lng: number } | null | undefined} point
 * @param {{ center: { lat: number, lng: number }, radius_m: number } | null | undefined} area
 * @returns {{ ok: true, lat: number, lng: number } | { ok: false, error: string }}
 */
export function pickLocation(point, area) {
  const valid = point !== null && typeof point === 'object' && Number.isFinite(point.lat) && Number.isFinite(point.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180
  if (!valid) return { ok: false, error: 'Posisjonen er ikke gyldig. Trykk på kartet for å velge et sted.' }
  const hasArea = area !== null && typeof area === 'object' && area.center && Number.isFinite(area.center.lat) && Number.isFinite(area.center.lng) && Number.isFinite(area.radius_m) && area.radius_m > 0
  const round = (v) => Math.round(v * 1e6) / 1e6
  const lat = round(point.lat)
  const lng = round(point.lng) // avrund først, så et punkt ved kanten ikke havner utenfor etter avrundingen
  if (hasArea && distanceMeters(area.center.lat, area.center.lng, lat, lng) > area.radius_m) {
    return { ok: false, error: 'Posisjonen ligger utenfor turens område. Velg et sted innenfor sirkelen.' }
  }
  return { ok: true, lat, lng }
}
