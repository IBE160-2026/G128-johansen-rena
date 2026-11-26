import { useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { demoMode } from '../lib/supabase.js'
import { resetTexts } from '../lib/api.js'
import { tripPath } from '../lib/core.js'

export default function DemoBanner() {
  const { resetDemo, switchRole, own, data } = useTrip()
  const navigate = useNavigate()
  if (!demoMode) return null
  // Fra en publisert tur skal man bli på turen, ikke havne på prøveturens startside
  const home = data?.trip?.demo_published ? tripPath(data.trip.slug) : '/'
  return (
    <div className="demo-banner" role="status">
      DEMOMODUS <span>Endringer er bare lagret i denne nettleseren</span>
      {own && <button type="button" className="demo-reset" onClick={() => { switchRole(); navigate(home) }}>Bytt rolle</button>}
      <button type="button" className="demo-reset" onClick={() => { if (window.confirm(resetTexts(data?.trip).question)) { resetDemo(); navigate(home) } }}>Tilbakestill demo</button>
    </div>
  )
}
