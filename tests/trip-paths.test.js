import test from 'node:test'
import assert from 'node:assert/strict'
import { findTripBySlug, slugFromPath, tripPath } from '../src/lib/core.js'
import { initialDemoData } from '../src/data/demo.js'

test('adressen til en tur bygges fra slug', () => {
  assert.equal(tripPath('blatur-2026'), '/t/blatur-2026')
  assert.equal(tripPath('blatur-2026', 'program'), '/t/blatur-2026/program')
  assert.equal(tripPath('blatur-2026', '/rebus'), '/t/blatur-2026/rebus')
})

test('slug leses ut av adressen', () => {
  assert.equal(slugFromPath('/t/blatur-2026/program'), 'blatur-2026')
  assert.equal(slugFromPath('/t/finnes-ikke'), 'finnes-ikke')
  assert.equal(slugFromPath('/'), null)
  assert.equal(slugFromPath('/program'), null)
  assert.equal(slugFromPath('/t/%E0%A4%A'), null)
  assert.equal(tripPath('a', '//rebus'), '/t/a/rebus')
})

test('kjent tur finnes, ukjent tur gir null (I/O-matrisen: kjent og ukjent tur)', () => {
  const { trip } = initialDemoData()
  assert.equal(findTripBySlug([trip], trip.slug), trip)
  assert.equal(findTripBySlug([trip], 'finnes-ikke'), null)
})

test('turen har sin egen tittel og sine egne datoer i dataene', () => {
  const { trip } = initialDemoData()
  assert.ok(trip.name && trip.start_date && trip.end_date)
})
