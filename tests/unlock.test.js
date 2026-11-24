import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DEFAULT_RADIUS_M, distanceHint, distanceMeters, unlockStatus } from '../src/lib/geo.js'
import { checkpointStatus } from '../src/lib/core.js'
import { mapPositionError, startTracking } from '../src/hooks/positionTracker.js'

// Posten ligger ved ekvator, så 1 grad lengdegrad er ca. 111 195 m og avstanden er lett å bygge
const post = (over = {}) => ({ id: 'c1', latitude: 0, longitude: 0, radius_m: 60, requires_location: true, ...over })
const metersEast = (m) => ({ lat: 0, lng: m / 111194.9266 })

test('hjelpefunksjonen metersEast stemmer med haversine', () => {
  assert.ok(Math.abs(distanceMeters(0, 0, metersEast(60).lat, metersEast(60).lng) - 60) < 0.01)
})

const rows = [
  ['midt på posten', 0, 'unlocked'],
  ['30 m unna', 30, 'unlocked'],
  ['rett innenfor (59,9 m)', 59.9, 'unlocked'],
  ['nøyaktig på radius', 60, 'unlocked'],
  ['rett utenfor (60,3 m)', 60.3, 'locked'],
  ['61 m', 61, 'locked'],
  ['120 m', 120, 'locked'],
  ['5 km', 5000, 'locked'],
]
for (const [name, meters, expected] of rows) {
  test(`opplåsing: ${name}`, () => {
    const position = metersEast(meters)
    // Radius settes til den faktisk beregnede avstanden for «nøyaktig på», ellers 60 m
    const checkpoint = name === 'nøyaktig på radius' ? post({ radius_m: distanceMeters(0, 0, position.lat, position.lng) }) : post()
    assert.equal(unlockStatus(checkpoint, position).state, expected)
  })
}

test('åpen post er alltid åpen, uansett posisjon', () => {
  for (const position of [null, undefined, metersEast(10000), { lat: NaN, lng: 0 }]) {
    assert.equal(unlockStatus(post({ requires_location: false }), position).state, 'open')
  }
  assert.equal(unlockStatus(post({ requires_location: undefined }), null).state, 'open')
})

test('ingen eller ugyldig posisjon gir låst uten avstand', () => {
  for (const position of [null, undefined, {}, { lat: NaN, lng: 0 }, { lat: 91, lng: 0 }, { lat: 0, lng: 181 }, { lat: '0', lng: '0' }]) {
    const s = unlockStatus(post(), position)
    assert.deepEqual([s.state, s.distance], ['locked', null])
  }
})

test('manglende eller ugyldig radius gir 50 m', () => {
  for (const radius_m of [undefined, null, 0, -5, NaN, '60']) {
    assert.equal(unlockStatus(post({ radius_m }), metersEast(49)).state, 'unlocked')
    assert.equal(unlockStatus(post({ radius_m }), metersEast(51)).state, 'locked')
    assert.equal(unlockStatus(post({ radius_m }), null).radius, DEFAULT_RADIUS_M)
  }
})

test('post uten gyldige koordinater forblir låst', () => {
  assert.equal(unlockStatus(post({ latitude: null }), metersEast(0)).state, 'locked')
})

test('hjelpeteksten runder opp og sier ventende uten avstand', () => {
  assert.equal(distanceHint(120), 'Du er 120 m unna. Gå nærmere for å låse opp.')
  assert.equal(distanceHint(60.2), 'Du er 61 m unna. Gå nærmere for å låse opp.')
  assert.equal(distanceHint(null), 'Venter på posisjon …')
  assert.equal(distanceHint(NaN), 'Venter på posisjon …')
})

test('checkpointStatus: opplåst post kan leveres og viser oppgaven', () => {
  const s = checkpointStatus(post(), [], 't1', metersEast(20))
  assert.deepEqual([s.lock, s.canSubmit, s.canSeeTask, s.label, s.icon, s.hint], ['unlocked', true, true, 'Opplåst', '🔓', null])
})

test('checkpointStatus: utenfor radius gir avstandstekst og ingen innsending', () => {
  const s = checkpointStatus(post(), [], 't1', metersEast(119.6))
  assert.deepEqual([s.lock, s.canSubmit, s.canSeeTask, s.label, s.action], ['locked', false, false, 'Låst', 'locked'])
  assert.equal(s.hint, 'Du er 120 m unna. Gå nærmere for å låse opp.')
  assert.ok(Math.abs(s.distance - 119.6) < 0.01)
})

test('checkpointStatus: uten posisjon venter geolåste poster, åpne poster virker', () => {
  assert.equal(checkpointStatus(post(), [], 't1').hint, 'Venter på posisjon …')
  assert.equal(checkpointStatus(post({ requires_location: false }), [], 't1', null).canSubmit, true)
})

test('checkpointStatus: uten lag kan ikke en opplåst post leveres', () => {
  assert.equal(checkpointStatus(post(), [], null, metersEast(5)).canSubmit, false)
})

test('checkpointStatus: levert post viser innsendingsstatus, ikke avstand', () => {
  const sub = { id: 's', checkpoint_id: 'c1', team_id: 't1', status: 'pending', created_at: '2030-01-01T10:00:00Z' }
  const s = checkpointStatus(post(), [sub], 't1', metersEast(500))
  assert.deepEqual([s.label, s.hint, s.canSubmit], ['Venter på godkjenning', null, false])
})

// NFR10 og AD-6: posisjonen sendes aldri og lagres aldri
for (const file of ['usePosition.js', 'positionTracker.js']) test(`${file} sender, lagrer og logger ikke posisjon`, () => {
  const source = readFileSync(new URL(`../src/hooks/${file}`, import.meta.url), 'utf8')
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '') // kommentarer nevner forbudte ord
  for (const forbidden of ['fetch', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB', 'console.', 'supabase', 'import api', "from '../lib/api"]) {
    assert.ok(!code.includes(forbidden), `usePosition bruker ${forbidden}`)
  }
  if (file === 'positionTracker.js') assert.ok(code.includes('clearWatch'), 'sporingen må stoppes')
})

test('Kart-siden sender ikke posisjon til api eller kontekst', () => {
  for (const file of ['../src/pages/Rebus.jsx', '../src/components/PostMap.jsx']) {
    const code = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.ok(!/(localStorage|sessionStorage|fetch\(|saveDemo|createRecord|changeRecord)[^\n]*position/i.test(code), `${file} behandler posisjon utenfor minnet`)
  }
})

// --- Sporingen kjørt mot en falsk geolokasjon (uten React) ---
function fakeGeolocation() {
  const g = { watches: 0, cleared: [], onOk: null, onError: null, options: null }
  g.watchPosition = (ok, error, options) => { g.watches += 1; g.onOk = ok; g.onError = error; g.options = options; return 7 }
  g.clearWatch = (id) => { g.cleared.push(id) }
  g.fix = (lat, lng, accuracy = 5) => g.onOk({ coords: { latitude: lat, longitude: lng, accuracy } })
  return g
}

test('sporing: venter først, så posisjon, og stopper med clearWatch', () => {
  const g = fakeGeolocation()
  const states = []
  const stop = startTracking(g, (state) => states.push(state))
  assert.deepEqual(states[0], { position: null, status: 'waiting' })
  g.fix(1, 2, 9)
  assert.deepEqual(states.at(-1), { position: { lat: 1, lng: 2, accuracy: 9 }, status: 'ok' })
  stop()
  assert.deepEqual(g.cleared, [7])
})

test('sporing: nektet fjerner posisjonen og gir denied', () => {
  const g = fakeGeolocation()
  const states = []
  startTracking(g, (state) => states.push(state))
  g.fix(1, 2)
  g.onError({ code: 1 })
  assert.deepEqual(states.at(-1), { position: null, status: 'denied' })
})

test('sporing: tidsavbrudd etter en gyldig posisjon beholder posisjonen', () => {
  const g = fakeGeolocation()
  const states = []
  startTracking(g, (state) => states.push(state))
  g.fix(1, 2)
  g.onError({ code: 3 })
  assert.deepEqual(states.at(-1), { position: { lat: 1, lng: 2, accuracy: 5 }, status: 'ok' })
  g.onError({ code: 2 })
  assert.equal(states.at(-1).position.lat, 1)
})

test('sporing: feil uten tidligere posisjon gir utilgjengelig', () => {
  const g = fakeGeolocation()
  const states = []
  startTracking(g, (state) => states.push(state))
  g.onError({ code: 2 })
  assert.deepEqual(states.at(-1), { position: null, status: 'unavailable' })
  g.onError(undefined) // ingen krasj på tom feil
  assert.equal(states.at(-1).status, 'unavailable')
})

test('sporing: en ny sporing starter uten gammel posisjon', () => {
  const g = fakeGeolocation()
  startTracking(g, () => {})
  g.fix(1, 2)
  const second = []
  startTracking(g, (state) => second.push(state))
  assert.deepEqual(second[0], { position: null, status: 'waiting' })
  assert.equal(g.watches, 2)
})

test('sporing: uten geolokasjon gir utilgjengelig og en stopp som ikke krasjer', () => {
  const states = []
  const stop = startTracking(undefined, (state) => states.push(state))
  assert.deepEqual(states, [{ position: null, status: 'unavailable' }])
  assert.doesNotThrow(stop)
})

test('sporing: høy nøyaktighet og tidsavbrudd er satt', () => {
  const g = fakeGeolocation()
  startTracking(g, () => {})
  assert.equal(g.options.enableHighAccuracy, true)
  assert.ok(g.options.timeout > 0)
})

test('mapPositionError: bare kode 1 fjerner posisjonen', () => {
  assert.deepEqual(mapPositionError(1, true), { status: 'denied', keepPosition: false })
  assert.deepEqual(mapPositionError(2, true), { status: 'ok', keepPosition: true })
  assert.deepEqual(mapPositionError(3, false), { status: 'unavailable', keepPosition: false })
  assert.deepEqual(mapPositionError(undefined, false), { status: 'unavailable', keepPosition: false })
})

test('en post uten koordinater får egen tekst selv om posisjonen er kjent', () => {
  const s = checkpointStatus(post({ latitude: null }), [], 't1', metersEast(10))
  assert.equal(s.hint, 'Posten mangler posisjon og kan ikke låses opp ennå.')
  assert.equal(s.lock, 'locked')
})
