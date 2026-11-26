import test from 'node:test'
import assert from 'node:assert/strict'
import { TEAM_COLORS, memberCounts, moveMember, teamColorToken } from '../src/lib/teams.js'
import { standings } from '../src/lib/scoring.js'

const teams = [{ id: 'a', name: 'A', color: 'team-1' }, { id: 'b', name: 'B', color: 'team-2' }, { id: 'c', name: 'C' }]
const members = [{ id: 'm1', team_id: 'a' }, { id: 'm2', team_id: 'a' }, { id: 'm3', team_id: 'b' }, { id: 'm4', team_id: null }]

test('flytt til annet lag oppdaterer bare den deltakeren', () => {
  const result = moveMember(members, 'm1', 'b', teams)
  assert.equal(result.changed, true)
  assert.deepEqual(result.members.map((m) => m.team_id), ['b', 'a', 'b', null])
  assert.equal(members[0].team_id, 'a') // originalen endres ikke
})

test('flytt til «uten lag» med null og tom streng', () => {
  assert.equal(moveMember(members, 'm1', null, teams).members[0].team_id, null)
  assert.equal(moveMember(members, 'm1', '', teams).members[0].team_id, null)
})

test('samme lag endrer ingenting og gir samme liste', () => {
  const result = moveMember(members, 'm1', 'a', teams)
  assert.equal(result.changed, false)
  assert.equal(result.members, members)
  assert.equal(moveMember(members, 'm4', null, teams).changed, false)
  assert.equal(moveMember([{ id: 'x' }], 'x', null, teams).changed, false) // mangler team_id regnes som uten lag
})

test('ukjent lag og ukjent deltaker avvises uten endring', () => {
  const noTeam = moveMember(members, 'm1', 'finnes-ikke', teams)
  assert.deepEqual([noTeam.changed, noTeam.error, noTeam.members], [false, 'Fant ikke laget.', members])
  const noMember = moveMember(members, 'zzz', 'a', teams)
  assert.deepEqual([noMember.changed, noMember.error], [false, 'Fant ikke deltakeren.'])
})

test('tomme lister gir ikke krasj', () => {
  assert.equal(moveMember(undefined, 'm1', 'a', undefined).error, 'Fant ikke deltakeren.')
  assert.equal(moveMember([], 'm1', null, []).error, 'Fant ikke deltakeren.')
  assert.deepEqual(memberCounts(undefined, undefined).withoutTeam, 0)
})

test('innsendinger blir hos laget som sendte dem når en deltaker flyttes', () => {
  const checkpoints = [{ id: 'p', points: 10 }]
  const submissions = [{ id: 's1', team_id: 'a', checkpoint_id: 'p', status: 'approved', submitted_by: 'm1' }]
  const before = JSON.stringify(submissions)
  moveMember(members, 'm1', 'b', teams) // innsendingen er av m1, men tilhører laget
  assert.equal(JSON.stringify(submissions), before)
  const table = standings(teams, checkpoints, submissions)
  assert.deepEqual(table.map((row) => [row.id, row.points]), [['a', 10], ['b', 0], ['c', 0]])
})

test('antall per lag og uten lag', () => {
  const { counts, withoutTeam } = memberCounts(members, teams)
  assert.deepEqual([counts.get('a'), counts.get('b'), counts.get('c'), withoutTeam], [2, 1, 0, 1])
  assert.equal(memberCounts([{ id: 'x', team_id: 'finnes-ikke' }, null], teams).withoutTeam, 1)
})

test('lagfarge: gyldig farge brukes', () => {
  assert.equal(teamColorToken(teams[0], teams), 'team-1')
  assert.equal(teamColorToken({ color: 'team-6' }), 'team-6')
})

test('lagfarge: lag uten gyldig farge får en ledig farge, og to lag får ikke samme', () => {
  const noColor = [{ id: '1' }, { id: '2', color: 'rød' }, { id: '3', color: null }, { id: '4' }]
  const tokens = noColor.map((team) => teamColorToken(team, noColor))
  assert.equal(new Set(tokens).size, 4)
  assert.ok(tokens.every((token) => TEAM_COLORS.includes(token)))
  assert.deepEqual(tokens, ['team-1', 'team-2', 'team-3', 'team-4'])
})

test('lagfarge: opptatte farger hoppes over, og seks lag uten farge får seks ulike', () => {
  const mixed = [{ id: '1', color: 'team-1' }, { id: '2' }, { id: '3' }]
  assert.deepEqual(mixed.map((team) => teamColorToken(team, mixed)), ['team-1', 'team-2', 'team-3'])
  const six = Array.from({ length: 6 }, (_, i) => ({ id: String(i) }))
  assert.equal(new Set(six.map((team) => teamColorToken(team, six))).size, 6)
})

test('lagfarge: flere enn seks lag gir alltid en gyldig farge', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ id: String(i) }))
  assert.ok(many.every((team) => TEAM_COLORS.includes(teamColorToken(team, many))))
  assert.ok(TEAM_COLORS.includes(teamColorToken(undefined)))
})
