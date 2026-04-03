# Mainspring

A watch-flipping tracker for hobbyists who buy, restore, and resell vintage watches. Track your purchases, restoration photos, parts inventory, and tools — with a live profit/ROI ledger.

---

## Features

- **Dashboard** — P&L overview: total profit, capital deployed, average ROI, hours logged, parts inventory snapshot, and equipment capex.
- **Watches** — Full ledger of every watch with filterable status tabs (All / In Progress / Listed / Sold). Click any row to open the detail modal.
- **Watch Detail Modal** — Stats grid (cost basis, profit, ROI, labor), restoration photo gallery with stage filters (Before / During / After / Listing), lightbox viewer, and drag-and-drop photo upload.
- **Inventory** — Spare parts stock with quantity and per-SKU value.
- **Equipment** — Tools & equipment capex tracker.
- **Goal Tracker** — Sidebar progress bar toward your next grail watch.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Routing | TanStack Router (file-based, client-side SPA) |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Build | Vite 7 |
| Types | TypeScript 5 (strict) |
| Backend / DB | [PocketBase](https://pocketbase.io) (Go, SQLite) |

---

## Project Structure

```
src/
├── types/index.ts              # Watch, WatchPhoto, InventoryItem, Equipment
├── lib/
│   ├── constants.ts            # HOURLY_RATE, GOAL, NAV_PAGES
│   ├── helpers.ts              # fmt, fmtPct, profit, roi, cn
│   └── mocks/                  # Mock data: watches, inventory, equipment, meta
├── context/
│   └── watches.tsx             # WatchesProvider + useWatches() hook
├── components/
│   ├── layout/AppShell.tsx     # Sidebar nav + page header shell
│   ├── primitives/             # Btn, KpiCard, SectionLabel, StagePill, StageTag, StatusBadge
│   ├── table/                  # Th, Td, TableRow, TableWrap
│   └── watches/                # ThumbStrip, Lightbox, UploadZone, WatchModal
└── routes/
    ├── __root.tsx              # Root layout: WatchesProvider + AppShell
    ├── index.tsx               # / — Dashboard
    ├── watches.tsx             # /watches
    ├── inventory.tsx           # /inventory
    └── equipment.tsx           # /equipment
```

---

## Running with Docker (recommended for local use)

**Requirements:** Docker Desktop (or Docker Engine + Compose plugin)

```bash
git clone <repo-url>
cd mainspring
docker compose up --build
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| PocketBase admin | http://localhost:8080/_/ |

On first boot, PocketBase runs all migrations and creates a fresh database. Before logging in to the app, visit the admin panel and create a superuser account.

Data persists in a named Docker volume (`pb_data`) between restarts. To wipe everything and start fresh:

```bash
docker compose down -v
```

---

## Running without Docker

**Requirements:** Node 22+, Go 1.24+

**Backend** — start PocketBase:
```bash
cd pocketbase/base
go run . serve
# Runs on http://127.0.0.1:8080
# Admin panel: http://127.0.0.1:8080/_/
```

**Frontend** — in a separate terminal:
```bash
npm install
npm run dev        # dev server on :3000
npm run build      # production build
npm run test       # vitest
```

The frontend defaults to `http://127.0.0.1:8080` for the PocketBase URL, so no `.env` file is needed for local development.

---

## Environment Variables

Vite env vars are baked in at build time. For `npm run dev` the defaults work without any configuration.

| Variable | Default | Description |
|---|---|---|
| `VITE_POCKETBASE_URL` | `http://127.0.0.1:8080` | PocketBase API base URL |
| `VITE_ASSET_URL` | — | CDN base URL for watch photos (production only) |

---

## Adding a New Route

Use the `/new-route` Claude skill (`.claude/commands/new-route.md`), or manually:

1. Create `src/routes/<name>.tsx` with `createFileRoute('/<name>')`
2. Add the page to `NAV_PAGES` in `src/lib/constants.ts`
3. Add its subtitle to `PAGE_SUBTITLES` in `src/components/layout/AppShell.tsx`
4. Run `npm run dev` once — TanStack Router auto-regenerates `routeTree.gen.ts`

---

## Watch Status Flow

```
acquired → in_progress → listed → sold
```

Each status maps to a color-coded badge: violet → amber → blue → green.

## Restoration Photo Stages

Photos are tagged by stage and filterable in the watch modal:

| Stage   | Color |
|---------|-------|
| Before  | Red   |
| During  | Amber |
| After   | Green |
| Listing | Blue  |
