import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_SIDE_PX, NETWORK_MESSAGE, NOTE_MAX, NOTE_MIN, SENT_MESSAGE, buildSubmissionEntry, canSendSubmission, scaleToFit, submissionErrorMessage, validateNote, validationError } from '../src/lib/submission.js'
import { validateImage } from '../src/lib/core.js'
import { isNetworkError } from '../src/lib/tripCache.js'

test('notat: minst 3 tegn etter trim, og høyst 1000', () => {
  assert.equal(validateNote('abc'), null)
  assert.equal(validateNote('  abc  '), null)
  assert.match(validateNote('ab'), /minst 3 tegn/)
  assert.match(validateNote('  a  '), /minst 3 tegn/)
  assert.match(validateNote(''), /minst 3 tegn/)
  assert.equal(validateNote('x'.repeat(NOTE_MAX)), null)
  assert.match(validateNote('x'.repeat(NOTE_MAX + 1)), /1000 tegn/)
})

test('notat: manglende eller ikke-tekst gir feil uten krasj', () => {
  for (const bad of [null, undefined, 42, {}, []]) assert.match(validateNote(bad), /minst/)
  assert.equal(NOTE_MIN, 3)
})

test('lengden telles etter trim, så mellomrom rundt teksten ikke teller', () => {
  assert.equal(validateNote(' '.repeat(5) + 'x'.repeat(NOTE_MAX) + ' '.repeat(5)), null)
})

test('Send krever bilde og gyldig notat og at ingen sending pågår', () => {
  const photo = { name: 'a.jpg' }
  assert.equal(canSendSubmission({ photo, note: 'Vi var her' }), true)
  assert.equal(canSendSubmission({ photo: null, note: 'Vi var her' }), false)
  assert.equal(canSendSubmission({ photo, note: 'ab' }), false)
  assert.equal(canSendSubmission({ photo, note: '   ' }), false)
  assert.equal(canSendSubmission({ photo, note: 'Vi var her', busy: true }), false)
  assert.equal(canSendSubmission({ photo: undefined, note: undefined }), false)
})

test('skalering: lengste side blir høyst 1600, uten forstørring og med riktig forhold', () => {
  assert.deepEqual(scaleToFit(4000, 3000), { width: 1600, height: 1200 })
  assert.deepEqual(scaleToFit(3000, 4000), { width: 1200, height: 1600 })
  assert.deepEqual(scaleToFit(1600, 1600), { width: 1600, height: 1600 })
  assert.deepEqual(scaleToFit(800, 600), { width: 800, height: 600 })
  assert.equal(MAX_SIDE_PX, 1600)
})

test('skalering: ekstreme forhold gir minst 1 piksel, og ugyldige mål gir 1 x 1', () => {
  assert.deepEqual(scaleToFit(100000, 10), { width: 1600, height: 1 })
  for (const [w, h] of [[0, 100], [100, 0], [-5, 100], [NaN, 100], [undefined, undefined]]) {
    assert.deepEqual(scaleToFit(w, h), { width: 1, height: 1 })
  }
})

test('skalering: egen grense brukes (demo-størrelser)', () => {
  assert.deepEqual(scaleToFit(4000, 2000, 1280), { width: 1280, height: 640 })
})

test('meldingene er de avtalte', () => {
  assert.equal(SENT_MESSAGE, 'Sendt! Venter på godkjenning fra arrangøren.')
  assert.equal(NETWORK_MESSAGE, 'Ingen dekning. Prøv igjen når du har nett.')
})

test('nettfeil gir «Ingen dekning», andre feil ikke', () => {
  assert.equal(isNetworkError(new TypeError('Failed to fetch'), true), true)
  assert.equal(isNetworkError({ message: 'new row violates row-level security policy' }, true), false)
})

test('feilmelding: regelfeil vises som de er, selv uten nett', () => {
  const rule = validationError('Laget har allerede sendt inn denne posten.')
  assert.equal(submissionErrorMessage(rule, true), 'Laget har allerede sendt inn denne posten.')
  assert.equal(submissionErrorMessage(rule, false), 'Laget har allerede sendt inn denne posten.')
})

test('feilmelding: nettfeil og frakoblet gir «Ingen dekning», andre feil vises', () => {
  assert.equal(submissionErrorMessage(new TypeError('Failed to fetch'), true), NETWORK_MESSAGE)
  assert.equal(submissionErrorMessage({ message: 'TypeError: Load failed' }, true), NETWORK_MESSAGE)
  assert.equal(submissionErrorMessage(new Error('noe annet'), false), NETWORK_MESSAGE)
  assert.equal(submissionErrorMessage(new Error('new row violates row-level security policy'), true), 'new row violates row-level security policy')
  assert.match(submissionErrorMessage(undefined, true), /Noe gikk galt/)
  assert.match(submissionErrorMessage({}, true), /Noe gikk galt/)
})

test('rad for innsending: notatet trimmes og statusen er alltid ventende', () => {
  const entry = buildSubmissionEntry({ tripId: 't', teamId: 'l', checkpointId: 'c', userId: 'u', note: '  Vi var her  ' })
  assert.deepEqual(entry, { trip_id: 't', team_id: 'l', checkpoint_id: 'c', submitted_by: 'u', note: 'Vi var her', status: 'pending' })
  assert.equal(buildSubmissionEntry({ tripId: 't', teamId: 'l', checkpointId: 'c', userId: 'u', note: undefined }).note, '')
})

test('bildevalidering: HEIC og tom filtype får egen forklaring, og ugyldig størrelse avvises', () => {
  assert.throws(() => validateImage({ type: 'image/heic', size: 1000 }), /HEIC/)
  assert.throws(() => validateImage({ type: 'image/heif', size: 1000 }), /Mest kompatibel/)
  assert.throws(() => validateImage({ type: '', size: 1000 }), /filtypen/)
  assert.throws(() => validateImage(null), /JPG-, PNG- eller WebP/)
  for (const size of [-1, undefined, NaN, Infinity]) assert.throws(() => validateImage({ type: 'image/jpeg', size }), /15 MB/)
  assert.doesNotThrow(() => validateImage({ type: 'image/jpeg', size: 0 }))
})
