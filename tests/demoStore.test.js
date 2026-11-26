import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_DATA_KEY, DEMO_USER_KEY, PUBLISHED_INDEX_KEY, PUBLISHED_TRIP_PREFIX, clearDemoUser, listPublished, loadDemo, loadPublished, publishDemo, readDemoUser, resetDemo, saveDemo, writeDemoUser, resetTexts } from '../src/lib/demoStore.js'
import { publishTrip } from '../src/lib/publish.js'
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

test('brukeren ligger i egen lagring (per fane) og fjernes derfra ved tilbakestilling', () => {
  const storage = fakeStorage()
  const userStorage = fakeStorage()
  loadDemo(storage, initialDemoData, userStorage) // første oppstart lagrer seed
  userStorage.setItem(DEMO_USER_KEY, 'demo-admin')
  loadDemo(storage, initialDemoData, userStorage)
  assert.equal(userStorage.getItem(DEMO_USER_KEY), 'demo-admin') // gyldig data beholder rollen
  resetDemo(storage, initialDemoData, userStorage)
  assert.equal(userStorage.getItem(DEMO_USER_KEY), null)
})

test('ny seed fjerner brukeren fra den egne lagringen', () => {
  const storage = fakeStorage({ [DEMO_DATA_KEY]: JSON.stringify({ ...initialDemoData(), seed_version: 0 }) })
  const userStorage = fakeStorage({ [DEMO_USER_KEY]: 'demo-admin' })
  loadDemo(storage, initialDemoData, userStorage)
  assert.equal(userStorage.getItem(DEMO_USER_KEY), null)
})

test('tilbakestill rører ikke en annen faneres bruker i datalagringen', () => {
  const storage = fakeStorage({ [DEMO_USER_KEY]: 'liggende' })
  resetDemo(storage, initialDemoData, fakeStorage())
  assert.equal(storage.getItem(DEMO_USER_KEY), 'liggende')
})

test('rollen er per fane: to lagringer påvirker ikke hverandre', () => {
  const tabA = fakeStorage()
  const tabB = fakeStorage()
  writeDemoUser(tabA, 'demo-admin')
  assert.equal(tabA.getItem(DEMO_USER_KEY), 'demo-admin')
  assert.equal(tabB.getItem(DEMO_USER_KEY), null)
  assert.equal(readDemoUser(tabA), 'demo-admin')
  clearDemoUser(tabA)
  assert.equal(readDemoUser(tabA), null)
})

test('rollen gjelder i minnet når sessionStorage er utilgjengelig', () => {
  clearDemoUser(null)
  writeDemoUser(brokenStorage(), 'demo-admin')
  assert.equal(readDemoUser(brokenStorage()), 'demo-admin')
  assert.equal(readDemoUser(null), 'demo-admin')
  clearDemoUser(brokenStorage())
  assert.equal(readDemoUser(null), null)
})

test('tilbakestill glemmer rollen, også den i minnet', () => {
  const userStorage = fakeStorage()
  writeDemoUser(userStorage, 'demo-admin')
  resetDemo(fakeStorage(), initialDemoData, userStorage)
  assert.equal(readDemoUser(userStorage), null)
})

test('lagret demo flyttes på nytt slik at turen er i gang i dag', () => {
  const storage = fakeStorage()
  const old = initialDemoData(new Date(2030, 0, 10, 12, 0))
  saveDemo(storage, old)
  const loaded = loadDemo(storage, initialDemoData)
  const today = new Date()
  const y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, '0'), d = String(today.getDate()).padStart(2, '0')
  const days = [...new Set(loaded.program.map((item) => item.event_date))].sort()
  assert.equal(days[1], `${y}-${m}-${d}`)
  assert.equal(JSON.parse(storage.getItem(DEMO_DATA_KEY)).trip.start_date, loaded.trip.start_date) // lagres på nytt
})

// Story 2.7: publiserte turer ved siden av prøveturen
function published(name = 'Hyttetur') {
  const trial = initialDemoData()
  const draft = { trip: { ...trial.trip, name, start_date: '2030-05-01', end_date: '2030-05-04' }, program_items: trial.program.map((item, i) => ({ ...item, event_date: `2030-05-0${1 + (i % 4)}` })), checkpoints: trial.checkpoints, teams: trial.teams }
  const result = publishTrip({ draft, request: { participant_count: 4 } }, { existing: [], random: Math.random, now: new Date('2026-11-26T12:00:00Z') })
  assert.equal(result.ok, true)
  return result.data
}
const withTrial = () => {
  const storage = fakeStorage()
  loadDemo(storage, initialDemoData)
  return storage
}

test('publisert tur lagres under egen nøkkel med originalbilde og føres i oversikten', () => {
  const storage = withTrial()
  const trialBefore = storage.getItem(DEMO_DATA_KEY)
  const a = published('Tur A')
  const b = published('Tur B')
  assert.equal(publishDemo(storage, a), true)
  assert.equal(publishDemo(storage, b), true)
  assert.deepEqual(JSON.parse(storage.getItem(PUBLISHED_TRIP_PREFIX + a.trip.slug)), { original: a, data: a })
  assert.deepEqual(listPublished(storage).map((t) => [t.slug, t.name, t.start_date, t.end_date, t.join_code]), [a, b].map(({ trip }) => [trip.slug, trip.name, trip.start_date, trip.end_date, trip.join_code]))
  assert.ok(storage.map.has(PUBLISHED_INDEX_KEY))
  assert.equal(storage.getItem(DEMO_DATA_KEY), trialBefore)
})

test('loadDemo med slug gir den publiserte turen uten å flytte datoene', () => {
  const storage = withTrial()
  const a = published()
  publishDemo(storage, a)
  assert.deepEqual(loadDemo(storage, initialDemoData, storage, a.trip.slug), a)
  assert.equal(loadDemo(storage, initialDemoData, storage, a.trip.slug).trip.start_date, '2030-05-01')
})

test('loadDemo uten slug, med prøveturens slug og med ukjent slug gir prøveturen', () => {
  const storage = withTrial()
  publishDemo(storage, published())
  const trialSlug = initialDemoData().trip.slug
  for (const slug of [undefined, trialSlug, 'finnes-ikke']) assert.equal(loadDemo(storage, initialDemoData, storage, slug).trip.slug, trialSlug)
})

test('endringer i en publisert tur lagres under egen nøkkel, og prøveturen er urørt', () => {
  const storage = withTrial()
  const trialBefore = storage.getItem(DEMO_DATA_KEY)
  const a = published()
  publishDemo(storage, a)
  const changed = { ...a, trip: { ...a.trip, name: 'Nytt navn' }, submissions: [{ id: 's1', status: 'pending' }] }
  assert.equal(saveDemo(storage, changed), true)
  assert.deepEqual(loadDemo(storage, initialDemoData, storage, a.trip.slug), changed)
  assert.deepEqual(JSON.parse(storage.getItem(PUBLISHED_TRIP_PREFIX + a.trip.slug)).original, a)
  assert.equal(listPublished(storage)[0].name, 'Nytt navn')
  assert.equal(storage.getItem(DEMO_DATA_KEY), trialBefore)
})

test('en publisert tur som ikke finnes i lagringen, gjenopplives ikke ved lagring', () => {
  const storage = withTrial()
  const trialBefore = storage.getItem(DEMO_DATA_KEY)
  assert.equal(saveDemo(storage, published()), false)
  assert.equal(storage.getItem(DEMO_DATA_KEY), trialBefore)
  assert.deepEqual(listPublished(storage), [])
})

test('tilbakestill på en publisert tur gir originalbildet, og bare den turen endres', () => {
  const storage = withTrial()
  const a = published('Tur A')
  const b = published('Tur B')
  publishDemo(storage, a)
  publishDemo(storage, b)
  const changedB = { ...b, photos: [{ id: 'p1' }] }
  saveDemo(storage, changedB)
  saveDemo(storage, { ...a, trip: { ...a.trip, name: 'Endret' }, photos: [{ id: 'p2' }] })
  const trialBefore = storage.getItem(DEMO_DATA_KEY)
  writeDemoUser(storage, 'demo-admin')
  assert.deepEqual(resetDemo(storage, initialDemoData, storage, a.trip.slug), a)
  assert.deepEqual(loadPublished(storage, a.trip.slug), a)
  assert.equal(listPublished(storage)[0].name, 'Tur A')
  assert.deepEqual(loadPublished(storage, b.trip.slug), changedB)
  assert.equal(storage.getItem(DEMO_DATA_KEY), trialBefore)
  assert.equal(storage.getItem(DEMO_USER_KEY), null)
})

test('tilbakestill av prøveturen rører ikke publiserte turer', () => {
  const storage = withTrial()
  const a = published()
  publishDemo(storage, a)
  resetDemo(storage, initialDemoData, storage, initialDemoData().trip.slug)
  assert.deepEqual(loadPublished(storage, a.trip.slug), a)
  assert.equal(listPublished(storage).length, 1)
})

test('tilbakestill mister aldri en publisert tur når lagringen er full', () => {
  const storage = withTrial()
  const a = published()
  publishDemo(storage, a)
  const changed = { ...a, photos: [{ id: 'p1' }] }
  saveDemo(storage, changed)
  storage.setItem = () => { throw new Error('full') }
  // svaret skal vise det som faktisk er lagret, ikke late som nullstillingen gikk
  assert.deepEqual(resetDemo(storage, initialDemoData, storage, a.trip.slug), changed)
  assert.deepEqual(loadPublished(storage, a.trip.slug), changed)
})

test('tilbakestill uten brukbart originalbilde beholder turen og prøveturen', () => {
  const storage = withTrial()
  const a = published()
  publishDemo(storage, a)
  const changed = { ...a, photos: [{ id: 'p1' }] }
  storage.setItem(PUBLISHED_TRIP_PREFIX + a.trip.slug, JSON.stringify({ original: null, data: changed }))
  const trialBefore = storage.getItem(DEMO_DATA_KEY)
  assert.deepEqual(resetDemo(storage, initialDemoData, storage, a.trip.slug), changed)
  assert.deepEqual(loadPublished(storage, a.trip.slug), changed)
  assert.equal(storage.getItem(DEMO_DATA_KEY), trialBefore)
})

test('nullstillingstekstene skiller mellom prøveturen og en publisert tur', () => {
  assert.match(resetTexts(published().trip).question, /slik den ble publisert/)
  assert.match(resetTexts(initialDemoData().trip).question, /prøveturen/)
  assert.match(resetTexts(undefined).question, /prøveturen/)
})

for (const failingKey of [PUBLISHED_TRIP_PREFIX, PUBLISHED_INDEX_KEY]) {
  test(`full lagring ved publisering (${failingKey}) gir false uten rester`, () => {
    const storage = withTrial()
    const set = storage.setItem
    storage.setItem = (key, value) => { if (key.startsWith(failingKey)) throw new Error('full'); set(key, value) }
    const a = published()
    assert.equal(publishDemo(storage, a), false)
    assert.equal(storage.getItem(PUBLISHED_TRIP_PREFIX + a.trip.slug), null)
    assert.deepEqual(listPublished(storage), [])
  })
}

test('publisering overskriver aldri en tur og tåler utilgjengelig lagring og ugyldige data', () => {
  const storage = withTrial()
  const a = published()
  assert.equal(publishDemo(storage, a), true)
  assert.equal(publishDemo(storage, a), false)
  assert.equal(listPublished(storage).length, 1)
  assert.equal(publishDemo(brokenStorage(), published()), false)
  assert.equal(publishDemo(null, published()), false)
  for (const bad of [null, {}, initialDemoData()]) assert.equal(publishDemo(storage, bad), false)
})

for (const [name, raw] of [['ugyldig JSON', '{ikke json'], ['ikke en liste', '{}'], ['null', 'null'], ['ugyldige oppføringer', JSON.stringify([null, 'x', { slug: 'a' }, { slug: 'a', name: 'A', join_code: 'ABC234', start_date: '2026-13-45', end_date: '2026-01-01' }])]]) {
  test(`ødelagt oversikt (${name}) gir tom liste`, () => {
    assert.deepEqual(listPublished(fakeStorage({ [PUBLISHED_INDEX_KEY]: raw })), [])
  })
}

test('utilgjengelig lagring gir tom liste og ingen publisert tur', () => {
  for (const storage of [brokenStorage(), null]) {
    assert.deepEqual(listPublished(storage), [])
    assert.equal(loadPublished(storage, 'x'), null)
  }
})

for (const [name, mutate] of [
  ['ugyldig JSON', () => '{ikke json'],
  ['null', () => 'null'],
  ['feil form', () => JSON.stringify({ data: { trip: {} } })],
  ['annen adresse', (d) => JSON.stringify({ original: d, data: { ...d, trip: { ...d.trip, slug: 'en-annen' } } })],
  ['ugyldig dato', (d) => JSON.stringify({ original: d, data: { ...d, trip: { ...d.trip, start_date: 'i morgen' } } })],
]) {
  test(`ødelagt publisert tur (${name}) gir prøveturen uten krasj`, () => {
    const storage = withTrial()
    const a = published()
    publishDemo(storage, a)
    storage.setItem(PUBLISHED_TRIP_PREFIX + a.trip.slug, mutate(a))
    assert.equal(loadPublished(storage, a.trip.slug), null)
    assert.equal(loadDemo(storage, initialDemoData, storage, a.trip.slug).trip.slug, initialDemoData().trip.slug)
    assert.ok(resetDemo(storage, initialDemoData, storage, a.trip.slug).trip.slug)
  })
}
