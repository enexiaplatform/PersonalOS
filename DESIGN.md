---
name: Henry OS
description: Dense productivity interface for weekly work and source evidence
colors:
  canvas: "#f2f4f6"
  surface: "#fff"
  inset: "#f7f8fa"
  ink: "#22333e"
  muted: "#596b78"
  line: "#dce3e8"
  line-strong: "#c2cfd8"
  nav: "#192a32"
  nav-text: "#becdd5"
  purple: "#7753a7"
  jade: "#18776e"
  bronze: "#925f32"
  indigo: "#62559c"
  success: "#21734f"
  warning: "#925e15"
  danger: "#b64146"
  purple-hover: "#65448f"
  jade-hover: "#125e57"
  bronze-hover: "#754b27"
  indigo-hover: "#514481"
typography:
  headline:
    fontFamily: "'Henry Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-.35px"
  title:
    fontFamily: "'Henry Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.45
  body:
    fontFamily: "'Henry Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontSize: "12px"
    fontWeight: 400
rounded:
  panel: "8px"
  control: "6px"
  nav: "5px"
  day-cell: "4px"
spacing:
  control-y: "8px"
  control-x: "13px"
  gap: "16px"
  panel: "18px"
  mobile-panel: "15px"
  main: "24px"
  mobile-main: "14px"
components:
  button-primary:
    backgroundColor: "{colors.purple}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
  button-primary-hover:
    backgroundColor: "{colors.purple-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "18px"
---

# Design System: Henry OS

## Overview

Henry OS is a high density productivity interface. Weekly work, task groups, evidence and actions determine the hierarchy. Compact titles, quiet surfaces and persistent navigation support desktop work; mobile keeps domain navigation and task inspection available. This document records the implemented shared layer in `apps/personal-os-v1/orbit.css`; it does not certify every inherited view's computed appearance.

The original orbital mark at `apps/personal-os-v1/henry-os-mark.png` is immutable byte for byte. Its lavender, jade and bronze ribbons remain the visual origin. Every domain, menu item, route, source record and permission remains unchanged. No slogans, oversized promotional headers, decorative prose panels or display serif typography belong in this system.

## Colors

The canvas is cool gray with white working surfaces, dark blue gray navigation and restrained domain accents. CSS custom properties `--os-*` are the implementation source of truth.

| Role | CSS token | Use |
| --- | --- | --- |
| Canvas / surface / inset | `--os-canvas`, `--os-surface`, `--os-inset` | Page background, containers, low emphasis cells |
| Ink / muted | `--os-ink`, `--os-muted` | Primary text and supporting labels |
| Line / strong line | `--os-line`, `--os-line-strong` | Separators, panels and control borders |
| Navigation / navigation text | `--os-nav`, `--os-nav-text` | Shared dark shell |
| Purple | `--os-purple` | Default and personal accent |
| Jade | `--os-jade` | Servicebio |
| Bronze | `--os-bronze` | Ventures |
| Indigo | `--os-indigo` | Enexia |
| Success / warning / danger | `--os-success`, `--os-warning`, `--os-danger` | Semantic tokens; danger also marks focused invalid fields |

`--accent` and `--accent-hover` resolve by domain. Selected navigation also uses text and borders, rather than color alone. The full-time task matrix retains its observed terracotta `#a85e4a` marker; do not collapse existing groups into the four domain accents. Domain task cells use `color-mix()` against white (9% fill, 14% border in the weekly matrix; 6% fill for calendar tasks).

## Typography

Self hosted Noto Sans is declared as `Henry Noto Sans`, with regular 400 and bold 700 WOFF files in `apps/personal-os-v1/fonts/`, `font-display: swap`, then platform sans fallbacks. Preserve Vietnamese diacritics. Headings, labels, controls and content all use this family; `--exec-serif` intentionally resolves to the same sans family.

Page headings are 22px/1.35 bold, reducing to 20px at 760px. Panel titles are generally 15px/1.45 bold. Body is 14px/1.55; records commonly use 13px, controls 12px, and metadata 11px. Matrix secondary labels use 10px. These are observed context-specific sizes, not a mandate to shrink task details. Authentication headings retain a larger 38px desktop / 32px mobile role. Metrics use 26–28px bold and tabular numerals; tables, calendar dates and day counts also use tabular numerals. There is no display font role.

## Layout

Desktop shell: 56px domain bar, 216px local navigation column and flexible main column. Main width is capped at 1800px with 24px horizontal padding. The local topbar is 54px high. The common grid gap is 16px, panel padding 18px, section spacing commonly 18px and control padding 8px 13px. Values are contextual rather than an invented universal spacing progression.

The home work grid uses `minmax(0,2.5fr) minmax(255px,1fr)`. Domain portals form four adjacent cells. Weekly matrix scrolls within its container at a minimum 600px width (610px on mobile). The calendar keeps a minimum 1050px board, a 132px group column, seven day columns and an undated column. Its bounded scroller is `calc(100dvh - 230px)` on desktop; chart and calendar geometry remain owned by their native view styles.

At 1200px the home grid becomes one column, attention rows form three columns, and the analytics calendar spans the summary. At 760px the domain bar wraps to 102px, the shell becomes block layout, main horizontal padding becomes 14px and panels commonly use 15px. Home sidebar hides; personal navigation becomes a full width select. Portals become two columns, analytics summary becomes one column and attention rows stack. Calendar scrolling remains available with a 70dvh height limit. Shared primary controls become 44px high where explicitly targeted. This is not a claim that every inherited icon or navigation target is 44px.

## Elevation & Depth

Borders and tonal layering provide most structure. Panels use `--os-shadow: 0 3px 12px #1b344008`; analytical summaries and portals are flat. Hover does not lift portals or project cards. Inspectors use `-8px 0 30px #19333f18`; overflow dialogs use `0 18px 50px #192a3222`. Dialog backdrop is `#192a3245` without blur. Do not add decorative gradients, broad ambient glows or floating surface stacks.

## Shapes

Panels use 8px corners, controls 6px, navigation and task tiles commonly 5px, and matrix cells 4px. Thin borders separate dense content. Domain dots are circular; the original logo is never reconstructed from CSS. Side inspectors have square corners and a left separator. Command and authentication containers retain 10px corners.

## Components

- **Buttons:** default white surface, ink text, strong line border, 36px minimum height, 6px radius and 8px 13px padding. Hover uses inset background and `#a9bac6` border. Primary buttons use the current domain accent with its domain hover color. Soft buttons use `#eee8f6` fill, `#674292` text and `#dcd2eb` border.
- **Focus and disabled states:** buttons, links, summaries and fields share a 2px accent outline offset by 3px. Disabled buttons, inputs and selects have opacity .52 and a not-allowed cursor. Focused invalid non-placeholder fields use danger border color. No general error-message component is defined by this layer.
- **Fields:** common filter controls use the shared 36px minimum height, white fill, strong line border and 6px radius; dialog inputs/selects use 14px text and a 40px minimum height. The mobile personal navigation select uses a dark fill and 44px minimum height.
- **Navigation:** dark shell with 12px labels. Domain hover uses translucent white; selected domain buttons use white text, a translucent surface/border and a domain underline. Local navigation active state uses a translucent purple surface and pale text. Preserve all labels and route bindings.
- **Panels and records:** white, 1px line border, 8px radius and 18px padding. Panel headings use a bottom separator. Record and attention rows prioritize task text with muted metadata; attention text clamps to three lines, two on mobile. Full details belong in the inspector.
- **Counts, statuses and day chips:** metadata commonly uses 11px; count labels use inset fill. Weekly day cells use a 4px radius, 40px minimum height (44px mobile), tabular 16px counts, and an accent border on hover. Existing status semantics and completion calculations are preserved.
- **Calendar tasks:** 5px corners, 9px 8px padding, low tint fill and 12px/1.5 task text. Board labels clamp to two lines; metadata truncates with ellipsis. Overflow opens a bounded list with full task text; the more control gains underline and purple tint on hover.
- **Inspectors/dialogs:** detail and calendar edit inspectors attach to the right edge at `min(540px,100%)`, full dynamic viewport height, 25px padding (20px mobile), white fill and a left border. Overflow dialog stays separate with 560px maximum width and a 60vh scrollable list. No new modal behavior is implied by these visual rules.
- **Motion:** button color/border transitions are .12s. Reduced-motion preference disables animations and transitions and restores automatic scrolling.

The shared layer overlays inherited `styles.css`, `workspaces.css`, `calendar.css`, `gantt.css`, `progress.css`, module styles and existing inline rules. `executive.css` currently contains the same shared rule set as `orbit.css`. Legacy aliases (`--bg`, `--paper`, `--ink`, `--exec-*`, `--gp-*`, `--pr-*`, `--bi-*`) bridge into the system. Native chart geometry, private module markup and view-specific breakpoint rules remain present. Do not infer a clean component rewrite, complete legacy removal or universal breakpoint behavior from these overrides.

## Do's and Don'ts

- Do preserve the orbital logo bytes and every domain, menu, route, permission and source record.
- Do use domain accents consistently, compact titles, clear separators and self hosted Vietnamese Noto Sans.
- Do keep source caveats, uncertain evidence and actual completion semantics visible where they affect decisions.
- Do preserve horizontal overflow for dense calendar and matrix views, with task inspection available on phones.
- Don't invent revenue, completion percentages, business claims or evidence during visual work.
- Don't add slogans, oversized headers, display serif typography or decorative text panels.
- Don't treat inherited chart layouts, mobile target sizes or inline module styling as fully normalized without inspecting their actual rules.


## Studio revision
The application uses a white global workspace switcher and dark local navigation. Raised white cards use 18px radii, dark 25px page headings, 16px section labels and 13px task copy. Home adds four source-backed task statistics; missing week stays a dash. Calendar defaults to a full-title agenda grouped by workstream, with explicit day filtering including undated tasks. An alternative week board retains original lane/calendar semantics and edit dialogs. A bounded scroller prevents task density from consuming the entire page. Private domain cards and tables inherit the shared visual system without modifying their data or navigation. Native plotting geometry remains unchanged.
