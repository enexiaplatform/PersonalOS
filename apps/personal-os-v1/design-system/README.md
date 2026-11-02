# Henry OS UI foundation

Load `tokens.css` first, legacy view geometry and `executive.css` next, then `design-system/components.css`. The Laboratory loads that same foundation and recipe entry; `laboratory.css` contains explorer layout only. No framework or runtime dependency was added to Personal OS.

- `primitives.css`: literal ramps, font/spacing/size/radius/motion/elevation/z-index scales.
- `semantic.css`: usage aliases and normal/compact density. Future appearances replace this mapping.
- `components/tokens.css`: dimensions and component behavior decisions inherited from semantic roles.
- `compatibility.css`: deliberate `--os-*` and legacy-name bridge; do not add new uses.
- `typography.css`, `elevation.css`: self-hosted Vietnamese typography, focus, browser surfaces and depth.
- `components/*.css`: reusable `ui-*` controls and content recipes.
- `patterns/*.css`: shared product patterns and view-owned composition; host geometry does not redefine controls.
- `ui.mjs`: escaped HTML renderers and progressive enhancement for the existing vanilla application. `mountUI()` delegates interactions once and enhances newly rendered controls. Existing application handlers keep ownership of source writes.
- `catalog.mjs`: component anatomy, variants, meaningful states, behavior and token contracts. The explorer renders this contract directly.

```js
import {kpi, button, taskRow, mountUI} from './design-system/ui.mjs';
// null is unavailable; actual numeric 0 remains zero. No destination means article.
container.innerHTML = kpi({label:'Verified records',value:null,context:'Source unavailable'});
mountUI();
```

`button({label,variant,size,iconName,attrs,disabled,loading})` supports primary/secondary/tertiary/ghost/destructive and sm/md/lg. `attrs.type='submit'` enables native form validation. Busy and disabled controls reject activation. Icon buttons always require a label. HTML/data/ARIA attributes are escaped; event-handler attributes are rejected.

`kpi({label,value,context,iconName,tone,state,source,trend,attrs})`: source optionally accepts `{label,state}`; trend accepts a source-supplied `{label}` and never computes a fabricated change. Only supported destination/action data attributes create a button. Missing values use an em dash. An informational KPI has no navigation affordance.

Forms use `.ui-field` → associated `.ui-label` → `.ui-input`/`.ui-select` → `.ui-help`/`.ui-error`. Reference help/error ids with `aria-describedby`; set `aria-invalid` for validation. Use native disabled/readonly/checked/indeterminate states. Custom comboboxes follow the example in the explorer and expose an active descendant without moving DOM focus.

Overlays use a labelled native `.ui-dialog`; open with `data-ui-dialog="id"` and close with `data-ui-close`. Destructive confirmations autofocus cancel. Drawers add `.ui-drawer` and `data-side="left|right"`. Native `[popover]` panels use `data-ui-popover="id"`; menus add `role="menu"`, `data-ui-menu` and menuitem buttons. Interactive content belongs in a popover, not a tooltip.

`data-state` is a visual inspection API. Product code uses actual native/ARIA state. Loading placeholders have `aria-busy` and an accessible loading label; empty/error states explain the absent source and a real next step. Never show laboratory fixtures in product routes.

## Isolated workspaces

Run `node scripts/export-design-system.mjs /absolute/native/app/henry-design-system.css` from the repository root. This recursively bundles the exact public token/recipe imports, rewrites the self-hosted font path and fails on import cycles. The generated CSS is committed in each private source repository. Its provider imports a matching copy of `ui.mjs` and `experience.mjs`, mounted after the native UI renders; source readers and React controllers remain native.

Both Site builds and standalone protected-module builds consume this artifact. After publishing a native source version, rebuild the protected package and update only its existing owner/module asset row through the established workflow. Never put native private source, snapshots or HTML packages in the public repository. Parent iframe styling is not the publishing mechanism.

## Checks

`node --experimental-vm-modules --test tests/*.test.mjs`

Serve `apps/personal-os-v1/` locally; then run `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/browser/design-system.mjs`. The browser suite only operates on labelled synthetic Laboratory content.

Navigation regression: `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/browser/navigation.mjs`. This uses local synthetic module HTML and 120ms source latency to verify parallel startup, request deduplication, warm frame reuse, four sidebar groups, mobile optgroups and full-width header alignment. Timings from this fixture are not production latency measurements.
