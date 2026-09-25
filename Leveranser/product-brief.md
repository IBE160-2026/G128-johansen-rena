---
title: "Product Brief: TripBuilder AI"
status: Fullført
created: 2026-09-17
updated: 2026-09-25
---

# Product Brief: TripBuilder AI

## Sammendrag

TripBuilder AI er en webplattform der en arrangør beskriver en tur eller et arrangement i naturlig språk (destinasjon, deltakerantall, program, en rebus med poeng og fysiske poster), og en kjede av KI-agenter bygger en ferdig, mobilvennlig deltakernettside ut fra beskrivelsen. Nettsiden gir program per dag, lag og ledertavle, kart med rebusposter, geolåste oppgaver som først åpnes når deltakeren fysisk er på stedet, bildeopplasting og automatisk poengregning. Arrangøren beholder full kontroll: alt KI-en foreslår kan redigeres, regenereres eller godkjennes før turen publiseres.

Teamet har allerede bygget en tilsvarende nettside manuelt for én konkret blåtur. TripBuilder AI tar det samme resultatet og gjør det til en gjenbrukbar plattform, slik at arbeidet som i dag gjøres på nytt for hver tur (oppsett av program, kart, lag og poengsystem), kan gjøres av KI-en på minutter i stedet for timer eller dager.

Hvorfor nå: Språkmodeller kan i dag levere pålitelig strukturert output (JSON) og har god nok kunnskap om steder til å foreslå realistiske poster og oppgaver. Det gjør det mulig å la KI-en fylle en fast, gjennomtestet datamodell i stedet for å generere kode, og dermed få et forutsigbart resultat som arrangøren kan stole på. For bare få år siden måtte dette innholdet vært skrevet for hånd, eller malene vært så stive at de ikke passet den enkelte turen.

## Problemet

Å arrangere en tur med et strukturert program, konkurranser og en fysisk rebus krever i dag mye manuelt arbeid: arrangøren må selv sette opp program, tegne kart over poster, formulere oppgaver tilpasset stedet, bygge eller sette sammen et system for lag og poeng, og gjøre alt tilgjengelig for deltakerne på mobil. Dette gjøres ofte med en lapp av verktøy: gruppechat for informasjon, regneark for poeng, og eventuelt en frittstående rebus-app uten kobling til turens program. Grunnen er at ingen enkelt verktøy dekker hele behovet.

Et konkret eksempel er blåturen teamet selv arrangerte. For å gi deltakerne ett sted å se program, lag, poeng og rebusposter, måtte vi bygge en egen nettside fra bunnen med React, Supabase og Leaflet: legge inn programmet dag for dag, finne og taste inn koordinater for hver post, skrive oppgavetekster tilpasset stedene, og lage logikk for lag, poeng og opplåsing av poster. Alt dette var skreddersydd for én tur. Neste tur, med ny destinasjon, nye deltakere og nytt program, ville krevd det meste av arbeidet på nytt.

Resultatet blir engangsprodukter: løsningen som lages for én tur kan ikke gjenbrukes direkte til neste, selv om strukturen (program, lag, poster, poeng) i bunn og grunn er den samme fra tur til tur. Kostnaden er tid arrangøren legger ned i teknisk oppsett i stedet for i selve opplevelsen. For de uten teknisk bakgrunn er terskelen for å lage noe tilsvarende høy nok til at det ofte ikke blir gjort i det hele tatt, og turen ender med et enklere, mindre engasjerende opplegg.

## Løsningen

Arrangøren skriver én beskrivelse av turen, slik de ville forklart den til en venn: hvor, når, hvem, hva som skjer hver dag, og hvordan rebusen skal fungere. Etter kort tid får de tilbake et ferdig utkast til deltakersiden, med program, lag, kart med poster, oppgavetekster og poeng, som allerede er kontrollert mot det de ba om.

Arrangøren går gjennom utkastet, retter det som ikke stemmer, og kan be om nye forslag på enkeltdeler i vanlig språk («lag en vanskeligere rebus», «bytt ut post 4») uten å starte på nytt. Når de er fornøyd, godkjenner og publiserer de turen.

Deltakerne åpner turen på mobilen og har alt på ett sted: dagens program, lagene og en ledertavle som oppdateres fortløpende, og et kart over rebuspostene. Oppgaven på en post låses først opp når deltakeren faktisk står der, og bilder de laster opp som svar teller inn i lagets poengsum.

Bak dette står en kjede av spesialiserte KI-agenter (plan, innhold, design og en uavhengig kvalitetskontroll) som fyller en fast datamodell i stedet for å skrive ny kode per tur. Detaljene hører hjemme i arkitekturarbeidet.

## Hva gjør dette annerledes

Hver enkelt del av TripBuilder AI finnes allerede et sted i markedet, men spredt over tre kategorier verktøy som hver dekker sin bit av turen. Rendyrkede rebus-plattformer som Goosechase har allerede KI-generert oppdragsinnhold, GPS-låste oppgaver og live ledertavle. Men Goosechase er bygget for **enkeltstående oppdrags-/rebus-opplevelser**. De beskriver seg selv som "not just a scavenger hunt app", men produktet dekker ett arrangement eller én aktivitet om gangen, uten begrep for flerdagers reiseprogram, overnatting, måltider eller reiselogistikk. Det er en aktivitetsmotor, ikke en turplanlegger. AI-reiseplanleggere (Mindtrip, Layla m.fl.) løser motsatt problem: de genererer flerdagers program fra naturlig språk, men publiserer ikke en interaktiv deltakernettside med lag, ledertavle eller rebus. Konferanse-/bedriftsverktøy (Whova, Guidebook) har ledertavler og gamification, men er bygget for store, formelle arrangementer, ikke for en uformell vennegjeng eller studentgruppe som skal på blåtur i helgen. (Fullt sammendrag av konkurrentbildet i `addendum.md`.)

Det TripBuilder AI faktisk tilbyr, er derfor **konsolidering på tvers av dette gapet**: ett naturlig-språk-prompt dekker hele turen (flerdagers program, lag, ledertavle, kart og geolåst rebus), generert og satt sammen i én pipeline, for uformelle private grupper som i dag måtte kombinere en reiseplanlegger for programmet med et separat verktøy som Goosechase for konkurransedelen (eller latt være, fordi ingen av delene alene dekker behovet). Dette er en arbeidsflyt- og hastighetsfordel for en spesifikk, underbetjent nisje, der det gjelder reisen *som helhet* og ikke bare aktiviteten inni den. Det er ikke en teknisk voll.

En etablert aktør som Goosechase kunne i prinsippet legge til et reiseprogram-lag og lukke gapet, eller en reiseplanlegger kunne legge til spillmekanikk. Differensieringen er derfor midlertidig og bør ikke overselges i videre arbeid (PRD/arkitektur).

## Hvem dette er for

**Primær: Arrangøren.** En privatperson eller uformell komité (venner, klassekamerater, en studentforening) som planlegger en tur eller et arrangement med program og konkurranse, uten teknisk bakgrunn eller tid til å bygge noe selv. Suksess for arrangøren er en ferdig, presentabel deltakerside på minutter, med nok kontroll til å stole på resultatet før publisering.

**Sekundær: Deltakerne.** Personene som er med på turen. De trenger en mobilvennlig side som er enkel å bruke midt i en aktivitet: se dagens program, sjekke ledertavlen, finne neste post på kartet, og få en oppgave låst opp når de faktisk har kommet fram. Suksess for deltakeren er at siden fungerer sømløst i felt: de logger inn én gang ved turens start, og slipper deretter å logge inn på nytt eller lete i forvirrende navigasjon underveis.

## Suksesskriterier

Ingen delt, detaljert sensureringsrubrikk er tilgjengelig utover at vanskelighetsgrad teller i sensuren. Bekreft med faglærer om mulig. Signalene under er derfor satt som en arbeidsdefinisjon gruppen selv står inne for.

| Signal | Metrikk / bevis | Mål | Når målt |
|---|---|---|---|
| Brukerutfall | Tid fra prompt til publisert, fungerende deltakerside | Under 30 minutter, uten manuell koding | Test med 2–3 fiktive turer før innlevering |
| Adopsjon/atferd | Andel KI-genererte rebusposter arrangøren beholder uten redigering | Over 60 % | Etter test med reell/fiktiv prompt |
| Kvalitet/tillit | Andel geolokasjonssjekk som låser opp korrekt innenfor definert radius | Over 80 % i test | Under funksjonstesting |
| Kvalitet/tillit | Andel KI-genererte turer som består QA-agentens sjekk uten menneskelig overstyring | Rapporteres, ikke et fast mål. Brukes som datapunkt i refleksjonsrapporten | Gjennom hele utviklingsperioden |
| Deltakeropplevelse | Tid fra poeng registreres til ledertavlen er oppdatert hos de andre deltakerne | Under 5 sekunder | Under funksjonstesting med flere mobiler samtidig |
| Deltakeropplevelse | Innlastingstid for deltakersiden på mobil over mobilnett (4G) | Under 3 sekunder | Under funksjonstesting |
| Business/formål | Fungerende ende-til-ende demo (prompt → generert tur → deltakerflyt → opplåsing → poengoppdatering) | Vellykket eksamensdemo | Ved innlevering/eksamen |

Løsningen skal også demonstrere vanskelighetsgraden gruppen selv har meldt inn («Vanskelig»): flerstegs KI-agentkjede, strukturert JSON-utveksling, geolokasjon og sanntidsdata i samspill.

## Omfang

**Inne (V1):** Arrangørflyt (prompt → KI → redigering og regenerering av enkeltdeler → godkjenning → publisering). Deltakerside med program, lag, ledertavle, kart og geolåst rebus. Bildeopplasting og automatisk poengregning. KI-generert innhold med et eget QA-steg før arrangøren ser resultatet. Innlogging for arrangør og deltakere, der deltakerinnloggingen skal være rask og kun kreves én gang per tur.

**Ute (V1):** KI-generert kodebase per tur (fast datamodell fylles av KI, koden er felles). Betaling og booking. Ruteoptimalisering. Native app. Automatisk deploy per arrangement.

Teknologivalg (React/Vite/Tailwind, Supabase, Claude API for agentkjeden og OpenAI for QA-agenten, Vercel) og selve implementasjonen av autentisering/datahåndtering er allerede besluttet av gruppen. Se [addendum.md](./addendum.md) for detaljer, siden dette hører hjemme i arkitekturarbeidet snarere enn i selve briefen.

## Visjon

**Nå:** En fungerende V1 som beviser kjerneverdien: én prompt genererer en komplett, publiserbar tur med program, lag, ledertavle og geolåst rebus, demonstrert på en fiktiv tur i sanntid.

**Neste:** Flere ferdige "tur-tema" arrangøren kan velge mellom i stedet for å beskrive alt fra bunnen, og bedre KI-forslag basert på tidligere turer og arrangørers redigeringsmønstre.

**Om 2–3 år:** Konseptet utvides fra blåturer/studentarrangementer til andre uformelle private sammenkomster med samme struktur, som hytteturer, bursdager, mindre lagoffsites. Dette er bevisst holdt beskjedent: for prosjektets formål er en solid, fungerende V1 viktigere enn en ambisiøs vekstfortelling.
