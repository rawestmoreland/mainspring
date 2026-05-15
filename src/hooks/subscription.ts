import { hasPro } from '#/lib/helpers';
import { SubscriptionStatus } from '#/types';
import { useAuth } from './auth';

export const useSubscription = (): {
  isPro: boolean;
  subscriptionId: string;
  subscriptionStatus: SubscriptionStatus;
  renewsAt: string;
  endsAt: string;
  lsCustomerId: string;
} => {
  const { user } = useAuth();

  const subscriptionStatus = user?.subscription_status as SubscriptionStatus;
  const renewsAt = user?.renews_at;
  const endsAt = user?.ends_at;

  const subArgs = { subscriptionStatus, renewsAt, endsAt };

  const isPro = hasPro(subArgs);
  const subscriptionId = user?.subscription_id;
  const lsCustomerId = user?.lemon_squeezy_customer_id;

  return {
    isPro,
    subscriptionId,
    subscriptionStatus,
    renewsAt: renewsAt ?? '',
    endsAt: endsAt ?? '',
    lsCustomerId,
  };
};
