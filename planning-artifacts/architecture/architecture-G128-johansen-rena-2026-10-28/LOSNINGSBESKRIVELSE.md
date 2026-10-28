---
title: "Løsningsbeskrivelse: TripBuilder AI"
status: draft
created: 2026-10-28
updated: 2026-10-28
companion_of: ARCHITECTURE-SPINE.md
---

# Løsningsbeskrivelse: TripBuilder AI

Dokumentet forklarer hvordan TripBuilder AI er bygget, og hvorfor. Det er skrevet for faglærer og sensor. De bindende reglene som utviklingen følger, står i [ARCHITECTURE-SPINE.md](ARCHITECTURE-SPINE.md). Referansene AD-1, AD-2 osv. i teksten viser dit.

## 1. Oversikt

TripBuilder AI er en webapp med to roller. **Arrangøren** beskriver en tur i naturlig språk, får et KI-generert utkast som kan redigeres, publiserer turen og godkjenner innsendinger fra deltakerne. **Deltakerne** blir med via en turkode og følger programmet på mobilen. De går til rebuspostene, som låses opp når de er på stedet, sender inn svar og bilder, og følger ledertavlen.

Appen kan kjøres på to måter:

- **Demo-modus** er standard for sensor. Alt kjører lokalt i nettleseren, med en ferdig prøvetur, en mock av KI-en og simulert posisjon. Det trengs ingen kontoer eller nøkler.
- **Live-modus** brukes til ekte bruk. Data, innlogging, bilder og sanntid går via Supabase, KI-kallene går via en Supabase Edge Function mot Claude API, og frontenden ligger på Vercel.

## 2. Hovedgrep: ports & adapters

Den viktigste beslutningen er å dele koden i en **ren domenekjerne** og **adaptere** (AD-1, AD-4).

- **Domenekjernen** (`src/domain`) er vanlig TypeScript uten avhengigheter til React eller Supabase. Den inneholder datamodellen som et zod-skjema, valideringsreglene, avstandsberegning og poengregning. Fordi kjernen er ren, kan den testes grundig med enhetstester. Den kan også brukes uendret både i nettleseren og i Edge Function på serveren.
- **Portene** er grensesnitt for alt appen trenger fra omverdenen: lagring av turer, KI-agent, innlogging, sanntid, bildelagring og posisjon.
- **Adapterne** implementerer portene. Hver port har en *demo*-adapter (localStorage, mock-agent, simulert posisjon og BroadcastChannel mellom faner) og en *supabase*-adapter.

Hvilke adaptere som brukes, bestemmes på ett eneste sted ut fra miljøvariabelen `VITE_APP_MODE`. Resten av appen vet ikke om den kjører i demo eller live. Det er dette som gjør at sensor kan kjøre hele kjerneflyten uten våre nøkler, slik faglærer etterlyste i tilbakemeldingen på briefen.

## 3. KI-flyten og kvalitetskontroll

1. Arrangøren skriver beskrivelsen og trykker «Lag utkast».
2. Klienten kaller `AgentPort`. I live-modus går kallet til Edge Function `generate-trip`, som er det eneste stedet Claude-nøkkelen finnes (AD-9).
3. Edge Function ber Claude om JSON etter turskjemaet og kjører **regelbasert validering** (AD-2, AD-3). Den sjekker påkrevde felt, at hver dag i perioden finnes, at postene ligger innenfor turens område, og at radius og poeng er gyldige.
4. Feiler valideringen, sendes feilene tilbake til Claude i **ett** nytt forsøk. Feiler det også, får arrangøren en forståelig feilmelding, og teksten blir ikke borte.
5. Det gyldige utkastet vises for redigering. Den samme valideringen kjøres på serveren ved hver lagring, også publisering og endringer underveis (AD-17).

Vi valgte bort et eget QA-steg med en annen KI-leverandør i V1. Regelbasert validering er billigere og deterministisk, og den kan testes automatisk mot suksesskriteriene (100 % gyldige aksepterte utkast, poster innenfor området, minst én programpost per dag). Et KI-basert QA-steg kan legges til senere uten å endre kontrakten.

Regenerering av enkeltdeler (trinn E) følger samme mønster. KI-en får hele turen og en instruksjon, returnerer bare ett nytt element, og hele turen valideres på nytt før endringen tas i bruk (AD-12).

## 4. Datamodell

Minimumsmodellen (som avklarer PRD §8.1) har sju tabeller: `trips`, `days`, `program_items`, `posts`, `teams`, `participants` og `submissions`. ER-diagrammet står i spinen.

- En **tur** har periode, område (sentrum og radius), status (utkast eller publisert) og en turkode.
- **Poster** har koordinater, opplåsingsradius, oppgavetekst, svartype og poeng.
- **Innsendinger** har status ventende, godkjent eller avvist.
- **Poeng følger postens gjeldende verdi.** Lagets poengsum er summen av poengene på postene laget har fått godkjent, og hver post teller maks én gang per lag (AD-5). Endrer arrangøren poengene på en post underveis, får alle lag som har løst den, den nye verdien. Da får aldri to lag ulike poeng for samme post.
- **Lagring er autoritativ på serveren.** Klientene kan bare lese turtabellene. All lagring går gjennom Edge Function `save-trip`, som validerer og skriver alt i én transaksjon med versjonskontroll (AD-17). Da kan verken direkte API-kall eller avbrutte lagringer gi en ugyldig eller halvferdig tur.

## 5. Geolokasjon og opplåsing

Avstanden mellom deltakeren og posten regnes ut med haversine-formelen i domenekjernen. En post er opplåst når avstanden er innenfor postens radius (AD-6).

Posisjonen kommer fra en `PositionSource`, som enten er nettleserens geolokasjon eller en **simulert posisjon**. Simuleringen gjør at opplåsing kan testes automatisk og vises i demoen uten å gå ut i felt. Det svarer på faglærers spørsmål om hvordan opplåsing testes.

Posisjonen sendes aldri til serveren og lagres aldri, i tråd med personvernvalget i briefen. Det betyr at en teknisk dyktig deltaker i prinsippet kan jukse med posisjonen. Vi aksepterer det i V1, fordi **arrangøren godkjenner hver innsending** før den gir poeng (AD-7). Godkjenningen er den egentlige kontrollen.

## 6. Sanntid

Når arrangøren godkjenner en innsending, sender systemet ut et signal. Klientene henter da poengsummene på nytt fra én autoritativ kilde: viewet `team_scores` i live-modus, eller poengfunksjonen i demo-modus (AD-10). Live-modus bruker Supabase Realtime, og demo-modus bruker `BroadcastChannel` mellom nettleserfaner, slik at to faner kan vise sanntid lokalt. Målet er at ledertavlen er oppdatert innen 5 sekunder etter godkjenning (SM-5). Hvordan dette skal testes og vises på eksamen, avgjøres før trinn C (PRD §8.4).

## 7. Sikkerhet og tilgang

- Arrangøren logger inn med e-post og magisk lenke. Deltakeren får en anonym innlogging og kobles til turen med turkode og navn. Deltakeren trenger ingen konto og logger inn bare én gang per tur (AD-8).
- All tilgang håndheves i databasen med Row Level Security. Deltakeren ser bare sin egen publiserte tur og kan bare sende inn for sitt eget lag. Bare arrangøren kan godkjenne innsendinger og redigere turen.
- Bildene ligger i en privat lagringsbøtte og vises via tidsbegrensede, signerte lenker (AD-11). Bilder av deltakere er personopplysninger. Derfor beholdes den strenge lagringsmodellen (AD-17), og samtykke, lagringstid og sletting avklares før bildefunksjonen bygges.
- KI-nøkkelen finnes bare på serveren som en Supabase-secret. Bare offentlig klientkonfigurasjon har `VITE_`-prefiks, og produksjonsbygget sjekkes for at det ikke inneholder hemmeligheter (AD-9).
- Tilgangsreglene testes med en egen live-integrasjonstest med to arrangører og to turer.

## 8. Teknologi og drift

| Lag | Valg |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, React Router, Leaflet |
| Validering | Zod |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| KI | Claude API (Anthropic SDK) i Edge Function |
| Hosting | Vercel (frontend) |
| Testing | Vitest (domene), Playwright (flyter i demo-modus) |

Teknologivalgene ble gjort av gruppen tidligere (se addendumet til briefen). Versjonene ble sjekket 2026-10-28. Databaseendringer versjoneres som migrasjoner i repoet.

## 9. Testbarhet

- **Domenekjernen** testes med enhetstester: validering mot skjema og regler, avstand med kjente koordinater, og poengregning med godkjente, ventende og avviste innsendinger.
- **Seed-turen** valideres i en egen test. Den beviser at demo-dataene alltid er gyldige.
- **Ende-til-ende-flyter** kjøres med Playwright i demo-modus: prompt, utkast, publisering, deltaker blir med, simulert opplåsing, innsending, godkjenning og ledertavle.
- Disse testene måler suksesskriteriene SM-2, SM-3, SM-4 og SM-8 direkte.

## 10. Bevisste avgrensninger

Dette er ikke med i V1: KI-basert QA, køing av innsendinger uten nett, verifisering av posisjon på serveren, et eget staging-miljø og egen overvåking. Valgene er gjort for å holde V1 gjennomførbar for to personer innen semesteret, i tråd med tilbakemeldingen fra faglærer.
