'use client';

import { useQuery } from '@tanstack/react-query';
import pb from '#/lib/pocketbase';
import { SubscriptionStatus, type UserProfile } from '#/types';
import { RecordModel } from 'pocketbase';
import { useSearch } from '@tanstack/react-router';

export function useAuth() {
  const authRecord = pb.authStore.record;
  const search: { checkout_success: boolean } = useSearch({ strict: false });

  const { data, isLoading } = useQuery<{
    profile: UserProfile | null;
    user: RecordModel | null;
  } | null>({
    queryKey: ['auth', 'profile', authRecord?.id],
    queryFn: async () => {
      if (!authRecord?.id) return null;
      const profile = await pb
        .collection('user_profiles')
        .getFirstListItem<UserProfile>(`user = "${authRecord.id}"`)
        .catch(() => null);
      const { record } = await pb.collection('users').authRefresh();

      return { profile, user: record };
    },
    enabled: !!authRecord?.id,
    staleTime: 60_000,
    refetchInterval: (query) => {
      const updatedUser = query.state.data?.user;
      const isSubscribed =
        updatedUser?.subscription_status === SubscriptionStatus.ACTIVE;
      const isReturningFromCheckout = search.checkout_success === true;

      // Stop polling as soon as the status is active OR if they aren't returning from checkout
      if (isSubscribed || !isReturningFromCheckout) return false;

      return 2000; // Poll every 2 seconds until the webhook hits your DB
    },
  });

  return {
    user: data?.user ?? authRecord ?? null,
    profile: data?.profile ?? null,
    isLoading,
  };
}
