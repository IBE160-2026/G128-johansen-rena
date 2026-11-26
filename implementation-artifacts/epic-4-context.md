# Epic 4 Context: Lag, sanntids ledertavle og bilder

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Arrangøren fordeler deltakerne på lag, og lagene har hver sin farge. Deltakerne ser ledertavlen oppdatert innen 5 sekunder etter en godkjenning, og et galleri med turens bilder. Epicen kjøres i demo-modus først (sanntid via `BroadcastChannel`). Live-delene (Supabase Realtime, RLS, migrasjoner) skrives, men kan ikke kjøres før en Supabase-instans finnes.

## Stories

- Story 4.1: Arrangøren fordeler deltakerne på lag
- Story 4.2: Deltakeren ser ledertavlen
- Story 4.3: Ledertavlen oppdateres i sanntid
- Story 4.4: Deltakeren ser turens bilder

## Requirements & Constraints

- Arrangøren kan flytte en deltaker til et annet lag, og deltakeren ser det nye laget med lagfarge på Laget-fanen. Innsendinger blir hos laget som sendte dem, også etter at en deltaker er flyttet.
- Ledertavlen oppdateres hos alle innen 5 sekunder etter godkjenning (SM-5). Status og farge vises aldri bare med farge (ikon og tekst).
- Bilder er bare tilgjengelige for deltakerne på turen (signerte URL-er i live).

## Technical Decisions

- Lagfarge er et fargetoken `team-1` til `team-6` (CSS-variabler i `src/styles.css`). Seed-lagene har `color`. Databasen mangler kolonnen (migrasjon trengs), og lag uten farge får en farge etter rekkefølge.
- Alle databasekall går gjennom `src/lib/api.js` / `TripContext`. Demo lagrer i localStorage, live bruker Supabase med RLS. Sanntid er et signal om å hente på nytt (AD-10): `BroadcastChannel` i demo og Supabase Realtime i live. Poeng regnes av `scoring.js` (demo) og `team_scores` (live).
- Rene funksjoner i `src/lib/` med `node:test`.

## UX & Interaction Patterns

- Laget-fanen viser lagets navn, emoji og farge, og medlemmene. Ledertavlen viser lagfarge, poeng og eget lag uthevet (UX-DR7). Radene flyttes med animasjon, unntatt ved redusert bevegelse.

## Cross-Story Dependencies

- 4.1 gir lagfarge som 4.2 (ledertavle) og 4.3 (sanntid) bruker. 4.3 trenger signalet mellom faner som også 5.4 (endringer underveis) bygger på.
