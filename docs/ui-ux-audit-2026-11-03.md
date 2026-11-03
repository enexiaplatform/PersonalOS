# UI/UX audit — 3 November 2026

The initial polishing pass was pushed to `main` as `3af831d` after rebasing onto the five newer remote commits. Vercel reported that production deployment READY. This follow-up addresses interaction continuity and the AI Manager/Enexia surfaces; source data and provider permissions remain unchanged.

## Reproduced issues and changes

- Returning to a visible browser tab replaced an unsaved weekly review. A background refresh also closed a calendar edit dialog after focus moved from its fields. Both visibility and timer refreshes now use the same passive-view policy: do not replace writing surfaces, active input, open dialogs, hidden tabs or an in-progress load. Explicit save/reload operations retain their own behavior. This is draft protection during background refresh, not persistence across navigation or browser reload.
- AI Manager declared itself modal through ARIA but allowed background focus and the global command shortcut to open another dialog. It now uses a labelled native `dialog`, making background content inert; cancel/close restores the opener and command search respects an existing modal.
- The AI composer’s “Quyền dữ liệu” action shared `data-tab` with the real tabs. Rendering assigned it a duplicate tab id and `aria-selected` despite its button role. Only actual tabs now receive tab semantics and roving tabindex.
- The AI header overlapped at 320px. Its identity and actions now occupy separate rows on phones, with touch-sized icon controls. The question field has an explicit label, the quick-start section has the correct heading level, and the modal content no longer creates a second main landmark.
- Enexia’s ecosystem diagram shrank all labels to fit a phone. It now has a focusable horizontal scroll region, readable label sizing and semantic foreground colors. SVG nodes live in an interactive group, have names matching visible text and support Enter/Space. The timeline can receive keyboard focus for scrolling; gate/relationship headings and the details dialog’s accessible name are corrected.
- The component browser test asserted the destination title before its hash navigation completed. It now waits for the rendered destination before checking it.

## Validation

- 90 Node tests passed, including the refresh policy and existing calendar/data/render regressions.
- Browser navigation suite passed: protected workspace fixture startup, warm reuse, grouped navigation and mobile geometry.
- Component suite passed: density, control states, combobox, tabs, dialogs/focus, drawer, menus, tooltip, filter/sort and forms.
- New `tests/browser/continuity.mjs` passed: review/calendar drafts on tab return, native AI modality, blocked background focus, shortcut isolation, focus return, unique tab ids and mobile header geometry.
- AI Manager: five tabs at 1440, 640, 390 and 320 CSS pixels; 20 states without page overflow, axe violations or JavaScript page errors after correcting the QA fixture to match the memory API contract.
- Enexia: six views at 1440, 390 and 320 CSS pixels; 18 states plus a product dialog, keyboard activation, map scrolling and mobile view selection. Final scans reported no page overflow, axe violations or JavaScript page errors.

Commands from the repository root:

```sh
node --experimental-vm-modules --test tests/*.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser/navigation.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser/design-system.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser/continuity.mjs
```

## Evidence limits

Browser checks after login use local synthetic sessions, snapshots, module HTML and API responses. They do not verify real Servicebio/Ventures content, live Enexia records, Notion/OneNote synchronization, database writes, AI results or Manus billing. No provider request was made. The 640px reflow check is not a claim of real browser zoom/Safari/VoiceOver coverage; axe does not certify full accessibility.
