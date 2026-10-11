# Addendum til PRD

Dette dokumentet samler informasjon som hører til PRD-en, men som ikke bør styre hovedkravene direkte. Det er ment som støtte for senere arkitektur, UX og implementasjonsarbeid.

## Kjerneproduktkonsept

TripBuilder AI er en tjeneste som konverterer en naturlig språk-beskrivelse av en tur til en strukturert, publiserbar deltakeropplevelse. De viktigste kundeverdiene er:

- mindre manuelt arbeid for arrangør
- tydeligere og mer konsistent deltakeropplevelse
- bedre kontroll over oppsett, poeng og poster
- muliggjør studiefortsettelse og demonstrasjon uten egne nøkler

## Teknologisk drøfting og prioritering

I v1 prioriteres robuste, velkjente teknologier:

- React + Vite + Tailwind for frontend
- Supabase for auth, storage og erstatter inngang for real-time data
- Leaflet/Geo-mapping for kart og poster
- Claude API eller tilsvarende for KI-generert innhold i arrangørflyten
- Vercel som plattform for deploy

Det er et bevisst valg at v1 skal være enklere og mer testbar enn et fullverdig egenutviklet AI-system med flere parallelle agentmoduler. Det ekstra QA-trinnet kan erstattes av strukturert validering i første versjon, og senere utvides tilbake til mer avansert AI-kontroll.

## Konkurrentanalyse i kortform

- Goosechase: sterke på rebus og oppdrag, men mindre godt for flerdagersprogram og turlogistikk.
- AI-reiseplanleggere: gode på generering av innhold for turer, men ikke på interaktive deltakersider med poeng og geofencing.
- Konferanse- og eventverktøy: gode på status og gamification, men dårlig til uformelle venner/tur-grupper.

Differensieringen er derfor midlertidig, og bør ikke overdrives i videre planlegging.

## Prosjektforutsetninger og risikotiltak

- Det skal være mulig å kjøre kjerneflyten lokalt uten betalte kontoer.
- Det skal være mulig å demo appen med forhåndsdefinert prøvetur og mock-data.
- Lokal kjørbarhet og testbarhet er et designkrav, ikke et etterpåvalg.
- V1 skal leveres i trinn, med fokus på appens kjerneverdier før kreative utvidelser.

## Kvalitetssikring

Kvalitet skal måles på flere nivåer:

- strukturell validering av modellutdata
- geofencing og posisjonslogikk i simulert miljø
- real-time oppdateringer
- lokal bruk uten eksterne avhengigheter
- brukbarhet for arrangør og deltaker

## Relevant videre arbeid

Dette addendumet skal føres videre til:

- arkitektur-dokument
- UX-design og brukerreiser
- epics og stories
- implementasjonsarbeid og QA-plan
