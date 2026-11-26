---
title: 'Story 5.4: Deltakerne ser endringer med en gang'
type: 'feature'
created: '2026-11-26'
status: 'done'
baseline_commit: '0f69f734b272d8ab97f25144c10806a7ecc0a8fe'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Når arrangøren endrer en programpost eller post, henter deltakerens app turen på nytt (signalet fra 4.3 og Realtime), men deltakeren får ikke vite hva som er endret. Det finnes ingen «Endret»-merker, ingen banner, og ingen sett-status per element, så en deltaker kan gå til den gamle restauranten uten å merke at den er byttet.

**Approach:** En ren `changes.js` regner ut hvilke programposter og poster som er «Endret» for en deltaker (AD-16): `updated_at` er nyere enn både `baseline_at` (første innlasting på enheten) og elementets `seen`-tid. Sett-status ligger lokalt per enhet, tur og bruker. Programkort og poster får merket «Endret», og et banner «Programmet er oppdatert.» åpner I dag med endringene uthevet og har «Merk alle som sett».

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-26): (1) Ren `src/lib/changes.js` med injisert lagring (som `tripCache.js`): `loadSeen(storage, tripId, userId, now)` gir `{ baseline_at, seen }` og oppretter `baseline_at` (nåtid) første gang, `isChanged(item, state)`, `changedItems(items, state)`, `markSeen(state, item)`, `markAllSeen(state, items)` og `saveSeen(storage, tripId, userId, state)`. Nøkkelen er `tripbuilder-seen-v1:{tripId}:{userId}`. (2) Regel (AD-16): et element er «Endret» når `updated_at` er en gyldig tid og er nyere enn både `baseline_at` og `seen[id]` (som er `updated_at` elementet hadde da det sist ble sett). Element uten gyldig `updated_at` er aldri «Endret». (3) Å åpne et element markerer bare det elementet som sett: for en programpost er det å trykke på kortet, og for en post er det å velge den på kartet eller åpne den fra listen. «Merk alle som sett» markerer elementene som er endret i det øyeblikket, og endringer som kommer etterpå, forblir uleste. (4) Bare deltakere får merker og banner. Arrangøren får aldri «Endret» (hen har laget endringene). (5) En deltaker som blir med etter at turen er endret, får ingen merker, siden `baseline_at` settes ved første innlasting og eldre `updated_at` ikke er nyere. (6) `TripContext` eier tilstanden (slik at banner, kort og poster deler den) og eksponerer `changes: { isChanged(item), markSeen(item), markAllSeen(), count, items }`. Tilstanden lagres ved hver endring. (7) Merket «Endret» vises som tekst («Endret», aldri bare farge) på programkort (I dag og Program), på poster i postlisten, på postkortene på Kart-siden og på kartkortet. (8) Banneret «Programmet er oppdatert.» (med `role="status"`) vises øverst på deltakersidene når minst ett element er endret. Det har «Se endringer» (åpner I dag med `?endret=1`, der en seksjon «Endret siden sist» lister de endrede elementene uthevet) og «Merk alle som sett». (9) Signalet er allerede på plass: Realtime i live (`program_items`, `checkpoints`, `trips`) og `BroadcastChannel` i demo (4.3). Det bygges ikke på nytt. (10) Klokka: `baseline_at` bruker enhetens klokke, og `updated_at` kommer fra databasen i live og fra klienten i demo. Skjev klokke på enheten kan gi merker for tidlig eller for sent, og er akseptert (AD-16).

**Never:** Ikke nytt Realtime-abonnement, ikke ny polling, ikke endringer i `validate.js`, `scoring.js` eller migrasjonene. Ikke lagre sett-status på serveren. Ikke merk innsendinger, lag eller bilder som «Endret».

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ny endring | `updated_at` nyere enn `baseline_at` og ikke sett | Elementet er «Endret», banneret vises | N/A |
| Åpne ett element | Middag og post 4 er endret, deltakeren åpner middagen | Middagen mister merket, post 4 beholder det | N/A |
| Merk alle som sett | Flere endret | Alle forsvinner, banneret skjules | N/A |
| Ny endring etterpå | Etter «Merk alle som sett» lagrer arrangøren igjen | Bare det nye elementet får merket, banneret kommer tilbake | N/A |
| Blir med etter endring | Første innlasting, `updated_at` eldre enn nåtid | Ingen merker | N/A |
| Uten `updated_at` | Seed-element eller ugyldig verdi | Aldri «Endret» | N/A |
| Arrangør | `isOrganizer` | Ingen merker og ingen banner | N/A |
| Samme `updated_at` som sett | Element sett på nytt etter reload | Ikke «Endret» | N/A |
| Ødelagt lagring | Ugyldig JSON eller manglende felt | Starter på nytt med `baseline_at` nå, ingen krasj | N/A |
| Lagring utilgjengelig | `storage` kaster | Tilstanden holdes i minnet, ingen krasj | N/A |
| Ugyldig input | `null`, ikke-liste, element uten id | Ingen krasj, ingen merker | N/A |
| Demo, to faner | Arrangør lagrer i fane A | Deltakerfane B viser «Endret» og banner uten reload (via 4.3) | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/tripCache.js` -- mønster for ren modul med injisert lagring (`keyFor`, `try/catch`). Ikke endre.
- `src/lib/changes.js` -- NY, ren.
- `src/context/TripContext.jsx` -- eier `data`, `own`, `isOrganizer`, `userId`. Legg `changes` (state + lagring) og eksponer den i `value`. Etter 4.3 leses data på nytt ved signal, så `changes` regnes ut fra `data`.
- `src/components/Shell.jsx` -- rammen rundt sidene (`<main>{children}</main>`). Banneret legges øverst for deltakere.
- `src/pages/Home.jsx` -- «I dag»-kortene (`program-card`) og seksjonen «Endret siden sist» når `?endret=1`. `PostList` vises her også.
- `src/pages/Program.jsx` -- `timeline-item` per programpost (tapp = åpne).
- `src/components/PostList.jsx`, `src/pages/Rebus.jsx`, `src/components/PostMap.jsx` -- poster (liste, kort, kartkort). `Rebus.jsx` har `activeId` fra `?post=` (valgt post = åpnet).
- `src/styles.css` -- legg `.changed-chip`, banner og utheving.
- `tests/changes.test.js` -- NY. `tests/purity.test.js` -- legg til `changes.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/changes.js` -- ren sett-status og «Endret»-regel (beslutning 1 og 2)
- [x] `tests/changes.test.js`, `tests/purity.test.js` -- matriseradene som kan testes rent, og ren-liste
- [x] `src/context/TripContext.jsx` -- `changes` med lagring, bare for deltakere (beslutning 3 til 6)
- [x] `src/components/Shell.jsx`, `src/pages/Home.jsx` -- banner, «Endret siden sist» og merker på I dag (beslutning 7 og 8)
- [x] `src/pages/Program.jsx`, `src/components/PostList.jsx`, `src/pages/Rebus.jsx`, `src/components/PostMap.jsx`, `src/styles.css` -- merker og åpning markerer som sett (beslutning 3 og 7)

**Acceptance Criteria:**
- Gitt demo-modus og to faner, når arrangøren lagrer en endring, så oppdateres deltakerfanen uten reload, og elementet har merket «Endret» og banneret «Programmet er oppdatert.» vises.
- Gitt at middagen og post 4 er endret, når deltakeren bare åpner middagen, så har post 4 fortsatt merket «Endret».
- Gitt at deltakeren trykker «Merk alle som sett», når en ny endring kommer etterpå, så får det nye elementet merket, og banneret vises igjen.
- Gitt en deltaker som blir med etter at turen er endret, når turen lastes første gang, så vises ingen «Endret»-merker.
- Gitt banneret, når deltakeren trykker «Se endringer», så åpnes I dag med de endrede elementene uthevet.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss manuell sjekk med to faner i headless Chrome. Patchet:
- high: banneret og «Endret siden sist» lekket poster og oppgavetekst mens destinasjonen ikke var avslørt — patchet (poster regnes bare med når `destination_revealed`, og posttekst vises ikke i endringslisten).
- medium: to faner med samme bruker kunne overskrive hverandres sett-status — patchet (`mergeSeen` og `readSeen` slår sammen ved lagring), tester lagt til.
- low: klikkbare kort uten `role="button"` — patchet.
- low: chipen hadde for lav kontrast (hvit på `#b8732a`) — patchet (bruker `--primary`).
Avvist som false: «kind må inn i nøkkelen» (id-ene er UUID-er, ingen kollisjon mellom programposter og poster), «klokkeskjevhet» (akseptert i AD-16 og spec beslutning 10), «første innlasting fra mellomlager» (mellomlageret krever en tidligere innlasting som allerede har laget `baseline_at`).
Avvist som low uten patch: rensing av gamle `seen`-oppføringer, slettede elementer vises ikke, «ny» og «endret» har samme merke, `?endret=1` blir stående, `changes` er ikke memoisert, enkelte kort uten egen sett-handling.
Utsatt (deferred-work.md): ingen komponenttester av merker, banner og åpning markerer som sett.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo med to faner: deltakerfane B åpen, arrangør endrer en programpost og en post i fane A, B viser merker og banner uten reload. Åpne ett element, sjekk at bare det mister merket. Trykk «Merk alle som sett», lagre en ny endring og se at banneret kommer tilbake. Sjekk at en ny deltakerfane ikke får merker. Live-delen (Realtime og skjev klokke) kan ikke kjøres før Supabase finnes (Story 7.4).
