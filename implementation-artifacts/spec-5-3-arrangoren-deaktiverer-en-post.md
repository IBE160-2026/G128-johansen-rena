---
title: 'Story 5.3: Arrangøren deaktiverer en post'
type: 'feature'
created: '2026-11-26'
status: 'done'
baseline_commit: 'dd20287c3e7b60e6a13338de67549f5b584eed76'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Arrangøren kan ikke deaktivere en post fra Admin. Skjules en deaktivert post (`status = 'deactivated'`) i dag, forsvinner den helt for deltakerne, også for lag som har fått poeng på den, og ingenting hindrer en ny innsending på den (verken i UI, i `submit` eller i RLS). Sletting av en post med innsendinger stoppes bare av en melding i appen.

**Approach:** Admin får «Deaktiver» (med bekreftelse) og «Aktiver igjen» per post, og «Slett» bare for poster uten innsendinger. Deltakerne ser en deaktivert post nedtonet med rød kant og chipen «Deaktivert», uten oppgaven, mens lag som har fullført den, beholder hake og poeng. Nye innsendinger på en deaktivert post avvises i UI, i `submit` og i RLS.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-26): (1) `core.js` får `visibleCheckpoints(checkpoints)` (alle poster sortert på `position`, også deaktiverte). `activeCheckpoints` beholdes uendret og brukes til det som bare gjelder aktive poster (tellingen på I dag og posisjonssporing). Kart, postliste og postkort viser `visibleCheckpoints`, og nummeret følger plassen i hele listen. (2) `checkpointStatus` får `deactivated: boolean`. For en deaktivert post er `canSubmit` alltid `false`, også etter en avvisning. Har laget en godkjent innsending, vises «Godkjent» med hake som før, og chipen «Deaktivert» kommer i tillegg. Har laget ingen innsending, er etiketten «Deaktivert», `action` er `deactivated` («Deaktivert» på knappen, deaktivert knapp), og oppgaven er skjult (`canSeeTask: false`). Har laget en innsending (ventende, avvist eller godkjent), vises oppgaven som før. (3) Utseende: markøren er nedtonet med rød kant, og chipen «Deaktivert» vises med tekst (aldri bare farge) på markørens kort, i postlisten og på postkortene på Kart-siden. (4) `submit` i `TripContext` avviser en innsending på en deaktivert post med meldingen «Posten er deaktivert og tar ikke imot svar.» før noe lastes opp. (5) Poengene fra en deaktivert post teller fortsatt (AD-5, `scoring.js` er uendret). (6) Admin: «Deaktiver» ber om bekreftelse og lagrer `status: 'deactivated'` med `validateChange` og bekreftelsen fra 5.1. «Aktiver igjen» lagrer `status: 'active'`. Deaktiverte poster har chipen «Deaktivert» i listen. «Slett» vises bare for poster uten innsendinger, ellers står teksten «Har innsendinger: kan bare deaktiveres.» (7) Migrasjon `supabase/migrations/202611260001_story_5_3_deactivated_posts.sql` (ukjørt): `submissions_insert` får et krav om at posten har `status = 'active'` i samme tur. Fremmednøkkelen `ON DELETE RESTRICT` fra 3.4 er uendret.

**Never:** Ikke endre poengreglene, `scoring.js` eller `review.js`. Ikke gjør «Endret»-merke eller banner (5.4). Ikke legg til sletting av innsendinger. Ikke endre eldre migrasjoner.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Deaktivere | Arrangør trykker «Deaktiver» og bekrefter | Post får `status = deactivated`, bekreftelse vises | Avbrutt bekreftelse: ingenting skjer |
| Aktivere igjen | «Aktiver igjen» | Posten er aktiv igjen og får vanlig status | N/A |
| Lag uten innsending | Deaktivert post | Nedtonet, chip «Deaktivert», oppgave skjult, knapp deaktivert | N/A |
| Lag med godkjent | Deaktivert post, godkjent innsending | Hake og «Godkjent» vises, chip «Deaktivert», poengene teller | N/A |
| Lag med avvist | Deaktivert post, avvist innsending | Kan ikke sende på nytt, oppgave og begrunnelse vises | N/A |
| Lag med ventende | Deaktivert post, ventende innsending | Vises som ventende, kan fortsatt godkjennes av arrangøren | N/A |
| Ny innsending | `submit` på deaktivert post | Avvises uten opplasting | Melding «Posten er deaktivert…» |
| RLS | Direkte insert på deaktivert post | Avvises av databasen | N/A (live, ukjørt) |
| Sletting med innsendinger | Post med innsendinger | Ingen «Slett»-knapp, forklaring vises; databasen avviser også | N/A |
| Sletting uten innsendinger | Post uten innsendinger | «Slett» fjerner den | Bekreftelse først |
| Poeng | Deaktivert post med godkjente | Summen er uendret | N/A |
| Tom eller ugyldig liste | `null`, `undefined`, post uten status | Ingen krasj, post uten status regnes som aktiv | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/core.js` -- `activeCheckpoints` (linje ~126), `checkpointStatus` (~146), `SUBMISSION_STATUSES`. Legg `visibleCheckpoints` og `deactivated` i statusen. Ren, har tester i `tests/posts.test.js`.
- `src/components/PostMap.jsx` -- `activeCheckpoints` for markører og kort, `markerIcon` (klasser `done`/`lock`). Bruk `visibleCheckpoints`, klasse `deactivated`, chip og knapptekst for `action: deactivated`.
- `src/components/PostList.jsx`, `src/pages/Rebus.jsx` -- bruker `activeCheckpoints` (liste, kort, kart). Bytt til `visibleCheckpoints`, vis chip, hold sporing og tellinger på aktive poster.
- `src/pages/Home.jsx` -- tellingen «Rebusposter» bruker `activeCheckpoints` (beholdes).
- `src/context/TripContext.jsx` -- `submit` (linje ~265): legg avvisning av deaktivert post først.
- `src/pages/Admin.jsx` -- fanen `checkpoints`, listen over poster med «Rediger» og «Slett» (`destroy`). Legg Deaktiver, Aktiver igjen, chip og «Slett» bare uten innsendinger. `hasSubmissions` finnes i `scoring.js`.
- `src/styles.css` -- `.post-marker` (klasser `done`, `locked`, `unlocked`, `open`), `.status`. Legg `deactivated`.
- `supabase/migrations/202611250001_story_3_4_submissions.sql` -- `submissions_insert` og FK `RESTRICT` (les, ikke endre). Ny migrasjon erstatter innsettingsregelen.
- `tests/posts.test.js` -- legg tester for `visibleCheckpoints` og `checkpointStatus` med deaktivert post.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/core.js` -- `visibleCheckpoints` og `deactivated` i `checkpointStatus` (beslutning 1 og 2)
- [x] `tests/posts.test.js` -- matriseradene som kan testes rent
- [x] `src/context/TripContext.jsx` -- `submit` avviser deaktivert post (beslutning 4)
- [x] `src/components/PostMap.jsx`, `src/components/PostList.jsx`, `src/pages/Rebus.jsx`, `src/styles.css` -- nedtonet markør med rød kant, chip og knapptekst (beslutning 1 til 3)
- [x] `src/pages/Admin.jsx` -- Deaktiver, Aktiver igjen, chip og «Slett» bare uten innsendinger (beslutning 6)
- [x] `supabase/migrations/202611260001_story_5_3_deactivated_posts.sql` -- RLS-krav om aktiv post, merket ukjørt (beslutning 7)

**Acceptance Criteria:**
- Gitt en post med godkjente innsendinger, når arrangøren trykker «Deaktiver» og bekrefter, så får posten `status = deactivated`, poengene den har gitt teller fortsatt, og den kan ikke slettes.
- Gitt en deaktivert post, når en deltaker åpner den, så er markøren nedtonet med rød kant og chipen «Deaktivert» vises, oppgaven er skjult, nye innsendinger avvises (UI, `submit` og RLS), og lag som har fullført posten ser fortsatt hake og poeng.
- Gitt en deaktivert post, når arrangøren trykker «Aktiver igjen», så er den aktiv igjen.
- Gitt en post uten innsendinger, når arrangøren sletter den, så fjernes den.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss manuell sjekk i headless Chrome. Patchet:
- high: avvist innsending på deaktivert post viste «Avvist, prøv igjen» og knappen «Sendt inn», selv om ny innsending er sperret — patchet (etikett «Avvist, posten er stengt», knapp «Deaktivert»).
- medium: chipen «Deaktivert» manglet i postlisten og på Kart-kortene for ventende og avvist, og stod to ganger på kartkortet for lag uten innsending — patchet med felles regel `chip` i `checkpointStatus`.
- medium: en stengt post uten innsending sa «Posten er låst. Oppgaven vises når du er på stedet.» — patchet (teksten sier at posten er deaktivert).
- medium: avvisningen i `submit` hadde ingen test — flyttet til ren `acceptsSubmissions` i `core.js` med tester.
- medium: knappen Deaktiver og Aktiver igjen (status alene i `validateChange`) hadde ingen test — tester lagt til.
- low: skjermleser fikk ikke «deaktivert» på markører med ventende eller avvist — patchet.
- low: fast rød farge i stedet for `--danger`, og migrasjonen uten transaksjon — patchet.
Avvist som false: «poeng fra deaktiverte poster er ikke dekket» (fasit `scoring-cases.json` har det fra 3.6), «`hasSubmissions` er ikke vist» (finnes fra 3.6), «nummerering med deaktiverte poster er uklar» (tilsiktet).
Avvist som low uten patch: kontrast ved nedtoning, orphan-fil i lagring ved utdatert klient, `CHECK` på `checkpoints.status` (finnes fra 3.4), lagring av Lagret-melding ved feil.
Utsatt (deferred-work.md): Lagringsregelen for bildeopplasting kjenner ikke posten, og visningen av deaktiverte poster har ingen komponenttester.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: deaktiver en post med godkjent innsending og en uten, se Kart og Rebus som deltaker (nedtonet, chip, ingen oppgave for lag uten innsending, hake for laget som har løst den), prøv å sende inn, aktiver igjen, og slett en post uten innsendinger. Live-delen (RLS, FK) kan ikke kjøres før Supabase finnes (Story 7.4).
