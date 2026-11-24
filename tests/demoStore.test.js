import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_DATA_KEY, DEMO_USER_KEY, loadDemo, resetDemo, saveDemo } from '../src/lib/demoStore.js'
import { initialDemoData } from '../src/data/demo.js'

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
    removeItem: (key) => { map.delete(key) },
  }
}
const brokenStorage = () => ({
  getItem() { throw new Error('utilgjengelig') },
  setItem() { throw new Error('full') },
  removeItem() { throw new Error('utilgjengelig') },
})

test('første oppstart: seed-turen lagres og returneres', () => {
  const storage = fakeStorage()
  const data = loadDemo(storage, initialDemoData)
  assert.ok(data.trip.slug)
  assert.deepEqual(JSON.parse(storage.map.get(DEMO_DATA_KEY)), data)
})

test('senere oppstart: gyldig lagret data (med endringer) brukes', () => {
  const storage = fakeStorage()
  const first = loadDemo(storage, initialDemoData)
  first.trip.name = 'Endret navn'
  saveDemo(storage, first)
  assert.equal(loadDemo(storage, initialDemoData).trip.name, 'Endret navn')
})

for (const [name, stored] of [
  ['annen seed-versjon', JSON.stringify({ ...initialDemoData(), seed_version: 0 })],
  ['ødelagt JSON', '{ikke json'],
  ['feil form', JSON.stringify({ trip: {} })],
  ['uten seed-versjon', JSON.stringify((({ seed_version, ...rest }) => rest)(initialDemoData()))],
]) {
  test(`${name}: seed-turen lastes på nytt og overskriver`, () => {
    const storage = fakeStorage({ [DEMO_DATA_KEY]: stored })
    const data = loadDemo(storage, initialDemoData)
    assert.equal(data.seed_version, initialDemoData().seed_version)
    assert.equal(JSON.parse(storage.map.get(DEMO_DATA_KEY)).seed_version, data.seed_version)
  })
}

test('utilgjengelig lagring: seed brukes i minnet uten krasj', () => {
  const data = loadDemo(brokenStorage(), initialDemoData)
  assert.ok(data.trip.slug)
  assert.equal(saveDemo(brokenStorage(), data), false)
})

test('tilbakestill: sletter demo-bruker og laster seed-turen på nytt', () => {
  const storage = fakeStorage()
  const data = loadDemo(storage, initialDemoData)
  data.trip.name = 'Endret'
  saveDemo(storage, data)
  storage.setItem(DEMO_USER_KEY, 'demo-admin')
  const fresh = resetDemo(storage, initialDemoData)
  assert.notEqual(fresh.trip.name, 'Endret')
  assert.equal(storage.getItem(DEMO_USER_KEY), null)
  assert.equal(JSON.parse(storage.getItem(DEMO_DATA_KEY)).trip.name, fresh.trip.name)
})

test('tilbakestill krasjer ikke når lagringen er utilgjengelig', () => {
  assert.ok(resetDemo(brokenStorage(), initialDemoData).trip.slug)
})

test('gammel v1-lagring ryddes bort', () => {
  const storage = fakeStorage({ 'tripbuilder-demo-v1': '{}', 'tripbuilder-user-v1': 'demo-admin' })
  loadDemo(storage, initialDemoData)
  assert.equal(storage.getItem('tripbuilder-demo-v1'), null)
  assert.equal(storage.getItem('tripbuilder-user-v1'), null)
})

test('ny seed fjerner en gammel demo-bruker', () => {
  const storage = fakeStorage({ [DEMO_USER_KEY]: 'demo-admin', [DEMO_DATA_KEY]: JSON.stringify({ ...initialDemoData(), seed_version: 0 }) })
  loadDemo(storage, initialDemoData)
  assert.equal(storage.getItem(DEMO_USER_KEY), null)
})

test('gyldig lagring beholder demo-bruker', () => {
  const storage = fakeStorage()
  loadDemo(storage, initialDemoData)
  storage.setItem(DEMO_USER_KEY, 'demo-admin')
  loadDemo(storage, initialDemoData)
  assert.equal(storage.getItem(DEMO_USER_KEY), 'demo-admin')
})

for (const [name, mutate] of [
  ['turen mangler slug', (d) => { delete d.trip.slug }],
  ['et medlem uten id', (d) => { delete d.members[0].id }],
  ['en post som ikke er et objekt', (d) => { d.checkpoints[0] = 'x' }],
]) {
  test(`delvis ødelagt lagring (${name}) gir ny seed`, () => {
    const broken = initialDemoData()
    mutate(broken)
    const storage = fakeStorage({ [DEMO_DATA_KEY]: JSON.stringify(broken) })
    const data = loadDemo(storage, initialDemoData)
    assert.ok(data.members.every((member) => member.id) && typeof data.trip.slug === 'string')
  })
}

test('tilbakestill fjerner gammel data når seed ikke kan lagres', () => {
  const storage = fakeStorage({ [DEMO_DATA_KEY]: 'gammel' })
  storage.setItem = () => { throw new Error('full') }
  resetDemo(storage, initialDemoData)
  assert.equal(storage.getItem(DEMO_DATA_KEY), null)
})
