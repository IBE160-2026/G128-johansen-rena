# Blåtur-mal-gjennomgang

## 2026-11-11 kl. 22:19 — StianKnollSkole

### Oppgave
Gå gjennom den nye mappa `template_trip/` (Blåtur ren V1). Stian bekreftet at den er malen for resultatet sluttbrukerne får fra TripBuilder AI: generatoren lager turen, og deltakere og arrangør bruker den i denne appen. Funnene skal diskuteres med Kevin.

### Plan
- Lese README, AGENTS.md, kildekoden, migrasjonene og seed i `template_trip/`.
- Kjøre `npm test`.
- Sammenligne med [ARCHITECTURE-SPINE.md](../../planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/ARCHITECTURE-SPINE.md).
- Lenker til Kevins åpne punkt om å «laste opp blåtur-malen og oppdatere arkitekturspinen» i [../kevin-rena/999-2026-10-28-19-19-10-gjennomforingsplan.md](../kevin-rena/999-2026-10-28-19-19-10-gjennomforingsplan.md). Malen er nå lastet opp (commit `5da570f`). Arkitekturspinen er ikke oppdatert.

### Resultat
- Ingen kode er endret. Malen kom inn i commit `5da570f`.
- `npm test`: 5 av 5 tester bestått. `npm run build` er ikke kjørt, fordi avhengighetene ikke er installert.
- Malen er et React/Vite-program for én tur, skrevet i JavaScript med vanlig CSS. Den har Hjem, Program, Rebus med påkrevd bildebevis, Bilder og Admin. Den har demomodus uten nøkler og Supabase med RLS, en privat bilde-bucket og poeng som bare regnes fra godkjente innsendinger.
- Avvik fra arkitekturspinen:

  | Arkitekturspinen | Malen |
  |---|---|
  | TypeScript og Tailwind | JavaScript og vanlig CSS |
  | Porter og adaptere, `VITE_APP_MODE` | Modus velges av om Supabase-variablene er satt |
  | Vitest og Playwright | `node:test` |
  | Tabellen `posts` | Tabellen `checkpoints` |
  | `join_trip(join_code, display_name)` | `join_trip(p_slug, p_code, p_name)` |
  | `VITE_SUPABASE_ANON_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` |
  | Geofencing | Bare kart |

- Anbefaling til gruppen: tilpass arkitekturspinen til malen, i stedet for å skrive om kode som virker etter et utkast.

### Åpne punkter
- Avgjør med Kevin om arkitekturspinen skal tilpasses malen, med dens stakk, datamodell og `join_trip`-signatur. Oppdater deretter berørte epics og stories.
- Gjør malen datadrevet for genererte turer:
  - `join()` bruker alltid sluggen `'blatur-2026'` (`src/context/TripContext.jsx:534`).
  - Velkomstsiden og sidemenyen har tittel og datoer skrevet rett inn (`Welcome.jsx`, `Shell.jsx`).
- `loadTrip` tar første medlemskap (`limit(1)`). Den må hente turen ut fra ID eller slug, slik at én bruker kan være med på flere turer.
- Arrangøren kan ikke opprette lag i appen. Enten må generatoren lage lagene, eller Admin må få et skjema for det.
- Avgjør om genererte turer skal kunne ha eget visuelt tema. I så fall må fargene i CSS-en bli variabler.
- Avgjør om generatoren og malen skal være én app eller to apper med samme Supabase-database.
- `START_LOKALT.md` sier at Supabase-prosjektet «CharterFeber AI» har et annet skjema enn appen: `trips.title` og `private.trip_secrets` mot `trips.name` og `private.trip_access`. Skjemaene må samordnes før appen kobles til live-data.
- Henting av signerte URL-er skjer ett bilde om gangen ved hver oppdatering (`src/lib/api.js:282`). Det bør gjøres samlet med `createSignedUrls`.

## 2026-11-11 kl. 22:21 — StianKnollSkole (QA med OpenAI/Codex)

### Oppgave

Gi en uavhengig vurdering av Claudes gjennomgang ovenfor og samle vurderingene i samme logg, slik at Stian kan diskutere hele grunnlaget med Kevin.

### Plan

- Lese dagens Claude-logg og QA-oppfølgingen fra 28. oktober.
- Kontrollere funnene mot `template_trip/`: arbeidsregler, README, oppstartsdokumentasjon, API, kontekst, komponenter, tester og SQL-migrasjoner.
- Sammenligne med den gjeldende arkitekturspinen og kjøre malens eksisterende tester.

### Resultat

**Samlet vurdering: Enig i hovedretningen, med forbehold om hva som skal gjenbrukes og hva som fortsatt må implementeres.**

Claudes funn om hardkodet tur, valg av første medlemskap, manglende opprettelse av lag og dokumentert skjemaforskjell mot eksisterende database støttes av filene. Skjemaforskjellen er beskrevet i `START_LOKALT.md`; den faktiske hostede databasen er ikke inspisert av Codex. Henvisningene i første del av loggen har to feil linjenumre: hardkodet slug står nå i `template_trip/src/context/TripContext.jsx:120`, og individuell signering står i `template_trip/src/lib/api.js:26`.

**Presiseringer til anbefalingen om å tilpasse arkitekturen:**

1. **Gjenbruk grensesnitt og brukerflyter.** Det er fornuftig å bygge videre på malen. JavaScript og vanlig CSS kan beholdes hvis gruppen beslutter det; bytte til TypeScript/Tailwind alene rettferdiggjør ikke en omskriving.
2. **Arkitekturen er allerede godkjent.** Spinen har `status: final`, og Kevins logg fra 28. oktober kl. 20:59 dokumenterer gruppens godkjenning. Formuleringen ovenfor om å følge «et utkast» er derfor ikke presis for gjeldende arkitektur. Revider den godkjente arkitekturen eksplisitt ved nye valg.
3. **Bevar avtalte produktkrav og garantier.** Geofencing, KI-generering og flere validerings-/oppdateringsgarantier er fortsatt implementasjonsarbeid. At de mangler i malen betyr ikke at de automatisk skal fjernes fra prosjektet. AD-17 beskriver autoritativ, transaksjonell lagring av turstruktur; malen bruker blant annet direkte `createRecord`/`changeRecord`/`removeRecord`. Tilgangsregler i malen erstatter ikke automatisk hele denne kontrakten.
4. **Avklar GPS-konflikten.** Malens README sier at GPS senere må valideres på serveren. Gjeldende AD-6 sier derimot at posisjon aldri sendes til serveren, og at arrangørgodkjenning er integritetskontrollen. Velg og dokumenter én løsning før geofencing implementeres.
5. **Skill testet demologikk fra verifisert integrasjon.** Codex kjørte `npm test` på nytt: 5 av 5 tester bestod. De tester hjelpefunksjoner for dato, programsortering, poeng, avstand og bildefilvalidering. De verifiserer ikke React-flytene, produksjonsbygget, Auth, RLS, Storage eller sanntid med flere brukere. `npm run build`, nettlesertest og live Supabase-test er ikke kjørt i denne vurderingen. RLS og privat bucket finnes i migrasjonene, men er ikke dermed funksjons- eller sikkerhetsgodkjent.

**Anbefaling til diskusjonen med Kevin:** Bruk malen som deltaker- og arrangørgrensesnitt. Revider arkitekturen rundt delene dere vil beholde, og behold de avtalte validerings- og tilgangsgarantiene. Én applikasjon med egne områder for generator, arrangør og deltaker er et fornuftig utgangspunkt; to applikasjoner krever mer integrasjonsarbeid. Dette er en anbefaling, ikke en ny gruppebeslutning.

Bare denne loggen og tilhørende `issues.md` er oppdatert. Ingen appkode, SQL eller arkitekturbeslutninger er endret.

### Åpne punkter

- Eksisterende punkter fra Claudes gjennomgang gjelder fortsatt; avklar arkitekturendringer og én/to apper med Kevin før dokumentene oppdateres.
- Avklar GPS-konflikten mellom malens README og AD-6: serververifisering eller posisjon kun på enheten.
- Ved tilpasning av arkitekturen: dokumenter hvordan autoritativ validering og atomisk lagring (AD-17) videreføres eller eksplisitt erstattes.
- Verifiser produksjonsbygg, mobilflyter og live Auth/RLS/Storage/sanntid med separate brukerøkter før malen betegnes som integrasjonsklar.
