# Gjennomføringsplan

## 2026-10-28 kl. 19:19 — Kevin Renå

### Oppgave
Hente siste versjon fra GitHub, lese product brief og lage en steg-for-steg-plan slik at gruppen kan gjennomføre prosjektet trinnvis. Deretter gjennomføre fase 0 (planlegging) etter BMAD, på rask vei, og pushe.

### Plan
- `git pull` (fast-forward 3f79b56 → 5ecf0d1).
- Leste `Leveranser/product-brief.md`, PRD-en, tilbakemeldingen og `TODO.md`.
- Skrev planen i [planning-artifacts/gjennomforingsplan.md](../../planning-artifacts/gjennomforingsplan.md).
- Fase 0 med BMAD-skillene `bmad-prd` (0.1), `bmad-product-brief` (0.2), `bmad-ux` (0.3), `bmad-architecture` (0.4) og `bmad-create-epics-and-stories` (0.5). Hver har en `.memlog.md` i sin arbeidsmappe.

### Resultat
- Commit `11bd4df` (planleggingsarbeidet).
- `planning-artifacts/gjennomforingsplan.md`: fase 0–2 og trinn A–E. Trinn D er endringer underveis, og trinn E er regenerering.
- PRD-en: beslutningene i §8 (arrangørkonto og turkode, godkjenning før poeng, kun regelbasert validering, datamodell utsatt til arkitektur). Nye krav FR-13 til FR-18 og UJ-5. FR-1 har fått nøkkelfelt i tillegg til fritekst, FR-5 har `requires_location`, og FR-16 gir tema per tur. Skjult destinasjon er satt utenfor V1.
- Briefen (`Leveranser/` og planleggingskopien): rettet fire inkonsistenser, synket med PRD-en, og sier nå at turen ikke er låst etter publisering. Addendumet sier at OpenAI-QA er utsatt.
- UX: `planning-artifacts/ux-designs/ux-G128-johansen-rena-2026-10-28/` med DESIGN.md og EXPERIENCE.md, laget på rask vei (draft, `[ASSUMPTION]`-merker).
- Arkitektur: `planning-artifacts/architecture/architecture-G128-johansen-rena-2026-10-28/` med ARCHITECTURE-SPINE.md (ports & adapters, AD-1 til AD-16, KI i Supabase Edge Function, TypeScript) og LOSNINGSBESKRIVELSE.md.
- `planning-artifacts/epics.md`: 7 epics og 34 stories. Alle FR, NFR og UX-DR er dekket, og sluttvalideringen er bestått.

### Åpne punkter
- Sprint planning (steg 0.6, `bmad-sprint-planning`) er ikke kjørt.
- UX og arkitektur står som draft med `[ASSUMPTION]`-merker som gruppen må gå gjennom. Det gjelder blant annet utseendet på deaktiverte poster.
- Blåtur-malen skal lastes opp. Deretter skal arkitekturspinen oppdateres (`bmad-architecture`, Update).
- Testoppsett for sanntid (PRD §8.4) må avgjøres før trinn C.

## 2026-10-28 kl. 21:03 — Kevin Renå

### Oppgave
Kjøre steg 0.6, sprint planning (`bmad-sprint-planning`), som avslutter fase 0.

### Plan
- Readiness-kontroll mot PRD, arkitektur (final), UX (draft) og epics.
- Generering av `implementation-artifacts/sprint-status.yaml`.

### Resultat
- Readiness-kontrollen ga **CONCERNS**, og gruppen valgte å fortsette. Funnene er ført som 4 åpne `action_items` i sprint-status: blåtur-mal og navigasjon (Story 1.5), farger, personvern for bilder (før 4.4) og testoppsett for sanntid (før 4.3).
- `sprint_plan.py` kunne ikke kjøres, fordi den krever Python ≥ 3.10 og `ruamel.yaml`, og maskinen har 3.9 uten `uv`. Fila ble derfor laget med en reserveløsning som bruker skriptets egne regex, slug-regel og header. Den har 7 epics, 34 stories (alle `backlog`) og 7 retrospektiver, og den er YAML-validert med Ruby.
- Gjennomføringsplanen, TODO og README viser at fase 0 er ferdig.

### Åpne punkter
- Installer `uv` (for eksempel `brew install uv`), slik at BMAD-skriptene kan kjøres som tenkt, og kjør deretter `bmad-sprint-planning` (validate) for å sjekke fila deterministisk.
