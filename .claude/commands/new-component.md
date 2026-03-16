# /new-component — Scaffold a new React component

Ask the user for:
1. Component name (PascalCase)
2. Which directory: `primitives`, `table`, `watches`, or `layout`
3. What props it needs

Then create `src/components/<dir>/<Name>.tsx` following project conventions:
- Named export (not default)
- Inline prop type (not interface)
- Use `cn()` from `#/lib/helpers` for conditional classes
- Import types from `#/types`
- Dark-first Tailwind: zinc grays for structure, amber for accent/highlight

After creating the component, run `./node_modules/.bin/tsc --noEmit` to confirm no type errors.
