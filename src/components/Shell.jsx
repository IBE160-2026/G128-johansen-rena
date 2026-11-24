import { NavLink, useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from './DemoBanner.jsx'

const links = [
  { to: '', label: 'Hjem', icon: '⌂' },
  { to: 'program', label: 'Program', icon: '▦' },
  { to: 'rebus', label: 'Rebus', icon: '◇' },
  { to: 'bilder', label: 'Bilder', icon: '▧' },
]

export default function Shell({ children }) {
  const { data, own, demoMode, isOrganizer, signOut, setError, path } = useTrip()
  const navigate = useNavigate()

  async function logout() {
    try { await signOut(); navigate(path()) }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="eyebrow">TURAPP</span><strong>TripBuilder<span>.</span></strong></div>
        <Navigation links={links} isOrganizer={isOrganizer} path={path} />
        <div className="sidebar-footer">{own.display_name}<button onClick={logout}>Logg ut</button></div>
      </aside>
      <div className="app-main">
        <DemoBanner />
        <header className="topbar">
          <div className="topbar-brand"><span className="eyebrow">{data.trip.destination_revealed ? data.trip.destination : 'Hemmelig destinasjon'}</span><strong>{data.trip.name}</strong></div>
          <div className="topbar-actions">
            {isOrganizer && <NavLink className="text-link" to={path('admin')}>Admin</NavLink>}
            <button className="avatar" onClick={logout} title="Logg ut" aria-label="Logg ut">{own.display_name.slice(0, 1).toUpperCase()}</button>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <nav className="bottom-nav" aria-label="Hovedmeny"><Navigation links={links} isOrganizer={false} path={path} /></nav>
      </div>
    </div>
  )
}

function Navigation({ links, isOrganizer, path }) {
  return <div className="navigation">{[...links, ...(isOrganizer ? [{ to: 'admin', label: 'Admin', icon: '⚙' }] : [])].map(({ to, label, icon }) => (
    <NavLink key={to} end={to === ''} to={path(to)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
    </NavLink>
  ))}</div>
}
