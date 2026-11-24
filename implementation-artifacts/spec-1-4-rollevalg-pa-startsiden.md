---
title: 'Story 1.4: Rollevalg på startsiden'
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
- [ ] `src/lib/core.js` -- `demoUserForRole(role, members)` og `roleHome(role, slug)` -- ren logikk
- [ ] `src/lib/demoStore.js` -- egen `userStorage` for bruker -- per fane
- [ ] `src/context/TripContext.jsx` -- demo-bruker i `sessionStorage`, `chooseRole(role)`, `switchRole()` -- AC
- [ ] `src/pages/Start.jsx`, `src/pages/MineTurer.jsx`, `src/App.jsx` -- start-flate og Mine turer i demo -- AC
- [ ] `src/components/DemoBanner.jsx`, `src/styles.css` -- «Bytt rolle» og 48 px-knapper -- AC, UX-DR2
- [ ] `tests/roles.test.js`, `tests/demoStore.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt Start-flaten i demo-modus, når jeg velger «Deltaker», så havner jeg på prøveturen uten innlogging.
- Gitt Start-flaten, når jeg velger «Arrangør», så havner jeg på Mine turer med prøveturen i lista, og rollen huskes i fanen til jeg bytter den i banneret.
- Gitt 360 px bredde, når Start vises, så er begge knappene minst 48 px høye.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome på 360 px: Start, valg av begge roller, reload, ny fane og «Bytt rolle».
