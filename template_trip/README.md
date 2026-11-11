# Blåtur – ren V1

En enklere og mer vedlikeholdbar utgave av Blåtur 2026, basert på den opprinnelige React-appen. Beholder *Hjem, Program, Rebus med bildebevis/lag/poeng, Bilder* og et lite *Admin*-område. Appen er foreløpig for **én tur**. Den er ikke TripBuilder AI-generatoren.

## Kom i gang (uten konto eller nøkler)

Krever Node.js-versjon støttet av Vite 8 (Node 20.19+ eller 22.12+).

```bash
npm install
npm run dev
```

Åpne adressen Vite viser. Velg en deltaker eller «Se som arrangør». Uten Supabase-miljøvariabler er appen i **demomodus**. Endringer i program, lag, rebus og bilder lagres lokalt i nettleseren. Galleribilder er begrenset til 450 KB; **rebusbilder komprimeres automatisk** før de lagres i `localStorage`. Ved mange bilder kan lagringsplassen fortsatt fylles opp. Arrangøren kan nullstille demoen.

### Test bildebevis fra ende til ende

1. Logg inn som deltaker, åpne **Rebus**, velg en post og trykk **Send bilde**.
2. Ta et bilde med kamera eller velg et fra bildebiblioteket. Sjekk forhåndsvisningen og send til godkjenning.
3. Logg ut, velg **Se som arrangør**, gå til **Admin → Innsendinger** og åpne bildet i stort format.
4. Godkjenn eller avvis. Logg inn som deltaker igjen: godkjente oppgaver gir laget poeng, avviste oppgaver kan leveres på nytt med et nytt bilde.

```bash
npm test
npm run build
```

## Koble til Supabase (nytt utviklingsprosjekt)

**Ikke kjør migrasjonen på databasen fra den gamle Blåtur-appen.** Den nye modellen erstatter ikke de gamle tabellene automatisk. Opprett et separat Supabase-prosjekt først.

1. Installer Supabase CLI (`npm install --save-dev supabase` eller global installasjon), og ha Docker/OrbStack tilgjengelig for lokal Supabase.
2. Kjør `npx supabase start` for å teste lokalt. Migrasjonene `202610280001_initial.sql` og `202610280002_rebus_photo_submissions.sql` oppretter tabeller, RLS, en privat bilde-bucket og krever bildebevis på nye rebusinnsendinger. `supabase/seed.sql` lager **kun lokalt** en prøvetur med invitasjonskode `demo-2026`.
3. Lag `.env.local` fra `.env.example`. Sett `VITE_SUPABASE_URL` og `VITE_SUPABASE_PUBLISHABLE_KEY` til URL og publishable key for utviklingsprosjektet (for lokale nøkler: `npx supabase status`). Start Vite på nytt.
4. For en hostet Supabase-instans: kjør migrasjonen som en migrasjon via CLI mot **utviklingsinstansen**. Opprett tur/lag og kodehash for denne instansen; **ikke bruk demokoden i produksjon**.
5. Under **Authentication**: aktiver Anonymous Sign-Ins for deltakerflyten og Email OTP/magic links for arrangøren. Sett riktig Site URL/redirect URL til lokal Vite/Vercel-URL. Anonymous Sign-Ins bør ha bot-beskyttelse (CAPTCHA/Turnstile) før offentlig deploy.
6. Arrangøren logger inn via e-postlenke. Knytt deretter brukerens Supabase Auth-UUID til turen manuelt i SQL Editor (under). Arrangøren får da tilgang til Admin-siden. Deltakere bruker invitasjonskoden og velger navn. Arrangøren fordeler deltakerne på lag.
7. For sanntid må du aktivere Postgres Changes for `trips`, `trip_members`, `teams`, `program_items`, `checkpoints`, `submissions` og `photos` i Supabase Realtime-publication. Uten dette kan deltakerne oppdatere siden manuelt for å se nye data.

Eksempel (kjør etter at arrangøren har logget inn, med **ekte** bruker-UUID):

```sql
insert into public.trip_members (trip_id, user_id, display_name, role)
values (
  '00000000-0000-4000-8000-000000000001',
  'SETT-INN-AUTH-USER-UUID',
  'Arrangør', 'organizer'
);
```

For lokal seed er tur-UUID-en som vist. For hostet miljø må du bruke faktisk UUID fra `public.trips`.

## Sikkerhet

- Ingen passord sjekkes i nettleseren. Brukere identifiseres av Supabase Auth.
- Databasens RLS gir bare turmedlemmer tilgang, og bare arrangører kan redigere oppsett eller godkjenne svar.
- Bildene lagres i en **privat** bucket. UI bruker tidsbegrensede signerte URL-er, ikke offentlige bildeadresser.
- Et lags poeng beregnes fra **godkjente** innsendinger og poengene definert på rebusposten. Deltakeren sender ikke poeng selv.
- Admin-kode eller Supabase service keys må **aldri** legges inn i en `VITE_`-variabel eller i Git.
- Medlemstilgang via invitasjonskode må rate-limites/overvåkes før offentlig bruk.

## Det som er bevisst tatt ut

Ølteller, spinnhjul, avstemninger, hemmelige oppdrag, generert vær og pakkevisning. Dette kan senere bli valgfrie moduler.

## Ikke implementert ennå

- **GPS-låst opplåsing** er fortsatt utsatt. Bildebevis er påkrevd, men fysisk oppmøte verifiseres ikke ennå. GPS må senere valideres på serveren.
- AI-generering av nye turer og visuelle temaer; dette er neste prosjektfase.
- Automatisk migrering fra dagens produksjonsdatabase.
- Manuell gjennomgang og test mot en faktisk Supabase-instans må gjøres før dette kan kalles produksjonsklart.

## Foreslått samarbeid i repoet

- Legg denne kodebasen på en egen gren eller som erstatning i et nytt repo, uten `node_modules`, `.env` eller `dist`.
- Kjør `npm test` og `npm run build` etter endringer.
- Claude kan arbeide med visuell komponentdesign, mens Codex tar datamodell, sikkerhet og integrasjonstester.
- Bevar dagens Blåtur-app og database inntil den nye er testet med flere deltakere på to telefoner.
