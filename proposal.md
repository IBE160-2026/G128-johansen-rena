# Prosjektforslag – IBE160 Programmering med KI

**Gruppe:** Kevin Renå og Stian Knoll Johansen
**Arbeidstittel:** TripBuilder AI
**Vanskelighetsgrad (egen vurdering):** Vanskelig

## Hva vi skal lage

En webplattform der en arrangør beskriver en tur eller et arrangement i naturlig språk, og et KI-team i bakkant bygger en ferdig, mobilvennlig deltakernettside. Eksempel på input:

> «Blåtur til Budapest for 8 personer, 24.–27. april. Rebus lørdag med 10 poster rundt sentrum, to lag, 10–25 poeng per post. Noen oppgaver skal kreve at laget fysisk er på stedet. Fredag middag 19:00, lørdag frokost 09:00, rebus 11:00, lunsj 14:00, elvecruise 17:00. Hold destinasjonen skjult frem til avreise.»

Resultatet er en nettside med program per dag, lag og ledertavle, kart med rebusposter, geolåste oppgaver (oppgaven åpnes først når mobilen er innenfor en gitt radius fra posten), bildeopplasting og poengregning. Arrangøren kan redigere, regenerere eller godkjenne alt KI-en foreslår før turen publiseres.

## Hvorfor

Å arrangere en tur med program, konkurranser og rebus krever i dag mye manuelt arbeid, og løsningene blir engangsprodukter. Vi har allerede bygget en slik nettside for én konkret blåtur (React, Supabase, Leaflet). Prosjektet går ut på å gjøre denne til en generell plattform der KI gjør jobben arrangøren ellers måtte gjort selv.

## Hvordan KI brukes

KI-en genererer ikke ny kode per tur. Den fyller en fast datamodell (tur, program, lag, poster, poeng) gjennom en kjede av spesialiserte agenter:

1. **Planner** – tolker prompten og lager en strukturert plan (JSON).
2. **Innholdsagent** – lager program, rebusposter med koordinater, oppgavetekster og poeng tilpasset destinasjon, tone og deltakere.
3. **Designagent** – velger tema og visuell profil for turen.
4. **QA-agent** – kontrollerer at resultatet faktisk oppfyller kravene i prompten før arrangøren får det til gjennomsyn.

I tillegg kan arrangøren be om regenerering av enkeltdeler («lag en vanskeligere rebus», «bytt ut post 4»).

## Teknologi

- **Frontend:** React + Vite + Tailwind, react-leaflet for kart
- **Backend/database:** Supabase (Postgres, auth, storage), Edge Functions eller Node-backend for KI-pipeline
- **KI:** Claude API med strukturert JSON-output for agentkjeden
- **Geolokasjon:** nettleserens Geolocation API og avstandsberegning mot postenes koordinater
- **Hosting:** Vercel
- **Utviklingsmetode:** BMAD med Claude Code som kodeagent

## Avgrensning (V1)

**Inne:** arrangørflyt (prompt → KI → redigering → publisering), deltakerside med program, lag, ledertavle, kart og geolåst rebus, KI-generert innhold med QA-steg.

**Ute:** KI-generert kodebase per tur, betaling og booking, ruteoptimalisering, native app, automatisk deploy per arrangement.

## Sikkerhet og data

Innlogging kreves for arrangør og deltakere (Supabase Auth). Posisjonsdata brukes kun i øyeblikket for å låse opp oppgaver og lagres ikke som sporingshistorikk. Bilder lagres i Supabase Storage med tilgang begrenset til turens deltakere.
