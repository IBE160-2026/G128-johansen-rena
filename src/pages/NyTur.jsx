import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import { clearRequest, emptyForm, loadForm, saveForm, validateForm } from '../lib/tripRequest.js'
import { generateTrip } from '../lib/api.js'
import { saveDraft } from '../lib/draftStore.js'

const storage = (() => { try { return window.localStorage } catch { return null } })()
const safe = storage ?? { getItem: () => null, setItem: () => { throw new Error('ingen lagring') }, removeItem: () => {} }

const STEP_LABELS = { plan: 'Planlegger turen', content: 'Lager innhold', check: 'Kontrollerer utkastet' }
const STEPS = Object.keys(STEP_LABELS)

// Story 2.2: skjema for en ny tur. Story 2.3: generering med mock-agenten.
export default function NyTur() {
  const { isOrganizer } = useTrip()
  const [form, setForm] = useState(() => loadForm(safe))
  const [request, setRequest] = useState(null)
  const [errors, setErrors] = useState({})
  const [hint, setHint] = useState('')
  const [phase, setPhase] = useState('form') // form | working | failed
  const [step, setStep] = useState('plan')
  const [failure, setFailure] = useState('generic') // generic | storage
  const refs = useRef({})
  const abortRef = useRef(null)
  const navigate = useNavigate()
  const { search } = useLocation()
  useEffect(() => () => { abortRef.current?.abort(); abortRef.current = null }, []) // forlater arrangøren siden, avbrytes genereringen
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
    setRequest(result.request)
    generate(result.request)
  }

  async function generate(req) {
    if (abortRef.current) return // en generering pågår allerede
    const controller = new AbortController()
    abortRef.current = controller
    setStep('plan')
    setPhase('working')
    try {
      const fail = new URLSearchParams(search).get('mock') === 'feil'
      const result = await generateTrip(req, { signal: controller.signal, onStep: setStep, fail })
      if (controller.signal.aborted) { abortRef.current = null; return }
      if (result.ok) {
        if (saveDraft(safe, req, result.draft)) {
          clearRequest(safe)
          saveForm(safe, emptyForm())
          abortRef.current = null
          navigate('/utkast')
          return
        }
        setFailure('storage') // utkastet ble laget, men nettleseren kunne ikke lagre det
      } else {
        setFailure('generic')
      }
      abortRef.current = null
      setPhase('failed')
    } catch (error) {
      abortRef.current = null
      if (error?.name === 'AbortError') return
      console.warn('Generering feilet', error)
      setFailure('generic')
      setPhase('failed')
    }
  }

  function cancel() { // Avbryt under generering: beskrivelsen er uendret lagret
    abortRef.current?.abort()
    abortRef.current = null
    setPhase('form')
  }

  function backToForm() {
    clearRequest(safe)
    setRequest(null)
    setPhase('form')
  }

  const props = (field) => ({
    id: `nytur-${field}`,
    value: form[field],
    ref: (el) => { refs.current[field] = el },
    onChange: (e) => change(field, e.target.value),
    ...(errors[field] ? { 'aria-invalid': true, 'aria-describedby': `nytur-${field}-error` } : {}),
  })
  const Err = ({ field }) => (errors[field] ? <p className="field-error" id={`nytur-${field}-error`} role="alert">{errors[field]}</p> : null)

  if (phase === 'working') {
    const current = STEPS.indexOf(step)
    return (
      <>
        <DemoBanner />
        <main className="start">
          <div className="start-panel">
            <span className="eyebrow">NY TUR</span>
            <h1>Genererer</h1>
            <ol className="progress-steps surface" role="status" aria-live="polite">
              {STEPS.map((s, i) => (
                <li key={s} className={i === current ? 'active' : i < current ? 'done' : ''} {...(i === current ? { 'aria-current': 'step' } : {})}>
                  <span aria-hidden="true">{i < current ? '✓' : i + 1}</span>
                  {STEP_LABELS[s]}
                  <small>{i < current ? ' (ferdig)' : i === current ? ' (pågår nå)' : ' (venter)'}</small>
                </li>
              ))}
            </ol>
            <p className="muted">Demo: KI-en er simulert, og destinasjonen er alltid prøveturens</p>
            <button type="button" className="button gold role-button" disabled>Lag utkast</button>
            <button type="button" className="button role-button outline" onClick={cancel}>Avbryt</button>
          </div>
        </main>
      </>
    )
  }

  if (phase === 'failed') {
    return (
      <>
        <DemoBanner />
        <main className="start">
          <div className="start-panel">
            <span className="eyebrow">NY TUR</span>
            <h1>Utkastet ble ikke laget</h1>
            <p role="alert">{failure === 'storage' ? 'Utkastet ble laget, men nettleseren fikk ikke lagret det. Frigjør plass i nettleseren eller prøv en annen nettleser. Beskrivelsen din er beholdt.' : 'Noe gikk galt da vi lagde utkastet. Beskrivelsen din er lagret, så du kan prøve igjen.'}</p>
            {failure !== 'storage' && <button type="button" className="button gold role-button" onClick={() => generate(request)}>Prøv igjen</button>}
            <button type="button" className="button role-button outline" onClick={backToForm}>Rediger beskrivelsen</button>
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
            <button type="submit" className="button gold role-button" disabled={phase !== 'form'}>Lag utkast</button>
          </form>
          <Link className="text-link" to="/mine-turer">Til Mine turer</Link>
        </div>
      </main>
    </>
  )
}
