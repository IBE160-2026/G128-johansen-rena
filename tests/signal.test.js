import test from 'node:test'
import assert from 'node:assert/strict'
import { makeMessage, isRelevant, shouldRefreshNow, createStoredMarks } from '../src/lib/signal.js'

test('makeMessage har bare type, tripId og sender', () => {
  assert.deepEqual(makeMessage('t1', 'a'), { type: 'changed', tripId: 't1', sender: 'a' })
})

test('melding fra annen fane på samme tur er relevant', () => {
  assert.equal(isRelevant(makeMessage('t1', 'a'), 't1', 'b'), true)
})

test('egen melding ignoreres', () => {
  assert.equal(isRelevant(makeMessage('t1', 'a'), 't1', 'a'), false)
})

test('annen tur ignoreres', () => {
  assert.equal(isRelevant(makeMessage('t2', 'a'), 't1', 'b'), false)
})

test('ugyldige meldinger ignoreres uten krasj', () => {
  for (const m of [null, undefined, 'changed', 42, [], {}, { type: 'changed' }, { type: 'changed', tripId: 't1' }, { type: 'x', tripId: 't1', sender: 'a' }, { type: 'changed', tripId: 1, sender: 'a' }]) {
    assert.equal(isRelevant(m, 't1', 'b'), false)
  }
})

test('henting: første gang, etter 2 s og ikke før', () => {
  assert.equal(shouldRefreshNow(null, 1000), true)
  assert.equal(shouldRefreshNow(0, 1999), false)
  assert.equal(shouldRefreshNow(0, 2000), true)
  assert.equal(shouldRefreshNow(1000, 1500, 2000), false)
})

test('mangler fanens egen tur eller id, ignoreres meldingen', () => {
  assert.equal(isRelevant(makeMessage('t1', 'a'), undefined, 'b'), false)
  assert.equal(isRelevant(makeMessage('t1', 'a'), 't1', undefined), false)
})

test('klokke som går bakover gir ny henting', () => {
  assert.equal(shouldRefreshNow(5000, 1000), true)
})

test('alle datasett som er lest fra lagringen, huskes, ikke bare det siste', () => {
  const marks = createStoredMarks()
  const older = { trip: { announcement: 'Før' } }
  const newer = { trip: { announcement: 'Etter' } }
  marks.add(older)
  marks.add(newer) // to lesinger tett: lagringen for den eldste kan kjøre etter at den nyeste er lest
  assert.equal(marks.has(older), true)
  assert.equal(marks.has(newer), true)
  assert.equal(marks.has({ ...newer }), false) // en lokal endring er et nytt objekt og skal lagres
})

test('merkene tåler tomme data', () => {
  const marks = createStoredMarks()
  for (const bad of [null, undefined, 'x', 1]) {
    marks.add(bad)
    assert.equal(marks.has(bad), false)
  }
})
