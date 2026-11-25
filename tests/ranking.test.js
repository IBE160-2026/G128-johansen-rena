import test from 'node:test'
import assert from 'node:assert/strict'
import { rankStandings } from '../src/lib/scoring.js'

const row = (id, points) => ({ id, name: id, points })

test('vanlig stilling gir plass 1, 2, 3 uten delt plass', () => {
  const ranked = rankStandings([row('a', 30), row('b', 20), row('c', 10)])
  assert.deepEqual(ranked.map((r) => r.rank), [1, 2, 3])
  assert.ok(ranked.every((r) => !r.tied))
})

test('lik poengsum gir delt plass og neste lag hopper over', () => {
  const ranked = rankStandings([row('a', 30), row('b', 20), row('c', 20), row('d', 5)])
  assert.deepEqual(ranked.map((r) => r.rank), [1, 2, 2, 4])
  assert.deepEqual(ranked.map((r) => r.tied), [false, true, true, false])
})

test('alle null gir plass 1 for alle', () => {
  const ranked = rankStandings([row('a', 0), row('b', 0)])
  assert.deepEqual(ranked.map((r) => r.rank), [1, 1])
  assert.ok(ranked.every((r) => r.tied))
})

test('tom liste og null gir tom liste', () => {
  assert.deepEqual(rankStandings([]), [])
  assert.deepEqual(rankStandings(null), [])
  assert.deepEqual(rankStandings(undefined), [])
})

test('ulike poengsummer uten sortering gir ingen krasj og ikke delt plass for ulike lag', () => {
  const ranked = rankStandings([row('a', 5), row('b', 5), row('c', 3)])
  assert.deepEqual(ranked.map((r) => r.rank), [1, 1, 3])
})
