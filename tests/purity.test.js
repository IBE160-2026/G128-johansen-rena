import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// AD-1: rene filer importerer bare hverandre. Nye rene filer i src/lib/ legges til her.
// image.js er ikke med: den bruker lerret og DOM og er bevisst ikke ren.
const PURE = ['core.js', 'geo.js', 'validate.js', 'demoStore.js', 'tripCache.js', 'submission.js']

const PATTERNS = [
  /\b(?:import|export)\b[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/g, // også flerlinjede
  /\bimport\s*['"]([^'"]+)['"]/g, // import 'x'
  /\bimport\s*\(\s*['"]([^'"]+)['"]/g, // import('x')
  /\brequire\s*\(\s*['"]([^'"]+)['"]/g,
]

for (const file of PURE) {
  test(`${file} importerer bare andre rene filer`, () => {
    const source = readFileSync(new URL(`../src/lib/${file}`, import.meta.url), 'utf8')
    assert.ok(source.length > 0)
    const specs = PATTERNS.flatMap((pattern) => [...source.matchAll(pattern)].map((m) => m[1]))
    for (const spec of specs) {
      assert.ok(spec.startsWith('./') && PURE.includes(spec.slice(2)), `${file} importerer ${spec}`)
    }
  })
}

test('purity-testen finner importer (ikke tom)', () => {
  const source = readFileSync(new URL('../src/lib/validate.js', import.meta.url), 'utf8')
  const specs = PATTERNS.flatMap((pattern) => [...source.matchAll(pattern)].map((m) => m[1]))
  assert.deepEqual(specs, ['./geo.js'])
})
