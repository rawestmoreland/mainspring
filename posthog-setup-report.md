<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Hairspring. PostHog client-side tracking is now active across the full app via `PostHogProvider` in `__root.tsx`, with custom event captures on all key user actions, user identification on login/signup, and exception tracking on critical error boundaries.

## Summary of changes

| File | Change |
|------|--------|
| `src/routes/__root.tsx` | Added `PostHogProvider` wrapping the app body; configured with env vars, exception capture, and debug mode |
| `src/lib/posthog-server.ts` | Created singleton `getPostHogClient()` for future server-side event capture |
| `src/routes/login.tsx` | Added `posthog.identify()` + `user_signed_in` on email login; `oauth_sign_in` on OAuth; `password_reset_requested` + exception capture on password reset |
| `src/routes/signup.tsx` | Added `posthog.identify()` + `user_signed_up` on email signup; `oauth_sign_in` on OAuth signup |
| `src/routes/watches/new.tsx` | Added `watch_created` capture with make/model/status/price properties; exception capture on error |
| `src/routes/watches/$watchId/edit.tsx` | Added `watch_updated` capture with status change tracking (previous_status → new status); exception capture on error |
| `src/routes/inventory/new.tsx` | Added `inventory_item_created` (category/qty/cost) and `donor_movement_added` (caliber/manufacturer/parts count) captures; exception capture on error |
| `src/routes/equipment/new.tsx` | Added `equipment_added` capture with name/cost; exception capture on error |
| `src/routes/watches/$watchId/posts/new.tsx` | Added `repair_session_created` capture with watch make/model and image count |
| `src/components/primitives/UpgradeButton.tsx` | Added `upgrade_initiated` on checkout start; `checkout_dismissed` on modal close; exception capture on checkout error |
| `.env` | Added `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` |

## Events tracked

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | User completes email registration | `src/routes/signup.tsx` |
| `oauth_sign_in` | User authenticates via Google, Apple, or Discord | `src/routes/login.tsx`, `src/routes/signup.tsx` |
| `user_signed_in` | User completes email login | `src/routes/login.tsx` |
| `password_reset_requested` | User requests a password reset email | `src/routes/login.tsx` |
| `watch_created` | User creates a new watch project | `src/routes/watches/new.tsx` |
| `watch_updated` | User saves watch edits (includes status change tracking) | `src/routes/watches/$watchId/edit.tsx` |
| `inventory_item_created` | User adds a new inventory part/item | `src/routes/inventory/new.tsx` |
| `donor_movement_added` | User adds a donor movement for parts | `src/routes/inventory/new.tsx` |
| `equipment_added` | User adds a tool or piece of equipment | `src/routes/equipment/new.tsx` |
| `repair_session_created` | User creates a repair session log entry | `src/routes/watches/$watchId/posts/new.tsx` |
| `upgrade_initiated` | User clicks Upgrade to begin Pro checkout | `src/components/primitives/UpgradeButton.tsx` |
| `checkout_dismissed` | User closes the checkout modal without completing | `src/components/primitives/UpgradeButton.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/687899) — Overview of all key metrics
- [New signups over time](/insights/FrVDAQrr) — Daily email vs OAuth signups over the last 30 days
- [Feature adoption](/insights/vKJEt7tp) — Usage trends for watches, inventory, equipment, and repair sessions
- [Signup to first watch funnel](/insights/LnUCUBrI) — Conversion from account creation to first watch project (14-day window)
- [Upgrade funnel](/insights/zjht6ACH) — Full conversion path: signup → watch created → upgrade initiated (90-day window)
- [Checkout conversion rate](/insights/fTyUEbgc) — Weekly comparison of upgrade initiations vs checkout dismissals

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-tanstack-start/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
