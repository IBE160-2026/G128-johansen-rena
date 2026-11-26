/**
 * Felles verktøy for nettlesertestene: starter appen i demo-modus og styrer headless Chrome over
 * DevTools-protokollen. Bruker bare det som finnes i Node (22 eller nyere) og Vite.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer as createNetServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ARTIFACTS = join(ROOT, 'e2e', 'artifacts')
/** Det eneste appen får hente utenfra. Blokkeres i testene, med mindre E2E_EKSTERNT=1. */
export const EXTERNAL_HOSTS = [/(^|\.)tile\.openstreetmap\.org$/, /^fonts\.googleapis\.com$/, /^fonts\.gstatic\.com$/]
export const TRIAL_KEY = 'tripbuilder-demo-v2'
export const ROLE_KEY = 'tripbuilder-user-v2'

const CALL_TIMEOUT_MS = 30000
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ]
  const found = candidates.find((path) => path && existsSync(path))
  if (!found) throw new Error('Fant ikke Chrome. Installer Google Chrome, eller sett CHROME_PATH til programfila.')
  return found
}

const freePort = () => new Promise((resolve, reject) => {
  const server = createNetServer()
  server.once('error', reject)
  server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)) })
})

/** Starter appen i demo-modus. Supabase-nøkler fra .env eller miljøet brukes aldri. */
async function startApp(envDir) {
  delete process.env.VITE_SUPABASE_URL
  delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const port = await freePort()
  const server = await createServer({ root: ROOT, envDir, logLevel: 'error', server: { host: '127.0.0.1', port, strictPort: true } })
  await server.listen()
  return { base: `http://127.0.0.1:${port}`, close: () => server.close() }
}

async function startChrome(profile) {
  const chrome = spawn(findChrome(), ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--lang=nb-NO', 'about:blank'], { stdio: 'ignore' })
  const portFile = join(profile, 'DevToolsActivePort')
  for (let i = 0; i < 100; i += 1) {
    if (existsSync(portFile)) {
      const port = readFileSync(portFile, 'utf8').split('\n')[0]
      try {
        const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
        const first = targets.find((t) => t.type === 'page')
        if (first) return { chrome, port, first }
      } catch { /* ikke klar ennå */ }
    }
    await sleep(100)
  }
  chrome.kill()
  throw new Error('Chrome startet ikke.')
}

/** Én fane. Funksjonene som sendes til `run` og `waitFor` kjører i nettleseren, så de kan ikke bruke variabler utenfra. */
async function connect(target, session) {
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error('Fikk ikke kontakt med fanen.')) })
  let nextId = 0
  const waiting = new Map()
  // Alle kall har en tidsgrense: svarer ikke Chrome, skal testen feile med en melding, ikke bli stående
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    nextId += 1
    const id = nextId
    const timer = setTimeout(() => { waiting.delete(id); reject(new Error(`${method}: Chrome svarte ikke innen ${CALL_TIMEOUT_MS / 1000} s.`)) }, CALL_TIMEOUT_MS)
    waiting.set(id, { method, resolve: (value) => { clearTimeout(timer); resolve(value) }, reject: (error) => { clearTimeout(timer); reject(error) } })
    socket.send(JSON.stringify({ id, method, params }))
  })
  const page = { send, acceptDialogs: true, dialogs: [] }
  const scriptRequests = new Map()
  let abortedScripts = []

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const call = waiting.get(message.id)
      waiting.delete(message.id)
      if (message.error) call?.reject(new Error(`${call.method}: ${message.error.message}`))
      else call?.resolve(message.result)
      return
    }
    const { method, params } = message
    if (method === 'Page.javascriptDialogOpening') {
      page.dialogs.push(params.message)
      send('Page.handleJavaScriptDialog', { accept: page.acceptDialogs })
    }
    if (method === 'Runtime.exceptionThrown') session.errors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text)
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') session.errors.push(params.args.map((a) => a.value ?? a.description).join(' '))
    if (method === 'Network.requestWillBeSent') {
      session.requests.push(params.request.url)
      if (params.type === 'Script') scriptRequests.set(params.requestId, params.request.url)
    }
    if (method === 'Network.loadingFailed' && !params.blockedReason && scriptRequests.has(params.requestId)) abortedScripts.push(`${params.errorText} ${scriptRequests.get(params.requestId)}`)
  }

  for (const domain of ['Page', 'Runtime', 'Network']) await send(`${domain}.enable`)
  if (!process.env.E2E_EKSTERNT) await send('Network.setBlockedURLs', { urls: ['*tile.openstreetmap.org*', '*fonts.googleapis.com*', '*fonts.gstatic.com*'] })
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })

  page.run = async (fn, ...args) => {
    // Et element kan ikke sendes ut av nettleseren, så det blir til `true`
    const expression = `Promise.resolve((${fn})(...${JSON.stringify(args)})).then((value) => (value instanceof Node ? true : value))`
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
  }

  /** Venter til funksjonen gir en sann verdi, og gir den tilbake. */
  page.waitFor = async (fn, args = [], { timeout = 8000, message = String(fn) } = {}) => {
    const end = Date.now() + timeout
    let last
    while (Date.now() < end) {
      try {
        const value = await page.run(fn, ...args)
        if (value) return value
      } catch (error) { last = error } // siden kan være midt i en navigering
      await sleep(100)
    }
    const body = await page.text().catch(() => '')
    throw new Error(`Ventet forgjeves på: ${message}${last ? `\nSiste feil: ${last.message}` : ''}\n--- siden viser ---\n${body.slice(0, 800)}`)
  }

  page.text = () => page.run(() => document.body.innerText)
  page.waitForText = (text, options) => page.waitFor((t) => document.body.innerText.includes(t), [text], { message: `teksten «${text}»`, ...options })
  page.path = () => page.run(() => location.pathname + location.search)
  page.waitForPath = (path) => page.waitFor((p) => location.pathname + location.search === p, [path], { message: `adressen ${path}` })
  page.front = () => send('Page.bringToFront')

  async function load(path) {
    abortedScripts = []
    await page.run(() => { window.__old = true }).catch(() => {})
    await send('Page.navigate', { url: session.base + path })
    await page.waitFor(() => !window.__old && document.readyState === 'complete' && document.querySelector('#root')?.children.length > 0, [], { timeout: 15000, message: `at ${path} lastes` })
  }

  page.goto = async (path) => {
    try { await load(path) }
    catch (error) {
      // Chrome avbryter av og til hentingen av én av Vites filer. Da kjører appen aldri, og siden står blank.
      // Bare i det tilfellet prøves det én gang til, og det skrives ut. Alle andre feil får testen til å feile.
      if (!abortedScripts.length) throw error
      console.warn(`ADVARSEL: ${path} ble blank fordi et skript ikke ble hentet (${abortedScripts[0]}). Laster en gang til.`)
      await load(path)
    }
  }

  /** Teller treff for en velger, eventuelt bare de med teksten. */
  page.count = (selector) => page.run((s) => document.querySelectorAll(s).length, selector)

  /**
   * Ekte trykk midt på elementet. Feiler hvis noe annet ligger oppå. `text` velger elementet som inneholder teksten,
   * og `within` begrenser søket til containeren (velger) som har teksten `withinText`.
   */
  page.tap = async (selector, text = '', { within, withinText } = {}) => {
    const point = await page.waitFor((s, t, w, wt) => {
      const root = w ? [...document.querySelectorAll(w)].find((e) => e.textContent.includes(wt)) : document
      const element = root && [...root.querySelectorAll(s)].find((e) => e.getClientRects().length && e.textContent.trim().includes(t) && !e.disabled)
      if (!element) return null
      element.scrollIntoView({ block: 'center', behavior: 'instant' })
      const box = element.getBoundingClientRect()
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      const top = document.elementFromPoint(x, y)
      return top && (element === top || element.contains(top)) ? { x, y } : null
    }, [selector, text, within ?? '', withinText ?? ''], { message: `at «${text}» (${selector}${withinText ? ` i ${withinText}` : ''}) kan trykkes og ikke er dekket` })
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: point.x, y: point.y, button: 'left', clickCount: 1 })
    await sleep(50)
  }

  /** Fyller et felt slik React oppfatter det. */
  page.fill = async (selector, value) => {
    await page.waitFor((s) => document.querySelector(s), [selector], { message: `feltet ${selector}` })
    await page.run((s, v) => {
      const element = document.querySelector(s)
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set.call(element, v)
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }, selector, value)
    await sleep(50)
  }

  /** Lager et lite bilde og legger det i et filfelt (filvelgeren kan ikke styres headless). */
  page.attachImage = async (selector, index, label) => {
    await page.waitFor((s, i) => document.querySelectorAll(s)[i], [selector, index], { message: `filfeltet ${selector}` })
    await page.run(async (s, i, text) => {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      const context = canvas.getContext('2d')
      context.fillStyle = '#0f766e'
      context.fillRect(0, 0, 320, 240)
      context.fillStyle = '#fff'
      context.font = '32px sans-serif'
      context.fillText(text, 20, 120)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      const transfer = new DataTransfer()
      transfer.items.add(new File([blob], `${text}.png`, { type: 'image/png' }))
      const input = document.querySelectorAll(s)[i]
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, selector, index, label)
  }

  /** Demodata slik de er lagret. Uten `slug` gjelder prøveturen. */
  page.db = (slug) => page.run((key, published) => {
    const stored = JSON.parse(localStorage.getItem(key))
    return published ? stored?.data : stored
  }, slug ? `tripbuilder-demo-trip-v1:${slug}` : TRIAL_KEY, Boolean(slug))

  page.setRole = (userId) => page.run((key, id) => { sessionStorage.setItem(key, id) }, ROLE_KEY, userId)

  /** Sidelengs rulling og trykkflater under 48 px. Kartets kreditlenker holdes utenfor. */
  page.layout = () => page.run(() => {
    const selector = 'button,a,select,summary,[role=button],input:not([type=file]):not([type=checkbox]):not([type=radio]),textarea,.upload-button,.photo-picker label'
    const small = []
    for (const element of document.querySelectorAll(selector)) {
      if (element.closest('.leaflet-control-attribution') || element.classList.contains('sr-only')) continue
      const box = element.getBoundingClientRect()
      if (!box.width || !box.height || getComputedStyle(element).visibility === 'hidden') continue
      if (box.width < 47.5 || box.height < 47.5) small.push(`${(element.textContent.trim() || element.getAttribute('aria-label') || element.id || element.tagName).slice(0, 40)}: ${Math.round(box.width)}x${Math.round(box.height)}`)
    }
    return { overflow: document.documentElement.scrollWidth - innerWidth, small: [...new Set(small)] }
  })

  page.screenshot = async (name) => {
    mkdirSync(ARTIFACTS, { recursive: true })
    await send('Page.bringToFront') // Chrome tegner ikke en fane i bakgrunnen, og skjermbildet ville aldri komme
    const { data } = await send('Page.captureScreenshot', {})
    writeFileSync(join(ARTIFACTS, `${name}.png`), Buffer.from(data, 'base64'))
  }

  return page
}

/** Starter app og nettleser. `close()` må alltid kalles. */
export async function startSession() {
  if (typeof WebSocket !== 'function') throw new Error('Nettlesertestene krever Node 22 eller nyere.')
  const temp = mkdtempSync(join(tmpdir(), 'tripbuilder-e2e-'))
  const session = { errors: [], requests: [], pages: [] }
  let app
  let browser
  const close = async () => {
    if (browser) {
      const exited = new Promise((resolve) => browser.chrome.once('exit', resolve))
      browser.chrome.kill()
      await Promise.race([exited, sleep(3000)])
    }
    await app?.close()
    rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
  try {
    app = await startApp(temp) // en tom mappe som envDir, så ingen .env leses
    session.base = app.base
    browser = await startChrome(join(temp, 'profil'))
  } catch (error) {
    await close()
    throw error
  }

  session.pages.push(await connect(browser.first, session))

  /** Ny fane med samme lagring (localStorage), men egen rolle (sessionStorage). */
  session.newPage = async () => {
    const { targetId } = await session.pages[0].send('Target.createTarget', { url: 'about:blank' })
    const targets = await (await fetch(`http://127.0.0.1:${browser.port}/json/list`)).json()
    const page = await connect(targets.find((t) => t.id === targetId), session)
    session.pages.push(page)
    return page
  }

  /** Velger rolle på startsiden, slik en bruker gjør. */
  session.enterAs = async (page, role) => {
    await page.front()
    await page.goto('/')
    await page.tap('.role-button', role === 'organizer' ? 'Arrangør' : 'Deltaker')
    await page.waitForPath(role === 'organizer' ? '/mine-turer' : '/t/provetur')
  }

  /** Adresser appen har hentet utenfra som ikke står på lista. */
  session.unexpectedHosts = () => [...new Set(session.requests
    .filter((url) => /^https?:|^wss?:/.test(url) && !url.startsWith(session.base))
    .map((url) => new URL(url).hostname)
    .filter((host) => host !== '127.0.0.1' && !EXTERNAL_HOSTS.some((allowed) => allowed.test(host))))]

  session.screenshotAll = async (name) => {
    for (const [i, page] of session.pages.entries()) await page.screenshot(`feil-${name}-fane${i + 1}`).catch(() => {})
  }

  session.close = close
  return session
}

/** `it` som tar skjermbilde av alle faner når steget feiler. */
export const stepWith = (it, getSession) => (name, fn) => it(name, async () => {
  try { await fn() }
  catch (error) {
    await getSession()?.screenshotAll(name.toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').slice(0, 60))
    throw error
  }
})
