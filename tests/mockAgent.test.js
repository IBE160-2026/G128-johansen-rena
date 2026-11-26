import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMockDraft } from '../src/lib/mockAgent.js'
import { validateTrip } from '../src/lib/validate.js'
import { seedDraft } from '../src/data/demo.js'

const req = (over = {}) => ({ destination: 'Bergen', start_date: '2026-06-01', end_date: '2026-06-03', participant_count: 12, description: 'Tre dager i Bergen med rebus, middag og felles program.', ...over })
const days = (draft) => new Set(draft.program_items.map((i) => i.event_date))

test('3 dager gir gyldig utkast med seed-antall lag og poster', () => {
  const r = req(); const d = buildMockDraft(r, seedDraft)
  assert.ok(validateTrip(d, r).ok)
  assert.equal(days(d).size, 3)
  assert.equal(d.teams.length, seedDraft.teams.length)
  assert.equal(d.checkpoints.length, seedDraft.checkpoints.length)
  assert.equal(d.trip.destination, seedDraft.trip.destination)
})

test('10 dager gjenbruker seed-dagene', () => {
  const r = req({ end_date: '2026-06-10' }); const d = buildMockDraft(r, seedDraft)
  assert.ok(validateTrip(d, r).ok)
  assert.equal(days(d).size, 10)
})

test('en dag gir ett dagsprogram', () => {
  const r = req({ end_date: '2026-06-01' }); const d = buildMockDraft(r, seedDraft)
  assert.ok(validateTrip(d, r).ok)
  assert.equal(days(d).size, 1)
})

test('flere lag og poster enn seed: unike navn, aktive poster, posisjon fra 1', () => {
  const r = req({ team_count: 6, post_count: 10 }); const d = buildMockDraft(r, seedDraft)
  assert.ok(validateTrip(d, r).ok)
  assert.equal(d.teams.length, 6)
  assert.equal(new Set(d.teams.map((t) => t.name)).size, 6)
  assert.equal(new Set(d.teams.map((t) => t.emoji)).size, 6)
  assert.equal(d.checkpoints.length, 10)
  assert.deepEqual(d.checkpoints.map((c) => c.position), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.ok(d.checkpoints.every((c) => c.status === 'active'))
  assert.equal(new Set(d.checkpoints.map((c) => c.title)).size, 10)
})

test('maks antall poster holder seg innenfor området', () => {
  const r = req({ post_count: 100 }); assert.ok(validateTrip(buildMockDraft(r, seedDraft), r).ok)
})

test('færre enn seed', () => {
  const r = req({ team_count: 2, post_count: 2 }); const d = buildMockDraft(r, seedDraft)
  assert.ok(validateTrip(d, r).ok)
  assert.equal(d.teams.length, 2); assert.equal(d.checkpoints.length, 2)
})

test('samme forespørsel gir samme utkast, id-ene er unike og nye', () => {
  const r = req({ team_count: 5, post_count: 9 })
  const a = buildMockDraft(r, seedDraft)
  assert.deepEqual(a, buildMockDraft(r, seedDraft))
  const ids = [a.trip.id, ...a.program_items.map((i) => i.id), ...a.checkpoints.map((c) => c.id), ...a.teams.map((t) => t.id)]
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(!ids.includes(seedDraft.trip.id))
})

test('seed-dataene endres ikke', () => {
  const before = JSON.stringify(seedDraft); buildMockDraft(req({ post_count: 12 }), seedDraft)
  assert.equal(JSON.stringify(seedDraft), before)
})

test('validateTrip mot forespørsel fanger feil periode, lagtall og postantall', () => {
  const d = buildMockDraft(req(), seedDraft)
  const paths = (r) => validateTrip(d, r).issues.map((i) => i.path)
  assert.ok(paths(req({ end_date: '2026-06-04' })).includes('trip'))
  assert.ok(paths(req({ team_count: 2 })).includes('teams'))
  assert.ok(paths(req({ post_count: 3 })).includes('checkpoints'))
  assert.ok(validateTrip(d).ok) // uten req som før
  assert.ok(validateTrip(d, { ugyldig: true }).ok) // ugyldig req gir ingen ekstra kontroll
})

test('deaktiverte poster teller ikke som aktive', () => {
  const r = req({ post_count: 4 }); const d = buildMockDraft(r, seedDraft)
  d.checkpoints[0].status = 'deactivated'
  assert.equal(validateTrip(d, r).ok, false)
})

test('turens tekster passer forespørselen og nevner ikke prøveturen', () => {
  const d = buildMockDraft(req({ participant_count: 9 }), seedDraft)
  assert.equal(d.trip.name, `Tur til ${seedDraft.trip.destination}`)
  assert.equal(d.trip.description, `3 dager i ${seedDraft.trip.destination} for 9 deltakere, med program og rebus gjennom byen.`)
  assert.doesNotMatch(`${d.trip.name} ${d.trip.description} ${d.trip.announcement}`, /prøvetur|åtte venner/i)
})

test('en dag og en deltaker skrives i entall', () => {
  const d = buildMockDraft(req({ end_date: '2026-06-01', participant_count: 1 }), seedDraft)
  assert.match(d.trip.description, /^En dag i .+ for 1 deltaker,/)
})
