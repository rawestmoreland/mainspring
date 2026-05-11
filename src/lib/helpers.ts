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

export const hasPro = ({
  subscriptionStatus,
  renewsAt,
  endsAt,
}: {
  subscriptionStatus: SubscriptionStatus;
  renewsAt: string;
  endsAt?: string;
}): boolean => {
  const now = new Date();

  // 1. Basic active statuses
  if (
    subscriptionStatus === SubscriptionStatus.ACTIVE ||
    subscriptionStatus === SubscriptionStatus.ON_TRIAL ||
    subscriptionStatus === SubscriptionStatus.PAID ||
    subscriptionStatus === SubscriptionStatus.CANCELLED
  ) {
    // Ensure the expiration date hasn't passed (important for CANCELLED)
    return !endsAt || new Date(endsAt) > now;
  }

  // 2. 48-Hour Grace Period for PAST_DUE
  if (subscriptionStatus === SubscriptionStatus.PAST_DUE) {
    const gracePeriodEnd = new Date(renewsAt);
    gracePeriodEnd.setHours(gracePeriodEnd.getHours() + 48);

    return now < gracePeriodEnd;
  }

  // 3. Block everything else (EXPIRED, UNPAID, PAUSED)
  return false;
};

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
