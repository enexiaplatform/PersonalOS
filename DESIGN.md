---
name: Henry OS — Nocturne Command
description: A three-tier midnight system for truthful work, evidence and decisions
colors:
  bg-canvas: "#101827"
  bg-sidebar: "#101827"
  bg-surface: "#192438"
  bg-surface-raised: "#223149"
  bg-surface-hover: "#223149"
  bg-surface-pressed: "#34455f"
  bg-inset: "#0b1220"
  bg-accent: "#1a1530"
  fg-primary: "#f0f4ff"
  fg-secondary: "#bdcce0"
  fg-tertiary: "#a5b6ce"
  fg-disabled: "#6e82a0"
  fg-inverse: "#080d18"
  fg-accent: "#b59eff"
  border-subtle: "#223149"
  border-default: "#34455f"
  border-interactive: "#6e82a0"
  border-accent: "#9175f3"
  action-primary-bg: "#6442ca"
  action-primary-fg: "#ffffff"
  action-primary-hover: "#7456e8"
  action-primary-pressed: "#50359f"
  action-danger-bg: "#a02c4a"
  action-danger-fg: "#ffffff"
  action-danger-hover: "#bf3656"
  action-danger-pressed: "#7e2440"
  focus-ring: "#5ad5ea"
  feedback-success: "#65deb0"
  feedback-warning: "#ffca6d"
  feedback-danger: "#ff8fa2"
  feedback-info: "#7dcbff"
  feedback-success-bg: "#0c2925"
  feedback-warning-bg: "#302419"
  feedback-danger-bg: "#331a28"
  feedback-info-bg: "#102137"
  domain-personal: "#b59eff"
  domain-servicebio: "#63ddc3"
  domain-ventures: "#efbd82"
  domain-enexia: "#7dcbff"
  radar-level-4-bg: "#0c2726"
  radar-level-3-bg: "#2b211b"
  radar-level-2-bg: "#302419"
  radar-level-1-bg: "#331a28"
  chart-plan: "#a996ff"
  chart-doing: "#59bdf2"
  chart-reported: "#42c9e8"
  chart-verified: "#38d9a9"
  chart-blocked: "#ff6878"
  chart-unknown: "#8fa2be"
typography:
  headline:
    fontFamily: "\"Henry Noto Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-.02em"
  title:
    fontFamily: "\"Henry Noto Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "\"Henry Noto Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "\"Henry Noto Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  metadata:
    fontFamily: "\"Henry Noto Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  value:
    fontFamily: "\"Henry Noto Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-.02em"
rounded:
  control: "8px"
  surface: "12px"
  overlay: "16px"
  badge: "4px"
spacing:
  "2": "2px"
  "4": "4px"
  "6": "6px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.action-primary-bg}"
    textColor: "{colors.action-primary-fg}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.action-primary-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.action-primary-pressed}"
  button-secondary:
    backgroundColor: "{colors.bg-surface-raised}"
    textColor: "{colors.fg-primary}"
    rounded: "{rounded.control}"
    height: "40px"
  button-ghost:
    textColor: "{colors.fg-secondary}"
    rounded: "{rounded.control}"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.action-danger-bg}"
    textColor: "{colors.action-danger-fg}"
    rounded: "{rounded.control}"
    height: "40px"
  card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.fg-primary}"
    rounded: "{rounded.surface}"
    padding: "20px"
  input:
    backgroundColor: "{colors.bg-inset}"
    textColor: "{colors.fg-primary}"
    rounded: "{rounded.control}"
    height: "40px"
  nav-selected:
    backgroundColor: "{colors.bg-accent}"
    textColor: "{colors.fg-accent}"
    rounded: "{rounded.control}"
---
# Design System: Henry OS — Nocturne Command

## Overview

**Creative North Star: "Nocturne Command"**

Nocturne Command combines Dark Productivity and Command Center: matte midnight layers, deliberate violet actions, readable data and a restrained atmospheric home identity. Jade, bronze and blue distinguish workspaces; labeled semantic states distinguish evidence and status. Polish comes from coherent anatomy, spacing, native behavior and reliable states rather than decorative glow.

The implemented foundation has three explicit tiers: reference primitives (`--ref-*`), usage semantics (`--sys-*`) and component decisions (`--cmp-*`). The compatibility bridge maps inherited names into that hierarchy. New component work consumes semantic/component roles instead of introducing a parallel palette or adding new legacy aliases.

**Key Characteristics:**
- Matte midnight surfaces with deliberate violet actions
- Actual primitive ramps and semantic domain/status roles
- Self-hosted Vietnamese-compatible Noto Sans
- Shared normal, compact and touch control contracts
- Real product components and Laboratory share recipes and renderers

Frontmatter records the resolved default Nocturne values; CSS remains the implementation source. `tokens.css` imports primitives, semantics, component tokens, compatibility, typography and elevation in that order. `executive.css` is a host-pattern import manifest; `design-system/components.css` supplies shared recipes after host/legacy geometry. The production system and `apps/personal-os-v1/design-system.html` Laboratory consume the same foundation. No unavailable reference image is claimed as a fidelity check.

## Colors

### Primary

Violet primary actions have distinct default, hover and pressed roles with a white action foreground. Accent foreground and accent background are separate semantic roles; do not substitute a lighter identity violet for the action background. Actions are matte fills, not the earlier gradient recipe.

### Secondary

Personal uses violet, Servicebio jade, Ventures bronze and Enexia blue. Domain identity supports recognition without implying success or verification. Status-chart roles distinguish plan, doing, reported, verified, blocked and unknown independently of domain color.

### Tertiary

Success, warning, danger and info have explicit foreground/background pairs. Danger action colors are separate from danger feedback colors. Radar level backgrounds represent the native ordinal rubric; they do not establish a quantitative percent-attainment scale.

### Neutral

Canvas, sidebar, surface, raised surface, hover, pressed and inset are distinct midnight layers. Primary, secondary, tertiary, disabled and inverse text are distinct usage roles. Borders distinguish subtle separators, default boundaries, interactive boundaries and accent states. The cyan focus ring is a separate contrast-bearing role.

**The Role Before Hue Rule.** Choose a semantic usage role before choosing a primitive swatch; component recipes never own an independent palette.

`primitives.css` defines actual neutral, violet, blue, cyan, jade, bronze, success, warning and danger ramps. The sidecar preserves those source ramps and their mappings; it does not synthesize new brand colors. Additional appearances should replace semantic mapping rather than fork component recipes.

## Typography

Self-hosted regular and bold Noto Sans is registered as `Henry Noto Sans` with `font-display: swap` and platform sans fallbacks. Vietnamese diacritics must remain complete. Shared headline, title, body, label, metadata and numeric roles are normative in frontmatter. Numeric values use tabular numerals and tight tracking; code samples use the reference monospace stack.

The primitive scale spans (11–36px). Shared headline is the semantic default; inherited host page headings remain (26px), with (23px) mobile overrides, and the compact home greeting remains a composition-specific role. These host exceptions do not redefine shared components. Long Vietnamese titles wrap; do not shrink essential data simply to fit more cards. Legacy small metadata declarations were migrated to the shared label role.

## Layout

Shared spacing comes from the source reference scale. Normal density uses (40px) controls, (20px) card padding, (16px) gaps and (12px) row spacing. Compact density changes control height to (32px), panel padding to (16px), gap to (12px), row spacing to (8px) and vertical control padding to (6px). Small/medium/large button contracts are (32/40/44px). Coarse pointers or widths at or below (600px) promote normal and small control targets to (44px), including compact density.

Semantic container contracts are content (1280px), wide (1600px), dialog (480px) and sidebar (248px). These are shared available sizes, not a claim that every existing host shell uses them: the app shell retains a (232px) rail, collapsible to (72px), a (56px) global bar and a flexible main region with (24px) horizontal padding. The local toolbar is (64px). At (1100px) the normal host rail becomes (208px); at (760px) the global bar wraps to (104px), main padding becomes (16px), and Personal OS uses full-width local navigation selection.

Home retains a compact decorative mountain hero, four source-backed KPI cards, today tasks and weekly priorities, group status distribution, goal/source context, dated observations and contextual utilities. Shared `kpi` and `taskRow` renderers are used by actual home and Laboratory. The right utility rail moves below working content at narrower desktop widths and can collapse; dense analytical views retain available width. Date matrices/tables scroll within their regions rather than overflowing the document. Home composition does not become a universal three-column page template.

The Laboratory has 11 sections: Color foundations, Typography, Spacing, Elevation, Buttons, Form controls, Navigation, Feedback, Data display, Charts and Product patterns. It exposes actual variants, meaningful states, sizes, density, anatomy, token contracts and code, using explicitly synthetic fixtures.

## Elevation & Depth

Matte surfaces and borders establish default separation. Shared cards are flat at rest. Raised, floating and overlay elevation correspond to the exact source shadows in the sidecar; dialogs use the overlay surface/shadow contract and scrim. Decorative twilight artwork is limited to the home/auth identity context and is not a static image of functional UI. Earlier compatibility names containing “gradient” now resolve to semantic solid values and are not permission to restore gradient controls.

**The Flat Working Surface Rule.** Use tonal layers and boundaries for work; reserve stronger elevation for floating content and overlays.

Motion uses the reference fast/normal/slow durations and standard easing. Reduced-motion preference minimizes transition/animation duration and restores automatic scrolling. Native model geometry remains authoritative for charts and timelines.

## Shapes

Controls, surfaces, overlays and badges use the corresponding frontmatter radii. Reference corner steps remain available for genuine contextual geometry; do not accumulate one-off card silhouettes. Drawers attach to a viewport edge and remain bounded on phones. Preserve the original interwoven logo as an undistorted image without recoloring, filtering or replacement; approved SHA256 is `ce2243b1d8224a28ee0dc02e00b8b5fee9670dd15c942160d85e0e9b2d5ac8c1`.

## Components

`design-system/catalog.mjs` owns 26 explicit contracts. `ui.mjs` supplies escaped renderers and progressive enhancement; native application controllers retain source-write ownership. Preview-only `data-state` is a visual inspection API, while production behavior uses native/ARIA states.

| Contract | Visual and interaction requirements |
|---|---|
| Button | Primary, secondary, tertiary, ghost and destructive; default/hover/pressed/focus/loading/disabled; native Enter/Space and busy duplicate-activation guard. |
| Icon Button | Accessible name, same target sizes; pressed state for toggles; tooltip supplements the name. |
| Badge | Neutral/accent/success/warning/danger with explicit text; informational, never a counterfeit button. |
| Input | Associated label, help/error description, invalid, disabled and copyable read-only state; native validation. |
| Select | Native single select or real searchable combobox; filter, active descendant, arrows/Enter/Escape/Tab. |
| Checkbox | Native checked/unchecked/indeterminate property; Space activation and a labeled touch area. |
| Switch | Native input semantics for reversible local state; no silent external action. |
| Tabs | Roving focus, arrows/Home/End, linked tabpanels and hidden inactive panels. |
| Tooltip | Supplemental text on hover/focus; Escape/blur/exit dismissal; no interactive content. |
| Dialog | Labeled native modal, safe initial focus, browser focus containment, Escape and focus return; destructive defaults to cancel. |
| Drawer | Modal contract attached left/right, bounded viewport width, no compression of charts. |
| Popover | Native light dismissal, expanded state; menu arrow/Home/End handling; explicit keyboard trigger for context menus. |
| Skeleton | Named busy region with decorative shapes; reduced motion; never substitutes for a permanent empty state. |
| Toast | Status or urgent alert semantics, accessible close, no focus theft; persistent UI for critical decisions. |
| KPI Card | Informational by default; real action alone creates a button. Missing is an em dash, numeric zero remains zero; source/trend must be supplied. |
| Insight Card | Priority, explanation, source evidence and valid next action; preserve review ownership. |
| Task Row | Wrapping title, domain/date and labeled status; details button only when supported; undated and reported/verified remain distinct. |
| Progress Indicator | Documented denominator; labeled record distribution is not goal attainment; missing denominator stays missing. |
| Project Card | Identity, real status/context and supported next action; no invented spans or milestones. |
| Data Table | Caption, keyboard-scrollable region, filters and actual sorting with `aria-sort`; no fake product sorting. |
| Chart Container | Title/context, plot, legend, filters/source and meaningful accessible label or equivalent; model owns geometry. |
| Gantt Timeline | Retains native precision, planned/actual/range/zoom/filter/export; lab observations are synthetic. |
| AI Message | Role, timestamp, content, sources and actions; saved analysis and uncertainty remain explicit. |
| AI Approval Card | Suggested action, scope/evidence and explicit decision; lab decisions are local; product server authorization remains. |
| Source Health | Actual freshness/state, explanation and recovery; response success alone does not prove completeness. |
| Empty State | Explain no data/no results/unavailable source and provide a supported next action; absence is not failure. |

The shared renderer classifies inherited primary, secondary, ghost and input variants so native controls consume the same recipes. Gantt/Progress retain calculations and date geometry while improving names, SVG group semantics, contrast and standalone export token resolution. Source transparency, auth, memory consent and approval semantics are functional invariants, not design tokens.

Isolated Servicebio/Ventures builds consume a generated portable foundation and native runtime provider through their own build workflow. Enexia imports the foundation in its actual source. Parent iframe stylesheet injection is not the integration mechanism. Private source, snapshots and native HTML packages do not belong in public design documentation.

**The Source Before Certainty Rule.** Keep missing sources, exact dates and verification semantics explicit; visual polish does not create evidence or approval.

Scoped verification records 79 Node tests; the shared browser interaction suite; 33 Laboratory axe checks at three widths; 14 selected product axe checks; and 36 product route/viewport captures without document overflow or reported exceptions. Both isolated native workspaces passed typechecks/builds with 29 native captures. This evidence is bounded by the tested fixtures and states, not universal WCAG certification. Independent review reopened all 18 required recaptures and five fix screenshots: findings F1, F2 and F3 are resolved, with disposition “ship” for that fix-list scope. This bounded verdict is not universal full-surface approval. No Impeccable detector result or production publication is claimed here. Current evidence details belong to `design-system/VERIFICATION.md`.

## Do's and Don'ts

- Do use reference → semantic → component token ownership and keep recipes free of independent color literals.
- Do preserve the original logo bytes, existing source ownership, authentication and navigation contracts.
- Do keep exact dates, missing sources, real zero values and reported-versus-verified completion distinct.
- Do implement native and ARIA behavior as well as visual states; label every icon-only action.
- Do consume portable shared artifacts through isolated workspaces’ native build workflows.

- Don't restore the superseded flat Nocturne palette, gradient primary buttons or a second independent component theme.
- Don't invent attainment percentages, project spans, deadlines, trends, evidence or AI certainty.
- Don't make informational cards look actionable without a real destination.
- Don't ship Laboratory fixtures as product records or invoke providers from the Laboratory.
- Don't infer universal accessibility certification, production publication or private-source disclosure from local verification.

## Cosmic canvas

The user-approved brighter appearance uses a generated blue/violet nebula wallpaper, compressed to WebP, behind opaque raised content surfaces. `--sys-canvas-image` and `--sys-canvas-tint` own the image and tint; `patterns/canvas.css` owns display. Canvas/sidebar use neutral-900, surfaces neutral-850 and raised surfaces neutral-800. Text, charts and inputs keep solid backgrounds. Native builds consume the same recipes and publish the same image; protected embedded modules use the shared public wallpaper asset.

## Platform and workspace boundaries

The shell and browser page are named **Personal Platform**. `#home` is a module launcher for Personal OS, Servicebio, Ventures and Enexia; it does not render personal weekly KPIs, tasks, timeline or briefing. `#personal` retains its existing weekly landing and all existing subroutes. Legacy home/personal body background shorthands no longer reset the shared cosmic canvas. Internal asset filenames, authentication storage keys and data-source identifiers remain compatible.

## Navigation hierarchy and loading

Workspace switching is confined to the platform bar. Personal navigation is grouped into Kế hoạch (weekly summary, day-based tasks, quarterly Gantt), Mục tiêu & đánh giá (annual commitments, evidence rubric), Theo dõi cá nhân (life and personal business logs), and Review & hệ thống (reflection/evidence/decisions, source settings). Mobile uses the same optgroups and preserved route ids. Local headers span the full content edge rather than floating over an inset image rectangle. Module HTML is prepared on intent, decoded once per session, and startup snapshot reads run in parallel; manual readback stays fresh and logout clears pending/cached private work.
