# Todo – BMAD workflow for TripBuilder AI

## Status
- [x] Product brief oppdatert etter foreleserfeedback
- [x] PRD oppdatert / lagt til i planning-artifacts
- [x] UX-design dokumentasjon (utkast skrevet, ikke godkjent av gruppen)
- [x] Arkitektur-dokument (utkast skrevet, ikke godkjent av gruppen)
- [x] Epics og stories (7 epics, 34 stories)
- [x] QA-funn fra `OpenAI_QA/` vurdert og fulgt opp (se `planning-artifacts/qa-oppfolging-2026-10-28.md`)
- [x] Sprint planning (steg 0.6): `implementation-artifacts/sprint-status.yaml`, CONCERNS med 4 åpne punkter
- [ ] Implementasjonsstart / kode
- [ ] Testplan og QA
- [ ] README / kjørbarhet og demo-modus

## Kort oppsummering

Fase 0 (planlegging) er gjennomført frem til sprint planning: brief, PRD, UX, arkitektur og epics/stories finnes, og QA-funnene fra `OpenAI_QA/` er fulgt opp. UX og arkitektur er utkast som gruppen må gå gjennom. Neste steg er sprint planning (`bmad-sprint-planning`), deretter implementering story for story med `bmad-build`. Se [planning-artifacts/gjennomforingsplan.md](planning-artifacts/gjennomforingsplan.md).

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
- [planning-artifacts/gjennomforingsplan.md](planning-artifacts/gjennomforingsplan.md) – steg-for-steg plan
- [Leveranser/product-brief.md](Leveranser/product-brief.md)
- [planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md](planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md)
- [planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/addendum.md](planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/addendum.md)
