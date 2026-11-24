import { useTrip } from '../context/TripContext.jsx'
import { demoMode } from '../lib/supabase.js'

export default function DemoBanner() {
  const { resetDemo } = useTrip()
  if (!demoMode) return null
  return (
    <div className="demo-banner" role="status">
      DEMOMODUS <span>Endringer er bare lagret i denne nettleseren</span>
      <button type="button" className="demo-reset" onClick={() => { if (window.confirm('Tilbakestille demoen? Alle endringer og bilder i denne nettleseren slettes.')) resetDemo() }}>Tilbakestill demo</button>
    </div>
  )
}
