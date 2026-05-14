import { SubscriptionStatus, Watch } from '#/types';
import z from 'zod';

export function placeholderImg(seed: string) {
  return `https://picsum.photos/seed/${seed}/800/600`;
}

export function profit(w: Watch): number | null {
  if (w.status !== 'sold' || !w.sold_price) return null;
  return w.sold_price - w.bought_price - w.parts_cost;
}

export function roi(w: Watch): string | null {
  const p = profit(w);
  if (p === null) return null;
  return ((p / (w.bought_price + w.parts_cost)) * 100).toFixed(1);
}

export function fmt(n: number | null | undefined, d = 0): string {
  if (n === null || n === undefined) return '—';
  if (n === 0) return '$0';
  return (
    '$' +
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })
  );
}

export function fmtPct(n: string | number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return (num > 0 ? '+' : '') + n + '%';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const numberField = (opts?: { min?: number; message?: string }) =>
  z
    .number({ error: opts?.message ?? 'Must be a number' })
    .min(opts?.min ?? 0, opts?.message);

export type PaidSubscriptionArgs = {
  subscriptionStatus: SubscriptionStatus | string | undefined;
  renewsAt: string | undefined;
  endsAt?: string;
};

/** Lemon Squeezy–backed subscription only (excludes the app-level Pro trial). */
export const hasPaidSubscription = ({
  subscriptionStatus,
  renewsAt,
  endsAt,
}: PaidSubscriptionArgs): boolean => {
  const now = new Date();

  if (
    subscriptionStatus === SubscriptionStatus.ACTIVE ||
    subscriptionStatus === SubscriptionStatus.ON_TRIAL ||
    subscriptionStatus === SubscriptionStatus.PAID ||
    subscriptionStatus === SubscriptionStatus.CANCELLED
  ) {
    return !endsAt || new Date(endsAt) > now;
  }

  if (subscriptionStatus === SubscriptionStatus.PAST_DUE) {
    if (!renewsAt) return false;
    const gracePeriodEnd = new Date(renewsAt);
    gracePeriodEnd.setHours(gracePeriodEnd.getHours() + 48);
    return now < gracePeriodEnd;
  }

  return false;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** True when `trial_ends_at` is strictly in the future. */
export const isActiveAppTrial = (trialEndsAt: string | undefined): boolean => {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
};

/** Whole days remaining until trial end (ceil), or `null` if none / expired. */
export const trialDaysRemainingCeil = (
  trialEndsAt: string | undefined,
): number | null => {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  if (end <= now) return null;
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY));
};

export const hasPro = ({
  subscriptionStatus,
  renewsAt,
  endsAt,
  trialEndsAt,
}: PaidSubscriptionArgs & { trialEndsAt?: string }): boolean => {
  return (
    hasPaidSubscription({ subscriptionStatus, renewsAt, endsAt }) ||
    isActiveAppTrial(trialEndsAt)
  );
};

/** Pro access from the 14-day app trial only (not an active paid LS subscription). */
export const isAppTrialPro = (args: PaidSubscriptionArgs & { trialEndsAt?: string }) =>
  isActiveAppTrial(args.trialEndsAt) &&
  !hasPaidSubscription({
    subscriptionStatus: args.subscriptionStatus,
    renewsAt: args.renewsAt,
    endsAt: args.endsAt,
  });

export const canModifySubscription = (
  subscriptionStatus: SubscriptionStatus,
) => {
  return (
    subscriptionStatus === SubscriptionStatus.ACTIVE ||
    subscriptionStatus === SubscriptionStatus.ON_TRIAL ||
    subscriptionStatus === SubscriptionStatus.PAUSED ||
    subscriptionStatus === SubscriptionStatus.PAST_DUE ||
    subscriptionStatus === SubscriptionStatus.CANCELLED
  );
};
