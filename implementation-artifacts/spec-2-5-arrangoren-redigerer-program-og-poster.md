---
title: 'Story 2.5: Arrangøren redigerer program og poster'
type: 'feature'
created: '2026-11-26'
status: 'done'
baseline_commit: 'ffdc324e3a4c136566a8a7410bd6fab314ccd449'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Utkast-siden (2.3) er skrivebeskyttet. Arrangøren kan ikke rette det KI-en har foreslått: ikke tittel eller tid på programposter, ikke poeng, posisjon, radius eller stedskrav på poster, ikke lagnavn og ikke turens område. Det finnes heller ingen oversikt over hva som må rettes før publisering.

**Approach:** Utkast får fanene Program, Poster, Lag og Poeng med redigering på stedet og automatisk lagring av bare elementet som endres. En ren `draftEdit.js` oppdaterer ett element om gangen og kobler `validateTrip()`-feil til riktig element og felt. Poster kan flyttes på et kart (kartvelgeren fra 5.2) med radius som sirkel, og turens område kan endres, med feil på poster som da havner utenfor. Toppen viser «N ting må rettes før publisering», og Publiser er deaktivert.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-26): (1) Ren `src/lib/draftEdit.js` (importerer bare `validate.js` og andre rene filer): `updateElement(draft, section, id, patch)` (`section` er `program_items`, `checkpoints` eller `teams`) gir et nytt utkast der bare elementet med den id-en er endret (alle andre elementer er uendret, samme objekter), `updateArea(draft, area)` endrer `trip.area`, og `draftErrors(draft)` kjører `validateTrip(draft)` og gir `{ count, byId, general }`, der feil på et element er knyttet til elementets id og felt (`{ field, message }`), og feil som ikke hører til ett element (for eksempel en dag uten programposter, eller et ugyldig område) ligger i `general`. Ukjent id, ukjent seksjon eller ugyldig input endrer ingenting og krasjer ikke. (2) Utkast-siden (`/utkast`, bare arrangør, bare i demo) har fanene Program, Poster, Lag og Poeng. Hver endring av et felt lagres med en gang i det lagrede utkastet (`saveDraft`), uten en egen lagre-knapp, og bare elementet som endres, endres. En kort tekst «Lagret» (i en `role="status"`-region) vises etter hver lagring. (3) Program: tittel, beskrivelse, dato (innenfor turens periode) og klokkeslett kan endres per programpost. Det legges ikke til eller slettes programposter her. (4) Poster: tittel, beskrivelse, poeng, radius, «Krever at laget er på stedet» (`requires_location`) og posisjon kan endres per post. Posisjonen settes med kartvelgeren `LocationPicker` fra 5.2 (trykk eller dra, med radius som sirkel og turens område som sirkel, og forklaring når en posisjon avvises utenfor området), og bredde og lengde kan også skrives. (5) Turens område: i Poster-fanen kan arrangøren endre områdets midtpunkt (bredde, lengde) og radius i meter. Etter endringen valideres alle poster mot det nye området, og poster som havner utenfor, får en feil ved posten («Posten ligger utenfor turens område.»). Områdets dragbare sirkel på kartet er ikke med (feltene er den støttede måten). Ugyldig område (utenfor ±90/±180 eller radius under 1) avvises med en feil og lagres ikke. (6) Lag: navn og emoji kan endres per lag, og lagnavn må være unike. Poeng: poengene til alle poster vises og redigeres i en samlet liste (heltall fra 1 til 500, samme regel som `pointsError`). (7) Valideringsfeil vises ved elementet og feltet (rød kant, `aria-invalid`, feilmelding), og toppen viser «N ting må rettes før publisering» når `count` er større enn 0. Er `count` 0, vises «Utkastet er klart for publisering». Knappen «Publiser» er deaktivert når det finnes feil, og er også deaktivert uten feil inntil Story 2.7 (med teksten «Publisering kommer i neste steg» når den ellers ville vært aktiv). (8) Fra 1024 px bredde ligger innholdet og kartet i to kolonner, og under det stables de. Trykkflater er minst 48 px. (9) Live-modus (skriving direkte mot databasen med `validateTrip()` før lagring, RLS og `CHECK`) er ikke med, siden Supabase ikke finnes ennå. Det hører til Story 7.4 og 2.4.

**Never:** Ikke legg til eller slett programposter, poster eller lag her. Ikke publiser (2.7), ikke tema (2.6) og ikke regenerering (Epic 6). Ikke endre turens periode eller antall lag og poster fra forespørselen. Ikke endre `validateTrip`, poengreglene eller migrasjonene.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Endre ett felt | Ny tittel på en programpost | Bare den programposten endres, og endringen er lagret | N/A |
| Andre elementer | Endring av post 2 | Post 1 og 3 er uendret (samme objekter) | N/A |
| Ugyldig tittel | Tom tittel på en post | Lagres, men feil ved feltet og telleren øker | Feil ved feltet |
| Ugyldig poeng | Poeng 0 eller 501 | Feil ved poengfeltet, telleren øker | Feil ved feltet |
| Flytte post | Trykk eller dra på kartet innenfor området | Posisjonen og sirkelen flyttes | N/A |
| Utenfor området | Trykk eller dra utenfor området | Markøren flyttes ikke, forklaring vises | Forklaring ved kartet |
| Stedskrav | Slå `requires_location` av og på | Verdien lagres per post | N/A |
| Endre område | Midtpunkt eller radius endres | Alle poster valideres mot det nye området, poster utenfor får feil | Feil ved poster utenfor |
| Ugyldig område | Radius 0 eller breddegrad 100 | Avvises, forrige område beholdes | Feil ved feltet |
| Dato utenfor perioden | Programpost flyttes etter sluttdato | Feil ved datofeltet | Feil ved feltet |
| Dag uten program | Eneste programpost på en dag flyttes til en annen dag | Felles feil «Datoen mangler programposter» | Felles melding |
| Samme lagnavn | To lag får samme navn | Feil ved det andre lagets navn | Feil ved feltet |
| Alt gyldig | Ingen feil | «Utkastet er klart for publisering», Publiser deaktivert | N/A |
| Feil finnes | N feil | «N ting må rettes før publisering», Publiser deaktivert | N/A |
| Ugyldig input | Ukjent id eller seksjon, `null` | Ingenting endres, ingen krasj | N/A |
| Ødelagt utkast | Ugyldig lagret utkast | «Ingen utkast ennå.» (fra 2.3) | N/A |
| Bredde ≥ 1024 px | Stor skjerm | To kolonner: innhold og kart | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Utkast.jsx` -- skrivebeskyttet visning fra 2.3 (`loadDraft`, lag, program per dag, poster). Bygges om til redigering med faner.
- `src/lib/draftStore.js` -- `saveDraft`, `loadDraft` (validerer ved lasting: et utkast med feil må fortsatt kunne åpnes for redigering, så lasting må ikke forkaste utkast som bare har valideringsfeil). Se beslutning under Design Notes.
- `src/lib/draftEdit.js` -- NY, ren.
- `src/lib/validate.js` -- `validateTrip`, `pointsError`, `pointsFromInput` (ikke endre). Gir feilbaner som `program_items[i].title`, `checkpoints[i].points`, `teams[i].name`, `trip.area.radius_m`.
- `src/components/LocationPicker.jsx`, `src/lib/pickLocation.js` -- kartvelger og posisjonsregel fra 5.2 (gjenbruk, ikke endre).
- `src/pages/Admin.jsx` -- mønster for feilvisning (`aria-invalid`, `field-error`) og mobilregler fra 5.1.
- `src/styles.css` -- `.draft-view`, `.draft-panel`, `.draft-list`, `.field-error`, kartvelgerstiler. Legg faner og to kolonner fra 1024 px.
- `tests/draftEdit.test.js` -- NY. `tests/purity.test.js` -- legg til `draftEdit.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/draftStore.js` -- la `loadDraft` åpne utkast som har valideringsfeil, men fortsatt forkaste ødelagte (mangler `trip` eller samlinger) (se Design Notes)
- [x] `src/lib/draftEdit.js`, `tests/draftEdit.test.js`, `tests/purity.test.js` -- `updateElement`, `updateArea`, `draftErrors` og tester for matriseradene (beslutning 1)
- [x] `src/pages/Utkast.jsx`, `src/styles.css` -- faner, redigering på stedet, autolagring, feil ved felt, kartvelger, områdefelt og toppen med «N ting må rettes» (beslutning 2 til 8)

**Acceptance Criteria:**
- Gitt Utkast med fanene Program, Poster, Lag og Poeng, når jeg endrer et felt, så lagres endringen automatisk, og bare det elementet endres.
- Gitt Poster-fanen, når jeg drar en markør eller trykker på kartet, så flyttes posten, og radius vises som en sirkel; en posisjon utenfor turens område avvises med en forklaring, og jeg kan slå «Krever at laget er på stedet» av eller på per post.
- Gitt Poster-fanen, når jeg endrer midtpunkt eller radius for turens område, så valideres alle poster mot det nye området, og poster utenfor får en feil.
- Gitt valideringsfeil i utkastet, når de finnes, så vises «N ting må rettes før publisering», og knappen Publiser er deaktivert.
- Gitt en bredde på minst 1024 px, når Utkast vises, så er innhold og kart i to kolonner.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss manuell sjekk i headless Chrome (1280 og 390 px). Patchet:
- high: den lempede `loadDraft` slapp gjennom utkast uten område, med ugyldig dato eller med id-er som ikke er unike, og siden kunne krasje — patchet (formkravene utvidet, tester lagt til).
- high: å tømme en dato kastet `RangeError` i `formatDate` og flyttet kortet mellom dagsgrupper mens man skrev — patchet (programmet vises som én stabil liste i utkastets rekkefølge).
- medium: feil ble telt i «N ting må rettes» uten å vises noe sted (felt uten eget input) — patchet (resterende feil vises på kortet).
- medium: `created_at` ble overskrevet ved hver redigering — patchet (bevares).
- medium: feilen «utenfor området» ble ikke bundet til et felt i testene — assertion lagt til.
- low: kartet tilpasset seg ikke et endret område — patchet (nøkkel på områdets verdier).
Avvist som false: «mangler legg til, slett og flytt» (utenfor spesifikasjonen, jf. Never), «`areaError` og `validateTrip` har ulik grense» (spesifikasjonen sier radius minst 1 m).
Avvist som low uten patch: NaN lagres som `null` ved ugyldig tall, bare første feil per felt vises, samme områdefeil under alle tre feltene, tastaturnavigasjon i faner, `aria-describedby` på Publiser.
Utsatt (deferred-work.md): ingen komponenttester av Utkast-siden.

## Design Notes

I 2.3 forkaster `loadDraft` utkast som ikke validerer, så en ødelagt lagring ikke krasjer visningen. I 2.5 skal et utkast med valideringsfeil kunne åpnes og rettes. Regel: `loadDraft` krever at utkastet har `trip` med periode og at `program_items`, `checkpoints` og `teams` er lister med objekter (så siden ikke krasjer), men ikke at `validateTrip` er ok. Valideringsfeil vises i stedet av `draftErrors`.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: generer et utkast, endre en tittel og se at den lagres (last siden på nytt), tøm en tittel og se feilen og «1 ting må rettes», sett poeng 0 og 501, flytt en post på kartet og prøv utenfor området, slå stedskrav av og på, sett områdets radius til 100 m og se feil på poster utenfor, og sjekk at Publiser er deaktivert. Sjekk 390 px og 1280 px bredde.
