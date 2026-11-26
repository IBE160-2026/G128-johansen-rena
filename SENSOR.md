# Sensorstøtte for TripBuilder AI

Gruppe G128, IBE160 Programmering med KI. Status per 26. november 2026.

TripBuilder AI lar en arrangør beskrive en gruppetur, få et utkast til program og rebus, redigere og publisere det, og følge deltakerne underveis.

**Det viktigste å vite før du starter:**

- Appen kjører i **demomodus uten nøkler, kontoer eller betalte tjenester**.
- **KI-en i appen er simulert** (en mock). Den bygger utkastet fra prøveturen, så destinasjon og poster er alltid fra Budapest. Kall til en ekte språkmodell (Story 2.4) er ikke laget ennå.
- **Live-modus med Supabase er ikke prøvd.** Det finnes ikke noe Supabase-prosjekt ennå. Kode og databasemigrasjoner for deler av live-modus ligger i repoet, men er ikke kjørt.
- Alt du gjør, lagres bare i nettleseren din.

## 1. Start appen

Du trenger [Node.js](https://nodejs.org) 22.12 eller nyere.

```bash
npm install
npm run dev
```

Kjør kommandoene i mappen med `package.json`, og åpne adressen Vite viser, vanligvis <http://localhost:5173>.

Ikke lag en `.env`-fil. Uten Supabase-variablene starter appen i demomodus, og et banner øverst viser **DEMOMODUS**.

Appen er laget for mobil. På PC kan du slå på mobilvisning i nettleserens utviklerverktøy, for eksempel med 390 px bredde.

## 2. Testprotokoll (omtrent hele kjerneflyten)

Du bruker **to faner i samme nettleservindu**: fane A er arrangøren, og fane B er deltakeren. Rollen huskes per fane, mens turen deles mellom fanene.

> Bruk ikke et privat vindu eller en annen nettleser for fane B. De deler ikke lagringen. Lag en **ny, tom fane** og lim inn adressen. Ikke dupliser fane A, for da følger arrangørrollen med.

| # | Fane | Gjør dette | Forventet resultat |
|---|---|---|---|
| 1 | A | Åpne appen og velg **Arrangør**. | **Mine turer** vises med prøveturen. |
| 2 | A | Trykk **Ny tur**. Fyll inn destinasjon `Budapest`, to datoer med tre dager, `9` deltakere, `3` lag og `4` poster. Skriv i beskrivelsen: `En blåtur med rebus, middag og byvandring for hele gjengen.` Trykk **Lag utkast**. | Fremdriften vises, og så åpnes **Utkast**. |
| 3 | A | Se gjennom fanene **Turen, Program, Poster, Lag, Poeng** og **Tema**. Endre navnet på turen, og velg en annen aksentfarge under **Tema**. | Endringene lagres med en gang. |
| 4 | A | Slett navnet på turen, og se på knappen **Publiser**. Skriv så inn navnet igjen. | Uten navn er **Publiser** deaktivert, og feilen vises ved feltet. |
| 5 | A | Trykk **Publiser** og bekreft. | Delingssiden viser turkode, lenke og QR-kode. |
| 6 | A → B | Trykk **Kopier lenke**. Åpne en ny, tom fane, og lim inn lenken. | Velkomstsiden viser turen og «Turkode fra lenken». |
| 7 | B | Velg et navn under **Velg deltaker**, og trykk **Gå inn på turen**. | Siden **I dag** vises med fargen du valgte. |
| 8 | B | Trykk **Kart** nederst. | Fire poster vises, og de er låst. |
| 9 | B | Trykk **Gå til post 1** i posisjonssimulatoren. | Post 1 låses opp. |
| 10 | B | Trykk **Send bilde** på post 1. Velg et bilde (JPG, PNG eller WebP), skriv et kort notat, og trykk **Send til godkjenning**. Trykk så **Lukk**. | Kvittering vises, og posten venter på godkjenning. |
| 11 | A | Trykk **Åpne turen**, deretter **Admin** øverst og fanen **Innsendinger**. | Innsendingen vises med bilde og notat. |
| 12 | A | Trykk **Godkjenn**, og vent fem sekunder (du kan angre imens). | Innsendingen er godkjent. |
| 13 | B | Uten å laste siden på nytt: se på post 1, og trykk **Ledertavle**. | Posten er godkjent, og laget har fått poengene. |
| 14 | A | Gå til fanen **Program** i Admin. Trykk **Rediger** på et punkt, endre tittelen, og trykk **Lagre endringer**. | «Lagret. Deltakerne ser endringen nå.» |
| 15 | B | Se øverst på siden, og trykk **Se endringer**. | Banneret «Programmet er oppdatert.» vises, og punktet er merket **Endret**. |
| 16 | B | Trykk **I dag**, deretter **Se bildene**, og del et bilde (maks 450 KB i demo). | Bildet vises i galleriet. |

**Starte på nytt:** **Tilbakestill demo** i banneret setter turen du står på, tilbake til utgangspunktet. En publisert tur går tilbake til slik den ble publisert.

**Raskere vei:** Vil du bare prøve deltakersiden, velger du **Deltaker** på startsiden. Da kommer du rett inn i den ferdige prøveturen.

**Flere ting å prøve:** Avvis en innsending med begrunnelse (laget kan sende på nytt). Deaktiver en post under **Rebusposter** (laget beholder poengene). Flytt en deltaker til et annet lag under **Lag**. Se feiltilstanden ved generering ved å legge `?mock=feil` bak adressen på **Ny tur**.

## 3. Kjør testene

```bash
npm test            # enhetstester av reglene, uten nettleser
npm run build       # produksjonsbygg
npm run test:e2e    # nettlesertester i headless Chrome
```

`npm run test:e2e` krever i tillegg Google Chrome eller Chromium. Finner testen ikke programmet, setter du `CHROME_PATH`. Nettlesertestene er bare kjørt på macOS. Les [e2e/README.md](e2e/README.md) for hva de dekker.

26. november 2026 besto 824 enhetstester og alle 39 stegene i nettlesertestene på gruppens maskin, og bygget gikk gjennom. Bygget varsler om én JavaScript-fil over 500 kB.

**Automatiske kontroller av utkast fra KI.** `validateTrip` i [src/lib/validate.js](src/lib/validate.js) avviser blant annet utkast der påkrevde felt mangler, en post ligger utenfor turens område, en programpost ligger utenfor perioden, en dag mangler program, eller antall lag og poster ikke stemmer med bestillingen. Se [tests/validate.test.js](tests/validate.test.js) og [tests/mockAgent.test.js](tests/mockAgent.test.js). Kontrollene er hittil bare brukt på prøveturen og mock-KI-en, ikke på svar fra en ekte språkmodell.

**Opplåsing uten å gå ut i felt** testes med posisjonssimulatoren og med faste koordinater i enhetstestene. Det er ikke gjort noen felttest med ekte GPS.

## 4. Hva som er laget

| Område | Status |
|---|---|
| Demomodus, prøvetur, rollevalg, program og kart (Epic 1) | Ferdig i demo |
| Beskrive tur, utkast fra mock-KI, redigering, tema og publisering (Story 2.2, 2.3, 2.5–2.7) | Ferdig i demo |
| Geolåste poster, simulator, bilde som svar, godkjenning og poeng (Story 3.2–3.6) | Ferdig i demo |
| Lag, ledertavle, oppdatering mellom faner og bildegalleri (Epic 4) | Ferdig i demo |
| Endre, legge til og deaktivere under turen, med varsel til deltakerne (Epic 5) | Ferdig i demo |
| Innlogging for arrangør (2.1) og generering med ekte språkmodell (2.4) | Ikke laget |
| Bli med med turkode og navn (3.1) | Ikke ferdig |
| Nytt forslag fra KI for deler av turen (Epic 6) | Ikke laget |
| Samlet sluttkontroll, måling av suksesskriterier og deploy (Epic 7) | Ikke gjort. Nettlesertestene er et grunnlag for 7.1 |

«Ferdig i demo» betyr testet i nettleseren uten database. Databaseregler, tilgangskontroll, sanntid og bildelagring i live-modus er ikke prøvd mot Supabase.

Fullstendig status: [sprint-status.yaml](implementation-artifacts/sprint-status.yaml).

### Kjente begrensninger

- Lenken og QR-koden til en publisert tur virker bare i nettleseren den ble publisert i.
- Demolagringen har begrenset plass. Mange bilder kan fylle den.
- Publiserte demoturer kan ikke slettes.
- På kartet kan noen av postene i prøveturen ligge delvis oppå hverandre.
- Samtykke, lagringstid og sletting av bilder av deltakere er ikke avklart.
- Suksesskriteriene i PRD er ikke målt samlet.

Utsatt arbeid med begrunnelser står i [deferred-work.md](implementation-artifacts/deferred-work.md).

## 5. Hvor du finner grunnlaget for vurderingen

Inndelingen følger kriteriene for del 1, slik de står i [faglærers tilbakemelding på product brief](Leveranser/tilbakemelding-product-brief.md).

### Prosess og KI-styring

Utviklingen følger BMAD-metoden, med Claude Code til implementering.

| Steg | Her finner du det |
|---|---|
| Product brief (gjeldende) | [Leveranser/product-brief.md](Leveranser/product-brief.md) |
| PRD | [planning-artifacts/prds/](planning-artifacts/prds/) |
| UX: utseende og oppførsel | [planning-artifacts/ux-designs/](planning-artifacts/ux-designs/) |
| Arkitektur | [planning-artifacts/architecture/](planning-artifacts/architecture/) |
| Epics og stories | [planning-artifacts/epics.md](planning-artifacts/epics.md) |
| Spesifikasjon per story, med funn fra review | [implementation-artifacts/](implementation-artifacts/) (`spec-*.md`) |
| Retrospektiv | [Epic 4](implementation-artifacts/epic-4-retro-2026-11-26.md) og [Epic 5](implementation-artifacts/epic-5-retro-2026-11-26.md) |
| Logger fra arbeidsøktene med KI | [.logs/](.logs/) (én mappe per gruppemedlem) |
| Uavhengig kvalitetssikring av planene | [OpenAI_QA/](OpenAI_QA/) og [oppfølgingen](planning-artifacts/qa-oppfolging-2026-10-28.md) |
| Regler for KI-agentene | [AGENTS.md](AGENTS.md) og [CLAUDE.md](CLAUDE.md) |
| Pull requester | [Lukkede pull requester på GitHub](https://github.com/IBE160-2026/G128-johansen-rena/pulls?q=is%3Apr+is%3Aclosed) |

Slik styres en story: Spesifikasjonen skrives og godkjennes av et gruppemedlem før koden lages. Etterpå går KI-reviewere gjennom endringen, og funnene vurderes og føres i spesifikasjonens reviewlogg. Ikke alt har fulgt dette: Story 4.1 har ingen dokumentert review, og noen senere feilrettinger er laget uten.

**Et eksempel du kan følge fra krav til kode** er at poengene skal oppdateres hos deltakerne innen fem sekunder:

1. Kravet: FR9 i [epics.md](planning-artifacts/epics.md), og FR-9 og SM-5 i PRD.
2. Storyen: [spesifikasjonen for 4.3](implementation-artifacts/spec-4-3-ledertavlen-oppdateres-i-sanntid.md), med reviewlogg.
3. Koden: [pull request 17](https://github.com/IBE160-2026/G128-johansen-rena/pull/17), [signal.js](src/lib/signal.js) og [TripContext.jsx](src/context/TripContext.jsx).
4. Testene: [tests/signal.test.js](tests/signal.test.js) og [e2e/endringer.e2e.js](e2e/endringer.e2e.js).
5. Feil funnet etterpå: Verken review eller retrospektivet oppdaget først at en fane kunne skrive eldre data over nyere. Nettlesertestene avdekket det, feilen ble rettet i [pull request 30](https://github.com/IBE160-2026/G128-johansen-rena/pull/30), og den er dokumentert som funn 4-J i [retrospektivet](implementation-artifacts/epic-4-retro-2026-11-26.md).

Fem sekunder er ikke målt i live-modus.

### Funksjonalitet og omfang

Se testprotokollen i del 2 og tabellen i del 4. Omfanget er delt i trinn etter faglærers råd, og den regelbaserte valideringen har erstattet en egen QA-agent i første versjon.

### Kvalitetssikring og testing

Se del 3, [tests/](tests/), [e2e/](e2e/), reviewloggene i spesifikasjonene og retrospektivene.

### Design og brukeropplevelse

[DESIGN.md og EXPERIENCE.md](planning-artifacts/ux-designs/) beskriver utseende, flyter og tilstander. [e2e/utseende.e2e.js](e2e/utseende.e2e.js) måler på 390 px at trykkflatene er minst 48 px, og at sidene ikke kan rulles sidelengs. En samlet gjennomgang av tilgjengelighet og ytelse (Story 7.2) er ikke gjort.

### Kodekvalitet og arkitektur

Start med [løsningsbeskrivelsen](planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/LOSNINGSBESKRIVELSE.md). De bindende reglene står i [ARCHITECTURE-SPINE.md](planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md).

| Mappe | Innhold |
|---|---|
| `src/lib/` | Regler og logikk. De fleste filene er rene og testes uten nettleser |
| `src/context/` | Felles tilstand og handlinger |
| `src/pages/` og `src/components/` | Skjermbildene |
| `src/seed/` | Prøveturen |
| `supabase/` | Databasemigrasjoner og lokal seed for live-modus |
| `tests/` og `e2e/` | Enhetstester og nettlesertester |

### README og kjørbarhet

Del 1 til 3 i dette dokumentet. Oppsett av Supabase står i [docs/app-oppsett.md](docs/app-oppsett.md).

### Ryddighet i repoet

Hemmeligheter skal ligge i `.env.local`, som ikke sjekkes inn. [.env.example](.env.example) viser hvilke variabler som finnes. Planer ligger i `planning-artifacts/`, arbeid underveis i `implementation-artifacts/`, og leveranser i `Leveranser/`. `planning-artifacts/briefs/` har en arbeidskopi av briefen. Den gjeldende ligger i `Leveranser/`.
