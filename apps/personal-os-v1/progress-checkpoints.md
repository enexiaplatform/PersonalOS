# Progress checkpoint review contract — evidence-v1

This workflow supports the private **Bản đồ tiến bộ** dashboard. Review the user's sources, then append a checkpoint. The web client is read-only. Do not add API keys, personal ratings, or evidence excerpts to this public repository.

## Source and scale

- Notion Weekly Planner / daily outcomes are execution truth; OneNote Objectives for the same year are goal truth. Read connected sources and canonical snapshots; use `model.mjs` to exclude source conflicts and deduplicate Daily / Weekly.
- `progress-rubric.mjs` defines stable facet IDs, targets, and ordinal anchors 0–4. A rating needs a rationale, at least one source, and the next evidence required. Missing / ambiguous / unreviewed data is `null`, never 0.
- 0 requires explicit evidence of not started. 1 is a documented foundation / baseline / decision / asset. 2 needs real application. 3 needs repeated results with evidence across situations / periods. 4 needs verified achievement of the defined target in the right scope.
- A planned action, task count, checked habit, deployment, or course certificate does not automatically prove business success, proficiency, recovery, relationship quality, or a KR. A verified deployment only verifies that deployment.
- Health / recovery / relationship quality require the user's actual report; do not infer private states from activity frequency. Do not assign percentile, IQ, diagnosis, promotion probability, or global success percentage.
- Only use information known as of the checkpoint date. Do not backfill historical scores from today's knowledge. Date of recording and future event date are distinct.

## Persisted row

Table: `public.personal_os_progress_snapshots`. Resolve the signed-in owner from the existing Personal OS source rows; preserve ownership. Trusted connected workflows may insert; browser users cannot overwrite checkpoints.

Fields: `owner_id`, `checkpoint_key`, `assessment_year`, `as_of` (Vietnam date), `rubric_version='evidence-v1'`, `source_signature`, `plan_signature`, `reviewer='assistant_review'`, `assessment`, optional `supersedes_id`.

`assessment`:

```json
{
  "label": "Weekly review",
  "notes": "Scope, source limitations, and decision context",
  "plan_context": {"year": 2026, "axes": [], "source_url": "https://source"},
  "axes": {
    "career": {
      "market_strategy": {
        "level": null,
        "confidence": "unknown",
        "rationale": "Why this rating / missingness is justified",
        "next_evidence": "Specific evidence needed next",
        "sources": [{"url": "https://source", "type": "notion", "page_id": "source id", "item_key": "stable item id", "excerpt": "Evidence used", "observed_on": null, "week_start": "2026-10-26", "coverage": "partial"}]
      }
    }
  },
  "horizon2031": {},
  "horizon_source": {"url": "https://source", "excerpt": "Relevant 2031 goal text"}
}
```

Use `axisRubric(id, year)` to select year-specific definitions (2027 includes MBA, country P&L, one-venture and MBA-fund criteria). Populate all facets for the year's axes and all eight horizon facets from the rubric; unknown values remain explicit. 2026 has eight axes. 2027 has seven and uses `entrepreneurship` instead of `business`; do not mix structures or copy prior-year attainment. Store the actual goal text / KRs in `plan_context` so future edits cannot rewrite the meaning of old scores.

Use `evidenceSignature` and `progressPlanSignature` from `progress.mjs`. Source signature = canonical same-year pages sorted as `page_id|source_edited_at_or_synced_at|coverage|item_count`, joined with semicolons. Plan signature = unsigned FNV-1a of JSON `[year, axes.map(a=>[a.id,a.objective,a.krs])]`. Keep the rubric version unchanged only while facet definitions and anchors remain unchanged.

## Review / append sequence

1. Wait for enough confirmed review information; if the weekly review is pending answers, do not claim the checkpoint is finalized.
2. Read the latest active checkpoint and the year's goal source. Review each facet. Retain a prior evidence level only when still justified; explain carry-forward rather than implying a new measurement. New activity alone does not force an increase.
3. Add the 2031 competency assessment against the role-scope rubric, not against job title alone. Unknown people / P&L authority stays unknown until evidenced.
4. Validate levels as integer 0–4 or null; real HTTPS sources; correct year/date; no future actuals; no secrets. Ratings remain subjective, evidence-backed interpretations.
5. Append with an idempotent key such as `YYYY-MM-DD-weekly-evidence-v1`. Use `ON CONFLICT(owner_id,checkpoint_key) DO NOTHING`; never UPDATE/DELETE history. If a prior checkpoint is factually wrong, append a correction with a new key and `supersedes_id`, preserving the original row.
6. Read back the row and verify all facets, source IDs, signatures, date, and owner. Report success only after verification; otherwise state the actual failure.
7. The dashboard refreshes snapshots when opened / refreshed and approximately every minute while active. It compares only same-version checkpoints; annual overlays also require same goal-plan signature. Do not edit Notion commitments or deadlines as part of rating progress.

Annual radar uses a lower median of known facets only after at least 60% coverage; do not persist a fabricated overall percentage. Unknown axes remain open gaps. The 2031 target ring is an aspiration / capability standard, not a promise of promotion.
