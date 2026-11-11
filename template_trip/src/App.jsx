import { Navigate, Route, Routes } from 'react-router-dom'
import { useTrip } from './context/TripContext.jsx'
import Shell from './components/Shell.jsx'
import Welcome from './pages/Welcome.jsx'
import Home from './pages/Home.jsx'
import Program from './pages/Program.jsx'
import Rebus from './pages/Rebus.jsx'
import Gallery from './pages/Gallery.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  const { data, own, loading, error, setError } = useTrip()

  if (loading) return <main className="center-screen"><div className="loader"/><p>Henter turen …</p></main>
  if (!own || !data) return <Welcome />

  return (
    <Shell>
      {error && <div className="notice danger" role="alert">{error}<button aria-label="Lukk feilmelding" onClick={() => setError('')}>×</button></div>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/program" element={<Program />} />
        <Route path="/rebus" element={<Rebus />} />
        <Route path="/bilder" element={<Gallery />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
