# Todo – videre prosess for TripBuilder AI

Oppdatert 26. november 2026. Detaljert status står i [sprint-status](implementation-artifacts/sprint-status.yaml), og sensor starter i [SENSOR.md](SENSOR.md).

## Status

- [x] Planlegging: brief, PRD, UX, arkitektur, epics og stories, QA av planene og sprint planning
- [ ] UX og arkitektur gjennomgått og godkjent av begge (bekreft, og noter beslutningen)
- [x] Epic 1: demomodus, prøvetur, rollevalg, program og kart
- [ ] Epic 2: ferdig i demo bortsett fra 2.1 (innlogging) og 2.4 (ekte KI)
- [ ] Epic 3: ferdig i demo bortsett fra 3.1 (bli med med turkode)
- [x] Epic 4: lag, ledertavle og bilder (godkjent for demo, med åpne punkter)
- [x] Epic 5: endringer underveis (godkjent for demo, med åpne punkter)
- [ ] Epic 6: nye KI-forslag
- [ ] Epic 7: verifisering og levering
- [x] Sensorstøtte og nettlesertester
- [ ] Live-modus med Supabase

**24 av 34 stories er ferdige.** «Ferdig» betyr testet i demomodus. Ingenting er prøvd mot Supabase, og KI-en er simulert.

## Neste steg

### 1. Kvalitetssikre det vi har (nå)

- [ ] Stian henter `main` og kjører `npm install`, `npm test` og `npm run test:e2e`
- [ ] Begge leser [SENSOR.md](SENSOR.md) og følger testprotokollen for hånd på PC
- [ ] Prøve protokollen på mobil (krever at appen er tilgjengelig fra telefonen; demodata deles ikke mellom enheter)
- [ ] Se over de siste rettingene i synken mellom faner og nettlesertestene (ingen reviewere har sett på dem)
- [ ] Følge med på en blank side eller en fane som ikke svarer (se «Kjente forbehold» i [e2e/README.md](e2e/README.md))
- [ ] Rydde: flytte eller fjerne `product-brief-template.md`, og fjerne eller skrive om [docs/START_LOKALT.md](docs/START_LOKALT.md)
- [ ] Rette at spesifikasjonen for 4.1 står som `review` og mangler reviewlogg
- [ ] Føre utsatt arbeid i README slik [AGENTS.md](AGENTS.md) krever (i dag står det i [deferred-work.md](implementation-artifacts/deferred-work.md)), eller endre regelen

### 2. Beslutninger gruppen må ta

- [ ] Samtykke, lagringstid og sletting av bilder (skulle vært avklart før Story 4.4)
- [ ] Hvordan sanntid skal vises på eksamen (PRD §8.4)
- [ ] Fargene og temaene i DESIGN.md
- [ ] Om Epic 6 skal bygges, eller om tiden heller skal brukes på Supabase og levering

### 3. Kan gjøres uten Supabase

- [ ] Samle statustekstene i `Team.jsx` (tiltak fra retrospektivet for Epic 4)
- [ ] Dele opp de lange linjene i `Admin.jsx` (tiltak fra retrospektivet for Epic 5)
- [ ] Oppdatere [epics.md](planning-artifacts/epics.md) for 4.1 og 5.1 slik Admin ble bygget
- [ ] Krysse av fremdriften i [gjennomføringsplanen](planning-artifacts/gjennomforingsplan.md)
- [ ] Story 7.1: fullføre ende-til-ende-testen av kjerneflyten (testprotokollen og nettlesertestene er grunnlaget)
- [ ] Epic 6 (6.1–6.3) med simulert KI i demo, hvis gruppen velger det

### 4. Supabase og live-modus

Supabase må settes opp før resten av dette kan gjøres. Se [docs/app-oppsett.md](docs/app-oppsett.md).

- [ ] Opprette et eget utviklingsprosjekt (ikke den gamle Blåtur-databasen)
- [ ] Kjøre migrasjonene, og legge oppsettet av sanntid inn i en migrasjon
- [ ] Teste tilgangsreglene med egne arrangør- og deltakerbrukere og to turer
- [ ] Story 2.1: innlogging for arrangør
- [ ] Story 3.1: bli med med turkode og navn
- [ ] Story 2.4: generering med Claude i en Edge Function, med nøkkelen kun på serveren
- [ ] Bygge live-publisering, og skrive om teksten på delingssiden
- [ ] Live-testene fra retrospektivene for Epic 4 og 5
- [ ] Story 7.4: live-oppsett og deploy

### 5. Før levering

- [ ] Story 7.2: tilgjengelighet, tekst og ytelse på mobil
- [ ] Story 7.3: måle suksesskriteriene (SM-1 til SM-8) og ferdigstille README. Noen krever ekte KI og felttest med GPS
- [ ] Retrospektiv for resterende epics
- [ ] Oppdatere [SENSOR.md](SENSOR.md) med endelig status og testtall
- [ ] Siste gjennomkjøring fra en ren klon, og øve på demonstrasjonen

## Slik jobber vi med en story

1. Egen branch fra oppdatert `main`.
2. Spesifikasjon med `bmad-build`, godkjent av et gruppemedlem før koding.
3. Implementering, review og retting. Før funnene i spesifikasjonens reviewlogg.
4. `npm test`, `npm run build` og `npm run test:e2e`. Se også på utseendet.
5. Commit, pull request og merge. Sett status i sprint-status.
6. Sesjonslogg (se [CLAUDE.md](CLAUDE.md)). Retrospektiv når en epic er ferdig.

Ikke kjør to KI-økter i samme mappe samtidig.

## Faste valg for V1

- V1 skal være begrenset og gjennomførbar.
- Appen skal alltid virke lokalt uten nøkler, med prøvetur og simulert KI.
- Kvalitetskontrollen av KI-utdata er regelbasert. Ekstra KI-QA kan komme senere.

## Referanser

- [Gjennomføringsplan](planning-artifacts/gjennomforingsplan.md)
- [Product brief](Leveranser/product-brief.md) og [tilbakemeldingen på den](Leveranser/tilbakemelding-product-brief.md)
- [PRD](planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md) og [tillegget](planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/addendum.md)
- [Epics og stories](planning-artifacts/epics.md)
- [Rapport til Stian, 25.–26. november](docs/rapport-til-stian-2026-11-26.md)
