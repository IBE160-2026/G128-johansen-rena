# Story 5.1: Endre publisert tur

## 2026-11-25 kl. 23:30 — Kevin Renå

### Oppgave
Pushe 4.4 og starte Epic 5 med Story 5.1 (arrangøren endrer en publisert tur) via `bmad-build` med tre reviewere.

### Plan
- Spec: [../../implementation-artifacts/spec-5-1-arrangoren-endrer-en-publisert-tur.md](../../implementation-artifacts/spec-5-1-arrangoren-endrer-en-publisert-tur.md). Gren `story-5-1-endre-publisert-tur` fra `story-4-4-bilder`. Epic-kontekst: [../../implementation-artifacts/epic-5-context.md](../../implementation-artifacts/epic-5-context.md).
- Kevin avgjorde at 5.1 bygges på dagens Admin-side, siden Turoversikt, Utkast og publisering (Epic 2) ikke finnes.

### Resultat
- 4.4 pushet. 5.1: ren `validateChange` (`tripEdit.js`), validering før lagring i Admin med feil ved feltene og bekreftelsen «Lagret. Deltakerne ser endringen nå.», `updated_at` i demo, migrasjon `202611250005` (UKJØRT) for `program_items`, mobilregler.
- Review: sju funn patchet (blant annet tomme koordinater som ble 0,0), flere avvist, ett utsatt i `deferred-work.md`.
- 668 tester grønne, bygg lykkes. Headless Chrome (390 px): feil ved tittel, bekreftelse etter gyldig lagring, tomme koordinater avvist, ingen sidelengs rulling, knapper 48 px.
- Spec `done`, sprint-status 5.1 `review`. Committet (3defb50) og pushet.

### Åpne punkter
- Migrasjon `202611250005_story_5_1_program_updated_at.sql` er ukjørt; test trigger og live-lagring mot Supabase (Story 7.4).
- «Endre turen»-knapp og Turoversikt kommer med Epic 2 (Admin fungerer som Rediger underveis til da).
- Merge 5.1 sammen med 4.1 til 4.4 i rekkefølge.
