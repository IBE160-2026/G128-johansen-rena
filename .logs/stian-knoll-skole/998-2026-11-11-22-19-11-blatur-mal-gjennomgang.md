# Blåtur-mal-gjennomgang

## 2026-11-11 kl. 22:19 — StianKnollSkole

### Oppgave
Gå gjennom den nye mappa `template_trip/` (Blåtur ren V1). Stian bekreftet at den er malen for resultatet sluttbrukerne får fra TripBuilder AI: generatoren lager turen, og deltakere og arrangør bruker den i denne appen. Funnene skal diskuteres med Kevin.

### Plan
- Lese README, AGENTS.md, kildekoden, migrasjonene og seed i `template_trip/`.
- Kjøre `npm test`.
- Sammenligne med [ARCHITECTURE-SPINE.md](../../planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md).
- Lenker til Kevins åpne punkt om å «laste opp blåtur-malen og oppdatere arkitekturspinen» i [../kevin-rena/999-2026-10-28-19-19-10-gjennomforingsplan.md](../kevin-rena/999-2026-10-28-19-19-10-gjennomforingsplan.md). Malen er nå lastet opp (commit `5da570f`). Arkitekturspinen er ikke oppdatert.

### Resultat
- Ingen kode er endret. Malen kom inn i commit `5da570f`.
- `npm test`: 5 av 5 tester bestått. `npm run build` er ikke kjørt, fordi avhengighetene ikke er installert.
- Malen er et React/Vite-program for én tur, skrevet i JavaScript med vanlig CSS. Den har Hjem, Program, Rebus med påkrevd bildebevis, Bilder og Admin. Den har demomodus uten nøkler og Supabase med RLS, en privat bilde-bucket og poeng som bare regnes fra godkjente innsendinger.
- Avvik fra arkitekturspinen:

  | Arkitekturspinen | Malen |
  |---|---|
  | TypeScript og Tailwind | JavaScript og vanlig CSS |
  | Porter og adaptere, `VITE_APP_MODE` | Modus velges av om Supabase-variablene er satt |
  | Vitest og Playwright | `node:test` |
  | Tabellen `posts` | Tabellen `checkpoints` |
  | `join_trip(join_code, display_name)` | `join_trip(p_slug, p_code, p_name)` |
  | `VITE_SUPABASE_ANON_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` |
  | Geofencing | Bare kart |

- Anbefaling til gruppen: tilpass arkitekturspinen til malen, i stedet for å skrive om kode som virker etter et utkast.

### Åpne punkter
- Avgjør med Kevin om arkitekturspinen skal tilpasses malen, med dens stakk, datamodell og `join_trip`-signatur. Oppdater deretter berørte epics og stories.
- Gjør malen datadrevet for genererte turer:
  - `join()` bruker alltid sluggen `'blatur-2026'` (`src/context/TripContext.jsx:534`).
  - Velkomstsiden og sidemenyen har tittel og datoer skrevet rett inn (`Welcome.jsx`, `Shell.jsx`).
- `loadTrip` tar første medlemskap (`limit(1)`). Den må hente turen ut fra ID eller slug, slik at én bruker kan være med på flere turer.
- Arrangøren kan ikke opprette lag i appen. Enten må generatoren lage lagene, eller Admin må få et skjema for det.
- Avgjør om genererte turer skal kunne ha eget visuelt tema. I så fall må fargene i CSS-en bli variabler.
- Avgjør om generatoren og malen skal være én app eller to apper med samme Supabase-database.
- `START_LOKALT.md` sier at Supabase-prosjektet «CharterFeber AI» har et annet skjema enn appen: `trips.title` og `private.trip_secrets` mot `trips.name` og `private.trip_access`. Skjemaene må samordnes før appen kobles til live-data.
- Henting av signerte URL-er skjer ett bilde om gangen ved hver oppdatering (`src/lib/api.js:282`). Det bør gjøres samlet med `createSignedUrls`.
