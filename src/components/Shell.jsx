import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from './DemoBanner.jsx'
import { ICON_SYMBOLS, resolveTheme, themeVars } from '../lib/theme.js'

const links = [
  { to: '', label: 'I dag', icon: '⌂' },
  { to: 'kart', label: 'Kart', icon: '◇' },
  { to: 'ledertavle', label: 'Ledertavle', icon: '★' },
  { to: 'laget', label: 'Laget', icon: '☻' },
]

export default function Shell({ children }) {
  const { data, own, isOrganizer, signOut, setError, path, offline, cachedAt, changes } = useTrip()
  const { pathname } = useLocation()
  const wide = /\/admin\/?$/.test(pathname) // Admin er bred, deltakersider er maks 480 px (UX-DR18)
  const navigate = useNavigate()

  async function logout() {
    try { await signOut(); navigate(path()) }
    catch (e) { setError(e.message) }
  }

  const theme = resolveTheme(data.trip.theme)
  const symbol = ICON_SYMBOLS[theme.icon]

  return (
    <div className="app-shell" style={themeVars(data.trip.theme)}>
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="eyebrow">TURAPP</span><strong>TripBuilder<span>.</span></strong></div>
        <Navigation links={links} isOrganizer={isOrganizer} path={path} />
        <div className="sidebar-footer">{own.display_name}<button onClick={logout}>Logg ut</button></div>
      </aside>
      <div className="app-main">
        <DemoBanner />
        <header className="topbar">
          <div className="topbar-brand"><span className="topbar-symbol" aria-hidden="true">{symbol.char}</span><div><span className="eyebrow">{data.trip.destination_revealed ? data.trip.destination : 'Hemmelig destinasjon'}</span><strong>{data.trip.name}</strong></div></div>
          <div className="topbar-actions">
            {isOrganizer && <NavLink className="text-link" to={path('admin')}>Admin</NavLink>}
            <button className="avatar" onClick={logout} title="Logg ut" aria-label="Logg ut">{own.display_name.slice(0, 1).toUpperCase()}</button>
          </div>
        </header>
        {offline && <div className="notice offline" role="status">Ingen dekning. Du ser det som sist ble lastet{cachedAt ? ` (kl. ${new Date(cachedAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })})` : ''}. Poeng og innsendinger vises ikke uten nett.</div>}
        {!isOrganizer && changes.count > 0 && <div className="notice updated-banner" role="status"><strong>Programmet er oppdatert.</strong><span className="updated-actions"><Link to={`${path()}?endret=1`} className="text-link">Se endringer</Link><button type="button" className="button small outline" onClick={changes.markAllSeen}>Merk alle som sett</button></span></div>}
        <main className={`page-content${wide ? '' : ' narrow'}`}>{children}</main>
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
