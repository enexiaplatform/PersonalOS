# P0.1 — Baseline and data-contract characterization

Status: **read-only characterization**. Baseline commit: `c1c8e829604585b76b6d796c0efc7f31710693ce`. This does not implement the proposed Today view, canonical decision selector, task creation, Notion write-back, database migration, or AI policy changes.

## Source ownership and read paths

| Source | Current projection | Ownership rule |
|---|---|---|
| Notion Weekly Planner | `personal_os_notion_weeks` → `model.mjs` | Source of weekly commitments and dated reports; snapshots are not proof of an external outcome |
| Notion-derived Calendar | `personal_os_calendar_weeks` → `calendar.mjs` | Source of visible schedule and task cards; same task may have a different *cached* status than the weekly read model |
| Proposed edits | Calendar Save → `request_calendar_edit` RPC → `personal_os_calendar_edits` | Save queues a pending request against the cached task ID and base payload. The app displays the queue status. Downstream Notion readback is required to confirm the source change. |
| Private observations | `personal_os_entries` | Activity, reflection and evidence require distinct semantics; don't infer task completion from a saved note |
| OneNote plans and progress assessments | `personal_os_year_plans` and `personal_os_progress_snapshots` | OneNote owns annual goals. Progress snapshots are separate, evidence-based assessments. |
| Separate business workspaces | `workspaces.mjs`, `personal_os_module_assets`, `personal_os_module_snapshots`, and `personal_os_enexia_snapshots` | The workspace gateway reads private assets and snapshots by owner where applicable. Enexia loads its interface from `enexia.html`. |

All real owner IDs, page IDs, source URLs, customer names, memory, and DB rows must stay outside this public repository. This branch contains synthetic examples only.

## Existing invariants (characterization, not new product guarantees)

- `model.mjs/canonicalWeeks` selects the latest revision per owner and page using `source_edited_at` or, when absent, `synced_at`. It emits a week only when exactly one page remains for that owner and week and its coverage is other than `conflict`.
- `model.mjs/uniqueItems` deduplicates within an owner and week by `source_id`, then `task_id`, then `key`, together with `occurred_on`. Legacy items without an ID use pillar and trimmed, NFC-normalized, lowercased text. Recurring observations on different dates remain distinct. Records with blank text, `kind: summary`, or `is_summary` are excluded.
- `model.mjs/dailyEvidence` requires an explicit `occurred_on` matching the selected day. It independently excludes `plan`, weekly scope, and `summary`, `must_win`, `risk`, and `stop` kinds. Inclusion does not itself establish completion.
- `calendar.mjs/fallbackTasks` derives readonly activity, outcome, and task cards and retains the first item for each `source_id || key`. The date is the first explicit in-week value among `planned_on`, `scheduled_on`, and `occurred_on`, or `null` when none qualifies.
- `calendar.mjs/createCalendar` reads owner-filtered Calendar rows and edit requests. An exact-week Calendar row takes precedence over the canonical Notion fallback, regardless of the Notion row's page or status. Calendar cards use the cached task's `id` and status.
- `workspaces.mjs/parseWorkspaceHash` resolves unknown modules to the home launcher and unknown personal views to Calendar. Legacy `personal/calendar`, `personal/overview`, and domain module hashes remain supported. Domain module subpaths are passed through to the workspace gateway.

## Explicit mismatches requiring P0.2 resolution

1. An activity can be reported_done in a newer Notion snapshot while the Calendar cache still says plan. **Do not silently overwrite either source or present a verified completion.**
2. A historically selected page may remain in Calendar while Notion's selected week has changed. Match page ID and task source identity before ranking; do not infer from title or date alone.
3. Notion's historical rhythm/habit checkboxes may be scheduling allocations rather than completion evidence.
4. Date precision matters. A task without an explicit date cannot be assigned to Monday or another day for convenience.
5. Do not equate `reported_done` to `verified_done`, a quote to a PO, or a saved note to a verified remote write.

## Existing capabilities and exports

- Planning includes Calendar's agenda and week board, the weekly overview, the source-backed Gantt timeline, and progress and annual goals views. Life and business views retain their own snapshots and filters.
- Review includes Notion history, weekly and monthly reflections, evidence, and decision logs. Settings includes source diagnostics and the personal JSON backup.
- Gantt exports filtered observations to CSV. Progress exports the selected checkpoint to JSON and its chart to SVG. The Settings JSON export includes selected-year source snapshots, entries and metrics, plus year-plan data, progress snapshots and settings. The Calendar edit queue and private workspace packages are outside its scope.
- The launcher links to Personal OS, Servicebio, Ventures, and Enexia. Existing AI Manager access and automation stay under their current controls.

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
