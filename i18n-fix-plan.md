# i18n Fix Plan — Hairspring

## Context

Stack: React 19, TanStack Start, react-i18next. Translation files live in `src/lib/i18n/{en,de,fr}.json` under a single `"translation"` namespace. The `t()` helper comes from `useTranslation()`. ESLint (`eslint-plugin-i18next`) is now configured and reports 349 warnings across the codebase.

This document covers every missing string and the exact pattern to fix each category. Work top-down — the new keys section first, then the file fixes.

---

## Step 1 — Add missing keys to `src/lib/i18n/en.json`

Add all of the following under the existing `"translation"` object. Then add equivalent translations to `de.json` and `fr.json`.

```jsonc
// Validation messages (shared across all forms)
"validationRequired": "This field is required",
"validationMaxLength": "Must be fewer than {{max}} characters",
"validationMakeRequired": "Make is required",
"validationModelRequired": "Model is required",
"validationYearRequired": "Year is required",
"validationBoughtPriceMin": "Bought price must be 0 or more",
"validationPartsCostMin": "Parts cost must be 0 or more",
"validationHoursMin": "Hours must be 0 or more",
"validationBoughtDateRequired": "Bought date is required",
"validationQtyMin": "Quantity must be 0 or more",
"validationUnitCostMin": "Unit cost must be 0 or more",
"validationCostMin": "Cost must be 0 or more",
"validationDateRequired": "Date is required",
"validationCaliberRequired": "Required",
"validationManufacturerRequired": "Required",
"validationPartNameRequired": "Required",

// Placeholders
"placeholderMake": "Rolex",
"placeholderModel": "Submariner",
"placeholderReference": "16610",
"placeholderSelect": "select",
"placeholderPartName": "Mainspring",
"placeholderCaliber": "ETA 2824-2",
"placeholderManufacturer": "ETA",
"placeholderSupplier": "e.g. Cousins UK",
"placeholderNotes": "Anything worth remembering…",
"placeholderToolName": "Bergeon 30080 case opener",
"placeholderEquipmentSupplier": "e.g. Esslinger & Co.",
"placeholderFeaturedImageAlt": "Featured preview",

// Status filter (watches/index.tsx)
"filterAll": "All",

// Wishlist
"wishlistTitle": "Wishlist",
"wishlistAddItem": "Add to Wishlist",
"wishlistPriorityLow": "Low",
"wishlistPriorityMedium": "Medium",
"wishlistPriorityHigh": "High",
"wishlistStatusWanted": "Wanted",
"wishlistStatusWatching": "Watching",
"wishlistStatusAcquired": "Acquired",
"wishlistUpdateStatus": "Update Status",
"wishlistCurrent": "current",
"wishlistAllWatches": "All Watches",
"wishlistNoItems": "No {{status}} watches.",
"wishlistDeleteConfirm": "Delete this wishlist item?",

// Watch detail page (watches/$watchId/index.tsx)
"watchKpiInvested": "Invested",
"watchKpiSalePrice": "Sale Price",
"watchKpiProfit": "Profit",
"watchKpiRoi": "ROI",
"watchDetailsSection": "Details",
"watchDetailsEdit": "Edit",
"watchDetailsCondition": "Condition",
"watchDetailsPurchase": "Purchase",
"watchDetailsPartsCost": "Parts Cost",
"watchDetailsHours": "Hours",
"watchDetailsAcquired": "Acquired",
"watchDetailsSold": "Sold",
"watchTabRepairLog": "Repair Log",
"watchTabTimegrapher": "Timegrapher",
"watchTabParts": "Parts",
"watchTabNotes": "Notes",
"watchPartsUsed": "Parts Used",
"watchShoppingList": "Shopping List",
"watchColPart": "Part",
"watchColQty": "Qty",
"watchColUnit": "Unit",
"watchColTotal": "Total",
"watchNoRepairSessions": "No repair sessions yet.",
"watchLogFirstSession": "Log the first one →",
"watchNoPartsLogged": "No parts logged yet.",
"watchNoTimegrapherSessions": "No timegrapher sessions yet.",
"watchNoPartsOnList": "No parts on the list yet.",
"watchNoNotes": "No notes yet.",
"watchNewSession": "+ New session",
"watchViewAll": "View all ({{count}}) →",
"watchFullLog": "Full log ({{count}}) →",
"watchFullList": "Full list →",
"watchEditNotes": "Edit notes",
"watchAddNotes": "Add notes",
"watchSave": "Save",
"watchPartsShoppingListProFeature": "Parts shopping list is a Pro feature",
"watchAddFirstShoppingItem": "Add the first one →",
"watchDeletePhotoConfirm": "Are you sure you want to delete this photo?",
"watchRemovePartConfirm": "Remove this part from the log?",
"watchDeleteConfirm": "Are you sure you want to delete this watch? All associated photos, and part usage will also be deleted.",
"watchDeleteAction": "Delete this watch",
"watchUploadFailed": "Upload failed. Please try again.",
"watchSaveFailed": "Save failed. Please try again.",
"watchShoppingNeeded": "Needed",
"watchShoppingOrdered": "Ordered",
"watchShoppingInHand": "In Hand",

// Watch table columns (watches/index.tsx — missing ones)
"colYear": "Year",
"colCondition": "Condition",
"colSoldFor": "Sold For",

// Timegrapher page (watches/$watchId/timegrapher.tsx)
"timegrapherSessionType": "Session Type",
"timegrapherNewSession": "New Session",
"timegrapherDeleteConfirm": "Delete this session?",
"timegrapherStatusPostService": "Post-Service",
"timegrapherStatusPreService": "Pre-Service",
"timegrapherStatusIncoming": "Incoming",
"timegrapherStatusRoutine": "Routine",
"timegrapherPositionDU": "Dial Up",
"timegrapherPositionDD": "Dial Down",
"timegrapherPositionCU": "Crown Up",
"timegrapherPositionCD": "Crown Down",
"timegrapherPositionCL": "Crown Left",
"timegrapherPositionCR": "Crown Right",
"timegrapherColDate": "Date",
"timegrapherColType": "Type",
"timegrapherColMean": "Mean",
"timegrapherColNotes": "Notes",
"timegrapherColAvgRate": "Avg Rate",
"timegrapherColAvgAmplitude": "Avg Amplitude",
"timegrapherColBeatError": "Beat Error",
"timegrapherAnalysisBullet1": "Rate deviation diagnosis across all 6 positions",
"timegrapherAnalysisBullet2": "Amplitude & beat error interpretation",
"timegrapherAnalysisBullet3": "Service recommendations based on the data",

// Time tracker (watches/$watchId/time.tsx)
"timeDeleteConfirm": "Delete this session? This cannot be undone.",

// AppSidebar — admin impersonation
"sidebarImpersonate": "Impersonate",
"sidebarImpersonateUser": "Impersonate User",
"sidebarImpersonateDesc": "Enter a user ID to auth as that user.",
"sidebarUserId": "User ID",
"sidebarImpersonating": "Impersonating…",

// Auth (login.tsx / signup.tsx)
"loginGoogleFailed": "Google sign-in failed. Please try again.",
"loginSubmitError": "There was an error during the submission",
"signupFailed": "Sign-in failed. Please try again.",

// UpgradeButton
"upgradeCheckoutError": "Could not start checkout. Please try again."
```

---

## Step 2 — Fix `src/routes/watches/index.tsx`

**Problem 1 — `FILTERS` constant (line 34–40)**

The labels are hardcoded strings. The status labels `'In Progress'`, `'Paused'`, etc. already have keys (`statusInProgress`, `statusPaused`, etc.). `'All'` needs the new `filterAll` key.

Replace the static array with a computed one inside the component (after `const { t } = useTranslation()`):

```tsx
// Remove the module-level FILTERS constant entirely.
// Inside WatchesPage(), after `const { t } = useTranslation()`:
const FILTERS: [FilterValue, string][] = [
  ['all', t('filterAll')],
  ['in_progress', t('statusInProgress')],
  ['paused', t('statusPaused')],
  ['listed', t('statusListed')],
  ['sold', t('statusSold')],
];
```

**Problem 2 — Table column headers (lines 185–192)**

```tsx
// Before:
<Th>Photos</Th>
<Th>Watch</Th>
<Th>Year</Th>
<Th>Status</Th>
<Th>Condition</Th>
<Th>Paid</Th>
<Th>Parts</Th>
<Th>Sold For</Th>

// After:
<Th>{t('colPhoto_other')}</Th>
<Th>{t('colWatch')}</Th>
<Th>{t('colYear')}</Th>
<Th>{t('colStatus')}</Th>
<Th>{t('colCondition')}</Th>
<Th>{t('colPaid')}</Th>
<Th>{t('colParts')}</Th>
<Th>{t('colSoldFor')}</Th>
```

**Problem 3 — Hours suffix (line ~295)**

The `{w.hours_spent}h` string triggers a false-positive ESLint warning. Suppress it inline:

```tsx
{/* eslint-disable-next-line i18next/no-literal-string */}
{w.hours_spent}h
```

---

## Step 3 — Fix Zod schema validation messages

**Pattern**: Zod schemas are defined outside React, so `t()` can't be called there. Convert each schema to a factory function that receives `t`, then call it with `useMemo` inside the component.

**Affected files:**
- `src/routes/watches/new.tsx`
- `src/routes/watches/$watchId/edit.tsx`
- `src/routes/inventory/new.tsx`
- `src/routes/inventory/$inventoryId/edit.tsx`
- `src/routes/equipment/new.tsx`
- `src/routes/equipment/$equipmentId/edit.tsx`

**Example — `watches/new.tsx`:**

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

function makeFormSchema(t: TFunction) {
  return z.object({
    make: z.string().trim().min(1, t('validationMakeRequired')),
    model: z.string().trim().min(1, t('validationModelRequired')),
    reference: z.string().trim().optional(),
    year: numberField({ min: 1, message: t('validationYearRequired') }).pipe(z.number().int()),
    status: z.enum(WATCH_STATUSES),
    condition_bought: z.enum(WATCH_CONDITIONS),
    bought_price: numberField({ min: 0, message: t('validationBoughtPriceMin') }),
    parts_cost: numberField({ min: 0, message: t('validationPartsCostMin') }),
    hours_spent: numberField({ min: 0, message: t('validationHoursMin') }),
    bought_date: z.string().trim().min(1, t('validationBoughtDateRequired')),
    sold_price: z.number().min(0).nullable(),
    sold_date: z.string().trim().nullable(),
  });
}

// Inside the component:
const { t } = useTranslation();
const formSchema = useMemo(() => makeFormSchema(t), [t]);
const { register, handleSubmit, ... } = useForm({ resolver: zodResolver(formSchema) });
```

Apply the same factory pattern in the other 5 files, using the appropriate validation keys from Step 1.

---

## Step 4 — Fix placeholders

All `placeholder='...'` attributes need to go through `t()`. Import `useTranslation` if not already present.

**`watches/new.tsx` and `watches/$watchId/edit.tsx`:**
```tsx
placeholder={t('placeholderMake')}       // was: 'Rolex'
placeholder={t('placeholderModel')}      // was: 'Submariner'
placeholder={t('placeholderReference')}  // was: '16610'
// SelectValue placeholders:
<SelectValue placeholder={t('placeholderSelect')} />   // was: 'select'
```

**`inventory/new.tsx` and `inventory/$inventoryId/edit.tsx`:**
```tsx
placeholder={t('placeholderPartName')}      // was: 'Mainspring'
placeholder={t('placeholderCaliber')}       // was: 'ETA 2824-2'
placeholder={t('placeholderManufacturer')}  // was: 'ETA'
placeholder={t('placeholderSupplier')}      // was: 'e.g. Cousins UK'
placeholder={t('placeholderNotes')}         // was: 'Anything worth remembering…'
```

**`equipment/new.tsx` and `equipment/$equipmentId/edit.tsx`:**
```tsx
placeholder={t('placeholderToolName')}           // was: 'Bergeon 30080 case opener'
placeholder={t('placeholderEquipmentSupplier')}  // was: 'e.g. Esslinger & Co.'
placeholder={t('placeholderNotes')}              // was: 'Anything worth remembering…'
```

---

## Step 5 — Fix `src/routes/watches/$watchId/index.tsx` (largest file)

This 1195-line file has no `useTranslation` at all. Add the import and hook call at the top of the component.

```tsx
import { useTranslation } from 'react-i18next';
// inside RouteComponent:
const { t } = useTranslation();
```

Then replace all hardcoded strings. The inline label arrays are the main pattern — convert them to use `t()`:

**Financial KPI grid (lines ~499–524):**
```tsx
[t('watchKpiInvested'), fmt(watch.bought_price + (watch.parts_cost ?? 0)), null],
['Sale Price', fmt(watch.sold_price), null],   // → [t('watchKpiSalePrice'), ...]
[t('watchKpiProfit'), p !== null ? fmt(p) : '—', ...],
[t('watchKpiRoi'), r !== null ? fmtPct(r) : '—', ...],
```

**Details section header (line ~549):** `'Details'` → `{t('watchDetailsSection')}`

**Edit link (line ~557):** `'Edit'` → `{t('watchDetailsEdit')}`

**Details rows (lines ~564–602):** Each label key string in the inline `[label, value]` arrays:
```tsx
[t('watchDetailsCondition'), capitalize(watch.condition_bought?.replace('_', ' ')) ?? '—'],
[t('watchDetailsPurchase'), fmt(watch.bought_price)],
[t('watchDetailsPartsCost'), fmt(watch.parts_cost)],
[t('watchDetailsHours'), totalSessionHours],
[t('watchDetailsAcquired'), watch.bought_date ? format(...) : '—'],
[t('watchDetailsSold'), watch.sold_date ? format(...) : '—'],
```

**Tab labels (lines ~162–166):**
```tsx
const tabs = [
  { id: 'log', label: t('watchTabRepairLog'), badge: postCount },
  { id: 'timegrapher', label: t('watchTabTimegrapher') },
  { id: 'parts', label: t('watchTabParts') },
  { id: 'notes', label: t('watchTabNotes') },
];
```

**Repair Log tab empty state (line ~702):**
```tsx
{t('watchNoRepairSessions')}{' '}
<Link ...>{t('watchLogFirstSession')}</Link>
```

**"+ New session" link (line ~745):** `'+ New session'` → `{t('watchNewSession')}`

**"View all (n) →" link (line ~754):** `View all ({postCount}) →` → `{t('watchViewAll', { count: postCount })}`

**Timegrapher tab empty state (line ~768):** Same pattern as repair log.

**"Full log (n) →" link (line ~836):** `{t('watchFullLog', { count: timegrapherReadings.length })}`

**Timegrapher row labels (lines ~785–812):**
```tsx
[t('watchKpiInvested'), ...],   // 'DU Rate' → these are timegrapher-specific
// Actually use: 'timegrapherPositionDU' etc. — see Step 6 labels
```
> Note: the labels here are `'DU Rate'`, `'DU Amplitude'`, `'DU Beat Error'`, `'Avg Rate'`, `'Avg Amplitude'`. These are different from the position abbreviations. Use `'watchDetailsDuRate'` etc., or reuse `timegrapherColAvgRate` / `timegrapherColAvgAmplitude` for the free tier rows.

**Parts Used section header (line ~853):** `'Parts Used'` → `{t('watchPartsUsed')}`

**Parts table headers (lines ~868–878):** Part/Qty/Unit/Total → use `t('watchColPart')` etc.

**"No parts logged yet." (line ~861):** `{t('watchNoPartsLogged')}`

**"Total" tfoot label (line ~932):** `{t('total')}` (key already exists)

**Shopping List header (line ~950):** `'Shopping List'` → `{t('watchShoppingList')}`

**"Parts shopping list is a Pro feature" (line ~996):** `{t('watchPartsShoppingListProFeature')}`

**Shopping list status rows (lines ~976–991, ~1016–1034):**
```tsx
[t('watchShoppingNeeded'), ...],
[t('watchShoppingOrdered'), ...],
[t('watchShoppingInHand'), ...],
```

**"No parts on the list yet." (line ~1003):** `{t('watchNoPartsOnList')}`

**"Add the first one →" (line ~1010):** `{t('watchAddFirstShoppingItem')}`

**"Full list →" (line ~1054):** `{t('watchFullList')}`

**Notes tab (lines ~1089–1121):** Save/Cancel/Edit notes/Add notes/No notes yet:
```tsx
{t('watchSave')} / {t('cancel')} // 'cancel' key already exists
{t('watchNoNotes')}
{watch.notes ? t('watchEditNotes') : t('watchAddNotes')}
```

**confirm() dialogs:**
```tsx
confirm(t('watchDeletePhotoConfirm'))     // line ~391
confirm(t('watchRemovePartConfirm'))      // line ~910
confirm(t('watchDeleteConfirm'))          // line ~1138
```

**"Delete this watch" button (line ~1149):** `{t('watchDeleteAction')}`

**Upload/save error strings (lines ~318, ~473):**
```tsx
(error as Error).message ?? t('watchUploadFailed')
(error as Error).message ?? t('watchSaveFailed')
```

---

## Step 6 — Fix `src/routes/watches/$watchId/timegrapher.tsx`

Add `useTranslation` import and hook.

**`STATUS_LABELS` constant (lines 47–52)** — convert to a function:
```tsx
function getStatusLabels(t: TFunction): Record<TimegrapherStatus, string> {
  return {
    post_service: t('timegrapherStatusPostService'),
    pre_service: t('timegrapherStatusPreService'),
    incoming: t('timegrapherStatusIncoming'),
    routine: t('timegrapherStatusRoutine'),
  };
}
// Inside component:
const STATUS_LABELS = getStatusLabels(t);
```

**`POSITIONS` constant (lines 54–61)** — same pattern:
```tsx
function getPositions(t: TFunction) {
  return [
    { key: 'du', label: t('timegrapherPositionDU') },
    { key: 'dd', label: t('timegrapherPositionDD') },
    { key: 'cu', label: t('timegrapherPositionCU') },
    { key: 'cd', label: t('timegrapherPositionCD') },
    { key: 'cl', label: t('timegrapherPositionCL') },
    { key: 'cr', label: t('timegrapherPositionCR') },
  ] as const;
}
```

**Form labels:**
- `'Session Type'` → `{t('timegrapherSessionType')}` (appears twice)
- `'Notes'` → `{t('fieldNotes')}` (key already exists)

**Select items:**
- `'Routine'` → `{t('timegrapherStatusRoutine')}`
- `'Incoming'` → `{t('timegrapherStatusIncoming')}`

**Section label:** `'New Session'` → `{t('timegrapherNewSession')}`

**Column headers (lines ~1052–1062, ~1166–1171):**
```tsx
<Th>{t('timegrapherColDate')}</Th>
<Th>{t('timegrapherColType')}</Th>
// DU/DD/CU/CD/CL/CR abbreviations — these are technical, not copy.
// Suppress with eslint-disable-next-line for each <Th>DU</Th> etc.
<Th>{t('timegrapherColMean')}</Th>
<Th>{t('timegrapherColNotes')}</Th>
<Th>{t('timegrapherColAvgRate')}</Th>
<Th>{t('timegrapherColAvgAmplitude')}</Th>
<Th>{t('timegrapherColBeatError')}</Th>
```

**confirm() dialogs (lines ~1145, ~1227):** `confirm(t('timegrapherDeleteConfirm'))`

**AI analysis bullets (lines ~1262–1264):**
```tsx
t('timegrapherAnalysisBullet1')
t('timegrapherAnalysisBullet2')
t('timegrapherAnalysisBullet3')
```

---

## Step 7 — Fix `src/routes/watches/$watchId/time.tsx`

Add `useTranslation`. The main string is:

```tsx
// line ~156:
if (window.confirm(t('timeDeleteConfirm'))) {
```

Scan the rest of the file for additional hardcoded labels (placeholders, section headers, button text) and use the same pattern.

---

## Step 8 — Fix `src/routes/wishlist.tsx`

Add `useTranslation` import and hook.

**`PRIORITY_LABELS` (lines 47–51)** — convert to function:
```tsx
function getPriorityLabels(t: TFunction): Record<WishlistPriority, string> {
  return {
    low: t('wishlistPriorityLow'),
    medium: t('wishlistPriorityMedium'),
    high: t('wishlistPriorityHigh'),
  };
}
```

**`STATUS_LABELS` (lines 53–57):**
```tsx
function getStatusLabels(t: TFunction): Record<WishlistStatus, string> {
  return {
    wanted: t('wishlistStatusWanted'),
    watching: t('wishlistStatusWatching'),
    acquired: t('wishlistStatusAcquired'),
  };
}
```

Both functions are called inside the component, with the results stored in local vars:
```tsx
const PRIORITY_LABELS = getPriorityLabels(t);
const STATUS_LABELS = getStatusLabels(t);
```

**Dialog title (line ~79):** `'Update Status'` → `{t('wishlistUpdateStatus')}`

**"current" badge (line ~108):** `'current'` → `{t('wishlistCurrent')}`

**Filter label (line ~460):**
```tsx
{filter === 'all' ? t('wishlistAllWatches') : STATUS_LABELS[filter as WishlistStatus]}
```

**Empty state (line ~481):**
```tsx
{t('wishlistNoItems', { status: STATUS_LABELS[filter as WishlistStatus].toLowerCase() })}
```

Also fix the remaining hardcoded placeholders (see Step 4 for `wishlist.tsx` placeholders).

---

## Step 9 — Fix `src/components/layout/AppSidebar.tsx`

The impersonation admin feature has 6 unlocalized strings. `useTranslation` is already imported.

```tsx
// Button label (line ~150):
{t('sidebarImpersonate')}

// Dialog title (line ~156):
<DialogTitle>{t('sidebarImpersonateUser')}</DialogTitle>

// Dialog description (line ~158):
<DialogDescription>{t('sidebarImpersonateDesc')}</DialogDescription>

// Field label (line ~162):
<FieldLabel>{t('sidebarUserId')}</FieldLabel>

// Input placeholder (line ~165):
placeholder={t('sidebarUserId')}

// Loading button text (line ~190):
{impersonating ? t('sidebarImpersonating') : t('sidebarImpersonate')}
```

---

## Step 10 — Fix toast messages in auth and UpgradeButton

**`src/routes/login.tsx`** — add `useTranslation` hook (already imported):
```tsx
toast.error(t('loginGoogleFailed'))   // line ~72
toast.error(t('loginSubmitError'))    // line ~204
```

**`src/routes/signup.tsx`** — add `useTranslation` hook:
```tsx
toast.error(t('signupFailed'))        // line ~48
```

**`src/components/primitives/UpgradeButton.tsx`** — add `useTranslation` hook:
```tsx
toast.error(t('upgradeCheckoutError'))   // line ~90
```

---

## Step 11 — Fix category label rendering in inventory forms

In `inventory/new.tsx` and `inventory/$inventoryId/edit.tsx`, categories are rendered with:
```tsx
c.replace('_', ' ').toUpperCase()
```

The cleanest fix without adding a key per category value is to add a helper that maps snake_case to title case and add explicit i18n keys for each `PartCategory` enum value. Add to `en.json`:
```jsonc
"categorySprings": "Springs",
"categoryJewels": "Jewels",
"categoryWheels": "Wheels",
"categoryPinions": "Pinions",
"categoryCrystals": "Crystals",
"categoryMainspring": "Mainspring",
"categoryGaskets": "Gaskets",
"categoryCrowns": "Crowns",
"categoryCaseParts": "Case Parts",
"categoryMisc": "Misc"
```

Then replace the dynamic transform:
```tsx
// In the SelectItem render:
{t(`category${c.charAt(0).toUpperCase() + c.slice(1).replace('_', '')}`)}
// Or use a lookup map inside the component:
const CATEGORY_LABELS: Record<PartCategory, string> = {
  springs: t('categorySprings'),
  // ...
};
```

Check `src/types/index.ts` for the exhaustive `PartCategory` union to ensure full coverage.

---

## Verification

After all changes:

```bash
npm run lint
```

The `i18next/no-literal-string` warning count should be near zero (only intentional suppressions with `// eslint-disable-next-line` remain). Remaining warnings will be genuine copy strings that still need keys added.

Also run:
```bash
npm run build
```

to confirm TypeScript is satisfied — particularly that the `makeFormSchema(t)` factories infer correctly and that all `t('key')` calls are valid `ParseKeys` (the project has `src/types/i18next.d.ts` which enforces this at compile time).
