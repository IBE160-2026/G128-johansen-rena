---
title: 'Story 2.6: Turen får tema'
type: 'feature'
created: '2026-11-26'
status: 'done'
baseline_commit: 'd9f0aa4135cb2d090db4d64c99eaf0af93be6f12'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `trip.theme` finnes i data (`{ accent, icon }`), men `validateTrip` godtar hvilken som helst tekst, det finnes ingen fast liste med aksentfarger sjekket for kontrast eller symboler, deltakersiden ser aldri temaet, og arrangøren kan ikke velge eller forhåndsvise det i Utkast.

**Approach:** Faste lister `THEME_ACCENTS` og `THEME_ICONS` i `validate.js` (AD-14), med hver aksents fargeverdier og en kontrollert kontrast i en ren `theme.js`. `validateTrip` godtar bare verdier fra listene. Deltakersiden setter temaet som CSS-variabler på toppelementet, og ugyldig eller manglende tema gir standardtemaet. Utkast får en fane Tema der arrangøren velger aksent og ikon og ser en forhåndsvisning av toppen på deltakersiden. DESIGN.md får de samme listene.

## Boundaries & Constraints

**Always:** Beslutninger (2026-11-26): (1) `validate.js` eksporterer `THEME_ACCENTS` (aksentnavn) og `THEME_ICONS` (symbolnavn) som faste lister, og `validateTrip` krever at `trip.theme`, når det finnes, har en `accent` i `THEME_ACCENTS` og et `icon` i `THEME_ICONS` (feilbane `trip.theme.accent` eller `trip.theme.icon` med forklaring). Et manglende tema er fortsatt lov. Seed-turens tema (`kobber`, `kompass`) står i listene. (2) Listene har minst seks aksenter (blant dem `kobber`, `fjord` og tre til) og minst seks symboler (blant dem `kompass`). Navnene er norske og brukes som verdier i data. (3) Ren `src/lib/theme.js` (importerer bare `validate.js`): `ACCENT_COLORS` gir for hver aksent `{ primary, pressed, label, on }` (hex-verdier), `ICON_SYMBOLS` gir for hvert symbol et tegn og en norsk etikett, `contrastRatio(a, b)` regner WCAG-kontrast, `resolveTheme(theme)` gir et gyldig tema (ugyldig, manglende eller halvt tema gir standardtemaet `{ accent: 'kobber', icon: 'kompass' }`, og et gyldig halvt tema fylles ikke ut), og `themeVars(theme)` gir et objekt med CSS-variabler for temaet. (4) Hver aksents `primary` har minst 4.5:1 kontrast mot både hvit (`#ffffff`) og krem (`#fbf8f2`), og `on` (tekst oppå `primary`) har minst 4.5:1 mot `primary`. Dette kontrolleres i en test over alle aksenter. (5) Nøklene i `ACCENT_COLORS` og `ICON_SYMBOLS` er nøyaktig listene i `validate.js` (testes). (6) Deltakersiden: `Shell` setter `themeVars(data.trip.theme)` som stil på toppelementet (`.app-shell`), og viser temaets symbol i toppen. Siden stilene har alias som er avledet av `--primary` (for eksempel `--copper`), må `themeVars` sette variablene og de avledede aliasene på samme element, ellers følger de ikke temaet. Temaet påvirker bare toppen og aksentene (primærfarge, aktiv fane, knapper med primærfarge), aldri status-, lag- eller poengfarger. (7) Utkast får fanen Tema med en liste over aksenter (hver med fargeprøve og navn, valgt aksent merket med tekst og ikke bare farge) og symboler (hver med tegn og navn), og en forhåndsvisning av toppen på deltakersiden som viser turnavn, destinasjon, symbol og aksentfarge, og oppdateres med en gang. Valget lagres automatisk i utkastet som de andre endringene (2.5), og `draftEdit.js` får `updateTheme(draft, theme)` som bare godtar verdier fra listene. (8) `DESIGN.md` får en seksjon med `ThemeAccent` og `ThemeIcon`: de samme navnene som listene i `validate.js`, med hex og målt kontrast for aksentene. (9) Trykkflater minst 48 px, og valgt tilstand har tekst («Valgt») i tillegg til ramme.

**Never:** Ikke la temaet endre status-, lag- eller poengfarger eller hele sidens bakgrunn. Ikke tillat fritt valgte farger eller CSS. Ikke endre live-kall (`loadTrip` henter ikke `theme` før Story 2.1/7.4). Ikke publisering (2.7). Ikke endre poengreglene eller migrasjonene.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig tema | `{ accent: 'fjord', icon: 'kompass' }` | `validateTrip` godtar, deltakersiden bruker fjord | N/A |
| Ukjent aksent | `accent: 'neon'` | `validateTrip` avviser med feil ved `trip.theme.accent` | Feil |
| Ukjent symbol | `icon: 'drage'` | Avvises med feil ved `trip.theme.icon` | Feil |
| Manglende tema | `theme` mangler | `validateTrip` godtar, deltakersiden bruker standardtemaet | N/A |
| Ugyldig tema visning | `theme: 'x'`, `{}` eller `{ accent: 'fjord' }` | `resolveTheme` gir standardtemaet, ingen krasj | N/A |
| Kontrast | Alle aksenter | `primary` har minst 4.5:1 mot hvit og krem, `on` mot `primary` | Test feiler hvis ikke |
| Listene stemmer | `ACCENT_COLORS` og `ICON_SYMBOLS` mot `validate.js` | Samme nøkler | Test feiler hvis ikke |
| Tema i toppen | Tur med tema | `.app-shell` har variablene og symbolet vises | N/A |
| Aliaser | `--copper` m.fl. | Følger aksenten (settes på samme element) | N/A |
| Velge i Utkast | Aksent og ikon velges | Lagres i utkastet, forhåndsvisningen oppdateres | N/A |
| Ugyldig valg | `updateTheme` med ukjent verdi | Utkastet er uendret | N/A |
| Ugyldig tema i utkast | Lagret utkast med `theme: 'x'` | Utkast åpnes, feil vises, Tema-fanen lar arrangøren velge nytt | Feil ved temaet |
| Ugyldig input | `null`, tall | `resolveTheme` og `themeVars` krasjer ikke | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/validate.js` -- `validateTrip` (linje ~97 sjekker bare at `accent` og `icon` er tekst). Legg listene og regelen. Ikke endre andre regler.
- `src/lib/theme.js` -- NY, ren.
- `src/styles.css` -- `:root`-tokens (`--primary`, `--primary-pressed`, `--on-primary`) og aliaser avledet av dem (`--copper` m.fl. i linje ~16 til 17). Aksent på topp, aktiv fane og primærknapper. Legg fanestiler for Tema og forhåndsvisning.
- `src/components/Shell.jsx` -- `.app-shell` og `.topbar` (viser destinasjon og turnavn). Sett `themeVars` og symbol.
- `src/pages/Utkast.jsx` -- fanene fra 2.5 (`tabs`, `panels`, `apply`, `edit`, `draftErrors`). Legg fanen Tema med forhåndsvisning.
- `src/lib/draftEdit.js` -- `updateElement`, `updateArea`, `draftErrors` (2.5). Legg `updateTheme`.
- `src/seed/demo-trip.json`, `src/lib/mockAgent.js` -- seed har `theme: { accent: 'kobber', icon: 'kompass' }`, og mock-agenten kopierer det. Ikke endre.
- `planning-artifacts/ux-designs/ux-G128-johansen-rena-2026-10-28/DESIGN.md` -- legg seksjonen om tema.
- `tests/theme.test.js` -- NY. `tests/validate.test.js`, `tests/draftEdit.test.js`, `tests/purity.test.js` -- utvides.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/validate.js`, `tests/validate.test.js` -- `THEME_ACCENTS`, `THEME_ICONS` og regelen i `validateTrip` (beslutning 1 og 2)
- [x] `src/lib/theme.js`, `tests/theme.test.js`, `tests/purity.test.js` -- paletter, kontrast, `resolveTheme`, `themeVars` og tester (beslutning 3 til 5)
- [x] `src/lib/draftEdit.js`, `tests/draftEdit.test.js` -- `updateTheme` (beslutning 7)
- [x] `src/components/Shell.jsx`, `src/styles.css` -- tema på toppelementet og symbol i toppen (beslutning 6)
- [x] `src/pages/Utkast.jsx`, `src/styles.css` -- fanen Tema med valg og forhåndsvisning (beslutning 7 og 9)
- [x] `DESIGN.md` -- seksjon med listene og målt kontrast (beslutning 8)

**Acceptance Criteria:**
- Gitt DESIGN.md, når storyen er ferdig, så inneholder den de faste listene `ThemeAccent` (aksentfarger sjekket for 4.5:1 kontrast) og `ThemeIcon`, de samme som listene i `validate.js`.
- Gitt Utkast, når jeg velger en annen aksent eller et annet ikon, så vises en forhåndsvisning av toppen på deltakersiden.
- Gitt en tur med ugyldig eller manglende tema, når deltakersiden vises, så brukes standardtemaet.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Tre reviewere (Blind Hunter, Edge Case Hunter, Verification Gap), pluss manuell sjekk i headless Chrome (390 px). Patchet:
- high: `themeValid` sammenlignet `JSON.stringify` og kalte et gyldig tema ugyldig når nøklene sto i annen rekkefølge — patchet (sjekker mot listene).
- medium: et halvt tema mistet sin gyldige aksent når arrangøren valgte bare symbol — patchet (den gyldige delen beholdes).
- medium: ingen aksent eller symbol var merket «Valgt» når utkastet manglet tema, så arrangøren så ikke hva som var aktivt — patchet (standardtemaet merkes, med en forklarende tekst).
- medium: forhåndsvisningen viste destinasjonen selv om den er skjult for deltakerne, og tomt turnavn ga tom tittel — patchet (samme regel som toppen).
- low: symbolet i toppen ble lest opp på hver side — patchet (`aria-hidden`).
- low: «hero»-flatens eyebrow ble tegnet i aksenten på mørk bakgrunn og ga lav kontrast med mørke aksenter — patchet (fast lys farge).
- tester: kontrast for trykket variant, to ugyldige temaverdier og alle CSS-variabler — lagt til.
Avvist som false: «gamle utkast med fritekst-tema migreres ikke» (de åpnes med feil og kan rettes i Tema-fanen, og seed og mock-agent bruker gyldige verdier), «aktiv fane følger ikke temaet» (spesifikasjonen begrenser temaet til toppen og primærfargede flater).
Avvist som low uten patch: `--accent` er en ubrukt alias, `contrastRatio` med ugyldig hex, valideringsmeldingen viser interne nøkler, `updateTheme` gir ikke signal ved avvisning, emoji-visning varierer mellom plattformer.
Utsatt (deferred-work.md): ingen komponenttester av Shell og Tema-fanen.

## Verification

**Commands:**
- `npm test` -- expected: alle tester grønne
- `npm run build` -- expected: bygger uten feil

**Manual checks (if no CLI):**
- Headless Chrome i demo: åpne deltakersiden og se standard (kobber) og symbolet i toppen. Generer et utkast, åpne Tema, velg en annen aksent og et annet symbol og se forhåndsvisningen endre seg og at valget er lagret etter reload. Sett et ugyldig tema i lagring og se at Utkast åpnes med feil og at deltakersiden bruker standardtemaet. Sjekk at statusfarger og lagfarger er uendret. Sjekk 390 px.
