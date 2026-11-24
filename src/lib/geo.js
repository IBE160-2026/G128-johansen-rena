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

/** Radius i meter når en geolåst post mangler `radius_m` (eldre data). */
export const DEFAULT_RADIUS_M = 50

const validPosition = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180

/**
 * Opplåsing av en post ut fra posisjonen (AD-6). Åpne poster (`requires_location` ikke true) er alltid åpne.
 * En geolåst post er opplåst når avstanden er mindre enn eller lik radius. Ugyldig eller manglende posisjon gir låst uten avstand.
 * @returns {{ state: 'open' | 'unlocked' | 'locked', distance: number | null, radius: number }}
 */
export function unlockStatus(checkpoint, position) {
  const radius = Number.isFinite(checkpoint?.radius_m) && checkpoint.radius_m > 0 ? checkpoint.radius_m : DEFAULT_RADIUS_M
  if (checkpoint?.requires_location !== true) return { state: 'open', distance: null, radius }
  if (!validPosition(position) || !Number.isFinite(checkpoint.latitude) || !Number.isFinite(checkpoint.longitude)) return { state: 'locked', distance: null, radius }
  const distance = distanceMeters(position.lat, position.lng, checkpoint.latitude, checkpoint.longitude)
  return { state: distance <= radius ? 'unlocked' : 'locked', distance, radius }
}

/** Hjelpetekst for en låst post, avstanden rundes opp slik at teksten aldri sier «innenfor» mens posten er låst. */
export function distanceHint(distance) {
  if (!Number.isFinite(distance)) return 'Venter på posisjon …'
  return `Du er ${Math.ceil(distance)} m unna. Gå nærmere for å låse opp.`
}

/** Simulert posisjon nøyaktig på en post (demo-simulatoren, Story 3.3), eller null når posten mangler koordinater. */
export function positionAtPost(checkpoint) {
  const lat = checkpoint?.latitude
  const lng = checkpoint?.longitude
  if (!validPosition({ lat, lng })) return null
  return { lat, lng, accuracy: null }
}

/** Gjør et kartpunkt (`{ lat, lng }`) om til en gyldig posisjon. Lengdegrad utenfor ±180 (panorert forbi datolinjen) pakkes rundt. */
export function normalizePosition(point) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null
  const lng = ((((point.lng + 180) % 360) + 360) % 360) - 180
  const position = { lat: point.lat, lng, accuracy: null }
  return validPosition(position) ? position : null
}

const METERS_PER_DEGREE = 111194.9266 // 6 371 000 m * pi / 180

/** Flytter en posisjon et antall meter mot nord og øst (liten avstand, flat tilnærming). Brukes av «Flytt»-knappene i simulatoren. */
export function moveBy(position, northMeters, eastMeters) {
  if (!validPosition(position)) return null
  const cos = Math.cos((position.lat * Math.PI) / 180)
  if (Math.abs(cos) < 1e-9) return null // ved polene finnes ingen øst
  return normalizePosition({ lat: position.lat + northMeters / METERS_PER_DEGREE, lng: position.lng + eastMeters / (METERS_PER_DEGREE * cos) })
}

/** Skal ekte geolokasjon følges? Aldri i demo-modus (simulatoren er kilden), og bare når kartet vises og en post er geolåst. */
export function shouldTrackReal({ demoMode, revealed, posts }) {
  return !demoMode && Boolean(revealed) && (posts ?? []).some((post) => post.requires_location === true)
}

/** Posisjonen som gjelder: simulert i demo-modus (aldri ekte), ellers den ekte. */
export function resolvePosition({ demoMode, simulated, real }) {
  return (demoMode ? simulated : real) ?? null
}
