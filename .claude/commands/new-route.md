# /new-route — Scaffold a new TanStack Router page route

Create a new page route for the Mainspring app. Ask the user for:
1. Route path (e.g. `/analytics`)
2. Page title and sidebar icon character
3. Whether it needs a KPI row at the top
4. Whether it needs a data table

Then:

1. **Create `src/routes/<name>.tsx`** with this template:
```tsx
import { createFileRoute } from '@tanstack/react-router';
// import helpers, components as needed

export const Route = createFileRoute('/<name>')({ component: <Name>Page });

function <Name>Page() {
  return (
    <>
      {/* KPI row if requested */}
      {/* Table if requested */}
    </>
  );
}
```

2. **Add to `NAV_PAGES`** in `src/lib/constants.ts`:
```ts
{ id: '<name>', label: '<Label>', icon: '<icon>', path: '/<name>' },
```

3. **Add to `PAGE_SUBTITLES`** in `src/components/layout/AppShell.tsx`:
```ts
'/<name>': 'SUBTITLE IN ALL CAPS',
```

4. Remind the user to run `npm run dev` once so TanStack Router regenerates `routeTree.gen.ts`.

5. Run `./node_modules/.bin/tsc --noEmit` to confirm no type errors.
