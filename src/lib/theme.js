import { THEME_ACCENTS, THEME_ICONS } from './validate.js'

/**
 * Tema for turen (Story 2.6, AD-14). Ren modul: faste paletter og symboler, kontrast og CSS-variabler.
 * Nøklene er nøyaktig listene i validate.js (testes). Alle `primary` har minst 4.5:1 mot hvit og krem.
 */

export const DEFAULT_THEME = Object.freeze({ accent: 'kobber', icon: 'kompass' })

/** @type {Record<string, { primary: string, pressed: string, label: string, on: string }>} */
export const ACCENT_COLORS = {
  kobber: { primary: '#8a5216', pressed: '#6e4111', label: 'Kobber', on: '#ffffff' },
  fjord: { primary: '#0f766e', pressed: '#0b5a54', label: 'Fjord', on: '#ffffff' },
  skog: { primary: '#2f6b3a', pressed: '#24542d', label: 'Skog', on: '#ffffff' },
  baer: { primary: '#9d2a55', pressed: '#7d2043', label: 'Bær', on: '#ffffff' },
  natt: { primary: '#3b4a9c', pressed: '#2d3a7c', label: 'Natt', on: '#ffffff' },
  lyng: { primary: '#7a3e9d', pressed: '#5f2f7c', label: 'Lyng', on: '#ffffff' },
}

/** @type {Record<string, { char: string, label: string }>} */
export const ICON_SYMBOLS = {
  kompass: { char: '🧭', label: 'Kompass' },
  fjell: { char: '⛰️', label: 'Fjell' },
  telt: { char: '⛺', label: 'Telt' },
  bat: { char: '⛵', label: 'Båt' },
  kart: { char: '🗺️', label: 'Kart' },
  flagg: { char: '🚩', label: 'Flagg' },
}

const channel = (hex, i) => {
  const v = parseInt(hex.slice(i, i + 2), 16) / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (hex) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)

/** WCAG-kontrast mellom to farger på formen #rrggbb. */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Et gyldig tema. Ugyldig, manglende eller halvt tema gir standardtemaet (et gyldig halvt tema fylles ikke ut). */
export function resolveTheme(theme) {
  if (theme !== null && typeof theme === 'object' && THEME_ACCENTS.includes(theme.accent) && THEME_ICONS.includes(theme.icon)) {
    return { accent: theme.accent, icon: theme.icon }
  }
  return { ...DEFAULT_THEME }
}

/** CSS-variabler for temaet. Aliasene som er avledet av --primary i styles.css (--copper) må settes på samme element. */
export function themeVars(theme) {
  const c = ACCENT_COLORS[resolveTheme(theme).accent]
  return {
    '--primary': c.primary, '--primary-pressed': c.pressed, '--on-primary': c.on,
    '--accent': c.primary, '--copper': c.primary,
  }
}
