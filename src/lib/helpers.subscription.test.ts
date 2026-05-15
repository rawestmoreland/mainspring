import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  hasPaidSubscription,
  hasPro,
  isActiveAppTrial,
  isAppTrialPro,
  trialDaysRemainingFloor,
} from '#/lib/helpers';
import { SubscriptionStatus } from '#/types';

afterEach(() => {
  vi.useRealTimers();
});

describe('hasPaidSubscription', () => {
  it('returns true for active with future ends_at', () => {
    expect(
      hasPaidSubscription({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        renewsAt: '',
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(true);
  });

  it('returns false for active with past ends_at', () => {
    expect(
      hasPaidSubscription({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        renewsAt: '',
        endsAt: new Date(Date.now() - 86400000).toISOString(),
      }),
    ).toBe(false);
  });

  it('returns true for cancelled with empty ends_at', () => {
    expect(
      hasPaidSubscription({
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        renewsAt: '',
        endsAt: undefined,
      }),
    ).toBe(true);
  });

  it('returns true for past_due within 48h grace', () => {
    const renewsAt = new Date().toISOString();
    expect(
      hasPaidSubscription({
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        renewsAt,
        endsAt: undefined,
      }),
    ).toBe(true);
  });

  it('returns false for past_due without renewsAt', () => {
    expect(
      hasPaidSubscription({
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        renewsAt: '',
        endsAt: undefined,
      }),
    ).toBe(false);
  });

  it('returns false for expired', () => {
    expect(
      hasPaidSubscription({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        renewsAt: '',
        endsAt: undefined,
      }),
    ).toBe(false);
  });
});

describe('isActiveAppTrial', () => {
  it('returns false when unset', () => {
    expect(isActiveAppTrial(undefined)).toBe(false);
  });

  it('returns true when trial end is in the future', () => {
    expect(
      isActiveAppTrial(new Date(Date.now() + 86400000).toISOString()),
    ).toBe(true);
  });
});

describe('hasPro', () => {
  it('grants pro during app trial without paid subscription', () => {
    expect(
      hasPro({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        renewsAt: '',
        endsAt: undefined,
        trialEndsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(true);
  });

  it('denies when trial ended and not paid', () => {
    expect(
      hasPro({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        renewsAt: '',
        endsAt: undefined,
        trialEndsAt: new Date(Date.now() - 1000).toISOString(),
      }),
    ).toBe(false);
  });
});

describe('isAppTrialPro', () => {
  it('is true only when trial active and not paid', () => {
    expect(
      isAppTrialPro({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        renewsAt: '',
        trialEndsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(true);

    expect(
      isAppTrialPro({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        renewsAt: '',
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        trialEndsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(false);
  });
});

describe('trialDaysRemainingFloor', () => {
  it('returns null when expired', () => {
    expect(
      trialDaysRemainingFloor(new Date(Date.now() - 1000).toISOString()),
    ).toBe(null);
  });

  it('returns at least 1 for any future end', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    expect(
      trialDaysRemainingFloor('2026-01-01T18:00:00.000Z'),
    ).toBeGreaterThanOrEqual(1);
  });
});
