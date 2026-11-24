import { Navigate, useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { roleHome } from '../lib/core.js'
import DemoBanner from '../components/DemoBanner.jsx'

// Start-flaten i demo-modus (Story 1.4): velg rolle og åpne prøveturen.
export default function Start() {
  const { chooseRole, own, slug } = useTrip()
  const navigate = useNavigate()

  function choose(role) {
    const target = chooseRole(role)
    if (target) navigate(target, { replace: true })
  }

  if (own) return <Navigate to={roleHome(own.role, slug)} replace /> // rollen huskes i fanen

  return (
    <>
      <DemoBanner />
      <main className="start">
        <div className="start-panel">
          <span className="eyebrow">TRIPBUILDER AI</span>
          <h1>Prøv appen.</h1>
          <p className="muted">Velg hvordan du vil prøve prøveturen. Du trenger ingen konto.</p>
          <div className="role-choice">
            <button type="button" className="button primary full role-button" onClick={() => choose('participant')}>Deltaker</button>
            <button type="button" className="button outline full role-button" onClick={() => choose('organizer')}>Arrangør</button>
          </div>
          <p className="micro">Du kan bytte rolle når som helst i banneret øverst.</p>
        </div>
      </main>
    </>
  )
}
