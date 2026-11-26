# Rapport til Stian: 25.–26. november

## Kortversjonen

- Hele kjerneflyten virker nå i **demomodus**: lag en tur, publiser den, spill den og følg opp underveis.
- Vi har **ikke Supabase ennå**. Ingenting er prøvd i live-modus, og KI-en er simulert.
- Det finnes nå en **sensorstøtte** ([SENSOR.md](../SENSOR.md)) og **nettlesertester** (`npm run test:e2e`).
- Alt, også sensorstøtten og den siste feilrettingen, ligger i `main` (pull request 31).

## Det som er gjort

| Hva | Innhold | Status |
|---|---|---|
| Epic 4 | Lagfordeling, ledertavle, oppdatering mellom faner og galleri | I `main`, satt til `done` |
| Epic 5 | Endre, legge til og deaktivere under turen, med varsel til deltakerne | I `main`, satt til `done` |
| Story 2.2, 2.3, 2.5–2.7 | Beskrive tur, utkast fra mock-KI, redigering, tema og publisering med turkode, lenke og QR-kode | I `main`, satt til `done` |
| Mobilvisning | Rettet ledertavlen, tidslinjen i programmet, trykkflater under 48 px og entall i tekster | I `main` |
| Retrospektiv | [Epic 4](../implementation-artifacts/epic-4-retro-2026-11-26.md) og [Epic 5](../implementation-artifacts/epic-5-retro-2026-11-26.md), begge «godkjent med åpne punkter» (gjelder demo) | I `main` |
| Nettlesertester | Mobilflyten, Epic 4 og 5, publisering og utseendet. Se [e2e/README.md](../e2e/README.md) | I `main` (pull request 30 og 31) |
| Sensorstøtte | Oppstart uten nøkler, testprotokoll i 16 steg, hva som er laget, og hvor grunnlaget for vurderingen ligger | I `main` (pull request 31) |

Storyene i Epic 4, 5 og 2 ble merget i pull request 15–27. Story 4.1 har ingen dokumentert review. De andre storyene har funn fra review i spesifikasjonen.

## Feil vi fant i synken mellom faner (demo)

Dette er verdt å kjenne til, siden det kunne slette arbeid under en demonstrasjon:

1. En treg innsending kunne overskrive det arrangøren hadde lagret imens.
2. En fane kunne skrive eldre data over nyere, for eksempel sette en godkjenning tilbake til «venter».
3. Den andre fanen kunne lese for tidlig og bli stående med gamle data. Da testprotokollen ble kjørt automatisk, feilet ett steg i tre av åtte kjøringer.

Alle tre er rettet og ligger i `main`. Etter rettingen av nummer 3 besto protokollen 20 av 20 kjøringer. Ingen reviewere har sett på rettingene.

## Testet

I en ren klon av koden før mergingen, 26. november: bygget, 825 enhetstester, 41 nettlesersteg og testprotokollen (5 av 5) besto.

**Ikke testet:** protokollen for hånd, ekte telefon, ekte GPS, kamera, live-modus og andre maskiner enn macOS.

**To ting vi ikke har forklart:**
- Chrome lar av og til være å hente en skriptfil i nettlesertestene, så siden blir blank. Testen laster da siden én gang til og skriver `ADVARSEL`.
- Én gang sluttet en fane å svare midt i testen. Vi fikk det ikke til igjen og kan ikke utelukke at feilen ligger i appen.

## Det jeg trenger fra deg

1. **Kjør testene hos deg:** hent siste `main`, og kjør `npm install`, `npm test` og `npm run test:e2e`. Du trenger Node 22.12 eller nyere og Chrome.
2. **Les [SENSOR.md](../SENSOR.md), og følg testprotokollen for hånd.** Si fra om noe ikke stemmer, eller om en side blir blank eller ikke oppdateres.
3. **Ta stilling sammen med meg:**
   - samtykke, lagringstid og sletting av bilder (skulle vært avklart før Story 4.4)
   - hvordan sanntid skal vises på eksamen
   - fargene og temaene i DESIGN.md

## Gjenstår

- **Supabase:** kjøre migrasjonene, slå på sanntid og teste tilgangsreglene. Innlogging (2.1), ekte KI (2.4) og live-modus (7.4) venter på dette.
- **Ikke ferdig:** bli med med turkode og navn (3.1), nye KI-forslag (Epic 6), og sluttkontroll, måling av suksesskriterier og deploy (Epic 7).
- **Opprydding før levering:**
  - `product-brief-template.md` ligger i rotmappen.
  - [START_LOKALT.md](START_LOKALT.md) omtaler en gammel database.
  - Spesifikasjonen for 4.1 står som `review`, mens sprint-status sier `done`.
- **Tiltak:** de åpne tiltakene står under `action_items` i [sprint-status](../implementation-artifacts/sprint-status.yaml).

**Et tips:** Ikke kjør to KI-økter i samme mappe samtidig. Det skjedde 26. november. Da havnet en commit fra den ene økten på branchen til den andre, og to loggfiler fikk samme nummer.
