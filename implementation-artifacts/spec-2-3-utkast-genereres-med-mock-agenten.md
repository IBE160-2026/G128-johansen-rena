---
title: 'Story 2.3: Utkast genereres med mock-agenten'
type: 'feature'
created: '2026-11-26'
status: 'done'
baseline_commit: '1c903859b6b5d82cfa2c12264ae2745a4d52ff87'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** «Lag utkast» på Ny tur lager ingen tur. Etter et gyldig skjema står bare «Beskrivelsen er klar» (en midlertidig tilstand fra 2.2), og det finnes ingen mock-agent, ingen `TripDraft` bygget fra en `TripRequest`, ingen fremdriftsvisning og ingen plass der utkastet kan åpnes.

**Approach:** En ren `mockAgent.js` bygger en gyldig `TripDraft` fra seed-turen, tilpasset periode, antall lag og antall poster i `TripRequest`. `api.generateTrip(req)` kjører den med fremdriftssteg plan → innhold → kontroll, kan avbrytes, og kan settes til å feile. `validateTrip(draft, req)` sjekker i tillegg at utkastet stemmer med forespørselen (AD-15). Utkastet lagres lokalt og åpnes på en enkel Utkast-side. Genererer-visningen sier at KI-en er simulert.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-26): (1) `validateTrip(draft, req?)` i `validate.js` får en valgfri `req`. Er `req` en gyldig `TripRequest`, kontrolleres at utkastets `trip.start_date` og `trip.end_date` er lik forespørselens, at antall lag er lik `team_count` (når oppgitt), og at antall aktive poster er lik `post_count` (når oppgitt). Uten `req` er oppførselen uendret. (2) Ren `src/lib/mockAgent.js` (importerer bare `validate.js` og andre rene filer): `buildMockDraft(req, seed)` gir en `TripDraft` `{ trip, program_items, checkpoints, teams }`. Perioden er forespørselens. Programmet fordeles på hver dag i perioden ved å gjenbruke seed-dagene i rekkefølge (og starte om når seed-dagene er brukt opp), slik at hver dag har minst én programpost. Postene er `post_count` (ellers seed-antallet) og lagene `team_count` (ellers seed-antallet); har seed færre enn ønsket, lages flere av seed-postene i rotasjon med nytt navn og små forskyvninger i posisjonen innenfor turens område, og nye lag får navn og emoji som er unike. Destinasjonen, området og temaet er alltid seedens. Alle id-er er nye og unike, `status` er `active`, `position` går fra 1 og opp, og `radius_m` og `requires_location` følger seed. Utkastet validerer med `validateTrip(draft, req)`. Samme `req` gir samme utkast (id-ene er stabile for samme input). (3) `api.generateTrip(req, { signal, onStep })` (demo): kontrollerer `req` med `validateTripRequest`, går gjennom stegene `plan`, `content` og `check` (ca. 500 ms hver, `onStep(steg)` kalles ved start), bygger utkastet med `buildMockDraft`, kontrollerer det med `validateTrip(draft, req)`, og gir `{ ok: true, draft }`. Feiler kontrollen, gis `{ ok: false, error: { code: 'VALIDATION_FAILED', issues } }`. Avbrytes `signal`, avslutter den med en `AbortError` uten å lagre noe. Testflagget `?mock=feil` på adressen til Ny tur får generering til å feile med `{ ok: false, error: { code: 'MOCK_FAILURE' } }`. (4) Utkast lagres lokalt via ren `src/lib/draftStore.js` med injisert lagring (nøkkel `tripbuilder-draft-v1`, innhold `{ request, draft, created_at }`): `saveDraft`, `loadDraft` og `clearDraft`. Ødelagt eller utilgjengelig lagring gir `null` uten krasj. (5) Ny tur: «Lag utkast» med gyldige felt starter generering. Siden viser Genererer med stegene plan → innhold → kontroll (det aktive steget er merket med tekst, ikke bare farge), og teksten «Demo: KI-en er simulert, og destinasjonen er alltid prøveturens». Knappen er låst mens genereringen pågår, så et nytt trykk starter ingen ny generering. Forlater arrangøren siden, avbrytes genereringen, og skjemaet med beskrivelsen er uendret lagret. Ved suksess lagres utkastet, skjema og ventende forespørsel fra 2.2 tømmes, og arrangøren sendes til `/utkast`. «Beskrivelsen er klar»-tilstanden fra 2.2 fjernes. (6) Ved feil vises feiltilstanden med en melding uten tekniske ord og valgene «Prøv igjen» (starter ny generering) og «Rediger beskrivelsen» (tilbake til skjemaet), og beskrivelsen beholdes. (7) Ny rute `/utkast` (bare arrangør, bare i demo) med `Utkast.jsx`: viser et lagret utkast skrivebeskyttet (turnavn, periode, antall deltakere, lag og poster, programmet per dag og postene med poeng). Finnes det ikke noe utkast, vises «Ingen utkast ennå.» med lenke til Ny tur. Redigering og publisering kommer i Story 2.5 og 2.7, og siden sier ikke noe om dem. (8) Mikrotekst er norsk uten tekniske ord. Trykkflater minst 48 px. Fremdriften og feilen meldes til skjermleser (`role="status"` og `role="alert"`).

**Never:** Ikke kall Claude eller en Edge Function (2.4). Ikke opprett turen i databasen eller i demodata, og ikke publiser (2.7). Ikke redigering av utkastet (2.5). Ikke endre `validateTrip`-reglene utover valgfri `req`. Ikke endre poengreglene eller migrasjonene.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig forespørsel | 3 dager, 12 deltakere | Utkast med 3 dager, minst én programpost per dag, seed-antall lag og poster | N/A |
| Lang periode | 10 dager | Seed-dagene gjenbrukes, hver dag har programposter | N/A |
| En dag | Fra lik Til | Ett dagsprogram | N/A |
| Lag og poster oppgitt | `team_count: 6`, `post_count: 10` | Nøyaktig 6 lag med unike navn og 10 aktive poster | N/A |
| Færre enn seed | `team_count: 2`, `post_count: 2` | 2 lag og 2 poster | N/A |
| Utkast mot forespørsel | `validateTrip(draft, req)` med feil periode, lagtall eller postantall | `ok: false` med feil ved periode, lag eller poster | Feilene vises ikke for brukeren i 2.3 |
| Uten `req` | `validateTrip(draft)` | Oppførsel som før | N/A |
| Ugyldig forespørsel | `req` som ikke validerer | `ok: false`, ingen generering | Feilmelding |
| Fremdrift | Generering pågår | Stegene plan, innhold og kontroll vises i rekkefølge, knappen er låst | N/A |
| Avbrutt | Forlater siden under generering | Avbrytes uten å lagre utkast, beskrivelsen er uendret | Ingen feilmelding |
| Testflagg | `?mock=feil` | Feiltilstand med «Prøv igjen» og «Rediger beskrivelsen», teksten beholdt | N/A |
| Suksess | Generering ferdig | Utkast lagret, skjema tømt, `/utkast` åpnes | N/A |
| Åpne utkast | Lagret utkast | Skrivebeskyttet oversikt | N/A |
| Ingen utkast | Tom lagring eller ødelagt JSON | «Ingen utkast ennå.» | N/A |

</frozen-after-approval>

## Code Map

- `src/seed/demo-trip.json`, `src/data/demo.js` (`seedDraft`) -- seed-turen som TripDraft: 4 dager, 4 lag, 6 poster, `trip.area`, `trip.theme`. Kilden for mock-agenten. Ikke endre.
- `src/lib/validate.js` -- `validateTrip` (linje ~59), `validateTripRequest` (fra 2.2), `MAX_TRIP_DAYS`. Legg valgfri `req`.
- `src/lib/mockAgent.js` -- NY, ren.
- `src/lib/draftStore.js` -- NY, ren, injisert lagring (mønster fra `tripCache.js` og `tripRequest.js`).
- `src/lib/api.js` -- datagrensen (AD-4). Legg `generateTrip(req, opts)` (demo). Live kommer i 2.4.
- `src/pages/NyTur.jsx` -- fra 2.2: skjema, «Beskrivelsen er klar»-tilstand, `startOver`. Legg generering, Genererer-visning, feiltilstand og avbryt ved forlating.
- `src/pages/Utkast.jsx` -- NY. `src/App.jsx` -- ruten `/utkast` bak `DemoOnly`.
- `src/styles.css` -- skjemastiler fra 2.2 (`.new-trip-form`, `.request-summary`). Legg fremdriftssteg og utkastoversikt.
- `tests/mockAgent.test.js`, `tests/draftStore.test.js` -- NYE. `tests/purity.test.js` -- legg til `mockAgent.js` og `draftStore.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/validate.js` -- valgfri `req` i `validateTrip` (beslutning 1) -- med tester i `tests/validate.test.js`
- [x] `src/lib/mockAgent.js`, `tests/mockAgent.test.js` -- `buildMockDraft` og tester for perioder, lag, poster og gyldighet (beslutning 2)
- [x] `src/lib/draftStore.js`, `tests/draftStore.test.js`, `tests/purity.test.js` -- lagring av utkast og ren-liste (beslutning 4)
- [x] `src/lib/api.js` -- `generateTrip` med steg, avbryt og testflagg (beslutning 3)
- [x] `src/pages/NyTur.jsx`, `src/styles.css` -- generering, fremdrift, feiltilstand og avbryt (beslutning 5, 6, 8)
- [x] `src/pages/Utkast.jsx`, `src/App.jsx` -- skrivebeskyttet utkast (beslutning 7)

**Acceptance Criteria:**
- Gitt demo-modus og en gyldig beskrivelse, når jeg trykker «Lag utkast», så viser Genererer stegene plan → innhold → kontroll, mock-agenten lager en gyldig `TripDraft` tilpasset periode, antall lag og antall poster, den lagres som utkast og åpnes, og siden sier at KI-en er simulert og at destinasjonen alltid er prøveturens.
- Gitt at genereringen pågår, når jeg trykker «Lag utkast» igjen eller forlater siden, så er knappen låst, og forlater jeg siden, avbrytes genereringen uten at beskrivelsen går tapt.
- Gitt at mocken er satt til å feile (`?mock=feil`), når genereringen kjøres, så vises feiltilstanden med «Prøv igjen» og «Rediger beskrivelsen», og teksten beholdes.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss manuell sjekk i headless Chrome (390 px). Patchet:
- high: genereringens orkestrering (feilkoder, avbryt, stegrekkefølge, testflagg) lå i `api.js` og kunne ikke testes under `node --test` — flyttet til ren `generate.js` med tester.
- medium: et lagringsproblem etter vellykket generering ble vist som «Noe gikk galt, prøv igjen», og et nytt forsøk feiler på samme måte — patchet (egen melding og ingen «Prøv igjen»).
- medium: et ødelagt eller eldre lagret utkast kunne krasje `/utkast` — patchet (`loadDraft` validerer med `validateTrip`).
- medium: avbrutt generering kunne likevel gi et ok-svar rett før retur, og `abortRef` ble stående — patchet.
- medium: ingen måte å avbryte under generering — patchet (knappen «Avbryt», beskrivelsen er uendret).
- low: Utkast-siden sa ikke at KI-en er simulert — patchet.
- low: `0` kunne vises som antall deltakere, og feil ble svelget uten spor — patchet (`console.warn`).
- low: ubrukt lagring av den ventende forespørselen — fjernet.
- tester av `validateTrip(draft, req)` manglet i `validate.test.js` — lagt til.
Avvist som false: «seed-id-er kopieres inn» (seed-radene har ingen fremmednøkler), «periode uten grense» (`validateTripRequest` begrenser til 366 dager), «demo-seed i live-pakken» (seeden er allerede i pakken via demodata).
Avvist som low uten patch: tom seed, id-kollisjon mellom utkast med lik input, flere utkast overskriver hverandre, fokus ved faseskifte, `datetime` på tid.
Utsatt (deferred-work.md): ingen komponenttester av Ny tur og Utkast.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: fyll ut Ny tur og trykk «Lag utkast», se stegene, se at knappen er låst, og at `/utkast` åpnes med riktig periode, lag og poster. Forlat siden under genereringen og sjekk at beskrivelsen er der igjen. Åpne `/ny-tur?mock=feil` og se feiltilstanden med begge valg. Sjekk 390 px bredde.
