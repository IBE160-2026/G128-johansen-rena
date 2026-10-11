# Todo – BMAD workflow for TripBuilder AI

## Status
- [x] Product brief oppdatert etter foreleserfeedback
- [x] PRD oppdatert / lagt til i planning-artifacts
- [ ] UX-design dokumentasjon
- [ ] Arkitektur-dokument
- [ ] Epics og stories
- [ ] Implementasjonsstart / kode
- [ ] Testplan og QA
- [ ] README / kjørbarhet og demo-modus

## Kort oppsummering

Prosjektet er i BMAD-flyten fra produktbrief til PRD. Nå er neste naturlige steg å produsere UX-dokumentasjon, deretter teknisk arkitektur, før epics og stories blir delfinert og implementasjonen starter.

## Plan for videre arbeid

### 1. UX
- Definere hovedflyter for arrangør og deltaker
- Beskrive viktigste screens og state transitions
- Dokumentere mobilbruk og feltforhold

### 2. Arkitektur
- Velge systemstruktur for frontend/backend/integrasjoner
- Definere data model for tur, dag, poster, lag og poeng
- Fastsette Supabase, geofencing, realtime og AI-integration
- Planlegge lokal demo/mock-modus

### 3. Epics og stories
- Bryte PRD ned i epics
- Lage user stories med testbare akseptanser
- Prioritere MVP først

### 4. Implementasjon
- Start med kjerneflyten for turgenerering og publisering
- Deretter geofencing, poeng og ledertavle
- Til slutt refinering, QA og README

## Viktige notater
- V1 skal være begrenset og gjennomførbar
- Det skal finnes seed-data og mock-modus for lokal kjøring uten nøkler
- Regelbasert validering er prioritet i v1; ekstra KI-QA kan komme senere
- BMAD-flyten skal fortsette i rekkefølgen: brief → PRD → arkitektur → epics/stories → implementasjon

## Referanser
- [Leveranser/product-brief.md](Leveranser/product-brief.md)
- [planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md](planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md)
- [planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/addendum.md](planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/addendum.md)
