---
title: 'Story 3.5: Arrangøren godkjenner eller avviser'
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

**Problem:** Arrangøren kan godkjenne eller avvise i Admin, men beslutningen sendes med en gang uten mulighet til å angre, det finnes ingen begrunnelse, kortet viser ikke notat eller tid, og deltakeren ser verken begrunnelse eller at en post er fullført.

**Approach:** Godkjenningskøen (Admin, fanen Innsendinger) viser svar (bilde og notat), lag, post og tid, med en teller. Godkjenn eller Avvis (med valgfri begrunnelse) sendes først etter 5 sekunder, og «Angre» innen da sender ingenting. Deltakeren ser Avvist med begrunnelse og kan sende på nytt, og en post laget har fått godkjent vises som fullført på kartet.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Køen blir i Admin-fanen Innsendinger. Telleren («N venter») vises i fanen, i køen og som en lenke på I dag for arrangøren. (2) Beslutningen forsinkes 5 s. Den kan angres. Forlater arrangøren siden mens en beslutning venter, sendes den med en gang (den går ikke tapt), og lukkes nettleseren, er den ikke sendt. (3) Bare ventende innsendinger kan avgjøres fra køen. Samme beslutning to ganger endrer ingenting og skriver ingenting, og poengene telles én gang per lag og post (AD-5). (4) Begrunnelsen er valgfri, trimmes, og lagres som `rejection_reason` (høyst 500 tegn, tom blir null). Den vises til deltakeren på postkortet, i kortgriden og i Laget-fanen. (5) Status endres av arrangøren via RLS, ikke via RPC (AD-7). En ny migrasjon `202611250002_story_3_5_review.sql` (ukjørt) legger til `rejection_reason` og begrenser oppdatering til kolonnene `status` og `rejection_reason`. (6) En post der laget har en godkjent innsending vises som fullført (✓) på kartet, i tillegg til låst og åpen (UX-DR4). (7) Tom kø sier «Alt er godkjent. Godt jobbet!». (8) Rene funksjoner i `src/lib/review.js` (`applyReview`, `normalizeReason`, forsinkelseskø med injiserte tidtakere) med tester.

**Never:** Ingen endring av poengberegningen (Story 3.6). Ingen varsler til deltakeren utover det de ser i appen. Ikke endre `validate.js`, seed eller eksisterende migrasjoner. Arrangøren kan ikke redigere innholdet i en innsending.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kø med innsendinger | 4 ventende | Teller «4 venter», kort med bilde, notat, lag, post og tid | N/A |
| Godkjenn | Trykk Godkjenn | Kortet viser «Godkjent om 5 s» og Angre, så sendes beslutningen | Feil vises, kortet blir i køen |
| Avvis med begrunnelse | Skriver «Uskarpt bilde» og trykker Avvis | Etter 5 s lagres avvist og begrunnelsen | N/A |
| Avvis uten begrunnelse | Tomt felt | Lagres avvist uten begrunnelse | N/A |
| Angre | Trykk Angre innen 5 s | Ingenting sendes, kortet er som før | N/A |
| Samme beslutning to ganger | Godkjent innsending godkjennes igjen | Ingen skriving og ingen endring, poengene telles én gang | N/A |
| Forlater siden | Naviger bort med ventende beslutning | Beslutningen sendes med en gang | N/A |
| Deltaker ser avvist | Avvist med begrunnelse | Avvist-chip og begrunnelse, og laget kan sende inn på nytt | N/A |
| Fullført post | Laget har godkjent innsending | Markøren viser ✓ (fullført) | N/A |
| Tom kø | Ingen ventende | «Alt er godkjent. Godt jobbet!» | N/A |
| For lang begrunnelse | Over 500 tegn | Avvises med forklaring | N/A |
| Ikke arrangør | Deltaker forsøker å godkjenne | Ikke mulig i appen, og RLS avviser (live) | Ingen krasj |

</frozen-after-approval>

## Code Map

- `src/pages/Admin.jsx` -- fanen `inbox` (rundt linje 82): kort per ventende innsending med `Godkjenn` og `Avvis` som kaller `review(entry.id, status)` med en gang. `perform` pakker handlinger. Telleren finnes i fanen og i `pill`. Skal få forsinkelse, Angre, begrunnelse, notat og tid.
- `src/context/TripContext.jsx` -- `review(submissionId, status)` (rundt linje 233): demo oppdaterer lokalt, live `changeRecord('submissions', id, { status })`. Skal få `reason` og bli idempotent.
- `src/lib/core.js` -- `checkpointStatus` (gir `latest`, `submission`). Gi også `reason` og `done`.
- `src/components/PostMap.jsx` -- `markerIcon` (låst, opplåst, åpen). Legg til fullført.
- `src/pages/Rebus.jsx`, `src/pages/Team.jsx` -- viser innsendingsstatus. Legg til begrunnelse.
- `src/pages/Home.jsx` -- legg til lenke med teller for arrangøren.
- `supabase/migrations/` -- `202610280001_initial.sql` har `submissions_update` (arrangør). Ny migrasjon legges ved siden av.
- Nye: `src/lib/review.js`, `tests/review.test.js`, migrasjonsfilen.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/review.js` -- `applyReview`, `normalizeReason`, `createDecisionQueue` -- ren logikk
- [ ] `src/context/TripContext.jsx` -- `review(id, status, reason)` idempotent, demo og live -- AD-7
- [ ] `src/pages/Admin.jsx`, `src/styles.css` -- kø med notat, tid, begrunnelse, 5 s forsinkelse og Angre, tom kø -- UX-DR8
- [ ] `src/lib/core.js`, `src/components/PostMap.jsx` -- `reason` og `done` i status, fullført markør -- UX-DR4
- [ ] `src/pages/Rebus.jsx`, `src/pages/Team.jsx`, `src/pages/Home.jsx` -- begrunnelse til deltaker og teller til arrangør -- AC
- [ ] `supabase/migrations/202611250002_story_3_5_review.sql` -- kolonne og begrenset oppdatering, merket ukjørt -- AD-7
- [ ] `tests/review.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt ventende innsendinger, når arrangøren åpner køen, så ser hen en teller og kort med svar, lag, post og tid, og en tom kø sier «Alt er godkjent. Godt jobbet!».
- Gitt et kort, når arrangøren trykker Godkjenn eller Avvis, så sendes beslutningen etter 5 s, og Angre innen da sender ingenting. Samme beslutning to ganger endrer ingenting.
- Gitt en avvist innsending, når deltakeren ser den, så vises Avvist med begrunnelse, og laget kan sende inn på nytt. En godkjent innsending gir posten tilstanden fullført.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome (demo): deltaker leverer, arrangør godkjenner og avviser med forsinkelse og Angre, deltaker ser begrunnelse og fullført markør.
