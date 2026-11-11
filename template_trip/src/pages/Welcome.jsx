import { useState } from 'react'
import { useTrip } from '../context/TripContext.jsx'

export default function Welcome() {
  const { data, demoMode, demoLogin, join, organizerEmail, error, setError } = useTrip()
  const [mode, setMode] = useState('participant')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'organizer') { await organizerEmail(email); setSent(true) }
      else await join(name, code)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="welcome">
      <div className="welcome-panel">
        <div className="welcome-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><p className="eyebrow">ET LITE EVENTYR</p><h1>BLÅTUR<br/><em>2026.</em></h1><p>Gode venner. Nye minner.<br/>En tur å snakke om.</p><div className="welcome-foot">24 — 27 APRIL · 2026</div></div>
        <div className="welcome-form">
          <span className="eyebrow">VELKOMMEN</span>
          <h2>Din tur starter her.</h2>
          <p className="muted">Alt du trenger for turen, samlet på ett sted.</p>
          {error && <div className="notice danger" role="alert">{error}</div>}
          {demoMode ? (
            <>
              <label htmlFor="demo-member">Velg deltaker</label>
              <select id="demo-member" value={name} onChange={(e) => setName(e.target.value)}><option value="">Velg navn …</option>{data.members.map((member) => <option key={member.id} value={member.user_id}>{member.display_name}</option>)}</select>
              <button className="button primary full" disabled={!name} onClick={() => demoLogin(name)}>Gå inn på turen →</button>
              <button className="button ghost full" onClick={() => demoLogin('demo-admin')}>Se som arrangør</button>
              <p className="micro">Demomodus: ingen ekte kontoer eller data brukes.</p>
            </>
          ) : (
            <>
              <div className="segmented"><button className={mode === 'participant' ? 'chosen' : ''} onClick={() => setMode('participant')}>Deltaker</button><button className={mode === 'organizer' ? 'chosen' : ''} onClick={() => setMode('organizer')}>Arrangør</button></div>
              {sent ? <div className="notice">Vi har sendt deg en innloggingslenke. Sjekk e-posten din.</div> : (
                <form onSubmit={handleSubmit} className="form-stack">
                  {mode === 'participant' ? <><label htmlFor="name">Ditt navn</label><input id="name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} required placeholder="Fornavn"/><label htmlFor="code">Invitasjonskode</label><input id="code" type="password" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="Kode fra arrangøren"/></> : <><label htmlFor="email">E-postadresse</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="deg@eksempel.no"/></>}
                  <button className="button primary full" disabled={busy}>{busy ? 'Et øyeblikk …' : mode === 'participant' ? 'Bli med på turen →' : 'Send innloggingslenke →'}</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
