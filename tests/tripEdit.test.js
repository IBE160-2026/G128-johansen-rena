import test from 'node:test'
import assert from 'node:assert/strict'
import { validateChange } from '../src/lib/tripEdit.js'

function data() {
  return {
    trip: { name: 'Tur', start_date: '2026-04-24', end_date: '2026-04-25', area: { center: { lat: 47.4979, lng: 19.0402 }, radius_m: 5000 } },
    program: [
      { id: 'p1', event_date: '2026-04-24', start_time: '10:00', title: 'Ankomst' },
      { id: 'p2', event_date: '2026-04-25', start_time: '09:00', title: 'Frokost' },
    ],
    checkpoints: [{ id: 'c1', title: 'Broen', latitude: 47.4979, longitude: 19.045, radius_m: 50, requires_location: true, points: 10, status: 'active' }],
    teams: [{ id: 't1', name: 'Lag 1' }],
  }
}

test('gyldig endring', () => {
  assert.deepEqual(validateChange(data(), 'program', { title: 'Ny' }, 'p1'), { ok: true })
  assert.deepEqual(validateChange(data(), 'checkpoints', { points: 20 }, 'c1'), { ok: true })
})

test('tom tittel gir feil ved tittelfeltet', () => {
  const r = validateChange(data(), 'checkpoints', { title: ' ' }, 'c1')
  assert.deepEqual(r, { ok: false, errors: [{ field: 'title', message: 'Posten må ha en tittel.' }] })
})

test('ugyldige poeng', () => {
  for (const points of [0, 501]) {
    const r = validateChange(data(), 'checkpoints', { points }, 'c1')
    assert.equal(r.ok, false)
    assert.equal(r.errors[0].field, 'points')
  }
})

test('post utenfor området gir felles melding', () => {
  const r = validateChange(data(), 'checkpoints', { latitude: 60 }, 'c1')
  assert.deepEqual(r.errors, [{ field: null, message: 'Posten ligger utenfor turens område.' }])
})

test('dato utenfor perioden gir feil ved datofeltet', () => {
  const r = validateChange(data(), 'program', { event_date: '2026-04-26' }, 'p2')
  assert.ok(r.errors.some((e) => e.field === 'event_date'))
})

test('siste programpost på en dag flyttes', () => {
  const r = validateChange(data(), 'program', { event_date: '2026-04-24' }, 'p2')
  assert.equal(r.ok, false)
  assert.deepEqual(r.errors, [{ field: null, message: 'Datoen 2026-04-25 mangler programposter.' }])
})

test('feil andre steder ignoreres', () => {
  const d = data()
  d.trip.name = ''
  d.checkpoints.push({ id: 'c2', title: '', latitude: 1, longitude: 1, points: 0 })
  assert.deepEqual(validateChange(d, 'program', { title: 'Ny' }, 'p1'), { ok: true })
})

test('en dato som manglet fra før, er ikke endringens skyld', () => {
  const d = data()
  d.program = [d.program[0]]
  assert.deepEqual(validateChange(d, 'program', { title: 'Ny' }, 'p1'), { ok: true })
})

test('mangler area hoppes områdesjekken over', () => {
  const d = data()
  delete d.trip.area
  assert.deepEqual(validateChange(d, 'checkpoints', { latitude: 60 }, 'c1'), { ok: true })
})

test('nytt element valideres', () => {
  const r = validateChange(data(), 'checkpoints', { title: '', points: 5 }, '')
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => e.field === 'title'))
})

test('uendrte eldre poeng blokkerer ikke', () => {
  const d = data()
  d.checkpoints[0].points = 0
  assert.deepEqual(validateChange(d, 'checkpoints', { title: 'Ny', points: 0 }, 'c1'), { ok: true })
})

test('ukjent element og ugyldig input krasjer ikke', () => {
  assert.equal(validateChange(data(), 'program', {}, 'finnes-ikke').ok, false)
  assert.equal(validateChange(null, 'program', {}, 'p1').ok, false)
  assert.equal(validateChange(data(), 'program', null, 'p1').ok, false)
  assert.equal(validateChange(data(), 'teams', {}, 't1').ok, false)
  assert.equal(validateChange(undefined, undefined, undefined, undefined).ok, false)
})

test('felt som ikke er endret blokkerer ikke (eldre programpost kan få ny tittel)', async () => {
  const { validateChange } = await import('../src/lib/tripEdit.js')
  const data = { trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-25', area: { center: { lat: 47.5, lng: 19.04 }, radius_m: 6000 } },
    program: [{ id: 'a', event_date: '2026-04-24', start_time: '12:00', title: 'A' }, { id: 'b', event_date: '2026-04-25', start_time: '12:00', title: 'B' }, { id: 'c', event_date: '2026-05-30', start_time: '12:00', title: 'Gammel' }], checkpoints: [], teams: [] }
  assert.deepEqual(validateChange(data, 'program', { title: 'Ny tittel' }, 'c'), { ok: true })
})

test('tom oppgavebeskrivelse og for lang tittel avvises ved feltet', async () => {
  const { validateChange } = await import('../src/lib/tripEdit.js')
  const data = { trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-24', area: { center: { lat: 47.5, lng: 19.04 }, radius_m: 6000 } },
    program: [{ id: 'a', event_date: '2026-04-24', start_time: '12:00', title: 'A' }], checkpoints: [], teams: [] }
  const post = { title: 'x'.repeat(121), description: '  ', points: 10, latitude: 47.5, longitude: 19.04, radius_m: 50, requires_location: false, status: 'active' }
  const result = validateChange(data, 'checkpoints', post, null)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((e) => e.field === 'description'))
  assert.ok(result.errors.some((e) => e.field === 'title'))
})

test('radius 0 eller tom gir feil ved radiusfeltet', async () => {
  const { validateChange } = await import('../src/lib/tripEdit.js')
  const data = { trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-24', area: { center: { lat: 47.5, lng: 19.04 }, radius_m: 6000 } },
    program: [{ id: 'a', event_date: '2026-04-24', start_time: '12:00', title: 'A' }], checkpoints: [], teams: [] }
  const result = validateChange(data, 'checkpoints', { title: 'P', description: 'o', points: 10, latitude: 47.5, longitude: 19.04, radius_m: 0, requires_location: false }, null)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((e) => e.field === 'radius_m' && /Radius/.test(e.message)))
  const empty = validateChange(data, 'checkpoints', { title: 'P', description: 'o', points: 10, latitude: 47.5, longitude: 19.04, radius_m: NaN, requires_location: false }, null)
  assert.ok(empty.errors.some((e) => e.field === 'radius_m'))
})

test('tom koordinat (NaN) avvises', async () => {
  const { validateChange } = await import('../src/lib/tripEdit.js')
  const data = { trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-24' }, program: [{ id: 'a', event_date: '2026-04-24', start_time: '12:00', title: 'A' }], checkpoints: [], teams: [] }
  const result = validateChange(data, 'checkpoints', { title: 'P', description: 'o', points: 10, latitude: NaN, longitude: NaN, radius_m: 50, requires_location: false }, null)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((e) => e.field === 'latitude'))
})

import { buildCheckpointRecord } from '../src/lib/tripEdit.js'

const form = (extra = {}) => ({ title: 'P', description: 'o', points: '10', latitude: '47.5', longitude: '19.04', radius_m: '50', requires_location: false, ...extra })

test('ny post: neste plass etter høyeste (også med hull), status aktiv, radius og stedskrav følger skjemaet', () => {
  const list = [{ id: 'a', position: 1 }, { id: 'b', position: 4 }]
  const r = buildCheckpointRecord(form({ radius_m: '80', requires_location: true }), list, null)
  assert.equal(r.position, 5)
  assert.equal(r.status, 'active')
  assert.equal(r.radius_m, 80)
  assert.equal(r.requires_location, true)
  assert.equal(buildCheckpointRecord(form(), [], null).position, 1)
})

test('tomt radiusfelt blir NaN og avvises', () => {
  const r = buildCheckpointRecord(form({ radius_m: '' }), [], null)
  assert.ok(Number.isNaN(r.radius_m))
})

test('redigering beholder plassen og sender bare endret radius og stedskrav', () => {
  const list = [{ id: 'a', position: 3, radius_m: 60, requires_location: true }, { id: 'legacy', position: 7 }]
  const same = buildCheckpointRecord(form({ radius_m: '60', requires_location: true }), list, 'a')
  assert.equal(same.position, 3)
  assert.ok(!('radius_m' in same) && !('requires_location' in same) && !('status' in same))
  const changed = buildCheckpointRecord(form({ radius_m: '90', requires_location: false }), list, 'a')
  assert.equal(changed.radius_m, 90)
  assert.equal(changed.requires_location, false)
  const legacy = buildCheckpointRecord(form({ radius_m: '50', requires_location: false }), list, 'legacy')
  assert.ok(!('radius_m' in legacy) && !('requires_location' in legacy)) // eldre rad uten verdier får ikke nye av en ny tittel
})

test('radius må være et helt tall og høyst 2000 meter', () => {
  const data = { trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-24' }, program: [{ id: 'a', event_date: '2026-04-24', start_time: '12:00', title: 'A' }], checkpoints: [], teams: [] }
  for (const radius_m of [0.5, 2001, 1e9]) {
    const r = validateChange(data, 'checkpoints', buildCheckpointRecord(form({ radius_m: String(radius_m) }), [], null), null)
    assert.equal(r.ok, false)
    assert.ok(r.errors.some((e) => e.field === 'radius_m'))
  }
  assert.deepEqual(validateChange(data, 'checkpoints', buildCheckpointRecord(form({ radius_m: '2000' }), [], null), null), { ok: true })
})

test('feil på et felt skjemaet ikke viser blir en felles melding', () => {
  const data = { trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-24' }, program: [{ id: 'a', event_date: '2026-04-24', start_time: '12:00', title: 'A' }], checkpoints: [], teams: [] }
  const r = validateChange(data, 'checkpoints', { ...buildCheckpointRecord(form(), [], null), status: 'ugyldig' }, null)
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => e.field === null))
})
