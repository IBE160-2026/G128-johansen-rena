// Mål av utseendet på 390 px: trykkflater (UX-DR17), sidelengs rulling og feil som har sluppet gjennom før.
// Testene måler. De erstatter ikke at noen ser på skjermbildene i e2e/artifacts/.
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { startSession, stepWith } from './harness.js'
import { createDraft, publish } from './actions.js'

describe('utseende på mobil (390 px)', () => {
  let session
  let page
  const step = stepWith(it, () => session)

  before(async () => {
    session = await startSession()
    page = session.pages[0]
  })
  after(() => session?.close())

  async function measure(name) {
    const { overflow, small } = await page.layout()
    await page.screenshot(`utseende-${name}`)
    assert.deepEqual(small, [], `${name}: trykkflater under 48 px`)
    assert.ok(overflow <= 0, `${name}: siden kan rulles ${overflow} px sidelengs`)
  }
  const visit = async (path, ready, name) => {
    await page.goto(path)
    await page.waitFor((s) => document.querySelector(s), [ready])
    await measure(name)
  }

  step('Start og velkomstsiden', async () => {
    await visit('/', '.role-button', 'start')
    await visit('/t/provetur', '#demo-member', 'velkomst')
  })

  step('deltakersidene og vinduene', async () => {
    await session.enterAs(page, 'participant')
    await measure('hjem')
    for (const [path, ready, name] of [['program', '.timeline-item', 'program'], ['kart', '.checkpoint-card', 'kart'], ['ledertavle', '.leader-row', 'ledertavle'], ['laget', '.team-banner', 'laget'], ['bilder', '.upload-button', 'bilder-tom']]) {
      await visit(`/t/provetur/${path}`, ready, name)
    }
    await page.attachImage('.upload-button input', 0, 'minne')
    await page.waitFor(() => document.querySelector('.photo-card img')?.naturalWidth > 0, [])
    await measure('bilder')
    await page.tap('.photo-card')
    await measure('stort-bilde')
    await page.goto('/t/provetur/kart')
    await page.tap('.checkpoint-bottom button', 'Send bilde')
    await measure('innsending')
  })

  step('tidslinjen: klokkeslettet har luft til prikken', async () => {
    await page.goto('/t/provetur/program')
    const gaps = await page.waitFor(() => {
      const items = [...document.querySelectorAll('.timeline-item')]
      return items.length && items.map((item) => {
        const range = document.createRange()
        range.selectNodeContents(item.querySelector('time'))
        const textRight = range.getBoundingClientRect().right - item.getBoundingClientRect().left
        const dotLeft = parseFloat(getComputedStyle(item, '::before').left) - 2 // kanten og skyggen
        return Math.round(dotLeft - textRight)
      })
    }, [])
    assert.ok(Math.min(...gaps) >= 8, `minste avstand er ${Math.min(...gaps)} px`)
  })

  step('ledertavlen: navn, merke og medlemstall på hver sin linje', async () => {
    await page.goto('/t/provetur/ledertavle')
    const rows = await page.waitFor(() => {
      const list = [...document.querySelectorAll('.leader-row')]
      return list.length && list.map((row) => {
        const lines = [...row.querySelector('.leader-team')?.children ?? []].map((e) => e.getBoundingClientRect())
        return { text: row.innerText, stacked: lines.length > 1 && lines.every((box, i) => i === 0 || box.top >= lines[i - 1].bottom - 1), rank: row.querySelector('.leader-rank').getBoundingClientRect().height }
      })
    }, [])
    for (const row of rows) {
      assert.ok(row.stacked, `linjene flyter sammen: ${row.text}`)
      assert.ok(row.rank < 45, `plasseringen brytes over flere linjer: ${row.text}`)
    }
  })

  step('menyen nederst dekker ingen knapper når siden er rullet helt ned', async () => {
    for (const sub of ['', '/program', '/kart', '/ledertavle', '/laget']) {
      await page.goto(`/t/provetur${sub}`)
      await page.waitFor(() => document.querySelector('.page-content .surface'), [])
      const covered = await page.run(() => {
        scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
        const top = document.querySelector('.bottom-nav').getBoundingClientRect().top
        return [...document.querySelectorAll('.page-content button,.page-content a,.page-content input,.page-content select')]
          .filter((e) => { const box = e.getBoundingClientRect(); return box.height > 0 && box.bottom > top + 1 && box.top < innerHeight })
          .map((e) => e.textContent.trim() || e.id)
      })
      assert.deepEqual(covered, [], `dekket på ${sub || 'Hjem'}`)
    }
  })

  step('arrangørsidene: Admin med skjemaer', async () => {
    await page.setRole('demo-admin')
    await visit('/t/provetur', '.page-heading', 'hjem-arrangor')
    await visit('/t/provetur/admin', '.admin-tabs', 'admin-oversikt')
    for (const [tab, opener] of [['Program', '+ Programpost'], ['Rebusposter', '+ Post'], ['Lag'], ['Innsendinger']]) {
      await page.goto('/t/provetur/admin')
      await page.tap('.admin-tabs button', tab)
      await measure(`admin-${tab.toLowerCase()}`)
      if (opener) {
        await page.tap('.admin-actions button', opener)
        await page.waitFor(() => document.querySelector('.form-stack'), [])
        await measure(`admin-${tab.toLowerCase()}-skjema`)
      }
    }
  })

  step('Mine turer, Ny tur, Utkast og delingssiden', async () => {
    await visit('/mine-turer', '.trip-list', 'mine-turer')
    await visit('/ny-tur', '.new-trip-form', 'ny-tur')
    await createDraft(page, { participants: 1, teams: 1, posts: 1 })
    for (const tab of ['Turen', 'Program', 'Poster', 'Lag', 'Poeng', 'Tema']) {
      await page.tap('[role=tab]', tab)
      await measure(`utkast-${tab.toLowerCase()}`)
    }
    const { slug } = await publish(page)
    await measure('del')
    // entall
    await page.goto(`/t/${slug}/kart`)
    await page.waitFor(() => /\b1 post\b/.test(document.body.innerText), [], { message: '«1 post»' })
    await page.goto(`/t/${slug}/ledertavle`)
    await page.waitFor(() => /\b1 medlem\b/.test(document.body.innerText), [], { message: '«1 medlem»' })
  })

  step('ingen konsollfeil og ingen uventede forespørsler ut', () => {
    assert.deepEqual(session.errors, [])
    assert.deepEqual(session.unexpectedHosts(), [])
  })
})
