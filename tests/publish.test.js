import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_TRIP_SLUG, JOIN_CODE_ALPHABET, MAX_DEMO_PARTICIPANTS, canPublish, publishToDemo, publishTrip, slugBase } from '../src/lib/publish.js'
import { validateTrip } from '../src/lib/validate.js'
import { buildMockDraft } from '../src/lib/mockAgent.js'
import { listPublished, loadPublished } from '../src/lib/demoStore.js'
import { seedDraft } from '../src/data/demo.js'

const REQUEST = { destination: 'Budapest', start_date: '2026-12-01', end_date: '2026-12-03', participant_count: 12, team_count: 3, post_count: 5, description: 'En blåtur med rebus og middag for hele gjengen.' }
const draft = () => buildMockDraft(REQUEST, seedDraft)

/** Deterministisk tilfeldighet (mulberry32). */
function seeded(seed = 1) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const NOW = new Date('2026-11-26T12:00:00Z')
const publish = (d = draft(), request = REQUEST, options = {}) => publishTrip({ draft: d, request }, { random: seeded(), now: NOW, ...options })

test('gyldig utkast blir en publisert demotur med samme form som demodata', () => {
  const d = draft()
  const before = structuredClone(d)
  const result = publish(d)
  assert.equal(result.ok, true)
  const { data } = result
  assert.deepEqual(Object.keys(data).sort(), ['checkpoints', 'members', 'photos', 'program', 'submissions', 'teams', 'trip'])
  assert.deepEqual(Object.keys(data.trip).sort(), ['announcement', 'area', 'demo_published', 'description', 'destination', 'destination_revealed', 'end_date', 'id', 'join_code', 'name', 'published_at', 'slug', 'start_date', 'status', 'theme'])
  assert.equal(data.trip.status, 'published')
  assert.equal(data.trip.demo_published, true)
  assert.equal(data.trip.destination_revealed, true)
  assert.equal(data.trip.published_at, NOW.toISOString())
  assert.equal(data.trip.start_date, '2026-12-01')
  assert.equal(data.trip.end_date, '2026-12-03')
  assert.deepEqual(data.trip.theme, d.trip.theme)
  assert.notEqual(data.trip.id, d.trip.id)
  assert.match(data.trip.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(data.program.length, d.program_items.length)
  assert.equal(data.checkpoints.length, 5)
  assert.equal(data.teams.length, 3)
  for (const list of [data.program, data.checkpoints, data.teams, data.members]) assert.ok(list.every((item) => item.trip_id === data.trip.id))
  assert.deepEqual(data.submissions, [])
  assert.deepEqual(data.photos, [])
  assert.deepEqual(d, before) // utkastet røres ikke
  data.checkpoints[0].title = 'Endret'
  data.trip.area.radius_m = 1
  assert.deepEqual(d, before) // og deler ingen objekter med turen
})

test('canPublish følger validateTrip, og et ugyldig utkast publiseres ikke', () => {
  assert.equal(canPublish(draft()), true)
  const bad = draft()
  bad.checkpoints[0].points = 0
  bad.trip.name = ''
  assert.equal(canPublish(bad), false)
  const result = publish(bad)
  assert.equal(result.ok, false)
  assert.equal(result.error, 'VALIDATION_FAILED')
  assert.deepEqual(result.issues, validateTrip(bad).issues)
  assert.equal(result.data, undefined)
})

test('ugyldig input gir ok: false uten krasj', () => {
  for (const input of [null, undefined, {}, { draft: null }, { draft: 'x' }, { draft: [] }, 7]) {
    assert.equal(publishTrip(input, { random: seeded() }).ok, false)
  }
  assert.equal(publishTrip({ draft: {} }, { random: seeded() }).ok, false)
  assert.equal(publishTrip({ draft: draft() }).ok, false)
  assert.equal(publishTrip({ draft: draft() }, null).ok, false)
  assert.equal(publishTrip({ draft: draft() }, { random: seeded(), now: new Date('x') }).ok, false)
  for (const value of [null, undefined, {}, 'x']) assert.equal(canPublish(value), false)
})

test('uten poster og lag kan turen publiseres, og deltakerne er uten lag', () => {
  const d = { ...draft(), checkpoints: [], teams: [] }
  const { ok, data } = publish(d)
  assert.equal(ok, true)
  assert.deepEqual(data.checkpoints, [])
  assert.equal(data.members.length, 12)
  assert.ok(data.members.every((m) => m.team_id === null))
})

test('turkoden er 6 tegn uten 0, O, 1 og I', () => {
  assert.equal(JOIN_CODE_ALPHABET, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
  const random = seeded(7)
  for (let i = 0; i < 200; i += 1) {
    const { data } = publish(draft(), REQUEST, { random })
    assert.match(data.trip.join_code, /^[A-HJ-NP-Z2-9]{6}$/)
  }
  for (const edge of [0, 0.999999999, 1, -1, NaN]) {
    const result = publish(draft(), REQUEST, { random: () => edge })
    assert.match(result.data.trip.join_code, /^[A-HJ-NP-Z2-9]{6}$/)
  }
})

test('kollisjon med en eksisterende kode eller adresse gir en ny', () => {
  const first = publish().data.trip
  const second = publish(draft(), REQUEST, { existing: [{ slug: first.slug, join_code: first.join_code }] }).data.trip // samme tilfeldighet
  assert.notEqual(second.slug, first.slug)
  assert.notEqual(second.join_code, first.join_code)
})

test('gir feil når tilfeldigheten aldri finner en ledig verdi', () => {
  const taken = publish(draft(), REQUEST, { random: () => 0 }).data.trip
  const result = publish(draft(), REQUEST, { random: () => 0, existing: [taken] })
  assert.deepEqual(result, { ok: false, error: 'NOT_UNIQUE' })
})

test('adressen bygger på navnet med bare a–z, 0–9 og bindestrek', () => {
  const d = draft()
  d.trip.name = 'Blåtur på Øya!'
  assert.match(publish(d).data.trip.slug, /^blatur-pa-oya-[a-z0-9]{4}$/)
  assert.equal(slugBase('  Æ ø Å -- Café 2026  '), 'ae-o-a-cafe-2026')
  assert.equal(slugBase('Blåtur'), 'blatur') // å skrevet som to tegn
  assert.equal(slugBase('🎉!!!'), 'tur')
  assert.equal(slugBase(undefined), 'tur')
  assert.match(slugBase(`${'a'.repeat(39)} bbbb`), /^a{39}$/) // kuttes uten bindestrek til slutt
})

test('prøveturens adresse er reservert og lik seed-filen', () => {
  assert.equal(DEMO_TRIP_SLUG, seedDraft.trip.slug)
  const d = draft()
  d.trip.name = 'Prøvetur'
  assert.notEqual(publish(d).data.trip.slug, seedDraft.trip.slug)
})

for (const [wanted, expected] of [[0, 1], [-4, 1], [undefined, 1], ['x', 1], [1, 1], [12, 12], [500, MAX_DEMO_PARTICIPANTS], [Infinity, 30]]) {
  test(`participant_count ${wanted} gir ${expected} deltakere, jevnt fordelt`, () => {
    const { data } = publish(draft(), { ...REQUEST, participant_count: wanted })
    assert.equal(data.members.length, expected)
    assert.ok(data.members.every((m) => m.role === 'participant' && m.display_name))
    for (const key of ['id', 'user_id', 'display_name']) assert.equal(new Set(data.members.map((m) => m[key])).size, expected)
    const sizes = data.teams.map((team) => data.members.filter((m) => m.team_id === team.id).length)
    assert.equal(sizes.reduce((a, b) => a + b, 0), expected)
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1)
  })
}

test('uten forespørsel blir det én deltaker, og navnene nummereres når de er brukt opp', () => {
  assert.equal(publish(draft(), null).data.members.length, 1)
  const names = publish(draft(), { participant_count: 30 }).data.members.map((m) => m.display_name)
  assert.equal(names[20], `${names[0]} 2`)
})

test('to publiseringer av samme utkast gir ulike turer', () => {
  const random = seeded(3)
  const a = publish(draft(), REQUEST, { random }).data
  const b = publish(draft(), REQUEST, { random }).data
  assert.notEqual(a.trip.id, b.trip.id)
  assert.notEqual(a.trip.slug, b.trip.slug)
  assert.notEqual(a.members[0].user_id, b.members[0].user_id)
})

test('innholdet i utkastet følger med til den publiserte turen', () => {
  const d = draft()
  const { data } = publish(d)
  for (const key of ['name', 'destination', 'description', 'announcement', 'area']) assert.deepEqual(data.trip[key], d.trip[key] ?? '', key)
  const strip = (list) => list.map(({ trip_id, ...rest }) => rest)
  const source = (list) => list.map(({ trip_id, ...rest }) => rest)
  assert.deepEqual(strip(data.program), source(d.program_items))
  assert.deepEqual(strip(data.checkpoints), source(d.checkpoints))
  assert.deepEqual(strip(data.teams), source(d.teams))
})

const memoryStorage = () => {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
    removeItem: (key) => { map.delete(key) },
  }
}

test('publishToDemo lagrer turen og unngår koder og adresser som er i bruk', () => {
  const storage = memoryStorage()
  const first = publishToDemo(storage, draft(), REQUEST, { random: seeded(), now: NOW })
  const second = publishToDemo(storage, draft(), REQUEST, { random: seeded(), now: NOW }) // samme tilfeldighet
  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.notEqual(second.data.trip.slug, first.data.trip.slug)
  assert.notEqual(second.data.trip.join_code, first.data.trip.join_code)
  assert.deepEqual(loadPublished(storage, first.data.trip.slug), first.data)
  assert.equal(listPublished(storage).length, 2)
})

test('publishToDemo melder STORAGE_FAILED når turen ikke kan lagres', () => {
  const storage = memoryStorage()
  storage.setItem = () => { throw new Error('full') }
  assert.deepEqual(publishToDemo(storage, draft(), REQUEST, { random: seeded(), now: NOW }), { ok: false, error: 'STORAGE_FAILED' })
  assert.deepEqual(listPublished(storage), [])
})
