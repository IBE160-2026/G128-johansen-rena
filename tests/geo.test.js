import test from 'node:test'
import assert from 'node:assert/strict'
import { distanceMeters } from '../src/lib/geo.js'
import { distanceMeters as viaCore } from '../src/lib/core.js'

const within = (actual, expected, share = 0.01) => Math.abs(actual - expected) <= expected * share

test('én breddegrad er ca. 111,2 km', () => {
  assert.ok(within(distanceMeters(0, 0, 1, 0), 111195))
})

test('én lengdegrad ved ekvator er ca. 111,2 km', () => {
  assert.ok(within(distanceMeters(0, 0, 0, 1), 111195))
})

test('pol til pol er ca. 20 015 km', () => {
  assert.ok(within(distanceMeters(90, 0, -90, 0), 20015087))
})

test('samme punkt gir 0, og avstanden er symmetrisk', () => {
  assert.equal(distanceMeters(47.5, 19.05, 47.5, 19.05), 0)
  assert.equal(distanceMeters(10, 20, 30, 40), distanceMeters(30, 40, 10, 20))
})

test('core.js eksporterer samme funksjon som geo.js', () => {
  assert.equal(viaCore, distanceMeters)
})

test('motpunkter gir en endelig avstand (ikke NaN)', () => {
  // Avrundingsfeil gir x = 1.0000000000000002 i haversine for disse punktene (NaN uten klemming)
  const d = distanceMeters(19.731067114772642, -161.02606384071734, -19.731067114772642, -161.02606384071734 + 180)
  assert.ok(Number.isFinite(d))
  assert.ok(within(d, 20015087))
})
