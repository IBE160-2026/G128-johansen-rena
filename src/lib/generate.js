import { buildMockDraft } from './mockAgent.js'
import { validateTrip, validateTripRequest } from './validate.js'

/** Orkestreringen av mock-genereringen (Story 2.3, AD-15). Ren: seed og alternativer sendes inn. */
export const GENERATE_STEPS = ['plan', 'content', 'check']
const STEP_MS = 500

const abortError = () => new DOMException('Genereringen ble avbrutt.', 'AbortError')

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const onAbort = () => { clearTimeout(timer); reject(abortError()) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve() }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Lager et utkast fra en TripRequest. Lagrer ingenting. Avbrutt `signal` gir en AbortError (også rett før svaret).
 * `fail: true` gir MOCK_FAILURE (testflagget ?mock=feil).
 * @returns {Promise<{ ok: true, draft: object } | { ok: false, error: { code: string, issues?: object[] } }>}
 */
export async function generateDraft(req, seed, { signal, onStep, fail = false, stepMs = STEP_MS } = {}) {
  const valid = validateTripRequest(req)
  if (!valid.ok) return { ok: false, error: { code: 'INVALID_REQUEST', issues: valid.issues } }
  let draft = null
  for (const step of GENERATE_STEPS) {
    onStep?.(step)
    await wait(stepMs, signal)
    if (step === 'content' && !fail) draft = buildMockDraft(req, seed)
  }
  if (signal?.aborted) throw abortError()
  if (fail) return { ok: false, error: { code: 'MOCK_FAILURE' } }
  const checked = validateTrip(draft, req)
  if (!checked.ok) return { ok: false, error: { code: 'VALIDATION_FAILED', issues: checked.issues } }
  return { ok: true, draft }
}
