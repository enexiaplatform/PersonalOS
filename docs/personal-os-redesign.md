# Personal OS redesign — 27 October 2026

## Visual specification

Reference: built-in Image Gen concept delivered in the conversation (retained with the local review package). Full primary desktop screen, 1536 × 1024. This reference is a design artifact, not shipped as UI.

Palette: cool gray `#f5f7f9`, white panels, forest teal `#173e3d`, ink `#202c32`, muted slate `#707b87`, amber partial-data notice. No gradients or decorative bitmap assets. Sidebar 230px (258px wide screens), 34px main gutter, 18px panel gaps, 7px radii. Segoe UI/system sans for controls and data; Georgia for main heading and section titles. Six consistent outline navigation icons. Tabs use fill + underline + aria-pressed, rather than color alone.

Primary composition: compact top bar, greeting, source freshness notice, two-column outcome/blocker and daily-plan/stop grid, teal daily/weekly rhythm band. Below 850px panels stack in task order; below 650px navigation becomes a horizontal scroll rail.

## Reference changes required by real data

- Empty placeholder rows in concept become actual imported content after authentication.
- Source warning now identifies partial coverage and timestamps instead of claiming missing current week.
- A week selector and logout preserve required existing functionality.
- Longer source-backed outcomes can increase panel height. No clipping or fixed-height truncation.
- Companion views use the same tokens; existing annual plans and source data are preserved.

Above-fold copy inventory: “Không gian của Henry”, “Rõ ưu tiên. Nhẹ đầu hơn.”, “3 kết quả cần đạt”, “Điểm cần gỡ”, “Kế hoạch trong tuần”, “Dừng / để sau”, “Mỗi ngày, một chút tiến bộ.” Navigation and source-state copy follow the reference or required real-data states.

## Verification ledger

- Copy and hierarchy: implemented reference headings; real source content replaces placeholders.
- Layout: sidebar and two-column grid in CSS; responsive stacking and navigation rail defined.
- Typography: explicit sizes/weights for controls, data and section titles; serif headline retained.
- Palette: exact cool background/teal/white direction, no gradients.
- Data/interaction: ten model/renderer tests cover date boundaries, duplicate pages, same-source records, daily date filtering, both years, all retained renderers, escaping, source failures and parked business work.
- Supabase: imported current Notion page and dated daily log, verified by a separate SQL readback. Partial coverage retained for unread embedded databases.
- Browser visual/interaction QA: **blocked in this environment**. Browser extension tool is not exposed; CUA fails before starting with a read-only runtime path; local Chromium cannot create its required socket. No browser screenshot, computed-style, native-size or mobile overflow verification is claimed. Renderer tests do not establish visual fidelity.

## Deployment scope

Update only existing PersonalOS app and project. No annual goal, historical data, schema, auth, audience, external commitments or scheduler changes. Existing Daily/Weekly prompt contracts were aligned with the renderer; their schedules were preserved. A future successful unattended sync still requires evidence from its actual run.
