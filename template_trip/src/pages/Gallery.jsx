import { useState } from 'react'
import { useTrip } from '../context/TripContext.jsx'

export default function Gallery() {
  const { data, userId, isOrganizer, addPhoto, deletePhoto, setError } = useTrip()
  const [busy, setBusy] = useState(false)
  const [focused, setFocused] = useState(null)

  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try { await addPhoto(file); setError('') }
    catch (err) { setError(err.message) }
    finally { setBusy(false); e.target.value = '' }
  }

  async function remove(photo) {
    if (!window.confirm('Vil du slette dette bildet?')) return
    try { await deletePhoto(photo); setFocused(null); setError('') }
    catch (err) { setError(err.message) }
  }

  return <div className="page-stack"><div className="page-heading row-heading"><div><span className="eyebrow">MINNENE</span><h1>Bilder<span className="copper-dot">.</span></h1><p>{data.photos.length} bilder fra turen</p></div><label className={`button primary upload-button ${busy ? 'disabled' : ''}`}><input type="file" accept="image/*" disabled={busy} onChange={upload}/>{busy ? 'Laster opp …' : '+ Del bilde'}</label></div>
    {data.photos.length ? <div className="gallery-grid">{data.photos.map((photo) => <button className="photo-card" key={photo.id} onClick={() => setFocused(photo)}><img src={photo.url} alt={`Bilde fra ${data.trip.name}`} loading="lazy"/><span>{data.members.find((m) => m.user_id === photo.uploaded_by)?.display_name || 'Arrangør'}</span></button>)}</div> : <div className="empty-state tall"><span>📷</span><h3>Ingen bilder ennå</h3><p>Del det første minnet fra turen med gjengen.</p></div>}
    {focused && <div className="modal-backdrop" onClick={() => setFocused(null)}><div className="photo-modal" role="dialog" aria-modal="true" aria-label="Vis bilde" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setFocused(null)} aria-label="Lukk">×</button><img src={focused.url} alt="Stort bilde fra turen"/>{(focused.uploaded_by === userId || isOrganizer) && <button className="button danger-button" onClick={() => remove(focused)}>Slett bildet</button>}</div></div>}
  </div>
}
