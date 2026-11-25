import test from 'node:test'
import assert from 'node:assert/strict'
import { DRAFT_KEY, clearDraft, loadDraft, saveDraft } from '../src/lib/draftStore.js'

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

test('et ugyldig lagret utkast gir null i stedet for å krasje visningen', () => {
  const s = memory()
  saveDraft(s, { destination: 'A' }, { ...draft, program_items: [{ id: 'p1', event_date: '2026-04-24' }] })
  assert.equal(loadDraft(s), null)
})
