# Personal OS — Executive Cockpit V1

Private weekly/monthly reflection, evidence journal, decision log and opt-in advisor brief.

## Source of truth
OneNote **2027 Objectives** stays canonical. The app stores dated execution history only. Configure the OneNote URL under Settings. It does not write to OneNote or automatically send your data to AI.

## Backend (temporary shared project)
Uses existing Supabase project with **three new tables only**: public.personal_os_entries, public.personal_os_metrics, public.personal_os_settings. Each has row level security owner_id = auth.uid(); anon has no table grants. No legacy Memoire, Helm or other schema changes.

## Deployment
Static frontend (index.html, styles.css, app.js, config.js) in this folder. Link a Vercel project with rootDirectory apps/personal-os-v1. No server-side service role secrets. Client uses a Supabase **publishable** key designed for public browsers; never substitute service-role key.

## Notes
- Auth is shared with the Supabase project. Use an existing approved account or the email signup workflow if allowed.
- Confidential employer and client information should not be entered.
- Backup via Settings → Download. Cross-device data remains in RLS-protected Supabase tables.
- No fabricated progress percentages. Metrics appear only after users enter real values.
- Reconsider a dedicated database when the app grows or stores more sensitive personal information.
