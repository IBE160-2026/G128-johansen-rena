# Tilbakemelding på PRD

| | |
|---|---|
| **Gruppe** | G128 – G128-johansen-rena |
| **PRD vurdert** | `planning-artifacts/prds/prd-G128-johansen-rena-2026-10-11/prd.md` (status i frontmatter: draft, sist endret 2026-10-28, commit 50cda42). `addendum.md` i samme mappe er også lest. |
| **Dato** | 2026-11-12 |
| **Type** | Formativ tilbakemelding, ikke karakter |

## 1. Samlet inntrykk

PRD-en har en tydelig tese: KI fyller en fast datamodell, og arrangøren beholder kontrollen. De viktigste kravene har testbare konsekvenser, og dere har tatt konkrete valg om innlogging, godkjenning av innsendinger og regelbasert validering. Risikoen er størrelsen. MVP-en har vokst til 18 FR uten prioritert rekkefølge, og flere FR-er har konsekvenser som ikke kan bli testtilfeller ennå.

## 2. Dette fungerer godt

- **Testbar KI-kontroll.** FR-2 sier hva som skjer når KI-en gir ugyldig output: «Feiler valideringen, sendes feilene tilbake til KI-en for ett nytt forsøk. Feiler også det, får arrangøren en tydelig feilmelding.» SM-2 skiller dessuten mellom mock og ekte KI-output. Dette er et godt eksempel på hvordan KI-funksjonalitet kan kontrolleres og testes.
- **Ærlige beslutninger og avgrensninger.** §8 skiller «Besluttet» fra «Fortsatt åpent», og aksepterer åpent at «posisjonen bare sjekkes i nettleseren. Arrangørens godkjenning er kontrollen». §5 og §6.2 sier tydelig hva som ikke bygges.
- **Kjørbarhet uten nøkler er et krav.** FR-11 og FR-12 (seed-data, mock-modus, «ingen innlogging, brukeren velger rolle») er skrevet som krav, ikke som ønsker. UJ-5 har dessuten en ekte kantsak: poster med løste innsendinger deaktiveres i stedet for å slettes.

## 3. Oversikt per dimensjon

| Dimensjon | Vurdering | Kort begrunnelse |
|---|---|---|
| Beslutningsklarhet | god | §8 viser tatt og åpne valg. Men «trinn C» og «Epic 4» brukes i §8 uten at trinn eller epics er definert i PRD-en. |
| Substans | god | Innholdet er produktspesifikt. Det mangler krav for dårlig dekning i felt og for kostnad ved KI-kall. |
| Strategisk sammenheng | god | Tydelig tese. FR-16 (tema) og FR-17/18 (endring etter publisering) ser ut som senere tillegg og svekker «minimal versjon». |
| Testbarhet | god | FR-2, FR-5, FR-9 og FR-15 er gode. FR-3, FR-7, FR-8, FR-10 og delvis FR-6 har vage konsekvenser. |
| Scope og avgrensning | svak | Ikke-mål er tydelige, men MVP er en flat liste uten prioritering. Ingen `[ASSUMPTION]` står inline. |
| Brukbarhet for neste fase | god | FR-ene er sporbare til UJ-er og SM-er. Glossaret mangler sentrale begreper. |
| Formtilpasning | god | Forma passer: to roller, mobil, flere reiser. UJ-ene mangler navngitte hovedpersoner. |

## 4. Viktigste forbedringer

### 4.1 MVP har ingen prioritert rekkefølge
- **Alvorlighet:** høy
- **Hvor:** §6.1 «Inne i MVP» (flat liste på ti punkter), §8.4 «avgjøres før sanntidstrinnet (trinn C)», addendum «V1 skal leveres i trinn»
- **Problem og hvorfor det betyr noe:** Tilbakemeldingen på briefen ba om å dele V1 i trinn. PRD-en nevner trinn, men definerer dem ikke. For to personer er 18 FR med geofencing, sanntid, bildeopplasting, godkjenning og endring av publisert tur mye. Epics og stories trenger en rekkefølge for å vite hva som kuttes først.
- **Forslag:** Legg til en tabell i §6.1, for eksempel: *Trinn A: FR-1–4, 11–14 (generer, rediger, publiser, demo). Trinn B: FR-5, 6, 8 (geolåst rebus, poeng). Trinn C: FR-7, 9, 10, 15 (innsending, godkjenning, sanntid). Trinn D: FR-3 (regenerering), FR-16–18.* Skriv også én setning om hva som er minste leverbare versjon hvis tiden går ut.

### 4.2 Flere FR-er har konsekvenser som ikke kan testes
- **Alvorlighet:** høy
- **Hvor:** FR-3 «uten å påvirke andre poster uten grunn»; FR-7 «uten at appen krasjer»; FR-8 «basert på definert regelverk»; FR-10 «Tidsstempel eller oppdragsstatus skal være tydelig»
- **Problem og hvorfor det betyr noe:** Ord som «uten grunn», «tydelig» og «definert regelverk» kan ikke gjøres om til testtilfeller. FR-6 sier ikke hvor stor radius er, eller hva som skjer hvis deltakeren nekter GPS-tilgang eller posisjonen er unøyaktig.
- **Forslag:** Skriv om FR-7: *«Deltaker kan sende en tekstsvar eller ett bilde til en opplåst post. Bilder må være JPEG eller PNG og under 10 MB. Andre filer avvises med en feilmelding. Innsendingen får status «venter på godkjenning» og vises for arrangøren.»* For FR-6, legg til: *«Hvis deltakeren ikke har gitt posisjonstilgang, vises en melding og posten forblir låst.»* For FR-3: *«Når arrangøren endrer post X, er alle andre poster uendret (samme id og felt).»*

### 4.3 Lagtilordning mangler i reisene, og UJ-1 og FR-1 stemmer ikke helt
- **Alvorlighet:** medium
- **Hvor:** FR-8 «Lag skal kunne opprettes og tilordnes deltakere»; FR-14 (turkode og navn); UJ-1 «skriver en kort beskrivelse og publiserer. Systemet genererer første utkast»
- **Problem og hvorfor det betyr noe:** Ingen reise viser hvordan en deltaker havner på et lag (velger selv, eller arrangøren fordeler?). Det påvirker UX og datamodell. I UJ-1 skjer publisering før generering. UJ-1 lover også at systemet «ber om nærmere opplysninger», mens FR-1 bare krever en feilmelding.
- **Forslag:** Avgjør lagtilordning og legg det inn i FR-14 («Deltaker velger lag etter å ha skrevet turkode» eller «arrangøren fordeler»). Rett rekkefølgen i UJ-1. Gi UJ-ene navngitte hovedpersoner, f.eks. «Mari, som arrangerer en blåtur for 20 venner».

### 4.4 Krav for felt, KI-kostnad og personvern mangler
- **Alvorlighet:** medium
- **Hvor:** §2.1 «virker i praksis i felt»; §8.6 om bilder; ingen omtale av KI-kostnad
- **Problem og hvorfor det betyr noe:** Dårlig mobildekning i felt er sentralt for en geofencing-app, men har ingen krav. Ingen krav begrenser antall KI-kall (hvem betaler, hva hindrer at en arrangør regenererer hundre ganger?). Briefen bestemte at posisjon ikke lagres som historikk; det er ikke ført videre. Åpent spørsmål 6 om bilder er et godt flagg, men viser til «Epic 4» som ikke finnes i PRD-en.
- **Forslag:** Legg til tre korte krav, for eksempel: *«Deltakersiden viser sist lastede program og en «frakoblet»-melding når nettet mangler.»* *«Arrangør kan maksimalt gjøre 10 KI-kall per tur per dag; deretter vises en melding.»* *«Deltakerens posisjon sendes ikke til serveren og lagres ikke.»*

### 4.5 Suksessmål med svakheter
- **Alvorlighet:** medium
- **Hvor:** SM-3 «slik arrangøren har bekreftet det»; SM-C1/SM-C2; SM-8
- **Problem og hvorfor det betyr noe:** SM-3 er sirkulær (arrangøren bekrefter området, og testen sjekker mot det). SM-C1 og SM-C2 kan ikke måles, og sier ikke hvilket mål de balanserer. SM-6 «60 % beholdes» var kritisert i briefen og validerer egentlig FR-2, ikke FR-3.
- **Forslag:** Gjør SM-C1 til noe målbart, f.eks. *«Antall obligatoriske felt arrangøren må fylle ut før generering skal ikke overstige 5 (balanserer SM-1)».* Knytt SM-6 til FR-2.

## 5. Mekaniske funn

- **Glossar:** Mangler *Innsending* (sentral i FR-15), *Lag*, *Poeng*, *Turkode*, *Tema* og *geolåst/åpen post*. Drift: «Lagtavle / lederstavle» i glossaret mot «ledertavle» i FR-ene, «oppføring» mot «programpost», og «post», «rebuspost» og «oppgave» brukes om hverandre uten forklart forhold.
- **IDer:** FR-1–18 og SM-1–8 er komplette, men FR-16–18 står i §4.1 og FR-15 i §4.2, så rekkefølgen er rotete. Åpne spørsmål er nummerert 1–7 men delt i «Besluttet» og «Fortsatt åpent», så listen leses ikke i rekkefølge.
- **Assumptions:** Ingen `[ASSUMPTION]` står inline i §1–7, bare i indeksen. Tre indekspunkter er «bekreftet» og bør flyttes ut. «Geo-radien er noe fast definert» er uklar: er radius fast eller per post (FR-5)?
- **Språk:** «oppfølgingsspørsmålssvøm» (FR-1), «sammenhengt», «optimumsere», «Succesmålinger», «Assumsjonsindeks». Vision sier «på minutter», SM-1 sier «under 30 minutter».
- FR-16 har «Feature-specific NFRs» som gjelder hele §4.1, ikke temaet.

## 6. Før dere går videre

**Må avklares nå (før UX, arkitektur og epics):** trinnene i §6.1 (4.1), lagtilordning (4.3), radius fast eller per post, og konkrete konsekvenser for FR-6/7/8 (4.2).

**Kan vente:** testoppsett for sanntid (§8.4, før trinn C), personvern for bilder (§8.6, før bildefunksjonen bygges), glossar og språkrydding.

**Oppfølging av briefen: delvis.** Fulgt opp: QA-agent erstattet med regelbasert validering (FR-2, §8.5), seed-data og mock-modus (FR-11, FR-12), automatisk testbare KI-kriterier (SM-2, SM-3). Ikke fulgt opp fullt ut: å dele V1 i prioriterte trinn.

## 7. Refleksjonsspørsmål

1. FR-17 og FR-18 (endre en publisert tur, vis «Endret»-merke) ble lagt til etter den første versjonen. Hva sa KI-en at dette ville koste, og hvordan vurderte dere om to personer rekker det sammen med sanntid og godkjenning?
2. FR-ene bruker ord som «tydelig» og «uten grunn». Hvordan sjekket dere at KI-ens forslag til testbare konsekvenser faktisk kan bli tester, og hva ville dere endret i FR-3 nå?

_Vurdert mot kvalitetsrubrikken i bmad-prd. Dette er veiledning, ikke sensur._
