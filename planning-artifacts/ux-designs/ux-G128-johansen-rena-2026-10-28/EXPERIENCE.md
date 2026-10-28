---
title: "EXPERIENCE: TripBuilder AI"
status: draft
created: 2026-10-28
updated: 2026-10-28
sources:
  - Leveranser/product-brief.md
  - planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md
  - planning-artifacts/gjennomforingsplan.md
---

# EXPERIENCE: TripBuilder AI

> Utkast laget med rask vei. Alt merket `[ASSUMPTION]` er gjettet og må bekreftes av gruppen. Visuelle valg ligger i [DESIGN.md](DESIGN.md). Ved konflikt gjelder disse to dokumentene foran mockups.

## Foundation

- **Form-faktor:** Webapp. Deltakeren bruker mobil i felt, og den flaten er viktigst. Arrangøren bruker responsiv web, med PC som hovedflate når turen lages og mobil når innsendinger godkjennes underveis. Det lages ingen native app (PRD §5).
- **UI-system:** Tailwind uten komponentbibliotek, og react-leaflet for kart. Tokenene i DESIGN.md mappes til Tailwind-konfigurasjonen.
- **Språk:** Bare norsk bokmål i V1.
- **Roller:** Arrangøren har konto (FR-13). Deltakeren blir med via turkode og navn (FR-14). Demo-modus har ingen innlogging, bare valg av rolle (FR-11, FR-12).

## Information Architecture

### Felles

| Flate | Nås fra | Formål |
|---|---|---|
| Start | Rot-URL | Valg mellom «Lag en tur» (arrangør) og «Bli med på tur» (deltaker). I demo-modus: velg rolle og åpne prøveturen |

### Arrangør

| Flate | Nås fra | Formål | Krav |
|---|---|---|---|
| Innlogging | Start → «Lag en tur» | E-post med magisk lenke | FR-13 |
| Mine turer | Etter innlogging | Liste over utkast og publiserte turer, og knappen «Ny tur» | – |
| Ny tur | Mine turer | Nøkkelfelt øverst (Destinasjon\*, Fra\*, Til\*, Deltakere\*, Lag, Antall poster) og deretter et stort tekstfelt («Fortell om turen») med eksempeltekst og hint om program og rebus | FR-1 |
| Genererer | Ny tur → «Lag utkast» | Fremdrift i steg: plan → innhold → kontroll. Siden må være åpen til utkastet er klart | FR-2 |
| Utkast | Genererer, eller Mine turer | Faner for Program, Poster, Lag og Poeng. Alt kan redigeres. Postene vises også på kart | FR-3, FR-5, FR-8 |
| Publiser | Utkast → «Publiser» | Bekreftelse, deretter turkode, lenke og QR-kode | FR-4 |
| Godkjenning | Mine turer → tur, med teller for ventende | Kø med innsendinger som kan godkjennes eller avvises | FR-15 |
| Turoversikt | Mine turer → publisert tur | Ledertavle i sanntid, ventende innsendinger og deling av turkoden | FR-9, FR-10 |
| Rediger underveis | Turoversikt → «Endre turen» | Samme faner som Utkast, men tilpasset mobil først. Arrangøren kan endre, legge til («+ Programpost», «+ Post», «Ny post med KI») og deaktivere. Lagring går live med en gang | FR-17 |

### Deltaker

| Flate | Nås fra | Formål | Krav |
|---|---|---|---|
| Bli med | Start, eller delt lenke eller QR | Turkode (forhåndsutfylt fra lenken) og navn, én gang | FR-14 |
| I dag (fane) | Standard etter innlogging | Dagens program med den aktiviteten som pågår nå uthevet, og en snarvei til nærmeste post | UJ-3 |
| Kart (fane) | Hovednavigasjon | Poster med status og egen posisjon. Et postkort vises nederst når en post velges | FR-5, FR-6 |
| Post | Kart eller I dag | Låst: avstand og hint. Opplåst: oppgaven, med knappen «Løs oppgaven» | FR-6 |
| Send inn | Post → «Løs oppgaven» | Tekstsvar og/eller foto, og knappen Send | FR-7 |
| Ledertavle (fane) | Hovednavigasjon | Lag rangert etter poeng, med eget lag uthevet | FR-10 |
| Laget (fane) | Hovednavigasjon | Lagmedlemmer og lagets innsendinger med status (Venter, Godkjent eller Avvist) | FR-15 |

Deltakeren har fire hovedflater: I dag, Kart, Ledertavle og Laget. Navigasjonsmønsteret mellom dem er ikke bestemt. Det avgjøres ut fra blåtur-malen gruppen sender når planleggingsfasen er ferdig, og bunnfaner er foreløpig valgt bort. Modale vinduer er bare ett nivå dypt.

Lagtildeling (besluttet): En ny deltaker plasseres automatisk på laget med færrest medlemmer når hen blir med (Story 3.1). Arrangøren kan flytte deltakere mellom lag i Turoversikt (Story 4.1).

## Voice and Tone

Mikrotekst. Merkevarestemmen står i DESIGN.md under Brand & Style.

| Gjør | Ikke gjør |
|---|---|
| «Du er 120 m unna. Gå nærmere for å låse opp.» | «Posisjon utenfor geofence-radius» |
| «Sendt! Venter på godkjenning fra arrangøren.» | «Innsending registrert (status: pending)» |
| «Laget ditt fikk 10 poeng 🎉» | Utropstegn på alt |
| «Fant ikke turen. Sjekk koden og prøv igjen.» | «404 / ugyldig input» |
| «Utkastet er klart. Se over før du publiserer.» | «KI-generering fullført» |
| Bruk «du» og korte, hele setninger | Tekniske ord som JSON, API og geofencing |

## Component Patterns

Atferd. Det visuelle står i DESIGN.md under Components.

| Komponent | Bruk | Regler |
|---|---|---|
| Nøkkelfelt | Ny tur | Påkrevde felt er merket med \*. Feil vises inline når feltet forlates («Til-dato kan ikke være før fra-dato», «Maks 6 lag», «Antall poster må være minst 1»). Datofeltene bruker den innebygde datovelgeren |
| Promptfelt | Ny tur | Krever minst ca. 30 tegn. Ved for kort tekst: inline-hint om hva som mangler, som program eller rebus (FR-1). Felt og tekst lagres lokalt mens arrangøren skriver |
| Fremdriftssteg | Genererer | Viser hvilket steg som kjører. Hvis valideringen feiler, prøves det én gang til i stillhet (PRD §8.5). Feiler det igjen, vises en feilmelding med «Prøv igjen» og «Rediger beskrivelsen». «Lag utkast» er låst mens genereringen pågår, så et dobbeltklikk ikke starter to genereringer |
| Redigerbart felt | Utkast | Redigeres på stedet og lagres automatisk. Felt med valideringsfeil får rød kant og en forklaring |
| Kartvelger | Utkast → Poster | Posten flyttes ved å dra markøren. Radius vises som en sirkel. Posisjoner utenfor turens område avvises med en forklaring. Turens område vises som en stor sirkel som arrangøren kan flytte og endre størrelse på før publisering |
| Regenerer-felt | Utkast, per element (trinn D) | Kommando i fritekst. Viser forslaget ved siden av gjeldende versjon med «Bruk» og «Behold gammel». Bare det valgte elementet endres |
| Postkort | Kart | Avstanden oppdateres mens deltakeren beveger seg. Knappen «Løs oppgaven» blir aktiv straks deltakeren er innenfor radius |
| Foto-input | Send inn | Åpner kameraet direkte (`capture`), med galleri som alternativ. Bildet komprimeres i klienten før opplasting |
| Endringsbanner | Deltakerflatene | «Programmet er oppdatert.» vises øverst når noe er endret siden deltakeren sist så. Trykk åpner I dag med de endrede elementene uthevet. «Merk alle som sett» fjerner merkene for alt som er endret til nå, og endringer som kommer etterpå, gir banneret på nytt. |
| Endret-merke | Programkort, postkort og postliste | Liten chip med «Endret» på elementer som er endret siden deltakeren sist så akkurat det elementet (AD-16). Den forsvinner når elementet åpnes, og andre endrede elementer beholder merket. |
| Deaktiver post | Rediger underveis | «Deaktiver» med bekreftelse: «Lag som har løst posten, beholder poengene.» Handlingen kan angres med «Aktiver igjen». En post uten innsendinger kan slettes. |
| KI-forslag underveis | Rediger underveis | Samme mønster som Regenerer-felt. Forslaget vises med «Bruk» og «Forkast», og ingenting går live før «Bruk» |
| Godkjenningskort | Godkjenning | Godkjenn og Avvis er ett trykk hver. Avvis lar arrangøren legge til en kort begrunnelse (valgfritt). Beslutningen sendes først etter 5 s, og «Angre» i den perioden avbryter den, så verken poeng eller andre klienter påvirkes |
| Ledertavle | Ledertavle-fanen og Turoversikt | Oppdateres uten at siden lastes på nytt. Når plasseringer endres, flyttes radene med en kort animasjon |
| Posisjonssimulator | Kart, bare i demo-modus | Arrangøren trykker på kartet eller velger «Gå til post N» for å sette en simulert posisjon (FR-6, gjennomføringsplanen B.2) |

## State Patterns

| Tilstand | Flate | Behandling |
|---|---|---|
| Tomt (ingen turer) | Mine turer | «Ingen turer ennå.» og knappen «Ny tur» |
| Genererer | Genererer | Fremdriftssteg og teksten «Ikke lukk siden, dette tar litt tid.» Lukkes siden, avbrytes genereringen, og beskrivelsen er bevart |
| Generering feilet | Genererer | Kort forklaring og to valg (se Fremdriftssteg). Det som er skrevet, beholdes |
| Valideringsfeil | Utkast | Teller øverst («2 ting må rettes før publisering»). Publiser er deaktivert til alt er rettet |
| Turen er ikke publisert | Bli med | «Turen er ikke åpnet ennå.» |
| Feil turkode | Bli med | Inline-feil under feltet. Det som er skrevet, blir stående |
| Posisjon nektet | Kart, Post | Forklaring og «Prøv igjen». Kartet virker fortsatt. Geolåste poster forblir låst, mens åpne poster kan løses som vanlig |
| Unøyaktig posisjon | Kart | Usikkerheten vises som en sirkel rundt egen posisjon, og teksten «Venter på bedre GPS…» |
| Låst post | Post | Avstand, retning og hint. Selve oppgaveteksten er skjult |
| Opplåst post | Post | Oppgaveteksten og knappen «Løs oppgaven» |
| Sender | Send inn | Knappen blir til en spinner, og skjemaet er låst |
| Uten nett eller feilet opplasting | Send inn | Ingenting legges i kø i V1. Teksten er «Ingen dekning. Prøv igjen når du har nett.» Svaret og bildet blir stående i skjemaet, og «Sendt»-kvitteringen vises først når serveren har bekreftet |
| Venter | Laget, Post | Chip i `warning` med «Venter på godkjenning» |
| Godkjent | Laget, Post, Ledertavle | Chip i `success`. Poengene telles og ledertavlen oppdateres (under 5 s, SM-5) |
| Avvist | Laget, Post | Chip i `danger` og eventuell begrunnelse. Laget kan sende inn på nytt |
| Ingen ventende | Godkjenning | «Alt er godkjent. Godt jobbet!» |
| Endret | I dag, Kart, Post | Endret-merke og endringsbanner til deltakeren har sett det |
| Deaktivert post | Kart, Post, postliste | Markøren er nedtonet med rød kant, og chipen «Deaktivert» står i `danger`. Oppgaveteksten er skjult, og «Løs oppgaven» vises ikke. Lag som har fullført posten, ser fortsatt hake og poeng |
| Endring lagres | Rediger underveis | «Lagret. Deltakerne ser endringen nå.» Ved valideringsfeil lagres ingenting, og feilen vises ved feltet |
| Demo-modus | Alle flater | Demo-banner øverst og simulator på kartet |

## Interaction Primitives

- Trykk for å handle. Alle handlinger kan nås med én hånd i den nederste halvdelen av skjermen.
- Kartet støtter vanlig panorering og zoom. Knappen «Min posisjon» sentrerer kartet.
- Bilder lastes opp fra kamera eller galleri.
- På Ledertavle og I dag kan deltakeren dra ned for å oppdatere manuelt, i tillegg til sanntidsoppdateringen.
- **Ikke tillatt:** karuseller, push-varsler i V1, sveipebevegelser som er eneste vei til en handling, og intro-animasjoner.

## Accessibility Floor

Atferd. Visuell kontrast står i DESIGN.md.

- Alle interaktive elementer har en tilgjengelig etikett med rolle og tilstand, for eksempel «Post 3, låst, 120 meter unna».
- Status formidles aldri bare med farge. Det er alltid tekst og ikon i tillegg.
- Endringer på ledertavlen og ny status på innsendinger annonseres via `aria-live="polite"`.
- Hvis brukeren har bedt om redusert bevegelse, vises ingen animasjon når rader flyttes på ledertavlen.
- Trykkflater er minst 48 × 48 px.
- Postlisten under I dag er et alternativ til kartet, så ingen flyt krever kartet.
- Fokusrekkefølgen følger leserekkefølgen, og fokus er alltid synlig.

## Responsive & Platform

- Deltakerflatene designes for 360–430 px bredde først. På bredere skjermer er innholdet sentrert med maks 480 px bredde.
- Arrangørens Utkast har to kolonner fra 1024 px (innhold og kart), og én kolonne med kartet i en egen fane under det.
- Godkjenning er laget for mobil først, fordi arrangøren godkjenner underveis på turen.
- Nettlesere som skal støttes: siste versjon av Safari på iOS og Chrome på Android. Geolokasjon krever HTTPS (eller localhost i demo-modus).

## Feltbruk

Dette avsnittet er laget for TripBuilder AI fordi deltakersiden brukes utendørs.

- Det er sterkt sollys. Bruk høy kontrast, ingen tynne skrifter og ingen grå-på-grå. `[ASSUMPTION]`
- Dekningen kan være dårlig. Programmet og postlisten mellomlagres etter første lasting. Innsendinger viser tydelig status.
- Batteriet skal spares. Posisjonen spores bare mens Kart eller Post er åpen, og posisjonen lagres aldri som historikk (addendum, sikkerhet).
- Deltakeren har ofte én hånd ledig og kort oppmerksomhet. Den viktigste handlingen er alltid nederst på skjermen.

## Key Flows

Personene er illustrative.

### Flyt 1: Marte lager en tur (arrangør, PC, en kveld to uker før blåturen)

1. Marte logger inn med magisk lenke og trykker «Ny tur».
2. Hun fyller ut Ålesund, 14.–16. mars, 18 deltakere og 3 lag, og skriver: «Studentgjeng, rebus med fem poster per dag i sentrum, middag fredag kl. 19 …»
3. Hun trykker «Lag utkast», og Genererer viser fremdriften i steg.
4. Utkastet åpnes med Program, Poster, Lag og Poeng. To poster ligger litt utenfor sentrum, så hun drar dem inn på kartet.
5. Hun justerer poengene og trykker «Publiser».
6. **Klimaks:** Hun får turkoden, lenken og QR-koden. Hun ser at turen er klar på under 30 minutter (SM-1) og limer lenken inn i gruppechatten.

Feil: Beskrivelsen er for kort, og hun får et hint om hva som mangler. Hvis genereringen feiler to ganger, kan hun prøve igjen eller endre teksten, og ingenting går tapt.

### Flyt 2: Ida løser en post (deltaker, mobil, i sentrum av Ålesund)

1. Ida åpner lenken fra gruppechatten. Turkoden er forhåndsutfylt, hun skriver navnet sitt og er med.
2. «I dag» viser programmet, og rebusen pågår nå.
3. Hun åpner Kart. Post 2 er nærmest og låst («300 m unna»).
4. Hun går mot posten. Avstanden teller ned, og innenfor radius låses posten opp.
5. Hun trykker «Løs oppgaven», tar et bilde av laget foran statuen og trykker Send.
6. Hun får umiddelbar kvittering: «Sendt! Venter på godkjenning fra arrangøren.»
7. **Klimaks:** Litt senere blir chipen grønn. Hun åpner Ledertavle og ser at laget har klatret fra tredje til andre plass, uten å ha oppdatert siden.

Feil: Hun har nektet tilgang til posisjon og får en forklaring og «Prøv igjen». Postlisten under I dag virker fortsatt.

### Flyt 3: Marte godkjenner underveis (arrangør, mobil, på kafé under rebusen)

1. Marte ser telleren «4 venter» på turen sin.
2. Hun åpner Godkjenning, og det første kortet viser bildet, laget og posten.
3. Hun godkjenner tre med ett trykk hver. Ett bilde viser feil statue, så hun trykker Avvis og skriver «Feil statue 😉».
4. **Klimaks:** Ledertavlen i Turoversikt oppdateres med en gang, og lagene ser endringen innen 5 sekunder.

### Flyt 4: Sensor kjører demoen (lokal maskin, uten nøkler)

1. Sensor følger README og starter appen i demo-modus.
2. På Start velger sensor «Arrangør» og ser prøveturen som et utkast. «Lag utkast» bruker mock-agenten.
3. Sensor publiserer og velger deretter «Deltaker» i en ny fane.
4. Med posisjonssimulatoren trykker sensor «Gå til post 1», og posten låses opp.
5. Sensor sender inn et svar, bytter til arrangørfanen og godkjenner det.
6. **Klimaks:** Ledertavlen i deltakerfanen oppdateres uten innlasting. Hele kjeden er vist uten en eneste ekstern konto (SM-8).

### Flyt 5: Marte bytter restaurant underveis (arrangør, mobil, lørdag ettermiddag)

1. Gjengen finner en kul restaurant i en sidegate. Marte åpner Turoversikt og trykker «Endre turen».
2. Hun åpner programposten «Middag kl. 19», bytter sted og legger til en lenke.
3. Hun trykker «Ny post med KI» og skriver «en post ved restauranten der laget tar et bilde med kokken». Hun ser forslaget, justerer poengene og trykker «Bruk».
4. **Klimaks:** «Lagret. Deltakerne ser endringen nå.» På Idas mobil dukker banneret «Programmet er oppdatert» opp, og middagskortet og den nye posten har merket «Endret».

Edge case: Marte deaktiverer post 4 fordi den er stengt. To lag har allerede løst den, og de beholder poengene. På kartet er posten nedtonet og merket «Deaktivert».

## Åpne punkter

- Om avviste innsendinger kan sendes inn på nytt, og om de i så fall gir fulle poeng.
- Om arrangøren også kan delta på turen med samme bruker.
- Besluttet etter QA (2026-10-28): automatisk lagtildeling med flytting i etterkant, ingen kø uten nett i V1, sett-status per element, angre som forsinket sending, og at genereringssiden må være åpen.
- Hvordan sanntiden synkroniseres mellom faner i demo-modus. Dette henger sammen med PRD §8.4, som er utsatt.
