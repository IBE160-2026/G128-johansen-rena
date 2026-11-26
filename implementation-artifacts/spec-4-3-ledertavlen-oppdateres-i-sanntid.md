---
title: 'Story 4.3: Ledertavlen oppdateres i sanntid'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: '55b5aeac75738851cdf7395fe4252d250856442f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ledertavlen oppdateres bare når deltakeren selv trykker Oppdater. I demo-modus finnes ingen sanntid mellom faner (arrangøren godkjenner i én fane, deltakeren ser ingenting), og ingen av modusene henter på nytt når et signal mangler og fanen får fokus igjen.

**Approach:** Demo sender et signal over `BroadcastChannel` når en fane har lagret en endring, og andre faner på samme tur leser demodata på nytt. Live bruker Supabase Realtime-abonnementet som allerede finnes (AD-10) og får samme fokus-henting. En ren `signal.js` bestemmer hva et signal betyr, og med testene.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Sanntid er et signal om å hente på nytt (AD-10). Data i signalet brukes aldri til å oppdatere poengene direkte. (2) Demo: kanalen heter `tripbuilder-demo`, og meldingen er `{ type: 'changed', tripId, sender }`. `sender` er en tilfeldig id for fanen. En fane ignorerer egne meldinger og meldinger for andre turer. (3) Bare lokale endringer sender signal. Data som en fane har lest på nytt etter et signal, lagres ikke på nytt og sender ikke nytt signal (ellers blir det en evig sløyfe). (4) Mottaker leser demodata fra lagring med `loadDemo` og beholder sin egen rolle (rolle ligger i `sessionStorage` per fane). (5) Fokus: når fanen blir synlig eller får fokus (`visibilitychange` til synlig, `focus`), hentes turen på nytt (live: `refresh`, demo: lagring). Henting skjer høyst hvert 2. sekund. (6) Live: Realtime-abonnementet i `TripContext` beholdes som det er (`submissions`, `checkpoints` m.fl.). Det legges ikke til polling. Ledertavlen viser ny sum innen 5 s via `team_scores`/`scoring.js` (SM-5). (7) Ledertavlens `aria-live`-melding fra 4.2 gjelder også ved sanntidsendringer. (8) Merket «Oppdateres live» står, siden ledertavlen nå faktisk oppdateres.

**Never:** Ikke bygg polling, nytt Realtime-abonnement eller ny tabell. Ikke endre poengregler, `scoring.js` eller `review.js`. Ikke bruk `storage`-hendelsen i stedet for `BroadcastChannel`. Ikke send hele turen i signalet. Ikke endre migrasjoner.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Godkjenning i demo | Arrangør godkjenner i fane A, deltaker har fane B åpen | B leser demodata på nytt og viser ny sum uten at siden lastes | N/A |
| Egen melding | Fane A får sin egen melding | Ignoreres | N/A |
| Annen tur | Melding med annen `tripId` | Ignoreres | N/A |
| Mottatt data | B har lest på nytt etter signal | B lagrer ikke og sender ikke nytt signal | N/A |
| Ugyldig melding | `null`, tekst eller manglende felt | Ignoreres uten krasj | N/A |
| Ingen `BroadcastChannel` | Nettleseren mangler støtte | Demo virker som før, og fokus-henting fungerer | Ingen feilmelding |
| Fokus | Fanen blir synlig igjen | Turen hentes på nytt | N/A |
| Hyppig fokus | To fokus innen 2 s | Én henting | N/A |
| Live-signal | Realtime melder endring | Turen hentes på nytt (som før) | Feil via `refresh` |
| Rydding | Siden forlates | Kanal og lyttere lukkes | N/A |

</frozen-after-approval>

## Code Map

- `src/context/TripContext.jsx` -- `refresh` (live), `loadDemo`/`saveDemo`-effekten rundt linje 89 (lagrer ved hver `data`-endring), Realtime-abonnementet rundt linje 103, og `refreshScores` fra 4.2. Her kobles kanal og fokus.
- `src/lib/signal.js` -- NY, ren: `makeMessage(tripId, sender)`, `isRelevant(message, tripId, sender)`, `throttle`-regel (`shouldRefreshNow(last, now, gap)`). Ingen avhengigheter.
- `src/lib/api.js` -- `loadDemo`, `saveDemo` (ikke endre).
- `src/pages/Leaderboard.jsx` -- viser nye plasseringer og melder dem (4.2). Ikke endre.
- `tests/signal.test.js` -- NY. `tests/purity.test.js` -- legg til `signal.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/signal.js` -- ren melding og regler (beslutning 2, 5) -- med tester for matriseradene
- [x] `tests/signal.test.js`, `tests/purity.test.js` -- tester og ren-liste
- [x] `src/context/TripContext.jsx` -- `BroadcastChannel` i demo (send etter lokal lagring, mottak leser på nytt uten å lagre igjen), fokus-henting i begge moduser, rydding -- beslutning 2 til 5

**Acceptance Criteria:**
- Gitt demo-modus og to faner (arrangør og deltaker), når arrangøren godkjenner, så viser deltakerfanen ny sum og plassering uten at siden lastes på nytt.
- Gitt at et signal mangler, når fanen får fokus igjen, så hentes poengene på nytt.
- Gitt live-modus og to klienter, når arrangøren godkjenner, så henter begge turen på nytt via Realtime og viser ny sum innen 5 s (kan ikke kjøres før Supabase finnes, Story 7.4).

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap). Patchet:
- medium: `crypto.randomUUID()` kaster over http på LAN-IP og krasjer hele `TripProvider` — patchet med reserve-id.
- medium: `loadDemo` kan kaste eller gi ugyldig data i `readDemoAgain` — patchet (try/catch og sjekk av `trip`).
- low: klokke som går bakover blokkerer henting — patchet i `shouldRefreshNow`, test lagt til.
- low: `isRelevant` uten typesjekk på egen `tripId`/`sender` — patchet, test lagt til.
Avvist som false: «live har ingen sanntid» (Realtime-abonnementet finnes og er uendret etter beslutning 6), `storage`-hendelse som reserve (utelukket i spec), manglende `aria-live` (kommer fra 4.2).
Avvist som low uten patch: etterfølgende henting etter throttle, `lastFetchRef` stemples før henting, bølge av signaler, tom streng som id, `resetDemo` regnes som lokal (ønsket).
Utsatt (deferred-work.md): ingen tester av koblingen i `TripContext`, og en lest-på-nytt-henting kan overskrive en lagring som feilet.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome med to faner i demo: arrangør godkjenner i fane A, fane B (deltaker) viser ny sum uten reload. Sjekk at ingen sløyfe oppstår (ingen gjentatte lagringer).
