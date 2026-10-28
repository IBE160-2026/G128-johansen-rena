# QA-rapport

Dato: 28. oktober 2026. Prosjekt: G128 / TripBuilder AI.

## Konklusjon og omfang

Produktidéen, målgruppene og prinsippet om at KI fyller en fast datamodell er gjennomgående tydelige. Faglærerens tre hovedinnspill er fulgt opp i planene: trinnvis levering, lokal demo uten nøkler og regelbasert validering. Godkjenning før poeng er også ført inn i brief, PRD og stories.

Det er likevel ikke grunnlag for å si at alt er klart til implementasjon eller at løsningen virker. Repoet har ingen `package.json`, `src/`, `supabase/`, `e2e/` eller `.env.example`. Dette er forventet i nåværende fase, ikke en påvist programfeil. Planen har 7 epics og 34 stories, og alle FR-1–FR-18 finnes i dekningsoversikten. Flere stories har imidlertid avhengigheter eller kontrakter som ennå ikke stemmer.

Gjennomgangen omfatter forslag, mal, begge briefer, faglærertilbakemeldingen, addenda, PRD, gjennomføringsplan, UX, arkitektur, epics, README, TODO, minnelogger og eksisterende sesjonslogg. Installerte BMAD-ressurser er undersøkt gjennom filoversikt, relevante konfigurasjonsfiler, Python-syntakskontroll og arkitekturlinter. Dette er ikke en full semantisk revisjon av alle installerte skill-maler eller en sikkerhetsrevisjon av tredjepartsverktøy.

Eksterne markedsopplysninger, pakkeversjoner og sensorveiledning er ikke selvstendig nettverifisert. Rapporten vurderer dokumentasjonen av dem og bruker dem ikke som bekreftede eksterne fakta. Ingen faktiske brukerintervjuer, feltmålinger eller driftstester er tilgjengelige.

Kildehenvisningene nedenfor bruker stier fra prosjektroten og linjenumre ved QA-tidspunktet. Høy prioritet bør avklares før berørt implementasjon; middels før berørt epic; lav før dokumentleveranse.

## Funn med høy prioritet

### QA-01 – Deltakerflyten bruker en tabell før den opprettes

**Kilde:** `planning-artifacts/epics.md:466` (Story 3.1) og `:525` (Story 3.4).

Story 3.1 krever at `join_trip` oppretter en `participant` og velger laget med færrest medlemmer. Tabellen `participants` introduseres først i migrasjonen i Story 3.4. En sekvensiell implementasjon kan derfor ikke fullføre live-akseptansen for 3.1 med bare tidligere stories.

**Tiltak:** Flytt `participants`, nødvendige fremmednøkler, RLS og `join_trip` til 3.1 eller en tidligere story. La 3.4 introdusere `submissions`. Test en ren database opp til hver story separat.

### QA-02 – Endring av postpoeng endrer allerede opptjente poeng

**Kilde:** `planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md:75` (AD-5), `:123` (AD-13), `planning-artifacts/epics.md:675` (Story 5.1).

AD-5 beregner poeng fra nåværende `post.points`. Samtidig kan en publisert post redigeres, uten unntak for poeng eller løste oppgaver. Endres en løst post fra 10 til 25 poeng, endres historisk opptjening automatisk. Dokumentene lover at gitte poeng beholdes ved deaktivering, men avklarer ikke hva redigering eller regenerering skal gjøre med opptjeningen.

**Tiltak:** Velg en eksplisitt regel. En enkel V1-regel er å låse poeng og oppgaveinnhold når posten har innsendinger, og opprette en ny post ved behov. Alternativt kan tildelte poeng eller postversjon bevares per godkjenning; da må AD-5 justeres. Test redigering, deaktivering og regenerering etter godkjenning.

### QA-03 – Miljøvariabelregelen motsier regelen om serverhemmeligheter

**Kilde:** samme arkitekturfil `:99` (AD-9) og `:154` (Konfigurasjon).

AD-9 plasserer Claude-nøkkelen i en Supabase-secret på serveren. Konfigurasjonskonvensjonen sier derimot at *alle* miljøvariabler starter med `VITE_` og bare leses i klientens `src/app/services.ts`. Følger en implementatør sistnevnte bokstavelig for KI-nøkkelen, blir sikkerhetsgrensen feil. Det er ikke funnet en faktisk lekket nøkkel; dette er en dokumentkonflikt.

**Tiltak:** Avgrens `VITE_*` til offentlig klientkonfigurasjon. Dokumenter serverhemmeligheter separat, med lesing kun i Edge Functions, og krev at hemmeligheter ikke finnes i frontendbygget.

### QA-04 – Autoritativ validering av lagring er ikke definert

**Kilde:** samme arkitekturfil `:57` (AD-2), `:93` (AD-8), `:117` (AD-12), `:123` (AD-13), `planning-artifacts/epics.md:684`.

Genereringsfunksjonen validerer på serveren, men manuelle endringer og sammenslåing av regenerert innhold beskrives med `validateTrip()` før lagring i klienten. RLS beskrives som tilgangskontroll. Ingen bindende kontrakt angir hvor databaseinvarianter håndheves ved direkte skrivekall, eller hvordan oppdatering av flere tabeller blir atomisk. UI-validering alene dokumenterer ikke at ugyldige turer eller tap av innsendinger avvises i databasen.

**Tiltak:** Definer en autoritativ skriveoperasjon med transaksjon og nødvendige databasebegrensninger/servervalidering. Beskriv særlig publisering, sletting, deaktivering og samtidige endringer. Test ugyldig direktekall og delvis feilet lagring. Behold klientsidevalidering for raske feilmeldinger.

### QA-05 – Validatoren dekker ikke hele det lovede strukturkravet

**Kilde:** `Leveranser/product-brief.md:60`, `planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md:113` (FR-2), arkitekturfilen `:57` og `:135` (AD-15), `planning-artifacts/epics.md:196`.

PRD krever minst én oppføring hver dag. Briefen krever også riktig antall poster per dag. AD-2 og Story 1.2 kontrollerer at hver dato har en dag, men sier ikke at dagen må ha innhold. `TripRequest` inneholder ikke et strukturert forventet antall poster. Dermed kan en tom dag passere de beskrevne reglene, og korrekt postantall fra fritekst har ingen definert fasit.

**Tiltak:** Definer hva «oppføring» betyr og test tom dag, manglende/duplisert/ekstra dato og feil antall poster. Legg eventuelt forventet postantall inn i en bekreftet input-kontrakt, eller avgrens løftet i briefen. Krav som finnes bare i fritekst må få en eksplisitt kontrollmetode.

## Funn med middels prioritet

### QA-06 – Områdekontroll kan bli en kontroll mot KI-ens egen gjetning

**Kilde:** arkitekturfilen `:135` (TripRequest) og `:151` (turens område); `planning-artifacts/epics.md:352` (mock-generering).

Input-kontrakten har destinasjon, men ingen autoritativ områdeavgrensning. Utdata har både `area` og postkoordinater. Det er ikke angitt hvem som fastsetter eller bekrefter området. Poster kan dermed oppfylle avstandsregelen uten at de ligger ved ønsket destinasjon. Mocken kreves tilpasset periode og lag, men ikke destinasjon.

**Tiltak:** La arrangøren bekrefte kartområde, eller bruk en definert destinasjonsfasit. Skill geografisk gyldige tall fra faktisk egnede og tilgjengelige steder. Definer om demoen tilpasser destinasjonen eller tydelig viser en fast prøvetur.

### QA-07 – Trinn B mangler eksplisitt godkjenning før poeng

**Kilde:** `planning-artifacts/gjennomforingsplan.md:60` (Trinn B), `:76` (C.1); `Leveranser/product-brief.md:72`; `planning-artifacts/epics.md:537` (Story 3.5).

Milepæl B lover svar og poeng, men B-tabellen har ingen godkjenningsflyt. Briefens trinn 3 nevner godkjenning sammen med bilder, mens epic 3 korrekt legger godkjenning inn før poeng. Lagtildeling kommer også først i C i planen; Story 3.1 løser dette med automatisk førstegangstildeling.

**Tiltak:** Synkroniser planen og briefen med epic 3: enkel lagtildeling og tekstgodkjenning må være tilgjengelig før milepæl B. Skill dette fra senere manuell lagflytting og bildegodkjenning.

### QA-08 – Minimumsleveransen og full V1 blandes sammen

**Kilde:** `planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md:279`, gjennomføringsplanen `:45`, `:85`, `:96`, arkitekturfilen `:7`, `:99`, `:115`.

Planen kaller A minste leverbare versjon, mens PRD-ens MVP inkluderer geofencing, bilder, sanntid, regenerering og endringer underveis. Arkitekturen sier trinn A–D og legger regenerering i D, men gjennomføringsplanen har flyttet regenerering til E. Deploy er valgfritt i planen og et akseptansekrav i Story 7.4.

**Tiltak:** Definer én minimumsleveranse og én utvidet V1 med klare milepæler. Oppdater A–E-referanser og deploy-status. Bevar alle ønskede funksjoner, men gjør det entydig hva som kreves for hvilken leveranse.

### QA-09 – UX-kontraktene gir ulike svar på samme tilstand

**Kilde:** `planning-artifacts/ux-designs/ux-G128-johansen-rena-2026-10-28/EXPERIENCE.md:106`, `:111`, `:143`, `:209`; `DESIGN.md:144`; arkitekturfilen `:288`; `planning-artifacts/epics.md:472`, `:493`, `:810`.

DESIGN sier én kolonne under 768 px, EXPERIENCE krever to kolonner fra 1024 px. EXPERIENCE sier alle poster låses ved nektet posisjon, mens Story 3.2 korrekt lar åpne poster virke. Offline-kø er både beskrevet som oppførsel og utsatt; arkitekturen har den utenfor V1, mens Story 7.2 krever alle UX-tilstander. Lagtildeling er fortsatt åpen i UX selv om 3.1 har valgt automatisk tildeling og 4.1 manuell flytting.

**Tiltak:** Samordne breakpoint, åpne poster, offline-feil og lagtildeling. Fjern løfter om automatisk køing fra V1 dersom det forblir utsatt. Marker avklarte valg som besluttet. Tema-listene og særskilt markør for åpne poster er eksplisitt utsatt til implementasjon; disse må ferdigstilles i Story 2.6 og kartarbeidet.

### QA-10 – Bakgrunnsgenerering og angre mangler livsløpskontrakt

**Kilde:** EXPERIENCE `:101`, `:89`; arkitekturfilen `:87` (AD-7); `planning-artifacts/epics.md:363`, `:546`.

UX lover at arrangøren kan forlate genereringssiden og finne utkastet senere. Ingen story definerer hvem som vedvarer resultatet ved avbrutt klient, hvordan jobbstatus gjenfinnes eller hvordan doble klikk håndteres. Godkjenning har «angre i 5 s», men AD-7 beskriver bare overgangen fra pending til approved/rejected.

**Tiltak:** Avgrens «forlate» til intern navigasjon eller spesifiser vedvarende jobbstatus og idempotens. Velg om angre utsetter lagring eller reverserer en godkjenning, og angi konsekvensen for poeng og andre klienter.

### QA-11 – Ett globalt sett-tidspunkt kan skjule uleste endringer

**Kilde:** arkitekturfilen `:141` (AD-16), EXPERIENCE `:87`, `planning-artifacts/epics.md:740`.

AD-16 setter turens `last_seen_at` når deltakeren åpner ett element. Har både middag og post 4 blitt endret, kan åpning av middag dermed fjerne «Endret» fra post 4 uten at posten er sett. UX beskriver at merket forsvinner når elementet er sett.

**Tiltak:** Velg per-element sett-status, eller krev eksplisitt kvittering for alle endringer samlet. Test minst to endringer med bare én åpnet, samt endring som ankommer mens banneret lukkes.

### QA-12 – Målingene er ikke tilstrekkelig operasjonalisert

**Kilde:** PRD `:308`–`:315`, `planning-artifacts/epics.md:46`, `:506`, `:815`, `:837`.

SM-2 krever 100 % gyldig generert JSON samtidig som retry/feil er en forventet flyt; det er uklart om første forsøk, siste forsøk eller bare aksepterte utkast telles. SM-4 sier 80 %, andre dokumenter over 80 %, og Story 3.3 tillater feil i en deterministisk posisjonstabell. «Laster under 3 s» angir ikke målepunkt eller lastprofil. Mock-output kan ikke alene dokumentere kvaliteten på ekte KI-generering.

**Tiltak:** Skill akseptert gyldighet fra genereringssuksess per forsøk. Krev 100 % riktige deterministiske grense-/enhetstester; mål fysisk GPS separat med angitt protokoll. Angi lastemetrikk, enhet, cache, nettprofil og antall målinger. Hold SM-6-målinger på ekte KI-output adskilt fra demoen.

### QA-13 – Testplanen mangler konkrete negative tester for live-tilgang

**Kilde:** arkitekturfilen `:93`, `:111`; `planning-artifacts/epics.md:479`, `:525`, `:804`, `:850`; gjennomføringsplanen `:80`.

Isolasjon med RLS og privat Storage er et godt uttalt mål. Planen nevner to turer, men epic-planen har ikke konkrete negative akseptanser for `team_scores`, fremmede post-/lag-ID-er i innsendinger, `review_submission`, `join_trip` eller opplasting/signering av andres bilder. Demo-E2E utøver ikke live-policyene.

**Tiltak:** Legg til en liten live-integrasjonstestmatrise med to arrangører og to turer, og test direkte kall. Definer også maksimal filstørrelse, tillatte bildeformater, ugyldig fil og feilet opplasting. Dette er manglende verifikasjonsgrunnlag, ikke bevis på at planlagte policyer er usikre.

## Funn med lav prioritet

### QA-14 – Status, dokumenteierskap og beslutninger er ikke ajour

**Kilde:** `TODO.md:6`, `:15`, `README.md:5`; gjennomføringsplanen `:115`; PRD `:326`; begge briefer `:3` og `:89`.

TODO beskriver UX, arkitektur og epics som kommende arbeid, selv om utkastene finnes. README sier repoet inneholder applikasjonen, men gir ingen presis fasestatus. Planens «rettes»-merknader gjelder allerede rettede briefpunkter. Datamodellen er fortsatt utsatt i PRD etter at arkitekturen har definert den. Briefkopiene har samme brødtekst bortsett fra korrekt tilpasset lenke, men ulik status Fullført/draft. Sprint-statusfil mangler; dette er allerede korrekt loggført som åpent.

**Tiltak:** Oppdater status med skillet «utkast skrevet» og «godkjent». Velg kanonisk brief og forklar kopirollen. Merk historiske rettemerknader som løst. Lenke PRD-beslutningen til arkitekturen og gjennomfør steg 0.6 etter avklaringene. Ikke merk draft-dokumentene godkjent uten gruppens vurdering.

### QA-15 – Eksterne påstander har utilstrekkelig etterprøvbare kilder

**Kilde:** `planning-artifacts/briefs/brief-G128-johansen-rena-2026-09-17/addendum.md:12`, `:22`; arkitekturfilen `:158`; `LOSNINGSBESKRIVELSE.md:79` og arkitekturens `.memlog.md`.

Konkurrentanalysen oppgir domener og dato, men ingen konkrete kildelenker som underbygger påstandene om manglende funksjoner. Arkitekturens minnelogg hevder at konkrete pakkeversjoner er npm-verifisert, uten lagret registerresultat eller låsefil. Rapporten bekrefter ikke om disse eksterne påstandene er riktige eller gale.

**Tiltak:** Legg inn konkrete primærkilder med sjekkdato, og formuler fraværspåstander som «ikke funnet i undersøkte kilder». Verifiser tilgjengelige, kompatible pakkeversjoner ved prosjektoppsett og bevar låsefil samt byggresultat. Ikke bruk den historiske versjonstabellen som bevis for et fungerende bygg.

### QA-16 – Linterens exitkode må ikke forveksles med godkjent QA

**Kilde:** `.claude/skills/bmad-architecture/scripts/lint_spine.py:221`, `:253`; arkitekturens `.memlog.md` (notatet «lint OK»).

Faktisk kjøring returnerte exitkode 0, men JSON hadde `ok: false` og to lave placeholder-funn. Funnene gjelder de tilsiktede stimalene `{trip_id}` og `{submission_id}` og vurderes ikke som uutfylte felter her. Scriptet er eksplisitt laget med alltid-0-kontrakt; dette er ikke en feil i scriptet.

**Tiltak:** Ved automatisering må konsumenten lese JSON og dokumentere godkjente unntak. Beskriv resultatet som «to vurderte, tilsiktede stimaler», ikke et ubetinget lint-pass. Linteren kontrollerer heller ikke semantisk samsvar mellom krav og stories.

## Faktisk utførte kontroller

Se [kontrollresultater.json](kontrollresultater.json) og [kontroller.py](kontroller.py).

| Kontroll | Resultat | Praktisk grense |
|---|---|---|
| Git- og filoversikt | 257 sporede filer ved start, ren arbeidskopi | Sier ikke noe om appens funksjon |
| Dokumentoversikt og lokale inline Markdown-lenker | 23 dokumenter, ingen brutte filstier funnet | Ingen kontroll av nettlenker, ankre, referanselenker eller alle stier i løpende tekst |
| Sammenligning av briefkopier | Status og relativ addendum-lenke er forskjellige | Øvrig tekst lik på tidspunktet |
| Krav- og storyopptelling | 18 FR, 7 epics, 34 stories | Tilstedeværelse er ikke bevis på full akseptansedekning |
| AST-parsing av Python-filer | 27 filer, ingen syntaksfeil under Python 3.9.6 | Importer og runtime ble ikke testet; enkelte verktøy krever nyere Python |
| BMAD-arkitekturlinter | Kjørt, `ok: false`, to lave og vurderte stimalfunn | Mekanisk kontroll; ingen arkitekturgodkjenning |
| Tilgjengelighet for Python-testrammeverk | `python3 -m pytest --version` feilet: pytest mangler | BMADs enhetstester er ikke kjørt; avhengigheter er ikke installert |
| Appbygg, appenhetstester, E2E, RLS, ytelse, fysisk GPS | Ikke kjørbart i dette repoet ennå | Ingen målte SM-resultater eller godkjenning av funksjonalitet |

## Anbefalt rettingsrekkefølge

1. Avklar QA-01–QA-05 før berørt kode skrives, og oppdater PRD, arkitektur og stories samlet.
2. Samordne leveranseomfang, trinn, UX og måleprotokoll (QA-06–QA-12).
3. Legg negative live-tester inn i berørte stories (QA-13), og oppdater dokumentstatus og kilder (QA-14–QA-16).
4. Godkjenn utkastene i gruppen og kjør sprintplanlegging. Start deretter den minste kjørbare demoen.
5. Bruk [krav-og-testplan.md](krav-og-testplan.md) til å føre faktiske resultater etter hvert som funksjonene finnes. Ikke marker fravær av implementasjon som en bestått test.
