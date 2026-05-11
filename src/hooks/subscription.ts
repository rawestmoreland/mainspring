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

  const isPro = hasPro({
    subscriptionStatus: user?.subscription_status,
    renewsAt: user?.renews_at,
    endsAt: user?.ends_at,
  });
  const subscriptionId = user?.subscription_id;
  const subscriptionStatus = user?.subscription_status;
  const lsCustomerId = user?.lemon_squeezy_customer_id;
  const renewsAt = user?.renews_at;
  const endsAt = user?.ends_at;

  return {
    isPro,
    subscriptionId,
    subscriptionStatus,
    renewsAt,
    endsAt,
    lsCustomerId,
  };
};
