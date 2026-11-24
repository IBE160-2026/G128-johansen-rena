---
title: 'Story 1.4: Rollevalg på startsiden'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: '5286b0faa402b4df5b8a358976deafbb42257d9f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Rotadressen sender demo-modus rett til en trip-side med et skjema for å velge deltaker, og det finnes ingen startflate eller «Mine turer». Sensor kan ikke raskt velge å prøve appen som arrangør eller deltaker, og to faner kan ikke ha hver sin rolle.

**Approach:** Legg en Start-flate på `/` i demo-modus med to store knapper, «Deltaker» og «Arrangør». Deltaker havner på prøveturens første side uten innlogging. Arrangør havner på en enkel «Mine turer» med prøveturen i lista. Rollen lagres per fane (`sessionStorage`) og byttes via demo-banneret.

## Boundaries & Constraints

**Always:** Demo-brukeren lagres per fane i `sessionStorage`, mens turdata fortsatt ligger i `localStorage`, slik at to faner kan ha hver sin rolle mot samme data. «Deltaker» logger inn som første medlem i seed-turen (ingen valg, ingen passord). «Arrangør» bruker den eksisterende demo-arrangøren (`demo-admin`). Start-knappene er minst 48 px høye og fyller bredden på 360 px. Banneret får «Bytt rolle», som sletter rollen i fanen og sender til `/`. Rene hjelpere (rolle til bruker-id og målside) ligger i `src/lib/core.js` med tester. Live-modus beholder dagens tekstside på `/`.

**Never:** Ingen ekte innlogging, ingen «Ny tur», generator eller turliste fra database (Epic 2). Ikke endre navigasjonen i deltakerfanene (Story 1.5). Ikke endre `validate.js`, seed eller migrasjoner.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Velg Deltaker | Demo-modus, `/` | Innlogget som første medlem, adresse `/t/provetur` | N/A |
| Velg Arrangør | Demo-modus, `/` | Innlogget som `demo-admin`, adresse `/mine-turer` med prøveturen i lista | N/A |
| Åpne turen fra Mine turer | Trykk på prøveturen | `/t/provetur` som arrangør | N/A |
| Rolle huskes | Last siden på nytt i samme fane | Samme rolle, ingen ny valgside | N/A |
| Ny fane | Åpne appen i en annen fane | Ingen rolle, Start-flaten vises | N/A |
| Bytt rolle | Trykk i banneret | Rollen slettes i fanen, Start-flaten vises | N/A |
| Mine turer uten arrangørrolle | `/mine-turer` som deltaker eller uten rolle | Sendes til `/` | N/A |
| Lagring utilgjengelig | `sessionStorage` kaster | Rollen gjelder i minnet, ingen krasj | N/A |

</frozen-after-approval>

## Code Map

- `src/App.jsx` -- rutene. `/` sender i dag demo til `/t/<slug>`. `TripRoute` wrapper `TripProvider`. Start og Mine turer trenger provider i demo (banneret bruker `useTrip`).
- `src/context/TripContext.jsx` -- `demoUserId` (fra `localStorage`, nøkkel `DEMO_USER_KEY`), `demoLogin(id)`, `signOut`, `resetDemo`. Flytt bruker til `sessionStorage`.
- `src/lib/demoStore.js` -- `loadDemo` og `resetDemo` fjerner `DEMO_USER_KEY` fra `storage`. Skal ta en egen `userStorage`.
- `src/components/DemoBanner.jsx` -- har «Tilbakestill demo». Legg til «Bytt rolle».
- `src/pages/Welcome.jsx` -- har demo-valg av deltaker for direkte lenker. Beholdes.
- `src/lib/core.js` -- rene hjelpere (`tripPath` osv.). Legg `demoUserForRole` og `roleHome`.
- `src/styles.css` -- `.button`, `.button.primary`, `.button.outline`, `.center-screen`.
- Nye: `src/pages/Start.jsx`, `src/pages/MineTurer.jsx`, `tests/roles.test.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/core.js` -- `demoUserForRole(role, members)` og `roleHome(role, slug)` -- ren logikk
- [x] `src/lib/demoStore.js` -- egen `userStorage` for bruker -- per fane
- [x] `src/context/TripContext.jsx` -- demo-bruker i `sessionStorage`, `chooseRole(role)`, `switchRole()` -- AC
- [x] `src/pages/Start.jsx`, `src/pages/MineTurer.jsx`, `src/App.jsx` -- start-flate og Mine turer i demo -- AC
- [x] `src/components/DemoBanner.jsx`, `src/styles.css` -- «Bytt rolle» og 48 px-knapper -- AC, UX-DR2
- [x] `tests/roles.test.js`, `tests/demoStore.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt Start-flaten i demo-modus, når jeg velger «Deltaker», så havner jeg på prøveturen uten innlogging.
- Gitt Start-flaten, når jeg velger «Arrangør», så havner jeg på Mine turer med prøveturen i lista, og rollen huskes i fanen til jeg bytter den i banneret.
- Gitt 360 px bredde, når Start vises, så er begge knappene minst 48 px høye.

## Implementation Notes

- Start-flaten (`src/pages/Start.jsx`) og Mine turer (`src/pages/MineTurer.jsx`) er nye. I demo-modus får begge en `TripProvider` for prøveturen (`DemoOnly` i `App.jsx`), siden banneret bruker `useTrip()`. Utenfor demo vises dagens tekstside. Start sender en bruker som allerede har en rolle rett videre (`roleHome`).
- Rollen er demo-brukeren i `sessionStorage` (per fane). Turdata ligger fortsatt i `localStorage`, så to faner kan ha hver sin rolle mot samme data. `demoStore` tar en egen `userStorage`.
- Deltaker logges inn som første medlem i seed (Mari, laget Løvene). Arrangør er `demo-admin` (finnes ikke som medlem). Mine turer viser prøveturen med «Åpne» til `/t/provetur`.
- Banneret har nå «Bytt rolle» og «Tilbakestill demo». Begge sender brukeren til `/`.
- Rene hjelpere i `core.js`: `demoUserForRole`, `roleHome`, `DEMO_ORGANIZER_ID`. 103 tester grønne etter review (14 nye).
- Verifisert i headless Chrome på 360 px: knappene er 49 px høye og 328 px brede, begge roller, reload i samme fane, ny fane uten rolle, Bytt rolle, Mine turer uten arrangørrolle sendes til `/`, og fane A beholder sin rolle når fane B velger deltaker.
- Etter review: rollen har reserve-minne når sessionStorage mangler, `demoOwn` samler hvordan brukeren avgjøres, «Bytt rolle» vises bare med rolle, og Start bruker `replace` mot tilbake-sløyfe.
- Valgt uten å spørre: deltaker får ikke velge medlem fra Start (den gamle velgeren i `Welcome` finnes fortsatt for direkte lenker til turen). Mine turer er en enkel demo-liste og blir erstattet i Epic 2.

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | Uten sessionStorage mistes rollen ved navigasjon, siden hver route har egen provider (edge, claim) | medium | patch | Matrisen lover «gjelder i minnet». Nå reserve-minne i `demoStore` (`readDemoUser`, `writeDemoUser`, `clearDemoUser`) delt mellom providere i fanen, med test. |
| 2 | Per-fane-lagringen i `TripProvider` er ikke festet av tester (verification-gap) | medium | patch | Logikken ligger i de rene hjelperne over, testet med to lagringer, så et bytte til feil lagring ville feilet. |
| 3 | `'demo-admin'` hardkodet i `TripContext` og `Welcome` (verification-gap, blind) | medium | patch | `demoOwn` i `core.js` og `DEMO_ORGANIZER_ID` brukes begge steder. Test at rollevalget gir en bruker `demoOwn` kjenner igjen. |
| 4 | «Deltaker» gjør ingenting uten medlemmer (blind, edge) | low | patch | `chooseRole` setter feilmelding. |
| 5 | Gammel rolle som ikke passer dataene blir stående (edge) | low | patch | Effekt i `TripContext` glemmer en rolle uten treff. |
| 6 | Deltaker velges som første medlem selv om det er arrangør (edge) | low | patch | Velger første med rolle `participant`. Test. |
| 7 | Tilbake-knappen havner i omdirigeringssløyfe fra Start (edge) | low | patch | `navigate(..., { replace: true })` i Start. |
| 8 | «Bytt rolle» vises uten rolle (blind) | low | patch | Vises bare når `own` finnes (verifisert i Chrome). |
| 9 | `.start` hardkoder bannerhøyde (blind) | low | patch | `min-height:60vh`. |
| 10 | Routing og Start/Mine turer har ingen kjørende test (verification-gap, blind) | medium | defer | Ingen React-testoppsett. Verifisert i headless Chrome (rolle, reload, ny fane, bytt rolle, vakt på Mine turer). |
| 11 | Ulike providere kan ha foreldet data, for eksempel Mine turer etter endring i en annen fane (edge, verification-gap) | low | defer | Hører til sanntid/BroadcastChannel i demo-modus (AD-10, Epic 4). |
| 12 | Gammel `localStorage`-nøkkel for bruker blir liggende (blind, edge) | low | reject | Nøkkelen fantes bare i den ennå ikke merget Story 1.3-grenen. |
| 13 | `MineTurer` kan krasje uten `data.trip` (edge) | false | reject | Provideren bruker alltid seed-slug i demo, så turen finnes. |
| 14 | Ny fane via lenke kan arve sessionStorage (edge, claim) | low | reject | Gjelder bare `window.open` uten `noopener`. Appen åpner ingen slike faner. |
| 15 | Tekst, rollebeskrivelser, aria-live, CSS-formatering, `MineTurer` mangler utlogging (blind) | low | reject | Smak og Epic 2. Spec definerer Mine turer som enkel demo-liste. |
| 16 | Banneret krever provider og Router (blind) | false | reject | Alle bruksteder ligger under Router og `TripProvider`. |

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome på 360 px: Start, valg av begge roller, reload, ny fane og «Bytt rolle».
