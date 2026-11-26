import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { loadDraft, saveDraft } from '../lib/draftStore.js'
import { areaError, draftErrors, updateArea, updateElement } from '../lib/draftEdit.js'
import { formatDate } from '../lib/core.js'
import { pointsFromInput } from '../lib/validate.js'

const storage = (() => { try { return window.localStorage } catch { return null } })()
const safe = storage ?? { getItem: () => null, setItem: () => { throw new Error('ingen lagring') } }

const TABS = [['program', 'Program'], ['poster', 'Poster'], ['lag', 'Lag'], ['poeng', 'Poeng']]
const decimal = (text) => (String(text).trim() === '' ? NaN : Number(String(text).trim().replace(',', '.')))
const same = (a, b) => a === b || (Number.isNaN(a) && Number.isNaN(b))

/** Tekstfelt med feil ved feltet (rød kant, aria-invalid, melding). */
function Field({ id, label, errors = [], children }) {
  const message = errors[0]?.message
  return (
    <div className="draft-field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': message ? true : undefined, 'aria-describedby': message ? `${id}-error` : undefined })}
      {message && <p className="field-error" id={`${id}-error`}>{message}</p>}
    </div>
  )
}

/** Tallfelt som husker teksten mens man skriver, og melder tallet (NaN når teksten ikke er et tall). */
function NumField({ id, label, value, parse, onValue, errors, inputMode = 'decimal' }) {
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : '')
  useEffect(() => { if (!same(parse(text), value)) setText(Number.isFinite(value) ? String(value) : '') }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Field id={id} label={label} errors={errors}>
      {(aria) => <input {...aria} type="text" inputMode={inputMode} value={text} onChange={(e) => { setText(e.target.value); onValue(parse(e.target.value)) }} />}
    </Field>
  )
}

function AreaFields({ area, onArea, general }) {
  const [texts, setTexts] = useState({ lat: String(area.center.lat), lng: String(area.center.lng), radius: String(area.radius_m) })
  const [error, setError] = useState('')
  function change(key, value) {
    const next = { ...texts, [key]: value }
    setTexts(next)
    const candidate = { center: { lat: decimal(next.lat), lng: decimal(next.lng) }, radius_m: decimal(next.radius) }
    const problem = areaError(candidate)
    setError(problem ?? '')
    if (!problem) onArea(candidate)
  }
  const msg = error || general.find((g) => g.path.startsWith('trip.area'))?.message
  return (
    <fieldset className="surface draft-area">
      <legend>Turens område</legend>
      <div className="draft-fields">
        {[['lat', 'Bredde (midtpunkt)'], ['lng', 'Lengde (midtpunkt)'], ['radius', 'Radius (meter)']].map(([key, label]) => (
          <Field key={key} id={`area-${key}`} label={label} errors={msg ? [{ message: msg }] : []}>
            {(aria) => <input {...aria} type="text" inputMode="decimal" value={texts[key]} onChange={(e) => change(key, e.target.value)} />}
          </Field>
        ))}
      </div>
      {msg && <p className="muted">Ugyldig område lagres ikke. Det forrige området beholdes.</p>}
    </fieldset>
  )
}

export default function Utkast() {
  const { isOrganizer } = useTrip()
  const [stored] = useState(() => loadDraft(safe))
  const [draft, setDraft] = useState(stored?.draft ?? null)
  const draftRef = useRef(draft)
  const [saved, setSaved] = useState('')
  const [tab, setTab] = useState('program')
  const [selected, setSelected] = useState(null)

  if (!isOrganizer) return <Navigate to="/" replace />

  if (!draft) {
    return (
      <>
        <DemoBanner />
        <main className="start">
          <div className="start-panel">
            <span className="eyebrow">UTKAST</span>
            <h1>Ingen utkast ennå.</h1>
            <Link className="button gold role-button" to="/ny-tur">Lag en ny tur</Link>
          </div>
        </main>
      </>
    )
  }

  /** Alle endringer går hit: nytt utkast i visningen og lagret med en gang. */
  function apply(next) {
    if (next === draftRef.current) return
    draftRef.current = next
    setDraft(next)
    setSaved(saveDraft(safe, stored.request, next, new Date(stored.created_at ?? Date.now())) ? 'Lagret' : 'Kunne ikke lagre')
  }
  const edit = (section, id, patch) => apply(updateElement(draftRef.current, section, id, patch))

  const { trip } = draft
  const items = draft.program_items
  const checkpoints = draft.checkpoints
  const teams = draft.teams
  const errors = draftErrors(draft)
  const errorsFor = (id, ...fields) => (errors.byId[id] ?? []).filter((e) => fields.includes(e.field))
  // Feil på felt som ikke har et eget inputfelt vises likevel, så tallet «N ting må rettes» alltid har noe å peke på
  const leftover = (id, shown) => {
    const rest = (errors.byId[id] ?? []).filter((e) => !shown.includes(e.field))
    return rest.length ? <ul className="draft-leftover">{rest.map((e, i) => <li key={i} className="field-error">{e.message}</li>)}</ul> : null
  }
  const period = `${formatDate(trip.start_date, { day: 'numeric', month: 'long' })} – ${formatDate(trip.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}`
  const selectedPost = checkpoints.find((cp) => cp.id === selected) ?? checkpoints[0] ?? null

  const text = (section, el, field, label, extra = {}) => (
    <Field id={`${el.id}-${field}`} label={label} errors={errorsFor(el.id, field)}>
      {(aria) => extra.multiline
        ? <textarea {...aria} rows={2} value={el[field] ?? ''} onChange={(e) => edit(section, el.id, { [field]: e.target.value })} />
        : <input {...aria} type={extra.type ?? 'text'} value={el[field] ?? ''} onChange={(e) => edit(section, el.id, { [field]: e.target.value })} />}
    </Field>
  )
  const pointsField = (cp) => (
    <NumField id={`${cp.id}-points`} label="Poeng (1 til 500)" value={cp.points} parse={pointsFromInput} inputMode="numeric"
      onValue={(v) => edit('checkpoints', cp.id, { points: v })} errors={errorsFor(cp.id, 'points')} />
  )

  const programPanel = (
    <ul className="draft-list">
      {items.map((item) => ( // stabil rekkefølge (som utkastet), så et kort ikke hopper mens datoen eller klokkeslettet endres
        <li key={item.id} className="surface draft-card">
          {text('program_items', item, 'title', 'Tittel')}
          {text('program_items', item, 'description', 'Beskrivelse', { multiline: true })}
          <div className="draft-fields">
            {text('program_items', item, 'event_date', 'Dato', { type: 'date' })}
            {text('program_items', item, 'start_time', 'Klokkeslett', { type: 'time' })}
          </div>
          {leftover(item.id, ['title', 'description', 'event_date', 'start_time'])}
        </li>
      ))}
    </ul>
  )

  const postPanel = (
    <>
      <AreaFields area={trip.area} general={errors.general} onArea={(area) => apply(updateArea(draftRef.current, area))} />
      <ul className="draft-list">
        {checkpoints.map((cp) => (
          <li key={cp.id} className={`surface draft-card${selectedPost?.id === cp.id ? ' selected' : ''}`} onFocusCapture={() => setSelected(cp.id)}>
            <h3>{cp.position ? `${cp.position}. ` : ''}{cp.title || 'Post uten tittel'}</h3>
            {text('checkpoints', cp, 'title', 'Tittel')}
            {text('checkpoints', cp, 'description', 'Beskrivelse', { multiline: true })}
            <div className="draft-fields">
              {pointsField(cp)}
              <NumField id={`${cp.id}-radius_m`} label="Radius (meter)" value={cp.radius_m} parse={decimal} onValue={(v) => edit('checkpoints', cp.id, { radius_m: v })} errors={errorsFor(cp.id, 'radius_m')} />
            </div>
            <label className="form-check">
              <input type="checkbox" checked={cp.requires_location === true} onChange={(e) => edit('checkpoints', cp.id, { requires_location: e.target.checked })} />
              Krever at laget er på stedet
            </label>
            <div className="draft-fields">
              <NumField id={`${cp.id}-latitude`} label="Bredde" value={cp.latitude} parse={decimal} onValue={(v) => edit('checkpoints', cp.id, { latitude: v })} errors={errorsFor(cp.id, 'latitude', 'position')} />
              <NumField id={`${cp.id}-longitude`} label="Lengde" value={cp.longitude} parse={decimal} onValue={(v) => edit('checkpoints', cp.id, { longitude: v })} errors={errorsFor(cp.id, 'longitude')} />
            </div>
            {leftover(cp.id, ['title', 'description', 'points', 'radius_m', 'latitude', 'longitude', 'position'])}
            <button type="button" className="button outline small" onClick={() => setSelected(cp.id)}>Vis på kartet</button>
          </li>
        ))}
      </ul>
    </>
  )

  const teamPanel = (
    <ul className="draft-list">
      {teams.map((team) => (
        <li key={team.id} className="surface draft-card">
          <div className="draft-fields">
            {text('teams', team, 'emoji', 'Emoji')}
            {text('teams', team, 'name', 'Lagnavn')}
          </div>
          {leftover(team.id, ['emoji', 'name'])}
        </li>
      ))}
    </ul>
  )

  const pointsPanel = (
    <ul className="draft-list surface">
      {checkpoints.map((cp) => (
        <li key={cp.id} className="draft-points-row"><span className="draft-points-title">{cp.position ? `${cp.position}. ` : ''}{cp.title || 'Post uten tittel'}</span>{pointsField(cp)}</li>
      ))}
    </ul>
  )

  const panels = { program: programPanel, poster: postPanel, lag: teamPanel, poeng: pointsPanel }
  const hasMap = tab === 'poster' && selectedPost

  return (
    <>
      <DemoBanner />
      <main className="start draft-view">
        <div className="start-panel draft-panel">
          <span className="eyebrow">UTKAST</span>
          <h1>{trip.name}</h1>
          <p className="muted">Demo: KI-en er simulert, og destinasjonen er alltid prøveturens. Endringer lagres med en gang.</p>
          <dl className="request-summary surface">
            <dt>Periode</dt><dd>{period}</dd>
            {stored.request?.participant_count > 0 && <><dt>Deltakere</dt><dd>{stored.request.participant_count}</dd></>}
            <dt>Lag</dt><dd>{teams.length}</dd>
            <dt>Poster</dt><dd>{checkpoints.length}</dd>
          </dl>

          <div className="draft-status surface">
            {errors.count > 0
              ? <p className="field-error draft-count">{errors.count} ting må rettes før publisering</p>
              : <p className="draft-count draft-ok">Utkastet er klart for publisering</p>}
            {errors.general.length > 0 && <ul className="draft-general">{errors.general.map((g, i) => <li key={`${g.path}-${i}`} className="field-error">{g.message}</li>)}</ul>}
            <div className="draft-actions">
              <button type="button" className="button gold" disabled>Publiser</button>
              <p className="save-status" role="status">{saved}</p>
            </div>
            {errors.count === 0 && <p className="muted">Publisering kommer i neste steg</p>}
          </div>

          <div role="tablist" aria-label="Utkast" className="draft-tabs">
            {TABS.map(([key, label]) => (
              <button key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>
          <div className={`draft-grid${hasMap ? ' has-map' : ''}`}>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="draft-content">{panels[tab]}</div>
            {hasMap && (
              <div className="draft-map surface">
                <h3>{selectedPost.title || 'Post uten tittel'}</h3>
                <LocationPicker key={`${selectedPost.id}-${trip.area.center.lat}-${trip.area.center.lng}-${trip.area.radius_m}`} lat={selectedPost.latitude} lng={selectedPost.longitude} radius={selectedPost.radius_m} area={trip.area}
                  onPick={({ lat, lng }) => edit('checkpoints', selectedPost.id, { latitude: lat, longitude: lng })} />
              </div>
            )}
          </div>
          <Link className="text-link" to="/mine-turer">Til Mine turer</Link>
        </div>
      </main>
    </>
  )
}
