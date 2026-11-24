---
title: 'Story 1.3: Prøveturen lastes fra seed-data'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: 'f41d82fb230ed0144ecdb04241853e6ff56b2c4c'
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
- [x] `src/seed/demo-trip.json` -- `TripDraft` med fiktive data, fargetokens på lagene, `seed_version` -- FR11
- [x] `src/data/demo.js` -- bygg appens data fra seed (lag, medlemmer, program, poster) -- erstatter hardkodede lister
- [x] `src/lib/demoStore.js` -- `loadDemo(storage)`, `saveDemo(storage, data)`, `resetDemo(storage)` med versjonssjekk -- I/O-matrisen
- [x] `src/lib/api.js`, `src/context/TripContext.jsx` -- bruk demoStore, `resetDemo` for alle og logg ut demo-bruker -- AD-4
- [x] `src/components/DemoBanner.jsx`, `src/styles.css` -- knappen «Tilbakestill demo» -- AC
- [x] `tests/seed.test.js`, `tests/demoStore.test.js` -- seed og lagringsrader fra matrisen -- AC, NFR2, NFR3
- [x] `README.md`, `docs/app-oppsett.md` -- ny slug `provetur` i omtalen av demo-turen -- ryddighet

**Acceptance Criteria:**
- Gitt `npm test`, når testsuiten kjører, så validerer seed-turen uten feil og har minst to dager, ett lag per brukt fargetoken, og både geolåste og åpne poster.
- Gitt demo-modus ved første oppstart, når appen lastes, så ligger seed-turen i localStorage.
- Gitt demo-banneret, når «Tilbakestill demo» trykkes, så lastes seed-turen på nytt.

## Implementation Notes

- Seed i `src/seed/demo-trip.json`: `TripDraft` (trip, program_items, checkpoints, teams) pluss `members` og `seed_version: 1`. Fire dager, 13 programposter, 6 poster (4 geolåste, 2 åpne), 4 lag med fargetoken `team-1`, `team-2`, `team-3` og `team-5`, 8 fiktive deltakere. Faste UUID-er (uuid5).
- Valgt uten å spørre: slug endret fra `blatur-2026` til `provetur`, navn «Prøvetur Budapest», datoer beholdt (24. til 27. april 2026, i fortiden). Virkelige personnavn fra malen er fjernet.
- `src/lib/demoStore.js` (ren, injisert lagring): `loadDemo`, `saveDemo`, `resetDemo`. Nøklene er byttet til `tripbuilder-demo-v2` og `tripbuilder-user-v2`, så gammel lagring (v1) ignoreres. `api.js` re-eksporterer.
- `data/demo.js` bygger appens data fra seed og eksporterer `seedDraft`. JSON importeres med `with { type: 'json' }` (virker i både Node og Vite).
- «Tilbakestill demo» ligger i demo-banneret og virker for alle, ikke bare arrangør. Den sletter demo-bruker, laster seed på nytt og sender brukeren til startsiden.
- Tester: 89 grønne etter review (26 nye): `seed.test.js`, `demoStore.test.js`, `demoStore.js` lagt til i purity-testen.
- Verifisert i headless Chrome: første oppstart lagrer seed, endring bevares etter reload, tilbakestill gir seed og logger ut, gammel v1-lagring ignoreres.
- Etter review: fast `trip.id` i seed, bekreftelse før nullstilling, opprydding av v1-nøkler og gammel demo-bruker, strengere `looksValid`, `structuredClone` av seed.
- Ikke gjort: `teams.color` finnes ikke i databasen (kommer i Epic 4). Datoene i seed ligger i fortiden, så «pågår nå» (Story 1.5) vises ikke for prøveturen.

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | Trip-id er `crypto.randomUUID()` ved hvert kall, i strid med «faste UUID-er» (alle tre) | medium | patch | Seed har nå fast `trip.id`. Fjerner også krasj i ikke-sikker kontekst. Test for determinisme og UUID. |
| 2 | Banneret nullstiller uten bekreftelse (alle tre) | medium | patch | `window.confirm` som i Admin. |
| 3 | Gammel v1-lagring blir liggende og tar plass (alle tre) | medium | patch | `loadDemo` fjerner gamle nøkler. Test. |
| 4 | Gammel demo-bruker blir stående når seed lastes på nytt (edge) | low | patch | Fjernes ved ny seed. Test. |
| 5 | `looksValid` er grunn (blind, edge) | medium | patch | Krever slug og at alle poster har `id`. Tester for tre skadde former. |
| 6 | Reset ignorerer at lagring feiler, gammel data kommer tilbake (edge) | low | patch | Fjerner gammel data hvis seed ikke kan lagres. Test. |
| 7 | `area` og `theme` deles som referanse med seed-modulen (edge) | low | patch | `structuredClone`. Test som muterer og laster på nytt. |
| 8 | Ingen `:focus-visible` på reset-knappen (blind) | low | patch | Lagt til. |
| 9 | Ingen arrangør i seed, så admin er utilgjengelig (blind) | false | reject | Arrangør er `demo-admin` i `TripContext` («Se som arrangør»), verifisert i Chrome (Admin-lenken vises). |
| 10 | `DemoBanner` kan stå utenfor provideren (blind) | false | reject | Alle tre bruksstedene (Shell, Welcome, NotFound) ligger under `TripProvider`. |
| 11 | Seed-versjon overskriver endringer uten varsel (blind) | low | reject | Slik I/O-matrisen sier. |
| 12 | Ingen test for `TripContext`/banner-kobling (verification-gap) | medium | defer | Repoet har ingen React-testoppsett. Verifisert manuelt i Chrome. |
| 13 | `theme` og poster innenfor område ikke testet i seed (blind) | false | reject | Poster innenfor område er del av `validateTrip` som seed-testen kjører. Tema-lister kommer i Story 2.6. |
| 14 | `team-4`/`team-6` ubrukt, seed-innhold endret, delt `isOrganizer`-endring i Admin (blind) | low | reject | Spec sier «ett lag per brukt token». Admin-reset som logger ut er ønsket (matrisen). |
| 15 | Test lister virkelige fornavn (blind) | low | reject | Navnene er i git-historikk fra malen. Testen er vernet mot at de kommer tilbake. |
| 16 | Import-attributter, `seedDraft` i bunt, ubrukt eksport, state-init skriver (blind) | low | reject | Virker i Node 26 og Vite 8 (verifisert). Ingen kjent skade. |
| 17 | `crypto.randomUUID()` brukes ellers i `TripContext` (ikke sikker kontekst over LAN) | medium | defer | Finnes fra før og krasjer bare ved opprettelse av poster/bilder over http på LAN-IP. |

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil
- `grep -rniE "knoll|kevin|stian|elias|eskil|kenneth|håvar|eirik|jørgen|pinna" src` -- expected: ingen treff

**Manual checks (if no CLI):**
- Åpne `/t/provetur`, velg deltaker, endre noe, trykk «Tilbakestill demo»: startsiden vises og endringen er borte.
