import { describe, expect, it } from 'vitest';
import { hasPaidSubscription, hasPro } from '#/lib/helpers';
import { SubscriptionStatus } from '#/types';

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

describe('hasPro', () => {
  it('grants pro for active subscription with future ends_at', () => {
    expect(
      hasPro({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        renewsAt: '',
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(true);
  });

  it('denies pro when subscription is expired', () => {
    expect(
      hasPro({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        renewsAt: '',
        endsAt: undefined,
      }),
    ).toBe(false);
  });
});
