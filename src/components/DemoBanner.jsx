import { useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { demoMode } from '../lib/supabase.js'

export default function DemoBanner() {
  const { resetDemo, switchRole, own } = useTrip()
  const navigate = useNavigate()
  if (!demoMode) return null
  return (
    <div className="demo-banner" role="status">
      DEMOMODUS <span>Endringer er bare lagret i denne nettleseren</span>
      {own && <button type="button" className="demo-reset" onClick={() => { switchRole(); navigate('/') }}>Bytt rolle</button>}
      <button type="button" className="demo-reset" onClick={() => { if (window.confirm('Tilbakestille demoen? Alle endringer og bilder i denne nettleseren slettes.')) { resetDemo(); navigate('/') } }}>Tilbakestill demo</button>
    </div>
  )
}
