# Foundation replacement audit — 2026-11-01

Scope: tokens.css, design-system.html, executive.css, styles.css, Gantt/Progress/Calendar/workspace/AI styles; native Servicebio/Ventures source pipelines; local Enexia source.

| Finding in the previous implementation | Root correction |
| --- | --- |
| Flat `--os-*` values mixed palette, usage and control dimensions; light legacy root variables also redefined the foundation. | Literal ramps/scales live in `primitives.css`; semantic roles alias them; component contracts alias semantic roles. `compatibility.css` owns the legacy bridge. Removed legacy root definitions. |
| `executive.css` had 474 rules, 46 literal color occurrences and competing button/input/card recipes. | Stable import manifest replaces that file. Host geometry is partitioned by shell/dashboard/analytics/calendar/AI/responsive concerns. Removed duplicate control recipes; colors now resolve through tokens. |
| Legacy styles retained another 261 color literals across six view stylesheets. | Migrated those declarations to semantic roles, preserving view geometry and model calculations. Increased 9–11px metadata to the shared label size. |
| Laboratory was an independent, incomplete showcase with local component appearance. | Rebuilt as an 11-section explorer importing the real shared recipes and renderer helpers. Variant/state/size/density controls, anatomy, tokens, code, forms, filtering/sorting, overlays and compositions are interactive. Fixtures are labelled synthetic. |
| KPI/task markup could drift from its showcase. | Homepage imports `kpi` and `taskRow` from the same `ui.mjs` used in the Laboratory. Missing data stays unavailable; verified and reported completion stay separate. |
| Overlay and navigation behavior had no reusable contract. | Shared native modal/popover primitives with explicit keyboard handling, focus containment/return, roving tabs, combobox active descendants, tooltip dismissal and live feedback. |
| Gantt rail labels used unnamed generic spans; an icon button had no accessible name. Several Gantt group colors failed text contrast. | Corrected roles/names; axis and status colors now consume semantic chart/domain roles. |
| Interactive radar SVGs exposed an image role around focusable controls; miniature SVG exports lost their names. | SVG uses an accessible group, keeps keyboard evidence controls, names export buttons, resolves CSS variables into standalone exports. Calculations and date geometry are unchanged. |
| Parent CSS was injected into isolated iframe packages. | Native private repositories now build the portable foundation and shared control adapter themselves. Parent gateway preserves their package styling. Enexia imports the system in its actual source. |

Verification: `tests/design-system.test.mjs` checks hierarchy resolution, cycles, contrast pairings, absence of literal colors in recipes, renderer escaping, missing-vs-zero KPIs and specification coverage. `tests/browser/design-system.mjs` exercises real interaction behavior. Browser/axe evidence and screenshot limitations are recorded in `VERIFICATION.md`.
