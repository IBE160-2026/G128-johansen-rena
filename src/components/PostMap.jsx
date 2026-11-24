import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { LOCKED_HINT, activeCheckpoints, checkpointBounds, checkpointStatus, hasCoordinates } from '../lib/core.js'

const pad = (n) => String(n).padStart(2, '0')

function FitBounds({ bounds }) {
  const map = useMap()
  const key = JSON.stringify(bounds)
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
  }, [map, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/** Flytter kartet så valgt post ligger i øvre del, over postkortet. */
function PanToSelected({ post }) {
  const map = useMap()
  useEffect(() => {
    if (!post) return
    const point = map.latLngToContainerPoint([post.latitude, post.longitude])
    const size = map.getSize()
    map.panBy([point.x - size.x / 2, point.y - size.y * 0.3], { animate: true })
  }, [map, post?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function markerIcon(number, status, selected) {
  return L.divIcon({
    className: `post-marker ${status.lock}${selected ? ' selected' : ''}`,
    html: `<span class="post-marker-icon" aria-hidden="true">${{ locked: '🔒', unlocked: '🔓', open: '○' }[status.lock]}</span><span class="post-marker-number" aria-hidden="true">${number}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

/** Kart over postene med nummererte markører (låst eller åpen), og et postkort nederst for valgt post. */
export default function PostMap({ checkpoints, submissions, teamId, position, positionStatus, selectedId, onSelect, onSolve }) {
  const allPosts = useMemo(() => activeCheckpoints(checkpoints), [checkpoints])
  const posts = useMemo(() => allPosts.filter(hasCoordinates), [allPosts]) // en post uten posisjon kan ikke tegnes
  const bounds = useMemo(() => checkpointBounds(posts), [posts])
  if (!allPosts.length) return <div className="empty-state">Ingen poster lagt inn ennå.</div>
  if (!bounds) return <div className="empty-state">Postene har ikke en posisjon på kartet ennå.</div>

  // Nummeret følger plassen i hele listen av aktive poster, også når en post mangler posisjon
  const numberOf = (post) => allPosts.findIndex((p) => p.id === post.id) + 1
  const selectedIndex = posts.findIndex((post) => post.id === selectedId)
  const selected = selectedIndex >= 0 ? posts[selectedIndex] : null
  const status = selected ? checkpointStatus(selected, submissions, teamId, position) : null

  return (
    <div className="map-wrap">
      <MapContainer bounds={bounds} boundsOptions={{ padding: [40, 40], maxZoom: 16 }} scrollWheelZoom={false} className="map" aria-label="Kart over postene">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds bounds={bounds} />
        <PanToSelected post={posts[selectedIndex]} />
        {position && <>
          {Number.isFinite(position.accuracy) && position.accuracy > 0 && <Circle center={[position.lat, position.lng]} radius={position.accuracy} pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.08 }} interactive={false} />}
          <CircleMarker center={[position.lat, position.lng]} radius={7} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} interactive={false} />
        </>}
        {posts.map((post) => {
          const st = checkpointStatus(post, submissions, teamId, position)
          const number = numberOf(post)
          const name = `Post ${number}: ${post.title}, ${st.label.toLowerCase()}`
          return (
            <Marker
              key={post.id}
              position={[post.latitude, post.longitude]}
              icon={markerIcon(number, st, post.id === selectedId)}
              title={name}
              keyboard
              eventHandlers={{
                add: (e) => e.target.getElement()?.setAttribute('aria-label', name), // divIcon har ingen alt-tekst
                click: () => onSelect(post.id),
                keydown: (e) => { // tastatur: Enter og mellomrom velger posten
                  const key = e.originalEvent?.key
                  if (key === 'Enter' || key === ' ') { e.originalEvent.preventDefault(); onSelect(post.id) }
                },
              }}
            />
          )
        })}
      </MapContainer>
      {selected && (
        <aside className="post-card" aria-live="polite" aria-label={`Post ${numberOf(selected)}: ${selected.title}`}>
          <button type="button" className="post-card-close" aria-label="Lukk postkortet" onClick={() => onSelect(null)}>×</button>
          <span className="eyebrow">POST {pad(numberOf(selected))} · +{selected.points} POENG</span>
          <h3>{selected.title}</h3>
          <span className={`status ${status.submission}`}>{status.icon} {status.label}</span>
          {status.canSeeTask ? <p>{selected.description}</p> : <p className="muted">{!position && (positionStatus === 'denied' || positionStatus === 'unavailable') ? 'Vi vet ikke hvor du er, så posten forblir låst. Trykk «Prøv igjen» over kartet.' : status.hint ?? LOCKED_HINT}</p>}
          <button type="button" className="button gold full" disabled={!status.canSubmit} onClick={() => onSolve(selected)}>
            {{ solve: 'Løs oppgaven', locked: 'Låst', sent: 'Sendt inn', noteam: 'Du er ikke på et lag' }[status.action]}
          </button>
        </aside>
      )}
    </div>
  )
}
