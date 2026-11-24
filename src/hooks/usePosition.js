import { useCallback, useEffect, useState } from 'react'
import { startTracking } from './positionTracker.js'

/**
 * Posisjonskilde for Kart (AD-6, NFR10): nettleserens geolokasjon.
 * Posisjonen holdes bare i denne tilstanden. Den sendes aldri noe sted, lagres aldri og logges aldri.
 * Sporingen kjører bare mens komponenten er montert, `enabled` er sann og dokumentet er synlig. Ellers stoppes den og posisjonen glemmes.
 *
 * @param {{ enabled?: boolean }} [options]
 * @returns {{ position: { lat: number, lng: number, accuracy: number | null } | null, status: 'idle' | 'waiting' | 'ok' | 'denied' | 'unavailable', retry: () => void }}
 */
export default function usePosition({ enabled = true } = {}) {
  const [state, setState] = useState({ position: null, status: 'idle' })
  const [attempt, setAttempt] = useState(0)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!enabled || !visible) { setState({ position: null, status: 'idle' }); return undefined }
    return startTracking(typeof navigator === 'undefined' ? null : navigator.geolocation, setState) // stopper ved avmontering, skjult fane og ny forsøk
  }, [enabled, visible, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { position: state.position, status: state.status, retry }
}
