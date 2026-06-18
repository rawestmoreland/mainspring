import { hasPro } from '#/lib/helpers';
import { SubscriptionStatus } from '#/types';
import { useAuth } from './auth';

export const useSubscription = (): {
  isPro: boolean;
  subscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  renewsAt?: string;
  endsAt?: string;
  lsCustomerId?: string;
} => {
  const { subscription } = useAuth();

  const subscriptionStatus =
    subscription?.subscription_status ?? ('free' as SubscriptionStatus);
  const renewsAt = subscription?.renews_at;
  const endsAt = subscription?.ends_at;

  const subArgs = { subscriptionStatus, renewsAt, endsAt };

  const isPro = hasPro(subArgs);
  const subscriptionId = subscription?.subscription_id;
  const lsCustomerId = subscription?.lemon_squeezy_customer_id;

  return {
    isPro,
    subscriptionId,
    subscriptionStatus,
    renewsAt: renewsAt ?? '',
    endsAt: endsAt ?? '',
    lsCustomerId,
  };
};
