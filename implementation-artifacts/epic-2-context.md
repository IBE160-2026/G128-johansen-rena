# Epic 2 Context: Arrangøren lager og publiserer en tur med KI

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Arrangøren beskriver en tur med noen få nøkkelfelt og egne ord, får et utkast fra KI (mock-agent i demo, Claude i Edge Function i live), redigerer det og publiserer turen med turkode, lenke og QR-kode. Demo-modus skal virke uten KI-nøkkel og uten Supabase.

## Stories

- Story 2.1: Arrangøren logger inn med magisk lenke (live, trenger Supabase)
- Story 2.2: Arrangøren beskriver en ny tur
- Story 2.3: Utkast genereres med mock-agenten
- Story 2.4: Utkast genereres med Claude i Edge Function (live, trenger Supabase)
- Story 2.5: Arrangøren redigerer program og poster
- Story 2.6: Turen får tema
- Story 2.7: Arrangøren publiserer turen

## Requirements & Constraints

- Input til generering er en `TripRequest`: destinasjon, fra- og tildato, antall deltakere, valgfritt antall lag (1–6, ikke flere enn deltakere) og antall poster (minst 1), og en fri beskrivelse. Den kontrolleres i `validate.js` (AD-15), og utkastet kontrolleres mot den.
- Ny tur har inline-validering ved feltene, et hint ved for kort tekst (ca. 30 tegn), og alt lagres lokalt mens arrangøren skriver.
- Genereringen viser fremdriftssteg (plan → innhold → kontroll), kan ikke startes to ganger, og feiler med «Prøv igjen» og «Rediger beskrivelsen» uten at teksten går tapt.
- Mock-agenten returnerer en gyldig `TripDraft` basert på seed, tilpasset periode, lag og poster, og destinasjonen er alltid prøveturens i demo.
- Mikroteksten er norsk uten tekniske ord. Trykkflater er minst 48 px, og status vises aldri bare med farge.

## Technical Decisions

- Alle databasekall går gjennom `api.js`. Demo lagrer lokalt; live bruker Supabase med RLS (AD-8, AD-17). Rene funksjoner i `src/lib/` med `node:test`.
- `TripDraft` er `{ trip, program_items, checkpoints, teams }` og valideres av `validateTrip` (AD-2).
- Mine turer og Ny tur er egne flater utenfor `/t/:slug`. I demo bruker de prøveturens provider.

## UX & Interaction Patterns

- Ny tur: nøkkelfelt (Destinasjon*, Fra*, Til*, Deltakere*, Lag, Antall poster) og et promptfelt. Utkast har to kolonner fra 1024 px, og redigering skjer på stedet med autolagring.

## Cross-Story Dependencies

- 2.2 gir `TripRequest` som 2.3 og 2.4 bruker. 2.3 gir utkastet som 2.5 redigerer og 2.7 publiserer, og som Epic 6 (regenerering og KI-forslag) bygger videre på.
- 2.1 og 2.4 krever Supabase og kan ikke kjøres før Story 7.4.
