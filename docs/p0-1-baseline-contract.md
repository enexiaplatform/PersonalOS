# P0.1 — Baseline and data-contract characterization

Status: **read-only characterization**. Baseline commit: `c1c8e829604585b76b6d796c0efc7f31710693ce`. This does not implement the proposed Today view, canonical decision selector, task creation, Notion write-back, database migration, or AI policy changes.

## Source ownership and read paths

| Source | Current projection | Ownership rule |
|---|---|---|
| Notion Weekly Planner | `personal_os_notion_weeks` → `model.mjs` | Source of weekly commitments and dated reports; snapshots are not proof of an external outcome |
| Notion-derived Calendar | `personal_os_calendar_weeks` → `calendar.mjs` | Source of visible schedule and task cards; same task may have a different *cached* status than the weekly read model |
| Proposed edits | `personal_os_calendar_edits` → `request_calendar_edit` RPC | Pending request is not a confirmed Notion change; an `applied` label requires downstream source verification |
| Private observations | `personal_os_entries` | Activity, reflection and evidence require distinct semantics; don't infer task completion from a saved note |
| OneNote plans | `personal_os_year_plans` and `personal_os_progress_snapshots` | Annual goals and evidence-based checkpoints; no inferred advancement |
| Separate business workspaces | `workspaces.mjs` and existing module assets | Preserve private module access and deep links, not data copied into a public fixture |

All real owner IDs, page IDs, source URLs, customer names, memory, and DB rows must stay outside this public repository. This branch contains synthetic examples only.

## Existing invariants (characterization, not new product guarantees)

- `model.mjs/canonicalWeeks`: deduplicates revisions of the **same page**, excludes unresolved weeks that contain distinct active pages and excludes coverage=`conflict`.
- `model.mjs/uniqueItems`: deduplicates by explicit identity + date; recurring observations on different dates remain distinct; summaries are excluded.
- `model.mjs/dailyEvidence`: excludes undated, plan-only and weekly scope summary/must-win/risk/stop records.
- `calendar.mjs/fallbackTasks`: derives readonly calendar items from a week's activity/outcome/task entries; absent dates stay absent.
- `calendar.mjs/createCalendar`: reads owner-filtered calendar rows and edit queue; a Save submits an edit request, not a completed Notion write.
- `workspaces.mjs/parseWorkspaceHash`: unknown hashes resolve to the home launcher; legacy `personal/calendar`, `personal/overview` and domain modules remain supported.

## Explicit mismatches requiring P0.2 resolution

1. An activity can be reported_done in a newer Notion snapshot while the Calendar cache still says plan. **Do not silently overwrite either source or present a verified completion.**
2. A historically selected page may remain in Calendar while Notion's selected week has changed. Match page ID and task source identity before ranking; do not infer from title or date alone.
3. Notion's historical rhythm/habit checkboxes may be scheduling allocations rather than completion evidence.
4. Date precision matters. A task without an explicit date cannot be assigned to Monday or another day for convenience.
5. Do not equate `reported_done` to `verified_done`, a quote to a PO, or a saved note to a verified remote write.

## Compatibility / preservation checklist

- [ ] Compare current `main` SHA before implementation; rebase/review if changed.
- [ ] Run `node --check apps/personal-os-v1/app.js`.
- [ ] Run `node --experimental-vm-modules --test tests/*.test.mjs`.
- [ ] Run `node --experimental-vm-modules --test tests/baseline-contract.test.mjs`.
- [ ] Confirm `tests/baseline-contract.test.mjs` has no network, secrets, provider writes or private customer fixtures.
- [ ] Enumerate/retain legacy hashes: home, personal/calendar, personal/overview, personal/gantt, personal/progress, personal/life, personal/business, personal/blueprint, personal/review, personal/notion, personal/weekly, personal/monthly, personal/evidence, personal/decision, personal/settings, servicebio, ventures, enexia.
- [ ] Do not change database schema, RLS, automation prompts, user-facing navigation or module data in P0.1.

## Follow-up for PR 2 (not authorized here)

Specify a **read-only** canonical decision projection using explicit (owner, provider, container, source-item) identity, observed revision/fetch time, coverage, conflicts, assertion kind and status. Run it in shadow against existing calendar and weekly views; compare only matching identities and scope. Require explicit approval before new selectors, schema mutations or write-back are enabled.

## Verification evidence requirements

A passing source-level unit test establishes only synthetic contract behavior. It does **not** establish that production auth, private RLS, Notion source readback, browser layout or end-to-end queues function correctly. CI results and commit SHA must be recorded in PR review; unrun tests stay unverified.

Source handoff: Astra's private design package, `04-MIGRATION.md` P0.1. The package itself is intentionally not committed: it includes prototype/visual assets and review material outside this scoped characterization.
