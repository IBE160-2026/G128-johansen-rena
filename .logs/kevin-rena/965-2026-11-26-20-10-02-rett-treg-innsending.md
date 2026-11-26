# Retting: treg innsending overskrev endringer

## 2026-11-26 kl. 20:10 — Kevin Renå

### Oppgave
Rette funn 4-A fra [retrospektivet for Epic 4](../../implementation-artifacts/epic-4-retro-2026-11-26.md) på en egen branch.

### Plan
- Lese turdataene på nytt etter bildebehandlingen, sjekke reglene mot dem, teste og gjenskape i nettleser.

### Resultat
- Branch `fix-treg-innsending` (bygger på `sprint-status-epic-2-4-5`), commit `e0068cb`.
- Ny ren `addDemoSubmission` i `submission.js`: legger innsendingen inn i de nyeste dataene og avviser den hvis lag, post eller en annen innsending har endret seg. Notat og bilde blir stående. `submit` i `TripContext` bruker den. Live-modus er uendret.
- 822 tester grønne og bygget går gjennom. Headless Chrome med to faner: beskjed og godkjenning overlever en treg innsending, og en post deaktivert underveis avviser innsendingen. Epic 4/5-sjekken, mobilflyten og testen av publisert tur har ingen feil.
- Ingen reviewere har sett på endringen. Koblingen i `TripContext` har fortsatt ingen automatisk test i repoet.
- Lukker punktet om overskrivingen.
- Etter ønske: tiltaket `epic-4-retro-item-5` satt til `done`, og branchen pushet og merget inn i `main` med PR #29. Det tok også med statusendringen og retrospektivet.

### Åpne punkter
Ingen nye.
