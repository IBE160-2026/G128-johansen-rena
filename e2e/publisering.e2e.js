// Story 2.7: fra «Ny tur» til en publisert tur som kan spilles, uten at prøveturen endres.
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { startSession, stepWith } from './harness.js'
import { closeReceipt, createDraft, decide, publish, publishEnabled, sendProof, waitForPostCard, waitForStatus } from './actions.js'

describe('publisering av en tur (Story 2.7)', () => {
  let session
  let organizer
  let participant
  let trialBefore
  let draftCopy
  let slug
  let code
  const step = stepWith(it, () => session)
  const storageItem = (key) => organizer.run((k) => localStorage.getItem(k), key)
  const published = () => organizer.run(() => JSON.parse(localStorage.getItem('tripbuilder-demo-published-v1') ?? '[]').length)

  before(async () => {
    session = await startSession()
    organizer = session.pages[0]
    await session.enterAs(organizer, 'organizer')
    trialBefore = await storageItem('tripbuilder-demo-v2')
  })
  after(() => session?.close())

  step('utkastet får egne tekster som kan redigeres', async () => {
    await createDraft(organizer)
    assert.equal(await organizer.run(() => document.querySelector('#trip-name').value), 'Tur til Budapest')
    assert.match(await organizer.run(() => document.querySelector('#trip-description').value), /^3 dager i Budapest for 9 deltakere/)
    await organizer.fill('#trip-name', '')
    assert.equal(await publishEnabled(organizer), false)
    await organizer.fill('#trip-name', 'Blåtur på Øya')
    await organizer.fill('#trip-description', 'Min egen beskrivelse.')
    await organizer.goto('/utkast')
    assert.equal(await organizer.run(() => document.querySelector('#trip-name').value), 'Blåtur på Øya')
    assert.equal(await publishEnabled(organizer), true)
  })

  step('ugyldig område i feltene stopper publiseringen', async () => {
    await organizer.tap('[role=tab]', 'Poster')
    await organizer.fill('#area-radius', 'abc')
    await organizer.waitForText('Rett området før publisering')
    assert.equal(await publishEnabled(organizer), false)
    await organizer.tap('[role=tab]', 'Tema')
    await organizer.waitFor(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Publiser').disabled, [])
    await organizer.tap('.theme-option', 'Fjord')
    draftCopy = await storageItem('tripbuilder-draft-v1')
  })

  step('avbrutt bekreftelse og full lagring beholder utkastet', async () => {
    organizer.acceptDialogs = false
    await organizer.tap('button', 'Publiser')
    assert.match(organizer.dialogs.at(-1), /Publisere turen/)
    assert.ok(await storageItem('tripbuilder-draft-v1'))
    assert.equal(await published(), 0)
    organizer.acceptDialogs = true
    await organizer.run(() => {
      window.__setItem = Storage.prototype.setItem
      Storage.prototype.setItem = function setItem(key, value) {
        if (key.startsWith('tripbuilder-demo-trip')) throw new Error('full')
        return window.__setItem.call(this, key, value)
      }
    })
    await organizer.tap('button', 'Publiser')
    await organizer.waitForText('Utkastet ditt er beholdt')
    assert.ok(await storageItem('tripbuilder-draft-v1'))
    await organizer.run(() => { Storage.prototype.setItem = window.__setItem })
  })

  step('publisering gir turkode, lenke og QR-kode, og utkastet tømmes', async () => {
    ({ slug, code } = await publish(organizer))
    assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/)
    assert.match(slug, /^blatur-pa-oya-[a-z0-9]{4}$/)
    assert.equal(await storageItem('tripbuilder-draft-v1'), null)
    const link = `${session.base}/t/${slug}?kode=${code}`
    await organizer.waitForText(link)
    await organizer.waitFor(() => document.querySelector('.share-qr')?.naturalWidth > 0 && document.querySelector('.share-qr').alt, [])
    // QR-koden leses av når nettleseren har en leser innebygd (ikke på alle systemer)
    const decoded = await organizer.run(async () => ('BarcodeDetector' in window ? (await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(document.querySelector('.share-qr'))).map((r) => r.rawValue) : null))
    if (decoded) assert.deepEqual(decoded, [link])
  })

  step('en fiktiv deltaker spiller turen med egne tekster og eget tema', async () => {
    participant = await session.newPage()
    await participant.front()
    await participant.goto(`/t/${slug}?kode=FEIL99`)
    await participant.run(() => sessionStorage.clear())
    await participant.goto(`/t/${slug}?kode=FEIL99`)
    await participant.waitForText('Koden stemmer ikke med denne turen.')
    await participant.goto(`/t/${slug}?kode=${code}`)
    await participant.waitForText(`Turkode fra lenken: ${code}`)
    assert.ok(!(await participant.text()).includes('Koden stemmer ikke'))
    assert.ok((await participant.text()).includes('Min egen beskrivelse.'))
    const members = await participant.run(() => [...document.querySelectorAll('#demo-member option')].map((o) => o.value).filter(Boolean))
    assert.equal(members.length, 9)
    await participant.fill('#demo-member', members[0])
    await participant.tap('button', 'Gå inn på turen')
    await participant.waitFor(() => document.querySelector('.app-shell'), [])
    assert.equal(await participant.run(() => getComputedStyle(document.querySelector('.app-shell')).getPropertyValue('--primary').trim()), '#0f766e')
  })

  step('innsending og godkjenning lagres bare på den publiserte turen', async () => {
    await participant.goto(`/t/${slug}/kart`)
    const post = (await participant.db(slug)).checkpoints.find((c) => !c.requires_location) ?? (await participant.db(slug)).checkpoints[0]
    if (post.requires_location) await participant.tap('.position-simulator button', `Gå til post ${post.position}`)
    await sendProof(participant, post.title, 'På publisert tur')
    await closeReceipt(participant)
    await organizer.front()
    await organizer.goto(`/t/${slug}/admin?fane=inbox`)
    await decide(organizer, 'På publisert tur', 'Godkjenn')
    await waitForStatus(organizer, 'På publisert tur', 'approved', slug)
    await participant.front()
    await waitForPostCard(participant, post.title, 'Godkjent')
    assert.equal(await storageItem('tripbuilder-demo-v2'), trialBefore)
  })

  step('en publisert tur oppdateres i den andre fanen også uten signal', async () => {
    await participant.front()
    await participant.goto(`/t/${slug}`)
    await participant.waitFor(() => document.querySelector('.page-heading'), [])
    await organizer.run((key) => {
      const entry = JSON.parse(localStorage.getItem(key))
      entry.data.trip.announcement = 'Uten signal på publisert tur'
      localStorage.setItem(key, JSON.stringify(entry))
    }, `tripbuilder-demo-trip-v1:${slug}`)
    await participant.waitForText('Uten signal på publisert tur', { timeout: 3000 })
  })

  step('«Tilbakestill demo» nullstiller bare denne turen, og man blir på den', async () => {
    await organizer.front()
    await organizer.goto(`/t/${slug}`)
    await organizer.tap('button', 'Tilbakestill demo')
    await organizer.waitForText('Velg deltaker')
    assert.equal(await organizer.path(), `/t/${slug}`)
    assert.match(organizer.dialogs.at(-1), /slik den ble publisert/)
    assert.deepEqual((await organizer.db(slug)).submissions, [])
    assert.equal(await published(), 1)
    assert.equal(await storageItem('tripbuilder-demo-v2'), trialBefore)
  })

  step('en gammel fane kan ikke publisere eller gjenopprette et lukket utkast', async () => {
    await organizer.goto('/')
    await organizer.setRole('demo-admin')
    await organizer.run((draft) => localStorage.setItem('tripbuilder-draft-v1', draft), draftCopy)
    await organizer.goto('/utkast')
    await organizer.waitFor(() => document.querySelector('#trip-name'), [])
    await organizer.run(() => localStorage.removeItem('tripbuilder-draft-v1')) // «publisert i en annen fane»
    await organizer.tap('button', 'Publiser')
    await organizer.waitForText('i en annen fane')
    assert.equal(await published(), 1)
    await organizer.fill('#trip-name', 'Endret i gammel fane')
    assert.equal(await storageItem('tripbuilder-draft-v1'), null)
  })

  step('ukjent adresse og ødelagt lagring gir ingen krasj', async () => {
    for (const path of ['/t/finnes-ikke', '/del/finnes-ikke']) {
      await organizer.goto(path)
      await organizer.waitForText('Fant ikke turen.')
    }
    await organizer.run((key) => localStorage.setItem(key, '{ødelagt'), `tripbuilder-demo-trip-v1:${slug}`)
    await organizer.goto(`/t/${slug}`)
    await organizer.waitForText('Fant ikke turen.')
    await organizer.run(() => localStorage.setItem('tripbuilder-demo-published-v1', '{ødelagt'))
    await organizer.goto('/mine-turer')
    await organizer.waitFor(() => document.querySelectorAll('.trip-list li').length === 1, [])
  })

  step('ingen konsollfeil og ingen uventede forespørsler ut', () => {
    assert.deepEqual(session.errors, [])
    assert.deepEqual(session.unexpectedHosts(), [])
  })
})
