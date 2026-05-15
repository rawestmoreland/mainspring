# WCAG & Accessibility Guidelines

**IMPORTANT: Read and follow these rules for every UI component, page, and style change.**

This project uses a dark-first design (zinc-950 backgrounds, amber accents). That makes contrast failures easy to accidentally introduce. All text, icons, and interactive elements must pass the thresholds below before code is considered done.

---

## Contrast Ratios (WCAG 2.1 AA — minimum required)

| Element type | Minimum ratio |
|---|---|
| Normal text (< 18px or < 14px bold) | **4.5 : 1** |
| Large text (≥ 18px regular, or ≥ 14px bold) | **3 : 1** |
| UI components & graphical objects (borders, icons, chart lines) | **3 : 1** |
| Placeholder text | **4.5 : 1** |
| Disabled elements | Exempt (must still look visually distinct) |
| Focus indicators | **3 : 1** against adjacent colors |

WCAG 2.1 AAA (stretch goal):
- Normal text: **7 : 1**
- Large text: **4.5 : 1**

### Quick reference — Tailwind dark palette ratios on zinc-950 (#09090b)

| Tailwind class | Hex | Ratio on zinc-950 | Passes AA normal | Passes AA large |
|---|---|---|---|---|
| `text-white` | #ffffff | ~21 : 1 | Yes | Yes |
| `text-zinc-100` | #f4f4f5 | ~18 : 1 | Yes | Yes |
| `text-zinc-200` | #e4e4e7 | ~14 : 1 | Yes | Yes |
| `text-zinc-300` | #d4d4d8 | ~11 : 1 | Yes | Yes |
| `text-zinc-400` | #a1a1aa | ~6.5 : 1 | Yes | Yes |
| `text-zinc-500` | #71717a | ~3.9 : 1 | **No** | Yes |
| `text-zinc-600` | #52525b | ~2.4 : 1 | **No** | **No** |
| `text-zinc-700` | #3f3f46 | ~1.7 : 1 | **No** | **No** |
| `text-amber-400` | #fbbf24 | ~9.5 : 1 | Yes | Yes |
| `text-amber-500` | #f59e0b | ~7.5 : 1 | Yes | Yes |
| `text-amber-600` | #d97706 | ~5.3 : 1 | Yes | Yes |
| `text-green-400` | #4ade80 | ~8.9 : 1 | Yes | Yes |
| `text-red-400` | #f87171 | ~5.7 : 1 | Yes | Yes |
| `text-blue-400` | #60a5fa | ~6.8 : 1 | Yes | Yes |

**Never use `text-zinc-500` or darker for body/label text on zinc-950 backgrounds.**
Use `text-zinc-400` as the absolute floor for secondary/muted text.

---

## Color Rules for This Project

### Backgrounds (dark-first stack)
```
Root:         bg-zinc-950   (#09090b)
Cards/panels: bg-zinc-900   (#18181b)
Elevated:     bg-zinc-800   (#27272a)
Hover states: bg-zinc-700   (#3f3f46)  — surface only, never text on this
```

### Text hierarchy (on zinc-950/900 surfaces)
```
Primary:      text-zinc-100   — headings, key values, labels
Secondary:    text-zinc-300   — supporting text, descriptions
Muted:        text-zinc-400   — timestamps, metadata, captions  ← minimum floor
Disabled:     text-zinc-600   — only for truly disabled/inactive elements
Accent:       text-amber-400  — highlights, active states, CTAs
```

**DO NOT** use `text-zinc-500`, `text-zinc-600`, or `text-zinc-700` for readable content. These fail AA on dark backgrounds.

### Borders & dividers
```
Strong:  border-zinc-700  — card outlines, table borders
Subtle:  border-zinc-800  — dividers within a panel
```

Border colors are UI components — they must meet **3:1** against their background. `border-zinc-700` on `bg-zinc-900` passes; `border-zinc-800` on `bg-zinc-900` is borderline — prefer `border-zinc-700` when the border carries meaning.

---

## Interactive Elements

### Focus visibility (WCAG 2.4.7, 2.4.11)
Every interactive element must have a visible focus ring. Never use `outline-none` without replacing it with an equivalent focus style.

```tsx
// Correct — custom focus ring
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"

// Wrong — removes focus with nothing in its place
className="outline-none focus:outline-none"
```

### Buttons
- Active/default: text must pass 4.5:1 on button background
- `bg-amber-500 text-zinc-950` → ratio ~7:1 ✓
- `bg-zinc-800 text-zinc-100` → ratio ~10:1 ✓
- `bg-zinc-800 text-zinc-400` → ratio ~3.4:1 — acceptable only for large/icon buttons, not label text
- Hover state must remain accessible — lightening a background can cause text to fail

### Links
- Default: distinguish from surrounding text by color **and** underline (or icon), not color alone
- Visited state should be visually distinct
- `text-amber-400 underline` on zinc-950 → passes ✓

### Form inputs
```tsx
// Accessible input pattern for this project
<input
  className="bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500
             rounded px-3 py-2 w-full
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
             focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900"
  aria-label="..."  // always present or paired with <label>
/>
```
Note: `placeholder:text-zinc-500` is borderline (~3.9:1) — acceptable for placeholder only because the filled value will use `text-zinc-100`. Use `placeholder:text-zinc-400` for extra margin.

---

## Semantic HTML & ARIA

### Use semantic elements first
HTML semantics are always preferred over ARIA roles. ARIA supplements; it does not replace.

```tsx
// Prefer
<button onClick={…}>Save</button>
<nav aria-label="Main navigation">…</nav>
<main>…</main>
<section aria-labelledby="section-heading">…</section>

// Avoid
<div role="button" onClick={…}>Save</div>  // loses keyboard & AT behavior
```

### Landmark regions (every page must have)
- `<main>` — exactly one per page
- `<nav>` — with `aria-label` when multiple nav elements exist
- `<header>` / `<footer>` — at page or section level

### Headings
- One `<h1>` per page (the page title)
- Do not skip levels (h1 → h3 is wrong; h1 → h2 → h3 is correct)
- Visual size and semantic level must align — do not use `<h4>` styled large just because it looks right

### Tables (TanStack Table)
- `<table>` with `<thead>`, `<tbody>`, `<th scope="col">` for column headers
- `<caption>` or `aria-label` on the `<table>` describing its content
- Sortable columns: `aria-sort="ascending" | "descending" | "none"` on `<th>`

```tsx
<th
  scope="col"
  aria-sort={
    column.getIsSorted() === 'asc' ? 'ascending'
    : column.getIsSorted() === 'desc' ? 'descending'
    : 'none'
  }
>
```

---

## Images & Icons

### Images
- Decorative images: `alt=""` (empty string, not omitted)
- Informative images: `alt="descriptive text"`
- Functional images (inside a button): `alt="button purpose"` or `aria-label` on the button + `alt=""`

### SVG icons
```tsx
// Decorative icon alongside visible text label
<svg aria-hidden="true" focusable="false">…</svg>

// Standalone icon (no visible label) — must have accessible name
<button aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">…</svg>
</button>
```

Always set `focusable="false"` on SVGs to prevent browsers from focusing them independently.

---

## Motion & Animation

Users with `prefers-reduced-motion: reduce` must not experience distracting or vestibular-triggering animations (WCAG 2.3.3 AAA / best practice for AA).

In Tailwind, use `motion-safe:` and `motion-reduce:` variants:
```tsx
className="transition-opacity motion-reduce:transition-none"
className="animate-spin motion-reduce:animate-none"
```

---

## Keyboard Navigation

All interactive elements must be reachable and operable via keyboard alone.

- Tab order must follow visual reading order (left-to-right, top-to-bottom)
- Custom components (dropdowns, modals, popovers) must implement arrow-key navigation per the ARIA Authoring Practices Guide (APG)
- Modal dialogs must trap focus inside while open and return focus to the trigger on close
- Skip links: add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` as the first focusable element in `__root.tsx`

### Tab index rules
- `tabIndex={0}` — makes a non-interactive element focusable (use sparingly; prefer semantic elements)
- `tabIndex={-1}` — removes from tab order but still programmatically focusable (correct for modal panels, focus-managed children)
- **Never use `tabIndex > 0`** — it breaks natural tab order

---

## Screen Reader Text

Use Tailwind's `sr-only` for visually hidden but screen-reader-visible text:
```tsx
<span className="sr-only">Current page:</span>
```

Apply to:
- Supplemental context ("3 items selected")
- Column sort direction labels
- Icon-only button labels (as alternative to `aria-label`)
- Status announcements

---

## Status & Live Regions

Dynamic content changes (toasts, loading states, counts) must be announced.

```tsx
// Polite — announces after current speech finishes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Assertive — interrupts immediately (use for errors only)
<div role="alert">{errorMessage}</div>
```

---

## Common Violations to Avoid

| Pattern | Problem | Fix |
|---|---|---|
| `text-zinc-500` on `bg-zinc-900` | Fails AA (3.2:1) | Use `text-zinc-400` minimum |
| `text-zinc-600` anywhere readable | Fails AA badly | Use `text-zinc-300` or higher |
| `<div onClick={…}>` | Not keyboard accessible | Use `<button>` |
| `outline-none` without replacement | Removes focus visibility | Add `focus-visible:ring-*` |
| Icon-only button with no label | Screen readers say "button" | Add `aria-label` |
| `<img>` without `alt` | Fails WCAG 1.1.1 | Add `alt=""` or descriptive alt |
| Placeholder as the only label | Field has no accessible name when filled | Add `<label>` or `aria-label` |
| Color as the only differentiator | Fails WCAG 1.4.1 | Add icon, underline, or shape |
| Skipping heading levels | Confuses screen reader navigation | Keep h1 → h2 → h3 hierarchy |
| `tabIndex={1}` or higher | Breaks tab order | Use `tabIndex={0}` or `-1` only |
| Low-contrast border on input | Field boundary invisible | Use `border-zinc-600` minimum |

---

## Pre-Submit Checklist for UI Changes

- [ ] All text is `text-zinc-400` or brighter on dark surfaces
- [ ] Interactive elements have visible focus rings (`focus-visible:ring-*`)
- [ ] No `outline-none` without a replacement focus style
- [ ] Every `<img>` has an `alt` attribute
- [ ] Icon-only buttons have `aria-label`
- [ ] Page has exactly one `<h1>`, levels not skipped
- [ ] Table `<th>` elements have `scope="col"` or `scope="row"`
- [ ] Modals trap focus and return focus to the trigger on close
- [ ] Dynamic content uses `aria-live` or `role="alert"`
- [ ] Color is not the sole means of conveying information
- [ ] Animations respect `motion-reduce:`

---

## References

- WCAG 2.1: https://www.w3.org/TR/WCAG21/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility
