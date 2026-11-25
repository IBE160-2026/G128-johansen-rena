# Epic 5 Context: Arrangøren justerer turen underveis

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Arrangøren kan endre, legge til og deaktivere programposter og poster på en tur som pågår, fra mobilen, og deltakerne ser endringene med en gang. Poeng laget har fått, må ikke forsvinne når en post endres eller deaktiveres.

## Stories

- Story 5.1: Arrangøren endrer en publisert tur
- Story 5.2: Arrangøren legger til nye poster og programposter underveis
- Story 5.3: Arrangøren deaktiverer en post
- Story 5.4: Deltakerne ser endringer med en gang

## Requirements & Constraints

- Endringer valideres i klienten med `validateTrip()` før hver lagring. Ugyldig endring lagres ikke, og feilen vises ved feltet. Bekreftelsen etter lagring er «Lagret. Deltakerne ser endringen nå.»
- Endrer arrangøren poengene på en post, får alle lag som har løst den de nye poengene, og ledertavlen oppdateres hos alle innen 5 s.
- Deaktiverte poster avviser nye innsendinger (UI og RLS), men godkjente innsendinger teller fortsatt. Poster med innsendinger kan ikke slettes.
- Deltakere ser endringer innen 5 s, med merket «Endret» per element og banneret «Programmet er oppdatert.»

## Technical Decisions

- Turstruktur skrives direkte mot databasen med RLS og CHECK som hardt vern (AD-17). Det finnes ingen `save-trip` eller `trips.version`, og to enheter som lagrer samtidig overskriver hverandre.
- `program_items` og `checkpoints` har `updated_at` satt av en trigger (AD-13). `checkpoints` har fått den, `program_items` mangler den.
- Sanntid er et signal om å hente på nytt (AD-10, AD-16): Supabase Realtime i live og `BroadcastChannel` i demo, som Story 4.3 bygde. «Endret» regnes lokalt per enhet: `seen[element_id]` og `baseline_at` (AD-16).
- `validateTrip` forventer `{ trip (med area), program_items, checkpoints, teams }`. Appens data heter `program` (ikke `program_items`), og live henter ikke `trips.area`.
- Rene funksjoner i `src/lib/` med `node:test`. Alle databasekall går gjennom `TripContext` og `api.js`.

## UX & Interaction Patterns

- Rediger underveis er mobil først, med «+ Post», «+ Programpost», «Deaktiver» og «Aktiver igjen».
- Deaktivert post: nedtonet markør med rød kant og chipen «Deaktivert». Status vises aldri bare med farge.

## Cross-Story Dependencies

- 5.1 gir validering og `updated_at` som 5.2, 5.3 og 5.4 bruker. 5.4 bygger på signalet fra 4.3.
- Turoversikt, Utkast og publisering (Epic 2) er ikke bygget. Epic 5 bygges på dagens Admin-side til Epic 2 kommer.
