# Connected workspaces

The existing Personal OS URL now opens a workspace launcher. Personal OS keeps its original authenticated views. Servicebio and Ventures run their full React dashboards in lazily loaded, isolated documents. The shared header switches workspaces; mounted documents retain filters and open views until logout.

## Data and privacy

The original owner-private Sites remain authoritative snapshot writers. Their existing API and MCP write paths retain validation, version storage and access boundaries. A server-only bridge publishes a read replica to `personal_os_module_snapshots`. A random capability per module binds the publisher to one owner and destination. Only capability hashes exist in the private database schema. The original Sites store publisher secrets as runtime environment variables; publisher credentials never enter browser source.

The original React UI packages also stay private. Their standalone builders produce self-contained HTML stored as gzip/base64 in `personal_os_module_assets`, with source commit and asset hash. No private UI, business dataset or original source excerpt is copied into this public repository. Both tables grant owner-only authenticated SELECT through RLS; browser writes and anonymous reads are denied.

`workspaces.mjs` fetches the protected UI after authentication, decompresses it in memory and mounts a trusted same-origin `srcdoc` document. A narrow parent facade returns an exact source payload through an owner-constrained RLS query. It does not return auth tokens or publishing capabilities. Logout and user changes remove mounted documents and cancel pending package display. Reopening the page requires authenticated reads again.

## Synchronization

Original Site reads and successful writes attempt a bounded mirror operation. A repeated identical snapshot is unchanged; older snapshots cannot replace a newer revision. Mirror failure does not discard a successful original source write. Source writers report replica retry status separately; a later read/write retries. Replica reads themselves do not read Notion, activate a paused schedule or change source facts. A current UI can therefore still display an old source revision; the launcher reports the source timestamp, not a fabricated sync time.

For UI changes, rebuild the package in its private source repository, publish the exact source commit there, then replace the corresponding owner-protected asset row with that package and provenance. No runtime service-role key is needed by Personal OS.

## Validation

Run `node --experimental-vm-modules --test tests/*.test.mjs`. Tests cover source analytics and progress, module route allowlists, scoped gateway reads, lazy package loading, retained module state, logout cleanup and in-flight user changes. Database checks separately verify owner reads, zero rows for another user, denied anonymous table reads, wrong/cross-module capability rejection, deduplication and rejection of older replicas.


## Henry OS visual identity

The approved mark is `henry-os-mark.png`, based on the refined interwoven orbit selected 31 October 2026. It represents the whole operating system; its colors do not correspond to a fixed number of domains. Use the same mark for the common navigation and favicon. Navigation icons are consistent in weight and use the accent of their domain.

Shared palette: deep ink `#172231`, lavender `#8578bb`, jade `#297d70`, champagne bronze `#ab7958`, paper `#f4f5f7`. Personal OS uses lavender, Servicebio uses jade, and Ventures uses bronze. Future domains can add distinct accessible accents without changing the mark. Data visualization colors represent status or category when indicated by the legend; never recolor them in a way that changes their meaning. Preserve keyboard focus visibility, readable contrast and reduced motion.

The standalone private Site packages use the same mark and `app/henry-theme.css` in each source repository. Their own hosted copies keep the logo asset in `public/`; rebuild and republish the corresponding protected module when updating the shared identity.
