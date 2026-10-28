---
title: "DESIGN: TripBuilder AI"
status: draft
created: 2026-10-28
updated: 2026-10-28
name: TripBuilder AI
description: Mobilvennlig turside for uformelle grupper. Leken, men ryddig. Den skal kunne leses i sollys og brukes med én hånd.
colors:
  surface-base: '#FFFFFF'
  surface-muted: '#F3F5F4'
  ink-primary: '#111827'
  ink-secondary: '#4B5563'
  border: '#D1D5DB'
  primary: '#0F766E'
  primary-pressed: '#115E59'
  on-primary: '#FFFFFF'
  success: '#15803D'
  warning: '#B45309'
  danger: '#B91C1C'
  locked: '#6B7280'
  team-1: '#2563EB'
  team-2: '#DC2626'
  team-3: '#16A34A'
  team-4: '#9333EA'
  team-5: '#EA580C'
  team-6: '#0891B2'
typography:
  display:
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
  score:
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: 6px
  md: 12px
  lg: 16px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  margin-mobile: 16px
  tap-min: 48px
components:
  button-primary:
    background: '{colors.primary}'
    text: '{colors.on-primary}'
    rounded: '{rounded.md}'
    minHeight: '{spacing.tap-min}'
  button-secondary:
    background: '{colors.surface-base}'
    text: '{colors.primary}'
    border: '{colors.primary}'
    rounded: '{rounded.md}'
    minHeight: '{spacing.tap-min}'
  card:
    background: '{colors.surface-base}'
    border: '{colors.border}'
    rounded: '{rounded.lg}'
    padding: '{spacing.4}'
  post-marker-locked:
    fill: '{colors.locked}'
  post-marker-unlocked:
    fill: '{colors.primary}'
  post-marker-done:
    fill: '{colors.success}'
  post-marker-deactivated:
    fill: '{colors.locked}'
    border: '{colors.danger}'
    opacity: 0.5
  changed-chip:
    background: '{colors.primary}'
    text: '{colors.on-primary}'
    rounded: '{rounded.full}'
  status-chip:
    rounded: '{rounded.full}'
    typography: '{typography.meta}'
  bottom-nav:
    background: '{colors.surface-base}'
    border: '{colors.border}'
    active: '{colors.primary}'
    inactive: '{colors.ink-secondary}'
---

# DESIGN: TripBuilder AI

> Utkast laget med rask vei. Alt merket `[ASSUMPTION]` er gjettet og må bekreftes av gruppen. Ved konflikt gjelder dette dokumentet foran mockups.

## Brand & Style

TripBuilder AI er en turkompis, ikke et kontorverktøy. Deltakersiden skal føles leken og konkurransepreget, men ryddig nok til at man finner neste post på to sekunder midt i en aktivitet. Konkurransen kommer til uttrykk gjennom lagfarger, poengtall og ledertavlen. Resten av grensesnittet er rolig. `[ASSUMPTION]`

Arrangørsiden har samme visuelle språk, men tettere informasjon. Den er et redigeringsverktøy der arrangøren skal stole på det KI-en har laget.

## Colors

Fargene er valgt for sterkt sollys utendørs. All tekst har minst 4.5:1 kontrast mot bakgrunnen. `[ASSUMPTION]`

- **Hvit (`surface-base`)** er bakgrunnen. **Lys grå (`surface-muted`)** skiller seksjoner uten skygger.
- **Fjordgrønn (`primary`, `#0F766E`)** brukes til primærhandlinger, aktiv fane og opplåste poster. Den brukes ikke til dekorasjon.
- **Grå (`locked`)** brukes bare for låste poster. Låst skal se inaktivt ut, men være lesbart.
- **Grønn (`success`)** betyr fullført eller godkjent, **oransjebrun (`warning`)** betyr venter på godkjenning, og **rød (`danger`)** betyr avvist eller feil. Status vises alltid med både tekst og farge, aldri bare med farge.
- **Lagfarger (`team-1` til `team-6`)** gir hvert lag en egen identitet på ledertavlen, lagkortet og deltakerens profil. De skal ikke brukes til status.

Unngå gradienter, farger som skiller programinnhold etter kategori, og rødt for noe annet enn feil.

## Typography

Systemfonter, slik at ingen fontfiler må lastes. Det hjelper på kravet om under 3 s over 4G (SM-7).

- `display` brukes til turens navn og dagens overskrift.
- `title` brukes til kortoverskrifter, postnavn og seksjoner.
- `body` er minimum 16 px på mobil, og aldri mindre for brødtekst.
- `meta` brukes til klokkeslett, avstand og status-chips.
- `score` brukes til poengtall på ledertavlen og lagkortet.

## Layout & Spacing

Skalaen er 4, 8, 12, 16, 24 og 32 px. Mobilmargen er 16 px. Deltakervisningen er alltid én kolonne, med bunnfaner som er lett å nå med tommelen.

Arrangørvisningen på PC har to kolonner: utkastets innhold til venstre og kart eller detaljer til høyre. Under 1024 px faller den sammen til én kolonne med kartet i en egen fane, samme brytepunkt som i EXPERIENCE.md.

## Elevation & Depth

Det brukes nesten ingen skygger. Kort skilles med kant og bakgrunnstone. En svak skygge er bare lov på flytende elementer over kartet, som postkortet nederst og knappen for å finne posisjonen sin.

## Shapes

`rounded.md` brukes på knapper og felt, og `rounded.lg` på kort. `rounded.full` brukes bare på status-chips og lagmerker. Kartmarkører er runde med et nummer i midten.

## Components

- **Primærknapp:** fylt `primary`, minst 48 px høy og i full bredde på mobil. Det er én primærknapp per skjerm.
- **Programkort:** klokkeslett i `meta`, tittel i `title` og sted i `ink-secondary`. Aktiviteten som pågår nå får en venstrekant i `primary`.
- **Postmarkør (kart):** fire tilstander. Låst har grå fylling og hengelås. Opplåst har fjordgrønn fylling og nummer. Fullført har grønn fylling og hake. Deaktivert har nedtonet grå fylling og rød kant.
- **Endret-chip og endringsbanner:** chipen er liten og fylt med `primary`, med teksten «Endret». Banneret er en stripe i `surface-muted` øverst med venstrekant i `primary`.
- **Postkort:** flyter nederst over kartet. Det viser postnavn, avstand («120 m unna») og status. Når posten er opplåst, får det knappen «Løs oppgaven».
- **Status-chip:** pilleform med ikon og tekst. Variantene er Venter, Godkjent, Avvist og Deaktivert. Deaktivert bruker `danger`.
- **Ledertavlerad:** plassering, lagmerke i lagfarge, lagnavn og poeng i `score`. Raden til deltakerens eget lag er uthevet med `surface-muted`.
- **Godkjenningskort (arrangør):** bilde eller svar, lag, post og tidspunkt, med knappene Godkjenn (`success`) og Avvis (`danger`).
- **Bunnfaner:** fire faner med ikon og tekst. Den aktive fanen er i `primary`.
- **Demo-banner:** en smal stripe i `warning` øverst med teksten «Demo-modus». Den vises alltid i demo-modus.

## Do's and Don'ts

| Gjør | Ikke gjør |
|---|---|
| Vis status med tekst og ikon i tillegg til farge | Vis status bare med farge |
| Bruk minst 48 px trykkflater | Bruk små ikonknapper uten tekst i felt |
| Ha én primærhandling per skjerm | Ha flere fylte knapper som konkurrerer |
| Bruk lagfarger til lagidentitet | Bruk lagfarger til status eller varsler |
| Skriv brødtekst i minst 16 px | Komprimer tekst for å få plass til mer |
