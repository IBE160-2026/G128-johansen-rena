# Working agreement for Codex, Claude and human contributors

## Current scope

This repository is **TripBuilder AI**: one app for generator, organiser and participant, built on the Blåtur template (revised architecture: `planning-artifacts/architecture/`). Trips are addressed by slug under `/t/:slug`, and a user can be a member of several trips. Preserve a complete working demo (no keys needed) while adding features. Stories are in `planning-artifacts/epics.md`.

## Architecture rules

- React/Vite, JavaScript and plain CSS are intentional choices. Do not introduce a new framework without discussion.
- The page components in `src/pages/` render state and call actions; database calls belong in `src/lib/api.js` and central actions in `src/context/TripContext.jsx`.
- Data objects must use the SQL columns in `supabase/migrations/`. Do not duplicate magic status values or calculate leaderboard points independently in components.
- Every production data write needs a matching RLS rule. Never trust a UI-only administrator check.
- No plaintext passwords or admin secrets in the frontend. Never commit `.env` or production API keys.
- Keep the new schema and old Blåtur production database separate.
- When changing database structure, add a new migration rather than editing a migration already deployed.

## Product rules

- Core modules: Home, Program, Rebus/teams/leaderboard with **required photo evidence**, Gallery, Organizer panel.
- Preserve the warm dark-brown/copper/cream editorial look while improving accessibility.
- All participant interactions must work on a narrow phone screen.
- Keep the no-credentials demo mode functional; this is essential for demos and review.
- GPS unlock happens in the client only (AD-6): position is never sent to or stored on the server, and the organiser's approval is the integrity control. Do not add server-side GPS validation.
- Rebus submissions are image-first: every new submission needs a photo, and the organizer must see it before approving points. Preserve this flow in demo and Supabase modes.
- Do not add AI-generated source files per trip; trips are structured data (validated `TripDraft`) rendered by reusable components.

## Definition of done

1. `npm test` passes.
2. `npm run build` succeeds.
3. Manually test mobile Home → Program → Rebus → submission → organizer approval → leaderboard → Gallery.
4. For database/security changes, test with distinct participant and organizer sessions in a disposable Supabase project.
5. Document any deferred work or intentional scope change in the README.

## Team workflow

- Prefer dedicated Git branches for concurrent changes.
- Keep PRs focused, review security changes before merging.
- Claude may focus on visual iteration; Codex on integration, schema, tests and security, but both should review shared interfaces.
