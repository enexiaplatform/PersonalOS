# Personal OS Memory Engine

Memory v1 (2026-11-01) extends the existing controlled Level B AI Manager. Supabase owns the memory independently of Manus. No profile values or credentials are committed to this repository.

## Behavior

- Core: long-term user-confirmed goals, preferences and operating principles. Pending or conflicting statements are excluded from AI context. Private source references, versions, optional expiry and explicit external-sharing flags accompany each record.
- Working: deterministic compact projections of the three latest Notion week snapshots, current-year OneNote-derived plan and the three domain mirrors. These remain snapshots, not live connectors. Servicebio retains section metadata only; no pipeline, pricing or customer content is extracted into provider context.
- Decisions: existing action events record actual user choices. Saving a review is not approval of its advice, and dismissal is not a permanent preference. Prior completed runs are retrieved only in the same domain and only when created by the new safe-context pipeline; they remain labeled AI analysis, not facts.
- Retrieval: active domain plus global core, relevant bounded working summaries, up to three earlier analyses and eight actual decisions. Budget is 12,000 JSON characters before source metadata. Context manifests persist selected IDs, versions, hashes and character count for each run.
- Extraction: up to three structured model candidates become private pending proposals. They never auto-confirm, overwrite an existing pending proposal, grant permissions or execute source writes. The user can accept/reject and revise them.

## Incremental refresh

On AI Manager open, explicit source check and before a new analysis, read source metadata. Read full payload only when its signature differs from the persisted working signature. Unchanged sources cause no working-memory write. A failed working write is retryable even when its source record was already saved. Refreshing memory does not call Manus.

Week summaries expire at the end of the relevant Vietnam week; module summaries after 48 hours; annual snapshots after 30 days. Expired data is flagged and its task detail is withheld. Source freshness and working expiry are distinct signals. OneNote plan values remain internal in v1; the provider sees annual source metadata, while confirmed shareable goals come from Core.

## Privacy and data boundaries

All four memory tables use owner-based RLS. Unauthenticated roles have no table access. Source references use composite owner/source foreign keys. The edit RPC is SECURITY INVOKER, takes an expected version, locks the record, applies a single atomic edit and relies on an append-only audit trigger. Its private SECURITY DEFINER trigger is not an exposed API function and has no user EXECUTE privilege.

Restricted memories and Servicebio memories cannot be shared. Other memories require an explicit per-record sharing choice. The separate existing task-detail opt-in now includes only learning, health, creative and relationship items; career/commercial and finance tasks are excluded. Manus gets no write credentials or connectors. Remembered text never changes backend authorization.

`Ngừng sử dụng` archives a record; `Khôi phục` restores its value without restoring sharing. Revision history is preserved. This is not a GDPR erasure workflow.

## UI

AI Manager → Bộ nhớ shows core, working, decisions and revision history. Users can filter by domain, refresh source projections, add proposals, accept/reject conflicts, edit confirmed values, archive/restore and control sharing. The tab is full width and hides the analysis composer. Auth changes clear private memory state.

## Schema and deployment

Canonical schema: `apps/personal-os-v1/sql/ai-memory.sql`. Live migrations: `personal_os_memory_engine`, `personal_os_memory_explicit_sharing`. Existing `personal_os_ai_runs` receives a context_manifest column. Existing action and decision tables are reused.

API operations: GET memory; POST memory_refresh, memory_propose, memory_edit. All share the existing owner-verified JWT gate. Every core edit and working write has a separate database readback. AI completion is persisted after proposals/queue writes, so failed extraction is retryable.

No new scheduler, subscription, vector store or privileged source connector is introduced. Notion/OneNote refresh still depends on the existing import workflow. No UI/schema self-modification, unattended Manus task generation, or Notion writeback is enabled by this change.

## Validation

Run `node --experimental-vm-modules --test tests/*.test.mjs`. New behavior tests cover private/expired/conflicting memory exclusion, source status fidelity, commercial filtering, character budgets, safe-history semantics, incremental refresh, pending/conflict preservation and API create → poll → next-run retrieval with a mocked Manus provider. Live SQL rollback tests exercise real owner isolation, approval/sharing, audit retention and stale-write rejection without leaving fixtures behind.

A READY deployment verifies distribution only. Verify the authenticated Memory tab and source refresh on production; explicitly distinguish any live Manus run from the mocked provider tests.
