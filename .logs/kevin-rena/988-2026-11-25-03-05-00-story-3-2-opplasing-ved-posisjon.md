# Story 3.2: Oppløsing ved posisjon

## 2026-11-25 kl. 03:05 — Kevin Renå

### Oppgave
Start Epic 3 og kjør Story 3.2 via `bmad-build`: poster låses opp når deltakeren er på stedet.

### Plan
- Kevin valgte «demo først»: 3.2, 3.3, 3.4, 3.5, 3.6, og 3.1 (live) sist. Epic 3 satt til `in-progress`.
- Spec: [../../implementation-artifacts/spec-3-2-poster-laases-opp-nar-jeg-er-pa-stedet.md](../../implementation-artifacts/spec-3-2-poster-laases-opp-nar-jeg-er-pa-stedet.md), epic-kontekst i `epic-3-context.md`. Gren `story-3-2-opplasing-ved-posisjon`. Tre reviewere (godkjent av Kevin).

### Resultat
- `unlockStatus` og `distanceHint` i `geo.js`, `checkpointStatus` med posisjon, sporing i `src/hooks/positionTracker.js` og `usePosition.js`, opplåst markør, egen posisjon, avstandstekst og varsel ved nektet posisjon i Kart. 185 tester grønne, bygg lykkes, verifisert i headless Chrome med geolokasjon (nektet, ved posten, 120 m unna, sporing stopper).
- Review: 14 funn, 9 patchet, 5 avvist, 2 utsatt. Viktigste: gammel posisjon holdt poster opplåst etter skjult fane, og vanlig tidsavbrudd låste postene.
- Sprint-status: 3-2 på `review`, Epic 3 `in-progress`.

### Åpne punkter
- Feltprøve med ekte GPS (SM-4) avgjør om GPS-margin eller hysterese trengs.
- Komponentene har ingen kjørende test (Story 7.1).
- Grenen må merges.
