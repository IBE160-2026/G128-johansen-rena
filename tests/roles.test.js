import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_ORGANIZER_ID, demoOwn, demoUserForRole, roleHome } from '../src/lib/core.js'
import { initialDemoData } from '../src/data/demo.js'

const { members } = initialDemoData()

test('deltaker logges inn som første medlem i turen', () => {
  assert.equal(demoUserForRole('participant', members), members[0].user_id)
})

test('arrangør er demo-arrangøren', () => {
  assert.equal(demoUserForRole('organizer', members), DEMO_ORGANIZER_ID)
  assert.equal(demoUserForRole('organizer', []), DEMO_ORGANIZER_ID)
})

test('ukjent rolle og tom medlemsliste gir ingen bruker', () => {
  assert.equal(demoUserForRole('admin', members), null)
  assert.equal(demoUserForRole(undefined, members), null)
  assert.equal(demoUserForRole('participant', []), null)
  assert.equal(demoUserForRole('participant', undefined), null)
})

test('arrangør havner på Mine turer, deltaker på turen', () => {
  assert.equal(roleHome('organizer', 'provetur'), '/mine-turer')
  assert.equal(roleHome('participant', 'provetur'), '/t/provetur')
})

test('demo-arrangøren finnes ikke som medlem i seed (egen rolle)', () => {
  assert.ok(!members.some((member) => member.user_id === DEMO_ORGANIZER_ID))
})

test('demoOwn: arrangør-id gir arrangørrollen, medlem gir medlemmet, ukjent gir null', () => {
  assert.equal(demoOwn(DEMO_ORGANIZER_ID, members).role, 'organizer')
  assert.equal(demoOwn(members[2].user_id, members), members[2])
  assert.equal(demoOwn('finnes-ikke', members), null)
  assert.equal(demoOwn(null, members), null)
})

test('rollevalget gir en bruker som demoOwn kjenner igjen', () => {
  assert.equal(demoOwn(demoUserForRole('organizer', members), members).role, 'organizer')
  assert.equal(demoOwn(demoUserForRole('participant', members), members).role, 'participant')
})

test('deltaker velges blant deltakere selv om første medlem er arrangør', () => {
  const mixed = [{ user_id: 'a', role: 'organizer' }, { user_id: 'b', role: 'participant' }]
  assert.equal(demoUserForRole('participant', mixed), 'b')
})
