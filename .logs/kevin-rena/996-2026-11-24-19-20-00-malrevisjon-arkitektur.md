# Malrevisjon av arkitekturen

## 2026-11-24 kl. 19:20 — Kevin Renå

### Oppgave
Gå gjennom blåtur-malen (`template_trip/`) mot arkitekturspinen og epics, og foreslå endringer. Kevin besluttet: beholde malens stakk, godta RLS (ikke `save-trip`), og lage én app.

### Plan
- Sammenligne malen med spinen (basert på [Stians gjennomgang](../stian-knoll-skole/998-2026-11-11-22-19-11-blatur-mal-gjennomgang.md)).
- Skrive beslutningene inn i spinen, epics og berørte dokumenter.

### Resultat
Ukommitterte endringer i `planning-artifacts/`:
- `ARCHITECTURE-SPINE.md`: revisjonsmerknad, nytt paradigme (ren kjerne i `src/lib/` og `api.js` som eneste datagrense), AD-1, 2, 4–17 tilpasset, AD-17 erstattet (RLS og CHECK, siste skriving vinner), malens tabellnavn (`checkpoints`, `trip_members`), ny stakk (JS, vanlig CSS, `node:test`), nytt kildetre, Deferred oppdatert.
- `epics.md`: tilleggskrav og stories 1.1, 1.2, 2.1, 2.4–2.7, 3.1, 3.5, 5.1, 6.x, 7.1 og 7.4 justert.
- `LOSNINGSBESKRIVELSE.md`, `EXPERIENCE.md`, `gjennomforingsplan.md`, `prd.md` (én AD-referanse): stakk og AD-17.
- Ingen kode i `template_trip/` er endret.

### Åpne punkter
- Gruppen må godkjenne revisjonen (spinen var `final`).
- Svartyper mot malens påkrevde bilde.
- Playwright eller manuell testprotokoll (Story 7.1).
- `technology.md` handler om et annet nettsted.
- Brief, PRD-addendum og `proposal.md` nevner fortsatt Tailwind.
