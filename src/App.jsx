import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { TripProvider, useTrip } from './context/TripContext.jsx'
import { seedDraft } from './data/demo.js'
import { demoMode } from './lib/supabase.js'
import Shell from './components/Shell.jsx'
import DemoBanner from './components/DemoBanner.jsx'
import Welcome from './pages/Welcome.jsx'
import Home from './pages/Home.jsx'
import Program from './pages/Program.jsx'
import Rebus from './pages/Rebus.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Team from './pages/Team.jsx'
import Gallery from './pages/Gallery.jsx'
import Admin from './pages/Admin.jsx'
import Start from './pages/Start.jsx'
import MineTurer from './pages/MineTurer.jsx'
import NyTur from './pages/NyTur.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DemoOnly><Start /></DemoOnly>} />
      <Route path="/mine-turer" element={<DemoOnly><MineTurer /></DemoOnly>} />
      <Route path="/ny-tur" element={<DemoOnly><NyTur /></DemoOnly>} />
      <Route path="/t/:slug/*" element={<TripRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// I demo-modus får Start og Mine turer en provider for prøveturen (banneret og rollene trenger den).
// Utenfor demo kommer ekte start-flate og Mine turer i Epic 2.
function DemoOnly({ children }) {
  if (demoMode) return <TripProvider slug={seedDraft.trip.slug}>{children}</TripProvider>
  return (
    <main className="center-screen">
      <h1>TripBuilder AI</h1>
      <p>Åpne lenken du har fått fra arrangøren for å bli med på turen.</p>
    </main>
  )
}

function TripRoute() {
  const { slug } = useParams()
  return <TripProvider key={slug} slug={slug}><TripApp /></TripProvider>
}

function TripApp() {
  const { data, own, loading, error, setError, notFound, path } = useTrip()

  if (loading) return <main className="center-screen"><div className="loader"/><p>Henter turen …</p></main>
  if (notFound) return <NotFound />
  if (!own || !data) return <Welcome />

  return (
    <Shell>
      {error && <div className="notice danger" role="alert">{error}<button aria-label="Lukk feilmelding" onClick={() => setError('')}>×</button></div>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/program" element={<Program />} />
        <Route path="/kart" element={<Rebus />} />
        <Route path="/ledertavle" element={<Leaderboard />} />
        <Route path="/laget" element={<Team />} />
        <Route path="/rebus" element={<Navigate to={path('kart')} replace />} />
        <Route path="/bilder" element={<Gallery />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to={path()} replace />} />
      </Routes>
    </Shell>
  )
}

function NotFound() {
  return (
    <><DemoBanner /><main className="center-screen">
      <h1>Fant ikke turen.</h1>
      <p>Sjekk lenken du har fått, og prøv igjen.</p>
      <Link className="text-link" to="/">Til start</Link>
    </main></>
  )
}
