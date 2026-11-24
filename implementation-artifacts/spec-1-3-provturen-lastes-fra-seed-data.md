---
title: 'Story 1.3: Prøveturen lastes fra seed-data'
type: 'feature'
created: '2026-11-24'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Demo-turen er skrevet inn i kode (`src/data/demo.js`), har navn på virkelige personer, og valideres ikke. Sensor har ingen garanti for at prøveturen er gyldig, og kan ikke nullstille den fra banneret.

**Approach:** Legg prøveturen i `src/seed/demo-trip.json` som en `TripDraft` med fiktive deltakere. En test validerer den med `validateTrip()`. Demo-modus legger seed-turen i localStorage ved første oppstart, og «Tilbakestill demo» i demo-banneret laster den på nytt.

## Boundaries & Constraints

**Always:** Seed-turen har minst to dager med programposter, både geolåste (`requires_location: true`) og åpne poster, og ett lag per brukt fargetoken (`team-1` til `team-6`, ingen token brukt to ganger). Alle id-er er faste UUID-er. Deltakerne har fiktive navn. Demo-lagring ligger i en ren modul med injisert lagring (`src/lib/demoStore.js`, uten avhengigheter) som `api.js` re-eksporterer, slik at den kan testes i `node:test`. Lagret demo-data forkastes når seed-versjonen ikke stemmer. `.env`-fri oppstart er uendret.

**Never:** Ikke endre `validateTrip`, databaseskjemaet eller migrasjoner (lagfarge som kolonne kommer i Epic 4). Ikke rollevalg (Story 1.4) eller navigasjon (Story 1.5). Ikke bruk virkelige personnavn.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Første oppstart | Tom localStorage | Seed-turen lagres og lastes | N/A |
| Senere oppstart | Gyldig lagret demo-data med riktig seed-versjon | Lagret data brukes (endringer bevares) | N/A |
| Gammel eller ødelagt lagring | Annen seed-versjon, ugyldig JSON eller feil form | Seed-turen lastes på nytt og overskriver | Ingen krasj |
| Tilbakestill demo | Trykk i banneret | Lagret data og innlogget demo-bruker slettes, seed-turen lastes, bruker havner på startsiden | N/A |
| Lagring utilgjengelig | `localStorage` kaster | Seed-turen brukes i minnet | Ingen krasj |
| Seed-test | `demo-trip.json` | `validateTrip` gir `{ ok: true }`, minst to dager, åpne og geolåste poster, unike fargetokens | N/A |

</frozen-after-approval>

## Code Map

- `src/data/demo.js` -- `initialDemoData()` bygger appens data (`trip`, `teams`, `members`, `program`, `checkpoints`, `submissions`, `photos`) fra hardkodede lister med virkelige navn. Skal bygge fra seed-JSON. `App.jsx`, `TripContext.jsx` og `tests/trip-paths.test.js` bruker den.
- `src/context/TripContext.jsx` -- `savedDemo()` (rundt linje 12), nøklene `DEMO_DATA_KEY` og `DEMO_USER_KEY`, `resetDemo()` (rundt linje 214, krever i dag arrangør). Flytt lagringslogikken til `demoStore.js`.
- `src/components/DemoBanner.jsx` -- skal få knappen «Tilbakestill demo». Brukes i Shell, Welcome og NotFound, alle under `TripProvider`.
- `src/pages/Admin.jsx` -- har en «Nullstill demo»-rad som kaller `resetDemo`. Beholdes.
- `src/lib/validate.js` -- `validateTrip`. Rør ikke.
- Mønster: rene moduler med `node:test`, som `tests/validate.test.js`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/seed/demo-trip.json` -- `TripDraft` med fiktive data, fargetokens på lagene, `seed_version` -- FR11
- [ ] `src/data/demo.js` -- bygg appens data fra seed (lag, medlemmer, program, poster) -- erstatter hardkodede lister
- [ ] `src/lib/demoStore.js` -- `loadDemo(storage)`, `saveDemo(storage, data)`, `resetDemo(storage)` med versjonssjekk -- I/O-matrisen
- [ ] `src/lib/api.js`, `src/context/TripContext.jsx` -- bruk demoStore, `resetDemo` for alle og logg ut demo-bruker -- AD-4
- [ ] `src/components/DemoBanner.jsx`, `src/styles.css` -- knappen «Tilbakestill demo» -- AC
- [ ] `tests/seed.test.js`, `tests/demoStore.test.js` -- seed og lagringsrader fra matrisen -- AC, NFR2, NFR3
- [ ] `README.md`, `docs/app-oppsett.md` -- ny slug `provetur` i omtalen av demo-turen -- ryddighet

**Acceptance Criteria:**
- Gitt `npm test`, når testsuiten kjører, så validerer seed-turen uten feil og har minst to dager, ett lag per brukt fargetoken, og både geolåste og åpne poster.
- Gitt demo-modus ved første oppstart, når appen lastes, så ligger seed-turen i localStorage.
- Gitt demo-banneret, når «Tilbakestill demo» trykkes, så lastes seed-turen på nytt.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil
- `grep -rniE "knoll|kevin|stian|elias|eskil|kenneth|håvar|eirik|jørgen|pinna" src` -- expected: ingen treff

**Manual checks (if no CLI):**
- Åpne `/t/provetur`, velg deltaker, endre noe, trykk «Tilbakestill demo»: startsiden vises og endringen er borte.
