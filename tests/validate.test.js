import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTrip } from '../src/lib/validate.js'
import { distanceMeters } from '../src/lib/geo.js'

function validDraft() {
  return {
    trip: {
      name: 'Prøvetur', start_date: '2026-04-24', end_date: '2026-04-25',
      area: { center: { lat: 47.4979, lng: 19.0402 }, radius_m: 5000 },
      theme: { accent: 'kobber', icon: 'kompass' },
    },
    program_items: [
      { id: 'p1', event_date: '2026-04-24', start_time: '10:00', title: 'Ankomst' },
      { id: 'p2', event_date: '2026-04-25', start_time: '09:00', title: 'Frokost' },
    ],
    checkpoints: [
      { id: 'c1', title: 'Broen', latitude: 47.4979, longitude: 19.0450, radius_m: 50, requires_location: true, points: 10, status: 'active' },
    ],
    teams: [{ id: 't1', name: 'Lag 1' }],
  }
}

function issuesOf(draft) {
  const result = validateTrip(draft)
  assert.equal(result.ok, false, 'turen skulle vært avvist')
  return result.issues
}

test('en gyldig tur gir ok', () => {
  assert.deepEqual(validateTrip(validDraft()), { ok: true })
})

test('temaet er valgfritt', () => {
  const draft = validDraft()
  delete draft.trip.theme
  assert.deepEqual(validateTrip(draft), { ok: true })
})

test('dato i perioden uten programpost gir én feil som nevner datoen', () => {
  const draft = validDraft()
  draft.program_items = draft.program_items.slice(0, 1)
  const issues = issuesOf(draft)
  assert.equal(issues.length, 1)
  assert.equal(issues[0].path, 'program_items')
  assert.match(issues[0].message, /2026-04-25/)
})

test('programpost utenfor perioden gir én feil', () => {
  const draft = validDraft()
  draft.program_items.push({ id: 'p3', event_date: '2026-04-30', start_time: '12:00', title: 'For sent' })
  const issues = issuesOf(draft)
  assert.equal(issues.length, 1)
  assert.equal(issues[0].path, 'program_items[2].event_date')
})

test('post utenfor området gir én feil', () => {
  const draft = validDraft()
  draft.checkpoints[0].latitude = 48.5
  const issues = issuesOf(draft)
  assert.equal(issues.length, 1)
  assert.equal(issues[0].path, 'checkpoints[0]')
  assert.match(issues[0].message, /utenfor turens område/)
})

test('kanten av området: akkurat på radius er gyldig, én meter utenfor avvises', () => {
  const draft = validDraft()
  const { lat, lng } = draft.trip.area.center
  const d = distanceMeters(lat, lng, draft.checkpoints[0].latitude, draft.checkpoints[0].longitude)
  draft.trip.area.radius_m = d
  assert.deepEqual(validateTrip(draft), { ok: true })
  draft.trip.area.radius_m = d - 1
  const issues = issuesOf(draft)
  assert.equal(issues.length, 1)
  assert.equal(issues[0].path, 'checkpoints[0]')
})

test('post i motpunktet av området avvises (ingen NaN-avstand)', () => {
  const draft = validDraft()
  draft.trip.area.center = { lat: 19.731067114772642, lng: -161.02606384071734 }
  draft.checkpoints[0].latitude = -19.731067114772642
  draft.checkpoints[0].longitude = -161.02606384071734 + 180
  assert.equal(issuesOf(draft)[0].path, 'checkpoints[0]')
})

test('deaktivert post utenfor området avvises også', () => {
  const draft = validDraft()
  draft.checkpoints[0].status = 'deactivated'
  draft.checkpoints[0].latitude = 48.5
  assert.equal(issuesOf(draft)[0].path, 'checkpoints[0]')
})

test('turen kan vare maks 366 dager', () => {
  const draft = validDraft()
  draft.trip.start_date = '2026-01-01'
  draft.trip.end_date = '2026-12-31'
  draft.program_items = Array.from({ length: 365 }, (_, i) => ({ id: `d${i}`, event_date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), start_time: '10:00', title: 'Dag' }))
  assert.deepEqual(validateTrip(draft), { ok: true })
  draft.trip.end_date = '2027-01-02'
  assert.equal(issuesOf(draft)[0].path, 'trip.end_date')
})

test('svært lang periode avvises raskt', () => {
  const draft = validDraft()
  draft.trip.start_date = '0100-01-01'
  draft.trip.end_date = '9999-12-31'
  const started = Date.now()
  assert.equal(issuesOf(draft)[0].path, 'trip.end_date')
  assert.ok(Date.now() - started < 500)
})

const badAreas = [
  ['mangler område', undefined, ['trip.area.center', 'trip.area.radius_m']],
  ['ikke-numerisk midtpunkt', { center: { lat: 'a', lng: 1 }, radius_m: 100 }, ['trip.area.center']],
  ['breddegrad over 90', { center: { lat: 91, lng: 1 }, radius_m: 100 }, ['trip.area.center']],
  ['lengdegrad under -180', { center: { lat: 1, lng: -181 }, radius_m: 100 }, ['trip.area.center']],
  ['radius 0', { center: { lat: 1, lng: 1 }, radius_m: 0 }, ['trip.area.radius_m']],
  ['mangler radius', { center: { lat: 1, lng: 1 } }, ['trip.area.radius_m']],
  ['ugyldig midtpunkt og radius gir begge feil', { center: { lat: 99, lng: 1 }, radius_m: -1 }, ['trip.area.center', 'trip.area.radius_m']],
]
for (const [name, area, paths] of badAreas) {
  test(`ugyldig område (${name}) gir bare områdefeil og ingen krasj`, () => {
    const draft = validDraft()
    draft.trip.area = area
    assert.deepEqual(issuesOf(draft).map((issue) => issue.path), paths)
  })
}

test('ugyldig periode gir bare periodefeil, ikke programfeil', () => {
  const draft = validDraft()
  draft.trip.end_date = '2026-04-01'
  assert.deepEqual(issuesOf(draft).map((issue) => issue.path), ['trip.end_date'])
})

test('ugyldige koordinater på posten rapporteres per felt', () => {
  const draft = validDraft()
  draft.checkpoints[0].latitude = 91
  draft.checkpoints[0].longitude = 'x'
  assert.deepEqual(issuesOf(draft).map((issue) => issue.path), ['checkpoints[0].latitude', 'checkpoints[0].longitude'])
})

test('requires_location må være sant eller usant', () => {
  const draft = validDraft()
  draft.checkpoints[0].requires_location = 'ja'
  assert.equal(issuesOf(draft)[0].path, 'checkpoints[0].requires_location')
  draft.checkpoints[0].requires_location = false
  assert.deepEqual(validateTrip(draft), { ok: true })
})

test('id mangler eller er brukt to ganger', () => {
  const draft = validDraft()
  draft.program_items[1].id = 'p1'
  draft.checkpoints.push({ ...draft.checkpoints[0] })
  draft.teams.push({ id: '', name: 'Lag 2' })
  const paths = issuesOf(draft).map((issue) => issue.path).sort()
  assert.deepEqual(paths, ['checkpoints[1].id', 'program_items[1].id', 'teams[1].id'])
})

test('to lag med samme navn avvises', () => {
  const draft = validDraft()
  draft.teams.push({ id: 't2', name: ' Lag 1 ' })
  assert.equal(issuesOf(draft)[0].path, 'teams[1].name')
})

for (const radius of [0, -5, '50', NaN, null]) {
  test(`radius_m ${String(radius)} gir én feil`, () => {
    const draft = validDraft()
    draft.checkpoints[0].radius_m = radius
    const issues = issuesOf(draft)
    assert.equal(issues.length, 1)
    assert.equal(issues[0].path, 'checkpoints[0].radius_m')
  })
}

for (const points of [0, -1, 1.5, '10', NaN, 501]) {
  test(`poeng ${String(points)} gir én feil`, () => {
    const draft = validDraft()
    draft.checkpoints[0].points = points
    const issues = issuesOf(draft)
    assert.equal(issues.length, 1)
    assert.equal(issues[0].path, 'checkpoints[0].points')
  })
}

test('manglende felt gir én feil per felt', () => {
  const draft = validDraft()
  draft.trip.name = ' '
  draft.program_items[0].title = ''
  draft.teams[0].name = ''
  const paths = issuesOf(draft).map((issue) => issue.path).sort()
  assert.deepEqual(paths, ['program_items[0].title', 'teams[0].name', 'trip.name'])
})

test('sluttdato før startdato avvises uten å krasje', () => {
  const draft = validDraft()
  draft.trip.end_date = '2026-04-20'
  assert.equal(issuesOf(draft)[0].path, 'trip.end_date')
})

test('ugyldig dato og klokkeslett avvises', () => {
  const draft = validDraft()
  draft.trip.start_date = '2026-02-30'
  draft.program_items[0].start_time = '25:00'
  const paths = issuesOf(draft).map((issue) => issue.path)
  assert.ok(paths.includes('trip.start_date'))
  assert.ok(paths.includes('program_items[0].start_time'))
})

test('ugyldig tema avvises', () => {
  const draft = validDraft()
  draft.trip.theme = { accent: '', icon: 'kompass' }
  assert.equal(issuesOf(draft)[0].path, 'trip.theme')
})

test('deaktivert post valideres som aktive poster', () => {
  const draft = validDraft()
  draft.checkpoints[0].status = 'deactivated'
  assert.deepEqual(validateTrip(draft), { ok: true })
  draft.checkpoints[0].status = 'slettet'
  assert.equal(issuesOf(draft)[0].path, 'checkpoints[0].status')
})

for (const input of [null, undefined, 'tekst', 42, []]) {
  test(`${JSON.stringify(input) ?? 'undefined'} avvises med én feil uten å krasje`, () => {
    const result = validateTrip(input)
    assert.equal(result.ok, false)
    assert.equal(result.issues.length, 1)
    for (const issue of result.issues) assert.equal(typeof issue.message, 'string')
  })
}

test('tomt objekt avvises med én feil per manglende del', () => {
  assert.deepEqual(issuesOf({}).map((issue) => issue.path), ['trip', 'program_items', 'checkpoints', 'teams'])
})

test('validateTrip med forespørsel: periode, lag og poster må stemme', async () => {
  const { validateTrip: vt } = await import('../src/lib/validate.js')
  const d = validDraft()
  const periode = { destination: 'x', start_date: d.trip.start_date, end_date: d.trip.end_date, participant_count: 50, description: 'y'.repeat(40) }
  assert.deepEqual(vt(d, periode), { ok: true })
  assert.equal(vt(d, { ...periode, end_date: '2026-04-26' }).ok, false)
  assert.equal(vt(d, { ...periode, team_count: d.teams.length + 1 }).ok, false)
  assert.equal(vt(d, { ...periode, post_count: d.checkpoints.length + 1 }).ok, false)
  assert.deepEqual(vt(d), { ok: true })
  assert.deepEqual(vt(d, 'ikke en forespørsel'), { ok: true }) // ugyldig forespørsel hoppes over
})
