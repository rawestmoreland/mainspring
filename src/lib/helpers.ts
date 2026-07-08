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

export function formatHrs(s: number | undefined): number {
  if (!s) return 0;

  const hours = Math.floor(s / 3600);

  return hours;
}

export function fmt({
  n,
  d = 0,
  symbol = '$',
}: {
  n: number | null | undefined;
  d?: number;
  symbol?: string;
}): string {
  if (n === null || n === undefined) return '—';
  if (n === 0) return `${symbol}0`;
  return (
    symbol +
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

export const hasPro = ({
  subscriptionStatus,
  renewsAt,
  endsAt,
}: PaidSubscriptionArgs): boolean => {
  return hasPaidSubscription({ subscriptionStatus, renewsAt, endsAt });
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
