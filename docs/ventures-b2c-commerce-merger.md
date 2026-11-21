# B2C Commerce merger contract (Personal OS / Ventures)

Status: **Phase A — strategic and read-only portfolio consolidation**. This document defines the safe integration path; it does not imply that private module assets, marketplace connections, SKU rows or payment/order APIs are already migrated.

## Business boundary

- Preserve exactly four Ventures records. The existing `b2c` venture becomes **B2C Commerce**; it is not a fifth venture.
- Two portfolios belong to `b2c`: `better_living` and `wellness_foods`.
- Night Comfort Food stays an independent venture because it has different preparation, fulfillment and operating controls.
- Shopee and TikTok Shop are **target channels**, not verified merchant integrations. Never render an "active" channel without source evidence.
- Preserve original Better Living task IDs, statuses, dates and historical device concepts. Legacy rows are not evidence of currently approved products.

## Source ownership

| Entity | Authoritative source | Personal OS behavior |
| --- | --- | --- |
| Shared B2C vision/mission and weekly commitments | Existing Notion B2C page/tasks | Read-only dated plan/snapshot |
| Wellness SKU IDs, product evidence and gates | Wellness Portfolio OS | Owner-scoped read replica, with source revision |
| Better Living product, supplier and validation records | Existing Better Living database/source | Keep stable IDs and historical status |
| Unified venture overview | Ventures HQ source snapshot | Mirror into existing `ventures` module |
| Shopee / TikTok orders | Marketplace providers **only after authorization** | Unknown / not connected until real integration |
| Personal OS app navigation | This repository | Change launcher copy; no private React source in public repo |

The protected Ventures module is separately built and published. Editing the public Personal OS launcher cannot update the module's own navigation, charts or SKU data.

## Minimum portfolio payload (future private publisher)

A `b2c` snapshot must preserve legacy shape and expose portfolio-specific detail without claiming more than its source:

```js
{
  id: "b2c",
  portfolios: [
    {
      id: "better_living" | "wellness_foods",
      source: { system: "notion" | "wellness_portfolio_os",
                revision: "source-provided", readAt: "ISO-8601" },
      products: [{ sourceId: "stable-id", stage: "source-status",
                   eligibility: "qualified" | "blocked" | "unknown",
                   evidenceRefs: ["source-native-record-id"] }]
    }
  ],
  commerce: {
    channels: [{ id: "shopee" | "tiktok_shop",
                 connected: false, status: "unknown" }],
    orders: null,
    contributionProfit: null
  }
}
```

This is a *contract example*, not a live snapshot or a license to seed synthetic records in production. A bridge must not transmit raw records to the public repository or expose authenticated source credentials in client code.

## Evidence and status invariants

1. Preserve source IDs and provenance; no fuzzy re-keying. One `sourceId` maps to one record in its source system.
2. Source revision and read timestamp must be monotonic. A stale publish cannot overwrite a newer replica.
3. Distinguish `plan`, `doing`, `reported_done`, and `verified_done`. No conversion to "completed" solely because a UI action succeeded.
4. Product readiness is computed only from the applicable portfolio gate definitions. Passing an unrelated Home Care gate cannot satisfy food-safety documentation for Wellness Foods.
5. A group-level P&L may aggregate only verified compatible order/cost data with known date ranges and units. Missing merchants/orders/margins remain unknown, not zero.
6. Keep Shopee/TikTok customer credentials, marketplace API secrets, authenticated data and publisher credentials server-side. All replica reads remain owner-scoped and RLS-protected.
7. Write actions (listing, pricing, outreach, purchasing, refunds, source mutation) require explicit approval and an authorized provider integration.

## Rollout / acceptance

- [x] Record shared B2C strategy in canonical Notion source and read it back.
- [x] Publish a read-only B2C consolidated **summary** in the existing four-venture snapshot and read it back.
- [x] Align Personal OS launcher copy in a review branch.
- [ ] Implement an owner-bound private Wellness publisher and verify exact product-ID parity, record counts and source signatures.
- [ ] Update the authoritative private Ventures UI: two portfolio tabs inside one B2C business, shared commerce and P&L views, source health, and preserved legacy views.
- [ ] Publish the private Ventures module asset and verify SHA/source-commit provenance in Personal OS.
- [ ] Verify authenticated cross-owner denial, stale snapshot rejection, deduplication, logout cleanup and rollback before releasing.
- [ ] Only then consider live marketplace integrations after separate commercial authorization.

No production schema migration, deletion, live merchant API activation, purchase, or automatic partner outreach is part of this Phase A contract.

## Rollback

Keep the prior protected Ventures asset and versioned source snapshot. If the owner-scoped publisher or UI fails, revert to the prior asset and source revision without rewriting historical Notion tasks or Wellness evidence. Audit the source freshness indicator after the rollback.
