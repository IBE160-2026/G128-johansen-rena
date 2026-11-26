# Nettlesertester

Testene starter appen i demo-modus og styrer headless Chrome på en skjerm som er 390 px bred. De bruker bare Node og Vite, så det er ingen ekstra pakker å installere.

```sh
npm run test:e2e                      # alle
node --test e2e/mobilflyt.e2e.js      # én fil
```

Du trenger Node 22 eller nyere og Google Chrome (eller Chromium). Finner testen ikke Chrome, setter du `CHROME_PATH` til programfila. Testene er utviklet på macOS. Banene for Linux og Windows er ikke prøvd.

| Fil | Hva den sjekker |
|---|---|
| `mobilflyt.e2e.js` | Flyten i definisjonen av ferdig: Hjem, program, rebus, innsending, godkjenning, avvisning, ledertavle og galleri |
| `endringer.e2e.js` | Epic 4 og 5 med to faner, og at en treg innsending ikke overskriver andre endringer |
| `publisering.e2e.js` | Story 2.7: utkast, publisering, deling, spilling og tilbakestilling |
| `utseende.e2e.js` | Trykkflater på minst 48 px, ingen sidelengs rulling, tidslinjen og radene på ledertavlen |

## Slik virker de

- Appen startes alltid i demo-modus. `.env` leses ikke, så testene rører aldri Supabase.
- Kartfliser og skrifter blokkeres, så testene virker uten nett. Skriftene påvirker målene litt. Sett `E2E_EKSTERNT=1` for å hente dem.
- Hver fil får sin egen, tomme nettleserprofil.
- Stegene i en fil bygger på hverandre. Rett den første feilen først.
- `endringer.e2e.js` holder bildebehandlingen igjen til testen slipper den, så tidsvinduet styres av testen.

## Kjente forbehold

- **Blank side:** Chrome avbryter av og til hentingen av en av filene fra Vite, og da står siden blank. Verktøyet laster siden én gang til bare når dette skjer, og skriver `ADVARSEL`. Årsaken til avbruddet er ikke funnet.
- **Fane som slutter å svare:** Én gang har en fane sluttet å svare midt i `endringer.e2e.js`, slik at stegene etterpå feilet. Det lot seg ikke gjenskape med diagnostikk på, og årsaken er ukjent. Verktøyet gir da feilen «Chrome svarte ikke». Kjør testen på nytt, og meld fra hvis det gjentar seg.

## Skjermbilder

Skjermbilder havner i `e2e/artifacts/` (ikke i git). `utseende.e2e.js` tar bilde av hver side, og et steg som feiler, tar bilde av alle fanene (`feil-…`). **Se på bildene når du har endret utseendet.** Målene fanger ikke alt.

## Det testene ikke dekker

Kamera og filvelger (bildet legges rett i feltet), ekte GPS, ekte telefon, bredere skjermer, animasjoner og live-modus med Supabase.

## Når du skriver nye steg

- Vent på det som skal skje (`waitFor`, `waitForText`), ikke et fast antall sekunder.
- Bruk `tap`, som trykker på skjermen og feiler hvis noe ligger oppå elementet.
- En test som feiler av og til, kan være en ekte feil. Finn årsaken før du legger inn en pause. Ekkovernet i `TripContext` ble rettet fordi disse testene feilet i omtrent annenhver kjøring.
