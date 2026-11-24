---
title: 'Story 3.4: Deltakeren sender bilde som svar'
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

**Problem:** Innsendingsvinduet i malen tar bare imot et bilde. Det har ikke noe notat (databasen forventer det), godtar flere filtyper og opptil 8 MB uten å komprimere, viser ingen kvittering, og Laget-fanen viser ikke hva laget har sendt inn.

**Approach:** Innsending krever både bilde og et notat på minst 3 tegn. Bildet komprimeres i klienten til maks 1600 px, og bare JPEG, PNG og WebP under 15 MB før komprimering godtas. Etter sending viser vinduet «Sendt! Venter på godkjenning fra arrangøren.» med en Venter-chip, først når serveren har bekreftet. Feiler sendingen, vises «Ingen dekning. Prøv igjen når du har nett.», og bildet og notatet blir stående. Laget-fanen viser lagets innsendinger med status. En ny migrasjon sikrer at databasen håndhever reglene.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Notatet er 3 til 1000 tegn etter trim. (2) Gyldige filtyper er JPEG, PNG og WebP. Maks 15 MB før komprimering (`validateImage` i `core.js` endres, også galleriet bruker den). (3) Live: bildet komprimeres til maks 1600 px på lengste side og lastes opp som JPEG til `trip-media/{trip_id}/{user_id}/…`. Demo: bildet krympes videre så det passer i localStorage (som i dag, maks ca. 380 kB), og dette er en bevisst forskjell. (4) Send er deaktivert til både bilde og gyldig notat er fylt ut, og knappen viser en spinner mens den sender. (5) Kvitteringen vises først når `submit` har fullført (i live: serveren har bekreftet). Feiler det, beholdes bilde og notat, og meldingen er «Ingen dekning. Prøv igjen når du har nett.» for nettfeil (`isNetworkError`) og feilteksten ellers. (6) Laget-fanen lister lagets innsendinger (post, notat, tid, status med ikon og tekst), nyeste først. (7) Ren logikk (`validateNote`, `canSendSubmission`, `scaleToFit`) i `src/lib/submission.js` med tester. Billedkomprimeringen (`compressImage`) bruker lerret og ligger i en egen fil. (8) Migrasjon `supabase/migrations/202611250001_story_3_4_submissions.sql` (nye kolonner på `checkpoints`, eksplisitt `ON DELETE RESTRICT`, notat påkrevd for nye rader i innsettingsregelen, bucket med bare JPEG, PNG og WebP). Den kan ikke kjøres uten en Supabase-instans og er derfor ikke prøvd.

**Never:** Ingen godkjenning eller avvisning (Story 3.5), ingen poengberegning (3.6), ingen opplåsingsregler utover det 3.2 gjør. Ikke endre `validate.js` eller seed. Ikke endre migrasjoner som allerede finnes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig innsending | Bilde og notat på 3 tegn eller mer | Spinner, så «Sendt! Venter på godkjenning fra arrangøren.» og Venter-chip | N/A |
| Uten notat eller kort notat | Notat med under 3 tegn etter trim | Send er deaktivert | N/A |
| Uten bilde | Notat, men ingen fil | Send er deaktivert | N/A |
| For langt notat | Over 1000 tegn | Avvises med forklaring | N/A |
| Feil filtype | GIF, HEIC, tekstfil | Avvises med forklaring, ingenting sendes | Ingen krasj |
| For stor fil | Over 15 MB | Avvises med forklaring før komprimering | Ingen krasj |
| Stort bilde | 4000×3000 px | Komprimeres til maks 1600 px på lengste side | N/A |
| Nettfeil | Sendingen feiler uten nett | «Ingen dekning. Prøv igjen når du har nett.», bilde og notat blir stående, ingen kvittering | Ingen krasj |
| Annen feil | Server avviser | Feilteksten vises, bilde og notat blir stående | Ingen krasj |
| Dobbelt trykk | Trykk på Send to ganger raskt | Bare én innsending | N/A |
| Laget har levert | Åpner Laget-fanen | Innsendinger med status Venter, Godkjent eller Avvist | N/A |
| Ingen innsendinger | Laget har ikke levert | Tom-melding | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Rebus.jsx` -- innsendingsvinduet (`selected`, `photo`, `send`) uten notat, kvittering eller spinner. Skal få notat, tilstander (skriver, sender, sendt) og feilmeldinger.
- `src/context/TripContext.jsx` -- `submit(checkpointId, file)`: validerer bilde, demo lagrer data-URL, live laster opp originalfilen (`uploadPhoto`) og setter inn rad uten notat. Skal få `note` og komprimering.
- `src/lib/core.js` -- `validateImage` (JPEG, PNG, WebP, GIF, HEIC, HEIF, maks 8 MB). Endres.
- `src/lib/demoImage.js`, `src/lib/api.js` -- bruker `validateImage`. Behold bruken.
- `src/lib/tripCache.js` -- `isNetworkError`. Gjenbruk.
- `src/pages/Team.jsx` -- Laget-fanen. Skal liste innsendinger.
- `supabase/migrations/` -- `202610280001_initial.sql` og `202610280002_rebus_photo_submissions.sql` finnes. Ny migrasjon legges ved siden av.
- Nye: `src/lib/submission.js`, `src/lib/image.js`, `tests/submission.test.js`, migrasjonsfilen.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/submission.js` -- `validateNote`, `canSendSubmission`, `scaleToFit`, meldinger -- ren logikk
- [ ] `src/lib/core.js`, `tests/core.test.js` -- JPEG, PNG og WebP, maks 15 MB -- beslutning 2
- [ ] `src/lib/image.js` -- `compressImage` (lerret, maks 1600 px, JPEG) -- AD-11
- [ ] `src/context/TripContext.jsx` -- `submit(id, file, note)` med notat, komprimering i live og notat i demo -- beslutning 1 og 3
- [ ] `src/pages/Rebus.jsx`, `src/styles.css` -- notatfelt, deaktivert Send, spinner, kvittering med Venter-chip, nettfeilmelding -- UX-DR6, UX-DR15
- [ ] `src/pages/Team.jsx` -- lagets innsendinger med status -- AC
- [ ] `supabase/migrations/202611250001_story_3_4_submissions.sql` -- som beskrevet, merket ukjørt -- AD-7, AD-13
- [ ] `tests/submission.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt en opplåst eller åpen post, når jeg legger ved bilde og notat på minst 3 tegn og trykker Send, så blir knappen en spinner, innsendingen opprettes som ventende, og jeg ser «Sendt! Venter på godkjenning fra arrangøren.» med en Venter-chip først når den er bekreftet. Feiler den, står bilde og notat igjen.
- Gitt en fil som ikke er JPEG, PNG eller WebP, eller som er større enn 15 MB, når jeg prøver å sende den, så avvises den med en forklaring.
- Gitt Laget-fanen, når den åpnes, så ser jeg lagets innsendinger med status.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome (demo): åpen post, bilde og notat, kvittering, Laget-fanen, avviste filer, nettfeil.
