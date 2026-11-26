import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTripRequest, clearRequest, emptyForm, loadForm, loadRequest, saveForm, saveRequest, validateForm } from '../src/lib/tripRequest.js'
import { validateTripRequest } from '../src/lib/validate.js'

const LONG = 'Tre dager i Bergen med rebus, middag og felles program for hele gruppen.'
const good = (over = {}) => ({ ...emptyForm(), destination: 'Bergen', start_date: '2026-06-01', end_date: '2026-06-03', participant_count: '12', description: LONG, ...over })
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) } }

test('gyldig skjema gir TripRequest uten valgfrie felt', () => {
  const r = validateForm(good())
  assert.deepEqual(r.errors, {})
  assert.equal(r.hint, '')
  assert.deepEqual(r.request, { destination: 'Bergen', start_date: '2026-06-01', end_date: '2026-06-03', participant_count: 12, description: LONG })
  assert.ok(validateTripRequest(r.request).ok)
})

test('valgfrie felt tas med som tall', () => {
  const r = validateForm(good({ team_count: '4', post_count: ' 8 ' }))
  assert.equal(r.request.team_count, 4)
  assert.equal(r.request.post_count, 8)
})

test('tomme nøkkelfelt og mellomrom gir feil ved hvert felt', () => {
  const r = validateForm(good({ destination: '   ', start_date: '', end_date: '', participant_count: '' }))
  assert.deepEqual(Object.keys(r.errors).sort(), ['destination', 'end_date', 'participant_count', 'start_date'])
  assert.equal(r.request, null)
  assert.equal(r.firstInvalid, 'destination')
})

test('Til før Fra og ugyldig dato', () => {
  assert.ok(validateForm(good({ start_date: '2026-06-05', end_date: '2026-06-01' })).errors.end_date)
  assert.ok(validateForm(good({ start_date: '2026-13-40' })).errors.start_date)
  assert.ok(validateForm(good({ end_date: 'i morgen' })).errors.end_date)
})

test('lag utenfor 1-6 og flere lag enn deltakere', () => {
  assert.ok(validateForm(good({ team_count: '0' })).errors.team_count)
  assert.ok(validateForm(good({ team_count: '7' })).errors.team_count)
  assert.ok(validateForm(good({ participant_count: '3', team_count: '5' })).errors.team_count)
  assert.equal(validateForm(good({ team_count: '6' })).errors.team_count, undefined)
})

test('poster under 1 og ikke helt tall', () => {
  assert.ok(validateForm(good({ post_count: '0' })).errors.post_count)
  assert.ok(validateForm(good({ post_count: '-2' })).errors.post_count)
  assert.ok(validateForm(good({ participant_count: '2,5' })).errors.participant_count)
  assert.ok(validateForm(good({ participant_count: '1e2' })).errors.participant_count)
  assert.ok(validateForm(good({ participant_count: '0' })).errors.participant_count)
})

test('kort beskrivelse gir hint, ikke feil, og ingen request', () => {
  const r = validateForm(good({ description: '  for kort  ' }))
  assert.deepEqual(r.errors, {})
  assert.match(r.hint, /Beskriv gjerne sted/)
  assert.equal(r.request, null)
  assert.equal(r.firstInvalid, 'description')
  assert.ok(validateForm(good({ description: ' '.repeat(40) })).hint)
})

test('for lang beskrivelse er en feil', () => {
  assert.ok(validateForm(good({ description: 'a'.repeat(4001) })).errors.description)
  assert.ok(validateForm(good({ description: 'a'.repeat(4000) })).request)
})

test('buildTripRequest trimmer tekster', () => {
  assert.equal(buildTripRequest(good({ destination: '  Oslo ' })).destination, 'Oslo')
})

test('validateTripRequest avviser ugyldig input', () => {
  assert.equal(validateTripRequest(null).ok, false)
  assert.equal(validateTripRequest({ ...validateForm(good()).request, team_count: 2.5 }).ok, false)
})

test('lagring: gjenoppretting, ødelagt lagring og utilgjengelig lagring', () => {
  const s = memory()
  saveForm(s, good({ team_count: '3' }))
  assert.equal(loadForm(s).team_count, '3')
  assert.equal(loadForm(s).description, LONG)
  s.setItem('tripbuilder-newtrip-v1', '{ikke json')
  assert.deepEqual(loadForm(s), emptyForm())
  const broken = { getItem() { throw new Error('x') }, setItem() { throw new Error('x') }, removeItem() { throw new Error('x') } }
  assert.deepEqual(loadForm(broken), emptyForm())
  assert.equal(saveForm(broken, good()), false)
  assert.equal(loadRequest(broken), null)
})

test('ventende forespørsel lagres og slettes', () => {
  const s = memory()
  const req = validateForm(good()).request
  saveRequest(s, req)
  assert.deepEqual(loadRequest(s), req)
  clearRequest(s)
  assert.equal(loadRequest(s), null)
  s.setItem('tripbuilder-newtrip-request-v1', JSON.stringify({ destination: 'x' }))
  assert.equal(loadRequest(s), null)
})

test('turlengde: 366 dager går, 367 avvises', () => {
  assert.deepEqual(validateForm(good({ start_date: '2026-01-01', end_date: '2026-12-31' })).errors, {}) // 365 dager
  assert.deepEqual(validateForm(good({ start_date: '2027-01-01', end_date: '2028-01-01' })).errors, {}) // 366 dager (2027 er ikke skuddår, 2028-01-01 er dag 366)
  assert.ok(validateForm(good({ start_date: '2027-01-01', end_date: '2028-01-02' })).errors.end_date) // 367 dager
})

test('lag lik deltakere går, og tekst i valgfrie felt gir feil ved feltet', () => {
  assert.deepEqual(validateForm(good({ participant_count: '3', team_count: '3' })).errors, {})
  assert.ok(validateForm(good({ team_count: 'abc' })).errors.team_count)
  assert.ok(validateForm(good({ post_count: '2.5' })).errors.post_count)
  assert.ok(validateForm(good({ post_count: 'abc' })).errors.post_count)
})

test('øvre grenser og for store tall avvises', () => {
  assert.ok(validateForm(good({ participant_count: '1001' })).errors.participant_count)
  assert.deepEqual(validateForm(good({ participant_count: '1000' })).errors, {})
  assert.ok(validateForm(good({ participant_count: '99999999999999999999' })).errors.participant_count)
  assert.ok(validateForm(good({ post_count: '101' })).errors.post_count)
  assert.deepEqual(validateForm(good({ post_count: '100' })).errors, {})
})

test('ugyldig input til validateTripRequest krasjer ikke', () => {
  for (const v of [null, undefined, 'tekst', 42, [], { description: 5, destination: 7, participant_count: '12' }]) {
    assert.equal(validateTripRequest(v).ok, false)
  }
})
