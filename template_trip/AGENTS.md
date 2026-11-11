# Working agreement for Codex, Claude and human contributors

## Current scope

This repository is the **clean single-trip Blåtur v1**, not the TripBuilder AI multi-trip generator. Preserve a complete working demo before adding abstractions or AI-generated pages. The first goal is a stable event app for a trip organiser and participants.

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
- Do not claim that GPS is verified: this version has a map but no server-side geofence.
- Rebus submissions are image-first: every new submission needs a photo, and the organizer must see it before approving points. Preserve this flow in demo and Supabase modes.
- Do not add AI-generated source files per trip; the future system will use structured configuration and reusable components.

## Definition of done

1. `npm test` passes.
2. `npm run build` succeeds.
3. Manually test mobile Home → Program → Rebus → submission → organizer approval → leaderboard → Gallery.
4. For database/security changes, test with distinct participant and organizer sessions in a disposable Supabase project.
5. Document any deferred work or intentional scope change in README.

## Team workflow

- Prefer dedicated Git branches for concurrent changes.
- Keep PRs focused, review security changes before merging.
- Claude may focus on visual iteration; Codex on integration, schema, tests and security, but both should review shared interfaces.
