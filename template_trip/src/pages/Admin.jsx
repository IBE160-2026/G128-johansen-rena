import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTrip } from '../context/TripContext.jsx'
import { formatDate, sortEvents } from '../lib/core.js'

const tabs = [['overview', 'Oversikt'], ['program', 'Program'], ['checkpoints', 'Rebusposter'], ['teams', 'Lag'], ['inbox', 'Innsendinger']]

export default function Admin() {
  const { data, isOrganizer, leaderboard, updateTrip, write, destroy, review, resetDemo, demoMode, setError } = useTrip()
  const [tab, setTab] = useState('overview')
  const [working, setWorking] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [focusedSubmission, setFocusedSubmission] = useState(null)
  const [eventForm, setEventForm] = useState({ event_date: data.trip.start_date, start_time: '12:00', title: '', description: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', points: '10', latitude: '', longitude: '' })
  const [announcement, setAnnouncement] = useState(data.trip.announcement ?? '')

  if (!isOrganizer) return <div className="page-stack"><h1>Ingen tilgang</h1><p>Dette området er kun for arrangøren.</p><Link to="/">Gå tilbake</Link></div>

  async function perform(action) {
    setWorking(true)
    try { await action(); setError('') }
    catch (err) { setError(err.message) }
    finally { setWorking(false) }
  }

  function startProgram(event) {
    setEditingProgram(event.id)
    setEventForm({ event_date: event.event_date, start_time: event.start_time.slice(0, 5), title: event.title, description: event.description ?? '' })
  }

  function startTask(task) {
    setEditingTask(task.id)
    setTaskForm({ title: task.title, description: task.description ?? '', points: String(task.points), latitude: String(task.latitude), longitude: String(task.longitude) })
  }

  async function saveProgram(e) {
    e.preventDefault()
    await perform(async () => {
      await write('program', eventForm, editingProgram)
      setEditingProgram(null)
      setEventForm({ event_date: data.trip.start_date, start_time: '12:00', title: '', description: '' })
    })
  }

  async function saveTask(e) {
    e.preventDefault()
    await perform(async () => {
      await write('checkpoints', {
        ...taskForm, points: Number(taskForm.points), latitude: Number(taskForm.latitude), longitude: Number(taskForm.longitude),
        position: editingTask ? data.checkpoints.find((x) => x.id === editingTask)?.position : data.checkpoints.length + 1,
      }, editingTask)
      setEditingTask(null)
      setTaskForm({ title: '', description: '', points: '10', latitude: '', longitude: '' })
    })
  }

  const pending = data.submissions.filter((submission) => submission.status === 'pending')

  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">ARRANGØRPANELET</span><h1>Administrasjon<span className="copper-dot">.</span></h1><p>Styr program, lag og rebus fra ett sted.</p></div>
    <div className="admin-tabs">{tabs.map(([key, title]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{title}{key === 'inbox' && pending.length ? <b>{pending.length}</b> : null}</button>)}</div>

    {tab === 'overview' && <div className="page-stack">
      <div className="stat-grid"><div className="stat-card"><span className="eyebrow">DELTAKERE</span><strong>{data.members.length}</strong></div><div className="stat-card"><span className="eyebrow">LAG</span><strong>{data.teams.length}</strong></div><div className="stat-card"><span className="eyebrow">VENTER PÅ SVAR</span><strong>{pending.length}</strong></div></div>
      <section className="surface"><div className="section-title"><div><span className="eyebrow">TURINNSTILLINGER</span><h3>Informasjon til deltakerne</h3></div></div>
        <form className="form-stack" onSubmit={(e) => { e.preventDefault(); perform(() => updateTrip({ announcement })) }}><label htmlFor="announcement">Felles beskjed</label><textarea id="announcement" rows="3" maxLength="500" value={announcement} onChange={(e) => setAnnouncement(e.target.value)}/><button className="button primary" disabled={working}>Lagre beskjed</button></form>
        <div className="settings-row"><span><strong>Vis destinasjon</strong><small>Avslør byen for alle deltakere</small></span><button className={`button small ${data.trip.destination_revealed ? 'primary' : 'outline'}`} disabled={working} onClick={() => perform(() => updateTrip({ destination_revealed: !data.trip.destination_revealed }))}>{data.trip.destination_revealed ? 'Synlig ✓' : 'Hemmelig'}</button></div>
        {demoMode && <div className="settings-row"><span><strong>Nullstill demo</strong><small>Sletter lokale demoendringer i denne nettleseren</small></span><button className="button small danger-button" onClick={() => { if (window.confirm('Nullstille demoen?')) resetDemo() }}>Nullstill</button></div>}
      </section>
      <section className="surface"><div className="section-title"><h3>Stillingen</h3></div>{leaderboard.map((team) => <div className="admin-row" key={team.id}><span>{team.emoji} {team.name}</span><strong>{team.points} p</strong></div>)}</section>
    </div>}

    {tab === 'program' && <div className="split-admin"><section className="surface"><span className="eyebrow">{editingProgram ? 'REDIGER' : 'NYTT PUNKT'}</span><h3>{editingProgram ? 'Rediger aktivitet' : 'Legg til aktivitet'}</h3><form className="form-stack" onSubmit={saveProgram}><label htmlFor="event-date">Dato</label><input id="event-date" type="date" min={data.trip.start_date} max={data.trip.end_date} required value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}/><label htmlFor="event-time">Tid</label><input id="event-time" type="time" required value={eventForm.start_time} onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}/><label htmlFor="event-title">Tittel</label><input id="event-title" required maxLength="120" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}/><label htmlFor="event-description">Beskrivelse</label><textarea id="event-description" rows="3" maxLength="1000" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}/><button className="button primary" disabled={working}>{editingProgram ? 'Lagre endringer' : 'Legg til'}</button>{editingProgram && <button type="button" className="button ghost" onClick={() => { setEditingProgram(null); setEventForm({ event_date: data.trip.start_date, start_time: '12:00', title: '', description: '' }) }}>Avbryt</button>}</form></section>
      <section className="surface"><h3>Programmet</h3>{sortEvents(data.program).map((event) => <div className="admin-row" key={event.id}><div><small>{formatDate(event.event_date)} · {event.start_time.slice(0, 5)}</small><strong>{event.title}</strong></div><div className="row-buttons"><button onClick={() => startProgram(event)}>Rediger</button><button className="delete" disabled={working} onClick={() => { if (window.confirm('Slette punktet?')) perform(() => destroy('program', event.id)) }}>Slett</button></div></div>)}</section></div>}

    {tab === 'checkpoints' && <div className="split-admin"><section className="surface"><span className="eyebrow">{editingTask ? 'REDIGER' : 'NY POST'}</span><h3>{editingTask ? 'Rediger rebuspost' : 'Legg til rebuspost'}</h3><form className="form-stack" onSubmit={saveTask}><label htmlFor="task-title">Navn / sted</label><input id="task-title" required maxLength="120" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}/><label htmlFor="task-description">Oppgave</label><textarea id="task-description" required rows="3" maxLength="1000" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}/><label htmlFor="task-points">Poeng</label><input id="task-points" type="number" min="0" max="500" required value={taskForm.points} onChange={(e) => setTaskForm({ ...taskForm, points: e.target.value })}/><div className="form-columns"><div><label htmlFor="task-lat">Breddegrad</label><input id="task-lat" type="number" step="any" min="-90" max="90" required value={taskForm.latitude} onChange={(e) => setTaskForm({ ...taskForm, latitude: e.target.value })}/></div><div><label htmlFor="task-lng">Lengdegrad</label><input id="task-lng" type="number" step="any" min="-180" max="180" required value={taskForm.longitude} onChange={(e) => setTaskForm({ ...taskForm, longitude: e.target.value })}/></div></div><button className="button primary" disabled={working}>{editingTask ? 'Lagre endringer' : 'Legg til post'}</button>{editingTask && <button className="button ghost" type="button" onClick={() => setEditingTask(null)}>Avbryt</button>}</form></section>
      <section className="surface"><h3>Rebuspostene</h3>{data.checkpoints.map((task) => <div className="admin-row" key={task.id}><div><small>{task.points} poeng</small><strong>{task.title}</strong></div><div className="row-buttons"><button onClick={() => startTask(task)}>Rediger</button><button className="delete" disabled={working} onClick={() => { if (window.confirm('Slette posten?')) perform(() => destroy('checkpoints', task.id)) }}>Slett</button></div></div>)}</section></div>}

    {tab === 'teams' && <section className="surface"><span className="eyebrow">DELTAKERFORDELING</span><h3>Lag og medlemmer</h3><p className="muted">Endre lag direkte fra listen. Endringen vises umiddelbart for deltakeren.</p><div className="member-list">{data.members.map((member) => <div className="admin-row" key={member.id}><strong>{member.display_name}</strong><select aria-label={`Lag for ${member.display_name}`} value={member.team_id ?? ''} disabled={working} onChange={(e) => perform(() => write('members', { team_id: e.target.value || null }, member.id))}><option value="">Uten lag</option>{data.teams.map((team) => <option key={team.id} value={team.id}>{team.emoji} {team.name}</option>)}</select></div>)}</div></section>}

    {tab === 'inbox' && <section className="surface"><div className="section-title"><div><span className="eyebrow">GODKJENNING</span><h3>Svar fra lagene</h3></div><span className="pill">{pending.length} venter</span></div>{pending.length ? pending.map((entry) => {
      const checkpoint = data.checkpoints.find((task) => task.id === entry.checkpoint_id)
      const team = data.teams.find((t) => t.id === entry.team_id)
      return <div className="submission-card" key={entry.id}><div className="submission-details"><span className="eyebrow">{team?.emoji} {team?.name} · {checkpoint?.points ?? 0} POENG</span><h3>{checkpoint?.title}</h3>{entry.url ? <button className="submission-thumbnail" onClick={() => setFocusedSubmission(entry)} title="Se innsendt bilde i stort format"><img src={entry.url} alt={`Bildebevis fra ${team?.name ?? 'laget'}`}/><span>Se større bilde ↗</span></button> : <p className="muted">{entry.note || 'Bildebevis mangler fra eldre innsending.'}</p>}</div><div className="row-buttons"><button className="button small primary" disabled={working} onClick={() => perform(() => review(entry.id, 'approved'))}>✓ Godkjenn</button><button className="button small outline" disabled={working} onClick={() => perform(() => review(entry.id, 'rejected'))}>Avvis</button></div></div>
    }) : <div className="empty-state"><span>✓</span><h3>Alt er ajour</h3><p>Ingen oppgaver venter på godkjenning.</p></div>}</section>}
    {focusedSubmission?.url && <div className="modal-backdrop" onClick={() => setFocusedSubmission(null)}><div className="photo-modal" role="dialog" aria-modal="true" aria-label="Bildebevis i stort format" onClick={(e) => e.stopPropagation()}><button className="modal-close" aria-label="Lukk bilde" onClick={() => setFocusedSubmission(null)}>×</button><img src={focusedSubmission.url} alt="Innsendt bildebevis fra laget"/></div></div>}
  </div>
}
