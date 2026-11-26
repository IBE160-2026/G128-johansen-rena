---
title: 'Story 2.7: Arrangøren publiserer turen'
type: 'feature'
created: '2026-11-26'
status: 'done'
baseline_commit: 'a7d51ce0121fa920e3497f55d1ae287e6e97e514'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Utkastet kan redigeres (2.5 og 2.6), men ikke publiseres. Publiser-knappen er deaktivert, det finnes ingen turkode, lenke eller QR-kode, og en publisert tur kan ikke åpnes: demo-lagringen tåler bare prøveturen.

**Approach:** En ren `publish.js` gjør et gyldig utkast til en publisert demotur med `status: 'published'`, unik turkode og adresse, og fiktive deltakere. Demo-lagringen får plass til publiserte turer ved siden av prøveturen, så turen kan spilles på `/t/<slug>`. Etter bekreftelse viser en delingsside turkoden, en lenke som forhåndsutfyller koden og en QR-kode (laget lokalt med pakken `qrcode`). Mine turer viser de publiserte turene.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-26): (1) Valg gjort av Kevin: en publisert tur skal være spillbar i demo; det er ingen minstekrav til antall poster eller lag (bare `validateTrip`); QR-koden lages med pakken `qrcode` (ny avhengighet, ingen data sendes ut). (2) Ren `src/lib/publish.js` (importerer bare `validate.js` og andre rene filer): `canPublish(draft)` er sann bare når `validateTrip(draft).ok`; `publishTrip({ draft, request }, { existing, random, now })` gir `{ ok: true, data }` eller `{ ok: false, error, issues? }`. `data` har samme form som demodata: `trip` (`id`, `slug`, `name`, `destination`, `description`, `start_date`, `end_date`, `announcement`, `destination_revealed: true`, `area`, `theme`, `status: 'published'`, `join_code`, `demo_published: true`, `published_at`), `teams` og `checkpoints` og `program` (fra `program_items`) med `trip_id`, `members`, og tomme `submissions` og `photos`. Datoene beholdes slik utkastet har dem. (3) `join_code` er 6 tegn fra `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (ingen 0, O, 1 eller I), og `slug` er laget av turnavnet (æ, ø, å skrives ae, o, a; bare a–z, 0–9 og bindestrek) pluss fire tegn. Begge er unike blant `existing` og prøveturens slug. Tilfeldigheten sendes inn (`random`) slik at den kan testes; appen bruker `crypto.getRandomValues`. (4) Fiktive deltakere: antallet er `participant_count` fra forespørselen, minst 1 og høyst 30, med norske fornavn (nummerert når navnene brukes opp), unike id-er og `role: 'participant'`, fordelt jevnt på lagene. Uten lag har de `team_id: null`. (5) Lagring: ren utvidelse av `demoStore.js`. Publiserte turer lagres hver for seg under `tripbuilder-demo-trip-v1:<slug>` med et originalbilde fra publiseringen, og en oversikt under `tripbuilder-demo-published-v1`. `loadDemo(storage, makeSeed, userStorage, slug)` gir prøveturen når `slug` mangler eller er prøveturens, ellers den publiserte turen; finnes den ikke, gis prøveturen (slik at ukjent adresse fortsatt gir «Fant ikke turen.»). `saveDemo` lagrer en publisert tur under sin egen nøkkel, og prøveturen som før. `resetDemo` på en publisert tur gjenoppretter originalbildet. `listPublished(storage)` gir oversikten, og ødelagt lagring gir tom liste uten krasj. Prøveturens lagring og oppførsel er uendret. (6) Utkast: Publiser er aktiv bare når `canPublish` er sann (ellers deaktivert med «N ting må rettes før publisering»). Trykk ber om bekreftelse. Ved suksess lagres turen, utkastet tømmes, og arrangøren sendes til `/del/<slug>`. Kan turen ikke lagres, beholdes utkastet og en melding vises. (7) Delingssiden `/del/:slug` (bare arrangør, bare demo) viser turkoden stort, en lenke `<origin>/t/<slug>?kode=<kode>` med en «Kopier lenke»-knapp, en QR-kode for lenken med alternativ tekst, og knappen «Åpne turen». Teksten sier at i demo spilles turen med fiktive deltakere i denne nettleseren, og at deltakere på egne telefoner kommer først med innlogging og Supabase. En ukjent adresse gir «Fant ikke turen.». (8) Mine turer viser prøveturen og de publiserte turene (navn og periode), hver med «Åpne» og, for publiserte, «Del». (9) Velkomstsiden (`/t/<slug>` uten rolle) fungerer også for en publisert tur (velg fiktiv deltaker eller arrangør). Har adressen `?kode=`, vises koden i demo som «Turkode fra lenken: …», og i live forhåndsutfylles feltet for invitasjonskode. (10) Trykkflater minst 48 px, og mikroteksten er norsk uten tekniske ord. (11) Live-publisering (`trips.status` med `validateTrip()` og RLS) er ikke med, siden Supabase og Story 2.1 ikke finnes ennå.

**Never:** Ikke bli-med-med-navn-og-kode (Story 3.1). Ikke endre `validateTrip`, poengreglene eller migrasjonene. Ikke endre prøveturens data eller seed. Ikke send data til eksterne tjenester (heller ikke for QR). Ingen avpublisering eller sletting av publiserte turer her.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig utkast | `validateTrip` ok | Publiser aktiv; etter bekreftelse: publisert tur, delingsside | N/A |
| Ugyldig utkast | N feil | Publiser deaktivert, `publishTrip` gir `ok: false` | Meldingen med antall |
| Avbrutt bekreftelse | Arrangøren sier nei | Ingenting skjer, utkastet beholdes | N/A |
| Uten poster eller lag | Gyldig utkast uten `checkpoints` og `teams` | Kan publiseres; deltakere uten lag | N/A |
| Turkode og adresse | Kollisjon med eksisterende | Ny kode eller adresse velges, alltid unik | N/A |
| Navn med æøå og tegn | «Blåtur på Øya!» | Slug bare a–z, 0–9 og bindestrek | N/A |
| Deltakerantall | 0, 12 eller 500 | 1, 12 og høyst 30 deltakere, jevnt fordelt | N/A |
| Spill turen | Åpne `/t/<slug>` | Velkomst, velg deltaker, programmet og postene vises | N/A |
| Endringer i publisert tur | Innsending og redigering i Admin | Lagres under turens egen nøkkel; prøveturen urørt | N/A |
| Tilbakestill demo | På publisert tur | Turen går tilbake til slik den ble publisert | N/A |
| Ukjent adresse | `/t/finnes-ikke` eller `/del/finnes-ikke` | «Fant ikke turen.» | N/A |
| Ødelagt lagring | Ugyldig JSON i oversikt eller tur | Tom liste eller «Fant ikke turen.», ingen krasj | N/A |
| Lagring full | `setItem` feiler ved publisering | Utkastet beholdes, melding vises | Melding |
| Lenke med kode | `?kode=ABC234` | Koden vises på velkomstsiden | N/A |
| Ugyldig input | `null`, manglende utkast | `ok: false`, ingen krasj | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/demoStore.js` -- ren, bare prøveturen i dag (`DEMO_DATA_KEY`, `loadDemo`, `saveDemo`, `resetDemo`, `looksValid`). Utvides for publiserte turer uten å endre prøveturens oppførsel. `tests/demoStore.test.js` har tester.
- `src/lib/api.js` -- re-eksporterer demoStore (AD-4).
- `src/context/TripContext.jsx` -- `loadDemo(storage, initialDemoData, userStorage)` ved oppstart (linje ~31), `readDemoAgain` (4.3), `notFound` (linje ~163), `resetDemo` (~374). Send `slug` videre til demo-lagringen.
- `src/pages/Utkast.jsx` -- Publiser er deaktivert (2.5). Koble til publisering med bekreftelse.
- `src/pages/MineTurer.jsx` -- viser bare prøveturen. `src/pages/Welcome.jsx` -- demovalg av deltaker eller arrangør finnes. Legg koden fra `?kode=`.
- `src/pages/Del.jsx` -- NY. `src/App.jsx` -- ruten `/del/:slug` bak `DemoOnly`.
- `src/lib/publish.js` -- NY, ren. `src/lib/draftStore.js` -- `clearDraft`, `loadDraft`.
- `package.json` -- ny avhengighet `qrcode`.
- `tests/publish.test.js` -- NY. `tests/demoStore.test.js`, `tests/purity.test.js` -- utvides.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/publish.js`, `tests/publish.test.js`, `tests/purity.test.js` -- `canPublish`, `publishTrip` og tester (beslutning 2 til 4)
- [x] `src/lib/demoStore.js`, `tests/demoStore.test.js`, `src/lib/api.js` -- publiserte turer i demo-lagringen (beslutning 5)
- [x] `src/context/TripContext.jsx` -- send `slug` til lasting, lagring, ny lesing og nullstilling (beslutning 5)
- [x] `package.json`, `src/pages/Del.jsx`, `src/App.jsx`, `src/styles.css` -- pakken `qrcode`, delingssiden og ruten (beslutning 7)
- [x] `src/pages/Utkast.jsx` -- Publiser med bekreftelse (beslutning 6)
- [x] `src/pages/MineTurer.jsx`, `src/pages/Welcome.jsx` -- publiserte turer og koden fra lenken (beslutning 8 og 9)

**Acceptance Criteria:**
- Gitt et gyldig utkast, når jeg trykker «Publiser» og bekrefter, så får turen `status = published` og en unik `join_code`, og jeg ser turkoden, en lenke som forhåndsutfyller koden og en QR-kode.
- Gitt et utkast med valideringsfeil, når jeg prøver å publisere, så er det ikke mulig.
- Gitt en publisert tur i demo, når jeg åpner lenken, så kan jeg velge en fiktiv deltaker og spille turen, uten at prøveturen endres.
- Gitt live-modus, så er publisering ikke bygget ennå (venter på Supabase og Story 2.1).

## Implementation Notes

- `publishTrip` returnerer `error` som kode (`INVALID_INPUT`, `VALIDATION_FAILED`, `NOT_UNIQUE`). `api.publishDraft` legger til `STORAGE_FAILED`. Turen og deltakerne får nye UUID-er laget fra `random`, fordi mock-utkast fra samme forespørsel har lik tur-id.
- Hver publiserte nøkkel inneholder `{ original, data }`. `saveDemo` oppdaterer også navn og periode i oversikten, og gjenoppliver ikke en tur som mangler.
- Bekreftelsesteksten i «Tilbakestill demo» er endret, fordi den gamle («alle endringer i denne nettleseren slettes») ikke lenger stemte.
- Manuell sjekk i headless Chrome (390 px) etter beslutningene: alle punktene under «Manual checks» besto, QR-koden ble dekodet til lenken, og konsollen var uten feil. Skjermbildene avdekket at turkoden ikke ble vist stor (`.surface>p` overstyrte), og det er rettet. Galleriet ble ikke sjekket.

## Spec Change Log

- 2026-11-26 (bestilt av Kevin etter bygging): en publisert tur skal ikke beholde prøveturens tekster. Mock-agenten lager navn, beskrivelse og velkomstbeskjed fra forespørselen, og Utkast har fanen «Turen» (først og valgt ved åpning) der de kan redigeres. `draftEdit.js` har `updateTripText`. Destinasjonen er fortsatt prøveturens.

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss sjekk i headless Chrome (390 px). Patchet:
- medium: Admin hadde den gamle nullstillingsteksten, som var feil for en publisert tur — patchet (`resetTexts` brukes i Admin og demo-banneret).
- medium: en gammel fane kunne publisere samme utkast to ganger eller lagre det på nytt — patchet (`isCurrentDraft` før lagring og publisering).
- medium: ugyldig område i feltene stoppet ikke publisering med det forrige området — patchet (Publiser deaktiveres).
- medium: «Tilbakestill demo» og «Bytt rolle» på en publisert tur gikk til prøveturens startside — patchet (blir på turen).
- medium: publiseringsflyten med `STORAGE_FAILED` var utestet — patchet (`publishToDemo` i `publish.js` med tester).
- low: mislykket nullstilling svarte som om den gikk — patchet (viser det som er lagret); testen for full lagring endrer nå turen først.
- low: feil turkode i lenken ble vist uten forbehold — patchet (melding når den ikke stemmer).
- low: feilmeldingen ved lagring ga råd som ikke hjalp, bekreftelsen sa ikke at lenken bare virker i denne nettleseren, og delingssiden viste ikke antall deltakere (høyst 30) — patchet.
- tester: innholdet i utkastet følger med, og nullstilling uten brukbart originalbilde — lagt til.
Avvist som false: «ny lesing av en ødelagt tur bytter til prøveturen» (gir «Fant ikke turen.», slik matrisen krever).
Avvist som low uten patch: nullstilling uten originalbilde gir ingen melding, alle lagringsfeil for en publisert tur meldes som full lagring (begge krever endret localStorage).
Utsatt (deferred-work.md): ødelagt oversikt overskrives og delvis ødelagte turer oppdages ikke, ingen komponenttester (inkludert `slug` i TripContext), live-publisering og sletting, og navn og beskrivelse fra mock-agenten kan ikke redigeres.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: lag og publiser et utkast (bekreft), se kode, lenke og QR på delingssiden, åpne lenken, velg en fiktiv deltaker, se program og poster med riktig tema, gjør en innsending, og sjekk at prøveturen er uendret. Sjekk «Tilbakestill demo», Mine turer, ukjent adresse og at Publiser er deaktivert ved feil. Sjekk 390 px.
