---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md
  - planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md
  - planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/LOSNINGSBESKRIVELSE.md
  - planning-artifacts/ux-designs/ux-G128-johansen-rena-2026-10-28/DESIGN.md
  - planning-artifacts/ux-designs/ux-G128-johansen-rena-2026-10-28/EXPERIENCE.md
  - planning-artifacts/gjennomforingsplan.md
---

# TripBuilder AI – oppdeling i epics

## Oversikt

Dokumentet deler TripBuilder AI opp i epics og stories som kan implementeres. Grunnlaget er kravene i PRD-en, UX-kontrakten (DESIGN.md og EXPERIENCE.md) og arkitekturspinen.

## Kravoversikt

### Funksjonelle krav

FR1: Arrangøren fyller ut nøkkelfelt (destinasjon, fra- og til-dato, antall deltakere, og eventuelt antall lag og antall poster) og beskriver resten i naturlig språk. Manglende eller ugyldige felt og for kort tekst gir en tydelig feilmelding.
FR2: Systemet genererer et strukturert turutkast (dager, programposter, poster, lag) som validerer mot datamodellen og reglene, med nøyaktig én dag per dato og minst én programpost per dag. Ved feil får KI-en ett nytt forsøk, og deretter vises en tydelig feilmelding.
FR3: Arrangøren kan redigere enkeltelementer i utkastet uten at andre elementer påvirkes, og kan be om nytt forslag for ett element i naturlig språk.
FR4: Arrangøren publiserer turen med en eksplisitt handling, og deretter er turen tilgjengelig for deltakerne.
FR5: Hver rebuspost har gyldige koordinater og en opplåsingsradius, og er enten geolåst eller åpen (`requires_location`). Poster uten gyldig område avvises i valideringen.
FR6: En geolåst oppgave låses opp når deltakeren er innenfor radius, og forblir låst utenfor. Dette kan testes med simulert posisjon.
FR7: Deltakeren kan sende inn tekst og/eller bilde på en post, og får umiddelbar kvittering med statusen «venter på godkjenning».
FR8: Arrangøren kan definere lag og poengregler og fordele deltakerne på lag. Poeng beregnes bare fra godkjente innsendinger, og ugyldige regler avvises.
FR9: Poengene oppdateres hos deltakerne innen 5 s etter godkjenning, og er like på alle klienter.
FR10: Deltakerne ser ledertavle og status på mobil, og den oppdateres uten manuell refresh.
FR11: Appen kan startes lokalt med en ferdig prøvetur (seed-data) uten eksterne kontoer.
FR12: KI-delen kan mockes, og kjerneflyten kan kjøres i demo-modus uten innlogging og med valg av rolle.
FR13: Arrangøren logger inn med e-post (magisk lenke). Bare arrangøren av turen kan endre den, publisere den og godkjenne innsendinger.
FR14: Deltakeren blir med via turkode og navn én gang og forblir innlogget gjennom turen. Deltakeren ser bare sin egen tur.
FR15: Arrangøren godkjenner eller avviser innsendinger (ventende → godkjent eller avvist). Bare godkjente innsendinger gir poeng, og poengene fryses ved godkjenning. Deltakeren ser statusen.
FR16: KI-en velger et enkelt tema per tur (aksentfarge og symbol fra faste lister). Arrangøren kan endre det, og deltakersiden bruker det.
FR17: Arrangøren kan endre, legge til og deaktivere programposter og poster på en publisert tur, for hånd eller med KI-forslag som må godkjennes. Hver endring valideres og gjelder med en gang. Poster med godkjente innsendinger deaktiveres i stedet for å slettes, og poengene beholdes.
FR18: Deltakerne ser endringer innen 5 s uten refresh, med «Endret»-merke og banneret «Programmet er oppdatert». Deaktiverte poster vises nedtonet og merket «Deaktivert».

### Ikke-funksjonelle krav

NFR1: Fra prompt til publisert deltakerside tar det under 30 minutter, uten manuell koding (SM-1).
NFR2: 100 % av utkast som lagres eller vises, validerer. Andelen genereringer som lykkes innen ett nytt forsøk, rapporteres separat (SM-2).
NFR3: 100 % av postene i testdataene ligger innenfor turens område (SM-3).
NFR4: 100 % riktige svar i deterministiske tester av opplåsing, og over 80 % i felttest med ekte GPS (SM-4).
NFR5: Ledertavlen oppdateres innen 5 s etter godkjenning (SM-5).
NFR6: Over 60 % av KI-genererte poster beholdes uten redigering (SM-6, måles manuelt).
NFR7: I dag-fanen har Largest Contentful Paint under 3 s i Lighthouse mobilprofil med 4G-struping og kald cache, median av 3 målinger (SM-7).
NFR8: Kjerneflyten kan kjøres i demo-modus uten eksterne kontoer (SM-8).
NFR9: Appen er enkel å bruke for arrangører uten teknisk bakgrunn, og det genererte innholdet er strukturert og lett å gå gjennom.
NFR10: Personvern: posisjon lagres aldri som historikk, og bilder er bare tilgjengelige for deltakerne på turen.

### Tilleggskrav (arkitektur)

- **Startmal:** Gruppen laster opp koden fra den tidligere blåtursiden (React, Supabase, Leaflet) som mal. Epic 1, Story 1 setter opp prosjektet fra denne malen og løfter den til stacken i spinen: Vite `react-ts`, TypeScript 7.0 og Tailwind 4.3. Hvis malen ikke er inne når arbeidet starter, brukes den rene Vite-malen. Stories beskriver oppførsel og er ikke bundet til kode i malen. Versjonene verifiseres på nytt ved oppsett, og `package-lock.json` committes.
- AD-14: Temaet er data (enum-verdier for aksent og ikon), ikke CSS.
- AD-15: `TripRequest` (nøkkelfelt og beskrivelse) er input til `AgentPort.generate`. `validateTrip(draft, req)` sjekker at periode og antall lag stemmer.
- AD-1: Ren domenekjerne i `src/domain` (skjema, validering, geo, poeng) som bare importerer zod.
- AD-2 og AD-3: Zod-skjemaet `TripDraft` og `validateTrip()` er den eneste kontrakten. Edge Function gjør ett nytt forsøk med valideringsfeilene, og returnerer ellers `VALIDATION_FAILED`.
- AD-4: Porter (`TripRepo`, `AgentPort`, `AuthPort`, `RealtimePort`, `StoragePort`, `PositionSource`) med demo- og supabase-adaptere. `VITE_APP_MODE` leses bare i `src/app/services.ts`. Demo starter uten miljøvariabler.
- AD-5: Poeng avledes fra godkjente innsendinger (viewet `team_scores` og `scoring.ts`). `awarded_points` fryses ved godkjenning, og hver post teller maks én gang per lag.
- AD-6: Haversine i `geo.ts`. Posisjonen sendes eller lagres aldri.
- AD-7: Innsendinger følger livsløpet ventende → godkjent eller avvist, via RPC-en `review_submission`.
- AD-8: Supabase Auth med e-post for arrangør og anonym innlogging for deltaker via RPC-en `join_trip`. All tilgang håndheves med RLS.
- AD-9: Claude kalles bare i `supabase/functions/` (`generate-trip`, `regenerate-part`), og nøkkelen er en Supabase-secret. Serverhemmeligheter har aldri `VITE_`-prefiks og finnes ikke i frontendbygget.
- AD-10: Sanntid er signal og ny henting. Live bruker Supabase Realtime, demo bruker BroadcastChannel.
- AD-11: Privat bucket `submissions/{trip_id}/{submission_id}.jpg`, komprimert til maks 1600 px, med signerte URL-er. Demo bruker IndexedDB.
- AD-12: Regenerering bytter ut ett element med samme id, og hele turen valideres etterpå.
- AD-13: En publisert tur kan endres med validering. Poster med innsendinger deaktiveres (`posts.status`) og slettes aldri. `updated_at` settes ved hver endring.
- AD-16: `RealtimePort.onTripChanged` gir et signal om å hente på nytt. «Endret» beregnes per element mot lokal sett-status (`seen[element_id]` og `baseline_at`).
- AD-17: All lagring av turstruktur i live-modus går gjennom Edge Function `save-trip` og SQL-funksjonen `apply_trip_change` i én transaksjon, med versjonskontroll (`VERSION_CONFLICT`). Klientene har bare lesetilgang til turtabellene.
- Databasemigrasjoner ligger i `supabase/migrations/`. Miljøvariabler er dokumentert i `.env.example`. Frontend deployes til Vercel.
- Tester: Vitest for domenet og Playwright for flyter i demo-modus. Tilgangsregler testes med en live-integrasjonstest med to arrangører og to turer.

### UX-designkrav

UX-DR1: Fargetokenene i DESIGN.md (surface, ink, primary, success, warning, danger, locked, team-1 til team-6), typografi (display, title, body, meta, score), radius og spacing legges inn i Tailwind-temaet.
UX-DR2: Primær- og sekundærknapp, minst 48 px høy og i full bredde på mobil.
UX-DR3: Programkort der aktiviteten som pågår nå er uthevet med venstrekant i primary.
UX-DR4: Kartmarkører i tre tilstander (låst, opplåst, fullført) med ikon og nummer.
UX-DR5: Flytende postkort over kartet med avstand, status og knappen «Løs oppgaven».
UX-DR6: Status-chips (Venter, Godkjent, Avvist) med ikon og tekst.
UX-DR7: Ledertavlerad med lagfarge, poeng i `score` og eget lag uthevet. Radene flyttes med animasjon, unntatt når brukeren har bedt om redusert bevegelse.
UX-DR8: Godkjenningskort for arrangøren med Godkjenn, Avvis (valgfri begrunnelse) og angre i 5 s (forsinket sending).
UX-DR9: Bunnfaner for deltakeren (I dag, Kart, Ledertavle, Laget).
UX-DR10: Demo-banner i warning, og posisjonssimulator på kartet i demo-modus.
UX-DR11: Ny tur har nøkkelfelt (Destinasjon\*, Fra\*, Til\*, Deltakere\*, Lag, Antall poster) med inline-validering, og et promptfelt med hint ved for kort tekst. Alt lagres lokalt mens arrangøren skriver.
UX-DR12: Fremdriftssteg under generering (plan → innhold → kontroll) med feiltilstand og valgene «Prøv igjen» og «Rediger beskrivelsen».
UX-DR13: Redigering på stedet med autolagring, og valideringsfeil vist med rød kant og en teller som deaktiverer publisering.
UX-DR14: Kartvelger der posten flyttes ved å dra, med radius som sirkel, og avvisning utenfor turens område. Turens område vises som en sirkel som arrangøren kan flytte og endre.
UX-DR15: Tilstandene i EXPERIENCE.md under State Patterns er implementert (tomt, genererer, feil, posisjon nektet, unøyaktig posisjon, låst, opplåst, sender, venter, godkjent, avvist, ingen ventende).
UX-DR16: Norsk mikrotekst etter tabellen under Voice and Tone. Ingen tekniske ord vises for brukeren.
UX-DR17: Tilgjengelighet: etiketter med rolle og tilstand, status vises aldri bare med farge, `aria-live` på ledertavle og status, trykkflater på minst 48 px og synlig fokus.
UX-DR18: Responsivt: deltakeren først for 360–430 px (maks 480 px bredde), og Utkast med to kolonner fra 1024 px.
UX-DR19: Feltbruk: høy kontrast, program og poster mellomlagres etter første lasting, og posisjonen spores bare mens Kart eller Post er åpen.
UX-DR20: Foto-input som åpner kameraet direkte og komprimerer i klienten.
UX-DR21: Deling ved publisering: turkode, lenke og QR-kode. Lenken forhåndsutfyller turkoden.
UX-DR22: Faste lister for tema (aksentfarger som er forhåndsgodkjent for kontrast, og symboler) legges inn i DESIGN.md og brukes i toppen og aksentene på deltakersiden.
UX-DR23: Åpne poster (ikke geolåst) får en egen markør og en egen tilstand på postkortet. Knappen «Løs oppgaven» er alltid aktiv for dem.
UX-DR24: Deaktiverte poster: nedtonet markør med rød kant og chipen «Deaktivert». Oppgaven er skjult, og lag som har fullført, ser fortsatt hake og poeng.
UX-DR25: Endret-merke per element på programkort og poster (forsvinner bare for elementet som åpnes), og endringsbanneret «Programmet er oppdatert.» som åpner I dag med endringene uthevet og har «Merk alle som sett».
UX-DR26: Rediger underveis er laget for mobil først, med «+ Post», «+ Programpost», «Ny post med KI», «Deaktiver» og «Aktiver igjen», og bekreftelsen «Lagret. Deltakerne ser endringen nå.»

### Dekning av funksjonelle krav

FR1: Epic 2 – Beskrive turen i naturlig språk
FR2: Epic 2 – Generert og validert utkast, med ett nytt forsøk ved feil
FR3: Epic 2 (redigering) og Epic 6 (regenerering av enkeltdeler)
FR4: Epic 2 – Publisering med turkode, lenke og QR
FR5: Epic 1 (validering av poster) og Epic 2 (arrangøren setter poster og `requires_location`)
FR6: Epic 3 – Opplåsing ved posisjon (ekte eller simulert)
FR7: Epic 3 (tekstsvar) og Epic 4 (bilde)
FR8: Epic 3 (poengregler) og Epic 4 (lag og fordeling)
FR9: Epic 4 – Poeng i sanntid innen 5 s etter godkjenning
FR10: Epic 4 – Ledertavle og status på mobil
FR11: Epic 1 – Seed-tur lokalt
FR12: Epic 1 (demo-modus og rollevalg) og Epic 2 (mock-agent)
FR13: Epic 2 – Innlogging for arrangør
FR14: Epic 3 – Deltaker blir med via turkode
FR15: Epic 3 – Godkjenning eller avvisning av innsendinger
FR16: Epic 2 – Tema per tur
FR17: Epic 5 (endringer for hånd) og Epic 6 (KI-forslag underveis)
FR18: Epic 5 – Deltakerne ser endringer med en gang
NFR1–NFR10: verifiseres i Epic 7 (og løpende i hver epic)

## Liste over epics

### Epic 1: Prøvetur i demo-modus på mobil
Sensor eller deltaker starter appen lokalt uten nøkler, velger rolle og ser prøveturen: programmet per dag og kartet med poster, i riktig stil. Epicen setter opp prosjektet fra blåtur-malen, med domenekjerne, seed-tur, porter med demo-adaptere og designtokens.
**FR dekket:** FR5, FR11, FR12

### Epic 2: Arrangøren lager og publiserer en tur med KI
Arrangøren logger inn, beskriver turen, får et validert utkast med tema, redigerer det og publiserer med turkode, lenke og QR-kode, både i mock-modus og ekte modus.
**FR dekket:** FR1, FR2, FR3, FR4, FR5, FR12, FR13, FR16

### Epic 3: Deltakerne løser rebusen, og arrangøren godkjenner
Deltakeren blir med via turkode, låser opp poster med ekte eller simulert posisjon og sender tekstsvar. Arrangøren godkjenner eller avviser, og laget får poeng.
**FR dekket:** FR6, FR7, FR8, FR14, FR15

### Epic 4: Lag, sanntids ledertavle og bilder
Arrangøren fordeler deltakerne på lag. Deltakerne sender bilder, og alle ser ledertavlen oppdatert innen 5 s etter godkjenning.
**FR dekket:** FR7, FR8, FR9, FR10

### Epic 5: Arrangøren justerer turen underveis
Arrangøren kan endre, legge til og deaktivere programposter og poster på en publisert tur fra mobilen, og deltakerne ser endringene med en gang.
**FR dekket:** FR17, FR18

### Epic 6: Regenerering og KI-forslag
Arrangøren ber om nytt forslag for én dag, post eller programpost, eller om en ny post med KI, både i utkast og underveis på turen, uten at resten endres.
**FR dekket:** FR3, FR17

### Epic 7: Løsningen kan verifiseres og leveres
Sensor kan kjøre og verifisere hele løsningen etter README: ende-til-ende-tester i demo-modus, måling av suksesskriteriene, deploy og øving på demoen.
**FR dekket:** Ingen nye. Epicen verifiserer NFR1–NFR10.

## Epic 1: Prøvetur i demo-modus på mobil

Sensor eller deltaker starter appen lokalt uten nøkler, velger rolle og ser prøveturen: programmet per dag og kartet med poster, i riktig stil.

### Story 1.1: Appen starter i demo-modus fra blåtur-malen

Som sensor
ønsker jeg å starte appen med `npm install && npm run dev` uten noen konfigurasjon
slik at jeg kan prøve løsningen uten gruppens nøkler.

**Akseptansekriterier:**

**Gitt** en ren klone av repoet uten `.env`-fil
**Når** jeg kjører `npm install && npm run dev`
**Så** starter appen i demo-modus og viser demo-banneret (UX-DR10)
**Og** `npm test` kjører Vitest grønt

**Gitt** at blåtur-malen er lastet opp
**Når** prosjektet settes opp
**Så** bygger det på malen og er løftet til Vite `react-ts`, TypeScript og Tailwind 4 med tokenene fra DESIGN.md i temaet (UX-DR1)
**Og** hvis malen ikke er inne, brukes den rene Vite-malen

**Gitt** kildekoden
**Når** `VITE_APP_MODE` leses
**Så** skjer det bare i `src/app/services.ts` (AD-4)
**Og** `.env.example` dokumenterer bare offentlige `VITE_`-variabler, uten hemmeligheter (AD-9)

**Gitt** et nytt oppsett
**Når** avhengighetene installeres
**Så** er versjonene i spinen sjekket mot npm på nytt, og `package-lock.json` er committet

### Story 1.2: Turdata valideres av domenekjernen

Som arrangør
ønsker jeg at alle turdata blir kontrollert mot faste regler
slik at jeg aldri ser eller publiserer en ødelagt tur.

**Akseptansekriterier:**

**Gitt** en `TripDraft` (zod-skjema i `src/domain/schema.ts` med område, dager, programposter, poster med `requires_location`, lag og tema)
**Når** `validateTrip()` kjøres
**Så** returneres `{ ok: true }` for en gyldig tur
**Og** feil returneres som `issues` med sti og norsk melding

**Gitt** en tur der en dato i perioden mangler dag, en dag ligger utenfor perioden eller finnes to ganger, en dag mangler programposter, en post ligger utenfor området, `radius_m` er 0 eller lavere, eller et poengtall ikke er et positivt heltall
**Når** den valideres
**Så** avvises den med én konkret feil per brudd (FR2, FR5)
**Og** hvert av disse tilfellene har sin egen enhetstest

**Gitt** to kjente koordinater
**Når** `distanceMeters()` i `geo.ts` kalles
**Så** er svaret innenfor 1 % av fasiten i enhetstesten
**Og** `src/domain` importerer bare `zod` (AD-1)

### Story 1.3: Prøveturen lastes fra seed-data

Som sensor
ønsker jeg at en ferdig prøvetur er tilgjengelig med en gang
slik at jeg kan se en realistisk tur uten å generere noe (FR11).

**Akseptansekriterier:**

**Gitt** `src/seed/demo-trip.json`
**Når** testsuiten kjører
**Så** validerer seed-turen uten feil med `validateTrip()` (NFR2, NFR3)
**Og** den har minst to dager, ett lag per farge-token som brukes, og både geolåste og åpne poster

**Gitt** demo-modus ved første oppstart
**Når** appen lastes
**Så** legger demo-`TripRepo` seed-turen i localStorage
**Og** «Tilbakestill demo» i demo-banneret laster seed-turen på nytt

### Story 1.4: Rollevalg på startsiden

Som sensor
ønsker jeg å velge om jeg er arrangør eller deltaker
slik at jeg kan prøve begge sider av appen (FR12).

**Akseptansekriterier:**

**Gitt** Start-flaten i demo-modus
**Når** jeg velger «Deltaker»
**Så** havner jeg på I dag-fanen for prøveturen, uten innlogging

**Gitt** Start-flaten i demo-modus
**Når** jeg velger «Arrangør»
**Så** havner jeg på Mine turer med prøveturen i lista
**Og** rollen huskes i fanen til jeg bytter den via demo-banneret

**Gitt** Start-flaten
**Når** den vises på 360 px bredde
**Så** er begge valgene primær- eller sekundærknapper på minst 48 px (UX-DR2)

### Story 1.5: Deltakeren ser dagens program

Som deltaker
ønsker jeg å se dagens program på mobilen
slik at jeg vet hva som skjer nå og senere i dag.

**Akseptansekriterier:**

**Gitt** at jeg er deltaker på prøveturen
**Når** I dag-fanen åpnes
**Så** ser jeg programkortene for dagens dato (eller første dag hvis turen ikke har startet), sortert på tid (UX-DR3)
**Og** aktiviteten som pågår nå er uthevet med venstrekant

**Gitt** deltakervisningen
**Når** den vises
**Så** har den bunnfanene I dag, Kart, Ledertavle og Laget, og den aktive fanen er markert (UX-DR9)
**Og** innholdet er maks 480 px bredt og sentrert på store skjermer (UX-DR18)

**Gitt** at programmet er lastet én gang
**Når** nettet forsvinner
**Så** vises programmet fortsatt fra mellomlageret (UX-DR19)

### Story 1.6: Deltakeren ser postene på kartet

Som deltaker
ønsker jeg å se postene på et kart og i en liste
slik at jeg finner veien til neste post.

**Akseptansekriterier:**

**Gitt** Kart-fanen
**Når** den åpnes
**Så** vises dagens poster som nummererte markører i riktig tilstand: låst eller åpen (`requires_location = false`) (UX-DR4, UX-DR23). Tilstanden fullført kommer med godkjenning i Story 3.5
**Og** kartet er zoomet slik at alle dagens poster synes

**Gitt** kartet
**Når** jeg trykker på en markør
**Så** vises postkortet nederst med navn og status (UX-DR5)
**Og** en åpen post viser oppgaveteksten direkte

**Gitt** I dag-fanen
**Når** jeg ruller ned
**Så** finnes en postliste med de samme postene og statusene, som et alternativ til kartet (UX-DR17)

## Epic 2: Arrangøren lager og publiserer en tur med KI

Arrangøren logger inn, beskriver turen, får et validert utkast med tema, redigerer det og publiserer med turkode, lenke og QR-kode, både i mock-modus og ekte modus.

### Story 2.1: Arrangøren logger inn med magisk lenke

Som arrangør
ønsker jeg å logge inn med e-posten min
slik at turene mine er mine og ingen andre kan endre dem (FR13).

**Akseptansekriterier:**

**Gitt** live-modus
**Når** jeg skriver e-posten min og trykker «Send lenke»
**Så** sender Supabase Auth en magisk lenke, og etter klikk er jeg innlogget på Mine turer

**Gitt** migrasjonen for denne storyen
**Når** den kjøres
**Så** finnes tabellen `trips` med `organizer_id` og `version`, og RLS gir bare eieren lesetilgang. Skriving skjer bare via funksjonene fra Story 2.4 (AD-8, AD-17)

**Gitt** to arrangører med hver sin tur
**Når** arrangør B prøver å lese eller endre turen til A med direkte API-kall
**Så** avvises det

**Gitt** demo-modus
**Når** jeg velger rollen arrangør
**Så** hoppes innloggingen over gjennom demo-`AuthPort`

### Story 2.2: Arrangøren beskriver en ny tur

Som arrangør
ønsker jeg å oppgi det viktigste i noen få felt og beskrive resten med egne ord
slik at KI-en får sikre fakta uten at jeg må fylle ut et langt skjema (FR1).

**Akseptansekriterier:**

**Gitt** Mine turer uten turer
**Når** siden vises
**Så** står teksten «Ingen turer ennå.» og knappen «Ny tur»

**Gitt** Ny tur
**Når** jeg lar Destinasjon, Fra, Til eller Deltakere stå tomme, setter til-dato før fra-dato, oppgir lag utenfor 1–6 eller flere lag enn deltakere, eller oppgir antall poster under 1
**Så** vises en inline-feil ved feltet, og «Lag utkast» sender ikke inn (UX-DR11)

**Gitt** Ny tur
**Når** jeg skriver under ca. 30 tegn og trykker «Lag utkast»
**Så** vises et hint inline om hva som mangler (sted, datoer, antall, program, rebus) (UX-DR11)

**Gitt** at jeg har fylt ut felt og skrevet tekst
**Når** jeg lukker og åpner siden igjen
**Så** er feltene og teksten gjenopprettet fra lokal lagring

**Gitt** gyldige felt og tekst
**Når** jeg trykker «Lag utkast»
**Så** blir de samlet til en `TripRequest` som validerer mot skjemaet (AD-15)

### Story 2.3: Utkast genereres med mock-agenten

Som sensor
ønsker jeg at «Lag utkast» fungerer uten KI-nøkkel
slik at hele arrangørflyten kan prøves lokalt (FR2, FR12).

**Akseptansekriterier:**

**Gitt** demo-modus og en gyldig beskrivelse
**Når** jeg trykker «Lag utkast»
**Så** viser Genererer fremdriftsstegene plan → innhold → kontroll (UX-DR12)
**Og** mock-`AgentPort` returnerer en gyldig `TripDraft` basert på seed, tilpasset periode, antall lag og antall poster fra `TripRequest`, som lagres som utkast og åpnes
**Og** destinasjonen er alltid prøveturens, og Genererer viser «Demo: KI-en er simulert, og destinasjonen er alltid prøveturens»

**Gitt** at genereringen pågår
**Når** jeg trykker «Lag utkast» igjen eller forlater siden
**Så** er knappen låst, og forlater jeg siden, avbrytes genereringen uten at beskrivelsen går tapt

**Gitt** at mocken er satt til å feile (testflagg)
**Når** genereringen kjøres
**Så** vises feiltilstanden med «Prøv igjen» og «Rediger beskrivelsen», og teksten beholdes

### Story 2.4: Utkast genereres med Claude i Edge Function

Som arrangør
ønsker jeg at KI-en lager et utkast basert på beskrivelsen min
slik at turen er klar på minutter (FR2, FR16).

**Akseptansekriterier:**

**Gitt** live-modus
**Når** `AgentPort` kaller `generate-trip`
**Så** kaller Edge Function Claude med `TripRequest` og nøkkelen fra Supabase-secret, og returnerer en `TripDraft` som har passert `validateTrip(draft, req)` (AD-2, AD-9, AD-15)
**Og** utkastet inneholder et tema valgt fra de faste listene og et område (`area`) rundt destinasjonen

**Gitt** et KI-svar som feiler valideringen
**Når** Edge Function behandler det
**Så** gjøres nøyaktig ett nytt kall med `issues` i prompten
**Og** hvis det andre svaret også feiler, returneres `{ ok:false, error:{ code:"VALIDATION_FAILED" } }` (AD-3)

**Gitt** migrasjonen for denne storyen
**Når** den kjøres
**Så** finnes `days`, `program_items`, `posts` og `teams` med `CHECK`-begrensninger og RLS som bare gir eieren lesetilgang
**Og** SQL-funksjonen `apply_trip_change` lagrer utkastet i én transaksjon, og `generate-trip` bruker den (AD-17)

**Gitt** produksjonsbygget av frontenden
**Når** det søkes etter `ANTHROPIC` og nøkkelverdien i `dist/`
**Så** finnes ingen treff (AD-9)

### Story 2.5: Arrangøren redigerer program og poster

Som arrangør
ønsker jeg å rette det KI-en har foreslått
slik at turen blir slik jeg vil ha den (FR3, FR5).

**Akseptansekriterier:**

**Gitt** Utkast med fanene Program, Poster, Lag og Poeng
**Når** jeg endrer et felt
**Så** lagres endringen automatisk, og bare det elementet endres (UX-DR13)

**Gitt** Poster-fanen
**Når** jeg drar en markør
**Så** flyttes posten, og radius vises som en sirkel
**Og** en posisjon utenfor turens område avvises med en forklaring (UX-DR14)
**Og** jeg kan slå `requires_location` av eller på per post

**Gitt** Poster-fanen
**Når** jeg flytter eller endrer størrelse på sirkelen for turens område
**Så** valideres alle poster mot det nye området, og poster utenfor får en feil (UX-DR14)

**Gitt** live-modus
**Når** en endring lagres
**Så** går den gjennom Edge Function `save-trip`, som validerer og kaller `apply_trip_change` i én transaksjon (AD-17)
**Og** et direkte skrivekall mot `posts` fra klienten avvises av RLS
**Og** et ugyldig utkast sendt direkte til `save-trip` gir `VALIDATION_FAILED` og endrer ingenting
**Og** lagres turen fra to enheter med samme `base_version`, får den siste `VERSION_CONFLICT` og henter turen på nytt

**Gitt** valideringsfeil i utkastet
**Når** de finnes
**Så** vises «N ting må rettes før publisering», og knappen Publiser er deaktivert

**Gitt** en bredde på minst 1024 px
**Når** Utkast vises
**Så** er innhold og kart i to kolonner (UX-DR18)

### Story 2.6: Turen får tema

Som arrangør
ønsker jeg å se og endre turens tema
slik at deltakersiden føles som vår tur (FR16).

**Akseptansekriterier:**

**Gitt** DESIGN.md
**Når** storyen er ferdig
**Så** inneholder den de faste listene `ThemeAccent` (aksentfarger som er sjekket for 4.5:1 kontrast) og `ThemeIcon`, de samme som enumene i `schema.ts` (UX-DR22, AD-14)

**Gitt** Utkast
**Når** jeg velger en annen aksent eller et annet ikon
**Så** vises en forhåndsvisning av toppen på deltakersiden

**Gitt** en tur med ugyldig eller manglende tema
**Når** deltakersiden vises
**Så** brukes standardtemaet

### Story 2.7: Arrangøren publiserer turen

Som arrangør
ønsker jeg å publisere turen og dele den
slik at deltakerne kommer inn (FR4).

**Akseptansekriterier:**

**Gitt** et gyldig utkast
**Når** jeg trykker «Publiser» og bekrefter
**Så** får turen `status = published` og en unik `join_code`
**Og** jeg ser turkoden, en lenke som forhåndsutfyller koden, og en QR-kode (UX-DR21)

**Gitt** et utkast med valideringsfeil
**Når** jeg prøver å publisere
**Så** er det ikke mulig

**Gitt** live-modus
**Når** jeg publiserer
**Så** skjer det via `save-trip` med `publish = true`, som validerer på serveren, så et ugyldig utkast ikke kan publiseres, heller ikke med direkte kall (AD-17)

## Epic 3: Deltakerne løser rebusen, og arrangøren godkjenner

Deltakeren blir med via turkode, låser opp poster med ekte eller simulert posisjon og sender tekstsvar. Arrangøren godkjenner eller avviser, og laget får poeng.

### Story 3.1: Deltakeren blir med via turkode

Som deltaker
ønsker jeg å bli med på turen med koden og navnet mitt
slik at jeg slipper å lage konto (FR14).

**Akseptansekriterier:**

**Gitt** en lenke med turkode
**Når** jeg åpner den
**Så** er koden forhåndsutfylt, og jeg trenger bare å skrive navnet mitt

**Gitt** live-modus
**Når** jeg sender inn gyldig kode og navn
**Så** opprettes en anonym Supabase-sesjon, og `join_trip(code, name)` oppretter en `participant` som plasseres på laget med færrest medlemmer
**Og** sesjonen overlever at nettleseren lukkes og åpnes igjen

**Gitt** migrasjonen for denne storyen
**Når** den kjøres
**Så** finnes `participants` med RLS og RPC-en `join_trip`, og storyen virker på en ren database uten senere migrasjoner (AD-8)

**Gitt** feil kode eller en tur som ikke er publisert
**Når** jeg sender inn
**Så** vises «Fant ikke turen. Sjekk koden og prøv igjen.» eller «Turen er ikke åpnet ennå.», og det jeg har skrevet, blir stående

**Gitt** to publiserte turer
**Når** en deltaker på tur X leser data for tur Y med direkte API-kall
**Så** får hen ingen rader (AD-8)

### Story 3.2: Poster låses opp når jeg er på stedet

Som deltaker
ønsker jeg at oppgaven åpner seg når jeg kommer fram
slik at rebusen føles som en ekte jakt (FR6).

**Akseptansekriterier:**

**Gitt** en geolåst post og posisjonen min fra `PositionSource`
**Når** avstanden er mindre enn eller lik `radius_m`
**Så** blir posten opplåst, og «Løs oppgaven» blir aktiv
**Og** utenfor radius står det «Du er X m unna. Gå nærmere for å låse opp.»

**Gitt** at jeg har nektet tilgang til posisjon
**Når** jeg åpner Kart
**Så** vises en forklaring og «Prøv igjen», og geolåste poster forblir låst, mens åpne poster virker

**Gitt** Kart eller Post
**Når** jeg forlater fanen
**Så** stopper posisjonssporingen, og posisjonen blir aldri sendt eller lagret (AD-6, NFR10)

### Story 3.3: Posisjonssimulator i demo-modus

Som sensor
ønsker jeg å simulere at jeg står ved en post
slik at opplåsing kan prøves og testes innendørs.

**Akseptansekriterier:**

**Gitt** demo-modus og Kart
**Når** jeg trykker på kartet eller velger «Gå til post N»
**Så** blir den simulerte posisjonen satt dit, og opplåsingen reagerer som med ekte GPS (UX-DR10)

**Gitt** en Vitest-test med en tabell av posisjoner rundt en post
**Når** opplåsingen beregnes
**Så** stemmer 100 % av tilfellene med fasiten, også posisjoner like innenfor, nøyaktig på og like utenfor radius (NFR4)

### Story 3.4: Deltakeren sender tekstsvar

Som deltaker
ønsker jeg å sende svar på en opplåst post
slik at laget kan få poeng (FR7).

**Akseptansekriterier:**

**Gitt** en opplåst eller åpen post
**Når** jeg skriver svaret og trykker Send
**Så** blir knappen en spinner, og det opprettes en `submission` med `status = pending` for laget mitt
**Og** jeg ser «Sendt! Venter på godkjenning fra arrangøren.» og en Venter-chip (UX-DR6)
**Og** kvitteringen vises først når serveren har bekreftet. Feiler sendingen, vises «Ingen dekning. Prøv igjen når du har nett.», og svaret blir stående (UX-DR15)

**Gitt** migrasjonen for denne storyen
**Når** den kjøres
**Så** finnes `submissions` med `awarded_points` og fremmednøkkelen `post_id` med `ON DELETE RESTRICT`, og RLS tillater bare at en deltaker oppretter innsendinger med status `pending` for eget lag (AD-7, AD-13)

**Gitt** en deltaker
**Når** hen med direkte API-kall sender inn med en annen turs `post_id`, et annet lags `team_id` eller `status = approved`
**Så** avvises kallet

**Gitt** Laget-fanen
**Når** den åpnes
**Så** ser jeg lagets innsendinger med status

### Story 3.5: Arrangøren godkjenner eller avviser

Som arrangør
ønsker jeg å godkjenne eller avvise innsendinger
slik at bare riktige svar gir poeng (FR15).

**Akseptansekriterier:**

**Gitt** en publisert tur med innsendinger som venter
**Når** jeg åpner turen
**Så** ser jeg en teller («4 venter») og en Godkjenning-kø med kort som viser svar, lag, post og tid (UX-DR8)

**Gitt** et godkjenningskort
**Når** jeg trykker Godkjenn eller Avvis (med valgfri begrunnelse)
**Så** sendes beslutningen etter 5 s til `review_submission`, som endrer statusen og ved godkjenning setter `awarded_points` til postens poeng (AD-5, AD-7)
**Og** trykker jeg «Angre» innen 5 s, sendes ingenting

**Gitt** en deltaker eller en arrangør av en annen tur
**Når** hen kaller `review_submission` direkte
**Så** avvises kallet

**Gitt** en innsending som allerede er godkjent
**Når** `review_submission` kalles med samme beslutning igjen
**Så** endres ingenting, og poengene telles fortsatt én gang

**Gitt** at laget har en godkjent innsending på en post
**Når** deltakerne ser kartet
**Så** har posten tilstanden fullført (UX-DR4)

**Gitt** en avvist innsending
**Når** deltakeren ser den
**Så** vises en Avvist-chip med begrunnelse, og laget kan sende inn på nytt

**Gitt** en tom kø
**Når** Godkjenning vises
**Så** står det «Alt er godkjent. Godt jobbet!»

### Story 3.6: Poeng beregnes fra godkjente innsendinger

Som deltaker
ønsker jeg å se lagets poeng
slik at jeg vet hvordan vi ligger an (FR8).

**Akseptansekriterier:**

**Gitt** godkjente, ventende og avviste innsendinger, også flere godkjente på samme post
**Når** `scoring.ts` og viewet `team_scores` beregner poengene
**Så** teller bare `awarded_points` fra godkjente innsendinger, maks én gang per lag og post, og begge gir samme svar på de samme testtilfellene (AD-5)
**Og** databasen tillater ikke to godkjente innsendinger for samme lag og post

**Gitt** at postens poeng endres etter at en innsending er godkjent
**Når** poengene beregnes
**Så** er lagets sum uendret (AD-5)

**Gitt** to turer
**Når** en deltaker leser `team_scores`
**Så** får hen bare rader for sin egen tur

**Gitt** poengregler i utkastet med tomme eller negative verdier
**Når** de valideres
**Så** avvises de

**Gitt** Laget-fanen
**Når** den åpnes eller oppdateres
**Så** vises lagets poengsum

## Epic 4: Lag, sanntids ledertavle og bilder

Arrangøren fordeler deltakerne på lag. Deltakerne sender bilder, og alle ser ledertavlen oppdatert innen 5 s etter godkjenning.

### Story 4.1: Arrangøren fordeler deltakerne på lag

Som arrangør
ønsker jeg å flytte deltakere mellom lag
slik at lagene blir slik jeg vil ha dem (FR8).

**Akseptansekriterier:**

**Gitt** Turoversikt for en publisert tur
**Når** jeg flytter en deltaker til et annet lag
**Så** oppdateres `team_id`, og deltakeren ser det nye laget med lagfarge på Laget-fanen

**Gitt** at en deltaker har innsendinger
**Når** hen flyttes
**Så** blir innsendingene værende hos laget som sendte dem

### Story 4.2: Deltakeren ser ledertavlen

Som deltaker
ønsker jeg å se alle lagene rangert etter poeng
slik at konkurransen blir synlig (FR10).

**Akseptansekriterier:**

**Gitt** Ledertavle-fanen
**Når** den åpnes
**Så** vises lagene rangert etter poeng med plassering, lagfarge, navn og poeng i `score`, og mitt eget lag er uthevet (UX-DR7)

**Gitt** at plasseringene endres
**Når** ledertavlen oppdateres
**Så** flyttes radene med en animasjon, unntatt når brukeren har bedt om redusert bevegelse
**Og** endringen annonseres via `aria-live="polite"` (UX-DR17)

**Gitt** at jeg drar ned
**Når** jeg slipper
**Så** hentes poengene på nytt

**Gitt** to lag med lik poengsum
**Når** ledertavlen vises
**Så** får de samme plassering og sorteres alfabetisk

### Story 4.3: Ledertavlen oppdateres i sanntid

Som deltaker
ønsker jeg at ledertavlen oppdateres av seg selv
slik at jeg ser poengene straks de er godkjent (FR9).

**Akseptansekriterier:**

**Gitt** live-modus og to klienter på samme tur
**Når** arrangøren godkjenner en innsending
**Så** henter begge klientene `team_scores` på nytt via et signal fra Supabase Realtime, og viser ny sum innen 5 s (AD-10, NFR5)

**Gitt** demo-modus og to faner (arrangør og deltaker)
**Når** arrangøren godkjenner
**Så** oppdateres deltakerfanen via `BroadcastChannel` uten at siden lastes på nytt

**Gitt** at et signal mangler
**Når** fanen får fokus igjen
**Så** hentes poengene på nytt

### Story 4.4: Deltakeren sender bilde

Som deltaker
ønsker jeg å ta et bilde som svar
slik at vi kan løse fotooppgaver (FR7).

**Akseptansekriterier:**

**Gitt** en post med `answer_type` lik `photo` eller `text_or_photo`
**Når** jeg trykker for å legge til bilde
**Så** åpnes kameraet direkte, med galleri som alternativ (UX-DR20)
**Og** bildet komprimeres til maks 1600 px før opplasting

**Gitt** live-modus
**Når** bildet sendes
**Så** lagres det i den private bucketen `submissions/{trip_id}/{submission_id}.jpg`, og tilgangen følger RLS for turen (AD-11)
**Og** arrangøren ser bildet på godkjenningskortet via en signert URL

**Gitt** demo-modus
**Når** bildet sendes
**Så** lagres det i IndexedDB og vises på godkjenningskortet

**Gitt** en fil som ikke er JPEG, PNG eller WebP, eller som er større enn 15 MB før komprimering `[ASSUMPTION]`
**Når** jeg prøver å sende den
**Så** avvises den med en forklaring

**Gitt** at opplastingen feiler
**Når** jeg sender
**Så** vises ingen «Sendt»-kvittering, og bildet og teksten blir stående så jeg kan prøve igjen

**Gitt** en deltaker eller arrangør på en annen tur
**Når** hen prøver å hente eller signere et bilde fra denne turen
**Så** avvises det (AD-11)

## Epic 5: Arrangøren justerer turen underveis

Arrangøren kan endre, legge til og deaktivere programposter og poster på en publisert tur fra mobilen, og deltakerne ser endringene med en gang.

### Story 5.1: Arrangøren endrer en publisert tur

Som arrangør
ønsker jeg å endre programposter og poster mens turen pågår
slik at jeg kan bytte til den kule restauranten vi fant underveis (FR17).

**Akseptansekriterier:**

**Gitt** en publisert tur
**Når** jeg trykker «Endre turen» i Turoversikt
**Så** åpnes Rediger underveis med de samme fanene som Utkast, laget for mobil først (UX-DR26)

**Gitt** en endring i en programpost eller post
**Når** jeg lagrer
**Så** kjøres `validateTrip()`, i live-modus på serveren via `save-trip` (AD-17). Hvis den er gyldig, lagres endringen med ny `updated_at`, og jeg ser «Lagret. Deltakerne ser endringen nå.» (AD-13)
**Og** hvis den er ugyldig, lagres ingenting, og feilen vises ved feltet

**Gitt** en post som har godkjente innsendinger
**Når** jeg endrer poengene
**Så** gjelder de nye poengene bare fremtidige godkjenninger, og ledertavlen er uendret (AD-5)

### Story 5.2: Arrangøren legger til nye poster og programposter underveis

Som arrangør
ønsker jeg å legge til en ny rebuspost eller aktivitet når jeg kommer på noe
slik at turen kan utvikle seg underveis (FR17).

**Akseptansekriterier:**

**Gitt** Rediger underveis
**Når** jeg trykker «+ Post» eller «+ Programpost» og fyller ut
**Så** legges elementet til på riktig dag og blir validert, og nye poster kan settes på kartet med kartvelgeren (UX-DR14)

**Gitt** en ny post
**Når** den er lagret
**Så** kan deltakerne låse den opp og sende inn på den på samme måte som andre poster

### Story 5.3: Arrangøren deaktiverer en post

Som arrangør
ønsker jeg å deaktivere en post som ikke fungerer lenger
slik at ingen går dit, uten at lagene mister poeng de har fått (FR17).

**Akseptansekriterier:**

**Gitt** en post med godkjente innsendinger
**Når** jeg trykker «Deaktiver» og bekrefter
**Så** får posten `status = deactivated`, og poengene den har gitt, teller fortsatt i `team_scores` (AD-5, AD-13)
**Og** sletting er ikke mulig for denne posten, verken i UI eller med direkte kall (databasen avviser det med `ON DELETE RESTRICT`)

**Gitt** en deaktivert post
**Når** en deltaker åpner den
**Så** er markøren nedtonet med rød kant, chipen «Deaktivert» vises, og nye innsendinger avvises både i UI og i RLS (UX-DR24)
**Og** lag som har fullført posten, ser fortsatt hake og poeng

**Gitt** en deaktivert post
**Når** jeg trykker «Aktiver igjen»
**Så** blir den aktiv igjen

**Gitt** en post uten innsendinger
**Når** jeg sletter den
**Så** blir den fjernet

### Story 5.4: Deltakerne ser endringer med en gang

Som deltaker
ønsker jeg å se med en gang hva arrangøren har endret
slik at jeg ikke går til den gamle restauranten (FR18).

**Akseptansekriterier:**

**Gitt** live-modus og en deltaker på turen
**Når** arrangøren lagrer en endring
**Så** får deltakeren et signal via `RealtimePort.onTripChanged` og henter turen på nytt innen 5 s (AD-16)

**Gitt** demo-modus og to faner
**Når** arrangøren lagrer en endring
**Så** oppdateres deltakerfanen via `BroadcastChannel`

**Gitt** elementer som er endret etter deltakerens `baseline_at` og etter at deltakeren sist så akkurat det elementet
**Når** deltakersiden vises
**Så** har de merket «Endret», og banneret «Programmet er oppdatert.» vises øverst (UX-DR25, AD-16)
**Og** et trykk på banneret åpner I dag med endringene uthevet

**Gitt** at middagen og post 4 er endret
**Når** deltakeren bare åpner middagen
**Så** har post 4 fortsatt merket «Endret»

**Gitt** at deltakeren trykker «Merk alle som sett»
**Når** en ny endring kommer etterpå
**Så** får det nye elementet merket, og banneret vises igjen

**Gitt** en deltaker som blir med etter at turen er endret
**Når** turen lastes første gang
**Så** vises ingen «Endret»-merker

## Epic 6: Regenerering og KI-forslag

Arrangøren ber om nytt forslag for én dag, post eller programpost i naturlig språk, uten at resten endres.

### Story 6.1: Arrangøren regenererer én post

Som arrangør
ønsker jeg å skrive «gjør denne posten vanskeligere» og få et nytt forslag
slik at jeg slipper å starte på nytt (FR3).

**Akseptansekriterier:**

**Gitt** en post i Utkast
**Når** jeg skriver en instruksjon og trykker «Nytt forslag»
**Så** kalles `AgentPort.regenerate({ kind:"post", id, instruction })` (mock i demo, `regenerate-part` i live)
**Og** forslaget vises ved siden av den gjeldende posten med «Bruk» og «Behold gammel»

**Gitt** at jeg velger «Bruk»
**Når** posten slås sammen med turen
**Så** valideres hele turen. Bare posten med samme `id` er endret, og et ugyldig resultat blir ikke tatt i bruk (AD-12)

### Story 6.2: Arrangøren regenererer en dag eller en programpost

Som arrangør
ønsker jeg å gi en instruksjon som «bytt ut dag 2» for en dag eller en programpost
slik at jeg kan justere større deler av turen.

**Akseptansekriterier:**

**Gitt** en dag eller en programpost i Utkast
**Når** jeg ber om nytt forslag
**Så** fungerer det som i Story 6.1, med `kind` lik `day` eller `program_item`
**Og** poster som har innsendinger på en publisert tur, beholdes eller deaktiveres, men slettes aldri (AD-13)

### Story 6.3: KI-forslag på en publisert tur

Som arrangør
ønsker jeg å be KI-en om «en ny post ved fjorden» eller «en ny aktivitet etter lunsj» mens turen pågår
slik at jeg får gode idéer raskt også underveis (FR3, FR17).

**Akseptansekriterier:**

**Gitt** Rediger underveis på en publisert tur
**Når** jeg trykker «Ny post med KI» eller «Nytt forslag» på et element, og skriver en instruksjon
**Så** kalles `AgentPort.regenerate` med `kind` lik `new_post`, `new_program_item` eller et eksisterende element (AD-12)
**Og** forslaget vises med «Bruk» og «Forkast»

**Gitt** at jeg trykker «Bruk»
**Når** hele turen er validert
**Så** lagres forslaget og går live som i Story 5.1. Ingenting når deltakerne før jeg har trykket «Bruk»

## Epic 7: Løsningen kan verifiseres og leveres

Sensor kan kjøre og verifisere hele løsningen etter README: ende-til-ende-tester i demo-modus, måling av suksesskriteriene, deploy og øving på demoen.

### Story 7.1: Kjerneflyten testes ende til ende

Som sensor
ønsker jeg en automatisk test av hele flyten
slik at jeg ser at løsningen virker (NFR8).

**Akseptansekriterier:**

**Gitt** demo-modus
**Når** `npm run e2e` kjører Playwright
**Så** går testen gjennom Flyt 4 i EXPERIENCE.md: rollevalg, Lag utkast (mock), publiser, deltaker blir med, simulert opplåsing, tekstsvar, godkjenning i en annen fane, og ledertavlen oppdateres
**Og** en endring underveis (bytte av sted på en programpost) vises i deltakerfanen med «Endret»-merke
**Og** testen er grønn

### Story 7.2: Tilgjengelighet, tekst og feltkvalitet er kontrollert

Som deltaker i felt
ønsker jeg at appen er lesbar og forståelig
slik at jeg kan bruke den i sollys og med én hånd.

**Akseptansekriterier:**

**Gitt** alle flater
**Når** de gjennomgås
**Så** finnes alle tilstandene fra State Patterns (UX-DR15), mikroteksten følger Voice and Tone uten tekniske ord (UX-DR16), og kravene i Accessibility Floor er oppfylt (UX-DR17)

**Gitt** produksjonsbygget
**Når** I dag-fanen måles tre ganger med Lighthouse i mobilprofil med 4G-struping og kald cache
**Så** er median Largest Contentful Paint under 3 s, og alle målingene er lagret (NFR7)

### Story 7.3: README og måling av suksesskriterier

Som sensor
ønsker jeg en README og en tabell over suksesskriteriene med målte resultater
slik at jeg kan kjøre og vurdere løsningen.

**Akseptansekriterier:**

**Gitt** README
**Når** jeg følger den
**Så** kan jeg kjøre demo, tester og (valgfritt) live-modus

**Gitt** tabellen over suksesskriterier
**Når** den er fylt ut
**Så** har SM-1 til SM-8 faktiske målte verdier, og det står hvordan hver er målt
**Og** SM-2 rapporterer første forsøk, etter nytt forsøk og aksepterte utkast hver for seg, målt på ekte KI-output
**Og** SM-4 har både resultatet av de deterministiske testene og en felttest med ekte GPS etter en beskrevet protokoll
**Og** tiden fra prompt til publisert tur er målt med 2–3 fiktive turer og er under 30 minutter (NFR1)
**Og** andelen KI-genererte poster som ble beholdt uten redigering, er telt opp for de samme turene (NFR6)
**Og** én person uten teknisk bakgrunn har laget og publisert en tur uten hjelp, og observasjonene er notert (NFR9)

### Story 7.4: Live-oppsett og deploy

Som arrangør
ønsker jeg at appen kjører på nett
slik at den kan brukes på en ekte tur.

**Akseptansekriterier:**

**Gitt** et Supabase-prosjekt og en Vercel-konto
**Når** stegene for live-oppsett i README følges
**Så** er migrasjonene kjørt, Edge Functions er deployet med Claude-secret, bucketen er opprettet, og frontenden er deployet med `VITE_APP_MODE=live`
**Og** flyten fra Story 7.1 er gjort manuelt på to mobiler

**Gitt** live-modus med to arrangører og to turer
**Når** tilgangstestene kjøres (direkte kall mot tabeller, `team_scores`, `join_trip`, `review_submission`, `save-trip` og Storage)
**Så** får ingen lese- eller skrivetilgang til den andre turen, og resultatet er dokumentert
