# Henry Personal OS

Private, Vietnamese personal operating dashboard. The existing static app and Supabase authentication are retained; no database migration or new background scheduler is needed.

## Source ownership

- **Notion Weekly Planner:** weekly execution, selected outcomes, decisions to defer, and Daily Activity Log. Find each week's real page; never treat a fixed page URL as permanent.
- **OneNote:** annual objectives. 2026 retains eight axes; 2027 retains seven. No inferred KPI percentages or cross-year attainment.
- **Dashboard:** read-only Notion rollup, with private reflection/evidence/decision forms in the existing entries tables. It never writes back to Notion or OneNote.

## Views

1. Week: at most three explicit Must-Win outcomes, three blockers, seven-day view, and stop/defer.
2. Life: dated check-ins, learning, health, finance, relationships. Missing records are shown as missing, never failed habits.
3. Business: research and validation separated from sales outcomes and parked work.
4. Annual goals: existing OneNote references, quarterly commitments and source evidence.
5. Reviews: private reflection, evidence, decision journal and Notion history.
6. Sources/settings: snapshot freshness, partial coverage, conflicts and JSON backup.

## Daily / weekly contract

`personal_os_notion_weeks` remains one snapshot per `(owner_id,page_id)`. Both existing automations update that same row. Items contain a stable `key` (or `source_id`/`task_id`), `pillar`, `status`, `text`, `source_url`, and optional `occurred_on`.

- `kind: must_win | risk | stop`, `scope: weekly`: planning context, excluded from activity counts.
- `kind: activity | outcome`, `occurred_on: YYYY-MM-DD`: actual dated source record.
- `kind: summary`: excluded from rollups. Weekly summaries do not create additional daily outcomes.
- Status: `plan / doing / blocked / reported_done / verified_done / unknown`.
- Habit schedule checkboxes and YES/NO templates are not completion evidence.
- Latest same-page snapshot wins; distinct pages for the same owner/week are excluded until resolved. Exact source identity/day deduplicates repeated records. Semantic similarity alone does not establish identity.

Snapshots missing daily dates stay in source history; the UI does not fabricate daily history. Daily view places each log in its pillar or the other-records section once. No KPI or session totals are added.

When open, the dashboard re-reads Supabase every 60 seconds, except while editing inputs. This does **not** fetch Notion or create an unattended background sync. Check-in and weekly automation execution still depend on connector access and successful readback. Always display partial/failure states honestly.

## Authentication / deployment

The existing Supabase publishable key is browser-safe. Never substitute a service-role secret. All private tables remain protected by owner RLS. Vercel project root: `apps/personal-os-v1`; framework: static, no build/install command. Existing deployment audience and auth protections are preserved.

Run checks from repository root:

```sh
node --check apps/personal-os-v1/app.js
node --experimental-vm-modules --test tests/*.test.mjs
```

Renderer tests use a synthetic SDK and data, not production authentication. Visual browser QA must be recorded separately from these tests.


### Gantt Pro

Read-only quarterly timeline and gap review. `gantt.mjs` adapts the same canonical Notion snapshots as the weekly dashboard; `gantt-view.mjs` renders the frozen task grid, calendar, source coverage and comparison matrix. There are no additional API credentials or scheduling dependencies.

- Exact `occurred_on` dates render as observations; explicit `actual_start/end` or `planned_start/end` pairs render as spans. Missing dates stay a week-scope interval, never an inferred duration or deadline.
- OneNote quarter text renders as a quarter window, not task progress. Q1–Q3 source text may combine plans and history.
- Summary records are excluded. Source conflicts are excluded from counts. Legacy `learning` / `personal` axes normalize to education / growth while retaining original provenance.
- Optional `plan.quarter_reviews[quarter]` holds private, dated assistant interpretations and explicitly sourced milestone references. They render only while both the Notion source signature and quarter-plan signature still match. They never mark a KR complete or change source plans.
- CSV exports the filtered observation set including source identity, precision, date meaning and diagnostics; spreadsheet formulas are escaped. Curated milestones and quarter baseline text are not included in that observation export.
- Portrait mobile defaults to an agenda with the same data; timeline mode remains available. Native buttons support Tab/Enter/Space; the focused timeline scrolls with the keyboard. Reduced motion is respected.

Run `node --experimental-vm-modules --test tests/*.test.mjs` to verify date boundaries, quarter filters, ambiguity, snapshot deduplication, review invalidation, CSV safety and app-level drawer/navigation behavior.
