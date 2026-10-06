# Tilbakemelding på product brief

| | |
|---|---|
| **Gruppe** | G128 – G128-johansen-rena |
| **Product brief** | `Leveranser/product-brief.md` (commit `bda4575`). Vurdert som gjeldende versjon (status «Fullført»). Kopien i `planning-artifacts/briefs/brief-G128-johansen-rena-2026-09-17/brief.md` er lik bortsett fra status, og `addendum.md` i den mappen er også lest. |
| **Tilbakemelding fra** | Faglærer i IBE160 (utarbeidet med KI-støtte) |
| **Dato** | 2026-10-06 |

## Samlet vurdering

- **Godt utgangspunkt med justeringer.** Gruppen kan gå videre og innarbeide punktene under.

**Det som er bra:**

1. Problemet er forankret i egen erfaring: dere har allerede bygget en deltakerside for én blåtur med React, Supabase og Leaflet, og vet hva som må gjøres på nytt for hver tur. Det gir troverdighet og et konkret referansepunkt for hva TripBuilder AI skal produsere.
2. Vurderingen av konkurrenter er ærlig og grundig: dere viser at Goosechase allerede har KI-generert, GPS-låst rebus, og skriver selv at differensieringen er midlertidig. Valget om at KI skal fylle en fast datamodell i stedet for å generere kode per tur, er klokt og gjør resultatet forutsigbart og testbart.

**De viktigste endringene:**

1. V1 er stor for to personer. Arrangørflyt med agentkjede og regenerering av enkeltdeler, deltakerside med program, lag, sanntids ledertavle, kart, geolåst rebus, bildeopplasting, poengregning, QA-agent på et annet KI-system og innlogging for to roller er mange krevende deler samtidig. Prioriter rekkefølgen tydelig, slik at en enklere versjon kan leveres hvis tiden ikke strekker til.
2. Planlegg hvordan sensor kan kjøre appen. Løsningen krever Supabase, Claude API, OpenAI API og Vercel. Sensor må kunne kjøre kjerneflyten lokalt etter README uten deres nøkler, for eksempel med en ferdig generert prøvetur som seed-data og en mock-modus for agentkjeden.
3. Gjør suksesskriteriene for KI-delen testbare. «Over 60 % av rebuspostene beholdes uten redigering» avhenger av hvem som tester. Legg til kriterier som kan sjekkes automatisk, for eksempel «generert JSON validerer mot datamodellen», «alle poster har koordinater innenfor turens område» og «programmet har én oppføring per dag i oppgitt periode».

## Vanskelighetsgrad og gjennomførbarhet

### Vurdert vanskelighetsgrad

- **Vanskelig**

**Sammenlignbart med:** 3) KI-styrt simulering av prosjektledelse (vanskelig) når det gjelder antall moduler som må henge sammen. Prosjektet har ikke tung beregningslogikk, men kombinerer agentkjede, sanntid, geolokasjon, filopplasting og to brukerroller.

**Begrunnelse:**

| Faktor | Nivå (lav / middels / høy) | Kommentar |
|---|---|---|
| Domenelogikk – hvor mange og hvor kompliserte regler og beregninger må stemme? | Middels | Poengregning, opplåsing innenfor radius og lag og ledertavle. Reglene er ikke kompliserte, men må stemme i felt. |
| Datamodell – antall entiteter og relasjoner mellom dem | Middels | Tur, dag, programpost, lag, deltaker, rebuspost med koordinater, oppgave, innlevering med bilde og poeng. |
| Brukere, roller og innlogging | Middels | Arrangør og deltakere med ulike rettigheter, og rask deltakerinnlogging én gang per tur. |
| KI-funksjonalitet i appen, f.eks. kall til språkmodell, prompts i koden og håndtering av usikre svar | Høy | Kjede av fire agenter (plan, innhold, design, QA) med strukturert JSON, regenerering av enkeltdeler og QA på et annet KI-system. |
| Integrasjoner og eksterne tjenester, f.eks. API-er, betaling og e-post | Høy | Supabase (database, auth, storage), Claude API, OpenAI API, kartdata og Vercel. |
| Sanntid, samtidighet eller flere brukere som påvirker hverandre | Høy | Ledertavle oppdatert hos andre deltakere på under 5 sekunder, med flere mobiler samtidig. |
| Filhåndtering, f.eks. opplasting, PDF-lesing og eksport | Middels | Bildeopplasting fra mobil i felt, med tilgangsbegrensning til turens deltakere. |
| Sikkerhet og personvern | Middels | Posisjonsdata og bilder av deltakere. Det er bra at dere har bestemt at posisjon ikke lagres som historikk. |

**Hva vanskelighetsgraden betyr for dere:**

- _Vanskelig:_ Et vanskelig prosjekt gir større mulighet for toppkarakter, men også større risiko. Definer en minimal versjon som sikkert kan bli ferdig, og legg resten i tydelige trinn etterpå. For dere kan den minimale versjonen være én KI-generering av en hel tur som arrangøren kan redigere, og en deltakerside med program, kart og geolåst rebus.

### Gjennomførbarhet med BMAD og Claude Code

Dere skal planlegge med BMAD (product brief → PRD → arkitektur → epics og stories) og implementere med Claude Code. Vurderingen under tar hensyn til at det må være tid til hele denne flyten, og til testing, retting og README til slutt.

| Spørsmål | Vurdering (OK / risiko / stor risiko) | Kommentar |
|---|---|---|
| **Tid og omfang** – kan v1 realistisk bli ferdig og stabil i løpet av semesteret, med tid til flere iterasjoner? | Risiko | Mye er med i V1. Erfaringen fra blåtursiden hjelper, men agentkjeden og sanntid er nytt og tidkrevende å få stabilt. |
| **BMAD-flyten** – er briefen konkret nok til at PRD, arkitektur og stories kan lages uten store hull, og blir det overkommelig mange stories? | OK | Briefen er konkret, og teknologivalgene er dokumentert i addendumet. Antall stories blir høyt, så prioriter dem i trinn. |
| **Egnet for Claude Code** – bruker løsningen en vanlig, godt dokumentert teknologistakk som Claude Code håndterer godt, eller krever den nisjeteknologi, spesialmaskinvare eller mye manuell konfigurasjon? | Risiko | React, Vite, Tailwind og Leaflet er godt egnet. Supabase-oppsett (auth, storage-regler, realtime) og Vercel krever manuell konfigurasjon som Claude Code ikke kan gjøre for dere. |
| **Kontroll på KI-ens arbeid** – kan gruppen selv avgjøre om koden gjør det riktige? Krever domenet kunnskap gruppen ikke har, f.eks. avanserte beregninger eller fagregler, så er det vanskelig å kvalitetssikre. | OK | Domenet er kjent for dere, og dere kan vurdere om en generert tur er fornuftig. Avstandsberegning for opplåsing kan kontrolleres med kjente koordinater. |
| **Testbarhet** – finnes det tydelige regler og forventede resultater som tester kan skrives mot? | Risiko | Poengregning, opplåsing innenfor radius og validering av JSON er godt testbart. Geolokasjon og sanntid krever simulert posisjon og tester med flere klienter. Beskriv hvordan dere tester opplåsing uten å gå ut i felt. |
| **Kjørbar for sensor** – kan appen kjøres lokalt etter README, uten gruppens nøkler, betalte kontoer eller egen infrastruktur? | Stor risiko | Supabase, to KI-API-er og Vercel gjør appen avhengig av deres kontoer. Uten lokal modus og seed-data kan sensor ikke kjøre kjerneflyten. |
| **Avhengigheter og kostnader** – krever løsningen betalte API-er, f.eks. språkmodeller, og finnes det en plan for kostnad, testmodus eller mock-data? | Risiko | To betalte KI-API-er og ingen omtale av kostnad eller testmodus. |

**Konklusjon om gjennomførbarhet:**

- **Gjennomførbart med justert omfang.** Se forslagene under.

**Forslag til justering av omfang eller vanskelighetsgrad:**

1. Erstatt QA-agenten på OpenAI med regelbasert validering av JSON mot datamodellen i v1 (påkrevde felt, gyldige koordinater, riktig antall dager). Det fjerner én betalt avhengighet, er lettere å teste, og QA-agenten kan komme i et senere trinn.
2. Del V1 i trinn: (a) KI-generert tur med redigering og publisering, og deltakerside med program og kart; (b) geolåst rebus med poengregning; (c) sanntids ledertavle og bildeopplasting; (d) regenerering av enkeltdeler i naturlig språk. Da har dere en fungerende app selv om ikke alle trinn blir ferdige.

## Hvorfor product brief er viktig for mappen

Product brief er utgangspunktet for PRD, arkitektur, stories og til slutt koden. Del 1 av mappen vurderes blant annet på om sensor kan følge en sporbar vei fra plan til ferdig app. Den vurderes også på om appen gjør det dere har beskrevet, om den er testet, om den er godt designet, og om den kan kjøres etter README. Et uklart, for stort eller for lite brief gjør alt dette vanskeligere senere. Det er mye enklere å rette nå enn sent i semesteret.

## 1. Gjennomgang av briefens deler

| Del av brief | Status | Kommentar |
|---|---|---|
| Executive Summary – er det klart hva appen er, og hvilket problem den løser? | OK | Klart at arrangøren beskriver turen i naturlig språk og får en ferdig deltakerside, og at arrangøren beholder kontrollen. |
| The Problem – er problemet konkret, med reelle situasjoner og brukere? | OK | Blåturen dere selv arrangerte er et svært konkret eksempel. |
| The Solution – beskriver løsningen brukeropplevelsen, ikke bare teknologi? | OK | Beskriver både arrangørens og deltakernes opplevelse, og legger agentdetaljene til arkitekturen. |
| What Makes This Different – er vurderingen ærlig og realistisk? | OK | Ærlig og godt dokumentert, med en tydelig erkjennelse av at fordelen er midlertidig. |
| Who This Serves – er primærbrukerne tydelige, og vet vi hva de trenger? | OK | Arrangøren uten teknisk bakgrunn som primærbruker og deltakerne i felt som sekundærbruker er tydelig. |
| Success Criteria – kan kriteriene faktisk sjekkes eller testes? | Juster | Flere kriterier er målbare (30 minutter, 80 % opplåsing, 5 sekunder, 3 sekunder). Andelen beholdte poster avhenger av testeren. Legg til automatisk testbare kriterier for KI-output. |
| Scope – er det klart hva som er med i første versjon, og hva som ikke er det? | Juster | Tydelig inn/ut, men V1 er stor. Del den i prioriterte trinn. |
| Vision – henger visjonen sammen med resten uten å blåse opp omfanget? | OK | Bevisst beskjeden og tydelig adskilt fra V1. |

## 2. Utgangspunkt for del 1 av mappen

Punktene følger kriteriene i sensorveiledningen for del 1. Vektene i parentes viser hvor mye hvert kriterium teller i del 1.

| Kriterium i del 1 | Hva briefen bør legge til rette for | Status | Kommentar |
|---|---|---|---|
| **1. Prosess og KI-styring** (30 %) | Brief som er presis nok til at PRD og stories kan bygges direkte på den, slik at krav kan spores fra brief til kode. | OK | Historikken viser flere revisjoner av briefen, det er gode prosesspor. Fortsett med PRD og arkitektur i samme struktur. |
| **2. Funksjonalitet og omfang** (20 %) | Realistisk omfang for gruppen og semesteret: en tydelig kjerneflyt som kan bli ferdig og stabil, og nok innhold til å vise reell funksjonalitet. | Juster | Mye reell funksjonalitet, men risiko for at mange deler blir halvferdige. Prioriter trinnene. |
| **3. Kvalitetssikring og testing** (15 %) | Suksesskriterier og funksjoner som er konkrete nok til å bli testtilfeller. | Juster | Gode målbare kriterier for opplåsing og ytelse. Legg til tester for KI-output og en plan for testing med simulert posisjon. |
| **4. Design og brukeropplevelse** (10 %) | Tydelige brukere og brukssituasjoner som designet kan bygges rundt, gjerne med de viktigste skjermbildene eller flytene skissert. | OK | Deltakere i felt på mobil og arrangør ved PC gir to tydelige brukssituasjoner. Blåtursiden kan brukes som utgangspunkt for skisser. |
| **5. Kodekvalitet og arkitektur** (10 %) | Teknologivalg som er begrunnet og ikke mer komplekse enn appen trenger. | Juster | To KI-leverandører og fire agenter er mer enn v1 trenger. Start med én leverandør og regelbasert validering. |
| **6. README og kjørbarhet** (10 %) | Løsning som andre kan kjøre lokalt uten betalte kontoer, og uten tilgang til gruppens egne tjenester og nøkler. | Endre | Avhengig av fire eksterne tjenester. Planlegg lokal kjøring med seed-data, mock-modus for KI og testbrukere. |
| **7. Ryddighet i repoet** (5 %) | En plan for hvor hemmeligheter, testdata og dokumentasjon skal ligge. | Juster | Briefen finnes nå i to mapper, og `product-brief-template.md` ligger i roten. Lenken til `addendum.md` fra `Leveranser/` peker til en fil som ikke ligger der. Velg én plassering og rett lenken. |

## 3. Neste steg for gruppen

1. Del V1 i prioriterte trinn, og vurder å erstatte QA-agenten med regelbasert validering i første trinn.
2. Beskriv hvordan appen kan kjøres lokalt uten deres nøkler: seed-data med en ferdig prøvetur, mock-modus for agentkjeden og testbrukere for arrangør og deltaker.
3. Rydd i dupliserte briefer og malfiler, legg til automatisk testbare kriterier for KI-output, og gå videre til PRD.

Oppdater product brief i repoet når dere har gjort endringene, slik at historikken viser hvordan planen utviklet seg. Det er en del av prosessen sensor ser etter.
