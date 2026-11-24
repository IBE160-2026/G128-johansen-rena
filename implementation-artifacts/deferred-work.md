- source_spec: `implementation-artifacts/spec-1-1-appen-starter-i-demo-modus-fra-malen.md`
  summary: Live-modus på `/` er en blindgate: ingen innlogging, turliste eller omdirigering til brukerens tur.
  evidence: `Start` i `src/App.jsx` viser bare en tekst utenfor demo-modus. Start-flaten kommer i Story 1.4 og Epic 2 og 3.
- source_spec: `implementation-artifacts/spec-1-1-appen-starter-i-demo-modus-fra-malen.md`
  summary: `join()` i `TripContext.jsx` etterlater en anonym Supabase-sesjon når `join_trip` feiler.
  evidence: Finnes i malen fra før. Skal ryddes i Story 3.1.
- source_spec: `implementation-artifacts/spec-1-1-appen-starter-i-demo-modus-fra-malen.md`
  summary: Admin-lenken mangler i bunnmenyen på mobil.
  evidence: `Shell.jsx` gir `isOrganizer={false}` til bunnmenyen. Avgjøres sammen med navigasjonsmønsteret i Story 1.5.
- source_spec: `implementation-artifacts/spec-1-1-appen-starter-i-demo-modus-fra-malen.md`
  summary: Malens CLAUDE.md-regel om å samordne databaseskjema og UI-kontrakter ble borte da `template_trip/CLAUDE.md` ble fjernet.
  evidence: Rotens `AGENTS.md` har egne regler om migrasjoner og RLS, men ikke setningen om samordning. Endrer agentkontekst, så gruppen bør avgjøre.
- source_spec: `implementation-artifacts/spec-1-1-appen-starter-i-demo-modus-fra-malen.md`
  summary: Supabase-modus, brukere med flere medlemskap og utlogging er ikke testet automatisk eller mot en live-instans.
  evidence: Ingen Supabase-instans ennå. Dekkes av live-integrasjonstesten i Story 7.4.
- source_spec: `implementation-artifacts/spec-1-2-turdata-valideres-av-domenekjernen.md`
  summary: Avgjør om en tur må ha minst én post og ett lag før publisering.
  evidence: `validateTrip` godtar tomme `checkpoints` og `teams`, siden kravet ikke er fastsatt. Avgjøres i Story 2.7.
- source_spec: `implementation-artifacts/spec-1-2-turdata-valideres-av-domenekjernen.md`
  summary: Seed-turen skal valideres av `validateTrip` i en test.
  evidence: Seed-data byttes i Story 1.3, og testen skrives der.
- source_spec: `implementation-artifacts/spec-1-3-provturen-lastes-fra-seed-data.md`
  summary: Koblingen mellom `TripContext`, `DemoBanner` og demoStore (nullstilling, lagring) har ingen automatisk test.
  evidence: Repoet har ikke noe React-testoppsett. Verifisert manuelt i Chrome. Kan flyttes inn i rene funksjoner eller dekkes av flyttesten i Story 7.1.
- source_spec: `implementation-artifacts/spec-1-3-provturen-lastes-fra-seed-data.md`
  summary: `crypto.randomUUID()` brukes i `TripContext` (opprettelse av poster og bilder) og krasjer i ikke-sikker kontekst, for eksempel over http på LAN-IP fra mobil.
  evidence: Finnes fra malen. Gjelder testing på mobil uten https, så løses før Story 7.1 (mobiltest) med en reserve-ID-funksjon i `core.js`.
