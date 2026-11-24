import test from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY_QUEUE_MESSAGE, REASON_MAX, REVIEW_DELAY_MS, applyReview, buildReviewUpdate, createDecisionQueue, normalizeReason } from '../src/lib/review.js'
import { standings } from '../src/lib/core.js'

const sub = (over = {}) => ({ id: 's1', team_id: 't1', checkpoint_id: 'c1', status: 'pending', rejection_reason: null, ...over })

test('begrunnelse: trimmes, tom blir null, og for lang avvises', () => {
  assert.deepEqual(normalizeReason('  Uskarpt bilde  '), { reason: 'Uskarpt bilde' })
  for (const empty of ['', '   ', null, undefined, 42]) assert.deepEqual(normalizeReason(empty), { reason: null })
  assert.deepEqual(normalizeReason('x'.repeat(REASON_MAX)), { reason: 'x'.repeat(REASON_MAX) })
  assert.match(normalizeReason('x'.repeat(REASON_MAX + 1)).error, /500 tegn/)
})

test('godkjenn en ventende innsending', () => {
  const { submissions, changed } = applyReview([sub()], 's1', 'approved')
  assert.equal(changed, true)
  assert.deepEqual([submissions[0].status, submissions[0].rejection_reason], ['approved', null])
})

test('avvis med begrunnelse, og uten', () => {
  assert.equal(applyReview([sub()], 's1', 'rejected', '  Uskarpt  ').submissions[0].rejection_reason, 'Uskarpt')
  assert.equal(applyReview([sub()], 's1', 'rejected').submissions[0].rejection_reason, null)
})

test('begrunnelse følger bare med en avvisning', () => {
  assert.equal(applyReview([sub()], 's1', 'approved', 'skal ikke lagres').submissions[0].rejection_reason, null)
})

test('samme beslutning to ganger endrer ingenting og gir samme liste', () => {
  const approved = applyReview([sub()], 's1', 'approved').submissions
  const again = applyReview(approved, 's1', 'approved')
  assert.equal(again.changed, false)
  assert.equal(again.submissions, approved)
  assert.equal(again.error, undefined)
  const rejected = applyReview([sub()], 's1', 'rejected', 'Uskarpt').submissions
  assert.equal(applyReview(rejected, 's1', 'rejected', 'Uskarpt').changed, false)
})

test('en avgjort innsending kan ikke snus fra køen', () => {
  const approved = applyReview([sub()], 's1', 'approved').submissions
  const flipped = applyReview(approved, 's1', 'rejected', 'ombestemt')
  assert.equal(flipped.changed, false)
  assert.match(flipped.error, /allerede avgjort/)
})

test('ukjent beslutning, ukjent id og for lang begrunnelse gir feil og ingen endring', () => {
  const list = [sub()]
  assert.match(applyReview(list, 's1', 'pending').error, /Ugyldig/)
  assert.match(applyReview(list, 'finnes-ikke', 'approved').error, /Fant ikke/)
  const long = applyReview(list, 's1', 'rejected', 'x'.repeat(REASON_MAX + 1))
  assert.match(long.error, /500 tegn/)
  assert.equal(long.submissions, list)
})

test('originallisten endres aldri', () => {
  const list = [sub()]
  applyReview(list, 's1', 'approved')
  assert.equal(list[0].status, 'pending')
})

test('poengene telles én gang selv om godkjenningen gjentas', () => {
  const checkpoints = [{ id: 'c1', points: 10 }]
  const teams = [{ id: 't1', name: 'Lag', emoji: '🦁' }]
  let list = applyReview([sub()], 's1', 'approved').submissions
  list = applyReview(list, 's1', 'approved').submissions
  assert.equal(standings(teams, checkpoints, list)[0].points, 10)
})

// --- Forsinkelseskø med falsk tid ---
function fakeClock() {
  let time = 0
  let nextId = 1
  const timers = new Map()
  return {
    setTimer: (fn, delay) => { const id = nextId++; timers.set(id, { fn, at: time + delay }); return id },
    clearTimer: (id) => { timers.delete(id) },
    now: () => time,
    advance(ms) {
      time += ms
      for (const [id, t] of [...timers]) if (t.at <= time) { timers.delete(id); t.fn() }
    },
    pending: () => timers.size,
  }
}

function queueWith(clock) {
  const committed = []
  const changes = []
  const queue = createDecisionQueue({ onCommit: (...args) => committed.push(args), onChange: () => changes.push(1), ...clock })
  return { queue, committed, changes }
}

test('kø: beslutningen sendes først etter 5 sekunder', () => {
  const clock = fakeClock()
  const { queue, committed } = queueWith(clock)
  queue.schedule('s1', 'approved')
  clock.advance(REVIEW_DELAY_MS - 1)
  assert.deepEqual(committed, [])
  assert.equal(queue.has('s1'), true)
  clock.advance(1)
  assert.deepEqual(committed, [['s1', 'approved', null]])
  assert.equal(queue.has('s1'), false)
})

test('kø: Angre innen 5 sekunder sender ingenting', () => {
  const clock = fakeClock()
  const { queue, committed } = queueWith(clock)
  queue.schedule('s1', 'rejected', 'Uskarpt')
  clock.advance(3000)
  assert.equal(queue.undo('s1'), true)
  clock.advance(10000)
  assert.deepEqual(committed, [])
  assert.equal(clock.pending(), 0)
  assert.equal(queue.undo('s1'), false)
})

test('kø: Angre etter at den er sendt gjør ingenting', () => {
  const clock = fakeClock()
  const { queue, committed } = queueWith(clock)
  queue.schedule('s1', 'approved')
  clock.advance(REVIEW_DELAY_MS)
  assert.equal(queue.undo('s1'), false)
  assert.equal(committed.length, 1)
})

test('kø: en ny beslutning erstatter den forrige og sendes bare én gang', () => {
  const clock = fakeClock()
  const { queue, committed } = queueWith(clock)
  queue.schedule('s1', 'approved')
  clock.advance(2000)
  queue.schedule('s1', 'rejected', 'Feil post')
  clock.advance(REVIEW_DELAY_MS)
  assert.deepEqual(committed, [['s1', 'rejected', 'Feil post']])
})

test('kø: flush sender alt med en gang og tømmer køen', () => {
  const clock = fakeClock()
  const { queue, committed } = queueWith(clock)
  queue.schedule('a', 'approved')
  queue.schedule('b', 'rejected', 'x')
  queue.flush()
  assert.deepEqual(committed.map((c) => c[0]).sort(), ['a', 'b'])
  assert.equal(queue.size, 0)
  clock.advance(REVIEW_DELAY_MS * 2)
  assert.equal(committed.length, 2) // ingen dobbel sending
})

test('kø: flere innsendinger har hver sin frist, og get gir fristen', () => {
  const clock = fakeClock()
  const { queue, committed } = queueWith(clock)
  queue.schedule('a', 'approved')
  clock.advance(2000)
  queue.schedule('b', 'approved')
  assert.equal(queue.get('a').dueAt, REVIEW_DELAY_MS)
  assert.equal(queue.get('b').dueAt, 2000 + REVIEW_DELAY_MS)
  clock.advance(3000)
  assert.deepEqual(committed.map((c) => c[0]), ['a'])
  assert.equal(queue.get('zzz'), null)
})

test('kø: onChange meldes ved planlegging, angring og sending', () => {
  const clock = fakeClock()
  const { queue, changes } = queueWith(clock)
  queue.schedule('a', 'approved')
  queue.undo('a')
  queue.schedule('b', 'approved')
  clock.advance(REVIEW_DELAY_MS)
  assert.equal(changes.length, 4)
})

test('tom kø har den avtalte teksten', () => {
  assert.equal(EMPTY_QUEUE_MESSAGE, 'Alt er godkjent. Godt jobbet!')
})

test('en avgjort innsending skrives aldri om, heller ikke med ny begrunnelse', () => {
  const rejected = applyReview([sub()], 's1', 'rejected', 'Uskarpt').submissions
  const again = applyReview(rejected, 's1', 'rejected', 'Helt annen grunn')
  assert.equal(again.changed, false)
  assert.equal(again.submissions, rejected)
  assert.equal(again.submissions[0].rejection_reason, 'Uskarpt')
  const approved = applyReview([sub()], 's1', 'approved').submissions
  assert.equal(applyReview(approved, 's1', 'approved', 'ignoreres').changed, false)
})

test('feltene som skrives: begrunnelse bare ved avvisning, trimmet', () => {
  assert.deepEqual(buildReviewUpdate('approved', 'ignoreres'), { status: 'approved', rejection_reason: null })
  assert.deepEqual(buildReviewUpdate('rejected', '  Uskarpt  '), { status: 'rejected', rejection_reason: 'Uskarpt' })
  assert.deepEqual(buildReviewUpdate('rejected'), { status: 'rejected', rejection_reason: null })
  assert.deepEqual(buildReviewUpdate('rejected', '   '), { status: 'rejected', rejection_reason: null })
})

// --- Kø med asynkron sending ---
const tick = () => new Promise((resolve) => setImmediate(resolve))

test('kø: sendt, men ikke bekreftet, gir sending-tilstand til onCommit er ferdig', async () => {
  const clock = fakeClock()
  let finish
  const queue = createDecisionQueue({ onCommit: () => new Promise((resolve) => { finish = resolve }), ...clock })
  queue.schedule('s1', 'approved')
  clock.advance(REVIEW_DELAY_MS)
  assert.equal(queue.has('s1'), false)
  assert.equal(queue.isSending('s1'), true)
  finish()
  await tick()
  assert.equal(queue.isSending('s1'), false)
})

test('kø: en avvist sending gir onError, og kortet er ikke lenger i sending', async () => {
  const clock = fakeClock()
  const errors = []
  const queue = createDecisionQueue({ onCommit: async () => { throw new Error('nettet er borte') }, onError: (id, error) => errors.push([id, error.message]), ...clock })
  queue.schedule('s1', 'approved')
  clock.advance(REVIEW_DELAY_MS)
  await tick()
  assert.deepEqual(errors, [['s1', 'nettet er borte']])
  assert.equal(queue.isSending('s1'), false)
})

test('kø: en feil som kastes direkte stopper ikke flush for de andre', async () => {
  const clock = fakeClock()
  const done = []
  const errors = []
  const queue = createDecisionQueue({
    onCommit: (id) => { if (id === 'a') throw new Error('kræsj'); done.push(id) },
    onError: (id) => errors.push(id),
    ...clock,
  })
  queue.schedule('a', 'approved')
  queue.schedule('b', 'approved')
  queue.schedule('c', 'rejected', 'x')
  queue.flush()
  await tick()
  assert.deepEqual(done.sort(), ['b', 'c'])
  assert.deepEqual(errors, ['a'])
  assert.equal(queue.size, 0)
})

test('kø: ids gir ventende beslutninger, og undo av ukjent id er ufarlig', () => {
  const clock = fakeClock()
  const { queue } = queueWith(clock)
  queue.schedule('a', 'approved')
  queue.schedule('b', 'rejected')
  assert.deepEqual(queue.ids().sort(), ['a', 'b'])
  assert.equal(queue.undo('finnes-ikke'), false)
})
