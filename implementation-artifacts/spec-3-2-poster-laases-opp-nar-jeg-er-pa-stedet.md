---
title: 'Story 3.2: Poster låses opp når jeg er på stedet'
type: 'feature'
created: '2026-11-25'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Geolåste poster er låst for alltid, siden appen ikke vet hvor deltakeren er. Rebusen kan ikke spilles, og deltakeren får ikke vite hvor langt det er til posten.

**Approach:** Følg deltakerens posisjon mens Kart er åpen. En geolåst post er opplåst når avstanden er mindre enn eller lik postens `radius_m`, ellers står det «Du er X m unna. Gå nærmere for å låse opp.» Nektet posisjon gir en forklaring og «Prøv igjen». Posisjonen sendes eller lagres aldri.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) En post er opplåst bare så lenge deltakeren er innenfor radius (ingen varig opplåsing). (2) Mangler `radius_m` på en geolåst post, brukes 50 m. (3) Avstand uten margin for GPS-usikkerhet, så opplåsingen er deterministisk. (4) Ren logikk (`unlockStatus`) i `geo.js` eller `core.js`, og `checkpointStatus` får posisjonen som valgfritt fjerde argument og gir tilstanden `open`, `unlocked` eller `locked`, avstand og en hjelpetekst. (5) Sporingen (`watchPosition`) kjører bare mens Kart er montert og fanen er synlig, og stoppes når deltakeren forlater siden eller fanen skjules. (6) Posisjon holdes bare i minnet (React-tilstand): ingen `fetch`, ingen lagring, ingen logging. Dette sikres med en test som leser kilden. (7) Kilden er en egen hook med samme form som en senere simulator (Story 3.3) kan erstatte. (8) Markører får tilstanden opplåst (🔓) i tillegg til låst og åpen, og egen posisjon vises på kartet. Hjelpetekst og status bruker ikon og tekst, aldri bare farge.

**Never:** Ingen simulator (Story 3.3), ingen innsending eller godkjenning (3.4 og 3.5), ingen serververifisering. Ikke endre `validate.js`, seed eller migrasjoner. Ikke lagre eller sende posisjon.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Innenfor radius | Avstand 30 m, radius 60 m | Posten er opplåst, «Løs oppgaven» er aktiv | N/A |
| Nøyaktig på radius | Avstand lik radius | Opplåst | N/A |
| Like utenfor | Avstand 60,3 m, radius 60 m | Låst, «Du er 61 m unna. Gå nærmere for å låse opp.» | N/A |
| Langt unna | 120 m | «Du er 120 m unna. Gå nærmere for å låse opp.» | N/A |
| Åpen post | `requires_location = false` | Alltid åpen, uavhengig av posisjon | N/A |
| Ingen posisjon ennå | Venter på første posisjon | Geolåste poster er låst, teksten «Venter på posisjon …» | N/A |
| Posisjon nektet | Tillatelse nektet | Forklaring og «Prøv igjen», geolåste poster låst, åpne poster virker | Ingen krasj |
| Posisjon utilgjengelig | Enheten har ingen posisjon eller tidsavbrudd | Forklaring og «Prøv igjen» | Ingen krasj |
| Manglende radius | Geolåst post uten `radius_m` | 50 m | N/A |
| Ugyldig posisjon | `null`, NaN eller utenfor gyldige grader | Behandles som ingen posisjon | Ingen krasj |
| Forlater Kart | Navigerer til en annen fane | Sporingen stoppes | N/A |
| Fanen skjules | Dokumentet er skjult | Sporingen stoppes og starter igjen når fanen vises | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/geo.js` -- `distanceMeters`. Legg `unlockStatus(checkpoint, position)` og `DEFAULT_RADIUS_M` her (ren, ingen import utover seg selv).
- `src/lib/core.js` -- `checkpointStatus(checkpoint, submissions, teamId)`, `LOCKED_HINT`, `activeCheckpoints`. Gi `checkpointStatus` et valgfritt fjerde argument `position`.
- `src/components/PostMap.jsx` -- markører (`markerIcon`), postkort, `LOCKED_HINT`. Skal få opplåst tilstand, hjelpetekst med avstand, egen posisjon.
- `src/pages/Rebus.jsx` -- Kart-siden, bruker `PostMap` og `checkpointStatus` i kortgriden. Skal bruke posisjonen og vise forklaring ved nektet.
- Ny: `src/hooks/usePosition.js` -- geolokasjonskilde (`idle`, `waiting`, `ok`, `denied`, `unavailable`, `retry`).
- Nye tester: `tests/unlock.test.js`.
- `src/styles.css` -- `.post-marker` og `.post-card`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/geo.js` -- `unlockStatus`, `DEFAULT_RADIUS_M`, `formatDistanceHint` -- ren logikk
- [ ] `src/lib/core.js` -- `checkpointStatus(..., position)` med `unlocked`, `distance`, `hint` -- AD-6
- [ ] `src/hooks/usePosition.js` -- sporing mens Kart er åpen og synlig, stopper ved avmontering -- NFR10
- [ ] `src/pages/Rebus.jsx`, `src/components/PostMap.jsx`, `src/styles.css` -- opplåst tilstand, avstandstekst, egen posisjon, forklaring og «Prøv igjen» -- UX
- [ ] `tests/unlock.test.js` -- matriseradene som kan testes rent, og at hooken ikke sender eller lagrer posisjon -- NFR4, NFR10

**Acceptance Criteria:**
- Gitt en geolåst post og min posisjon, når avstanden er mindre enn eller lik `radius_m`, så er posten opplåst og «Løs oppgaven» er aktiv, og utenfor radius står «Du er X m unna. Gå nærmere for å låse opp.»
- Gitt at jeg har nektet posisjon, når jeg åpner Kart, så vises en forklaring og «Prøv igjen», geolåste poster er låst og åpne poster virker.
- Gitt Kart, når jeg forlater fanen, så stopper sporingen, og posisjonen blir aldri sendt eller lagret.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome med geolokasjon satt ved og utenfor en post, og med nektet tillatelse.
