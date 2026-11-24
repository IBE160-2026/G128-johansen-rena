import test from 'node:test'
import assert from 'node:assert/strict'
import { initialDemoData, seedDraft } from '../src/data/demo.js'
import { validateTrip } from '../src/lib/validate.js'

const TEAM_COLORS = ['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

test('seed-turen validerer uten feil', () => {
  assert.deepEqual(validateTrip(seedDraft), { ok: true })
})

test('seed-turen har minst to dager med programposter', () => {
  const days = new Set(seedDraft.program_items.map((item) => item.event_date))
  assert.ok(days.size >= 2)
})

test('seed-turen har både geolåste og åpne poster', () => {
  assert.ok(seedDraft.checkpoints.some((cp) => cp.requires_location === true))
  assert.ok(seedDraft.checkpoints.some((cp) => cp.requires_location === false))
})

test('hvert lag har et gyldig fargetoken, og ingen token brukes to ganger', () => {
  const colors = seedDraft.teams.map((team) => team.color)
  assert.ok(colors.every((color) => TEAM_COLORS.includes(color)))
  assert.equal(new Set(colors).size, colors.length)
})

test('alle id-er i seed er faste UUID-er og unike', () => {
  const ids = [seedDraft.trip, ...seedDraft.program_items, ...seedDraft.checkpoints, ...seedDraft.teams, ...seedDraft.members].map((entry) => entry.id)
  assert.ok(ids.every((id) => UUID.test(id)))
  assert.equal(new Set(ids).size, ids.length)
})

test('medlemmene hører til lag i seed, og alle lag har medlemmer', () => {
  const teamIds = new Set(seedDraft.teams.map((team) => team.id))
  assert.ok(seedDraft.members.every((member) => teamIds.has(member.team_id)))
  for (const team of seedDraft.teams) assert.ok(seedDraft.members.some((member) => member.team_id === team.id))
})

test('appens demo-data bygges fra seed med turens id på alt', () => {
  const data = initialDemoData()
  assert.equal(data.trip.id, seedDraft.trip.id)
  assert.deepEqual(initialDemoData().trip, data.trip) // deterministisk
  assert.equal(data.trip.slug, seedDraft.trip.slug)
  for (const key of ['teams', 'members', 'program', 'checkpoints']) {
    assert.ok(data[key].length > 0)
    assert.ok(data[key].every((entry) => entry.trip_id === data.trip.id), key)
  }
  assert.deepEqual(data.submissions, [])
})

test('seed inneholder ikke virkelige personnavn', () => {
  const text = JSON.stringify(seedDraft).toLowerCase()
  for (const name of ['knoll', 'kevin', 'stian', 'elias', 'eskil', 'kenneth', 'håvar', 'eirik', 'jørgen', 'pinna', 'renå']) {
    assert.ok(!text.includes(name), name)
  }
})

test('endringer i appens data endrer ikke seed-modulen', () => {
  const data = initialDemoData()
  data.trip.area.radius_m = 1
  data.trip.theme.accent = 'x'
  data.checkpoints[0].title = 'Endret'
  const fresh = initialDemoData()
  assert.equal(fresh.trip.area.radius_m, seedDraft.trip.area.radius_m)
  assert.notEqual(fresh.trip.theme.accent, 'x')
  assert.notEqual(fresh.checkpoints[0].title, 'Endret')
})
