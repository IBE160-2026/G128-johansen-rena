# Epic 3 Context: Deltakerne løser rebusen, og arrangøren godkjenner

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deltakeren blir med via turkode, låser opp geolåste poster ved å være på stedet (ekte eller simulert posisjon), og sender bilde med notat som svar. Arrangøren godkjenner eller avviser, og laget får poeng. Epicen kjøres først i demo-modus. Live-delene (anonym innlogging, RLS, migrasjoner) skrives, men kan ikke kjøres før en Supabase-instans finnes.

## Stories

- Story 3.1: Deltakeren blir med via turkode (live, tas sist)
- Story 3.2: Poster låses opp når jeg er på stedet
- Story 3.3: Posisjonssimulator i demo-modus
- Story 3.4: Deltakeren sender bilde som svar
- Story 3.5: Arrangøren godkjenner eller avviser
- Story 3.6: Poeng beregnes fra godkjente innsendinger

## Requirements & Constraints

- En geolåst post er opplåst når avstanden til posten er mindre enn eller lik postens radius. Åpne poster (`requires_location = false`) er alltid åpne. Dette skal være 100 % riktig i deterministiske tester, også like innenfor, nøyaktig på og like utenfor radius.
- Posisjonen sendes aldri til serveren og lagres aldri (ingen historikk). Den spores bare mens Kart er åpen. Arrangørens godkjenning er integritetskontrollen, ikke serveren.
- Nektet posisjon: forklaring og «Prøv igjen». Geolåste poster forblir låst, åpne poster virker.
- Hver innsending har et bilde (påkrevd) og et notat på minst 3 tegn. Innsending har livsløpet ventende, godkjent eller avvist. Bare arrangøren kan endre status.
- Poeng avledes fra godkjente innsendinger og postens gjeldende poeng. Hver post teller maks én gang per lag, og endrede poeng gjelder alle lag som har løst posten.

## Technical Decisions

- Rene funksjoner i `src/lib/` (`geo.js`, `core.js`) med `node:test`. Posisjon kommer fra en kilde (nettleserens geolokasjon eller simulert). Opplåsing regnes fra avstand med haversine.
- Alle databasekall går gjennom `src/lib/api.js`. Demo-modus lagrer i localStorage og nettleseren. Live bruker Supabase med RLS. Poster har `radius_m`, `requires_location` og `status` i seed, men databasen mangler kolonnene (migrasjon trengs).
- Bilder: privat bucket `trip-media/{trip_id}/{user_id}/…`, komprimert i klienten til maks 1600 px, signerte URL-er.
- Godkjenning er en oppdatering av `submissions.status` via RLS (ikke RPC). Poeng regnes i `scoring.js` (demo) og viewet `team_scores` (live), mot de samme testtilfellene.

## UX & Interaction Patterns

- Postkortet viser avstand: «Du er X m unna. Gå nærmere for å låse opp.» Markører har tilstandene låst, opplåst og fullført, med ikon og nummer. Status vises aldri bare med farge.
- Posisjonssimulator i demo-modus: trykk på kartet eller «Gå til post N».
- Godkjenningskort: Godkjenn eller Avvis (valgfri begrunnelse) med «Angre» i 5 s (forsinket sending). Tom kø: «Alt er godkjent. Godt jobbet!»

## Cross-Story Dependencies

- 3.2 gir opplåsing som 3.3 (simulator) og 3.4 (innsending) bygger på. 3.4 gir innsendinger som 3.5 og 3.6 bruker. 3.6 gir poeng til Laget-fanen.
- 3.1 trenger live Supabase og tas sist.
