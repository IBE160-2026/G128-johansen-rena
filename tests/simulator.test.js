import test from 'node:test'
import assert from 'node:assert/strict'
import { distanceMeters, moveBy, normalizePosition, positionAtPost, resolvePosition, shouldTrackReal, unlockStatus } from '../src/lib/geo.js'
import { checkpointStatus } from '../src/lib/core.js'

// Uavhengig fasit: punktet som ligger `meters` fra (lat, lng) i retning `bearing` grader (direkte formel på kule).
// Bruker ikke distanceMeters, så testen sammenligner to ulike beregninger.
const R = 6371000
function destination(lat, lng, bearingDeg, meters) {
  const rad = (d) => (d * Math.PI) / 180
  const deg = (r) => (r * 180) / Math.PI
  const d = meters / R
  const b = rad(bearingDeg)
  const p1 = rad(lat)
  const l1 = rad(lng)
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b))
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2))
  return { lat: deg(p2), lng: ((deg(l2) + 540) % 360) - 180 }
}

const post = (over) => ({ id: 'c', latitude: 0, longitude: 0, radius_m: 60, requires_location: true, ...over })

// Fasit-tabell: breddegrader, radier og retninger. 0,5 m innenfor skal låse opp, 0,5 m utenfor skal være låst.
const latitudes = [0, 47.4969, 60.39, -33.87, 78.2]
const radii = [20, 60, 150, 500]
const bearings = [0, 45, 90, 135, 180, 225, 270, 315]

let cases = 0
for (const lat of latitudes) {
  for (const radius of radii) {
    for (const bearing of bearings) {
      for (const [offset, expected] of [[-0.5, 'unlocked'], [0.5, 'locked']]) {
        cases += 1
        test(`fasit: bredde ${lat}, radius ${radius} m, retning ${bearing}°, ${offset < 0 ? '0,5 m innenfor' : '0,5 m utenfor'}`, () => {
          const checkpoint = post({ latitude: lat, longitude: 19.04, radius_m: radius })
          const position = destination(lat, 19.04, bearing, radius + offset)
          assert.equal(unlockStatus(checkpoint, position).state, expected)
        })
      }
    }
  }
}

test('fasit-tabellen er stor nok til å bety noe', () => {
  assert.equal(cases, latitudes.length * radii.length * bearings.length * 2)
  assert.ok(cases >= 300)
})

test('midt på posten og langt unna', () => {
  const checkpoint = post({ latitude: 47.4969, longitude: 19.0398 })
  assert.equal(unlockStatus(checkpoint, { lat: 47.4969, lng: 19.0398 }).state, 'unlocked')
  assert.equal(unlockStatus(checkpoint, destination(47.4969, 19.0398, 10, 10000)).state, 'locked')
})

test('«Gå til post N» gir opplåst, og simulert posisjon gir samme svar som ekte', () => {
  const checkpoint = post({ latitude: 47.4969, longitude: 19.0398 })
  const simulated = positionAtPost(checkpoint)
  assert.deepEqual(simulated, { lat: 47.4969, lng: 19.0398, accuracy: null })
  assert.equal(checkpointStatus(checkpoint, [], 't1', simulated).lock, 'unlocked')
  const real = { lat: 47.4969, lng: 19.0398, accuracy: 12 }
  assert.equal(checkpointStatus(checkpoint, [], 't1', real).lock, checkpointStatus(checkpoint, [], 't1', simulated).lock)
})

test('positionAtPost: post uten gyldige koordinater gir null', () => {
  for (const over of [{ latitude: null }, { longitude: undefined }, { latitude: 91 }, { longitude: 181 }, { latitude: '47' }]) {
    assert.equal(positionAtPost(post(over)), null)
  }
  assert.equal(positionAtPost(undefined), null)
})

test('normalizePosition: gyldig punkt beholdes, lengdegrad pakkes rundt, ugyldig gir null', () => {
  assert.deepEqual(normalizePosition({ lat: 47.5, lng: 19 }), { lat: 47.5, lng: 19, accuracy: null })
  assert.equal(normalizePosition({ lat: 10, lng: 190 }).lng, -170)
  assert.equal(normalizePosition({ lat: 10, lng: -190 }).lng, 170)
  assert.equal(normalizePosition({ lat: 10, lng: 540 }).lng, -180)
  for (const bad of [null, undefined, {}, { lat: NaN, lng: 0 }, { lat: 91, lng: 0 }, { lat: 0, lng: Infinity }, { lat: '1', lng: 2 }]) {
    assert.equal(normalizePosition(bad), null)
  }
})

test('normalisert posisjon gir alltid gyldig lengdegrad', () => {
  for (const lng of [-720, -541, -181, -180, 0, 179.9, 180, 181, 359, 360, 541, 1000]) {
    const p = normalizePosition({ lat: 0, lng })
    assert.ok(p.lng >= -180 && p.lng < 180, `${lng} ble ${p.lng}`)
  }
})

// «Nøyaktig på radius»: radius settes til avstanden som faktisk er beregnet, og en hårsmål mindre skal låse
for (const lat of latitudes) {
  for (const bearing of [0, 90, 200, 315]) {
    test(`nøyaktig på radius: bredde ${lat}, retning ${bearing}°`, () => {
      const checkpoint = post({ latitude: lat, longitude: 19.04, radius_m: 60 })
      const position = destination(lat, 19.04, bearing, 73.3)
      const d = distanceMeters(lat, 19.04, position.lat, position.lng)
      assert.equal(unlockStatus({ ...checkpoint, radius_m: d }, position).state, 'unlocked') // avstand == radius
      assert.equal(unlockStatus({ ...checkpoint, radius_m: d - 1e-6 }, position).state, 'locked') // like utenfor
    })
  }
}

test('normalizePosition: ±90 grader bredde er gyldig, 90,0001 og tekst er ikke', () => {
  assert.equal(normalizePosition({ lat: 90, lng: 0 }).lat, 90)
  assert.equal(normalizePosition({ lat: -90, lng: 0 }).lat, -90)
  assert.equal(normalizePosition({ lat: 90.0001, lng: 0 }), null)
  assert.equal(normalizePosition({ lat: '10', lng: '20' }), null)
})

test('normalizePosition og positionAtPost gir samme form og er enige om gyldighet', () => {
  const p = positionAtPost({ latitude: 47.5, longitude: 19 })
  assert.deepEqual(normalizePosition({ lat: 47.5, lng: 19 }), p)
  assert.equal(normalizePosition({ lat: 91, lng: 0 }), positionAtPost({ latitude: 91, longitude: 0 }))
})

test('moveBy: 100 m i hver retning gir riktig avstand og låser en post som nettopp er innenfor', () => {
  const start = { lat: 47.4969, lng: 19.0398, accuracy: null }
  for (const [north, east] of [[100, 0], [-100, 0], [0, 100], [0, -100]]) {
    const moved = moveBy(start, north, east)
    assert.ok(Math.abs(distanceMeters(start.lat, start.lng, moved.lat, moved.lng) - 100) < 0.5, `${north},${east}`)
  }
  const checkpoint = post({ latitude: 47.4969, longitude: 19.0398, radius_m: 60 })
  assert.equal(unlockStatus(checkpoint, start).state, 'unlocked')
  assert.equal(unlockStatus(checkpoint, moveBy(start, 100, 0)).state, 'locked')
})

test('moveBy: ugyldig start og polene gir null', () => {
  assert.equal(moveBy(null, 100, 0), null)
  assert.equal(moveBy({ lat: NaN, lng: 0 }, 100, 0), null)
  assert.equal(moveBy({ lat: 90, lng: 0 }, 0, 100), null)
})

test('moveBy: pakker lengdegrad rundt datolinjen', () => {
  const moved = moveBy({ lat: 0, lng: 179.9995, accuracy: null }, 0, 200)
  assert.ok(moved.lng < 0 && moved.lng > -180)
})

test('posisjonskilden: demo bruker alltid den simulerte posisjonen, aldri den ekte', () => {
  const simulated = { lat: 1, lng: 2, accuracy: null }
  const real = { lat: 9, lng: 9, accuracy: 5 }
  assert.deepEqual(resolvePosition({ demoMode: true, simulated, real }), simulated)
  assert.equal(resolvePosition({ demoMode: true, simulated: null, real }), null) // ingen simulert posisjon gir ingen, ikke den ekte
  assert.deepEqual(resolvePosition({ demoMode: false, simulated, real }), real)
  assert.equal(resolvePosition({ demoMode: false, simulated, real: undefined }), null)
})

test('ekte sporing: aldri i demo, og bare med avslørt destinasjon og en geolåst post', () => {
  const locked = [{ requires_location: true }]
  assert.equal(shouldTrackReal({ demoMode: true, revealed: true, posts: locked }), false)
  assert.equal(shouldTrackReal({ demoMode: false, revealed: true, posts: locked }), true)
  assert.equal(shouldTrackReal({ demoMode: false, revealed: false, posts: locked }), false)
  assert.equal(shouldTrackReal({ demoMode: false, revealed: true, posts: [{ requires_location: false }] }), false)
  assert.equal(shouldTrackReal({ demoMode: false, revealed: true, posts: undefined }), false)
})
