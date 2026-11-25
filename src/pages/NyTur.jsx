import { useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import { clearRequest, emptyForm, loadForm, loadRequest, saveForm, saveRequest, validateForm } from '../lib/tripRequest.js'
import { formatDate } from '../lib/core.js'

const storage = (() => { try { return window.localStorage } catch { return null } })()
const safe = storage ?? { getItem: () => null, setItem: () => { throw new Error('ingen lagring') }, removeItem: () => {} }

// Story 2.2: skjema for en ny tur. Genereringen kommer i Story 2.3.
export default function NyTur() {
  const { isOrganizer } = useTrip()
  const [form, setForm] = useState(() => loadForm(safe))
  const [request, setRequest] = useState(() => loadRequest(safe))
  const [errors, setErrors] = useState({})
  const [hint, setHint] = useState('')
  const refs = useRef({})
  if (!isOrganizer) return <Navigate to="/" replace />

  function change(field, value) {
    const next = { ...form, [field]: value }
    setForm(next)
    saveForm(safe, next)
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: undefined })) // en gammel feil gjelder ikke en ny verdi
    if (field === 'description') setHint('')
  }

  function submit(event) {
    event.preventDefault()
    const result = validateForm(form)
    setErrors(result.errors)
    setHint(result.hint)
    if (!result.request) {
      refs.current[result.firstInvalid]?.focus()
      return
    }
    saveRequest(safe, result.request)
    setRequest(result.request)
  }

  function edit() {
    clearRequest(safe)
    setRequest(null)
  }

  function startOver() { // tom skjema for en annen tur
    clearRequest(safe)
    saveForm(safe, emptyForm())
    setForm(emptyForm())
    setErrors({})
    setHint('')
    setRequest(null)
  }

  const props = (field) => ({
    id: `nytur-${field}`,
    value: form[field],
    ref: (el) => { refs.current[field] = el },
    onChange: (e) => change(field, e.target.value),
    ...(errors[field] ? { 'aria-invalid': true, 'aria-describedby': `nytur-${field}-error` } : {}),
  })
  const Err = ({ field }) => (errors[field] ? <p className="field-error" id={`nytur-${field}-error`} role="alert">{errors[field]}</p> : null)

  if (request) {
    const period = `${formatDate(request.start_date, { day: 'numeric', month: 'long' })} – ${formatDate(request.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}`
    return (
      <>
        <DemoBanner />
        <main className="start">
          <div className="start-panel">
            <span className="eyebrow">NY TUR</span>
            <h1>Beskrivelsen er klar</h1>
            <dl className="request-summary surface">
              <dt>Destinasjon</dt><dd>{request.destination}</dd>
              <dt>Periode</dt><dd>{period}</dd>
              <dt>Deltakere</dt><dd>{request.participant_count}</dd>
              {request.team_count && <><dt>Lag</dt><dd>{request.team_count}</dd></>}
              {request.post_count && <><dt>Antall poster</dt><dd>{request.post_count}</dd></>}
              <dt>Beskrivelse</dt><dd>{request.description}</dd>
            </dl>
            <button type="button" className="button role-button" onClick={edit}>Rediger beskrivelsen</button>
            <button type="button" className="button role-button outline" onClick={startOver}>Start på nytt</button>
            <p className="muted">Utkastet lages i neste steg.</p>
            <Link className="text-link" to="/mine-turer">Til Mine turer</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <DemoBanner />
      <main className="start">
        <div className="start-panel">
          <span className="eyebrow">NY TUR</span>
          <h1>Ny tur</h1>
          <form className="form-stack new-trip-form" onSubmit={submit} noValidate>
            <label htmlFor="nytur-destination">Destinasjon *</label>
            <input type="text" autoComplete="off" {...props('destination')} />
            {Err({ field: 'destination' })}
            <div className="form-columns">
              <div>
                <label htmlFor="nytur-start_date">Fra *</label>
                <input type="date" {...props('start_date')} />
                {Err({ field: 'start_date' })}
              </div>
              <div>
                <label htmlFor="nytur-end_date">Til *</label>
                <input type="date" {...props('end_date')} />
                {Err({ field: 'end_date' })}
              </div>
            </div>
            <label htmlFor="nytur-participant_count">Deltakere *</label>
            <input type="text" inputMode="numeric" {...props('participant_count')} />
            {Err({ field: 'participant_count' })}
            <div className="form-columns">
              <div>
                <label htmlFor="nytur-team_count">Lag (valgfritt)</label>
                <input type="text" inputMode="numeric" {...props('team_count')} />
                {Err({ field: 'team_count' })}
              </div>
              <div>
                <label htmlFor="nytur-post_count">Antall poster (valgfritt)</label>
                <input type="text" inputMode="numeric" {...props('post_count')} />
                {Err({ field: 'post_count' })}
              </div>
            </div>
            <label htmlFor="nytur-description">Beskrivelse *</label>
            <textarea rows={8} {...props('description')} {...(hint && !errors.description ? { 'aria-describedby': 'nytur-description-hint' } : {})} />
            {Err({ field: 'description' })}
            {hint && !errors.description && <p className="field-hint" id="nytur-description-hint" role="status">{hint}</p>}
            <button type="submit" className="button gold role-button">Lag utkast</button>
          </form>
          <Link className="text-link" to="/mine-turer">Til Mine turer</Link>
        </div>
      </main>
    </>
  )
}
