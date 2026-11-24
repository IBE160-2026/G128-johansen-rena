import test from 'node:test'
import assert from 'node:assert/strict'
import { LOCKED_HINT, activeCheckpoints, checkpointBounds, checkpointStatus, hasCoordinates } from '../src/lib/core.js'
import { seedDraft } from '../src/data/demo.js'

const cp = (over = {}) => ({ id: 'c1', title: 'Post', latitude: 47.5, longitude: 19.0, requires_location: true, status: 'active', position: 1, ...over })
const sub = (over = {}) => ({ id: 's1', checkpoint_id: 'c1', team_id: 't1', status: 'pending', created_at: '2030-01-01T10:00:00Z', ...over })

test('aktive poster sorteres på posisjon, og deaktiverte vises ikke', () => {
  const list = activeCheckpoints([cp({ id: 'b', position: 2 }), cp({ id: 'a', position: 1 }), cp({ id: 'x', position: 3, status: 'deactivated' })])
  assert.deepEqual(list.map((c) => c.id), ['a', 'b'])
})

test('uten poster gir tom liste (ikke krasj)', () => {
  assert.deepEqual(activeCheckpoints([]), [])
  assert.deepEqual(activeCheckpoints(undefined), [])
})

test('seed-postene har både låste og åpne, og alle er aktive', () => {
  const list = activeCheckpoints(seedDraft.checkpoints)
  assert.equal(list.length, seedDraft.checkpoints.length)
  assert.ok(list.some((c) => checkpointStatus(c, [], 't').lock === 'locked'))
  assert.ok(list.some((c) => checkpointStatus(c, [], 't').lock === 'open'))
})

test('låst post uten innsending: Låst, ikon og ingen innsending', () => {
  const s = checkpointStatus(cp(), [], 't1')
  assert.deepEqual([s.lock, s.submission, s.canSubmit, s.label, s.icon], ['locked', 'none', false, 'Låst', '🔒'])
})

test('åpen post uten innsending kan leveres', () => {
  const s = checkpointStatus(cp({ requires_location: false }), [], 't1')
  assert.deepEqual([s.lock, s.canSubmit, s.label, s.icon], ['open', true, 'Åpen', '○'])
})

test('åpen post uten lag kan ikke leveres', () => {
  assert.equal(checkpointStatus(cp({ requires_location: false }), [], null).canSubmit, false)
})

test('venter og godkjent: kan ikke leveres på nytt', () => {
  const open = cp({ requires_location: false })
  assert.deepEqual([checkpointStatus(open, [sub()], 't1').label, checkpointStatus(open, [sub()], 't1').canSubmit], ['Venter på godkjenning', false])
  assert.deepEqual([checkpointStatus(open, [sub({ status: 'approved' })], 't1').label, checkpointStatus(open, [sub({ status: 'approved' })], 't1').canSubmit], ['Godkjent', false])
})

test('avvist: kan leveres på nytt, og siste innsending avgjør', () => {
  const open = cp({ requires_location: false })
  const rejected = [sub({ status: 'rejected' })]
  assert.deepEqual([checkpointStatus(open, rejected, 't1').label, checkpointStatus(open, rejected, 't1').canSubmit], ['Avvist, prøv igjen', true])
  const resubmitted = [sub({ id: 'a', status: 'rejected', created_at: '2030-01-01T10:00:00Z' }), sub({ id: 'b', status: 'pending', created_at: '2030-01-01T11:00:00Z' })]
  assert.equal(checkpointStatus(open, resubmitted, 't1').submission, 'pending')
})

test('innsendinger fra andre lag eller poster teller ikke', () => {
  const open = cp({ requires_location: false })
  const others = [sub({ team_id: 't2' }), sub({ checkpoint_id: 'c2' })]
  assert.equal(checkpointStatus(open, others, 't1').submission, 'none')
})

test('en låst post med godkjent innsending viser Godkjent, men kan ikke leveres', () => {
  const s = checkpointStatus(cp(), [sub({ status: 'approved' })], 't1')
  assert.deepEqual([s.label, s.canSubmit, s.lock], ['Godkjent', false, 'locked'])
})

test('grenser rommer alle poster', () => {
  const bounds = checkpointBounds([cp({ latitude: 47.4, longitude: 19.1 }), cp({ latitude: 47.6, longitude: 19.0 }), cp({ latitude: 47.5, longitude: 19.2 })])
  assert.deepEqual(bounds, [[47.4, 19.0], [47.6, 19.2]])
})

test('grenser: én post gir samme punkt, ingen poster og ugyldige koordinater gir null', () => {
  assert.deepEqual(checkpointBounds([cp()]), [[47.5, 19.0], [47.5, 19.0]])
  assert.equal(checkpointBounds([]), null)
  assert.equal(checkpointBounds(undefined), null)
  assert.equal(checkpointBounds([cp({ latitude: null }), cp({ longitude: 'x' })]), null)
})

test('seed-postene ligger innenfor grensene', () => {
  const bounds = checkpointBounds(seedDraft.checkpoints)
  for (const c of seedDraft.checkpoints) {
    assert.ok(c.latitude >= bounds[0][0] && c.latitude <= bounds[1][0])
    assert.ok(c.longitude >= bounds[0][1] && c.longitude <= bounds[1][1])
  }
})

const table = (rows) => rows.map(([name, checkpoint, submissions, teamId, expected]) => ({ name, checkpoint, submissions, teamId, expected }))

for (const { name, checkpoint, submissions, teamId, expected } of table([
  ['låst, ingen innsending, med lag', cp(), [], 't1', { lock: 'locked', canSubmit: false, canSeeTask: false, action: 'locked' }],
  ['åpen, ingen innsending, med lag', cp({ requires_location: false }), [], 't1', { lock: 'open', canSubmit: true, canSeeTask: true, action: 'solve' }],
  ['åpen, uten lag', cp({ requires_location: false }), [], undefined, { lock: 'open', canSubmit: false, canSeeTask: true, action: 'noteam' }],
  ['låst, uten lag', cp(), [], null, { lock: 'locked', canSubmit: false, canSeeTask: false, action: 'noteam' }],
  ['låst, venter: oppgaven vises, kan ikke leveres', cp(), [sub()], 't1', { lock: 'locked', canSubmit: false, canSeeTask: true, action: 'sent' }],
  ['låst, godkjent', cp(), [sub({ status: 'approved' })], 't1', { lock: 'locked', canSubmit: false, canSeeTask: true, action: 'sent' }],
  ['låst, avvist: kan leveres på nytt (laget var på stedet)', cp(), [sub({ status: 'rejected' })], 't1', { lock: 'locked', canSubmit: true, canSeeTask: true, action: 'solve' }],
  ['åpen, avvist', cp({ requires_location: false }), [sub({ status: 'rejected' })], 't1', { lock: 'open', canSubmit: true, canSeeTask: true, action: 'solve' }],
  ['mangler requires_location (eldre data): åpen', cp({ requires_location: undefined }), [], 't1', { lock: 'open', canSubmit: true, canSeeTask: true, action: 'solve' }],
  ['ukjent innsendingsstatus regnes som ingen', cp({ requires_location: false }), [sub({ status: 'noe-rart' })], 't1', { lock: 'open', canSubmit: true, canSeeTask: true, action: 'solve' }],
])) {
  test(`oppgave og knapp: ${name}`, () => {
    const s = checkpointStatus(checkpoint, submissions, teamId)
    for (const [key, value] of Object.entries(expected)) assert.equal(s[key], value, key)
  })
}

test('siste innsending er `latest`, og uten tidsstempel vinner den siste i listen', () => {
  const open = cp({ requires_location: false })
  const a = sub({ id: 'a', status: 'approved', created_at: undefined })
  const b = sub({ id: 'b', status: 'rejected', created_at: undefined })
  assert.equal(checkpointStatus(open, [a, b], 't1').latest.id, 'b')
  assert.equal(checkpointStatus(open, [], 't1').latest, null)
})

test('hasCoordinates godtar bare endelige tall', () => {
  assert.equal(hasCoordinates(cp()), true)
  for (const bad of [{ latitude: null }, { longitude: undefined }, { latitude: '47.5' }, { latitude: NaN }, undefined]) {
    assert.equal(hasCoordinates(bad === undefined ? undefined : cp(bad)), false)
  }
})

test('den låste teksten er felles og ikke tom', () => {
  assert.ok(LOCKED_HINT.length > 10)
})
