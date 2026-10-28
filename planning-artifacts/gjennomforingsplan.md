---
title: "Gjennomføringsplan: TripBuilder AI"
status: utkast
created: 2026-10-28
kilder:
  - Leveranser/product-brief.md
  - planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md
  - Leveranser/tilbakemelding-product-brief.md
---

# Gjennomføringsplan: TripBuilder AI

Planen bryter product brief og PRD ned i små steg som kan tas ett om gangen. Hvert steg har et tydelig **ferdig når**-kriterium. Vi går ikke videre før det er oppfylt. Etter hvert trinn (A–D) har vi en app som fungerer og kan vises fram, selv om de senere trinnene ikke blir ferdige.

**Prinsipper (fra brief og tilbakemelding):**
- Trinnene tas i rekkefølge. Et trinn skal være stabilt før neste startes.
- Demo-modus med seed-data og mock av KI skal virke fra første stund. Sensor skal kunne kjøre appen uten nøklene våre.
- V1 bruker regelbasert validering i stedet for en QA-agent på OpenAI.
- KI-en fyller en fast datamodell og genererer aldri kode.
- Hvert steg avsluttes med commit, og med sesjonslogg (se `CLAUDE.md`).

---

## Fase 0 – Planlegging (BMAD)

| # | Steg | BMAD-skill | Ferdig når |
|---|---|---|---|
| 0.1 | Avklar de åpne spørsmålene i PRD §8 (datamodell, autentiseringsnivå, bildevalidering, testoppsett for sanntid, AI-QA) | – | Svarene er skrevet inn i PRD-en |
| 0.2 | Rett inkonsistenser i briefen (se merknader nederst) | `bmad-product-brief` | Briefen og PRD-en sier det samme |
| 0.3 | UX: hovedflyter for arrangør og deltaker, skjermbilder og mobilbruk i felt | `bmad-ux` | `DESIGN.md` og `EXPERIENCE.md` finnes |
| 0.4 | Arkitektur: systemstruktur, datamodell (tur, dag, programpost, lag, deltaker, rebuspost, innlevering), mock-modus og geofencing | `bmad-architecture` | Arkitekturdokumentet er godkjent av begge |
| 0.5 | Epics og stories, gruppert etter trinn A–D | `bmad-create-epics-and-stories` | Hver story har testbare akseptansekriterier |
| 0.6 | Sprintplan og sjekk av at vi er klare | `bmad-sprint-planning` | Sprint-status-fila er generert |

## Fase 1 – Fundament

| # | Steg | Ferdig når |
|---|---|---|
| 1.1 | Sett opp prosjektet med Vite, React, Tailwind, lint/format og testrammeverk (Vitest) | `npm run dev` og `npm test` kjører |
| 1.2 | Datamodellen som TypeScript-typer og JSON-skjema (f.eks. Zod) | Skjemaet avviser ugyldige turer i tester |
| 1.3 | Regelbasert validator: påkrevde felt, koordinater innenfor turens område, én oppføring per dag og riktig antall poster | Tester dekker SM-2 og SM-3 |
| 1.4 | Seed-data: én ferdig prøvetur, f.eks. basert på blåturen | Prøveturen validerer 100 % |
| 1.5 | Datalag med to implementasjoner: lokal (minne/localStorage) og Supabase. En miljøvariabel velger hvilken | Appen starter uten Supabase-nøkler |
| 1.6 | Første utkast av README: hvordan appen kjøres i demo-modus | En av oss klarer å kjøre appen fra en ren klone kun ved å følge README |

## Trinn A – KI-generert tur, redigering og publisering

*Minste leverbare versjon. Arrangøren lager en tur, og deltakerne ser den.*

| # | Steg | Krav | Ferdig når |
|---|---|---|---|
| A.1 | Promptskjema for arrangør, med feilmelding ved tom eller for kort input | FR-1 | Tom input gir tydelig melding |
| A.2 | Mock-agent som returnerer seed-turen | FR-12 | Hele flyten virker uten API-nøkkel |
| A.3 | Claude-agent som returnerer JSON etter skjemaet, kjørt gjennom validatoren | FR-2 | 2–3 testprompter gir gyldig JSON |
| A.4 | Visning og redigering av utkastet: program, poster og lag | FR-3 | Når én post endres, påvirkes ingen andre |
| A.5 | Publisering som eksplisitt handling, med en delbar lenke | FR-4 | Publisert tur åpnes i deltakervisningen |
| A.6 | Deltakerside på mobil med dagens program og kart med poster (Leaflet) | UJ-3 | Siden virker på mobil og laster på under 3 s (SM-7) |
| A.7 | Enkel innlogging: arrangør, og deltaker via turkode én gang per tur | – | Deltakeren forblir innlogget gjennom hele turen |

**Milepæl A:** Demo av hele flyten fra prompt via redigering og publisering til deltakerside, i mock-modus.

## Trinn B – Geolåst rebus og poengregning

| # | Steg | Krav | Ferdig når |
|---|---|---|---|
| B.1 | Avstandsberegning (haversine) som en ren funksjon | FR-5 | Enhetstester med kjente koordinater |
| B.2 | Posisjon fra nettleseren, og en simulert posisjon i demo-modus («jeg er her»-knapp eller URL-parameter) | FR-6 | Opplåsing kan testes uten å gå ut |
| B.3 | Posten låses opp innenfor radius og forblir låst utenfor | FR-6 | Over 80 % korrekt i test (SM-4) |
| B.4 | Tekstsvar på oppgaver | FR-7 | Svaret lagres på riktig post og lag |
| B.5 | Poengregler og poengregning per lag | FR-8 | Ugyldige regler avvises, og poengene stemmer i tester |

**Milepæl B:** Deltakeren går til posten (simulert), låser den opp, svarer og får poeng.

## Trinn C – Sanntids ledertavle, lag og bildeopplasting

| # | Steg | Krav | Ferdig når |
|---|---|---|---|
| C.1 | Tildele deltakere til lag | FR-8 | Deltakeren ser hvilket lag hen er på |
| C.2 | Ledertavle med Supabase Realtime, og polling eller BroadcastChannel i demo-modus | FR-9, FR-10 | Oppdatering på under 5 s mellom to klienter (SM-5) |
| C.3 | Bildeopplasting til Supabase Storage, med lokal lagring i demo-modus | FR-7 | Bildet knyttes til riktig post og lag |
| C.4 | Tilgangsregler (RLS) slik at bare turens deltakere ser bildene | – | Tilgangsreglene er testet med to turer |

**Milepæl C:** To mobiler samtidig, der poeng fra den ene vises hos den andre.

## Trinn D – Endringer underveis (Epic 5)

| # | Steg | Krav | Ferdig når |
|---|---|---|---|
| D.1 | Arrangøren endrer en publisert tur fra mobil, med validering | FR-17 | En ugyldig endring lagres ikke |
| D.2 | Legge til nye poster og programposter underveis | FR-17 | En ny post kan låses opp og besvares |
| D.3 | Deaktivere en post, med poengene beholdt | FR-17 | Poengene står, og nye innsendinger avvises |
| D.4 | Deltakerne ser endringer med en gang, med «Endret»-merke og banner | FR-18 | Endringen er synlig innen 5 s |

**Milepæl D:** Arrangøren bytter restaurant på mobilen, og deltakeren ser det med en gang.

## Trinn E – Regenerering og KI-forslag (Epic 6)

| # | Steg | Krav | Ferdig når |
|---|---|---|---|
| E.1 | Kommando i naturlig språk per element, for eksempel «bytt ut post 4» | FR-3, UJ-2 | Bare det valgte elementet endres |
| E.2 | Validering etter regenerering, med mulighet for å angre | FR-3 | En ugyldig regenerering blir ikke lagret |
| E.3 | «Ny post med KI» og forslag på en publisert tur | FR-17 | Ingenting går live før arrangøren har trykket «Bruk» |

## Fase 2 – Avslutning (går parallelt fra Trinn A og ut)

| # | Steg | Ferdig når |
|---|---|---|
| 2.1 | Ende-til-ende-tester av kjerneflyten (`bmad-qa-generate-e2e-tests`) | Testene kjører grønt i demo-modus |
| 2.2 | Kodegjennomgang per epic (`bmad-code-review`) | Funnene er rettet eller begrunnet |
| 2.3 | Mål suksesskriteriene SM-1 til SM-8 og dokumenter resultatet | Tabellen er utfylt med faktiske tall |
| 2.4 | Ferdigstill README: demo-modus, ekte modus og tester | Sensor kan kjøre appen uten nøklene våre |
| 2.5 | Deploy til Vercel (valgfritt) og øvelse på demoen | Eksamensdemoen er øvd |
| 2.6 | Retrospektiv (`bmad-retrospective`) | Retrospektiven ligger i mappen |

---

## Merknader til briefen (rettes i steg 0.2)

1. Under «Omfang» står det at teknologivalget er «Claude API for agentkjeden og OpenAI for QA-agenten». Det strider mot beslutningen om regelbasert validering i V1. OpenAI bør flyttes til «senere».
2. «Inne (V1, trinn 1–3)» tar med regenerering av enkeltdeler, men dette ligger i trinn 4.
3. Tilbakemeldingen foreslår at deltakersiden med program og kart hører til det første trinnet, mens briefens trinn 1 bare nevner arrangørflyten. Denne planen følger tilbakemeldingen (A.6).
4. Briefen viser til `./addendum.md`, men den fila ligger ikke i `Leveranser/`.

## Fremdrift

- [ ] Fase 0 – Planlegging
- [ ] Fase 1 – Fundament
- [ ] Trinn A – KI-generert tur (milepæl A)
- [ ] Trinn B – Geolåst rebus og poeng (milepæl B)
- [ ] Trinn C – Sanntid, lag og bilder (milepæl C)
- [ ] Trinn D – Endringer underveis (milepæl D)
- [ ] Trinn E – Regenerering og KI-forslag
- [ ] Fase 2 – Avslutning
