---
title: 'Story 1.2: Turdata valideres av domenekjernen'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: '9c526b5963082d81e405cf96e07237cc97f0a6eb'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Det finnes ingen felles kontroll av turdata. KI-svar, seed-turen og redigerte turer kan få ulike former, og arrangøren kan publisere en ødelagt tur.

**Approach:** Legg inn rene JavaScript-funksjoner i `src/lib/`: `validateTrip(draft)` i `validate.js` (regler, norske meldinger med sti) og `distanceMeters()` i `geo.js`. Ingen biblioteker. Enhetstester med `node:test`, én test per regelbrudd.

## Boundaries & Constraints

**Always:** Rene filer: de importerer bare hverandre, har ingen sideeffekter og ingen avhengigheter (AD-1). `TripDraft` er `{ trip, program_items, checkpoints, teams }` med malens feltnavn: `trip` har `name`, `start_date`, `end_date`, `area` (`{ center: { lat, lng }, radius_m }`) og valgfri `theme` (`{ accent, icon }`, begge tekst). `program_items` har `id`, `event_date`, `start_time`, `title`. `checkpoints` har `id`, `title`, `latitude`, `longitude`, `radius_m`, `requires_location`, `points` og `status` (`active` eller `deactivated`). `teams` har `id`, `name`. Resultatet er `{ ok: true }` eller `{ ok: false, issues: [{ path, message }] }` med norsk melding. Én feil per brudd. `points` er et heltall fra 1 til 500 (databasen tillater 0 til 500, og kravet er positivt). Datoer er `YYYY-MM-DD`, tider `HH:mm`.

**Never:** Ingen `scoring.js`, `req`-sjekk (AD-15, kommer i Story 2.2), enum-lister for tema (Story 2.6), seed-validering (Story 1.3) eller endringer i UI. Ikke bruk zod eller annet bibliotek. Ikke endre eksisterende eksporter i `core.js` utover å la `distanceMeters` leve i `geo.js` og re-eksporteres.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig tur | Alle regler oppfylt | `{ ok: true }` | N/A |
| Dato uten programpost | En dato i perioden mangler programposter | Én feil på `program_items` som nevner datoen | N/A |
| Programpost utenfor perioden | `event_date` før start eller etter slutt | Én feil på `program_items[i].event_date` | N/A |
| Post utenfor området | Avstand fra `area.center` større enn `area.radius_m` | Én feil på `checkpoints[i]` | N/A |
| Ugyldig radius | `radius_m` 0, negativ eller ikke et tall | Én feil på `checkpoints[i].radius_m` | N/A |
| Ugyldige poeng | Ikke heltall, under 1 eller over 500 | Én feil på `checkpoints[i].points` | N/A |
| Manglende felt | Tom tittel, manglende dato osv. | Én feil per felt | Ingen krasj |
| Ikke et objekt | `null`, `undefined`, tekst | `{ ok: false }` med én feil | Ingen krasj |
| Avstand | To kjente koordinater | Innenfor 1 % av fasiten | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/core.js` -- har `distanceMeters` (haversine, r = 6371000), `standings`, `sortEvents`, slug-hjelpere. `TripContext.jsx` importerer `distanceMeters`? Sjekk og behold importen via re-eksport.
- `src/lib/geo.js` -- NY: flytt `distanceMeters` hit.
- `src/lib/validate.js` -- NY: `validateTrip`.
- `tests/core.test.js` -- har en distanse-test som må fortsatt virke.
- `tests/validate.test.js`, `tests/geo.test.js` -- NYE.
- Mønster: egne små rene funksjoner, `node:test` og `node:assert/strict`, som i `tests/trip-paths.test.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/geo.js` -- flytt `distanceMeters`, re-eksporter fra `core.js` -- AD-1
- [x] `src/lib/validate.js` -- `validateTrip(draft)` med reglene i matrisen -- AD-2
- [x] `tests/geo.test.js` -- fasit innenfor 1 % (én breddegrad, én lengdegrad, pol til pol) -- AC
- [x] `tests/validate.test.js` -- gyldig tur og én test per rad i matrisen -- AC, FR2, FR5
- [x] `tests/purity.test.js` -- de rene filene i `src/lib/` importerer ingen biblioteker -- AD-1

**Acceptance Criteria:**
- Gitt en gyldig `TripDraft`, når `validateTrip()` kjøres, så returneres `{ ok: true }`.
- Gitt hvert regelbrudd i matrisen, når turen valideres, så avvises den med nøyaktig én konkret feil per brudd.
- Gitt `npm test`, når den kjører, så er alle tester grønne, også de eksisterende.

## Implementation Notes

- `distanceMeters` flyttet til `src/lib/geo.js` og re-eksporteres fra `core.js`, så `TripContext` og eksisterende tester virker uendret.
- `validateTrip(draft)` i `src/lib/validate.js`, uten biblioteker. Eksporterer også `MAX_POINTS` (500). `req`-sjekken (AD-15) og enum-lister for tema ligger utenfor (Story 2.2 og 2.6). Temaet valideres bare som to ikke-tomme tekstfelt hvis det finnes.
- Valgt uten å spørre: poeng 1 til 500 (databasens `CHECK` tillater 0 til 500, kravet er positivt), turen kan vare maks 366 dager (hindrer uendelig løkke), `status` er valgfri, men må være `active` eller `deactivated` hvis satt.
- Tester: 63 grønne etter review (54 nye): `geo.test.js`, `validate.test.js` (én test per matriserad, flere verdier for radius og poeng, ugyldig input uten krasj) og `purity.test.js` (relative imports).
- `npm run build` lykkes.
- Etter review: `id` er påkrevd og unik, lagnavn er unike, område og koordinater sjekkes feltvis, perioden regnes aritmetisk, og `distanceMeters` klemmer x til [0, 1] (rundingsfeil ga NaN).

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | Haversine gir NaN nær motpunktet, og `> radius` blir usant (edge) | medium | patch | Verifisert: for (19.73, -161.03) mot motpunktet er x = 1.0000000000000002. Klemt i `geo.js`. Test med akkurat disse punktene feiler uten klemmingen. |
| 2 | Perioden bygger hele datolisten bare for å telle (alle tre) | medium | patch | 0100–9999 bygde millioner av strenger. Nå aritmetikk, med test på 366/367 dager og tidsgrense. |
| 3 | Ugyldig midtpunkt skjuler ugyldig radius (else-if) (blind, edge) | medium | patch | Sjekkes nå hver for seg, med tabelltest. |
| 4 | Ugyldig lengdegrad rapporteres på `.latitude` (blind, edge) | low | patch | Egen `.longitude`-sti, med test. |
| 5 | `id` mangler eller er duplisert (blind, edge) | medium | patch | `id` er felt i kontrakten (spec). Duplikate id-er kan overskrive innsendinger. Sjekk og test for programposter, poster og lag. |
| 6 | Lag med samme navn (blind) | medium | patch | Databasen har `unique (trip_id, name)`. Sjekk og test. |
| 7 | Kant-testen tester ikke kanten (verification-gap) | medium | patch | Testet avstand 0 mot 112 km. Nå radius lik beregnet avstand (gyldig) og én meter mindre (avvist). |
| 8 | Flere regler uten test (MAX_TRIP_DAYS, område, koordinater, requires_location) (verification-gap, blind) | medium | patch | Tabelltester for hver, inkludert at ugyldig område eller periode bare gir egne feil. |
| 9 | Deaktivert post utenfor området er ikke testet (blind) | low | patch | Test lagt til. |
| 10 | Purity-testen er skjør (blind, edge, verification-gap) | low | patch | Dekker nå flerlinjede imports, `import 'x'`, `import()`, `require`, kun tillatte rene filer, og at den finner importene (ikke tom). |
| 11 | `{}`-testen sjekker ikke antallet feil (edge) | low | patch | Eksakte stier og antall. |
| 12 | Dokumentere synk mot databasen (blind) | low | patch | Docblock i `validate.js`. |
| 13 | Programpost utenfor perioden gir også «mangler programpost» (edge, claim) | false | reject | To ulike brudd: en post på feil dato, og en dato uten poster. Begge er sanne for brukeren. |
| 14 | `isObject` godtar Date/Map (edge) | low | reject | Inndata er JSON. Ingen kjent vei inn. |
| 15 | `requires_location: false` krever fortsatt koordinater (blind) | false | reject | Åpne poster har markør på kartet (UX-DR23), så koordinater trengs. |
| 16 | Ingen minimum antall poster eller lag (blind) | low | defer | Kravet er ikke fastsatt. Avgjøres i Story 2.x (publisering). |
| 17 | Globale sideeffekter, geo-toleranser, `distanceMeters` med ugyldig input (blind) | low | reject | Valideringen vokter inndata før `distanceMeters`. Toleransen 1 % er kravet. |
| 18 | Ingen test med ekte seed (blind) | low | defer | Seed kommer i Story 1.3. |

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil
- `grep -n "^import" src/lib/validate.js src/lib/geo.js` -- expected: ingen biblioteker

