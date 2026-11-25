---
title: 'Story 5.1: Arrangøren endrer en publisert tur'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: 'c3b37484602a178e6f1dcbbee322eea2db65364c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Arrangøren kan endre programposter og poster i Admin, men endringene lagres uten `validateTrip()` (bare poeng sjekkes), programposter og poster får ingen endringstid i demo, programposter har ingen `updated_at` i databasen, og arrangøren får ingen bekreftelse eller feil ved feltet. Admin er heller ikke tilrettelagt for mobil.

**Approach:** En ren `tripEdit.js` setter en endring inn i turen, kjører `validateTrip()` og gir feilene som gjelder det endrede elementet, knyttet til felt. Admin viser feilene ved feltene, lagrer bare gyldige endringer med ny `updated_at`, og viser «Lagret. Deltakerne ser endringen nå.» En migrasjon gir `program_items` `updated_at`. Admin-skjemaene stables og får store trykkflater på mobil.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Avgrensning besluttet av Kevin: 5.1 bygges på dagens Admin-side, som fungerer som «Rediger underveis». «Endre turen»-knappen, Turoversikt, Utkast og publisering kommer med Epic 2 og er ikke med her. (2) `validateChange(data, collection, record, id)` i `src/lib/tripEdit.js` (ren, importerer bare `validate.js`) setter endringen inn i en kopi av turen (`collection` er `program` eller `checkpoints`; `id` er tom for et nytt element), bygger en `TripDraft` (`program` blir `program_items`), kjører `validateTrip` og returnerer `{ ok: true }` eller `{ ok: false, errors }` der hver feil er `{ field, message }`. (3) Bare feil som gjelder det endrede elementet tas med (feltfeil får feltnavnet, for eksempel `title` eller `points`), pluss feilen «Datoen … mangler programposter» som felles melding (`field: null`) når endringen fjerner siste programpost på en dag. Feil på `trip.*` og på andre elementer ignoreres, siden de ikke er arrangørens skyld ved denne endringen. Mangler turen `area` (live), hoppes områdesjekken over. (4) Admin kjører `validateChange` før hver lagring av program og poster. Er den ugyldig, lagres ingenting, og meldingene vises ved feltene (og felles melding øverst i skjemaet). (5) Gyldig lagring setter `updated_at` til nåtid på elementet i demo (live setter databasen den med trigger), og Admin viser bekreftelsen «Lagret. Deltakerne ser endringen nå.» i en `role="status"`-region. (6) Poengendring: lagrer arrangøren nye poeng på en post med godkjente innsendinger, får alle lag som har løst den, de nye poengene via `standings` (uendret fra 3.6), og ledertavlen oppdateres hos andre via signalet fra 4.3. (7) Migrasjon `supabase/migrations/202611250005_story_5_1_program_updated_at.sql` (ukjørt): `updated_at` på `program_items` med samme trigger `private.touch_updated_at`. (8) Mobil: under 720 px stables skjemaet og listen i Admin, og knapper og felt er minst 44 px høye (`--tap-min`).

**Never:** Ikke bygg Turoversikt, «Endre turen»-knapp, utkast eller publisering. Ikke legg til nye poster eller programposter som egen flyt (5.2), ikke deaktiver poster (5.3), ikke «Endret»-merker eller banner (5.4). Ikke endre poengreglene, `validate.js` eller seed. Ikke endre migrasjonene som finnes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig endring | Ny tittel på programpost | Lagres med ny `updated_at`, bekreftelsen vises | N/A |
| Ugyldig tittel | Tom tittel på post | Ingenting lagres, feil «Posten må ha en tittel.» ved tittelfeltet | Feil ved feltet |
| Ugyldig poeng | Poeng 0 eller 501 | Ingenting lagres, feil ved poengfeltet | Feil ved feltet |
| Post utenfor området | Koordinater langt fra turens midtpunkt | Ingenting lagres, felles melding om at posten ligger utenfor området | Melding i skjemaet |
| Dato utenfor perioden | Programpost etter sluttdato | Ingenting lagres, feil ved datofeltet | Feil ved feltet |
| Siste post på en dag flyttes | Eneste programpost på en dag får ny dato | Ingenting lagres, felles melding om at datoen mangler programposter | Melding i skjemaet |
| Feil andre steder | `trip.*` eller andre elementer er ugyldige fra før | Ignoreres, endringen lagres | N/A |
| Mangler `area` (live) | Turen har ikke `area` | Områdesjekken hoppes over, resten valideres | N/A |
| Poengendring med innsendinger | Post med godkjent innsending får nye poeng | Laget som løste posten får de nye poengene | N/A |
| Ukjent element | `id` som ikke finnes | Avvises uten å lagre | Feilmelding |
| Ugyldig input | `null`, manglende data eller feil collection | Ingen krasj, `{ ok: false }` | Feilmelding |

</frozen-after-approval>

## Code Map

- `src/pages/Admin.jsx` -- `saveProgram` (linje ~50) og `saveTask` (~58) kaller `write` uten `validateTrip`. Skjemaene i fanene `program` og `checkpoints`. Legg feil ved feltene, felles melding og bekreftelse. Poengsjekken (`pointsError`) kan bli i `validateTrip`-kallet.
- `src/lib/validate.js` -- `validateTrip` og `pointsError`. Ikke endre. Trenger `{ trip (med area), program_items, checkpoints, teams }`.
- `src/lib/tripEdit.js` -- NY, ren.
- `src/context/TripContext.jsx` -- `write(collection, record, id)` (~228): demo setter ikke `updated_at`. Sett `updated_at` for `program` og `checkpoints` i demo.
- `supabase/migrations/202611250001_story_3_4_submissions.sql` -- har `private.touch_updated_at` og trigger for `checkpoints` (les, ikke endre). Ny migrasjon gjør det samme for `program_items`.
- `src/styles.css` -- `.split-admin`, `.form-stack`, `.admin-row`, `--tap-min`. Legg mobilregler og feilstil.
- `tests/tripEdit.test.js` -- NY. `tests/purity.test.js` -- legg til `tripEdit.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/tripEdit.js` -- `validateChange` (beslutning 2 og 3)
- [x] `tests/tripEdit.test.js`, `tests/purity.test.js` -- matriseradene som kan testes rent, og ren-liste
- [x] `src/context/TripContext.jsx` -- `updated_at` ved demo-lagring av program og poster (beslutning 5)
- [x] `src/pages/Admin.jsx` -- validering før lagring, feil ved feltene, felles melding og bekreftelse (beslutning 4 og 5)
- [x] `supabase/migrations/202611250005_story_5_1_program_updated_at.sql` -- `updated_at` og trigger, merket ukjørt (beslutning 7)
- [x] `src/styles.css` -- feilstil og mobilregler (beslutning 8)

**Acceptance Criteria:**
- Gitt en endring i en programpost eller post, når jeg lagrer og endringen er gyldig, så lagres den med ny `updated_at`, og jeg ser «Lagret. Deltakerne ser endringen nå.»
- Gitt at endringen er ugyldig, når jeg lagrer, så lagres ingenting, og feilen vises ved feltet.
- Gitt en post som har godkjente innsendinger, når jeg endrer poengene, så får alle lag som har løst posten de nye poengene, og ledertavlen oppdateres hos andre.
- Gitt Admin på en smal skjerm, så er skjemaet stablet og trykkflatene minst 44 px.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap). Patchet:
- high: `noValidate` fjernet nettleserens `required`, så tomme koordinater ble 0,0 og ble lagret — patchet (tomt felt blir NaN og avvises).
- medium: tom oppgavebeskrivelse og for lange tekster lagres, siden `validateTrip` ikke sjekker dem — patchet i `validateChange` (påkrevd beskrivelse, maks 120 og 1000 tegn), tester lagt til.
- medium: feil på felt uten feilvisning (for eksempel radius) blokkerte lagringen uten melding — patchet (blir felles melding).
- medium: uendrede felt kunne blokkere (en eldre programpost med gammel dato kunne ikke få ny tittel) — patchet, regelen om uendrede poeng er generalisert til alle felt.
- low: to overlappende meldinger når datoen flyttes utenfor perioden — patchet.
- low: feilmeldinger ble stående etter Avbryt — patchet.
- low: `FieldError`, `FormErrors` og `Saved` ble remontert ved hver rendering — patchet (kalles som funksjoner).
Avvist som low uten patch: opprydding av `updated_at` for gamle rader, to feilkanaler samtidig, `aria-live` på feltmeldinger, ID-en `ny-endring`, ekstra felt i oppdateringen, samtidig redigering fra to enheter.
Utsatt (deferred-work.md): ingen tester av Admin-lagringsløpet og av `updated_at` i demo-`write` (ingen DOM-oppsett).

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: endre en post til tom tittel og se feilen ved feltet, lagre en gyldig endring og se bekreftelsen, og sjekk at en ny poengsum vises på ledertavlen. Sjekk Admin på 390 px bredde. Live-delen (migrasjon, trigger, Realtime) kan ikke kjøres før Supabase finnes (Story 7.4).
