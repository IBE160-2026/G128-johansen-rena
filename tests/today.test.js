import test from 'node:test'
import assert from 'node:assert/strict'
import { currentEventId, currentTripDay, daysBetween, rebaseDemoDates, shiftDate, sortEvents } from '../src/lib/core.js'
import { initialDemoData } from '../src/data/demo.js'

const at = (h, m) => new Date(2030, 5, 15, h, m) // 15. juni 2030, lokal tid
const events = [
  { id: 'a', event_date: '2030-06-15', start_time: '09:00' },
  { id: 'b', event_date: '2030-06-15', start_time: '12:00:00' }, // databasen gir sekunder
  { id: 'c', event_date: '2030-06-15', start_time: '18:30' },
  { id: 'x', event_date: '2030-06-16', start_time: '08:00' },
]

test('pågår nå: aktiviteten som startet sist', () => {
  assert.equal(currentEventId(events, at(9, 0)), 'a')
  assert.equal(currentEventId(events, at(11, 59)), 'a')
  assert.equal(currentEventId(events, at(12, 0)), 'b')
  assert.equal(currentEventId(events, at(18, 45)), 'c')
})

test('ingen pågår før første aktivitet', () => {
  assert.equal(currentEventId(events, at(8, 59)), null)
  assert.equal(currentEventId(events, at(0, 0)), null)
})

test('den siste aktiviteten pågår i 60 minutter', () => {
  assert.equal(currentEventId(events, at(19, 29)), 'c')
  assert.equal(currentEventId(events, at(19, 30)), null)
  assert.equal(currentEventId(events, at(23, 59)), null)
})

test('aktiviteter på andre dager pågår aldri nå', () => {
  assert.equal(currentEventId(events, new Date(2030, 5, 14, 12, 0)), null)
  assert.equal(currentEventId(events, new Date(2030, 5, 17, 8, 30)), null)
})

test('uten programposter eller i usortert rekkefølge', () => {
  assert.equal(currentEventId([], at(12, 0)), null)
  assert.equal(currentEventId([...events].reverse(), at(13, 0)), 'b')
})

test('shiftDate og daysBetween over måneds- og årsskifte', () => {
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01')
  assert.equal(shiftDate('2026-03-01', -1), '2026-02-28')
  assert.equal(shiftDate('2026-04-24', 0), '2026-04-24')
  assert.equal(daysBetween('2026-04-24', '2026-04-27'), 3)
  assert.equal(daysBetween('2026-04-27', '2026-04-24'), -3)
})

test('dagens kort: første dag før start, siste dag etter slutt', () => {
  assert.equal(currentTripDay('2030-06-10', '2030-06-12', at(10, 0)), '2030-06-12')
  assert.equal(currentTripDay('2030-06-20', '2030-06-22', at(10, 0)), '2030-06-20')
  assert.equal(currentTripDay('2030-06-14', '2030-06-16', at(10, 0)), '2030-06-15')
})

test('demo-data flyttes slik at i dag er dag 2 og turen er i gang', () => {
  const now = at(10, 0)
  const data = initialDemoData(now)
  const days = [...new Set(data.program.map((item) => item.event_date))].sort()
  assert.equal(days[1], '2030-06-15')
  assert.equal(data.trip.start_date, '2030-06-14')
  assert.equal(daysBetween(data.trip.start_date, data.trip.end_date), 3)
  assert.equal(currentTripDay(data.trip.start_date, data.trip.end_date, now), '2030-06-15')
  assert.equal(sortEvents(data.program).length, data.program.length)
})

test('demo-data holder programposter innenfor turens periode etter flytting', () => {
  const data = initialDemoData(new Date(2031, 0, 1, 12, 0)) // årsskifte
  for (const item of data.program) assert.ok(item.event_date >= data.trip.start_date && item.event_date <= data.trip.end_date)
})

test('ugyldig starttid hoppes over uten krasj', () => {
  const messy = [{ id: 'n', event_date: '2030-06-15', start_time: null }, { id: 'm', event_date: '2030-06-15', start_time: 'abc' }, ...events]
  assert.equal(currentEventId(messy, at(10, 0)), 'a')
})

test('to aktiviteter med samme starttid: den siste av dem pågår', () => {
  const same = [{ id: 'p', event_date: '2030-06-15', start_time: '10:00' }, { id: 'q', event_date: '2030-06-15', start_time: '10:00' }, { id: 'r', event_date: '2030-06-15', start_time: '11:00' }]
  assert.equal(currentEventId(same, at(10, 30)), 'q')
  assert.equal(currentEventId(same, at(11, 0)), 'r')
})

test('en sen siste aktivitet slutter ved midnatt, ikke etter', () => {
  const late = [{ id: 'z', event_date: '2030-06-15', start_time: '23:30' }]
  assert.equal(currentEventId(late, at(23, 45)), 'z')
  assert.equal(currentEventId(late, at(0, 10)), null)
})

test('rebaseDemoDates: turen er i gang og i dag er dag 2, også dagen etter', () => {
  const first = initialDemoData(at(10, 0))
  const nextDay = rebaseDemoDates(first, new Date(2030, 5, 16, 9, 0))
  const days = [...new Set(nextDay.program.map((item) => item.event_date))].sort()
  assert.equal(days[1], '2030-06-16')
  assert.equal(nextDay.trip.start_date, '2030-06-15')
  assert.equal(daysBetween(nextDay.trip.start_date, nextDay.trip.end_date), 3)
  assert.equal(first.trip.start_date, '2030-06-14') // original uendret
})

test('rebaseDemoDates er idempotent og gir samme objekt når alt stemmer', () => {
  const data = initialDemoData(at(10, 0))
  assert.equal(rebaseDemoDates(data, at(15, 0)), data)
  const moved = rebaseDemoDates(data, new Date(2030, 5, 20, 9, 0))
  assert.equal(rebaseDemoDates(moved, new Date(2030, 5, 20, 18, 0)), moved)
})
