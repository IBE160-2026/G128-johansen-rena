/**
 * Sporing av posisjon uten React (AD-6, NFR10), slik at den kan testes med en falsk geolokasjon.
 * Posisjonen gis bare videre til `onUpdate` og holdes ellers ikke. Den sendes aldri noe sted og lagres aldri.
 */

/**
 * Hva en posisjonsfeil betyr. Bare «nektet» (kode 1) fjerner en gyldig posisjon. Andre feil (utilgjengelig, tidsavbrudd)
 * er vanlige innendørs og lar siste kjente posisjon stå, mens overvåkingen prøver på nytt.
 * @param {number | undefined} code
 * @param {boolean} hadPosition
 * @returns {{ status: 'denied' | 'ok' | 'unavailable', keepPosition: boolean }}
 */
export function mapPositionError(code, hadPosition) {
  if (code === 1) return { status: 'denied', keepPosition: false }
  return hadPosition ? { status: 'ok', keepPosition: true } : { status: 'unavailable', keepPosition: false }
}

/**
 * Starter sporing. Returnerer en funksjon som stopper den.
 * @param {{ watchPosition: Function, clearWatch: Function } | null | undefined} geolocation
 * @param {(state: { position: { lat: number, lng: number, accuracy: number | null } | null, status: 'waiting' | 'ok' | 'denied' | 'unavailable' }) => void} onUpdate
 */
export function startTracking(geolocation, onUpdate) {
  if (!geolocation) { onUpdate({ position: null, status: 'unavailable' }); return () => {} }
  let position = null
  onUpdate({ position: null, status: 'waiting' }) // gammel posisjon følger aldri med en ny sporing
  const id = geolocation.watchPosition(
    (result) => {
      position = { lat: result.coords.latitude, lng: result.coords.longitude, accuracy: result.coords.accuracy ?? null }
      onUpdate({ position, status: 'ok' })
    },
    (error) => {
      const next = mapPositionError(error?.code, position !== null)
      if (!next.keepPosition) position = null
      onUpdate({ position, status: next.status })
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  )
  return () => geolocation.clearWatch(id)
}
