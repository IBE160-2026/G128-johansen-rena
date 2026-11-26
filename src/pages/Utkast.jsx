import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { clearDraft, isCurrentDraft, loadDraft, saveDraft } from '../lib/draftStore.js'
import { canPublish, publishDraft } from '../lib/api.js'
import { areaError, draftErrors, updateArea, updateElement, updateTheme } from '../lib/draftEdit.js'
import { formatDate } from '../lib/core.js'
import { pointsFromInput, THEME_ACCENTS, THEME_ICONS } from '../lib/validate.js'
import { ACCENT_COLORS, ICON_SYMBOLS, resolveTheme, themeVars } from '../lib/theme.js'

const storage = (() => { try { return window.localStorage } catch { return null } })()
const safe = storage ?? { getItem: () => null, setItem: () => { throw new Error('ingen lagring') } }

const TABS = [['program', 'Program'], ['poster', 'Poster'], ['lag', 'Lag'], ['poeng', 'Poeng'], ['tema', 'Tema']]
const STALE_DRAFT = 'Utkastet er publisert eller byttet ut i en annen fane. Last siden på nytt.'
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

function AreaFields({ area, onArea, onProblem, general }) {
  const [texts, setTexts] = useState({ lat: String(area.center.lat), lng: String(area.center.lng), radius: String(area.radius_m) })
  const [error, setError] = useState('')
  function change(key, value) {
    const next = { ...texts, [key]: value }
    setTexts(next)
    const candidate = { center: { lat: decimal(next.lat), lng: decimal(next.lng) }, radius_m: decimal(next.radius) }
    const problem = areaError(candidate)
    setError(problem ?? '')
    onProblem(Boolean(problem))
    if (!problem) onArea(candidate)
  }
  useEffect(() => () => onProblem(false), []) // eslint-disable-line react-hooks/exhaustive-deps -- feltene fylles på nytt neste gang
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
  const [publishError, setPublishError] = useState('')
  const [areaPending, setAreaPending] = useState(false)
  const navigate = useNavigate()

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
    // en gammel fane skal ikke lagre et lukket utkast på nytt eller skrive over et nytt
    if (!isCurrentDraft(safe, stored.created_at)) { setPublishError(STALE_DRAFT); return }
    draftRef.current = next
    setDraft(next)
    setPublishError('')
    setSaved(saveDraft(safe, stored.request, next, new Date(stored.created_at ?? Date.now())) ? 'Lagret' : 'Kunne ikke lagre')
  }
  /** Publiserer etter bekreftelse. Utkastet tømmes først når turen er lagret. */
  function publish() {
    if (!canPublish(draftRef.current)) return
    if (!window.confirm('Publisere turen? Den får turkode, lenke og QR-kode (i demo virker de bare i denne nettleseren), og utkastet lukkes. Du kan ikke angre publiseringen.')) return
    if (!isCurrentDraft(safe, stored.created_at)) { setPublishError(STALE_DRAFT); return } // sjekkes etter bekreftelsen
    const result = publishDraft(safe, draftRef.current, stored.request)
    if (!result.ok) {
      setPublishError(result.error === 'STORAGE_FAILED'
        ? 'Turen kunne ikke lagres. Lagringen i nettleseren kan være full eller sperret. Fjern noen bilder i demoen og prøv igjen. Utkastet ditt er beholdt.'
        : 'Turen kunne ikke publiseres. Prøv igjen. Utkastet ditt er beholdt.')
      return
    }
    clearDraft(safe)
    navigate(`/del/${result.data.trip.slug}`, { replace: true })
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
      <AreaFields area={trip.area} onProblem={setAreaPending} general={errors.general} onArea={(area) => apply(updateArea(draftRef.current, area))} />
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

  const current = resolveTheme(trip.theme)
  const rawTheme = trip.theme !== null && typeof trip.theme === 'object' ? trip.theme : {}
  const themeValid = THEME_ACCENTS.includes(rawTheme.accent) && THEME_ICONS.includes(rawTheme.icon)
  const themeMissing = trip.theme === undefined
  // et halvt tema beholder den gyldige delen; resten fylles med standardtemaet
  const base = { accent: THEME_ACCENTS.includes(rawTheme.accent) ? rawTheme.accent : current.accent, icon: THEME_ICONS.includes(rawTheme.icon) ? rawTheme.icon : current.icon }
  const pick = (patch) => apply(updateTheme(draftRef.current, { ...base, ...patch }))
  const themePanel = (
    <>
      <div className="theme-preview" style={themeVars(current)} aria-label="Forhåndsvisning av toppen på deltakersiden">
        <span className="topbar-symbol" aria-hidden="true">{ICON_SYMBOLS[current.icon].char}</span>
        <div><span className="eyebrow">{trip.destination_revealed === false ? 'Hemmelig destinasjon' : (trip.destination ?? 'Destinasjon')}</span><strong>{trip.name || 'Uten navn'}</strong></div>
      </div>
      {themeMissing && <p className="muted">Utkastet har ikke valgt tema ennå, så standardtemaet brukes.</p>}
      {!themeValid && !themeMissing && <p className="field-error">Temaet i utkastet er ugyldig. Velg en aksentfarge og et symbol.</p>}
      <fieldset className="surface theme-group">
        <legend>Aksentfarge</legend>
        <div className="theme-options">
          {THEME_ACCENTS.map((key) => {
            const on = (themeValid || themeMissing) && current.accent === key
            return (
              <button key={key} type="button" className={`theme-option${on ? ' selected' : ''}`} aria-pressed={on} onClick={() => pick({ accent: key })}>
                <span className="theme-swatch" style={{ background: ACCENT_COLORS[key].primary }} aria-hidden="true" />
                <span>{ACCENT_COLORS[key].label}</span>
                {on && <span className="theme-chosen">Valgt</span>}
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset className="surface theme-group">
        <legend>Symbol</legend>
        <div className="theme-options">
          {THEME_ICONS.map((key) => {
            const on = (themeValid || themeMissing) && current.icon === key
            return (
              <button key={key} type="button" className={`theme-option${on ? ' selected' : ''}`} aria-pressed={on} onClick={() => pick({ icon: key })}>
                <span className="theme-char" aria-hidden="true">{ICON_SYMBOLS[key].char}</span>
                <span>{ICON_SYMBOLS[key].label}</span>
                {on && <span className="theme-chosen">Valgt</span>}
              </button>
            )
          })}
        </div>
      </fieldset>
    </>
  )

  const panels = { program: programPanel, poster: postPanel, lag: teamPanel, poeng: pointsPanel, tema: themePanel }
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
              : areaPending
                ? <p className="field-error draft-count">Rett området før publisering</p>
                : <p className="draft-count draft-ok">Utkastet er klart for publisering</p>}
            {errors.general.length > 0 && <ul className="draft-general">{errors.general.map((g, i) => <li key={`${g.path}-${i}`} className="field-error">{g.message}</li>)}</ul>}
            <div className="draft-actions">
              <button type="button" className="button gold" disabled={!canPublish(draft) || areaPending} onClick={publish}>Publiser</button>
              <p className="save-status" role="status">{saved}</p>
            </div>
            {publishError && <p className="field-error" role="alert">{publishError}</p>}
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
