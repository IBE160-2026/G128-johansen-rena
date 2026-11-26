import test from 'node:test'
import assert from 'node:assert/strict'
import { changedItems, isChanged, loadSeen, markAllSeen, markSeen, saveSeen } from '../src/lib/changes.js'

function fakeStorage() {
  const map = new Map()
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)) }, removeItem: (k) => { map.delete(k) } }
}
const broken = { getItem() { throw new Error('x') }, setItem() { throw new Error('full') } }
const T0 = '2026-11-26T10:00:00.000Z'
const T1 = '2026-11-26T11:00:00.000Z'
const T2 = '2026-11-26T12:00:00.000Z'
const state = (seen = {}) => ({ baseline_at: T0, seen })

test('ny endring er Endret', () => assert.equal(isChanged({ id: 'a', updated_at: T1 }, state()), true))
test('eldre eller lik baseline er ikke Endret (blir med etter endring)', () => {
  assert.equal(isChanged({ id: 'a', updated_at: '2026-11-26T09:00:00Z' }, state()), false)
  assert.equal(isChanged({ id: 'a', updated_at: T0 }, state()), false)
})
test('uten gyldig updated_at er aldri Endret', () => {
  for (const updated_at of [undefined, null, '', 'tull', 5 > 6]) assert.equal(isChanged({ id: 'a', updated_at }, state()), false)
})
test('samme updated_at som sett er ikke Endret, nyere er det', () => {
  assert.equal(isChanged({ id: 'a', updated_at: T1 }, state({ a: T1 })), false)
  assert.equal(isChanged({ id: 'a', updated_at: T2 }, state({ a: T1 })), true)
})
test('åpne ett element markerer bare det', () => {
  const items = [{ id: 'dinner', updated_at: T1 }, { id: 'p4', updated_at: T1 }]
  const next = markSeen(state(), items[0])
  assert.deepEqual(changedItems(items, next).map((i) => i.id), ['p4'])
})
test('merk alle som sett, og ny endring etterpå er ulest', () => {
  const items = [{ id: 'a', updated_at: T1 }, { id: 'b', updated_at: T1 }]
  const next = markAllSeen(state(), items)
  assert.deepEqual(changedItems(items, next), [])
  const later = [{ id: 'a', updated_at: T1 }, { id: 'b', updated_at: T2 }]
  assert.deepEqual(changedItems(later, next).map((i) => i.id), ['b'])
})
test('ugyldig input gir ingen krasj og ingen merker', () => {
  for (const bad of [null, undefined, 'x', {}, 5]) assert.deepEqual(changedItems(bad, state()), [])
  assert.equal(isChanged(null, state()), false)
  assert.equal(isChanged({ updated_at: T1 }, state()), false)
  assert.equal(isChanged({ id: 'a', updated_at: T1 }, null), false)
  const s = state()
  assert.equal(markSeen(s, null), s)
  assert.equal(markSeen(s, { updated_at: T1 }), s)
  assert.deepEqual(markAllSeen(s, null), s)
})
test('loadSeen oppretter baseline første gang og husker den', () => {
  const storage = fakeStorage()
  const first = loadSeen(storage, 't', 'u', new Date(T1))
  assert.equal(first.baseline_at, T1)
  assert.deepEqual(first.seen, {})
  assert.equal(loadSeen(storage, 't', 'u', new Date(T2)).baseline_at, T1)
  assert.ok(storage.map.has('tripbuilder-seen-v1:t:u'))
})
test('sett-status lagres og leses tilbake', () => {
  const storage = fakeStorage()
  const next = markSeen(loadSeen(storage, 't', 'u', T0), { id: 'a', updated_at: T1 })
  assert.equal(saveSeen(storage, 't', 'u', next), true)
  assert.deepEqual(loadSeen(storage, 't', 'u', T2), next)
  assert.equal(loadSeen(storage, 't', 'other', T2).baseline_at, T2) // per bruker
})
test('ødelagt lagring starter på nytt', () => {
  for (const raw of ['{{', 'null', '{"version":1}', '{"version":1,"baseline_at":"tull","seen":{}}', '{"version":1,"baseline_at":"2026-11-26T10:00:00Z","seen":[]}']) {
    const storage = fakeStorage()
    storage.setItem('tripbuilder-seen-v1:t:u', raw)
    const s = loadSeen(storage, 't', 'u', T2)
    assert.equal(s.baseline_at, T2)
    assert.deepEqual(s.seen, {})
  }
})
test('utilgjengelig lagring krasjer ikke', () => {
  const s = loadSeen(broken, 't', 'u', T1)
  assert.equal(s.baseline_at, T1)
  assert.equal(saveSeen(broken, 't', 'u', s), false)
  assert.equal(loadSeen(null, 't', 'u', T1).baseline_at, T1)
})

import { mergeSeen, readSeen } from '../src/lib/changes.js'

test('to faner: tidligste baseline og seneste sett-tid per element', () => {
  const a = { baseline_at: '2026-01-01T10:00:00.000Z', seen: { x: '2026-01-01T12:00:00.000Z', y: '2026-01-01T11:00:00.000Z' } }
  const b = { baseline_at: '2026-01-01T09:00:00.000Z', seen: { x: '2026-01-01T11:30:00.000Z', z: '2026-01-01T13:00:00.000Z' } }
  const m = mergeSeen(a, b)
  assert.equal(m.baseline_at, '2026-01-01T09:00:00.000Z')
  assert.deepEqual(m.seen, { x: '2026-01-01T12:00:00.000Z', y: '2026-01-01T11:00:00.000Z', z: '2026-01-01T13:00:00.000Z' })
  assert.equal(mergeSeen(null, b), b)
  assert.equal(mergeSeen(a, null), a)
  assert.equal(mergeSeen(null, null), null)
})

test('readSeen oppretter ingenting og gir null uten lagret tilstand eller med ødelagt lagring', () => {
  const store = new Map()
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
  assert.equal(readSeen(storage, 't', 'u'), null)
  assert.equal(store.size, 0)
  store.set('tripbuilder-seen-v1:t:u', '{ødelagt')
  assert.equal(readSeen(storage, 't', 'u'), null)
  assert.equal(readSeen(null, 't', 'u'), null)
})
