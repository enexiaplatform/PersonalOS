# Henry OS — UI/UX research and implementation

Reviewed 1 November 2026. This is a task-oriented design study, not a ranking of the world’s “best” apps. The user’s Memoire screenshot supplies the product quality reference. Original logo, domain/menu organization and all data permissions are fixed constraints.

## Sources and applied decisions

| Primary source | Finding | Applied to Henry OS |
|---|---|---|
| [Linear 2026 refresh](https://linear.app/now/behind-the-latest-design-refresh) | Reduce the visual weight of navigation, maintain density and predictable action locations | Light neutral local navigation, restrained active domain accent, 52px global bar, 50px utility bar |
| [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) | Hierarchy, balance and density must be designed together | Replaced accumulated shared theme; consistent 22/15/14/12/11px type scale |
| [Carbon data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) | Search, filters and actions belong next to the data; expandable rows disclose detail | Calendar filters share one toolbar; full-title workstream rows; task detail remains accessible from the row |
| [Atlassian spacing](https://atlassian.design/foundations/spacing) | Use a limited intentional spacing system | 4/8/12/16/20/24px spacing, separate groups without nested cards |
| [Atlassian typography](https://atlassian.design/foundations/typography) | Prioritize legibility and consistent application text | Self-hosted complete Vietnamese Noto Sans; one type family for interface text and tabular numerals |
| [Apple design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/) | Precise words, clear hierarchy and real-world iteration | Functional short headings; compact source information; no decorative slogans |
| [Apple charts](https://developer.apple.com/design/human-interface-guidelines/charts) | Match chart styles to data and retain continuity across views | Retained data semantics and geometry; consistent frames, titles, labels and controls |
| [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Keep frequent tasks visible and defer optional detail | Agenda, alternative board and expandable weekly group detail; existing inspectors preserve context |
| [Notion Calendar integration](https://www.notion.com/help/use-notion-calendar-with-notion) | Date properties and permissions determine what is editable | Retained explicit date/undated states and existing Notion edit request semantics; no fabricated task times |

## Screen families

- Global shell: original logo; all workspace and local menu routes retained. Utility controls retain their existing IDs and handlers.
- Home: compact source-backed status strip, work allocation matrix and priorities appear before secondary domain entrances. Horizontal group bars show task counts, never completion percentages. Reported done and verified done remain separate.
- Weekly overview: status numbers share one quiet strip. Existing activity, status, evidence and history charts retain source behavior.
- Calendar: list mode uses full-width grouped rows with explicit date and status. Week mode retains swimlanes. Undated tasks remain undated. Filter state and queued Notion edits are unchanged.
- Gantt/progress: native plot geometry stays intact; titles, toolbars, controls and surrounding panels follow the shared system.
- Goals/review/settings: same typography, disclosure controls, forms and source states.
- Servicebio/Ventures/Enexia: same system injected after native styles, preserving private module scripts, routes and data.
- AI Manager: shared visual adapter only; execution, approval and memory behavior unchanged.

## Verification and limitations

55 existing and feature checks pass. Local test fixtures were obtained read-only and remain outside the repository. They are never deployment artifacts. Original logo is not part of the patch.

Visual QA is **not completed**: the connected browser plugin is unavailable, cloud browser startup fails, and local Chromium cannot create its process socket in this execution environment. No screenshot or pixel-level approval is claimed. Source review checks cascade, responsiveness and navigation contracts; it cannot certify actual clipping, inherited private module states or interaction at zoom.

Acceptance checks for a rendering-capable environment: desktop 1351px and 1440px, phone 390px; every native route, all three private modules, calendar day/group/search and detail flow, missing/empty/error data, keyboard focus, 200% zoom, and AI Manager open/close.
