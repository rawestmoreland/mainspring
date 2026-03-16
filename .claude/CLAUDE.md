# Mainspring — Claude Project Rules

## Project Overview
Watch flip tracker SPA. Dark-UI, data-dense. Stack: React 19, TanStack Router (file-based, router-only — NO TanStack Start SSR), Tailwind CSS v4, React Hook Form + Zod, TanStack Table, TypeScript strict.

## Tech Stack Decisions
- **Routing**: TanStack Router file-based. All routes live in `src/routes/`. Auto-generates `src/routeTree.gen.ts` — never edit it.
- **Styling**: Tailwind v4 utility classes only. No CSS modules. Dark-first (`bg-zinc-950` root). Design language: zinc grays, amber accent, mono fonts for data.
- **State**: `WatchesProvider` context in `src/context/watches.tsx` wraps entire app from `__root.tsx`. Use `useWatches()` in any route.
- **Forms**: React Hook Form + Zod schemas. Define schemas in the same file as the form component unless reused.
- **Tables**: TanStack Table for sortable/filterable tables. Simple display-only tables use primitives from `src/components/table/index.tsx`.

## Key Aliases
- `#/*` → `src/*` (both `#/` and `@/` work per tsconfig)

## Directory Structure
```
src/
├── types/index.ts          # All shared TypeScript types
├── lib/
│   ├── constants.ts        # HOURLY_RATE, GOAL, NAV_PAGES
│   ├── helpers.ts          # fmt, fmtPct, profit, roi, cn, placeholderImg
│   └── mocks/              # Mock data (meta.ts, mock_watches.ts, etc.)
├── context/
│   └── watches.tsx         # WatchesProvider + useWatches hook
├── components/
│   ├── layout/AppShell.tsx # Sidebar + page shell — rendered from __root.tsx
│   ├── primitives/         # Btn, KpiCard, SectionLabel, StagePill, StageTag, StatusBadge
│   ├── table/index.tsx     # Th, Td, TableRow, TableWrap
│   └── watches/            # ThumbStrip, Lightbox, UploadZone, WatchModal
└── routes/                 # File-based routes
    ├── __root.tsx           # WatchesProvider + AppShell + Outlet
    ├── index.tsx            # / — Dashboard
    ├── watches.tsx          # /watches
    ├── inventory.tsx        # /inventory
    └── equipment.tsx        # /equipment
```

## Coding Standards
- Strict TypeScript. No `any`. Prefer union types over enums.
- All props interfaces are inline types, not `interface` keyword.
- Optional props use `?`, never default to `undefined` explicitly.
- `cn()` helper from `#/lib/helpers` for conditional class names — no clsx/tailwind-merge.
- Named exports everywhere. No default exports except route files (`export const Route = ...`).
- Sort imports: external → internal (#/) → relative.

## Adding a New Route
1. Create `src/routes/<name>.tsx`
2. Export `const Route = createFileRoute('/<name>')({ component: PageComponent })`
3. Add the route to `NAV_PAGES` in `src/lib/constants.ts` if it belongs in the sidebar
4. Add subtitle to `PAGE_SUBTITLES` in `src/components/layout/AppShell.tsx`
5. Run `npm run dev` once — TanStack Router auto-regenerates `routeTree.gen.ts`

## Common Patterns

### New data table with TanStack Table
```tsx
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
// Define columns with createColumnHelper<T>(), pass data + columns to useReactTable
// Render with Th/Td/TableRow/TableWrap from #/components/table
```

### New form with React Hook Form + Zod
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
const schema = z.object({ ... });
type FormData = z.infer<typeof schema>;
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
```

### KPI section
```tsx
<div className="grid grid-cols-4 gap-4 mb-7">
  <KpiCard highlight label="..." value={fmt(n)} valueClass="text-green-400" sub="..." />
</div>
```

## Build & Dev
- `npm run dev` — dev server on :3000
- `npm run build` — production build (vite build)
- `npm run test` — vitest

## Commit Style
Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`. Keep subject line ≤72 chars.
