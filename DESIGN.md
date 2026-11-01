---
name: Henry OS
description: Operate — a compact workspace for weekly work and source evidence
colors:
  canvas: "#f6f7f9"
  surface: "#fff"
  inset: "#f1f3f6"
  ink: "#202534"
  muted: "#626b7c"
  line: "#e3e6ed"
  line-strong: "#bcc3d0"
  purple: "#7250a3"
  jade: "#16746a"
  bronze: "#925c2e"
  indigo: "#65519e"
  success: "#18734e"
  danger: "#b63a4b"
  warning: "#8e5c0b"
  sidebar: "#f1f2f6"
  purple-hover: "#5e3e8b"
  jade-hover: "#10594f"
  bronze-hover: "#754725"
  indigo-hover: "#4f3d81"
  fulltime: "#ae6655"
typography:
  headline:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-.5px"
  title:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-.2px"
  body:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontSize: "12px"
    fontWeight: 400
  metadata:
    fontSize: "11px"
rounded:
  panel: "12px"
  control: "6px"
  strip: "10px"
  status: "4px"
spacing:
  control-y: "8px"
  control-x: "12px"
  panel: "20px"
  mobile-panel: "16px"
  gap: "20px"
  mobile-gap: "14px"
  main-x: "28px"
  mobile-main-x: "14px"
components:
  button-primary:
    backgroundColor: "{colors.purple}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.purple-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
  calendar-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 10px"
---

# Design System: Henry OS

## Overview

**Creative North Star: "Operate"**

Operate is a compact working environment: a light navigation frame, restrained domain color and white working surfaces on a cool canvas. Information density comes from aligned rows, short headings and clear separators. Weekly work, priorities and source status lead the home surface; the calendar exposes full task titles in grouped rows.

This records the implemented shared layer in apps/personal-os-v1/executive.css, with the home composition in workspaces.mjs and calendar behavior in calendar.mjs. The existing orbital logo remains the visual origin and must remain byte for byte unchanged. Every domain, menu item, route, source record and permission remains intact.

**Key Characteristics:**
- Light global bar and sidebar
- Self hosted Noto Sans with Vietnamese support
- Restrained purple, jade, bronze and indigo accents
- Compact inline pulse, weekly matrix and priorities
- Grouped full width calendar rows with a day rail

Tokens in the frontmatter are normative and match the implemented CSS. The component primary color shown there is the personal/default purple; workspace adapters resolve the current domain accent. This is a source-based record, not a claim that every inherited view has been normalized.

## Colors

Purple anchors the default workspace; jade identifies Servicebio, bronze Ventures, and indigo Enexia. Neutral surfaces carry the bulk of each screen.

### Primary

- **Working Purple:** default/personal actions, focused controls and selected home navigation.
- **Purple Hover:** darkened default primary action state.

### Secondary

- **Servicebio Jade**, **Ventures Bronze**, **Enexia Indigo:** domain actions and small identifiers; each has a corresponding hover token.
- **Full-time Terracotta:** existing full-time work marker. Preserve its distinction from the four main domain accents.

### Tertiary

- **Success**, **Warning**, **Danger:** semantic state colors. Never use domain color alone to communicate task status or verification.

### Neutral

- **Canvas**, **Surface**, **Inset**, **Sidebar:** cool working ground, white content, quiet nested areas and light navigation.
- **Ink**, **Muted:** primary copy and secondary explanation.
- **Line**, **Strong Line:** surface separators and control boundaries.

**The Quiet Frame Rule.** Keep the navigation frame light; reserve domain accents for selected navigation, actions and small data markers.

Tinted selected states are contextual CSS values rather than one universal tint. Weekly populated cells use `color-mix(in srgb,var(--domain) 11%,white)`; private module selection uses the active domain at 10% against white. Calendar lane dots retain the source lane colors in calendar.mjs; they are not completion signals and need not match the shell domain tokens.

## Typography

Self hosted Noto Sans is registered as `Henry Noto Sans` with regular (400) and bold (700) WOFF files, `font-display: swap`, and platform sans fallbacks. Preserve Vietnamese diacritics. Headings, controls and content share the family; the legacy serif alias also resolves to this sans family.

The frontmatter defines the default body, page heading, panel title, label and metadata roles. Common record/task copy uses 13px with 1.6 line height. Contextual calendar status labels and matrix secondary labels use 10px; they do not replace the body role. Pulse values use 24px, analytical values 26px, and tabular numerals support dates, counts and tables. Mobile page headings reduce to 20px. Authentication retains its specific 38px desktop / 30px mobile heading; it does not establish a promotional display role elsewhere.

## Layout

The desktop shell uses a white 52px global workspace bar, a 212px light local sidebar and a flexible main column. The main canvas has 28px horizontal padding and a maximum width of 1800px. Its local topbar is 50px. Panels use the frontmatter padding and gap values; the global bar has 20px horizontal padding and a 24px internal gap.

Home leads with a short heading and one inline pulse strip containing task count, self-reported done, verified done and undated tasks, plus the source week. Missing week data displays an em dash. The weekly allocation matrix and attention priorities follow in `minmax(0,1.9fr) minmax(270px,.9fr)` columns, ahead of workload and domain portals. This composition is intended to bring allocation and priorities into the first desktop viewport; viewport fit remains unverified without browser QA. The matrix has a 580px minimum width, a 144px label column, seven days and an undated column. The matrix scrolls inside its panel instead of compressing labels.

Calendar defaults to a grouped full width list, preceded by toolbar, filters, source status and a nine-option day rail: whole week, seven days and undated. Each row has a 56px date column plus the full task title and status. The agenda scrolls at `calc(100dvh - 340px)` with a 220px minimum height. The alternative week board keeps seven dated columns and an undated column, a 1400px minimum width and a 150px group column; its scroller is bounded at `calc(100dvh - 280px)`. It shows two tasks per cell before an overflow action opens the complete day/lane list. These calendar structures coexist; switching view does not modify source data.

At 1200px, home becomes one column, attention rows form three columns and portals become two columns. At 760px, the global bar wraps to 98px, home sidebar hides, personal navigation becomes a full width select, main padding becomes 14px, panel padding 16px and major gaps 14px. Pulse keeps four columns with a source row below. Attention stacks, workload becomes one column, and the matrix retains a 570px minimum width. Calendar controls wrap, filters use two columns, the day rail scrolls horizontally, task status stacks under the title and agenda/board scrolling is bounded at 65dvh (agenda minimum 180px). Native private-module responsive rules remain in force.

Shared desktop buttons and calendar filter controls have 34px minimum height. Targeted mobile buttons and filters become 40px, while home heading actions are 38px and agenda task rows are at least 44px. The mobile `--os-control` custom property is 44px, but explicit selectors govern these actual sizes; do not claim a universal 44px target. Search and utility buttons retain their smaller contextual dimensions.

## Elevation & Depth

Thin boundaries and tonal layering provide structure. Panels have the restrained shadow (`0 2px 6px #20253404`); bars, portals and summary strips stay flat. Hover changes fill, border or text rather than lifting cards. Right inspectors use `-6px 0 28px #20253412`; overflow dialogs use `0 16px 50px #20253424`; command dialogs use `0 20px 70px #20253426`. The dialog backdrop is `#20253450`, without blur. Do not introduce decorative gradients or ambient glows.

## Shapes

Panels use the frontmatter panel radius; controls, navigation and matrix cells use the control radius. Summary strips, pulse and portals use the strip radius. Calendar board task cards retain a contextual 7px radius, while full width agenda tasks are flat rows. Side inspectors have square corners and a left divider. Circular domain dots are small identifiers. The logo is the original image asset, never a CSS reconstruction.

## Components

- **Buttons:** white secondary fill, strong line border, compact text and frontmatter padding. Primary fill and hover resolve from the current domain. Secondary hover uses `#f1f2f6` fill and `#a6afbf` border. Disabled buttons and fields use opacity .5 and a not-allowed cursor.
- **Fields:** toolbar/filter inputs use white fill, strong line border, 6px radius and 12px text; calendar dialog fields use 14px text and 40px minimum height. The mobile personal navigation select is white and at least 40px tall.
- **Focus:** buttons, links, summaries, fields and focusable regions use a 2px domain-accent outline offset by 3px. Preserve that visible keyboard treatment when adapting legacy views.
- **Navigation:** the light global bar uses 12px labels, quiet hover fill and domain-tinted selected states. The light sidebar uses 12px labels, 38px minimum rows, 6px corners and a purple selected state. Private modules use their domain tint for selection. All labels, domains and bindings remain unchanged.
- **Panels and records:** white bordered surfaces, compact titles and aligned task rows. Source caveats remain adjacent to the records they qualify. Full details remain accessible through the existing inspector.
- **Pulse and weekly matrix:** counts are clickable source-derived facts. The matrix preserves separate work groups and an undated column, with light tint only on populated cells. No completion percentage is inferred from these task counts.
- **Day rail and agenda:** selected day buttons use tint and pressed state. Group headers have lane dots and counts; rows expose full wrapping task titles, date and status. Source verification/edit queue labels remain visible. The alternative board and overflow dialog retain task inspection and editing behavior.
- **Inspectors:** detail/calendar edit panels attach to the right at `min(520px,100%)`, full dynamic viewport height and 28px padding (22px mobile). Overflow remains a separate dialog with a list bounded at 60vh. Native dialog and source-update semantics remain unchanged.
- **Analytics and private modules:** shared surfaces, text, controls and table styling adapt the native views. Existing chart geometry, plotting dimensions, interaction semantics and source calculations remain owned by those views.
- **Motion:** button color and border transitions last .16s. Reduced-motion preference removes transitions and animations and restores automatic scrolling.

**The Source Before Certainty Rule.** Keep missing dates and source caveats visible; task counts are not completion percentages.

Implementation bridges legacy tokens into the shared palette and overlays inherited styles. This document does not imply a full component rewrite or removal of private module CSS. QA for this revision is source-only: the browser was unavailable, no screenshots were captured, and rendered desktop/mobile layout, clipping, contrast and focus behavior have not been visually verified.

## Do's and Don'ts

- Do preserve the original logo bytes, every domain, menu item, route, permission and source record.
- Do use the shared domain accent, Noto Sans, compact headings and visible keyboard focus.
- Do keep source caveats, missing data, uncertainty and actual completion semantics visible.
- Do preserve dense-view scrolling and access to complete task details on phones.
- Do verify inherited module layouts in a browser before claiming universal visual consistency.

- Don't add slogans, oversized headers, display serif typography or decorative prose panels.
- Don't invent revenue, completion percentages, business claims or source evidence.
- Don't redraw, recolor, filter or decorate the orbital logo.
- Don't change native chart geometry, domain structure, menu labels or navigation contracts during visual work.
- Don't describe source inspection as rendered QA or claim screenshots that were not captured.
