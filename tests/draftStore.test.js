import test from 'node:test'
import assert from 'node:assert/strict'
import { DRAFT_KEY, clearDraft, isCurrentDraft, loadDraft, saveDraft } from '../src/lib/draftStore.js'

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) } }
const draft = {
  trip: { name: 'X', start_date: '2026-04-24', end_date: '2026-04-24', area: { center: { lat: 47.4979, lng: 19.0402 }, radius_m: 5000 } },
  program_items: [{ id: 'p1', event_date: '2026-04-24', start_time: '10:00', title: 'Ankomst' }],
  checkpoints: [{ id: 'c1', title: 'Broen', latitude: 47.4979, longitude: 19.045, radius_m: 50, requires_location: true, points: 10, status: 'active' }],
  teams: [{ id: 't1', name: 'Lag 1' }],
}

test('lagre, laste og slette', () => {
  const s = memory()
  assert.equal(loadDraft(s), null)
  assert.ok(saveDraft(s, { destination: 'A' }, draft, new Date('2026-01-01T00:00:00Z')))
  const got = loadDraft(s)
  assert.deepEqual(got.draft, draft); assert.equal(got.request.destination, 'A'); assert.equal(got.created_at, '2026-01-01T00:00:00.000Z')
  clearDraft(s); assert.equal(loadDraft(s), null)
})

test('ødelagt eller utilgjengelig lagring gir null uten krasj', () => {
  const s = memory(); s.setItem(DRAFT_KEY, '{ikke json'); assert.equal(loadDraft(s), null)
  s.setItem(DRAFT_KEY, '{}'); assert.equal(loadDraft(s), null)
  const broken = { getItem() { throw new Error('x') }, setItem() { throw new Error('x') }, removeItem() { throw new Error('x') } }
  assert.equal(loadDraft(broken), null); assert.equal(saveDraft(broken, {}, draft), false); clearDraft(broken)
})

test('et utkast med valideringsfeil åpnes, men et ødelagt utkast gir null', () => {
  const s = memory()
  saveDraft(s, { destination: 'A' }, { ...draft, program_items: [{ id: 'p1', event_date: '2026-04-24' }] })
  assert.ok(loadDraft(s))
  saveDraft(s, {}, { ...draft, checkpoints: 'x' }); assert.equal(loadDraft(s), null)
  saveDraft(s, {}, { ...draft, teams: [null] }); assert.equal(loadDraft(s), null)
  saveDraft(s, {}, { ...draft, trip: { name: 'X' } }); assert.equal(loadDraft(s), null)
})

test('utkast som ville krasjet visningen gir null: manglende område, ugyldig dato og id-er som ikke er unike', () => {
  const s = memory()
  const tryDraft = (d) => { saveDraft(s, {}, d); return loadDraft(s) }
  assert.ok(tryDraft(draft))
  assert.equal(tryDraft({ ...draft, trip: { ...draft.trip, area: undefined } }), null)
  assert.equal(tryDraft({ ...draft, trip: { ...draft.trip, area: { center: {}, radius_m: 5 } } }), null)
  assert.equal(tryDraft({ ...draft, trip: { ...draft.trip, start_date: '' } }), null)
  assert.equal(tryDraft({ ...draft, trip: { ...draft.trip, end_date: 'abc' } }), null)
  assert.equal(tryDraft({ ...draft, teams: [{ id: 't1', name: 'A' }, { id: 't1', name: 'B' }] }), null)
  assert.equal(tryDraft({ ...draft, checkpoints: [{ ...draft.checkpoints[0], id: '' }] }), null)
  assert.equal(tryDraft({ ...draft, program_items: [{ title: 'uten id' }] }), null)
})

test('en gammel fane kjenner igjen at utkastet er publisert eller byttet ut', () => {
  const s = memory()
  saveDraft(s, {}, draft, new Date('2026-01-01T00:00:00Z'))
  assert.equal(isCurrentDraft(s, '2026-01-01T00:00:00.000Z'), true)
  saveDraft(s, {}, draft, new Date('2026-01-02T00:00:00Z'))
  assert.equal(isCurrentDraft(s, '2026-01-01T00:00:00.000Z'), false)
  clearDraft(s)
  assert.equal(isCurrentDraft(s, '2026-01-02T00:00:00.000Z'), false)
})
