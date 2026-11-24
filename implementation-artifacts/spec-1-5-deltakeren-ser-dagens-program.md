---
title: 'Story 1.5: Deltakeren ser dagens program'
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

**Problem:** Deltakeren har fanene Hjem, Program, Rebus og Bilder i malen, ikke I dag, Kart, Ledertavle og Laget som planen sier. Dagens program viser ikke hva som pågår nå, innholdet er bredt på store skjermer, og programmet er borte når nettet forsvinner. Seed-turen ligger i fortiden, så «pågår nå» ville aldri vises i demoen.

**Approach:** Behold malens skall (bunnfaner på mobil, sidemeny på PC) med de fire fanene I dag, Kart, Ledertavle og Laget. I dag viser dagens programkort sortert på tid, med aktiviteten som pågår nå uthevet med venstrekant. Innholdet blir maks 480 px bredt og sentrert. Siste lastede tur mellomlagres, så programmet vises uten nett. Demoens datoer flyttes ved lasting, slik at i dag er dag 2.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-24): (1) Faner: I dag (`/t/:slug`), Kart (`/kart`), Ledertavle (`/ledertavle`) og Laget (`/laget`). Ledertavle og «Mitt lag» flyttes ut av Rebus-siden, og Kart er dagens Rebus-side (kart, poster og innsending) til Story 1.6 finpusser den. Program (`/program`) og Bilder (`/bilder`) nås med lenker fra I dag, og `/rebus` sender til `/kart`. Arrangøren beholder Admin. (2) Demoens datoer flyttes ved opprettelse av demo-data slik at i dag er dag 2 av turen. Seed-filen og seed-testene er uendret. «Pågår nå» regnes slik: en aktivitet pågår fra starttid til neste aktivitets starttid, og den siste i dagen i 60 minutter. Bare for dagens faktiske dato. Rene funksjoner i `core.js` (`currentEventId`, `shiftDate`). Innhold på deltakersider er maks 480 px bredt og sentrert fra 481 px og oppover, men Admin er bred. Mellomlagring: siste vellykkede `loadTrip` lagres (uten innsendinger og bilder) i localStorage per tur og bruker, og brukes når henting feiler, med en tydelig melding. Rent hjelpemodul med injisert lagring (`src/lib/tripCache.js`).

**Never:** Ikke Kart-markører i tre tilstander, postkort eller liste (Story 1.6). Ikke endre `validate.js`, seed-JSON eller migrasjoner. Ingen service worker, så selve appen lastes ikke uten nett (bare data fra siste lasting vises). Ikke endre Admin.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tur pågår | Dagens dato er innen turens periode | Kort for dagens dato, sortert på tid | N/A |
| Tur ikke startet | Dagens dato før start | Kort for første dag | N/A |
| Tur ferdig | Dagens dato etter slutt | Kort for siste dag, ingen uthevet | N/A |
| Pågår nå | Klokka mellom to aktiviteters starttid på dagens dato | Aktiviteten som har startet sist, uthevet med venstrekant og «Pågår nå» | N/A |
| Før første og etter siste | Før første start, eller over 60 min etter siste | Ingen uthevet | N/A |
| Dag uten poster | Dag uten programposter | Tom-melding | Ingen krasj |
| Nettet forsvinner | Hentingen feiler, og mellomlager finnes | Programmet vises fra mellomlager med melding om at det er lagret | N/A |
| Ingen mellomlager | Hentingen feiler, ingen lagret tur | Feilmelding som i dag | Ingen krasj |
| Mellomlager utilgjengelig | `localStorage` kaster | Ingen krasj, ingen mellomlager | N/A |
| Navigasjon | Trykk på fane | Fanen åpnes og er markert som aktiv | N/A |
| Bred skjerm | 1280 px bredde | Innholdet er 480 px og sentrert, Admin er bred | N/A |
| Demo-datoer | Demo lastes en gitt dag | Turen er i gang, i dag er dag 2 | N/A |

</frozen-after-approval>

## Code Map

- `src/components/Shell.jsx` -- `links` (Hjem, Program, Rebus, Bilder), sidemeny og bunnfaner (`Navigation`), `page-content`. Endre fanene og bredden.
- `src/App.jsx` -- ruter under `/t/:slug`. Legg til `/kart`, `/ledertavle`, `/laget`, og `/rebus` som omdirigering.
- `src/pages/Home.jsx` -- hero, statistikk, dagens plan (maks 5 poster) med `timeline`. Skal bli I dag med alle dagens programkort og uthevet pågår nå.
- `src/pages/Rebus.jsx` -- leaderboard-seksjon og «Mitt lag»-seksjon øverst (rundt linje 43–48), kart, poster og innsendingsmodal. Flytt de to øverste seksjonene.
- `src/pages/Program.jsx`, `Gallery.jsx` -- beholdes, nås via lenker.
- `src/context/TripContext.jsx` -- `refresh()`, `loadTrip(userId, slug)`. Legg mellomlager inn her.
- `src/data/demo.js` -- `initialDemoData()` bygger demo-data. Flytt datoer her.
- `src/lib/core.js` -- `currentTripDay`, `sortEvents`, `formatDate`. Nye rene funksjoner.
- `src/styles.css` -- `.timeline`, `.page-content`, `.bottom-nav`.
- Nye: `src/pages/Leaderboard.jsx`, `src/pages/Team.jsx`, `src/lib/tripCache.js`, tester.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/core.js` -- `currentEventId(events, now)`, `shiftDate(date, days)`, `daysBetween(a, b)` -- ren logikk
- [ ] `src/data/demo.js` -- flytt datoer slik at i dag er dag 2 (`initialDemoData(now)`) -- beslutning 2
- [ ] `src/lib/tripCache.js` -- `saveTripCache`, `loadTripCache` med injisert lagring -- UX-DR19
- [ ] `src/context/TripContext.jsx` -- mellomlager ved henting, `offline`-flagg -- UX-DR19
- [ ] `src/pages/Home.jsx`, `src/styles.css` -- programkort med venstrekant og «Pågår nå» -- UX-DR3
- [ ] `src/pages/Leaderboard.jsx`, `src/pages/Team.jsx`, `src/pages/Rebus.jsx`, `src/App.jsx`, `src/components/Shell.jsx` -- fire faner, ruter, 480 px -- UX-DR9, UX-DR18
- [ ] `tests/today.test.js`, `tests/tripCache.test.js`, `tests/seed.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt at jeg er deltaker, når I dag åpnes, så ser jeg dagens programkort sortert på tid, og aktiviteten som pågår nå er uthevet med venstrekant.
- Gitt deltakervisningen, når den vises, så kan jeg navigere mellom I dag, Kart, Ledertavle og Laget, og den aktive er markert. Innholdet er maks 480 px bredt og sentrert.
- Gitt at programmet er lastet én gang, når hentingen feiler, så vises programmet fra mellomlageret.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome 390 px og 1280 px: fanene, uthevet aktivitet, innholdsbredde, Admin bred for arrangør.
