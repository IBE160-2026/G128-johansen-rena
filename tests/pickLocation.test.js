import test from 'node:test'
import assert from 'node:assert/strict'
import { pickLocation } from '../src/lib/pickLocation.js'

const area = { center: { lat: 47.4979, lng: 19.0402 }, radius_m: 5000 }

test('punkt innenfor området rundes til 6 desimaler', () => {
  assert.deepEqual(pickLocation({ lat: 47.49791234567, lng: 19.04021234567 }, area), { ok: true, lat: 47.497912, lng: 19.040212 })
})

test('punkt utenfor området avvises med forklaring', () => {
  const r = pickLocation({ lat: 48.5, lng: 19.04 }, area)
  assert.equal(r.ok, false)
  assert.match(r.error, /utenfor/)
})

test('uten område godtas ethvert gyldig punkt', () => {
  assert.deepEqual(pickLocation({ lat: -33.9, lng: 151.2 }, null), { ok: true, lat: -33.9, lng: 151.2 })
  assert.equal(pickLocation({ lat: 1, lng: 2 }, undefined).ok, true)
})

test('ugyldige punkt gir ok false uten krasj', () => {
  for (const p of [null, undefined, {}, { lat: NaN, lng: 1 }, { lat: 1, lng: null }, { lat: 91, lng: 0 }, { lat: 0, lng: 181 }, 'x']) {
    const r = pickLocation(p, area)
    assert.equal(r.ok, false)
    assert.ok(r.error)
  }
})

test('område med radius 0 eller negativ ignoreres, og et punkt ved kanten avrundes før kontrollen', async () => {
  const { pickLocation } = await import('../src/lib/pickLocation.js')
  assert.equal(pickLocation({ lat: 47.5, lng: 19.04 }, { center: { lat: 47.5, lng: 19.04 }, radius_m: 0 }).ok, true)
  assert.equal(pickLocation({ lat: 47.5, lng: 19.04 }, { center: { lat: 47.5, lng: 19.04 }, radius_m: -5 }).ok, true)
  const r = pickLocation({ lat: 47.5000004, lng: 19.0400004 }, { center: { lat: 47.5, lng: 19.04 }, radius_m: 1 })
  assert.deepEqual([r.ok, r.lat, r.lng], [true, 47.5, 19.04])
})
