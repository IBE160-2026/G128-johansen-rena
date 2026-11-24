# Story 3.3: Posisjonssimulator

## 2026-11-25 kl. 04:05 — Kevin Renå

### Oppgave
Merge PR #9 (Story 3.2) og kjør Story 3.3 via `bmad-build`: posisjonssimulator i demo-modus.

### Plan
- Spec: [../../implementation-artifacts/spec-3-3-posisjonssimulator-i-demo-modus.md](../../implementation-artifacts/spec-3-3-posisjonssimulator-i-demo-modus.md). Gren `story-3-3-posisjonssimulator` fra `main`. Tre reviewere (godkjent av Kevin).

### Resultat
- PR #9 merget til `main`.
- Panel med «Gå til post N», trykk på kartet, «Fjern posisjon» og flyttknapper (100 m nord, sør, øst, vest). I demo-modus er simulatoren posisjonskilden, og ekte geolokasjon brukes ikke. Fasit-test med 320 tilfeller (5 breddegrader, 4 radier, 8 retninger, 0,5 m innenfor og utenfor, med uavhengig formel) pluss «nøyaktig på radius». 538 tester grønne, bygg lykkes, verifisert i headless Chrome.
- Review: 12 funn, 6 patchet, 5 avvist, 1 utsatt.
- Sprint-status: 3-3 på `review`.

### Åpne punkter
- Merge `story-3-3-posisjonssimulator` og sett Story 3.3 til done.
- Komponentene har ingen kjørende test (Story 7.1).
