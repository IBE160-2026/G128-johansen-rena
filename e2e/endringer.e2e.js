// Epic 4 og 5 på tvers av storyene, med deltaker og arrangør i hver sin fane. Til slutt funn 4-A fra
// retrospektivet: en innsending som tar tid, skal ikke overskrive det en annen fane lagrer imens.
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { startSession, stepWith } from './harness.js'
import { closeReceipt, decide, leaderboard, openAdmin, postCard, saveAnnouncement, sendProof, tapInRow, waitForPostCard, waitForStatus } from './actions.js'

describe('endringer mellom to faner (Epic 4 og 5)', () => {
  let session
  let p
  let o
  let me
  let oldTeam
  let newTeam
  let post // åpen post uten geolås
  const step = stepWith(it, () => session)
  const participantAt = async (path) => { await p.front(); await p.goto(`/t/provetur${path}`) }

  before(async () => {
    session = await startSession()
    p = session.pages[0]
    await session.enterAs(p, 'participant')
    const trip = await p.db()
    const userId = await p.run(() => sessionStorage.getItem('tripbuilder-user-v2'))
    me = trip.members.find((m) => m.user_id === userId)
    oldTeam = trip.teams.find((t) => t.id === me.team_id)
    newTeam = trip.teams.find((t) => t.id !== me.team_id)
    post = trip.checkpoints.find((c) => !c.requires_location)
    o = await session.newPage()
    await session.enterAs(o, 'organizer')
  })
  after(() => session?.close())

  step('4.2 og 4.3: ledertavlen oppdateres selv og melder ny stilling', async () => {
    await participantAt('/kart')
    await sendProof(p, post.title, 'Første bevis')
    await closeReceipt(p)
    await participantAt('/ledertavle')
    await p.waitFor(() => document.querySelector('.leader-row'), [])
    const live = () => p.run(() => document.querySelector('.surface [aria-live=polite]').textContent)
    assert.equal(await live(), '', 'ingen melding ved første visning')
    await openAdmin(o, 'Innsendinger')
    await decide(o, 'Første bevis', 'Godkjenn')
    await waitForStatus(o, 'Første bevis', 'approved')
    await p.front()
    await p.waitFor((name) => document.querySelector('.leader-row').innerText.includes(name), [oldTeam.name], { message: 'at laget går opp på 1. plass' })
    await p.waitFor(() => document.querySelector('.surface [aria-live=polite]').textContent.includes('Stillingen er oppdatert'), [])
  })

  step('4.2: dra ned henter poengene på nytt', async () => {
    await p.run(() => {
      const data = JSON.parse(localStorage.getItem('tripbuilder-demo-v2'))
      data.teams[1].name = 'Dratest' // lagret uten signal, så bare en ny henting viser det
      localStorage.setItem('tripbuilder-demo-v2', JSON.stringify(data))
      scrollTo(0, 0)
    })
    await p.send('Emulation.setTouchEmulationEnabled', { enabled: true })
    const touch = (type, y) => p.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 195, y }] })
    await touch('touchStart', 420)
    for (const y of [460, 500, 540, 580]) await touch('touchMove', y)
    await touch('touchEnd')
    await p.waitForText('Dratest')
    await p.send('Emulation.setTouchEmulationEnabled', { enabled: false })
  })

  step('4.1: en flyttet deltaker ser nytt lag, og innsendingen blir hos det gamle', async () => {
    await openAdmin(o, 'Lag')
    await o.fill(`select[aria-label="Lag for ${me.display_name}"]`, newTeam.id)
    await o.waitFor((id, team) => JSON.parse(localStorage.getItem('tripbuilder-demo-v2')).members.find((m) => m.id === id).team_id === team, [me.id, newTeam.id])
    const teamName = (await o.db()).teams.find((t) => t.id === newTeam.id).name
    await participantAt('/laget')
    await p.waitFor((name) => document.querySelector('.team-banner h3')?.textContent.includes(name), [teamName])
    assert.equal((await p.db()).submissions.find((s) => s.note === 'Første bevis').team_id, oldTeam.id)
  })

  step('5.1 og 5.4: ugyldig endring avvises, gyldig endring når deltakeren', async () => {
    const event = (await o.db()).program[0]
    await participantAt('')
    await p.waitFor(() => document.querySelector('.page-heading'), [])
    assert.ok(!(await p.text()).includes('Programmet er oppdatert'), 'ingen banner før endring')
    await openAdmin(o, 'Program')
    await tapInRow(o, event.title, 'Rediger')
    await o.fill('#event-title', '')
    await o.tap('.form-stack button', 'Lagre endringer')
    await o.waitFor(() => document.querySelector('#event-title[aria-invalid=true]'), [], { message: 'feil ved tittelfeltet' })
    assert.equal((await o.db()).program.find((e) => e.id === event.id).title, event.title)
    await o.fill('#event-title', 'Ny restaurant')
    await o.tap('.form-stack button', 'Lagre endringer')
    await o.waitForText('Deltakerne ser endringen nå')
    await p.front()
    await p.waitForText('Programmet er oppdatert')
  })

  step('5.1: nye poeng gjelder lag som har løst posten', async () => {
    await openAdmin(o, 'Rebusposter')
    await tapInRow(o, post.title, 'Rediger')
    await o.fill('#task-points', '77')
    await o.tap('.form-stack button', 'Lagre endringer')
    await o.waitForText('Deltakerne ser endringen nå')
    await participantAt('/ledertavle')
    await p.waitFor((name) => [...document.querySelectorAll('.leader-row')].some((r) => r.innerText.includes(name) && r.querySelector('.score').innerText.startsWith('77')), [oldTeam.name])
  })

  step('5.2: en ny post kan sendes inn på', async () => {
    await openAdmin(o, 'Rebusposter')
    await o.tap('.admin-actions button', '+ Post')
    for (const [id, value] of [['task-title', 'Ekstrapost'], ['task-description', 'Ta et lagbilde'], ['task-points', '5'], ['task-lat', '47.4979'], ['task-lng', '19.0402']]) await o.fill(`#${id}`, value)
    await o.run(() => { const box = document.querySelector('#task-requires'); if (box.checked) box.click() })
    await o.tap('.form-stack button', 'Legg til post')
    await o.waitFor(() => JSON.parse(localStorage.getItem('tripbuilder-demo-v2')).checkpoints.some((c) => c.title === 'Ekstrapost'), [])
    await participantAt('/kart')
    await waitForPostCard(p, 'Ekstrapost', 'Send bilde')
  })

  step('5.3: deaktivering stenger posten uten å fjerne poeng', async () => {
    await participantAt('/ledertavle')
    await p.waitFor(() => document.querySelector('.leader-row'), [])
    const before = await leaderboard(p)
    await openAdmin(o, 'Rebusposter')
    const buttons = await o.run((title) => [...[...document.querySelectorAll('.admin-row')].find((r) => r.textContent.includes(title)).querySelectorAll('button')].map((b) => b.textContent), post.title)
    assert.ok(!buttons.includes('Slett'), 'en post med innsendinger kan ikke slettes')
    await tapInRow(o, post.title, 'Deaktiver')
    await o.waitForText('Aktiver igjen')
    await p.front()
    assert.deepEqual(await leaderboard(p), before)
    await participantAt('/kart')
    await waitForPostCard(p, post.title, 'Deaktivert')
    await openAdmin(o, 'Rebusposter')
    await tapInRow(o, post.title, 'Aktiver igjen')
    await o.waitFor((id) => JSON.parse(localStorage.getItem('tripbuilder-demo-v2')).checkpoints.find((c) => c.id === id).status === 'active', [post.id])
  })

  describe('treg innsending (funn 4-A)', () => {
    /** Holder bildebehandlingen igjen til `release` kalles, så testen styrer tidsvinduet selv. */
    const holdImageProcessing = () => p.run(() => {
      const RealImage = window.Image
      const held = []
      window.Image = function HeldImage() {
        const image = new RealImage()
        let handler = null
        image.addEventListener('load', () => held.push(() => handler?.()))
        Object.defineProperty(image, 'onload', { set: (f) => { handler = f }, get: () => handler })
        return image
      }
      window.__held = held
      window.__release = () => { window.Image = RealImage; held.splice(0).forEach((resume) => resume()) }
    })
    async function startSlowSubmission(note) {
      await participantAt('/kart')
      await holdImageProcessing()
      await sendProof(p, 'Ekstrapost', note)
      await p.waitFor(() => window.__held.length > 0, [], { message: 'at bildebehandlingen venter' })
    }
    const release = async () => { await p.front(); await p.run(() => window.__release()) }
    const saved = async (note) => (await p.db()).submissions.some((s) => s.note === note)

    step('arrangørens beskjed overlever', async () => {
      await saveAnnouncement(o, 'Før sending')
      await startSlowSubmission('Treg sending')
      await saveAnnouncement(o, 'Møt ved broa nå')
      await release()
      await closeReceipt(p)
      assert.equal((await p.db()).trip.announcement, 'Møt ved broa nå')
      assert.ok(await saved('Treg sending'))
    })

    step('en post som deaktiveres underveis, avviser innsendingen og beholder skjemaet', async () => {
      // gjør «Ekstrapost» ledig igjen ved å avvise den første innsendingen
      await openAdmin(o, 'Innsendinger')
      await decide(o, 'Treg sending', 'Avvis')
      await waitForStatus(o, 'Treg sending', 'rejected')
      await startSlowSubmission('Deaktiveres underveis')
      await openAdmin(o, 'Rebusposter')
      await tapInRow(o, 'Ekstrapost', 'Deaktiver')
      await o.waitFor(() => JSON.parse(localStorage.getItem('tripbuilder-demo-v2')).checkpoints.find((c) => c.title === 'Ekstrapost').status === 'deactivated', [])
      await release()
      await p.waitFor(() => document.querySelector('.modal [role=alert]')?.textContent.includes('deaktivert'), [])
      assert.ok(!(await saved('Deaktiveres underveis')))
      assert.equal((await p.db()).checkpoints.find((c) => c.title === 'Ekstrapost').status, 'deactivated')
      assert.equal(await p.run(() => document.querySelector('#submission-note').value), 'Deaktiveres underveis')
      assert.ok(await p.run(() => Boolean(document.querySelector('.submission-preview'))), 'bildet står')
    })

    step('en godkjenning gjort underveis overlever', async () => {
      await openAdmin(o, 'Rebusposter')
      await tapInRow(o, 'Ekstrapost', 'Aktiver igjen')
      await o.waitFor(() => JSON.parse(localStorage.getItem('tripbuilder-demo-v2')).checkpoints.find((c) => c.title === 'Ekstrapost').status === 'active', [])
      // en ventende innsending som arrangøren kan godkjenne mens den neste behandles
      const other = (await p.db()).checkpoints.find((c) => !c.requires_location && c.id !== post.id && c.title !== 'Ekstrapost')
      await participantAt('/kart')
      assert.match(await postCard(p, other.title), /Send bilde/)
      await sendProof(p, other.title, 'Godkjennes underveis')
      await closeReceipt(p)
      await startSlowSubmission('Sendes mens en annen godkjennes')
      await openAdmin(o, 'Innsendinger')
      await decide(o, 'Godkjennes underveis', 'Godkjenn')
      await waitForStatus(o, 'Godkjennes underveis', 'approved')
      await release()
      await closeReceipt(p)
      await waitForStatus(p, 'Godkjennes underveis', 'approved')
      await waitForStatus(p, 'Sendes mens en annen godkjennes', 'pending')
    })
  })

  step('ingen konsollfeil og ingen uventede forespørsler ut', () => {
    assert.deepEqual(session.errors, [])
    assert.deepEqual(session.unexpectedHosts(), [])
  })
})
