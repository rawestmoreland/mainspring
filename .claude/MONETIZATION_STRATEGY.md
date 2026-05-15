# Hairspring Monetization Strategy

## Model: Value-Capped Freemium

Hairspring operates on a freemium model. Free accounts unlock meaningful core functionality immediately — no trial clock, no credit card required. Upgrade gates are tied to usage volume and advanced feature depth, not to time.

This replaces the previous 14-day Pro trial, which created urgency pressure without clearly communicating long-term value. The new model lets users self-qualify: hobbyists with a small collection stay free forever, while serious flippers and collectors hit the limits naturally and upgrade on their own terms.

---

## Tier Feature Matrix

| Feature | Free | Pro |
|---|---|---|
| Active projects | **2 max** | Unlimited |
| Photos per project | **3 max** | Unlimited |
| Timegrapher logging | Simple (avg rate + amplitude) | Full 6-position grid + delta tracking |
| Public profile | ✓ | ✓ |
| Inventory management | ✓ | ✓ |
| Equipment tracking | ✓ | ✓ |
| Repair log (text) | ✓ | ✓ |
| Shopping list | — | ✓ |
| Watch wishlist | — | ✓ |
| Post image uploads | — | ✓ |

---

## Design Principles

**Free tier is genuinely useful.** A user tracking 1–2 flips can do everything meaningful without paying. This drives organic attribution — public profiles stay free so Hairspring gets word-of-mouth exposure from active free users.

**Limits are volume-based, not feature-blocked.** Where possible, free users get a simplified version of Pro features (e.g. timegrapher) rather than a hard lock. Hard locks are reserved for features that have no meaningful free equivalent (shopping list, wishlist, post images).

**No trial friction.** The removal of the 14-day trial eliminates the moment where a user's access is revoked — a high churn trigger. Users now upgrade because they've outgrown the free tier, which is a stronger conversion signal.

---

## Gate Implementation

| Gate | Where enforced |
|---|---|
| Project limit (2) | `/watches/new` route (upgrade wall) + `/watches/` Add Watch button (disabled + tooltip) |
| Photo limit (3 per project) | `/watches/$watchId/gallery` upload zone (count indicator → upgrade nudge at limit) |
| Timegrapher depth | `/watches/$watchId/timegrapher` form + table (free = 2-field simple form; Pro = 6-position grid) |
| Shopping list | `/watches/$watchId/shopping-list` full-page paywall |
| Wishlist | `/wishlist` full-page paywall |
| Post image uploads | TipTap toolbar gated via `isPro` |

Backend enforcement (API-layer validation) for the project and photo limits is specified in `TIER_MIGRATION_SPEC.md` and should be implemented in PocketBase hooks or middleware before launch.

---

## Constants

```ts
FREE_PROJECT_LIMIT = 2   // src/lib/constants.ts
FREE_PHOTO_LIMIT   = 3   // src/lib/constants.ts
```

Both are single-source constants — update here to adjust limits globally across the UI.
