/** Rene geografiske hjelpefunksjoner (AD-1, AD-6). */

/** Avstand i meter mellom to punkter (haversine, WGS84-grader). */
export function distanceMeters(aLat, aLng, bLat, bLng) {
  const r = 6371000
  const toRad = (v) => v * Math.PI / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  const h = Math.min(1, Math.max(0, x)) // avrundingsfeil nær motpunktet kan gi x > 1
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
