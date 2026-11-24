---
title: 'Story 3.6: Poeng beregnes fra godkjente innsendinger'
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
- [ ] `src/lib/scoring.js`, `src/lib/core.js` -- `teamScores`, `standings`, re-eksport -- AD-5
- [ ] `tests/fixtures/scoring-cases.json`, `tests/scoring.test.js` -- delt fasit og regler fra matrisen -- AC
- [ ] `src/lib/validate.js`, `src/pages/Admin.jsx` -- `pointsError` i validering og postskjema -- beslutning 6
- [ ] `supabase/migrations/202611250003_story_3_6_team_scores.sql` -- indeks, visning og tilgang, merket ukjørt -- AD-5, AD-8
- [ ] `tests/purity.test.js` -- legg `scoring.js` i listen over rene filer

**Acceptance Criteria:**
- Gitt godkjente, ventende og avviste innsendinger, også flere godkjente på samme post, når poengene beregnes, så teller bare postens poeng for godkjente innsendinger, maks én gang per lag og post, med samme svar på de delte testtilfellene.
- Gitt at postens poeng endres etter godkjenning, når poengene beregnes, så får alle lag som har løst posten de nye poengene.
- Gitt poengregler med tomme eller negative verdier, når de valideres, så avvises de.
- Gitt Laget-fanen, når den åpnes eller oppdateres, så vises lagets poengsum.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome (demo): endre poeng på en løst post og se at ledertavle og Laget-fanen følger med, og at Admin avviser negative poeng.
