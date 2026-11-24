---
title: 'Story 3.3: Posisjonssimulator i demo-modus'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: 'bdaa40b0b3b929feb6881cab017c00483b29c71f'
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
- [x] `src/lib/geo.js` -- `positionAtPost(checkpoint)`, `normalizePosition(latlng)` -- ren logikk
- [x] `src/components/PositionSimulator.jsx`, `src/styles.css` -- panel med «Gå til post N», fjern posisjon og status -- UX-DR10
- [x] `src/components/PostMap.jsx` -- `onMapClick` med `useMapEvents` og peker som viser at kartet kan trykkes -- AC
- [x] `src/pages/Rebus.jsx` -- simulert posisjon i demo, ingen ekte geolokasjon i demo -- beslutning 1 og 3
- [x] `tests/simulator.test.js` -- fasit-tabell med uavhengig beregning, og hjelperne -- NFR4

**Acceptance Criteria:**
- Gitt demo-modus og Kart, når jeg trykker på kartet eller velger «Gå til post N», så settes den simulerte posisjonen dit, og opplåsingen reagerer som med ekte GPS.
- Gitt en `node:test`-test med en tabell av posisjoner rundt en post, når opplåsingen beregnes, så stemmer 100 % av tilfellene med fasiten, også like innenfor, nøyaktig på og like utenfor radius.

## Implementation Notes

- `positionAtPost` og `normalizePosition` i `geo.js`. `normalizePosition` pakker lengdegrad rundt til [-180, 180) og gir null for ugyldig punkt.
- `src/components/PositionSimulator.jsx` (panel med «Gå til post N», «Fjern posisjon» og status, knapper 48 px) og `onMapClick` i `PostMap` (`useMapEvents`, `latlng.wrap()`, peker som viser at kartet kan trykkes). I `Rebus.jsx` er simulert posisjon kilden i demo, og `usePosition` er av i demo, så nettleseren ber aldri om posisjon.
- Fasit-testen (`tests/simulator.test.js`): 320 tilfeller (5 breddegrader, 4 radier, 8 retninger, 0,5 m innenfor og 0,5 m utenfor). Posisjonene bygges med en egen direkte formel for punkt ved avstand og retning, uavhengig av `distanceMeters`. I tillegg midt på posten, langt unna, «Gå til post N», og normalisering. 538 tester grønne etter review.
- Verifisert i headless Chrome (demo, 390 px): simulatoren vises med syv knapper (48 px), ingen posisjon gir låst og «Venter på posisjon …», «Gå til post 1» låser opp og markøren blir opplåst, trykk på kartet 3,3 km unna gir «Du er 3297 m unna …», «Fjern posisjon» låser igjen, åpne poster virker uten posisjon, ingen kall til `watchPosition`, og posisjonen er borte når Kart forlates og åpnes på nytt.
- Etter review: `moveBy` og flyttknapper (100 m i fire retninger), `resolvePosition` og `shouldTrackReal` som rene funksjoner, statuslinje med koordinater, tabell for «nøyaktig på radius», og et ugyldig kartpunkt endrer ikke posisjonen.
- Valgt uten å spørre: ekte GPS brukes ikke i demo, simulatoren vises for både arrangør og deltaker, og simulert posisjon huskes ikke mellom besøk.

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | Et ugyldig kartpunkt nuller den simulerte posisjonen (edge) | medium | patch | Kartpunktet settes bare når `normalizePosition` gir en posisjon. |
| 2 | Valget av posisjonskilde og kartklikk-koblingen er ikke testet (verification-gap, blind) | medium | patch | `resolvePosition` og `shouldTrackReal` er rene funksjoner i `geo.js`, brukt i Rebus, med tester (demo bruker aldri ekte posisjon, ingen sporing i demo). |
| 3 | «Nøyaktig på radius» er bare dekket med ±0,5 m, så `<` i stedet for `<=` ville passert (edge, claim) | medium | patch | Tabell for fem breddegrader og fire retninger der radius settes til den beregnede avstanden (opplåst) og en hårsmål mindre (låst). |
| 4 | Fri plassering finnes bare med musetrykk, ikke tastatur (blind) | medium | patch | Fire knapper «100 m nord/sør/øst/vest» (`moveBy`) som gjør det mulig å teste «like utenfor» uten mus. Tester og verifisert i Chrome (101 m unna). |
| 5 | To ulike validatorer og dobbel normalisering (blind) | low | patch | `normalizePosition` bruker `validPosition`, og `wrap()` i kartklikk er fjernet. Tester for ±90 og tekst. |
| 6 | Ingen tilbakemelding om hvor posisjonen ligger (blind) | low | patch | Statuslinjen viser koordinatene. |
| 7 | Knappenummer og markørnummer kan komme ut av takt for poster uten koordinater (edge, blind) | false | reject | Begge teller i samme liste av aktive poster (`numberOf` i `PostMap`), og disabled knapper beholder nummeret. |
| 8 | Trykk på markør eller kontroll flytter også posisjonen (edge) | false | reject | Verifisert i Chrome: trykk på markør velger posten uten å flytte posisjonen (Leaflet stopper boblingen), og postkortet ligger utenfor kartbeholderen. |
| 9 | Simulatoren er en snarvei forbi opplåsingen (blind) | false | reject | Simulatoren finnes bare i demo-modus (ingen Supabase-variabler). Live bruker ekte posisjon. |
| 10 | Komponentene har ingen kjørende test (verification-gap, blind) | medium | defer | Ingen React-testoppsett. Valgene ligger i rene testede funksjoner, og flyten er verifisert i Chrome. |
| 11 | Inline klikk-handler, `retry` i demo, magiske tall i Rebus (edge, blind) | low | reject | Ingen kjent skade. Ubrukt `retry` i demo er harmløs. |
| 12 | Paritet mellom simulert og ekte posisjon ser bare på `lock` (claim, blind) | low | reject | `checkpointStatus` bruker ikke usikkerheten, så lås og tekst er det som skal være likt. |

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome 390 px i demo: «Gå til post 1» låser opp, trykk 120 m unna låser, «Fjern posisjon», ingen geolokasjonsforespørsel.
