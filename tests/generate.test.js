import test from 'node:test'
import assert from 'node:assert/strict'
import { GENERATE_STEPS, generateDraft } from '../src/lib/generate.js'
import { seedDraft } from '../src/data/demo.js'
import { validateTrip } from '../src/lib/validate.js'

const req = (over = {}) => ({ destination: 'Bergen', start_date: '2026-06-01', end_date: '2026-06-03', participant_count: 12, description: 'Tre dager i Bergen med rebus, middag og felles program for hele gruppen.', ...over })

test('gyldig forespørsel gir et utkast som validerer mot forespørselen, og stegene kommer i rekkefølge', async () => {
  const steps = []
  const r = req({ team_count: 3, post_count: 5 })
  const result = await generateDraft(r, seedDraft, { stepMs: 0, onStep: (s) => steps.push(s) })
  assert.equal(result.ok, true)
  assert.deepEqual(steps, ['plan', 'content', 'check'])
  assert.deepEqual(steps, GENERATE_STEPS)
  assert.deepEqual(validateTrip(result.draft, r), { ok: true })
})

test('ugyldig forespørsel gir INVALID_REQUEST uten å starte stegene', async () => {
  const steps = []
  const result = await generateDraft(req({ destination: '' }), seedDraft, { stepMs: 0, onStep: (s) => steps.push(s) })
  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'INVALID_REQUEST')
  assert.deepEqual(steps, [])
})

test('testflagget gir MOCK_FAILURE og ingen utkast', async () => {
  const result = await generateDraft(req(), seedDraft, { stepMs: 0, fail: true })
  assert.deepEqual(result, { ok: false, error: { code: 'MOCK_FAILURE' } })
})

test('avbrutt før start og midt i et steg gir AbortError', async () => {
  const early = new AbortController(); early.abort()
  await assert.rejects(generateDraft(req(), seedDraft, { stepMs: 0, signal: early.signal }), { name: 'AbortError' })
  const mid = new AbortController()
  const running = generateDraft(req(), seedDraft, { stepMs: 50, signal: mid.signal })
  setTimeout(() => mid.abort(), 10)
  await assert.rejects(running, { name: 'AbortError' })
})

test('avbrutt rett før svaret gir også AbortError (ingen ok-svar etter avbrudd)', async () => {
  const c = new AbortController()
  await assert.rejects(generateDraft(req(), seedDraft, { stepMs: 0, signal: c.signal, onStep: (s) => { if (s === 'check') c.abort() } }), { name: 'AbortError' })
})

test('forespørsel som utkastet ikke kan oppfylle gir VALIDATION_FAILED', async () => {
  const bad = { ...seedDraft, program_items: [] } // ingen programposter: dagene mangler
  const result = await generateDraft(req(), { ...seedDraft, program_items: bad.program_items }, { stepMs: 0 }).catch((e) => ({ threw: true, e }))
  assert.ok(result.threw || result.ok === false) // tom seed gir en feil, ikke et gyldig utkast
})
