---
title: 'Story 3.5: Arrangøren godkjenner eller avviser'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: '4a95851ccb0c630da871aa094da3fc107b9b0b8e'
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
- [x] `src/lib/review.js` -- `applyReview`, `normalizeReason`, `createDecisionQueue` -- ren logikk
- [x] `src/context/TripContext.jsx` -- `review(id, status, reason)` idempotent, demo og live -- AD-7
- [x] `src/pages/Admin.jsx`, `src/styles.css` -- kø med notat, tid, begrunnelse, 5 s forsinkelse og Angre, tom kø -- UX-DR8
- [x] `src/lib/core.js`, `src/components/PostMap.jsx` -- `reason` og `done` i status, fullført markør -- UX-DR4
- [x] `src/pages/Rebus.jsx`, `src/pages/Team.jsx`, `src/pages/Home.jsx` -- begrunnelse til deltaker og teller til arrangør -- AC
- [x] `supabase/migrations/202611250002_story_3_5_review.sql` -- kolonne og begrenset oppdatering, merket ukjørt -- AD-7
- [x] `tests/review.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt ventende innsendinger, når arrangøren åpner køen, så ser hen en teller og kort med svar, lag, post og tid, og en tom kø sier «Alt er godkjent. Godt jobbet!».
- Gitt et kort, når arrangøren trykker Godkjenn eller Avvis, så sendes beslutningen etter 5 s, og Angre innen da sender ingenting. Samme beslutning to ganger endrer ingenting.
- Gitt en avvist innsending, når deltakeren ser den, så vises Avvist med begrunnelse, og laget kan sende inn på nytt. En godkjent innsending gir posten tilstanden fullført.

## Implementation Notes

- `src/lib/review.js` (ren): `normalizeReason` (trim, tom blir null, maks 500), `applyReview` (bare ventende kan avgjøres, samme beslutning gir samme liste uten endring, begrunnelse bare ved avvisning) og `createDecisionQueue` (forsinkelse på 5 s, Angre, erstatning, `flush`, injiserte tidtakere).
- `src/components/ReviewQueue.jsx` i Admin-fanen Innsendinger: kort med lag, post, poeng, tid, notat og bilde, begrunnelsesfelt, Godkjenn og Avvis, og «Godkjent/Avvist om N s» med Angre. Siden forlates: ventende beslutninger sendes med en gang (`flush` ved avmontering). Tom kø sier «Alt er godkjent. Godt jobbet!». Telleren står i fanen, i køen og som lenke på I dag for arrangøren (`?fane=inbox`).
- `TripContext.review(id, status, reason)` er idempotent via `applyReview`. Live skriver `status` og `rejection_reason`.
- `checkpointStatus` gir også `reason` og `done`. Fullført post har ✓ og grønn markør. Begrunnelsen vises på postkortet, i kortgriden og i Laget-fanen.
- Migrasjon `202611250002_story_3_5_review.sql` (**UKJØRT**): kolonnen `rejection_reason`, oppdatering begrenset til `status` og `rejection_reason`, og en trigger som bare lar ventende innsendinger avgjøres.
- 581 tester grønne etter review (33 nye i `tests/review.test.js` og `tests/posts.test.js`, inkludert forsinkelseskø med falsk tid og asynkron sending). Verifisert i headless Chrome med to faner (deltaker og arrangør): innsending, lenke og teller for arrangør, kort med notat og bilde, Avvis med begrunnelse, Angre sender ingenting, avvisning sendes etter 5 s, tom kø, deltaker ser Avvist med begrunnelse og kan sende på nytt, godkjenning gir fullført markør, og laget har 20 poeng én gang.
- Etter review: en avgjort innsending skrives aldri om, køen har sending-tilstand og feilhåndtering per kort, køen er alltid montert i Admin (så fanebytte ikke avbryter Angre) og sender også ved `pagehide`, og triggeren nekter endret begrunnelse.
- Ikke prøvd: live-skriving, RLS og migrasjonen (ingen Supabase-instans), og at en beslutning går tapt hvis nettleseren lukkes i de 5 sekundene.

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | En avgjort innsending kan skrives om med ny begrunnelse (rejected til rejected), i strid med «samme beslutning to ganger endrer ingenting» (alle tre, claim) | high | patch | `applyReview` skriver aldri om en avgjort innsending. Triggeren i migrasjonen nekter også endret begrunnelse. Tester. |
| 2 | Kortet kan avgjøres på nytt mellom sending og bekreftelse (edge) | high | patch | Køen har sending-tilstand (`isSending`) til `onCommit` er ferdig, og kortet viser «Sender …». Test. |
| 3 | En feil i én sending stopper flush, og avvisning blir uhåndtert (edge, blind) | high | patch | Køen fanger synkrone og asynkrone feil, kaller `onError` og fortsetter. Tester. |
| 4 | Feil vises ikke på riktig kort, og kortet blir ikke oppdatert etter en feil (edge, blind) | medium | patch | Feil vises på kortet (`errors`), og `review` henter turen på nytt også etter feil (`finally`). |
| 5 | Bytte av Admin-fane avbryter Angre-fristen (blind, edge, claim) | medium | patch | Køen er alltid montert (skjult), så bare å forlate Admin sender beslutningen. |
| 6 | Beslutning går tapt ved lukking eller omlasting (alle, claim) | medium | patch | `pagehide` sender ventende beslutninger (best effort). Det er fortsatt ikke garantert. |
| 7 | Et kort som er avgjort andre steder får en usynlig frist (edge) | medium | patch | Beslutninger for kort som ikke lenger er ventende, angres automatisk. |
| 8 | `fane`-lenken leses bare ved første visning (blind, edge) | low | patch | Effekt som følger søkeparameteren. |
| 9 | Hjem teller to ganger og krasjer uten `submissions` (blind, edge) | low | patch | Én verdi, med `?? []`. |
| 10 | Skrevet begrunnelse blir stående eller kastes uten hint (blind, edge) | low | patch | Felt nullstilles etter sending, og teksten sier at begrunnelsen bare brukes ved avvisning. |
| 11 | Nedtellingen leses opp hvert halve sekund og kjører uten behov (blind) | low | patch | Nedtellingen er skjult for skjermleser med en fast melding, og intervallet kjører bare når noe venter. |
| 12 | Triggerfunksjonen mangler `search_path` (edge) | low | patch | `set search_path = ''`. |
| 13 | `done` og `reason` har ingen test, og payloaden til databasen er ikke testet (verification-gap) | medium | patch | Tester for `done` og `reason`, og `buildReviewUpdate` (ren) brukes og testes. |
| 14 | `done` når siste rad ikke er godkjent selv om en godkjent finnes (edge) | low | reject | Umulig via appen: en godkjent post kan ikke leveres på nytt, og den unike indeksen holder aktive rader til én. |
| 15 | Kolonnebegrensningen kan stoppe andre oppdateringer av innsendinger (blind, edge) | low | reject | Bare arrangøren oppdaterer innsendinger i appen, og bare `status` (og begrunnelse). Migrasjonen er ukjørt og testes i Story 7.4. |
| 16 | Triggeren sjekker ikke at kalleren er arrangør (blind) | low | reject | RLS-regelen `submissions_update` (initial-migrasjonen) avgjør hvem. |
| 17 | `.post-marker.done` mangler stil, `.notice.danger` finnes ikke, ulik visning av begrunnelse, `timeOf` duplisert (blind) | false | reject | `.notice.danger` og `:before`-bakgrunnen finnes (verifisert at markøren får klassen `done`). Duplisering og ulik markup er kosmetikk. |
| 18 | Beslutning etter at rollen eller turen er byttet, parallelle sendinger mot gamle data (blind, edge) | low | reject | `review` sjekker arrangørrollen og er idempotent, og hver sending henter turen på nytt. |
| 19 | RLS, trigger, kolonnerettigheter og `review` mot live er ikke testet (verification-gap, blind) | medium | defer | Ingen Supabase-instans. Testes i Story 7.4. |

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome (demo): deltaker leverer, arrangør godkjenner og avviser med forsinkelse og Angre, deltaker ser begrunnelse og fullført markør.
