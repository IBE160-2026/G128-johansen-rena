import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import { loadPublished } from '../lib/api.js'
import { tripPath } from '../lib/core.js'

const storage = (() => { try { return window.localStorage } catch { return null } })()

// Story 2.7: delingssiden for en publisert tur i demo-modus.
export default function Del() {
  const { isOrganizer } = useTrip()
  const { slug } = useParams()
  const published = useMemo(() => loadPublished(storage, slug), [slug])
  const trip = published?.trip ?? null
  const link = trip ? `${window.location.origin}${tripPath(trip.slug)}?kode=${encodeURIComponent(trip.join_code)}` : ''
  const [qr, setQr] = useState({ link: '', url: '', failed: false })
  const [copied, setCopied] = useState('') // '' | ok | failed

  // QR-koden lages i nettleseren. Ingenting sendes ut.
  useEffect(() => {
    if (!link) return undefined
    let active = true
    QRCode.toDataURL(link, { width: 480, margin: 4, errorCorrectionLevel: 'M' })
      .then((url) => { if (active) setQr({ link, url, failed: false }) })
      .catch(() => { if (active) setQr({ link, url: '', failed: true }) })
    return () => { active = false }
  }, [link])

  if (!isOrganizer) return <Navigate to="/" replace />

  async function copy() {
    setCopied('')
    try { await navigator.clipboard.writeText(link); setCopied('ok') }
    catch { setCopied('failed') } // utklippstavlen finnes ikke over http på LAN-IP, eller tilgangen er nektet
  }

  if (!trip) {
    return (
      <>
        <DemoBanner />
        <main className="start">
          <div className="start-panel">
            <h1>Fant ikke turen.</h1>
            <p>Sjekk adressen, eller finn turen i Mine turer.</p>
            <Link className="text-link" to="/mine-turer">Til Mine turer</Link>
          </div>
        </main>
      </>
    )
  }

  const current = qr.link === link ? qr : null

  return (
    <>
      <DemoBanner />
      <main className="start">
        <div className="start-panel">
          <span className="eyebrow">DEL TUREN</span>
          <h1>{trip.name}</h1>
          <p role="status">Turen er publisert.</p>
          <section className="surface share-card">
            <h2>Turkode</h2>
            <p className="share-code">{trip.join_code}</p>
            <h2>Lenke</h2>
            <p className="share-link">{link}</p>
            <button type="button" className="button outline role-button" onClick={copy}>Kopier lenke</button>
            {copied === 'ok' && <p className="save-status" role="status">Lenken er kopiert.</p>}
            {copied === 'failed' && <p className="field-error" role="alert">Kunne ikke kopiere. Marker lenken over og kopier den selv.</p>}
            {current?.url && <img className="share-qr" src={current.url} width="240" height="240" alt={`QR-kode med lenken til turen ${trip.name}`} />}
            {current?.failed && <p className="field-error" role="alert">Kunne ikke lage QR-koden. Bruk lenken i stedet.</p>}
          </section>
          <p className="muted">I demo spilles turen med fiktive deltakere ({published.members.length}) i denne nettleseren. Deltakere på egne telefoner kommer først med innlogging og Supabase.</p>
          <Link className="button gold role-button" to={tripPath(trip.slug)}>Åpne turen</Link>
          <Link className="text-link" to="/mine-turer">Til Mine turer</Link>
        </div>
      </main>
    </>
  )
}
