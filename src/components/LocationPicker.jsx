import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { pickLocation } from '../lib/pickLocation.js'

const FALLBACK_CENTER = [59.9139, 10.7522]

const pickIcon = L.divIcon({ className: 'post-marker selected open', html: '<span class="post-marker-icon" aria-hidden="true">📍</span>', iconSize: [44, 44], iconAnchor: [22, 22] })

function Clicks({ onPoint }) {
  useMapEvents({ click: (e) => onPoint(e.latlng) })
  return null
}

/** Holder kartet på området, og flytter det når markøren settes langt fra utsnittet. */
function Follow({ target }) {
  const map = useMap()
  const key = target ? `${target[0]},${target[1]}` : ''
  useEffect(() => {
    if (target && !map.getBounds().contains(target)) map.panTo(target)
  }, [map, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/**
 * Kartvelger for en post (Story 5.2): turens område som sirkel, posten som markør som kan trykkes ut eller dras,
 * og radius som sirkel. Avviste posisjoner flytter ikke markøren og gir en forklaring.
 * @param {{ lat: number, lng: number, radius: number, area?: { center: {lat:number,lng:number}, radius_m: number } | null, onPick: (p: {lat:number,lng:number}) => void }} props
 */
export default function LocationPicker({ lat, lng, radius, area, onPick }) {
  const [message, setMessage] = useState('')
  useEffect(() => { setMessage('') }, [lat, lng]) // en gammel avvisning gjelder ikke en ny posisjon
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  const position = hasPoint ? [lat, lng] : null
  const center = useMemo(() => (area?.center ? [area.center.lat, area.center.lng] : position ?? FALLBACK_CENTER), []) // eslint-disable-line react-hooks/exhaustive-deps
  const bounds = useMemo(() => {
    if (!(area?.center && area.radius_m > 0)) return null
    const dLat = area.radius_m / 111320 // meter per breddegrad
    const dLng = area.radius_m / (111320 * Math.max(Math.cos((area.center.lat * Math.PI) / 180), 0.01))
    return [[area.center.lat - dLat, area.center.lng - dLng], [area.center.lat + dLat, area.center.lng + dLng]]
  }, [area])

  function handle(point) {
    const result = pickLocation({ lat: point.lat, lng: ((((point.lng + 180) % 360) + 360) % 360) - 180 }, area)
    if (result.ok) { setMessage(''); onPick({ lat: result.lat, lng: result.lng }) } else setMessage(result.error)
    return result.ok
  }

  return <div className="location-picker">
    <MapContainer {...(bounds ? { bounds } : { center, zoom: 14 })} boundsOptions={{ padding: [20, 20] }} scrollWheelZoom={false} className="map picker-map" aria-label="Kartvelger for posten">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Clicks onPoint={handle} />
      <Follow target={position} />
      {area?.center && area.radius_m > 0 && <Circle center={[area.center.lat, area.center.lng]} radius={area.radius_m} pathOptions={{ color: '#7a6a55', weight: 2, dashArray: '6 6', fillOpacity: 0.04 }} interactive={false} />}
      {position && Number.isFinite(radius) && radius > 0 && <Circle center={position} radius={radius} pathOptions={{ color: '#b8732a', weight: 2, fillOpacity: 0.15 }} interactive={false} />}
      {position && <Marker position={position} icon={pickIcon} draggable keyboard={false} eventHandlers={{
        dragend: (e) => {
          const ll = e.target.getLatLng()
          if (!handle(ll)) e.target.setLatLng(position) // avvist: tilbake dit den var
        },
      }} />}
    </MapContainer>
    {!message && <p className="picker-hint">{hasPoint ? 'Dra markøren eller trykk på kartet for å flytte posten.' : 'Trykk på kartet for å plassere posten.'}</p>}
    {message && <p className="field-error" role="alert">{message}</p>}
  </div>
}
