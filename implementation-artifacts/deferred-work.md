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
- source_spec: `implementation-artifacts/spec-3-5-arrangoren-godkjenner-eller-avviser.md`
  summary: Migrasjonen `202611250002_story_3_5_review.sql` (kolonne, kolonnerettigheter, trigger), RLS for godkjenning og live-skriving av `status` og `rejection_reason` er ikke kjørt eller prøvd.
  evidence: Ingen Supabase-instans. Testes med to arrangører og to turer i Story 7.4, inkludert at en deltaker eller en annen turs arrangør avvises.
- source_spec: `implementation-artifacts/spec-3-5-arrangoren-godkjenner-eller-avviser.md`
  summary: Godkjenningskøen (`ReviewQueue`), `TripContext.review` og Admin-fanene har ingen kjørende komponenttest, og en beslutning kan gå tapt hvis nettleseren lukkes i de 5 sekundene (`pagehide` er best effort).
  evidence: Ingen React-testoppsett. Køen og reglene er rene og testet med falsk tid, og flyten er verifisert i headless Chrome med to faner. Dekkes av flyttesten i Story 7.1.
- source_spec: `implementation-artifacts/spec-3-6-poeng-beregnes-fra-godkjente-innsendinger.md`
  summary: Visningen `team_scores`, den unike indeksen og lesetilgangen (`security_invoker`) er ikke kjørt, og `tests/fixtures/scoring-cases.json` er ikke kjørt mot databasen.
  evidence: Ingen Supabase-instans. Kjøres i Story 7.4: alle tilfeller uten `jsOnly` skal gi samme poeng og antall løste poster, og en deltaker skal bare se rader for egen tur. Appen bruker fortsatt `standings` i JS og leser ikke `team_scores` ennå.
- source_spec: `implementation-artifacts/spec-3-6-poeng-beregnes-fra-godkjente-innsendinger.md`
  summary: Admin-postskjemaet (`saveTask`) og Laget-fanen har ingen kjørende komponenttest.
  evidence: Ingen React-testoppsett. Verifisert i headless Chrome. Dekkes av flyttesten i Story 7.1.

- source_spec: `implementation-artifacts/spec-4-2-deltakeren-ser-ledertavlen.md`
  summary: Ledertavlens oppdatering, dra-ned-gest og live-melding har ingen automatiske tester.
  evidence: Repoet har ingen DOM-testoppsett; bare den rene `rankStandings` er testet. Verifiseres manuelt og i Story 7.1.
- source_spec: `implementation-artifacts/spec-4-2-deltakeren-ser-ledertavlen.md`
  summary: Merket «Oppdateres live» på ledertavlen lover mer enn 4.2 leverer.
  evidence: Det finnes ingen sanntid før Story 4.3. Teksten bør vurderes da.

- source_spec: `implementation-artifacts/spec-4-3-ledertavlen-oppdateres-i-sanntid.md`
  summary: Koblingen i `TripContext` (BroadcastChannel, ekko-vern, fokus-henting) har ingen automatiske tester.
  evidence: Ingen DOM- eller React-testoppsett i repoet; bare de rene hjelperne er testet. Dekkes av manuell to-fane-sjekk og Story 7.1.
- source_spec: `implementation-artifacts/spec-4-3-ledertavlen-oppdateres-i-sanntid.md`
  summary: En lest-på-nytt-henting kan overskrive en lokal endring som ikke ble lagret fordi demolagringen var full.
  evidence: `readDemoAgain` erstatter tilstanden med lagret kopi. Sjelden (full lagring), og feilmeldingen vises først.

- source_spec: `implementation-artifacts/spec-4-4-deltakeren-ser-turens-bilder.md`
  summary: Samlet signering i `loadTrip` (ett kall, tom liste, feil svelges) og plassholderen i galleriet har ingen automatiske tester.
  evidence: `api.js` kan ikke importeres uten Supabase-miljø i `node --test`, og repoet har ingen komponenttester. Dekkes av Story 7.4 (live) og manuell sjekk.
- source_spec: `implementation-artifacts/spec-4-4-deltakeren-ser-turens-bilder.md`
  summary: Signerte URL-er fornyes ikke før siden lastes på nytt, og ett samlet `createSignedUrls` har ingen oppdeling ved svært mange bilder.
  evidence: URL-ene varer 3600 s. Galleriet bytter nå til plassholder ved lastefeil, men henter ikke nye URL-er.

- source_spec: `implementation-artifacts/spec-5-1-arrangoren-endrer-en-publisert-tur.md`
  summary: Admin-lagringsløpet (validering før `write`, feil ved felt, bekreftelsen) og `updated_at`-stemplet i demo-`write` har ingen automatiske tester.
  evidence: Ingen DOM- eller React-testoppsett. Ren `validateChange` er testet; resten sjekket manuelt i headless Chrome. En ren `stampUpdate`/`saveChange` kan trekkes ut senere.

- source_spec: `implementation-artifacts/spec-5-2-arrangoren-legger-til-nye-poster-og-programposter.md`
  summary: `LocationPicker` (trykk, dra, avvist flytting) og Admin-skjemaenes åpne og lukkede tilstand har ingen automatiske tester.
  evidence: Ingen DOM-testoppsett. Sjekket manuelt i headless Chrome (trykk innenfor og utenfor området, lagring, deltakerens kart). Fokusflytting og tastaturflytting av markøren er ikke gjort.

- source_spec: `implementation-artifacts/spec-5-3-arrangoren-deaktiverer-en-post.md`
  summary: Lagringsregelen for opplasting av bilder (`trip_media_insert`) kjenner ikke posten, så en direkte opplasting til en deaktivert post stoppes først når innsendingen settes inn (RLS).
  evidence: Stien har ikke post-id. Resultatet er en foreldreløs fil i lagring, ikke en innsending. Vurder opprydding eller postid i stien senere.
- source_spec: `implementation-artifacts/spec-5-3-arrangoren-deaktiverer-en-post.md`
  summary: Visning av deaktiverte poster (kart, postliste, kort) og Admin-knappene har ingen komponenttester.
  evidence: Ingen DOM-testoppsett. Ren logikk er testet (`checkpointStatus`, `visibleCheckpoints`, `acceptsSubmissions`), resten er sjekket i headless Chrome.

- source_spec: `implementation-artifacts/spec-5-4-deltakerne-ser-endringer-med-en-gang.md`
  summary: Koblingen for «Endret» (TripContext, Rebus, Home, Program, Shell: merker, banner, åpning markerer som sett) har ingen automatiske tester.
  evidence: Ingen DOM-testoppsett. Regelen i `changes.js` er testet; flyten er sjekket med to faner i headless Chrome. Skjev klokke på enheten kan gi merker for tidlig eller for sent (akseptert i AD-16).

- source_spec: `implementation-artifacts/spec-2-2-arrangoren-beskriver-en-ny-tur.md`
  summary: Ny tur-siden og «Ny tur»-lenken på Mine turer (skjema, fokus på første feil, gjenoppretting, «Start på nytt») har ingen komponenttester.
  evidence: Ingen DOM-testoppsett. Regler og lagring er testet som rene funksjoner (`tripRequest.js`, `validateTripRequest`); flyten er sjekket i headless Chrome.
- source_spec: none
  summary: Knappene «Bytt rolle» og «Tilbakestill demo» i demo-banneret er 20 px høye og under kravet om 48 px trykkflate (UX-DR17).
  evidence: Målt i headless Chrome på 390 px. Komponenten `DemoBanner.jsx` er fra Story 1.1.

- source_spec: `implementation-artifacts/spec-2-3-utkast-genereres-med-mock-agenten.md`
  summary: Ny tur-flyten (generering, avbryt, feiltilstand, navigasjon til Utkast) og Utkast-siden har ingen komponenttester.
  evidence: Ingen DOM-testoppsett. Orkestreringen er testet som ren funksjon (`generate.js`), utkastet i `mockAgent.js` og lagringen i `draftStore.js`; flyten er sjekket i headless Chrome.
- source_spec: `implementation-artifacts/spec-2-3-utkast-genereres-med-mock-agenten.md`
  summary: Et nytt utkast overskriver det forrige uten spørsmål (én global lagringsnøkkel).
  evidence: `saveDraft` bruker `tripbuilder-draft-v1`. Det blir et reelt problem først når flere utkast eller publisering finnes (Story 2.5 og 2.7).

- source_spec: `implementation-artifacts/spec-2-5-arrangoren-redigerer-program-og-poster.md`
  summary: Utkast-siden (autolagring, feil ved felt, kartvelger, områdefelt, Publiser-tilstand) har ingen komponenttester.
  evidence: Ingen DOM-testoppsett. Ren logikk er testet (`draftEdit.js`, `draftStore.js`); flyten er sjekket i headless Chrome.
- source_spec: `implementation-artifacts/spec-2-5-arrangoren-redigerer-program-og-poster.md`
  summary: Områdets sirkel kan ikke dras på kartet, bare endres med felt (UX-DR14 sier «flytte og endre»). Fanene mangler pil-navigasjon.
  evidence: Bevisst avgrensning i spec (beslutning 5). Tas opp igjen om gruppen vil ha dragbart område.

- source_spec: `implementation-artifacts/spec-2-6-turen-far-tema.md`
  summary: Shells bruk av temaet og Tema-fanen i Utkast har ingen komponenttester.
  evidence: Ingen DOM-testoppsett. Paletter, kontrast, `resolveTheme`, `themeVars` og `updateTheme` er testet som rene funksjoner; flyten er sjekket i headless Chrome.
- source_spec: `implementation-artifacts/spec-2-6-turen-far-tema.md`
  summary: Aktiv fane i sidemeny og bunnmeny bruker faste farger og følger ikke temaet; live henter ikke `trips.theme`.
  evidence: Spec begrenser temaet til toppen og primærfargede flater (beslutning 6). Live-henting av tema følger med Story 2.1 og 7.4.
