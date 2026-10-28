---
title: "Oppfølging av QA-rapport"
created: 2026-10-28
kilde: OpenAI_QA/QA-rapport.md (QA mot commit 255b93c)
---

# Oppfølging av QA-rapport

Notatet viser hvordan hvert funn i [OpenAI_QA/QA-rapport.md](../OpenAI_QA/QA-rapport.md) er vurdert og fulgt opp. Vurderingen er gjort uavhengig av rapporten: hvert funn er sjekket mot dokumentene det peker på. QA-filene er ikke endret.

**Oppsummert:** 15 av 16 funn er tatt til følge helt eller delvis. Ett (QA-15) er bare delvis fulgt opp, se begrunnelsen. Ingen funn ble vurdert som feil.

## Funn med høy prioritet

| Funn | Vurdering | Tiltak | Endret i |
|---|---|---|---|
| **QA-01** Story 3.1 bruker `participants` før tabellen finnes | Enig. Det var en reell avhengighet til en senere story. | `participants`, RLS og `join_trip` opprettes i Story 3.1. Story 3.4 oppretter bare `submissions`. Ellers ble det funnet og rettet to lignende avhengigheter: tilstanden «fullført» i Story 1.6 og sletteregelen i Story 2.7 brukte begge innsendinger før de finnes. | epics.md (1.6, 2.7, 3.1, 3.4) |
| **QA-02** Endring av poeng på en post endrer poeng lagene allerede har fått | Enig. | **Poengene fryses ved godkjenning:** `submissions.awarded_points` settes til postens poeng når innsendingen godkjennes. Endring av poeng, regenerering og deaktivering gjelder bare nye godkjenninger. Rapportens andre forslag, å låse poengene, ble valgt bort fordi arrangøren skal kunne justere turen underveis (FR-17). | AD-5, AD-13, PRD FR-15/FR-17, Story 3.5, 3.6, 5.1, løsningsbeskrivelsen |
| **QA-03** `VITE_`-regelen motsier AD-9 | Enig. Regelen kunne lede til at KI-nøkkelen havnet i klienten. | `VITE_` brukes bare for offentlig klientkonfigurasjon. Serverhemmeligheter finnes bare som Supabase-secrets i Edge Functions. Produksjonsbygget sjekkes for nøkler. | AD-9, konvensjoner, Story 1.1 og 2.4 |
| **QA-04** Det er ikke definert hvor lagring valideres på serveren | Enig. Validering i klienten og RLS var ikke nok. | Ny **AD-17**: klienter har bare lesetilgang til turtabellene. All lagring går gjennom Edge Function `save-trip`, som validerer og skriver i én transaksjon (`apply_trip_change`), med versjonskontroll (`VERSION_CONFLICT`) og `CHECK`-begrensninger. Sletting av poster med innsendinger stoppes i databasen med `ON DELETE RESTRICT`. | AD-2, AD-13, AD-17, ERD, Story 2.1, 2.4, 2.5, 2.7, 5.1, 5.3 |
| **QA-05** Validatoren godtar en tom dag, og antall poster har ingen fasit | Enig. | «Oppføring» betyr minst én programpost per dag. Validatoren avviser også dager som mangler, ligger utenfor perioden eller finnes to ganger. Nytt valgfritt nøkkelfelt **Antall poster** (`post_count`) gir fasit for antall poster. Briefen lover ikke lenger et antall per dag. | PRD FR-1/FR-2, AD-2, AD-15, brief, Story 1.2, 2.2, 2.3, UX |

## Funn med middels prioritet

| Funn | Vurdering | Tiltak |
|---|---|---|
| **QA-06** Områdekontrollen kan bli en kontroll mot KI-ens egen gjetning | Enig. | KI-en foreslår området, og arrangøren ser det som en sirkel og kan flytte og endre det før publisering. SM-3 måles mot området arrangøren har bekreftet. Demo-mocken sier tydelig at destinasjonen alltid er prøveturens. |
| **QA-07** Trinn B mangler godkjenning før poeng | Enig. | Planen har fått B.4 (bli med og automatisk lag) og B.6 (godkjenning). Lagtildelingen i C.1 er nå manuell flytting. Briefens trinn 2 inkluderer godkjenning. |
| **QA-08** Minimumsleveranse og full V1 blandes sammen | Enig. | PRD §6.0 definerer **minimumsleveransen som milepæl B (Epic 1–3)** og **full V1 som Epic 1–7**. Trinn A heter nå «første kjørbare versjon». Arkitekturen sier trinn A–E. Deploy kreves for full V1, fordi GPS på mobil krever HTTPS. |
| **QA-09** UX-dokumentene gir ulike svar | Enig. | Brytepunktet er 1024 px i begge dokumentene. Åpne poster virker selv om tilgang til posisjon er nektet. Det er ingen kø uten nett i V1: sendingen feiler med en tydelig melding, og svaret blir stående. Lagtildelingen er markert som besluttet. |
| **QA-10** Generering i bakgrunnen og angre mangler livsløp | Enig. | Siden må være åpen under generering, og knappen er låst, så dobbeltklikk ikke starter to genereringer. «Angre» ved godkjenning er en forsinket sending (5 s), så ingenting må omgjøres. `review_submission` er idempotent. Generering i bakgrunnen står under Deferred. |
| **QA-11** Ett felles «sist sett»-tidspunkt kan skjule endringer | Enig. Det var en reell logisk feil. | Sett-status per element (`seen[element_id]`) og `baseline_at` ved første innlasting. Å åpne ett element fjerner bare merket på det. Story 5.4 har fått tester for nettopp dette. |
| **QA-12** Målingene er ikke operasjonalisert | Enig. | SM-2 skiller aksepterte utkast (100 %) fra hvor ofte genereringen lykkes. Det rapporteres for første forsøk og etter nytt forsøk, og måles på ekte KI-output. SM-4 krever 100 % i deterministiske tester og over 80 % i felttest. SM-7 er definert som Largest Contentful Paint med Lighthouse og 4G-struping, median av 3. SM-6 måles bare på ekte KI-output. |
| **QA-13** Testplanen mangler negative tester for live-tilgang | Enig. | Negative akseptansekriterier er lagt inn i stories der reglene lages (2.1, 2.5, 3.1, 3.4, 3.5, 3.6, 4.4), og Story 7.4 har en tilgangstest med to arrangører og to turer. Det er også lagt inn grenser for filtype og filstørrelse, og regel for lik poengsum på ledertavlen. |

## Funn med lav prioritet

| Funn | Vurdering | Tiltak |
|---|---|---|
| **QA-14** Status og eierskap av dokumentene er ikke oppdatert | Enig. | TODO og README viser faktisk status, og README sier at `Leveranser/product-brief.md` er den gjeldende briefen. Merknadene i planen er markert som løst. PRD §8.1 lenker til arkitekturen. UX og arkitektur står fortsatt som `draft` til gruppen har godkjent dem. |
| **QA-15** Eksterne påstander mangler etterprøvbare kilder | Delvis enig. | Versjonene ble faktisk sjekket mot npm-registeret i økten, men resultatet ble ikke lagret. Story 1.1 krever nå ny sjekk og at `package-lock.json` committes. **Ikke rettet:** kildelenker i konkurrentanalysen. Det krever ny research, og analysen påvirker ikke implementeringen. |
| **QA-16** Linterens resultat er beskrevet som et pass | Enig. | Arkitekturens memlog har fått en korrigering: resultatet er `ok: false` med to vurderte, tilsiktede funn (`{trip_id}` og `{submission_id}`). Ny kjøring etter endringene ga de samme to funnene. |

## Beslutninger gruppen bør bekrefte

Disse valgene ble tatt for å få kontraktene konsistente. De kan endres før sprint planning:

1. **Poeng fryses ved godkjenning** (QA-02), i stedet for at poengene låses når en post har innsendinger.
2. **Nytt valgfritt felt «Antall poster»** i Ny tur (QA-05).
3. **Mål for SM-2:** minst 90 % vellykket generering etter ett nytt forsøk. Merket `[ASSUMPTION]`.
4. **Maks filstørrelse 15 MB** før komprimering, og formatene JPEG, PNG og WebP. Merket `[ASSUMPTION]`.
5. **Minimumsleveransen er milepæl B** (Epic 1–3).

## Fortsatt åpent

- Testoppsett for sanntid på eksamen (PRD §8.4) avgjøres før trinn C.
- Kildelenker i konkurrentanalysen (QA-15).
- Gruppen må gå gjennom og godkjenne UX og arkitektur før sprint planning.
