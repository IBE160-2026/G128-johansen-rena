---
title: 'Story 4.1: Arrangøren fordeler deltakerne på lag'
type: 'feature'
created: '2026-11-25'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Arrangøren kan velge lag for en deltaker i Admin, men uten regler eller oversikt: ingen kontroll av at laget finnes, ingen antall per lag, og deltakeren ser verken lagfarge eller at innsendinger blir hos det gamle laget. Lagfarge finnes i seed, men vises ikke noe sted og finnes ikke i databasen.

**Approach:** Legg regler for lagfordeling i en ren `teams.js` (flytt deltaker, antall per lag, lagfarge med reserve). Admin-fanen Lag viser antall og farge per lag og flytter deltakere gjennom reglene. Laget-fanen viser lagets farge, navn og medlemmer. Innsendinger har `team_id` og blir hos laget som sendte dem. En migrasjon legger til lagfarge i databasen.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Bare arrangøren kan flytte. En deltaker kan flyttes til et lag som finnes i turen, eller til «Uten lag» (`team_id = null`). Å flytte til samme lag endrer ingenting og skriver ingenting. (2) Innsendinger endres aldri ved flytting: de har `team_id` for laget som sendte dem, og poengene følger laget, ikke personen. Laget-fanen viser det nye lagets innsendinger. (3) Lagfarge er et token `team-1` til `team-6`. Har et lag ingen gyldig farge (eldre data), brukes en farge etter plassen i lagrekkefølgen (`teamColorToken`). Farge brukes som aksent i tillegg til navn og emoji, aldri alene. (4) Admin-fanen Lag viser antall deltakere per lag og en tekst om at innsendinger blir hos laget som sendte dem. (5) Migrasjon `supabase/migrations/202611250004_story_4_1_team_color.sql` (ukjørt) legger til `color` på `teams` med gyldige tokens og fyller inn eksisterende lag i rekkefølge. (6) Rene funksjoner i `src/lib/teams.js` med tester.

**Never:** Ingen ny ledertavle (4.2) eller sanntid (4.3). Ikke opprett eller slett lag i denne storyen. Ikke endre innsendinger eller poengregler. Ikke endre `validate.js` eller seed.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Flytt til annet lag | Deltaker på lag A flyttes til B | `team_id` er B, og deltakeren ser lag B med farge og medlemmer | N/A |
| Uten lag | Flyttes til «Uten lag» | `team_id` er null, Laget-fanen sier «Ikke på lag» | N/A |
| Samme lag | Flyttes til laget hen allerede er på | Ingen endring og ingen skriving | N/A |
| Ukjent lag | `team_id` som ikke finnes i turen | Avvises med forklaring | Ingen endring |
| Ukjent deltaker | Id som ikke finnes | Avvises med forklaring | Ingen endring |
| Innsendinger | Deltaker med innsendinger flyttes | Innsendingene har uendret `team_id` og blir hos det gamle laget | N/A |
| Ikke arrangør | Deltaker forsøker å flytte | Ikke mulig i appen (live: RLS avviser) | Feilmelding |
| Lagfarge mangler | Lag uten `color` eller med ugyldig farge | Farge etter plass i rekkefølgen, og to lag får ikke samme farge for de seks første | N/A |
| Antall per lag | Fem deltakere fordelt på tre lag og én uten lag | Riktig antall per lag og for «Uten lag» | N/A |
| Tom turliste | Ingen lag eller deltakere | Ingen krasj | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Admin.jsx` -- fanen `teams` (rundt linje 91): en `select` per deltaker som kaller `write('members', { team_id }, member.id)` uten kontroll.
- `src/context/TripContext.jsx` -- `write(collection, record, id)` for medlemmer (`trip_members` i live). Legg `moveMember`.
- `src/pages/Team.jsx` -- Laget-fanen (lagnavn, medlemmer, poeng, innsendinger). Skal få lagfarge.
- `src/data/demo.js`, `src/seed/demo-trip.json` -- lag har `color` (`team-1`, `team-2`, `team-3`, `team-5`).
- `src/styles.css` -- har `--team-1` til `--team-6`.
- Nye: `src/lib/teams.js`, `tests/teams.test.js`, migrasjonsfilen.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/teams.js` -- `TEAM_COLORS`, `teamColorToken`, `moveMember`, `memberCounts` -- ren logikk
- [ ] `src/context/TripContext.jsx` -- `moveMember(memberId, teamId)` med regler, demo og live -- beslutning 1
- [ ] `src/pages/Admin.jsx`, `src/pages/Team.jsx`, `src/styles.css` -- antall og farge per lag, tekst om innsendinger, lagfarge på Laget-fanen -- AC
- [ ] `supabase/migrations/202611250004_story_4_1_team_color.sql` -- kolonne og utfylling, merket ukjørt -- beslutning 5
- [ ] `tests/teams.test.js`, `tests/purity.test.js` -- matriseradene som kan testes rent

**Acceptance Criteria:**
- Gitt Admin for en tur, når arrangøren flytter en deltaker til et annet lag, så oppdateres `team_id`, og deltakeren ser det nye laget med lagfarge på Laget-fanen.
- Gitt at en deltaker har innsendinger, når hen flyttes, så blir innsendingene værende hos laget som sendte dem.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome med to faner: arrangør flytter en deltaker, deltakeren ser nytt lag med farge, og innsendingene blir hos det gamle laget.
