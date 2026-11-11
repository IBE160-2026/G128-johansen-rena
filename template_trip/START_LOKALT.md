# Blåtur – start appen lokalt

Dette er det **komplette Blatur-ren-v1-prosjektet** med endringene fra
`Blatur-bildeinnsending-oppdatering.zip` lagt inn over originalfilene.

## Start demomodus først

1. Pakk ut ZIP-en og åpne Terminal i mappen `blatur-ren` (mappen som inneholder `package.json`).
2. Kjør:

   ```bash
   npm install
   npm run dev
   ```

3. Åpne URL-en Vite viser, vanligvis `http://localhost:5173`.
4. Siden `.env.local` ikke følger med, starter prosjektet i **demomodus**. Du kan teste admin/rebus/bildeinnsending uten Supabase.

## Viktig om eksisterende Supabase

Vi har allerede opprettet Blåtur 2027 (Budapest, 24.–27. april 2027) i
Supabase-prosjektet CharterFeber AI. **Ikke kjør migrasjonene i denne pakken
på nytt**. De er utgangspunktet for den opprinnelige appen, mens den
opprettede Supabase-databasen er basert på en senere tilpasning.

Appens `src/lib/api.js` forventer blant annet `trips.name` og en privat
`trip_access`-struktur. Den eksisterende databasen ble opprettet med
`trips.title`, `trips.status`, `private.trip_secrets` og
`private.trip_join_codes`. Disse må samordnes før `VITE_SUPABASE_URL` og
`VITE_SUPABASE_PUBLISHABLE_KEY` legges inn. Ellers vil appen ikke fungere
mot live-data selv om klienten får kontakt.

## Tester

   ```bash
   npm test
   npm run build
   ```

Ingen `.env.local`, hemmelige nøkler, `node_modules` eller `dist` er inkludert.
