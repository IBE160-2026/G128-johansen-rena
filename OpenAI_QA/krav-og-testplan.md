# Kravsporbarhet og videre testplan

Dato: 28. oktober 2026. **Alle apptester nedenfor er planlagt, ikke kjørt.** Story-referansene viser hvor funksjonen er beskrevet, ikke at den er implementert eller fullt dekket.

## Funksjonelle krav

| PRD-krav | Stories | Viktigste verifikasjon |
|---|---|---|
| FR-1 Input | 2.2 | Påkrevde felt, datoorden, positive heltall, lag 1–6 og ikke flere enn deltakere; nøyaktig tekstgrense må velges |
| FR-2 Generering | 1.2, 2.3, 2.4 | Gyldig skjema, komplett periode med innhold, riktig input; ugyldig JSON, ett retry og sluttfeil |
| FR-3 Redigering/regenerering | 2.5, 6.1, 6.2 | Bare valgt element endres; avvist forslag bevarer gammel tur; samtidige endringer avklares |
| FR-4 Publisering | 2.7 | Eksplisitt bekreftelse, unik kode, ugyldig utkast avvist også ved direktekall |
| FR-5 Poster | 1.2, 2.5 | Koordinatgrenser, bekreftet område, positiv radius, åpne og geolåste poster |
| FR-6 Opplåsing | 3.2, 3.3 | Inne, på og utenfor grensen; nektet/utdatert posisjon; åpne poster virker uten GPS |
| FR-7 Svar/bilde | 3.4, 4.4 | Riktig tur/post/lag, tekst/foto etter type, pending-kvittering, opplastingsfeil |
| FR-8 Lag/poeng | 3.1, 3.6, 4.1 | Automatisk tildeling og manuell flytting; avvis ugyldige regler; maks én poengtelling per lag/post |
| FR-9 Sanntidspoeng | 4.3 | To klienter, målt godkjenning til synlig sum ≤5 s; hent igjen etter brudd/fokus |
| FR-10 Ledertavle | 4.2, 4.3 | Riktig rangering og eget lag; lik poengsum trenger en definert rangeringsregel |
| FR-11 Seed | 1.1, 1.3 | Ren klone, gyldig prøvetur, gjenoppstart og tilbakestilling uten nøkler |
| FR-12 Mock | 1.4, 2.3 | Rollevalg, vellykket/feilet generering uten eksterne kontoer; begrenset destinasjonsstøtte må avklares |
| FR-13 Arrangør | 2.1 | Egen tur kan endres; annen arrangørs tur og godkjennings-RPC avvises |
| FR-14 Deltaker | 3.1 | Kode/navn, feil kode, upublisert tur, bevart sesjon og isolasjon mellom turer |
| FR-15 Godkjenning | 3.5, 3.6 | Bare eier godkjenner; pending/rejected gir 0; dobbeltkall, ny innsending og angre avklares/testes |
| FR-16 Tema | 2.4, 2.6 | Samme enum i skjema og UI, fallback og faktisk kontrast for tillatte fargepar |
| FR-17 Live-redigering | 5.1–5.3, 6.3 | Gyldig endring, atomisk avvisning, deaktivert post avviser innsendinger, opptjente poeng etter valgt regel |
| FR-18 Endringsvisning | 5.4 | To klienter ≤5 s, nye/endrede/deaktiverte poster, separat sett-status for flere endringer |

## Prioriterte testtilfeller

| ID | Nivå | Oppsett og handling | Forventet resultat |
|---|---|---|---|
| T-01 | Domene | Manglende, duplisert eller ekstra dato; en dag uten innhold | Avvisning etter presisert datokontrakt (QA-05) |
| T-02 | Domene | Kjente koordinater ved radius−ε, radius og radius+ε | Alle deterministiske utfall riktige; grense er inkludert |
| T-03 | Domene | Negativ radius/poeng, NaN, ugyldige koordinater og post utenfor området | Konkrete valideringsfeil |
| T-04 | Domene + SQL | Pending, rejected og flere approved per lag/post; lag uten innsendinger | Identiske summer i TypeScript og SQL; ingen dobbelttelling |
| T-05 | Integrasjon | Endre poeng/oppgave etter godkjenning, deaktiver og reaktiver | Historikk følger avklart regel (QA-02) |
| T-06 | Agent | Ugyldig JSON først, gyldig deretter; begge ugyldige | Maks to kall; sluttfeil er tydelig og ingen ugyldig tur lagres |
| T-07 | Agent | Timeout, leverandørfeil, dobbeltklikk og avbrutt side | Ingen ukontrollert retry eller duplikat; tekst bevares; jobbkontrakt må avklares |
| T-08 | Migrasjon | Ren database frem til Story 3.1 | `join_trip` virker uten senere migrasjoner (QA-01) |
| T-09 | Live-tilgang | To turer og to arrangører; direkte les/skriv mot fremmed tur og poengview | Ingen data eller skriverett på fremmed tur |
| T-10 | Live-tilgang | Deltaker sender fremmed post_id/team_id, setter approved eller kaller review | Avvisning på autoritativ grense |
| T-11 | Live-tilgang | Direkte ugyldig endring/sletting/publisering og feil midt i lagring | Avvisning og ingen delvis endret tur (QA-04) |
| T-12 | Storage | Tilgang til annen turs fil, ugyldig fil, for stor fil, feilet opplasting | Avvisning; egne tillatte bilder kan vises; ingen falsk sendt-kvittering |
| T-13 | E2E demo | Ren oppstart → prompt → utkast → rediger → publiser → deltaker i ny fane → simulator → svar → godkjenn | Hele kjerneflyten virker uten kontoer/nøkler |
| T-14 | E2E live | Samme flyt med reell generering og to adskilte klienter | Database, Auth, Storage og Realtime virker sammen; demo alene teller ikke |
| T-15 | Sanntid | Godkjenn, mist signal, gjenopprett fokus/forbindelse | Samme poeng hos begge klienter; oppdatering og gjeninnhenting måles |
| T-16 | Sanntid | Endre to elementer; åpne bare ett; endre et tredje mens banner lukkes | Ingen ulest endring skjules ved et uhell |
| T-17 | Felt | Nekt GPS, trekk tilbake tillatelse, dårlig posisjon, forlat Kart/Post, mist nett | Åpne poster virker; sporing stopper; ingen posisjon lagres/sendes; ingen udokumentert offline-kø |
| T-18 | Tilgjengelighet | Tastatur, synlig fokus, skjermleserstatus, redusert bevegelse, 360/430/768/1024 px | Definerte etiketter, tekst+ikon, 48 px handlinger, entydig responsiv layout |
| T-19 | Bygg/konfig | Produksjonsbygg og separat serverkonfigurasjon | Ingen KI-hemmelighet i klientartefakter; reproduserbart bygg med låsefil |
| T-20 | Brukbarhet/ytelse | 2–3 turer, en person uten teknisk bakgrunn, definert mobil/nettprofil | Råmålinger og observasjoner lagres; feil og assistanse telles |

## Suksessmålinger

| Mål | Nødvendig protokoll | Status |
|---|---|---|
| SM-1 <30 min | Start ved innsending av prompt; stopp ved åpnet publisert deltakerside. Noter redigering, feil og hjelp per tur | Ikke målt |
| SM-2 gyldig JSON | Tell første forsøk, etter retry og aksepterte utkast separat. Aksepterte utkast skal alltid validere | Ikke målt |
| SM-3 poster innenfor område | Bruk bekreftet område, og dokumenter hvor område-/destinasjonsfasiten kommer fra | Ikke målt |
| SM-4 geofencing | 100 % på deterministiske tester. Definer separat feltprotokoll med enheter, nøyaktighet og falsk opplåsing | Ikke målt |
| SM-5 ≤5 s | Mål fra godkjenning bekreftet ved kilden til korrekt sum vises i annen klient; dokumenter nett og antall forsøk | Ikke målt |
| SM-6 >60 % beholdt | Ekte KI-genererte poster; antall beholdt/antall foreslått, med tester, destinasjon og begrunnelse for endringer | Ikke målt |
| SM-7 <3 s | Velg målepunkt, f.eks. synlig og brukbart program; spesifiser kald/varm cache, enhet, kart og nettprofil | Ikke målt |
| SM-8 demo uten konto | Ren klone og dokumenterte kommandoer; ingen tjenestenøkler. Avklar om eksterne kartfliser krever nett | Ikke kjørebart ennå |

For hvert kjørt tilfelle bør resultatet inneholde dato, commit, modus, oppsett, forventet/faktisk resultat og vedlegg eller testrapport. En bestått demo verifiserer ikke live-RLS, fysisk GPS eller kvaliteten på ekte KI-generering.
