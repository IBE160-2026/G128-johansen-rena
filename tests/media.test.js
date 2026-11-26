import test from 'node:test'
import assert from 'node:assert/strict'
import { applySignedUrls, pathsToSign } from '../src/lib/media.js'

const T = 'trip1'

test('samlet signering: unike stier fra turen', () => {
  const items = [{ storage_path: 'trip1/a/1.jpg' }, { storage_path: 'trip1/a/2.jpg' }, { storage_path: 'trip1/b/3.jpg' }, { storage_path: 'trip1/b/4.jpg' }, { storage_path: 'trip1/c/5.jpg' }]
  assert.equal(pathsToSign(items, T).length, 5)
})

test('duplikat sti kommer med én gang og begge får url', () => {
  const items = [{ storage_path: 'trip1/a.jpg' }, { storage_path: 'trip1/a.jpg' }]
  assert.deepEqual(pathsToSign(items, T), ['trip1/a.jpg'])
  const out = applySignedUrls(items, [{ path: 'trip1/a.jpg', signedUrl: 'u' }])
  assert.deepEqual(out.map((i) => i.url), ['u', 'u'])
})

test('sti fra annen tur signeres ikke og gir url null', () => {
  const items = [{ storage_path: 'trip2/a.jpg' }, { storage_path: 'trip10/a.jpg' }]
  assert.deepEqual(pathsToSign(items, T), [])
  const out = applySignedUrls(items, [])
  assert.deepEqual(out.map((i) => i.url), [null, null])
})

test('uten sti: beholder url og er ikke med', () => {
  const items = [{ url: 'data:image/png;base64,AA' }]
  assert.deepEqual(pathsToSign(items, T), [])
  assert.equal(applySignedUrls(items, [])[0].url, 'data:image/png;base64,AA')
})

test('rad med feil eller uten signedUrl gir url null for den, andre beholdes', () => {
  const items = [{ storage_path: 'trip1/a' }, { storage_path: 'trip1/b' }, { storage_path: 'trip1/c' }]
  const out = applySignedUrls(items, [{ path: 'trip1/a', signedUrl: 'A' }, { path: 'trip1/b', signedUrl: null, error: 'x' }, { path: 'trip1/c' }])
  assert.deepEqual(out.map((i) => i.url), ['A', null, null])
})

test('ugyldig input krasjer ikke', () => {
  assert.deepEqual(pathsToSign(null, T), [])
  assert.deepEqual(pathsToSign('x', T), [])
  assert.deepEqual(pathsToSign([null, 3], T), [])
  assert.deepEqual(applySignedUrls(null, null), [])
  assert.deepEqual(applySignedUrls([null], [null]), [])
  assert.deepEqual(pathsToSign([{ storage_path: 'trip1/a' }], null), [])
})

test('sti med .. signeres ikke', () => {
  assert.deepEqual(pathsToSign([{ storage_path: 'trip1/../trip2/a.jpg' }], T), [])
})
