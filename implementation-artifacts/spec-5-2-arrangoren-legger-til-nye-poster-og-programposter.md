---
title: 'Story 5.2: Arrangøren legger til nye poster og programposter underveis'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: 'dc5c567874920fc84af2a1f703759902403233ff'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skjemaene for ny post og ny programpost ligger alltid åpne i Admin, uten knappene «+ Post» og «+ Programpost», og en ny post kan bare plasseres ved å skrive breddegrad og lengdegrad for hånd. Det finnes ingen kartvelger, og ingenting hindrer en posisjon langt fra turen før lagring.

**Approach:** Knappene «+ Post» og «+ Programpost» åpner skjemaet for et nytt element, som valideres med `validateChange` fra 5.1. Posten settes på kartet med en kartvelger der markøren kan trykkes på eller dras, med radius som sirkel og turens område som sirkel. En ren `pickLocation` avviser posisjoner utenfor turens område med forklaring. En ny post kan deltakerne sende inn på som på andre poster.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Skjemaene for program og poster er skjult til arrangøren trykker «+ Programpost», «+ Post» eller «Rediger» på et element. «Avbryt» og en vellykket lagring lukker dem. (2) Ny post får standardverdiene `requires_location: false` (åpen fra første øyeblikk, besluttet av Kevin), `radius_m: 50` og `status: 'active'`. Skjemaet har en avkrysning «Krever at laget er på stedet» og et felt for radius i meter, som valideres av `validateChange` (radius større enn 0). (3) Ren `pickLocation(point, area)` i `src/lib/pickLocation.js` (importerer bare `geo.js`): gir `{ ok: true, lat, lng }` med avrundet verdi (6 desimaler), eller `{ ok: false, error }` med forklaring når punktet ikke er gyldig eller ligger utenfor området. Mangler `area`, godtas ethvert gyldig punkt. (4) Kartvelgeren (`LocationPicker.jsx`, react-leaflet) viser turens område som sirkel (når `area` finnes), posten som en markør som kan trykkes ut eller dras, og radius som sirkel. En avvist posisjon flytter ikke markøren og viser forklaringen. Breddegrad og lengdegrad i skjemaet følger kartet, og endres de for hånd, flytter markøren seg. (5) Programposten legges på dagen arrangøren velger (innenfor turens periode) og står riktig sortert i listen etter lagring. (6) Etter lagring står en ny post med `position` etter de andre, og deltakerne ser den på kartet og kan sende inn på den som på andre poster (åpen post: ingen posisjonskrav). (7) Bekreftelsen «Lagret. Deltakerne ser endringen nå.» og feil ved feltene fra 5.1 gjelder uendret.

**Never:** Ikke «Ny post med KI» (Epic 6), ikke deaktivering eller sletting av poster (5.3), ikke «Endret»-merke eller banner (5.4). Ikke endre `validate.js`, poengreglene eller migrasjonene. Ikke legg til nye avhengigheter.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ny post på kartet | Trykk på kartet innenfor området | Markør settes, bredde og lengde fylles ut avrundet | N/A |
| Dra markør | Markøren dras innenfor området | Verdiene følger markøren | N/A |
| Utenfor området | Trykk eller dra utenfor turens område | Markøren flyttes ikke, forklaring vises | Forklaring ved kartet |
| Uten område (live) | Turen har ikke `area` | Ethvert gyldig punkt godtas | N/A |
| Ugyldig punkt | `NaN`, `null` eller utenfor ±90/±180 | `{ ok: false }` uten krasj | Forklaring |
| Ny programpost | Dato i perioden | Lagres på den dagen og sorteres riktig | N/A |
| Programpost utenfor perioden | Dato etter sluttdato | Lagres ikke, feil ved datofeltet | Feil ved feltet |
| Radius | Radius 0 eller tom | Lagres ikke, feil ved radiusfeltet | Feil ved feltet |
| Ny post kan løses | Deltaker åpner kartet etter lagring | Posten vises og kan sendes inn på | N/A |
| Avbryt | Trykker Avbryt | Skjemaet lukkes og tømmes, feil fjernes | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Admin.jsx` -- fanene `program` og `checkpoints`: skjemaene (`eventForm`, `taskForm`), `saveProgram`, `saveTask`, `startProgram`, `startTask`, `checkChange`, `FieldError`. Her legges «+ Post», «+ Programpost», skjul/vis, radius, avkrysning og kartvelger.
- `src/components/PostMap.jsx` -- eksisterende kart (react-leaflet, `FitBounds`, `MapClick`). Mønster å følge. Ikke endre.
- `src/components/LocationPicker.jsx` -- NY.
- `src/lib/geo.js` -- `distanceMeters`. `src/lib/tripEdit.js` -- `validateChange` (5.1), `SHOWN`-feltlisten må få `radius_m`.
- `src/lib/pickLocation.js` -- NY, ren.
- `src/styles.css` -- `.map`, `.split-admin`, feilstil fra 5.1. Legg kartvelger og knapper.
- `tests/pickLocation.test.js` -- NY. `tests/purity.test.js` -- legg til `pickLocation.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/pickLocation.js` -- `pickLocation` (beslutning 3)
- [x] `tests/pickLocation.test.js`, `tests/purity.test.js` -- matriseradene som kan testes rent, og ren-liste
- [x] `src/lib/tripEdit.js` -- `radius_m` som felt med feilvisning (beslutning 2)
- [x] `src/components/LocationPicker.jsx`, `src/styles.css` -- kartvelger med områdesirkel, radiussirkel, trykk og dra (beslutning 4)
- [x] `src/pages/Admin.jsx` -- «+ Post» og «+ Programpost», skjult skjema, radius og avkrysning, kartvelger, Avbryt (beslutning 1, 2, 4, 5)

**Acceptance Criteria:**
- Gitt Admin, når jeg trykker «+ Post» eller «+ Programpost» og fyller ut, så legges elementet til på riktig dag og blir validert, og nye poster kan settes på kartet med kartvelgeren.
- Gitt en ny post, når den er lagret, så kan deltakerne se den på kartet og sende inn på den som på andre poster.
- Gitt en posisjon utenfor turens område, når jeg prøver å sette posten der, så avvises den med en forklaring.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss manuell sjekk i headless Chrome. Patchet:
- high: kartvelgeren krasjet hele Admin-siden (`L.circle(...).getBounds()` virker ikke før sirkelen ligger på et kart) — funnet i nettleseren og patchet med egen utregning av utsnittet.
- medium: `center` og `zoom` overstyrte utsnittet, så turområdet ikke var synlig — patchet.
- medium: redigering av en post sendte alltid radius og stedskrav og overskrev eldre rader — patchet (`buildCheckpointRecord` sender dem bare når de er endret).
- medium: `position` og postbyggingen hadde ingen test — flyttet til ren `buildCheckpointRecord` i `tripEdit.js` med tester (plass etter høyeste, hull, tom radius, redigering).
- medium: områdesirkel med radius 0 avviste alle punkter og krasjet `Circle` — patchet i `pickLocation` og kartvelgeren.
- medium: radius uten øvre grense og tillatt som desimal — patchet (heltall, høyst 2000 m).
- low: punkt ved kanten kunne havne utenfor etter avrunding — patchet (avrund først).
- low: skjemaet ble stående etter sletting av elementet eller fanebytte — patchet.
- low: gammel avvisningsmelding ble stående, og ubrukt `zoom`-parameter — patchet.
Avvist som false: «håndskrevet posisjon går utenom områdekontrollen» (`validateChange` melder utenfor området), «null-radius på eldre rad skjules» (dekket av endret-felt-regelen).
Avvist som low uten patch: tastaturflytting av markøren (bredde og lengde kan skrives), faste farger i kartvelgeren, fast kartvelgerhøyde, uendret skjema forkastes uten advarsel, lengdegrad over 180, fokusflytting ved åpning.
Utsatt (deferred-work.md): ingen komponenttester av Admin-skjemaene og `LocationPicker`.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: trykk «+ Post», sett posten på kartet, lagre, åpne Kart som deltaker og sjekk at posten finnes og kan sendes inn på. Prøv et trykk utenfor området og se forklaringen. Legg til en programpost på dag 2 og sjekk sorteringen. Sjekk Admin på 390 px.
