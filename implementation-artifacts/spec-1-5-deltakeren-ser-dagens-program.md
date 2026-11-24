---
title: 'Story 1.5: Deltakeren ser dagens program'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: 'ade459c77dbc4757e546d431ca7d3c4089f5b82b'
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
- [x] `src/lib/core.js` -- `currentEventId(events, now)`, `shiftDate(date, days)`, `daysBetween(a, b)` -- ren logikk
- [x] `src/data/demo.js` -- flytt datoer slik at i dag er dag 2 (`initialDemoData(now)`) -- beslutning 2
- [x] `src/lib/tripCache.js` -- `saveTripCache`, `loadTripCache` med injisert lagring -- UX-DR19
- [x] `src/context/TripContext.jsx` -- mellomlager ved henting, `offline`-flagg -- UX-DR19
- [x] `src/pages/Home.jsx`, `src/styles.css` -- programkort med venstrekant og «Pågår nå» -- UX-DR3
- [x] `src/pages/Leaderboard.jsx`, `src/pages/Team.jsx`, `src/pages/Rebus.jsx`, `src/App.jsx`, `src/components/Shell.jsx` -- fire faner, ruter, 480 px -- UX-DR9, UX-DR18
- [x] `tests/today.test.js`, `tests/tripCache.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt at jeg er deltaker, når I dag åpnes, så ser jeg dagens programkort sortert på tid, og aktiviteten som pågår nå er uthevet med venstrekant.
- Gitt deltakervisningen, når den vises, så kan jeg navigere mellom I dag, Kart, Ledertavle og Laget, og den aktive er markert. Innholdet er maks 480 px bredt og sentrert.
- Gitt at programmet er lastet én gang, når hentingen feiler, så vises programmet fra mellomlageret.

## Implementation Notes

- Faner: I dag (`/t/:slug`), Kart (`/kart`, dagens Rebus-side uten ledertavle og lagseksjon), Ledertavle (`/ledertavle`) og Laget (`/laget`). Nye sider `Leaderboard.jsx` og `Team.jsx` er flyttet ut av Rebus. `/rebus` sender til `/kart`. Program og Bilder nås fra lenker på I dag. Bunnfaner på mobil og sidemeny på PC (malens mønster) er beholdt.
- I dag viser alle dagens programkort sortert på tid, øverst på siden. `currentEventId` utheves med venstrekant (4 px primary), «Pågår nå» og `aria-current`. Klokka oppdateres hvert 30. sekund.
- Demo-datoene flyttes i `initialDemoData(now)`, slik at i dag er dag 2 av 4. Seed-filen er uendret. Lagret demo flyttes på nytt ved hver lasting (`rebaseDemoDates`), så turen er i gang også dagen etter. Seed-versjon er 2.
- Innhold er maks 480 px og sentrert på deltakersider (`.page-content.narrow`), Admin er bred (1035 px ved 1280 px).
- Mellomlager: `tripCache.js` (ren, injisert lagring). `TripContext.refresh` lagrer siste vellykkede `loadTrip` og bruker det når henting feiler, med meldingen «Ingen dekning. Du ser det som sist ble lastet.». `online`-hendelsen henter på nytt. Dette er bare testet med enhetstester (Supabase-modus kan ikke kjøres uten live-instans). Selve appen lastes ikke uten nett (ingen service worker).
- 128 tester grønne etter review (31 nye): `today.test.js`, `tripCache.test.js`. Verifisert i headless Chrome på 390 px og 1280 px: fire faner med aktiv markert, fem kort for dagens dato (tirsdag 24. november), «Pågår nå» med 4 px kant, `/rebus` til `/kart`, innholdsbredde 480 px sentrert (278 px margin på hver side), Admin bred.

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | Alle feil, ikke bare tap av nett, bytter data med mellomlager og «Ingen dekning» (alle tre) | high | patch | `isNetworkError` skiller nettfeil fra tilgangs- og serverfeil. Andre feil vises som feil. Test. |
| 2 | En senere mislykket henting overskriver ferskere data i minnet med eldre mellomlager (edge, blind) | high | patch | Mellomlager brukes bare når ingenting er lastet (`dataRef`). Ellers beholdes dataene og meldingen vises. |
| 3 | Offline viser 0 poeng og ingen innsendinger som om det var sant (blind, edge) | medium | patch | Ledertavle og Laget viser «vises ikke uten nett». Bannerteksten sier det samme. Frosset tekst i spec («uten innsendinger») er beholdt. |
| 4 | Mellomlageret slettes ikke ved utlogging eller når brukeren ikke lenger er medlem (blind, edge) | medium | patch | `clearTripCache` i `signOut` og når `loadTrip` gir null. Test. |
| 5 | Ingen tidsstempel på lagret data (blind, claim) | low | patch | Banneret viser «kl. HH:MM». |
| 6 | Lagring som feiler lar en eldre tur stå som siste lasting (edge) | low | patch | Gammel nøkkel slettes ved feil. Test. |
| 7 | Mellomlager uten `own` kan krasje siden (edge) | low | patch | `loadTripCache` krever `own`. Test. |
| 8 | Lagret demo drifter og «i dag» havner utenfor turen (alle tre) | medium | patch | `rebaseDemoDates` kjøres ved hver lasting (idempotent). Seed-versjon 2. Tester inkludert dagen etter. |
| 9 | `currentEventId` med ugyldig starttid, lik starttid og aktivitet etter 23:00 (edge) | medium | patch | Filtrerer ugyldige tider, gir den siste ved lik starttid, kapper ved midnatt. Tester. |
| 10 | «Pågår nå» brukes selv om kortdatoen er klemt (edge) | low | patch | Bare når kortdatoen er dagens faktiske dato. |
| 11 | `wide` brekker med skråstrek etter `/admin` (edge, blind) | low | patch | Regex. |
| 12 | Hjem-lenken «Rebus og poeng» peker på `/rebus` (blind, edge) | low | patch | «Ledertavle og poeng» til `/ledertavle`. |
| 13 | Parallelle hentinger kan overskrive nyere svar (edge) | medium | patch | Forespørselsteller, bare siste svar teller. |
| 14 | Klokka oppdateres ikke når fanen våkner (blind) | low | patch | `visibilitychange`. |
| 15 | Tom ledertavle uten melding (blind) | low | patch | «Ingen lag ennå.» |
| 16 | Spec-oppgaven nevner `seed.test.js` som ikke er endret (edge, claim) | low | patch | Fjernet fra oppgavelisten. |
| 17 | «Pågår nå» er for generøst ved lange mellomrom (blind) | low | reject | Slik spec definerer det (til neste starter). Ingen sluttid i dataene. |
| 18 | Program og Bilder mangler i fanene (blind, edge) | low | reject | Valgt av Kevin (fire faner, lenker fra I dag). Admin finnes i sidemeny og topplinje, og er uendret. |
| 19 | Hero «Turprogram» dobler I dag-seksjonen, `slice(0,5)` fjernet, aria-live leser alle rader, lagpoeng borte fra Kart (blind) | low | reject | Smak eller bevisst: alle kort skal vises, og aria-live kreves (UX-DR17). |
| 20 | Tokens `--on-primary`, `--surface-muted`, `--radius-md` udefinert (blind) | false | reject | Definert i `:root` (Story 1.1). |
| 21 | `initialDemoData` krasjer uten `event_date` (edge) | low | reject | Seed er fast og validert. |
| 22 | Offline-koblingen, rutene og Home-visningen har ingen kjørende test (verification-gap) | medium | defer | Ingen React-testoppsett. Avgjørelsene er flyttet til rene, testede funksjoner. Verifisert i Chrome (ruter, faner, «Pågår nå», bredder). |

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome 390 px og 1280 px: fanene, uthevet aktivitet, innholdsbredde, Admin bred for arrangør.
