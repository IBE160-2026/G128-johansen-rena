---
title: 'Story 3.6: Poeng beregnes fra godkjente innsendinger'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: '8e9f0a05dc2d918498a73cde4a70022f12020fa1'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Poengberegningen ligger inne i `core.js` (`standings`) uten egne regler eller tester, telle `completed` per innsendingsrad i stedet for per post, og live-modus har ingen `team_scores`. Poeng kan bli ulike i demo og live, og arrangøren kan lagre en post med negative poeng.

**Approach:** Flytt poengregnskapet til en ren `scoring.js` med AD-5-reglene: bare godkjente innsendinger teller, med postens gjeldende poeng, maks én gang per lag og post. Legg `team_scores` som en visning i databasen (med tilgang bare til egen tur) og en delt tabell med testtilfeller som regelen verifiseres mot. Valider poeng slik at tomme og negative verdier avvises, også når arrangøren redigerer en post.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) `scoring.js` i `src/lib/` er ren (ingen avhengigheter utover seg selv) og eksporterer `teamScores` og `standings`. `core.js` re-eksporterer `standings`, så eksisterende kode virker. (2) Regelen: lagets poeng er summen av gjeldende `points` på poster der laget har minst én godkjent innsending. Duplikate godkjente rader for samme lag og post teller én gang. `completed` er antall ulike poster. Ventende og avviste teller ikke. Deaktiverte poster teller fortsatt. En innsending til en ukjent post gir 0. Ugyldige poeng på en post (negative, ikke tall) regnes som 0 slik at summen aldri blir negativ. Rader for lag som ikke finnes, ignoreres. (3) Sortering: poeng synkende, deretter lagnavn (norsk rekkefølge). (4) Delt fasit: `tests/fixtures/scoring-cases.json` brukes av JS-testene nå, og skal brukes mot `team_scores` når en database finnes (Story 7.4). (5) Migrasjon `supabase/migrations/202611250003_story_3_6_team_scores.sql` (ukjørt): en unik delindeks for godkjente innsendinger per lag og post, visningen `team_scores` med `security_invoker = true` (så RLS gjelder og en deltaker bare ser egen tur), og lesetilgang bare for innloggede. (6) `pointsError(value)` i `validate.js` er felles regel for poeng (heltall 1 til 500) og brukes av `validateTrip` og av arrangørens postskjema i Admin. (7) Laget-fanen viser lagets poengsum, og endrer arrangøren poengene på en post, får alle lag som har løst den de nye poengene.

**Never:** Ingen lagring av poeng per lag eller innsending (AD-5). Ikke endre godkjenningsflyten (3.5) eller opplåsing. Ikke endre seed. Ikke endre eksisterende migrasjoner.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Blandet | Godkjent, ventende og avvist innsending | Bare den godkjente teller | N/A |
| To godkjente på samme post | Duplikate godkjente rader for lag og post | Postens poeng teller én gang, `completed` er 1 | N/A |
| Poeng endres | Post går fra 10 til 25 etter godkjenning | Alle lag som har løst den får 25 | N/A |
| Deaktivert post | Godkjent innsending på deaktivert post | Teller fortsatt | N/A |
| Ukjent post | Godkjent innsending uten post | 0 poeng, ingen krasj | N/A |
| Ugyldige poeng på post | Negative, tekst eller manglende | Regnes som 0, aldri negativ sum | N/A |
| Andre lag | Godkjent innsending fra et annet lag | Teller ikke for dette laget | N/A |
| Ingen innsendinger | Tom liste | 0 poeng for alle lag | N/A |
| Uavgjort | To lag med like mange poeng | Sortert på navn | N/A |
| Poengregel i utkast | Tomme, negative eller for store poeng | `validateTrip` avviser, og Admin-skjemaet lagrer ikke | Forklaring vises |
| To turer (live) | Deltaker leser `team_scores` | Bare rader for egen tur | RLS (ukjørt) |

</frozen-after-approval>

## Code Map

- `src/lib/core.js` -- `standings(teams, checkpoints, submissions)`: summerer godkjente per innsendingsrad, `completed` er antall rader. Flyttes til `scoring.js` og re-eksporteres.
- `src/context/TripContext.jsx` -- `leaderboard` (`useMemo` av `standings`). Uendret bruk.
- `src/pages/Team.jsx`, `Leaderboard.jsx` -- bruker `leaderboard` og viser poeng. Uendret.
- `src/lib/validate.js` -- poengsjekk i `validateTrip` (heltall 1 til 500). Trekk ut `pointsError`.
- `src/pages/Admin.jsx` -- `saveTask` (rundt linje 40) lagrer `Number(taskForm.points)` uten kontroll. Skal bruke `pointsError`.
- `supabase/migrations/202610280001_initial.sql` -- unik delindeks for aktive innsendinger finnes. Ny migrasjon legges ved siden av.
- Nye: `src/lib/scoring.js`, `tests/scoring.test.js`, `tests/fixtures/scoring-cases.json`, migrasjonsfilen.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/scoring.js`, `src/lib/core.js` -- `teamScores`, `standings`, re-eksport -- AD-5
- [x] `tests/fixtures/scoring-cases.json`, `tests/scoring.test.js` -- delt fasit og regler fra matrisen -- AC
- [x] `src/lib/validate.js`, `src/pages/Admin.jsx` -- `pointsError` i validering og postskjema -- beslutning 6
- [x] `supabase/migrations/202611250003_story_3_6_team_scores.sql` -- indeks, visning og tilgang, merket ukjørt -- AD-5, AD-8
- [x] `tests/purity.test.js` -- legg `scoring.js` i listen over rene filer

**Acceptance Criteria:**
- Gitt godkjente, ventende og avviste innsendinger, også flere godkjente på samme post, når poengene beregnes, så teller bare postens poeng for godkjente innsendinger, maks én gang per lag og post, med samme svar på de delte testtilfellene.
- Gitt at postens poeng endres etter godkjenning, når poengene beregnes, så får alle lag som har løst posten de nye poengene.
- Gitt poengregler med tomme eller negative verdier, når de valideres, så avvises de.
- Gitt Laget-fanen, når den åpnes eller oppdateres, så vises lagets poengsum.

## Implementation Notes

- `src/lib/scoring.js` (ren): `pointsOf` (ugyldige poeng er 0), `teamScores` (Map lag til poeng og antall løste poster) og `standings` (sortert på poeng, så norsk lagnavn). Regelen: bare godkjente, maks én gang per lag og post, postens gjeldende poeng, deaktiverte poster teller, ukjent post og ukjent lag gir ingenting. `core.js` re-eksporterer `standings`. `completed` teller nå ulike poster, ikke rader.
- Delt fasit i `tests/fixtures/scoring-cases.json` (11 tilfeller) som JS-testene kjører, og som `team_scores` skal gi samme svar på i Story 7.4.
- `pointsError` i `validate.js` er felles regel (heltall 1 til 500) for `validateTrip` og for postskjemaet i Admin. Skjemaets `min` er 1. Tester for tomme, negative, 0, desimaler, tekst og over 500.
- Migrasjon `202611250003_story_3_6_team_scores.sql` (**UKJØRT**): unik delindeks for godkjente per lag og post, visningen `team_scores` med `security_invoker = true` (en deltaker ser bare egen tur via RLS) og lesetilgang bare for innloggede.
- 617 tester grønne etter review (36 nye i `tests/scoring.test.js`). Verifisert i headless Chrome med to faner: godkjent innsending gir 20 poeng i ledertavle og Laget-fanen, endring av postens poeng fra 20 til 35 gir 35 begge steder, og Admin avviser -5 og tomt (med nettleserens egen sperre av og på).
- Etter review: `pointsFromInput` (bare siffer), en eldre post med 0 poeng kan redigeres uten å endre poengene, poster med innsendinger kan ikke slettes, `scoring.js` tåler tomme og doble oppføringer, og fasiten merker tilfeller som bare finnes i JS (`jsOnly`).
- Ikke prøvd: visningen og tilgangen mot en database (ingen Supabase-instans).

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | En eldre post med 0 poeng kan ikke lagres for andre endringer, siden `min` er 1 (alle tre) | medium | patch | Admin hopper over poengsjekken når poengene ikke er endret. Databasen tillater fortsatt 0 til 500. |
| 2 | Poeng fra tekstfeltet godtar `0x10`, `1e2` og mellomrom via `Number()` (edge) | medium | patch | `pointsFromInput` (ren) godtar bare siffer. Tester. |
| 3 | Delt fasit inneholder tilfeller som ikke kan finnes i databasen (blind, edge) | medium | patch | Tilfellene er merket `jsOnly`, og migrasjonen sier at bare de øvrige kjøres mot viewet i Story 7.4. Test på at det finnes delte tilfeller. |
| 4 | Sletting av en post med innsendinger får poengene til å forsvinne i demo (blind) | medium | patch | `hasSubmissions` stopper slettingen med forklaring (AD-13). Test. |
| 5 | Null i listene, dobbel lag-id og dobbel post-id gir krasj eller dobbeltrader (edge) | medium | patch | Tomme oppføringer hoppes over, og første oppføring gjelder. Tester. |
| 6 | Uavgjort mellom flere lag, og skjøre testsjekker på `issues[0]` (blind) | low | patch | Test for sortering med fire lag, og testene bruker `some` i stedet for første feil. |
| 7 | Redundant `known`-sett, og fasiten er uleselig (blind) | low | patch | Forenklet, og fasiten har ett tilfelle per linje. |
| 8 | `core.js` har ikke lenger lokal binding til `standings` (edge) | false | reject | `core.js` bruker ikke `standings` selv (sjekket). Eksporten virker for alle som importerer. |
| 9 | Poeng over 500 eller desimaler telles i JS, men ikke i databasen (edge) | low | reject | Databasen kan ikke inneholde slike verdier, så avviket kan ikke oppstå. |
| 10 | Kryss-tur-data i `scoring.js` (edge) | low | reject | Funksjonene får data for én tur. Visningen filtrerer på tur. |
| 11 | Den nye unike indeksen er overflødig og kan feile på eksisterende data (blind, edge, claim) | low | reject | Den eksisterende indeksen for ventende og godkjente gjør to godkjente umulige, så den nye kan ikke feile. Den er en bevisst, billig gjentakelse (spec-beslutning 5), og kommentaren i migrasjonen sier det. |
| 12 | `security_invoker` kan skjule andre lags poeng (blind, edge) | false | reject | `submissions_read` er turbred (`is_member(trip_id)`), ikke lagvis (initial-migrasjonen). Verifiseres likevel i Story 7.4. |
| 13 | `completed` endrer betydning til ulike poster (edge) | low | reject | Bevisst (spec). Laget og ledertavlen viser «godkjente», som nå er riktig. |
| 14 | Admin-feilsti og Laget-fane er ikke testet automatisk (verification-gap, edge, claim) | medium | defer | Ingen React-testoppsett. Reglene er rene og testet, og stien er verifisert i Chrome (feilmelding og 20 til 35 poeng). |
| 15 | Visningen og indeksen er ikke kjørt mot en database (verification-gap, blind) | medium | defer | Ingen Supabase-instans. Fasiten kjøres mot `team_scores` i Story 7.4. |
| 16 | Feil antall i notatene (27 mot 28) (claim) | low | patch | Rettet. |

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome (demo): endre poeng på en løst post og se at ledertavle og Laget-fanen følger med, og at Admin avviser negative poeng.
