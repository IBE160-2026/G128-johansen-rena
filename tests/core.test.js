import test from 'node:test'
import assert from 'node:assert/strict'
import { currentTripDay, distanceMeters, sortEvents, standings, validateImage } from '../src/lib/core.js'

test('viser første dag før avreise og siste dag etter hjemkomst', () => {
  assert.equal(currentTripDay('2026-04-24', '2026-04-27', new Date('2026-04-20T12:00:00Z')), '2026-04-24')
  assert.equal(currentTripDay('2026-04-24', '2026-04-27', new Date('2026-04-29T12:00:00Z')), '2026-04-27')
})

test('programmet sorteres kronologisk uten å mutere originalen', () => {
  const events = [{ event_date: '2026-04-25', start_time: '12:00' }, { event_date: '2026-04-24', start_time: '08:00' }]
  assert.equal(sortEvents(events)[0].event_date, '2026-04-24')
  assert.equal(events[0].event_date, '2026-04-25')
})

test('bare godkjente innsendinger teller', () => {
  const teams = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
  const checkpoints = [{ id: 'c', points: 20 }]
  const submissions = [{ team_id: 'a', checkpoint_id: 'c', status: 'pending' }, { team_id: 'b', checkpoint_id: 'c', status: 'approved' }]
  assert.equal(standings(teams, checkpoints, submissions)[0].id, 'b')
  assert.equal(standings(teams, checkpoints, submissions)[1].points, 0)
})

test('GPS-avstand er null på samme sted', () => {
  assert.equal(distanceMeters(47.5, 19.05, 47.5, 19.05), 0)
  assert.ok(distanceMeters(47.5, 19.05, 47.51, 19.05) > 1000)
})

test('bildeinnsending godtar vanlige fotoformater og avviser tekst og store filer', () => {
  assert.doesNotThrow(() => validateImage({ type: 'image/jpeg', size: 2_000_000 }))
  assert.doesNotThrow(() => validateImage({ type: 'image/heic', size: 3_000_000 }))
  assert.throws(() => validateImage({ type: 'text/plain', size: 1_000 }), /bilde/i)
  assert.throws(() => validateImage({ type: 'image/png', size: 9_000_000 }), /8 MB/)
})
