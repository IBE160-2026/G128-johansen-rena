---
title: 'Story 1.1: Appen starter i demo-modus fra blåtur-malen'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: 'db096582df5b11386ed7f79a0bd350a119365bec'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/planning-artifacts/ux-designs/ux-G128-johansen-rena-2026-10-28/DESIGN.md'
  - '{project-root}/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Malen i `template_trip/` er en app for én hardkodet tur (`blatur-2026`, «BLÅTUR», 24–27 april, første medlemskap) med en egen stil, og den er aldri bygget eller kjørt av gruppen. Den må bli grunnlaget for TripBuilder AI.

**Approach:** Ta malen i bruk uten å endre stakken: gjør tur, tittel og datoer datadrevet med tur hentet fra slug i adressen, legg designtokens inn som CSS-variabler, rett README og AGENTS.md, og verifiser at `npm install && npm run dev`, `npm test` og `npm run build` virker uten nøkler.

## Boundaries & Constraints

**Always:** Behold JavaScript, vanlig CSS og `node:test`. Modus leses bare i `src/lib/supabase.js`. Demo-modus uten `.env`, med demo-banner. `.env.example` har bare offentlige variabler. Rør ikke `supabase/migrations/` som allerede finnes.

**Beslutninger (2026-11-24):** (1) Appen flyttes fra `template_trip/` til repo-roten med `git mv`, og `template_trip/` fjernes. (2) Malens utseende beholdes: fargene trekkes ut som CSS-variabler, kobberfargen mørknes til minst 4.5:1 kontrast, og DESIGN.md oppdateres til å matche.

**Never:** Ikke TypeScript, Tailwind, zod, Vitest eller Playwright. Ingen `validate.js`, `geo.js`, ny seed eller rollevalg (Story 1.2 til 1.4). Ikke endre navigasjonen (Story 1.5). Ikke koble til live Supabase.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kjent tur | Demo-modus, `/t/blatur-2026` | Turens tittel, datoer og destinasjon fra data | N/A |
| Ukjent tur | `/t/finnes-ikke` | Melding «Fant ikke turen.» med lenke til start | Ingen krasj |
| Flere medlemskap (live) | Bruker med to turer | Turen i adressen lastes, ikke første medlemskap | Ikke medlem: «Du er ikke med på denne turen.» |
| Ren klone | Ingen `.env` | Appen starter i demo-modus med banner | N/A |

</frozen-after-approval>

## Code Map

- `template_trip/src/context/TripContext.jsx` -- tilstand og handlinger. Demo-data inline (`DEMO_DATA_KEY`). `join()` hardkoder `p_slug: 'blatur-2026'` (rundt linje 120). Skal få slug fra adressen.
- `template_trip/src/lib/api.js` -- `loadTrip(userId)` tar første `trip_members` med `limit(1)`. Skal bli `loadTrip(userId, slug)`.
- `template_trip/src/App.jsx`, `src/main.jsx` -- rutene (`/`, `/program`, `/rebus`, `/bilder`, `/admin`) uten slug. Skal under `/t/:slug/`.
- `template_trip/src/components/Shell.jsx` -- «BLÅTUR», «ET LITE EVENTYR» hardkodet i sidemeny. Lenker uten slug.
- `template_trip/src/pages/Welcome.jsx` -- «BLÅTUR 2026», «24 — 27 APRIL · 2026» hardkodet. Skal vise turens data.
- `template_trip/src/styles.css` -- alle farger spredt som hex, kun `--dark`, `--copper` m.fl. som variabler. Fonter fra Google Fonts.
- `template_trip/src/data/demo.js` -- seed med slug `blatur-2026` (erstattes først i Story 1.3).
- `template_trip/README.md`, `AGENTS.md`, `START_LOKALT.md` -- sier «én tur» og «GPS må valideres på serveren». Rettes.
- `template_trip/tests/core.test.js` -- 5 tester for `core.js`. Beholdes, og brukes til å bekrefte `npm test`.
- Gjenbruk: `src/lib/supabase.js` (modus), `src/lib/core.js`. Ikke endre `supabase/migrations/`.

## Tasks & Acceptance

**Execution:**
- [x] Repo-roten -- `git mv` av innholdet i `template_trip/` (inkl. `.gitignore`, merge med rotens), oppdater stier i README/spinen -- beslutning 1
- [x] `src/App.jsx`, `src/main.jsx`, `src/components/Shell.jsx` -- rutene under `/t/:slug`, lenker med slug, rot sender demo til seed-turen -- tur fra adresse
- [x] `src/lib/api.js`, `src/context/TripContext.jsx` -- `loadTrip(userId, slug)` og `join(name, code)` bruker slug fra adressen -- ikke første medlemskap, ikke hardkodet
- [x] `src/pages/Welcome.jsx`, `Shell.jsx` -- tittel, destinasjon og datoer fra turdata -- datadrevet
- [x] `src/styles.css` -- designtokens som CSS-variabler (malens utseende, kobber mørknet til 4.5:1) og oppdater DESIGN.md -- UX-DR1, beslutning 2
- [x] `README.md`, `AGENTS.md`, `START_LOKALT.md` -- ikke «én tur», fjern «serververifisert GPS» -- AD-6
- [x] `package.json`, `package-lock.json` -- sjekk versjoner mot npm, commit låsefil -- AC
- [x] `tests/` -- test av ren hjelpefunksjon for slug-oppslag -- I/O-matrisen

**Acceptance Criteria:**
- Gitt en ren klone uten `.env`, når `npm install && npm run dev` kjører, så starter appen i demo-modus med banner.
- Gitt `npm test` og `npm run build`, når de kjører, så er begge grønne.
- Gitt `/t/finnes-ikke`, når siden åpnes, så vises «Fant ikke turen.» uten krasj.
- Gitt kildekoden, når den søkes etter `blatur-2026`, så finnes det bare i seed-data.

## Implementation Notes

- Flyttet `template_trip/` til repo-roten med `git mv`. Rotens `.gitignore`, `README.md` og `CLAUDE.md` beholdt (malens `.gitignore` og `CLAUDE.md` fjernet). Malens README ligger i `docs/app-oppsett.md`, og `START_LOKALT.md` i `docs/`. `AGENTS.md` ligger i roten og er rettet. Roten `CLAUDE.md` peker nå til `AGENTS.md`.
- Adresser `/t/:slug/*`. `TripProvider` tar `slug` og ligger under ruten (ikke i `main.jsx`). Start (`/`) sender demo-modus til seed-turen. Ukjent slug i demo gir «Fant ikke turen.» (`notFound`). `loadTrip(userId, slug)` henter turen fra slug og medlemskap for brukeren, ikke første medlemskap. `join()` bruker slug fra adressen.
- Nye hjelpere i `core.js`: `tripPath`, `slugFromPath`, `findTripBySlug`. Tester i `tests/trip-paths.test.js` (9 tester totalt, alle grønne).
- Demo-banneret er egen komponent og vises nå også på startsiden og «Fant ikke turen.».
- Tokens som CSS-variabler i `src/styles.css`. Primary mørknet fra `#b8732a` (3,6:1) til `#8a5216` (6,0:1 mot krem). Eldre variabelnavn er aliaser. Hardkodede hex-farger ellers i CSS er ikke byttet ut (kommer med temaet i Epic 2).
- Navn endret til TripBuilder i sidemeny, `index.html`, `package.json`. Demo-localStorage-nøklene er `tripbuilder-demo-v1` og `tripbuilder-user-v1`.
- npm outdated: bare patch- og minorforskjeller (supabase-js 2.118.0 mot 2.119.2, vite 8.3.5 mot 8.3.8, react-router-dom 7.18.5 mot 7.18.7, plugin-react 6.1.2 mot 6.3.0). Ingen oppdatering gjort, og `package-lock.json` er uendret.
- Ikke testet: Supabase-modus (ingen live-instans), brukere med flere medlemskap, og innlogget visning i nettleser (kontrollert via bygg, tester og headless Chrome på startsiden og ukjent slug).
- Demo-seeden inneholder fortsatt Blåtur Budapest og navn på virkelige personer. Den byttes i Story 1.3.

## Spec Change Log

## Review Triage Log

| # | Funn (lag) | Verdikt | Rute | Evidens |
|---|---|---|---|---|
| 1 | Live: ukjent slug og ikke-medlem gir ingen «Du er ikke med på denne turen.» (alle tre) | medium | patch | `notFound` var bare for demo, og `loadTrip` gir `null`. Ikke-medlem får nå en melding på Welcome (`notMember`). Ukjent slug og ikke-medlem kan ikke skilles i live (RLS skjuler turen), så Welcome med bli-med-skjema er riktig. Avviket fra I/O-matrisen er rettet i koden, ikke i spec. |
| 2 | Testene dekker `findTripBySlug`, som appen ikke brukte (verification-gap, blind, edge) | medium | patch | `notFound` bruker nå `findTripBySlug`, så testen vokter den ekte stien. |
| 3 | `slugFromPath` kan kaste `URIError`, `tripPath` fjerner bare ett ledende `/` | low | patch | try/catch og `/^\/+/`, med test. |
| 4 | `package-lock.json` heter fortsatt `blatur-ren` | low | patch | Rettet i begge feltene. |
| 5 | `--copper` (nå mørk) brukt på mørk flate: sidemenyens punktum og `.welcome-art h1 em` | medium | patch | Kontrast ca. 2,5:1. Byttet til `--accent-on-dark`. |
| 6 | Magic link uten `emailRedirectTo` lander på `/` (dødt punkt i live) | medium | patch | `emailRedirectTo` peker nå på turens adresse. |
| 7 | Dokumentasjon ikke fullt oppdatert (README-dato, START_LOKALT sier ZIP) | low | patch | Rettet. |
| 8 | Demobanneret over `.welcome` med `min-height:100vh` gir rulling | low | patch | `.demo-banner+.welcome` trekker fra bannerhøyden. |
| 9 | Live `/` er en blindgate, innloggede bruker sendes ikke til turen sin | medium | defer | Start-flaten hører til Story 1.4 og Epic 2/3. |
| 10 | `join()` etterlater anonym sesjon når RPC feiler | low | defer | Finnes i malen fra før, ikke forårsaket av endringen. |
| 11 | Admin mangler i bunnmenyen på mobil | low | defer | Finnes i malen fra før. Navigasjonen avgjøres i Story 1.5. |
| 12 | Malens CLAUDE.md-setning om å samordne skjema og UI-kontrakter er borte | low | defer | Rettelsen ville endre agentkontekst-filer. |
| 13 | Demo-nøkler i localStorage byttet navn uten migrering | low | false | Demodata er kastbare. Å miste dem er ønsket etter navnebyttet. |
| 14 | `updateTrip` kan endre slug og gi «Fant ikke turen.» | false | reject | Admin redigerer ikke slug (ingen treff i `Admin.jsx`). |
| 15 | Feilmelding vises bare på Welcome når første henting feiler | false | reject | Welcome viser `error` allerede. |
| 16 | Ubrukte tokens, hardkodede farger igjen, `tripPath` uten slug-vakt | low | reject | Kosmetikk. Fiks ville legge til kode uten kjent skade. |
| 17 | `vercel.json`/Vite `base` ikke verifisert for `/t/*` | false | reject | Rewrite `/(.*)` dekker det, og direktelenke er verifisert lokalt. |
| 18 | Race mellom to spørringer i `loadTrip`, foreldet demo-bruker | low | reject | Ikke vist at det kan skje. |
| 19 | Flytting og DoD ikke dokumentert (blind) | low | patch | Verifisert: 9 tester, bygg, innlogget navigasjon i Chrome. Se Implementation Notes. |

## Verification

**Commands:**
- `npm install && npm test` -- expected: 5+ tester grønne
- `npm run build` -- expected: bygger uten feil
- `grep -rn "blatur-2026" src` -- expected: bare i `src/data/demo.js`

**Manual checks (if no CLI):**
- Åpne `localhost` på 390 px bredde og en PC: demo-banner, turens tittel og datoer, ukjent slug gir feilmelding.
