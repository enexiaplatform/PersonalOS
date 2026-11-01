# Personal OS AI Manager — Controlled Autonomy (Level B)

Updated 2026-11-01. Live project `henry-personal-os`; source `apps/personal-os-v1`.

## UX
The previous fixed-height popup was replaced with a large responsive Command Center. Four tabs: Tổng quan, Hành động, Lịch sử, Quyền & dữ liệu. It shows structured Executive Brief (when Manus returns structured output), top three priorities, risks and action proposals. Legacy raw Markdown is rendered as safe text headings and lists. The desktop side rail shows Action Queue; mobile uses the Hành động tab.

## Automation contract
- **When AI Manager opens:** a deterministic source audit runs against the Supabase Notion snapshot, at zero Manus credits. It checks the active week, source conflicts/partial coverage, source freshness (>48 h), and explicitly blocked activity/outcome records. It does **not** classify unchecked template tasks as done or create KPIs.
- **On user request:** Manus v2 task.create runs asynchronously with `structured_output_schema` and `clear_connectors:true`; prompts contain source metadata and status counts only by default. Detailed Personal Planner items require a separate, explicit checkbox (max 25, restricted to Personal OS). Servicebio commercial content is not sent.
- **On Manus completion:** server validates structured suggestions and writes proposals to `personal_os_ai_actions` idempotently. No untrusted model response can issue a direct database or Notion write.
- **On explicit approval:** the `save_review_note` action creates a private `personal_os_entries` decision log with a dedupe marker, then reads it back. Status becomes `executed` only after verification. This does NOT update the weekly source of truth.
- **On dismiss:** the action status is updated with readback; an append-only event records the decision.
- **No background schedule added.** Automated monitoring is on dashboard open. Unattended cross-system operations require a verified scheduler/connector and explicit approval.

## Database
`personal_os_ai_runs`, `personal_os_ai_actions`, `personal_os_ai_events` in the same Supabase project. RLS restricts authenticated reads and writes to owner_id. Sequence privilege and indices are configured. SQL is versioned in `apps/personal-os-v1/sql/ai-manager.sql`.

## Manus API security
The API key must remain a server-only encrypted Vercel environment variable named `MANUS_API_KEY`. Never paste it in Git, browser code, screenshots or chat. The key originally shared in chat must be rotated. Existing key availability is not proof of a successful live run. The cost of a Manus task is charged according to Manus credits; UI audits without Manus are free of those credits.

## Still NOT enabled
- Notion writeback, task status edits, calendar/date changes, external email/contact.
- Servicebio/ventures source edits and any privileged external integrations.
- Unattended Manus task creation or a fixed schedule.
- A production rollback policy for source writes.

## Validation
- Vercel deployment READY = source deployed, not proof of successful end-to-end task execution.
- Check `node --check apps/personal-os-v1/api/ai-manager.js` and `node --check apps/personal-os-v1/ai-manager.mjs`.
- Run `node --experimental-vm-modules --test tests/*.test.mjs` from the repository root.
- Test after logging into the actual web UI: auto source scan; Manus structured task; queue population; one explicitly approved journal write; readback in private journal; dismissal and activity history; mobile resizing; unauthorized API request denied; sensitive data opt-in remains off.
- If a Vercel runtime call fails, examine deployment function logs. Do not assume success because the frontend rendered.

## Persistent memory
Memory Engine v1 now adds Core, Working and Decision retrieval to Manus task creation, plus a private Bộ nhớ tab. See [ai-memory-engine.md](ai-memory-engine.md) for boundaries, schema, incremental refresh and validation. User profile values are stored only in private database rows.
