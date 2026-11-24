# Epic 1 Context: Prøvetur i demo-modus på mobil

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Sensor eller deltaker starter appen lokalt uten nøkler, velger rolle og ser en ferdig prøvetur: programmet per dag og kartet med poster, i riktig stil. Epicen har tatt blåtur-malen i bruk (flyttet til repo-roten i Story 1.1) som grunnlag for én app (generator, arrangør, deltaker), gjør den datadrevet og legger inn rene valideringsfunksjoner, seed-tur og designtokens.

## Stories

- Story 1.1: Appen starter i demo-modus fra blåtur-malen
- Story 1.2: Turdata valideres av domenekjernen
- Story 1.3: Prøveturen lastes fra seed-data
- Story 1.4: Rollevalg på startsiden
- Story 1.5: Deltakeren ser dagens program
- Story 1.6: Deltakeren ser postene på kartet

## Requirements & Constraints

- Demo-modus må starte med `npm install && npm run dev` uten `.env` og uten eksterne kontoer. Demo-banner er alltid synlig i demo-modus.
- Seed-turen må alltid validere med `validateTrip()` (testet), ha minst to dager, både geolåste og åpne poster og ett lag per brukt lagfarge.
- Deltakerflaten er mobil først (360–430 px, maks 480 px bredde, sentrert på store skjermer). Trykkflater minst 48 px, status vises aldri bare med farge, synlig fokus, høy kontrast.
- Programmet mellomlagres etter første lasting og vises uten nett.
- All tekst til brukeren er norsk bokmål uten tekniske ord.

## Technical Decisions

- Malens stakk beholdes: JavaScript (ESM), vanlig CSS, React 19, Vite 8, React Router 7, Leaflet/react-leaflet, supabase-js, `node:test`. Ingen TypeScript, Tailwind, zod, Vitest eller Playwright.
- Rene funksjoner (ingen avhengigheter, ingen sideeffekter) i `src/lib/`: `core.js` (finnes), `validate.js`, `geo.js` (haversine), `scoring.js`. Testes i `tests/*.test.js`.
- All datatilgang går gjennom `src/lib/api.js` (demo og supabase). Modus avgjøres av om `VITE_SUPABASE_URL` og `VITE_SUPABASE_PUBLISHABLE_KEY` er satt, og dette leses bare i `src/lib/supabase.js`. Sidene kaller aldri supabase direkte.
- Tur hentes fra slug i adressen, ikke første medlemskap og ikke hardkodet `blatur-2026`. Tittel og datoer kommer fra turdata.
- Tabeller følger malen (`trips`, `teams`, `trip_members`, `program_items`, `checkpoints`, `submissions`, `photos`). Dag er alle `program_items` med samme `event_date`. Nye kolonner kommer i nye migrasjoner, aldri ved å endre kjørte.
- Posisjon sendes eller lagres aldri på serveren. Opplåsing: avstand ≤ `radius_m`, eller alltid åpen når `requires_location = false`.
- `core.js` har allerede `distanceMeters` (haversine), `standings`, `sortEvents`, `currentTripDay`, `validateImage` og slug-hjelperne. Nye rene filer legges ved siden av.
- `.env.example` har bare offentlige `VITE_`-variabler. Malens README og `AGENTS.md` må rettes (ikke «én tur», ingen serververifisert GPS).

## UX & Interaction Patterns

- Malens varme utseende er beholdt (mørk brun, kobber, krem, DM Sans). Tokens fra DESIGN.md ligger som CSS-variabler i `src/styles.css` (primary er mørknet til 4.5:1): farger (surface, ink, primary, success, warning, danger, locked, team-1 til team-6), typografi (display, title, body, meta, score), radius og spacing. Aksentfarger må være variabler (tema per tur).
- Primær- og sekundærknapp, minst 48 px, full bredde på mobil.
- Programkort med aktiv aktivitet uthevet med venstrekant i primary. Kartmarkører i tilstandene låst, åpen og (senere) fullført, med nummer og ikon.
- Navigasjon for deltakeren (I dag, Kart, Ledertavle, Laget): mønsteret avgjøres ut fra malens skall, og bunnfaner er foreløpig valgt bort.

## Cross-Story Dependencies

- 1.1 (oppsett, tokens, datadrevet mal) er ferdig: appen ligger i repo-roten, og turer ligger på `/t/:slug`.
- 1.2 (`validate.js`, `geo.js`) brukes av 1.3 (seed-test) og senere av Epic 2 og 3.
- 1.3 (seed og demo-implementasjon i `api.js`) er forutsetning for 1.4 til 1.6.
