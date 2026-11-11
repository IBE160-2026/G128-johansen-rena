import { useState } from 'react'
import { useTrip } from '../context/TripContext.jsx'
import { currentTripDay, formatDate, sortEvents } from '../lib/core.js'

export default function Program() {
  const { data } = useTrip()
  const { trip, program } = data
  const days = []
  for (let value = trip.start_date; value <= trip.end_date;) {
    days.push(value)
    const date = new Date(`${value}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() + 1)
    value = date.toISOString().slice(0, 10)
    if (days.length > 31) break
  }
  const [selected, setSelected] = useState(() => currentTripDay(trip.start_date, trip.end_date))
  const items = sortEvents(program.filter((event) => event.event_date === selected))

  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">{trip.name.toUpperCase()}</span><h1>Program<span className="copper-dot">.</span></h1><p>Hele turen, dag for dag.</p></div>
    <div className="day-tabs">{days.map((date) => <button key={date} className={selected === date ? 'active' : ''} onClick={() => setSelected(date)}><span>{formatDate(date, { weekday: 'short' })}</span><strong>{date.slice(-2)}</strong></button>)}</div>
    <section className="surface"><div className="section-title"><div><span className="eyebrow">DAGENS PROGRAM</span><h3>{formatDate(selected)}</h3></div><span className="pill">{items.length} punkter</span></div>
      {items.length ? <div className="timeline big">{items.map((event) => <div className="timeline-item" key={event.id}><time>{event.start_time.slice(0, 5)}</time><div><strong>{event.title}</strong><p>{event.description}</p></div></div>)}</div> : <div className="empty-state"><span>☀</span><h3>En rolig dag</h3><p>Ingen aktiviteter er lagt inn ennå.</p></div>}
    </section>
  </div>
}
