---
title: 'Story 2.2: Arrangøren beskriver en ny tur'
type: 'feature'
created: '2026-11-26'
status: 'done'
baseline_commit: '58feb4e5381871b7be9c4d07c7038ca1f688b56a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mine turer viser bare prøveturen og har ingen «Ny tur». Det finnes ingen flate der arrangøren kan oppgi det viktigste om en tur (destinasjon, datoer, antall) og beskrive resten med egne ord, og ingen `TripRequest` som generering (Story 2.3 og 2.4) kan bygge på.

**Approach:** En ren `tripRequest.js` (og `validateTripRequest` i `validate.js`, AD-15) validerer skjemaet felt for felt, gir hint ved for kort tekst, bygger en `TripRequest` og husker skjemaet lokalt. Mine turer får «Ny tur» og teksten «Ingen turer ennå.» når listen er tom. Ny tur-siden viser nøkkelfeltene og promptfeltet med inline-feil og hint, og «Lag utkast» sender bare inn gyldige felt.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-26): (1) Ny rute `/ny-tur` (bare arrangør, bare i demo-modus inntil Story 2.1) med siden `NyTur.jsx`. Mine turer får knappen «Ny tur» som åpner den, også når det finnes turer. Er listen over turer tom, står teksten «Ingen turer ennå.» sammen med knappen. (2) Felt: Destinasjon*, Fra*, Til*, Deltakere*, Lag (valgfritt), Antall poster (valgfritt) og et promptfelt (Beskrivelse*). Etiketter og feilmeldinger er på norsk uten tekniske ord. (3) Regler (inline-feil ved feltet): Destinasjon, Fra, Til og Deltakere kan ikke stå tomme. Fra og Til er gyldige datoer (ÅÅÅÅ-MM-DD), og Til kan ikke være før Fra. Deltakere er et helt tall fra 1. Lag, hvis oppgitt, er et helt tall fra 1 til 6 og ikke flere enn deltakere. Antall poster, hvis oppgitt, er et helt tall fra 1. (4) Beskrivelsen må ha minst 30 tegn (etter at mellomrom i begynnelsen og slutten er fjernet) og høyst 4000. Er den kortere, viser «Lag utkast» et hint ved feltet om hva som mangler: «Beskriv gjerne sted, datoer, antall, program og rebus.» Hintet er ikke en feil som farger feltet rødt. (5) «Lag utkast» sender ikke inn mens et felt har feil eller beskrivelsen er for kort; første felt med feil får fokus. (6) Skjemaet (felt og tekst) lagres lokalt mens arrangøren skriver (nøkkel `tripbuilder-newtrip-v1`), og gjenopprettes når siden åpnes igjen. Ødelagt eller utilgjengelig lagring gir tomt skjema uten krasj. (7) Gyldige felt og tekst bygges til `TripRequest` `{ destination, start_date, end_date, participant_count, team_count?, post_count?, description }` (tall som tall, valgfrie felt utelatt når de er tomme, tekster trimmet) og kontrolleres av `validateTripRequest(req)` i `validate.js` med de samme reglene. (8) Når kravet er gyldig, lagres det som ventende forespørsel (`tripbuilder-newtrip-request-v1`) og siden viser «Beskrivelsen er klar» med en oppsummering og knappen «Rediger beskrivelsen». Selve genereringen bygges i Story 2.3, og denne tilstanden byttes ut der. (9) Trykkflater minst 48 px, synlig fokus, `aria-invalid` og `aria-describedby` ved feil, og feilmeldingene leses av skjermleser.

**Never:** Ikke generer et utkast, kall mock-agent eller Edge Function (2.3 og 2.4). Ikke opprett en tur i databasen eller i demodata. Ikke innlogging (2.1). Ikke endre `validateTrip`, poengreglene eller migrasjonene.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tom liste | Ingen turer | «Ingen turer ennå.» og «Ny tur» | N/A |
| Tomme nøkkelfelt | Destinasjon, Fra, Til eller Deltakere tomme | Feil ved hvert felt, ingenting sendes | Feil ved feltet |
| Til før Fra | Til-dato før Fra-dato | Feil ved Til | Feil ved feltet |
| Ugyldig dato | `2026-13-40` eller tekst | Feil ved datofeltet | Feil ved feltet |
| Lag utenfor 1–6 | Lag 0 eller 7 | Feil ved Lag | Feil ved feltet |
| Flere lag enn deltakere | Lag 5, deltakere 3 | Feil ved Lag | Feil ved feltet |
| Poster under 1 | Antall poster 0 eller -2 | Feil ved Antall poster | Feil ved feltet |
| Ikke helt tall | Deltakere `2,5` eller `1e2` | Feil ved feltet | Feil ved feltet |
| Kort tekst | Under 30 tegn | Hint om hva som mangler, ingenting sendes | Hint ved feltet |
| Valgfrie felt tomme | Lag og Antall poster tomme | `TripRequest` uten `team_count` og `post_count` | N/A |
| Gyldig | Alle felt og tekst | `TripRequest` som validerer, «Beskrivelsen er klar» | N/A |
| Gjenoppretting | Lukker og åpner siden | Felt og tekst er tilbake | N/A |
| Ødelagt lagring | Ugyldig JSON | Tomt skjema, ingen krasj | N/A |
| Mellomrom | Tekst med bare mellomrom | Regnes som tom | Feil ved feltet |

</frozen-after-approval>

## Code Map

- `src/pages/MineTurer.jsx` -- viser bare prøveturen (`data.trip`). Legg «Ny tur» og tomtilstand.
- `src/App.jsx` -- ruter (`/`, `/mine-turer`, `/t/:slug/*`) med `DemoOnly`. Legg `/ny-tur`.
- `src/pages/NyTur.jsx` -- NY, skjemaet.
- `src/lib/validate.js` -- har `validateTrip`, `pointsFromInput` og `pointsError` (mønster for feil og heltallssjekk). Legg `validateTripRequest`. Ikke endre de andre.
- `src/lib/tripRequest.js` -- NY, ren: `emptyForm`, `validateForm`, `descriptionHint`, `buildTripRequest`, `loadForm`/`saveForm` med injisert lagring (som `tripCache.js`).
- `src/pages/Admin.jsx` -- mønster for inline-feil (`aria-invalid`, `field-error`) og mobilregler fra 5.1. Gjenbruk stilene.
- `src/styles.css` -- `.start`, `.start-panel`, `.field-error`, `.form-stack`. Legg skjemastil for Ny tur.
- `tests/tripRequest.test.js` -- NY. `tests/purity.test.js` -- legg til `tripRequest.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/validate.js`, `src/lib/tripRequest.js` -- `validateTripRequest`, skjemavalidering, hint, bygging og lokal lagring (beslutning 3, 4, 6, 7)
- [x] `tests/tripRequest.test.js`, `tests/purity.test.js` -- matriseradene som kan testes rent, og ren-liste
- [x] `src/pages/MineTurer.jsx`, `src/App.jsx` -- «Ny tur», tomtilstand og ruten `/ny-tur` (beslutning 1)
- [x] `src/pages/NyTur.jsx`, `src/styles.css` -- skjema, inline-feil, hint, gjenoppretting og «Beskrivelsen er klar» (beslutning 2, 5, 8, 9)

**Acceptance Criteria:**
- Gitt Mine turer uten turer, når siden vises, så står teksten «Ingen turer ennå.» og knappen «Ny tur».
- Gitt Ny tur, når jeg lar Destinasjon, Fra, Til eller Deltakere stå tomme, setter Til før Fra, oppgir lag utenfor 1–6 eller flere lag enn deltakere, eller oppgir antall poster under 1, så vises en inline-feil ved feltet, og «Lag utkast» sender ikke inn.
- Gitt Ny tur, når jeg skriver under ca. 30 tegn og trykker «Lag utkast», så vises et hint inline om hva som mangler.
- Gitt at jeg har fylt ut felt og skrevet tekst, når jeg lukker og åpner siden igjen, så er feltene og teksten gjenopprettet fra lokal lagring.
- Gitt gyldige felt og tekst, når jeg trykker «Lag utkast», så samles de til en `TripRequest` som validerer mot skjemaet.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss manuell sjekk i headless Chrome (390 px). Patchet:
- medium: feil og hint ble stående på et felt etter at verdien var rettet — patchet (feilen fjernes når feltet endres).
- medium: «Beskrivelsen er klar» var en blindvei, og det gamle skjemaet kom tilbake for en ny tur — patchet («Start på nytt», og teksten «Utkastet lages i neste steg.»).
- medium: ingen øvre grenser, og enorme tall slapp gjennom — patchet (heltall som er trygge, deltakere høyst 1000, poster høyst 100).
- medium: `Err` var definert i render og ble remontert for hvert tastetrykk — patchet (kalles som funksjon).
- medium: turlengdegrensen, lag lik deltakere og tekst i valgfrie felt var ikke testet — tester lagt til.
- low: lenken «Til Mine turer» hadde for liten trykkflate — patchet.
Avvist som false: «descriptionHint mangler» (hintet ligger i `validateForm().hint` og `DESCRIPTION_HINT`), «MineTurer skygger variabelen» (ufarlig).
Avvist som low uten patch: `aria-required`, teller for 4000 tegn, lagring feilet uten varsel, forhåndsutfylte skjemaer med for lange tekster, datoer i fortiden godtas.
Utsatt (deferred-work.md): ingen komponenttester av Ny tur og Mine turer.
Funnet utenfor 2.2: knappene «Bytt rolle» og «Tilbakestill demo» i demo-banneret er 20 px høye (eldre komponent fra 1.1).

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: velg arrangør, åpne Mine turer, trykk «Ny tur», send inn tomt skjema og se feil ved hvert felt, prøv Til før Fra, 7 lag og 0 poster, skriv kort tekst og se hintet, fyll ut gyldig og se «Beskrivelsen er klar», last siden på nytt og se at feltene er tilbake. Sjekk 390 px bredde.
