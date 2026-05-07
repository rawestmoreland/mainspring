# Mainspring → Multi-Tenant SaaS Migration Plan

This document captures the full context and implementation plan for migrating
Mainspring from a single-owner app into a multi-tenant SaaS product
(domain: **hairspring.app**). Share this with Claude Code to drive implementation.

---

## Background

Mainspring is a watch repair and restoration tracker and blog platform. It is
currently a single-user app (the owner, Richard) with a public-read /
admin-write PocketBase backend deployed on Fly.io, and a React 19 +
TanStack Start (SSR) app deployed to Cloudflare Workers.

Following interest from the watch restoration community on Reddit, the goal is
to open the platform to other users so they can track their own projects and
optionally publish a public-facing restoration blog under a custom subdomain
(e.g. `richard.hairspring.app`).

---

## Current Schema (as-built)

| Collection | Purpose |
|---|---|
| `watches` | Core entity. make, model, reference, year, serial, status (`acquired` / `in_progress` / `paused` / `listed` / `sold`), condition_bought, bought_price, sold_price, hours_spent, bought_date, sold_date, notes (rich editor), listing_url. **Has `user` field.** |
| `watch_photos` | Photos per watch. Relation → `watches` (cascade). stage (`before` / `during` / `after` / `listing`), caption, sort_order, image file |
| `service_logs` | Bench sessions per watch. Relation → `watches` (cascade). date, hours, description |
| `parts_used` | Junction: inventory parts consumed by a watch. Relation → `watches` (cascade), optional relation → `inventory`. Snapshot fields: part_name, qty_used, unit_cost, date_used |
| `inventory` | Spare parts stock. name, category, qty, unit_cost, supplier, notes. **Has `user` field.** |
| `equipment` | One-time tool/capex purchases. name, cost, date_acquired, supplier, notes. **Has `user` field.** |
| `totals` | SQL view. Aggregates inventory_value, inventory_units, equipment_value — currently global, needs to be replaced |
| `repair_posts` | Blog posts. title, body (plain text), session_date, images (multi-file). **No `user` field. No `watch` relation. Both still needed.** |
| `timegrapher_readings` | Pre/post-service timing data. Relation → `watches` (cascade). status (`before_service` / `after_service`), lift_angle, rate/amplitude/beat-error for 6 positions: DU, DD, CU, CD, CL, CR |
| `user_profiles` | ✅ Created. Fields: `user` (relation → `_pb_users_auth_`, cascade, unique), `subdomain` (optional, regex validated, unique index), `display_name` (required), `bio`, `is_public` (bool). **Access rules currently all `null` — needs to be set.** |

---

## Migration Status

### ✅ Already done

- `user_profiles` collection created with all fields and unique subdomain index
- `user` RelationField added to `watches`
- `user` RelationField added to `inventory`
- `user` RelationField added to `equipment`

### ❌ Still needed (implement in this order)

1. Add `user` RelationField to `repair_posts`
2. Add `watch` RelationField to `repair_posts` (optional relation — allows standalone posts)
3. Update access rules (row-level security) on every collection — nothing is user-scoped yet
4. Replace `totals` view with a user-scoped frontend query
5. Add subdomain validation hook to `main.go`
6. Data backfill — set `user` on all existing records to Richard's user ID
7. All frontend work (auth, data scoping, profile settings, public routes)

---

## What Still Needs to Change

### 1. Add missing fields to `repair_posts`

```go
// user field
&core.RelationField{
    Name:          "user",
    Required:      true,
    CollectionId:  "_pb_users_auth_",
    CascadeDelete: false,
    MaxSelect:     1,
}

// watch relation (optional — standalone posts are allowed)
&core.RelationField{
    Name:          "watch",
    Required:      false,
    CollectionId:  watchesCollectionId, // pbc_1423682000
    CascadeDelete: false,
    MaxSelect:     1,
}
```

### 2. Access rules on all collections

**`user_profiles`** — currently all null, needs:
```
listRule:   ""          (public read)
viewRule:   ""          (public read)
createRule: "@request.auth.id != ''"
updateRule: "@request.auth.id = user"
deleteRule: null
```

**`watches`, `inventory`, `equipment`** — owner-only:
```
listRule:   "@request.auth.id != '' && user = @request.auth.id"
viewRule:   "@request.auth.id != '' && user = @request.auth.id"
createRule: "@request.auth.id != ''"
updateRule: "@request.auth.id != '' && user = @request.auth.id"
deleteRule: "@request.auth.id != '' && user = @request.auth.id"
```

**`watch_photos`, `service_logs`, `parts_used`, `timegrapher_readings`** — scoped
via their parent `watches` relation:
```
listRule:   "@request.auth.id != '' && watch.user = @request.auth.id"
viewRule:   "@request.auth.id != '' && watch.user = @request.auth.id"
createRule: "@request.auth.id != ''"
updateRule: "@request.auth.id != '' && watch.user = @request.auth.id"
deleteRule: "@request.auth.id != '' && watch.user = @request.auth.id"
```

**`repair_posts`** — hybrid: private to owner, publicly visible if the
owning user's profile is public:
```
listRule:   "user.user_profiles_via_user.is_public = true || @request.auth.id = user"
viewRule:   "user.user_profiles_via_user.is_public = true || @request.auth.id = user"
createRule: "@request.auth.id != ''"
updateRule: "@request.auth.id = user"
deleteRule: "@request.auth.id = user"
```

### 3. Replace the `totals` view

The current `totals` SQL view aggregates all inventory globally and cannot be
user-scoped as a static view. Delete the collection and replace with
parameterized PocketBase queries on the frontend filtered by the current
user's ID. The dashboard currently consumes `totals` for inventory_value,
inventory_units, and equipment_value — these should become direct queries
with a `filter: 'user = "currentUserId"'`.

### 4. Subdomain validation hook in `main.go`

Add an `OnRecordCreate` and `OnRecordUpdate` hook for `user_profiles` that
validates the `subdomain` field server-side:

- Regex: `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$`
- Blocklist (reject these):
  ```
  www, app, api, admin, mail, smtp, imap, pop, support, help, docs, status,
  blog, dashboard, login, logout, signup, register, auth, account, settings,
  billing, pricing, about, contact, static, assets, cdn, media, images,
  uploads, dev, staging, preview, test, demo, sandbox, hairspring, mainspring
  ```

### 5. Data backfill

**This must happen before access rules are tightened**, or existing records
will become inaccessible.

Write a standalone Go script (or a one-off migration with a clear comment)
that sets `user` on all existing `watches`, `inventory`, `equipment`, and
`repair_posts` records to Richard's user ID.

---

## Frontend Changes Required

### Auth

The app has no auth UI currently. The PocketBase client lives in
`src/lib/pocketbase.ts`. Need to add:

- `/signup` — email, password, display name (auto-creates user + user_profile)
- `/login` — email + password, plus Google OAuth
- Auth guard on all existing routes — redirect unauthenticated users to `/login`
- `useAuth()` hook exposing current user and profile

### User-scoped data fetching

All PocketBase queries must add `filter: 'user = "currentUserId"'`. The
server-side rules enforce this anyway, but explicit filters are cleaner.

### Profile settings page

New route: `/settings/profile`

- Display name, bio, avatar upload
- Subdomain input with debounced availability check and format validation
- `is_public` toggle (disabled until subdomain is set)
- Clear copy explaining that subdomain = public URL on hairspring.app

### Subdomain routing (Cloudflare + TanStack Start)

**Cloudflare setup:**
1. Wildcard DNS: `*.hairspring.app → Worker` (orange cloud / proxied)
2. `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "hairspring.app/*", zone_name = "hairspring.app" },
     { pattern = "*.hairspring.app/*", zone_name = "hairspring.app" }
   ]
   ```

**TanStack Start middleware:**

Extract the subdomain from the request hostname and resolve it to a
`user_profiles` record. Thread a `tenant` value through router context:

```ts
// src/middleware/tenant.ts
const host = request.headers.get('host') ?? ''
const parts = host.split('.')
const isSubdomain = parts.length === 3 && parts[0] !== 'www'

let tenant: UserProfile | null = null
if (isSubdomain) {
  tenant = await pb.collection('user_profiles')
    .getFirstListItem(`subdomain = "${parts[0]}" && is_public = true`)
    .catch(() => null)
}
```

**Router context type:**
```ts
export type RouterContext = {
  queryClient: QueryClient
  tenant: UserProfile | null
}
```

**Route structure for public profiles:**
```
src/routes/
├── _public.tsx              # layout: reads tenant from context, 404s if null
├── _public/index.tsx        # richard.hairspring.app/ — profile + watch list
├── _public/watches.$id.tsx  # watch detail with timegrapher readings
└── _public/posts.$id.tsx    # individual repair post
```

**What public profiles show:**
- Display name, bio, avatar
- Active and completed watch projects
- Repair posts in reverse-chronological order
- Timegrapher before/after readings on watch detail pages

**What public profiles never show:**
- bought_price, sold_price, any financial data
- inventory, equipment, parts_used costs
- hours_spent (optional — Richard's call)

---

## UI / Product Scope Change: Remove "Watch Goal" Feature

The app currently has a personal savings-goal feature tracking profit progress
toward a specific watch purchase (an IWC Portugieser). This was personal to
Richard and has no place in a multi-tenant product. Remove entirely.

**What to remove:**
- `GOAL`, `GOAL_LABEL`, and `HOURLY_RATE` from `src/lib/constants.ts`
- The goal progress card in `AppSidebar.tsx` — the footer section with the
  progress bar, `goalClickCount` easter egg, `goalPct` calculation, and all
  related state and imports
- All `HOURLY_RATE` / "imputed labor" references from:
  - `src/routes/index.tsx` (dashboard KPI)
  - `src/routes/watches/$watchId/index.tsx` (watch detail financials)
  - `src/components/watches/WatchModal.tsx` (watch modal financials)

The sidebar footer space should be repurposed for a logged-in user's avatar
and display name.

---

## Implementation Order

1. Write migration: add `user` + `watch` fields to `repair_posts`
2. Write migration: update access rules on all collections
3. Write backfill script: set `user` on all existing records to Richard's ID
4. **Run backfill before deploying rule migration**
5. Handle `totals` — delete view, replace with frontend queries
6. Add subdomain validation hook to `main.go`
7. Frontend: remove watch goal feature
8. Frontend: add auth (signup / login / guard)
9. Frontend: update all data fetches to be user-scoped
10. Frontend: add `/settings/profile` route
11. Frontend: add tenant middleware + router context
12. Frontend: add `_public` layout + public profile routes
13. Cloudflare: add wildcard DNS + update `wrangler.toml`

---

## Out of Scope for This Migration

- Freemium / paid tiers (implement after multi-tenancy is stable)
- Email verification / password reset flows (PocketBase handles this,
  just needs wiring in the frontend)
