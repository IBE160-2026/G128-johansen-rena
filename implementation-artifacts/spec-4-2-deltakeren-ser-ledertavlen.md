---
title: 'Story 4.2: Deltakeren ser ledertavlen'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: 'e9822a28f9990d8b2111ac6e5b614cc1e3122178'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ledertavlen viser lagene med poeng, men uten lagfarge, uten felles plassering ved lik poengsum (to lag med like poeng får ulik plassering), og uten tekst som viser hvilket lag som er mitt (bare bakgrunnsfarge). Radene hopper uten animasjon, endringer annonseres ikke, og det finnes ingen måte å hente poengene på nytt for hånd.

**Approach:** En ren `rankStandings` i `scoring.js` gir plassering med delt plass ved lik poengsum. Ledertavlen viser plassering, lagfarge, navn og poeng, utheving av eget lag med tekst, animerte rader (FLIP) unntatt ved redusert bevegelse, og en skjult `aria-live`-melding når rekkefølgen endres. Dra-ned-for-å-oppdatere og en Oppdater-knapp henter poengene på nytt.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Plassering: lag med lik poengsum får samme plass, og neste lag hopper over (1, 1, 3). Rekkefølgen innen lik poengsum er alfabetisk (norsk), som i `standings`. (2) `rankStandings(standings)` i `scoring.js` er ren og legger `rank` på hvert lag og `tied: true` ved delt plass. Plassen vises som «1.», «2.» osv. i tekst. 🥇 vises bare for plass 1, og skjermlesere får teksten «1. plass». (3) Eget lag er uthevet med bakgrunn, en kantlinje i lagfargen og teksten «Ditt lag», aldri med farge alene. Lagfarge vises som en fargekant og stripe ved siden av navn og emoji (`teamColorToken` fra 4.1). (4) Poeng vises i `score`-stilen (`--text-score`). (5) Animasjon: rader som skifter plass glir til ny plass (FLIP, ca. 300 ms). Ved `prefers-reduced-motion: reduce` flyttes radene uten animasjon. (6) En skjult `aria-live="polite"`-region melder «Stillingen er oppdatert» og hvilken plass mitt lag har, bare når rekkefølgen eller plasseringen faktisk endres, ikke ved første visning. (7) Dra ned (berøring, øverst på siden, minst 70 px) og knappen «Oppdater» henter poengene på nytt via `refreshScores` i `TripContext`: live kaller `refresh`, demo leser demodata på nytt fra lagring. Under henting er knappen deaktivert og viser «Oppdaterer…». Feil vises i den vanlige feilmeldingen. (8) Uten nett vises «Stillingen vises ikke uten nett» som i dag, og ingen lag gir «Ingen lag ennå».

**Never:** Ingen sanntid (4.3), ingen bildegalleri (4.4). Ikke endre poengreglene, `teamScores` eller `standings`. Ikke endre migrasjoner eller seed. Ikke legg til nye avhengigheter.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Vanlig stilling | Poeng 30, 20, 10 | Plass 1, 2, 3 med lagfarge, navn og poeng | N/A |
| Lik poengsum | To lag med 20 poeng | Begge plass 2 (eller 1), alfabetisk, neste lag plass 4 | N/A |
| Alle null | Ingen godkjente | Alle plass 1, alfabetisk | N/A |
| Mitt lag | Jeg er på lag B | Raden har «Ditt lag», kantlinje og utheving | N/A |
| Uten lag / arrangør | Ingen `team_id` | Ingen rad uthevet, ingen «Ditt lag» | N/A |
| Plassering endres | Godkjenning flytter lag opp | Rader glir til ny plass, og live-regionen melder endringen | Redusert bevegelse: ingen glid |
| Første visning | Siden åpnes | Ingen melding i live-regionen | N/A |
| Hent på nytt | Dra ned eller «Oppdater» | Poeng hentes, knapp deaktivert under henting | Feil vises, knappen kan brukes igjen |
| Ingen lag / tom liste | `[]` eller `null` | «Ingen lag ennå», ingen krasj | N/A |
| Uten nett | `offline` | Teksten om at stillingen ikke vises | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Leaderboard.jsx` -- dagens ledertavle (rader, `my-team`, `aria-live` på containeren). Bygges om.
- `src/lib/scoring.js` -- har `standings` og `teamScores`. Legg `rankStandings` ved siden av. Ikke endre de andre.
- `src/lib/teams.js` -- `teamColorToken(team, teams)` fra 4.1.
- `src/context/TripContext.jsx` -- `refresh` (live) og `loadDemo` (demo). Legg `refreshScores` i `value`.
- `src/styles.css` -- `.leaderboard`, `.leader-row`, `.my-team` (linje 24), `--text-score`, `--team-1..6`. Legg lagstripe, «Ditt lag»-merke og animasjon.
- `tests/scoring.test.js` -- eksisterende tester. Legg tester for `rankStandings` (ny fil `tests/ranking.test.js` er også greit).
- `src/hooks/` -- finnes ikke. Pull-to-refresh og FLIP ligger i `Leaderboard.jsx` eller en liten lokal hook.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/scoring.js` -- `rankStandings` med delt plass -- beslutning 1 og 2
- [x] `tests/ranking.test.js` -- matriseradene som kan testes rent (lik poengsum, alle null, tom liste, `null`)
- [x] `src/context/TripContext.jsx` -- `refreshScores` for live og demo -- beslutning 7
- [x] `src/pages/Leaderboard.jsx` -- plassering, lagfarge, «Ditt lag», animasjon, live-melding, dra-ned og Oppdater-knapp -- beslutning 3 til 8
- [x] `src/styles.css` -- lagstripe, «Ditt lag», glid, `prefers-reduced-motion`, skjult live-region
- [x] `tests/purity.test.js` -- ingen ny ren fil (scoring.js er allerede med)

**Acceptance Criteria:**
- Gitt Ledertavle-fanen, når den åpnes, så vises lagene rangert etter poeng med plassering, lagfarge, navn og poeng, og mitt eget lag er uthevet med teksten «Ditt lag».
- Gitt at plasseringene endres, når ledertavlen oppdateres, så flyttes radene med animasjon (ikke ved redusert bevegelse) og endringen annonseres via `aria-live="polite"`.
- Gitt at jeg drar ned og slipper (eller trykker Oppdater), så hentes poengene på nytt.
- Gitt to lag med lik poengsum, så får de samme plassering og står alfabetisk.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap). Patchet:
- medium: pull-gest og knapp mangler sperre ved `offline` (Leaderboard.jsx) — patchet i `reload`.
- low: `touchcancel` og flere berøringspunkter nullstiller ikke gesten — patchet.
- medium: 🥇 til alle lag når alle har 0 poeng — patchet (bare når poeng > 0).
- medium: `rankStandings` ga feil plass for usortert input og NaN — patchet (sammenligner med laget foran), test lagt til.
- low: stripe og kantlinje i lagfargen tegnes dobbelt — patchet (kantlinjen fjernet).
Avvist som false: melding ved første visning (TripRoute viser lasteskjerm til data finnes), ingen animasjon ved omsortering blant like lag (signaturen inneholder rekkefølgen), manglende lastetilstand (samme grunn), stille retur uten userId (utilgjengelig i live).
Avvist som low uten patch: vertikalitetssjekk i dra-gest, FLIP midt i en animasjon, «delt» kun for skjermlesere, hint for medlem uten lag.
Utsatt (deferred-work.md): ingen komponenttester (ingen DOM-oppsett), «Oppdateres live»-merket før 4.3.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: åpne Ledertavle som deltaker, se «Ditt lag» og lagfarge. Godkjenn en innsending som arrangør, hent på nytt og se at plassering og melding endres. Sjekk delt plass ved lik poengsum.
