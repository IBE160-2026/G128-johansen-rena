/** Handlinger flere av testene gjør, skrevet slik en bruker gjør dem. */

export const postCard = (page, title) => page.run((t) => [...document.querySelectorAll('.checkpoint-card')]
  .find((card) => card.querySelector('h3').textContent.includes(t))?.innerText.replace(/\n+/g, ' | ') ?? '', title)

export const waitForPostCard = (page, title, text, options) => page.waitFor((t, expected) => [...document.querySelectorAll('.checkpoint-card')]
  .find((card) => card.querySelector('h3').textContent.includes(t))?.innerText.includes(expected), [title, text], { message: `«${text}» på posten ${title}`, ...options })

/** Åpner innsendingen for en post, legger ved bilde og notat, og trykker send. */
export async function sendProof(page, title, note) {
  await page.tap('.checkpoint-bottom button', 'Send bilde', { within: '.checkpoint-card', withinText: title })
  await page.attachImage('.photo-picker input', 1, 'bevis')
  await page.waitFor(() => document.querySelector('.submission-preview')?.naturalWidth > 0, [], { message: 'forhåndsvisning av bildet' })
  await page.fill('#submission-note', note)
  await page.tap('.modal button', 'Send til godkjenning')
}

export async function closeReceipt(page) {
  await page.waitFor(() => document.querySelector('.modal .notice.success'), [], { message: 'kvittering' })
  await page.tap('.modal button.primary', 'Lukk')
}

export async function openAdmin(page, tab) {
  await page.front()
  await page.goto('/t/provetur/admin')
  await page.tap('.admin-tabs button', tab)
}

/** Trykker en knapp i raden i Admin som har teksten. */
export const tapInRow = (page, rowText, label) => page.tap('button', label, { within: '.admin-row', withinText: rowText })

export async function saveAnnouncement(page, text) {
  await page.front()
  await page.goto('/t/provetur/admin')
  await page.fill('#announcement', text)
  await page.tap('button', 'Lagre beskjed')
  await page.waitFor((t) => JSON.parse(localStorage.getItem('tripbuilder-demo-v2')).trip.announcement === t, [text], { message: 'at beskjeden lagres' })
}

/** Godkjenner eller avviser innsendingen med notatet. Beslutningen sendes etter 5 sekunder. */
export async function decide(page, note, label, reason) {
  await page.waitFor((n) => [...document.querySelectorAll('.submission-card')].some((c) => c.textContent.includes(n)), [note], { message: `innsendingen «${note}» i køen` })
  if (reason) {
    const id = await page.run((n) => [...document.querySelectorAll('.submission-card')].find((c) => c.textContent.includes(n)).querySelector('input').id, note)
    await page.fill(`#${id}`, reason)
  }
  await page.tap('button', label, { within: '.submission-card', withinText: note })
}

export const waitForStatus = (page, note, status, slug) => page.waitFor((key, published, n, s) => {
  const stored = JSON.parse(localStorage.getItem(key))
  return (published ? stored.data : stored).submissions.some((entry) => entry.note === n && entry.status === s)
}, [slug ? `tripbuilder-demo-trip-v1:${slug}` : 'tripbuilder-demo-v2', Boolean(slug), note, status], { timeout: 15000, message: `status ${status} på «${note}»` })

export const leaderboard = (page) => page.run(() => [...document.querySelectorAll('.leader-row')].map((row) => row.innerText.replace(/\n+/g, ' ')))

/** Fyller ut «Ny tur» og venter på utkastet. */
export async function createDraft(page, { days = 3, participants = 9, teams = 3, posts = 4 } = {}) {
  await page.goto('/ny-tur')
  const date = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)
  const fields = { destination: 'Budapest', start_date: date(30), end_date: date(30 + days - 1), participant_count: String(participants), team_count: String(teams), post_count: String(posts), description: 'En blåtur med rebus, middag og byvandring for hele gjengen.' }
  for (const [name, value] of Object.entries(fields)) await page.fill(`#nytur-${name}`, value)
  await page.tap('.new-trip-form button', 'Lag utkast')
  await page.waitFor(() => location.pathname === '/utkast' && document.querySelector('#trip-name'), [], { timeout: 15000, message: 'utkastet' })
}

export const publishEnabled = (page) => page.run(() => {
  const button = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Publiser')
  return Boolean(button) && !button.disabled
})

/** Publiserer utkastet og gir adressen og turkoden. */
export async function publish(page) {
  await page.tap('button', 'Publiser')
  await page.waitFor(() => location.pathname.startsWith('/del/') && document.querySelector('.share-code'), [], { message: 'delingssiden' })
  return page.run(() => ({ slug: location.pathname.split('/').pop(), code: document.querySelector('.share-code').textContent }))
}
