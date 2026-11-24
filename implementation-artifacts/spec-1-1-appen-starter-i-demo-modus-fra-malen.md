---
title: 'Story 1.1: Appen starter i demo-modus fra blåtur-malen'
type: 'feature'
created: '2026-11-24'
status: 'ready-for-dev'
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
- [ ] Repo-roten -- `git mv` av innholdet i `template_trip/` (inkl. `.gitignore`, merge med rotens), oppdater stier i README/spinen -- beslutning 1
- [ ] `src/App.jsx`, `src/main.jsx`, `src/components/Shell.jsx` -- rutene under `/t/:slug`, lenker med slug, rot sender demo til seed-turen -- tur fra adresse
- [ ] `src/lib/api.js`, `src/context/TripContext.jsx` -- `loadTrip(userId, slug)` og `join(name, code)` bruker slug fra adressen -- ikke første medlemskap, ikke hardkodet
- [ ] `src/pages/Welcome.jsx`, `Shell.jsx` -- tittel, destinasjon og datoer fra turdata -- datadrevet
- [ ] `src/styles.css` -- designtokens som CSS-variabler (malens utseende, kobber mørknet til 4.5:1) og oppdater DESIGN.md -- UX-DR1, beslutning 2
- [ ] `README.md`, `AGENTS.md`, `START_LOKALT.md` -- ikke «én tur», fjern «serververifisert GPS» -- AD-6
- [ ] `package.json`, `package-lock.json` -- sjekk versjoner mot npm, commit låsefil -- AC
- [ ] `tests/` -- test av ren hjelpefunksjon for slug-oppslag -- I/O-matrisen

**Acceptance Criteria:**
- Gitt en ren klone uten `.env`, når `npm install && npm run dev` kjører, så starter appen i demo-modus med banner.
- Gitt `npm test` og `npm run build`, når de kjører, så er begge grønne.
- Gitt `/t/finnes-ikke`, når siden åpnes, så vises «Fant ikke turen.» uten krasj.
- Gitt kildekoden, når den søkes etter `blatur-2026`, så finnes det bare i seed-data.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm install && npm test` -- expected: 5+ tester grønne
- `npm run build` -- expected: bygger uten feil
- `grep -rn "blatur-2026" src` -- expected: bare i `src/data/demo.js`

**Manual checks (if no CLI):**
- Åpne `localhost` på 390 px bredde og en PC: demo-banner, turens tittel og datoer, ukjent slug gir feilmelding.
