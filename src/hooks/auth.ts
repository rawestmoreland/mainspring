'use client';

import { useQuery } from '@tanstack/react-query';
import pb from '#/lib/pocketbase';
import type { UserProfile } from '#/types';

export function useAuth() {
  const user = pb.authStore.record;

  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['auth', 'profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return pb
        .collection('user_profiles')
        .getFirstListItem<UserProfile>(`user = "${user.id}"`)
        .catch(() => null);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return {
    user: user ?? null,
    profile: profile ?? null,
    isLoading,
  };
}
