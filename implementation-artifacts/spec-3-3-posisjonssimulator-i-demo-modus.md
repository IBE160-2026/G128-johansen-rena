---
title: 'Story 3.3: Posisjonssimulator i demo-modus'
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

**Problem:** Opplåsing ved posisjon (Story 3.2) kan bare prøves ved å gå ut i felt. Sensor kan ikke se at geolåste poster åpner seg når de sitter ved en pult, og opplåsingen er ikke bevist med tester rundt radiusen.

**Approach:** I demo-modus på Kart kan sensor trykke på kartet eller velge «Gå til post N» for å sette en simulert posisjon. Opplåsingen reagerer som med ekte GPS. En `node:test`-test med en tabell av posisjoner rundt en post, bygget med uavhengig fasit, viser at opplåsingen er riktig i alle tilfeller, også like innenfor, nøyaktig på og like utenfor radius.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) I demo-modus er simulatoren posisjonskilden, og nettleserens geolokasjon brukes ikke (ingen tillatelsesforespørsel). I live-modus er simulatoren ikke tilgjengelig. (2) Simulatoren vises for både arrangør og deltaker i demo. (3) Den simulerte posisjonen følger samme vei som ekte posisjon (`position` til `checkpointStatus` og kartet), holdes bare i minnet i Kart-siden og glemmes når Kart forlates. Den lagres eller sendes aldri (AD-6, NFR10). (4) «Gå til post N» setter posisjonen nøyaktig på postens koordinater. Trykk på kartet setter posisjonen dit, normalisert til gyldige grader. (5) Uten satt posisjon står geolåste poster låst med teksten «Venter på posisjon …». (6) Det finnes en knapp for å fjerne den simulerte posisjonen. (7) Alt kan betjenes med tastatur (knapper), ikke bare kart-trykk, og trykkflater er minst 48 px. (8) Rene hjelpere (`positionAtPost`, `normalizePosition`) i `geo.js` med tester. Fasit-testen bygger posisjoner med en egen, uavhengig beregning (direkte formel for punkt ved avstand og retning), ikke med `distanceMeters`.

**Never:** Ingen innsending eller godkjenning (3.4 og 3.5). Ikke endre `validate.js`, seed eller migrasjoner. Ikke vis simulatoren i live-modus. Ikke bruk ekte geolokasjon i demo-modus.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gå til post | Trykk «Gå til post 1» | Posisjonen settes på posten, posten er opplåst, markør og egen posisjon vises | N/A |
| Trykk på kartet | Trykk 100 m fra en post | Posisjonen settes dit, posten er låst med «Du er X m unna …» | N/A |
| Trykk på kartet ved en post | Innenfor radius | Posten låses opp | N/A |
| Trykk utenfor gyldige grader | Kart som er panorert forbi ±180° | Lengdegrad normaliseres til gyldig grad | Ingen krasj |
| Ingen posisjon satt | Første besøk på Kart | Geolåste poster er låst, «Venter på posisjon …», åpne poster virker | N/A |
| Fjern posisjon | Trykk «Fjern posisjon» | Tilbake til ingen posisjon, poster låses igjen | N/A |
| Forlater Kart | Navigerer bort og tilbake | Ingen simulert posisjon er husket | N/A |
| Live-modus | Ikke demo | Ingen simulator, ekte geolokasjon som i 3.2 | N/A |
| Demo-modus | Kart åpnes | Ingen forespørsel om ekte posisjon | N/A |
| Post uten koordinater | «Gå til post N» for en slik post | Knappen er deaktivert eller gjør ingenting | Ingen krasj |
| Fasit-tabell | Posisjoner ved avstand 0,5 m innenfor og 0,5 m utenfor radius, i åtte retninger, flere radier og breddegrader | Opplåsingen stemmer med fasiten i 100 % av tilfellene | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Rebus.jsx` -- Kart-siden. `usePosition(...)` gir `position`, `positionStatus`, `retry` og sendes til `PostMap`. Skal i demo bruke en simulert posisjon i stedet.
- `src/components/PostMap.jsx` -- tegner egen posisjon (`Circle`, `CircleMarker`) og markører. Trenger `onMapClick`.
- `src/lib/geo.js` -- `unlockStatus`, `distanceMeters`, `distanceHint`. Legg `positionAtPost` og `normalizePosition`.
- `src/context/TripContext.jsx` -- gir `demoMode`.
- `tests/unlock.test.js` -- har radius-tabell fra 3.2 (flatt langs ekvator). Behold.
- Nye: `src/components/PositionSimulator.jsx`, `tests/simulator.test.js`.
- `src/styles.css` -- legg stil for simulatorpanelet.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/geo.js` -- `positionAtPost(checkpoint)`, `normalizePosition(latlng)` -- ren logikk
- [ ] `src/components/PositionSimulator.jsx`, `src/styles.css` -- panel med «Gå til post N», fjern posisjon og status -- UX-DR10
- [ ] `src/components/PostMap.jsx` -- `onMapClick` med `useMapEvents` og peker som viser at kartet kan trykkes -- AC
- [ ] `src/pages/Rebus.jsx` -- simulert posisjon i demo, ingen ekte geolokasjon i demo -- beslutning 1 og 3
- [ ] `tests/simulator.test.js` -- fasit-tabell med uavhengig beregning, og hjelperne -- NFR4

**Acceptance Criteria:**
- Gitt demo-modus og Kart, når jeg trykker på kartet eller velger «Gå til post N», så settes den simulerte posisjonen dit, og opplåsingen reagerer som med ekte GPS.
- Gitt en `node:test`-test med en tabell av posisjoner rundt en post, når opplåsingen beregnes, så stemmer 100 % av tilfellene med fasiten, også like innenfor, nøyaktig på og like utenfor radius.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome 390 px i demo: «Gå til post 1» låser opp, trykk 120 m unna låser, «Fjern posisjon», ingen geolokasjonsforespørsel.
