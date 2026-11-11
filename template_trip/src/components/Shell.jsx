import { NavLink, useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'

const links = [
  { to: '/', label: 'Hjem', icon: '⌂' },
  { to: '/program', label: 'Program', icon: '▦' },
  { to: '/rebus', label: 'Rebus', icon: '◇' },
  { to: '/bilder', label: 'Bilder', icon: '▧' },
]

export default function Shell({ children }) {
  const { data, own, demoMode, isOrganizer, signOut, setError } = useTrip()
  const navigate = useNavigate()

  async function logout() {
    try { await signOut(); navigate('/') }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="eyebrow">ET LITE EVENTYR</span><strong>BLÅTUR<span>.</span></strong></div>
        <Navigation links={links} isOrganizer={isOrganizer} />
        <div className="sidebar-footer">{own.display_name}<button onClick={logout}>Logg ut</button></div>
      </aside>
      <div className="app-main">
        {demoMode && <div className="demo-banner">DEMOMODUS <span>Endringer er bare lagret i denne nettleseren</span></div>}
        <header className="topbar">
          <div className="topbar-brand"><span className="eyebrow">{data.trip.destination_revealed ? data.trip.destination : 'Hemmelig destinasjon'}</span><strong>{data.trip.name}</strong></div>
          <div className="topbar-actions">
            {isOrganizer && <NavLink className="text-link" to="/admin">Admin</NavLink>}
            <button className="avatar" onClick={logout} title="Logg ut" aria-label="Logg ut">{own.display_name.slice(0, 1).toUpperCase()}</button>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <nav className="bottom-nav" aria-label="Hovedmeny"><Navigation links={links} isOrganizer={false} /></nav>
      </div>
    </div>
  )
}

function Navigation({ links, isOrganizer }) {
  return <div className="navigation">{[...links, ...(isOrganizer ? [{ to: '/admin', label: 'Admin', icon: '⚙' }] : [])].map(({ to, label, icon }) => (
    <NavLink key={to} end={to === '/'} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
    </NavLink>
  ))}</div>
}
