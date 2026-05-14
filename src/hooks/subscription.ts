import {
  hasPro,
  isAppTrialPro,
  trialDaysRemainingCeil,
} from '#/lib/helpers';
import { SubscriptionStatus } from '#/types';
import { useAuth } from './auth';

export const useSubscription = (): {
  isPro: boolean;
  isAppTrial: boolean;
  trialEndsAt: string;
  trialDaysRemaining: number | null;
  subscriptionId: string;
  subscriptionStatus: SubscriptionStatus;
  renewsAt: string;
  endsAt: string;
  lsCustomerId: string;
} => {
  const { user } = useAuth();

  const trialEndsAt = (user?.trial_ends_at as string | undefined) ?? '';
  const subscriptionStatus = user?.subscription_status as SubscriptionStatus;
  const renewsAt = user?.renews_at;
  const endsAt = user?.ends_at;

  const subArgs = {
    subscriptionStatus,
    renewsAt,
    endsAt,
    trialEndsAt: trialEndsAt || undefined,
  };

  const isPro = hasPro(subArgs);
  const isAppTrial = isAppTrialPro(subArgs);
  const trialDaysRemaining = trialDaysRemainingCeil(
    trialEndsAt || undefined,
  );
  const subscriptionId = user?.subscription_id;
  const lsCustomerId = user?.lemon_squeezy_customer_id;

  return {
    isPro,
    isAppTrial,
    trialEndsAt,
    trialDaysRemaining,
    subscriptionId,
    subscriptionStatus,
    renewsAt: renewsAt ?? '',
    endsAt: endsAt ?? '',
    lsCustomerId,
  };
};
