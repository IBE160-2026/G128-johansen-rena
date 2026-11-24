---
title: 'Story 1.6: Deltakeren ser postene på kartet'
type: 'feature'
created: '2026-11-25'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Kartet i Kart-fanen viser alle poster som like kobberprikker i et fast utsnitt, uten nummer og uten forskjell på låste og åpne poster. Det finnes ikke noe postkort, og I dag-fanen har ingen postliste. Deltakeren ser ikke hvilke poster som finnes eller hvilken tilstand de har.

**Approach:** Vis postene som nummererte markører med ikon for tilstanden (låst eller åpen). Kartet zoomes så alle poster synes. Trykk på en markør viser et postkort nederst på kartet med navn og status, og en åpen post viser oppgaveteksten direkte. I dag-fanen får en postliste med samme poster og statuser.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Det finnes ingen dag på poster i datamodellen, så «dagens poster» er alle aktive poster (`status` ikke `deactivated`), sortert på `position`. (2) Tilstander er låst (`requires_location = true`) og åpen (`requires_location = false`). Fullført kommer med Story 3.5, og opplåst ved posisjon og avstand kommer med Story 3.2 og 3.3. (3) Låst post på postkortet viser at den er låst og skjuler oppgaveteksten. En åpen post viser oppgaveteksten og «Løs oppgaven», som åpner dagens innsendingsvindu. «Løs oppgaven» er deaktivert for låste poster, og posten kan heller ikke sendes inn fra listen før Story 3.2 låser den opp. (4) Status vises aldri bare med farge: markør og liste har ikon og tekst. Rene hjelpere i `core.js` (`activeCheckpoints`, `checkpointStatus`, `checkpointBounds`) med tester. Markørene kan nås med tastatur og har tilgjengelig navn («Post 1: Palasset, låst»). Postlisten på I dag lenker til Kart med posten valgt (`?post=<id>`).

**Never:** Ingen posisjon, avstand eller retning (Story 3.2 og 3.3), ingen fullført-tilstand, ingen deaktiverte poster (UX-DR24), ingen endret-merke (Epic 5). Ikke endre `validate.js`, seed eller migrasjoner. Ikke endre innsendingsvinduet eller hvordan innsending lagres.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kart med poster | 6 aktive poster | 6 nummererte markører (1 til 6), kartet zoomet så alle synes | N/A |
| Én post | 1 aktiv post | Kartet sentreres på posten med fast zoom | N/A |
| Ingen poster | 0 aktive poster | Ingen kart, tom-melding | Ingen krasj |
| Trykk på låst markør | `requires_location = true` | Postkort med navn og «Låst», uten oppgavetekst, «Løs oppgaven» deaktivert | N/A |
| Trykk på åpen markør | `requires_location = false` | Postkort med navn, «Åpen», oppgaveteksten, «Løs oppgaven» aktiv | N/A |
| Allerede levert | Laget har innsending på posten | Postkortet viser Venter eller Godkjent, og «Løs oppgaven» er deaktivert | N/A |
| Avvist innsending | Siste innsending er avvist | Postkortet viser Avvist, og posten kan leveres på nytt | N/A |
| Deaktivert post | `status = deactivated` | Vises ikke | N/A |
| Postliste på I dag | Samme poster | Liste med nummer, navn og status med ikon og tekst, lenke til Kart med posten valgt | N/A |
| Valgt post fra lenke | `/kart?post=<id>` | Postkortet er åpent for den posten | Ukjent id: ingen valgt |
| Tastatur | Fokus på markør, Enter | Postkortet åpnes | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Rebus.jsx` -- Kart-siden: `MapContainer` med `CircleMarker` (rundt linje 46), kortgrid «Alle rebusposter», innsendingsmodal med `selected`. Skal få nye markører, `FitBounds`, postkort og valgt post fra `?post=`.
- `src/pages/Home.jsx` -- I dag. Legg postliste nederst.
- `src/lib/core.js` -- `standings`, `currentEventId` osv. Nye rene funksjoner.
- `src/styles.css` -- `.map`, `.map-section`, `.checkpoint-card`, `.status`.
- `src/data/demo.js` -- seed-poster har `requires_location`, `position`, `status`, `latitude`, `longitude`.
- Nye: `src/components/PostMap.jsx`, `src/components/PostList.jsx`, `tests/posts.test.js`.
- Bruk `leaflet` (`L.divIcon`, `Marker`) og `react-leaflet` (`useMap`) som allerede er avhengigheter. Ingen nye pakker.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/core.js` -- `activeCheckpoints`, `checkpointStatus`, `checkpointBounds` -- ren logikk
- [ ] `src/components/PostMap.jsx`, `src/styles.css` -- nummererte markører med ikon, `FitBounds`, postkort -- UX-DR4, UX-DR5, UX-DR23
- [ ] `src/pages/Rebus.jsx` -- bruk PostMap, `?post=`, låste poster kan ikke leveres -- beslutning 3
- [ ] `src/components/PostList.jsx`, `src/pages/Home.jsx` -- postliste på I dag -- UX-DR17
- [ ] `tests/posts.test.js` -- matriseradene som kan testes rent -- AC

**Acceptance Criteria:**
- Gitt Kart-fanen, når den åpnes, så ser jeg postene som nummererte markører i tilstanden låst eller åpen, og kartet er zoomet så alle synes.
- Gitt kartet, når jeg trykker på en markør, så vises postkortet med navn og status, og en åpen post viser oppgaveteksten direkte.
- Gitt I dag-fanen, når jeg ruller ned, så finnes en postliste med de samme postene og statusene.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome 390 px: seks markører med nummer, trykk på låst og åpen markør, postliste på I dag, `?post=`.
