import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hasSubmissions, pointsOf, standings, teamScores } from '../src/lib/scoring.js'
import { standings as viaCore } from '../src/lib/core.js'
import { pointsError, pointsFromInput, validateTrip } from '../src/lib/validate.js'

// Delt fasit: de samme tilfellene skal gi samme svar i viewet `team_scores` (Story 7.4)
const cases = JSON.parse(readFileSync(new URL('./fixtures/scoring-cases.json', import.meta.url), 'utf8'))

function build(testCase) {
  const teams = testCase.teams.map((id) => ({ id, name: `Lag ${id}`, emoji: '🏁' }))
  const checkpoints = Object.entries(testCase.checkpoints).map(([id, points]) => ({ id, points, status: testCase.deactivated?.includes(id) ? 'deactivated' : 'active' }))
  const submissions = testCase.submissions.map(([team_id, checkpoint_id, status], i) => ({ id: `s${i}`, team_id, checkpoint_id, status }))
  return { teams, checkpoints, submissions }
}

for (const testCase of cases) {
  test(`fasit: ${testCase.name}`, () => {
    const { teams, checkpoints, submissions } = build(testCase)
    const scores = teamScores(teams, checkpoints, submissions)
    for (const [team, [points, completed]] of Object.entries(testCase.expected)) {
      assert.deepEqual([scores.get(team).points, scores.get(team).completed], [points, completed], team)
    }
    const table = standings(teams, checkpoints, submissions)
    assert.equal(table.length, teams.length)
    for (const row of table) assert.deepEqual([row.points, row.completed], testCase.expected[row.id])
  })
}

test('core.js eksporterer samme standings som scoring.js', () => {
  assert.equal(viaCore, standings)
})

test('sortering: poeng synkende, så navn i norsk rekkefølge', () => {
  const teams = [{ id: 'a', name: 'Ørnene' }, { id: 'b', name: 'Åsene' }, { id: 'c', name: 'Bjørnene' }, { id: 'd', name: 'Revene' }]
  const checkpoints = [{ id: 'p', points: 10 }]
  const submissions = [{ team_id: 'd', checkpoint_id: 'p', status: 'approved' }]
  assert.deepEqual(standings(teams, checkpoints, submissions).map((row) => row.id), ['d', 'c', 'a', 'b']) // Revene først, så B, Ø, Å
})

test('tomme og ukjente lister gir ikke krasj', () => {
  assert.deepEqual(standings([], [], []), [])
  assert.deepEqual(standings(undefined, undefined, undefined), [])
  assert.equal(teamScores([{ id: 'a' }], undefined, undefined).get('a').points, 0)
  assert.equal(teamScores([{ id: 'a' }], [{ id: 'p', points: 5 }], [null, undefined, {}]).get('a').points, 0)
})

test('poeng gjelder med postens gjeldende poeng, også etter at de er endret', () => {
  const teams = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
  const submissions = [{ team_id: 'a', checkpoint_id: 'p', status: 'approved' }, { team_id: 'b', checkpoint_id: 'p', status: 'approved' }]
  assert.deepEqual(standings(teams, [{ id: 'p', points: 10 }], submissions).map((r) => r.points), [10, 10])
  assert.deepEqual(standings(teams, [{ id: 'p', points: 25 }], submissions).map((r) => r.points), [25, 25])
})

test('poeng per post: negative, tekst og manglende regnes som 0', () => {
  for (const bad of [-1, NaN, Infinity, '10', null, undefined, {}]) assert.equal(pointsOf({ points: bad }), 0)
  assert.equal(pointsOf(undefined), 0)
  assert.equal(pointsOf({ points: 0 }), 0)
  assert.equal(pointsOf({ points: 12 }), 12)
})

test('inndata endres ikke', () => {
  const teams = [{ id: 'a', name: 'A' }]
  const checkpoints = [{ id: 'p', points: 5 }]
  const submissions = [{ team_id: 'a', checkpoint_id: 'p', status: 'approved' }]
  const before = JSON.stringify([teams, checkpoints, submissions])
  standings(teams, checkpoints, submissions)
  assert.equal(JSON.stringify([teams, checkpoints, submissions]), before)
})

// Poengregler i utkastet: tomme, negative og for store verdier avvises
const draft = () => ({
  trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-24', area: { center: { lat: 0, lng: 0 }, radius_m: 1000 } },
  program_items: [{ id: 'p1', event_date: '2026-04-24', start_time: '10:00', title: 'x' }],
  checkpoints: [{ id: 'c1', title: 'Post', latitude: 0, longitude: 0, radius_m: 10, requires_location: false, points: 10, status: 'active' }],
  teams: [{ id: 't1', name: 'Lag' }],
})
for (const points of [undefined, null, '', -1, 0, 1.5, '10', NaN, 501]) {
  test(`utkast med poeng ${JSON.stringify(points) ?? 'undefined'} avvises`, () => {
    const d = draft()
    d.checkpoints[0].points = points
    const result = validateTrip(d)
    assert.equal(result.ok, false)
    assert.ok(result.issues.some((issue) => issue.path === 'checkpoints[0].points'), 'poengfeilen mangler')
  })
}
test('utkast med poeng 1 og 500 er gyldig', () => {
  for (const points of [1, 500]) {
    const d = draft()
    d.checkpoints[0].points = points
    assert.deepEqual(validateTrip(d), { ok: true })
  }
})

test('fasit: flere tilfeller deles med databasen, og JS-spesifikke er merket', () => {
  const shared = cases.filter((c) => !c.jsOnly)
  const jsOnly = cases.filter((c) => c.jsOnly)
  assert.ok(shared.length >= 6, 'for få delte tilfeller')
  assert.ok(jsOnly.length >= 1)
  for (const c of jsOnly) assert.ok(c.name)
})

test('sortering: uavgjort mellom flere lag gir navnerekkefølge', () => {
  const teams = [{ id: '1', name: 'Dyr' }, { id: '2', name: 'Alfa' }, { id: '3', name: 'Cæsar' }, { id: '4', name: 'Bravo' }]
  assert.deepEqual(standings(teams, [], []).map((row) => row.name), ['Alfa', 'Bravo', 'Cæsar', 'Dyr'])
})

test('dobbel lag-id gir én rad, og første oppføring gjelder', () => {
  const teams = [{ id: 'a', name: 'Første' }, { id: 'a', name: 'Andre' }]
  const table = standings(teams, [{ id: 'p', points: 10 }], [{ team_id: 'a', checkpoint_id: 'p', status: 'approved' }])
  assert.deepEqual(table.map((row) => [row.name, row.points]), [['Første', 10]])
})

test('tomme oppføringer i listene gir ikke krasj', () => {
  const table = standings([null, { id: 'a', name: 'A' }, undefined], [null, { id: 'p', points: 5 }], [null, { team_id: 'a', checkpoint_id: 'p', status: 'approved' }])
  assert.deepEqual(table.map((row) => row.points), [5])
})

test('dobbel post-id: første oppføring gjelder', () => {
  const table = standings([{ id: 'a', name: 'A' }], [{ id: 'p', points: 5 }, { id: 'p', points: 99 }], [{ team_id: 'a', checkpoint_id: 'p', status: 'approved' }])
  assert.equal(table[0].points, 5)
})

test('posten har innsendinger: kan ikke slettes uten at poeng forsvinner', () => {
  const submissions = [{ checkpoint_id: 'p1', status: 'approved' }]
  assert.equal(hasSubmissions('p1', submissions), true)
  assert.equal(hasSubmissions('p2', submissions), false)
  assert.equal(hasSubmissions('p1', undefined), false)
  assert.equal(hasSubmissions('p1', [null, {}]), false)
})

test('poeng fra tekstfelt: bare hele tall', () => {
  assert.equal(pointsFromInput('12'), 12)
  assert.equal(pointsFromInput(' 12 '), 12)
  assert.equal(pointsFromInput('500'), 500)
  for (const bad of ['', '   ', '-5', '1.5', '1,5', '0x10', '1e2', 'abc', '10 poeng', null, undefined]) assert.ok(Number.isNaN(pointsFromInput(bad)), JSON.stringify(bad))
})

test('felles poengregel: 1 til 500 godtas, alt annet gir forklaring', () => {
  for (const ok of [1, 10, 500]) assert.equal(pointsError(ok), null)
  for (const bad of [0, -1, 501, 1.5, NaN, '10', null, undefined]) assert.match(pointsError(bad), /1 til 500/)
  assert.match(pointsError(pointsFromInput('')), /1 til 500/)
})
