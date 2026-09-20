---
title: "Product Brief: TripBuilder AI"
status: draft
created: 2026-09-17
updated: 2026-09-20
---

# Product Brief: TripBuilder AI

## Executive Summary

TripBuilder AI er en webplattform der en arrangør beskriver en tur eller et arrangement i naturlig språk — destinasjon, deltakerantall, program, en rebus med poeng og fysiske poster — og en kjede av KI-agenter bygger en ferdig, mobilvennlig deltakernettside ut fra beskrivelsen. Nettsiden gir program per dag, lag og ledertavle, kart med rebusposter, geolåste oppgaver som først åpnes når deltakeren fysisk er på stedet, bildeopplasting og automatisk poengregning. Arrangøren beholder full kontroll: alt KI-en foreslår kan redigeres, regenereres eller godkjennes før turen publiseres.

Teamet har allerede bygget en tilsvarende nettside manuelt for én konkret blåtur. TripBuilder AI tar det samme resultatet og gjør det til en gjenbrukbar plattform, slik at arbeidet som i dag gjøres på nytt for hver tur — oppsett av program, kart, lag og poengsystem — kan gjøres av KI-en på minutter i stedet for timer eller dager.

## Problemet

Å arrangere en tur med et strukturert program, konkurranser og en fysisk rebus krever i dag mye manuelt arbeid: arrangøren må selv sette opp program, tegne kart over poster, formulere oppgaver tilpasset stedet, bygge eller sette sammen et system for lag og poeng, og gjøre alt tilgjengelig for deltakerne på mobil. Dette gjøres ofte med en lapp av verktøy — gruppechat for informasjon, regneark for poeng, og eventuelt en frittstående rebus-app uten kobling til turens program — fordi ingen enkelt verktøy dekker hele behovet.

Resultatet blir engangsprodukter: løsningen som lages for én tur kan ikke gjenbrukes direkte til neste, selv om strukturen (program, lag, poster, poeng) i bunn og grunn er den samme fra tur til tur. Kostnaden er tid arrangøren legger ned i teknisk oppsett i stedet for i selve opplevelsen — og for de uten teknisk bakgrunn er terskelen for å lage noe tilsvarende høy nok til at det ofte ikke blir gjort i det hele tatt, og turen ender med et enklere, mindre engasjerende opplegg.

## Løsningen

Arrangøren beskriver turen i fritekst. En kjede av spesialiserte KI-agenter tolker beskrivelsen og fyller en fast datamodell (tur, program, lag, poster, poeng):

1. **Planner** tolker prompten og lager en strukturert plan.
2. **Innholdsagenten** lager program, rebusposter med koordinater, oppgavetekster og poeng tilpasset destinasjon, tone og deltakere.
3. **Designagenten** velger tema og visuell profil for turen.
4. **QA-agenten** kontrollerer at resultatet faktisk oppfyller kravene i prompten før arrangøren får det til gjennomsyn.

Arrangøren kan deretter be om regenerering av enkeltdeler («lag en vanskeligere rebus», «bytt ut post 4») før turen godkjennes og publiseres. Deltakerne får en mobilvennlig side med dagsprogram, lag og ledertavle, kart over rebusposter og oppgaver som låses opp først når mobilen er innenfor en gitt radius av posten, samt bildeopplasting som teller inn i poengsummen.

## Hva gjør dette annerledes

Det TripBuilder AI faktisk tilbyr, er **konsolidering på tvers av dette gapet**: ett naturlig-språk-prompt dekker hele turen — flerdagers program, lag, ledertavle, kart og geolåst rebus — generert og satt sammen i én pipeline, for uformelle private grupper som i dag måtte kombinere en reiseplanlegger for programmet med et separat verktøy som Goosechase for konkurransedelen (eller latt være, fordi ingen av delene alene dekker behovet). Dette er en arbeidsflyt- og hastighetsfordel for en spesifikk, underbetjent nisje — reisen *som helhet*, ikke bare aktiviteten inni den — ikke en teknisk voll.

Ærlig vurdering: ingen enkeltdel av dette er teknisk unik. Rendyrkede rebus-plattformer som Goosechase har allerede KI-generert oppdragsinnhold, GPS-låste oppgaver og live ledertavle. Men Goosechase er bygget for **enkeltstående oppdrags-/rebus-opplevelser** — de beskriver seg selv som "not just a scavenger hunt app", men produktet dekker ett arrangement eller én aktivitet om gangen, uten begrep for flerdagers reiseprogram, overnatting, måltider eller reiselogistikk. Det er en aktivitetsmotor, ikke en turplanlegger. AI-reiseplanleggere (Mindtrip, Layla m.fl.) løser motsatt problem: de genererer flerdagers program fra naturlig språk, men publiserer ikke en interaktiv deltakernettside med lag, ledertavle eller rebus. Konferanse-/bedriftsverktøy (Whova, Guidebook) har ledertavler og gamification, men er bygget for store, formelle arrangementer — ikke for en uformell vennegjeng eller studentgruppe som skal på blåtur i helgen. (Fullt sammendrag av konkurrentbildet i `addendum.md`.)

En etablert aktør som Goosechase kunne i prinsippet legge til et reiseprogram-lag og lukke gapet, eller en reiseplanlegger kunne legge til spillmekanikk — differensieringen er derfor midlertidig og bør ikke overselges i videre arbeid (PRD/arkitektur).

## Hvem dette er for

**Primær: Arrangøren.** En privatperson eller uformell komité (venner, klassekamerater, en studentforening) som planlegger en tur eller et arrangement med program og konkurranse, uten teknisk bakgrunn eller tid til å bygge noe selv. Suksess for arrangøren er en ferdig, presentabel deltakerside på minutter, med nok kontroll til å stole på resultatet før publisering.

**Sekundær: Deltakerne.** Personene som er med på turen. De trenger en mobilvennlig side som er enkel å bruke midt i en aktivitet — se dagens program, sjekke ledertavlen, finne neste post på kartet, og få en oppgave låst opp når de faktisk har kommet fram. Suksess for deltakeren er at siden fungerer sømløst i felt, uten treg innlogging eller forvirrende navigasjon.

## Suksesskriterier

Ingen delt, detaljert sensureringsrubrikk er tilgjengelig utover at vanskelighetsgrad teller i sensuren — bekreft med faglærer om mulig. Signalene under er derfor satt som en arbeidsdefinisjon gruppen selv står inne for.

| Signal | Metrikk / bevis | Mål | Når målt |
|---|---|---|---|
| Brukerutfall | Tid fra prompt til publisert, fungerende deltakerside | Under 30 minutter, uten manuell koding | Test med 2–3 fiktive turer før innlevering |
| Adopsjon/atferd | Andel KI-genererte rebusposter arrangøren beholder uten redigering | Over 60 % | Etter test med reell/fiktiv prompt |
| Kvalitet/tillit | Andel geolokasjonssjekk som låser opp korrekt innenfor definert radius | 80 % i test | Under funksjonstesting |
| Kvalitet/tillit | Andel KI-genererte turer som består QA-agentens sjekk uten menneskelig overstyring | Rapporteres, ikke et fast mål — brukes som datapunkt i refleksjonsrapporten | Gjennom hele utviklingsperioden |
| Business/formål | Fungerende ende-til-ende demo (prompt → generert tur → deltakerflyt → opplåsing → poengoppdatering) | Vellykket eksamensdemo | Ved innlevering/eksamen |

Løsningen skal også demonstrere vanskelighetsgraden gruppen selv har meldt inn («Vanskelig»): flerstegs KI-agentkjede, strukturert JSON-utveksling, geolokasjon og sanntidsdata i samspill.

## Omfang

**Inne (V1):** Arrangørflyt (prompt → KI → redigering → publisering). Deltakerside med program, lag, ledertavle, kart og geolåst rebus. KI-generert innhold med et eget QA-steg før arrangøren ser resultatet. Innlogging for arrangør og deltakere.

**Ute (V1):** KI-generert kodebase per tur (fast datamodell fylles av KI, koden er felles). Betaling og booking. Ruteoptimalisering. Native app. Automatisk deploy per arrangement.

Teknologivalg (React/Vite/Tailwind, Supabase, Claude API, Vercel) og selve implementasjonen av autentisering/datahåndtering er allerede besluttet av gruppen — se [addendum.md](./addendum.md) for detaljer for detaljer, da det hører hjemme i arkitekturarbeidet snarere enn i selve briefen.

## Visjon

**Nå:** En fungerende V1 som beviser kjerneverdien — én prompt genererer en komplett, publiserbar tur med program, lag, ledertavle og geolåst rebus, demonstrert på en fiktiv tur i sanntid.

**Neste:** Flere ferdige "tur-tema" arrangøren kan velge mellom i stedet for å beskrive alt fra bunnen, og bedre KI-forslag basert på tidligere turer og arrangørers redigeringsmønstre.

**Om 2–3 år:** Konseptet utvides fra blåturer/studentarrangementer til andre uformelle private sammenkomster med samme struktur — hytteturer, bursdager, mindre lagoffsites. Dette er bevisst holdt beskjedent: for prosjektets formål er en solid, fungerende V1 viktigere enn en ambisiøs vekstfortelling.
