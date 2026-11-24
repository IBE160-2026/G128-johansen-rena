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
- source_spec: `implementation-artifacts/spec-1-4-rollevalg-pa-startsiden.md`
  summary: Rolleflyten (Start, Mine turer, Bytt rolle) har ingen automatisk kjørende test.
  evidence: Repoet mangler React-testoppsett. Verifisert manuelt i headless Chrome. Dekkes av flyttesten i Story 7.1.
- source_spec: `implementation-artifacts/spec-1-4-rollevalg-pa-startsiden.md`
  summary: Hver demo-route har egen `TripProvider` som leser data ved montering, så en annen fane kan gi foreldet visning til siden lastes på nytt.
  evidence: Hører til sanntid i demo-modus (`BroadcastChannel`, AD-10) i Epic 4.
- source_spec: `implementation-artifacts/spec-1-5-deltakeren-ser-dagens-program.md`
  summary: Mellomlageret uten nett (hent, fallback, `online`-hendelsen), nye ruter og Home-visningen har ingen kjørende test, og mellomlageret er ikke prøvd mot en ekte Supabase-instans.
  evidence: Ingen React-testoppsett og ingen live-instans. Beslutningene ligger i rene testede funksjoner (`isNetworkError`, `clearTripCache`, `loadTripCache`). Dekkes av flyttesten og live-oppsettet i Story 7.1 og 7.4.
- source_spec: `implementation-artifacts/spec-1-6-deltakeren-ser-postene-pa-kartet.md`
  summary: `PostMap`, `PostList` og `?post=`-flyten har ingen kjørende komponenttest.
  evidence: Ingen React-testoppsett. Reglene ligger i `core.js` med tester, og flyten er verifisert i headless Chrome. Dekkes av flyttesten i Story 7.1.
- source_spec: `implementation-artifacts/spec-1-6-deltakeren-ser-postene-pa-kartet.md`
  summary: Databasen har ingen kolonne `requires_location` på `checkpoints`, så live-poster er åpne til en migrasjon legger den til.
  evidence: Malens migrasjon mangler kolonnen (og `radius_m`, `status`). Tilføyes i en ny migrasjon senest i Story 3.2.
- source_spec: `implementation-artifacts/spec-3-2-poster-laases-opp-nar-jeg-er-pa-stedet.md`
  summary: Opplåsingen bruker ikke GPS-usikkerhet eller hysterese ved radiusen, og innsending sjekker ikke opplåsingen på nytt.
  evidence: Bevisst (beslutning 3, AD-6). Feltprøve med ekte GPS (SM-4, Story 7.x) avgjør om en margin eller hysterese trengs.
- source_spec: `implementation-artifacts/spec-3-2-poster-laases-opp-nar-jeg-er-pa-stedet.md`
  summary: Kart-siden og `PostMap` har ingen kjørende komponenttest for posisjon (opplåst markør, nektet-varsel).
  evidence: Ingen React-testoppsett. Reglene og sporingen er testet som rene funksjoner, og flyten er verifisert i headless Chrome. Dekkes av flyttesten i Story 7.1.
- source_spec: `implementation-artifacts/spec-3-3-posisjonssimulator-i-demo-modus.md`
  summary: Simulatorpanelet, kartklikk og kobling til Kart-siden har ingen kjørende komponenttest.
  evidence: Ingen React-testoppsett. Posisjonskilden, flytting og normalisering er rene testede funksjoner, og flyten er verifisert i headless Chrome. Dekkes av flyttesten i Story 7.1.
- source_spec: `implementation-artifacts/spec-3-4-deltakeren-sender-bilde-som-svar.md`
  summary: Migrasjonen `202611250001_story_3_4_submissions.sql` er ikke kjørt, og innsettingsregelen, bucket-grensene og live-opplasting er ikke prøvd.
  evidence: Ingen Supabase-instans. Kjøres og testes med to arrangører og to turer i Story 7.4. Bucketen har fortsatt `file_size_limit` på 8 MB, noe komprimeringen holder seg godt under.
- source_spec: `implementation-artifacts/spec-3-4-deltakeren-sender-bilde-som-svar.md`
  summary: `TripContext.submit`, send-flyten i Kart og nettfeilstien har ingen kjørende test.
  evidence: Ingen React-testoppsett. Reglene er rene og testet, og flyten er verifisert i headless Chrome (demo). Dekkes av flyttesten i Story 7.1.
