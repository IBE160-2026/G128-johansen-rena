---
title: "PRD: TripBuilder AI"
status: draft
created: 2026-10-11
updated: 2026-10-28
---

# PRD: TripBuilder AI
*Arbeidstittel — bekreftes før finalisering.*

## 0. Dokumentformål

Dette dokumentet er produktkravene for TripBuilder AI, rettet mot prosjektgruppen, faglærer og senere downstream-workflow som arkitektur, UX og epics/stories. PRD-en bruker presise domeneuttrykk og grupperer funksjonalitet i krav som kan testes. Arbeidet bygger videre på produktbrevet og er ikke ment å duplisere detaljert arkitekturkunnskap; tekniske valg og dyptgående design flyttes til addendum eller senere arkitekturarbeid.

## 1. Visjon

TripBuilder AI skal gjøre det raskt og enkelt for arrangører å lage en ferdig, mobilvennlig deltakernettside for en tur eller et arrangement, uten å måtte bygge den manuelt fra bunnen. I stedet for å sette opp program, koordinater, rebusposter, lag og poengsystem fra scratch for hver tur, beskriver arrangøren turen i naturlig språk, og systemet bygger et plausibelt utkast som kan redigeres, forbedres og publiseres.

For deltakere skal opplevelsen være enkel og rask i felt: de skal kunne åpne en tur, se dagens program, samarbeide i lag, se ledertavlen og løse rebusposter som låses opp når de faktisk er på riktig sted. Dette skal oppleves som et verktøy for aktiviteten, ikke som en teknisk oppgave for arrangøren.

Kjerneverdien er at arrangør kan få en publiserbar tur på minutter, samtidig som deltakere får en konsistent og mobilvennlig opplevelse med tydelig status, geofencing og sanntidsoppdateringer. Dette er en produktivitetssatsning på en tydelig, underbetjent nisje: uformelle turer og arrangementer som har et program og en konkurranse, men som ikke trenger en egen teknisk utvikler.

## 2. Målgruppe

### 2.1 Jobs To Be Done

- Arrangøren trenger å lage en tur uten å bruke flere timer på manuelle oppsett.
- Arrangøren trenger å få forslag på program, rebusposter, lagstruktur og poengsystem basert på en enkel beskrivelse.
- Arrangøren trenger å kunne rette, regenerere eller finjustere utkastet før publisering.
- Deltakerne trenger en enkel mobilvisning av dagens innhold, med ledertavle og oppgaver som åpnes på riktig sted.
- Deltakerne trenger rask feedback når de har løst oppgaver, og at poeng oppdateres uten feiltolkning eller lang ventetid.
- Begge grupper trenger en løsning som virker i praksis i felt, ikke bare i en demonstrasjon i utviklingsmiljøet.

### 2.2 Ikke-brukere i v1

Dette er ikke målrettet mot:

- store organiserte konferanser med kompleks logistikk og mange roller
- profesjonelle event-byråer med behov for full custom løsning og egen drift
- native app-markedet med krav til appstore-distribusjon
- arrangementer med behov for avansert ruteoptimalisering eller kompleks finansstyring

### 2.3 Nøkkelbrukerreiser

#### UJ-1. Arrangøren beskriver en tur på naturlig språk
- Persona + kontekst: En arrangør skal planlegge en tur for venner eller studentgruppe uten teknisk bakgrunn.
- Inntrådt tilstand: Arrangøren har en idé om destinasjon, dato, program og opplevelser, men mangler struktur.
- Bane: Arrangøren fyller ut nøkkelfeltene, skriver en kort beskrivelse og publiserer. Systemet genererer første utkast.
- Klimaks: Systemet foreslår program, poster, oppgaver og lagstruktur som er logisk sammenhengt.
- Oppløsning: Arrangøren vurderer utkastet og redigerer det før publisering.
- Edge case: Hvis input er for kort eller inkonsekvent, skal systemet be om nærmere opplysninger eller tilby et mer generisk utkast.

#### UJ-2. Arrangøren retter og regenererer enkelt deler
- Persona + kontekst: Arrangøren vil forbedre ett element uten å starte helt på nytt.
- Inntrådt tilstand: Utkastet er publiserbart, men noen poster eller oppgaver må justeres.
- Bane: Arrangøren skriver en kort kommando i naturlig språk, som «gjør denne posten vanskeligere» eller «bytt ut dag 2». Systemet oppdaterer kun relevante deler.
- Klimaks: Arrangøren får et oppdatert forslag uten å gjøre alle felter om igjen.
- Oppløsning: Arrangøren godkjenner og publiserer den oppdaterte turen.

#### UJ-3. Deltaker ser dagens program og finner neste oppgave
- Persona + kontekst: Deltaker er i felt med mobiltelefonen og trenger rask access til dagens aktiviteter.
- Inntrådt tilstand: Deltakeren har logget inn og er på turen.
- Bane: Deltakeren åpner appen, ser dagens program, lagstatus og karta, velger neste post og går til den riktige oppgaven.
- Klimaks: Deltakeren får en avgrenset, relevant oppgave som låses opp når de faktisk er i nærheten.
- Oppløsning: Deltaker kan løse oppgaven, laste opp bilde eller svar og få poeng.

#### UJ-4. Deltaker får verdi i real time
- Persona + kontekst: Flere deltagere løser oppgaver samtidig.
- Inntrådt tilstand: Oppgaver er løst og poeng skal oppdateres live.
- Bane: Deltaker sender svar eller bilde. Arrangøren ser innsendingen og godkjenner eller avviser den. Ved godkjenning oppdateres lagstatus og ledertavle.
- Klimaks: Deltakeren får umiddelbar kvittering på at innsendingen er mottatt og venter på godkjenning. Når arrangøren godkjenner, får laget poengene.
- Oppløsning: Deltaker fortsetter med programmet og kan se endringen i ledertavlen uten å oppdatere manuelt.

#### UJ-5. Arrangøren justerer turen underveis
- Persona + kontekst: Arrangøren er på turen og finner en bedre restaurant, eller kommer på en ny rebuspost.
- Inntrådt tilstand: Turen er publisert, og deltakerne er i gang.
- Bane: Arrangøren åpner turen på mobilen, endrer programposten eller legger til en post, for hånd eller med forslag fra KI-en, og lagrer.
- Klimaks: Deltakerne ser endringen med en gang, med et «Endret»-merke og et banner om at programmet er oppdatert.
- Oppløsning: Turen fortsetter med det oppdaterte programmet uten at noe er tapt.
- Edge case: En post som noen lag allerede har løst, deaktiveres i stedet for å slettes. Poengene som er gitt, beholdes.

## 3. Ordliste

- Arrangør — personen som planlegger og publiserer turen.
- Deltaker — personen som deltar på turen fra mobilen.
- Tur — en reise eller et arrangement med et program, lag og rebusposter.
- Programpost — en aktivitet eller del av programmet for en dag eller et tidsintervall.
- Rebuspost — fysisk sted eller oppgave som deltakeren skal besøke og løse.
- Geofencing — mekanismen som låser opp en post når deltaker er innenfor en definert radius.
- Lagtavle / lederstavle — visning av lagstatus og poeng i real time.
- Seed-data — forhåndsdefinert eksempeldata som gjør en demo eller lokal kjøring mulig uten eksterne nøkler.
- Mock-modus — modus som simulerer KI eller dataproduksjon uten ekte ekstern API-kall.
- V1 — første versjon med kjernefunksjonalitet og gjennomførbar omfang.

## 4. Funksjoner

### 4.1 Arrangørflyt for turopprettelse

**Beskrivelse:** Arrangøren beskriver turen i naturlig språk og får et konkret utkast til turen som kan redigeres. Hensikten er å redusere etableringsarbeid og gjøre det mulig å opprette en ferdig tur uten manuell datainput.

**Funksjonelle krav:**

#### FR-1: Arrangør kan beskrive turen med naturlig språk
Arrangøren fyller ut noen få nøkkelfelt (destinasjon, fra- og til-dato, antall deltakere, og eventuelt antall lag og antall rebusposter) og beskriver resten med egne ord: program, rebus, tone og deltakergruppe. Realiserer UJ-1.

**Testbare konsekvenser:**
- Systemet må kunne ta imot nøkkelfelt og en beskrivelse i tekstform.
- Destinasjon, periode og antall deltakere er påkrevd. Til-dato kan ikke være før fra-dato, og antall lag må være mellom 1 og 6 og ikke flere enn antall deltakere.
- Antall rebusposter er valgfritt og må være minst 1 når det er oppgitt.
- Generert tur må ha samme periode som nøkkelfeltene, og samme antall lag og poster når de er oppgitt.
- Ugyldig eller tom input skal få en tydelig feilmelding eller en liten oppfølgingsspørsmålssvøm.

#### FR-2: Systemet genererer et ferdig utkast til tur
Systemet skal produsere en strukturert turmodell med enkeltdager, oppgaver, lag og poster innenfor en definert datamodell. Realiserer UJ-1.

**Testbare konsekvenser:**
- Generert JSON skal validere mot datamodellen og de regelbaserte kontrollene.
- Feiler valideringen, sendes feilene tilbake til KI-en for ett nytt forsøk. Feiler også det, får arrangøren en tydelig feilmelding.
- Hver dag i perioden skal ha minst én programpost (oppføring), og ingen dag kan ligge utenfor perioden eller finnes to ganger.
- Alle poster skal ha påkrevde felter som koordinat, tekst og type.

#### FR-3: Arrangør kan redigere og oppdatere utkastet
Arrangøren skal kunne rette oppføringer, endre poster, justere oppgaver og sende en ny forespørsel uten å måtte starte fra scratch. Realiserer UJ-2.

**Testbare konsekvenser:**
- Redigering av en enkelt post skal oppdatere turen uten å påvirke andre poster uten grunn.
- Arrangøren skal kunne sende et nytt naturlig språk-kall for enkelt element.

#### FR-4: Arrangør kan publisere turen
Når utkastet er godkjent, skal arrangøren kunne publisere turen slik at deltakere kan få tilgang. Realiserer UJ-1.

**Testbare konsekvenser:**
- Publiserte turer skal være tilgjengelige i deltakerflyten.
- Publisering skal kreve eksplisitt handling fra arrangør.

#### FR-16: Turen får et enkelt tema
KI-en (designsteget i agentkjeden) velger et tema for turen: en aksentfarge og et symbol fra faste lister. Arrangøren kan endre temaet. Deltakersiden bruker temaet i toppen og i aksentene. Realiserer UJ-1.

**Testbare konsekvenser:**
- Temaet validerer mot de faste listene.
- Ugyldig eller manglende tema gir et standardtema.

**Feature-specific NFRs:**
- Opplevelsen skal være enkel for brukere uten teknisk bakgrunn.
- Generert innhold skal være strukturert for å være lett å gjennomgå og redigere.

#### FR-17: Arrangør kan endre en publisert tur underveis
Arrangøren kan endre, legge til og deaktivere programposter og rebusposter på en publisert tur, også fra mobil. Endringene gjelder med en gang. Realiserer UJ-5.

**Testbare konsekvenser:**
- Hver endring valideres før den lagres, og en ugyldig endring lagres ikke.
- Nye poster og programposter kan legges til på en publisert tur.
- Endres poengene på en post, får alle lag som har løst den, de nye poengene, og ledertavlen oppdateres.
- En post som har godkjente innsendinger, kan ikke slettes, bare deaktiveres. Poengene den har gitt, beholdes på ledertavlen, og den tar ikke imot nye innsendinger.
- KI-forslag til endringer (regenerering eller «ny post med KI») kan brukes på en publisert tur, men går først live når arrangøren har godkjent dem.

#### FR-18: Deltakere ser endringer med en gang
Når arrangøren endrer turen, oppdateres deltakersiden uten manuell refresh, og deltakerne ser hva som er endret. Realiserer UJ-5.

**Testbare konsekvenser:**
- Endringen vises hos deltakerne innen 5 sekunder i testmiljø.
- Endrede programkort og poster får et «Endret»-merke, og et banner sier at programmet er oppdatert til deltakeren har sett det.
- Deaktiverte poster vises nedtonet og merket «Deaktivert».

### 4.2 Rebus og geofencing

**Beskrivelse:** Systemet skal lage poster som blir tilgjengelige når deltakeren faktisk er innenfor et gitt område. Dette gjør at oppgaven oppleves som en konkret fysiske oppgave i felt, ikke bare en digital liste.

**Funksjonelle krav:**

#### FR-5: Rebusposter får koordinater og radius
Systemet skal tilordne hver rebuspost koordinater og definere gyldig avstand for opplåsing. Realiserer UJ-3.

**Testbare konsekvenser:**
- Hver rebuspost skal ha gyldige koordinater.
- Radius skal være definert og konsistent.
- Poster uten gyldig område skal avvises i validering.
- Turens område foreslås av KI-en ut fra destinasjonen og kan justeres av arrangøren før publisering. Postene valideres mot dette området.
- Hver post er enten geolåst eller åpen (`requires_location`). Både KI-en og arrangøren kan sette dette per post. Åpne poster trenger koordinater for kartet, men låses ikke.

#### FR-6: Oppgave låses opp etter fysisk nærhet
Når deltakeren er innenfor definert radius på en geolåst post, skal oppgave åpne og være tilgjengelig for løsning. Realiserer UJ-3.

**Testbare konsekvenser:**
- Systemet skal styre oppgave status basert på brukerposisjon.
- Oppgaver som ikke er innenfor radius skal forbli låst.
- Opplåsing skal kunne testes med simulert posisjon.

#### FR-7: Deltaker kan sende svar eller bilde
Deltaker skal kunne sende tekst, foto eller annen definert respons til systemet som inngår i poengutregning. Realiserer UJ-4.

**Testbare konsekvenser:**
- Bildefil skal kunne lastes opp og lagres i riktig kontekst.
- Systemet skal kunne motta respons uten at appen krasjer.
- Deltakeren får umiddelbar kvittering med status «venter på godkjenning».

#### FR-15: Arrangør godkjenner eller avviser innsendinger
Arrangøren skal se innsendte svar og bilder per tur og godkjenne eller avvise hver av dem. Bare godkjente innsendinger gir poeng. Realiserer UJ-4.

**Testbare konsekvenser:**
- En innsending har status ventende, godkjent eller avvist.
- Ventende og avviste innsendinger gir ikke poeng.
- Deltakeren ser statusen på sin egen innsending.
- En godkjent innsending gir postens gjeldende poeng. Endres postens poeng, oppdateres poengene for alle lag som har løst den.

### 4.3 Lag, poeng og ledertavle

**Beskrivelse:** Turen skal gi en gruppestruktur hvor lag kan konkurrere, få poeng og se status i real time.

**Funksjonelle krav:**

#### FR-8: Arrangør kan definere lag og poengsystem
Systemet skal støtte opprettelse av lag og et poengsystem som kan brukes for både oppgaver og rebusposter. Realiserer UJ-1 og UJ-4.

**Testbare konsekvenser:**
- Lag skal kunne opprettes og tilordnes deltakere.
- Poeng skal beregnes basert på definert regelverk og kun fra godkjente innsendinger.
- Tomme eller ugyldige poengregler skal avvises.

#### FR-9: Poeng registreres og oppdateres i real time
Når arrangøren godkjenner en innsending, skal poeng oppdateres på riktig lag uten lang forsinkelse. Realiserer UJ-4.

**Testbare konsekvenser:**
- Endring i poeng skal være synlig for deltakere innen 5 sekunder etter godkjenning i testmiljø.
- Oppdatert lagstatus skal være konsistent over flere klienter.

#### FR-10: Deltakere kan se ledertavle og status
Deltakerne skal kunne se lagstatus, poeng og gjennomførte oppgaver i mobilvisning. Realiserer UJ-3 og UJ-4.

**Testbare konsekvenser:**
- Tidsstempel eller oppdragsstatus skal være tydelig.
- Ledertavle skal oppdatere uten manuell refresh.

### 4.4 Tilgang og roller

**Beskrivelse:** Arrangør og deltaker har ulike rettigheter. Terskelen for deltakere skal være lav i felt.

#### FR-13: Arrangør logger inn med konto
Arrangøren logger inn med e-post (magisk lenke) for å opprette, redigere, publisere og godkjenne. Realiserer UJ-1 og UJ-2.

**Testbare konsekvenser:**
- Bare innlogget arrangør kan endre eller publisere sin egen tur.
- Bare turens arrangør kan godkjenne innsendinger.

#### FR-14: Deltaker blir med via turkode én gang
Deltakeren skriver turkode og navn én gang og forblir innlogget gjennom turen uten å opprette konto. Realiserer UJ-3.

**Testbare konsekvenser:**
- Feil turkode gir tydelig feilmelding.
- Sesjonen overlever at nettleseren lukkes og åpnes igjen.
- Deltakeren ser bare data og bilder fra sin egen tur.

### 4.5 Lokal demo og testbarhet

**Beskrivelse:** For å kunne gjennomføre prosjektet med begrenset tid og uten egne API-nøkler, må løsningen kunne kjøres som demo med forhåndsdefinert innhold og mock-data.

**Funksjonelle krav:**

#### FR-11: Systemet skal ha seed-data for en prøvetur
Appen skal kunne starte med en ferdig tur i lokal demo-modus uten å være avhengig av eksterne kontoer eller betalte tjenester. Realiserer prosjektets gjennomførbarhet.

**Testbare konsekvenser:**
- Appen skal kunne starte med en gyldig demo-tur lokalt.
- Demo-tur skal kunne brukes i eksamen og sensor-test uten ekstra konfigurasjon.

#### FR-12: KI-delen skal kunne mockes eller stubs
Agentflyten skal kunne kjøres med mock- eller stub-data når eksterne API-er ikke er tilgjengelige. Realiserer prosjektets testbarhet.

**Testbare konsekvenser:**
- Systemet skal kunne håndtere et mock-svar uten at appen feiler.
- Kjerneflyten skal kunne testes i demo-modus uten autentisering mot externe tjenester.
- I demo-modus er det ingen innlogging. Brukeren velger rolle (arrangør eller deltaker).

## 5. Ikke-mål (eksplisitt)

- Vi bygger ikke en native app i v1.
- Vi bygger ikke betalings- eller bokningsflyt i v1.
- Vi bygger ikke ruteoptimalisering eller logistikk for flere turer samtidig.
- Vi fokuserer ikke på automatisk deploy til produksjonsmiljø som en kjernefunksjon i v1.
- Vi vil ikke ha et fullverdig faglig QA-system som separat tjeneste i første versjon.
- Vi vil ikke bruke det som mål å generere kode per tur; kjerneverdien er strukturert data og en standardmodell.

## 6. MVP-omfang

### 6.1 Inne i MVP

- Arrangør beskriver tur i naturlig språk.
- Turen genereres som strukturert modell med program, poster og lag.
- Arrangør kan redigere og regenerere enkelte deler, også etter publisering, og endringene vises hos deltakerne med en gang.
- Deltaker får en mobilvennlig deltakerside med program, ledertavle og kart.
- Geofencing-based oppgaveopplåsing.
- Poeng og lagstatus oppdateres i real time.
- Bildeopplasting som svar på oppgaver.
- Arrangør godkjenner innsendinger før de gir poeng.
- Arrangør med konto, og deltaker som blir med via turkode.
- Demo-/seed-data og mock-modus for lokal kjøring.

### 6.2 Utenfor MVP

- Betaling og booking.
- Native app.
- Automatisk deploy per arrangement.
- Kompleks ruteoptimalisering.
- Flere ulike premium-tema eller komplette AI-dynamiske designpakker.
- Full to-way AI-ekspert QA med flere betalte leverandører i samme versjon.
- Skjult destinasjon frem til avreise (fra proposal-eksempelet). Kan komme etter V1.

## 7. Succesmålinger

### Primære
- SM-1: Tid fra prompt til publisert, fungerende deltakerside skal være under 30 minutter uten manuell koding. Validerer FR-1, FR-2, FR-4.
- SM-2: 100 % av utkast som lagres eller vises for arrangøren, validerer mot datamodellen og reglene. I tillegg rapporteres andelen genereringer som lykkes på første forsøk og etter ett nytt forsøk, målt på ekte KI-output og ikke på mock (mål: minst 80 % etter nytt forsøk). Validerer FR-2, FR-5.
- SM-3: 100 % av rebusposter i testdata skal ha koordinater innenfor turens område, slik arrangøren har bekreftet det. Validerer FR-5.
- SM-4: 100 % av de deterministiske testene av opplåsing (posisjoner innenfor, på og utenfor radius) gir riktig svar. I en felttest med ekte GPS skal over 80 % av forsøkene låse opp korrekt. Protokollen (enheter, antall forsøk, nøyaktighet og falske opplåsinger) dokumenteres. Validerer FR-6.
- SM-5: Ledertavle skal oppdatere poeng på lag innen 5 sekunder etter at arrangøren har godkjent en innsending, i funksjonstest. Validerer FR-15, FR-8, FR-9, FR-10.

### Sekundære
- SM-6: Over 60 % av KI-genererte rebusposter blir beholdt uten redigering, målt på ekte KI-output og ikke på demo. Validerer FR-3.
- SM-7: I dag-fanen på deltakersiden har Largest Contentful Paint under 3 sekunder, målt med Lighthouse i mobilprofil med 4G-struping og kald cache, som median av 3 målinger på produksjonsbygget. Validerer FR-10.
- SM-8: Kjerneflyten skal kunne kjøres i lokal demo-modus uten eksterne kontoer. Validerer FR-11, FR-12.

### Motmål
- SM-C1: Produktet skal ikke optimumsere for "flest mulig funksjoner" på bekostning av tydelighet og stabilitet i v1.
- SM-C2: Produktet skal ikke øke kompleksitet i arrangørflyten dersom det gjør det vanskeligere for ikke-tekniske brukere å stole på resultatet.

## 8. Åpne spørsmål og beslutninger

**Besluttet (2026-10-28):**

1. *Minimumsdatamodell:* Besluttet i arkitekturen (ARCHITECTURE-SPINE.md, Structural Seed og AD-2, AD-5 og AD-17).
2. *Autentisering:* Arrangøren har konto (e-post med magisk lenke). Deltakeren blir med via turkode og navn én gang, og sesjonen huskes. Demo-modus har ingen innlogging, bare valg av rolle. Se FR-13 og FR-14.
3. *Ugyldige bilder og svar:* Arrangøren godkjenner eller avviser hver innsending, og poeng gis først ved godkjenning. Se FR-15.
5. *AI-QA:* V1 bruker kun regelbasert validering (skjema og regler). Feiler valideringen, får KI-en ett nytt forsøk med feilene. KI-QA kan komme i et senere trinn.

7. *Juks med posisjon:* Gruppen aksepterer at posisjonen bare sjekkes i nettleseren. Arrangørens godkjenning er kontrollen (2026-10-28).

**Fortsatt åpent:**

4. Hva er forventet testoppsett for sanntidsledertavle i eksamen, og hvilke mock-verdier er akseptable? *Utsatt. Avgjøres før sanntidstrinnet (trinn C).*
6. *Personvern for bilder:* Bilder av deltakere er personopplysninger. Samtykke, lagringstid og sletting må avklares før bildefunksjonen (Epic 4) bygges.

## 9. Assumsjonsindeks

- [ASSUMPTION: V1 skal fokuseres på kjerneflyten for arrangement og ikke på fullt produktstablet markedsoppsett.]
- [ASSUMPTION: Geo-radien er noe fast definert i datamodellen, og kan testes med simulerte posisjoner i lokale tester.]
- Arrangør og deltaker bruker samme plattform, men med ulike roller og rettigheter (bekreftet, se FR-13 og FR-14).
- Demo-modus starter uten autentisering mot Supabase eller eksterne KI-tjenester (bekreftet, se FR-12 og §8.2).
- QA-trinnet i v1 er regelbasert validering, og ekstra KI-QA kan komme senere (bekreftet, se §8.5).
- [ASSUMPTION: Markedet er en uformell gruppe og ikke stor institusjonell event-sektor.]
