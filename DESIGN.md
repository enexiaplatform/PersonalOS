---
name: Henry OS — Nocturne Command
description: A midnight command center for source-backed work and personal direction
colors:
  bg-base: "#070b16"
  bg-sidebar: "#0b1120"
  bg-main: "#0a1020"
  surface-1: "#10192b"
  surface-2: "#151f34"
  surface-3: "#1b2840"
  surface-hover: "#202e48"
  border-subtle: "#9cafdc1a"
  border-default: "#9cafdc2b"
  border-strong: "#9cafdc47"
  primary: "#9065f8"
  primary-hover: "#a384ff"
  primary-muted: "#9065f829"
  violet: "#b29aff"
  indigo: "#8796ff"
  blue: "#65abff"
  cyan: "#42c9e8"
  success: "#38d9a9"
  warning: "#ffb454"
  danger: "#ff6878"
  text-primary: "#f1f5ff"
  text-secondary: "#a7b4d0"
  text-muted: "#95a4c2"
  text-disabled: "#7f8dab"
  jade: "#54d8c0"
  bronze: "#e5b47d"
typography:
  display:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.4
  headline:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  navigation:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  kpi:
    fontFamily: "'Henry Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  control: "9px"
  kpi: "14px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-soft:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.violet}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  field:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
---
# Design System: Henry OS — Nocturne Command

## Overview

**Creative North Star: "Nocturne Command"**

Nocturne Command is a midnight working environment with layered blue surfaces, violet and indigo actions, cyan keyboard focus and restrained atmospheric depth. A compact twilight mountain hero gives home a recognizable identity; real task lists, source facts, charts and utilities remain interactive UI.

The user’s detailed Nocturne mission supersedes the previous Studio and light-system restrictions, including prohibitions on gradients and atmospheric artwork. No reference image was actually available in this session: the implementation follows the supplied textual mission and must not be described as verified visual fidelity to an unseen image.

**Key Characteristics:**
- Midnight navigation and layered dark working surfaces
- Self-hosted Noto Sans with Vietnamese coverage
- Four truthful weekly count cards and visible source caveats
- Interactive today tasks, status distribution and dated observation timeline
- Existing AI Manager integration and a real local focus timer

The frontmatter is normative for the extracted primitives. `apps/personal-os-v1/tokens.css` owns portable CSS foundations; `executive.css` owns component recipes. Legacy CSS uses shared aliases rather than a separate light palette. `nocturne-home.mjs` composes home, and `nocturne-ui.mjs` owns local presentation interactions. The existing static ES-module architecture is retained.

## Colors

### Primary

**Primary Violet** and its brighter hover identify primary actions. **Violet**, **Indigo**, **Blue** and **Cyan** provide readable accents on midnight surfaces. Primary gradients belong to actions, selected navigation and restrained highlights; their full recipes live in the sidecar.

### Secondary

**Jade** identifies Servicebio, **Bronze** identifies Ventures and **Indigo** identifies Enexia. Domain identity never substitutes for status semantics.

### Tertiary

**Success**, **Warning** and **Danger** communicate actual semantic states with labels. Reported done and verified done retain distinct identities. A green segment is not independent verification of a source record.

### Neutral

**Base**, **Sidebar** and **Main** are the midnight application grounds. **Surface 1–3** and **Surface Hover** create local layers without large light panels. Subtle, default and strong borders use translucent blue-grey. Primary text carries content; secondary and muted text carry context; disabled text is reserved for disabled states. Preserve the actual eight-digit CSS colors in frontmatter rather than silently replacing alpha tokens with opaque approximations.

**The Selective Light Rule.** Use gradient and bright accent for hierarchy; keep ordinary information panels calm and avoid glowing every boundary.

## Typography

Self-hosted Noto Sans is registered as `Henry Noto Sans` in regular and bold WOFF files with `font-display: swap` and platform sans fallbacks. Vietnamese diacritics remain complete. One family spans navigation, working text, charts and dialogs.

The home greeting and KPI values use their frontmatter roles. Working page headings use the headline role; general section headings use (17px), panel headings (15–16px), body (14px), task copy (12–13px), and metadata (10–12px) according to context. Home KPI metadata is (10px), not a substitute for important record text. Tabular numerals support metrics, tables and timer output. At the mobile breakpoint the greeting becomes (28px), working headings (23px), and KPI values (28px). Full Vietnamese task titles wrap rather than ellipsizing essential meaning.

## Layout

Desktop shell: midnight global workspace bar (56px), left navigation (232px), and flexible main content with (24px) horizontal padding and maximum width (1920px). The local utility bar is (64px). Navigation can collapse to (72px) through a real button; native title tooltips preserve labels on collapsed icons. At or below (1100px), the normal rail becomes (208px) and main padding (20px).

Home uses a compact mountain hero (184px), then a working region and utility rail (306px) separated by (20px). Four KPI cards precede source status, today tasks and weekly priorities, group status distribution, goals/source context and timeline observations. Workspace launch links follow the timeline. This three-region composition belongs to home; dense Gantt, calendar and analytical views retain the available working width.

At or below (1380px), home utility panels move below the main workspace rather than compressing charts. Utility content can collapse and reopen. At or below (1100px), KPIs form two columns and the main home grid becomes one column. At or below (760px), the global bar wraps to (104px), the hero becomes (178px), main padding becomes (16px), panels (18px), and home stacks. Personal OS local navigation becomes a full-width select with (44px) minimum height. Utility panels stack and targeted working controls become (44px). The timeline retains an internal horizontal scroller with a (130px) label column and eight (52px) dated/undated columns.

Calendar keeps full-title agenda rows, date, status, filters, alternate week board and task inspectors. Desktop agenda height is bounded at `calc(100dvh - 365px)` with (220px) minimum height; mobile uses (65dvh). Task status moves below text on narrow screens. Native chart scales, geometry, task dates, source calculations and route contracts remain owned by the existing modules.

## Elevation & Depth

Layered surfaces and translucent borders provide the default depth. Cards use the card shadow; dialogs and the authentication card use the floating shadow recorded in the sidecar. Hero and primary-action gradients are allowed by the current user direction. Mountain artwork is a local decorative SVG, never a static screenshot of the interface. Overlay backdrops use a dark translucent ground without unnecessary blur. No new animated visualizations are implied by these tokens.

**The Working Depth Rule.** Depth should separate navigation, content and overlays while keeping labels and chart data clear.

## Shapes

The shared radius scale appears in frontmatter. Working panels generally use the large radius; KPI cards use their contextual radius; shared buttons use the control radius. Inputs use the small radius. Authentication and AI Manager surfaces use the extra-large radius. Side inspectors remain square-edged against the viewport. The original logo remains an undistorted image with unchanged bytes and no recoloring filter.

## Components

- **Primary actions:** a violet gradient, white text, subtle light border and brightness hover; (38px) desktop minimum height, (9px) radius and (8px 12px) padding. Secondary actions use Surface 2 and a strong boundary. Disabled buttons use opacity (.5).
- **Fields and focus:** dark Surface 2 inputs with strong boundaries. Every shared keyboard-focus selector uses a (2px) cyan outline offset by (3px). Calendar edit fields use (42px) minimum height; authentication inputs (44px).
- **Navigation:** midnight ground, outline icons, violet-tinted selected gradient and readable hover. Existing local labels and workspace routes are retained. Sidebar collapse and home utility collapse are local presentation state; mobile local selection retains existing route behavior.
- **Hero:** current Vietnam-local date and actual selected-week context. Decorative mountain SVG and a restrained overlay support a real greeting and weekly action. No fabricated achievements or notification count.
- **Four KPI cards:** total tasks, doing, verified done, and attention (blocked or undated, counted once). They show source-derived counts, not attainment. Without a week, values are em dashes. Card actions open the existing calendar; they do not imply a status filter that is not implemented.
- **Today and priorities:** tasks dated to today in Vietnam time, plus explicit missing-today state and weekly source priorities. Today/upcoming task clicks navigate to calendar and inspect the exact task through its existing controller. Weekly priority rows open the weekly overview.
- **Group distribution:** separate status segments show observed records by group, scaled against the largest group count. This is a count distribution, not percent goal completion. Actual status labels remain visible in badges and legend.
- **Goals and timeline:** goals show loaded annual axes or a truthful missing-source message. Timeline cells count exact task-date observations plus undated tasks; they never invent start/end spans or deadlines. Gantt Pro remains a separate real route.
- **AI utility:** opens actual AI Manager, proposals and memory tabs. Reading the saved briefing calls the existing authenticated dashboard GET, chooses a completed saved analysis for the current scope, and exposes missing/error states. It does not invoke an AI provider. Existing explicit request, memory, approval and execution behavior remains intact.
- **Focus utility:** real local (25-minute) countdown, start/pause and reset using an absolute end time. It does not persist a session across reload, write achievements or create source activity.
- **Dialogs and authentication:** dark shared surfaces, accessible text and existing forms. Task inspectors attach to the right at `min(540px,100%)` with full viewport height and (28px) padding, reducing to (22px) on phones. Auth remains the existing account flow.
- **Isolated modules:** portable tokens and component recipes are injected after native styles. Servicebio/Ventures actual remote packages were unavailable; adapter implementation is not equivalent to full private-screen redesign or rendered verification.
- **Motion:** button state transitions use (.15s). Reduced-motion preference removes animations/transitions and restores automatic scrolling.

**The Source Before Certainty Rule.** Keep dates, missing sources and verification semantics explicit; neither attractive charts nor AI presentation create evidence.

## Do's and Don'ts

- Do preserve original logo bytes, every existing route, domain, permission and source record.
- Do keep missing source states, undated work and reported-versus-verified completion explicit.
- Do use gradients and decorative mountains selectively, keeping operational content legible.
- Do preserve native chart geometry and full wrapping Vietnamese task titles.
- Do distinguish local UI actions, saved analysis reads and provider-triggering requests.

- Don't claim fidelity to a reference image that was not available.
- Don't turn task counts or status shares into goal-attainment percentages.
- Don't invent deadline spans, achievements, goals, notifications or AI advice.
- Don't replace or recolor the original logo, authentication or owner checks.
- Don't claim full private Servicebio/Ventures redesign or QA without their actual source packages.

Native Servicebio/Ventures sources and protected package builders were updated in the release continuation. Domain identity remains jade/bronze; shared primary actions use the white-label contrast recipe through hover. See `docs/nocturne-implementation.md` for actual validation and deployment scope.
