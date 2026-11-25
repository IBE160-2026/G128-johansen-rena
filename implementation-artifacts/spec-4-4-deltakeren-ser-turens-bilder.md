---
title: 'Story 4.4: Deltakeren ser turens bilder'
type: 'feature'
created: '2026-11-25'
status: 'done'
baseline_commit: 'e067631eb5ef9097e77bef1e609a00c8669de9b2'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bilder-fanen finnes fra malen, men `loadTrip` signerer hver bilde-URL for seg med `createSignedUrl` i en løkke (ett kall per bilde, også for innsendingsbilder), uten kontroll av at stien hører til turen. Et bilde som ikke lar seg signere, gir en ødelagt `<img>` uten forklaring.

**Approach:** En ren `media.js` plukker ut stiene som hører til turen og legger signerte URL-er tilbake på bildene. `loadTrip` henter alle URL-ene samlet med `createSignedUrls` (AD-11). Galleriet viser en plassholder med tekst når et bilde mangler URL.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-25): (1) Rene funksjoner i `src/lib/media.js` uten avhengigheter: `pathsToSign(items, tripId)` gir unike `storage_path` som starter med `{tripId}/`, og `applySignedUrls(items, signed)` legger `url` på hvert element fra svarradene `{ path, signedUrl, error }`. Elementer uten gyldig sti eller med feil får `url: null`. Stier som ikke hører til turen, signeres ikke og gir `url: null` (AD-11, ytterligere et lag over RLS). (2) `loadTrip` gjør ett samlet kall `createSignedUrls(paths, 3600)` for alle bilder og innsendingsbilder, og ingen kall hvis listen er tom. Feiler kallet, får alle `url: null`, og turen lastes likevel. (3) Galleriet viser en plassholder («Bildet kan ikke vises nå») med ikon og tekst når `url` er `null`, og åpner ikke en stor visning for slike bilder. Alt-tekst nevner hvem som lastet opp. (4) Tilgang til bilder fra en annen tur avvises av RLS og Storage-reglene fra den første migrasjonen (`photos_read`, `trip_media_select`), og er ikke endret her. (5) Demo-modus er uendret: bildene ligger som data-URL i nettleseren, og `media.js` rører dem ikke (elementer uten `storage_path` beholder sin `url`).

**Never:** Ikke endre migrasjoner, opplasting, komprimering eller sletting. Ikke legg til caching av signerte URL-er (3600 s er nok). Ikke endre ledertavle, innsendinger eller lag.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Samlet signering | Tre bilder og to innsendinger med sti | Ett kall med fem unike stier, alle får `url` | N/A |
| Duplikat sti | To elementer med samme sti | Stien er med én gang, begge får `url` | N/A |
| Annen tur | Sti starter med en annen turs id | Signeres ikke, `url: null` | N/A |
| Ingen sti | Element uten `storage_path` (demo) | Beholder egen `url`, ikke med i kallet | N/A |
| Tom liste | Ingen bilder | Ingen kall til Storage | N/A |
| Rad med feil | Svarrad har `error` eller mangler `signedUrl` | Det elementet får `url: null`, de andre beholder sin | N/A |
| Hele kallet feiler | `createSignedUrls` kaster eller gir feil | Alle får `url: null`, turen lastes | Feilen svelges, galleriet viser plassholdere |
| Ugyldig input | `null`, ikke-liste eller `null`-element | Ingen krasj, tom liste | N/A |
| Bilde uten URL | `url: null` i galleriet | Plassholder med tekst, ingen stor visning | N/A |
| Demo | data-URL-bilder | Vises som før | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/api.js` -- `loadTrip` (linje 30-35): løkke med `createSignedUrl` per element. Erstattes av ett kall via `media.js`. Resten av filen urørt.
- `src/lib/media.js` -- NY, ren.
- `src/pages/Gallery.jsx` -- galleriet fra malen (`photo-card`, modal). Legg plassholder for `url: null` og alt-tekst med opplaster.
- `src/styles.css` -- `.photo-card`, `.gallery-grid`. Legg plassholder-stil.
- `supabase/migrations/202610280001_initial.sql` -- RLS og Storage-regler for `photos` og `trip-media` (les, ikke endre).
- `tests/media.test.js` -- NY. `tests/purity.test.js` -- legg til `media.js`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/media.js` -- `pathsToSign` og `applySignedUrls` -- beslutning 1
- [x] `tests/media.test.js`, `tests/purity.test.js` -- matriseradene som kan testes rent, og ren-liste
- [x] `src/lib/api.js` -- ett samlet `createSignedUrls`, feil svelges -- beslutning 2
- [x] `src/pages/Gallery.jsx`, `src/styles.css` -- plassholder og alt-tekst -- beslutning 3

**Acceptance Criteria:**
- Gitt Bilder-fanen, når jeg åpner den, så ser jeg turens bilder, og signerte URL-er hentes samlet med `createSignedUrls`.
- Gitt en deltaker eller arrangør på en annen tur, når hen prøver å hente eller signere et bilde fra denne turen, så avvises det (RLS, Storage og stisjekken i `pathsToSign`).
- Gitt demo-modus, når jeg åpner Bilder, så vises bildene som er lagret lokalt i nettleseren.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap). Patchet:
- medium: uploader og arrangør kan ikke slette et bilde som ikke lar seg vise — patchet (slettknapp i plassholderen).
- medium: utløpt eller feilende signert URL gir ødelagt `<img>` uten plassholder — patchet (`onError` bytter til plassholder).
- low: sti med `..` passerte prefikssjekken — patchet i `pathsToSign`, test lagt til.
- low: feil ved signering svelges uten spor — patchet (`console.warn`).
Avvist som false: «annet enn galleriet tåler ikke url null» (ReviewQueue, Admin og Rebus sjekker alle `entry.url`), «tripId er kanskje ikke stiprefikset» (`uploadPhoto` bruker `data.trip.id`, og RLS krever det samme).
Avvist som low uten patch: antall inkluderer bilder som ikke vises, ikke-streng `storage_path`, `role="img"` og dupliserte oppslag, oppdeling av store batcher.
Utsatt (deferred-work.md): ingen tester av `loadTrip`-signeringen og plassholderen, og signerte URL-er fornyes ikke før siden lastes på nytt.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: last opp et bilde og se det i galleriet, og sjekk plassholder ved bilde uten `url`. Live-delen (samlet signering, avvisning fra annen tur) kan ikke kjøres før Supabase finnes (Story 7.4).
