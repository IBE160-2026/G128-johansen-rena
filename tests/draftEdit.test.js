import test from 'node:test'
import assert from 'node:assert/strict'
import { areaError, draftErrors, updateArea, updateElement, updateTheme } from '../src/lib/draftEdit.js'
import { validateTrip } from '../src/lib/validate.js'

const base = () => ({
  trip: { name: 'X', start_date: '2026-04-24', end_date: '2026-04-25', area: { center: { lat: 47.4979, lng: 19.0402 }, radius_m: 5000 } },
  program_items: [
    { id: 'p1', event_date: '2026-04-24', start_time: '10:00', title: 'A' },
    { id: 'p2', event_date: '2026-04-25', start_time: '11:00', title: 'B' },
  ],
  checkpoints: [
    { id: 'c1', title: 'Ett', latitude: 47.4979, longitude: 19.045, radius_m: 50, requires_location: true, points: 10, status: 'active' },
    { id: 'c2', title: 'To', latitude: 47.5, longitude: 19.05, radius_m: 50, requires_location: true, points: 10, status: 'active' },
    { id: 'c3', title: 'Tre', latitude: 47.49, longitude: 19.03, radius_m: 50, requires_location: false, points: 10, status: 'active' },
  ],
  teams: [{ id: 't1', name: 'Lag 1' }, { id: 't2', name: 'Lag 2' }],
})

test('endre ett felt endrer bare det elementet', () => {
  const d = base(); const n = updateElement(d, 'checkpoints', 'c2', { title: 'Ny' })
  assert.equal(n.checkpoints[1].title, 'Ny')
  assert.equal(n.checkpoints[0], d.checkpoints[0]); assert.equal(n.checkpoints[2], d.checkpoints[2])
  assert.equal(n.program_items, d.program_items); assert.equal(d.checkpoints[1].title, 'To')
})

test('id kan ikke endres via patch', () => {
  const n = updateElement(base(), 'teams', 't1', { id: 'x', name: 'Y' })
  assert.equal(n.teams[0].id, 't1'); assert.equal(n.teams[0].name, 'Y')
})

test('ugyldig input endrer ingenting og krasjer ikke', () => {
  const d = base()
  assert.equal(updateElement(d, 'checkpoints', 'finnes-ikke', { title: 'x' }), d)
  assert.equal(updateElement(d, 'trip', 'c1', { title: 'x' }), d)
  assert.equal(updateElement(d, 'checkpoints', 'c1', null), d)
  assert.equal(updateElement(null, 'checkpoints', 'c1', {}), null)
  assert.equal(updateElement({ checkpoints: 'x' }, 'checkpoints', 'c1', {}).checkpoints, 'x')
  assert.equal(updateArea(null, {}), null)
  assert.equal(updateArea(d, null), d)
  assert.doesNotThrow(() => draftErrors(null))
  assert.equal(draftErrors(null).count, 1)
})

test('gyldig utkast gir ingen feil', () => {
  assert.deepEqual(draftErrors(base()), { count: 0, byId: {}, general: [] })
})

test('tom tittel gir feil ved feltet', () => {
  const e = draftErrors(updateElement(base(), 'checkpoints', 'c1', { title: '' }))
  assert.equal(e.count, 1); assert.equal(e.byId.c1[0].field, 'title')
})

test('poeng 0 og 501 gir feil ved poengfeltet', () => {
  for (const points of [0, 501]) {
    const e = draftErrors(updateElement(base(), 'checkpoints', 'c2', { points }))
    assert.equal(e.count, 1); assert.equal(e.byId.c2[0].field, 'points')
  }
  assert.equal(draftErrors(updateElement(base(), 'checkpoints', 'c2', { points: 500 })).count, 0)
})

test('dato utenfor perioden gir feil ved datofeltet', () => {
  const e = draftErrors(updateElement(base(), 'program_items', 'p2', { event_date: '2026-04-30' }))
  assert.equal(e.byId.p2[0].field, 'event_date')
})

test('dag uten program gir felles feil', () => {
  const e = draftErrors(updateElement(base(), 'program_items', 'p2', { event_date: '2026-04-24' }))
  assert.equal(e.count, 1); assert.equal(e.general.length, 1); assert.match(e.general[0].message, /mangler programposter/)
})

test('samme lagnavn gir feil ved det andre laget', () => {
  const e = draftErrors(updateElement(base(), 'teams', 't2', { name: 'Lag 1' }))
  assert.equal(e.byId.t2[0].field, 'name'); assert.equal(e.byId.t1, undefined)
})

test('nytt område: poster utenfor får feil', () => {
  const d = updateArea(base(), { center: { lat: 47.4979, lng: 19.0402 }, radius_m: 100 })
  assert.equal(d.trip.area.radius_m, 100)
  const e = draftErrors(d)
  assert.equal(e.count, 3)
  assert.ok(e.byId.c1.some((x) => x.message === 'Posten ligger utenfor turens område.'))
  assert.equal(e.byId.c1.find((x) => x.message === 'Posten ligger utenfor turens område.').field, 'position') // vises ved posisjonen
})

test('ugyldig område avvises', () => {
  const d = base()
  for (const area of [{ center: d.trip.area.center, radius_m: 0 }, { center: { lat: 100, lng: 0 }, radius_m: 50 }, { center: { lat: 0, lng: 181 }, radius_m: 50 }, { center: { lat: NaN, lng: 0 }, radius_m: 50 }]) {
    assert.equal(updateArea(d, area), d); assert.ok(areaError(area))
  }
  assert.equal(areaError({ center: { lat: 1, lng: 1 }, radius_m: 1 }), null)
})

test('valideringen i draftErrors stemmer med validateTrip', () => {
  const d = updateElement(updateElement(base(), 'teams', 't2', { name: '' }), 'checkpoints', 'c1', { radius_m: 0 })
  assert.equal(draftErrors(d).count, validateTrip(d).issues.length)
})

test('updateTheme godtar bare verdier fra listene', () => {
  const d = base()
  const next = updateTheme(d, { accent: 'fjord', icon: 'fjell' })
  assert.deepEqual(next.trip.theme, { accent: 'fjord', icon: 'fjell' })
  assert.equal(validateTrip(next).ok, true)
  assert.equal(d.trip.theme, undefined)
  for (const bad of [{ accent: 'neon', icon: 'fjell' }, { accent: 'fjord', icon: 'drage' }, { accent: 'fjord' }, null, 'x']) {
    assert.equal(updateTheme(d, bad), d)
  }
  assert.equal(updateTheme(null, { accent: 'fjord', icon: 'fjell' }), null)
})

test('ugyldig tema i utkast gir feil i general og kan rettes', () => {
  const d = base(); d.trip.theme = 'x'
  assert.ok(draftErrors(d).general.some((g) => g.path === 'trip.theme'))
  assert.equal(draftErrors(updateTheme(d, { accent: 'skog', icon: 'telt' })).count, 0)
})
