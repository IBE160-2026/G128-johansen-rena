import { demoMode } from '../lib/supabase.js'

export default function DemoBanner() {
  if (!demoMode) return null
  return <div className="demo-banner" role="status">DEMOMODUS <span>Endringer er bare lagret i denne nettleseren</span></div>
}
