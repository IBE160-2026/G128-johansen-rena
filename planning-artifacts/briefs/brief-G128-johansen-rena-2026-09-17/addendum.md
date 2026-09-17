---
title: "Addendum: TripBuilder AI"
updated: 2026-09-17
---

# Addendum: TripBuilder AI

Materiale som ligger til grunn for briefen, men som passer bedre i senere arbeid (PRD/arkitektur) enn i selve briefen.

## Konkurrentlandskap (grunnlag for "Hva gjør dette annerledes")

Research kjørt 2026-09-17 (web-søk via subagent). Kilder: goosechase.com, blog.goosechase.com, scavify.com, en.actionbound.com, whova.com, guidebook.com, mindtrip.ai, layla.ai, wonderplan.ai, flowtrip.app, teamout.com, nowadays.ai, rsvpify.com.

**Arrangementsplattformer med program/lag/ledertavle**
- *Whova, Guidebook* — mobilapper for konferanser/bedriftsarrangementer. Whova har reell ledertavle (poeng for nettverksbygging/sesjonsdeltakelse). Guidebook tilbyr QR-kode-rebus. Bygget for konferanser, ikke uformelle turer — ingen geolåste oppgaver, ingen naturlig-språk-generering.
- *Scavify* — bedrifts-team-building rebus: GPS-innsjekk, foto/video/quiz-oppgaver, sanntids ledertavle, live bildefeed. Ingen bekreftet KI-innholdsgenerering.
- *TeamOut, Nowadays* — KI-assisterte planleggere for bedriftsoffsites/retreater, men fokusert på lokale/logistikk for arrangøren — ikke en publisert deltakerside med lag/ledertavle.
- *FlowTrip, RSVPify* — apper for utdrikningslag/gruppeturer: delt itinerary, KI-forslag til aktiviteter, kostnadsdeling, RSVP/logistikk. Ingen lag/poeng/geolokasjon-lag.

**KI-reiseplanleggere**
Mindtrip, Layla, Wonderplan, GuideGeek, Vacay tar naturlig-språk-input og genererer et personlig program (Layla har live bookinglenker; Mindtrip støtter gruppesamarbeid med delt tur-tavle og KI-assistent i chat; GuideGeek lever inne i WhatsApp/Messenger). Alle produserer en itinerary/planleggingsvisning for de reisende selv. **Ingen av dem publiserer en egen, brandbar deltakerside med lag, live ledertavle eller geolåste oppgaver** — den kategorien finnes ikke i dette segmentet i dag.

**Rebus/geolokasjon-apper**
- *Goosechase* — nærmeste eksisterende presedens for rebus-delen av TripBuilder AI. Har allerede en **innebygd KI-oppdragsgenerator** (beskriv målgruppe og mål, få ferdig oppdragsliste), pluss GPS/lokasjonsbaserte oppdrag, foto/video-innlevering og live ledertavler. Verifisert direkte mot goosechase.com (2026-09-17): produktet posisjonerer seg selv som "not just a scavenger hunt app... helps you create any interactive experience", men er skopet til **enkeltstående aktiviteter/arrangementer** (team building, onboarding, campus-orientering, konferanser) — ingen omtale av flerdagers reiseprogram, overnatting, måltider eller reiselogistikk. Det er en aktivitetsmotor for én opplevelse, ikke en turplanlegger for en flerdagers reise.
- *Scavify* — GPS-innsjekk, ledertavle, foto/video — ingen KI-generering funnet.
- *Actionbound* — europeisk ledende innen GPS+multimedia "Bounds", sterk i museum/utdanning/guidede stier, selvguidet; ingen KI-generering funnet.

**Konklusjon fra søket:** Rommet er stykkevis crowded, og én direkte konkurrent (Goosechase) gjør allerede KI-generert, GPS-låst rebus med ledertavler — det er ikke en unik påstand isolert sett. Men Goosechase er skopet til enkeltstående aktiviteter/arrangementer, ikke flerdagers reiser med program, overnatting og logistikk — det er et vesentlig skille, ikke en detalj. Ingen funnet kombinerer *alt* i én pipeline: ett naturlig-språk-prompt → agentkjede → én publisert mobilside med flerdagers program + lag/ledertavle + geolåst rebus + bildeopplasting + arrangør-godkjenning, rettet mot uformelle private grupper (blåtur/vennegjeng) snarere enn konferanse/bedrift. Rimelig påstand: arbeidsflyt-konsolidering på tvers av to kategorier som i dag løses hver for seg (reiseplanlegger + rebus-app) — ikke en teknisk unik evne i noen enkeltdel. En etablert aktør (Goosechase ved å legge til reiseprogram, eller en reiseplanlegger ved å legge til spillmekanikk) kunne i prinsippet lukke gapet.

## Teknologivalg (fra proposal.md, allerede besluttet av gruppen)

- **Frontend:** React + Vite + Tailwind, react-leaflet for kart
- **Backend/database:** Supabase (Postgres, auth, storage), Edge Functions eller Node-backend for KI-pipeline
- **KI:** Claude API med strukturert JSON-output for Planner-, Innholds- og Designagenten. **QA-agenten kjører på OpenAI**, bevisst et annet system enn resten av kjeden, slik at kontrollsteget ikke er det samme systemet som godkjenner sitt eget resultat.
- **Geolokasjon:** nettleserens Geolocation API og avstandsberegning mot postenes koordinater
- **Hosting:** Vercel
- **Utviklingsmetode:** BMAD med Claude Code som kodeagent

## Sikkerhet og datahåndtering (fra proposal.md)

Innlogging kreves for arrangør og deltakere (Supabase Auth). Posisjonsdata brukes kun i øyeblikket for å låse opp oppgaver og lagres ikke som sporingshistorikk. Bilder lagres i Supabase Storage med tilgang begrenset til turens deltakere.

## Åpne spørsmål til videre arbeid

- Ingen delt, detaljert sensureringsrubrikk er funnet utover generell vekting av vanskelighetsgrad — suksesskriteriene i briefen er en arbeidsantagelse. Bør bekreftes med faglærer/veileder før PRD.
- Differensieringen mot Goosechase er ikke en varig teknisk voll og bør ikke fremstilles som det i PRD eller presentasjon — se vurdering over.
