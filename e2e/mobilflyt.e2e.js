// Mobilflyten fra definisjonen av ferdig i AGENTS.md: Hjem, program, rebus, innsending, godkjenning, ledertavle og galleri.
// Stegene bygger på hverandre, så etter en feil vil de neste ofte feile også.
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { startSession, stepWith } from './harness.js'
import { closeReceipt, decide, leaderboard, postCard, sendProof, waitForPostCard, waitForStatus } from './actions.js'

describe('mobilflyten i demo (390 px)', () => {
  let session
  let participant
  let organizer
  let trip
  let me
  let team
  let first // geolåst post
  let second
  let boardAfterApproval
  const step = stepWith(it, () => session)
  const nav = (page, label) => page.tap('.bottom-nav a', label)

  before(async () => {
    session = await startSession()
    participant = session.pages[0]
    await session.enterAs(participant, 'participant')
    trip = await participant.db()
    const userId = await participant.run(() => sessionStorage.getItem('tripbuilder-user-v2'))
    me = trip.members.find((m) => m.user_id === userId)
    team = trip.teams.find((t) => t.id === me.team_id)
    const free = trip.checkpoints.filter((c) => c.status !== 'deactivated' && !trip.submissions.some((s) => s.team_id === team.id && s.checkpoint_id === c.id && s.status !== 'rejected'))
    first = free.find((c) => c.requires_location)
    second = free.find((c) => c.id !== first.id)
  })
  after(() => session?.close())

  /** Flytter den simulerte posisjonen til posten når den er geolåst. */
  async function unlock(post) {
    if (!post.requires_location) return
    const number = [...trip.checkpoints].sort((a, b) => a.position - b.position).findIndex((c) => c.id === post.id) + 1
    await waitForPostCard(participant, post.title, 'Låst')
    await participant.tap('.position-simulator button', `Gå til post ${number}`)
    await waitForPostCard(participant, post.title, 'Send bilde')
  }

  step('Hjem viser hilsen, beskjed, lag og dagens program', async () => {
    const text = (await participant.text()).toLocaleUpperCase('nb')
    for (const expected of [me.display_name, trip.trip.announcement, team.name]) assert.ok(text.includes(expected.toLocaleUpperCase('nb')), `mangler «${expected}»`)
    const today = await participant.run(() => new Date().toLocaleDateString('sv-SE'))
    const expected = trip.program.filter((item) => item.event_date === today).length
    assert.ok(expected > 0, 'prøveturen skal ha program i dag')
    assert.equal(await participant.count('.program-card'), expected)
  })

  step('Program viser alle punktene, dag for dag', async () => {
    await participant.tap('a.text-link', 'Hele programmet')
    await participant.waitForPath('/t/provetur/program')
    const days = await participant.count('.day-tabs button')
    const missing = new Set(trip.program.map((item) => item.title))
    let shown = 0
    for (let i = 0; i < days; i += 1) {
      await participant.tap(`.day-tabs button:nth-of-type(${i + 1})`)
      const text = await participant.text()
      shown += await participant.count('.timeline-item')
      for (const title of missing) if (text.includes(title)) missing.delete(title)
    }
    assert.deepEqual([...missing], [])
    assert.equal(shown, trip.program.length)
  })

  step('en geolåst post låses opp på stedet og kan sendes inn', async () => {
    await nav(participant, 'Kart')
    await unlock(first)
    await participant.tap('.checkpoint-bottom button', 'Send bilde', { within: '.checkpoint-card', withinText: first.title })
    assert.equal(await participant.run(() => document.querySelector('.modal button.primary.full').disabled), true, 'kan ikke sendes uten bilde')
    await participant.tap('.modal button', '×')
    await sendProof(participant, first.title, 'Vi klarte det!')
    await closeReceipt(participant)
    await waitForPostCard(participant, first.title, 'Venter')
  })

  step('arrangøren ser bildet i køen og godkjenner', async () => {
    organizer = await session.newPage()
    await session.enterAs(organizer, 'organizer')
    await organizer.goto('/t/provetur')
    await organizer.tap('a', 'Åpne køen')
    await organizer.waitFor(() => [...document.querySelectorAll('.submission-card img')].some((img) => img.naturalWidth > 0), [], { message: 'bildebeviset' })
    await decide(organizer, 'Vi klarte det!', 'Godkjenn')
    await organizer.waitForText('Angre')
    await waitForStatus(organizer, 'Vi klarte det!', 'approved')
  })

  step('deltakeren ser godkjenningen og poengene uten å laste på nytt', async () => {
    await participant.front()
    await waitForPostCard(participant, first.title, 'Godkjent')
    await nav(participant, 'Ledertavle')
    await participant.waitFor((name, points) => [...document.querySelectorAll('.leader-row')].some((r) => r.innerText.includes(name) && r.querySelector('.score').innerText.startsWith(String(points))), [team.name, first.points], { message: 'lagets poeng' })
    boardAfterApproval = await leaderboard(participant)
  })

  step('en avvisning vises med begrunnelse og gir ingen poeng', async () => {
    await nav(participant, 'Kart')
    await unlock(second)
    await sendProof(participant, second.title, 'Andre forsøk')
    await closeReceipt(participant)
    await organizer.front()
    await decide(organizer, 'Andre forsøk', 'Avvis', 'Bildet er uskarpt')
    await waitForStatus(organizer, 'Andre forsøk', 'rejected')
    await participant.front()
    await waitForPostCard(participant, second.title, 'Bildet er uskarpt')
    assert.match(await postCard(participant, second.title), /Send bilde/)
    await nav(participant, 'Ledertavle')
    await participant.waitFor(() => document.querySelector('.leader-row'), [])
    assert.deepEqual(await leaderboard(participant), boardAfterApproval)
  })

  step('laget kan sende inn på nytt etter avvisningen', async () => {
    await nav(participant, 'Kart')
    // etter en avvisning kan laget sende på nytt uten å låse opp igjen, siden de alt har vært på stedet
    await waitForPostCard(participant, second.title, 'Send bilde')
    await sendProof(participant, second.title, 'Tredje forsøk')
    await closeReceipt(participant)
    await waitForPostCard(participant, second.title, 'Venter')
  })

  step('et bilde i galleriet vises for deltaker og arrangør', async () => {
    await nav(participant, 'I dag')
    await participant.tap('a', 'Se bildene')
    await participant.waitForPath('/t/provetur/bilder')
    const before = await participant.count('.photo-card')
    await participant.attachImage('.upload-button input', 0, 'minne')
    await participant.waitFor((n) => document.querySelectorAll('.photo-card').length === n && document.querySelector('.photo-card img')?.naturalWidth > 0, [before + 1])
    await participant.tap('.photo-card', me.display_name)
    await participant.waitFor(() => document.querySelector('.photo-modal img')?.naturalWidth > 0, [], { message: 'stort bilde' })
    await participant.tap('.photo-modal button.modal-close')
    await organizer.front()
    await organizer.goto('/t/provetur/bilder')
    await organizer.waitFor((n) => document.querySelectorAll('.photo-card').length === n, [before + 1])
  })

  step('rolle, status og bilder står etter ny lasting', async () => {
    await participant.front()
    await participant.goto('/t/provetur/kart')
    await waitForPostCard(participant, first.title, 'Godkjent')
    await participant.goto('/t/provetur/bilder')
    await participant.waitFor(() => document.querySelector('.photo-card img'), [])
  })

  step('ingen konsollfeil og ingen uventede forespørsler ut', () => {
    assert.deepEqual(session.errors, [])
    assert.deepEqual(session.unexpectedHosts(), [])
  })
})
