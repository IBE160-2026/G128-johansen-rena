import test from 'node:test'
import assert from 'node:assert/strict'
import { ACCENT_COLORS, ICON_SYMBOLS, DEFAULT_THEME, contrastRatio, resolveTheme, themeVars } from '../src/lib/theme.js'
import { THEME_ACCENTS, THEME_ICONS } from '../src/lib/validate.js'

test('nøklene stemmer med listene i validate.js', () => {
  assert.deepEqual(Object.keys(ACCENT_COLORS).sort(), [...THEME_ACCENTS].sort())
  assert.deepEqual(Object.keys(ICON_SYMBOLS).sort(), [...THEME_ICONS].sort())
})

test('kontrast: primary mot hvit og krem, on mot primary', () => {
  for (const [name, c] of Object.entries(ACCENT_COLORS)) {
    assert.ok(contrastRatio(c.primary, '#ffffff') >= 4.5, `${name} mot hvit`)
    assert.ok(contrastRatio(c.primary, '#fbf8f2') >= 4.5, `${name} mot krem`)
    assert.ok(contrastRatio(c.on, c.primary) >= 4.5, `${name} on mot primary`)
    assert.match(c.primary, /^#[0-9a-f]{6}$/)
  }
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01)
})

test('symboler har tegn og etikett', () => {
  for (const s of Object.values(ICON_SYMBOLS)) assert.ok(s.char && s.label)
})

test('resolveTheme', () => {
  assert.deepEqual(resolveTheme({ accent: 'fjord', icon: 'fjell' }), { accent: 'fjord', icon: 'fjell' })
  for (const bad of ['x', {}, { accent: 'fjord' }, { accent: 'neon', icon: 'kompass' }, null, undefined, 5, [], { icon: 'kompass' }]) {
    assert.deepEqual(resolveTheme(bad), DEFAULT_THEME)
  }
})

test('themeVars setter variablene og aliasene, og krasjer ikke', () => {
  const v = themeVars({ accent: 'fjord', icon: 'kompass' })
  assert.equal(v['--primary'], ACCENT_COLORS.fjord.primary)
  assert.equal(v['--copper'], v['--primary'])
  assert.equal(v['--primary-pressed'], ACCENT_COLORS.fjord.pressed)
  assert.equal(v['--on-primary'], ACCENT_COLORS.fjord.on)
  assert.equal(themeVars(null)['--primary'], ACCENT_COLORS.kobber.primary)
  assert.equal(themeVars(7)['--copper'], ACCENT_COLORS.kobber.primary)
})

test('trykket variant (pressed) har også minst 4.5:1 mot hvit', async () => {
  const { ACCENT_COLORS, contrastRatio } = await import('../src/lib/theme.js')
  for (const [name, c] of Object.entries(ACCENT_COLORS)) {
    assert.ok(contrastRatio(c.pressed, '#ffffff') >= 4.5, `${name} pressed`)
  }
})

test('tema med to ugyldige verdier gir to feil, og themeVars har alle variablene', async () => {
  const { validateTrip } = await import('../src/lib/validate.js')
  const { themeVars } = await import('../src/lib/theme.js')
  const draft = {
    trip: { name: 'T', start_date: '2026-04-24', end_date: '2026-04-24', area: { center: { lat: 47.5, lng: 19.04 }, radius_m: 5000 }, theme: { accent: 'neon', icon: 'drage' } },
    program_items: [{ id: 'p1', event_date: '2026-04-24', start_time: '10:00', title: 'A' }], checkpoints: [], teams: [],
  }
  const r = validateTrip(draft)
  assert.equal(r.ok, false)
  assert.deepEqual(r.issues.map((i) => i.path).sort(), ['trip.theme.accent', 'trip.theme.icon'])
  assert.deepEqual(Object.keys(themeVars({ accent: 'fjord', icon: 'kompass' })).sort(), ['--accent', '--copper', '--on-primary', '--primary', '--primary-pressed'])
})
