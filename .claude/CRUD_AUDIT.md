# CRUD Audit — Remaining Fixes

Findings from a full CRUD audit of the Hairspring codebase. Issue #1 (XSS via `dangerouslySetInnerHTML`) was fixed with DOMPurify in all four affected files — see commit history.

---

## Checklist

- [x] **#1 — XSS via unsanitized HTML rendering** *(done — DOMPurify added to all four render sites)*
- [ ] **#2 — Batch photo upload FormData bug** *(HIGH)*
- [ ] **#3 — Silent failure on notes save** *(MEDIUM)*
- [ ] **#4 — Object URL memory leak in UploadZone** *(MEDIUM)*
- [ ] **#5 — Featured image upload after failed watch create** *(MEDIUM)*
- [ ] **#6 — Parts qty not capped to available inventory** *(MEDIUM)*
- [ ] **#7 — Stale data overwrite on concurrent watch edit** *(MEDIUM)*
- [ ] **#8 — `activeIdx` not reset on stage filter change** *(LOW)*
- [ ] **#9 — Photo limit bypassable via WatchModal** *(LOW)*
- [ ] **#10 — No warning when marking watch as sold** *(LOW)*

---

## #2 — Batch photo upload FormData bug

**Priority:** HIGH  
**File:** `src/lib/api/watches.ts` — `uploadWatchPhotoBatch`

**Problem:** A `FormData` object is created inside the loop but never used. The raw `File` is passed directly to `batch.collection().create()`, which requires multipart FormData for file fields. This means batch photo uploads fail or silently produce broken records.

```ts
// Current (broken)
const fd = new FormData();   // created but never used
fd.append('watch', watchId);
// ...
batch.collection('watch_photos').create({
  watch: watchId,
  stage: p.stage,
  caption: p.caption,
  image: p.file,   // ❌ raw File, not FormData
});

// Fix: pass FormData to create()
const fd = new FormData();
fd.append('watch', watchId);
fd.append('stage', p.stage);
fd.append('caption', p.caption ?? '');
fd.append('image', p.file);
batch.collection('watch_photos').create(fd);
```

Also verify that after `batch.send()` throws, the caller shows a user-visible error (not just `console.error`). The `uploadPhotos` mutation in `watches/$watchId/index.tsx` should surface this to the user.

---

## #3 — Silent failure on notes save

**Priority:** MEDIUM  
**File:** `src/routes/watches/$watchId/index.tsx` — the `updateWatch` mutation used by the inline notes editor

**Problem:** The `onError` handler for the notes save mutation only calls `console.error`. If the save fails, the editing UI closes and the user has no indication their notes were lost.

**Fix:** Add a visible error state. Either:
- Set local error state that renders a small red message near the notes field
- Or use whatever toast/notification system the app has (check for existing toast usage in the codebase)

Pattern to look for — the notes save flow is triggered by a "Save" button near the notes editor. The mutation's `onError` callback is the right place to add feedback. Ensure the editing state (`setEditingNotes`) is NOT set to `false` on error so the user's draft is preserved.

---

## #4 — Object URL memory leak in UploadZone

**Priority:** MEDIUM  
**File:** `src/components/watches/UploadZone.tsx`

**Problem:** `URL.createObjectURL(f)` is called when adding a file to `pending`, but `URL.revokeObjectURL()` is never called when an individual photo is removed from the pending list (only on full cancel/submit). Long sessions with many add/remove cycles leak browser memory.

**Fix:** In the remove handler (look for `setPending((p) => p.filter((x) => x.id !== f.id))`), call `URL.revokeObjectURL(f.url)` before filtering:

```ts
onClick={() => {
  URL.revokeObjectURL(f.url);  // add this
  setPending((p) => p.filter((x) => x.id !== f.id));
  setClampWarning(null);
}}
```

Confirm that the success and cancel paths already call `revokeObjectURL` on all remaining pending items, and if not, fix those too.

---

## #5 — Featured image upload after failed watch create

**Priority:** MEDIUM  
**File:** `src/routes/watches/new.tsx` — the `onSubmit` handler

**Problem:** The submit handler calls `createWatch.mutateAsync(...)` and then conditionally uploads the featured image. But there's no `try/catch` around the create call. If `createWatch` throws, execution continues and tries to call `uploadFeaturedImage(created.id, ...)` where `created` is `undefined`, producing a second confusing error.

**Fix:** Wrap the create call and guard the image upload:

```ts
let created;
try {
  created = await createWatch.mutateAsync({ ... });
} catch {
  // createWatch mutation's onError already handles feedback
  return;
}
if (featuredImageFile && created) {
  await WatchesApi.uploadFeaturedImage(created.id, featuredImageFile);
}
```

---

## #6 — Parts qty not capped to available inventory

**Priority:** MEDIUM  
**File:** `src/components/watches/AddPartUsedDialog.tsx`

**Problem:** The Zod schema validates `qty_used >= 1` but does not cap it at the inventory item's available stock. A user can log 999 units of a part with 5 in stock. The UI already shows the stock count next to each item, but doesn't enforce it. Inventory counts never decrement on use either, causing the two to diverge.

**Fix (frontend validation):** The schema needs access to the selected item's qty. Since Zod schemas are static, use a `superRefine` or perform the check manually in the submit handler, or use `z.number().max(selectedItem.qty)` via a dynamic schema constructed after item selection.

**Fix (inventory decrement):** When `AddPartUsedDialog` successfully creates a `parts_used` record, it should also call an update on the `inventory_item` to decrement `qty` by `qty_used`. Check if there's an existing `useUpdateInventoryItem` hook and compose the two mutations in sequence.

Note: consider whether this is best enforced server-side via a PocketBase hook/rule instead of (or in addition to) the frontend guard.

---

## #7 — Stale data overwrite on concurrent watch edit

**Priority:** MEDIUM  
**File:** `src/routes/watches/$watchId/edit.tsx`

**Problem:** The edit form builds `defaultValues` with `useMemo` from the fetched watch data, but `useForm` does not reinitialize when `defaultValues` changes after mount. If the watch is modified elsewhere (another tab, another user) while the form is open, submitting will silently overwrite the newer data.

**Fix options (pick one):**
1. Call `form.reset(defaultValues)` inside a `useEffect` that runs when the watch data changes — this keeps the form in sync if the data refreshes.
2. Add an `updatedAt` (or `updated`) field to the watch type, include it as a hidden field in the form, and reject the save server-side if the timestamp doesn't match (optimistic concurrency control).

Option 1 is simpler and appropriate for a single-user app. Option 2 is safer if multi-user editing is ever needed.

---

## #8 — `activeIdx` not reset on stage filter change (watch detail)

**Priority:** LOW  
**File:** `src/routes/watches/$watchId/index.tsx`

**Problem:** The photo gallery in the watch detail view filters photos by stage. When the user switches the stage filter, `activeIdx` is not reset to `0`. If the new filter has fewer photos than the current index, `displayedPhotos[activeIdx]` is `undefined`, resulting in a misleading "No photos for this stage" state even when photos exist.

Compare with `src/components/watches/WatchModal.tsx`, which correctly resets `activeIdx` to `0` in `handleStageFilter`. Apply the same pattern here.

**Fix:** Find the stage filter toggle handler in the watch detail route and add `setActiveIdx(0)` alongside the `setStageFilter(...)` call.

---

## #9 — Photo limit bypassable via WatchModal

**Priority:** LOW  
**File:** `src/components/watches/WatchModal.tsx` (or wherever `UploadZone` is rendered inside the modal)

**Problem:** The watch detail view correctly passes `currentCount` and `limit` props to `UploadZone` to enforce the free-tier photo cap. The `WatchModal` component renders another `UploadZone` but does not pass these props, so the limit is not enforced there — a free-tier user can bypass it.

**Fix:** Pass the same limit props to the `UploadZone` inside `WatchModal`:
- `currentCount={isPro ? undefined : photos.length}` (or however the pro flag is accessed)
- `limit={isPro ? undefined : FREE_PHOTO_LIMIT}` (constant from `src/lib/constants.ts`)

Check what data the modal receives as props and thread the values through accordingly.

---

## #10 — No warning when marking watch as sold

**Priority:** LOW  
**File:** `src/components/watches/StatusPicker.tsx`

**Problem:** Clicking any status in the picker immediately fires `updateWatch.mutate(...)` with no confirmation. Changing status to `sold` is significant (it finalizes the watch and triggers analytics events) but gets the same instant-click behavior as changing from `in_progress` to `paused`.

**Fix:** For the `sold` status only, show a native `confirm()` dialog (consistent with the delete watch pattern already in the codebase) before calling `updateWatch.mutate`:

```ts
onClick={() => {
  if (s === 'sold' && !confirm('Mark this watch as sold? This will record the sale date.')) return;
  updateWatch.mutate({ ...watch, status: s });
  setOpen(false);
}}
```

Adjust the confirmation text to match whatever data is recorded on sale (sale price, date, etc.).
