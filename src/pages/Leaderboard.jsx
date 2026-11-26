import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTrip } from '../context/TripContext.jsx'
import { rankStandings } from '../lib/scoring.js'
import { countText } from '../lib/core.js'
import { teamColorToken } from '../lib/teams.js'

const PULL_DISTANCE = 70

export default function Leaderboard() {
  const { data, own, leaderboard, offline, refreshScores, setError } = useTrip()
  const members = data?.members ?? []
  const teams = data?.teams ?? []
  const ranked = useMemo(() => rankStandings(leaderboard), [leaderboard])
  const [refreshing, setRefreshing] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const rowRefs = useRef(new Map())
  const lastTops = useRef(new Map())
  const lastSignature = useRef(null)
  const touchStart = useRef(null)

  const signature = ranked.map((team) => `${team.id}:${team.rank}`).join('|')
  const myRank = ranked.find((team) => team.id === own?.team_id)?.rank

  // FLIP: radene glir fra gammel til ny plass, unntatt ved redusert bevegelse
  useLayoutEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tops = new Map()
    for (const [id, el] of rowRefs.current) if (el) tops.set(id, el.getBoundingClientRect().top)
    if (!reduce) {
      for (const [id, el] of rowRefs.current) {
        const before = lastTops.current.get(id)
        const after = tops.get(id)
        if (!el || before === undefined || after === undefined || before === after || !el.animate) continue
        el.animate([{ transform: `translateY(${before - after}px)` }, { transform: 'translateY(0)' }], { duration: 300, easing: 'ease-out' })
      }
    }
    lastTops.current = tops
  }, [signature])

  // Melding bare når rekkefølge eller plassering faktisk endres, ikke ved første visning
  useEffect(() => {
    if (lastSignature.current !== null && lastSignature.current !== signature) {
      setAnnouncement(`Stillingen er oppdatert.${myRank ? ` Laget ditt er på ${myRank}. plass.` : ''}`)
    }
    lastSignature.current = signature
  }, [signature, myRank])

  async function reload() {
    if (refreshing || offline) return
    setRefreshing(true)
    try { await refreshScores() }
    catch (e) { setError?.(e?.message || 'Kunne ikke hente poengene.') }
    finally { setRefreshing(false) }
  }

  const onTouchStart = (event) => { touchStart.current = window.scrollY <= 0 && event.touches.length === 1 ? event.touches[0].clientY : null }
  const onTouchCancel = () => { touchStart.current = null }
  const onTouchEnd = (event) => {
    const start = touchStart.current
    touchStart.current = null
    if (start !== null && window.scrollY <= 0 && event.changedTouches[0].clientY - start >= PULL_DISTANCE) reload()
  }

  return <div className="page-stack" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel}><div className="page-heading"><span className="eyebrow">KONKURRANSEN</span><h1>Ledertavle<span className="copper-dot">.</span></h1><p>Slik ligger lagene an.</p></div>
    <section className="surface"><div className="section-title"><div><span className="eyebrow">LEDERTAVLE</span><h3>Stillingen</h3></div><span className="pill">Oppdateres live</span><button type="button" className="button small outline" onClick={reload} disabled={refreshing || offline}>{refreshing ? 'Oppdaterer…' : 'Oppdater'}</button></div>
      <div className="sr-only" aria-live="polite" role="status">{announcement}</div>
      {offline ? <p className="muted">Stillingen vises ikke uten nett.</p> : !ranked.length ? <p className="muted">Ingen lag ennå.</p> : <div className="leaderboard">{ranked.map((team) => {
        const mine = !!own?.team_id && team.id === own.team_id
        return <div className={`leader-row ${mine ? 'my-team' : ''}`} key={team.id} ref={(el) => { if (el) rowRefs.current.set(team.id, el); else rowRefs.current.delete(team.id) }} style={{ '--row-color': `var(--${teamColorToken(team, teams)})` }}>
          <span className="team-stripe" aria-hidden="true" />
          <span className="leader-rank">{team.rank === 1 && team.points > 0 && <span aria-hidden="true">🥇 </span>}<span aria-hidden="true">{team.rank}.</span><span className="sr-only">{team.rank}. plass{team.tied ? ' (delt)' : ''}</span></span>
          <span className="leader-team"><strong>{team.emoji} {team.name}</strong>{mine && <span className="my-team-badge">Ditt lag</span>}<small>{countText(members.filter((m) => m.team_id === team.id).length, 'medlem', 'medlemmer')} · {countText(team.completed, 'godkjent', 'godkjente')}</small></span>
          <b className="score">{team.points} <small>poeng</small></b>
        </div>
      })}</div>}
    </section>
  </div>
}
