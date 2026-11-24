import test from 'node:test'
import assert from 'node:assert/strict'
import { clearTripCache, isNetworkError, loadTripCache, saveTripCache } from '../src/lib/tripCache.js'
import { initialDemoData } from '../src/data/demo.js'

function fakeStorage() {
  const map = new Map()
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)) }, removeItem: (k) => { map.delete(k) } }
}
const broken = { getItem() { throw new Error('x') }, setItem() { throw new Error('full') } }
const full = () => ({ ...initialDemoData(), own: { id: 'm1', role: 'participant' } })

test('lagret tur kommer tilbake med tomme innsendinger og bilder', () => {
  const storage = fakeStorage()
  const data = full()
  data.submissions = [{ id: 's' }]
  data.photos = [{ id: 'p' }]
  assert.equal(saveTripCache(storage, data.trip.slug, 'u1', data), true)
  const loaded = loadTripCache(storage, data.trip.slug, 'u1')
  assert.deepEqual(loaded.program, data.program)
  assert.deepEqual(loaded.own, data.own)
  assert.deepEqual(loaded.submissions, [])
  assert.deepEqual(loaded.photos, [])
  assert.ok(loaded.saved_at)
})

test('mellomlageret er per tur og per bruker', () => {
  const storage = fakeStorage()
  const data = full()
  saveTripCache(storage, data.trip.slug, 'u1', data)
  assert.equal(loadTripCache(storage, data.trip.slug, 'u2'), null)
  assert.equal(loadTripCache(storage, 'annen-tur', 'u1'), null)
})

test('tomt, ødelagt eller feil form gir null', () => {
  const storage = fakeStorage()
  assert.equal(loadTripCache(storage, 's', 'u'), null)
  storage.setItem('tripbuilder-cache-v1:s:u', '{ikke json')
  assert.equal(loadTripCache(storage, 's', 'u'), null)
  storage.setItem('tripbuilder-cache-v1:s:u', JSON.stringify({ version: 1, data: { trip: { slug: 's' }, program: 'x' } }))
  assert.equal(loadTripCache(storage, 's', 'u'), null)
  storage.setItem('tripbuilder-cache-v1:s:u', JSON.stringify({ version: 99, data: full() }))
  assert.equal(loadTripCache(storage, 's', 'u'), null)
})

test('utilgjengelig eller full lagring krasjer ikke', () => {
  assert.equal(loadTripCache(broken, 's', 'u'), null)
  assert.equal(saveTripCache(broken, 's', 'u', full()), false)
  assert.equal(saveTripCache(null, 's', 'u', full()), false)
})

test('lagring uten tur, slug eller bruker avvises', () => {
  const storage = fakeStorage()
  assert.equal(saveTripCache(storage, '', 'u', full()), false)
  assert.equal(saveTripCache(storage, 's', '', full()), false)
  assert.equal(saveTripCache(storage, 's', 'u', {}), false)
  assert.equal(storage.map.size, 0)
})

test('nettfeil skilles fra tilgangs- og serverfeil', () => {
  assert.equal(isNetworkError(new TypeError('Failed to fetch'), true), true)
  assert.equal(isNetworkError({ message: 'TypeError: Failed to fetch' }, true), true)
  assert.equal(isNetworkError({ message: 'Load failed' }, true), true)
  assert.equal(isNetworkError(new Error('x'), false), true) // nettleseren sier at den er frakoblet
  assert.equal(isNetworkError({ message: 'permission denied for table trips', code: '42501' }, true), false)
  assert.equal(isNetworkError({ message: 'Internal server error' }, true), false)
  assert.equal(isNetworkError(undefined, true), false)
})

test('clearTripCache sletter bare denne turen og brukeren', () => {
  const storage = fakeStorage()
  const data = full()
  saveTripCache(storage, data.trip.slug, 'u1', data)
  saveTripCache(storage, data.trip.slug, 'u2', data)
  clearTripCache(storage, data.trip.slug, 'u1')
  assert.equal(loadTripCache(storage, data.trip.slug, 'u1'), null)
  assert.ok(loadTripCache(storage, data.trip.slug, 'u2'))
  clearTripCache(null, 's', 'u') // krasjer ikke
})

test('mislykket lagring fjerner et eldre mellomlager', () => {
  const storage = fakeStorage()
  const data = full()
  saveTripCache(storage, data.trip.slug, 'u1', data)
  storage.setItem = () => { throw new Error('full') }
  assert.equal(saveTripCache(storage, data.trip.slug, 'u1', data), false)
  assert.equal(loadTripCache(storage, data.trip.slug, 'u1'), null)
})

test('mellomlager uten bruker (own) godtas ikke', () => {
  const storage = fakeStorage()
  const data = full()
  data.own = null
  saveTripCache(storage, data.trip.slug, 'u1', data)
  assert.equal(loadTripCache(storage, data.trip.slug, 'u1'), null)
})
